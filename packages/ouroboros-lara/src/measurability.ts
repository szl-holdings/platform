/**
 * Primitive 35 — Measurability assertion.
 *
 * Source: Jamneshan, Shalom, Tao, Math. Ann. 394:11 (2026), Conjecture 1.3.
 *
 * A polynomial structure detected at the U^{k+1} level is "measurable" iff,
 * with random shifts ⃗h drawn from G^M, there exists a Lipschitz function F
 * (constant ≤ M) of (f(x + a · ⃗h))_a such that the L^∞ deviation from e(P(x))
 * is bounded by ε(m), with probability ≥ 1/2.
 *
 * The runtime cannot actually run this in full; what we encode is the
 * *bookkeeping*: each candidate reconstruction reports its (m, M, ε(m), trials,
 * deviation samples). The verdict is honest about the gap.
 */

export type MeasurabilityVerdict = "MEASURABLE" | "NON_MEASURABLE" | "UNDETERMINED";

export interface ReconstructionTrial {
  m: number; // 1 ≤ m ≤ M
  M: number; // shift budget
  epsilonAtM: number; // ε(m) target
  observedDeviation: number; // sup |E_x e(P(x)) − F(...)|
  correlation: number; // |E_x f(x) e(−P(x))|
  succeeded: boolean; // observedDeviation ≤ epsilonAtM AND correlation ≥ 1/m
}

export interface MeasurabilityInput {
  candidatePolynomialId: string;
  trials: ReconstructionTrial[];
  /** Required success probability across trials. Default 0.5 (paper). */
  requiredSuccessRate?: number;
  /** Minimum trial count before a NON_MEASURABLE verdict can be issued. Default 8. */
  minTrials?: number;
}

export interface MeasurabilityResult {
  candidatePolynomialId: string;
  verdict: MeasurabilityVerdict;
  successRate: number;
  trialCount: number;
  reason: string;
}

export function assessMeasurability(input: MeasurabilityInput): MeasurabilityResult {
  const requiredRate = input.requiredSuccessRate ?? 0.5;
  const minTrials = input.minTrials ?? 8;
  const trials = input.trials;
  if (trials.length === 0) {
    return {
      candidatePolynomialId: input.candidatePolynomialId,
      verdict: "UNDETERMINED",
      successRate: 0,
      trialCount: 0,
      reason: "No trials submitted.",
    };
  }
  const successes = trials.filter((t) => t.succeeded).length;
  const rate = successes / trials.length;

  if (rate >= requiredRate) {
    return {
      candidatePolynomialId: input.candidatePolynomialId,
      verdict: "MEASURABLE",
      successRate: rate,
      trialCount: trials.length,
      reason: `Success rate ${(rate * 100).toFixed(1)}% ≥ ${(requiredRate * 100).toFixed(0)}% (Conjecture 1.3 satisfied).`,
    };
  }
  if (trials.length < minTrials) {
    return {
      candidatePolynomialId: input.candidatePolynomialId,
      verdict: "UNDETERMINED",
      successRate: rate,
      trialCount: trials.length,
      reason: `Trial count ${trials.length} < min ${minTrials}; insufficient to declare non-measurable.`,
    };
  }
  return {
    candidatePolynomialId: input.candidatePolynomialId,
    verdict: "NON_MEASURABLE",
    successRate: rate,
    trialCount: trials.length,
    reason: `Success rate ${(rate * 100).toFixed(1)}% < ${(requiredRate * 100).toFixed(0)}% across ${trials.length} trials; reconstruction not Lipschitz-recoverable from bounded shifts.`,
  };
}
