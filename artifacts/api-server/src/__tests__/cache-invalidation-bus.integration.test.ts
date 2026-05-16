/**
 * Integration test — cross-process cache invalidation bus (task #4901).
 *
 * The API server runs across multiple workers, each with its own
 * in-memory TTL cache for feature flags and runtime config. The
 * existing unit tests prove that an admin write invalidates the
 * cache on the *same* worker; this test proves that a write on
 * worker A is reflected on worker B without waiting for the per-
 * worker TTL (30s for flags, 60s for config) to expire.
 *
 * Strategy:
 *
 *   - Mock `@szl-holdings/db` with a shared in-memory store so both
 *     simulated workers read from the same "database" rows.
 *
 *   - Mock `lib/cache-invalidation-bus` with a tiny EventEmitter-based
 *     transport stored on `globalThis`. The transport survives
 *     `vi.resetModules()` so two freshly-loaded copies of the SUT
 *     wire their `onCacheInvalidation` listeners against the SAME
 *     emitter — exactly mirroring how two real workers exchange
 *     pg_notify messages over a shared Postgres channel.
 *
 *   - Load `lib/platform-flags` (and `lib/runtime-config`) twice via
 *     `vi.resetModules()` to get two independent module instances —
 *     each with its own in-memory cache. Workers A and B.
 *
 *   - Drive the contract: write on A, observe propagation to B.
 *
 * The "acceptable bound" we assert is single-digit milliseconds:
 * since the bus is synchronous in the test transport and just a
 * `pg_notify` round-trip in production (typically < 5ms on the same
 * VPC), we await a single `setImmediate` tick and require the
 * invalidation to have landed.
 */

import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Shared in-memory "database" ─────────────────────────────────────────────
// Both simulated workers read from this table. Mutating it mimics an
// operator update via the admin route handler.

interface FlagRow {
  id: number;
  key: string;
  isEnabled: boolean;
  rolloutPercentage: number;
}
interface ConfigRow {
  key: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'json';
}

interface SharedStore {
  flag: FlagRow | null;
  config: ConfigRow | null;
  flagSelectCount: number;
  configSelectCount: number;
}

const FLAGS_TABLE = { __t: 'flags' } as const;
const OVERRIDES_TABLE = { __t: 'overrides' } as const;
const LOGS_TABLE = { __t: 'logs' } as const;
const CONFIG_TABLE = { __t: 'config' } as const;

const store: SharedStore = {
  flag: null,
  config: null,
  flagSelectCount: 0,
  configSelectCount: 0,
};

function makeSelectChain(table: unknown): unknown {
  const chain = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') {
          return (resolve: (v: unknown[]) => unknown, reject?: (e: unknown) => unknown) => {
            let rows: unknown[] = [];
            if (table === FLAGS_TABLE) {
              store.flagSelectCount++;
              rows = store.flag ? [store.flag] : [];
            } else if (table === CONFIG_TABLE) {
              store.configSelectCount++;
              rows = store.config ? [store.config] : [];
            } else if (table === OVERRIDES_TABLE) {
              rows = [];
            }
            return Promise.resolve(rows).then(resolve, reject);
          };
        }
        return () => chain;
      },
    },
  );
  return chain;
}

vi.mock('@szl-holdings/db', () => {
  const insertResult = () => {
    const p = Promise.resolve([{ id: 1 }]) as Promise<unknown[]> & {
      returning: () => Promise<unknown[]>;
      onConflictDoNothing: () => Promise<unknown[]>;
    };
    p.returning = () => Promise.resolve([{ id: 1 }]);
    p.onConflictDoNothing = () => Promise.resolve([]);
    return p;
  };
  return {
    db: {
      select: () => ({ from: (table: unknown) => makeSelectChain(table) }),
      insert: () => ({ values: () => insertResult() }),
    },
    featureFlagsTable: FLAGS_TABLE,
    featureFlagOverridesTable: OVERRIDES_TABLE,
    flagCheckLogsTable: LOGS_TABLE,
    runtimeConfigTable: CONFIG_TABLE,
  };
});

