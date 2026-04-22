import { afterEach, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  _resetOpsReadyForTests,
  isOpsReady,
  markOpsReady,
  requireOpsReady,
  runBootSeedSequence,
  whenOpsReady,
} from '../lib/boot-orchestrator';

/**
 * OBS-007 root-cause fix — boot orchestrator outcome contract.
 *
 * These tests pin the behaviour replacing the old fan-out:
 *
 *   1) `runBootSeedSequence` runs tasks STRICTLY in order. The previous
 *      design fired ~11 seeds concurrently as fire-and-forget promises,
 *      saturating DB_POOL_MAX=10 and producing ~30 long-checkout
 *      warnings per cold start. Serialisation eliminates the storm.
 *
 *   2) A failing task does NOT abort the chain — subsequent tasks still
 *      run, and the failure is captured in the returned summary so the
 *      caller can still flip the ops-ready gate (fail-open).
 *
 *   3) Tasks NEVER overlap (the headline outcome the reviewer asked us
 *      to verify deterministically — no concurrent boot DB checkouts).
 *
 *   4) `requireOpsReady` returns 503 + Retry-After until `markOpsReady()`
 *      is called, then lets requests through. Replaces the old 60-second
 *      blanket setTimeout that allowed silent reads of pre-seed state.
 */

describe('boot-orchestrator (OBS-007 root-cause fix)', () => {
  afterEach(() => {
    _resetOpsReadyForTests();
  });

  it('runs seed tasks strictly sequentially (no concurrent overlap)', async () => {
    const events: string[] = [];
    let inFlight = 0;
    let maxConcurrent = 0;

    const make = (name: string, ms: number) => async () => {
      inFlight++;
      maxConcurrent = Math.max(maxConcurrent, inFlight);
      events.push(`${name}:start`);
      await new Promise((r) => setTimeout(r, ms));
      events.push(`${name}:end`);
      inFlight--;
    };

    const result = await runBootSeedSequence([
      { name: 'a', fn: make('a', 20) },
      { name: 'b', fn: make('b', 20) },
      { name: 'c', fn: make('c', 20) },
    ]);

    expect(result.ok).toEqual(['a', 'b', 'c']);
    expect(result.failed).toEqual([]);
    // Critical outcome: at no point are two seed tasks executing
    // simultaneously. This is what eliminates the OBS-007 storm.
    expect(maxConcurrent).toBe(1);
    // Order must be a:start → a:end → b:start → b:end → c:start → c:end.
    expect(events).toEqual([
      'a:start',
      'a:end',
      'b:start',
      'b:end',
      'c:start',
      'c:end',
    ]);
  });

  it('continues the chain after a task throws (fail-open semantics)', async () => {
    const events: string[] = [];
    const result = await runBootSeedSequence([
      { name: 'first', fn: async () => events.push('first') },
      {
        name: 'breaker',
        fn: async () => {
          throw new Error('boom');
        },
      },
      { name: 'last', fn: async () => events.push('last') },
    ]);

    expect(events).toEqual(['first', 'last']);
    expect(result.ok).toEqual(['first', 'last']);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.name).toBe('breaker');
  });

  it('requireOpsReady returns 503 + Retry-After until markOpsReady is called', async () => {
    const app = express();
    app.use('/ops', requireOpsReady);
    app.get('/ops/ping', (_req, res) => res.status(200).json({ ok: true }));

    expect(isOpsReady()).toBe(false);
    const before = await request(app).get('/ops/ping');
    expect(before.status).toBe(503);
    expect(before.headers['retry-after']).toBe('5');
    expect(before.body).toMatchObject({
      error: 'service_initializing',
      retryAfterSeconds: 5,
    });

    markOpsReady();
    expect(isOpsReady()).toBe(true);

    const after = await request(app).get('/ops/ping');
    expect(after.status).toBe(200);
    expect(after.body).toEqual({ ok: true });
  });

  it('whenOpsReady resolves once markOpsReady fires (used by tests/boot consumers)', async () => {
    let resolved = false;
    const waiter = whenOpsReady().then(() => {
      resolved = true;
    });
    // Not yet
    await new Promise((r) => setImmediate(r));
    expect(resolved).toBe(false);
    markOpsReady();
    await waiter;
    expect(resolved).toBe(true);
  });
});
