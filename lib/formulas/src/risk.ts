/**
 * Risk scoring & drift detection.
 * Source: docs/thesis/v10-canonical.md §5.2, §5.4.
 */

/**
 * Severity-weighted risk score.
 * Inputs are clipped to non-negative; output is bounded by `cap`.
 */
export function riskScore(
  severity: number,
  likelihood: number,
  valueAtRisk: number,
  cap = 1_000_000,
): number {
  const s = Math.max(0, Math.min(1, severity));
  const l = Math.max(0, Math.min(1, likelihood));
  const v = Math.max(0, valueAtRisk);
  return Math.min(s * l * v, cap);
}

/**
 * KL-divergence approximation between two same-length empirical distributions.
 * Both inputs are normalised to sum to 1 before comparison.
 */
export function driftScore(p: readonly number[], q: readonly number[], epsilon = 1e-9): number {
  if (p.length === 0 || p.length !== q.length) return 0;
  const sp = p.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  const sq = q.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  let kl = 0;
  for (let i = 0; i < p.length; i++) {
    const pi = Math.max(p[i], 0) / sp + epsilon;
    const qi = Math.max(q[i], 0) / sq + epsilon;
    kl += pi * Math.log(pi / qi);
  }
  return Math.max(0, kl);
}
