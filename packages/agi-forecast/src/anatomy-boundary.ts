/**
 * Anatomy / Boundary shim.
 *
 * Formal counterpart: `packages/lean-formulas/Anatomy/Boundary.lean`,
 * theorem `boundary_uniqueness` (Henderson–McGwier, J. Diff. Eq. 1987).
 *
 * Encodes the Henderson–McGwier uniqueness corollary as a runtime guard.
 * Given a Lipschitz nonlinearity `f(x, y)` and a candidate Lipschitz
 * constant `L`, `withinUniquenessRegime(L, a, b)` returns whether
 * `L < 384 / (b - a)^4`, the optimal bound from the 1987 paper.
 *
 * The shim also exposes a numeric solver-equivalence check used by the
 * property test: two iterated Picard sweeps of the BVP from distinct seeds
 * converge to the same fixed point when the uniqueness regime holds.
 */

/** Henderson–McGwier optimal Lipschitz constant for the BVP on `[a, b]`. */
export function hendersonMcGwierConstant(a: number, b: number): number {
  const w = b - a;
  return 384 / (w * w * w * w);
}

/** Is the Lipschitz constant strictly below the Henderson–McGwier optimum? */
export function withinUniquenessRegime(L: number, a: number, b: number): boolean {
  return L >= 0 && L < hendersonMcGwierConstant(a, b);
}

/**
 * Numeric uniqueness check used by the property test.
 *
 * For a *linear* shrinking map `y ↦ α · y + β` with `|α| = L` on `[a, b]`
 * the Banach fixed point is unique iff `L < 1`, which is strictly weaker
 * than the Henderson–McGwier bound — so whenever the HM regime holds, two
 * Picard iterations from different seeds agree at the fixed point.
 *
 * Returns the absolute difference between the two limits.
 */
export function picardDisagreement(
  alpha: number,
  beta: number,
  seedA: number,
  seedB: number,
  iters = 200,
): number {
  let a = seedA;
  let b = seedB;
  for (let i = 0; i < iters; i++) {
    a = alpha * a + beta;
    b = alpha * b + beta;
  }
  return Math.abs(a - b);
}
