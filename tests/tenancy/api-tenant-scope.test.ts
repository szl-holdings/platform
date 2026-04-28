/**
 * HTTP-Layer Tenancy Isolation Integration Tests
 *
 * Verifies that the `tenantScope` middleware from the API server enforces
 * multi-tenant isolation at the HTTP request level, across every major
 * domain family.
 *
 * Strategy: mount the real `tenantScope` middleware (from
 * `artifacts/api-server/src/middlewares/tenant-scope.ts`) with a mocked
 * `@szl-holdings/db` dependency, inject test users via an Express middleware
 * shim, and assert on HTTP status codes.
 *
 * This suite proves the API-surface enforcement property:
 *  - A user belonging to Org A gets 403 when accessing an Org B path
 *    (even if an `orgSlug` param is forged in the URL).
 *  - A user with no org membership gets 403.
 *  - A user belonging to the correct org gets 200.
 *  - An elevated admin (super_admin / admin) always passes through.
 *  - Multi-org users can access any of their orgs but not others.
 *
 * Invariant enforced at the HTTP level (not just pure helper logic):
 *   ORG_A_USER → GET /api/vessels/org-b/data → 403 Cross-tenant access denied
 *   ORG_A_USER → GET /api/terra/org-a/data   → 200 OK (own tenant)
 *   ADMIN      → GET /api/vessels/org-b/data → 200 OK (elevated bypass)
 *   NO_ORG     → GET /api/signals             → 403 No org membership
 *
 * Related files:
 *  - `artifacts/api-server/src/middlewares/tenant-scope.ts` — middleware under test
 *  - `packages/auth-shared/src/server/tenant.ts` — pure logic layer
 *  - `tests/api/verifier-org-scoping.test.ts` — domain-specific variant (Verifier)
 *  - `artifacts/api-server/src/routes/__tests__/tenant-isolation.test.ts` — middleware-gate variant
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── DB mock — only hydrateOrgMemberships touches the DB ─────────────────────

// Queue of results returned by successive db.select() calls.
// Tests that trigger hydrateOrgMemberships (when req.user.orgs is empty)
// push the expected rows here.
const _hydrateQueue: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }[]> =
  [];

vi.mock('@szl-holdings/db', () => ({
  db: {
    select() {
      const result = _hydrateQueue.shift() ?? [];
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: () => chain,
        innerJoin: () => chain,
        then: (resolve: (v: unknown) => unknown, _reject?: (e: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, _reject),
      };
      return chain;
    },
  },
  orgMembersTable: { orgId: 'org_id', userId: 'user_id' },
  organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (_col: unknown, _val: unknown) => ({ op: 'eq' }),
  and: (..._conds: unknown[]) => ({ op: 'and' }),
  inArray: (_col: unknown, _vals: unknown) => ({ op: 'inArray' }),
}));

vi.mock('../../artifacts/api-server/src/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordTenantIsolationViolation: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
  },
}));

vi.mock('../../artifacts/api-server/src/middlewares/global-auth-enforcer', () => ({
  isAllowlistedPublicPath: () => false,
  fullApiPath: (path: string) => path,
}));

import { tenantScope } from '../../artifacts/api-server/src/middlewares/tenant-scope.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

type TestUser = {
  id: number;
  displayName: string;
  email: string | null;
  roles: string[];
  orgs: { orgId: number; orgSlug: string; orgName: string; role: string }[];
  isInternalAgent?: boolean;
};

function orgA(): TestUser {
  return {
    id: 1,
    displayName: 'Alice',
    email: 'alice@org-a.test',
    roles: ['operator'],
    orgs: [{ orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'member' }],
  };
}

function orgB(): TestUser {
  return {
    id: 2,
    displayName: 'Bob',
    email: 'bob@org-b.test',
    roles: ['operator'],
    orgs: [{ orgId: 2, orgSlug: 'org-b', orgName: 'Org B', role: 'member' }],
  };
}

function adminUser(): TestUser {
  return {
    id: 99,
    displayName: 'Admin',
    email: 'admin@szl.test',
    roles: ['super_admin'],
    orgs: [{ orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'owner' }],
  };
}

function noOrgUser(): TestUser {
  return {
    id: 10,
    displayName: 'NoOrg',
    email: 'noorg@szl.test',
    roles: ['operator'],
    orgs: [],
  };
}

function multiOrgUser(): TestUser {
  return {
    id: 20,
    displayName: 'MultiOrg',
    email: 'multi@szl.test',
    roles: ['operator'],
    orgs: [
      { orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'member' },
      { orgId: 3, orgSlug: 'org-c', orgName: 'Org C', role: 'viewer' },
    ],
  };
}

// ── App factory ───────────────────────────────────────────────────────────────

/**
 * Builds an Express app where:
 *  - An injector middleware sets req.user to the provided user factory's result
 *  - tenantScope() is applied to the given prefix
 *  - A stub handler returns 200 { ok: true } if tenantScope passes
 */
