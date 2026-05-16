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
  type DriftObservation,
  type RosieLoopOptions,
  type RosieLoopResult,
  type SentraSignalForRosie,
  type FormulaInvocation,
} from '@szl-holdings/formulas';
import { logger } from '../lib/logger.js';
import {
  proposeTuningInProcess,
  type ProposeTuningInProcessResult,
} from '../routes/a11oy-formulas-api.js';

// Module-level detector — shared across invocation observers and the
// scheduled tick so observations recorded between ticks accumulate
// safely.
const detector = createDriftDetector();

/**
 * Public entry point for callers that want to feed observations into
 * the loop. Most callers should not invoke this directly — the
 * `formulaInvocationDriftBridge` wired below into `setInvocationSink`
 * extracts observations from invocation metadata automatically.
 */
export function recordDriftObservation(obs: DriftObservation): void {
  detector.record(obs);
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
  detector.record({
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
    const result: ProposeTuningInProcessResult = proposeTuningInProcess(
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
  options: Pick<RosieLoopOptions, 'gapMin' | 'samplesMin' | 'scoreMin'> = {},
): Promise<RosieEvolutionTickResult> {
  const signals: SentraSignalForRosie[] = detector.drainSignals();
  if (signals.length === 0) {
    return { drained: 0, proposals: 0, noops: 0, results: [] };
  }
  const results = await runRosieLoop(signals, {
    apiBase: '/api',
    fetchImpl: makeInProcessFetch(),
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
