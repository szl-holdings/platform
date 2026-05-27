// Putnam-harness receipt classes. Every attempt against a Putnam problem
// produces a hash-chained ladder of receipts; the ladder is the verifiable
// artefact, the answer is just one element of it. No receipt may be backdated
// or forged; every entry binds its parent's hash and freshness nonce.

import { createHash } from "node:crypto";

export interface ReceiptCommon {
  readonly receiptClass: string;
  readonly freshnessNonce: string;
  readonly issuedAt: string;
  readonly tenant: string;
  readonly parentRef: string | null;
}

export interface PutnamProblemReceipt extends ReceiptCommon {
  readonly receiptClass: "putnam.problem.v1";
  readonly competitionId: "putnam-2025";
  readonly problemIdx: number;
  readonly points: number;
  readonly problemHash: string;
  readonly gradingSchemeHash: string;
}

export interface PutnamCandidateReceipt extends ReceiptCommon {
  readonly receiptClass: "putnam.candidate.v1";
  readonly problemRef: string;
  readonly candidateIdx: number;
  readonly strategy: string; // e.g. "direct", "contradiction", "induction"
  readonly model: string;
  readonly proofHash: string;
  readonly proofLen: number;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly wallMs: number;
}

export interface PutnamContradictionReceipt extends ReceiptCommon {
  readonly receiptClass: "putnam.contradiction.v1";
  readonly problemRef: string;
  readonly candidateRefs: ReadonlyArray<string>;
  readonly agreement: number; // jaccard over claim-set
  readonly agreed: boolean;
  readonly escalated: boolean; // true if we forced a deeper attempt
}

export interface PutnamLeanCheckReceipt extends ReceiptCommon {
  readonly receiptClass: "putnam.lean.check.v1";
  readonly problemRef: string;
  readonly stub: string; // the Lean 4 stub we attempted to elaborate
  readonly elaborated: boolean;
  readonly proofProvided: boolean; // false = stub only; problem has no closed-form Lean encoding
  readonly toolchainAvailable: boolean; // false ⇒ elaborated is unverifiable, not a tick
  readonly stderr: string;
}

export interface PutnamJudgeReceipt extends ReceiptCommon {
  readonly receiptClass: "putnam.judge.v1";
  readonly problemRef: string;
  readonly candidateRef: string;
  readonly judgeModel: string;
  readonly rubricItems: ReadonlyArray<{
    readonly partId: number;
    readonly title: string;
    readonly maxPoints: number;
    readonly awarded: number;
    readonly justification: string;
  }>;
  readonly totalAwarded: number;
  readonly totalPossible: number;
  readonly verdict: "correct" | "partial" | "incorrect" | "abstained";
}

export interface PutnamAttemptReceipt extends ReceiptCommon {
  readonly receiptClass: "putnam.attempt.v1";
  readonly problemRef: string;
  readonly candidateReceiptRefs: ReadonlyArray<string>;
  readonly contradictionReceiptRef: string | null;
  readonly leanReceiptRef: string | null;
  readonly judgeReceiptRef: string;
  readonly finalScore: number;
  readonly finalPossible: number;
  readonly verdict: "correct" | "partial" | "incorrect" | "abstained";
  readonly receiptChainHead: string; // sha256 over the ordered chain
}

export interface PutnamGaugeReceipt extends ReceiptCommon {
  readonly receiptClass: "putnam.gauge.v1";
  readonly competitionId: "putnam-2025";
  readonly attemptRefs: ReadonlyArray<string>;
  readonly problemsAttempted: number;
  readonly problemsCorrect: number;
  readonly problemsPartial: number;
  readonly problemsIncorrect: number;
  readonly problemsAbstained: number;
  readonly totalAwarded: number;
  readonly totalPossible: number;
  readonly score01: number; // awarded / possible
  readonly wallSeconds: number;
  readonly modelRoster: ReadonlyArray<string>;
  readonly primitiveRoster: ReadonlyArray<string>;
  readonly receiptChainHead: string;
}

export function sha256Hex(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha256").update(text).digest("hex");
}

export function chainHead(refs: ReadonlyArray<string>): string {
  return sha256Hex(refs.join("\n"));
}

/**
 * Content-addressed receipt reference. The hash binds EVERY field of the
 * receipt (including `parentRef` and `freshnessNonce`), so any post-hoc
 * mutation to a receipt body invalidates downstream chain heads. This is
 * what gives the published gauge its "rebuild it yourself" property.
 *
 * Canonical JSON: keys sorted recursively so two semantically-identical
 * receipts produce the same hash regardless of insertion order.
 */
export function receiptRef(r: ReceiptCommon): string {
  return `${r.receiptClass}:${sha256Hex(canonicalJson(r)).slice(0, 16)}`;
}

export function receiptHash(r: ReceiptCommon): string {
  return sha256Hex(canonicalJson(r));
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson((value as Record<string, unknown>)[k])).join(",") + "}";
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nonce(): string {
  return createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 16);
}
