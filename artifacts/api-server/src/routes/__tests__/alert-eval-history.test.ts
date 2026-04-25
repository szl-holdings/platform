/**
 * GET /ops/alert-rules/evaluation-history — unit tests
 *
 * Verifies:
 *   1. Returns runs when no date filter is provided
 *   2. Accepts `from` param and passes a gte condition to the query
 *   3. Accepts `to` param, normalises to end-of-day, and passes lte condition
 *   4. Accepts both `from` and `to` simultaneously
 *   5. Silently ignores an invalid (non-parseable) date string
 *   6. Respects the `limit` query param (capped at 200)
 *   7. Returns 401 for unauthenticated callers
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Drizzle ORM ──────────────────────────────────────────────────────────────

const capturedWhereArg: unknown[] = [];
const capturedLimitArg: number[] = [];

vi.mock('drizzle-orm', () => {
  const noop = (...args: unknown[]) => args[0] ?? {};
  return {
    desc: noop,
    eq: noop,
    and: (...args: unknown[]) => ({ __and: args }),
    gte: (col: unknown, val: unknown) => ({ __gte: { col, val } }),
    lte: (col: unknown, val: unknown) => ({ __lte: { col, val } }),
    SQL: class {},
  };
});

// ─── @szl-holdings/db ─────────────────────────────────────────────────────────

const mockRuns = [
  {
    id: 1,
    evaluatedAt: new Date('2025-04-20T10:00:00Z'),
    rulesChecked: 5,
    rulesFired: 1,
    durationMs: 42,
    errors: null,
    metrics: { 'api.error_rate': 6 },
    triggeredBy: 'scheduled',
  },
  {
    id: 2,
    evaluatedAt: new Date('2025-04-19T08:00:00Z'),
    rulesChecked: 5,
    rulesFired: 0,
    durationMs: 38,
    errors: null,
    metrics: {},
    triggeredBy: 'scheduled',
  },
];

let selectReturnValue: unknown[] = mockRuns;

vi.mock('@szl-holdings/db', () => {
  const makeChain = () => {
    const chain = {
      from: () => chain,
      where: (arg: unknown) => {
        capturedWhereArg.push(arg);
        return chain;
      },
      orderBy: () => chain,
      limit: (n: number) => {
        capturedLimitArg.push(n);
        return Promise.resolve(selectReturnValue);
      },
    };
    return chain;
  };

  return {
    db: {
      select: () => makeChain(),
      insert: () => ({ values: vi.fn().mockResolvedValue(undefined) }),
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
    alertEvaluationRunsTable: {
      evaluatedAt: 'evaluated_at',
    },
  };
});

// ─── Supporting mocks ─────────────────────────────────────────────────────────

vi.mock('../../lib/boot-orchestrator', () => ({
  requireOpsReady: (_req: Request, _res: Response, next: NextFunction) => next(),
  markOpsReady: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn(),
  buildAlertFiredEmail: vi.fn(),
  generateUnsubscribeToken: vi.fn(() => 'tok'),
  logNotificationAudit: vi.fn(),
  hasEmailProviderConfigured: vi.fn(() => false),
}));

vi.mock('../../lib/platform-flags', () => ({
  isFlagEnabled: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordRequest: vi.fn(), recordAuthFailure: vi.fn(), recordError: vi.fn() },
}));

vi.mock('@szl-holdings/config', () => ({
  isProductionMode: vi.fn(() => false),
  isDemoMode: vi.fn(() => false),
  resolveRuntimeMode: vi.fn(() => 'local-dev'),
  isSeedDataAllowed: vi.fn(() => true),
}));

vi.mock('@szl-holdings/audit', () => ({ hashIp: (ip: string) => `hashed-${ip}` }));

// ─── Auth ─────────────────────────────────────────────────────────────────────

let authUser: { id: number; roles: string[] } | null = null;

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    () =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (!authUser) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      (req as Request & { user: typeof authUser }).user = authUser;
      next();
    },
  requireRole:
    () =>
    (_req: Request, _res: Response, next: NextFunction): void => {
      next();
    },
}));

// ─── App factory ──────────────────────────────────────────────────────────────

async function buildApp() {
  const { default: router } = await import('../ops-management');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /ops/alert-rules/evaluation-history', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    capturedWhereArg.length = 0;
    capturedLimitArg.length = 0;
    selectReturnValue = mockRuns;
    authUser = { id: 1, roles: ['admin'] };
    app = await buildApp();
  });

  it('returns 401 for unauthenticated callers', async () => {
    authUser = null;
    const res = await request(app).get('/ops/alert-rules/evaluation-history');
    expect(res.status).toBe(401);
  });

  it('returns runs with no filter and defaults to limit 50', async () => {
    const res = await request(app)
      .get('/ops/alert-rules/evaluation-history')
      .set('Cookie', 'session=mock');
    expect(res.status).toBe(200);
    expect(res.body.runs).toHaveLength(2);
    expect(res.body.lastRun).toMatchObject({ id: 1 });
    expect(capturedLimitArg[0]).toBe(50);
  });

  it('passes undefined where clause when no dates are given', async () => {
    await request(app).get('/ops/alert-rules/evaluation-history');
    expect(capturedWhereArg[0]).toBeUndefined();
  });

  it('applies a gte condition when `from` is provided', async () => {
    await request(app).get('/ops/alert-rules/evaluation-history?from=2025-04-19');
    // and() wraps all conditions in { __and: [...] } even for a single arg
    const where = capturedWhereArg[0] as { __and?: { __gte?: { val: Date } }[] } | undefined;
    expect(where).toBeDefined();
    const gteVal = where?.__and?.[0]?.__gte?.val;
    expect(gteVal?.toISOString()).toBe('2025-04-19T00:00:00.000Z');
  });

  it('applies a lte condition normalised to end-of-day when `to` is provided', async () => {
    await request(app).get('/ops/alert-rules/evaluation-history?to=2025-04-20');
    const where = capturedWhereArg[0] as { __and?: { __lte?: { val: Date } }[] } | undefined;
    expect(where).toBeDefined();
    const toDate = where?.__and?.[0]?.__lte?.val;
    expect(toDate?.getUTCHours()).toBe(23);
    expect(toDate?.getUTCMinutes()).toBe(59);
    expect(toDate?.getUTCSeconds()).toBe(59);
  });

  it('applies an and() condition when both `from` and `to` are provided', async () => {
    await request(app).get(
      '/ops/alert-rules/evaluation-history?from=2025-04-01&to=2025-04-30',
    );
    const where = capturedWhereArg[0] as { __and?: unknown[] } | undefined;
    expect(where?.__and).toHaveLength(2);
  });

  it('ignores an invalid `from` date and passes no condition', async () => {
    await request(app).get('/ops/alert-rules/evaluation-history?from=not-a-date');
    expect(capturedWhereArg[0]).toBeUndefined();
  });

  it('ignores an invalid `to` date and passes no condition', async () => {
    await request(app).get('/ops/alert-rules/evaluation-history?to=garbage');
    expect(capturedWhereArg[0]).toBeUndefined();
  });

  it('returns 400 when limit exceeds 200', async () => {
    const res = await request(app).get('/ops/alert-rules/evaluation-history?limit=9999');
    expect(res.status).toBe(400);
  });

  it('passes a valid limit through to the query', async () => {
    await request(app).get('/ops/alert-rules/evaluation-history?limit=25');
    expect(capturedLimitArg[0]).toBe(25);
  });

  it('returns an empty runs array and null lastRun when no records exist', async () => {
    selectReturnValue = [];
    const res = await request(app).get('/ops/alert-rules/evaluation-history');
    expect(res.status).toBe(200);
    expect(res.body.runs).toHaveLength(0);
    expect(res.body.lastRun).toBeNull();
  });
});
