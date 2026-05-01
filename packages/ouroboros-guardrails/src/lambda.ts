/**
 * Closed-form Λ scoring for guardrail rails.
 *
 * Λ is the geometric mean of per-axis scores in [0,1]. Geometric mean
 * is the right aggregator: a single zero-axis collapses Λ to zero,
 * matching the design intent that any hard veto blocks the action.
 *
 * Egyptian unit-fraction representation: if any axis is 0, return 0.
 * Otherwise return exp(mean(log(axis_i))) over the n axes.
 *
 * No learning. No regression. No drift. Same input → same Λ forever.
 */

export function lambdaScore(axes: Record<string, number>): number {
  const values = Object.values(axes);
  if (values.length === 0) return 1;
  for (const v of values) {
    if (!Number.isFinite(v)) return 0;
    if (v <= 0) return 0;
    if (v > 1) {
      // Defensive: clamp pathological inputs but log via NaN-safe path.
      // We treat >1 as "1" — overconfidence is not rewarded.
    }
  }
  const clamped = values.map((v) => Math.min(1, Math.max(0, v)));
  const logSum = clamped.reduce((acc, v) => acc + Math.log(v), 0);
  return Math.exp(logSum / clamped.length);
}

/** Combine multiple rail-level Λ values into a single composite. */
export function compositeLambda(rails: { lambda: number }[]): number {
  if (rails.length === 0) return 1;
  return lambdaScore(
    Object.fromEntries(rails.map((r, i) => [`rail_${i}`, r.lambda])),
  );
}

/**
 * Verdict from Λ scalar. Three thresholds:
 *   Λ ≥ 0.85 → PROCEED
 *   0.5 ≤ Λ < 0.85 → QUARANTINE
 *   Λ < 0.5 → ABORT
 *
 * These thresholds are deliberately conservative and configurable
 * per-tenant. They are NOT tuned through learning.
 */
export function lambdaVerdict(
  lambda: number,
  thresholds: { proceed: number; quarantine: number } = {
    proceed: 0.85,
    quarantine: 0.5,
  },
): "PROCEED" | "QUARANTINE" | "ABORT" {
  if (lambda >= thresholds.proceed) return "PROCEED";
  if (lambda >= thresholds.quarantine) return "QUARANTINE";
  return "ABORT";
}
