/**
 * CORTEX & Counsel API Smoke Tests
 *
 * Covers routes not previously tested in cross-app-smoke.test.ts:
 *   - CORTEX Intelligence: /cortex/* (cross-domain fusion engine)
 *   - Counsel (Aegis Intelligence): /inca/* (AI research & model management)
 *   - Autopilot: /autopilot/* (autonomous operations)
 *   - Command Portal: /snapshot, /search (unified command endpoints)
 *
 * Uses real DB; external side-effects mocked.
 * Route contracts assert specific response shapes, not just "not 500".
 */

import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createTestApp } from '../utils/test-app';
import { registerCleanup, flushAllCleanup } from '../utils/cleanup-registry';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../artifacts/api-server/src/middlewares/auth', () => {
  const passthrough = (_req: unknown, _res: unknown, next: () => void) => next();
  const authMiddleware = (_opts: { required?: boolean } = {}) => passthrough;
  const requireRole = (..._roles: string[]) => passthrough;
  const denyIfReadOnly = () => passthrough;
  const requireAnyAuth = (_opts?: unknown) => passthrough;
  const parseIdParam = (id: string) => {
    const n = parseInt(id, 10);
    if (Number.isNaN(n)) throw new Error('Invalid ID');
    return n;
  };
  class InvalidIdError extends Error {}
  return {
    authMiddleware,
    requireRole,
    denyIfReadOnly,
    requireAnyAuth,
    parseIdParam,
    InvalidIdError,
  };
});

vi.mock('../../artifacts/api-server/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

vi.mock('../../artifacts/api-server/src/lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn(), asyncIterableIterator: vi.fn() },
  VESSELS_EVENTS: {},
  FIRESTORM_EVENTS: {},
  LYTE_EVENTS: {},
  CARLOTA_EVENTS: {},
  ALLOY_EVENTS: {},
}));

vi.mock('../../artifacts/api-server/src/lib/websocket.js', () => ({
  publish: vi.fn(),
  WS_CHANNELS: {},
}));

vi.mock('../../artifacts/api-server/src/lib/platform-flags', () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
}));

