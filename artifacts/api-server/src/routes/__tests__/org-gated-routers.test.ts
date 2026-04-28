/**
 * Org-Gated Router Integration Tests
 *
 * Verifies the `tenantScope({ required: true })` guard wired into the
 * routers tightened by task #718:
 *   - consciousness.ts  → router.use("/nuro-mesh/consciousness", tenantScope({ required: true }))
 *   - agent-os.ts       → router.use("/agent-os",                tenantScope({ required: true }))
 *   - alloy-digest.ts   → router.use("/alloy/digest",            tenantScope({ required: true }))
 *   - copilot.ts        → router.use(                            tenantScope({ required: true }))
 *
 * For every router we assert:
 *   1. An authenticated caller WITH NO org membership receives 403
 *      ("No organization membership"). This is the regression guard:
 *      if a future change re-loosens `required` to `false`, these
 *      tests will fail loudly.
 *   2. A super_admin (and an admin) caller bypasses the org check and
 *      reaches the route layer (status is NOT 403 from tenantScope).
 *   3. A regular caller WITH a valid org membership reaches the route
 *      layer (status is NOT 403 from tenantScope).
 *
 * We mount each real router and verify status codes; the auth and
 * other unrelated middlewares are stubbed so the test pinpoints the
 * tenant guard and is not affected by per-route role gating, body
 * validation, or live LLM/DB calls.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------- @szl-holdings/db -----------------------------------------------
// tenantScope hydrates org memberships from the DB when req.user.orgs is
// empty. We return a chain that resolves to [] so the no-org user truly
// has no orgs after hydration. Other route handlers that touch the DB
// are isolated by mocking auth/validation downstream.
vi.mock('@szl-holdings/db', () => {
  const chain: Record<string, unknown> = {};
  Object.assign(chain, {
    from: () => chain,
    where: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    orderBy: () => chain,
    groupBy: () => chain,
    limit: () => Promise.resolve([]),
    set: () => chain,
    values: () => chain,
    onConflictDoNothing: () => Promise.resolve(),
    onConflictDoUpdate: () => chain,
    returning: () => Promise.resolve([]),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve([]).then(resolve, reject),
  });
  return {
    db: {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
    // Tables referenced by the routers under test or by tenant-scope itself.
    orgMembersTable: { orgId: 'org_id', userId: 'user_id' },
    organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
    consciousnessSnapshotsTable: { createdAt: 'created_at' },
    consciousnessMonologueTable: { createdAt: 'created_at' },
    consciousnessGoalsTable: { createdAt: 'created_at' },
    consciousnessAgentProfilesTable: {},
    consciousnessEmotionalHistoryTable: { createdAt: 'created_at' },
    consciousnessTemporalMetricsTable: { createdAt: 'created_at' },
    alloyWorkflows: { status: 'status', createdAt: 'created_at' },
    alloyApprovals: {},
    alloySignals: { severity: 'severity', createdAt: 'created_at' },
    alloyActions: {},
    notificationPreferencesTable: { userId: 'user_id', digestConfig: 'digest_config' },
    auditEventsTable: {},
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  desc: (_c: unknown) => ({ op: 'desc' }),
  asc: (_c: unknown) => ({ op: 'asc' }),
  gte: (_c: unknown, _v: unknown) => ({ op: 'gte' }),
  count: () => ({ op: 'count' }),
  sum: () => ({ op: 'sum' }),
  avg: () => ({ op: 'avg' }),
  sql: (_s: TemplateStringsArray, ..._v: unknown[]) => ({ op: 'sql' }),
  relations: (..._a: unknown[]) => ({}),
}));

// ---------- Auth middleware passthrough ------------------------------------
// The user is injected by the per-test middleware below. authMiddleware,
// requireRole, etc. are stubbed so the test isolates the tenantScope guard
// from per-route role checks.
vi.mock('../../middlewares/auth', () => ({
  authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../lib/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/validation')>();
  return {
    ...actual,
    validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
    validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  };
});

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/internal-tokens', () => ({
  verifyInternalHeader: () => null,
  tokenHasScope: () => false,
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordAuthFailure: vi.fn() },
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (_shape: unknown) => ({ parse: (v: unknown) => v }),
}));

// ---------- Router-specific external deps ----------------------------------
vi.mock('@szl-holdings/ai-engine', () => ({
  captureConsciousnessSnapshot: () => ({ ok: true }),
  metacognitiveMonitor: { getState: () => ({}) },
  selfModelEngine: { getSelfModel: () => ({}) },
  cognitiveWorkspace: { getState: () => ({}) },
  innerMonologue: { getState: () => ({ recentThoughts: [] }) },
  goalEngine: { getState: () => ({}) },
  emotionalSignals: { getState: () => ({}) },
  temporalAwareness: { getState: () => ({}) },
  predictiveProcessing: { getState: () => ({}) },
  dreamConsolidation: { getState: () => ({}) },
}));

vi.mock('@szl-holdings/ai-engine/providers/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'hello from test' } }],
        }),
      },
    },
  },
  createResponse: vi.fn().mockResolvedValue({ content: 'hello from test' }),
  createResponseStream: vi.fn().mockImplementation(async function* () {
    yield 'hello from test';
  }),
}));

vi.mock('@szl-holdings/ai-engine/providers/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'hello from test' }],
      }),
      stream: vi.fn(),
    },
  },
}));

vi.mock('../../services/ai/call-model', () => ({
  callModel: vi.fn().mockResolvedValue({ content: 'mocked', usage: { total: 0 } }),
  enforceBudgetForOrg: vi.fn().mockResolvedValue(undefined),
  recordModelUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('express-rate-limit', () => ({
  default: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@szl-holdings/services', () => ({
  services: {
    ai: { chatCompletion: vi.fn().mockResolvedValue({ content: '' }) },
  },
}));

vi.mock('../../lib/agent-scheduler', () => ({
  agentScheduler: {
    getStats: () => ({ schedules: [], isRunning: true, agentCount: 0 }),
    getRunHistory: () => [],
    runAgent: vi.fn().mockResolvedValue({ id: 'x' }),
  },
}));

vi.mock('../../lib/knowledge-store', () => ({
  knowledgeStore: { getStats: () => ({}), search: () => [] },
}));

vi.mock('../../lib/event-bus', () => ({
  agentEventBus: {
    getStats: () => ({}),
    getEvents: () => [],
    getDomainFeed: () => [],
    getCrossDomainFeed: () => [],
  },
}));

// ---------------------------------------------------------------------------

type OrgMembership = { orgId: number; orgSlug: string; orgName: string; role: string };
type TestUser = {
  id: number;
  displayName: string;
  email: string;
  roles: string[];
  orgs: OrgMembership[];
};

function noOrgUser(): TestUser {
  return {
    id: 100,
    displayName: 'Eve',
    email: 'eve@nowhere.example',
    roles: ['member'],
    orgs: [],
  };
}

function superAdminUser(): TestUser {
  return {
    id: 1,
    displayName: 'Root',
    email: 'root@szl.example',
    roles: ['super_admin'],
    orgs: [],
  };
}

function adminUser(): TestUser {
  return {
    id: 2,
    displayName: 'Admin',
    email: 'admin@szl.example',
    roles: ['admin'],
    orgs: [],
  };
}

function orgMemberUser(): TestUser {
  return {
    id: 10,
    displayName: 'Alice',
    email: 'alice@org-a.example',
    roles: ['member'],
    orgs: [{ orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'member' }],
  };
}

function injectUser(factory: () => TestUser) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { user: TestUser }).user = factory();
    next();
  };
}

const routerLoaders = {
  consciousness: () => import('../consciousness'),
  'agent-os': () => import('../agent-os'),
  'alloy-digest': () => import('../alloy-digest'),
  copilot: () => import('../copilot'),
} as const;

async function buildApp(routerSpec: keyof typeof routerLoaders, userFactory: () => TestUser) {
  const mod = await routerLoaders[routerSpec]();
  const router = (mod as { default: express.Router }).default;
  const app = express();
  app.use(express.json());
  app.use(injectUser(userFactory));
  app.use(router);
  return app;
}

/**
 * For each router we hit a real protected endpoint under the prefix
 * gated by tenantScope. With downstream auth/role/validation stubbed to
 * passthrough, a 200 from elevated and org-member callers proves the
 * full request flowed through tenantScope; a 403 from a no-org caller
 * proves the guard is wired and rejecting.
 */