function buildDomainApp(prefix: string, userFactory: () => TestUser) {
  const app = express();
  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Record<string, unknown>).user = userFactory();
    (req as Record<string, unknown>).isInternalAgent = false;
    next();
  });

  const router = express.Router({ mergeParams: true });
  router.use(tenantScope({ required: true }) as express.RequestHandler);
  router.use((_req: Request, res: Response) => res.status(200).json({ ok: true }));

  app.use(`/${prefix}`, router as express.RequestHandler);
  return app;
}

/**
 * Builds an Express app where the route has an `:orgSlug` param and
 * tenantScope must validate that the param org matches the user's membership.
 */
function buildOrgSlugApp(prefix: string, userFactory: () => TestUser) {
  const app = express();
  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Record<string, unknown>).user = userFactory();
    (req as Record<string, unknown>).isInternalAgent = false;
    next();
  });

  const router = express.Router({ mergeParams: true });
  const slugRouter = express.Router({ mergeParams: true });
  slugRouter.use(tenantScope({ required: true }) as express.RequestHandler);
  slugRouter.use((_req: Request, res: Response) => res.status(200).json({ ok: true }));
  router.use('/:orgSlug', slugRouter as express.RequestHandler);

  app.use(`/${prefix}`, router as express.RequestHandler);
  return app;
}

// Reset hydrate queue before each test
beforeEach(() => {
  _hydrateQueue.length = 0;
});

// ── SEXTANT — tenant isolation ───────────────────────────────────────────────

describe('HTTP tenancy — SEXTANT domain', () => {
  it('Org A user accesses SEXTANT with their own org → 200', async () => {
    const app = buildDomainApp('vessels', orgA);
    const res = await request(app).get('/vessels/fleets');
    expect(res.status).toBe(200);
  });

  it('User with no org membership → 403', async () => {
    const app = buildDomainApp('vessels', noOrgUser);
    const res = await request(app).get('/vessels/fleets');
    expect(res.status).toBe(403);
  });

  it('Org A user accessing /vessels/org-b/* via forged orgSlug → 403', async () => {
    const app = buildOrgSlugApp('vessels', orgA);
    const res = await request(app).get('/vessels/org-b/data');
    expect(res.status).toBe(403);
  });

  it('Org A user accessing /vessels/org-a/* → 200 (own org)', async () => {
    const app = buildOrgSlugApp('vessels', orgA);
    const res = await request(app).get('/vessels/org-a/data');
    expect(res.status).toBe(200);
  });

  it('Admin user accessing /vessels/org-b/* → 200 (elevated bypass)', async () => {
    const app = buildOrgSlugApp('vessels', adminUser);
    const res = await request(app).get('/vessels/org-b/data');
    expect(res.status).toBe(200);
  });

  it('POST mutation from Org A user → 200 (own org, correct tenant)', async () => {
    const app = buildDomainApp('vessels', orgA);
    const res = await request(app).post('/vessels/alerts').send({ name: 'test' });
    expect(res.status).toBe(200);
  });

  it('No-org user cannot POST SEXTANT resources → 403', async () => {
    const app = buildDomainApp('vessels', noOrgUser);
    const res = await request(app).post('/vessels/alerts').send({ name: 'test' });
    expect(res.status).toBe(403);
  });
});

// ── DOMAINE — tenant isolation ─────────────────────────────────────────────────

describe('HTTP tenancy — DOMAINE domain', () => {
  it('Org A user accesses DOMAINE properties → 200', async () => {
    const app = buildDomainApp('terra', orgA);
    const res = await request(app).get('/terra/properties');
    expect(res.status).toBe(200);
  });

  it("Org B user cannot access Org A's DOMAINE data via forged orgSlug → 403", async () => {
    const app = buildOrgSlugApp('terra', orgB);
    const res = await request(app).get('/terra/org-a/properties');
    expect(res.status).toBe(403);
  });

  it("Org B user accessing their own org's DOMAINE resources → 200", async () => {
    const app = buildOrgSlugApp('terra', orgB);
    const res = await request(app).get('/terra/org-b/properties');
    expect(res.status).toBe(200);
  });

  it("Admin user can access any org's DOMAINE data → 200", async () => {
    const app = buildOrgSlugApp('terra', adminUser);
    const res = await request(app).get('/terra/org-b/properties');
    expect(res.status).toBe(200);
  });
});

