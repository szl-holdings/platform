/**
 * invariants/reidemeister.ts — Reidemeister equivalence-class primitive used by
 * the Λ-axis audit-closure operator (Λ_audit_closure) to classify receipt-knot
 * chains into R1/R2/R3 equivalence classes.
 *
 * Reidemeister (1927) proved that two knot/link diagrams represent the same
 * knot iff one can be carried to the other by a finite sequence of three local
 * moves. The move type is named by how many strands the local region involves:
 *
 *   R1 — twist / untwist a single strand (1 strand). The sole move (per
 *        Reidemeister 1927) that changes the writhe of the diagram.
 *   R2 — poke: slide one loop completely over another (2 strands). Changes the
 *        crossing number by ±2; leaves writhe unchanged.
 *   R3 — slide a strand completely over (or under) a crossing (3 strands). The
 *        sole move that leaves the crossing number unchanged.
 *
 * Here a "receipt-knot chain" is modelled as the sequence of distinct strands
 * (receipt lineages) participating in the local crossing region under audit.
 * The simplest correct classifier — the one Reidemeister's own numbering encodes
 * — is the count of distinct strands in that local region:
 *   1 strand  → R1, 2 strands → R2, 3 strands → R3.
 * No equivalence-class *algorithm* is invented here; we implement exactly the
 * published 1927 strand-count semantics and cite it.
 *
 * Citation: Reidemeister, K. (1927). "Elementare Begründung der Knotentheorie."
 *   Abh. Math. Sem. Univ. Hamburg 5, 24–32. DOI 10.1007/BF02952507.
 *   (Independently: Alexander & Briggs 1926, Ann. Math. 28, 562–586.)
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

/**
 * A receipt-knot chain: the local crossing region under audit, given as a list
 * of crossings. Each crossing names the two strands (receipt lineage ids) that
 * cross. A self-crossing (both ids equal) is a single-strand twist.
 */
export interface Crossing {
  readonly over: string;
  readonly under: string;
}
export type ReceiptKnotChain = readonly Crossing[];

export type ReidemeisterClass = "R1" | "R2" | "R3";

/**
 * reidemeisterClass — classify a receipt-knot chain's local move type by the
 * number of distinct strands (receipt lineages) participating, per Reidemeister
 * (1927):
 *
 *   1 distinct strand  → "R1" (twist/untwist)
 *   2 distinct strands → "R2" (poke)
 *   ≥3 distinct strands → "R3" (slide over crossing)
 *
 * Throws on an empty chain (no local region to classify).
 */
export function reidemeisterClass(receiptKnotChain: ReceiptKnotChain): ReidemeisterClass {
  if (receiptKnotChain.length === 0) {
    throw new Error("reidemeisterClass: empty receipt-knot chain has no local move region");
  }
  const strands = new Set<string>();
  for (const c of receiptKnotChain) {
    strands.add(c.over);
    strands.add(c.under);
  }
  const n = strands.size;
  if (n <= 1) return "R1";
  if (n === 2) return "R2";
  return "R3";
}
