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
  return {
    db: {
      select() {
        const chain: Record<string, unknown> = {
          from: () => chain,
          where: () => chain,
          innerJoin: () => chain,
          orderBy: () => chain,
          groupBy: () => chain,
          limit: () => Promise.resolve([]),
          offset: () => Promise.resolve([]),
          then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
            Promise.resolve([]).then(resolve, reject),
        };
        return chain;
      },
      insert(table: { _name?: string }) {
        return {
          values: (row: Record<string, unknown>) => {
            if (table?._name === "alloy_audit_log") {
              _auditInserts.push(row);
            }
            return {
              returning: () => Promise.resolve([row]),
            };
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
      delete() {
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
    // Reset the in-memory autonomy store so each test starts clean.
    const { _clearAutonomyStore } = await import("../../lib/autonomy-store.js");
    _clearAutonomyStore();
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
