import { describe, expect, it, vi } from 'vitest';
import {
  createDriftDetector,
  runRosieLoop,
  type FormulaInvocation,
  type SentraSignalForRosie,
} from '@szl-holdings/formulas';
import {
  formulaInvocationDriftBridge,
  _rosieEvolutionDetectorForTest,
} from '../../artifacts/api-server/src/jobs/rosie-evolution-loop.js';

/**
 * Local re-implementation of the per-key promise-chain used inside
 * `rosie-evolution-loop.ts` for persistence ordering. The production
 * code is module-private; testing the algorithm against a stub of the
 * persistence layer is the cleanest way to prove the ordering and
 * stale-write guarantees without a live DB.
 */
function makeOrderedPersistence() {
  const chains = new Map<string, Promise<unknown>>();
  // Authoritative "DB" state for the stub.
  const rows = new Map<string, { totalSamples: number; history: number[] }>();
  // Commit log in arrival order — used by tests to assert FIFO.
  const commitLog: Array<{ key: string; op: 'upsert' | 'delete'; totalSamples?: number }> = [];

  function enqueue<T>(key: string, op: () => Promise<T>): Promise<T> {
    const prior = chains.get(key) ?? Promise.resolve();
    const next = prior.then(op, op);
    chains.set(key, next);
    return next;
  }

  function upsert(key: string, totalSamples: number, history: number[]): Promise<void> {
    return enqueue(key, async () => {
      // Simulate variable network latency so out-of-order enqueues can
      // race if the chain isn't doing its job.
      await new Promise((r) => setTimeout(r, Math.random() * 5));
      const cur = rows.get(key);
      // Stale-write guard equivalent to the SQL `setWhere`.
      if (!cur || cur.totalSamples < totalSamples) {
        rows.set(key, { totalSamples, history: [...history] });
        commitLog.push({ key, op: 'upsert', totalSamples });
      } else {
        commitLog.push({ key, op: 'upsert', totalSamples });
      }
    });
  }

  function del(key: string): Promise<void> {
    return enqueue(key, async () => {
      await new Promise((r) => setTimeout(r, Math.random() * 5));
      rows.delete(key);
      commitLog.push({ key, op: 'delete' });
    });
  }

  async function flush(): Promise<void> {
    await Promise.allSettled(Array.from(chains.values()));
  }

  return { upsert, del, flush, rows, commitLog };
}

