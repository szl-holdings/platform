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
