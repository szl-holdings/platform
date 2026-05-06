/**
 * Integration tests for the runtime-config admin CRUD routes
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
 * The cache invalidation hook is mocked at the module boundary so we can
 * assert the route actually called it on every successful write — a silent
 * regression there would mean operators see stale config until the TTL
 * expires.
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const TABLE = { __name: 'runtime_config' } as const;

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

const store = new Map<string, Row>();

function makeSelectChain(): unknown {
  let whereKey: string | null = null;
  const chain: Record<string | symbol, unknown> = {};
  const proxy = new Proxy(chain, {
    get(_t, prop) {
      if (prop === 'then') {
        return (
          resolve: (v: unknown[]) => unknown,
          reject?: (e: unknown) => unknown,
        ): unknown => {
          if (whereKey !== null) {
            const row = store.get(whereKey);
            return Promise.resolve(row ? [row] : []).then(resolve, reject);
          }
          return Promise.resolve(Array.from(store.values())).then(resolve, reject);
        };
      }
      if (prop === 'where') {
        return (cond: unknown) => {
          if (cond && typeof cond === 'object' && '__keyEq' in cond) {
            whereKey = (cond as { __keyEq: string }).__keyEq;
          }
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

function makeUpdate() {
  let setData: Partial<Row> = {};
  let whereKey: string | null = null;
  const chain = {
    set: (data: Partial<Row>) => {
      setData = data;
      return chain;
    },
    where: (cond: unknown) => {
      if (cond && typeof cond === 'object' && '__keyEq' in cond) {
        whereKey = (cond as { __keyEq: string }).__keyEq;
      }
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
    where: (cond: unknown) => {
      if (cond && typeof cond === 'object' && '__keyEq' in cond) {
        whereKey = (cond as { __keyEq: string }).__keyEq;
      }
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
    select: () => ({ from: () => makeSelectChain() }),
    insert: () => makeInsert(),
    update: () => makeUpdate(),
    delete: () => makeDelete(),
  },
  runtimeConfigTable: { ...TABLE, key: '__keyCol' },
}));

vi.mock('drizzle-orm', () => ({
  // The route uses `eq(runtimeConfigTable.key, key)` — we encode the operand
  // so the mock select/update/delete chains can route the where clause back
  // to a single map key.
  eq: (col: unknown, val: unknown) => {
    if (typeof val === 'string') return { __keyEq: val };
    return {};
  },
  and: () => ({}),
  ilike: () => ({}),
}));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../lib/activity-logger.js', () => ({
  logActivity: vi.fn(async () => undefined),
}));

const invalidateConfigCache = vi.fn();
const invalidateAllConfigCache = vi.fn();
vi.mock('../lib/runtime-config.js', () => ({
  invalidateConfigCache,
  invalidateAllConfigCache,
}));

vi.mock('../middlewares/auth.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createAuthMiddlewareMock({
    id: 1,
    email: 'ops@example.com',
    roles: ['ops'],
    orgs: [{ orgId: 1, orgSlug: 'org', orgName: 'Org', role: 'ops' }],
  });
});

const { default: runtimeConfigRouter } = await import('../routes/runtime-config.js');

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(runtimeConfigRouter as unknown as ExpressRouter);
  return app;
}

beforeEach(() => {
  store.clear();
  invalidateConfigCache.mockClear();
  invalidateAllConfigCache.mockClear();
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
