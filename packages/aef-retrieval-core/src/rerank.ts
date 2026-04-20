import type { NormalizedHit } from "./normalize.js";

/**
 * Lightweight CPU cross-encoder approximation.
 *
 * Computes a term-overlap relevance score between the query and available
 * textual evidence in each hit's metadata (title, section, text content).
 * In production this is replaced by a proper cross-encoder model via the
 * alloy-rank-worker service. The score is recorded in `rerankerScore` so
 * downstream citation assembly surfaces it with full provenance.
 *
 * Stage placement: after score normalization, before citation assembly.
 * This means the reranker can override or re-sort the RRF/boosted ranking
 * with semantic relevance signals — the canonical "second-pass" retrieval gate.
 */
export function rerankHits(
  hits: NormalizedHit[],
  query: string,
  topK?: number,
): NormalizedHit[] {
  if (hits.length === 0) return hits;

  const queryTerms = new Set(
    query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );

  if (queryTerms.size === 0) {
    const limit = topK ?? hits.length;
    return hits.slice(0, limit);
  }

  const scored = hits.map((hit) => {
    // Collect all candidate text from metadata fields
    const textSources: string[] = [];
    for (const val of Object.values(hit.metadata)) {
      if (typeof val === "string") textSources.push(val.toLowerCase());
    }
    const candidateText = textSources.join(" ");
    const candidateTerms = candidateText.split(/\s+/);

    let termHits = 0;
    for (const t of candidateTerms) {
      if (queryTerms.has(t)) termHits++;
    }

    // Precision-weighted overlap: normalise by query term count
    const overlapPrecision = termHits / queryTerms.size;
    // Term frequency density in candidate
    const density =
      candidateTerms.length > 0 ? termHits / candidateTerms.length : 0;

    // Composite reranker score: blend overlap precision + density + base score
    const rerankerScore = Math.min(
      1,
      overlapPrecision * 0.6 + density * 20 * 0.2 + hit.normalizedScore * 0.2,
    );

    return {
      hit,
      rerankerScore,
    };
  });

  const sorted = scored.sort((a, b) => b.rerankerScore - a.rerankerScore);
  const limit = topK ?? sorted.length;

  return sorted.slice(0, limit).map(({ hit, rerankerScore }, idx) => ({
    ...hit,
    normalizedScore: rerankerScore,
    metadata: {
      ...hit.metadata,
      rerankerScore,
      rerankerRank: idx + 1,
      rerankerBackend: "cpu-term-overlap-v1",
    },
  }));
}
