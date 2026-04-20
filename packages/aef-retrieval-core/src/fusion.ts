import type { DenseHit, KeywordHit } from "./adapters.js";

export interface FusedHit {
  chunkId: string;
  sourceId: string;
  fusedScore: number;
  denseScore?: number;
  keywordScore?: number;
  rank: number;
  metadata: Record<string, unknown>;
}

export interface RrfOptions {
  k?: number;
  denseWeight?: number;
  keywordWeight?: number;
}

function rankMap(hits: Array<{ chunkId: string }>): Map<string, number> {
  const map = new Map<string, number>();
  hits.forEach((h, i) => {
    map.set(h.chunkId, i + 1);
  });
  return map;
}

export function reciprocalRankFusion(
  denseHits: DenseHit[],
  keywordHits: KeywordHit[],
  options: RrfOptions = {},
): FusedHit[] {
  const { k = 60, denseWeight = 0.6, keywordWeight = 0.4 } = options;

  const denseRanks = rankMap(denseHits);
  const keywordRanks = rankMap(keywordHits);

  const denseScores = new Map<string, number>(
    denseHits.map((h) => [h.chunkId, h.score]),
  );
  const keywordScoreById = new Map<string, number>(
    keywordHits.map((h) => [h.chunkId, h.score]),
  );

  const allMetadata = new Map<string, Record<string, unknown>>();
  const allSourceIds = new Map<string, string>();

  for (const h of denseHits) {
    allMetadata.set(h.chunkId, h.metadata);
    allSourceIds.set(h.chunkId, h.sourceId);
  }
  for (const h of keywordHits) {
    allMetadata.set(h.chunkId, { ...allMetadata.get(h.chunkId), ...h.metadata });
    allSourceIds.set(h.chunkId, h.sourceId);
  }

  const chunkIds = new Set<string>([
    ...denseHits.map((h) => h.chunkId),
    ...keywordHits.map((h) => h.chunkId),
  ]);

  const fused: FusedHit[] = Array.from(chunkIds).map((chunkId) => {
    const dr = denseRanks.get(chunkId);
    const kr = keywordRanks.get(chunkId);

    const denseContrib = dr !== undefined ? denseWeight * (1 / (k + dr)) : 0;
    const kwContrib = kr !== undefined ? keywordWeight * (1 / (k + kr)) : 0;
    const fusedScore = denseContrib + kwContrib;

    const denseScore = denseScores.get(chunkId);
    const keywordScore = keywordScoreById.get(chunkId);

    return {
      chunkId,
      sourceId: allSourceIds.get(chunkId) ?? "",
      fusedScore,
      ...(denseScore !== undefined ? { denseScore } : {}),
      ...(keywordScore !== undefined ? { keywordScore } : {}),
      rank: 0,
      metadata: allMetadata.get(chunkId) ?? {},
    };
  });

  fused.sort((a, b) => b.fusedScore - a.fusedScore);
  fused.forEach((h, i) => {
    h.rank = i + 1;
  });

  return fused;
}
