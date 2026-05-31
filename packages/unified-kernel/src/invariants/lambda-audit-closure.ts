/**
 * invariants/lambda-audit-closure.ts — the Λ Audit-Closure Operator.
 *
 * This is THE central operator of the canonical "Paper to Receipt" architecture
 * (founder diagram, 2026-05-31). Every branch (amaru, rosie, sentra, UDS-Mesh,
 * VSP-OTEL, a11oy) hangs off it.
 *
 * ── Canonical Λ-axis paragraph (verbatim from the founder; DO NOT EDIT) ──────
 *
 *   The Λ-axis is a measurable governance operator defined on the receipt-bus
 *   σ-algebra of a bounded-recursion runtime. It composes axiom-by-axiom
 *   (Doctrine v7: 15 axioms, 14 unique) under a monotone geometric mean, with
 *   PAC-Bayes (McAllester 2003) tail bounds on the confidence margin, Bekenstein
 *   information-density caps (Bekenstein 1981) on per-receipt entropy, and
 *   Reidemeister R1/R2/R3 equivalence classes (Reidemeister 1927) on
 *   receipt-knot chains. The closure is proved in Lean 4 (Mathlib v4.13.0). The
 *   runtime overhead is bounded above by 0.59 ms / request median in the
 *   ouroboros bench harness.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Historical note (founder screenshot, 2026-05-31): the diagram captioned
 * lutar-lean as "626 decls / 44 gates". The LIVE canonical kernel at SHA
 * c7c0ba17 reads 749 declarations / 14 unique axioms / 163 sorries; the kernel
 * cites the LIVE numbers (see lean/ and getCanonicalNumbers()). The 626/44
 * figures are documented as historical in AGENT_DOCTRINE_ENFORCEMENT.md.
 *
 * The simple value-returning `lambda(values)` (invariants/index.ts) stays as the
 * internal monotone-geometric-mean helper; the PUBLIC API is this Operator.
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

import { lambda } from "./index.ts";
import { pacBayesTailBound } from "./pac-bayes.ts";
import { bekensteinCap, withinBekensteinCap } from "./bekenstein.ts";
import { reidemeisterClass, type ReceiptKnotChain, type ReidemeisterClass } from "./reidemeister.ts";

/** A single receipt observed on the receipt-bus σ-algebra. */
export interface Receipt {
  /** Receipt lineage / strand id (for the receipt-knot chain). */
  readonly id: string;
  /** Information content of the canonical byte-string, in bits. */
  readonly bits: number;
  /** Per-axis governance measurements in [0,1], one entry per declared axiom. */
  readonly axisValues: readonly number[];
  /** Optional crossing with another receipt lineage (forms the knot chain). */
  readonly crossesUnder?: string;
}

/** The receipt-bus: a stream / iterable of receipts (the σ-algebra carrier). */
export type ReceiptBus = Iterable<Receipt>;

/** A named governance axiom from Doctrine v7 (15 axioms, 14 unique). */
export interface Axiom {
  readonly name: string;
  /** True if this axiom is a duplicate of an earlier one (the 15→14 collapse). */
  readonly duplicateOf?: string;
}

/** Per-axiom contribution to the composite Λ. */
export interface AxiomContribution {
  readonly axiom: string;
  /** Geometric-mean contribution of this axiom across all receipts. */
  readonly contribution: number;
  readonly unique: boolean;
}

/** The graded closure produced by the Λ Audit-Closure Operator. */
export interface GradedClosure {
  /** Composite Λ over the whole receipt-bus (monotone geometric mean). */
  readonly compositeLambda: number;
  /** Per-axiom contributions (one per declared axiom). */
  readonly perAxiom: readonly AxiomContribution[];
  /** PAC-Bayes (McAllester 2003) tail bound on the confidence margin. */
  readonly pacBayesTailBound: number;
  /** Bekenstein (1981) per-receipt entropy cap, in bits (region 1 J / 1 m). */
  readonly bekensteinCapBits: number;
  /** Whether every receipt's entropy stayed under the Bekenstein cap. */
  readonly bekensteinRespected: boolean;
  /** Reidemeister (1927) equivalence class of the receipt-knot chain. */
  readonly reidemeisterClass: ReidemeisterClass;
  /** Number of receipts folded into the closure. */
  readonly receiptCount: number;
  /** Number of declared axioms (15) and unique axioms (14). */
  readonly axiomCount: number;
  readonly uniqueAxiomCount: number;
}

/** Bounded region used for the per-receipt Bekenstein cap: 1 J in a 1 m sphere. */
const BEKENSTEIN_ENERGY_J = 1;
const BEKENSTEIN_RADIUS_M = 1;

