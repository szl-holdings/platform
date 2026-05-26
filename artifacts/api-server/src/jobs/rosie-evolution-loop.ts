/**
 * API-server scheduled job — ROSIE evolution loop.
 *
 * Server-side counterpart to the sentra-brain worker. Owns:
 *   1. A drift detector that records observed formula performance from
 *      the `setInvocationSink` stream maintained by the A11oy formulas
 *      router (when invocations carry observed/baseline metadata).
 *   2. A scheduled tick (`runRosieEvolutionTick`) that drains drifting
 *      buckets into `runRosieLoop`, which posts proposals to the
 *      `/a11oy/formulas/propose-tuning` endpoint. To avoid an HTTP hop
 *      back into our own server, the tick injects an in-process
 *      `fetchImpl` that calls the proposal helper directly.
 *
 * Done looks like: pending proposals appear in the A11oy /formulas
 * Codex tuning queue every `ROSIE_LOOP_INTERVAL_MINUTES` (default 15)
 * with zero operator intervention.
 *
 * Source: docs/thesis/v10-canonical.md §6.1, task #4883.
 */

import {
  createDriftDetector,
  runRosieLoop,
  type DriftBucketState,
  type DriftObservation,
  type RosieLoopOptions,
  type RosieLoopResult,
  type SentraSignalForRosie,
  type FormulaInvocation,
} from '@szl-holdings/formulas';
import { sql } from 'drizzle-orm';
import { db, formulaDriftBucketsTable } from '@szl-holdings/db';
import { logger } from '../lib/logger.js';
import {
  proposeTuningInProcess,
  type ProposeTuningInProcessResult,
} from '../routes/a11oy-formulas-api.js';

// ─────────────────────────────────────────────────────────────────────────
// Drift-bucket persistence (task #4960).
//
// The in-memory detector lives for the lifetime of the api-server process.
// To survive restarts mid-window — drift signals can take days to
// accumulate the 25-sample threshold — every mutation is written through
// to `formula_drift_buckets` and every bucket is rehydrated at boot.
//
// Durability guarantees (single-writer AND multi-writer safe):
//   1. Per-bucket FIFO. Every write for a given (formulaId, parameter) is
//      appended to a keyed promise chain so a fast burst of observations
//      cannot let an older UPSERT commit AFTER a newer one within this
//      process.
//   2. Monotonic revision. Every mutation bumps a per-key counter
//      (`_revisions`) seeded from disk on rehydration. The revision
//      travels with the UPSERT, and a SQL `setWhere` clause rejects any
//      inbound write whose revision is not strictly greater than what is
//      already persisted. This protects against out-of-order writes from
//      ANY source (including a second writer process) — no DB round-trip
//      can regress state.
//   3. Soft-delete tombstones. `drainSignals()` / `reset()` issue an
//      UPSERT that bumps the revision and sets `tombstoned_at = NOW()`
//      rather than a hard DELETE. The row is retained so that a stale
//      late-arriving UPSERT from another writer (or from this process's
//      own slow chain) hits the same `setWhere` guard and is rejected —
//      a tombstoned bucket cannot be resurrected by a stale write.
//      `loadBuckets()` filters tombstoned rows on boot; a periodic
//      janitor (follow-up task) hard-deletes them after retention.
//
// Failures are logged but never propagate into the hot `record()` path.
// ─────────────────────────────────────────────────────────────────────────
const _persistChains = new Map<string, Promise<unknown>>();
const _revisions = new Map<string, number>();

function chainKey(formulaId: string, parameter: string): string {
  return `${formulaId}::${parameter}`;
}

function nextRevision(formulaId: string, parameter: string): number {
  const key = chainKey(formulaId, parameter);
  const next = (_revisions.get(key) ?? 0) + 1;
  _revisions.set(key, next);
  return next;
}

function seedRevision(formulaId: string, parameter: string, revision: number): void {
  const key = chainKey(formulaId, parameter);
  const cur = _revisions.get(key) ?? 0;
  if (revision > cur) _revisions.set(key, revision);
}

function enqueuePersistOp<T>(
  formulaId: string,
  parameter: string,
  op: () => Promise<T>,
): Promise<T> {
  const key = chainKey(formulaId, parameter);
  const prior = _persistChains.get(key) ?? Promise.resolve();
  const next = prior.then(op, op);
  // Keep the map bounded: once the tail settles, drop the entry if it
  // is still the tail (a newer enqueue would have replaced it).
  _persistChains.set(key, next);
  next.finally(() => {
    if (_persistChains.get(key) === next) _persistChains.delete(key);
  }).catch(() => {});
  return next;
}

