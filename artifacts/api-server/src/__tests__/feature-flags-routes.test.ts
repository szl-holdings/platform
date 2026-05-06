/**
 * Integration tests for the feature-flags admin CRUD routes
 * (`routes/feature-flags.ts`).
 *
 * Companion to `runtime-config-routes.test.ts` — locks in the same
 * create → read → update → delete contract for the feature flag admin API,
 * plus override CRUD which is unique to feature flags.
 *
 * Routes covered:
 *   POST   /feature-flags                              create
 *   GET    /feature-flags                              list
 *   PATCH  /feature-flags/:id                          update (toggle)
 *   DELETE /feature-flags/:id                          delete
 *   POST   /feature-flags/:id/overrides                add override
 *   GET    /feature-flags/:id/overrides                list overrides
 *   DELETE /feature-flags/:id/overrides/:overrideId    remove override
 *   POST   /feature-flags/evaluate                     evaluate by key/keys
 *   GET    /feature-flags/check/:key                   anonymous check
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Each table column is a unique string so the `eq()` mock can dispatch
// the where clause to the right slice of in-memory state.
const FLAGS_TABLE = {
  __name: 'flags',
  id: 'flags.id',
  key: 'flags.key',
} as const;
const OVERRIDES_TABLE = {
  __name: 'overrides',
  id: 'overrides.id',
  flagId: 'overrides.flagId',
  entityType: 'overrides.entityType',
} as const;
const ORG_MEMBERS_TABLE = {
  __name: 'org_members',
  userId: 'org_members.userId',
  orgId: 'org_members.orgId',
} as const;
const FLAG_LOGS_TABLE = { __name: 'flag_check_logs' } as const;

interface FlagRow {
  id: number;
  key: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  rolloutPercentage: number;
  conditions: unknown;
  updatedAt?: Date;
}
interface OverrideRow {
  id: number;
  flagId: number;
  entityType: 'user' | 'org' | 'role';
  entityId: string;
  isEnabled: boolean;
}

const flagsStore = new Map<number, FlagRow>();
const overridesStore = new Map<number, OverrideRow>();
let nextFlagId = 1;
let nextOverrideId = 1;

interface WhereCond {
  flagIdEq?: number;
  flagKeyEq?: string;
  overrideIdEq?: number;
  overrideFlagIdEq?: number;
}

function makeSelectChain(table: unknown): unknown {
  let whereCond: WhereCond | null = null;
  const proxy: Record<string | symbol, unknown> = {};
  const chain = new Proxy(proxy, {
    get(_t, prop) {
      if (prop === 'then') {
        return (
          resolve: (v: unknown[]) => unknown,
          reject?: (e: unknown) => unknown,
        ): unknown => {
          let rows: unknown[] = [];
          if (table === FLAGS_TABLE) {
            const all = Array.from(flagsStore.values());
            if (whereCond?.flagIdEq !== undefined) {
              rows = all.filter((f) => f.id === whereCond?.flagIdEq);
            } else if (whereCond?.flagKeyEq !== undefined) {
              rows = all.filter((f) => f.key === whereCond?.flagKeyEq);
            } else {
              rows = all;
            }
          } else if (table === OVERRIDES_TABLE) {
            const all = Array.from(overridesStore.values());
            if (whereCond?.overrideFlagIdEq !== undefined) {
              rows = all.filter((o) => o.flagId === whereCond?.overrideFlagIdEq);
            } else if (whereCond?.overrideIdEq !== undefined) {
              rows = all.filter((o) => o.id === whereCond?.overrideIdEq);
            } else {
              rows = all;
            }
          } else if (table === ORG_MEMBERS_TABLE) {
            rows = []; // no membership rows needed for these tests
          }
          return Promise.resolve(rows).then(resolve, reject);
        };
      }
      if (prop === 'where') {
        return (cond: unknown) => {
          if (cond && typeof cond === 'object') {
            whereCond = { ...(whereCond ?? {}), ...(cond as WhereCond) };
          }
          return chain;
        };
      }
      return () => chain;
    },
  });
  return chain;
}

// `db.insert(table).values(...)` is awaitable AND chainable with `.returning()`,
// `.onConflictDoNothing()`, `.catch()`. We return a real Promise extended with
// those methods so the platform-flags log insert (`.catch(...)`) works too.
function makeInsert(table: unknown) {
  return {
    values: (data: Record<string, unknown> | Array<Record<string, unknown>>) => {
      const apply = (): unknown => {
        if (Array.isArray(data)) {
          // ensurePlatformFlags-style bulk insert — no-op in tests
          return null;
        }
        if (table === FLAGS_TABLE) {
          const row: FlagRow = {
            id: nextFlagId++,
            key: String(data.key),
            name: String(data.name),
            description: (data.description as string | null) ?? null,
            isEnabled: Boolean(data.isEnabled),
            rolloutPercentage: Number(data.rolloutPercentage ?? 0),
            conditions: data.conditions ?? null,
          };
          flagsStore.set(row.id, row);
          return row;
        }
        if (table === OVERRIDES_TABLE) {
          const row: OverrideRow = {
            id: nextOverrideId++,
            flagId: Number(data.flagId),
            entityType: data.entityType as OverrideRow['entityType'],
            entityId: String(data.entityId),
            isEnabled: Boolean(data.isEnabled),
          };
          overridesStore.set(row.id, row);
          return row;
        }
        // FLAG_LOGS_TABLE etc. — write-and-forget
        return null;
      };

      const promise = Promise.resolve(null) as Promise<unknown> & {
        returning: () => Promise<unknown[]>;
        onConflictDoNothing: () => Promise<unknown[]>;
      };
      promise.returning = () => {
        const row = apply();
        return Promise.resolve(row ? [row] : []);
      };
      promise.onConflictDoNothing = () => {
        apply();
        return Promise.resolve([]);
      };
      // Trigger the side-effect on plain await as well so .catch chains work.
      return new Proxy(promise, {
        get(target, prop) {
          if (prop === 'then') {
            return (
              resolve: (v: unknown) => unknown,
              reject?: (e: unknown) => unknown,
            ): unknown => {
              try {
                apply();
                return Promise.resolve(undefined).then(resolve, reject);
              } catch (err) {
                return Promise.reject(err).then(resolve, reject);
              }
            };
          }
          return Reflect.get(target, prop);
        },
      });
    },
  };
}

function makeUpdate(table: unknown) {
  let setData: Record<string, unknown> = {};
  let whereCond: WhereCond | null = null;
  const chain = {
    set: (d: Record<string, unknown>) => {
      setData = d;
      return chain;
    },
    where: (cond: unknown) => {
      if (cond && typeof cond === 'object') {
        whereCond = cond as WhereCond;
      }
      return chain;
    },
    returning: () => {
      if (table === FLAGS_TABLE && whereCond?.flagIdEq !== undefined) {
        const existing = flagsStore.get(whereCond.flagIdEq);
        if (existing) {
          const updated = { ...existing, ...setData } as FlagRow;
          flagsStore.set(updated.id, updated);
          return Promise.resolve([updated]);
        }
      }
      return Promise.resolve([]);
    },
  };
  return chain;
}

function makeDelete(table: unknown) {
  let whereCond: WhereCond | null = null;
  const chain = {
    where: (cond: unknown) => {
      if (cond && typeof cond === 'object') {
        whereCond = cond as WhereCond;
      }
      return chain;
    },
    returning: () => {
      if (table === FLAGS_TABLE && whereCond?.flagIdEq !== undefined) {
        const r = flagsStore.get(whereCond.flagIdEq);
        if (r) {
          flagsStore.delete(whereCond.flagIdEq);
          return Promise.resolve([r]);
        }
      } else if (table === OVERRIDES_TABLE && whereCond?.overrideIdEq !== undefined) {
        const r = overridesStore.get(whereCond.overrideIdEq);
        if (r) {
          overridesStore.delete(whereCond.overrideIdEq);
          return Promise.resolve([r]);
        }
      }
      return Promise.resolve([]);
    },
  };
  return chain;
}

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({ from: (table: unknown) => makeSelectChain(table) }),
    insert: (table: unknown) => makeInsert(table),
    update: (table: unknown) => makeUpdate(table),
    delete: (table: unknown) => makeDelete(table),
  },
  featureFlagsTable: FLAGS_TABLE,
  featureFlagOverridesTable: OVERRIDES_TABLE,
  flagCheckLogsTable: FLAG_LOGS_TABLE,
  orgMembersTable: ORG_MEMBERS_TABLE,
}));

vi.mock('drizzle-orm', () => ({
  // String-identity dispatch — see column constants at top of file.
  eq: (col: unknown, val: unknown) => {
    switch (col) {
      case 'flags.id':
        return { flagIdEq: Number(val) };
      case 'flags.key':
        return { flagKeyEq: String(val) };
      case 'overrides.id':
        return { overrideIdEq: Number(val) };
      case 'overrides.flagId':
        return { overrideFlagIdEq: Number(val) };
      default:
        return {};
    }
  },
  and: () => ({}),
}));

vi.mock('@szl-holdings/contracts/common', async () => {
  const { z } = await import('zod');
  return {
    bodyShape: <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough(),
  };
});

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../lib/activity-logger.js', () => ({
  logActivity: vi.fn(async () => undefined),
  logActivityFromRequest: vi.fn(async () => undefined),
}));

vi.mock('../middlewares/auth.js', () => {
  const user = {
    id: 1,
    email: 'admin@example.com',
    roles: ['admin'],
    orgs: [{ orgId: 1, orgSlug: 'org', orgName: 'Org', role: 'admin' }],
  };
  return {
    authMiddleware: () => (req: { user?: typeof user }, _res: unknown, next: () => void) => {
      req.user = user;
      next();
    },
    requireRole:
      (..._roles: string[]) =>
      (_req: unknown, _res: unknown, next: () => void) =>
        next(),
    // Production signature: takes the raw param string, returns a number (or throws).
    parseIdParam: (raw: string | string[]): number => {
      const v = Array.isArray(raw) ? raw[0] : raw;
      const n = Number(v);
      if (!Number.isFinite(n)) {
        const err = new Error('Invalid ID') as Error & { status?: number };
        err.status = 400;
        throw err;
      }
      return n;
    },
  };
});

// Spy on invalidateFlagCache so we can assert whether the routes call it.
// IMPORTANT: as of this commit, the feature-flag admin routes do NOT call
// `invalidateFlagCache` on writes (unlike runtime-config routes which do call
// `invalidateConfigCache`). The tests below lock in that current behavior so
// that a future fix becomes a visible, intentional change. See follow-up
// task #4901.
const invalidateFlagCacheSpy = vi.fn();
vi.mock('../lib/platform-flags.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/platform-flags.js')>(
    '../lib/platform-flags.js',
  );
  return {
    ...actual,
    invalidateFlagCache: (key: string) => {
      invalidateFlagCacheSpy(key);
      actual.invalidateFlagCache(key);
    },
  };
});

const { default: featureFlagsRouter } = await import('../routes/feature-flags.js');
const { invalidateFlagCache } = await import('../lib/platform-flags.js');

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(featureFlagsRouter as unknown as ExpressRouter);
  return app;
}

beforeEach(() => {
  flagsStore.clear();
  overridesStore.clear();
  nextFlagId = 1;
  nextOverrideId = 1;
  invalidateFlagCacheSpy.mockClear();
});

describe('Feature flags admin CRUD — full lifecycle', () => {
  it('creates → reads → updates → deletes a flag', async () => {
    const app = buildApp();

    const created = await request(app).post('/feature-flags').send({
      key: 'my_test_flag',
      name: 'My Test Flag',
      description: 'desc',
      isEnabled: true,
      rolloutPercentage: 50,
    });
    expect(created.status).toBe(201);
    expect(created.body.key).toBe('my_test_flag');
    expect(created.body.isEnabled).toBe(true);
    const flagId = created.body.id as number;

    const listed = await request(app).get('/feature-flags');
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
    expect(listed.body.data[0].key).toBe('my_test_flag');

    // Bust the platform-flags cache so the next evaluate sees fresh data.
    invalidateFlagCache('my_test_flag');

    const patched = await request(app)
      .patch(`/feature-flags/${flagId}`)
      .send({ isEnabled: false, rolloutPercentage: 0 });
    expect(patched.status).toBe(200);
    expect(patched.body.isEnabled).toBe(false);
    expect(patched.body.rolloutPercentage).toBe(0);

    const deleted = await request(app).delete(`/feature-flags/${flagId}`).send({});
    expect(deleted.status).toBe(204);

    const afterList = await request(app).get('/feature-flags');
    expect(afterList.body.data).toHaveLength(0);
  });

  it('returns 404 when patching a nonexistent flag', async () => {
    const app = buildApp();
    const res = await request(app).patch('/feature-flags/9999').send({ isEnabled: true });
    expect(res.status).toBe(404);
  });

  it('returns 404 when deleting a nonexistent flag', async () => {
    const app = buildApp();
    const res = await request(app).delete('/feature-flags/9999').send({});
    expect(res.status).toBe(404);
  });

  it('rejects create with missing required fields (400)', async () => {
    const app = buildApp();
    const res = await request(app).post('/feature-flags').send({ name: 'no key' });
    expect(res.status).toBe(400);
  });

  it('rejects create with rolloutPercentage out of range (400)', async () => {
    const app = buildApp();
    const res = await request(app).post('/feature-flags').send({
      key: 'k',
      name: 'n',
      rolloutPercentage: 150,
    });
    expect(res.status).toBe(400);
  });
});

describe('Feature flag overrides — CRUD', () => {
  it('adds, lists, and removes an override on a flag', async () => {
    const app = buildApp();

    const created = await request(app).post('/feature-flags').send({
      key: 'flag_with_overrides',
      name: 'Flag With Overrides',
      isEnabled: true,
      rolloutPercentage: 100,
    });
    const flagId = created.body.id as number;

    const addOverride = await request(app)
      .post(`/feature-flags/${flagId}/overrides`)
      .send({ entityType: 'user', entityId: '42', isEnabled: false });
    expect(addOverride.status).toBe(201);
    expect(addOverride.body.entityId).toBe('42');
    const overrideId = addOverride.body.id as number;

    const listOverrides = await request(app).get(`/feature-flags/${flagId}/overrides`);
    expect(listOverrides.status).toBe(200);
    expect(listOverrides.body).toHaveLength(1);
    expect(listOverrides.body[0].id).toBe(overrideId);

    const del = await request(app)
      .delete(`/feature-flags/${flagId}/overrides/${overrideId}`)
      .send({});
    expect(del.status).toBe(204);

    const afterList = await request(app).get(`/feature-flags/${flagId}/overrides`);
    expect(afterList.body).toHaveLength(0);
  });

  it('rejects override with invalid entityType (400)', async () => {
    const app = buildApp();
    const created = await request(app).post('/feature-flags').send({
      key: 'k',
      name: 'n',
      isEnabled: true,
      rolloutPercentage: 100,
    });
    const flagId = created.body.id as number;

    const res = await request(app)
      .post(`/feature-flags/${flagId}/overrides`)
      .send({ entityType: 'invalid_type', entityId: '1', isEnabled: true });
    expect(res.status).toBe(400);
  });
});

describe('GET /feature-flags/check/:key — anonymous check endpoint', () => {
  it('returns exists=false when the flag is not in the DB', async () => {
    const app = buildApp();
    const res = await request(app).get('/feature-flags/check/never_seen');
    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(false);
    expect(res.body.isEnabled).toBe(false);
  });

  it('reports the flag state when present', async () => {
    const app = buildApp();
    await request(app).post('/feature-flags').send({
      key: 'public_flag',
      name: 'Public',
      isEnabled: true,
      rolloutPercentage: 100,
    });
    const res = await request(app).get('/feature-flags/check/public_flag');
    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(true);
    expect(res.body.isEnabled).toBe(true);
    expect(res.body.rolloutPercentage).toBe(100);
  });
});

describe('Cache invalidation contract — REGRESSION GUARD', () => {
  // These tests document the CURRENT behavior: feature-flag admin routes do
  // NOT call `invalidateFlagCache` on writes, so an admin update can be
  // shadowed by stale in-memory cache for up to the TTL (~30s). When this is
  // fixed, flip these assertions to `toHaveBeenCalled` — the failing test
  // will signal the contract change. Tracked as follow-up #4901.
  it('PATCH does not currently invalidate flag cache (known gap)', async () => {
    const app = buildApp();
    const created = await request(app).post('/feature-flags').send({
      key: 'patch_cache_check',
      name: 'n',
      isEnabled: true,
      rolloutPercentage: 100,
    });
    invalidateFlagCacheSpy.mockClear();

    const patched = await request(app)
      .patch(`/feature-flags/${created.body.id}`)
      .send({ isEnabled: false });
    expect(patched.status).toBe(200);
    expect(invalidateFlagCacheSpy).not.toHaveBeenCalled();
  });

  it('DELETE does not currently invalidate flag cache (known gap)', async () => {
    const app = buildApp();
    const created = await request(app).post('/feature-flags').send({
      key: 'delete_cache_check',
      name: 'n',
      isEnabled: true,
      rolloutPercentage: 100,
    });
    invalidateFlagCacheSpy.mockClear();

    const deleted = await request(app)
      .delete(`/feature-flags/${created.body.id}`)
      .send({});
    expect(deleted.status).toBe(204);
    expect(invalidateFlagCacheSpy).not.toHaveBeenCalled();
  });

  it('override CRUD does not currently invalidate flag cache (known gap)', async () => {
    const app = buildApp();
    const created = await request(app).post('/feature-flags').send({
      key: 'override_cache_check',
      name: 'n',
      isEnabled: true,
      rolloutPercentage: 100,
    });
    invalidateFlagCacheSpy.mockClear();

    const addOverride = await request(app)
      .post(`/feature-flags/${created.body.id}/overrides`)
      .send({ entityType: 'user', entityId: '1', isEnabled: false });
    expect(addOverride.status).toBe(201);

    const delOverride = await request(app)
      .delete(`/feature-flags/${created.body.id}/overrides/${addOverride.body.id}`)
      .send({});
    expect(delOverride.status).toBe(204);
    expect(invalidateFlagCacheSpy).not.toHaveBeenCalled();
  });
});

describe('POST /feature-flags/evaluate', () => {
  it('rejects when neither key nor keys is supplied (400)', async () => {
    const app = buildApp();
    const res = await request(app).post('/feature-flags/evaluate').send({});
    expect(res.status).toBe(400);
  });

  it('evaluates a single key and returns enabled/source', async () => {
    const app = buildApp();
    await request(app).post('/feature-flags').send({
      key: 'eval_me',
      name: 'Eval',
      isEnabled: true,
      rolloutPercentage: 100,
    });
    invalidateFlagCache('eval_me');
    const res = await request(app).post('/feature-flags/evaluate').send({ key: 'eval_me' });
    expect(res.status).toBe(200);
    expect(res.body.key).toBe('eval_me');
    expect(res.body.enabled).toBe(true);
    expect(res.body.source).toBe('global');
  });

  it('evaluates multiple keys at once', async () => {
    const app = buildApp();
    await request(app).post('/feature-flags').send({
      key: 'on_flag',
      name: 'On',
      isEnabled: true,
      rolloutPercentage: 100,
    });
    await request(app).post('/feature-flags').send({
      key: 'off_flag',
      name: 'Off',
      isEnabled: false,
      rolloutPercentage: 0,
    });
    invalidateFlagCache('on_flag');
    invalidateFlagCache('off_flag');
    invalidateFlagCache('missing_flag');

    const res = await request(app)
      .post('/feature-flags/evaluate')
      .send({ keys: ['on_flag', 'off_flag', 'missing_flag'] });
    expect(res.status).toBe(200);
    expect(res.body.results.on_flag.enabled).toBe(true);
    expect(res.body.results.off_flag.enabled).toBe(false);
    expect(res.body.results.missing_flag.enabled).toBe(false);
    expect(res.body.results.missing_flag.source).toBe('default');
  });
});
