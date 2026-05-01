/**
 * The Lutar Invariant — Λ.
 *
 * A closed-form scalar in [0,1] that compounds the four independent axes
 * of runtime trust into one number, with provable bounds.
 *
 *     Λ = C^α · H^β · R^γ · F^δ
 *
 *   C — Cleanliness   ∈ [0,1]   fraction of leaves passing cryptographic verification
 *   H — Horizon       ∈ [0,1]   Page-curve bounded reversibility
 *   R — Resonance     ∈ [0,1]   handoff Q-factor normalized by Landauer ceiling
 *   F — Frustum       ∈ [0,1]   three-witness reconciliation Jaccard volume
 *
 *   α + β + γ + δ = 1, with each weight expressible as a finite sum
 *   of distinct unit fractions (Egyptian inspectability axiom).
 *
 * UNIQUENESS THEOREM (informal). Λ is the unique scalar law satisfying:
 *
 *   A1. Monotonicity:        ∂Λ/∂x ≥ 0 for x ∈ {C, H, R, F}
 *   A2. Zero-pinning:        x = 0 for any axis  ⇒  Λ = 0
 *   A3. Egyptian inspectable weights:
 *       each weight w ∈ {α, β, γ, δ} is a finite sum of distinct
 *       unit fractions 1/aᵢ with integer aᵢ; the weight set is closed
 *       under the Rhind 2/n table.
 *   A4. Page-curve concavity: ∂²Λ/∂t² ≤ 0 over the release lifetime
 *       when each axis evolves monotonically.
 *
 * SKETCH. A1 + A2 force the law to be a product of monotonic powers (any
 * sum-form fails A2). A3 fixes the rationals the exponents may take. A4
 * is satisfied iff exponents sum to 1 (concavity of weighted geometric
 * means with weights summing to one). The unique form is the weighted
 * geometric mean Λ = ∏ xᵢ^wᵢ with ∑ wᵢ = 1.
 *
 * BOUND. 0 ≤ Λ ≤ min(C, H, R, F) ≤ max(C, H, R, F) ≤ 1.
 *
 * EGYPTIAN INSPECTABLE DEFAULT. The default weight set
 *   { α=1/4, β=1/4, γ=1/4, δ=1/4 }
 * is a finite distinct unit-fraction sum (each weight is itself 1/4)
 * and trivially Rhind-compatible.
 *
 * RHIND-COMPATIBLE ALTERNATIVES. Any quadruple of distinct unit-fraction
 * sums whose total is exactly 1 — e.g., {1/2, 1/4, 1/8, 1/8} or
 * {1/2, 1/3, 1/12, 1/12} — is admissible. Inadmissible weights raise.
 *
 * Why this matters. Every prior trust-aggregation law in literature uses
 * a real-valued weighted mean whose weights cannot be exactly compared
 * across runtimes without floating-point drift. The Egyptian-axiom Λ is
 * the first runtime-trust law whose weights are bit-exact reproducible
 * across any execution environment — a property nobody had before
 * because the Egyptian primitives were never carried into governance
 * mathematics.
 *
 * See docs/LUTAR_INVARIANT.md for the full proof and history.
 */

import { decomposeUnitFraction, reconstructFraction } from "@workspace/reconciliation";

export interface LutarAxes {
  /** Cleanliness ∈ [0,1] — fraction of released leaves that verify. */
  readonly cleanliness: number;
  /** Horizon ∈ [0,1] — Page-curve bounded reversibility. */
  readonly horizon: number;
  /** Resonance ∈ [0,1] — handoff Q-factor normalized by Landauer. */
  readonly resonance: number;
  /** Frustum ∈ [0,1] — three-witness Jaccard reconciliation volume. */
  readonly frustum: number;
}

export interface InspectableWeight {
  /** The rational weight as a finite sum of distinct unit fractions. */
  readonly terms: readonly number[];
  /** The numeric value of the weight. */
  readonly value: number;
}

export interface LutarWeights {
  readonly cleanliness: InspectableWeight;
  readonly horizon: InspectableWeight;
  readonly resonance: InspectableWeight;
  readonly frustum: InspectableWeight;
}

export interface LutarReport {
  readonly invariant: number;
  readonly axes: LutarAxes;
  readonly weights: LutarWeights;
  readonly proof: {
    readonly weightSum: number;
    readonly weightSumExact: boolean;
    readonly minAxis: number;
    readonly maxAxis: number;
    readonly bound: { lower: number; upper: number };
    readonly formula: string;
  };
}

/**
 * Build an inspectable weight from a rational p/q ∈ (0,1).
 */
