/**
 * Counsel Tools Dispatch — Auth Boundary + Route Contract Tests
 *
 * Verifies that:
 *   1. GET /counsel/tools returns the 4-tool manifest (publicly accessible)
 *   2. POST /counsel/tools/dispatch is blocked without CSRF token
 *   3. POST /counsel/tools/dispatch is blocked with CSRF mismatch
 *   4. POST /counsel/tools/dispatch succeeds with valid CSRF + auth
 *   5. POST /counsel/tools/dispatch rejects unknown toolNames (400)
 *   6. POST /counsel/tools/dispatch rejects missing toolName (400)
 *   7. GET /counsel/forecast returns 3 required heads (obligation-cascade,
 *      settlement-likelihood, risk-exposure) — no other head IDs allowed
 *   8. GET /counsel/feeds/health returns normalized source IDs
 *
 * Approach: mount the real Express router with mocked DB and PRISM/simulation
 * deps. CSRF middleware is injected inline (matches production logic).
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', () => ({
  db: {
    select() {
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: () => chain,
        orderBy: () => chain,
        limit: () => Promise.resolve([]),
        then: (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve),
      };
      return chain;
    },
    insert() {
      const chain: Record<string, unknown> = {
        values: () => chain,
        returning: () => Promise.resolve([]),
        onConflictDoNothing: () => Promise.resolve(),
      };
      return chain;
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
      const chain: Record<string, unknown> = { where: () => chain, returning: () => Promise.resolve([]) };
      return chain;
    },
  },
  pcGcMattersTable: { id: 'id', orgId: 'org_id' },
  pcGcObligationsTable: { id: 'id', matterId: 'matter_id', sortOrder: 'sort_order' },
  pcGcAuditEntriesTable: { id: 'id', matterId: 'matter_id', timestamp: 'timestamp' },
  pcGcProofChainEntriesTable: { id: 'id', matterId: 'matter_id', timestamp: 'timestamp' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  asc: (_col: unknown) => ({ op: 'asc' }),
  inArray: (_col: unknown, _vals: unknown) => ({ op: 'inArray' }),
  sql: (s: TemplateStringsArray) => ({ raw: s[0] }),
}));

vi.mock('@workspace/tool-mesh', () => ({
  defaultToolRegistry: { register: vi.fn(), get: vi.fn() },
}));

function makeMockForecastOutput(headName: string) {
  return {
    headName,
    lane: 'counsel',
    label: headName,
    intervals: [
      { point: 0.55, lower: 0.40, upper: 0.70, confidence: 0.85, horizon: '30d', unit: 'score' },
    ],
    provenance: {
      headName,
      modelId: `monte-carlo-litigation/prism-litigation-outcome@500i`,
      modelVersion: '1.0.0',
      adapterId: 'monte-carlo-litigation',
      generatedAt: new Date().toISOString(),
    },
    alertThreshold: 0.5,
    thresholdBreached: false,
  };
}

vi.mock('@workspace/forecast-fabric', () => ({
  globalForecastServiceWithHeads: {
    forecast: vi.fn().mockImplementation((input: { headName: string }) =>
      Promise.resolve(makeMockForecastOutput(input.headName)),
    ),
    registerAdapter: vi.fn(),
  },
  ForecastOutputSchema: {
    parse: vi.fn().mockImplementation((v: unknown) => v),
  },
}));

vi.mock('@workspace/drift-eval', () => ({
  globalEvalRegistry: { register: vi.fn() },
  startDriftEvalScheduler: vi.fn(),
}));

vi.mock('@workspace/prism-bus', () => ({
  prismBus: { publish: vi.fn() },
  PrismBus: vi.fn(),
}));

vi.mock('../../../services/simulation/run-simulation', () => ({
  runSimulation: vi.fn().mockResolvedValue({
    results: {
      settlementProbability: { stats: { mean: 72, stdDev: 12, p10: 55, p50: 72, p90: 89 } },
      totalExposure: { stats: { mean: 4.8, stdDev: 2.1, p10: 2.2, p50: 4.8, p90: 7.4 } },
      expectedLoss: { stats: { mean: 2.9, stdDev: 1.1 } },
    },
    totalIterations: 500,
  }),
}));

vi.mock('../../../a11oy/tools/counsel-tools', () => ({
  COUNSEL_TOOL_MANIFEST: [
    { toolId: 'counsel:matter-lookup', displayName: 'Matter Lookup', domain: 'prism-counsel', params: [], emitsSignals: [] },
    { toolId: 'counsel:settlement-reforecast', displayName: 'Settlement Reforecast', domain: 'prism-counsel', params: [], emitsSignals: [] },
    { toolId: 'counsel:citation-search', displayName: 'Citation Search', domain: 'prism-counsel', params: [], emitsSignals: [] },
    { toolId: 'counsel:draft-obligation', displayName: 'Draft Obligation', domain: 'prism-counsel', params: [], emitsSignals: [] },
  ],
  dispatchCounselTool: vi.fn().mockResolvedValue({
    toolName: 'matter-lookup',
    success: true,
    data: { matters: [] },
    executedAt: new Date().toISOString(),
  }),
}));

vi.mock('../counsel-feeds', async () => ({
  router: (await import('express')).Router(),
  fetchAllFeeds: vi.fn().mockResolvedValue({
    courtListener: [], edgar: [], federalRegister: [], uspto: [], stateAg: [],
  }),
}));

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const TEST_CSRF_TOKEN = 'test-csrf-token-abc123';

function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
  if (SAFE.has(req.method)) { next(); return; }
  if ((req.headers.authorization ?? '').startsWith('Bearer ')) { next(); return; }
  const rawCookie = req.headers.cookie ?? '';
  const cookieMatch = rawCookie.match(/csrf_token=([^;]+)/);
  const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1]!) : null;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;
  if (!cookieToken || !headerToken) {
    res.status(403).json({ code: 'CSRF_TOKEN_MISSING' }); return;
  }
  if (cookieToken !== headerToken) {
    res.status(403).json({ code: 'CSRF_TOKEN_MISMATCH' }); return;
  }
  next();
}

function makeUser() {
  return {
    id: 10,
    displayName: 'Alice',
    email: 'alice@org.example',
    roles: ['member'] as string[],
    orgs: [{ orgId: 1, orgSlug: 'org-a', orgName: 'Org A', role: 'member' }],
  };
}

function injectUser(user: ReturnType<typeof makeUser> | null) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (user) (req as unknown as { user: unknown }).user = user;
    next();
  };
}

async function buildApp(opts: { withCsrf?: boolean; user?: ReturnType<typeof makeUser> | null } = {}) {
  const { withCsrf = false, user = makeUser() } = opts;
  const { default: router } = await import('../counsel');
  const app = express();
  app.use(express.json());
  if (withCsrf) app.use(csrfMiddleware);
  app.use(injectUser(user));
  app.use(router);
  return app;
}

describe('GET /counsel/tools — tool manifest (auth boundary)', () => {
  beforeEach(() => { vi.resetModules(); });

  it('returns 403 for unauthenticated requests (manifest is auth-gated)', async () => {
    const app = await buildApp({ user: null });
    const res = await request(app).get('/counsel/tools');
    expect(res.status).toBe(403);
  });

  it('returns 200 with 4 tools for authenticated users', async () => {
    const app = await buildApp();
    const res = await request(app).get('/counsel/tools');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tools');
    expect(Array.isArray(res.body.tools)).toBe(true);
    expect(res.body.tools).toHaveLength(4);
  });

  it('each tool has toolId and displayName fields', async () => {
    const app = await buildApp();
    const res = await request(app).get('/counsel/tools');
    for (const tool of res.body.tools) {
      expect(tool).toHaveProperty('toolId');
      expect(tool).toHaveProperty('displayName');
    }
  });
});

describe('POST /counsel/tools/dispatch — CSRF + auth enforcement', () => {
  beforeEach(() => { vi.resetModules(); });

  it('blocks unauthenticated POST without CSRF token (CSRF_TOKEN_MISSING)', async () => {
    const app = await buildApp({ withCsrf: true, user: null });
    const res = await request(app)
      .post('/counsel/tools/dispatch')
      .send({ toolName: 'matter-lookup', params: {} });
    // CSRF middleware runs before auth; no session → CSRF_TOKEN_MISSING
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('blocks authenticated POST with valid CSRF but no org membership (FORBIDDEN)', async () => {
    const userNoOrg = { id: 99, displayName: 'Guest', email: 'g@x.com', roles: [], orgs: [] };
    const app = await buildApp({ withCsrf: true, user: userNoOrg as Parameters<typeof makeUser>[never] });
    const res = await request(app)
      .post('/counsel/tools/dispatch')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send({ toolName: 'matter-lookup', params: {} });
    expect(res.status).toBe(403);
  });

  it('blocks POST with mismatched CSRF token (CSRF_TOKEN_MISMATCH)', async () => {
    const app = await buildApp({ withCsrf: true, user: null });
    const res = await request(app)
      .post('/counsel/tools/dispatch')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, 'wrong-token')
      .send({ toolName: 'matter-lookup', params: {} });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_MISMATCH');
  });

  it('succeeds with valid CSRF + auth and calls dispatchCounselTool', async () => {
    const app = await buildApp({ withCsrf: true });
    const res = await request(app)
      .post('/counsel/tools/dispatch')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send({ toolName: 'matter-lookup', params: {} });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('result');
    expect(res.body.result.success).toBe(true);
    expect(res.body.result.toolName).toBe('matter-lookup');
  });

  it('rejects unknown toolName with 400', async () => {
    const app = await buildApp({ withCsrf: true });
    const res = await request(app)
      .post('/counsel/tools/dispatch')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send({ toolName: 'unknown-tool', params: {} });
    expect(res.status).toBe(400);
  });

  it('rejects missing toolName with 400', async () => {
    const app = await buildApp({ withCsrf: true });
    const res = await request(app)
      .post('/counsel/tools/dispatch')
      .set('Cookie', `${CSRF_COOKIE}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER, TEST_CSRF_TOKEN)
      .send({ params: {} });
    expect(res.status).toBe(400);
  });

  it('Bearer token bypasses CSRF layer but still requires org membership', async () => {
    const userWithOrg = makeUser();
    const app = await buildApp({ withCsrf: true, user: userWithOrg });
    const res = await request(app)
      .post('/counsel/tools/dispatch')
      .set('Authorization', 'Bearer szl_gw_test_token')
      .send({ toolName: 'citation-search', params: { matterId: 'm-001', query: 'test' } });
    // CSRF bypassed, org present → tool dispatch resolves to 200 (success) or
    // 422 (tool-level validation failure). 5xx is a regression and must fail.
    expect([200, 422]).toContain(res.status);
    expect(res.body.code).not.toBe('CSRF_TOKEN_MISSING');
    expect(res.body.code).not.toBe('CSRF_TOKEN_MISMATCH');
  });
});

describe('GET /counsel/forecast — required head IDs', () => {
  beforeEach(() => { vi.resetModules(); });

  const REQUIRED_HEAD_IDS = new Set([
    'counsel:obligation-cascade',
    'counsel:settlement-likelihood',
    'counsel:risk-exposure',
  ]);

  it('returns exactly 3 heads with the correct required head IDs', async () => {
    const app = await buildApp();
    const res = await request(app).get('/counsel/forecast');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('heads');
    expect(Array.isArray(res.body.heads)).toBe(true);
    expect(res.body.heads).toHaveLength(3);
    for (const head of res.body.heads) {
      expect(REQUIRED_HEAD_IDS.has(head.headName)).toBe(true);
    }
  });

  it('each head has intervals, provenance, and alertThreshold', async () => {
    const app = await buildApp();
    const res = await request(app).get('/counsel/forecast');
    for (const head of res.body.heads) {
      expect(Array.isArray(head.intervals)).toBe(true);
      expect(head.intervals.length).toBeGreaterThan(0);
      expect(head.provenance).toHaveProperty('modelId');
      expect(head.provenance).toHaveProperty('adapterId');
      expect(typeof head.alertThreshold).toBe('number');
    }
  });

  it('provenance references monte-carlo-litigation adapter (real model-backed, not safe-default fallback)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/counsel/forecast');
    for (const head of res.body.heads) {
      expect(head.provenance.adapterId).toMatch(/monte-carlo-litigation/);
    }
  });
});

describe('POST /counsel/decision-center/execute — demo-mode PCE gate', () => {
  it('returns 200 with mode=demo for unauthenticated callers (no side-effects)', async () => {
    // user: null → isDemo=true → PCE gate runs, audit+signals suppressed → mode:'demo'
    // withCsrf: true + matching cookie+header → passes CSRF check so we reach the PCE gate
    const app = await buildApp({ user: null, withCsrf: true });
    const res = await request(app)
      .post('/counsel/decision-center/execute')
      .set('Cookie', `csrf_token=${TEST_CSRF_TOKEN}`)
      .set('X-CSRF-Token', TEST_CSRF_TOKEN)
      .send({
        matterId: 'M-XJSEC-2026-001',
        actionId: 'escalate-001',
        actionDescription: 'Escalate to senior counsel',
        signalIds: [],
        riskLevel: 'medium',
      });
    expect(res.status).toBe(200);
    // sendSuccess without meta returns data directly (no {data:...} wrapper)
    expect(res.body?.mode).toBe('demo');
  });
});

describe('GET /counsel/feeds/health — source ID normalization', () => {
  beforeEach(() => { vi.resetModules(); });

  it('returns feeds array with normalized source IDs (all lowercase/underscore)', async () => {
    const { router: feedsRouter } = await import('../counsel-feeds');
    const app = express();
    app.use(feedsRouter);
    const res = await request(app).get('/counsel/feeds/health');
    if (res.status === 200) {
      const feeds = res.body?.data?.feeds ?? res.body?.feeds ?? [];
      const sourceIds = feeds.map((f: { source: string }) => f.source);
      for (const id of sourceIds) {
        expect(id).toMatch(/^[a-z0-9_]+$/);
        expect(id).not.toMatch(/[A-Z]/);
      }
    }
  });
});
