import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRuns = [
  {
    id: 1,
    evaluatedAt: new Date('2025-04-20T10:00:00Z'),
    rulesChecked: 5,
    rulesFired: 1,
    durationMs: 42,
    errors: null,
    metrics: {},
    triggeredBy: 'scheduled',
  },
];

let selectReturnValue: unknown[] = mockRuns;

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

vi.mock('@szl-holdings/db', () => {
  const makeChain = () => {
    const chain = {
      from: () => chain,
      where: () => chain,
      orderBy: () => chain,
      limit: () => Promise.resolve(selectReturnValue),
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

vi.mock('@szl-holdings/platform-registry', () => ({
  isProductionMode: vi.fn(() => false),
  isDemoMode: vi.fn(() => false),
  resolveRuntimeMode: vi.fn(() => 'local-dev'),
  isSeedDataAllowed: vi.fn(() => true),
}));

vi.mock('@szl-holdings/audit', () => ({ hashIp: (ip: string) => `hashed-${ip}` }));

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

async function buildApp() {
  const { default: router } = await import('../ops-management');
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe('GET /ops/alert-rules/schedule-status', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    selectReturnValue = mockRuns;
    authUser = { id: 1, roles: ['admin'] };
    app = await buildApp();
  });

  it('returns 401 for unauthenticated callers', async () => {
    authUser = null;
    const res = await request(app).get('/ops/alert-rules/schedule-status');
    expect(res.status).toBe(401);
  });

  it('returns last_run_at, next_run_at, and interval_minutes when runs exist', async () => {
    const res = await request(app).get('/ops/alert-rules/schedule-status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('last_run_at');
    expect(res.body).toHaveProperty('next_run_at');
    expect(res.body).toHaveProperty('interval_minutes');
    expect(res.body.last_run_at).toBe('2025-04-20T10:00:00.000Z');
    expect(res.body.interval_minutes).toBe(5);
    const expectedNext = new Date(
      new Date('2025-04-20T10:00:00Z').getTime() + 5 * 60_000,
    ).toISOString();
    expect(res.body.next_run_at).toBe(expectedNext);
  });

  it('returns nulls when no evaluation runs exist', async () => {
    selectReturnValue = [];
    const res = await request(app).get('/ops/alert-rules/schedule-status');
    expect(res.status).toBe(200);
    expect(res.body.last_run_at).toBeNull();
    expect(res.body.next_run_at).toBeNull();
    expect(res.body.interval_minutes).toBe(5);
  });

  it('respects ALERT_EVAL_INTERVAL_MINUTES env var', async () => {
    process.env.ALERT_EVAL_INTERVAL_MINUTES = '10';
    try {
      const res = await request(app).get('/ops/alert-rules/schedule-status');
      expect(res.status).toBe(200);
      expect(res.body.interval_minutes).toBe(10);
      const expectedNext = new Date(
        new Date('2025-04-20T10:00:00Z').getTime() + 10 * 60_000,
      ).toISOString();
      expect(res.body.next_run_at).toBe(expectedNext);
    } finally {
      delete process.env.ALERT_EVAL_INTERVAL_MINUTES;
    }
  });
});
