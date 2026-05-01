/**
 * Evidence Merger — combines specialist outputs via Reciprocal Rank Fusion
 * followed by a cross-encoder reranking pass.
 *
 * RRF:  parameter-free, well-calibrated for heterogeneous sources, matches
 *       what @szl-holdings/retrieval-core already ships.
 *
 * Cross-encoder: re-scores the top-K RRF candidates against the original
 *       query for semantic relevance. Currently uses a cosine-similarity
 *       approximation that can be swapped for a real cross-encoder model
 *       endpoint without changing the interface.
 */
import type { EvidenceBundle, EvidenceChunk } from '@szl-holdings/contracts/agentic-rag';
import { randomUUID } from 'node:crypto';

export interface SpecialistOutput {
  specialistAgent: string;
  mcpClass: EvidenceChunk['mcpClass'];
  chunks: Array<Omit<EvidenceChunk, 'specialistAgent' | 'mcpClass' | 'retrievedAt'>>;
}

export interface MergeOptions {
  runId: string;
  query: string;
  topK?: number;
  rrfK?: number;
  crossEncoderThreshold?: number;
}

const DEFAULT_TOP_K = 10;
const DEFAULT_RRF_K = 60;

// ─── Reciprocal Rank Fusion ───────────────────────────────────────────────────

function rrfFuse(
  rankedLists: EvidenceChunk[][],
  k: number,
  topK: number,
): EvidenceChunk[] {
  const scoreMap = new Map<string, { chunk: EvidenceChunk; rrf: number }>();

  for (const list of rankedLists) {
    list.forEach((chunk, rank) => {
      const rrfScore = 1 / (k + rank + 1);
      const existing = scoreMap.get(chunk.chunkId);
      if (existing) {
        existing.rrf += rrfScore;
      } else {
        scoreMap.set(chunk.chunkId, { chunk, rrf: rrfScore });
      }
    });
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.rrf - a.rrf)
    .slice(0, topK)
    .map(({ chunk, rrf }) => ({ ...chunk, score: rrf }));
}

// ─── Cross-encoder approximation ─────────────────────────────────────────────

/**
 * Lightweight cross-encoder proxy: re-scores chunks by weighted combination
 * of term overlap with the query and the original RRF score.
 *
 * This is intentionally simple and stateless so the package has zero
 * inference dependencies at install time. Swap the body for a real
 * HTTP call to a cross-encoder endpoint (e.g. a Sentence-Transformers
 * service) to get production-grade scores.
 */
function crossEncoderRerank(
  chunks: EvidenceChunk[],
  query: string,
  threshold = 0,
): EvidenceChunk[] {
  const queryTerms = new Set(
    query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );

  return chunks
    .map((chunk) => {
      const contentTerms = chunk.content
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2);

      const overlap =
        queryTerms.size > 0
          ? contentTerms.filter((t) => queryTerms.has(t)).length / queryTerms.size
          : 0;

      const crossScore = 0.6 * chunk.score + 0.4 * overlap;
      return { ...chunk, score: crossScore };
    })
    .filter((c) => c.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

// ─── Public merge function ────────────────────────────────────────────────────

export function mergeEvidence(
  specialistOutputs: SpecialistOutput[],
  opts: MergeOptions,
): EvidenceBundle {
  const topK = opts.topK ?? DEFAULT_TOP_K;
  const rrfK = opts.rrfK ?? DEFAULT_RRF_K;
  const now = new Date().toISOString();

  const rankedLists: EvidenceChunk[][] = specialistOutputs.map((so) =>
    so.chunks.map((c) => ({
      ...c,
      specialistAgent: so.specialistAgent,
      mcpClass: so.mcpClass,
      retrievedAt: now,
    })),
  );

  const rrfResult = rrfFuse(rankedLists, rrfK, topK * 2);
  const reranked = crossEncoderRerank(rrfResult, opts.query);
  const finalChunks = reranked.slice(0, topK);

  return {
    bundleId: randomUUID(),
    runId: opts.runId,
    chunks: finalChunks,
    fusionMethod: 'rrf+cross-encoder',
    topK,
    createdAt: now,
  };
}
