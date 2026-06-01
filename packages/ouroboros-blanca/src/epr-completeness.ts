/**
 * EPR Completeness Test — Primitive 23.
 *
 * Source: A. Einstein, B. Podolsky, N. Rosen, "Can Quantum-Mechanical
 *   Description of Physical Reality Be Considered Complete?",
 *   Physical Review (ser. 2) 47 (1935), pp. 777–780.
 *
 * Refined by: J. S. Bell, "On the Einstein Podolsky Rosen Paradox",
 *   Physics 1 (1964), pp. 195–200; J. F. Clauser, M. A. Horne,
 *   A. Shimony, R. A. Holt, "Proposed Experiment to Test Local
 *   Hidden-Variable Theories", Phys. Rev. Lett. 23 (1969), p. 880.
 *
 * Principle: in any local-realist (LR) joint description, the CHSH
 * combination of binary-outcome correlations satisfies
 *
 *     |S| = |E(a,b) − E(a,b') + E(a',b) + E(a',b')| ≤ 2.
 *
 * Quantum mechanics permits |S| up to 2√2 ≈ 2.828. EPR's original
 * thesis was that quantum mechanics is incomplete; later experiment
 * showed nature itself violates the LR bound, so the EPR test is
 * read in reverse: data with |S| > 2 cannot be reproduced by any
 * local-realist tampering, while data with |S| ≤ 2 admits a
 * local-realist explanation (which may or may not be tampering).
 *
 * In Ouroboros: a Bell-style audit on two witnesses asks each to
 * declare two binary observations on each of N rounds. We compute
 * the CHSH statistic. Two outcomes are diagnostic:
 *
 *   |S| ≤ 2.0       — local-realist consistent (clean).
 *   |S| ∈ (2, 2√2]  — quantum-correlated, OR over-correlated by collusion;
 *                     the runtime flags for review (the Einstein-Podolsky-Rosen
 *                     "incompleteness" — extra information is being shared).
 *   |S| > 2√2       — physically impossible; the witnesses are colluding
 *                     beyond any quantum limit. Hard reject.
 */

export interface CHSHRound {
  /** Binary outcome a₁ ∈ {-1, +1} from witness 1 under setting a. */
  readonly a1: -1 | 1;
  /** Binary outcome a₂ ∈ {-1, +1} from witness 1 under setting a'. */
  readonly a2: -1 | 1;
  /** Binary outcome b₁ ∈ {-1, +1} from witness 2 under setting b. */
  readonly b1: -1 | 1;
  /** Binary outcome b₂ ∈ {-1, +1} from witness 2 under setting b'. */
  readonly b2: -1 | 1;
}

export interface EPRReport {
  readonly rounds: number;
  /** Correlations E(a,b), E(a,b'), E(a',b), E(a',b'). */
  readonly E_ab: number;
  readonly E_abp: number;
  readonly E_apb: number;
  readonly E_apbp: number;
  /** CHSH combination S = E(a,b) − E(a,b') + E(a',b) + E(a',b'). */
  readonly S: number;
  /** |S|. */
  readonly absS: number;
  readonly verdict: "LOCAL_REALIST" | "EPR_INCOMPLETE" | "SUPERLUMINAL_REJECT" | "INSUFFICIENT";
}

const TSIRELSON = 2 * Math.SQRT2; // ≈ 2.828

/**
 * Compute the CHSH statistic on a list of paired-witness rounds.
 *
 * Requires at least 16 rounds to give a stable correlation estimate.
 */
export function eprTest(rounds: ReadonlyArray<CHSHRound>): EPRReport {
  const n = rounds.length;
  if (n < 16) {
    return {
      rounds: n,
      E_ab: NaN,
      E_abp: NaN,
      E_apb: NaN,
      E_apbp: NaN,
      S: NaN,
      absS: NaN,
      verdict: "INSUFFICIENT",
    };
  }
  for (const r of rounds) {
    for (const v of [r.a1, r.a2, r.b1, r.b2]) {
      if (v !== -1 && v !== 1) {
        throw new Error("blanca.eprTest: outcomes must be ±1");
      }
    }
  }

  let s_ab = 0,
    s_abp = 0,
    s_apb = 0,
    s_apbp = 0;
  for (const r of rounds) {
    s_ab += r.a1 * r.b1;
    s_abp += r.a1 * r.b2;
    s_apb += r.a2 * r.b1;
    s_apbp += r.a2 * r.b2;
  }
  const E_ab = s_ab / n;
  const E_abp = s_abp / n;
  const E_apb = s_apb / n;
  const E_apbp = s_apbp / n;

  const S = E_ab - E_abp + E_apb + E_apbp;
  const absS = Math.abs(S);

  let verdict: EPRReport["verdict"];
  if (absS <= 2) verdict = "LOCAL_REALIST";
  else if (absS <= TSIRELSON + 1e-9) verdict = "EPR_INCOMPLETE";
  else verdict = "SUPERLUMINAL_REJECT";

  return { rounds: n, E_ab, E_abp, E_apb, E_apbp, S, absS, verdict };
}

/**
 * Reduce an EPR report to a trust axis Q ∈ [0, 1].
 *
 *   LOCAL_REALIST       ⇒ 1  (clean local statistics)
 *   EPR_INCOMPLETE      ⇒ linear bleed from 1 down to 0 between 2 and 2√2
 *   SUPERLUMINAL_REJECT ⇒ 0
 *   INSUFFICIENT        ⇒ 1  (no penalty)
 */
export function eprAxis(report: EPRReport): number {
  if (report.verdict === "INSUFFICIENT" || report.verdict === "LOCAL_REALIST") return 1;
  if (report.verdict === "SUPERLUMINAL_REJECT") return 0;
  // EPR_INCOMPLETE
  const t = 1 - (report.absS - 2) / (TSIRELSON - 2);
  return Math.max(0, Math.min(1, t));
}
