/**
 * Biometric Sign-In Route Tests
 *
 * Covers the full security surface of the biometric authentication flow:
 *   1. Challenge issuance (POST /mobile-biometric/challenge)
 *   2. Device enrollment (POST /mobile-biometric/enroll)
 *   3. Biometric authenticate with PoP (POST /mobile-biometric/authenticate)
 *   4. Step-up assertion issuance (POST /mobile-biometric/step-up)
 *   5. requireStepUp middleware (enforced on sensitive routes)
 *   6. Binding revocation (DELETE /mobile-biometric/binding)
 *   7. Edge cases: replay protection, proof mismatch, expired challenges
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before dynamic imports
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/observability', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createObservabilityMock();
});

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../lib/websocket.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createWebsocketMock();
});

// ---------------------------------------------------------------------------
// Controlled DB mock — we override per-test via the exported spy holders
// ---------------------------------------------------------------------------

const dbSelectSpy = vi.fn();
const dbInsertSpy = vi.fn();
const dbUpdateSpy = vi.fn();

vi.mock('@szl-holdings/db', () => {
  function makeChain(resolveWith: unknown = []): unknown {
    const obj: Record<string, unknown> = {};
    const methods = [
      'from', 'where', 'and', 'eq', 'gt', 'isNull', 'orderBy',
      'limit', 'offset', 'returning', 'onConflictDoUpdate',
    ];
    for (const m of methods) {
      obj[m] = () => makeChain(resolveWith);
    }
    obj.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(resolveWith).then(resolve, reject);
    return obj;
  }

  const db = {
    select: (...args: unknown[]) => dbSelectSpy(...args),
    insert: (...args: unknown[]) => dbInsertSpy(...args),
    update: (...args: unknown[]) => dbUpdateSpy(...args),
    delete: () => ({ where: () => Promise.resolve([]) }),
    transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(db),
  };

  const stubTable = new Proxy({}, { get: () => 'stub_column' });

  return new Proxy(
    {
      db,
      deviceBiometricBindingsTable: stubTable,
      stepUpAssertionsTable: stubTable,
      biometricChallengesTable: stubTable,
      usersTable: stubTable,
      sessionsTable: stubTable,
    },
    {
      get(target, prop) {
        if (prop in target) return target[prop as keyof typeof target];
        return stubTable;
      },
    },
  );
});

// Controlled session creation mock
const createSessionSpy = vi.fn();
vi.mock('../middlewares/session-policy.js', () => ({
  createSessionWithRefresh: (...args: unknown[]) => createSessionSpy(...args),
}));

// Auth middleware mock
vi.mock('../middlewares/auth.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createAuthMiddlewareMock({
    id: 42,
    email: 'test@example.com',
    roles: ['admin'],
    orgs: [{ orgId: 1, orgSlug: 'test-org', orgName: 'Test Org', role: 'admin' }],
  });
});

// getSessionToken mock
vi.mock('../lib/auth.js', () => ({
  getSessionToken: (req: { headers: Record<string, string> }) =>
    req.headers['authorization']?.replace('Bearer ', '') ?? null,
}));

// ---------------------------------------------------------------------------
// Dynamic imports after mocks
// ---------------------------------------------------------------------------

const { default: biometricRouter, requireStepUp } = await import('../routes/mobile-biometric.js');

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const BINDING_TOKEN = 'a'.repeat(96); // 48 bytes -> 96 hex chars
const NONCE = 'b'.repeat(64);         // 32 bytes -> 64 hex chars

function computeProof(bindingToken: string, nonce: string): string {
  return crypto.createHash('sha256').update(`${bindingToken}:${nonce}`).digest('hex');
}

function makeChainResolving(rows: unknown[]): ReturnType<typeof vi.fn> {
  const chain: Record<string, unknown> = {};
  const methods = [
    'from', 'where', 'and', 'eq', 'gt', 'isNull', 'orderBy',
    'limit', 'returning', 'onConflictDoUpdate', 'set',
  ];
  for (const m of methods) {
    chain[m] = () => makeChainResolving(rows);
  }
  chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(rows).then(resolve, reject);
  return chain as ReturnType<typeof vi.fn>;
}

function makeUpdateChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  chain.set = () => ({ where: () => Promise.resolve([]) });
  return chain;
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', biometricRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/mobile-biometric/challenge', () => {
  beforeEach(() => {
    dbInsertSpy.mockReturnValue({
      values: () => ({
        returning: () => Promise.resolve([{ id: 7, nonce: NONCE }]),
      }),
    });
  });

  it('returns 400 when deviceId is missing', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/mobile-biometric/challenge').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when deviceId is empty string', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/mobile-biometric/challenge')
      .send({ deviceId: '' });
    expect(res.status).toBe(400);
  });

  it('issues a challenge with challengeId and nonce', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/mobile-biometric/challenge')
      .send({ deviceId: 'device-001' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      challengeId: '7',
      nonce: NONCE,
    });
    expect(res.body.expiresAt).toBeDefined();
  });
});

describe('POST /api/mobile-biometric/enroll', () => {
  it('returns 400 when deviceId is missing', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/mobile-biometric/enroll')
      .set('Authorization', 'Bearer valid-token')
      .send({ platform: 'ios' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when platform is not ios or android', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/mobile-biometric/enroll')
      .set('Authorization', 'Bearer valid-token')
      .send({ deviceId: 'device-001', platform: 'windows' });
    expect(res.status).toBe(400);
  });

  it('enrolls a device and returns a bindingToken', async () => {
    dbInsertSpy.mockReturnValue({
      values: () => ({
        onConflictDoUpdate: () => Promise.resolve([]),
      }),
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/mobile-biometric/enroll')
      .set('Authorization', 'Bearer valid-token')
      .send({ deviceId: 'device-001', deviceName: 'iPhone 15', platform: 'ios' });
    expect(res.status).toBe(200);
    expect(typeof res.body.bindingToken).toBe('string');
    expect(res.body.bindingToken.length).toBeGreaterThan(0);
    expect(res.body.expiresAt).toBeDefined();
  });
});

describe('POST /api/mobile-biometric/authenticate', () => {
  beforeEach(() => {
    const proof = computeProof(BINDING_TOKEN, NONCE);

    let selectCallCount = 0;
    dbSelectSpy.mockImplementation(() => {
      selectCallCount += 1;
      if (selectCallCount === 1) {
        return makeChainResolving([{ id: 7, deviceId: 'device-001', nonce: NONCE, expiresAt: new Date(Date.now() + 60000), usedAt: null }]);
      }
      return makeChainResolving([{ id: 1, userId: 42, deviceId: 'device-001', bindingToken: BINDING_TOKEN, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000), revokedAt: null }]);
    });

    dbUpdateSpy.mockReturnValue(makeUpdateChain());

    createSessionSpy.mockResolvedValue({
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });

    void proof;
  });

  it('returns 400 when body is malformed', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/mobile-biometric/authenticate')
      .send({ challengeId: '7' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when proof is wrong length', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/mobile-biometric/authenticate')
      .send({ challengeId: '7', deviceId: 'device-001', proof: 'tooshort' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when challenge is not found (expired or used)', async () => {
    dbSelectSpy.mockImplementation(() => makeChainResolving([]));

    const app = buildApp();
    const proof = computeProof(BINDING_TOKEN, NONCE);
    const res = await request(app)
      .post('/api/mobile-biometric/authenticate')
      .send({ challengeId: '99', deviceId: 'device-001', proof });
    expect(res.status).toBe(401);
  });

  it('returns 401 when proof does not match (wrong binding token)', async () => {
    let selectCallCount = 0;
    dbSelectSpy.mockImplementation(() => {
      selectCallCount += 1;
      if (selectCallCount === 1) {
        return makeChainResolving([{ id: 7, deviceId: 'device-001', nonce: NONCE, expiresAt: new Date(Date.now() + 60000), usedAt: null }]);
      }
      const wrongToken = 'c'.repeat(96);
      return makeChainResolving([{ id: 1, userId: 42, deviceId: 'device-001', bindingToken: wrongToken, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000), revokedAt: null }]);
    });

    dbUpdateSpy.mockReturnValue(makeUpdateChain());

    const app = buildApp();
    const badProof = 'd'.repeat(64);
    const res = await request(app)
      .post('/api/mobile-biometric/authenticate')
      .send({ challengeId: '7', deviceId: 'device-001', proof: badProof });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('PROOF_INVALID');
  });

  it('authenticates successfully with correct proof and returns tokens', async () => {
    const app = buildApp();
    const proof = computeProof(BINDING_TOKEN, NONCE);
    const res = await request(app)
      .post('/api/mobile-biometric/authenticate')
      .send({ challengeId: '7', deviceId: 'device-001', proof });
    expect(res.status).toBe(200);
    expect(res.body.token).toBe('new-access-token');
    expect(res.body.refreshToken).toBe('new-refresh-token');
    expect(res.body.expiresAt).toBeDefined();
  });
});

describe('POST /api/mobile-biometric/step-up', () => {
  it('returns 400 with malformed body', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/mobile-biometric/step-up')
      .set('Authorization', 'Bearer valid-token')
      .send({ challengeId: '7' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when challenge is not found', async () => {
    dbSelectSpy.mockImplementation(() => makeChainResolving([]));

    const app = buildApp();
    const proof = computeProof(BINDING_TOKEN, NONCE);
    const res = await request(app)
      .post('/api/mobile-biometric/step-up')
      .set('Authorization', 'Bearer valid-token')
      .send({ challengeId: '99', deviceId: 'device-001', proof });
    expect(res.status).toBe(401);
  });

  it('returns 403 when no active binding exists for user', async () => {
    let selectCallCount = 0;
    dbSelectSpy.mockImplementation(() => {
      selectCallCount += 1;
      if (selectCallCount === 1) {
        return makeChainResolving([{ id: 7, deviceId: 'device-001', nonce: NONCE, expiresAt: new Date(Date.now() + 60000), usedAt: null }]);
      }
      return makeChainResolving([]);
    });
    dbUpdateSpy.mockReturnValue(makeUpdateChain());

    const app = buildApp();
    const proof = computeProof(BINDING_TOKEN, NONCE);
    const res = await request(app)
      .post('/api/mobile-biometric/step-up')
      .set('Authorization', 'Bearer valid-token')
      .send({ challengeId: '7', deviceId: 'device-001', proof });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('STEP_UP_NO_BINDING');
  });

  it('issues a step-up token with correct proof', async () => {
    let selectCallCount = 0;
    dbSelectSpy.mockImplementation(() => {
      selectCallCount += 1;
      if (selectCallCount === 1) {
        return makeChainResolving([{ id: 7, deviceId: 'device-001', nonce: NONCE, expiresAt: new Date(Date.now() + 60000), usedAt: null }]);
      }
      return makeChainResolving([{ id: 1, userId: 42, deviceId: 'device-001', bindingToken: BINDING_TOKEN, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000), revokedAt: null }]);
    });
    dbUpdateSpy.mockReturnValue(makeUpdateChain());
    dbInsertSpy.mockReturnValue({
      values: () => Promise.resolve([]),
    });

    const app = buildApp();
    const proof = computeProof(BINDING_TOKEN, NONCE);
    const res = await request(app)
      .post('/api/mobile-biometric/step-up')
      .set('Authorization', 'Bearer valid-token')
      .send({ challengeId: '7', deviceId: 'device-001', proof });
    expect(res.status).toBe(200);
    expect(typeof res.body.stepUpToken).toBe('string');
    expect(res.body.stepUpToken.length).toBe(64);
    expect(res.body.validForSeconds).toBe(300);
  });
});

describe('requireStepUp middleware', () => {
  function buildStepUpApp() {
    const app = express();
    app.use(express.json());
    app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (req as Record<string, unknown>).user = { id: 42, roles: ['admin'] };
      next();
    });
    app.post('/api/protected', requireStepUp, (_req, res) => {
      res.json({ ok: true });
    });
    return app;
  }

  it('returns 403 when X-Step-Up-Token header is missing', async () => {
    const app = buildStepUpApp();
    const res = await request(app)
      .post('/api/protected')
      .set('Authorization', 'Bearer valid-token')
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('STEP_UP_REQUIRED');
  });

  it('returns 403 when step-up token is expired or invalid', async () => {
    dbSelectSpy.mockImplementation(() => makeChainResolving([]));

    const app = buildStepUpApp();
    const res = await request(app)
      .post('/api/protected')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Step-Up-Token', 'invalid-or-expired-token')
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('STEP_UP_INVALID');
  });

  it('allows the request when a valid step-up token is provided', async () => {
    const assertionToken = crypto.randomBytes(32).toString('hex');
    dbSelectSpy.mockImplementation(() =>
      makeChainResolving([{
        id: 55,
        token: assertionToken,
        userId: 42,
        sessionToken: 'valid-token',
        expiresAt: new Date(Date.now() + 300000),
        usedAt: null,
      }]),
    );
    dbUpdateSpy.mockReturnValue(makeUpdateChain());

    const app = buildStepUpApp();
    const res = await request(app)
      .post('/api/protected')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Step-Up-Token', assertionToken)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('consumes the step-up token (marks usedAt) after successful use', async () => {
    const assertionToken = crypto.randomBytes(32).toString('hex');
    dbSelectSpy.mockImplementation(() =>
      makeChainResolving([{
        id: 55,
        token: assertionToken,
        userId: 42,
        sessionToken: 'valid-token',
        expiresAt: new Date(Date.now() + 300000),
        usedAt: null,
      }]),
    );
    const setFn = vi.fn().mockReturnValue({ where: () => Promise.resolve([]) });
    dbUpdateSpy.mockReturnValue({ set: setFn });

    const app = buildStepUpApp();
    await request(app)
      .post('/api/protected')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Step-Up-Token', assertionToken)
      .send({});

    expect(dbUpdateSpy).toHaveBeenCalled();
    expect(setFn).toHaveBeenCalledWith(expect.objectContaining({ usedAt: expect.any(Date) }));
  });
});

describe('DELETE /api/mobile-biometric/binding', () => {
  it('revokes a specific device binding', async () => {
    dbUpdateSpy.mockReturnValue(makeUpdateChain());

    const app = buildApp();
    const res = await request(app)
      .delete('/api/mobile-biometric/binding')
      .set('Authorization', 'Bearer valid-token')
      .send({ deviceId: 'device-001' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('revokes all bindings when no deviceId is provided', async () => {
    dbUpdateSpy.mockReturnValue(makeUpdateChain());

    const app = buildApp();
    const res = await request(app)
      .delete('/api/mobile-biometric/binding')
      .set('Authorization', 'Bearer valid-token')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/mobile-biometric/status', () => {
  it('returns active bindings for the authenticated user', async () => {
    dbSelectSpy.mockImplementation(() =>
      makeChainResolving([
        {
          id: 1,
          deviceId: 'device-001',
          deviceName: 'iPhone 15',
          platform: 'ios',
          enrolledAt: new Date().toISOString(),
          lastUsedAt: null,
          expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
        },
      ]),
    );

    const app = buildApp();
    const res = await request(app)
      .get('/api/mobile-biometric/status')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bindings)).toBe(true);
    expect(res.body.bindings).toHaveLength(1);
    expect(res.body.bindings[0].deviceId).toBe('device-001');
  });
});
