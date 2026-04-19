/**
 * End-to-end integration test for the autonomy-mode → /alloy/recommend
 * contract.
 *
 * Proves the full loop the demo and any future real product depend on:
 *   1. PATCH /alloy/autonomy-mode with mode=observe persists the mode for
 *      (tenant, domain) AND writes an alloy_audit_log row.
 *   2. POST  /alloy/recommend for the same domain is then blocked with
 *      HTTP 409 and code AUTONOMY_BLOCKED — agent actions are stopped
 *      regardless of any per-call autonomyMode hint.
 *   3. Happy path: PATCH the mode to approved-act and the same recommend
 *      call returns 201 with a recommendation payload.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

const _auditInserts: Array<Record<string, unknown>> = [];

/**
 * Tiny in-memory simulation of the `alloy_autonomy_modes` table — just enough
 * to back the upsert + lookup the routes perform end-to-end. Keyed by
 * `${tenantOrgId ?? "null"}::${domain}`.
 */
const _autonomyRows = new Map<string, Record<string, unknown>>();
function _autonomyKey(tenantOrgId: number | null | undefined, domain: string): string {
  return `${tenantOrgId == null ? "null" : tenantOrgId}::${domain}`;
}

function makeOpsUser() {
  return {
    id: 42,
    displayName: "Ops Olivia",
    email: "olivia@org7.example",
    roles: ["ops"],
    orgs: [{ orgId: 7, orgSlug: "org7", orgName: "Org Seven", role: "member" }],
  };
}

let _currentUser = makeOpsUser();

// ---------------------------------------------------------------------------
// Module mocks (hoisted to top by vitest)
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/db", () => {
  const col = (name: string) => ({ _colName: name });
  /**
   * Walk a (possibly nested) drizzle `where(and(eq(...), eq(...)))` predicate
   * tree and return a flat list of `{ col, val, op }` filters. Good enough to
   * back the autonomy-modes lookups in this test.
   */
  function flattenWhere(node: unknown, out: Array<{ col?: string; val?: unknown; op: string }> = []): typeof out {
    if (!node || typeof node !== "object") return out;
    const n = node as { op?: string; col?: { _colName?: string }; val?: unknown; conds?: unknown[] };
    if (n.op === "and" && Array.isArray(n.conds)) {
      n.conds.forEach((c) => flattenWhere(c, out));
    } else if (n.op === "eq" || n.op === "isNull") {
      out.push({ op: n.op, col: n.col?._colName, val: n.val });
    }
    return out;
  }
  return {
    db: {
      select() {
        const state: { table?: { _name?: string }; filters: Array<{ col?: string; val?: unknown; op: string }> } = { filters: [] };
        const buildResult = (): unknown[] => {
          if (state.table?._name === "alloy_autonomy_modes") {
            const tenantOrgId = state.filters.find((f) => f.col === "tenant_org_id")
              ? (state.filters.find((f) => f.col === "tenant_org_id")!.val as number)
              : (state.filters.find((f) => f.op === "isNull" && f.col === "tenant_org_id") ? null : undefined);
            const domainFilter = state.filters.find((f) => f.col === "domain");
            const rows: Record<string, unknown>[] = [];
            for (const row of _autonomyRows.values()) {
              if (tenantOrgId !== undefined && row.tenantOrgId !== tenantOrgId) continue;
              if (domainFilter && row.domain !== domainFilter.val) continue;
              rows.push(row);
            }
            return rows;
          }
          return [];
        };
        const chain: Record<string, unknown> = {
          from: (table: { _name?: string }) => { state.table = table; return chain; },
          where: (predicate: unknown) => { state.filters.push(...flattenWhere(predicate)); return chain; },
          innerJoin: () => chain,
          orderBy: () => chain,
          groupBy: () => chain,
          limit: () => Promise.resolve(buildResult()),
          offset: () => Promise.resolve(buildResult()),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve(buildResult()).then(resolve, reject),
        };
        return chain;
      },
      insert(table: { _name?: string }) {
        return {
          values: (row: Record<string, unknown>) => {
            if (table?._name === "alloy_audit_log") {
              _auditInserts.push(row);
            }
            const upsertAutonomy = (set?: Record<string, unknown>) => {
              const tenantOrgId = (row as { tenantOrgId?: number | null }).tenantOrgId ?? null;
              const domain = String((row as { domain?: string }).domain ?? "");
              const key = _autonomyKey(tenantOrgId, domain);
              const existing = _autonomyRows.get(key);
              const merged = existing ? { ...existing, ...(set ?? {}) } : { ...row };
              _autonomyRows.set(key, merged);
              return merged;
            };
            const result = {
              returning: () => {
                if (table?._name === "alloy_autonomy_modes") {
                  return Promise.resolve([upsertAutonomy()]);
                }
                return Promise.resolve([row]);
              },
              onConflictDoUpdate: (args: { set?: Record<string, unknown> }) => ({
                returning: () => {
                  if (table?._name === "alloy_autonomy_modes") {
                    return Promise.resolve([upsertAutonomy(args?.set)]);
                  }
                  return Promise.resolve([row]);
                },
              }),
              onConflictDoNothing: (_args?: unknown) => ({
                returning: () => Promise.resolve([row]),
              }),
            };
            return result;
          },
        };
      },
      update() {
        const chain: Record<string, unknown> = {
          set: () => chain,
          where: () => chain,
          returning: () => Promise.resolve([]),
        };
        return chain;
      },
      delete(table: { _name?: string }) {
        if (table?._name === "alloy_autonomy_modes") {
          _autonomyRows.clear();
        }
        return { where: () => Promise.resolve() };
      },
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },

    // Tables — only the shape needed for column references
    alloyWorkflowsTable: { id: col("id"), orgId: col("org_id"), runCount: col("run_count"), lastRunAt: col("last_run_at"), updatedAt: col("updated_at"), createdAt: col("created_at") },
    alloySignalsTable: {},
    alloyWorkflowRunsTable: { id: col("id"), workflowId: col("workflow_id"), state: col("state") },
    alloyArtifactsTable: { id: col("id"), orgId: col("org_id") },
    alloyApprovalsTable: {},
    alloyAuditLogTable: Object.assign({ _name: "alloy_audit_log" }, {
      id: col("id"),
      orgId: col("org_id"),
      userId: col("user_id"),
      action: col("action"),
      resourceType: col("resource_type"),
      resourceId: col("resource_id"),
      before: col("before"),
      after: col("after"),
      correlationId: col("correlation_id"),
      createdAt: col("created_at"),
    }),
    featureFlagsTable: {},
    insertAlloyWorkflowSchema: { parse: (v: unknown) => v },
    insertAlloySignalSchema: { parse: (v: unknown) => v },
    alloyDecisions: {},
    alloySkills: {},
    alloySkillRuns: {},
    alloyAutonomyModesTable: Object.assign({ _name: "alloy_autonomy_modes" }, {
      id: col("id"),
      tenantOrgId: col("tenant_org_id"),
      domain: col("domain"),
      mode: col("mode"),
      updatedBy: col("updated_by"),
      reason: col("reason"),
      createdAt: col("created_at"),
      updatedAt: col("updated_at"),
      $inferSelect: undefined,
    }),
  };
});

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ op: "eq", col, val }),
  and: (...conds: unknown[]) => ({ op: "and", conds }),
  desc: (col: unknown) => ({ op: "desc", col }),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ op: "sql", strings, values }),
    { raw: (s: string) => s },
  ),
  inArray: (col: unknown, vals: unknown) => ({ op: "inArray", col, vals }),
  gte: (col: unknown, val: unknown) => ({ op: "gte", col, val }),
  lte: (col: unknown, val: unknown) => ({ op: "lte", col, val }),
}));

