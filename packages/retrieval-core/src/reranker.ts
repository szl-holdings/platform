/**
 * AEEP Retrieval — Reranker
 *
 * Provides Reciprocal Rank Fusion (RRF) for fusing multiple ranked lists.
 * RRF is the default reranker for hybrid queries.
 */
import type { RetrievalChunk } from "@szl-holdings/shared-contracts";

const RRF_K = 60;

/**
 * Reciprocal Rank Fusion over multiple ranked lists.
 * Each list is a ranked array of chunks (highest score first).
 */
export function reciprocalRankFusion(
  rankedLists: RetrievalChunk[][],
  topK = 10,
): RetrievalChunk[] {
  const scoreMap = new Map<string, { chunk: RetrievalChunk; rrf: number }>();

  for (const list of rankedLists) {
    list.forEach((chunk, rank) => {
      const existing = scoreMap.get(chunk.chunkId);
      const rrfScore = 1 / (RRF_K + rank + 1);
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

/**
 * Filter chunks below a minimum score threshold.
 */
export function applyScoreThreshold(
  chunks: RetrievalChunk[],
  minScore: number,
): RetrievalChunk[] {
  return chunks.filter((c) => c.score >= minScore);
}
