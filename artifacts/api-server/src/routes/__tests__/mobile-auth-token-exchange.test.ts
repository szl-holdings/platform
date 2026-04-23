import express, { type NextFunction, type Request, type Response, Router } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

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
    orgMembersTable: { orgId: 'org_id', userId: 'user_id' },
    organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  desc: (_c: unknown) => ({ op: 'desc' }),
}));

vi.mock('../../lib/api-response', () => ({
  sendUnauthorized: (res: Response, msg?: string) =>
    res.status(401).json({ error: msg ?? 'Unauthorized' }),
  sendBadRequest: (res: Response, msg: string) => res.status(400).json({ error: msg }),
  sendNotFound: (res: Response, entity: string) =>
    res.status(404).json({ error: `${entity} not found` }),
  sendSuccess: (res: Response, data: unknown) => res.status(200).json(data),
  sendError: (res: Response, msg: string, status: number) =>
    res.status(status).json({ error: msg }),
  handleRouteError: (res: Response, _err: unknown, msg: string) =>
    res.status(500).json({ error: msg }),
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

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (_shape: unknown) => ({ parse: (v: unknown) => v }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (opts?: { required?: boolean }) => {
    const required = opts?.required ?? true;
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user && required) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    };
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../lib/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/validation')>();
  return {
    ...actual,
    validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  };
});

let _oidcConfigured = false;
let _lastTokenExchangeCall: { code_verifier: string; nonce?: string | null; state: string } | null = null;

vi.mock('../../lib/auth', () => ({
  isOidcConfigured: () => _oidcConfigured,
  getOidcConfig: vi.fn().mockResolvedValue({}),
  getOrigin: () => 'https://test.example.com',
  ISSUER_URL: 'https://replit.com/oidc',
  getSessionToken: (req: Request) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return undefined;
  },
  deleteOidcSession: vi.fn().mockResolvedValue(undefined),
  upsertUserFromOidc: vi.fn().mockResolvedValue({ id: 42, displayName: 'Test User', email: 'test@example.com' }),
  setSessionCookie: vi.fn(),
  setOidcCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  getSafeReturnTo: (v: unknown) => (typeof v === 'string' ? v : '/'),
  createOidcSession: vi.fn().mockResolvedValue('session-tok'),
}));

vi.mock('openid-client', () => ({
  authorizationCodeGrant: vi.fn().mockImplementation((_config: unknown, _url: unknown, opts: Record<string, unknown>) => {
    _lastTokenExchangeCall = {
      code_verifier: opts.pkceCodeVerifier as string,
      nonce: (opts.expectedNonce as string | undefined) ?? null,
      state: opts.expectedState as string,
    };
    return {
      claims: () => ({
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    };
  }),
  randomState: () => 'rand-state',
  randomNonce: () => 'rand-nonce',
  randomPKCECodeVerifier: () => 'rand-verifier',
  calculatePKCECodeChallenge: vi.fn().mockResolvedValue('challenge'),
  buildAuthorizationUrl: vi.fn().mockReturnValue(new URL('https://replit.com/oidc/auth')),
  buildEndSessionUrl: vi.fn().mockReturnValue(new URL('https://replit.com/oidc/logout')),
}));

vi.mock('../../middlewares/session-policy', () => ({
  createSessionWithRefresh: vi.fn().mockResolvedValue({
    token: 'access-tok-123',
    refreshToken: 'refresh-tok-456',
    expiresAt: new Date('2030-01-01T00:00:00Z'),
    refreshTokenExpiresAt: new Date('2030-06-01T00:00:00Z'),
  }),
}));

import { globalAuthEnforcer } from '../../middlewares/global-auth-enforcer';

async function buildApp() {
  const { default: oidcRouter } = await import('../oidc-auth');

  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer);

  const apiRouter = Router();
  apiRouter.use(oidcRouter);
  app.use('/api', apiRouter);

  return app;
}

describe('Mobile Auth — POST /api/mobile-auth/token-exchange', () => {
  it('is publicly accessible (no 401 from globalAuthEnforcer)', async () => {
    _oidcConfigured = false;
    const app = await buildApp();

    const res = await request(app)
      .post('/api/mobile-auth/token-exchange')
      .send({ code: 'abc', code_verifier: 'cv', redirect_uri: 'https://app.example/redirect', state: 's' });

    expect(res.status).not.toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    _oidcConfigured = true;
    const app = await buildApp();

    const res = await request(app)
      .post('/api/mobile-auth/token-exchange')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing|invalid|required/i);
  });

  it('returns 503 when OIDC is not configured', async () => {
    _oidcConfigured = false;
    const app = await buildApp();

    const res = await request(app)
      .post('/api/mobile-auth/token-exchange')
      .send({
        code: 'auth-code-123',
        code_verifier: 'pkce-verifier',
        redirect_uri: 'https://app.example/redirect',
        state: 'state-value',
      });

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/oidc.*not.*configured/i);
  });

  it('returns session tokens on successful exchange', async () => {
    _oidcConfigured = true;
    const app = await buildApp();

    const res = await request(app)
      .post('/api/mobile-auth/token-exchange')
      .send({
        code: 'auth-code-123',
        code_verifier: 'pkce-verifier',
        redirect_uri: 'https://app.example/redirect',
        state: 'state-value',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'access-tok-123');
    expect(res.body).toHaveProperty('refreshToken', 'refresh-tok-456');
    expect(res.body).toHaveProperty('expiresAt');
    expect(res.body).toHaveProperty('refreshTokenExpiresAt');
  });

  it('forwards nonce to openid-client when provided', async () => {
    _oidcConfigured = true;
    _lastTokenExchangeCall = null;
    const app = await buildApp();

    await request(app)
      .post('/api/mobile-auth/token-exchange')
      .send({
        code: 'auth-code-123',
        code_verifier: 'pkce-verifier',
        redirect_uri: 'https://app.example/redirect',
        state: 'state-value',
        nonce: 'client-generated-nonce',
      });

    expect(_lastTokenExchangeCall).not.toBeNull();
    expect(_lastTokenExchangeCall!.nonce).toBe('client-generated-nonce');
  });

  it('accepts null nonce (expo-auth-session sometimes omits it)', async () => {
    _oidcConfigured = true;
    _lastTokenExchangeCall = null;
    const app = await buildApp();

    const res = await request(app)
      .post('/api/mobile-auth/token-exchange')
      .send({
        code: 'auth-code-123',
        code_verifier: 'pkce-verifier',
        redirect_uri: 'https://app.example/redirect',
        state: 'state-value',
        nonce: null,
      });

    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid redirect_uri', async () => {
    _oidcConfigured = true;
    const app = await buildApp();

    const res = await request(app)
      .post('/api/mobile-auth/token-exchange')
      .send({
        code: 'auth-code-123',
        code_verifier: 'pkce-verifier',
        redirect_uri: 'not-a-url',
        state: 'state-value',
      });

    expect(res.status).toBe(400);
  });
});

describe('Mobile Auth — POST /api/mobile-auth/logout', () => {
  it('returns 401 without a Bearer token (enforced by globalAuthEnforcer)', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/api/mobile-auth/logout')
      .send({});

    expect(res.status).toBe(401);
  });
});
