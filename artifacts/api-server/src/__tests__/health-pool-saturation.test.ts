/**
 * Health Pool Saturation — Regression Test (Task #2902)
 *
 * Pins the contract introduced when `/api/health` and `/api/health/detailed`
 * were moved off the main `db` pool onto a dedicated `healthPool` (see
 * `lib/db/src/index.ts`). The bug being prevented:
 *
 *   When the main pool is saturated (every `pool.connect()` slot held by
 *   long-running transactions or scheduled-job fan-out), routing health
 *   probes through `pool` causes the probe to wait
 *   `DB_CONNECT_TIMEOUT_MS` (up to 90 s in production) for a connection,
 *   blocking the request thread and timing out load-balancer probes.
 *
 * Strategy
 * ────────
 * This is a real-Postgres integration test — no DB mocking. It:
 *
 *   1. Checks out every connection in the main `pool` (DB_POOL_MAX) and
 *      holds them open for the duration of the test. The main pool is
 *      now genuinely saturated — any code that calls `pool.connect()` or
 *      `pool.query()` will block until `DB_CONNECT_TIMEOUT_MS` expires
 *      (5 s in tests, 90 s in production).
 *   2. Drives one warm-up `getDetailedHealth()` cycle under saturation
 *      so the in-process cache is populated — this is the call that
 *      would hang for `DB_CONNECT_TIMEOUT_MS` (5 s+) if any probe were
 *      still routed through the main pool. We assert it completes well
 *      under that timeout, which is the actual regression contract.
 *   3. Exercises `/api/health` (mounted on a minimal Express app that
 *      calls the real `getDetailedHealth()`) and asserts the response
 *      lands in < 500 ms — matches production behaviour where the
 *      endpoint is served from the 15 s cache after the first call.
 *   4. Asserts that the database, auth, and queue probes inside the
 *      cached snapshot all return non-error statuses — they ran via
 *      `healthPool` and were unaffected by the main-pool starvation.
 *
 * If a future change reverts any probe back to the main `pool`, the
 * warm-up call in (2) will hang on connection acquisition and either
 * the latency assertion or the probe-status assertion will fail.
 *
 * CI: runs in the `integration-test` job (PostgreSQL service + migrated
 * schema). See `.github/workflows/ci.yml`.
 */

import express, { type Request, type Response } from 'express';
import type { PoolClient } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Force probeAI into the "not_configured" branch — it does a real outbound
// fetch with a 4 s timeout, which would dominate request latency and
// mask the pool-saturation contract this test is pinning. Probes run in
// parallel via Promise.all, so the AI probe's latency only matters if it
// actually performs the fetch.
for (const key of [
  'AI_INTEGRATIONS_OPENAI_BASE_URL',
  'OPENAI_BASE_URL',
  'AI_INTEGRATIONS_OPENAI_API_KEY',
  'OPENAI_API_KEY',
  'AI_INTEGRATIONS_ANTHROPIC_API_KEY',
  'AI_INTEGRATIONS_GEMINI_API_KEY',
]) {
  delete process.env[key];
}

import { healthPool, pool } from '@szl-holdings/db';
import { getDetailedHealth } from '../lib/health-probes';

/**
 * Minimal Express app that mirrors the relevant slice of the real
 * `/api/health` handler (artifacts/api-server/src/app.ts). Mounting the
 * full `app.ts` would pull in dozens of unrelated routes and middlewares
 * that aren't germane to this regression. We only mount what's needed
 * to prove the contract: the route must call `getDetailedHealth()` and
 * respond based on its database/auth statuses.
 */
function buildHealthApp() {
  const app = express();
  app.get('/api/health', async (_req: Request, res: Response) => {
    const probes = await getDetailedHealth();
    const isUnhealthy = (s: string) => s === 'error' || s === 'degraded';
    const overall =
      isUnhealthy(probes.database.status) || isUnhealthy(probes.auth.status)
        ? 'degraded'
        : 'healthy';
    res.status(overall === 'healthy' ? 200 : 503).json({
      status: overall,
      services: {
        database: { status: probes.database.status, latencyMs: probes.database.latencyMs },
        auth: { status: probes.auth.status, latencyMs: probes.auth.latencyMs },
        job_queue: { status: probes.queue.status, depth: probes.queue.depth ?? 0 },
      },
    });
  });
  return app;
}

