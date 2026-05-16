/**
 * Tests for the bulk export + import routes added in task #5015.
 *
 * Locks in:
 *   GET  /runtime-config/_export             excludes sensitive entries entirely
 *   POST /runtime-config/_import dryRun=true returns a diff plan, applies nothing
 *   POST /runtime-config/_import dryRun=false applies the plan, logs one
 *                                             activity row per mutation, invalidates cache
 *   POST /runtime-config/_import refuses to touch sensitive live entries and
 *                                refuses to import entries flagged sensitive in payload
 *   POST /runtime-config/_import deleteMissing defaults to false (no destructive default)
 *   POST /runtime-config/_import rejects malformed payloads with 400
 *   Both routes require ops|admin role.
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

const store = new Map<string, Row>();
const activityStore: Array<{
  action: string;
  resource: string;
  resourceId: string;
  description: string;
  metadata: Record<string, unknown> | null;
}> = [];

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
}

function makeSelectChain(): unknown {
  let whereCond: WhereCond | null = null;
  const chain: Record<string | symbol, unknown> = {};
  const proxy: unknown = new Proxy(chain, {
    get(_t, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown[]) => unknown, reject?: (e: unknown) => unknown): unknown => {
          // runtime_config table — we support eq on key OR isSensitive.
          if (whereCond?.__op === 'eq' && whereCond.col === 'rc.key') {
            const row = store.get(whereCond.val as string);
            return Promise.resolve(row ? [row] : []).then(resolve, reject);
          }
          if (whereCond?.__op === 'eq' && whereCond.col === 'rc.isSensitive') {
            const want = whereCond.val as boolean;
            return Promise.resolve(
              Array.from(store.values()).filter((r) => r.isSensitive === want),
            ).then(resolve, reject);
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
    select: () => ({ from: () => makeSelectChain() }),
    insert: () => makeInsert(),
    update: () => makeUpdate(),
    delete: () => makeDelete(),
  },
  runtimeConfigTable: {
    __name: 'runtime_config',
    key: { __col: 'rc.key' },
    category: { __col: 'rc.category' },
    isSensitive: { __col: 'rc.isSensitive' },
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
      action,
      resource,
      resourceId,
      description,
      metadata: metadata ?? null,
    });
  },
);
vi.mock('../lib/activity-logger.js', () => ({ logActivity: logActivityMock }));

const invalidateConfigCache = vi.fn();
const invalidateAllConfigCache = vi.fn();
vi.mock('../lib/runtime-config.js', () => ({
  invalidateConfigCache,
  invalidateAllConfigCache,
}));

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware:
    () =>
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
    () =>
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

function seed(key: string, partial: Partial<Row> = {}): void {
  store.set(key, {
    key,
    value: 'v',
    valueType: 'string',
    description: null,
    defaultValue: null,
    category: 'general',
    isSensitive: false,
    ...partial,
  });
}

beforeEach(() => {
  store.clear();
  activityStore.length = 0;
  invalidateConfigCache.mockClear();
  invalidateAllConfigCache.mockClear();
  logActivityMock.mockClear();
  mockState.currentUser = OPS_USER;
});

describe('Runtime config bulk export', () => {
  it('returns a v1 envelope and excludes sensitive entries entirely', async () => {
    seed('rate_limit_max', { value: '100', valueType: 'number', category: 'rate_limits' });
    seed('public_flag', { value: 'true', valueType: 'boolean', category: 'feature_flags' });
    seed('api_key', { value: 'super-secret', isSensitive: true, category: 'general' });

    const res = await request(buildApp()).get('/runtime-config/_export');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(res.body.sensitiveExcluded).toBe(true);
    expect(res.body.entryCount).toBe(2);

    const exportedKeys = (res.body.entries as Array<{ key: string }>).map((e) => e.key).sort();
    expect(exportedKeys).toEqual(['public_flag', 'rate_limit_max']);
    expect(res.body.entries.every((e: { isSensitive: boolean }) => e.isSensitive === false)).toBe(true);
    // No [redacted] placeholder leaks through
    expect(JSON.stringify(res.body)).not.toContain('redacted');
    expect(JSON.stringify(res.body)).not.toContain('super-secret');
  });

  it('denies non-ops users', async () => {
    mockState.currentUser = MEMBER_USER;
    const res = await request(buildApp()).get('/runtime-config/_export');
    expect(res.status).toBe(403);
  });
});

describe('Runtime config bulk import — dry run', () => {
  it('returns a diff plan and writes nothing on dryRun=true', async () => {
    seed('keep_me', { value: 'old' });
    seed('drop_me', { value: 'stale' });

    const res = await request(buildApp())
      .post('/runtime-config/_import')
      .send({
        version: 1,
        entries: [
          { key: 'keep_me', value: 'new', valueType: 'string', category: 'general' },
          { key: 'fresh_key', value: '42', valueType: 'number', category: 'rate_limits' },
        ],
        deleteMissing: true,
        dryRun: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.applied).toBe(false);
    expect(res.body.plan.adds).toHaveLength(1);
    expect(res.body.plan.adds[0].key).toBe('fresh_key');
    expect(res.body.plan.updates).toHaveLength(1);
    expect(res.body.plan.updates[0]).toMatchObject({
      key: 'keep_me',
      previousValue: 'old',
      newValue: 'new',
    });
    expect(res.body.plan.deletes).toHaveLength(1);
    expect(res.body.plan.deletes[0].key).toBe('drop_me');

    // The store is untouched.
    expect(store.get('keep_me')?.value).toBe('old');
    expect(store.get('drop_me')).toBeDefined();
    expect(store.has('fresh_key')).toBe(false);
    expect(logActivityMock).not.toHaveBeenCalled();
    expect(invalidateConfigCache).not.toHaveBeenCalled();
  });

  it('omits deletes block when deleteMissing is false (default)', async () => {
    seed('keep_me', { value: 'old' });
    seed('extra', { value: 'leave_alone' });

    const res = await request(buildApp())
      .post('/runtime-config/_import')
      .send({
        entries: [{ key: 'keep_me', value: 'old', valueType: 'string', category: 'general' }],
        dryRun: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.plan.deletes).toEqual([]);
    expect(res.body.plan.unchanged).toEqual([{ key: 'keep_me' }]);
  });

  it('skips entries marked sensitive in payload and live sensitive entries', async () => {
    seed('live_secret', { value: 'real', isSensitive: true });

    const res = await request(buildApp())
      .post('/runtime-config/_import')
      .send({
        entries: [
          { key: 'live_secret', value: 'overwrite', valueType: 'string', category: 'general' },
          {
            key: 'payload_secret',
            value: 'pasted-secret',
            valueType: 'string',
            category: 'general',
            isSensitive: true,
          },
        ],
        dryRun: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.plan.adds).toEqual([]);
    expect(res.body.plan.updates).toEqual([]);
    const skippedKeys = res.body.plan.skipped.map((s: { key: string }) => s.key).sort();
    expect(skippedKeys).toEqual(['live_secret', 'payload_secret']);
  });

  it('rejects malformed payloads with 400', async () => {
    const res = await request(buildApp())
      .post('/runtime-config/_import')
      .send({ entries: [{ key: 'BAD KEY', value: 'x' }], dryRun: true });
    expect(res.status).toBe(400);
  });
});

describe('Runtime config bulk import — apply', () => {
  it('applies the plan, logs each mutation, and invalidates cache per key', async () => {
    seed('updated_key', { value: 'before' });
    seed('removed_key', { value: 'to_drop' });

    const res = await request(buildApp())
      .post('/runtime-config/_import')
      .send({
        entries: [
          { key: 'new_key', value: 'hello', valueType: 'string', category: 'general' },
          { key: 'updated_key', value: 'after', valueType: 'string', category: 'general' },
        ],
        deleteMissing: true,
        dryRun: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.applied).toBe(true);
    expect(res.body.result).toMatchObject({ added: 1, updated: 1, deleted: 1, errors: [] });

    expect(store.get('new_key')?.value).toBe('hello');
    expect(store.get('updated_key')?.value).toBe('after');
    expect(store.has('removed_key')).toBe(false);

    // One activity row per mutation, all tagged bulkImport.
    const actions = activityStore.map((a) => a.action).sort();
    expect(actions).toEqual(['create', 'delete', 'update']);
    expect(activityStore.every((a) => a.metadata?.bulkImport === true)).toBe(true);

    // Cache invalidated for every touched key (3 calls).
    expect(invalidateConfigCache).toHaveBeenCalledTimes(3);
    const invalidated = invalidateConfigCache.mock.calls.map((c) => c[0]).sort();
    expect(invalidated).toEqual(['new_key', 'removed_key', 'updated_key']);
  });

  it('denies non-ops users on apply', async () => {
    mockState.currentUser = MEMBER_USER;
    const res = await request(buildApp())
      .post('/runtime-config/_import')
      .send({ entries: [], dryRun: false });
    expect(res.status).toBe(403);
  });
});