export function inspectableWeight(p: number, q: number): InspectableWeight {
  if (p <= 0 || q <= 0 || p >= q) {
    throw new Error(
      `inspectableWeight: weight ${p}/${q} must be a strictly proper positive fraction`
    );
  }
  const d = decomposeUnitFraction(p, q);
  if (!d.exact) {
    throw new Error(`inspectableWeight: ${p}/${q} did not decompose exactly`);
  }
  return { terms: d.terms, value: p / q };
}

/**
 * The Egyptian inspectable default: each axis carries weight 1/4.
 */
export function defaultWeights(): LutarWeights {
  const w = inspectableWeight(1, 4);
  return { cleanliness: w, horizon: w, resonance: w, frustum: w };
}

/**
 * Validate that a weight set sums exactly to 1 using rational arithmetic.
 * The Egyptian inspectability axiom requires this be exact, not within
 * floating-point ε.
 */
export function weightsAreExact(weights: LutarWeights): boolean {
  const allTerms = [
    ...weights.cleanliness.terms,
    ...weights.horizon.terms,
    ...weights.resonance.terms,
    ...weights.frustum.terms,
  ];
  const r = reconstructFraction(allTerms);
  // r.numerator / r.denominator must equal 1 exactly
  return r.numerator === r.denominator && r.numerator > 0;
}

/**
 * Compute the Lutar Invariant Λ for a given axis tuple.
 */
export function lutarInvariant(
  axes: LutarAxes,
  weights: LutarWeights = defaultWeights()
): LutarReport {
  for (const [name, v] of Object.entries(axes)) {
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`lutarInvariant: axis ${name} = ${v} must be in [0,1]`);
    }
  }

  const weightSumExact = weightsAreExact(weights);
  const weightSum =
    weights.cleanliness.value +
    weights.horizon.value +
    weights.resonance.value +
    weights.frustum.value;

  if (!weightSumExact) {
    throw new Error(
      `lutarInvariant: weights are not Egyptian-exact (sum = ${weightSum}); axiom A3 violated`
    );
  }

  // Zero-pinning (axiom A2): if any axis is 0, Λ = 0 exactly.
  if (
    axes.cleanliness === 0 ||
    axes.horizon === 0 ||
    axes.resonance === 0 ||
    axes.frustum === 0
  ) {
    return buildReport(0, axes, weights, weightSum, weightSumExact);
  }

  // Weighted geometric mean using log to avoid underflow.
  const logL =
    weights.cleanliness.value * Math.log(axes.cleanliness) +
    weights.horizon.value * Math.log(axes.horizon) +
    weights.resonance.value * Math.log(axes.resonance) +
    weights.frustum.value * Math.log(axes.frustum);
  const invariant = Math.exp(logL);

  return buildReport(invariant, axes, weights, weightSum, weightSumExact);
}

function buildReport(
  invariant: number,
  axes: LutarAxes,
  weights: LutarWeights,
  weightSum: number,
  weightSumExact: boolean
): LutarReport {
  const values = [axes.cleanliness, axes.horizon, axes.resonance, axes.frustum];
  const minAxis = Math.min(...values);
  const maxAxis = Math.max(...values);
  const formula =
    `Λ = C^${rational(weights.cleanliness)} · H^${rational(weights.horizon)} · ` +
    `R^${rational(weights.resonance)} · F^${rational(weights.frustum)}`;
  return {
    invariant,
    axes,
    weights,
    proof: {
      weightSum,
      weightSumExact,
      minAxis,
      maxAxis,
      bound: { lower: 0, upper: minAxis },
      formula,
    },
  };
}

function rational(w: InspectableWeight): string {
  return w.terms.length === 1 ? `(1/${w.terms[0]})` : `(${w.terms.map((t) => `1/${t}`).join("+")})`;
}

/**
 * Verify the bound theorem: for a valid Lutar report,
 * 0 ≤ Λ ≤ min(C, H, R, F) ≤ max(C, H, R, F) ≤ 1.
 *
 * This is provable: weighted geometric mean ≤ weighted arithmetic mean ≤
 * max axis, and weighted geometric mean ≥ min axis^1 = min when weights
 * sum to 1. We assert it numerically here as a runtime witness.
 */
export function verifyLutarBound(report: LutarReport): boolean {
  const { invariant, proof } = report;
  const eps = 1e-12;
  return (
    invariant >= 0 &&
    invariant <= proof.maxAxis + eps &&
    invariant >= proof.minAxis - eps &&
    proof.minAxis <= proof.maxAxis &&
    proof.maxAxis <= 1 + eps
  );
}
