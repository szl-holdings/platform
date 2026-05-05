/**
 * Sentra brain — ROSIE continuous-evolution loop.
 *
 * Wires the canonical `evaluateObservedEvent` primitive from
 * `@szl-holdings/formulas` into Sentra's signal stream. When ROSIE
 * decides a tuning is warranted, this module pushes the proposal to
 * the A11oy governance queue via the `/a11oy/formulas/propose-tuning`
 * endpoint.
 *
 * The loop is **bounded autonomy** — proposals never apply without an
 * operator decision (see docs/A11OY_NON_NEGOTIABLES.md).
 *
 * Source: docs/thesis/v10-canonical.md §6.1, docs/audits/formulas.md §7.
 */

import {
  evaluateObservedEvent,
  type ObservedEvent,
  type RosieDecision,
} from '@szl-holdings/formulas';

export interface SentraSignalForRosie {
  formulaId: string;
  parameter: string;
  observedGap: number;
  samples: number;
  oldValue: number;
  candidateValue: number;
  fromVersion: string;
  thesisCitation: string;
  driftSamples?: { current: readonly number[]; candidate: readonly number[] };
  irreversibility?: number;
}

export interface RosieLoopOptions {
  /** Endpoint base — defaults to the api-server tenant prefix. */
  apiBase?: string;
  /** Override for fetch (testing). */
  fetchImpl?: typeof fetch;
  /** ROSIE thresholds. */
  gapMin?: number;
  samplesMin?: number;
  scoreMin?: number;
}

/**
 * Process a single Sentra signal through the ROSIE loop.
 * Returns the decision (noop / tuning) and, when a tuning is proposed,
 * the JSON returned by the api-server.
 */
export async function processSignal(
  signal: SentraSignalForRosie,
  options: RosieLoopOptions = {},
): Promise<{ decision: RosieDecision; submitted?: unknown }> {
  const event: ObservedEvent = {
    formulaId: signal.formulaId,
    fromVersion: signal.fromVersion,
    parameter: signal.parameter,
    oldValue: signal.oldValue,
    candidateValue: signal.candidateValue,
    observedGap: signal.observedGap,
    samples: signal.samples,
    driftSamples: signal.driftSamples,
    irreversibility: signal.irreversibility,
    thesisCitation: signal.thesisCitation,
  };
  const decision = evaluateObservedEvent(event, {
    gapMin: options.gapMin,
    samplesMin: options.samplesMin,
    scoreMin: options.scoreMin,
  });
  if (decision.kind === 'noop') return { decision };

  const base = options.apiBase ?? '/api';
  const fetcher = options.fetchImpl ?? fetch;
  try {
    const r = await fetcher(`${base}/a11oy/formulas/propose-tuning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formulaId: event.formulaId,
        fromVersion: event.fromVersion,
        parameter: event.parameter,
        oldValue: event.oldValue,
        candidateValue: event.candidateValue,
        observedGap: event.observedGap,
        samples: event.samples,
        thesisCitation: event.thesisCitation,
        driftSamples: event.driftSamples,
        irreversibility: event.irreversibility,
      }),
    });
    const submitted = await r.json().catch(() => null);
    return { decision, submitted };
  } catch (e) {
    // Never let the loop crash the brain — surface the decision and let the
    // caller decide what to do with the failed submission.
    return { decision, submitted: { ok: false, error: String(e) } };
  }
}

/**
 * Process a batch of signals. Returns the per-signal decisions in order.
 */
export async function runRosieLoop(
  signals: readonly SentraSignalForRosie[],
  options: RosieLoopOptions = {},
): Promise<Array<{ decision: RosieDecision; submitted?: unknown }>> {
  const results: Array<{ decision: RosieDecision; submitted?: unknown }> = [];
  for (const s of signals) {
    // Sequential to avoid hammering the proposals endpoint.
    // eslint-disable-next-line no-await-in-loop
    results.push(await processSignal(s, options));
  }
  return results;
}
