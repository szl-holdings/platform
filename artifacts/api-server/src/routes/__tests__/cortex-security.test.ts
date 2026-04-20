/**
 * CORTEX Multi-Tenant Security Boundary Tests
 *
 * These tests protect against regressions in the org-scoping guards on the
 * action-draft approve, dismiss, and list endpoints.
 *
 * Security requirements:
 *  - approve/dismiss on another org's draft → 404 (no existence leak)
 *  - approve/dismiss with no org memberships → 404 (deny-by-default)
 *  - list → filtered to the caller's orgId(s) only; empty for no-org users
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Shared mock state — mutated per test via setters below
// ---------------------------------------------------------------------------

let _currentUser: {
  id: number;
  displayName: string;
  email: string;
  roles: string[];
  orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>;
} = makeOrg1User();

function makeOrg1User() {
  return {
    id: 1,
    displayName: "Alice",
    email: "alice@org1.example",
    roles: ["member"],
    orgs: [{ orgId: 1, orgSlug: "org1", orgName: "Org One", role: "member" }],
  };
}

// Results queues: each call pops the next result from the front
let _selectQueue: unknown[][] = [];
let _updateQueue: unknown[][] = [];

// WHERE clause capture for assertions
const _capturedUpdateWheres: unknown[] = [];
const _capturedSelectWheres: unknown[] = [];

// ---------------------------------------------------------------------------
// Module mocks (hoisted to top by vitest)
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/db", () => {
  const col = (name: string) => ({ _colName: name });

  return {
    db: {
      select() {
        const result = (_selectQueue.shift() ?? []) as unknown[];
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: (w: unknown) => {
            _capturedSelectWheres.push(w);
            return chain;
          },
          orderBy: () => chain,
          limit: () => Promise.resolve(result),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
        };
        return chain;
      },
      update() {
        const chain: Record<string, unknown> = {
          set: () => chain,
          where: (w: unknown) => {
            _capturedUpdateWheres.push(w);
            return chain;
          },
          returning: () => Promise.resolve(_updateQueue.shift() ?? []),
        };
        return chain;
      },
      insert() {
        return {
          values: () => ({
            returning: () => Promise.resolve([]),
          }),
        };
      },
    },
    cortexActionDraftsTable: {
      draftUuid: col("draft_uuid"),
      orgId: col("org_id"),
      status: col("status"),
      alertId: col("alert_id"),
      domain: col("domain"),
      generatedAt: col("generated_at"),
      priority: col("priority"),
      draftType: col("draft_type"),
      title: col("title"),
      content: col("content"),
      recipient: col("recipient"),
      approvedAt: col("approved_at"),
      approvedBy: col("approved_by"),
      dismissedAt: col("dismissed_at"),
      dismissedBy: col("dismissed_by"),
    },
    cortexGraphSnapshotsTable: {},
    dailyBriefingsTable: {
      briefingDate: col("briefing_date"),
      generatedAt: col("generated_at"),
    },
    alloyAuditLogTable: {},
  };
});

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ op: "eq", col, val }),
  and: (...conds: unknown[]) => ({ op: "and", conds }),
  inArray: (col: unknown, vals: unknown) => ({ op: "inArray", col, vals }),
  desc: (col: unknown) => ({ op: "desc", col }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ op: "sql", strings, values }),
    { raw: (s: string) => s }
  ),
  gt: (col: unknown, val: unknown) => ({ op: "gt", col, val }),
  gte: (col: unknown, val: unknown) => ({ op: "gte", col, val }),
  lte: (col: unknown, val: unknown) => ({ op: "lte", col, val }),
}));

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = _currentUser;
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  InvalidIdError: class InvalidIdError extends Error {
    constructor() {
      super("Invalid ID");
      this.name = "InvalidIdError";
    }
  },
}));

vi.mock("../../middlewares/sliding-window-limiter", () => ({
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@szl-holdings/ai-engine", () => ({
  fusionCortex: {
    getAlerts: () => [],
    getStats: () => ({
      totalAlerts: 0,
      activeAlerts: 0,
      alertsBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      topAffectedDomains: [],
    }),
  },
  ontologyEngine: {
    getDomainEntities: async () => [],
    getEntityConnections: async () => ({ outgoing: [], incoming: [] }),
    getGraphStats: async () => ({ totalEntities: 0, totalRelationships: 0 }),
  },
}));

vi.mock("../../lib/multi-agent-orchestrator", () => ({
  orchestrate: async () => ({
    orchestrationId: "test-orch",
    synthesis: "ok",
    confidence: 0.9,
    status: "complete",
    steps: [],
    totalTokens: 0,
    totalCostUsd: 0,
    totalDurationMs: 1,
  }),
}));

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

const _runExportCalls: unknown[] = [];
vi.mock("../../lib/export-service", () => ({
  runExport: vi.fn(async (opts: { format: "csv" | "pdf"; rows: Record<string, unknown>[] }) => {
    _runExportCalls.push(opts);
    const buffer = Buffer.from(opts.format === "pdf" ? "%PDF-1.4 fake" : "id,title\n1,row");
    return {
      exportId: "exp-test-uuid",
      format: opts.format,
      buffer,
      rowCount: opts.rows.length,
      fileSizeBytes: buffer.length,
      downloadToken: "tok-test",
      expiresAt: new Date("2099-01-01T00:00:00Z"),
    };
  }),
}));

// ---------------------------------------------------------------------------
// App builder (dynamic import so mocks apply to the router module)
// ---------------------------------------------------------------------------

let _app: express.Application | null = null;

async function getApp(): Promise<express.Application> {
  if (_app) return _app;
  const { default: cortexRouter } = await import("../cortex.js");
  _app = express();
  _app.use(express.json());
  _app.use(cortexRouter);
  return _app;
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const ORG1_DRAFT = {
  id: 1,
  draftUuid: "draft-org1-uuid-1111",
  orgId: 1,
  alertId: "alert-aaa",
  alertTitle: "Test Alert",
  domain: "vessels",
  draftType: "route_change",
  title: "Fleet Advisory",
  content: "Advisory content",
  recipient: "Fleet Ops",
  priority: "high",
  status: "pending",
  metadata: {},
  generatedAt: new Date("2026-04-01T00:00:00Z"),
  approvedAt: null,
  approvedBy: null,
  dismissedAt: null,
  dismissedBy: null,
};

const ORG2_DRAFT = {
  ...ORG1_DRAFT,
  id: 2,
  draftUuid: "draft-org2-uuid-2222",
  orgId: 2,
};

// ---------------------------------------------------------------------------
// Helpers to inspect captured WHERE clauses
// ---------------------------------------------------------------------------

function containsInArray(clause: unknown): boolean {
  const s = JSON.stringify(clause);
  return s.includes('"inArray"');
}

function containsOrgId(clause: unknown, orgId: number): boolean {
  return JSON.stringify(clause).includes(String(orgId));
}

function containsValue(clause: unknown, val: string): boolean {
  return JSON.stringify(clause).includes(val);
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe("CORTEX action-drafts — multi-tenant security", () => {
  beforeEach(() => {
    _selectQueue = [];
    _updateQueue = [];
    _capturedUpdateWheres.length = 0;
    _capturedSelectWheres.length = 0;
    _currentUser = makeOrg1User();
  });

  // =========================================================================
  // LIST endpoint
  // =========================================================================

  describe("GET /cortex/action-drafts", () => {
    it("returns drafts from the DB for a valid org-1 user", async () => {
      _selectQueue = [[ORG1_DRAFT], [{ count: 1 }]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.drafts)).toBe(true);
      expect(res.body.drafts).toHaveLength(1);
      expect(res.body.drafts[0].id).toBe(ORG1_DRAFT.draftUuid);
    });

    it("applies an inArray orgId filter in the DB WHERE clause", async () => {
      _selectQueue = [[ORG1_DRAFT], [{ count: 1 }]];

      const app = await getApp();
      await request(app).get("/cortex/action-drafts");

      // Both select queries (list + count) must use org-scoped WHERE clauses
      expect(_capturedSelectWheres.length).toBeGreaterThanOrEqual(1);
      expect(containsInArray(_capturedSelectWheres[0])).toBe(true);
      expect(containsOrgId(_capturedSelectWheres[0], 1)).toBe(true);
    });

    it("returns an empty list when the DB finds no drafts for the caller's org", async () => {
      _selectQueue = [[], [{ count: 0 }]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts");

      expect(res.status).toBe(200);
      expect(res.body.drafts).toHaveLength(0);
      expect(res.body.pendingCount).toBe(0);
    });

    it("returns pendingCount from the count query", async () => {
      _selectQueue = [[ORG1_DRAFT], [{ count: 5 }]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts");

      expect(res.status).toBe(200);
      expect(res.body.pendingCount).toBe(5);
    });

    it("accepts a valid status filter without error", async () => {
      _selectQueue = [[ORG1_DRAFT], [{ count: 1 }]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts?status=pending");

      expect(res.status).toBe(200);
    });

    it("ignores invalid status filter values and returns results safely", async () => {
      _selectQueue = [[], [{ count: 0 }]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts?status=INJECTED");

      expect(res.status).toBe(200);
      expect(res.body.drafts).toHaveLength(0);
    });

    it("deny-by-default: returns empty result (no DB query) when user has no org memberships", async () => {
      _currentUser = { ..._currentUser, orgs: [] };
      // Populate queue so we can confirm it was NOT consumed
      _selectQueue = [[ORG1_DRAFT, ORG2_DRAFT], [{ count: 2 }]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts");

      expect(res.status).toBe(200);
      expect(res.body.drafts).toHaveLength(0);
      expect(res.body.total).toBe(0);
      expect(res.body.pendingCount).toBe(0);
      // No DB queries should have been issued
      expect(_capturedSelectWheres).toHaveLength(0);
    });
  });

  // =========================================================================
  // APPROVE endpoint
  // =========================================================================

  describe("POST /cortex/action-drafts/:id/approve", () => {
    it("returns 200 when the DB finds and updates the caller's own draft", async () => {
      const approved = {
        ...ORG1_DRAFT,
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: "alice@org1.example",
      };
      _updateQueue = [[approved]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG1_DRAFT.draftUuid}/approve`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.draft.status).toBe("approved");
    });

    it("returns 404 when the org-scoped update finds no matching draft (cross-tenant attempt)", async () => {
      _updateQueue = [[]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG2_DRAFT.draftUuid}/approve`)
        .send({});

      expect(res.status).toBe(404);
    });

    it("returns 404, not 403, so draft existence is never leaked to foreign orgs", async () => {
      _updateQueue = [[]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG2_DRAFT.draftUuid}/approve`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.status).not.toBe(403);
    });

    it("deny-by-default: returns 404 when user has no org memberships (no DB query issued)", async () => {
      _currentUser = { ..._currentUser, orgs: [] };
      // Populate queue — must not be consumed
      _updateQueue = [[{ ...ORG1_DRAFT, status: "approved" }]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG1_DRAFT.draftUuid}/approve`)
        .send({});

      expect(res.status).toBe(404);
      // No DB update should have been attempted
      expect(_capturedUpdateWheres).toHaveLength(0);
    });

    it("passes the draft UUID into the DB WHERE clause", async () => {
      _updateQueue = [[{ ...ORG1_DRAFT, status: "approved" }]];

      const app = await getApp();
      const targetUuid = ORG1_DRAFT.draftUuid;
      await request(app)
        .post(`/cortex/action-drafts/${targetUuid}/approve`)
        .send({});

      expect(containsValue(_capturedUpdateWheres[0], targetUuid)).toBe(true);
    });

    it("always uses inArray orgId in the DB WHERE clause (tenant isolation guard)", async () => {
      _updateQueue = [[{ ...ORG1_DRAFT, status: "approved" }]];

      const app = await getApp();
      await request(app)
        .post(`/cortex/action-drafts/${ORG1_DRAFT.draftUuid}/approve`)
        .send({});

      expect(containsInArray(_capturedUpdateWheres[0])).toBe(true);
      expect(containsOrgId(_capturedUpdateWheres[0], 1)).toBe(true);
    });
  });

  // =========================================================================
  // DISMISS endpoint
  // =========================================================================

  describe("POST /cortex/action-drafts/:id/dismiss", () => {
    it("returns 200 when the DB finds and updates the caller's own draft", async () => {
      const dismissed = {
        ...ORG1_DRAFT,
        status: "dismissed",
        dismissedAt: new Date().toISOString(),
        dismissedBy: "alice@org1.example",
      };
      _updateQueue = [[dismissed]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG1_DRAFT.draftUuid}/dismiss`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.draft.status).toBe("dismissed");
    });

    it("returns 404 when the org-scoped update finds no matching draft (cross-tenant attempt)", async () => {
      _updateQueue = [[]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG2_DRAFT.draftUuid}/dismiss`)
        .send({});

      expect(res.status).toBe(404);
    });

    it("returns 404, not 403, so draft existence is never leaked to foreign orgs", async () => {
      _updateQueue = [[]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG2_DRAFT.draftUuid}/dismiss`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.status).not.toBe(403);
    });

    it("deny-by-default: returns 404 when user has no org memberships (no DB query issued)", async () => {
      _currentUser = { ..._currentUser, orgs: [] };
      _updateQueue = [[{ ...ORG1_DRAFT, status: "dismissed" }]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG1_DRAFT.draftUuid}/dismiss`)
        .send({});

      expect(res.status).toBe(404);
      expect(_capturedUpdateWheres).toHaveLength(0);
    });

    it("passes the draft UUID into the DB WHERE clause", async () => {
      _updateQueue = [[{ ...ORG1_DRAFT, status: "dismissed" }]];

      const app = await getApp();
      const targetUuid = ORG1_DRAFT.draftUuid;
      await request(app)
        .post(`/cortex/action-drafts/${targetUuid}/dismiss`)
        .send({});

      expect(containsValue(_capturedUpdateWheres[0], targetUuid)).toBe(true);
    });

    it("always uses inArray orgId in the DB WHERE clause (tenant isolation guard)", async () => {
      _updateQueue = [[{ ...ORG1_DRAFT, status: "dismissed" }]];

      const app = await getApp();
      await request(app)
        .post(`/cortex/action-drafts/${ORG1_DRAFT.draftUuid}/dismiss`)
        .send({});

      expect(containsInArray(_capturedUpdateWheres[0])).toBe(true);
      expect(containsOrgId(_capturedUpdateWheres[0], 1)).toBe(true);
    });
  });

  // =========================================================================
  // Multi-org user (user belongs to org-1 and org-3)
  // =========================================================================

  describe("multi-org user", () => {
    beforeEach(() => {
      _currentUser = {
        ..._currentUser,
        orgs: [
          { orgId: 1, orgSlug: "org1", orgName: "Org One", role: "admin" },
          { orgId: 3, orgSlug: "org3", orgName: "Org Three", role: "member" },
        ],
      };
    });

    it("can approve a draft belonging to one of their orgs", async () => {
      _updateQueue = [[{ ...ORG1_DRAFT, orgId: 3, status: "approved" }]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG1_DRAFT.draftUuid}/approve`)
        .send({});

      expect(res.status).toBe(200);
    });

    it("returns 404 for a draft belonging to org-2, even though user is in orgs 1 & 3", async () => {
      _updateQueue = [[]];

      const app = await getApp();
      const res = await request(app)
        .post(`/cortex/action-drafts/${ORG2_DRAFT.draftUuid}/approve`)
        .send({});

      expect(res.status).toBe(404);
    });

    it("WHERE clause contains both orgIds in the inArray guard", async () => {
      _updateQueue = [[{ ...ORG1_DRAFT, status: "approved" }]];

      const app = await getApp();
      await request(app)
        .post(`/cortex/action-drafts/${ORG1_DRAFT.draftUuid}/approve`)
        .send({});

      const where = _capturedUpdateWheres[0] as { op: string; conds: Array<{ op: string; vals?: number[] }> };
      expect(where.op).toBe("and");
      const inArrayClause = where.conds?.find((c) => c.op === "inArray");
      expect(inArrayClause).toBeDefined();
      expect(inArrayClause?.vals).toEqual([1, 3]);
    });

    it("list WHERE clause includes all owned orgIds for inArray scoping", async () => {
      _selectQueue = [[ORG1_DRAFT], [{ count: 1 }]];

      const app = await getApp();
      await request(app).get("/cortex/action-drafts");

      expect(containsInArray(_capturedSelectWheres[0])).toBe(true);
      expect(containsOrgId(_capturedSelectWheres[0], 1)).toBe(true);
      expect(containsOrgId(_capturedSelectWheres[0], 3)).toBe(true);
    });
  });

  // =========================================================================
  // EXPORT endpoint
  // =========================================================================

  describe("GET /cortex/action-drafts/export", () => {
    beforeEach(() => {
      _runExportCalls.length = 0;
    });

    it("returns a CSV download with attachment headers", async () => {
      _selectQueue = [[ORG1_DRAFT]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts/export");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      expect(res.headers["content-disposition"]).toMatch(/attachment/);
      expect(res.headers["content-disposition"]).toMatch(/cortex-action-drafts-/);
      expect(res.headers["content-disposition"]).toMatch(/\.csv/);
      expect(res.headers["x-export-id"]).toBe("exp-test-uuid");
      expect(res.headers["x-row-count"]).toBe("1");
    });

    it("supports format=pdf and returns application/pdf", async () => {
      _selectQueue = [[ORG1_DRAFT]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts/export?format=pdf");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/pdf/);
      expect(res.headers["content-disposition"]).toMatch(/\.pdf/);
    });

    it("rejects unsupported formats with 400", async () => {
      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts/export?format=xlsx");

      expect(res.status).toBe(400);
    });

    it("rejects invalid status filters with 400", async () => {
      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts/export?status=INJECTED");

      expect(res.status).toBe(400);
    });

    it("rejects invalid 'from' date strings with 400", async () => {
      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts/export?from=not-a-date");

      expect(res.status).toBe(400);
    });

    it("rejects invalid 'to' date strings with 400", async () => {
      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts/export?to=garbage");

      expect(res.status).toBe(400);
    });

    it("applies status, domain, and date range filters in the DB WHERE clause", async () => {
      _selectQueue = [[ORG1_DRAFT]];

      const app = await getApp();
      const res = await request(app).get(
        "/cortex/action-drafts/export?status=approved&domain=vessels&from=2026-01-01T00:00:00Z&to=2026-12-31T00:00:00Z",
      );

      expect(res.status).toBe(200);
      expect(_capturedSelectWheres.length).toBe(1);
      const clause = JSON.stringify(_capturedSelectWheres[0]);
      expect(clause).toContain("approved");
      expect(clause).toContain("vessels");
      // gte / lte appear when date filters are present
      expect(clause).toMatch(/"gte"|"gt"/);
      expect(clause).toMatch(/"lte"|"lt"/);
    });

    it("constrains the query to the caller's orgs (multi-tenant safety)", async () => {
      _selectQueue = [[ORG1_DRAFT]];

      const app = await getApp();
      await request(app).get("/cortex/action-drafts/export");

      expect(containsInArray(_capturedSelectWheres[0])).toBe(true);
      expect(containsOrgId(_capturedSelectWheres[0], 1)).toBe(true);
    });

    it("deny-by-default: empty result without DB query when user has no orgs", async () => {
      _currentUser = { ..._currentUser, orgs: [] };
      _selectQueue = [[ORG1_DRAFT, ORG2_DRAFT]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts/export");

      expect(res.status).toBe(200);
      expect(_capturedSelectWheres).toHaveLength(0);
      expect(_runExportCalls).toHaveLength(0);
    });

    it("returns empty result when caller-supplied orgId is outside their memberships", async () => {
      _selectQueue = [[ORG2_DRAFT]];

      const app = await getApp();
      const res = await request(app).get("/cortex/action-drafts/export?orgId=999");

      expect(res.status).toBe(200);
      // No DB query should be issued for an org the caller doesn't belong to
      expect(_capturedSelectWheres).toHaveLength(0);
      expect(_runExportCalls).toHaveLength(0);
    });

    it("records the export to runExport with cortex_action_drafts data source", async () => {
      _selectQueue = [[ORG1_DRAFT]];

      const app = await getApp();
      await request(app).get("/cortex/action-drafts/export");

      expect(_runExportCalls).toHaveLength(1);
      const call = _runExportCalls[0] as { dataSource: string; format: string; rows: unknown[]; columns: Array<{ key: string }> };
      expect(call.dataSource).toBe("cortex_action_drafts");
      expect(call.format).toBe("csv");
      expect(call.rows).toHaveLength(1);
      const colKeys = call.columns.map((c) => c.key);
      expect(colKeys).toEqual(expect.arrayContaining([
        "id", "alertTitle", "domain", "draftType", "title", "recipient",
        "priority", "status", "approvedBy", "generatedAt",
      ]));
    });
  });
});
