/**
 * Receipt construction, hashing, and sealing.
 *
 * A receipt is the auditable, append-only record of a single guardrail
 * decision. It satisfies, in one artifact:
 *
 *   - EU AI Act Article 12 (automatic recording of events)
 *   - NIST SP 800-53 AU-12 (audit record generation)
 *   - SR 11-7 (model risk management ongoing monitoring)
 *   - DoD CDAO RAI "Traceable" tenet (forward-chained provenance)
 *
 * Receipts chain: each new receipt embeds the SHA-256 of the previous
 * receipt's content. Tampering with any link breaks the chain.
 */

import { createHash } from "node:crypto";
import type { GuardrailReceipt, RailDecision, RailVerdict } from "./types.js";

export interface ReceiptInput {
  id: string;
  tenantId: string;
  subject: string;
  rails: RailDecision[];
  prevReceiptHash?: string;
  tenantKeyId: string;
}

export function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const keys = Object.keys(value as object).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalJson((value as Record<string, unknown>)[k]))
      .join(",") +
    "}"
  );
}

function compositeAction(rails: RailDecision[]): RailVerdict {
  const rank: Record<RailVerdict, number> = { PROCEED: 0, QUARANTINE: 1, ABORT: 2 };
  let worst: RailVerdict = "PROCEED";
  for (const r of rails) if (rank[r.verdict] > rank[worst]) worst = r.verdict;
  return worst;
}

function geomean(xs: number[]): number {
  if (xs.length === 0) return 1;
  for (const x of xs) if (x <= 0) return 0;
  return Math.exp(xs.reduce((a, b) => a + Math.log(b), 0) / xs.length);
}

export function buildReceipt(input: ReceiptInput): GuardrailReceipt {
  const lambda = geomean(input.rails.map((r) => r.lambda));
  const action = compositeAction(input.rails);
  const issuedAt = new Date().toISOString();

  const skeleton = {
    version: "1.0.0" as const,
    id: input.id,
    issuedAt,
    tenantId: input.tenantId,
    subject: input.subject,
    lambda,
    action,
    rails: input.rails,
    prevReceiptHash: input.prevReceiptHash,
  };

  const contentHash = sha256Hex(canonicalJson(skeleton));
  const seal = sha256Hex(contentHash + ":" + input.tenantKeyId);

  return { ...skeleton, contentHash, seal };
}

export function verifyReceipt(
  receipt: GuardrailReceipt,
  tenantKeyId: string,
): { valid: boolean; reason?: string } {
  const { seal, contentHash, ...rest } = receipt;
  const recomputedContent = sha256Hex(canonicalJson(rest));
  if (recomputedContent !== contentHash)
    return { valid: false, reason: "content-hash-mismatch" };
  const recomputedSeal = sha256Hex(contentHash + ":" + tenantKeyId);
  if (recomputedSeal !== seal) return { valid: false, reason: "seal-mismatch" };
  return { valid: true };
}

/** Verify a chain of receipts. Returns first broken link or "ok". */
export function verifyReceiptChain(
  chain: GuardrailReceipt[],
  tenantKeyId: string,
): { valid: boolean; brokenAt?: number; reason?: string } {
  for (let i = 0; i < chain.length; i++) {
    const r = chain[i]!;
    const v = verifyReceipt(r, tenantKeyId);
    if (!v.valid) return { valid: false, brokenAt: i, reason: v.reason };
    if (i > 0) {
      const expected = chain[i - 1]!.contentHash;
      if (r.prevReceiptHash !== expected)
        return { valid: false, brokenAt: i, reason: "chain-link-mismatch" };
    }
  }
  return { valid: true };
}