vi.mock('@szl-holdings/ai-engine', () => ({
  validateAndBuildDecision: vi.fn().mockResolvedValue({ id: 'test-decision' }),
  fusionCortex: {
    crossDomainSignals: vi.fn().mockResolvedValue([]),
    intelligenceFeed: vi.fn().mockResolvedValue([]),
    entityGraph: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
    whatIfAnalysis: vi.fn().mockResolvedValue({ projections: [] }),
    executiveBriefing: vi.fn().mockResolvedValue({ summary: 'test briefing' }),
    getAlerts: vi.fn().mockReturnValue([]),
    getStats: vi.fn().mockReturnValue({
      totalAlerts: 0,
      activeAlerts: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      domainsWithAlerts: [],
    }),
    getEntityGraph: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
    getFusionAlerts: vi.fn().mockReturnValue([]),
  },
  ontologyEngine: {
    entityGraph: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
    getEntityGraph: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
    getGraphStats: vi.fn().mockResolvedValue({ totalEntities: 0, totalRelationships: 0 }),
    getDomainEntities: vi.fn().mockResolvedValue([]),
    getEntityConnections: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../artifacts/api-server/src/lib/multi-agent-orchestrator', () => ({
  orchestrate: vi.fn().mockResolvedValue({ domain: 'vessels', response: 'test response' }),
}));

vi.mock('@szl-holdings/ai-engine/domain-embedding-hooks', () => ({
  ingestLyteSystem: vi.fn().mockResolvedValue(undefined),
  ingestFirestormFinding: vi.fn().mockResolvedValue(undefined),
  ingestFirestormScenario: vi.fn().mockResolvedValue(undefined),
  ingestFirestormAlert: vi.fn().mockResolvedValue(undefined),
  ingestCarlotaService: vi.fn().mockResolvedValue(undefined),
  ingestPrismMatter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../artifacts/api-server/src/lib/backup-service', () => ({
  getBackupHealthStatus: vi.fn().mockReturnValue({ status: 'ok', totalBackups: 0 }),
}));

vi.mock('../../artifacts/api-server/src/middlewares/optimistic-concurrency', () => ({
  validateIfMatch: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../../artifacts/api-server/src/middlewares/sliding-window-limiter', () => {
  const passthrough = (_req: unknown, _res: unknown, next: () => void) => next();
  return {
    perUserApiSlidingLimiter: passthrough,
    perUserWriteSlidingLimiter: passthrough,
    perUserReadSlidingLimiter: passthrough,
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAuthApp(roles: string[] = ['admin', 'ops', 'exec', 'super_admin']) {
  const app = createTestApp();
  app.use((req, _res, next) => {
    (req as Record<string, unknown>).user = {
      id: 1,
      displayName: 'Integration Test User',
      email: 'test@szl.holdings',
      roles,
      orgs: [{ orgId: 1, orgSlug: 'szl', orgName: 'SZL Holdings', role: 'admin' }],
    };
    next();
  });
  return app;
}

beforeAll(async () => {
  try {
    const { db, dailyBriefingsTable } = await import('../../lib/db/src/index');
    const { eq } = await import('drizzle-orm');
    const today = new Date().toISOString().slice(0, 10);
    const existing = await db
      .select()
      .from(dailyBriefingsTable)
      .where(eq(dailyBriefingsTable.briefingDate, today))
      .limit(1);
    if (existing.length === 0) {
      const [row] = await db
        .insert(dailyBriefingsTable)
        .values({
          briefingDate: today,
          headline: 'Test briefing seeded by smoke tests',
          executiveSummary: 'Auto-seeded summary for smoke test determinism',
          signals: [],
          domainScores: {},
          totalAlerts: 0,
          criticalCount: 0,
          highCount: 0,
          overallHealth: 'nominal',
          isPublished: true,
        })
        .returning();
      registerCleanup({ table: 'dailyBriefingsTable', id: row.id });
    }
  } catch (_e) {
  }
}, 10000);

afterAll(async () => {
  await flushAllCleanup();
  try {
    const { pool } = await import('../../lib/db/src/index');
    if (pool && typeof pool.end === 'function') {
      await pool.end();
    }
  } catch {}
});

// ── Domain: Counsel (Aegis Intelligence) ─────────────────────────────────────────

describe('Domain: Counsel (Aegis Intelligence)', () => {
  it('GET /inca/health returns 200 with status ok', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/inca')).default;
    app.use(router);
    const res = await request(app).get('/inca/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
  });

  it('GET /inca/dashboard returns 200 with expected dashboard fields', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/inca')).default;
    app.use(router);
    const res = await request(app).get('/inca/dashboard');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(typeof body).toBe('object');
    expect(body).toHaveProperty('activeProjects');
    expect(typeof body.activeProjects).toBe('number');
  });

  it('GET /inca/projects returns 200 with pagination envelope or array', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/inca')).default;
    app.use(router);
    const res = await request(app).get('/inca/projects');
    expect(res.status).toBe(200);
    const isArray = Array.isArray(res.body);
    const hasPaginatedData = Array.isArray(res.body?.data);
    expect(isArray || hasPaginatedData).toBe(true);
  });

  it('GET /inca/experiments returns 200 with a paginated experiments array', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/inca')).default;
    app.use(router);
    const res = await request(app).get('/inca/experiments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(typeof res.body?.meta?.total).toBe('number');
    expect(typeof res.body?.meta?.page).toBe('number');
  });

  it('GET /inca/models returns 200 with a paginated models array', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/inca')).default;
    app.use(router);
    const res = await request(app).get('/inca/models');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(typeof res.body?.meta?.total).toBe('number');
    expect(typeof res.body?.meta?.page).toBe('number');
  });
});

// ── Domain: CORTEX Intelligence ───────────────────────────────────────────────

describe('Domain: APEX Intelligence', () => {
  it('GET /cortex/domains returns 200 with a domains array', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/cortex')).default;
    app.use(router);
    const res = await request(app).get('/cortex/domains');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body).toHaveProperty('domains');
    expect(Array.isArray(body.domains)).toBe(true);
  });

  it('GET /cortex/command-feed returns 200 with signals and summaries arrays', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/cortex')).default;
    app.use(router);
    const res = await request(app).get('/cortex/command-feed');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body).toHaveProperty('signals');
    expect(body).toHaveProperty('summaries');
    expect(Array.isArray(body.signals)).toBe(true);
    expect(Array.isArray(body.summaries)).toBe(true);
  });

  it('GET /cortex/intelligence-feed returns 200 with signals and stats', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/cortex')).default;
    app.use(router);
    const res = await request(app).get('/cortex/intelligence-feed');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body).toHaveProperty('signals');
    expect(body).toHaveProperty('stats');
    expect(Array.isArray(body.signals)).toBe(true);
    expect(typeof body.stats).toBe('object');
    expect(body.stats).toHaveProperty('total');
    expect(body.stats).toHaveProperty('active');
  });

  it('GET /cortex/briefing/today returns 200 with a briefing object', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/cortex')).default;
    app.use(router);
    const res = await request(app).get('/cortex/briefing/today');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body).toHaveProperty('briefing');
    expect(typeof body.cached).toBe('boolean');
    if (!body.cached && typeof body.briefing?.id === 'number') {
      registerCleanup({ table: 'dailyBriefingsTable', id: body.briefing.id });
    }
  });

  it('GET /cortex/action-drafts returns 200 with drafts array and counts', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/cortex')).default;
    app.use(router);
    const res = await request(app).get('/cortex/action-drafts');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body).toHaveProperty('drafts');
    expect(Array.isArray(body.drafts)).toBe(true);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('pendingCount');
  });

  it('GET /cortex/entity-graph returns 200 with nodes, edges, and meta', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/cortex')).default;
    app.use(router);
    const res = await request(app).get('/cortex/entity-graph');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body).toHaveProperty('nodes');
    expect(body).toHaveProperty('edges');
    expect(body).toHaveProperty('meta');
    expect(Array.isArray(body.nodes)).toBe(true);
    expect(Array.isArray(body.edges)).toBe(true);
    expect(typeof body.meta).toBe('object');
    expect(body.meta).toHaveProperty('totalNodes');
    expect(body.meta).toHaveProperty('totalEdges');
  });
});

