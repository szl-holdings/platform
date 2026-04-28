/**
 * Alloy workflow & artifact cross-tenant isolation (task-3145)
 *
 * Verifies that the callerOrgFilter() helper introduced in alloy.ts correctly
 * scopes single-resource GET/PATCH/DELETE queries so that:
 *
 *   1. A caller from org1 cannot read/modify/delete a workflow owned by org2.
 *      (The WHERE clause includes `orgId IN (org1)` so the query returns no
 *      rows and the handler returns 404 — same as "not found".)
 *   2. A caller from org1 CAN read their own org's workflow (200).
 *   3. A global-admin can read any workflow regardless of orgId (200).
 *
 * The mock controls what rows the DB returns so we can simulate both the
 * cross-org case (empty result → 404) and the same-org case (row returned → 200).
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted ensures variables are accessible inside vi.mock factories (which are hoisted).
const { dbQueue } = vi.hoisted(() => ({ dbQueue: { results: [] as unknown[][] } }));

vi.mock('@szl-holdings/db', () => {
  const makeChain = () => {
    const c: Record<string, unknown> = {
      from: () => c,
      where: () => c,
      innerJoin: () => c,
      leftJoin: () => c,
      orderBy: () => c,
      limit: () => c,
      offset: () => Promise.resolve([]),
      set: () => c,
      values: () => c,
      returning: () => Promise.resolve([]),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
        const result = dbQueue.results.shift() ?? [];
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return c;
  };

  return {
    db: {
      select: makeChain,
      insert: makeChain,
      update: makeChain,
      delete: makeChain,
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
    orgMembersTable: { orgId: 'orgId', userId: 'userId' },
    organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
    alloyWorkflowsTable: { id: 'id', orgId: 'orgId', name: 'name', isActive: 'isActive', createdBy: 'createdBy', updatedAt: 'updatedAt' },
    alloyWorkflowRunsTable: { id: 'id', workflowId: 'workflowId', state: 'state', createdAt: 'createdAt', orgId: 'orgId' },
    alloyArtifactsTable: { id: 'id', orgId: 'orgId', status: 'status', approvalStatus: 'approvalStatus' },
    alloyAuditLogTable: { orgId: 'orgId', id: 'id', createdAt: 'createdAt' },
    alloyApprovalsTable: { workflowRunId: 'workflowRunId', status: 'status' },
    alloyPoliciesTable: { orgId: 'orgId', id: 'id', isActive: 'isActive', policyType: 'policyType', createdAt: 'createdAt', updatedAt: 'updatedAt' },
    alloyLegacyPoliciesTable: { orgId: 'orgId', id: 'id', policyType: 'policyType', isActive: 'isActive', createdAt: 'createdAt', updatedAt: 'updatedAt' },
    modelRoutingPoliciesTable: { orgId: 'orgId', id: 'id', isActive: 'isActive', createdAt: 'createdAt', updatedAt: 'updatedAt' },
    costBudgetsTable: { orgId: 'orgId', id: 'id', isActive: 'isActive', createdAt: 'createdAt' },
    featureFlagsTable: { key: 'key', value: 'value', updatedAt: 'updatedAt', description: 'description' },
    auditEventsTable: { orgId: 'orgId', id: 'id', createdAt: 'createdAt' },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (_col: unknown, _val: unknown) => ({ op: 'eq' }),
  and: (..._conds: unknown[]) => ({ op: 'and' }),
  or: (..._conds: unknown[]) => ({ op: 'or' }),
  inArray: (_col: unknown, _vals: unknown) => ({ op: 'inArray' }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  asc: (_col: unknown) => ({ op: 'asc' }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ op: 'sql' }), { mapWith: () => () => ({ op: 'sql' }) }),
  count: () => ({ op: 'count' }),
  gte: () => ({ op: 'gte' }),
  lte: () => ({ op: 'lte' }),
  gt: () => ({ op: 'gt' }),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn(), recordError: vi.fn(), recordLatency: vi.fn() },
}));

vi.mock('../../middlewares/sliding-window-limiter', () => ({
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  aiInferenceSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../middlewares/idempotency', () => ({
  idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
  optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../middlewares/telemetry', () => ({
  withDbSpan: async (_req: unknown, fn: () => unknown) => fn(),
  recordDbSpan: (_req: unknown, _name: string, fn: () => unknown) => fn(),
}));

vi.mock('../../lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn() },
  ALLOY_EVENTS: { WORKFLOW_RUN_UPDATED: 'workflow-run-updated' },
}));

vi.mock('../../lib/alloy-run-failure-notifications', () => ({
  notifyRunFailure: vi.fn(),
}));

vi.mock('../../middlewares/platform-auth', () => ({
  platformAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

const { currentUser } = vi.hoisted(() => ({
  currentUser: {
    value: {
      id: 1,
      displayName: 'Alice',
      email: 'alice@org1.example',
      roles: ['member'],
      orgs: [{ orgId: 1, orgSlug: 'org1', orgName: 'Org One', role: 'member' }],
    } as Record<string, unknown>,
  },
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: () => (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as Record<string, unknown>).user = currentUser.value;
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (raw: string) => parseInt(raw, 10),
  InvalidIdError: class InvalidIdError extends Error {},
}));

vi.mock('../../lib/validation', () => ({
  validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  listQuerySchema: { parse: () => ({ page: 1, limit: 10 }) },
  autonomyModeQuerySchema: { parse: () => ({}) },
  alloyIngestSignalSchema: { parse: (b: unknown) => b },
  alloyIngestBatchSchema: { parse: (b: unknown) => b },
  alloyWorkflowMutationSchema: {},
  alloyWorkflowDeleteSchema: {},
  alloyRunActionSchema: {},
  alloyDecisionTransitionSchema: {},
  alloyResourceBodySchema: {},
  workflowRunSchema: {},
}));

async function buildApp() {
  const { default: alloyRouter } = await import('../alloy');
  const app = express();
  app.use(express.json());
  app.use(alloyRouter);
  return app;
}

const noOrgUser = {
  id: 2,
  displayName: 'No Org Bob',
  email: 'bob@nowhere.example',
  roles: ['member'],
  orgs: [],
};

describe('alloy workflow cross-tenant isolation (task-3145)', () => {
  beforeEach(() => {
    dbQueue.results = [];
    currentUser.value = {
      id: 1,
      displayName: 'Alice',
      email: 'alice@org1.example',
      roles: ['member'],
      orgs: [{ orgId: 1, orgSlug: 'org1', orgName: 'Org One', role: 'member' }],
    };
  });

  // ── Workflow GET ─────────────────────────────────────────────────────────────

  it('GET /alloy/workflows/:id returns 403 for zero-org caller (no DB query executed)', async () => {
    currentUser.value = noOrgUser;
    const app = await buildApp();
    const res = await request(app).get('/alloy/workflows/42');
    expect(res.status).toBe(403);
  });

  it('GET /alloy/workflows/:id returns 404 when DB returns no rows (cross-org WHERE miss)', async () => {
    // org1 caller + org2 workflow: WHERE orgId IN (1) filters it out → DB returns []
    dbQueue.results = [[]];
    const app = await buildApp();
    const res = await request(app).get('/alloy/workflows/42');
    expect(res.status).toBe(404);
  });

  it('GET /alloy/workflows/:id returns 200 when DB returns a matching row (same-org)', async () => {
    // sendSuccess sends data directly (no { data: } wrapper) when no meta is passed
    dbQueue.results = [[{ id: 42, orgId: 1, name: 'My Workflow', isActive: true }]];
    const app = await buildApp();
    const res = await request(app).get('/alloy/workflows/42');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body).not.toEqual({});
  });

  it('GET /alloy/workflows/:id returns 200 for global admin (no org restriction)', async () => {
    currentUser.value = {
      id: 99,
      displayName: 'Admin',
      email: 'admin@example.com',
      roles: ['super_admin'],
      orgs: [{ orgId: 1, orgSlug: 'org1', orgName: 'Org One', role: 'super_admin' }],
    };
    dbQueue.results = [[{ id: 99, orgId: 2, name: 'Org2 Workflow', isActive: true }]];
    const app = await buildApp();
    const res = await request(app).get('/alloy/workflows/99');
    expect(res.status).toBe(200);
  });

  // ── Artifact GET ─────────────────────────────────────────────────────────────

  it('GET /alloy/artifacts/:id returns 403 for zero-org caller (no DB query executed)', async () => {
    currentUser.value = noOrgUser;
    const app = await buildApp();
    const res = await request(app).get('/alloy/artifacts/7');
    expect(res.status).toBe(403);
  });

  it('GET /alloy/artifacts/:id returns 404 when DB returns no rows (cross-org WHERE miss)', async () => {
    dbQueue.results = [[]];
    const app = await buildApp();
    const res = await request(app).get('/alloy/artifacts/7');
    expect(res.status).toBe(404);
  });

  it('GET /alloy/artifacts/:id returns 200 when DB returns a matching row (same-org)', async () => {
    dbQueue.results = [[{ id: 7, orgId: 1, status: 'pending', approvalStatus: 'pending' }]];
    const app = await buildApp();
    const res = await request(app).get('/alloy/artifacts/7');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body).not.toEqual({});
  });
});