type RouterName = keyof typeof routerLoaders;

interface RouteCase {
  name: RouterName;
  method: 'get' | 'post';
  path: string;
  /** Body sent on the request — must produce 200 from the real handler when the user is allowed in. */
  body?: Record<string, unknown>;
}

const cases: RouteCase[] = [
  { name: 'consciousness', method: 'get', path: '/nuro-mesh/consciousness/snapshot' },
  { name: 'agent-os', method: 'get', path: '/agent-os/status' },
  { name: 'alloy-digest', method: 'get', path: '/alloy/digest/history' },
  {
    name: 'copilot',
    method: 'post',
    path: '/copilot/chat',
    body: {
      messages: [{ role: 'user', content: 'hi' }],
      stream: false,
    },
  },
];

async function send(
  app: express.Express,
  method: 'get' | 'post',
  path: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; body: { error?: string } }> {
  const agent = request(app);
  const req = method === 'get' ? agent.get(path) : agent.post(path).send(body ?? {});
  return req as unknown as Promise<{ status: number; body: { error?: string } }>;
}

describe('Org-gated routers reject unauthorized callers (task #1329 / regression for #718)', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  for (const c of cases) {
    describe(`${c.name} router — ${c.method.toUpperCase()} ${c.path}`, () => {
      it('returns 403 when the caller has a valid auth context but NO org membership', async () => {
        const app = await buildApp(c.name, noOrgUser);
        const res = await send(app, c.method, c.path, c.body);
        expect(res.status).toBe(403);
        expect(res.body?.error).toMatch(/no organization membership/i);
      });

      it('returns 200 for super_admin callers (org check bypassed)', async () => {
        const app = await buildApp(c.name, superAdminUser);
        const res = await send(app, c.method, c.path, c.body);
        expect(res.status).toBe(200);
      });

      it('returns 200 for admin callers (org check bypassed)', async () => {
        const app = await buildApp(c.name, adminUser);
        const res = await send(app, c.method, c.path, c.body);
        expect(res.status).toBe(200);
      });

      it('returns 200 for callers with a valid org membership', async () => {
        const app = await buildApp(c.name, orgMemberUser);
        const res = await send(app, c.method, c.path, c.body);
        expect(res.status).toBe(200);
      });
    });
  }
});
