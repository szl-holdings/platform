/**
 * Regular-perturbation forecast shim.
 *
 * Formal counterpart: `packages/lean-formulas/Forecast/Perturbation.lean`,
 * axiom `residual_bound` (Fleming–McGwier, 1983).
 *
 * Computes the first-order linearisation of a `C²` forecast functional and
 * exposes the residual whose `O(ε²)` bound is the formal post-condition the
 * property test exercises with 1k random samples.
 */

export type ScalarField = (x: number) => number;

/** First-order expansion `Φ(x) + ε · Φ'(x) · δ`. */
export function firstOrderForecast(
  Phi: ScalarField,
  PhiPrime: ScalarField,
  x: number,
  delta: number,
  eps: number,
): number {
  return Phi(x) + eps * PhiPrime(x) * delta;
}

/** Fleming–McGwier residual `Φ(x + ε δ) − Φ(x) − ε · Φ'(x) · δ`. */
export function perturbationResidual(
  Phi: ScalarField,
  PhiPrime: ScalarField,
  x: number,
  delta: number,
  eps: number,
): number {
  return Phi(x + eps * delta) - Phi(x) - eps * PhiPrime(x) * delta;
}

/** Theoretical upper bound `(M / 2) · (ε δ)²` from the Lean axiom. */
export function residualUpperBound(M: number, eps: number, delta: number): number {
  const t = eps * delta;
  return (M / 2) * t * t;
}
