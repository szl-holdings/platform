/**
 * Shared BM25 retrieval utilities.
 *
 * Used by /v1/search/hybrid (over the tenant runStore corpus) and
 * /v1/evals/run (over the bundled golden fixture corpus) so both
 * lanes run identical scoring logic.
 */

const BM25_K1 = 1.5;
const BM25_B = 0.75;

export function bm25Tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export interface BM25Doc {
  id: string;
  tokens: string[];
  tf: Map<string, number>;
  metadata: Record<string, unknown>;
}

export function buildBM25Doc(
  id: string,
  parts: string[],
  metadata: Record<string, unknown>,
): BM25Doc {
  const text = parts.join(' ');
  const tokens = bm25Tokenize(text);
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return { id, tokens, tf, metadata };
}

export function bm25Score(
  doc: BM25Doc,
  queryTokens: string[],
  idf: Map<string, number>,
  avgDocLen: number,
): number {
  let score = 0;
  for (const term of queryTokens) {
    const tf = doc.tf.get(term) ?? 0;
    if (tf === 0) continue;
    const termIdf = idf.get(term) ?? 0;
    const numerator = tf * (BM25_K1 + 1);
    const denominator =
      tf + BM25_K1 * (1 - BM25_B + BM25_B * (doc.tokens.length / avgDocLen));
    score += termIdf * (numerator / denominator);
  }
  return score;
}

export function buildIdf(docs: BM25Doc[], queryTokens: string[]): Map<string, number> {
  const idf = new Map<string, number>();
  for (const term of queryTokens) {
    const df = docs.filter((d) => d.tf.has(term)).length;
    idf.set(term, Math.log((docs.length - df + 0.5) / (df + 0.5) + 1));
  }
  return idf;
}

export function runBM25Query(
  docs: BM25Doc[],
  query: string,
  topK: number,
  minScore = 0,
): Array<{ id: string; score: number; metadata: Record<string, unknown> }> {
  if (docs.length === 0) return [];
  const queryTokens = bm25Tokenize(query);
  if (queryTokens.length === 0) return [];

  const avgDocLen = docs.reduce((s, d) => s + d.tokens.length, 0) / docs.length;
  const idf = buildIdf(docs, queryTokens);

  return docs
    .map((doc) => ({ id: doc.id, score: bm25Score(doc, queryTokens, idf, avgDocLen), metadata: doc.metadata }))
    .filter((r) => r.score > minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
