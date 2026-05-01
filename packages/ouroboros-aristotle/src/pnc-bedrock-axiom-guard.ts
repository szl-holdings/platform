/**
 * Primitive 91 — PNC bedrock-axiom guard (τὸ βεβαιότατον ἀξίωμα)
 *
 * Metaphysics Γ.3, 1005b19: "It is impossible for the same thing to
 * belong and not belong to the same thing at the same time and in
 * the same respect." Γ.4, 1006a10: anyone who demands a proof of PNC
 * is missing the point — a proof of PNC would presuppose PNC and
 * generate infinite regress. Posterior Analytics I.11: PNC is not a
 * premise in any demonstration but is presupposed by all of them.
 *
 * The guard catches three category errors:
 *   (1) attempts to prove PNC by deduction
 *   (2) inferences whose conclusion entails (A ∧ ¬A)
 *   (3) treating PNC as a revisable hypothesis within a genus
 */

export interface PncAttempt {
  attemptId: string;
  /** True if the proof tries to derive PNC itself as a conclusion */
  triesToProvePnc: boolean;
  /** Pairs (a, ¬a) the inference simultaneously asserts true */
  contradictoryPairs: Array<{ a: string; notA: string }>;
  /** True if the system treats PNC as merely one revisable axiom of a genus */
  treatsPncAsRevisable: boolean;
}

export type PncBlockKind = "circular" | "contradiction" | "revisable";

export interface PncResult {
  ok: boolean;
  reason: string;
  block?: PncBlockKind;
}

export function pncBedrockAxiomGuard(attempt: PncAttempt): PncResult {
  if (attempt.triesToProvePnc) {
    return {
      ok: false,
      reason: "PNC cannot be proved — any proof presupposes it (Metaphysics Γ.4, 1006a10)",
      block: "circular",
    };
  }
  if (attempt.contradictoryPairs.length > 0) {
    const first = attempt.contradictoryPairs[0]!;
    return {
      ok: false,
      reason: `inference asserts both ${first.a} and ${first.notA} simultaneously — PNC violation`,
      block: "contradiction",
    };
  }
  if (attempt.treatsPncAsRevisable) {
    return {
      ok: false,
      reason: "PNC is the firmest axiom; not revisable as a genus-internal hypothesis",
      block: "revisable",
    };
  }
  return { ok: true, reason: "PNC respected as background presupposition" };
}
