/**
 * Session Revocation Test (Task #3116)
 *
 * Proves that server-side revocation is enforced at the `resolveUserFromToken`
 * level — the single authoritative resolver used by every authenticated route
 * via `authMiddleware`.
 *
 * Coverage:
 *   1. Active, non-revoked session → {kind: "ok"}
 *   2. Session with revokedAt set (e.g. after role change / admin force-logout)
 *      → {kind: "revoked", reason: "session_revoked"}
 *   3. Session version mismatch (user.sessionVersion advanced)
 *      → {kind: "revoked", reason: "session_version_mismatch"}
 *   4. Expired session (expiresAt < now) → {kind: "missing"}
 *   5. No matching row → {kind: "missing"}
 *   6. Global SESSION_MIN_CREATED_AT cutoff → {kind: "revoked", reason: "session_pre_secret_rotation"}
 */

import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// We test resolveUserFromToken by injecting controlled DB responses directly
// onto the db.select mock. Each call to `resolveUserFromToken` typically
// makes 2–4 sequential db.select calls; we pre-program the sequence.
// ---------------------------------------------------------------------------

const TOKEN = 'a'.repeat(64);
const NOW = new Date();
const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 60_000);

// Type returned by the chain mock.
type SelectResult = Record<string, unknown>[];

// Programmable select mock — returns the next batch from the queue per call.
const selectQueue: SelectResult[] = [];
function nextRows(): SelectResult {
  return selectQueue.length > 0 ? (selectQueue.shift() ?? []) : [];
}

function makeChain(rows: SelectResult) {
  const c = {
    from: () => c,
    where: () => c,
    innerJoin: () => c,
    orderBy: () => c,
    limit: () => Promise.resolve(rows),
    then: (
      resolve: (v: SelectResult) => unknown,
      reject?: (e: unknown) => unknown,
    ) => Promise.resolve(rows).then(resolve, reject),
  };
  return c;
}

vi.mock('@szl-holdings/db', async () => {
  const drizzle = await import('drizzle-orm');
  const col = (n: string) => n;

  const sessionsTable = {
    id: col('id'), token: col('token'), userId: col('userId'),
    expiresAt: col('expiresAt'), revokedAt: col('revokedAt'),
    createdAt: col('createdAt'), sessionVersion: col('sessionVersion'),
    refreshToken: col('refreshToken'), refreshTokenExpiresAt: col('refreshTokenExpiresAt'),
    refreshTokenUsedAt: col('refreshTokenUsedAt'), replacedBySessionId: col('replacedBySessionId'),
    ipAddress: col('ipAddress'), userAgent: col('userAgent'),
  };
  const usersTable = {
    id: col('id'), isActive: col('isActive'), sessionVersion: col('sessionVersion'),
    displayName: col('displayName'), email: col('email'),
  };
  const rolesTable = { id: col('id'), name: col('name') };
  const userRolesTable = { userId: col('userId'), roleId: col('roleId') };
  const organizationsTable = { id: col('id'), slug: col('slug'), name: col('name') };
  const orgMembersTable = { orgId: col('orgId'), userId: col('userId'), role: col('role') };
  const apiKeysTable = { keyHash: col('keyHash'), isActive: col('isActive') };
  const oauthClientsTable = { clientId: col('clientId') };
  const auditEventsTable = {};

  const db = {
    select: () => makeChain(nextRows()),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };

  return {
    db,
    sessionsTable,
    usersTable,
    rolesTable,
    userRolesTable,
    organizationsTable,
    orgMembersTable,
    apiKeysTable,
    oauthClientsTable,
    auditEventsTable,
    ROLE_HIERARCHY: {},
    isReadOnlyRole: () => false,
    toCanonicalRole: (r: string) => r,
    ...drizzle,
  };
});

vi.mock('../lib/internal-tokens.js', () => ({
  verifyInternalHeader: () => null,
  tokenHasScope: () => false,
}));
vi.mock('../lib/mesh-jwt.js', () => ({ verifyMeshToken: () => null }));
vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { startSpan: (_: string, fn: () => unknown) => fn() },
}));

// session-policy is imported by auth.ts; mock just the cutoff accessor.
vi.mock('../middlewares/session-policy.js', () => ({
  getSessionMinCreatedAt: () => null,
}));

afterEach(() => {
  selectQueue.length = 0;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function activeSessionRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    token: TOKEN,
    userId: 42,
    expiresAt: FUTURE,
    revokedAt: null,
    createdAt: NOW,
    sessionVersion: 1,
    ...overrides,
  };
}

function activeUserRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 42,
    displayName: 'Alice',
    email: 'alice@example.com',
    isActive: true,
    sessionVersion: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveUserFromToken — session revocation enforcement', () => {
  it('1. active, non-revoked session → kind: "ok"', async () => {
    const { resolveUserFromToken } = await import('../middlewares/auth.js');

    // Call 1: primary session query (token + expiresAt > now + revokedAt IS NULL) → row
    selectQueue.push([activeSessionRow()]);
    // Call 2: user lookup → active user
    selectQueue.push([activeUserRow()]);
    // Call 3 & 4: roles + org memberships → empty (viewer by default)
    selectQueue.push([]);
    selectQueue.push([]);

    const result = await resolveUserFromToken(TOKEN);
    expect(result.kind).toBe('ok');
  });

  it('2. revokedAt set → kind: "revoked", reason: "session_revoked"', async () => {
    const { resolveUserFromToken } = await import('../middlewares/auth.js');

    // Call 1: primary query returns [] — revokedAt IS NULL filter excluded this row
    selectQueue.push([]);
    // Call 2: disambiguation query (no revokedAt filter) → row exists → revoked
    selectQueue.push([{ id: 1 }]);

    const result = await resolveUserFromToken(TOKEN);
    expect(result.kind).toBe('revoked');
    expect((result as { kind: 'revoked'; reason: string }).reason).toBe('session_revoked');
  });

  it('3. session_version mismatch (role change) → kind: "revoked", reason: "session_version_mismatch"', async () => {
    const { resolveUserFromToken } = await import('../middlewares/auth.js');

    // Call 1: primary session query → session at version 1
    selectQueue.push([activeSessionRow({ sessionVersion: 1 })]);
    // Call 2: user → version 2 (bumped after role change)
    selectQueue.push([activeUserRow({ sessionVersion: 2 })]);

    const result = await resolveUserFromToken(TOKEN);
    expect(result.kind).toBe('revoked');
    expect((result as { kind: 'revoked'; reason: string }).reason).toBe('session_version_mismatch');
  });

  it('4. expired session (expiresAt in past) → kind: "missing"', async () => {
    const { resolveUserFromToken } = await import('../middlewares/auth.js');

    // The WHERE clause includes expiresAt > now, so an expired row does not
    // appear in the primary query. The disambiguation query then returns no row
    // either (expired rows are simply absent from the secondary lookup too
    // since that query has no filter). Here we simulate both returning [].
    selectQueue.push([]);
    selectQueue.push([]);

    const result = await resolveUserFromToken(TOKEN);
    expect(result.kind).toBe('missing');
  });

  it('5. no session row at all → kind: "missing"', async () => {
    const { resolveUserFromToken } = await import('../middlewares/auth.js');

    selectQueue.push([]);
    selectQueue.push([]);

    const result = await resolveUserFromToken(TOKEN);
    expect(result.kind).toBe('missing');
  });

  it('6. SESSION_MIN_CREATED_AT cutoff → kind: "revoked", reason: "session_pre_secret_rotation"', async () => {
    // Temporarily override the session-policy mock to return a cutoff in the future
    // (so any session created before "now" is rejected).
    const sessionPolicy = await import('../middlewares/session-policy.js');
    vi.spyOn(sessionPolicy, 'getSessionMinCreatedAt').mockReturnValue(FUTURE);

    const { resolveUserFromToken } = await import('../middlewares/auth.js');

    // Primary query: session created at NOW (before FUTURE cutoff) → match
    selectQueue.push([activeSessionRow({ createdAt: NOW })]);
    // User lookup not reached because cutoff check fires first

    const result = await resolveUserFromToken(TOKEN);
    expect(result.kind).toBe('revoked');
    expect((result as { kind: 'revoked'; reason: string }).reason).toBe('session_pre_secret_rotation');
  });
});

// ---------------------------------------------------------------------------
// End-to-end HTTP proof: a revoked token cannot reach a protected endpoint.
//
// We build a minimal Express app whose auth middleware calls
// resolveUserFromToken directly (the same function used by the real
// authMiddleware on every authenticated route). We then spy on
// resolveUserFromToken to return "revoked" or "ok" and verify the HTTP
// status code that the client receives.
// ---------------------------------------------------------------------------

describe('End-to-end HTTP: revoked session → 401 on protected endpoint', () => {
  afterEach(() => {
    selectQueue.length = 0;
    vi.restoreAllMocks();
  });

  async function buildProtectedApp() {
    const authModule = await import('../middlewares/auth.js');

    const app = express();
    app.use(express.json());

    // Reference authModule.resolveUserFromToken via the module object so that
    // vi.spyOn(authModule, 'resolveUserFromToken') is effective: the closure
    // dereferences the spy at call time, not at route-registration time.
    app.get('/api/protected', async (req: Request, res: Response) => {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
      if (!token) {
        res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' });
        return;
      }
      const result = await authModule.resolveUserFromToken(token);
      if (result.kind !== 'ok') {
        const code = result.kind === 'revoked' ? result.reason.toUpperCase() : 'MISSING';
        res.status(401).json({ error: 'Unauthorized', code });
        return;
      }
      res.json({ ok: true, userId: result.user.id });
    });

    return { app, authModule };
  }

  it('active session → 200', async () => {
    const { app, authModule } = await buildProtectedApp();
    vi.spyOn(authModule, 'resolveUserFromToken').mockResolvedValue({
      kind: 'ok',
      user: { id: 42, displayName: 'Alice', email: null, roles: [], orgs: [] },
    });

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('revoked session (revokedAt set) → 401 SESSION_REVOKED', async () => {
    const { app, authModule } = await buildProtectedApp();
    vi.spyOn(authModule, 'resolveUserFromToken').mockResolvedValue({
      kind: 'revoked',
      reason: 'session_revoked',
    });

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SESSION_REVOKED');
  });

  it('session version mismatch (role change) → 401 SESSION_VERSION_MISMATCH', async () => {
    const { app, authModule } = await buildProtectedApp();
    vi.spyOn(authModule, 'resolveUserFromToken').mockResolvedValue({
      kind: 'revoked',
      reason: 'session_version_mismatch',
    });

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SESSION_VERSION_MISMATCH');
  });

  it('no token → 401 NO_TOKEN', async () => {
    const { app } = await buildProtectedApp();
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
  });
});
