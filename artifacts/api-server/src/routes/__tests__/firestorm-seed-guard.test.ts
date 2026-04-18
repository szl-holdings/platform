/**
 * Firestorm Seed Production Guard — Integration Tests
 *
 * These tests import the REAL firestorm/assets-cases.ts router (via its register()
 * function) and verify that POST /firestorm/seed is blocked when the runtime
 * environment is production.
 *
 * All external dependencies are explicitly mocked so the real production-guard
 * code path is exercised without side effects. importActual is intentionally
 * avoided to prevent cross-test module cache contamination.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import type { IRouter } from "express";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTable = () => ({
  id: "id",
  createdAt: "created_at",
  updatedAt: "updated_at",
  riskScore: "risk_score",
  vesselId: "vessel_id",
  orgId: "org_id",
  status: "status",
  slug: "slug",
  name: "name",
  userId: "user_id",
});

const makeSchema = () => ({
  parse: (v: unknown) => v,
  partial: () => ({ parse: (v: unknown) => v }),
});

// ---------------------------------------------------------------------------
// @szl-holdings/db — explicit no-op mock (no importActual to avoid side effects)
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/db", () => {
  const chain: Record<string, unknown> = {};
  chain.from = () => chain;
  chain.where = () => chain;
  chain.innerJoin = () => chain;
  chain.leftJoin = () => chain;
  chain.orderBy = () => chain;
  chain.limit = () => Promise.resolve([]);
  chain.then = (resolve: (v: unknown[]) => unknown) =>
    Promise.resolve([]).then(resolve);

  const mockDb = {
    select: () => chain,
    insert: () => ({ values: (v: unknown) => ({ returning: () => Promise.resolve([v]) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
  };

  return {
    db: mockDb,
    pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
    ROLE_HIERARCHY: {},
    isReadOnlyRole: () => false,
    toCanonicalRole: (r: string) => r,
    // firestorm tables
    firestormScenariosTable: makeTable(),
    firestormAssessmentsTable: makeTable(),
    firestormSimulationRunsTable: makeTable(),
    firestormFindingsTable: makeTable(),
    firestormRiskScoresTable: makeTable(),
    firestormIncidentsTable: makeTable(),
    firestormAlertsTable: makeTable(),
    firestormAssetsTable: makeTable(),
    firestormWorkflowActionsTable: makeTable(),
    firestormHardeningControlsTable: makeTable(),
    firestormComplianceControlsTable: makeTable(),
    firestormCasesTable: makeTable(),
    firestormMitreDetectionsTable: makeTable(),
    firestormTradecraftDecisionsTable: makeTable(),
    firestormCaseMemoryTable: makeTable(),
    firestormAnalystNotebookTable: makeTable(),
    firestormTradecraftValidationAuditTable: makeTable(),
    alloyRuntimeAgentsTable: makeTable(),
    alloyRuntimeAgentVersionsTable: makeTable(),
    auditEventsTable: makeTable(),
    // readiness tables (imported by readiness.ts → assets-cases.ts)
    readinessProgramsTable: makeTable(),
    readinessDimensionsTable: makeTable(),
    readinessScoreHistoryTable: makeTable(),
    readinessMilestonesTable: makeTable(),
    readinessRisksTable: makeTable(),
    readinessAlertsTable: makeTable(),
    // shared schemas
    orgMembersTable: makeTable(),
    organizationsTable: makeTable(),
    usersTable: makeTable(),
    sessionsTable: makeTable(),
    insertFirestormScenarioSchema: makeSchema(),
    insertFirestormAssessmentSchema: makeSchema(),
    insertFirestormSimulationRunSchema: makeSchema(),
    insertFirestormFindingSchema: makeSchema(),
    insertFirestormRiskScoreSchema: makeSchema(),
    insertFirestormIncidentSchema: makeSchema(),
    insertFirestormAlertSchema: makeSchema(),
    insertFirestormAssetSchema: makeSchema(),
    insertFirestormWorkflowActionSchema: makeSchema(),
    insertFirestormCaseSchema: makeSchema(),
    insertFirestormTradecraftDecisionSchema: makeSchema(),
    insertFirestormAnalystNotebookSchema: makeSchema(),
  };
});

// ---------------------------------------------------------------------------
// External AI + embedding packages
// ---------------------------------------------------------------------------

vi.mock("@szl-holdings/ai-engine", () => ({
  validateAndBuildDecision: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@szl-holdings/ai-engine/domain-embedding-hooks", () => ({
  ingestFirestormFinding: vi.fn().mockResolvedValue(undefined),
  ingestFirestormScenario: vi.fn().mockResolvedValue(undefined),
  ingestFirestormAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Internal service mocks
// ---------------------------------------------------------------------------

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: (_opts?: unknown) => (_req: any, _res: any, next: () => void) => next(),
  parseIdParam: (raw: string) => parseInt(raw, 10),
  requireRole: (..._roles: string[]) => (_req: any, _res: any, next: () => void) => next(),
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../lib/pubsub-bridge.js", () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn() },
  FIRESTORM_EVENTS: { SCENARIO_CREATED: "scenario_created", ALERT_TRIGGERED: "alert_triggered" },
}));

vi.mock("../../lib/tradecraft-evidence-store", () => ({
  queryEvidenceIndex: vi.fn().mockResolvedValue([]),
  ingestDecisionToEvidenceIndex: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../middlewares/optimistic-concurrency", () => ({
  validateIfMatch: (_req: any, _res: any, next: () => void) => next(),
}));

// ---------------------------------------------------------------------------
// Import the REAL register function (after all mocks are hoisted by Vitest)
// ---------------------------------------------------------------------------

const { register } = await import("../firestorm/assets-cases.js");

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  const router = express.Router() as IRouter;
  register(router);
  app.use(router);
  return app;
}

// ---------------------------------------------------------------------------
// Tests — POST /firestorm/seed production guard
// ---------------------------------------------------------------------------

describe("firestorm seed endpoint — real router production guard", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.APP_ENV = originalAppEnv;
  });

  it("returns 403 with SEED_DISABLED_IN_PRODUCTION when NODE_ENV=production", async () => {
    process.env.NODE_ENV = "production";
    delete (process.env as Record<string, string | undefined>).APP_ENV;

    const app = buildApp();
    const res = await request(app).post("/firestorm/seed").send({});

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("SEED_DISABLED_IN_PRODUCTION");
  });

  it("returns 403 when APP_ENV=production (even if NODE_ENV is development)", async () => {
    process.env.NODE_ENV = "development";
    process.env.APP_ENV = "production";

    const app = buildApp();
    const res = await request(app).post("/firestorm/seed").send({});

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("SEED_DISABLED_IN_PRODUCTION");
  });

  it("error message explicitly names production restriction", async () => {
    process.env.NODE_ENV = "production";
    const app = buildApp();
    const res = await request(app).post("/firestorm/seed").send({});

    expect(res.body.error).toMatch(/disabled in production/i);
    expect(res.body.code).toBe("SEED_DISABLED_IN_PRODUCTION");
  });
});
