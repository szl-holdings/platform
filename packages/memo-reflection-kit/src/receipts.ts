// Doctrine V6 receipt classes emitted by this kit.
//
// Re-expressed from MeMo (Memory as a Model, arXiv 2605.15156) against the
// content-addressed receipt-chain discipline established by the Putnam
// harness and the sparse-attention-kit. Every receipt class is on the
// critical path of either the reflection-corpus build or an executive
// three-stage run.
//
// Receipts are typed shapes ONLY — emit/persist transport is owned by the
// api-server. This package never reaches out to a transport.
//
// Receipt-ref discipline (mirrors putnam-harness):
//   receiptRef = `${receiptClass}:${sha256(canonicalJson(body)).slice(0, 16)}`
// Mutate any field (including freshnessNonce or parentRef) and the ref
// changes; every downstream chain head that referenced it breaks.

export const RECEIPT_CLASSES = [
  "memo.reflection.v1",
  "memo.verification.v1",
  "memo.corpus.manifest.v1",
  "memo.executive.admitted.v1",
  "memo.executive.rejected.v1",
  "memo.grounding.v1",
  "memo.entity.identification.v1",
  "memo.answer.synthesis.v1",
  "memo.executive.run.v1",
  "memo.contradiction.v1",
  "memo.escalated.v1",
  "memo.grounding.parity.violated.v1",
  "memo.budget.exhausted.v1",
] as const;

export type MemoReceiptClass = (typeof RECEIPT_CLASSES)[number];

export interface MemoReceiptCommon {
  readonly receiptClass: MemoReceiptClass;
  readonly freshnessNonce: string;
  readonly issuedAt: string; // ISO 8601 UTC
  readonly parentRef: string | null; // chain to upstream receipt
  readonly tenant: string;
}

export function isMemoReceiptClass(s: string): s is MemoReceiptClass {
  return (RECEIPT_CLASSES as readonly string[]).includes(s);
}

/**
 * Canonical JSON serialiser: sorted object keys, no whitespace, no trailing
 * newline. Mirrors the discipline used in packages/putnam-harness/src/receipts.ts.
 * This is the ONLY serialiser permitted for computing a receipt content-hash.
 */
export function canonicalJson(value: unknown): string {
  if (typeof value === "number" && !Number.isFinite(value)) {
    // JSON.stringify silently emits "null" for NaN/Infinity, which would
    // make two semantically distinct receipts collide on the same hash.
    // Refuse to serialise — caller must use a finite value or explicit null.
    throw new Error(
      `canonicalJson: non-finite number ${String(value)} would collide with null after serialisation; refuse to hash`,
    );
  }
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((v) => canonicalJson(v)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k]))
      .join(",") +
    "}"
  );
}

/**
 * Compute a content-addressed receipt ref. Uses Node's webcrypto for
 * portability across edge runtimes.
 */
export async function computeReceiptRef<R extends MemoReceiptCommon>(
  body: R,
): Promise<string> {
  const enc = new TextEncoder().encode(canonicalJson(body));
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${body.receiptClass}:${hex.slice(0, 16)}`;
}