describe('runRosieLoop (in-process fetch shim)', () => {
  it('drains drift-detector signals and posts proposals via fetchImpl', async () => {
    const detector = createDriftDetector({ gapMin: 0.1, samplesMin: 25 });
    for (let i = 0; i < 30; i++) {
      detector.record({
        formulaId: 'risk-score',
        parameter: 'wSeverity',
        observed: 1.3,
        baseline: 1.0,
        oldValue: 0.5,
        candidateValue: 0.65,
        fromVersion: '1.0.0',
        thesisCitation: 'v10-canonical.md §3.2',
      });
    }
    const signals: readonly SentraSignalForRosie[] = detector.drainSignals();
    expect(signals).toHaveLength(1);

    const fetchImpl = vi.fn(async (_url, init) => {
      const body = JSON.parse((init?.body as string) ?? '{}');
      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            accepted: true,
            proposal: { id: 42, formulaId: body.formulaId, parameter: body.parameter },
          },
          meta: { timestamp: new Date().toISOString() },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const results = await runRosieLoop(signals, { apiBase: '/api', fetchImpl });
    expect(results).toHaveLength(1);
    expect(results[0].decision.kind).toBe('tuning');
    expect((fetchImpl as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
    const [calledUrl] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledUrl).toBe('/api/a11oy/formulas/propose-tuning');
    expect(results[0].submitted).toMatchObject({ ok: true });
  });

  it('queues observations recorded during boot-time rehydration and replays them in order', async () => {
    // Use a fresh createDriftDetector instance so we can simulate the
    // exact race the api-server module guards against: persisted state
    // exists in DB, observations arrive while the SELECT is in flight,
    // and we need the merged window to reflect both.
    const persisted = createDriftDetector({ samplesMin: 5, gapMin: 0.1 });
    for (let i = 0; i < 4; i++) {
      persisted.record({
        formulaId: 'risk-score',
        parameter: 'wSeverity',
        observed: 1.3,
        baseline: 1.0,
        oldValue: 0.5,
        candidateValue: 0.65,
        fromVersion: '1.0.0',
        thesisCitation: 'v10-canonical.md §3.2',
      });
    }
    const snapshot = persisted.dumpBuckets();
    expect(snapshot[0].totalSamples).toBe(4);

    // Simulate the api-server's queueing strategy locally.
    const fresh = createDriftDetector({ samplesMin: 5, gapMin: 0.1 });
    const pending: Parameters<typeof fresh.record>[0][] = [];
    let loadComplete = false;
    const recordOrQueue: typeof fresh.record = (obs) => {
      if (!loadComplete) pending.push(obs);
      else fresh.record(obs);
    };

    // Kick off "load" — it resolves on the next microtask.
    const loadPromise = Promise.resolve().then(() => {
      fresh.loadBuckets(snapshot);
      loadComplete = true;
      for (const o of pending.splice(0)) fresh.record(o);
    });

    // Two observations arrive during the in-flight load window.
    recordOrQueue({
      formulaId: 'risk-score',
      parameter: 'wSeverity',
      observed: 1.4,
      baseline: 1.0,
      oldValue: 0.5,
      candidateValue: 0.65,
      fromVersion: '1.0.0',
      thesisCitation: 'v10-canonical.md §3.2',
    });
    recordOrQueue({
      formulaId: 'risk-score',
      parameter: 'wSeverity',
      observed: 1.4,
      baseline: 1.0,
      oldValue: 0.5,
      candidateValue: 0.65,
      fromVersion: '1.0.0',
      thesisCitation: 'v10-canonical.md §3.2',
    });

    await loadPromise;

    // 4 persisted + 2 queued = 6 total samples — crosses samplesMin=5.
    const dumped = fresh.dumpBuckets();
    expect(dumped).toHaveLength(1);
    expect(dumped[0].totalSamples).toBe(6);
    expect(dumped[0].observedHistory).toEqual([1.3, 1.3, 1.3, 1.3, 1.4, 1.4]);
    const signals = fresh.drainSignals();
    expect(signals).toHaveLength(1);
    expect(signals[0].samples).toBe(6);
  });

  it('per-key persistence chain commits in FIFO order under simulated network jitter', async () => {
    const p = makeOrderedPersistence();
    const KEY = 'risk-score::wSeverity';
    // Fire 20 upserts back-to-back with monotonically increasing
    // totalSamples. Each commit awaits a random delay, so without the
    // per-key chain they would settle out of order and the stale-write
    // guard would reject the late-arriving smaller values.
    const promises: Promise<void>[] = [];
    for (let i = 1; i <= 20; i++) promises.push(p.upsert(KEY, i, [i]));
    await Promise.all(promises);
    await p.flush();

    expect(p.rows.get(KEY)?.totalSamples).toBe(20);
    expect(p.rows.get(KEY)?.history).toEqual([20]);
    // Commit order must be strictly monotonic.
    const seq = p.commitLog
      .filter((c) => c.key === KEY && c.op === 'upsert')
      .map((c) => c.totalSamples);
    expect(seq).toEqual([...Array(20)].map((_, i) => i + 1));
  });

  it('per-key chain prevents delete/upsert races from resurrecting drained rows', async () => {
    const p = makeOrderedPersistence();
    const KEY = 'risk-score::wSeverity';
    // 5 upserts, then a delete (drainSignals) — the delete must commit
    // strictly after every preceding upsert.
    const ops: Promise<void>[] = [];
    for (let i = 1; i <= 5; i++) ops.push(p.upsert(KEY, i, [i]));
    ops.push(p.del(KEY));
    await Promise.all(ops);
    await p.flush();

    // Row is gone (delete was the tail of the chain).
    expect(p.rows.has(KEY)).toBe(false);
    // Commit log: 5 upserts followed by a delete — never the reverse.
    const ops4key = p.commitLog.filter((c) => c.key === KEY);
    expect(ops4key.map((c) => c.op)).toEqual([
      'upsert', 'upsert', 'upsert', 'upsert', 'upsert', 'delete',
    ]);
  });

  it('stale-write guard ignores out-of-order writes even if the chain is bypassed', async () => {
    const p = makeOrderedPersistence();
    const KEY = 'risk-score::wSeverity';
    // Simulate a chain bypass: directly invoke the upsert latencies in
    // reversed completion order by firing them sequentially with
    // explicit awaits in reverse value order.
    await p.upsert(KEY, 10, [10]);
    await p.flush();
    expect(p.rows.get(KEY)?.totalSamples).toBe(10);

    // Now a "stale" write with totalSamples=3 arrives (e.g. from a
    // delayed write on another process). The DB-level guard must reject.
    await p.upsert(KEY, 3, [3]);
    await p.flush();
    expect(p.rows.get(KEY)?.totalSamples).toBe(10);
  });

  it('bridge propagates invocation version as fromVersion on emitted signal', () => {
    const detector = _rosieEvolutionDetectorForTest();
    detector.drainSignals();
    const baseInv: Omit<FormulaInvocation, 'meta'> = {
      formulaId: 'risk-score',
      version: '1.4.2',
      inputs: {},
      output: 0,
      startedAt: Date.now(),
      finishedAt: Date.now(),
      durationMs: 1,
    };
    for (let i = 0; i < 26; i++) {
      formulaInvocationDriftBridge({
        ...baseInv,
        meta: {
          observed: 1.4,
          baseline: 1.0,
          parameter: 'wSeverity',
          oldValue: 0.5,
          candidateValue: 0.7,
          thesisCitation: 'v10-canonical.md §3.2',
        },
      });
    }
    const signals = detector.drainSignals();
    expect(signals).toHaveLength(1);
    expect(signals[0].fromVersion).toBe('1.4.2');
    expect(signals[0].formulaId).toBe('risk-score');
    expect(signals[0].parameter).toBe('wSeverity');
  });
});