async function persistBucket(state: DriftBucketState): Promise<void> {
  // Allocate the revision SYNCHRONOUSLY at enqueue time so per-key
  // monotonicity holds regardless of how the chain interleaves with
  // network latency. The revision captured here is the one that flies
  // with this write.
  const revision = nextRevision(state.formulaId, state.parameter);
  await enqueuePersistOp(state.formulaId, state.parameter, async () => {
    try {
      const updatedAt = new Date();
      await db
        .insert(formulaDriftBucketsTable)
        .values({
          formulaId: state.formulaId,
          parameter: state.parameter,
          oldValue: state.oldValue,
          candidateValue: state.candidateValue,
          fromVersion: state.fromVersion,
          thesisCitation: state.thesisCitation,
          irreversibility: state.irreversibility,
          observedHistory: state.observedHistory,
          baselineHistory: state.baselineHistory,
          gapHistory: state.gapHistory,
          totalSamples: state.totalSamples,
          revision,
          tombstonedAt: null,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: [formulaDriftBucketsTable.formulaId, formulaDriftBucketsTable.parameter],
          set: {
            oldValue: state.oldValue,
            candidateValue: state.candidateValue,
            fromVersion: state.fromVersion,
            thesisCitation: state.thesisCitation,
            irreversibility: state.irreversibility,
            observedHistory: state.observedHistory,
            baselineHistory: state.baselineHistory,
            gapHistory: state.gapHistory,
            totalSamples: state.totalSamples,
            revision,
            // A live write clears any prior tombstone — but ONLY if the
            // revision guard below has already accepted us, which means
            // no live writer beat us with a higher revision.
            tombstonedAt: null,
            updatedAt,
          },
          // Stale-write guard — the heart of the durability model.
          // Reject any inbound write whose revision is not strictly
          // greater than what's already on disk. This single condition
          // covers both "older upsert lands after newer one" and
          // "stale upsert tries to resurrect a tombstone".
          setWhere: sql`${formulaDriftBucketsTable.revision} < ${revision}`,
        });
    } catch (err) {
      logger.warn(
        { err, formulaId: state.formulaId, parameter: state.parameter, revision },
        '[rosie-loop] Failed to persist drift bucket (non-fatal)',
      );
    }
  });
}

async function deletePersistedBucket(formulaId: string, parameter: string): Promise<void> {
  // Tombstone semantics: bump the revision and mark the row drained.
  // We do NOT issue a hard DELETE — leaving the row in place with a
  // high revision is what guarantees a stale UPSERT from any source
  // cannot resurrect this bucket.
  const revision = nextRevision(formulaId, parameter);
  await enqueuePersistOp(formulaId, parameter, async () => {
    try {
      const tombstonedAt = new Date();
      await db
        .insert(formulaDriftBucketsTable)
        .values({
          formulaId,
          parameter,
          // Sentinel values for the tombstone row. These columns are
          // NOT NULL on disk but their content is meaningless once the
          // row is tombstoned (loadBuckets skips it).
          oldValue: 0,
          candidateValue: 0,
          fromVersion: 'tombstoned',
          thesisCitation: 'tombstoned',
          irreversibility: 0,
          observedHistory: [],
          baselineHistory: [],
          gapHistory: [],
          totalSamples: 0,
          revision,
          tombstonedAt,
          updatedAt: tombstonedAt,
        })
        .onConflictDoUpdate({
          target: [formulaDriftBucketsTable.formulaId, formulaDriftBucketsTable.parameter],
          set: {
            observedHistory: [],
            baselineHistory: [],
            gapHistory: [],
            totalSamples: 0,
            revision,
            tombstonedAt,
            updatedAt: tombstonedAt,
          },
          setWhere: sql`${formulaDriftBucketsTable.revision} < ${revision}`,
        });
    } catch (err) {
      logger.warn(
        { err, formulaId, parameter, revision },
        '[rosie-loop] Failed to tombstone drift bucket (non-fatal)',
      );
    }
  });
}

/**
 * Test helper — await all in-flight per-bucket persistence operations.
 * Useful in integration tests that assert on durable state immediately
 * after a burst of `record()` / `drainSignals()` calls.
 */
export async function _flushDriftPersistenceForTest(): Promise<void> {
  const pending = Array.from(_persistChains.values());
  await Promise.allSettled(pending);
}