type AuthedRequest = Request & { user: ReturnType<typeof makeOpsUser> };

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as AuthedRequest).user = _currentUser;
    next();
  },
  requireRole: (..._roles: string[]) => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (raw: string) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) throw new Error("Invalid id");
    return n;
  },
  InvalidIdError: class InvalidIdError extends Error {},
}));

vi.mock("../../middlewares/telemetry", () => ({
  withDbSpan: <T,>(_req: unknown, fn: () => Promise<T>, _name?: string) => fn(),
}));

vi.mock("../../middlewares/platform-auth", () => ({
  platformAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
  logPlatformEvent: vi.fn(),
}));

vi.mock("../../lib/platform-flags", () => ({
  isFlagEnabled: () => false,
}));

vi.mock("../../lib/pubsub-bridge.js", () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn(() => Promise.resolve()) },
  ALLOY_EVENTS: {
    WORKFLOW_RUN_UPDATED: "ALLOY_WORKFLOW_RUN_UPDATED",
    SIGNAL_CREATED: "ALLOY_SIGNAL_CREATED",
    APPROVAL_REQUIRED: "ALLOY_APPROVAL_REQUIRED",
    WORKFLOW_STATUS_CHANGED: "ALLOY_WORKFLOW_STATUS_CHANGED",
  },
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Stub the dynamically-imported @szl/alloy module so the happy path returns a
// deterministic recommendation without exercising the real engine.
vi.mock("@szl/alloy", () => ({
  recommend: vi.fn(async (input: Record<string, unknown>) => ({
    id: "rec_test_1",
    title: input.title,
    summary: input.summary,
    domain: input.domain,
    confidence: 0.91,
    autonomyMode: input.autonomyMode ?? "approved-act",
    createdAt: new Date().toISOString(),
  })),
  checkAction: vi.fn(),
}));

