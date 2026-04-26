import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auditEventsTable = { __t: 'auditEventsTable' };
const usersTable = { __t: 'usersTable' };
const organizationsTable = { __t: 'organizationsTable' };
const orgMembersTable = { __t: 'orgMembersTable' };
const rolesTable = { __t: 'rolesTable' };
const userRolesTable = { __t: 'userRolesTable' };
const exportJobsTable = { __t: 'exportJobsTable' };

interface AuditRow {
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
  orgName: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
}

let auditLogRows: AuditRow[] = [];
let userDetailRow: { id: number; email: string; displayName: string | null; avatarUrl: string | null; isActive: boolean; lastLoginAt: Date | null; createdAt: Date } | null = null;

function makeChain(data: unknown[]) {
  const self: Record<string, unknown> = {};
  const terminal = (n?: number) =>
    Promise.resolve(n !== undefined ? (data as unknown[]).slice(0, n) : data);
  Object.assign(self, {
    leftJoin: () => self,
    innerJoin: () => self,
    where: () => self,
    orderBy: () => self,
    limit: (n: number) => terminal(n),
    offset: () => self,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(data).then(resolve, reject),
  });
  return self;
}

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        if (table === auditEventsTable) return makeChain(auditLogRows);
        if (table === usersTable) return makeChain(userDetailRow ? [userDetailRow] : []);
        return makeChain([]);
      },
    }),
    insert: () => ({ values: () => ({ onConflictDoNothing: () => Promise.resolve() }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => Promise.resolve() }),
  },
  auditEventsTable,
  usersTable,
  organizationsTable,
  orgMembersTable,
  rolesTable,
  userRolesTable,
  exportJobsTable,
}));

vi.mock('drizzle-orm', () => {
  const noop = (..._a: unknown[]) => ({});
  return {
    eq: noop,
    and: (...args: unknown[]) => args[0],
    or: noop,
    desc: noop,
    gte: noop,
    lte: noop,
    ilike: noop,
    inArray: noop,
    sql: Object.assign(
      (_strings: TemplateStringsArray, ..._vals: unknown[]) => null,
      { raw: noop },
    ),
  };
});

vi.mock('@szl-holdings/audit', () => ({
  hashIp: (ip: string | null | undefined) => (ip ? `hashed-${ip}` : null),
}));

vi.mock('@szl-holdings/config', () => ({
  resolveRuntimeMode: () => 'standard',
}));

