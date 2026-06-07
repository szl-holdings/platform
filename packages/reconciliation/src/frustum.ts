/**
 * Frustum Reconciliation — Primitive 11.
 *
 * Source: Moscow Mathematical Papyrus problem 14 (c. 1850 BCE).
 * Liu Hui dissection proof (c. 250 CE).
 * Modern interpretation: Siegmund-Schultze (2022).
 *
 * V_loop = (1/3) · (V(W1) + V(W2) + V(W3))
 *
 * Three independent witnesses of the same closed loop must dissect into
 * evidence boxes of equal total volume. If any two diverge, at least one
 * witness is incomplete or lying.
 *
 * The Egyptian formula V_T = (h/3)(a² + ab + b²) for the truncated pyramid
 * proves that three identical copies of a frustum can be dissected and
 * recomposed into three boxes of sizes h·a², h·ab, h·b². We use the same
 * structural proof to reconcile three witness views of one runtime release.
 */

export interface WitnessView {
  readonly id: string;
  /** Distinct released-bit hashes observed by this witness. Order-insensitive. */
  readonly leaves: readonly string[];
  /** Optional source label: "internal", "external", "anchor", etc. */
  readonly source?: string;
}

export interface ReconciliationReport {
  readonly verdict: "RECONCILED" | "DIVERGENT" | "INSUFFICIENT";
  /** Number of distinct leaves in the union across all three views. */
  readonly unionVolume: number;
  /** Number of distinct leaves in the intersection across all three views. */
  readonly intersectionVolume: number;
  /** Volume each individual witness reported. */
  readonly perWitnessVolume: readonly number[];
  /** Mean volume across the three views (the v_loop estimate). */
  readonly meanVolume: number;
  /** Maximum pairwise symmetric difference. 0 means all three agree. */
  readonly maxSymmetricDifference: number;
  /** Witnesses missing leaves that other witnesses saw. */
  readonly gaps: readonly { witnessId: string; missing: number }[];
}

/**
 * The MMP-14 / Liu Hui reconciliation. Requires exactly three views.
 *
 * Per Theorem 3 of Ouroboros v3.1: a runtime release is reconciled iff
 *  - all three witnesses observe the same set of distinct released-bit hashes
 *  - each witness's volume equals the mean volume
 *  - the intersection volume equals the union volume.
 */
export function reconcileFrustum(views: readonly WitnessView[]): ReconciliationReport {
  if (views.length !== 3) {
    return {
      verdict: "INSUFFICIENT",
      unionVolume: 0,
      intersectionVolume: 0,
      perWitnessVolume: views.map((v) => new Set(v.leaves).size),
      meanVolume: 0,
      maxSymmetricDifference: 0,
      gaps: [],
    };
  }

  const sets = views.map((v) => new Set(v.leaves));
  const perWitnessVolume = sets.map((s) => s.size);
  const meanVolume = perWitnessVolume.reduce((a, b) => a + b, 0) / 3;

  const union = new Set<string>();
  for (const s of sets) for (const leaf of s) union.add(leaf);

  const intersection = new Set<string>(sets[0]);
  for (const s of sets.slice(1)) {
    for (const leaf of [...intersection]) if (!s.has(leaf)) intersection.delete(leaf);
  }

  const maxSymmetricDifference = pairwiseMaxSymmetricDiff(sets);

  const gaps = sets.map((s, i) => ({
    witnessId: views[i].id,
    missing: union.size - s.size,
  }));

  const verdict =
    union.size === intersection.size && maxSymmetricDifference === 0 ? "RECONCILED" : "DIVERGENT";

  return {
    verdict,
    unionVolume: union.size,
    intersectionVolume: intersection.size,
    perWitnessVolume,
    meanVolume,
    maxSymmetricDifference,
    gaps,
  };
}

function pairwiseMaxSymmetricDiff(sets: readonly Set<string>[]): number {
  let max = 0;
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const diff = symmetricDifference(sets[i], sets[j]);
      if (diff > max) max = diff;
    }
  }
  return max;
}

function symmetricDifference(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const x of a) if (!b.has(x)) count++;
  for (const x of b) if (!a.has(x)) count++;
  return count;
}

/**
 * The closed-form MMP-14 formula, rendered for the audit log so a human
 * auditor can verify the dissection by hand: V_T = (h/3)(a² + ab + b²).
 *
 * For runtime use we set h=1, a=|W1|, b=|W3| (with W2 mediating). The
 * formula is reported alongside the report so reviewers see the proof
 * shape, not just the verdict.
 */
export function frustumFormula(report: ReconciliationReport): string {
  const [a, , b] = report.perWitnessVolume;
  const aN = a ?? 0;
  const bN = b ?? 0;
  const v = (1 / 3) * (aN * aN + aN * bN + bN * bN);
  return `V_T = (1/3)(${aN}² + ${aN}·${bN} + ${bN}²) = ${v.toFixed(2)}`;
}
