/**
 * Vessels Cognitive Routes — End-to-End Tests (Task #1234)
 *
 * Covers the 5 `/api/vessels/cognitive/*` endpoints:
 *   - GET /vessels/cognitive/owner-graph
 *   - GET /vessels/cognitive/route-anomalies
 *   - GET /vessels/cognitive/sanctions-chain/:vesselImo
 *   - GET /vessels/cognitive/counterparty-risk
 *   - GET /vessels/cognitive/voyage-twin/:voyageRef
 *
 * Each endpoint asserts:
 *   - HTTP 200 with the expected top-level response shape
 *   - `provenance.verifierApproved === true`
 *   - `provenance.freshness.fetchedAt` is a valid ISO timestamp
 *   - `provenance.attestation` contains "NEXUS-VERIFIER"
 *   - Unauthenticated requests are rejected with HTTP 401
 *
 * The 401 contract is enforced upstream by `tenantScope({ required: true })`
 * which is applied to the `/vessels` group in `routes/groups/vessels.ts`.
 * To exercise that contract here, the test mounts the cognitive router
 * behind a mocked auth middleware (driven by an `x-test-auth` header)
 * and the real `tenantScope({ required: true })` middleware.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted before any route import
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  const makeChain = (): unknown => {
    const target: unknown = () => makeChain();
    return new Proxy(target as object, {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: (v: unknown[]) => void, reject?: (e: unknown) => void) =>
            Promise.resolve([]).then(resolve, reject);
        }
        if (prop === Symbol.toPrimitive) return undefined;
        return () => makeChain();
      },
      apply() {
        return makeChain();
      },
    });
  };
  const db = {
    select: () => makeChain(),
    insert: () => makeChain(),
    update: () => makeChain(),
    delete: () => makeChain(),
  };
  return new Proxy(
    { db },
    {
      get(target, prop) {
        if (prop in target) return (target as Record<string | symbol, unknown>)[prop];
        // Auto-stub any imported table/symbol the routes reference.
        return {};
      },
    },
  );
});

const mockUser = {
  id: 7,
  displayName: 'Cognitive Test User',
  email: 'cog-test@example.com',
  roles: ['admin'],
  orgs: [{ orgId: 1, orgSlug: 'test-org', orgName: 'Test Org', role: 'admin' }],
};

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: () => (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers['x-test-auth'] === 'yes') {
      (req as Request & { user: typeof mockUser }).user = mockUser;
    }
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// ---------------------------------------------------------------------------
// Build app — mount tenantScope (real) + cognitive router behind it
// ---------------------------------------------------------------------------

const { tenantScope } = await import('../middlewares/tenant-scope.js');
const { default: cognitiveRouter } = await import('../routes/vessels-cognitive.js');

// A lightweight auth simulator at the app boundary that reads the same
// `x-test-auth` header used by the mocked authMiddleware. tenantScope
// inspects `req.user` and short-circuits with 401 when absent.
const authSimulator = (req: Request, _res: Response, next: NextFunction) => {
  if (req.headers['x-test-auth'] === 'yes') {
    (req as Request & { user: typeof mockUser }).user = mockUser;
  }
  next();
};

const app = express();
app.use(express.json());
app.use('/api', authSimulator, tenantScope({ required: true }), cognitiveRouter);
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err.message });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ProvenanceShape {
  sources: string[];
  confidence: number;
  verifierApproved: boolean;
  freshness: { fetchedAt: string; ageSeconds: number; ttlSeconds: number };
  attestation: string;
}

function expectProvenance(prov: unknown): void {
  expect(prov).toBeDefined();
  const p = prov as ProvenanceShape;
  expect(p.verifierApproved).toBe(true);
  expect(typeof p.attestation).toBe('string');
  expect(p.attestation).toContain('NEXUS-VERIFIER');
  expect(p.freshness).toBeDefined();
  expect(typeof p.freshness.fetchedAt).toBe('string');
  const t = Date.parse(p.freshness.fetchedAt);
  expect(Number.isNaN(t)).toBe(false);
  expect(new Date(t).toISOString()).toBe(p.freshness.fetchedAt);
}

const COGNITIVE_PATHS: Array<{ name: string; path: string }> = [
  { name: 'owner-graph', path: '/api/vessels/cognitive/owner-graph' },
  { name: 'route-anomalies', path: '/api/vessels/cognitive/route-anomalies' },
  { name: 'sanctions-chain', path: '/api/vessels/cognitive/sanctions-chain/9234567' },
  { name: 'counterparty-risk', path: '/api/vessels/cognitive/counterparty-risk' },
  { name: 'voyage-twin', path: '/api/vessels/cognitive/voyage-twin/VOY-2026-001' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Vessels cognitive endpoints — unauthenticated requests return 401', () => {
  for (const { name, path } of COGNITIVE_PATHS) {
    it(`${name}: returns 401 without auth`, async () => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    });
  }
});

describe('GET /vessels/cognitive/owner-graph — happy path', () => {
  it('returns 200 with graph + provenance', async () => {
    const res = await request(app)
      .get('/api/vessels/cognitive/owner-graph')
      .set('x-test-auth', 'yes');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.graph).toBeDefined();
    const graph = body.graph as { nodes: unknown[]; edges: unknown[] };
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.edges)).toBe(true);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(body.stats).toBeDefined();
    expectProvenance(body.provenance);
  });
});

describe('GET /vessels/cognitive/route-anomalies — happy path', () => {
  it('returns 200 with alerts + provenance', async () => {
    const res = await request(app)
      .get('/api/vessels/cognitive/route-anomalies')
      .set('x-test-auth', 'yes');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(Array.isArray(body.alerts)).toBe(true);
    expect(body.summary).toBeDefined();
    expect(Array.isArray(body.expectedRoutes)).toBe(true);
    expectProvenance(body.provenance);
  });
});

describe('GET /vessels/cognitive/sanctions-chain/:vesselImo — happy path', () => {
  it('returns 200 with chain + analysis + provenance for a known IMO', async () => {
    const res = await request(app)
      .get('/api/vessels/cognitive/sanctions-chain/9234567')
      .set('x-test-auth', 'yes');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.vesselImo).toBe('9234567');
    expect(Array.isArray(body.chain)).toBe(true);
    expect((body.chain as unknown[]).length).toBeGreaterThan(0);
    expect(body.analysis).toBeDefined();
    expect(Array.isArray(body.sanctionLists)).toBe(true);
    expect(typeof body.recommendation).toBe('string');
    expectProvenance(body.provenance);
  });

  it('returns 200 with default chain for an unknown IMO', async () => {
    const res = await request(app)
      .get('/api/vessels/cognitive/sanctions-chain/0000000')
      .set('x-test-auth', 'yes');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.vesselImo).toBe('0000000');
    expect(Array.isArray(body.chain)).toBe(true);
    expectProvenance(body.provenance);
  });
});

describe('GET /vessels/cognitive/counterparty-risk — happy path', () => {
  it('returns 200 with counterparties + portfolio + provenance', async () => {
    const res = await request(app)
      .get('/api/vessels/cognitive/counterparty-risk')
      .set('x-test-auth', 'yes');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(Array.isArray(body.counterparties)).toBe(true);
    expect((body.counterparties as unknown[]).length).toBeGreaterThan(0);
    expect(body.portfolio).toBeDefined();
    const portfolio = body.portfolio as Record<string, unknown>;
    expect(typeof portfolio.totalExposureUsd).toBe('number');
    expect(typeof portfolio.totalCounterparties).toBe('number');
    expectProvenance(body.provenance);
  });
});

describe('GET /vessels/cognitive/voyage-twin/:voyageRef — happy path', () => {
  it('returns 200 with snapshots + timeline + provenance for a known ref', async () => {
    const res = await request(app)
      .get('/api/vessels/cognitive/voyage-twin/VOY-2026-001')
      .set('x-test-auth', 'yes');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.voyageRef).toBe('VOY-2026-001');
    expect(Array.isArray(body.snapshots)).toBe(true);
    expect((body.snapshots as unknown[]).length).toBeGreaterThan(0);
    expect(body.timeline).toBeDefined();
    expect(body.performance).toBeDefined();
    expect(Array.isArray(body.whatIfScenarios)).toBe(true);
    expectProvenance(body.provenance);
  });

  it("normalises 'latest' to the default voyage reference", async () => {
    const res = await request(app)
      .get('/api/vessels/cognitive/voyage-twin/latest')
      .set('x-test-auth', 'yes');
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.voyageRef).toBe('VOY-2026-001');
    expectProvenance(body.provenance);
  });
});
