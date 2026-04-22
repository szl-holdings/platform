import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool, getLongRunningCheckouts, type LongCheckoutInfo } from '@szl-holdings/db';

/**
 * OBS-007 — pool checkout instrumentation contract tests
 *
 * These tests pin the behaviour fixed in task #2901:
 *
 *   1) `captureStack()` runs synchronously BEFORE awaiting `pool.connect()`,
 *      so the recorded `stack` includes the originating caller frame
 *      (the test function) rather than collapsing to internal Node frames.
 *
 *   2) The "held" age (`ageMs`) is measured from the moment pg actually
 *      hands us a usable client (post-await), and pool-queue wait time is
 *      reported separately as `waitMs`. This prevents false long-checkout
 *      alerts when callers briefly queue under boot fan-out.
 *
 *   3) A normally-released checkout leaves no record behind (no leak).
 *
 *   4) Releasing a held client clears it from the active set so the
 *      sweeper stops reporting it.
 *
 * We use `getLongRunningCheckouts(0)` so the assertions don't require
 * waiting out the production threshold (default 30 s) — passing 0 returns
 * every active checkout regardless of age.
 */

async function asNamedTestCaller(): Promise<{ stack: string; waitMs: number; ageMs: number }> {
  const client = await pool.connect();
  try {
    // Hold briefly so the checkout is observable in the active set.
    await new Promise((r) => setTimeout(r, 25));
    const active = getLongRunningCheckouts(0);
    expect(active.length).toBeGreaterThan(0);
    // Newest checkout id is the largest — pick that one.
    const ours = active.reduce((max, cur) => (cur.id > max.id ? cur : max), active[0]!);
    return { stack: ours.stack, waitMs: ours.waitMs, ageMs: ours.ageMs };
  } finally {
    client.release();
  }
}

describe('db pool instrumentation (OBS-007 fix)', () => {
  let savedListener: ((err: Error) => void) | undefined;

  beforeAll(() => {
    // pg pool emits 'error' for transient idle-client failures in CI; install
    // a no-op listener so any unrelated wobble doesn't fail an unrelated test.
    savedListener = (_err: Error) => {};
    pool.on('error', savedListener);
  });

  afterAll(() => {
    if (savedListener) pool.off('error', savedListener);
  });

  it('captures the originating call stack (frame includes the test caller)', async () => {
    const { stack } = await asNamedTestCaller();
    // The stack must contain a frame from THIS test file, proving we
    // captured BEFORE the await crossed an async boundary. If captureStack
    // ran post-await (the old bug), the chain collapses to internal Node
    // frames like `process.processTicksAndRejections` and contains no
    // user-code frames at all.
    expect(stack).toMatch(/db-pool-instrumentation\.test/);
    expect(stack).toContain('asNamedTestCaller');
  });

  it('reports ageMs (post-acquisition hold) and waitMs (pre-acquisition queue) separately', async () => {
    const { ageMs, waitMs } = await asNamedTestCaller();
    expect(typeof ageMs).toBe('number');
    expect(typeof waitMs).toBe('number');
    expect(ageMs).toBeGreaterThanOrEqual(0);
    expect(waitMs).toBeGreaterThanOrEqual(0);
    // Single uncontended connect should resolve quickly; allow generous
    // CI slack but the queue-wait must not be conflated with hold time.
    expect(waitMs).toBeLessThan(5_000);
  });

  it('does not retain a record after the client is released (no leak)', async () => {
    const before = getLongRunningCheckouts(0).length;
    const client = await pool.connect();
    const duringActive = getLongRunningCheckouts(0);
    expect(duringActive.length).toBe(before + 1);
    client.release();
    // Release is synchronous from the instrumentation's point of view —
    // the record is removed inside the wrapped release before the next
    // microtask. Give it a tick anyway in case of host scheduling.
    await new Promise((r) => setImmediate(r));
    const after = getLongRunningCheckouts(0).length;
    expect(after).toBe(before);
  });

  it('does not over-count waitMs into ageMs even when callers queue (contention)', async () => {
    // Force pool contention by holding several clients while a new caller
    // queues. We hold (poolMax - 1) so at least one extra connect() must
    // queue briefly. After it acquires + releases, its hold time should be
    // a few ms — NOT include the wait time we forced it to spend queued.
    const poolMaxStr = process.env.DB_POOL_MAX ?? '10';
    const poolMax = Number.parseInt(poolMaxStr, 10) || 10;
    const blockers: Array<{ release: () => void }> = [];
    try {
      for (let i = 0; i < poolMax - 1; i++) {
        const c = await pool.connect();
        blockers.push({ release: () => c.release() });
      }
      // Now occupy the LAST slot too, so the next connect() must wait.
      const last = await pool.connect();
      const queued = pool.connect(); // pending — pool is full
      // Release `last` shortly so the queued caller wakes up after a real wait.
      const WAIT_MS = 80;
      setTimeout(() => last.release(), WAIT_MS);
      const acquired = await queued;
      // Snapshot active set immediately so ageMs is still tiny.
      const active = getLongRunningCheckouts(0);
      const ours = active.reduce((max, cur) => (cur.id > max.id ? cur : max), active[0]!);
      acquired.release();
      // After waiting for `last` to release, our queued caller's waitMs
      // should be at least roughly the wait window (allow scheduling slack).
      expect(ours.waitMs).toBeGreaterThanOrEqual(WAIT_MS - 30);
      // Critically, ageMs (held since acquisition) must NOT include that
      // queue wait — should be near-zero at the snapshot moment.
      expect(ours.ageMs).toBeLessThan(WAIT_MS);
    } finally {
      for (const b of blockers) b.release();
    }
  });
});
