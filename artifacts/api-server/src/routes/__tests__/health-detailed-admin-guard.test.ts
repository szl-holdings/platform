/**
 * /health/detailed Admin Guard — Integration Tests
 *
 * adminGuard is only applied when NODE_ENV or APP_ENV is "production".
 * These tests verify:
 *  - In production mode: unauthenticated → 401, wrong token → 401, correct token → 200
 *  - In non-production mode: endpoint is open (200 without auth)
 *  - envStatus response contains only boolean flags (no raw secret values)
 */

import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Common mocks — must be declared before any dynamic imports
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => ({
  pool: { query: vi.fn().mockResolvedValue({ rows: [{ cnt: 42 }] }) },
  healthPool: { query: vi.fn().mockResolvedValue({ rows: [{ cnt: 5 }] }) },
  db: {
    select: () => {
      const c: any = {};
      c.from = () => c;
      c.where = () => c;
      c.innerJoin = () => c;
      c.orderBy = () => c;
      c.then = (r: any) => Promise.resolve([]).then(r);
      return c;
    },
  },
  orgMembersTable: { orgId: 'orgId', userId: 'userId' },
  organizationsTable: { id: 'id', slug: 'slug' },
  ROLE_HIERARCHY: {},
  isReadOnlyRole: () => false,
  toCanonicalRole: (r: string) => r,
}));

vi.mock('@szl-holdings/api-zod', () => ({
  HealthCheckResponse: { parse: (v: unknown) => v },
}));