vi.mock('drizzle-orm', () => ({ eq: () => ({}), and: () => ({}) }));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

// ─── Shared invalidation transport ───────────────────────────────────────────
// Both module copies (worker A and worker B) import `cache-invalidation-bus`.
// The factory below resolves to a fresh module record for each SUT load —
// but we deliberately stash the EventEmitter on globalThis so each copy of
// the bus dispatches against the SAME emitter. This is exactly analogous to
// the production design: two pg clients on the same LISTEN channel both
// receive every NOTIFY.
//
// Without the global stash, each `vi.resetModules()` would create a
// brand-new EventEmitter and the workers would be talking to themselves
// instead of each other.

const SHARED_EMITTER_KEY = '__test_cache_bus_emitter__';

function getSharedEmitter(): EventEmitter {
  const g = globalThis as unknown as Record<string, EventEmitter | undefined>;
  if (!g[SHARED_EMITTER_KEY]) {
    const e = new EventEmitter();
    e.setMaxListeners(50);
    g[SHARED_EMITTER_KEY] = e;
  }
  return g[SHARED_EMITTER_KEY] as EventEmitter;
}

function resetSharedEmitter(): void {
  const g = globalThis as unknown as Record<string, EventEmitter | undefined>;
  g[SHARED_EMITTER_KEY]?.removeAllListeners();
  g[SHARED_EMITTER_KEY] = undefined;
}

