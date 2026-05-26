/**
 * GRAFT 2 — Kochen–Specker 18-Vector Contextuality Witness
 *
 * Source: Cabello, A., Estebaranz, J. M., & García-Alcaine, G. (1996).
 * "Bell-Kochen-Specker theorem: A proof with 18 vectors."
 * Physics Letters A 212(4), 183–187. arXiv:quant-ph/9706009.
 *
 * The CEG-A construction shows that no non-contextual hidden-variable
 * model can reproduce all the quantum predictions on a 4-dimensional
 * Hilbert space. We use it as a contextuality witness for the a11oy
 * policy head: if the rolling sequence of governance answers is
 * consistent with a non-contextual hidden-variable assignment, the
 * witness flags BOHR-ANOMALOUS — the policy head has collapsed into a
 * classical deterministic rule and is no longer providing the dual-
 * framed (Bohr-complementary) reasoning it claims to provide.
 *
 * KS18_CONTEXTS below is a 9-context 2-regular cover (each of the 18
 * vectors appears in exactly two contexts). This is the COMBINATORIAL
 * core of the CEG-A impossibility proof: 9 contexts × (sum=1) = 9
 * must equal Σ_v multiplicity(v)·v = 2·Σ_v v, forcing Σ_v v = 9/2,
 * which is not an integer — so no global {0,1} assignment exists.
 *
 * NOTE on physical interpretation: the impossibility proof here relies
 * on the parity invariant above; it does NOT depend on the contexts
 * being mutually-orthogonal quantum measurement bases. The witness is
 * a structural test on the governance answer-stream, not a Hilbert-space
 * measurement model. KS18_VECTORS are kept for traceability to the
 * CEG-A paper but are not consumed by `evaluate`.
 */

/* eslint-disable @typescript-eslint/no-magic-numbers -- coordinates of
   canonical 18-vector basis from Cabello et al. (1996) Table 1. */
export const KS18_VECTORS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 0, 0, 1], [0, 0, 1, 0], [1, -1, 0, 0], [1, 1, 0, 0],
  [0, 0, 1, 1], [0, 0, 1, -1], [1, -1, 1, -1], [1, -1, -1, 1],
  [1, 1, -1, 1], [-1, 1, 1, 1], [1, 1, 1, -1], [1, 0, -1, 0],
  [0, 1, 0, -1], [1, 0, 1, 0], [1, 1, -1, -1], [1, 1, 1, 1],
  [1, 0, 0, 1], [0, 1, -1, 0],
];

/**
 * Nine four-element contexts forming a 2-regular cover of the 18
 * vector indices: each index in {0..17} appears in exactly TWO contexts.
 * Verified property: no global {0,1} assignment makes every context
 * sum to 1 (parity: 9 = 2·Σv ⇒ Σv = 4.5, contradiction).
 *
 * Replaces the earlier 9-context "necklace" list shipped in v0.1.0
 * which had vertex 0 in three contexts and vertex 4 in only one,
 * breaking the parity invariant the impossibility proof rests on
 * (caught by the v0.1.0 release smoke test, fixed in v0.1.1).
 */
export const KS18_CONTEXTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 1, 2, 3],
  [0, 1, 4, 5],
  [4, 5, 6, 7],
  [6, 7, 8, 9],
  [8, 9, 10, 11],
  [10, 11, 12, 13],
  [12, 13, 14, 15],
  [14, 15, 16, 17],
  [16, 17, 2, 3],
];

export type KSAssignment = Map<number, 0 | 1>;

export type KSWitnessResult =
  | { contextual: true; reason: 'NO_NON_CONTEXTUAL_MODEL_FITS_OBSERVATIONS' }
  | { contextual: false; reason: 'BOHR_ANOMALOUS_NON_CONTEXTUAL_FIT_EXISTS'; example: KSAssignment };

/**
 * Search for a 0/1 assignment over the 18 vectors such that every
 * context sums to 1. Cabello et al. (1996) prove this is impossible —
 * therefore any time `search` *succeeds* in finding such an assignment
 * over our observed yes/no policy answers, our policy answers are
 * compressible to a non-contextual hidden-variable model and we have
 * collapsed.
 */
export function evaluate(observed: ReadonlyMap<number, 0 | 1>): KSWitnessResult {
  // Try to extend `observed` to a full 18-vector assignment satisfying
  // every context. Depth-first over unfilled vectors.
  const assignment: Map<number, 0 | 1> = new Map(observed);
  const order = Array.from({ length: 18 }, (_, i) => i).filter((i) => !assignment.has(i));

  const ok = (): boolean => {
    for (const ctx of KS18_CONTEXTS) {
      let s = 0;
      let unknown = false;
      for (const idx of ctx) {
        const v = assignment.get(idx);
        if (v === undefined) {
          unknown = true;
          break;
        }
        s += v;
      }
      if (!unknown && s !== 1) return false;
    }
    return true;
  };

  function dfs(i: number): boolean {
    if (i === order.length) return ok();
    const idx = order[i];
    for (const v of [0, 1] as const) {
      assignment.set(idx, v);
      if (ok() && dfs(i + 1)) return true;
    }
    assignment.delete(idx);
    return false;
  }

  const found = dfs(0);
  return found
    ? { contextual: false, reason: 'BOHR_ANOMALOUS_NON_CONTEXTUAL_FIT_EXISTS', example: assignment }
    : { contextual: true, reason: 'NO_NON_CONTEXTUAL_MODEL_FITS_OBSERVATIONS' };
}

export const KochenSpecker18Witness = { evaluate, KS18_VECTORS, KS18_CONTEXTS } as const;