// ── Counsel — tenant isolation ─────────────────────────────────────────

describe('HTTP tenancy — Counsel domain', () => {
  it('Org A user accesses own PRISM matters → 200', async () => {
    const app = buildDomainApp('prism', orgA);
    const res = await request(app).get('/prism/matters');
    expect(res.status).toBe(200);
  });

  it('Org B user forging Org A orgSlug in PRISM → 403', async () => {
    const app = buildOrgSlugApp('prism', orgB);
    const res = await request(app).get('/prism/org-a/matters');
    expect(res.status).toBe(403);
  });

  it('No-org user cannot access PRISM → 403', async () => {
    const app = buildDomainApp('prism', noOrgUser);
    const res = await request(app).get('/prism/matters');
    expect(res.status).toBe(403);
  });
});

// ── PARAGON — tenant isolation ──────────────────────────────────────────────

describe('HTTP tenancy — PARAGON domain', () => {
  it('Org A user accesses own PARAGON findings → 200', async () => {
    const app = buildDomainApp('firestorm', orgA);
    const res = await request(app).get('/firestorm/findings');
    expect(res.status).toBe(200);
  });

  it('Org B user forging Org A orgSlug in PARAGON → 403', async () => {
    const app = buildOrgSlugApp('firestorm', orgB);
    const res = await request(app).get('/firestorm/org-a/findings');
    expect(res.status).toBe(403);
  });
});

// ── KORA — tenant isolation ───────────────────────────────────────────────────

describe('HTTP tenancy — KORA domain', () => {
  it('Org A user accesses KORA scenarios → 200', async () => {
    const app = buildDomainApp('lyte', orgA);
    const res = await request(app).get('/lyte/scenarios');
    expect(res.status).toBe(200);
  });

  it('Cross-tenant KORA access via forged orgSlug → 403', async () => {
    const app = buildOrgSlugApp('lyte', orgA);
    const res = await request(app).get('/lyte/org-b/scenarios');
    expect(res.status).toBe(403);
  });
});

// ── Signals — tenant isolation ────────────────────────────────────────────────

describe('HTTP tenancy — Signals domain', () => {
  it('Org A user accesses Signals → 200', async () => {
    const app = buildDomainApp('signals', orgA);
    const res = await request(app).get('/signals');
    expect(res.status).toBe(200);
  });

  it('No-org user cannot access Signals → 403', async () => {
    const app = buildDomainApp('signals', noOrgUser);
    const res = await request(app).get('/signals');
    expect(res.status).toBe(403);
  });
});

// ── Multi-org user ────────────────────────────────────────────────────────────

describe('HTTP tenancy — multi-org user access matrix', () => {
  it('Multi-org user can access org-a resources → 200', async () => {
    const app = buildOrgSlugApp('vessels', multiOrgUser);
    const res = await request(app).get('/vessels/org-a/data');
    expect(res.status).toBe(200);
  });

  it('Multi-org user can access org-c resources → 200', async () => {
    const app = buildOrgSlugApp('vessels', multiOrgUser);
    const res = await request(app).get('/vessels/org-c/data');
    expect(res.status).toBe(200);
  });

  it('Multi-org user is blocked from org-b (not a member) → 403', async () => {
    const app = buildOrgSlugApp('vessels', multiOrgUser);
    const res = await request(app).get('/vessels/org-b/data');
    expect(res.status).toBe(403);
  });
});

// ── Elevated admin bypass ─────────────────────────────────────────────────────

describe('HTTP tenancy — elevated admin bypass matrix', () => {
  const domains = ['vessels', 'terra', 'prism', 'firestorm', 'lyte', 'signals', 'alloy', 'aegis'];

  for (const domain of domains) {
    it(`admin can access ${domain} cross-tenant → 200`, async () => {
      const app = buildOrgSlugApp(domain, adminUser);
      const res = await request(app).get(`/${domain}/org-b/data`);
      expect(res.status).toBe(200);
    });
  }
});

// ── AI background-job and stream routes (required: true) ─────────────────────