// ---------------------------------------------------------------------------
// App builder (dynamic import so mocks apply to the router module)
// ---------------------------------------------------------------------------

let _app: express.Application | null = null;

async function getApp(): Promise<express.Application> {
  if (_app) return _app;
  const { default: alloyRouter } = await import("../alloy.js");
  _app = express();
  _app.use(express.json());
  _app.use(alloyRouter);
  return _app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Autonomy mode → /alloy/recommend (end-to-end)", () => {
  beforeEach(async () => {
    _auditInserts.length = 0;
    _currentUser = makeOpsUser();
    // Reset the autonomy store so each test starts clean.
    _autonomyRows.clear();
    const { _clearAutonomyStore } = await import("../../lib/autonomy-store.js");
    await _clearAutonomyStore();
  });

  it("PATCH observe → /alloy/recommend returns 409 AUTONOMY_BLOCKED, audit row written", async () => {
    const app = await getApp();
    const domain = "marketing";

    const patchRes = await request(app)
      .patch("/alloy/autonomy-mode")
      .send({ domain, mode: "observe", reason: "demo guardrail" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.mode).toBe("observe");
    expect(patchRes.body.decision.policyState).toBe("blocked");
    // Lock the PATCH side of the policy-reason contract.
    expect(patchRes.body.decision.policyReason).toMatch(/OBSERVE/);
    expect(patchRes.body.decision.policyReason).toMatch(new RegExp(domain));
    expect(patchRes.body.decision.policyReason).toMatch(/must not execute/i);

    // Audit row should have been written for the autonomy-mode change.
    const setModeAudit = _auditInserts.find(
      (row) => row.action === "set_autonomy_mode" && row.resourceId === domain,
    );
    expect(setModeAudit).toBeDefined();
    expect(setModeAudit?.resourceType).toBe("alloy_autonomy_mode");
    expect(setModeAudit?.orgId).toBe(7);
    expect(setModeAudit?.userId).toBe(42);
    expect((setModeAudit?.after as { mode?: string } | undefined)?.mode).toBe("observe");

    // Now POST /alloy/recommend for the same domain — must be blocked.
    const recRes = await request(app)
      .post("/alloy/recommend")
      .send({
        title: "Send re-engagement email",
        summary: "Bring lapsed users back",
        reasoning: "Cohort engagement decay observed",
        domain,
        suggestedAction: "send re-engagement email",
        // Even an explicit per-call hint must NOT bypass the persisted mode.
        autonomyMode: "approved-act",
      });

    expect(recRes.status).toBe(409);
    expect(recRes.body.success).toBe(false);
    expect(recRes.body.code).toBe("AUTONOMY_BLOCKED");
    expect(recRes.body.data?.policyState).toBe("blocked");
    expect(recRes.body.data?.domain).toBe(domain);
    // Lock the recommend-side policy-reason contract: the response must
    // surface the OBSERVE mode and the action being blocked.
    expect(recRes.body.data?.policyReason).toMatch(/OBSERVE/);
    expect(recRes.body.data?.policyReason).toMatch(new RegExp(domain));
    expect(recRes.body.data?.policyReason).toMatch(/send re-engagement email/);
    // The top-level error message mirrors the policy reason for clients that
    // only consume `error`.
    expect(recRes.body.error).toMatch(/OBSERVE/);

    // Confirm @szl/alloy.recommend was NOT invoked when blocked.
    const { recommend } = await import("@szl/alloy");
    expect(recommend).not.toHaveBeenCalled();
  });

  it("PATCH approved-act → /alloy/recommend returns 201 with a recommendation", async () => {
    const app = await getApp();
    const domain = "marketing";

    const patchRes = await request(app)
      .patch("/alloy/autonomy-mode")
      .send({ domain, mode: "approved-act", reason: "policy approved" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.mode).toBe("approved-act");
    expect(patchRes.body.decision.policyState).toBe("allowed");

    const recRes = await request(app)
      .post("/alloy/recommend")
      .send({
        title: "Send re-engagement email",
        summary: "Bring lapsed users back",
        reasoning: "Cohort engagement decay observed",
        domain,
        suggestedAction: "send re-engagement email",
      });

    expect(recRes.status).toBe(201);
    expect(recRes.body.id).toBe("rec_test_1");
    expect(recRes.body.domain).toBe(domain);

    const { recommend } = await import("@szl/alloy");
    expect(recommend).toHaveBeenCalledTimes(1);
  });
});
