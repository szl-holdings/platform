import type { NormalizedHit } from './normalize.js';

export interface Citation {
  rank: number;
  chunkId: string;
  sourceId: string;
  sourceUri?: string;
  title?: string;
  page?: number;
  section?: string;
  score: number;
  denseScore?: number;
  keywordScore?: number;
  fusedScore: number;
  rerankerScore?: number;
  boostApplied: boolean;
  metadata: Record<string, unknown>;
}

function extractString(meta: Record<string, unknown>, key: string): string | undefined {
  const v = meta[key];
  return typeof v === 'string' ? v : undefined;
}

function extractNumber(meta: Record<string, unknown>, key: string): number | undefined {
  const v = meta[key];
  return typeof v === 'number' ? v : undefined;
}

export function assembleCitations(hits: NormalizedHit[]): Citation[] {
  return hits.map((h, i): Citation => {
    const sourceUri = extractString(h.metadata, 'sourceUri');
    const title = extractString(h.metadata, 'title');
    const page = extractNumber(h.metadata, 'page');
    const section = extractString(h.metadata, 'section');
    const rerankerScore = extractNumber(h.metadata, 'rerankerScore');

    return {
      rank: i + 1,
      chunkId: h.chunkId,
      sourceId: h.sourceId,
      ...(sourceUri !== undefined ? { sourceUri } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(page !== undefined ? { page } : {}),
      ...(section !== undefined ? { section } : {}),
      score: h.normalizedScore,
      ...(h.denseScore !== undefined ? { denseScore: h.denseScore } : {}),
      ...(h.keywordScore !== undefined ? { keywordScore: h.keywordScore } : {}),
      fusedScore: h.fusedScore,
      ...(rerankerScore !== undefined ? { rerankerScore } : {}),
      boostApplied: h.boostApplied,
      metadata: h.metadata,
    };
  });
}
