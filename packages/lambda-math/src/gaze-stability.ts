/**
 * Gaze-stability formula — bounded, monotone-non-decreasing aggregate
 * over a sliding window of binary liveness criteria.
 *
 *   GazeStability({c_i}) = (1/N) · Σ 𝟙{c_i satisfied}
 *
 * Equivalent to the `livenessConfidence` computed by
 * `@szl-holdings/perception-loop`'s state machine. Lives here so the
 * receipt-side check ("liveness can only rise when a criterion is
 * added") has one canonical formula to test against.
 *
 * Source: docs/research/perception-bio-synthesis-2026.md §1.
 */

export interface GazeStabilityInput {
  readonly criteriaSatisfied: number;
  readonly criteriaTotal: number;
}

export function gazeStability(input: GazeStabilityInput): number {
  const { criteriaSatisfied: k, criteriaTotal: n } = input;
  if (!Number.isInteger(k) || !Number.isInteger(n) || n <= 0 || k < 0 || k > n) {
    throw new Error(`gazeStability: invalid k=${k} n=${n}`);
  }
  return k / n;
}
