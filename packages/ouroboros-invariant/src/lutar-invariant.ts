/**
 * The Lutar runtime invariant — Λ.
 *
 * A weighted geometric mean of normalized runtime axes:
 *
 *     Λ = C^α · H^β · R^γ · F^δ, with α + β + γ + δ = 1.
 *
 * C is cleanliness, H is horizon, R is resonance and F is frustum.
 * Positive weights are represented by unit-fraction terms for inspection.
 * The five-axis extension also includes Gauß closure.
 *
 * For valid positive weights summing to one:
 *
 *     0 ≤ min(axes) ≤ Λ ≤ max(axes) ≤ 1.
 *
 * This implementation is a numerical witness, not a uniqueness proof.
 * Λ-uniqueness remains Conjecture 1. The historical runtime A1–A4 labels
 * are not the current Lean A1–A5 definitions. Conditional identifiability
 * results and their assumptions belong to the canonical lutar-lean source:
 *
 * https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Uniqueness.lean
 * https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Axioms.lean
 *
 * Exact reconstruction of the supplied rational terms witnesses their sum;
 * exponentiation and the reported invariant use JavaScript floating point.
 * These reports do not establish physical measurements or production trust.
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

/** Check that the executed numeric exponent matches its inspectable terms. */
function weightMatchesTerms(weight: InspectableWeight): boolean {
  if (
    !Number.isFinite(weight.value) ||
    weight.value <= 0 ||
    weight.value >= 1 ||
    weight.terms.length === 0 ||
    new Set(weight.terms).size !== weight.terms.length ||
    weight.terms.some((term) => !Number.isSafeInteger(term) || term <= 0)
  ) {
    return false;
  }
  try {
    const fraction = reconstructFraction(weight.terms);
    return weight.value === fraction.numerator / fraction.denominator;
  } catch {
    return false;
  }
}

export function weightsAreExact(weights: LutarWeights): boolean {
  if (![weights.cleanliness, weights.horizon, weights.resonance, weights.frustum].every(weightMatchesTerms)) {
    return false;
  }
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
      `lutarInvariant: weights are not Egyptian-exact (sum = ${weightSum}); weight-sum constraint violated`
    );
  }

  // Zero-pinning with positive weights: if any axis is 0, Λ = 0 exactly.
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
      bound: { lower: minAxis, upper: maxAxis },
      formula,
    },
  };
}

function rational(w: InspectableWeight): string {
  return w.terms.length === 1 ? `(1/${w.terms[0]})` : `(${w.terms.map((t) => `1/${t}`).join("+")})`;
}

/**
 * Verify the bound theorem: for a valid Lutar report,
 * 0 ≤ min(C, H, R, F) ≤ Λ ≤ max(C, H, R, F) ≤ 1.
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

// =============================================================================
// LUTAR INVARIANT Λ₅ — 5-axis extension with Gauß closure
// =============================================================================
//
//     Λ₅ = C^α · H^β · R^γ · F^δ · G^ε
//
// where the fifth axis G — Gauß closure ∈ [0,1] — measures the satisfaction
// of the divergence-free closure condition over the receipt graph.
//
// Same weighted-mean bounds apply; default weight set is 1/5 each.
// This extension does not promote Λ-uniqueness beyond Conjecture 1.
// A 5-tuple of inspectable unit-fraction sums totalling 1 is admissible.
//
// =============================================================================

export interface LutarAxes5 extends LutarAxes {
  /** Gauß closure ∈ [0,1] — divergence-free closure on receipt graph. */
  readonly gaussClosure: number;
}

export interface LutarWeights5 extends LutarWeights {
  readonly gaussClosure: InspectableWeight;
}

export interface LutarReport5 {
  readonly invariant: number;
  readonly axes: LutarAxes5;
  readonly weights: LutarWeights5;
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
 * Default 5-axis weights: each axis carries 1/5.
 * 1/5 decomposes into the Egyptian Rhind table as 1/5 (already a unit
 * fraction, so its `.terms` array is `[5]`).
 */
export function defaultWeights5(): LutarWeights5 {
  const w = inspectableWeight(1, 5);
  return {
    cleanliness: w,
    horizon: w,
    resonance: w,
    frustum: w,
    gaussClosure: w,
  };
}

export function weightsAreExact5(weights: LutarWeights5): boolean {
  if (![weights.cleanliness, weights.horizon, weights.resonance, weights.frustum, weights.gaussClosure].every(weightMatchesTerms)) {
    return false;
  }
  const allTerms = [
    ...weights.cleanliness.terms,
    ...weights.horizon.terms,
    ...weights.resonance.terms,
    ...weights.frustum.terms,
    ...weights.gaussClosure.terms,
  ];
  const r = reconstructFraction(allTerms);
  return r.numerator === r.denominator && r.numerator > 0;
}

export function lutarInvariant5(
  axes: LutarAxes5,
  weights: LutarWeights5 = defaultWeights5()
): LutarReport5 {
  for (const [name, v] of Object.entries(axes)) {
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`lutarInvariant5: axis ${name} = ${v} must be in [0,1]`);
    }
  }

  const weightSumExact = weightsAreExact5(weights);
  const weightSum =
    weights.cleanliness.value +
    weights.horizon.value +
    weights.resonance.value +
    weights.frustum.value +
    weights.gaussClosure.value;

  if (!weightSumExact) {
    throw new Error(
      `lutarInvariant5: weights are not Egyptian-exact (sum = ${weightSum}); weight-sum constraint violated`
    );
  }

  const values = [
    axes.cleanliness,
    axes.horizon,
    axes.resonance,
    axes.frustum,
    axes.gaussClosure,
  ];

  // Zero-pinning with positive weights: if any axis is 0, Λ₅ = 0 exactly.
  if (values.some((v) => v === 0)) {
    return buildReport5(0, axes, weights, weightSum, weightSumExact);
  }

  const logL =
    weights.cleanliness.value * Math.log(axes.cleanliness) +
    weights.horizon.value * Math.log(axes.horizon) +
    weights.resonance.value * Math.log(axes.resonance) +
    weights.frustum.value * Math.log(axes.frustum) +
    weights.gaussClosure.value * Math.log(axes.gaussClosure);
  const invariant = Math.exp(logL);

  return buildReport5(invariant, axes, weights, weightSum, weightSumExact);
}

function buildReport5(
  invariant: number,
  axes: LutarAxes5,
  weights: LutarWeights5,
  weightSum: number,
  weightSumExact: boolean
): LutarReport5 {
  const values = [
    axes.cleanliness,
    axes.horizon,
    axes.resonance,
    axes.frustum,
    axes.gaussClosure,
  ];
  const minAxis = Math.min(...values);
  const maxAxis = Math.max(...values);
  const formula =
    `Λ₅ = C^${rational(weights.cleanliness)} · H^${rational(weights.horizon)} · ` +
    `R^${rational(weights.resonance)} · F^${rational(weights.frustum)} · ` +
    `G^${rational(weights.gaussClosure)}`;
  return {
    invariant,
    axes,
    weights,
    proof: {
      weightSum,
      weightSumExact,
      minAxis,
      maxAxis,
      bound: { lower: minAxis, upper: maxAxis },
      formula,
    },
  };
}

export function verifyLutarBound5(report: LutarReport5): boolean {
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