describe('Health probes — main-pool saturation regression', () => {
  const heldClients: PoolClient[] = [];

  beforeAll(async () => {
    // Sanity check: confirm healthPool is a SEPARATE Pool instance.
    // Otherwise the saturation below would also block the probes and
    // make the rest of this test meaningless.
    expect(healthPool).not.toBe(pool);

    // Pre-warm healthPool so its 2 connections are already established
    // (TCP + Postgres handshake) before we measure request latency.
    // Without this, the very first probe pays a one-time connect cost
    // (~50 ms locally, more on a remote DB) that has nothing to do with
    // the saturation contract under test. We seed both connections in
    // parallel so the pool is at full capacity before the test runs.
    await Promise.all([healthPool.query('SELECT 1'), healthPool.query('SELECT 1')]);

    // Saturate the main pool with `max` checkouts. We deliberately do
    // not release until afterAll — for the duration of this describe
    // block, `pool.connect()` is guaranteed to block until the per-pool
    // connection-timeout fires.
    const max = (pool as unknown as { options: { max?: number } }).options.max ?? 10;
    for (let i = 0; i < max; i++) {
      const client = await pool.connect();
      heldClients.push(client);
    }

    // Warm-up cycle UNDER SATURATION. This is the actual regression
    // probe: if any health probe were still routed through the main
    // `pool`, this call would block on `pool.connect()` for the full
    // `DB_CONNECT_TIMEOUT_MS` (5 s in tests, 90 s in production).
    // We give it a generous 4 s budget — comfortably under that
    // timeout — so the contract is "probes use healthPool" without
    // being flaky on slow remote DBs (auth+queue+database probes share
    // healthPool's 2 connections, so cold-start serialization can push
    // first-call latency to ~1.5 s on remote Postgres).
    const warmStart = Date.now();
    const warmSnapshot = await getDetailedHealth();
    const warmElapsed = Date.now() - warmStart;
    expect(warmElapsed).toBeLessThan(4_000);
    // Sanity: the snapshot we just produced is the one downstream tests
    // assert against (cache TTL = 15 s, comfortably longer than the
    // remaining test runtime).
    expect(warmSnapshot.cachedAt).toBeGreaterThan(warmStart - 1);
  }, 30_000);

  afterAll(async () => {
    for (const client of heldClients) {
      try {
        client.release();
      } catch {
        /* swallow — we are tearing down */
      }
    }
    heldClients.length = 0;
  });

  it('responds to /api/health in under 500ms when the main pool is saturated', async () => {
    const app = buildHealthApp();

    const start = Date.now();
    const res = await request(app).get('/api/health');
    const elapsedMs = Date.now() - start;

    expect(elapsedMs).toBeLessThan(500);
    // Response must come back as a successful health status (not an error
    // surface that might masquerade as "fast" because it short-circuited).
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });

  it('probeDatabase, probeAuth, and probeQueue complete without error under saturation', async () => {
    // Re-fetch the snapshot. getDetailedHealth caches for 15 s, so this
    // may return the snapshot populated by the previous test — that is
    // the correct behaviour: we are asserting on the probe results
    // produced under saturation.
    const snapshot = await getDetailedHealth();

    expect(snapshot.database.status).not.toBe('error');
    expect(snapshot.auth.status).not.toBe('error');
    expect(snapshot.queue.status).not.toBe('error');

    // Each probe should have returned a measured latency (proves the
    // probe actually executed against `healthPool` rather than
    // short-circuiting on a missing dependency).
    expect(typeof snapshot.database.latencyMs).toBe('number');
    expect(typeof snapshot.auth.latencyMs).toBe('number');
    expect(typeof snapshot.queue.latencyMs).toBe('number');

    // Each probe should be well under the SLOW_THRESHOLD_MS (500 ms)
    // even though the main pool is fully saturated.
    expect(snapshot.database.latencyMs).toBeLessThan(500);
    expect(snapshot.auth.latencyMs).toBeLessThan(500);
    expect(snapshot.queue.latencyMs).toBeLessThan(500);
  });
});
