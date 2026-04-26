/**
 * Integration tests for SIEM webhook Bearer-token authentication (task #3598).
 *
 * Verifies that POST /api/stream/webhook-siem:
 *  - rejects requests with no Authorization header (401)
 *  - rejects requests with an invalid Bearer token (401)
 *  - accepts requests with a valid SIEM_WEBHOOK_TOKEN Bearer token (200)
 *    even when no user session is present
 *
 * The global auth enforcer must let valid-token requests through before they
 * reach the route handler; a bypass that only lives in the route handler would
 * be unreachable for unauthenticated callers because the enforcer runs first.
 */

import express, { type NextFunction, type Request, type Response, Router } from 'express';
import request from 'supertest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@szl-holdings/db', () => {
  const chain: Record<string, unknown> = {};
  Object.assign(chain, {
    from: () => chain,
    where: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve([]),
    set: () => chain,
    values: () => chain,
    returning: () => Promise.resolve([{ id: 1 }]),
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
    streamDataSourcesTable: {},
    streamIngestedEventsTable: {},
    auditEventsTable: {},
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (_col: unknown, _val: unknown) => ({ op: 'eq' }),
  desc: (_c: unknown) => ({ op: 'desc' }),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/internal-tokens', () => ({
  verifyInternalHeader: () => null,
  tokenHasScope: () => false,
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordTenantIsolationViolation: vi.fn(),
  },
}));

vi.mock('../../lib/websocket', () => ({
  publish: vi.fn(),
  WS_CHANNELS: { STREAM_SIEM: 'stream:siem', STREAM_MARKET: 'stream:market', STREAM_AIS: 'stream:ais' },
}));

vi.mock('../../lib/api-response', () => ({
  sendUnauthorized: (res: Response, msg?: string) =>
    res.status(401).json({ error: msg ?? 'Unauthorized' }),
  sendBadRequest: (res: Response, msg: string) => res.status(400).json({ error: msg }),
  sendNotFound: (res: Response, entity: string) =>
    res.status(404).json({ error: `${entity} not found` }),
  sendSuccess: (res: Response, data: unknown) => res.status(200).json(data),
  sendError: (res: Response, msg: string, status?: number) =>
    res.status(status ?? 500).json({ error: msg }),
  handleRouteError: (res: Response, _err: unknown, msg: string) =>
    res.status(500).json({ error: msg }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../lib/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/validation')>();
  return { ...actual, validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next() };
});

const VALID_TOKEN = 'test-siem-secret-token';

async function buildApp() {
  const { globalAuthEnforcer } = await import('../../middlewares/global-auth-enforcer');
  const { default: streamingRouter } = await import('../streaming-ingestion');

  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer);

  const apiRouter = Router();
  apiRouter.use(streamingRouter);
  app.use('/api', apiRouter);

  return app;
}

describe('SIEM webhook authentication (task #3598)', () => {
  let originalToken: string | undefined;

  beforeEach(() => {
    originalToken = process.env.SIEM_WEBHOOK_TOKEN;
    process.env.SIEM_WEBHOOK_TOKEN = VALID_TOKEN;
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.SIEM_WEBHOOK_TOKEN;
    } else {
      process.env.SIEM_WEBHOOK_TOKEN = originalToken;
    }
    vi.resetModules();
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/api/stream/webhook-siem')
      .send([{ message: 'fake event', severity: 'critical' }]);

    expect(res.status).toBe(401);
  });

  it('returns 401 when an invalid Bearer token is provided', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/api/stream/webhook-siem')
      .set('Authorization', 'Bearer wrong-token-value')
      .send([{ message: 'fake event', severity: 'critical' }]);

    expect(res.status).toBe(401);
  });

  it('returns 401 when a non-Bearer scheme is used', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/api/stream/webhook-siem')
      .set('Authorization', `Basic ${Buffer.from(`user:${VALID_TOKEN}`).toString('base64')}`)
      .send([{ message: 'fake event' }]);

    expect(res.status).toBe(401);
  });

  it('accepts the request and returns 200 with a valid SIEM_WEBHOOK_TOKEN Bearer token (no user session)', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/api/stream/webhook-siem')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send([{ message: 'legitimate event', severity: 'high', src_ip: '10.0.0.1' }]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
    expect(typeof res.body.accepted).toBe('number');
  });

  it('returns 401 for a registered-datasource-style token that is not SIEM_WEBHOOK_TOKEN (enforcer blocks it)', async () => {
    // The global enforcer only accepts SIEM_WEBHOOK_TOKEN; datasource authTokens are not
    // a supported credential for this endpoint (use POST /stream/webhook/:sourceToken instead).
    const app = await buildApp();

    const res = await request(app)
      .post('/api/stream/webhook-siem')
      .set('Authorization', 'Bearer some-registered-datasource-token')
      .send([{ message: 'injected event', severity: 'critical' }]);

    expect(res.status).toBe(401);
  });
});
