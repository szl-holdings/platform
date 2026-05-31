/**
 * lean/ — T19 Lean theorem-name registry mapped to runtime asserts.
 *
 * This is the bridge between the formal corpus (lutar-lean) and the runtime
 * kernel: for each thesis it records WHICH thesis id → WHICH .lean file →
 * WHICH theorem name → WHICH runtime assertion re-checks it operationally.
 *
 * Honest status per entry (copied from INVARIANT_THESIS_SYNTHESIS.md and
 * THESIS_CODE_BACKING.md, verified against the local lutar-lean read):
 *   - "proven"            = sorry-free, machine-checked in Lean.
 *   - "axiom-conditional" = proven given a labelled axiom (e.g. SHA-256 A15).
 *   - "sorry"             = carries an undischarged sorry (e.g. CAUCHY_ND).
 *   - "shell"             = `:= True` tracked-obligation placeholder.
 *
 * Canonical Lean numbers (AGENT_DOCTRINE_ENFORCEMENT.md @ 3de37e5, main builds
 * clean): 752 declarations / 15 raw axioms (14 unique) / 160 sorry tokens.
 * Source of truth: szl-holdings/.github/.github/data/lean_numbers.json.
 *
 * NO new axiom is introduced here (Doctrine v7 §3). This module only NAMES
 * existing theorems and points each at a runtime assertion already implemented
 * in another module — it asserts nothing in Lean.
 */

import type { ThesisId } from "../types.ts";

export interface LeanEntry {
  readonly thesis: ThesisId;
  /** .lean file path under lutar-lean/. */
  readonly file: string;
  /** Theorem / lemma name. */
  readonly theorem: string;
  readonly leanStatus: "proven" | "axiom-conditional" | "sorry" | "shell";
  /** module:function whose runtime assertion mirrors this theorem (or null). */
  readonly runtimeAssert: string | null;
}

