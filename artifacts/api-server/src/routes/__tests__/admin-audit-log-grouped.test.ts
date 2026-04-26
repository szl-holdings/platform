/**
 * GET /admin/audit-log?grouped=true — tenant-grouped response tests
 *
 * Verifies the optional grouped response shape:
 *   (a) grouped=true with no orgId returns { groups, total } where each group
 *       has orgName, count, and logs.
 *   (b) Entries are bucketed by orgName; entries with no org land in
 *       "(Platform / No Org)".
 *   (c) Groups are sorted by count descending.
 *   (d) grouped=true is ignored when orgId is also supplied — regular flat
 *       { logs, total } is returned instead.
 *   (e) grouped=false (or absent) returns the normal flat { logs, total }.
 *
 * Mocking strategy mirrors admin-audit-log-org.test.ts.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Table identity tokens
// ---------------------------------------------------------------------------
const auditEventsTable = { __t: 'auditEventsTable' };
const usersTable = { __t: 'usersTable' };
const organizationsTable = { __t: 'organizationsTable' };
const orgMembersTable = { __t: 'orgMembersTable' };
const rolesTable = { __t: 'rolesTable' };
const userRolesTable = { __t: 'userRolesTable' };
const exportJobsTable = { __t: 'exportJobsTable' };

// ---------------------------------------------------------------------------
// Mutable mock state
// ---------------------------------------------------------------------------

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
}

let auditLogRows: AuditRow[] = [];
let orgNameRows: { name: string }[] = [];
let memberRows: { userId: number }[] = [];

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
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(data).then(resolve, reject),
  });
  return self;
}

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        if (table === organizationsTable) return makeChain(orgNameRows);
        if (table === orgMembersTable) return makeChain(memberRows);
        if (table === auditEventsTable) return makeChain(auditLogRows);
        return makeChain([]);
      },
    }),
    insert: () => ({ values: () => Promise.resolve() }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
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
    action: 'user.login',
    entityType: 'user',
    entityId: '42',
    userId: 10,
    userName: 'Alice',
    userEmail: 'alice@example.com',
    oldValues: null,
    newValues: null,
    ipAddress: '1.2.3.4',
    createdAt: new Date('2025-01-01T00:00:00Z'),
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
  orgNameRows = [];
  memberRows = [];
  vi.clearAllMocks();
});

describe('GET /admin/audit-log?grouped=true — grouped response', () => {
  it('returns { groups, total } when grouped=true and no orgId filter', async () => {
    auditLogRows = [
      makeRow({ id: 1, orgName: 'Acme Corp' }),
      makeRow({ id: 2, orgName: 'Beta Inc' }),
    ];

    const res = await request(buildApp()).get('/admin/audit-log?grouped=true');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('groups');
    expect(res.body).toHaveProperty('total', 2);
    expect(Array.isArray(res.body.groups)).toBe(true);
  });

  it('each group has orgName, count, and logs array', async () => {
    auditLogRows = [
      makeRow({ id: 1, orgName: 'Acme Corp' }),
      makeRow({ id: 2, orgName: 'Acme Corp' }),
      makeRow({ id: 3, orgName: 'Beta Inc' }),
    ];

    const res = await request(buildApp()).get('/admin/audit-log?grouped=true');

    expect(res.status).toBe(200);
    const groups = res.body.groups as Array<{ orgName: string; count: number; logs: unknown[] }>;
    const acme = groups.find((g) => g.orgName === 'Acme Corp');
    const beta = groups.find((g) => g.orgName === 'Beta Inc');

    expect(acme).toBeDefined();
    expect(acme!.count).toBe(2);
    expect(Array.isArray(acme!.logs)).toBe(true);
    expect(acme!.logs).toHaveLength(2);

    expect(beta).toBeDefined();
    expect(beta!.count).toBe(1);
  });

  it('entries with no orgName land in "(Platform / No Org)" group', async () => {
    auditLogRows = [makeRow({ id: 1, orgName: null })];

    const res = await request(buildApp()).get('/admin/audit-log?grouped=true');

    expect(res.status).toBe(200);
    const groups = res.body.groups as Array<{ orgName: string; count: number; logs: unknown[] }>;
    const noOrg = groups.find((g) => g.orgName === '(Platform / No Org)');
    expect(noOrg).toBeDefined();
    expect(noOrg!.count).toBe(1);
  });

  it('groups are sorted by count descending', async () => {
    auditLogRows = [
      makeRow({ id: 1, orgName: 'Small Org' }),
      makeRow({ id: 2, orgName: 'Big Org' }),
      makeRow({ id: 3, orgName: 'Big Org' }),
      makeRow({ id: 4, orgName: 'Big Org' }),
    ];

    const res = await request(buildApp()).get('/admin/audit-log?grouped=true');

    expect(res.status).toBe(200);
    const groups = res.body.groups as Array<{ orgName: string; count: number }>;
    expect(groups[0].orgName).toBe('Big Org');
    expect(groups[0].count).toBe(3);
    expect(groups[1].orgName).toBe('Small Org');
    expect(groups[1].count).toBe(1);
  });

  it('ignores grouped=true when orgId filter is also supplied (returns flat logs)', async () => {
    orgNameRows = [{ name: 'FilteredOrg' }];
    memberRows = [{ userId: 10 }];
    auditLogRows = [makeRow({ id: 1, orgName: null })];

    const res = await request(buildApp()).get('/admin/audit-log?grouped=true&orgId=99');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(res.body).not.toHaveProperty('groups');
  });

  it('returns flat { logs, total } when grouped param is absent', async () => {
    auditLogRows = [makeRow({ id: 1, orgName: 'Acme Corp' })];

    const res = await request(buildApp()).get('/admin/audit-log');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(res.body).not.toHaveProperty('groups');
  });

  it('returns flat { logs, total } when grouped=false', async () => {
    auditLogRows = [makeRow({ id: 1, orgName: 'Acme Corp' })];

    const res = await request(buildApp()).get('/admin/audit-log?grouped=false');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(res.body).not.toHaveProperty('groups');
  });

  it('each log entry inside a group has the standard shape', async () => {
    auditLogRows = [makeRow({ id: 5, orgName: 'Acme Corp' })];

    const res = await request(buildApp()).get('/admin/audit-log?grouped=true');

    expect(res.status).toBe(200);
    const [group] = res.body.groups as Array<{ logs: Array<Record<string, unknown>> }>;
    const [entry] = group.logs;
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('action');
    expect(entry).toHaveProperty('actor');
    expect(entry).toHaveProperty('target');
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('orgName', 'Acme Corp');
  });
});