vi.mock('../lib/cache-invalidation-bus.js', () => {
  // NOTE: we resolve the emitter lazily inside each function so that even
  // after `vi.resetModules()` the SAME globalThis-backed emitter is reused
  // across SUT instances.
  return {
    onCacheInvalidation: (handler: (e: unknown) => void) => {
      const emitter = getSharedEmitter();
      emitter.on('event', handler);
      return () => emitter.off('event', handler);
    },
    publishCacheInvalidation: async (event: unknown) => {
      getSharedEmitter().emit('event', event);
    },
    startCacheInvalidationBus: async () => {},
    stopCacheInvalidationBus: async () => {},
  };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

interface FlagsModule {
  evaluateFlag: (
    key: string,
    ctx?: { skipLog?: boolean; userId?: number },
  ) => Promise<{ enabled: boolean; source: string }>;
  invalidateFlagCache: (key: string) => void;
}

interface ConfigModule {
  getConfig: <T>(key: string, def: T) => Promise<T>;
  invalidateConfigCache: (key: string) => void;
  invalidateAllConfigCache: () => void;
}

async function loadFlagsModule(): Promise<FlagsModule> {
  vi.resetModules();
  return (await import('../lib/platform-flags.js')) as unknown as FlagsModule;
}

async function loadConfigModule(): Promise<ConfigModule> {
  vi.resetModules();
  return (await import('../lib/runtime-config.js')) as unknown as ConfigModule;
}

beforeEach(() => {
  store.flag = null;
  store.config = null;
  store.flagSelectCount = 0;
  store.configSelectCount = 0;
  resetSharedEmitter();
});

afterEach(() => {
  resetSharedEmitter();
});

// ─── The contract ───────────────────────────────────────────────────────────

describe('cross-process cache invalidation — feature flags', () => {
  it('a flag invalidation on worker A is visible on worker B without TTL wait', async () => {
    // Both workers must subscribe to the bus BEFORE any writes happen.
    const workerA = await loadFlagsModule();
    const workerB = await loadFlagsModule();

    // Initial DB state: flag is enabled at 100%.
    store.flag = { id: 1, key: 'kill_switch', isEnabled: true, rolloutPercentage: 100 };

    // Both workers warm their caches by reading once.
    expect((await workerA.evaluateFlag('kill_switch', { skipLog: true })).enabled).toBe(true);
    expect((await workerB.evaluateFlag('kill_switch', { skipLog: true })).enabled).toBe(true);
    const baselineSelects = store.flagSelectCount;
    expect(baselineSelects).toBe(2); // one per worker

    // Operator flips the kill-switch on worker A. The route handler
    // updates the row in the DB and calls invalidateFlagCache(key).
    store.flag = { id: 1, key: 'kill_switch', isEnabled: false, rolloutPercentage: 100 };
    workerA.invalidateFlagCache('kill_switch');

    // Wait one microtask boundary so the bus delivers the event to B.
    // In production this is the pg LISTEN/NOTIFY round-trip (typically
    // < 5ms on the same VPC); the contract is "well under the 30s TTL".
    await new Promise<void>((r) => setImmediate(r));

    // Worker B's NEXT read must reflect the new value. If the bus
    // failed to invalidate, B would still serve isEnabled=true from
    // its cache for up to 30s.
    const afterB = await workerB.evaluateFlag('kill_switch', { skipLog: true });
    expect(afterB.enabled).toBe(false);

    // And it must have re-queried the DB (proves cache was actually
    // busted, not just papered over by some other mechanism).
    expect(store.flagSelectCount).toBe(baselineSelects + 1);
  });

  it('worker A also invalidates its own cache (publisher self-delivery is harmless)', async () => {
    const workerA = await loadFlagsModule();

    store.flag = { id: 1, key: 'k', isEnabled: true, rolloutPercentage: 100 };
    expect((await workerA.evaluateFlag('k', { skipLog: true })).enabled).toBe(true);
    const before = store.flagSelectCount;

    store.flag = { id: 1, key: 'k', isEnabled: false, rolloutPercentage: 100 };
    workerA.invalidateFlagCache('k');
    await new Promise<void>((r) => setImmediate(r));

    expect((await workerA.evaluateFlag('k', { skipLog: true })).enabled).toBe(false);
    expect(store.flagSelectCount).toBe(before + 1);
  });

  it('an invalidation only affects the named key — unrelated cached flags stay cached', async () => {
    const workerA = await loadFlagsModule();
    const workerB = await loadFlagsModule();

    store.flag = { id: 1, key: 'flag_a', isEnabled: true, rolloutPercentage: 100 };
    await workerA.evaluateFlag('flag_a', { skipLog: true });
    await workerB.evaluateFlag('flag_a', { skipLog: true });
    const baseline = store.flagSelectCount;

    // Invalidate a DIFFERENT key.
    workerA.invalidateFlagCache('flag_b');
    await new Promise<void>((r) => setImmediate(r));

    // B's cached entry for flag_a is intact; no extra DB read.
    await workerB.evaluateFlag('flag_a', { skipLog: true });
    expect(store.flagSelectCount).toBe(baseline);
  });
});

describe('cross-process cache invalidation — runtime config', () => {
  it('a config invalidation on worker A is visible on worker B without TTL wait', async () => {
    const workerA = await loadConfigModule();
    const workerB = await loadConfigModule();

    store.config = { key: 'rate_limit_global_max', value: '200', valueType: 'number' };
    expect(await workerA.getConfig<number>('rate_limit_global_max', 0)).toBe(200);
    expect(await workerB.getConfig<number>('rate_limit_global_max', 0)).toBe(200);
    const baseline = store.configSelectCount;
    expect(baseline).toBe(2);

    // Operator raises the rate limit on worker A.
    store.config = { key: 'rate_limit_global_max', value: '500', valueType: 'number' };
    workerA.invalidateConfigCache('rate_limit_global_max');
    await new Promise<void>((r) => setImmediate(r));

    expect(await workerB.getConfig<number>('rate_limit_global_max', 0)).toBe(500);
    expect(store.configSelectCount).toBe(baseline + 1);
  });

  it('invalidateAllConfigCache wipes every cached entry on every worker', async () => {
    const workerA = await loadConfigModule();
    const workerB = await loadConfigModule();

    store.config = { key: 'k', value: '1', valueType: 'number' };
    await workerA.getConfig<number>('k', 0);
    await workerB.getConfig<number>('k', 0);
    const baseline = store.configSelectCount;

    store.config = { key: 'k', value: '99', valueType: 'number' };
    workerA.invalidateAllConfigCache();
    await new Promise<void>((r) => setImmediate(r));

    expect(await workerB.getConfig<number>('k', 0)).toBe(99);
    expect(store.configSelectCount).toBe(baseline + 1);
  });
});