export const LEAN_REGISTRY: readonly LeanEntry[] = [
  { thesis: "T01", file: "Lutar/Bound.lean", theorem: "Λ_le_max", leanStatus: "proven", runtimeAssert: "invariants/boundCheck" },
  { thesis: "T01", file: "Lutar/Bound.lean", theorem: "min_le_Λ", leanStatus: "proven", runtimeAssert: "invariants/boundCheck" },
  { thesis: "T01", file: "Lutar/Uniqueness.lean", theorem: "lambda_isMonotone", leanStatus: "proven", runtimeAssert: "invariants/satisfiesAxioms.a1Monotone" },
  { thesis: "T01", file: "Lutar/Uniqueness.lean", theorem: "lambda_satisfiesAxioms", leanStatus: "proven", runtimeAssert: "invariants/satisfiesAxioms" },
  { thesis: "T01", file: "Lutar/Uniqueness.lean", theorem: "lutar_is_geomean", leanStatus: "sorry", runtimeAssert: null },
  { thesis: "T02", file: "Lutar/Thesis/TH_V18_01_AgentLoopTerminates.lean", theorem: "th_v18_01_terminates", leanStatus: "proven", runtimeAssert: "loop/terminates" },
  { thesis: "T02", file: "Lutar/Thesis/TH_V18_01_AgentLoopTerminates.lean", theorem: "done_unique_fixed_point", leanStatus: "proven", runtimeAssert: "loop/uniqueFixedPoint" },
  { thesis: "T03", file: "Lutar/Lambda/SchurConcave.lean", theorem: "lambda_two_axis_schur_concave", leanStatus: "proven", runtimeAssert: "lambda_axis/lambdaOverAxes" },
  { thesis: "T03", file: "Lutar/Lambda/SchurConcave.lean", theorem: "lambda_schur_concave_n_axis", leanStatus: "sorry", runtimeAssert: null },
  { thesis: "T04", file: "Lutar/Transduction/ReceiptInvariant.lean", theorem: "receipt_transduction_invariant", leanStatus: "proven", runtimeAssert: "ledger/verify" },
  { thesis: "T04", file: "Lutar/Transduction/ReceiptInvariant.lean", theorem: "receipt_round_trip_preserves_body", leanStatus: "proven", runtimeAssert: "ledger/verify" },
  { thesis: "T05", file: "Lutar/Doctrine/CrossComponentInvariant.lean", theorem: "doctrine_cross_invariant", leanStatus: "proven", runtimeAssert: "doctrine/doctrineCrossInvariant" },
  { thesis: "T05", file: "Lutar/Doctrine/CrossComponentInvariant.lean", theorem: "doctrine_cross_contrapositive_tracked", leanStatus: "shell", runtimeAssert: "gates/evaluateGates (admission enforces contrapositive at runtime)" },
  { thesis: "T08", file: "Lutar/Doctrine/PublicClaims.lean", theorem: "doctrine_incentive_compatible", leanStatus: "sorry", runtimeAssert: null },
  { thesis: "T09", file: "Lutar/Khipu/SummationInvariant.lean", theorem: "khipuReceipt_checksum_invariant", leanStatus: "proven", runtimeAssert: "khipu/bumpDetected" },
  { thesis: "T09", file: "Lutar/Thesis/TH_V18_08_KhipuChecksumInvariant.lean", theorem: "th_v18_08 (helpers)", leanStatus: "sorry", runtimeAssert: null },
  { thesis: "T10", file: "Lutar/QEC/CSSBridge.lean", theorem: "css_bridge_preserves_distance", leanStatus: "proven", runtimeAssert: "qec/cssConsistent" },
  { thesis: "T10", file: "Lutar/QEC/KitaevSurface.lean", theorem: "kitaev_threshold_below_threshold", leanStatus: "proven", runtimeAssert: "qec/vertexParity" },
  { thesis: "T10", file: "Lutar/QEC/ShorReceiptCode.lean", theorem: "shor_majority_decode", leanStatus: "proven", runtimeAssert: "qec/encodeCorruptRecover" },
  { thesis: "T11", file: "Lutar/Thesis/TH_V18_02_DoctrineLabelFintype.lean", theorem: "doctrine_label_fintype", leanStatus: "proven", runtimeAssert: "doctrine/bannedTokenScan" },
  { thesis: "T11", file: "Lutar/Thesis/TH_V18_03_KraftInequality.lean", theorem: "kraft_inequality", leanStatus: "proven", runtimeAssert: null },
  { thesis: "T12", file: "Lutar/PACBayes/PACBayes.lean", theorem: "pac_bayes_bound (axiom MomentSubGaussian)", leanStatus: "axiom-conditional", runtimeAssert: "forecast/pacBayesBound" },
  { thesis: "T17", file: "Lutar/TwoWitness.lean", theorem: "two_witness_dual", leanStatus: "proven", runtimeAssert: "rag/wrapRetrieval (dual-witness envelope)" },
  { thesis: "T18", file: "Lutar/Thesis/TH_V18_14_SHA256CollisionHonest.lean", theorem: "th_v18_14c_hash_audit_integrity", leanStatus: "axiom-conditional", runtimeAssert: "tamper/verifyChain" },
  { thesis: "T18", file: "Lutar/TwoWitness.lean", theorem: "TwoWitness", leanStatus: "proven", runtimeAssert: "tamper/verifySignature" },
] as const;

/** Canonical Lean corpus numbers (do not fabricate — source: lean_numbers.json). */
export const LEAN_NUMBERS = {
  declarations: 752,
  rawAxioms: 15,
  uniqueAxioms: 14,
  sorryTokens: 160,
  buildingSha: "3de37e5",
  source: "szl-holdings/.github/.github/data/lean_numbers.json",
} as const;

/** All registry entries for a thesis. */
export function theoremsFor(thesis: ThesisId): LeanEntry[] {
  return LEAN_REGISTRY.filter((e) => e.thesis === thesis);
}

/** Count entries by Lean status (honest tally for the boot report). */
export function statusTally(): Record<LeanEntry["leanStatus"], number> {
  const tally = { proven: 0, "axiom-conditional": 0, sorry: 0, shell: 0 } as Record<LeanEntry["leanStatus"], number>;
  for (const e of LEAN_REGISTRY) tally[e.leanStatus] += 1;
  return tally;
}
