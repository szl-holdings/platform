/**
 * Primitive 40 — Hermetic seal (tamper-evident envelope)
 *
 * "It is true, without falsehood, certain and most true."
 * A hermetic seal binds payload + provenance into a single
 * SHA-256 digest. Any byte-level change to either the payload
 * or the provenance metadata breaks the seal.
 */

import { createHash } from "node:crypto";

export interface HermeticEnvelope {
  payload: string;
  provenance: {
    author: string;
    timestamp: string;     // ISO-8601
    sourceUri: string;
  };
  seal: string;            // SHA-256 hex of canonical(payload + provenance)
}

export interface SealVerification {
  valid: boolean;
  expected: string;
  observed: string;
  rationale: string;
}

function canonicalise(
  payload: string,
  provenance: HermeticEnvelope["provenance"],
): string {
  return JSON.stringify({
    payload,
    author: provenance.author,
    timestamp: provenance.timestamp,
    sourceUri: provenance.sourceUri,
  });
}

export function sealEnvelope(
  payload: string,
  provenance: HermeticEnvelope["provenance"],
): HermeticEnvelope {
  const canonical = canonicalise(payload, provenance);
  const seal = createHash("sha256").update(canonical).digest("hex");
  return { payload, provenance, seal };
}

export function verifySeal(env: HermeticEnvelope): SealVerification {
  const expected = createHash("sha256")
    .update(canonicalise(env.payload, env.provenance))
    .digest("hex");
  const valid = expected === env.seal;
  return {
    valid,
    expected,
    observed: env.seal,
    rationale: valid
      ? "hermetic seal intact: payload and provenance unchanged"
      : "seal broken: payload or provenance has been altered",
  };
}
