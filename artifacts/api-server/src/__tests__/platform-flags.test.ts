/**
 * Unit tests for the feature flag evaluation engine (`lib/platform-flags`).
 *
 * Locks in the contract from task #4622:
 *   - Global off  → enabled=false, source='global'
 *   - Missing flag → enabled=false, source='default'
 *   - Rollout bucket boundary (deterministic hash) inclusion / exclusion
 *   - Override priority order: user > org > role
 *   - Fail-closed when the DB throws
 *
 * Strategy: mock `@szl-holdings/db` with a per-test controllable result so the
 * caching, override matching, and rollout bucket logic all exercise the real
 * production code paths without a live database.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const FLAGS_TABLE = { __name: 'flags' } as const;
const OVERRIDES_TABLE = { __name: 'overrides' } as const;
const LOGS_TABLE = { __name: 'logs' } as const;

interface DbState {
  flagRow: Record<string, unknown> | null;
  overrideRows: Array<Record<string, unknown>>;
  failSelect: boolean;
}

const dbState: DbState = {
  flagRow: null,
  overrideRows: [],
  failSelect: false,
};

function resetDbState(): void {
  dbState.flagRow = null;
  dbState.overrideRows = [];
  dbState.failSelect = false;
}

function makeSelectChain(table: unknown): unknown {
  const proxy: Record<string | symbol, unknown> = {};
  const chain = new Proxy(proxy, {
    get(_t, prop) {
      if (prop === 'then') {
        return (
          resolve: (v: unknown[]) => unknown,
          reject?: (e: unknown) => unknown,
        ): unknown => {
          if (dbState.failSelect) {
            return Promise.reject(new Error('simulated DB outage')).then(resolve, reject);
          }
          let rows: unknown[] = [];
          if (table === FLAGS_TABLE) {
            rows = dbState.flagRow ? [dbState.flagRow] : [];
          } else if (table === OVERRIDES_TABLE) {
            rows = dbState.overrideRows;
          }
          return Promise.resolve(rows).then(resolve, reject);
        };
      }
      // any chainable method (.from, .where, .limit, .orderBy, .offset, ...)
      // returns the same chain so awaiting at the end works.
      return () => chain;
    },
  });
  return chain;
}

vi.mock('@szl-holdings/db', () => {
  const insertResult = (): Promise<unknown[]> & {
    returning: () => Promise<unknown[]>;
    onConflictDoNothing: () => Promise<unknown[]>;
  } => {
    const p = Promise.resolve([{ id: 1 }]) as Promise<unknown[]> & {
      returning: () => Promise<unknown[]>;
      onConflictDoNothing: () => Promise<unknown[]>;
    };
    p.returning = () => Promise.resolve([{ id: 1 }]);
    p.onConflictDoNothing = () => Promise.resolve([]);
    return p;
  };
  const db = {
    select: () => ({ from: (table: unknown) => makeSelectChain(table) }),
    insert: () => ({ values: () => insertResult() }),
  };
  return {
    db,
    featureFlagsTable: FLAGS_TABLE,
    featureFlagOverridesTable: OVERRIDES_TABLE,
    flagCheckLogsTable: LOGS_TABLE,
  };
});

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
  and: () => ({}),
}));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

// Re-import the SUT after each module reset so the in-memory cache starts
// clean and the mocked db is freshly bound.
async function loadSut() {
  return await import('../lib/platform-flags.js');
}

beforeEach(() => {
  vi.resetModules();
  resetDbState();
});

describe('evaluateFlag — fail-closed defaults', () => {
  it('returns enabled=false, source=default when the flag does not exist', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.flagRow = null;
    const result = await evaluateFlag('does_not_exist', { skipLog: true });
    expect(result).toEqual({ key: 'does_not_exist', enabled: false, source: 'default' });
  });

  it('returns enabled=false, source=default when the DB select throws', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.failSelect = true;
    const result = await evaluateFlag('any_key', { skipLog: true });
    expect(result.enabled).toBe(false);
    expect(result.source).toBe('default');
  });
});

describe('evaluateFlag — global on/off', () => {
  it('returns enabled=false, source=global when isEnabled=false', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.flagRow = { id: 10, key: 'k', isEnabled: false, rolloutPercentage: 100 };
    const result = await evaluateFlag('k', { skipLog: true });
    expect(result.enabled).toBe(false);
    expect(result.source).toBe('global');
    expect(result.rolloutPercentage).toBe(100);
  });

  it('returns enabled=true, source=global when fully enabled at 100% rollout', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.flagRow = { id: 10, key: 'k', isEnabled: true, rolloutPercentage: 100 };
    const result = await evaluateFlag('k', { skipLog: true, userId: 7 });
    expect(result.enabled).toBe(true);
    expect(result.source).toBe('global');
  });
});

describe('evaluateFlag — rollout bucket boundary', () => {
  // Mirror the production bucket function so we can drive rolloutPercentage
  // exactly on either side of the deterministic bucket. Keeping a copy here
  // is intentional: a regression that changes the hash function would break
  // existing rollouts in production, so this test must catch it.
  function computeRolloutBucket(key: string, entityId: number | string): number {
    const combined = `${key}:${entityId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash * 31 + combined.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % 100;
  }

  it('excludes the user when rolloutPercentage equals the bucket (boundary off)', async () => {
    const KEY = 'rollout_boundary_key';
    const USER = 12345;
    const bucket = computeRolloutBucket(KEY, USER);
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThan(100);

    const { evaluateFlag } = await loadSut();
    dbState.flagRow = { id: 1, key: KEY, isEnabled: true, rolloutPercentage: bucket };
    const offBoundary = await evaluateFlag(KEY, { skipLog: true, userId: USER });
    expect(offBoundary.enabled).toBe(false); // bucket < bucket is false
    expect(offBoundary.source).toBe('rollout');
  });

  it('includes the user when rolloutPercentage is one above the bucket', async () => {
    const KEY = 'rollout_boundary_key_2';
    const USER = 12345;
    const bucket = computeRolloutBucket(KEY, USER);
    expect(bucket).toBeLessThan(100);

    const { evaluateFlag } = await loadSut();
    dbState.flagRow = { id: 1, key: KEY, isEnabled: true, rolloutPercentage: bucket + 1 };
    const onBoundary = await evaluateFlag(KEY, { skipLog: true, userId: USER });
    expect(onBoundary.enabled).toBe(true);
    // When bucket+1 == 100 the code returns source='global' (the
    // `< 100` branch is skipped). Otherwise it should be 'rollout'.
    if (bucket + 1 === 100) {
      expect(onBoundary.source).toBe('global');
    } else {
      expect(onBoundary.source).toBe('rollout');
    }
  });

  it('skipRollout disables partial rollouts even when the bucket would be in', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.flagRow = { id: 1, key: 'k', isEnabled: true, rolloutPercentage: 50 };
    const result = await evaluateFlag('k', { skipLog: true, skipRollout: true });
    expect(result.enabled).toBe(false);
    expect(result.source).toBe('global');
  });
});

describe('evaluateFlag — override priority order', () => {
  const FLAG = { id: 42, key: 'feat', isEnabled: true, rolloutPercentage: 100 };

  it('user override wins over org override', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.flagRow = FLAG;
    dbState.overrideRows = [
      { entityType: 'user', entityId: '7', isEnabled: false },
      { entityType: 'org', entityId: '99', isEnabled: true },
    ];
    const result = await evaluateFlag('feat', {
      skipLog: true,
      userId: 7,
      orgId: 99,
      roles: ['admin'],
    });
    expect(result.source).toBe('override');
    expect(result.enabled).toBe(false); // user override forced off
  });

  it('org override wins over role override when no user override matches', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.flagRow = FLAG;
    dbState.overrideRows = [
      { entityType: 'org', entityId: '99', isEnabled: false },
      { entityType: 'role', entityId: 'admin', isEnabled: true },
    ];
    const result = await evaluateFlag('feat', {
      skipLog: true,
      userId: 7,
      orgId: 99,
      roles: ['admin'],
    });
    expect(result.source).toBe('override');
    expect(result.enabled).toBe(false);
  });

  it('role override applies when no user/org override matches', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.flagRow = FLAG;
    dbState.overrideRows = [{ entityType: 'role', entityId: 'beta', isEnabled: true }];
    const result = await evaluateFlag('feat', {
      skipLog: true,
      userId: 7,
      orgId: 99,
      roles: ['beta'],
    });
    expect(result.source).toBe('override');
    expect(result.enabled).toBe(true);
  });

  it('falls through to global/rollout when no override matches the caller', async () => {
    const { evaluateFlag } = await loadSut();
    dbState.flagRow = FLAG;
    dbState.overrideRows = [{ entityType: 'user', entityId: '999', isEnabled: false }];
    const result = await evaluateFlag('feat', { skipLog: true, userId: 7, orgId: 99 });
    expect(result.source).toBe('global');
    expect(result.enabled).toBe(true);
  });
});

describe('invalidateFlagCache', () => {
  it('forces the next read to re-query the DB', async () => {
    const { evaluateFlag, invalidateFlagCache } = await loadSut();

    dbState.flagRow = { id: 1, key: 'k', isEnabled: true, rolloutPercentage: 100 };
    const r1 = await evaluateFlag('k', { skipLog: true });
    expect(r1.enabled).toBe(true);

    // Mutate the row "in DB" — without invalidation, the cache would still
    // serve the previous value. After invalidation the next call should
    // reflect the new isEnabled=false.
    dbState.flagRow = { id: 1, key: 'k', isEnabled: false, rolloutPercentage: 100 };
    invalidateFlagCache('k');
    const r2 = await evaluateFlag('k', { skipLog: true });
    expect(r2.enabled).toBe(false);
  });
});
