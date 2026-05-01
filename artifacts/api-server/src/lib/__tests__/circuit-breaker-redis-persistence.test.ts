/**
 * Circuit Breaker — Redis Persistence Restart Survival Tests (Task #4317)
 *
 * The `ProviderCircuitBreaker` keeps per-provider state (closed / open /
 * half-open, consecutive failure count, opened-at timestamp, total
 * trip count) in a process-local `Map`. To survive process restarts it
 * mirrors that state to Redis on every transition (`_persist`) and
 * rehydrates it on boot via `initialize()`.
 *
 * These tests cover the three persistence-relevant scenarios:
 *
 *   1. Closed-state failure counter survives a restart (so a single
 *      lingering failure isn't wiped out by a deploy).
 *   2. A tripped breaker (open + totalTripped + openedAt) survives a
 *      restart — preventing a restart from giving a downed provider an
 *      undeserved fresh start.
 *   3. After a restart, an open breaker whose recovery window has
 *      elapsed correctly transitions to half-open on the first
 *      `isOpen()` check (the recovery clock is wall-clock based, not
 *      process-uptime based).
 *
 * "Restart" is simulated with `vi.resetModules()` + a fresh dynamic
 * import of `ai-gateway`, which throws away the in-memory `circuits`
 * map while leaving the (mocked) Redis store intact — exactly the
 * shape of state loss a real restart causes.
 *
 * Redis is replaced by an in-memory `Map` shared via `vi.hoisted` so
 * the persistence layer is exercised end-to-end without requiring a
 * live Redis instance, and the test cleans the fake store between and
 * after each scenario so nothing leaks across tests.
 */

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared fake-Redis store + redis-client mock (hoisted above all imports)
// ---------------------------------------------------------------------------

const { fakeRedis, redisGetMock, redisSetMock, redisDelMock } = vi.hoisted(() => {
  const store = new Map<string, string>();

  const get = vi.fn(async <T>(key: string): Promise<T | null> => {
    const raw = store.get(key);
    if (raw === undefined) return null;
    return JSON.parse(raw) as T;
  });

  const set = vi.fn(async (key: string, data: unknown, _ttlMs: number): Promise<void> => {
    store.set(key, JSON.stringify(data));
  });

  const del = vi.fn(async (key: string): Promise<void> => {
    store.delete(key);
  });

  return {
    fakeRedis: store,
    redisGetMock: get,
    redisSetMock: set,
    redisDelMock: del,
  };
});

vi.mock('../redis-client', () => ({
  redisGet: redisGetMock,
  redisSet: redisSetMock,
  redisDel: redisDelMock,
  isRedisAvailable: vi.fn(() => true),
  getRedisClient: vi.fn(() => null),
  pingRedis: vi.fn(async () => {}),
}));

// `ai-gateway` only touches `services.ai.*` inside request-handling code
// paths (chatCompletionForProvider, isProviderConfigured, etc.) which the
// circuit-breaker tests never invoke. Stub the import so we don't drag the
// whole services package into the test process.
vi.mock('@szl-holdings/services', () => ({
  services: {
    ai: {
      isProviderConfigured: () => false,
      chatCompletionForProvider: async () => ({}),
      responsesForProvider: async () => ({}),
    },
  },
}));

// Silence the breaker's logger output during tests.
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Constants mirrored from ai-gateway.ts
// ---------------------------------------------------------------------------

