/**
 * Primitive 88 — Subalternation license check (ὑπαλλήλος)
 *
 * Posterior Analytics I.9 + I.13, 78b34–79a6: the explicit exception
 * to metabasis. Optics borrows from geometry. Harmonics borrows from
 * arithmetic. The borrower's genus must be a species under the
 * lender's genus, forming a verified hierarchical chain.
 *
 * This primitive composes with primitive 84 (metabasis-prohibition)
 * as its override handler. Metabasis fires first; subalternation
 * provides the license.
 */

export interface ScienceNode {
  id: string;
  parent?: string; // its lender / higher genus
}

export interface SubalternationInput {
  sourceScience: string;   // S_high — the lender
  targetScience: string;   // S_low — the borrower
  theoremId: string;
  /** The science lattice; map of id → node */
  lattice: Record<string, ScienceNode>;
  /** Whether the theorem's instantiation into the lower genus has been verified valid */
  instantiationVerified: boolean;
}

export interface SubalternationResult {
  ok: boolean;
  reason: string;
  pathLength: number;
  status: "licensed" | "unlicensed" | "partial";
}

function climbToRoot(lattice: Record<string, ScienceNode>, start: string): string[] {
  const path: string[] = [];
  let cur: string | undefined = start;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    path.push(cur);
    seen.add(cur);
    cur = lattice[cur]?.parent;
  }
  return path;
}

export function subalternationLicenseCheck(input: SubalternationInput): SubalternationResult {
  const path = climbToRoot(input.lattice, input.targetScience);
  const idx = path.indexOf(input.sourceScience);
  if (idx === -1) {
    return {
      ok: false,
      reason: `${input.targetScience} is not subalternate to ${input.sourceScience}`,
      pathLength: 0,
      status: "unlicensed",
    };
  }
  if (!input.instantiationVerified) {
    return {
      ok: false,
      reason: "subalternation path exists but theorem instantiation not verified",
      pathLength: idx,
      status: "partial",
    };
  }
  return {
    ok: true,
    reason: `subalternation path of length ${idx} verified; theorem instantiation valid`,
    pathLength: idx,
    status: "licensed",
  };
}
