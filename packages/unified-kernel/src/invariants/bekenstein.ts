/**
 * invariants/bekenstein.ts — Bekenstein information-density cap primitive used
 * by the Λ-axis audit-closure operator (Λ_audit_closure) as the per-receipt
 * entropy cap.
 *
 * The Bekenstein bound (Bekenstein 1981) is an upper limit on the entropy S
 * (equivalently the Shannon information I) that can be contained in a region of
 * radius R holding total mass-energy E:
 *
 *   S ≤ 2π k R E / (ħ c)          (thermodynamic entropy, in J/K-style units)
 *
 * Converting entropy to information in bits (I = S / (k ln 2)):
 *
 *   bekensteinCap = I_max = (2π R E) / (ħ c ln 2)   bits
 *
 * In the receipt-bus σ-algebra this caps the information content a single
 * bounded-region receipt may carry: a receipt whose canonical byte-string
 * encodes more bits than its physical bounded region admits is rejected.
 *
 * Citation: Bekenstein, J. D. (1981). "Universal upper bound on the
 *   entropy-to-energy ratio for bounded systems." Phys. Rev. D 23, 287.
 *   DOI 10.1103/PhysRevD.23.287.
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

/** Reduced Planck constant ħ, in J·s (CODATA 2018). */
export const HBAR_J_S = 1.054571817e-34;
/** Speed of light c, in m/s (exact, SI definition). */
export const C_M_S = 299792458;

/**
 * bekensteinCap — maximum information, in BITS, that fits in a sphere of radius
 * `radiusM` (metres) holding total energy `energyJ` (joules):
 *
 *   I_max = (2π R E) / (ħ c ln 2)
 *
 * Real physics, real constants. Returns a positive bit count.
 */
export function bekensteinCap(energyJ: number, radiusM: number): number {
  if (!(energyJ > 0)) throw new Error("bekensteinCap: energyJ must be positive");
  if (!(radiusM > 0)) throw new Error("bekensteinCap: radiusM must be positive");
  const entropyNats = (2 * Math.PI * radiusM * energyJ) / (HBAR_J_S * C_M_S);
  // nats → bits: divide by ln 2.
  return entropyNats / Math.log(2);
}

/**
 * withinBekensteinCap — true iff a receipt carrying `bits` of information fits
 * within the Bekenstein cap of its bounded region. Used by Λ_audit_closure to
 * accept/reject a per-receipt entropy claim.
 */
export function withinBekensteinCap(bits: number, energyJ: number, radiusM: number): boolean {
  return bits <= bekensteinCap(energyJ, radiusM);
}