// Module-level detector — shared across invocation observers and the
// scheduled tick so observations recorded between ticks accumulate
// safely. Each mutation is mirrored to `formula_drift_buckets`.
const detector = createDriftDetector(
  {},
  {
    onBucketChanged: (state) => persistBucket(state),
    onBucketDeleted: (formulaId, parameter) => deletePersistedBucket(formulaId, parameter),
  },
);

// ─────────────────────────────────────────────────────────────────────────
// Boot-time rehydration race control.
//
// Rehydration is async (one DB SELECT) but observation recording is sync
// and can fire from `setInvocationSink` the instant the server is up. If
// we let observations land in the detector while the SELECT is in flight,
// `loadBuckets()` would later overwrite those fresh observations with the
// older persisted snapshot — silently losing samples.
//
// Solution: as soon as `loadPersistedDriftBuckets()` is called we mark
// the loader "in flight" and route every incoming observation into a
// pending queue. When the load resolves we apply the persisted state and
// then replay the queue in order — so persisted history + in-flight
// observations both end up in the rolling window with no loss and in
// the correct order.
//
// If `loadPersistedDriftBuckets()` is never called (e.g. unit tests that
// drive the detector directly), `_loadStarted` stays false and
// observations bypass the queue entirely — preserving the synchronous
// contract the existing test suite depends on.
// ─────────────────────────────────────────────────────────────────────────
let _loadStarted = false;
let _loadComplete = false;
let _loadPromise: Promise<number> | null = null;
const _pendingObservations: DriftObservation[] = [];

/**
 * High-water mark for the boot-time observation queue. If a rehydration
 * SELECT stalls long enough that the queue grows past this size we log
 * once at WARN so operators can correlate with DB latency dashboards.
 * Tunable via `ROSIE_LOOP_QUEUE_WARN_DEPTH` (default 1000). Set to 0 to
 * disable the warning.
 */
const _queueWarnDepth = Math.max(
  0,
  parseInt(process.env.ROSIE_LOOP_QUEUE_WARN_DEPTH ?? '1000', 10) || 1000,
);
let _queueWarnFired = false;
let _queueHighWaterMark = 0;

function recordOrQueue(obs: DriftObservation): void {
  if (_loadStarted && !_loadComplete) {
    _pendingObservations.push(obs);
    if (_pendingObservations.length > _queueHighWaterMark) {
      _queueHighWaterMark = _pendingObservations.length;
    }
    if (
      !_queueWarnFired &&
      _queueWarnDepth > 0 &&
      _pendingObservations.length >= _queueWarnDepth
    ) {
      _queueWarnFired = true;
      logger.warn(
        { queueDepth: _pendingObservations.length, warnThreshold: _queueWarnDepth },
        '[rosie-loop] Drift-bucket rehydration is slow — observation queue is backing up',
      );
    }
    return;
  }
  detector.record(obs);
}

/**
 * Test helper — current depth and high-water mark of the boot-time
 * observation queue. Used by integration tests and ops to verify that
 * the rehydration latch behaves under load.
 */
export function _driftQueueDepthForTest(): {
  current: number;
  highWaterMark: number;
  warnFired: boolean;
} {
  return {
    current: _pendingObservations.length,
    highWaterMark: _queueHighWaterMark,
    warnFired: _queueWarnFired,
  };
}

/**
 * Rehydrate the in-memory detector from `formula_drift_buckets`. Safe
 * to call multiple times — subsequent calls return the same in-flight
 * promise. Called once at `startRosieEvolutionLoop` boot, and awaited
 * before the scheduler kicks in so the first tick sees the merged
 * window.
 */
