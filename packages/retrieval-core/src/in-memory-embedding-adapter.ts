/**
 * In-Memory TF-IDF Embedding Adapter
 *
 * A zero-dependency, CPU-only embedding adapter for use in tests and
 * environments where no remote embedding service is available.
 *
 * Embedding strategy: TF-IDF with cosine similarity.  Projects each text
 * onto a shared vocabulary built from the provided corpus.
 *
 * Usage:
 *   const adapter = new InMemoryEmbeddingAdapter([
 *     { chunkId: 'a', sourceId: 'doc1', content: 'foo bar baz' },
 *   ]);
 *   const result = await specialist.retrieve({ text: 'foo', ... });
 */

import type { EmbeddingAdapter, EmbeddingHit } from './retrieval-specialist.js';
import type { RetrievalModality } from '@szl-holdings/shared-contracts';

// ─── Corpus entry ─────────────────────────────────────────────────────────────

export interface InMemoryCorpusEntry {
  chunkId: string;
  sourceId: string;
  content: string;
  modality?: RetrievalModality;
  metadata?: Record<string, unknown>;
}

// ─── TF-IDF helpers (pure functions) ─────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildVocab(docs: string[][]): Map<string, number> {
  const vocab = new Map<string, number>();
  let idx = 0;
  for (const tokens of docs) {
    for (const t of tokens) {
      if (!vocab.has(t)) vocab.set(t, idx++);
    }
  }
  return vocab;
}

function idfWeights(docs: string[][], vocab: Map<string, number>): number[] {
  const idf = new Array<number>(vocab.size).fill(0);
  const N = docs.length;
  for (const [term, i] of vocab) {
    const df = docs.filter((d) => d.includes(term)).length;
    idf[i] = Math.log((N + 1) / (df + 1)) + 1;
  }
  return idf;
}

function tfidfVector(tokens: string[], vocab: Map<string, number>, idf: number[]): number[] {
  const v = new Array<number>(vocab.size).fill(0);
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  for (const [term, count] of freq) {
    const i = vocab.get(term);
    if (i !== undefined) v[i] = (count / tokens.length) * (idf[i] ?? 0);
  }
  return v;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class InMemoryEmbeddingAdapter implements EmbeddingAdapter {
  readonly model: string;
  readonly provider = 'szl-cpu';

  private readonly corpus: InMemoryCorpusEntry[];
  private readonly vocab: Map<string, number>;
  private readonly idf: number[];
  private readonly vectors: number[][];

  constructor(corpus: InMemoryCorpusEntry[], model = 'szl-tfidf-v1') {
    this.corpus = corpus;
    this.model = model;
    const docTokens = corpus.map((e) => tokenize(e.content));
    this.vocab = buildVocab(docTokens);
    this.idf = idfWeights(docTokens, this.vocab);
    this.vectors = docTokens.map((t) => tfidfVector(t, this.vocab, this.idf));
  }

  async embed(text: string): Promise<number[]> {
    return tfidfVector(tokenize(text), this.vocab, this.idf);
  }

  async queryNearest(
    vector: number[],
    opts: {
      topK: number;
      namespaces?: string[];
      filter?: Record<string, unknown>;
      tenantId?: string;
    },
  ): Promise<EmbeddingHit[]> {
    const scored = this.corpus.map((entry, i) => ({
      entry,
      score: cosineSim(vector, this.vectors[i]),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, opts.topK).map(({ entry, score }) => ({
      chunkId: entry.chunkId,
      sourceId: entry.sourceId,
      score,
      content: entry.content,
      modality: entry.modality ?? 'text',
      metadata: entry.metadata ?? {},
    }));
  }
}
