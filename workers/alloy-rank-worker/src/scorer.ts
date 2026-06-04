export type RankMode = 'cross-encoder' | 'fallback-inversion';

export interface RankCandidate {
  id: string;
  text: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface RankedResult {
  id: string;
  text: string;
  score: number;
  rank: number;
  mode: RankMode;
  breakdown: {
    rawScore: number;
    queryTermHits: number;
    queryTermTotal: number;
    textLengthPenalty: number;
  };
  metadata: Record<string, unknown>;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 0);
}

function crossEncoderScore(
  query: string,
  text: string,
): {
  score: number;
  hits: number;
  total: number;
  lengthPenalty: number;
} {
  const qTokens = tokenize(query);
  const tTokens = new Set(tokenize(text));

  let hits = 0;
  for (const q of qTokens) {
    if (tTokens.has(q)) hits++;
  }

  const total = qTokens.length;
  const termOverlap = total > 0 ? hits / total : 0;

  const idealLength = 200;
  const lengthPenalty = Math.max(0, 1 - Math.abs(text.length - idealLength) / 1000);

  const score = termOverlap * 0.85 + lengthPenalty * 0.15;
  return { score: Math.min(1, score), hits, total, lengthPenalty };
}

function fallbackInversionScore(candidate: RankCandidate): number {
  const s = candidate.score;
  if (s === undefined || s === null) return 0.5;
  return Math.min(1, Math.max(0, s));
}

export function rankCandidates(
  query: string,
  candidates: RankCandidate[],
  topK: number,
  mode: RankMode,
): RankedResult[] {
  const scored = candidates.map((c): Omit<RankedResult, 'rank'> => {
    if (mode === 'cross-encoder') {
      const { score, hits, total, lengthPenalty } = crossEncoderScore(query, c.text);
      return {
        id: c.id,
        text: c.text,
        score,
        mode,
        breakdown: {
          rawScore: score,
          queryTermHits: hits,
          queryTermTotal: total,
          textLengthPenalty: lengthPenalty,
        },
        metadata: c.metadata ?? {},
      };
    } else {
      const raw = fallbackInversionScore(c);
      return {
        id: c.id,
        text: c.text,
        score: raw,
        mode,
        breakdown: { rawScore: raw, queryTermHits: 0, queryTermTotal: 0, textLengthPenalty: 0 },
        metadata: c.metadata ?? {},
      };
    }
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