export function loadPersistedDriftBuckets(): Promise<number> {
  if (_loadPromise) return _loadPromise;
  _loadStarted = true;
  _loadPromise = (async () => {
    let loaded = 0;
    try {
      // Pull ALL rows including tombstones — we must seed the in-memory
      // revision counter from every row (tombstones too), otherwise a
      // new write could allocate a revision that's lower than the
      // tombstone's and be rejected by the setWhere guard.
      const rows = await db
        .select()
        .from(formulaDriftBucketsTable);
      for (const r of rows) {
        seedRevision(r.formulaId, r.parameter, Number(r.revision ?? 0));
      }
      // Only LIVE rows are rehydrated into the detector.
      const liveRows = rows.filter((r) => r.tombstonedAt === null);
      const states: DriftBucketState[] = liveRows.map((r) => ({
        formulaId: r.formulaId,
        parameter: r.parameter,
        oldValue: Number(r.oldValue),
        candidateValue: Number(r.candidateValue),
        fromVersion: r.fromVersion,
        thesisCitation: r.thesisCitation,
        irreversibility: Number(r.irreversibility),
        observedHistory: Array.isArray(r.observedHistory) ? r.observedHistory : [],
        baselineHistory: Array.isArray(r.baselineHistory) ? r.baselineHistory : [],
        gapHistory: Array.isArray(r.gapHistory) ? r.gapHistory : [],
        totalSamples: r.totalSamples ?? 0,
      }));
      detector.loadBuckets(states);
      loaded = states.length;
      if (loaded > 0) {
        logger.info(
          { buckets: loaded },
          '[rosie-loop] Rehydrated drift buckets from durable storage',
        );
      }
    } catch (err) {
      // A load failure must not block recording — the detector simply
      // starts from an empty state and write-throughs will repopulate
      // the table as new observations arrive.
      logger.warn({ err }, '[rosie-loop] Failed to rehydrate drift buckets (non-fatal)');
    } finally {
      // Mark ready BEFORE draining so any observation that re-enters
      // `recordOrQueue` during the drain (none expected, but defensive)
      // goes straight through.
      _loadComplete = true;
      // Replay observations that arrived during the load window — they
      // are applied on top of the rehydrated history, preserving order
      // and total-samples accounting end-to-end.
      const queued = _pendingObservations.splice(0);
      for (const obs of queued) {
        detector.record(obs);
      }
      if (queued.length > 0) {
        logger.info(
          { queued: queued.length },
          '[rosie-loop] Replayed observations buffered during rehydration',
        );
      }
    }
    return loaded;
  })();
  return _loadPromise;
}

/**
 * Test helper — resets the rehydration latch and all in-memory
 * persistence bookkeeping so each test can re-arm cleanly. Note that
 * this calls `detector.reset()`, which fires `onBucketDeleted` for each
 * live bucket and therefore enqueues tombstone writes. Tests that care
 * about durable state should `await _flushDriftPersistenceForTest()`
 * after this call.
 */
export function _resetRosieLoopForTest(): void {
  _loadStarted = false;
  _loadComplete = false;
  _loadPromise = null;
  _pendingObservations.length = 0;
  _queueHighWaterMark = 0;
  _queueWarnFired = false;
  _revisions.clear();
  detector.reset();
}

/**
 * Public entry point for callers that want to feed observations into
 * the loop. Most callers should not invoke this directly — the
 * `formulaInvocationDriftBridge` wired below into `setInvocationSink`
 * extracts observations from invocation metadata automatically.
 */
export function recordDriftObservation(obs: DriftObservation): void {
  recordOrQueue(obs);
}

/**
 * Bridge from the canonical `FormulaInvocation` event to the drift
 * detector. Invocations may carry observed-performance metadata in their
 * `meta` field; when present, they are recorded as drift samples.
 *
 * Expected shape on `inv.meta`:
 *   {
 *     observed:        number,        // measured performance
 *     baseline:        number,        // expected/target performance
 *     parameter:       string,        // formula parameter being tuned
 *     oldValue:        number,
 *     candidateValue:  number,
 *     thesisCitation:  string,
 *     irreversibility?: number,
 *   }
 */
export function formulaInvocationDriftBridge(inv: FormulaInvocation): void {
  const meta = (inv.meta ?? {}) as Record<string, unknown>;
  if (
    typeof meta.observed !== 'number' ||
    typeof meta.baseline !== 'number' ||
    typeof meta.parameter !== 'string' ||
    typeof meta.oldValue !== 'number' ||
    typeof meta.candidateValue !== 'number' ||
    typeof meta.thesisCitation !== 'string'
  ) {
    return;
  }
  recordOrQueue({
    formulaId: inv.formulaId,
    parameter: meta.parameter,
    observed: meta.observed,
    baseline: meta.baseline,
    oldValue: meta.oldValue,
    candidateValue: meta.candidateValue,
    fromVersion: inv.version,
    thesisCitation: meta.thesisCitation,
    irreversibility:
      typeof meta.irreversibility === 'number' ? meta.irreversibility : undefined,
  });
}

/**
 * In-process fetch shim — turns the `runRosieLoop` HTTP POST into a
 * direct call to `proposeTuningInProcess`, so the server does not have
 * to make a loopback request to itself (which would re-enter the auth
 * middleware stack and require CSRF).
 */
