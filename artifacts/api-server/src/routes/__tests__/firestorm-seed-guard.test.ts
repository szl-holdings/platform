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

import type { IRouter } from 'express';
import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTable = () => ({
  id: 'id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  riskScore: 'risk_score',
  vesselId: 'vessel_id',
  orgId: 'org_id',
  status: 'status',
  slug: 'slug',
  name: 'name',
  userId: 'user_id',
});

const makeSchema = () => ({
  parse: (v: unknown) => v,
  partial: () => ({ parse: (v: unknown) => v }),
});

// ---------------------------------------------------------------------------
// @szl-holdings/db — explicit no-op mock (no importActual to avoid side effects)
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  const chain: Record<string, unknown> = {};
  chain.from = () => chain;
  chain.where = () => chain;
  chain.innerJoin = () => chain;
  chain.leftJoin = () => chain;
  chain.orderBy = () => chain;
  chain.limit = () => Promise.resolve([]);
  chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);

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

vi.mock('@szl-holdings/ai-engine', () => ({
  validateAndBuildDecision: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('@szl-holdings/ai-engine/domain-embedding-hooks', () => ({
  ingestFirestormFinding: vi.fn().mockResolvedValue(undefined),
  ingestFirestormScenario: vi.fn().mockResolvedValue(undefined),
  ingestFirestormAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Internal service mocks
// ---------------------------------------------------------------------------

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (_opts?: unknown) => (_req: any, _res: any, next: () => void) => next(),
  parseIdParam: (raw: string) => parseInt(raw, 10),
  requireRole:
    (..._roles: string[]) =>
    (_req: any, _res: any, next: () => void) =>
      next(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn() },
  FIRESTORM_EVENTS: { SCENARIO_CREATED: 'scenario_created', ALERT_TRIGGERED: 'alert_triggered' },
}));

vi.mock('../../lib/tradecraft-evidence-store', () => ({
  queryEvidenceIndex: vi.fn().mockResolvedValue([]),
  ingestDecisionToEvidenceIndex: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../middlewares/optimistic-concurrency', () => ({
  validateIfMatch: (_req: any, _res: any, next: () => void) => next(),
}));

// Mock the dynamically-imported seed module so the non-prod test can assert
// the success contract without touching real DB seed code.
vi.mock('../../scripts/seed-aegis.js', () => ({
  seedAegis: vi.fn().mockResolvedValue({ inserted: { assets: 0, cases: 0 } }),
}));

// ---------------------------------------------------------------------------
// Import the REAL register function (after all mocks are hoisted by Vitest)
// ---------------------------------------------------------------------------

const { register } = await import('../firestorm/assets-cases.js');

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

describe('firestorm seed endpoint — production route is not registered', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.APP_ENV = originalAppEnv;
  });

  // The route is NOT mounted when isProductionEnvironment() is true at the
  // moment register() runs. A request therefore falls through to Express's
  // default 404 (no body / empty body), advertising no endpoint surface.

  it('is unregistered (generic 404) when NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    delete (process.env as Record<string, string | undefined>).APP_ENV;

    const app = buildApp();
    const res = await request(app).post('/firestorm/seed').send({});

    expect(res.status).toBe(404);
    // Generic Express 404 — no SEED_DISABLED_IN_PRODUCTION code, because
    // the route was never mounted on the router at all.
    expect(res.body.code).toBeUndefined();
  });

  it('is unregistered (generic 404) when APP_ENV=production (even if NODE_ENV is development)', async () => {
    process.env.NODE_ENV = 'development';
    process.env.APP_ENV = 'production';

    const app = buildApp();
    const res = await request(app).post('/firestorm/seed').send({});

    expect(res.status).toBe(404);
    expect(res.body.code).toBeUndefined();
  });

  it('IS registered in non-production (e.g. NODE_ENV=test) and returns the seed success contract', async () => {
    process.env.NODE_ENV = 'test';
    delete (process.env as Record<string, string | undefined>).APP_ENV;

    const app = buildApp();
    const res = await request(app).post('/firestorm/seed').send({});

    // The handler is mounted and the (mocked) seedAegis resolves cleanly.
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: 'Aegis data seeded successfully',
      result: { inserted: { assets: 0, cases: 0 } },
    });
  });
});