vi.mock('../../lib/platform-flags', () => ({
  isFlagEnabled: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../middlewares/auth', () => ({
  requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  authMiddleware:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));
vi.mock('../../middlewares/auth.js', () => ({
  requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  authMiddleware:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

vi.mock('../../middlewares/session-policy', () => ({
  revokeUserSessionsOnRoleChange: vi.fn(() => Promise.resolve()),
}));
vi.mock('../../middlewares/session-policy.js', () => ({
  revokeUserSessionsOnRoleChange: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../lib/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/validation')>();
  return {
    ...actual,
    validateQuery: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
    validateBody: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  };
});

function makeRow(overrides: Partial<AuditRow> = {}): AuditRow {
  return {
    id: 1,
    action: 'user.role.assigned',
    entityType: 'user',
    entityId: '42',
    userId: 10,
    userName: 'Admin',
    userEmail: 'admin@example.com',
    oldValues: null,
    newValues: { roleName: 'ops', roleId: 2, targetUserEmail: 'alice@example.com', action: 'add' },
    ipAddress: '1.2.3.4',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    orgName: null,
    ...overrides,
  };
}

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
  auditLogRows = [];
  userDetailRow = null;
  vi.clearAllMocks();
});

describe('GET /admin/audit-log — entityType + entityId filtering', () => {
  it('returns 200 with matching role change events when entityType and entityId are provided', async () => {
    auditLogRows = [
      makeRow({
        id: 1,
        action: 'user.role.assigned',
        entityType: 'user',
        entityId: '42',
        newValues: { roleName: 'ops', roleId: 2 },
        createdAt: new Date('2025-01-15T10:00:00Z'),
      }),
      makeRow({
        id: 2,
        action: 'user.role.removed',
        entityType: 'user',
        entityId: '42',
        newValues: { roleName: 'viewer', roleId: 1 },
        createdAt: new Date('2025-01-14T09:00:00Z'),
      }),
    ];

    const res = await request(buildApp()).get(
      '/admin/audit-log?entityType=user&entityId=42&action=user.role.',
    );

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(2);
    expect(res.body.logs[0].action).toBe('user.role.assigned');
    expect(res.body.logs[0].target).toBe('user/42');
    expect(res.body.logs[1].action).toBe('user.role.removed');
    expect(res.body.logs[1].target).toBe('user/42');
  });

  it('returns empty logs when no role change events exist for the entity', async () => {
    auditLogRows = [];

    const res = await request(buildApp()).get(
      '/admin/audit-log?entityType=user&entityId=999&action=user.role.',
    );

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('each log entry includes action, actor, target, timestamp, and details', async () => {
    auditLogRows = [
      makeRow({
        id: 5,
        action: 'user.role.assigned',
        entityType: 'user',
        entityId: '7',
        userEmail: 'admin@corp.com',
        newValues: { roleName: 'admin', roleId: 3, targetUserEmail: 'bob@corp.com' },
        createdAt: new Date('2025-03-01T14:30:00Z'),
      }),
    ];

    const res = await request(buildApp()).get(
      '/admin/audit-log?entityType=user&entityId=7&action=user.role.',
    );

    expect(res.status).toBe(200);
    const entry = res.body.logs[0];
    expect(entry.action).toBe('user.role.assigned');
    expect(entry.actor).toBe('admin@corp.com');
    expect(entry.target).toBe('user/7');
    expect(entry.timestamp).toBe('2025-03-01T14:30:00.000Z');
    expect(entry.details).toContain('admin');
  });

  it('returns 403 when feature flag is disabled', async () => {
    const { isFlagEnabled } = await import('../../lib/platform-flags');
    vi.mocked(isFlagEnabled).mockResolvedValueOnce(false);

    const res = await request(buildApp()).get(
      '/admin/audit-log?entityType=user&entityId=42',
    );

    expect(res.status).toBe(403);
  });
});

describe('GET /admin/users/:id/role-history — dedicated endpoint', () => {
  it('returns 400 for invalid user ID', async () => {
    const res = await request(buildApp()).get('/admin/users/abc/role-history');
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent user', async () => {
    userDetailRow = null;
    const res = await request(buildApp()).get('/admin/users/999/role-history');
    expect(res.status).toBe(404);
  });

  it('returns role history entries with correct shape for existing user', async () => {
    userDetailRow = {
      id: 42,
      email: 'alice@example.com',
      displayName: 'Alice',
      avatarUrl: null,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date('2024-06-01'),
    };
    auditLogRows = [
      makeRow({
        id: 10,
        action: 'user.role.assigned',
        entityType: 'user',
        entityId: '42',
        userEmail: 'admin@example.com',
        actorEmail: 'admin@example.com',
        actorName: 'Admin',
        newValues: { roleName: 'ops', roleId: 2 },
        createdAt: new Date('2025-02-01T08:00:00Z'),
      }),
      makeRow({
        id: 11,
        action: 'user.role.removed',
        entityType: 'user',
        entityId: '42',
        userEmail: 'admin@example.com',
        actorEmail: 'admin@example.com',
        actorName: 'Admin',
        newValues: { roleName: 'viewer', roleId: 1 },
        createdAt: new Date('2025-01-15T12:00:00Z'),
      }),
    ];

    const res = await request(buildApp()).get('/admin/users/42/role-history');

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);

    const first = res.body.entries[0];
    expect(first.action).toBe('assigned');
    expect(first.roleName).toBe('ops');
    expect(first.actorEmail).toBe('admin@example.com');
    expect(first.timestamp).toBe('2025-02-01T08:00:00.000Z');

    const second = res.body.entries[1];
    expect(second.action).toBe('removed');
    expect(second.roleName).toBe('viewer');
    expect(second.actorEmail).toBe('admin@example.com');
  });

  it('returns empty entries when no role changes exist', async () => {
    userDetailRow = {
      id: 42,
      email: 'alice@example.com',
      displayName: 'Alice',
      avatarUrl: null,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date('2024-06-01'),
    };
    auditLogRows = [];

    const res = await request(buildApp()).get('/admin/users/42/role-history');

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});
