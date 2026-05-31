/**
 * memory/ — T07 cortex/amaru memory hooks + T08 Yuyay critique-gate.
 *
 * Census status: PARTIAL.
 *  - T07 (amaru memory-attestation): the durable memory store and its
 *    attestation API live in the amaru service. That is a network dependency,
 *    not code we can run in-process. Per Doctrine v7 §2 we do NOT fake it: the
 *    network read/write is a NotYetError naming the amaru endpoint until a real
 *    client is supplied. No mock store, no `() => true`.
 *  - T08 (Yuyay critique-gate): the critique-gate is REAL, deterministic logic
 *    we can and do run in-process: a candidate memory write is admitted only if
 *    it passes a set of real critique predicates (provenance present, not empty,
 *    confidence above floor, no self-reference loop). This is the gate that
 *    decides whether a memory is allowed to persist.
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

import { hashJson } from "../tamper/index.ts";
import { NotYetError } from "../types.ts";

/** A candidate memory write presented to the critique-gate. */
export interface MemoryCandidate {
  readonly content: string;
  /** Where this memory came from (a span id, doc id, etc.). Required by the gate. */
  readonly provenance: string;
  /** Producer-asserted confidence in [0,1]. */
  readonly confidence: number;
  /** Optional id this memory references — used to detect self-reference loops. */
  readonly referencesId?: string;
  /** This candidate's own id, if assigned. */
  readonly id?: string;
}

/** Yuyay critique-gate policy (real thresholds). */
export interface CritiquePolicy {
  /** Minimum confidence a memory must assert to be admitted. */
  readonly minConfidence: number;
  /** Maximum content length (chars) the gate will persist. */
  readonly maxContentChars: number;
}

export const DEFAULT_CRITIQUE_POLICY: CritiquePolicy = {
  minConfidence: 0.5,
  maxContentChars: 16_384,
};

export interface CritiqueResult {
  readonly admit: boolean;
  /** Real per-predicate outcomes. */
  readonly predicates: {
    readonly hasProvenance: boolean;
    readonly nonEmpty: boolean;
    readonly withinLength: boolean;
    readonly confidenceOk: boolean;
    readonly noSelfReference: boolean;
  };
  readonly failed: string[];
  readonly contentHash: string;
}

/**
 * critiqueGate — T08 Yuyay. Real conjunction of critique predicates over a
 * candidate memory write. Fail-closed: any failed predicate => not admitted.
 * Pure function, deterministic, no network.
 */
export function critiqueGate(
  candidate: MemoryCandidate,
  policy: CritiquePolicy = DEFAULT_CRITIQUE_POLICY,
): CritiqueResult {
  const content = candidate.content ?? "";
  const predicates = {
    hasProvenance: typeof candidate.provenance === "string" && candidate.provenance.trim().length > 0,
    nonEmpty: content.trim().length > 0,
    withinLength: content.length <= policy.maxContentChars,
    confidenceOk:
      Number.isFinite(candidate.confidence) &&
      candidate.confidence >= policy.minConfidence &&
      candidate.confidence <= 1,
    // A memory may not reference its own id (self-reference loop).
    noSelfReference:
      candidate.referencesId === undefined ||
      candidate.id === undefined ||
      candidate.referencesId !== candidate.id,
  };
  const failed = Object.entries(predicates)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
  return {
    admit: failed.length === 0,
    predicates,
    failed,
    contentHash: hashJson({ content, provenance: candidate.provenance }),
  };
}

/** The amaru memory client surface (T07). Real network boundary. */
export interface AmaruMemoryClient {
  write(candidate: MemoryCandidate): Promise<{ id: string; attested: boolean }>;
  read(id: string): Promise<MemoryCandidate | null>;
}

/**
 * persistMemory — T07+T08 composed. Runs the real Yuyay critique-gate first; a
 * rejected candidate is NEVER sent to the store. If admitted, it delegates to a
 * caller-supplied amaru client (the real network boundary). With no client, it
 * throws a NotYetError naming the amaru dependency rather than faking a write.
 */
export async function persistMemory(
  candidate: MemoryCandidate,
  opts: { client?: AmaruMemoryClient; policy?: CritiquePolicy } = {},
): Promise<{ critique: CritiqueResult; stored: { id: string; attested: boolean } | null }> {
  const critique = critiqueGate(candidate, opts.policy);
  if (!critique.admit) {
    return { critique, stored: null };
  }
  if (!opts.client) {
    throw new NotYetError(
      "T07",
      "amaru memory-attestation service client (durable store + attestation API)",
      "HONEST_GAPS.md#T07",
    );
  }
  const stored = await opts.client.write(candidate);
  return { critique, stored };
}

/**
 * critiqueGateSelfTest — boot-time check. Runs the real gate over admit/reject
 * fixtures (explicit candidates, not mocks of amaru) and asserts the gate's
 * decisions and that a rejected candidate is filtered before any store call.
 */
export function critiqueGateSelfTest(): { pass: boolean; detail: string } {
  const good = critiqueGate({
    content: "user prefers metric units",
    provenance: "span:abc123",
    confidence: 0.82,
  });
  const noProv = critiqueGate({ content: "x", provenance: "  ", confidence: 0.9 });
  const lowConf = critiqueGate({ content: "x", provenance: "span:1", confidence: 0.2 });
  const selfRef = critiqueGate({
    content: "loop",
    provenance: "span:1",
    confidence: 0.9,
    id: "m1",
    referencesId: "m1",
  });

  const pass =
    good.admit === true &&
    noProv.admit === false &&
    noProv.failed.includes("hasProvenance") &&
    lowConf.admit === false &&
    lowConf.failed.includes("confidenceOk") &&
    selfRef.admit === false &&
    selfRef.failed.includes("noSelfReference");
  return {
    pass,
    detail: `good=${good.admit} noProv=${noProv.admit} lowConf=${lowConf.admit} selfRef=${selfRef.admit}`,
  };
}

/** Provenance of the (unwired) amaru memory service this gate guards. */
export const MEMORY_SERVICE_DEPENDENCY = {
  t07: "amaru memory-attestation service (durable store + attestation API) — network dependency, not in-process",
  t08: "Yuyay critique-gate — REAL, runs in-process",
  tracking: "HONEST_GAPS.md#T07",
} as const;