/**
 * Λ_audit_closure — the Λ Audit-Closure Operator.
 *
 * Folds a receipt-bus (stream of receipts) under a graded closure: it composes
 * the Doctrine-v7 axioms axiom-by-axiom under a monotone geometric mean
 * (delegating to the `lambda` helper), attaches a PAC-Bayes (McAllester 2003)
 * tail bound on the confidence margin, a Bekenstein (1981) per-receipt entropy
 * cap, and the Reidemeister (1927) equivalence class of the receipt-knot chain
 * built from the receipts' crossings.
 *
 * Input is a stream/iterable of receipts; output is a GradedClosure.
 */
export function Λ_audit_closure(receiptBus: ReceiptBus, axioms: readonly Axiom[]): GradedClosure {
  const receipts = [...receiptBus];
  if (receipts.length === 0) throw new Error("Λ_audit_closure: empty receipt-bus");
  if (axioms.length === 0) throw new Error("Λ_audit_closure: no axioms supplied");

  const uniqueAxiomCount = axioms.filter((a) => !a.duplicateOf).length;

  // Per-axiom contribution: geometric mean of that axis across all receipts.
  const perAxiom: AxiomContribution[] = axioms.map((ax, j) => {
    const column = receipts.map((r) => r.axisValues[j] ?? 0);
    const contribution = lambda(column).lambda;
    return { axiom: ax.name, contribution, unique: !ax.duplicateOf };
  });

  // Composite Λ: monotone geometric mean of the per-axiom contributions
  // (axiom-by-axiom composition). Restricted to the unique axioms to avoid
  // double-weighting the 15→14 collapse.
  const uniqueContribs = perAxiom.filter((p) => p.unique).map((p) => p.contribution);
  const compositeLambda = lambda(uniqueContribs).lambda;

  // PAC-Bayes tail bound on the confidence margin: posterior = normalised
  // composite axis profile, prior = uniform; sample size = receipt count.
  const profile = perAxiom.map((p) => p.contribution);
  const total = profile.reduce((a, b) => a + b, 0);
  const posterior = total > 0 ? profile.map((v) => v / total) : profile.map(() => 1 / profile.length);
  const prior = profile.map(() => 1 / profile.length);
  const tail = pacBayesTailBound(prior, posterior, receipts.length, 0.05);

  // Bekenstein per-receipt entropy cap (bits) for a 1 J / 1 m bounded region.
  const capBits = bekensteinCap(BEKENSTEIN_ENERGY_J, BEKENSTEIN_RADIUS_M);
  const bekensteinRespected = receipts.every((r) =>
    withinBekensteinCap(r.bits, BEKENSTEIN_ENERGY_J, BEKENSTEIN_RADIUS_M),
  );

  // Reidemeister class of the receipt-knot chain assembled from crossings.
  const chain: ReceiptKnotChain = receipts
    .filter((r) => r.crossesUnder !== undefined)
    .map((r) => ({ over: r.id, under: r.crossesUnder as string }));
  // If no crossings were declared, the chain is the single-strand identity (R1).
  const rClass: ReidemeisterClass =
    chain.length === 0 ? "R1" : reidemeisterClass(chain);

  return {
    compositeLambda,
    perAxiom,
    pacBayesTailBound: tail,
    bekensteinCapBits: capBits,
    bekensteinRespected,
    reidemeisterClass: rClass,
    receiptCount: receipts.length,
    axiomCount: axioms.length,
    uniqueAxiomCount,
  };
}

/** Doctrine v7 axiom set: 15 axioms, 14 unique (one duplicate collapses). */
export const DOCTRINE_V7_AXIOMS: readonly Axiom[] = [
  { name: "A01-monotone" },
  { name: "A02-homogeneous" },
  { name: "A03-diagonal-normalized" },
  { name: "A04-bounded" },
  { name: "A05-zero-pinned" },
  { name: "A06-receipt-transduction" },
  { name: "A07-round-trip-body" },
  { name: "A08-doctrine-cross-invariant" },
  { name: "A09-khipu-checksum" },
  { name: "A10-shor-majority-decode" },
  { name: "A11-css-distance" },
  { name: "A12-kitaev-threshold" },
  { name: "A13-two-witness-dual" },
  { name: "A14-hash-audit-integrity" },
  // The 15th raw axiom duplicates A14 (SHA-256 audit integrity appears in two
  // Lean files); it collapses to 14 unique — see lean/LEAN_NUMBERS.
  { name: "A15-hash-audit-integrity-dup", duplicateOf: "A14-hash-audit-integrity" },
] as const;
