/**
 * rag/ — T17 Agentic RAG governance envelope.
 *
 * Census status: PARTIAL. The retrieval primitives (bge-m3 embedder service,
 * pgvector store) are built in the platform but are NOT on the shipping request
 * path, and there is no CRAG / critic gate wired yet (see HONEST_GAPS.md item
 * "T17: retrieval primitives unwired"). What this module ships TODAY is the real
 * governance envelope: a deterministic policy that wraps any retrieval call,
 * evaluates it against an admission policy, and emits a governance receipt. The
 * envelope is real math + real policy; the embedder/vector-store call is a real
 * network call when an endpoint is supplied, and an honest NotYetError when it
 * is not (no fabricated documents, no mock vectors).
 *
 * Service dependency (documented): a running bge-m3 embedder (default
 * http://localhost:8080/embed per apps/alloy-embedding-api/RUNBOOK.md) and a
 * pgvector store. These are infrastructure, not code — the kernel boots without
 * them and the governance envelope still runs over a caller-provided retriever.
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

import { hashJson } from "../tamper/index.ts";
import { NotYetError } from "../types.ts";

/** A single retrieved chunk with a real similarity score in [0,1]. */
export interface RetrievedChunk {
  readonly id: string;
  readonly text: string;
  /** Cosine similarity in [0,1] from the vector store. */
  readonly score: number;
}

/** A retriever the caller supplies — the real network boundary (bge-m3 + pgvector). */
export type Retriever = (query: string, k: number) => Promise<RetrievedChunk[]>;

/** Admission policy for a retrieval result (the governance, not the search). */
export interface RetrievalPolicy {
  /** Minimum cosine similarity a chunk must clear to be admitted. */
  readonly minScore: number;
  /** Maximum number of chunks the envelope will admit downstream. */
  readonly maxChunks: number;
  /** Minimum number of admitted chunks below which the answer is refused (CRAG-style). */
  readonly minAdmitted: number;
}

export const DEFAULT_RETRIEVAL_POLICY: RetrievalPolicy = {
  minScore: 0.35,
  maxChunks: 8,
  minAdmitted: 1,
};

/** Governance receipt for one wrapped retrieval — real, hash-anchored. */
export interface RetrievalReceipt {
  readonly query: string;
  readonly queryHash: string;
  readonly retrieved: number;
  readonly admitted: number;
  readonly rejected: number;
  readonly meanAdmittedScore: number;
  /** "answer" if enough evidence cleared the gate, else "refuse" (fail-closed). */
  readonly decision: "answer" | "refuse";
  readonly policy: RetrievalPolicy;
  readonly bodyHash: string;
}

export interface WrappedRetrieval {
  readonly chunks: readonly RetrievedChunk[];
  readonly receipt: RetrievalReceipt;
}

/**
 * cosineSimilarity — real cosine over two equal-length numeric vectors. Used to
 * score embedder output against stored vectors when the caller does scoring
 * client-side. Returns a value in [-1, 1].
 */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) {
    throw new Error("cosineSimilarity: vectors must be non-empty and equal length");
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * evaluate — the real governance step. Given retrieved chunks and a policy,
 * admits chunks clearing minScore (up to maxChunks), computes the mean admitted
 * score, and decides answer/refuse fail-closed (refuse unless minAdmitted clear
 * the gate). Pure function — deterministic, no network.
 */
export function evaluate(
  query: string,
  retrieved: readonly RetrievedChunk[],
  policy: RetrievalPolicy = DEFAULT_RETRIEVAL_POLICY,
): WrappedRetrieval {
  const admitted = retrieved
    .filter((c) => c.score >= policy.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, policy.maxChunks);
  const rejected = retrieved.length - admitted.length;
  const meanAdmittedScore =
    admitted.length === 0
      ? 0
      : admitted.reduce((s, c) => s + c.score, 0) / admitted.length;
  const decision: "answer" | "refuse" =
    admitted.length >= policy.minAdmitted ? "answer" : "refuse";

  const queryHash = hashJson(query);
  const body = {
    query,
    queryHash,
    retrieved: retrieved.length,
    admitted: admitted.length,
    rejected,
    meanAdmittedScore,
    decision,
    policy,
  };
  const receipt: RetrievalReceipt = { ...body, bodyHash: hashJson(body) };
  return { chunks: admitted, receipt };
}

/**
 * wrapRetrieval — wraps a caller-supplied retriever (the real bge-m3 + pgvector
 * boundary) in the governance envelope. If no retriever is supplied, throws a
 * NotYetError naming the missing service rather than fabricating documents.
 */
export async function wrapRetrieval(
  query: string,
  opts: { retriever?: Retriever; k?: number; policy?: RetrievalPolicy } = {},
): Promise<WrappedRetrieval> {
  const policy = opts.policy ?? DEFAULT_RETRIEVAL_POLICY;
  const k = opts.k ?? policy.maxChunks;
  if (!opts.retriever) {
    throw new NotYetError(
      "T17",
      "running bge-m3 embedder + pgvector retriever on the request path",
      "HONEST_GAPS.md#T17",
    );
  }
  const retrieved = await opts.retriever(query, k);
  return evaluate(query, retrieved, policy);
}

/**
 * governanceSelfTest — boot-time check. Runs the envelope over a deterministic
 * fixture of pre-scored chunks (NOT a mock of the embedder — these are explicit
 * test scores, and the function under test is the real governance math). Asserts
 * the gate admits/refuses correctly and the receipt hash is stable.
 */
export function governanceSelfTest(): {
  pass: boolean;
  detail: string;
} {
  const fixture: RetrievedChunk[] = [
    { id: "a", text: "high", score: 0.91 },
    { id: "b", text: "mid", score: 0.42 },
    { id: "c", text: "low", score: 0.10 },
  ];
  const answered = evaluate("q", fixture, DEFAULT_RETRIEVAL_POLICY);
  const refused = evaluate("q", [{ id: "d", text: "weak", score: 0.05 }], DEFAULT_RETRIEVAL_POLICY);
  const stable = evaluate("q", fixture, DEFAULT_RETRIEVAL_POLICY);

  const admitOk = answered.chunks.length === 2 && answered.receipt.decision === "answer";
  const refuseOk = refused.chunks.length === 0 && refused.receipt.decision === "refuse";
  const hashStable = answered.receipt.bodyHash === stable.receipt.bodyHash;
  const pass = admitOk && refuseOk && hashStable;
  return {
    pass,
    detail: `admit=${answered.chunks.length}(${answered.receipt.decision}) refuse=${refused.chunks.length}(${refused.receipt.decision}) hashStable=${hashStable}`,
  };
}

/** Provenance of the (unwired) retrieval services this envelope governs. */
export const RAG_SERVICE_DEPENDENCY = {
  embedder: "bge-m3 (apps/alloy-embedding-api, default http://localhost:8080/embed)",
  vectorStore: "pgvector",
  status: "primitives built, NOT on shipping request path; no CRAG/critic gate wired",
  tracking: "HONEST_GAPS.md#T17",
} as const;
