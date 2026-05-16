/**
 * Integration tests for the runtime-config admin CRUD + history routes
 * (`routes/runtime-config.ts`).
 *
 * Locks in the contract from task #4622 — "create → read → update → verify
 * cache invalidated → delete":
 *
 *   POST   /runtime-config              creates a row
 *   GET    /runtime-config/:key         returns it
 *   PATCH  /runtime-config/:key         updates the value AND invalidates the cache
 *   DELETE /runtime-config/:key         removes it AND invalidates the cache
 *
 * Plus the audit-history contract added later:
 *
 *   PATCH  records { previousValue, newValue } metadata (redacted for sensitive)
 *   DELETE records { previousValue } metadata (redacted for sensitive)
 *   GET    /runtime-config/_history     filters by key, caps limit at 500,
 *                                       returns newest first, gated to ops/admin
 *
 * The cache invalidation hook is mocked at the module boundary so we can
 * assert the route actually called it on every successful write — a silent
 * regression there would mean operators see stale config until the TTL
 * expires.
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface Row {
  key: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  defaultValue: string | null;
  category: string;
  isSensitive: boolean;
  updatedAt?: Date;
}

interface ActivityRow {
  id: number;
  resource: string;
  resourceId: string;
  action: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userId: number | null;
}

const store = new Map<string, Row>();
const activityStore: ActivityRow[] = [];
let activityIdSeq = 1;

interface MockUser {
  id: number;
  email: string;
  roles: string[];
  orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>;
}

const OPS_USER: MockUser = {
  id: 1,
  email: 'ops@example.com',
  roles: ['ops'],
  orgs: [{ orgId: 1, orgSlug: 'org', orgName: 'Org', role: 'ops' }],
};

const MEMBER_USER: MockUser = {
  id: 2,
  email: 'member@example.com',
  roles: ['member'],
  orgs: [{ orgId: 1, orgSlug: 'org', orgName: 'Org', role: 'member' }],
};

const mockState: { currentUser: MockUser } = { currentUser: OPS_USER };

interface WhereCond {
  __op?: string;
  col?: string;
  val?: unknown;
  vals?: unknown[];
  conds?: WhereCond[];
}

function resolveActivityRows(
  whereCond: WhereCond | null,
  limit: number | null,
  orderBy: WhereCond | null,
) {
  let rows = activityStore.slice();
  const conds = whereCond?.__op === 'and' ? (whereCond.conds ?? []) : whereCond ? [whereCond] : [];
  for (const c of conds) {
    if (c.__op === 'eq' && c.col === 'al.resource') {
      rows = rows.filter((r) => r.resource === c.val);
    } else if (c.__op === 'eq' && c.col === 'al.resourceId') {
      rows = rows.filter((r) => r.resourceId === c.val);
    } else if (c.__op === 'inArray' && c.col === 'al.action') {
      rows = rows.filter((r) => (c.vals as string[]).includes(r.action));
    }
  }
  // Only apply newest-first ordering when the route explicitly requested
  // `orderBy(desc(activityLogTable.createdAt))`. Without this guard the test
  // would happily pass even if the route's ordering regressed.
  if (orderBy?.__op === 'desc' && orderBy.col === 'al.createdAt') {
    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (orderBy?.__op === 'asc' && orderBy.col === 'al.createdAt') {
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  if (limit !== null) rows = rows.slice(0, limit);
  return rows.map((r) => ({
    id: r.id,
    key: r.resourceId,
    action: r.action,
    description: r.description,
    metadata: r.metadata,
    createdAt: r.createdAt,
    userId: r.userId,
    actorName: null,
    actorEmail: null,
  }));
}

function makeSelectChain(table: { __name?: string } | undefined): unknown {
  let whereCond: WhereCond | null = null;
  let limitVal: number | null = null;
  let orderByCond: WhereCond | null = null;
  const chain: Record<string | symbol, unknown> = {};
  const proxy: unknown = new Proxy(chain, {
    get(_t, prop) {
      if (prop === 'then') {
        return (
          resolve: (v: unknown[]) => unknown,
          reject?: (e: unknown) => unknown,
        ): unknown => {
          if (table?.__name === 'activity_log') {
            return Promise.resolve(
              resolveActivityRows(whereCond, limitVal, orderByCond),
            ).then(resolve, reject);
          }
          // runtime_config table
          if (whereCond?.__op === 'eq' && whereCond.col === 'rc.key') {
            const row = store.get(whereCond.val as string);
            return Promise.resolve(row ? [row] : []).then(resolve, reject);
          }
          return Promise.resolve(Array.from(store.values())).then(resolve, reject);
        };
      }
      if (prop === 'where') {
        return (cond: WhereCond) => {
          whereCond = cond;
          return proxy;
        };
      }
      if (prop === 'limit') {
        return (n: number) => {
          limitVal = n;
          return proxy;
        };
      }
      if (prop === 'orderBy') {
        return (cond: WhereCond) => {
          orderByCond = cond;
          return proxy;
        };
      }
      return () => proxy;
    },
  });
  return proxy;
}

function makeInsert() {
  let pending: Row | null = null;
  return {
    values: (data: Row) => {
      pending = {
        description: null,
        defaultValue: null,
        isSensitive: false,
        ...data,
      };
      return {
        returning: () => {
          if (pending) store.set(pending.key, pending);
          return Promise.resolve(pending ? [pending] : []);
        },
      };
    },
  };
}

function extractRcKey(cond: WhereCond | null): string | null {
  if (!cond) return null;
  if (cond.__op === 'eq' && cond.col === 'rc.key') return cond.val as string;
  return null;
}

function makeUpdate() {
  let setData: Partial<Row> = {};
  let whereKey: string | null = null;
  const chain = {
    set: (data: Partial<Row>) => {
      setData = data;
      return chain;
    },
    where: (cond: WhereCond) => {
      whereKey = extractRcKey(cond);
      return chain;
    },
    returning: () => {
      if (whereKey !== null) {
        const existing = store.get(whereKey);
        if (existing) {
          const updated = { ...existing, ...setData } as Row;
          store.set(whereKey, updated);
          return Promise.resolve([updated]);
        }
      }
      return Promise.resolve([]);
    },
  };
  return chain;
}

function makeDelete() {
  let whereKey: string | null = null;
  const chain = {
    where: (cond: WhereCond) => {
      whereKey = extractRcKey(cond);
      return chain;
    },
    returning: () => {
      if (whereKey !== null) {
        const existing = store.get(whereKey);
        if (existing) {
          store.delete(whereKey);
          return Promise.resolve([existing]);
        }
      }
      return Promise.resolve([]);
    },
  };
  return chain;
}

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: (_projection?: unknown) => ({
      from: (table: { __name?: string }) => makeSelectChain(table),
    }),
    insert: () => makeInsert(),
    update: () => makeUpdate(),
    delete: () => makeDelete(),
  },
  runtimeConfigTable: {
    __name: 'runtime_config',
    key: { __col: 'rc.key' },
    category: { __col: 'rc.category' },
  },
  activityLogTable: {
    __name: 'activity_log',
    id: { __col: 'al.id' },
    resource: { __col: 'al.resource' },
    resourceId: { __col: 'al.resourceId' },
    action: { __col: 'al.action' },
    description: { __col: 'al.description' },
    metadata: { __col: 'al.metadata' },
    createdAt: { __col: 'al.createdAt' },
    userId: { __col: 'al.userId' },
  },
  usersTable: {
    __name: 'users',
    id: { __col: 'u.id' },
    displayName: { __col: 'u.displayName' },
    email: { __col: 'u.email' },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: { __col?: string } | undefined, val: unknown) => ({
    __op: 'eq',
    col: col?.__col,
    val,
  }),
  and: (...conds: WhereCond[]) => ({ __op: 'and', conds }),
  ilike: () => ({}),
  desc: (col: { __col?: string } | undefined) => ({ __op: 'desc', col: col?.__col }),
  inArray: (col: { __col?: string } | undefined, vals: unknown[]) => ({
    __op: 'inArray',
    col: col?.__col,
    vals,
  }),
}));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

const logActivityMock = vi.fn(
  async (
    _req: unknown,
    action: string,
    resource: string,
    resourceId: string,
    description: string,
    metadata?: Record<string, unknown>,
  ) => {
    activityStore.push({
      id: activityIdSeq++,
      resource,
      resourceId,
      action,
      description,
      metadata: metadata ?? null,
      createdAt: new Date(),
      userId: null,
    });
  },
);
vi.mock('../lib/activity-logger.js', () => ({
  logActivity: logActivityMock,
}));

const invalidateConfigCache = vi.fn();
const invalidateAllConfigCache = vi.fn();
vi.mock('../lib/runtime-config.js', () => ({
  invalidateConfigCache,
  invalidateAllConfigCache,
}));

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware:
    (_opts?: unknown) =>
    (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (req as unknown as { user: MockUser }).user = mockState.currentUser;
      next();
    },
  requireRole:
    (...allowed: string[]) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = (req as unknown as { user?: MockUser }).user;
      if (!user) {
        res.status(401).json({ error: 'unauthenticated' });
        return;
      }
      if (!user.roles.some((r) => allowed.includes(r))) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      next();
    },
  parseIdParam:
    (_paramName: string) =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  requireOrgMembership:
    () =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  denyIfReadOnly:
    () =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  InvalidIdError: class extends Error {},
}));

const { default: runtimeConfigRouter } = await import('../routes/runtime-config.js');

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(runtimeConfigRouter as unknown as ExpressRouter);
  return app;
}

function seedActivity(partial: Partial<ActivityRow> & { resourceId: string; action: string }) {
  activityStore.push({
    id: activityIdSeq++,
    resource: 'runtime_config',
    description: null,
    metadata: null,
    createdAt: new Date(),
    userId: null,
    ...partial,
  });
}

beforeEach(() => {
  store.clear();
  activityStore.length = 0;
  activityIdSeq = 1;
  invalidateConfigCache.mockClear();
  invalidateAllConfigCache.mockClear();
  logActivityMock.mockClear();
  mockState.currentUser = OPS_USER;
});

describe('Runtime config admin CRUD — create → read → update → invalidate → delete', () => {
  it('walks the full lifecycle and invalidates the cache on every write', async () => {
    const app = buildApp();
    const KEY = 'test_rate_limit_max';

    // ── CREATE ────────────────────────────────────────────────────────────
    const created = await request(app).post('/runtime-config').send({
      key: KEY,
      value: '100',
      valueType: 'number',
      description: 'Test rate limit',
      category: 'rate_limits',
    });
    expect(created.status).toBe(201);
    expect(created.body.key).toBe(KEY);
    expect(created.body.value).toBe('100');
    expect(invalidateConfigCache).toHaveBeenCalledWith(KEY);

    // ── READ (single) ─────────────────────────────────────────────────────
    const got = await request(app).get(`/runtime-config/${KEY}`);
    expect(got.status).toBe(200);
    expect(got.body.key).toBe(KEY);
    expect(got.body.value).toBe('100');
    expect(got.body.valueType).toBe('number');

    // ── UPDATE + cache invalidation ───────────────────────────────────────
    invalidateConfigCache.mockClear();
    const patched = await request(app).patch(`/runtime-config/${KEY}`).send({ value: '250' });
    expect(patched.status).toBe(200);
    expect(patched.body.value).toBe('250');
    expect(invalidateConfigCache).toHaveBeenCalledWith(KEY);

    // ── DELETE + cache invalidation ───────────────────────────────────────
    invalidateConfigCache.mockClear();
    const deleted = await request(app).delete(`/runtime-config/${KEY}`);
    expect(deleted.status).toBe(204);
    expect(invalidateConfigCache).toHaveBeenCalledWith(KEY);

    // ── Subsequent read 404s ──────────────────────────────────────────────
    const gone = await request(app).get(`/runtime-config/${KEY}`);
    expect(gone.status).toBe(404);
  });

  it('rejects an invalid key format with 400 (regex enforced by zod)', async () => {
    const app = buildApp();
    const res = await request(app).post('/runtime-config').send({
      key: 'Invalid Key With Spaces',
      value: '1',
      valueType: 'number',
    });
    expect(res.status).toBe(400);
    expect(invalidateConfigCache).not.toHaveBeenCalled();
  });

  it('PATCH on a missing key returns 404 and does not invalidate the cache', async () => {
    const app = buildApp();
    const res = await request(app).patch('/runtime-config/never_existed').send({ value: '1' });
    expect(res.status).toBe(404);
    expect(invalidateConfigCache).not.toHaveBeenCalled();
  });

  it('DELETE on a missing key returns 404 and does not invalidate the cache', async () => {
    const app = buildApp();
    const res = await request(app).delete('/runtime-config/never_existed');
    expect(res.status).toBe(404);
    expect(invalidateConfigCache).not.toHaveBeenCalled();
  });

  it('invalidate-cache route invalidates a single key when key is provided', async () => {
    const app = buildApp();
    const res = await request(app).post('/runtime-config/invalidate-cache').send({ key: 'foo' });
    expect(res.status).toBe(200);
    expect(invalidateConfigCache).toHaveBeenCalledWith('foo');
    expect(invalidateAllConfigCache).not.toHaveBeenCalled();
  });

  it('invalidate-cache route invalidates everything when no key is provided', async () => {
    const app = buildApp();
    const res = await request(app).post('/runtime-config/invalidate-cache').send({});
    expect(res.status).toBe(200);
    expect(invalidateAllConfigCache).toHaveBeenCalled();
  });

  it('redacts sensitive values on read', async () => {
    const app = buildApp();
    const created = await request(app).post('/runtime-config').send({
      key: 'sensitive_token',
      value: 'super-secret-value',
      valueType: 'string',
      isSensitive: true,
    });
    expect(created.status).toBe(201);

    const got = await request(app).get('/runtime-config/sensitive_token');
    expect(got.status).toBe(200);
    expect(got.body.value).toBe('[redacted]');
  });
});

describe('Runtime config audit metadata', () => {
  it('PATCH records previousValue and newValue in activity metadata', async () => {
    const app = buildApp();
    const KEY = 'audit_patch_key';

    await request(app)
      .post('/runtime-config')
      .send({ key: KEY, value: 'original', valueType: 'string' });
    logActivityMock.mockClear();

    const patched = await request(app)
      .patch(`/runtime-config/${KEY}`)
      .send({ value: 'updated' });
    expect(patched.status).toBe(200);

    expect(logActivityMock).toHaveBeenCalledTimes(1);
    const call = logActivityMock.mock.calls[0]!;
    expect(call[1]).toBe('update');
    expect(call[2]).toBe('runtime_config');
    expect(call[3]).toBe(KEY);
    const metadata = call[5] as Record<string, unknown>;
    expect(metadata.previousValue).toBe('original');
    expect(metadata.newValue).toBe('updated');
    expect(metadata.changedFields).toEqual(['value']);
  });

  it('PATCH redacts previousValue and newValue when the entry is sensitive', async () => {
    const app = buildApp();
    const KEY = 'audit_patch_secret';

    await request(app).post('/runtime-config').send({
      key: KEY,
      value: 'old-secret',
      valueType: 'string',
      isSensitive: true,
    });
    logActivityMock.mockClear();

    const patched = await request(app)
      .patch(`/runtime-config/${KEY}`)
      .send({ value: 'new-secret' });
    expect(patched.status).toBe(200);

    const metadata = logActivityMock.mock.calls[0]![5] as Record<string, unknown>;
    expect(metadata.previousValue).toBe('[redacted]');
    expect(metadata.newValue).toBe('[redacted]');
    // The human-readable description should likewise never embed the secret.
    expect(logActivityMock.mock.calls[0]![4]).not.toContain('new-secret');
  });

  it('PATCH omits previous/newValue metadata when the value field is not touched', async () => {
    const app = buildApp();
    const KEY = 'audit_patch_meta_only';

    await request(app)
      .post('/runtime-config')
      .send({ key: KEY, value: 'val', valueType: 'string' });
    logActivityMock.mockClear();

    const patched = await request(app)
      .patch(`/runtime-config/${KEY}`)
      .send({ description: 'just docs' });
    expect(patched.status).toBe(200);

    const metadata = logActivityMock.mock.calls[0]![5] as Record<string, unknown>;
    expect(metadata.previousValue).toBeUndefined();
    expect(metadata.newValue).toBeUndefined();
    expect(metadata.changedFields).toEqual(['description']);
  });

  it('DELETE records previousValue in activity metadata', async () => {
    const app = buildApp();
    const KEY = 'audit_delete_key';

    await request(app)
      .post('/runtime-config')
      .send({ key: KEY, value: 'doomed', valueType: 'string' });
    logActivityMock.mockClear();

    const deleted = await request(app).delete(`/runtime-config/${KEY}`);
    expect(deleted.status).toBe(204);

    expect(logActivityMock).toHaveBeenCalledTimes(1);
    const call = logActivityMock.mock.calls[0]!;
    expect(call[1]).toBe('delete');
    expect(call[3]).toBe(KEY);
    const metadata = call[5] as Record<string, unknown>;
    expect(metadata.previousValue).toBe('doomed');
  });

  it('DELETE redacts previousValue when the entry is sensitive', async () => {
    const app = buildApp();
    const KEY = 'audit_delete_secret';

    await request(app).post('/runtime-config').send({
      key: KEY,
      value: 'top-secret',
      valueType: 'string',
      isSensitive: true,
    });
    logActivityMock.mockClear();

    const deleted = await request(app).delete(`/runtime-config/${KEY}`);
    expect(deleted.status).toBe(204);

    const metadata = logActivityMock.mock.calls[0]![5] as Record<string, unknown>;
    expect(metadata.previousValue).toBe('[redacted]');
  });
});

describe('GET /runtime-config/_history', () => {
  it('returns only create/update/delete events, newest first', async () => {
    const now = Date.now();
    seedActivity({
      action: 'create',
      resourceId: 'k1',
      createdAt: new Date(now - 3000),
      metadata: { newValue: 'a' },
    });
    seedActivity({
      action: 'update',
      resourceId: 'k1',
      createdAt: new Date(now - 2000),
      metadata: { previousValue: 'a', newValue: 'b' },
    });
    // A cache-invalidation entry (action='update' but resource is the same):
    // the route filters by action ∈ {create,update,delete} so it IS included
    // here — what the route specifically guards against is non-CRUD actions.
    // To prove that, seed a 'read' action that must NOT appear in the response.
    seedActivity({
      action: 'read',
      resourceId: 'k1',
      createdAt: new Date(now - 1000),
    });
    seedActivity({
      action: 'delete',
      resourceId: 'k2',
      createdAt: new Date(now - 500),
      metadata: { previousValue: 'z' },
    });

    const app = buildApp();
    const res = await request(app).get('/runtime-config/_history');
    expect(res.status).toBe(200);
    const items = res.body as Array<{ action: string; key: string }>;
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.action)).toEqual(['delete', 'update', 'create']);
    expect(items.every((i) => i.action !== 'read')).toBe(true);
  });

  it('filters by ?key=', async () => {
    seedActivity({ action: 'update', resourceId: 'alpha' });
    seedActivity({ action: 'update', resourceId: 'beta' });
    seedActivity({ action: 'delete', resourceId: 'alpha' });

    const app = buildApp();
    const res = await request(app).get('/runtime-config/_history?key=alpha');
    expect(res.status).toBe(200);
    const items = res.body as Array<{ key: string }>;
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.key === 'alpha')).toBe(true);
  });

  it('caps the limit at 500 even when the caller asks for more', async () => {
    // Seed 600 entries — more than the cap. The response should top out at 500.
    const base = Date.now();
    for (let i = 0; i < 600; i++) {
      seedActivity({
        action: 'update',
        resourceId: `bulk_${i}`,
        createdAt: new Date(base + i),
      });
    }

    const app = buildApp();
    const res = await request(app).get('/runtime-config/_history?limit=9999');
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBe(500);
  });

  it('falls back to the default limit when ?limit is missing or unparseable', async () => {
    const base = Date.now();
    for (let i = 0; i < 250; i++) {
      seedActivity({
        action: 'update',
        resourceId: `seed_${i}`,
        createdAt: new Date(base + i),
      });
    }
    const app = buildApp();

    const noLimit = await request(app).get('/runtime-config/_history');
    expect(noLimit.status).toBe(200);
    // Default cap is 200 — anything over should be trimmed.
    expect((noLimit.body as unknown[]).length).toBe(200);

    const bogus = await request(app).get('/runtime-config/_history?limit=not-a-number');
    expect(bogus.status).toBe(200);
    expect((bogus.body as unknown[]).length).toBe(200);
  });

  it('orders results strictly newest-first regardless of insertion order', async () => {
    const t0 = Date.now();
    seedActivity({ action: 'create', resourceId: 'oldest', createdAt: new Date(t0) });
    seedActivity({ action: 'update', resourceId: 'newest', createdAt: new Date(t0 + 10_000) });
    seedActivity({ action: 'update', resourceId: 'middle', createdAt: new Date(t0 + 5_000) });

    const app = buildApp();
    const res = await request(app).get('/runtime-config/_history');
    expect(res.status).toBe(200);
    const items = res.body as Array<{ key: string }>;
    expect(items.map((i) => i.key)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('is gated to ops/admin — a member user receives 403', async () => {
    seedActivity({ action: 'update', resourceId: 'k1' });
    mockState.currentUser = MEMBER_USER;

    const app = buildApp();
    const res = await request(app).get('/runtime-config/_history');
    expect(res.status).toBe(403);
  });

  it('allows admin users in addition to ops', async () => {
    seedActivity({ action: 'update', resourceId: 'k1' });
    mockState.currentUser = {
      id: 3,
      email: 'admin@example.com',
      roles: ['admin'],
      orgs: [{ orgId: 1, orgSlug: 'org', orgName: 'Org', role: 'admin' }],
    };

    const app = buildApp();
    const res = await request(app).get('/runtime-config/_history');
    expect(res.status).toBe(200);
    expect((res.body as unknown[]).length).toBe(1);
  });
});
