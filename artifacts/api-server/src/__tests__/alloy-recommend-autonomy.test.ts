/**
 * Integration tests for POST /alloy/recommend autonomy → approval wiring
 * (Task #2196).
 *
 * Locks in the contract that /alloy/recommend honors the persisted autonomy
 * mode for (tenant, domain) and creates the right human-gate side effects:
 *
 *   ask-to-act / recommend  → exactly ONE pending approval_requests row,
 *                             carrying the recommendation id and policy
 *                             reason. No draft artifact row.
 *   draft                   → ONE pending approval_requests row AND a
 *                             pending_review platform_artifacts row.
 *   approved-act            → no approval row at all (executes within
 *                             policy).
 *   observe                 → request rejected (HTTP 409, AUTONOMY_BLOCKED)
 *                             and no approval row.
 *
 * Without this coverage, a future refactor could silently stop creating the
 * approval row and operators would have nothing to act on.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import type { Router as ExpressRouter } from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Track every db.insert() call so each test can assert on which tables the
// route wrote to and with what shape.
// ---------------------------------------------------------------------------

interface InsertCall {
  table: unknown;
  values: Record<string, unknown>;
}
const insertCalls: InsertCall[] = [];

// Sentinel table identities so tests can match on table-by-reference.
const ALLOY_ARTIFACTS_TABLE = { __tableName: "alloy_artifacts" };

// Mutable autonomy mode per test — drives the mocked autonomy-store.
const autonomyState = { mode: "ask-to-act" as
  | "observe" | "recommend" | "draft" | "ask-to-act" | "approved-act" };

// Track createApprovalRequest calls.
const createApprovalRequestMock = vi.fn(async (params: Record<string, unknown>) => ({
  id: "approval-uuid-1",
  status: "pending",
  priority: params.priority ?? "medium",
  expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  ...params,
}));

// Track recommend() calls.
const recommendMock = vi.fn(async (params: Record<string, unknown>) => ({
  id: "rec-uuid-1",
  runId: "run-uuid-1",
  traceId: "trace-uuid-1",
  domain: params.domain,
  confidence: 0.82,
}));

// ---------------------------------------------------------------------------
// Mocks (must be hoisted via vi.mock — defined before any dynamic import)
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/observability", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createObservabilityMock();
});

vi.mock("@szl-holdings/db", () => {
  const stubTable = {};
  const db = {
    insert: (table: unknown) => ({
      values: (vals: Record<string, unknown>) => {
        const recorded: InsertCall = { table, values: vals };
        insertCalls.push(recorded);
        return {
          returning: () =>
            Promise.resolve([{ id: insertCalls.length, ...vals }]),
          onConflictDoNothing: () => ({
            returning: () => Promise.resolve([]),
          }),
        };
      },
    }),
    select: () => {
      const chain: Record<string, unknown> = {};
      const fn = () => chain;
      ["from", "where", "orderBy", "limit", "offset", "innerJoin", "leftJoin", "groupBy"].forEach(
        (k) => ((chain as Record<string, unknown>)[k] = fn),
      );
      (chain as { then: unknown }).then = (resolve: (v: unknown[]) => void) =>
        Promise.resolve([]).then(resolve);
      return chain;
    },
    update: () => ({
      set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };
  return new Proxy(
    { db, alloyArtifactsTable: ALLOY_ARTIFACTS_TABLE } as Record<string, unknown>,
    {
      get(target, prop) {
        if (prop in target) return target[prop as string];
        return stubTable;
      },
      has() {
        return true;
      },
    },
  );
});

vi.mock("drizzle-orm", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createDrizzleOrmMock();
});

vi.mock("../lib/logger.js", async () => {
  const m = await import("./helpers/mocks.js");
  return m.createLoggerMock();
});

vi.mock("../middlewares/auth.js", () => ({
  authMiddleware: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as unknown as { user: unknown }).user = {
      id: 4242,
      email: "operator@szl-holdings.test",
      displayName: "Operator Test",
      roles: ["operator"],
      orgs: [
        { orgId: 7, orgSlug: "acme", orgName: "Acme Inc", role: "operator" },
      ],
    };
    next();
  },
  requireRole:
    () =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  parseIdParam: (raw: string | string[]) => {
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("Invalid ID");
    return n;
  },
  InvalidIdError: class extends Error {},
}));

vi.mock("../middlewares/telemetry.js", () => ({
  withDbSpan: (_req: unknown, fn: () => unknown) => fn(),
}));

vi.mock("../middlewares/platform-auth.js", () => ({
  platformAuth:
    () =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  logPlatformEvent: vi.fn(),
}));

vi.mock("../lib/platform-flags.js", () => ({
  isFlagEnabled: vi.fn(async () => false),
}));

vi.mock("../lib/pubsub-bridge.js", () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn() },
  ALLOY_EVENTS: {
    WORKFLOW_RUN_UPDATED: "ALLOY_WORKFLOW_RUN_UPDATED",
    SIGNAL_CREATED: "ALLOY_SIGNAL_CREATED",
    APPROVAL_REQUIRED: "ALLOY_APPROVAL_REQUIRED",
    WORKFLOW_STATUS_CHANGED: "ALLOY_WORKFLOW_STATUS_CHANGED",
  },
}));

vi.mock("../lib/autonomy-store.js", () => {
  const AUTONOMY_MODES = [
    "observe",
    "recommend",
    "draft",
    "ask-to-act",
    "approved-act",
  ];
  const policyReasonFor = (mode: string) => {
    switch (mode) {
      case "observe":
        return "Autonomy mode is OBSERVE — agents must not execute.";
      case "recommend":
        return "Autonomy mode is RECOMMEND — surfaced for human action.";
      case "draft":
        return "Autonomy mode is DRAFT — prepared for human review.";
      case "ask-to-act":
        return "Autonomy mode is ASK-TO-ACT — approval required.";
      case "approved-act":
        return "Autonomy mode is APPROVED-ACT — executes within policy.";
      default:
        return "default reason";
    }
  };
  return {
    AUTONOMY_MODES,
    listAutonomyModes: vi.fn(async () => []),
    setAutonomyMode: vi.fn(),
    getAutonomyMode: vi.fn(async () => ({
      tenantOrgId: 7,
      domain: "test",
      mode: autonomyState.mode,
      updatedAt: new Date(0).toISOString(),
      updatedBy: null,
      reason: null,
    })),
    evaluateAutonomyForAction: vi.fn(async () => {
      const mode = autonomyState.mode;
      const policyReason = policyReasonFor(mode);
      switch (mode) {
        case "observe":
          return { mode, policyState: "blocked", policyReason, disposition: "block" };
        case "recommend":
          return { mode, policyState: "requires-approval", policyReason, disposition: "queue" };
        case "draft":
          return { mode, policyState: "requires-approval", policyReason, disposition: "draft" };
        case "ask-to-act":
          return { mode, policyState: "requires-approval", policyReason, disposition: "queue" };
        case "approved-act":
          return { mode, policyState: "allowed", policyReason, disposition: "execute" };
        default:
          return { mode, policyState: "requires-approval", policyReason, disposition: "queue" };
      }
    }),
  };
});

vi.mock("@szl/alloy", () => ({
  recommend: recommendMock,
  checkAction: vi.fn(),
}));

vi.mock("@szl/alloy/evidence", () => ({
  createEvidence: vi.fn(),
  getEvidence: vi.fn(),
}));

vi.mock("@szl-holdings/covenant-policy", () => ({
  createApprovalRequest: createApprovalRequestMock,
}));

// ---------------------------------------------------------------------------
// Import the router AFTER mocks are hoisted
// ---------------------------------------------------------------------------

const { default: alloyRouter } = await import("../routes/alloy.js");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", alloyRouter as unknown as ExpressRouter);
  return app;
}

interface RecommendBody {
  id: string;
  runId: string;
  autonomyDecision: {
    mode: string;
    disposition: string;
    policyState: string;
    policyReason: string;
  };
  approval: {
    id: string;
    status: string;
    priority: string;
    expiresAt: string;
  } | null;
  draftArtifactId: number | null;
}

interface BlockedBody {
  success: false;
  error: string;
  code: string;
  data: { policyState: string; mode: string; domain: string };
}

const baseRequestBody = {
  title: "Take action on signal #99",
  summary: "Routine remediation suggested by alloy",
  reasoning: "Signal exceeds threshold and matches known-good remediation",
  domain: "vessels",
  urgency: "moderate",
  suggestedAction: "Re-route vessel away from storm cell",
};

beforeEach(() => {
  insertCalls.length = 0;
  createApprovalRequestMock.mockClear();
  recommendMock.mockClear();
  autonomyState.mode = "ask-to-act";
});

describe("POST /alloy/recommend autonomy → approval wiring", () => {
  it("ask-to-act: creates exactly one pending approval row carrying recommendation id + policy reason, no draft artifact", async () => {
    autonomyState.mode = "ask-to-act";
    const res = await request(buildApp()).post("/api/alloy/recommend").send(baseRequestBody);

    expect(res.status).toBe(201);
    const body = res.body as RecommendBody;
    expect(body.autonomyDecision.mode).toBe("ask-to-act");
    expect(body.autonomyDecision.disposition).toBe("queue");
    expect(body.draftArtifactId).toBeNull();
    expect(body.approval).not.toBeNull();
    expect(body.approval?.status).toBe("pending");

    expect(createApprovalRequestMock).toHaveBeenCalledTimes(1);
    const call = createApprovalRequestMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(call.orgId).toBe(7);
    expect(call.resourceType).toBe("alloy_recommendation");
    expect(call.resourceId).toBe("rec-uuid-1");
    expect(call.description).toMatch(/ASK-TO-ACT/);
    expect(call.serviceAttribution).toBe("alloy.recommend");
    const payload = call.payload as Record<string, unknown>;
    expect(payload.recommendationId).toBe("rec-uuid-1");
    expect(payload.autonomyMode).toBe("ask-to-act");
    expect(payload.policyReason).toMatch(/ASK-TO-ACT/);
    expect(payload.draftArtifactId).toBeNull();

    // No draft artifact row should be inserted in queue dispositions.
    const artifactInserts = insertCalls.filter((c) => c.table === ALLOY_ARTIFACTS_TABLE);
    expect(artifactInserts).toHaveLength(0);
  });

  it("recommend mode: creates exactly one pending approval row, no draft artifact", async () => {
    autonomyState.mode = "recommend";
    const res = await request(buildApp()).post("/api/alloy/recommend").send(baseRequestBody);

    expect(res.status).toBe(201);
    const body = res.body as RecommendBody;
    expect(body.autonomyDecision.mode).toBe("recommend");
    expect(body.autonomyDecision.disposition).toBe("queue");
    expect(body.approval).not.toBeNull();
    expect(body.draftArtifactId).toBeNull();

    expect(createApprovalRequestMock).toHaveBeenCalledTimes(1);
    const call = createApprovalRequestMock.mock.calls[0]![0] as Record<string, unknown>;
    expect(call.resourceId).toBe("rec-uuid-1");
    expect((call.payload as Record<string, unknown>).autonomyMode).toBe("recommend");

    const artifactInserts = insertCalls.filter((c) => c.table === ALLOY_ARTIFACTS_TABLE);
    expect(artifactInserts).toHaveLength(0);
  });

  it("draft mode: creates ONE pending approval AND ONE pending_review platform_artifacts row", async () => {
    autonomyState.mode = "draft";
    const res = await request(buildApp()).post("/api/alloy/recommend").send(baseRequestBody);

    expect(res.status).toBe(201);
    const body = res.body as RecommendBody;
    expect(body.autonomyDecision.mode).toBe("draft");
    expect(body.autonomyDecision.disposition).toBe("draft");
    expect(body.draftArtifactId).not.toBeNull();
    expect(body.approval).not.toBeNull();

    // Approval row created with reference to recommendation + draft artifact id.
    expect(createApprovalRequestMock).toHaveBeenCalledTimes(1);
    const call = createApprovalRequestMock.mock.calls[0]![0] as Record<string, unknown>;
    const payload = call.payload as Record<string, unknown>;
    expect(payload.autonomyMode).toBe("draft");
    expect(payload.draftArtifactId).toBe(body.draftArtifactId);

    // platform_artifacts row inserted in pending_review state.
    const artifactInserts = insertCalls.filter((c) => c.table === ALLOY_ARTIFACTS_TABLE);
    expect(artifactInserts).toHaveLength(1);
    const artifactRow = artifactInserts[0]!.values;
    expect(artifactRow.status).toBe("pending_review");
    expect(artifactRow.approvalStatus).toBe("pending");
    expect(artifactRow.orgId).toBe(7);
    expect(artifactRow.artifactType).toBe("recommendation");
    const content = artifactRow.content as Record<string, unknown>;
    expect(content.recommendationId).toBe("rec-uuid-1");
    expect(content.autonomyMode).toBe("draft");
  });

  it("approved-act: no approval row, no draft artifact, recommendation executes inline", async () => {
    autonomyState.mode = "approved-act";
    const res = await request(buildApp()).post("/api/alloy/recommend").send(baseRequestBody);

    expect(res.status).toBe(201);
    const body = res.body as RecommendBody;
    expect(body.autonomyDecision.mode).toBe("approved-act");
    expect(body.autonomyDecision.disposition).toBe("execute");
    expect(body.approval).toBeNull();
    expect(body.draftArtifactId).toBeNull();

    expect(createApprovalRequestMock).not.toHaveBeenCalled();
    const artifactInserts = insertCalls.filter((c) => c.table === ALLOY_ARTIFACTS_TABLE);
    expect(artifactInserts).toHaveLength(0);
  });

  it("observe: request rejected with AUTONOMY_BLOCKED and no approval row created", async () => {
    autonomyState.mode = "observe";
    const res = await request(buildApp()).post("/api/alloy/recommend").send(baseRequestBody);

    expect(res.status).toBe(409);
    const body = res.body as BlockedBody;
    expect(body.success).toBe(false);
    expect(body.code).toBe("AUTONOMY_BLOCKED");
    expect(body.data.mode).toBe("observe");
    expect(body.data.policyState).toBe("blocked");

    // The recommendation engine should not have been invoked, and no approval
    // row should have been created.
    expect(recommendMock).not.toHaveBeenCalled();
    expect(createApprovalRequestMock).not.toHaveBeenCalled();
    const artifactInserts = insertCalls.filter((c) => c.table === ALLOY_ARTIFACTS_TABLE);
    expect(artifactInserts).toHaveLength(0);
  });
});
