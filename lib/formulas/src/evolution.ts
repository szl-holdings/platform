/**
 * The ROSIE continuous-evolution primitive.
 *
 * Source: docs/thesis/v10-canonical.md §6.1.
 *
 * Inputs:
 *   gap            — observed performance shortfall in [0, 1]
 *   samples        — number of supporting observations (≥ 0)
 *   drift          — KL drift between current and proposed parameters (≥ 0)
 *   irreversibility — irreversibility penalty in [0, 1]
 *
 * Output: a single ranking scalar; higher = more evidence-rich proposal.
 */

export interface RosieProposalInput {
  gap: number;
  samples: number;
  drift: number;
  irreversibility: number;
  weights?: {
    wGap?: number;
    wSamples?: number;
    wDrift?: number;
    wIrr?: number;
  };
}

export function rosieProposalScore(input: RosieProposalInput): number {
  const wGap = input.weights?.wGap ?? 0.5;
  const wSamples = input.weights?.wSamples ?? 0.2;
  const wDrift = input.weights?.wDrift ?? 0.2;
  const wIrr = input.weights?.wIrr ?? 0.1;
  const gap = Math.max(0, Math.min(1, input.gap));
  const samples = Math.max(0, input.samples);
  const drift = Math.max(0, input.drift);
  const irr = Math.max(0, Math.min(1, input.irreversibility));
  return wGap * gap + wSamples * Math.log1p(samples) + wDrift * drift - wIrr * irr;
}

/**
 * The full observe → score → propose loop. This is the primitive ROSIE
 * uses inside Sentra's brain. It returns either:
 *   - { kind: 'noop' }                         — nothing to do
 *   - { kind: 'tuning', proposal: TuningProposal }
 */
export interface TuningProposal {
  formulaId: string;
  fromVersion: string;
  parameter: string;
  oldValue: number;
  newValue: number;
  evidence: {
    samples: number;
    gap: number;
    drift: number;
    thesisCitation: string;
  };
  score: number;
  rationale: string;
}

export interface ObservedEvent {
  formulaId: string;
  fromVersion: string;
  parameter: string;
  oldValue: number;
  candidateValue: number;
  observedGap: number;
  samples: number;
  driftSamples?: { current: readonly number[]; candidate: readonly number[] };
  irreversibility?: number;
  thesisCitation: string;
}

export type RosieDecision =
  | { kind: 'noop'; reason: string }
  | { kind: 'tuning'; proposal: TuningProposal };

import { driftScore } from './risk.js';

/**
 * Pure decision function — given an observed event, decide whether to
 * propose a tuning. Calls callers feed events from Sentra to this and
 * push the resulting proposal into the A11oy governance queue.
 */
export function evaluateObservedEvent(
  event: ObservedEvent,
  config: { gapMin?: number; samplesMin?: number; scoreMin?: number } = {},
): RosieDecision {
  const gapMin = config.gapMin ?? 0.1;
  const samplesMin = config.samplesMin ?? 25;
  const scoreMin = config.scoreMin ?? 0.5;

  if (event.observedGap < gapMin) {
    return { kind: 'noop', reason: `gap ${event.observedGap.toFixed(3)} below ${gapMin}` };
  }
  if (event.samples < samplesMin) {
    return { kind: 'noop', reason: `samples ${event.samples} below ${samplesMin}` };
  }

  const drift = event.driftSamples
    ? driftScore(event.driftSamples.current, event.driftSamples.candidate)
    : 0;

  const score = rosieProposalScore({
    gap: event.observedGap,
    samples: event.samples,
    drift,
    irreversibility: event.irreversibility ?? 0,
  });

  if (score < scoreMin) {
    return { kind: 'noop', reason: `score ${score.toFixed(3)} below ${scoreMin}` };
  }

  const proposal: TuningProposal = {
    formulaId: event.formulaId,
    fromVersion: event.fromVersion,
    parameter: event.parameter,
    oldValue: event.oldValue,
    newValue: event.candidateValue,
    evidence: {
      samples: event.samples,
      gap: event.observedGap,
      drift,
      thesisCitation: event.thesisCitation,
    },
    score,
    rationale:
      `Observed gap of ${(event.observedGap * 100).toFixed(1)}% over ${event.samples} samples ` +
      `with drift ${drift.toFixed(3)} suggests retuning ${event.parameter} ` +
      `from ${event.oldValue} to ${event.candidateValue} (cited from ${event.thesisCitation}).`,
  };
  return { kind: 'tuning', proposal };
}

// ─── ROSIE evolution loop (signal → proposal) ────────────────────────
//
// These helpers are the bridge between Sentra's drift detector and the
// A11oy `/formulas/propose-tuning` queue. They live in the canonical
// formulas package so any artifact (sentra brain, api-server scheduled
// job, future workers) can drive the loop with one shared implementation.
//
// Source: docs/thesis/v10-canonical.md §6.1, docs/audits/formulas.md §7.

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
  /** Override for fetch (testing / in-process invocation). */
  fetchImpl?: typeof fetch;
  /** ROSIE thresholds — forwarded to `evaluateObservedEvent`. */
  gapMin?: number;
  samplesMin?: number;
  scoreMin?: number;
}

export interface RosieLoopResult {
  decision: RosieDecision;
  submitted?: unknown;
}

/**
 * Process a single Sentra signal through the ROSIE loop. The loop is
 * **bounded autonomy** — proposals never apply without an operator
 * decision (see docs/A11OY_NON_NEGOTIABLES.md).
 */
export async function processSignal(
  signal: SentraSignalForRosie,
  options: RosieLoopOptions = {},
): Promise<RosieLoopResult> {
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
  const fetcher = options.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : undefined);
  if (!fetcher) {
    return { decision, submitted: { ok: false, error: 'no fetch implementation available' } };
  }
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
    // Never let the loop crash the brain — surface the decision and let
    // the caller decide what to do with the failed submission.
    return { decision, submitted: { ok: false, error: String(e) } };
  }
}

/**
 * Process a batch of signals. Sequential to avoid hammering the
 * proposals endpoint. Returns per-signal decisions in input order.
 */
export async function runRosieLoop(
  signals: readonly SentraSignalForRosie[],
  options: RosieLoopOptions = {},
): Promise<RosieLoopResult[]> {
  const results: RosieLoopResult[] = [];
  for (const s of signals) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await processSignal(s, options));
  }
  return results;
}