function makeInProcessFetch(): typeof fetch {
  // The signature matches `fetch` closely enough for `runRosieLoop`'s
  // usage; we only support the POST path it actually calls.
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const isProposeTuning = url.endsWith('/a11oy/formulas/propose-tuning');
    if (!isProposeTuning) {
      return new Response(
        JSON.stringify({ ok: false, error: `unsupported in-process URL: ${url}` }),
        { status: 501, headers: { 'Content-Type': 'application/json' } },
      );
    }
    let body: unknown = null;
    try {
      body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body ?? null;
    } catch {
      body = null;
    }
    const result: ProposeTuningInProcessResult = await proposeTuningInProcess(
      (body ?? {}) as Record<string, unknown>,
    );
    return new Response(JSON.stringify(result.envelope), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

export interface RosieEvolutionTickResult {
  drained: number;
  proposals: number;
  noops: number;
  results: RosieLoopResult[];
}

/**
 * Drain the drift detector and feed the resulting signals through the
 * canonical `runRosieLoop`. Safe to call from a scheduler; never throws.
 */
export async function runRosieEvolutionTick(
  options: Pick<
    RosieLoopOptions,
    'gapMin' | 'samplesMin' | 'scoreMin' | 'gapLcbMin' | 'gapLcbDelta'
  > = {},
): Promise<RosieEvolutionTickResult> {
  const signals: SentraSignalForRosie[] = detector.drainSignals();
  if (signals.length === 0) {
    return { drained: 0, proposals: 0, noops: 0, results: [] };
  }
  // Hoeffding LCB gate (Auer-Cesa-Bianchi-Fischer 2002 §2.1) — defaults
  // to 0 ("informational only") so existing deployments don't change
  // behaviour. Operators tighten via ROSIE_GAP_LCB_MIN env (typical
  // target: same value as gapMin, e.g. 0.10).
  const envLcb = Number(process.env.ROSIE_GAP_LCB_MIN);
  const results = await runRosieLoop(signals, {
    apiBase: '/api',
    fetchImpl: makeInProcessFetch(),
    gapLcbMin: Number.isFinite(envLcb) ? envLcb : 0,
    ...options,
  });
  let proposals = 0;
  let noops = 0;
  for (const r of results) {
    if (r.decision.kind === 'tuning') proposals += 1;
    else noops += 1;
  }
  return { drained: signals.length, proposals, noops, results };
}

let _timer: ReturnType<typeof setInterval> | null = null;

/**
 * Boot-time scheduler. Reads `ROSIE_LOOP_INTERVAL_MINUTES` (default 15,
 * minimum 1) and kicks off a recurring tick. Idempotent — calling twice
 * is a no-op.
 */
export function startRosieEvolutionLoop(): void {
  if (_timer) return;
  const intervalMinutes = Math.max(
    1,
    parseInt(process.env.ROSIE_LOOP_INTERVAL_MINUTES ?? '15', 10) || 15,
  );
  const intervalMs = intervalMinutes * 60 * 1000;
  logger.info(
    { intervalMinutes },
    '[rosie-loop] Scheduling automatic ROSIE evolution loop',
  );

  // Begin rehydrating persisted drift buckets immediately. Observations
  // that arrive during the load are queued by `recordOrQueue` and
  // replayed once the load resolves, so no samples are lost in the
  // window between server-up and detector-ready.
  //
  // We intentionally do NOT await here: this function is called from
  // the synchronous boot path, and the scheduler tick interval is
  // measured in minutes (default 15), so even a slow DB will finish
  // long before the first tick — and the queue guarantees correctness
  // for any observations that race the load.
  loadPersistedDriftBuckets().catch((err) => {
    logger.warn({ err }, '[rosie-loop] Unexpected error during bucket rehydration');
  });

  const tick = () => {
    runRosieEvolutionTick()
      .then((summary) => {
        if (summary.drained > 0) {
          logger.info(
            {
              drained: summary.drained,
              proposals: summary.proposals,
              noops: summary.noops,
            },
            '[rosie-loop] Tick complete',
          );
        }
      })
      .catch((err) => {
        logger.warn({ err }, '[rosie-loop] Tick failed (non-fatal)');
      });
  };
  _timer = setInterval(tick, intervalMs);
  _timer.unref?.();
}

export function stopRosieEvolutionLoop(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}

/** Test helper — exposes the shared detector for direct seeding. */
export function _rosieEvolutionDetectorForTest() {
  return detector;
}
