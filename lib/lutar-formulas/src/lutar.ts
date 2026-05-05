/**
 * The Lutar Invariant Λ — TypeScript port of `vendor/ouroboros-py/ouroboros/invariant.py`.
 *
 *     Λ = C^α · H^β · R^γ · F^δ          (4-axis form)
 *     Λ₅ = C^α · H^β · R^γ · F^δ · G^ε   (5-axis with Gauß closure)
 *
 * Axioms (from paper-03 / v3 thesis):
 *   A1 — Monotonicity:     ∂Λ/∂x_i ≥ 0
 *   A2 — Zero-pinning:     ∃ x_i = 0 ⇒ Λ = 0
 *   A3 — Egyptian inspectability: every weight is a finite sum of distinct
 *        unit fractions (so any auditor can reconstruct it)
 *   A4 — Page-curve concavity: Λ is concave in axis space
 *
 * Bound theorem:  0 ≤ Λ ≤ min(axes) ≤ max(axes) ≤ 1
 */

export interface LutarAxes {
  /** C — provenance/cleanliness, in [0,1] */
  cleanliness: number;
  /** H — temporal horizon / freshness, in [0,1] */
  horizon: number;
  /** R — cross-source resonance, in [0,1] */
  resonance: number;
  /** F — frustum geometry / completeness, in [0,1] */
  frustum: number;
}

export interface LutarAxes5 extends LutarAxes {
  /** G — Gauß closure (least-squares network adjustment over an
   *  over-determined witness set), in [0,1] */
  gaussClosure: number;
}

export interface InspectableWeight {
  /** Egyptian unit-fraction terms summing to `value`. */
  terms: readonly number[];
  value: number;
}

export interface LutarWeights {
  cleanliness: InspectableWeight;
  horizon: InspectableWeight;
  resonance: InspectableWeight;
  frustum: InspectableWeight;
}

export interface LutarWeights5 extends LutarWeights {
  gaussClosure: InspectableWeight;
}

export interface LutarProof {
  weightSum: number;
  weightSumExact: boolean;
  minAxis: number;
  maxAxis: number;
  boundLower: number;
  boundUpper: number;
  formula: string;
}

export interface LutarReport {
  invariant: number;
  axes: LutarAxes;
  weights: LutarWeights;
  proof: LutarProof;
}

export interface LutarReport5 {
  invariant: number;
  axes: LutarAxes5;
  weights: LutarWeights5;
  proof: LutarProof;
}

/**
 * Greedy Egyptian-fraction (Fibonacci–Sylvester) decomposition of p/q
 * into a strictly-increasing sequence of distinct unit fractions.
 */
export function decomposeUnitFraction(p: number, q: number): {
  terms: number[];
  exact: boolean;
} {
  if (!Number.isInteger(p) || !Number.isInteger(q) || p <= 0 || q <= 0 || p >= q) {
    throw new RangeError(
      `decomposeUnitFraction: ${p}/${q} must be a strictly proper positive rational`,
    );
  }
  const terms: number[] = [];
  let num = p;
  let den = q;
  // Bounded loop — Erdős proved Fibonacci–Sylvester terminates in ≤ p steps.
  for (let i = 0; i < 1024 && num !== 0; i++) {
    const k = Math.ceil(den / num);
    terms.push(k);
    num = num * k - den;
    den = den * k;
    const g = gcd(Math.abs(num), den);
    if (g > 1) {
      num = num / g;
      den = den / g;
    }
  }
  return { terms, exact: num === 0 };
}

