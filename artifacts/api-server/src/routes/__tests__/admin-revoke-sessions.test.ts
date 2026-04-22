/**
 * POST /admin/users/:id/revoke-sessions — admin force sign-out
 *
 * Verifies the security-sensitive endpoint that immediately invalidates a
 * user's active sessions:
 *   (a) only admins may call it (non-admin → 403),
 *   (b) calling it bumps the target user's session_version and revokes their
 *       active session rows,
 *   (c) an audit event with reason `admin_force_logout` is written,
 *   (d) an unknown user id returns 404 and an invalid id returns 400.
 *
 * The route delegates to the real `revokeUserSessionsOnRoleChange` in
 * `middlewares/session-policy.ts`, which we deliberately keep unmocked so
 * the test exercises the actual session-version bump / row revoke / audit
 * write path. Only the database, drizzle operators, and the auth lib (to
 * avoid pulling the OIDC client) are mocked.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Table identity tokens — used to discriminate which table each db call
// targeted in our mock.
// ---------------------------------------------------------------------------
const usersTable = { __t: 'usersTable' };
const sessionsTable = { __t: 'sessionsTable' };
const auditEventsTable = { __t: 'auditEventsTable' };
const rolesTable = { __t: 'rolesTable' };
const userRolesTable = { __t: 'userRolesTable' };
const organizationsTable = { __t: 'organizationsTable' };
const orgMembersTable = { __t: 'orgMembersTable' };
const exportJobsTable = { __t: 'exportJobsTable' };

// ---------------------------------------------------------------------------
// Mutable mock state — reset in beforeEach.
// ---------------------------------------------------------------------------
let userLookup: { id: number } | null = null;
let activeSessions: Array<{ id: number }> = [];
let sessionVersionAfterBump = 0;
const inserts: Array<{ table: unknown; values: Record<string, unknown> }> = [];
const updates: Array<{ table: unknown; set: Record<string, unknown> }> = [];

function selectChain(table: unknown) {
  const result =
    table === usersTable
      ? userLookup
        ? [userLookup]
        : []
      : table === sessionsTable
        ? activeSessions
        : [];
  const p = Promise.resolve(result);
  return {
    where: () => ({
      limit: () => p,
      then: (r: (v: unknown) => unknown, rj?: (e: unknown) => unknown) => p.then(r, rj),
    }),
    orderBy: () => ({ limit: () => p }),
    then: (r: (v: unknown) => unknown, rj?: (e: unknown) => unknown) => p.then(r, rj),
  };
}

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({ from: (table: unknown) => selectChain(table) }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        inserts.push({ table, values });
        return Promise.resolve();
      },
    }),
    update: (table: unknown) => ({
      set: (set: Record<string, unknown>) => {
        updates.push({ table, set });
        const returningResult =
          table === usersTable && set['sessionVersion']
            ? [{ sessionVersion: sessionVersionAfterBump }]
            : [];
        const p = Promise.resolve(returningResult);
        return {
          where: () => ({
            returning: () => p,
            then: (r: (v: unknown) => unknown, rj?: (e: unknown) => unknown) =>
              Promise.resolve(undefined).then(r, rj),
          }),
        };
      },
    }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  },
  usersTable,
  sessionsTable,
  auditEventsTable,
  rolesTable,
  userRolesTable,
  organizationsTable,
  orgMembersTable,
  exportJobsTable,
}));

vi.mock('drizzle-orm', () => {
  const noop = (..._a: unknown[]) => ({});
  return {
    eq: noop,
    ne: noop,
    and: noop,
    or: noop,
    desc: noop,
    asc: noop,
    isNull: noop,
    isNotNull: noop,
    inArray: noop,
    notInArray: noop,
    sql: Object.assign(noop, { raw: noop }),
    count: noop,
    gt: noop,
    gte: noop,
    lt: noop,
    lte: noop,
    like: noop,
    ilike: noop,
    not: noop,
  };
});

vi.mock('@szl-holdings/audit', () => ({
  hashIp: (ip: string | null | undefined) => (ip ? `hashed-${ip}` : null),
}));

vi.mock('../../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn(async () => true),
}));

vi.mock('../../lib/logger.js', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});
vi.mock('../../lib/logger', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});

// Avoid pulling the OIDC client and friends; session-policy only needs
// SESSION_COOKIE / SESSION_TTL / setSessionCookie symbols to be importable.
vi.mock('../../lib/auth', () => ({
  SESSION_COOKIE: '__Host-sid',
  LEGACY_SESSION_COOKIE: 'sid',
  SESSION_TTL: 7 * 24 * 60 * 60 * 1000,
  setSessionCookie: vi.fn(),
  readSessionCookie: vi.fn(() => undefined),
}));

// ---------------------------------------------------------------------------
// Auth mock — controls the role of the caller.
// ---------------------------------------------------------------------------
let currentUser: { id: number; email: string; roles: string[] } | null = null;

vi.mock('../../middlewares/auth.js', () => ({
  requireRole:
    (..._allowed: string[]) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ): void => {
      if (!currentUser) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      (req as express.Request & { user: typeof currentUser }).user = currentUser;
      // Mirror the production policy: `admin` and `super_admin` are accepted
      // by every requireRole call.
      if (
        currentUser.roles.includes('admin') ||
        currentUser.roles.includes('super_admin')
      ) {
        next();
        return;
      }
      res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    },
}));

const { register } = await import('../admin/users.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  register(router);
  app.use(router);
  return app;
}

beforeEach(() => {
  inserts.length = 0;
  updates.length = 0;
  userLookup = { id: 42 };
  activeSessions = [{ id: 1001 }, { id: 1002 }];
  sessionVersionAfterBump = 7;
  currentUser = { id: 99, email: 'admin@example.com', roles: ['admin'] };
});

describe('POST /admin/users/:id/revoke-sessions', () => {
  it('rejects non-admin callers with 403 and does not mutate any state', async () => {
    currentUser = { id: 50, email: 'member@example.com', roles: ['member'] };

    const res = await request(buildApp())
      .post('/admin/users/42/revoke-sessions')
      .send({});

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: 'Forbidden' });
    expect(updates).toHaveLength(0);
    expect(inserts).toHaveLength(0);
  });

  it('returns 400 for a non-numeric user id', async () => {
    const res = await request(buildApp())
      .post('/admin/users/not-an-id/revoke-sessions')
      .send({});

    expect(res.status).toBe(400);
    expect(updates).toHaveLength(0);
    expect(inserts).toHaveLength(0);
  });

  it('returns 400 for a non-positive user id', async () => {
    const res = await request(buildApp())
      .post('/admin/users/0/revoke-sessions')
      .send({});

    expect(res.status).toBe(400);
    expect(updates).toHaveLength(0);
    expect(inserts).toHaveLength(0);
  });

  it('returns 404 when the target user does not exist', async () => {
    userLookup = null;

    const res = await request(buildApp())
      .post('/admin/users/9999/revoke-sessions')
      .send({});

    expect(res.status).toBe(404);
    // No session_version bump or audit write should occur for a missing user.
    expect(updates).toHaveLength(0);
    expect(inserts).toHaveLength(0);
  });

  it('bumps session_version, revokes active sessions, writes an audit event with reason admin_force_logout, and returns 200', async () => {
    const res = await request(buildApp())
      .post('/admin/users/42/revoke-sessions')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      userId: 42,
      revokedSessionCount: 2,
      message: 'Sessions revoked',
    });

    // (b1) session_version bump on the target user row.
    const versionBumps = updates.filter(
      (u) => u.table === usersTable && 'sessionVersion' in u.set,
    );
    expect(versionBumps).toHaveLength(1);

    // (b2) active session rows revoked with reason admin_force_logout.
    const sessionRevokes = updates.filter(
      (u) => u.table === sessionsTable && 'revokedAt' in u.set,
    );
    expect(sessionRevokes).toHaveLength(1);
    expect(sessionRevokes[0]?.set['revokedReason']).toBe('admin_force_logout');

    // (c) audit event with reason admin_force_logout.
    const auditWrites = inserts.filter((i) => i.table === auditEventsTable);
    expect(auditWrites).toHaveLength(1);
    const audit = auditWrites[0]!.values as {
      action: string;
      entityType: string;
      entityId: string;
      userId: number | null;
      newValues: Record<string, unknown>;
    };
    expect(audit.action).toBe('session.invalidate');
    expect(audit.entityType).toBe('user');
    expect(audit.entityId).toBe('42');
    expect(audit.userId).toBe(99);
    expect(audit.newValues).toMatchObject({
      targetUserId: 42,
      revokedSessionCount: 2,
      newSessionVersion: 7,
      reason: 'admin_force_logout',
    });
  });

  it('still bumps session_version and writes the audit event when the user has zero active sessions', async () => {
    activeSessions = [];

    const res = await request(buildApp())
      .post('/admin/users/42/revoke-sessions')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.revokedSessionCount).toBe(0);

    // session_version is bumped even when no rows existed to revoke,
    // ensuring any in-flight tokens fail the version check on next use.
    const versionBumps = updates.filter(
      (u) => u.table === usersTable && 'sessionVersion' in u.set,
    );
    expect(versionBumps).toHaveLength(1);

    // No session-row revoke update when the list was already empty.
    const sessionRevokes = updates.filter((u) => u.table === sessionsTable);
    expect(sessionRevokes).toHaveLength(0);

    // Audit still written so the admin action is traceable.
    const auditWrites = inserts.filter((i) => i.table === auditEventsTable);
    expect(auditWrites).toHaveLength(1);
    expect(
      (auditWrites[0]!.values as { newValues: Record<string, unknown> })
        .newValues,
    ).toMatchObject({
      reason: 'admin_force_logout',
      revokedSessionCount: 0,
    });
  });
});
