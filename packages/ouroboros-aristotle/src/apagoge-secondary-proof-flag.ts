/**
 * Primitive 90 — Apagôgê secondary-proof flag (ἀπαγωγὴ εἰς τὸ ἀδύνατον)
 *
 * Prior Analytics I–II + Posterior Analytics I.26: reduction to the
 * impossible is logically valid but epistemically inferior to direct
 * demonstration. Reductio establishes a conclusion by eliminating
 * the contradictory rather than by exhibiting the cause; it does not
 * yield full scientific understanding even when sound.
 *
 * This primitive does NOT block reductio. It tags it. When a direct
 * proof is available, it issues a PREFER_DIRECT advisory. When the
 * conclusion requires causal explanation (dioti-level), it stacks an
 * EPISTEMIC_DOWNGRADE on top.
 */

export type ProofMethod = "direct" | "reductio" | "mixed";

export interface ProofMethodClaim {
  proofId: string;
  method: ProofMethod;
  conclusion: string;
  /** Whether the proof attempts ¬C → ⊥ → C */
  reductioStructure?: { assumption: string; derivedContradiction: string };
  /** Whether a direct (positive middle term) proof is constructible for the same conclusion */
  directProofAvailable: boolean;
  /** Whether the conclusion requires causal explanation (e.g. graded dioti by primitive 86) */
  requiresDiotiExplanation: boolean;
}

export type ProofTag = "dioti-grade" | "valid-indirect" | "prefer-direct" | "epistemic-downgrade";

export interface ApagogeResult {
  ok: boolean;
  tags: ProofTag[];
  reason: string;
}

export function apagogeSecondaryFlag(claim: ProofMethodClaim): ApagogeResult {
  const tags: ProofTag[] = [];

  if (claim.method === "direct") {
    return { ok: true, tags: ["dioti-grade"], reason: "direct demonstration — full scientific grade" };
  }
  if (claim.method === "reductio" || claim.method === "mixed") {
    if (!claim.reductioStructure) {
      return { ok: false, tags: [], reason: "method declared reductio but no reductioStructure provided" };
    }
    tags.push("valid-indirect");
    if (claim.directProofAvailable) tags.push("prefer-direct");
    if (claim.requiresDiotiExplanation) tags.push("epistemic-downgrade");
    return {
      ok: true,
      tags,
      reason: tags.length > 1
        ? "reductio is valid but flagged: " + tags.slice(1).join(", ")
        : "reductio valid; no direct proof available and no dioti requirement",
    };
  }
  return { ok: false, tags: [], reason: `unknown proof method: ${claim.method}` };
}