vi.mock('../../lib/auth', () => ({
  getSessionToken: vi.fn().mockReturnValue(undefined),
  getSessionUser: vi.fn().mockResolvedValue(null),
  SESSION_COOKIE: '__Host-sid',
  LEGACY_SESSION_COOKIE: 'sid',
  readSessionCookie: () => undefined,
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

vi.mock('../../lib/backup-service', () => ({
  getBackupHealthStatus: () => ({
    status: 'ok',
    lastBackupAt: null,
    lastBackupSizeBytes: 0,
    ageHours: null,
    warning: null,
    totalBackups: 0,
    details: [],
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildApp(router: express.Router): express.Express {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

// ---------------------------------------------------------------------------
// Production-mode tests — dynamically import after setting production env
// ---------------------------------------------------------------------------

describe('GET /health/detailed — production mode (APP_ENV=production)', () => {
  let productionRouter: express.Router;
  const originalAppEnv = process.env.APP_ENV;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    // Set production env BEFORE importing — productionAdminGuard is evaluated at import time
    process.env.APP_ENV = 'production';
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    vi.resetModules();
    // Re-apply mocks after reset (vi.mock factory functions are hoisted so they survive resetModules)
    productionRouter = ((await import('../health.js')) as { default: express.Router }).default;
  });

  afterAll(() => {
    process.env.APP_ENV = originalAppEnv;
    if (originalNodeEnv !== undefined) process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it('returns 401 for unauthenticated requests (no session, no internal token)', async () => {
    delete (process.env as Record<string, string | undefined>).ALLOY_INTERNAL_TOKEN;
    const app = buildApp(productionRouter);
    const res = await request(app).get('/health/detailed');
    expect(res.status).toBe(401);
  });

  it('returns 401 for requests with the wrong internal token', async () => {
    const correct = 'correct-service-token-32-chars!!';
    const wrong = 'WRONG---service-token-32-chars!!';
    process.env.ALLOY_INTERNAL_TOKEN = correct;
    const app = buildApp(productionRouter);
    const res = await request(app).get('/health/detailed').set('x-internal-token', wrong);
    expect(res.status).toBe(401);
  });

  it('returns 200 with diagnostics for the correct internal token', async () => {
    const token = 'correct-service-token-32-chars!!';
    process.env.ALLOY_INTERNAL_TOKEN = token;
    const app = buildApp(productionRouter);
    const res = await request(app).get('/health/detailed').set('x-internal-token', token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('envStatus');
  });

  it('envStatus values are all booleans — no raw secret values leaked', async () => {
    const token = 'correct-service-token-32-chars!!';
    process.env.ALLOY_INTERNAL_TOKEN = token;
    const app = buildApp(productionRouter);
    const res = await request(app).get('/health/detailed').set('x-internal-token', token);
    expect(res.status).toBe(200);
    for (const [, val] of Object.entries(res.body.envStatus as Record<string, unknown>)) {
      expect(typeof val).toBe('boolean');
    }
  });
});

// ---------------------------------------------------------------------------
// Non-production mode — endpoint accessible without credentials
// ---------------------------------------------------------------------------

describe('GET /health/detailed — non-production mode (NODE_ENV=test)', () => {
  let devRouter: express.Router;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    delete (process.env as Record<string, string | undefined>).APP_ENV;
    vi.resetModules();
    devRouter = ((await import('../health.js')) as { default: express.Router }).default;
  });

  afterAll(() => {
    if (originalNodeEnv !== undefined) process.env.NODE_ENV = originalNodeEnv;
    process.env.APP_ENV = originalAppEnv;
    vi.resetModules();
  });

  it('returns 200 without credentials in development mode', async () => {
    delete (process.env as Record<string, string | undefined>).ALLOY_INTERNAL_TOKEN;
    const app = buildApp(devRouter);
    const res = await request(app).get('/health/detailed');
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Role-based access control (production mode)
//
// Exercises the session-authentication path of the productionAdminGuard /
// adminGuard chain:
//   - no session token          → 401
//   - session + non-admin role  → 403
//   - session + viewer role     → 403
//   - session + ops role        → 200
//   - session + super_admin role → 200
//   - valid X-Internal-Token    → 200 (no session required)
// ---------------------------------------------------------------------------

describe('GET /health/detailed — role-based access (APP_ENV=production)', () => {
  let rbacRouter: express.Router;
  let getSessionTokenMock: ReturnType<typeof vi.fn>;
  let getSessionUserMock: ReturnType<typeof vi.fn>;
  const originalAppEnv = process.env.APP_ENV;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    process.env.APP_ENV = 'production';
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    vi.resetModules();
    const authMod = await import('../../lib/auth.js');
    getSessionTokenMock = vi.mocked(authMod.getSessionToken);
    getSessionUserMock = vi.mocked(authMod.getSessionUser);
    rbacRouter = ((await import('../health.js')) as { default: express.Router }).default;
  });

  afterAll(() => {
    process.env.APP_ENV = originalAppEnv;
    if (originalNodeEnv !== undefined) process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  beforeEach(() => {
    getSessionTokenMock.mockReturnValue('mock-session-token');
    getSessionUserMock.mockResolvedValue(null);
    delete (process.env as Record<string, string | undefined>).ALLOY_INTERNAL_TOKEN;
  });

  it('returns 401 for unauthenticated request (no session, no internal token)', async () => {
    getSessionTokenMock.mockReturnValueOnce(undefined);
    const app = buildApp(rbacRouter);
    const res = await request(app).get('/health/detailed');
    expect(res.status).toBe(401);
  });

  it('returns 403 for authenticated user with no qualifying role (member)', async () => {
    getSessionUserMock.mockResolvedValueOnce({
      id: 10,
      email: 'member@example.com',
      roles: ['member'],
    });
    const app = buildApp(rbacRouter);
    const res = await request(app).get('/health/detailed');
    expect(res.status).toBe(403);
    expect((res.body as { code?: string }).code).toBe('FORBIDDEN');
  });

  it('returns 403 for authenticated user with viewer role', async () => {
    getSessionUserMock.mockResolvedValueOnce({
      id: 11,
      email: 'viewer@example.com',
      roles: ['viewer'],
    });
    const app = buildApp(rbacRouter);
    const res = await request(app).get('/health/detailed');
    expect(res.status).toBe(403);
  });

  it('returns 200 for authenticated user with ops role', async () => {
    getSessionUserMock.mockResolvedValueOnce({
      id: 12,
      email: 'ops@example.com',
      roles: ['ops'],
    });
    const app = buildApp(rbacRouter);
    const res = await request(app).get('/health/detailed');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('envStatus');
  });

  it('returns 200 for authenticated user with super_admin role', async () => {
    getSessionUserMock.mockResolvedValueOnce({
      id: 13,
      email: 'superadmin@example.com',
      roles: ['super_admin'],
    });
    const app = buildApp(rbacRouter);
    const res = await request(app).get('/health/detailed');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('envStatus');
  });

  it('returns 200 for request with valid X-Internal-Token header (no session required)', async () => {
    getSessionTokenMock.mockReturnValueOnce(undefined);
    const token = 'valid-internal-token-exactly-32ch';
    process.env.ALLOY_INTERNAL_TOKEN = token;
    const app = buildApp(rbacRouter);
    const res = await request(app).get('/health/detailed').set('x-internal-token', token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('envStatus');
  });
});
