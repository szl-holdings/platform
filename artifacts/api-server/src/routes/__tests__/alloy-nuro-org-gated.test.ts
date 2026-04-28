/**
 * Org-Gated Router Integration Tests — Alloy/Nuro tightening (task #2635)
 *
 * Verifies the `tenantScope({ required: true })` guard wired into the
 * routers tightened by task #2635:
 *   - nuro-mesh.ts        → router.use(tenantScope({ required: true }))
 *   - alloy-skills.ts     → router.use(tenantScope({ required: true }))
 *   - alloy-governance.ts → router.use(tenantScope({ required: true }))
 *
 * Before this task each of these routers used `required: false`. They
 * are mounted under group prefixes that already enforce
 * `required: true`, but defense-in-depth requires the inner gate to
 * also reject no-org callers so the file is safe to mount anywhere.
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
 * We mount each real router and verify status codes; auth and other
 * unrelated middlewares are stubbed so the test pinpoints the tenant
 * guard and is not affected by per-route role gating, body validation,
 * or live LLM/DB calls.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------- @szl-holdings/db -----------------------------------------------
// tenantScope hydrates org memberships from the DB when req.user.orgs is
// empty. The chain returns [] for every read so the no-org user truly
// has no orgs after hydration. The chain itself is thenable AND exposes
// `.offset()` so handlers like `/alloy/policies` and `/alloy/skills`
// (which call `.limit(n).offset(m)`) resolve to an empty array.
vi.mock('@szl-holdings/db', () => {
  const chain: Record<string, unknown> = {};
  Object.assign(chain, {
    from: () => chain,
    where: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    orderBy: () => chain,
    groupBy: () => chain,
    limit: () => chain,
    offset: () => Promise.resolve([]),
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
    // alloy-skills + alloy-governance
    alloySkillRegistryTable: {
      skillId: 'skill_id',
      capability: 'capability',
      domain: 'domain',
      isActive: 'is_active',
      isBuiltin: 'is_builtin',
      updatedAt: 'updated_at',
    },
    alloyPoliciesTable: {
      id: 'id',
      orgId: 'org_id',
      kind: 'kind',
      status: 'status',
      updatedAt: 'updated_at',
    },
    alloyGovernanceIncidentsTable: {
      id: 'id',
      orgId: 'org_id',
      resolvedAt: 'resolved_at',
    },
    alloyConfidenceAlerts: { resolvedAt: 'resolved_at' },
    alloyUsageEventsTable: { orgId: 'org_id', recordedAt: 'recorded_at' },
    // nuro-mesh
    agentMemoryFacts: {
      agentId: 'agent_id',
      domain: 'domain',
      expiresAt: 'expires_at',
    },
    agentUsageStats: { agentId: 'agent_id', recordedAt: 'recorded_at' },
    agentToolCalls: {},
    advisoryFindings: {},
    orchestrationTelemetryTable: {},
    redTeamFindingsTable: {},
    predictivePrecomputeCacheTable: {},
    agentPromptEvolutionTable: {},
  };
});

vi.mock('drizzle-orm', () => {
  const sqlFn = (_s: TemplateStringsArray, ..._v: unknown[]) => ({ op: 'sql' });
  (sqlFn as unknown as { join: (parts: unknown[], sep: unknown) => unknown }).join = (
    parts: unknown[],
    sep: unknown,
  ) => ({ op: 'sql.join', parts, sep });
  return {
    eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
    and: (...conds: unknown[]) => ({ op: 'and', conds }),
    or: (...conds: unknown[]) => ({ op: 'or', conds }),
    not: (c: unknown) => ({ op: 'not', c }),
    desc: (_c: unknown) => ({ op: 'desc' }),
    asc: (_c: unknown) => ({ op: 'asc' }),
    gt: (_c: unknown, _v: unknown) => ({ op: 'gt' }),
    gte: (_c: unknown, _v: unknown) => ({ op: 'gte' }),
    lt: (_c: unknown, _v: unknown) => ({ op: 'lt' }),
    lte: (_c: unknown, _v: unknown) => ({ op: 'lte' }),
    isNull: (_c: unknown) => ({ op: 'isNull' }),
    isNotNull: (_c: unknown) => ({ op: 'isNotNull' }),
    inArray: (_c: unknown, _v: unknown[]) => ({ op: 'inArray' }),
    count: () => ({ op: 'count' }),
    sum: () => ({ op: 'sum' }),
    avg: () => ({ op: 'avg' }),
    sql: sqlFn,
    relations: (..._a: unknown[]) => ({}),
  };
});

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
  skillRegistry: { getAll: () => [], get: () => undefined },
}));

vi.mock('@szl-holdings/ai-engine/providers/openai', () => ({
  openai: {
    chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [] }) } },
  },
}));

vi.mock('@szl-holdings/ai-engine/providers/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({ content: [] }),
      stream: vi.fn(),
    },
  },
}));

vi.mock('@szl-holdings/ai-engine/providers/gemini', () => ({
  ai: { generateContent: vi.fn().mockResolvedValue({ text: '' }) },
}));

vi.mock('express-rate-limit', () => ({
  default: () => (_req: Request, _res: Response, next: NextFunction) => next(),
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
  return { id: 100, displayName: 'Eve', email: 'eve@nowhere.example', roles: ['member'], orgs: [] };
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
  return { id: 2, displayName: 'Admin', email: 'admin@szl.example', roles: ['admin'], orgs: [] };
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
  'nuro-mesh': () => import('../nuro-mesh'),
  'alloy-skills': () => import('../alloy-skills'),
  'alloy-governance': () => import('../alloy-governance'),
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

type RouterName = keyof typeof routerLoaders;

interface RouteCase {
  name: RouterName;
  method: 'get' | 'post';
  path: string;
  body?: Record<string, unknown>;
}

const cases: RouteCase[] = [
  { name: 'nuro-mesh', method: 'get', path: '/nuro-mesh/agents' },
  { name: 'alloy-skills', method: 'get', path: '/alloy/skills' },
  { name: 'alloy-governance', method: 'get', path: '/alloy/policies' },
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

describe('Alloy/Nuro org-gated routers reject unauthorized callers (regression for task #2635)', () => {
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
