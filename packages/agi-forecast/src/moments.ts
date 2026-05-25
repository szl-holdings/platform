/**
 * Gram–Charlier A (GCA) moment-based feature extractor.
 *
 * Formal counterpart: `packages/lean-formulas/Substance/GCA.lean`,
 * theorems `heCoeff3_homogeneous` and `heCoeff4_homogeneous`
 * (Kawamoto–McGwier, GNU Radio Conference 2016).
 *
 * Given raw moments `m₁, m₂, m₃, m₄` of a sample, compute the third- and
 * fourth-order Hermite (probabilists') expansion coefficients used as a
 * modulation fingerprint. The Lean lemma we exercise here is degree-graded
 * homogeneity: scaling `mₖ ↦ tᵏ · mₖ` scales `cₖ ↦ tᵏ · cₖ`.
 */

export interface RawMoments {
  readonly m1: number;
  readonly m2: number;
  readonly m3: number;
  readonly m4: number;
}

/** Compute raw moments `m₁ … m₄` of a finite sample. */
export function rawMoments(sample: readonly number[]): RawMoments {
  const n = sample.length;
  if (n === 0) return { m1: 0, m2: 0, m3: 0, m4: 0 };
  let s1 = 0, s2 = 0, s3 = 0, s4 = 0;
  for (const x of sample) {
    const x2 = x * x;
    s1 += x; s2 += x2; s3 += x2 * x; s4 += x2 * x2;
  }
  return { m1: s1 / n, m2: s2 / n, m3: s3 / n, m4: s4 / n };
}

/** Third-order Gram–Charlier A coefficient. Matches `heCoeff3` in Lean. */
export function heCoeff3(m: RawMoments): number {
  return (m.m3 - 3 * m.m1 * m.m2 + 2 * m.m1 ** 3) / 6;
}

/** Fourth-order Gram–Charlier A coefficient. Matches `heCoeff4` in Lean. */
export function heCoeff4(m: RawMoments): number {
  const variance = m.m2 - m.m1 ** 2;
  return (m.m4 - 4 * m.m1 * m.m3 + 6 * m.m1 ** 2 * m.m2 - 3 * m.m1 ** 4 - 3 * variance ** 2) / 24;
}

/** GCA fingerprint vector consumed by the modulation classifier. */
export function gcaFingerprint(sample: readonly number[]): {
  readonly c3: number;
  readonly c4: number;
} {
  const m = rawMoments(sample);
  return { c3: heCoeff3(m), c4: heCoeff4(m) };
}
