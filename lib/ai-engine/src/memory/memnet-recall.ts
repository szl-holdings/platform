/**
 * memnet-recall — Associative + episodic recall over historical decisions.
 *
 * Dual-index recall: by content-vector similarity AND by temporal adjacency.
 * The recall *path* (which index surfaced which item, in what order) is part
 * of the returned record — never opaque.
 *
 * Re-expression of the standardgalactic/memnet primitive against SZL doctrine.
 * Doctrine V6 receipt: `memory.recall.v1`.
 */

import { createHash, randomUUID } from 'node:crypto';

export interface MemnetEpisode<TPayload = unknown> {
  readonly episodeId: string;
  readonly contentVector: ReadonlyArray<number>;
  readonly occurredAt: string;
  readonly payload: TPayload;
  /** Optional grouping key — e.g. connection id, agent id, sync id. */
  readonly scope?: string;
}

export interface RecallQuery {
  readonly contentVector: ReadonlyArray<number>;
  readonly now: string;
  /** Half-life in milliseconds for temporal decay (default 30 days). */
  readonly halflifeMs?: number;
  readonly topK?: number;
  /** Optional scope filter — when set, only episodes with this scope match. */
  readonly scope?: string;
}

export interface RecallHit<TPayload = unknown> {
  readonly episode: MemnetEpisode<TPayload>;
  readonly contentSimilarity: number;
  readonly temporalSimilarity: number;
  readonly fused: number;
}

export interface RecallPath {
  readonly contentMatches: ReadonlyArray<{ episodeId: string; similarity: number }>;
  readonly temporalMatches: ReadonlyArray<{ episodeId: string; similarity: number }>;
  readonly fusionRule: 'sqrt(content*temporal)';
}

export interface RecallResult<TPayload = unknown> {
  readonly items: ReadonlyArray<RecallHit<TPayload>>;
  readonly recallPath: RecallPath;
  readonly receipt: {
    readonly kind: 'memory.recall.v1';
    readonly recallId: string;
    readonly producedAt: string;
    readonly receiptHash: string;
  };
}

function cosine(a: ReadonlyArray<number>, b: ReadonlyArray<number>): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(na) * Math.sqrt(nb))));
}

function temporalScore(occurredAt: string, now: string, halflifeMs: number): number {
  const t = new Date(occurredAt).getTime();
  const n = new Date(now).getTime();
  if (!Number.isFinite(t) || !Number.isFinite(n)) return 0;
  const dt = Math.max(0, n - t);
  return Math.pow(0.5, dt / halflifeMs);
}

export function recallEpisodes<TPayload>(
  episodes: ReadonlyArray<MemnetEpisode<TPayload>>,
  query: RecallQuery,
): RecallResult<TPayload> {
  const halflife = query.halflifeMs ?? 30 * 24 * 60 * 60 * 1000;
  const k = query.topK ?? 5;
  const filtered = query.scope ? episodes.filter((e) => e.scope === query.scope) : episodes;

  const scored = filtered.map((episode) => {
    const contentSimilarity = cosine(episode.contentVector, query.contentVector);
    const temporalSimilarity = temporalScore(episode.occurredAt, query.now, halflife);
    const fused = Math.sqrt(Math.max(0, contentSimilarity) * Math.max(0, temporalSimilarity));
    return { episode, contentSimilarity, temporalSimilarity, fused };
  });

  const items = [...scored].sort((a, b) => b.fused - a.fused).slice(0, k);

  const contentMatches = [...scored]
    .sort((a, b) => b.contentSimilarity - a.contentSimilarity)
    .slice(0, k)
    .map((s) => ({ episodeId: s.episode.episodeId, similarity: s.contentSimilarity }));
  const temporalMatches = [...scored]
    .sort((a, b) => b.temporalSimilarity - a.temporalSimilarity)
    .slice(0, k)
    .map((s) => ({ episodeId: s.episode.episodeId, similarity: s.temporalSimilarity }));

  const recallId = randomUUID();
  const producedAt = new Date().toISOString();
  const canonical = JSON.stringify({
    recallId,
    items: items.map((i) => ({ episodeId: i.episode.episodeId, fused: i.fused.toFixed(6) })),
    contentMatches,
    temporalMatches,
  });
  const receiptHash = createHash('sha256').update(canonical, 'utf8').digest('hex');

  return {
    items,
    recallPath: {
      contentMatches,
      temporalMatches,
      fusionRule: 'sqrt(content*temporal)',
    },
    receipt: {
      kind: 'memory.recall.v1',
      recallId,
      producedAt,
      receiptHash,
    },
  };
}

/**
 * Convenience: build a deterministic content vector from a string. Not a real
 * embedding — a token-hash bag-of-words used by demo flows where a true
 * embedding pipeline isn't wired in. Pure, deterministic, dependency-free.
 */
export function hashEmbedding(text: string, dims = 64): number[] {
  const v = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean);
  for (const tok of tokens) {
    const h = createHash('sha256').update(tok, 'utf8').digest();
    for (let i = 0; i < dims; i++) {
      v[i] += ((h[i % h.length] / 255) * 2 - 1);
    }
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? v : v.map((x) => x / norm);
}
