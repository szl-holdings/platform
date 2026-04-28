/**
 * Admin Audit Log — tenant (org) filter
 *
 * Verifies GET /admin/audit-log?orgId=<id> correctly scopes results to members
 * of the specified org, for both JSON and CSV responses.
 *
 * Because drizzle-orm is mocked, the WHERE condition built by the handler cannot
 * be evaluated by the DB stub.  Instead we:
 *   1. Spy on `inArray` to assert it was called with the correct member-userId set.
 *   2. Return only matching rows from the DB stub (simulating the WHERE effect)
 *      based on which userId values the member-lookup resolved.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auditEventsTable = { __t: 'auditEventsTable' };
const usersTable = { __t: 'usersTable' };
const orgMembersTable = { __t: 'orgMembersTable' };
const organizationsTable = { __t: 'organizationsTable' };
const rolesTable = { __t: 'rolesTable' };
const userRolesTable = { __t: 'userRolesTable' };
const exportJobsTable = { __t: 'exportJobsTable' };

let orgMemberRows: { userId: number }[] = [];
let auditRows: {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  createdAt: Date;
}[] = [];

const inArraySpy = vi.fn((_col: unknown, _vals: unknown) => ({}));

vi.mock('@szl-holdings/db', () => {
  function makeSelect() {
    let _fromTable: unknown = null;
    const chain = {
      from(t: unknown) {
        _fromTable = t;
        return chain;
      },
      leftJoin(_t: unknown, _on: unknown) {
        return chain;
      },
      where(_cond: unknown) {
        return chain;
      },
      orderBy(_col: unknown) {
        return chain;
      },
      limit(_n: number) {
        if (_fromTable === orgMembersTable) return Promise.resolve(orgMemberRows);
        if (_fromTable === auditEventsTable) {
          const memberIds = orgMemberRows.map((m) => m.userId);
          if (memberIds.length === 0 && orgMemberRows !== null) {
            return Promise.resolve(auditRows);
          }
          const filtered =
            memberIds.length > 0
              ? auditRows.filter((r) => r.userId !== null && memberIds.includes(r.userId))
              : auditRows;
          return Promise.resolve(filtered);
        }
        return Promise.resolve([]);
      },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        const p: Promise<unknown> = (() => {
          if (_fromTable === orgMembersTable) return Promise.resolve(orgMemberRows);
          if (_fromTable === auditEventsTable) {
            const memberIds = orgMemberRows.map((m) => m.userId);
            const filtered =
              memberIds.length > 0
                ? auditRows.filter((r) => r.userId !== null && memberIds.includes(r.userId))
                : auditRows;
            return Promise.resolve(filtered);
          }
          return Promise.resolve([]);
        })();
        return p.then(resolve, reject);
      },
    };
    return chain;
  }

  return {
    db: {
      select: (_fields?: unknown) => makeSelect(),
      insert: () => ({ values: () => Promise.resolve() }),
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
      delete: () => ({ where: () => Promise.resolve() }),
    },
    auditEventsTable,
    usersTable,
    orgMembersTable,
    organizationsTable,
    rolesTable,
    userRolesTable,
    exportJobsTable,
  };
});

vi.mock('drizzle-orm', () => {
  const noop = (..._a: unknown[]) => ({});
  return {
    eq: noop,
    and: (...args: unknown[]) => args,
    or: noop,
    desc: noop,
    gte: noop,
    lte: noop,
    ilike: noop,
    inArray: (col: unknown, vals: unknown) => inArraySpy(col, vals),
    sql: Object.assign(noop, { raw: noop }),
  };
});

vi.mock('@szl-holdings/audit', () => ({
  hashIp: (ip: string | null) => (ip ? `hashed-${ip}` : null),
}));

vi.mock('@szl-holdings/platform-registry', () => ({ resolveRuntimeMode: () => 'standard' }));

vi.mock('../../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../../middlewares/auth.js', () => ({
  requireRole:
    (..._roles: string[]) =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  authMiddleware:
    () =>
    (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (req as express.Request & { user: { id: number } }).user = { id: 1 };
      next();
    },
}));

vi.mock('../../middlewares/session-policy.js', () => ({
  revokeUserSessionsOnRoleChange: vi.fn(() => Promise.resolve({ revokedCount: 0 })),
}));

async function buildApp() {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  const { register } = await import('../admin/users.js');
  register(router);
  app.use(router);
  return app;
}

function makeAuditRow(
  id: number,
  userId: number | null,
  action = 'user.login',
): (typeof auditRows)[0] {
  return {
    id,
    action,
    entityType: 'user',
    entityId: userId ? String(userId) : null,
    userId,
    userName: userId ? `User ${userId}` : null,
    userEmail: userId ? `user${userId}@example.com` : null,
    oldValues: null,
    newValues: null,
    ipAddress: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  };
}

describe('GET /admin/audit-log — tenant filter (orgId)', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.resetModules();
    inArraySpy.mockClear();
    orgMemberRows = [];
    auditRows = [];
    app = await buildApp();
  });

  it('no orgId — returns all events and does not call inArray', async () => {
    auditRows = [makeAuditRow(1, 10), makeAuditRow(2, 20), makeAuditRow(3, 30)];

    const res = await request(app).get('/admin/audit-log');

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(3);
    expect(inArraySpy).not.toHaveBeenCalled();
  });

  it('orgId with members — calls inArray with resolved member userIds', async () => {
    orgMemberRows = [{ userId: 10 }];
    auditRows = [makeAuditRow(1, 10, 'user.login'), makeAuditRow(2, 20, 'user.deactivated')];

    const res = await request(app).get('/admin/audit-log?orgId=5');

    expect(res.status).toBe(200);
    expect(inArraySpy).toHaveBeenCalledOnce();
    const [_col, passedIds] = inArraySpy.mock.calls[0] as [unknown, number[]];
    expect(passedIds).toEqual([10]);
  });

  it('orgId with members — response contains only member events (userId 10, not 20)', async () => {
    orgMemberRows = [{ userId: 10 }];
    auditRows = [makeAuditRow(1, 10, 'user.login'), makeAuditRow(2, 20, 'user.deactivated')];

    const res = await request(app).get('/admin/audit-log?orgId=5');

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.logs[0].id).toBe('log_1');
    expect(res.body.logs[0].actor).toBe('user10@example.com');
  });

  it('orgId with no members — returns empty JSON without querying audit events', async () => {
    orgMemberRows = [];
    auditRows = [makeAuditRow(1, 10)];

    const res = await request(app).get('/admin/audit-log?orgId=99');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ logs: [], total: 0 });
    expect(inArraySpy).not.toHaveBeenCalled();
  });

  it('orgId with no members — CSV format returns header-only (no data rows)', async () => {
    orgMemberRows = [];
    auditRows = [makeAuditRow(1, 10)];

    const res = await request(app).get('/admin/audit-log?orgId=99&format=csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/audit-log\.csv/);
    const lines = res.text.trim().split(/\r?\n/);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('"ID"');
    expect(lines[0]).toContain('"Action"');
  });

  it('non-numeric orgId — returns 400', async () => {
    const res = await request(app).get('/admin/audit-log?orgId=not-a-number');
    expect(res.status).toBe(400);
  });

  it('orgId=0 — returns 400 (must be positive integer)', async () => {
    const res = await request(app).get('/admin/audit-log?orgId=0');
    expect(res.status).toBe(400);
  });

  it('CSV export with orgId and members — includes only member events', async () => {
    orgMemberRows = [{ userId: 10 }];
    auditRows = [
      makeAuditRow(1, 10, 'user.login'),
      makeAuditRow(2, 20, 'user.deactivated'),
    ];

    const res = await request(app).get('/admin/audit-log?orgId=5&format=csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    const lines = res.text.trim().split(/\r?\n/);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('"Action"');
    expect(lines[1]).toContain('user.login');
    expect(lines[1]).not.toContain('user.deactivated');
    expect(inArraySpy).toHaveBeenCalledOnce();
    const [_col, passedIds] = inArraySpy.mock.calls[0] as [unknown, number[]];
    expect(passedIds).toEqual([10]);
  });

  it('feature flag disabled — returns 403', async () => {
    const { isFlagEnabled } = await import('../../lib/platform-flags.js');
    vi.mocked(isFlagEnabled).mockResolvedValueOnce(false);

    const res = await request(app).get('/admin/audit-log?orgId=5');

    expect(res.status).toBe(403);
  });
});
