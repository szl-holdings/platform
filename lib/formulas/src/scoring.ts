/**
 * Generic [0,1] scorers used across Sentra, Counsel, Terra.
 *
 * Source: docs/thesis/v10-canonical.md §2.6, §5.2.
 */

/** Proof-closure: fraction of evidence dimensions present. */
export function proofClosureScore(presentDims: number, totalDims: number): number {
  if (totalDims <= 0) return 0;
  const r = presentDims / totalDims;
  if (!Number.isFinite(r)) return 0;
  return Math.max(0, Math.min(1, r));
}

/** Saturating sigmoid scorer, useful for collapsing unbounded inputs to [0,1]. */
export function saturate(x: number, knee = 1): number {
  if (!Number.isFinite(x)) return 0;
  return x / (Math.abs(x) + Math.max(knee, 1e-9));
}

/** Min-max normalisation to [0,1]; returns 0.5 for a degenerate range. */
export function normaliseToUnit(x: number, lo: number, hi: number): number {
  if (!(hi > lo)) return 0.5;
  const v = (x - lo) / (hi - lo);
  return Math.max(0, Math.min(1, v));
}
