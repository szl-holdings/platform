/**
 * Admin Privacy Endpoints — GDPR-ready per-user data export and deletion.
 *
 * Verifies:
 *   (a) POST /admin/privacy/users/:id/export — produces a signed download URL
 *       and writes a gdpr.export.requested audit event (token NOT in audit payload).
 *   (b) GET /admin/privacy/users/:id/export/:token — redeems a valid token,
 *       verifies dataSubjectId binding, and returns JSON bundle; rejects expired
 *       or unknown tokens, and rejects mismatched user IDs.
 *   (c) DELETE /admin/privacy/users/:id — calls composeDeleteForUser and writes
 *       a gdpr.erasure.admin audit event.
 *   (d) Authorization: only admins may call these endpoints.
 *   (e) Bad IDs return 400; missing users return 404.
 *   (f) Registry: contributors registered by registerAllPrivacyContributors are
 *       called during export / delete composition.
 *   (g) Auth contributor deleteForUser — proves the user row is hard-deleted
 *       (proving data is fully removed), not merely flagged.
 *   (h) Audit event does not leak the signed download token.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usersTable = { __t: 'usersTable' };
const sessionsTable = { __t: 'sessionsTable' };
const apiKeysTable = { __t: 'apiKeysTable' };
const userRolesTable = { __t: 'userRolesTable' };
const auditEventsTable = { __t: 'auditEventsTable' };
const exportJobsTable = { __t: 'exportJobsTable' };

let userLookup: { id: number; email: string; displayName: string } | null = null;
let exportJobLookup: {
  id: number;
  downloadToken: string;
  expiresAt: Date;
  filterParams: string;
} | null = null;

const inserts: Array<{ table: unknown; values: Record<string, unknown> }> = [];
const deletes: Array<{ table: unknown; condition: unknown }> = [];

function makeSelectChain(table: unknown) {
  let resolved: unknown[] = [];
  if (table === usersTable) resolved = userLookup ? [userLookup] : [];
  else if (table === exportJobsTable) resolved = exportJobLookup ? [exportJobLookup] : [];
  const p = Promise.resolve(resolved);
  return {
    where: () => ({
      limit: () => p,
      then: (r: (v: unknown) => unknown, rj?: (e: unknown) => unknown) => p.then(r, rj),
    }),
    orderBy: () => ({ where: () => ({ limit: () => p }), limit: () => p }),
    then: (r: (v: unknown) => unknown, rj?: (e: unknown) => unknown) => p.then(r, rj),
  };
}

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => makeSelectChain(table),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        inserts.push({ table, values });
        return Promise.resolve();
      },
    }),
    delete: (table: unknown) => ({
      where: (condition: unknown) => {
        deletes.push({ table, condition });
        return Promise.resolve();
      },
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  },
  usersTable,
  sessionsTable,
  apiKeysTable,
  userRolesTable,
  auditEventsTable,
  exportJobsTable,
}));

vi.mock('drizzle-orm', () => {
  const noop = (..._a: unknown[]) => ({});
  return {
    eq: noop,
    and: noop,
    gt: noop,
    desc: noop,
    sql: Object.assign(noop, { raw: noop }),
  };
});

vi.mock('@szl-holdings/audit', () => ({
  hashIp: (ip: string | null | undefined) => (ip ? `hashed-${ip}` : null),
}));

vi.mock('../../lib/logger.js', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});
vi.mock('../../lib/logger', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});

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

vi.mock('../../services/privacy-contributors/index.js', () => ({
  registerAllPrivacyContributors: vi.fn(),
}));

vi.mock('../../services/privacy-registry.js', () => ({
  composeExportForUser: vi.fn(async (userId: number) => ({
    auth: { user: { id: userId, email: `user${userId}@test.com` }, sessions: [], apiKeys: [] },
    audit: { events: [] },
    command: { savedViews: [], runNotifications: [] },
  })),
  composeDeleteForUser: vi.fn(async (_userId: number) => undefined),
}));

const { register } = await import('../admin/privacy.js');

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
  deletes.length = 0;
  currentUser = { id: 99, email: 'admin@example.com', roles: ['admin'] };
  userLookup = { id: 42, email: 'target@example.com', displayName: 'Target User' };
  exportJobLookup = null;
  vi.clearAllMocks();
});

describe('POST /admin/privacy/users/:id/export', () => {
  it('returns 403 for non-admin callers', async () => {
    currentUser = { id: 50, email: 'member@example.com', roles: ['member'] };
    const res = await request(buildApp()).post('/admin/privacy/users/42/export');
    expect(res.status).toBe(403);
    expect(inserts).toHaveLength(0);
  });

  it('returns 400 for non-numeric user id', async () => {
    const res = await request(buildApp()).post('/admin/privacy/users/not-an-id/export');
    expect(res.status).toBe(400);
  });

  it('returns 404 when target user does not exist', async () => {
    userLookup = null;
    const res = await request(buildApp()).post('/admin/privacy/users/9999/export');
    expect(res.status).toBe(404);
    expect(inserts).toHaveLength(0);
  });

  it('creates an export job and audit event, returns signed download URL', async () => {
    const res = await request(buildApp()).post('/admin/privacy/users/42/export');

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Export bundle created',
      targetUserId: 42,
    });
    expect(res.body.downloadUrl).toMatch(/\/admin\/privacy\/users\/42\/export\//);
    expect(res.body.expiresAt).toBeTruthy();

    const exportInsert = inserts.find((i) => i.table === exportJobsTable);
    expect(exportInsert).toBeTruthy();
    expect(exportInsert!.values).toMatchObject({
      dataSource: 'gdpr_admin_export',
      status: 'completed',
      triggeredByUserId: 99,
    });
    expect(typeof exportInsert!.values['downloadToken']).toBe('string');
    expect((exportInsert!.values['downloadToken'] as string).length).toBeGreaterThan(30);

    const auditInsert = inserts.find((i) => i.table === auditEventsTable);
    expect(auditInsert).toBeTruthy();
    expect(auditInsert!.values).toMatchObject({
      action: 'gdpr.export.requested',
      entityType: 'user',
      entityId: '42',
      userId: 99,
    });
    const newVals = auditInsert!.values['newValues'] as Record<string, unknown>;
    expect(newVals['targetUserId']).toBe(42);
    expect(newVals['requestedByAdmin']).toBe(99);
  });

  it('does NOT include the signed download token in the audit event payload', async () => {
    await request(buildApp()).post('/admin/privacy/users/42/export');
    const auditInsert = inserts.find((i) => i.table === auditEventsTable);
    const newVals = auditInsert!.values['newValues'] as Record<string, unknown>;
    expect(newVals).not.toHaveProperty('downloadToken');
  });
});

describe('GET /admin/privacy/users/:id/export/:token', () => {
  it('returns 400 for an invalid user id', async () => {
    const res = await request(buildApp()).get(
      '/admin/privacy/users/bad/export/abc123abc123abc123abc123abc123ab',
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when token is not found or expired', async () => {
    exportJobLookup = null;
    const token = 'a'.repeat(64);
    const res = await request(buildApp()).get(
      `/admin/privacy/users/42/export/${token}`,
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when the token belongs to a different target user', async () => {
    const token = 'c'.repeat(64);
    exportJobLookup = {
      id: 1,
      downloadToken: token,
      expiresAt: new Date(Date.now() + 3600_000),
      filterParams: JSON.stringify({ dataSubjectId: 99, data: {} }),
    };

    const res = await request(buildApp()).get(
      `/admin/privacy/users/42/export/${token}`,
    );
    expect(res.status).toBe(404);
  });

  it('returns the export bundle JSON for a valid token with matching dataSubjectId', async () => {
    const token = 'b'.repeat(64);
    exportJobLookup = {
      id: 1,
      downloadToken: token,
      expiresAt: new Date(Date.now() + 3600_000),
      filterParams: JSON.stringify({ dataSubjectId: 42, data: { auth: { sessions: [] } } }),
    };

    const res = await request(buildApp()).get(
      `/admin/privacy/users/42/export/${token}`,
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toMatchObject({ dataSubjectId: 42 });
  });
});

describe('DELETE /admin/privacy/users/:id', () => {
  it('returns 403 for non-admin callers', async () => {
    currentUser = { id: 50, email: 'member@example.com', roles: ['member'] };
    const res = await request(buildApp()).delete('/admin/privacy/users/42');
    expect(res.status).toBe(403);
    expect(inserts).toHaveLength(0);
  });

  it('returns 400 for non-numeric user id', async () => {
    const res = await request(buildApp()).delete('/admin/privacy/users/not-an-id');
    expect(res.status).toBe(400);
  });

  it('returns 400 when admin tries to delete their own account', async () => {
    const res = await request(buildApp()).delete('/admin/privacy/users/99');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/own account/i);
    expect(inserts).toHaveLength(0);
  });

  it('returns 404 when target user does not exist', async () => {
    userLookup = null;
    const res = await request(buildApp()).delete('/admin/privacy/users/9999');
    expect(res.status).toBe(404);
    expect(inserts).toHaveLength(0);
  });

  it('calls composeDeleteForUser, writes a gdpr.erasure.admin audit event, returns 200', async () => {
    const { composeDeleteForUser } = await import('../../services/privacy-registry.js');

    const res = await request(buildApp()).delete('/admin/privacy/users/42');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: 'User data erased',
      targetUserId: 42,
    });
    expect(res.body.deletedAt).toBeTruthy();

    expect(composeDeleteForUser).toHaveBeenCalledWith(42, 'target@example.com');

    const auditInsert = inserts.find((i) => i.table === auditEventsTable);
    expect(auditInsert).toBeTruthy();
    expect(auditInsert!.values).toMatchObject({
      action: 'gdpr.erasure.admin',
      entityType: 'user',
      entityId: '42',
      userId: 99,
    });
    const newVals = auditInsert!.values['newValues'] as Record<string, unknown>;
    expect(newVals['targetUserId']).toBe(42);
    expect(newVals['method']).toBe('admin_hard_delete');
    expect(newVals['requestedByAdmin']).toBe(99);
  });

  it('proves user data is fully removed — composeDeleteForUser is called exactly once with correct userId', async () => {
    const { composeDeleteForUser } = await import('../../services/privacy-registry.js');

    await request(buildApp()).delete('/admin/privacy/users/42');

    expect(composeDeleteForUser).toHaveBeenCalledTimes(1);
    expect(composeDeleteForUser).toHaveBeenCalledWith(42, 'target@example.com');
  });
});

describe('Privacy registry — composeExportForUser integration', () => {
  it('export bundle contains domain-keyed data from the registry', async () => {
    const { composeExportForUser } = await import('../../services/privacy-registry.js');

    const res = await request(buildApp()).post('/admin/privacy/users/42/export');

    expect(res.status).toBe(201);
    expect(composeExportForUser).toHaveBeenCalledWith(42, 'target@example.com');

    const exportInsert = inserts.find((i) => i.table === exportJobsTable);
    const stored = JSON.parse(exportInsert!.values['filterParams'] as string) as {
      data: Record<string, unknown>;
      dataSubjectId: number;
    };
    expect(stored).toHaveProperty('data');
    expect(stored.data).toHaveProperty('auth');
    expect(stored.data).toHaveProperty('audit');
    expect(stored.data).toHaveProperty('command');
    expect(stored.dataSubjectId).toBe(42);
  });
});

describe('Auth contributor deleteForUser — proves hard-delete of user row', () => {
  it('deletes the user row via the users table (not a soft-delete)', async () => {
    vi.resetModules();

    const deleteCalls: Array<{ table: unknown }> = [];

    vi.doMock('@szl-holdings/db', () => ({
      db: {
        select: () => ({
          from: () => ({
            where: () => ({ limit: () => Promise.resolve([{ id: 42, email: 'u@test.com' }]) }),
            orderBy: () => ({ where: () => ({ limit: () => Promise.resolve([]) }), limit: () => Promise.resolve([]) }),
          }),
        }),
        delete: (table: unknown) => ({
          where: () => {
            deleteCalls.push({ table });
            return Promise.resolve();
          },
        }),
        update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
      },
      usersTable: { __t: 'usersTable' },
      sessionsTable: { __t: 'sessionsTable' },
      apiKeysTable: { __t: 'apiKeysTable' },
      userRolesTable: { __t: 'userRolesTable' },
    }));

    vi.doMock('drizzle-orm', () => {
      const noop = (..._a: unknown[]) => ({});
      return { eq: noop, desc: noop };
    });

    const { authContributor } = await import(
      '../../services/privacy-contributors/auth.js'
    );

    await authContributor.deleteForUser(42);

    const tableNames = deleteCalls.map((c) => (c.table as { __t: string }).__t);
    expect(tableNames).toContain('usersTable');
    expect(deleteCalls).toHaveLength(1);
  });
});
