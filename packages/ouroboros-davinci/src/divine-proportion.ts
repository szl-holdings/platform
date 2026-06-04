/**
 * Primitive 59 — Divine-proportion ledger
 *
 * Pacioli & Leonardo, De Divina Proportione (1509). φ = (1+√5)/2.
 * Any compositional ratio claimed to be φ is verified to 1e-6
 * exact-φ tolerance; approximate-φ claims are kept but tagged so
 * they cannot be cited as exact.
 */

export const PHI = (1 + Math.sqrt(5)) / 2;
export const EXACT_PHI_TOL = 1e-6;
export const APPROX_PHI_TOL = 0.05;

export type PhiVerdict = "exact" | "approximate" | "none";

export interface PhiReceipt {
  ratio: number;
  delta: number;
  verdict: PhiVerdict;
  rationale: string;
}

export function ratioFromPair(a: number, b: number): number {
  if (b === 0) throw new Error("ratio: denominator zero");
  return a / b;
}

export function verifyPhi(ratio: number): PhiReceipt {
  const delta = Math.abs(ratio - PHI);
  const verdict: PhiVerdict =
    delta <= EXACT_PHI_TOL
      ? "exact"
      : delta <= APPROX_PHI_TOL * PHI
      ? "approximate"
      : "none";
  return {
    ratio,
    delta,
    verdict,
    rationale:
      verdict === "exact"
        ? "ratio matches φ within 1e-6"
        : verdict === "approximate"
        ? "ratio is approximate φ — must not be cited as exact"
        : "ratio is not φ",
  };
}