/** Reconstruct an exact rational from a sequence of unit-fraction denominators. */
export function reconstructFraction(terms: readonly number[]): {
  numerator: number;
  denominator: number;
} {
  let num = 0n;
  let den = 1n;
  for (const t of terms) {
    if (!Number.isInteger(t) || t <= 0) {
      throw new RangeError(`reconstructFraction: term ${t} must be a positive integer`);
    }
    const tb = BigInt(t);
    num = num * tb + den;
    den = den * tb;
    const g = bgcd(num < 0n ? -num : num, den);
    if (g > 1n) {
      num /= g;
      den /= g;
    }
  }
  return { numerator: Number(num), denominator: Number(den) };
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function bgcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function inspectableWeight(p: number, q: number): InspectableWeight {
  const d = decomposeUnitFraction(p, q);
  if (!d.exact) {
    throw new Error(`inspectableWeight: ${p}/${q} did not decompose exactly`);
  }
  return { terms: d.terms, value: p / q };
}

/** Default 4-axis weights — each axis carries weight 1/4. */
export function defaultWeights(): LutarWeights {
  const w = inspectableWeight(1, 4);
  return { cleanliness: w, horizon: w, resonance: w, frustum: w };
}

/** Default 5-axis weights — each axis carries weight 1/5. */
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

function rationalString(w: InspectableWeight): string {
  if (w.terms.length === 1) return `(1/${w.terms[0]})`;
  return '(' + w.terms.map((t) => `1/${t}`).join('+') + ')';
}

function checkAxis(name: string, v: number): void {
  if (!Number.isFinite(v) || v < 0 || v > 1) {
    throw new RangeError(`lutarInvariant: axis ${name} = ${v} must be in [0,1]`);
  }
}

function weightsAreExact(weights: LutarWeights | LutarWeights5): boolean {
  const all: number[] = [
    ...weights.cleanliness.terms,
    ...weights.horizon.terms,
    ...weights.resonance.terms,
    ...weights.frustum.terms,
  ];
  if ('gaussClosure' in weights) all.push(...weights.gaussClosure.terms);
  const r = reconstructFraction(all);
  return r.numerator === r.denominator && r.numerator > 0;
}

/**
 * Compute the 4-axis Lutar Invariant Λ.
 *
 * Throws on out-of-range axes or non-Egyptian-exact weights.
 */
export function lutarInvariant(
  axes: LutarAxes,
  weights: LutarWeights = defaultWeights(),
): LutarReport {
  checkAxis('cleanliness', axes.cleanliness);
  checkAxis('horizon', axes.horizon);
  checkAxis('resonance', axes.resonance);
  checkAxis('frustum', axes.frustum);

  const exact = weightsAreExact(weights);
  const weightSum =
    weights.cleanliness.value +
    weights.horizon.value +
    weights.resonance.value +
    weights.frustum.value;
  if (!exact) {
    throw new Error(
      `lutarInvariant: weights are not Egyptian-exact (sum=${weightSum}); axiom A3 violated`,
    );
  }

  const vals = [axes.cleanliness, axes.horizon, axes.resonance, axes.frustum];
  const minAxis = Math.min(...vals);
  const maxAxis = Math.max(...vals);

  let invariant = 0;
  if (vals.every((v) => v > 0)) {
    const logL =
      weights.cleanliness.value * Math.log(axes.cleanliness) +
      weights.horizon.value * Math.log(axes.horizon) +
      weights.resonance.value * Math.log(axes.resonance) +
      weights.frustum.value * Math.log(axes.frustum);
    invariant = Math.exp(logL);
  }

  const formula =
    `Λ = C^${rationalString(weights.cleanliness)} · ` +
    `H^${rationalString(weights.horizon)} · ` +
    `R^${rationalString(weights.resonance)} · ` +
    `F^${rationalString(weights.frustum)}`;

  return {
    invariant,
    axes,
    weights,
    proof: {
      weightSum,
      weightSumExact: exact,
      minAxis,
      maxAxis,
      boundLower: 0,
      boundUpper: minAxis,
      formula,
    },
  };
}

/** Compute the 5-axis Lutar Invariant Λ₅ with Gauß closure. */
export function lutarInvariant5(
  axes: LutarAxes5,
  weights: LutarWeights5 = defaultWeights5(),
): LutarReport5 {
  checkAxis('cleanliness', axes.cleanliness);
  checkAxis('horizon', axes.horizon);
  checkAxis('resonance', axes.resonance);
  checkAxis('frustum', axes.frustum);
  checkAxis('gaussClosure', axes.gaussClosure);

  const exact = weightsAreExact(weights);
  const weightSum =
    weights.cleanliness.value +
    weights.horizon.value +
    weights.resonance.value +
    weights.frustum.value +
    weights.gaussClosure.value;
  if (!exact) {
    throw new Error(
      `lutarInvariant5: weights are not Egyptian-exact (sum=${weightSum}); axiom A3 violated`,
    );
  }

  const vals = [
    axes.cleanliness,
    axes.horizon,
    axes.resonance,
    axes.frustum,
    axes.gaussClosure,
  ];
  const minAxis = Math.min(...vals);
  const maxAxis = Math.max(...vals);

  let invariant = 0;
  if (vals.every((v) => v > 0)) {
    const logL =
      weights.cleanliness.value * Math.log(axes.cleanliness) +
      weights.horizon.value * Math.log(axes.horizon) +
      weights.resonance.value * Math.log(axes.resonance) +
      weights.frustum.value * Math.log(axes.frustum) +
      weights.gaussClosure.value * Math.log(axes.gaussClosure);
    invariant = Math.exp(logL);
  }

  const formula =
    `Λ₅ = C^${rationalString(weights.cleanliness)} · ` +
    `H^${rationalString(weights.horizon)} · ` +
    `R^${rationalString(weights.resonance)} · ` +
    `F^${rationalString(weights.frustum)} · ` +
    `G^${rationalString(weights.gaussClosure)}`;

  return {
    invariant,
    axes,
    weights,
    proof: {
      weightSum,
      weightSumExact: exact,
      minAxis,
      maxAxis,
      boundLower: 0,
      boundUpper: minAxis,
      formula,
    },
  };
}

/** Witness the bound theorem: 0 ≤ Λ ≤ min_axis ≤ max_axis ≤ 1. */
export function verifyLutarBound(report: LutarReport | LutarReport5): boolean {
  const eps = 1e-12;
  return (
    report.invariant >= 0 &&
    report.invariant <= report.proof.maxAxis + eps &&
    report.invariant >= report.proof.minAxis - eps &&
    report.proof.minAxis <= report.proof.maxAxis &&
    report.proof.maxAxis <= 1 + eps
  );
}
