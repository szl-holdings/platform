/**
 * Primitive 84 — Metabasis prohibition (μετάβασις εἰς ἄλλο γένος)
 *
 * Posterior Analytics I.7, 75a38: "It is not possible to prove
 * something in one genus by passing over from another genus."
 * Each scientific genus has autonomous first principles. Borrowing
 * across genus boundaries invalidates the explanation even when the
 * conclusion happens to be true.
 *
 * The gate inspects every principle invoked in a proof and refuses
 * any whose home genus is foreign to the target genus, UNLESS a
 * subalternation path is supplied (handled by primitive 88).
 */

export interface ProofPrinciple {
  id: string;
  homeGenus: string;
}

export interface MetabasisInput {
  claimId: string;
  targetGenus: string;
  principles: ProofPrinciple[];
  /** Optional: list of genera that are subalternate ancestors of targetGenus */
  subalternateAncestors?: string[];
}

export interface MetabasisResult {
  ok: boolean;
  reason: string;
  foreign: ProofPrinciple[];
  borrowed: ProofPrinciple[];
}

export function metabasisProhibition(input: MetabasisInput): MetabasisResult {
  if (!input.targetGenus) {
    return { ok: false, reason: "targetGenus required", foreign: [], borrowed: [] };
  }
  const ancestors = new Set(input.subalternateAncestors ?? []);
  const foreign: ProofPrinciple[] = [];
  const borrowed: ProofPrinciple[] = [];
  for (const p of input.principles) {
    if (p.homeGenus === input.targetGenus) continue;
    if (ancestors.has(p.homeGenus)) {
      borrowed.push(p);
      continue;
    }
    foreign.push(p);
  }
  if (foreign.length > 0) {
    return {
      ok: false,
      reason: `metabasis: ${foreign.length} principle(s) imported from foreign genus`,
      foreign,
      borrowed,
    };
  }
  return {
    ok: true,
    reason: borrowed.length > 0 ? `${borrowed.length} subalternate borrow(s) licensed` : "all principles native",
    foreign: [],
    borrowed,
  };
}
