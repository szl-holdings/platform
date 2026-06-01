/**
 * Primitive 74 — Qua-realism gate
 *
 * Aristotle's qua (ᾗ) clause: to study X qua G(X), it must be true
 * that X is G. The geometer studies the bronze sphere QUA volume —
 * but ONLY because volume genuinely belongs to it. To study fiction
 * qua truth is fraud.
 *
 * The gate refuses any claim of the form "study X qua G" unless a
 * verifier has confirmed G(X) holds. This kills the most common
 * failure of model output: applying a frame that doesn't fit.
 */

export interface QuaClaim {
  subjectId: string;
  qua: string; // the predicate G
  evidence: string[]; // verifier outputs proving G(X) is true
}

export interface QuaVerificationResult {
  ok: boolean;
  reason: string;
}

export type Verifier = (subjectId: string, qua: string) => QuaVerificationResult;

export function quaRealismGate(claim: QuaClaim, verifier: Verifier): QuaVerificationResult {
  if (!claim.subjectId || !claim.qua) {
    return { ok: false, reason: "subjectId and qua required" };
  }
  if (claim.evidence.length === 0) {
    return { ok: false, reason: "no evidence supplied — cannot study X qua G without evidence G(X)" };
  }
  return verifier(claim.subjectId, claim.qua);
}

export const trivialTrueVerifier: Verifier = () => ({ ok: true, reason: "verified" });
export const trivialFalseVerifier: Verifier = (s, q) => ({ ok: false, reason: `${s} not ${q}` });
