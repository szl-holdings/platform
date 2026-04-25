/**
 * GET /admin/audit-log — org name attribution tests
 *
 * Verifies that each log row is annotated with the correct org name:
 *   (a) User in exactly one org → orgName is that org's name.
 *   (b) User with no orgs → orgName is null (field present, value null).
 *   (c) User in multiple orgs → orgName is null (avoids misleading labels).
 *   (d) When the orgId filter is active, all rows receive the filtered org's
 *       name regardless of what the per-row subquery returns (accurate since
 *       all events are already scoped to members of that org).
 *   (e) CSV export includes the "Org" column.
 *
 * The database, drizzle operators, auth middleware, and the feature-flag
 * helper are mocked so no live DB connection is required.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Table identity tokens — referenced in the DB mock to route each query
// ---------------------------------------------------------------------------
const auditEventsTable = { __t: 'auditEventsTable' };
const usersTable = { __t: 'usersTable' };
const organizationsTable = { __t: 'organizationsTable' };
const orgMembersTable = { __t: 'orgMembersTable' };
const rolesTable = { __t: 'rolesTable' };
const userRolesTable = { __t: 'userRolesTable' };
const exportJobsTable = { __t: 'exportJobsTable' };

// ---------------------------------------------------------------------------
// Mutable mock state — reset in beforeEach
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

describe('GET /admin/audit-log — org name attribution', () => {
  it('includes orgName in each row when the subquery resolves a single org', async () => {
    auditLogRows = [makeRow({ orgName: 'Acme Corp' })];

    const res = await request(buildApp()).get('/admin/audit-log');

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.logs[0].orgName).toBe('Acme Corp');
  });

  it('sets orgName to null when the subquery returns null (user has no org)', async () => {
    auditLogRows = [makeRow({ orgName: null })];

    const res = await request(buildApp()).get('/admin/audit-log');

    expect(res.status).toBe(200);
    expect(res.body.logs[0].orgName).toBeNull();
  });

  it('sets orgName to null when the subquery returns null (user is in multiple orgs)', async () => {
    auditLogRows = [makeRow({ orgName: null })];

    const res = await request(buildApp()).get('/admin/audit-log');

    expect(res.status).toBe(200);
    expect(res.body.logs[0].orgName).toBeNull();
  });

  it('overrides per-row orgName with the filtered org name when orgId filter is active', async () => {
    orgNameRows = [{ name: 'FilteredOrg' }];
    memberRows = [{ userId: 10 }];
    auditLogRows = [makeRow({ orgName: null })];

    const res = await request(buildApp()).get('/admin/audit-log?orgId=99');

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.logs[0].orgName).toBe('FilteredOrg');
  });

  it('returns 400 for a non-numeric orgId', async () => {
    const res = await request(buildApp()).get('/admin/audit-log?orgId=abc');
    expect(res.status).toBe(400);
  });

  it('returns an empty result when the filtered org has no members', async () => {
    orgNameRows = [{ name: 'EmptyOrg' }];
    memberRows = [];

    const res = await request(buildApp()).get('/admin/audit-log?orgId=5');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ logs: [], total: 0 });
  });

  it('each log entry exposes the orgName field (even when null)', async () => {
    auditLogRows = [makeRow({ orgName: null })];

    const res = await request(buildApp()).get('/admin/audit-log');

    expect(res.status).toBe(200);
    const [entry] = res.body.logs as Array<Record<string, unknown>>;
    expect(Object.prototype.hasOwnProperty.call(entry, 'orgName')).toBe(true);
  });

  it('CSV export includes the Org column header', async () => {
    auditLogRows = [makeRow({ orgName: 'TenantX' })];

    const res = await request(buildApp()).get('/admin/audit-log?format=csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/i);
    const firstLine = (res.text as string).split('\r\n')[0];
    expect(firstLine).toContain('"Org"');
  });

  it('CSV export includes org name in each data row', async () => {
    auditLogRows = [makeRow({ orgName: 'TenantX' })];

    const res = await request(buildApp()).get('/admin/audit-log?format=csv');

    expect(res.status).toBe(200);
    const lines = (res.text as string).split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[1]).toContain('"TenantX"');
  });

  it('filtered org name appears in CSV rows when orgId filter is active', async () => {
    orgNameRows = [{ name: 'SpecificOrg' }];
    memberRows = [{ userId: 10 }];
    auditLogRows = [makeRow({ orgName: null })];

    const res = await request(buildApp()).get('/admin/audit-log?orgId=7&format=csv');

    expect(res.status).toBe(200);
    const lines = (res.text as string).split('\r\n');
    expect(lines[1]).toContain('"SpecificOrg"');
  });
});