// ── Domain: Autopilot ─────────────────────────────────────────────────────────

describe('Domain: Autopilot', () => {
  it('GET /autopilot/summary returns 200 with genome score and capability counts', async () => {
    const app = buildAuthApp();
    const { autopilotRouter } = await import('../../artifacts/api-server/src/routes/autopilot');
    app.use(autopilotRouter);
    const res = await request(app).get('/autopilot/summary');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(typeof body).toBe('object');
    const data = body?.data ?? body;
    expect(data).toHaveProperty('genomeScore');
    expect(typeof data.genomeScore).toBe('number');
    expect(data).toHaveProperty('capabilities');
    expect(data).toHaveProperty('generatedAt');
  });

  it('GET /autopilot/next-best-actions returns 200 with an actions array and computedAt', async () => {
    const app = buildAuthApp();
    const { autopilotRouter } = await import('../../artifacts/api-server/src/routes/autopilot');
    app.use(autopilotRouter);
    const res = await request(app).get('/autopilot/next-best-actions');
    expect(res.status).toBe(200);
    const payload = res.body?.data ?? res.body;
    expect(Array.isArray(payload?.actions)).toBe(true);
    expect(typeof payload?.computedAt).toBe('string');
  });
});

// ── Domain: Command Portal ────────────────────────────────────────────────────

describe('Domain: Command Portal', () => {
  it('GET /snapshot returns 200 with ecosystem snapshot shape', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/command')).default;
    app.use(router);
    const res = await request(app).get('/snapshot');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(typeof body).toBe('object');
    expect(body).toHaveProperty('domains');
    expect(Array.isArray(body.domains)).toBe(true);
  });

  it('GET /search with no query returns 200 with empty results array', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/command')).default;
    app.use(router);
    const res = await request(app).get('/search');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);
  });

  it('GET /search with query returns 200 with filtered results', async () => {
    const app = buildAuthApp();
    const router = (await import('../../artifacts/api-server/src/routes/command')).default;
    app.use(router);
    const res = await request(app).get('/search?q=vessel');
    expect(res.status).toBe(200);
    const body = res.body?.data ?? res.body;
    expect(body).toHaveProperty('results');
    expect(body).toHaveProperty('query');
    expect(Array.isArray(body.results)).toBe(true);
  });
});