const CIRCUIT_REDIS_KEY_PREFIX = 'cb:';
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_RECOVERY_MS = 60_000;
const PROVIDER = 'openai' as const;
const PROVIDER_KEY = `${CIRCUIT_REDIS_KEY_PREFIX}${PROVIDER}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type GatewayModule = typeof import('../ai-gateway');

/** Load (or reload, after `vi.resetModules`) the ai-gateway module. */
async function loadGateway(): Promise<GatewayModule> {
  return (await import('../ai-gateway')) as GatewayModule;
}

/**
 * Allow any pending `void redisSet(...)` promises inside the breaker's
 * `_persist` to resolve before we read the fake store.
 */
async function flushPersist(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Read the persisted entry directly from the fake Redis store. */
function readPersisted(): Record<string, unknown> | null {
  const raw = fakeRedis.get(PROVIDER_KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

/** Overwrite a single field on the persisted entry (used to age `openedAt`). */
function patchPersisted(patch: Record<string, unknown>): void {
  const current = readPersisted();
  if (!current) throw new Error('No persisted entry to patch');
  fakeRedis.set(PROVIDER_KEY, JSON.stringify({ ...current, ...patch }));
}

// ---------------------------------------------------------------------------
// Lifecycle: keep tests hermetic
// ---------------------------------------------------------------------------

beforeEach(() => {
  fakeRedis.clear();
  redisGetMock.mockClear();
  redisSetMock.mockClear();
  redisDelMock.mockClear();
  vi.resetModules();
});

afterEach(() => {
  // Belt-and-suspenders: ensure no test leaks fake-Redis keys to the next.
  fakeRedis.clear();
});

afterAll(() => {
  // Final cleanup — mirrors the "tests clean up their Redis keys" requirement.
  fakeRedis.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProviderCircuitBreaker — Redis persistence across restarts', () => {
  it('restores closed-state failure counter after a restart', async () => {
    // ── Pre-restart: record one failure (still below threshold → state
    //    stays "closed", but consecutiveFailures is now 1 and persisted).
    const before = await loadGateway();
    before.providerCircuitBreaker.recordFailure(PROVIDER);
    await flushPersist();

    const persisted = readPersisted();
    expect(persisted).toMatchObject({
      state: 'closed',
      consecutiveFailures: 1,
      totalTripped: 0,
      openedAt: null,
    });

    // ── Simulated restart: drop the in-memory map by re-importing.
    vi.resetModules();
    redisGetMock.mockClear();
    const after = await loadGateway();

    // Fresh instance has no in-memory state yet — getStatus() returns the
    // default zeroed entry until initialize() rehydrates from Redis.
    expect(after.providerCircuitBreaker.getStatus(PROVIDER).consecutiveFailures).toBe(0);

    await after.providerCircuitBreaker.initialize();

    // initialize() must have queried Redis at least once for our provider.
    expect(redisGetMock).toHaveBeenCalledWith(PROVIDER_KEY);

    const status = after.providerCircuitBreaker.getStatus(PROVIDER);
    expect(status.state).toBe('closed');
    expect(status.consecutiveFailures).toBe(1);
    expect(status.totalTripped).toBe(0);
    expect(status.openedAt).toBeNull();
  });

  it('restores open-state (consecutiveFailures, openedAt, totalTripped) after a restart', async () => {
    // ── Pre-restart: trip the breaker by recording the threshold # of failures.
    const before = await loadGateway();
    const tripStart = Date.now();
    for (let i = 0; i < CIRCUIT_FAILURE_THRESHOLD; i++) {
      before.providerCircuitBreaker.recordFailure(PROVIDER);
    }
    await flushPersist();

    const beforeStatus = before.providerCircuitBreaker.getStatus(PROVIDER);
    expect(beforeStatus.state).toBe('open');
    expect(beforeStatus.consecutiveFailures).toBe(CIRCUIT_FAILURE_THRESHOLD);
    expect(beforeStatus.totalTripped).toBe(1);
    expect(beforeStatus.openedAt).not.toBeNull();
    expect(beforeStatus.openedAt!).toBeGreaterThanOrEqual(tripStart);

    const persisted = readPersisted();
    expect(persisted).toMatchObject({
      state: 'open',
      consecutiveFailures: CIRCUIT_FAILURE_THRESHOLD,
      totalTripped: 1,
    });
    expect(persisted!.openedAt).toBe(beforeStatus.openedAt);

    // ── Simulated restart.
    vi.resetModules();
    const after = await loadGateway();
    await after.providerCircuitBreaker.initialize();

    const afterStatus = after.providerCircuitBreaker.getStatus(PROVIDER);
    expect(afterStatus.state).toBe('open');
    expect(afterStatus.consecutiveFailures).toBe(CIRCUIT_FAILURE_THRESHOLD);
    expect(afterStatus.totalTripped).toBe(1);
    expect(afterStatus.openedAt).toBe(beforeStatus.openedAt);

    // The restored breaker still blocks traffic for the down provider.
    expect(after.providerCircuitBreaker.isOpen(PROVIDER)).toBe(true);
  });

  it('transitions to half-open after a restart once the recovery window has elapsed', async () => {
    // ── Pre-restart: trip the breaker.
    const before = await loadGateway();
    for (let i = 0; i < CIRCUIT_FAILURE_THRESHOLD; i++) {
      before.providerCircuitBreaker.recordFailure(PROVIDER);
    }
    await flushPersist();
    expect(before.providerCircuitBreaker.getStatus(PROVIDER).state).toBe('open');

    // Age the persisted `openedAt` so the recovery window has provably
    // elapsed by the time the post-restart instance evaluates isOpen().
    // This sidesteps wall-clock waiting (CIRCUIT_RECOVERY_MS = 60s) and
    // also proves the recovery clock is driven by the persisted
    // timestamp rather than a process-uptime counter.
    const agedOpenedAt = Date.now() - (CIRCUIT_RECOVERY_MS + 5_000);
    patchPersisted({ openedAt: agedOpenedAt });

    // ── Simulated restart.
    vi.resetModules();
    const after = await loadGateway();
    await after.providerCircuitBreaker.initialize();

    // Sanity: open state restored with the aged timestamp.
    const restored = after.providerCircuitBreaker.getStatus(PROVIDER);
    expect(restored.state).toBe('open');
    expect(restored.openedAt).toBe(agedOpenedAt);

    // First isOpen() call must allow a single probe through (half-open).
    expect(after.providerCircuitBreaker.isOpen(PROVIDER)).toBe(false);
    const halfOpenStatus = after.providerCircuitBreaker.getStatus(PROVIDER);
    expect(halfOpenStatus.state).toBe('half-open');
    expect(halfOpenStatus.lastTestedAt).not.toBeNull();

    // Subsequent calls during the same probe must be blocked until the
    // probe resolves (success → closed, failure → re-open).
    expect(after.providerCircuitBreaker.isOpen(PROVIDER)).toBe(true);

    await flushPersist();

    // The half-open transition itself was persisted, so a second restart
    // would also see the breaker in half-open with the probe in flight.
    const persistedHalfOpen = readPersisted();
    expect(persistedHalfOpen).toMatchObject({ state: 'half-open' });

    // Successful probe closes the breaker; verify and confirm persistence.
    after.providerCircuitBreaker.recordSuccess(PROVIDER);
    await flushPersist();

    const closedStatus = after.providerCircuitBreaker.getStatus(PROVIDER);
    expect(closedStatus.state).toBe('closed');
    expect(closedStatus.consecutiveFailures).toBe(0);

    const persistedClosed = readPersisted();
    expect(persistedClosed).toMatchObject({
      state: 'closed',
      consecutiveFailures: 0,
    });
  });
});
