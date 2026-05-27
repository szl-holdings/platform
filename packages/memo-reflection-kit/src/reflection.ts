// ReflectionEnvelope — typed claim describing one frozen-Generator
// transform over a corpus span. Re-expressed from MeMo's data-synthesis
// pipeline (fact-extract / consolidate / verify / entity-surface /
// cross-doc-synth) against our perception-loop privacy invariant: the
// raw span bytes never enter the receipt — only the span hash and the
// reflection snippet.

import type { MemoReceiptCommon } from "./receipts.js";

export type ReflectionClass =
  | "fact-extract"
  | "consolidate"
  | "verify"
  | "entity-surface"
  | "cross-doc-synth"
  | "provenance";

export interface ReflectionEnvelope {
  /** Stable identifier for the reflection — used as parentRef downstream. */
  readonly reflectionId: string;
  /** Which transform produced this reflection. */
  readonly reflectionClass: ReflectionClass;
  /** SHA-256 (hex, lowercased) of the corpus the reflection derives from. */
  readonly corpusRef: string;
  /** SHA-256 (hex, lowercased) of the specific span within the corpus.
   * The raw span bytes MUST NOT appear anywhere else in the receipt. */
  readonly spanHash: string;
  /** Frozen Generator model identifier (e.g. "qwen2.5-32b-instruct"). */
  readonly generatorModel: string;
  /** Sampling temperature used by the Generator. */
  readonly temperature: number;
  /** Compact natural-language reflection snippet — the Generator's output. */
  readonly snippet: string;
  /** Generator-side token cost. */
  readonly tokensIn: number;
  readonly tokensOut: number;
  /** Wall-clock cost of the Generator call. */
  readonly wallMs: number;
}

export interface MemoReflectionReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.reflection.v1";
  readonly envelope: ReflectionEnvelope;
}

export type VerificationOutcome =
  | "accepted"
  | "rejected-contradiction"
  | "rejected-unsupported"
  | "rejected-out-of-scope";

export interface MemoVerificationReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.verification.v1";
  /** The reflectionRef being verified. */
  readonly verifiedReflectionRef: string;
  readonly outcome: VerificationOutcome;
  /** When rejected: a short, audit-readable reason. */
  readonly explanation: string;
}

export interface ReflectionManifestEntry {
  readonly reflectionRef: string;
  readonly reflectionClass: ReflectionClass;
  /** SHA-256 of the reflection-envelope body (the same hash the ref slices). */
  readonly classHash: string;
}

export interface ReflectionCorpusManifest {
  /** SHA-256 of the source corpus. */
  readonly corpusRef: string;
  /** Frozen Generator identifier used across the corpus build. */
  readonly generatorModel: string;
  /** Ordered list of reflection-manifest entries — order is part of the chain. */
  readonly entries: ReadonlyArray<ReflectionManifestEntry>;
  /** Verification outcomes by reflectionRef — every accepted reflection has one. */
  readonly verifications: Readonly<Record<string, VerificationOutcome>>;
}

export interface MemoCorpusManifestReceipt extends MemoReceiptCommon {
  readonly receiptClass: "memo.corpus.manifest.v1";
  readonly manifest: ReflectionCorpusManifest;
}

/**
 * Privacy invariant check used by the perception-loop-style serialisation
 * test. Returns the list of canary strings that leaked into the snippet —
 * an empty list means the invariant holds. The function is pure; the test
 * harness chooses the canaries.
 *
 * For end-to-end coverage of a full receipt body (not just the snippet),
 * call `findCanaryLeaksInReceipt` instead.
 */
export function findCanaryLeaks(
  snippet: string,
  canaries: ReadonlyArray<string>,
): ReadonlyArray<string> {
  return canaries.filter((c) => snippet.includes(c));
}

const HEX64_SHA256 = /^[0-9a-f]{64}$/;

/**
 * Strict shape check on the two fields the privacy invariant relies on:
 * `spanHash` and `corpusRef` must be lowercase hex sha-256 strings. If a
 * caller smuggled raw bytes into either field instead of a hash, this
 * check fails — closing the loophole that comment-only invariants leave
 * open.
 */
export function assertReflectionHashFormat(envelope: ReflectionEnvelope): void {
  if (!HEX64_SHA256.test(envelope.corpusRef)) {
    throw new Error(
      `assertReflectionHashFormat: corpusRef must be a lowercase hex sha-256 (got ${envelope.corpusRef.length} chars)`,
    );
  }
  if (!HEX64_SHA256.test(envelope.spanHash)) {
    throw new Error(
      `assertReflectionHashFormat: spanHash must be a lowercase hex sha-256 (got ${envelope.spanHash.length} chars)`,
    );
  }
}

/**
 * End-to-end privacy invariant: scans the *canonicalised full receipt*
 * for any canary string, not just the `snippet` field. This closes the
 * loophole where raw bytes could leak through any other string field
 * (e.g. a future metadata field added by a downstream extension). Use
 * this in the serialisation test, alongside `findCanaryLeaks` for the
 * snippet-only check.
 *
 * The canonicalJson serialiser is imported from `./receipts.js` to keep
 * the hash discipline and the privacy discipline in lockstep.
 */
export async function findCanaryLeaksInReceipt(
  receipt: unknown,
  canaries: ReadonlyArray<string>,
): Promise<ReadonlyArray<string>> {
  const { canonicalJson } = await import("./receipts.js");
  const body = canonicalJson(receipt);
  return canaries.filter((c) => body.includes(c));
}