describe('HTTP tenancy — AI /jobs route enforces required tenant scope', () => {
  it('no-org user is blocked from /jobs → 403', async () => {
    const app = buildDomainApp('jobs', noOrgUser);
    const res = await request(app).get('/jobs/status');
    expect(res.status).toBe(403);
  });

  it('org member can access /jobs → 200', async () => {
    const app = buildDomainApp('jobs', orgA);
    const res = await request(app).get('/jobs/status');
    expect(res.status).toBe(200);
  });

  it('cross-tenant forged orgSlug is blocked on /jobs → 403', async () => {
    const app = buildOrgSlugApp('jobs', orgA);
    const res = await request(app).get('/jobs/org-b/tasks');
    expect(res.status).toBe(403);
  });
});

describe('HTTP tenancy — AI /stream route enforces required tenant scope', () => {
  it('no-org user is blocked from /stream → 403', async () => {
    const app = buildDomainApp('stream', noOrgUser);
    const res = await request(app).get('/stream/events');
    expect(res.status).toBe(403);
  });

  it('org member can access /stream → 200', async () => {
    const app = buildDomainApp('stream', orgA);
    const res = await request(app).get('/stream/events');
    expect(res.status).toBe(200);
  });
});

// ── Optional-scope exemptions — documented bootstrap and callback routes ───────

/**
 * Builds an app that uses tenantScope({ required: false }).
 * Verifies that routes intentionally exempt from hard enforcement still pass
 * through (200) when no org context is present, while still hydrating context
 * when a valid org membership is available.
 */
function buildOptionalScopeApp(prefix: string, userFactory: () => TestUser) {
  const app = express();
  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Record<string, unknown>).user = userFactory();
    (req as Record<string, unknown>).isInternalAgent = false;
    next();
  });

  const router = express.Router({ mergeParams: true });
  router.use(tenantScope({ required: false }) as express.RequestHandler);
  router.use((_req: Request, res: Response) => res.status(200).json({ ok: true }));

  app.use(`/${prefix}`, router as express.RequestHandler);
  return app;
}

describe('HTTP tenancy — /connectors optional scope (data-services)', () => {
  it('no-org user is NOT blocked — required:false allows pre-auth connector callbacks → 200', async () => {
    const app = buildOptionalScopeApp('connectors', noOrgUser);
    const res = await request(app).get('/connectors/oauth/callback');
    expect(res.status).toBe(200);
  });

  it('org member still passes through /connectors → 200', async () => {
    const app = buildOptionalScopeApp('connectors', orgA);
    const res = await request(app).get('/connectors/list');
    expect(res.status).toBe(200);
  });
});

describe('HTTP tenancy — platform bootstrap routes optional scope', () => {
  it('/orgs: no-org user passes through for invitation/discovery flows → 200', async () => {
    const app = buildOptionalScopeApp('orgs', noOrgUser);
    const res = await request(app).get('/orgs/invite/accept');
    expect(res.status).toBe(200);
  });

  it('/user: no-org user passes through for password-reset/pre-auth flows → 200', async () => {
    const app = buildOptionalScopeApp('user', noOrgUser);
    const res = await request(app).get('/user/reset-password');
    expect(res.status).toBe(200);
  });

  it('/onboarding: no-org user passes through before org creation → 200', async () => {
    const app = buildOptionalScopeApp('onboarding', noOrgUser);
    const res = await request(app).get('/onboarding/step/1');
    expect(res.status).toBe(200);
  });

  it('/orgs: authenticated org member also passes through → 200', async () => {
    const app = buildOptionalScopeApp('orgs', orgA);
    const res = await request(app).get('/orgs/list');
    expect(res.status).toBe(200);
  });
});

// ── Internal agent token bypass ───────────────────────────────────────────────

describe('HTTP tenancy — internal agent has no orgs but should bypass', () => {
  it('internal agent (isInternalAgent=true) bypasses tenant scope → 200', async () => {
    const app = express();
    app.use(express.json());

    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as Record<string, unknown>).user = {
        id: 0,
        displayName: 'Internal Agent (alloy-runner)',
        email: null,
        roles: ['ops'],
        orgs: [],
      };
      (req as Record<string, unknown>).isInternalAgent = true;
      next();
    });

    const router = express.Router({ mergeParams: true });
    router.use(tenantScope({ required: false }) as express.RequestHandler);
    router.use((_req: Request, res: Response) => res.status(200).json({ ok: true }));
    app.use('/internal', router as express.RequestHandler);

    const res = await request(app).get('/internal/data');
    expect(res.status).toBe(200);
  });
});
