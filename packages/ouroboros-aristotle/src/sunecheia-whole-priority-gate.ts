/**
 * Primitive 87 — Sunecheia whole-priority gate (συνέχεια)
 *
 * Physics VI.1, 231a21–23: the continuous is that whose touching
 * extremities become one. Physics 231b1–7: points are limits, not
 * parts; a line cannot be composed of points. Metaphysics V.6,
 * 1016a1–9: a continuum is actually one and only potentially many.
 *
 * The gate refuses any compositional claim that builds a magnitude
 * out of pre-existing indivisible constituents (atomism / punctualism).
 * Parts of a continuum exist only upon division — they are potential
 * until cut, never prior to the whole.
 */

export interface CompositionalClaim {
  magnitudeId: string;
  /** Constituents the asserter claims compose the magnitude */
  constituents: Array<{ id: string; indivisible: boolean }>;
  /** Whether the asserter claims constituents pre-exist actually (not merely potentially) */
  partsActuallyPriorToWhole: boolean;
  /** Whether the magnitude is being claimed to result from summing/concatenating constituents */
  builtBySum: boolean;
}

export interface SunecheiaResult {
  ok: boolean;
  reason: string;
  violation?: "atomism" | "punctualism" | "actual-prior-parts";
}

export function sunecheiaGate(claim: CompositionalClaim): SunecheiaResult {
  const indivisibleCount = claim.constituents.filter((c) => c.indivisible).length;

  if (indivisibleCount > 0 && claim.builtBySum) {
    return {
      ok: false,
      reason: `magnitude claimed to be built from ${indivisibleCount} indivisible constituents — violates Physics VI.1`,
      violation: "punctualism",
    };
  }
  if (indivisibleCount === claim.constituents.length && claim.constituents.length > 0) {
    return {
      ok: false,
      reason: "all constituents indivisible — atomistic decomposition rejected",
      violation: "atomism",
    };
  }
  if (claim.partsActuallyPriorToWhole) {
    return {
      ok: false,
      reason: "parts asserted as actually prior to whole — Aristotelian whole-priority violated",
      violation: "actual-prior-parts",
    };
  }
  return {
    ok: true,
    reason: "magnitude treated as prior unity with potential parts",
  };
}
