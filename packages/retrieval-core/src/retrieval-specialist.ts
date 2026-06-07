/**
 * AEEP Retrieval Specialist — Two-Stage Pipeline
 *
 * Stage 1: Embedding pass
 *   Runs a dense-vector (embedding) query against the configured EmbeddingAdapter,
 *   optionally combined with a keyword pass, then fuses results via RRF.
 *
 * Stage 2: Reranker pass
 *   Applies a cross-encoder or CPU-term-overlap reranker via the RerankerAdapter slot.
 *   The adapter slot is swappable: defaults to a built-in CPU approximation and can be
 *   replaced with a remote cross-encoder (e.g. Cohere Rerank, BGE) at startup.
 *
 * Usage:
 *   const specialist = new RetrievalSpecialist({ embeddingAdapter, rerankAdapter });
 *   const result = await specialist.retrieve(query);
 */

import type {
  RankedEvidenceItem,
  RetrievalChunk,
  RetrievalModality,
  RetrievalProofChain,
  RetrievalQuery,
  RetrievalResult,
} from '@szl-holdings/shared-contracts';

// ─── Adapter interfaces ───────────────────────────────────────────────────────

export interface EmbeddingAdapter {
  readonly model: string;
  readonly provider: string;
  embed(text: string): Promise<number[]>;
  queryNearest(
    vector: number[],
    opts: { topK: number; namespaces?: string[]; filter?: Record<string, unknown>; tenantId?: string },
  ): Promise<EmbeddingHit[]>;
}

export interface EmbeddingHit {
  chunkId: string;
  sourceId: string;
  score: number;
  content: string;
  modality?: RetrievalModality;
  metadata: Record<string, unknown>;
}

export interface KeywordSearchAdapter {
  search(
    query: string,
    opts: { topK: number; namespaces?: string[]; filter?: Record<string, unknown>; tenantId?: string },
  ): Promise<KeywordHit[]>;
}

export interface KeywordHit {
  chunkId: string;
  sourceId: string;
  score: number;
  content: string;
  modality?: RetrievalModality;
  metadata: Record<string, unknown>;
}

export interface CrossEncoderAdapter {
  readonly model: string;
  readonly provider: string;
  rerank(
    query: string,
    candidates: Array<{ id: string; text: string; score: number }>,
    topK: number,
  ): Promise<Array<{ id: string; score: number }>>;
}

// ─── Default CPU reranker (term-overlap approximation) ────────────────────────

const CPU_RERANKER_MODEL = 'cpu-term-overlap-v1';
const CPU_RERANKER_PROVIDER = 'local';

function cpuRerank(
  query: string,
  candidates: Array<{ id: string; text: string; score: number }>,
  topK: number,
): Array<{ id: string; score: number }> {
  const queryTerms = new Set(
    query.toLowerCase().split(/\s+/).filter((t) => t.length > 2),
  );

  if (queryTerms.size === 0) return candidates.slice(0, topK).map((c) => ({ id: c.id, score: c.score }));

  const scored = candidates.map((c) => {
    const tokens = c.text.toLowerCase().split(/\s+/);
    let termHits = 0;
    for (const t of tokens) {
      if (queryTerms.has(t)) termHits++;
    }
    const overlapPrecision = termHits / queryTerms.size;
    const density = tokens.length > 0 ? termHits / tokens.length : 0;
    const rerankerScore = Math.min(1, overlapPrecision * 0.6 + density * 20 * 0.2 + c.score * 0.2);
    return { id: c.id, score: rerankerScore };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

// ─── RRF fusion helper ────────────────────────────────────────────────────────

const RRF_K = 60;

function rrfFuse(
  denseHits: EmbeddingHit[],
  keywordHits: KeywordHit[],
): Array<{ chunkId: string; fusedScore: number; denseScore?: number; keywordScore?: number; hit: EmbeddingHit | KeywordHit }> {
  const byId = new Map<
    string,
    { denseRank?: number; kwRank?: number; denseScore?: number; kwScore?: number; hit: EmbeddingHit | KeywordHit }
  >();

  denseHits.forEach((h, i) => {
    byId.set(h.chunkId, { denseRank: i + 1, denseScore: h.score, hit: h });
  });

  keywordHits.forEach((h, i) => {
    const existing = byId.get(h.chunkId);
    if (existing) {
      existing.kwRank = i + 1;
      existing.kwScore = h.score;
    } else {
      byId.set(h.chunkId, { kwRank: i + 1, kwScore: h.score, hit: h });
    }
  });

  const fused = Array.from(byId.entries()).map(([chunkId, v]) => {
    const denseContrib = v.denseRank !== undefined ? 0.6 * (1 / (RRF_K + v.denseRank)) : 0;
    const kwContrib = v.kwRank !== undefined ? 0.4 * (1 / (RRF_K + v.kwRank)) : 0;
    return {
      chunkId,
      fusedScore: denseContrib + kwContrib,
      denseScore: v.denseScore,
      keywordScore: v.kwScore,
      hit: v.hit,
    };
  });

  fused.sort((a, b) => b.fusedScore - a.fusedScore);
  return fused;
}

// ─── Retrieval Specialist ─────────────────────────────────────────────────────

export interface RetrievalSpecialistOptions {
  embeddingAdapter: EmbeddingAdapter;
  rerankAdapter?: CrossEncoderAdapter;
  keywordAdapter?: KeywordSearchAdapter;
  tenantId?: string;
  defaultTopK?: number;
  defaultMinScore?: number;
}

export interface RetrievalSpecialistResult extends RetrievalResult {
  proofChain: RetrievalProofChain;
}

export class RetrievalSpecialist {
  private readonly embedding: EmbeddingAdapter;
  private readonly reranker: CrossEncoderAdapter | null;
  private readonly keyword: KeywordSearchAdapter | null;
  private readonly tenantId: string;
  private readonly defaultTopK: number;
  private readonly defaultMinScore: number;

  constructor(opts: RetrievalSpecialistOptions) {
    this.embedding = opts.embeddingAdapter;
    this.reranker = opts.rerankAdapter ?? null;
    this.keyword = opts.keywordAdapter ?? null;
    this.tenantId = opts.tenantId ?? 'default';
    this.defaultTopK = opts.defaultTopK ?? 10;
    this.defaultMinScore = opts.defaultMinScore ?? 0.0;
  }

  /**
   * Swap the reranker adapter at runtime (e.g. to upgrade from CPU to remote cross-encoder).
   */
  withReranker(adapter: CrossEncoderAdapter): RetrievalSpecialist {
    return new RetrievalSpecialist({
      embeddingAdapter: this.embedding,
      rerankAdapter: adapter,
      keywordAdapter: this.keyword ?? undefined,
      tenantId: this.tenantId,
      defaultTopK: this.defaultTopK,
      defaultMinScore: this.defaultMinScore,
    });
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievalSpecialistResult> {
    const t0 = Date.now();
    const topK = query.topK ?? this.defaultTopK;
    const minScore = query.minScore ?? this.defaultMinScore;
    const modalities = query.modalities ?? ['text'];

    // ── Stage 1: Embedding pass ──────────────────────────────────────────────
    const vector = await this.embedding.embed(query.text);
    const denseHits = await this.embedding.queryNearest(vector, {
      topK: topK * 3,
      namespaces: query.namespaces,
      filter: query.filter,
      tenantId: this.tenantId,
    });

    let fusedBeforeRerank: Array<{
      chunkId: string;
      fusedScore: number;
      denseScore?: number;
      keywordScore?: number;
      hit: EmbeddingHit | KeywordHit;
    }>;

    if (this.keyword && (query.strategy === 'hybrid' || query.strategy === 'keyword')) {
      const kwHits = await this.keyword.search(query.text, {
        topK: topK * 3,
        namespaces: query.namespaces,
        filter: query.filter,
        tenantId: this.tenantId,
      });
      fusedBeforeRerank = rrfFuse(denseHits, kwHits);
    } else {
      fusedBeforeRerank = denseHits.map((h, i) => ({
        chunkId: h.chunkId,
        fusedScore: h.score,
        denseScore: h.score,
        keywordScore: undefined,
        hit: h,
      }));
    }

    // ── Modality filter (post-fusion, pre-rerank) ────────────────────────────
    // When the query specifies modalities, drop any candidate whose hit does not
    // carry a matching modality tag.  'text' is the default modality so an
    // untagged hit counts as 'text'.
    if (modalities.length > 0) {
      fusedBeforeRerank = fusedBeforeRerank.filter((f) => {
        const hitModality: RetrievalModality = f.hit.modality ?? 'text';
        return modalities.includes(hitModality);
      });
    }

    const totalBeforeRerank = fusedBeforeRerank.length;

    // ── Stage 2: Reranker pass ───────────────────────────────────────────────
    const rerankModel = this.reranker?.model ?? CPU_RERANKER_MODEL;
    const rerankProvider = this.reranker?.provider ?? CPU_RERANKER_PROVIDER;

    const candidates = fusedBeforeRerank.slice(0, topK * 5).map((f) => ({
      id: f.chunkId,
      text: f.hit.content,
      score: f.fusedScore,
    }));

    let rerankScores: Array<{ id: string; score: number }>;
    if (this.reranker) {
      rerankScores = await this.reranker.rerank(query.text, candidates, topK);
    } else {
      rerankScores = cpuRerank(query.text, candidates, topK);
    }

    // Build lookup maps
    const fusedScoreById = new Map(fusedBeforeRerank.map((f) => [f.chunkId, f]));
    const rerankScoreById = new Map(rerankScores.map((r) => [r.id, r.score]));

    const finalChunks: RetrievalChunk[] = [];
    const rankedEvidence: RankedEvidenceItem[] = [];

    rerankScores.forEach((r, idx) => {
      const fused = fusedScoreById.get(r.id);
      if (!fused) return;
      const hit = fused.hit;
      const embeddingScore = fused.denseScore ?? fused.fusedScore;
      const finalScore = r.score;
      const confidenceDelta = finalScore - embeddingScore;

      if (finalScore < minScore) return;

      const modality: RetrievalModality = hit.modality ?? 'text';

      const chunk: RetrievalChunk = {
        chunkId: hit.chunkId,
        sourceId: hit.sourceId,
        content: hit.content,
        score: finalScore,
        modality,
        retrievedAt: new Date().toISOString(),
        ...(hit.metadata?.sourceUri !== undefined ? { sourceUri: String(hit.metadata.sourceUri) } : {}),
        ...(hit.metadata?.title !== undefined ? { title: String(hit.metadata.title) } : {}),
        metadata: hit.metadata,
      };
      finalChunks.push(chunk);

      rankedEvidence.push({
        rank: idx + 1,
        chunkId: hit.chunkId,
        sourceId: hit.sourceId,
        content: hit.content,
        modality,
        embeddingScore,
        rerankerScore: finalScore,
        finalScore,
        confidenceDelta,
        retrievedAt: chunk.retrievedAt,
        embeddingModel: this.embedding.model,
        rerankerModel: rerankModel,
        ...(hit.metadata?.sourceUri !== undefined ? { sourceUri: String(hit.metadata.sourceUri) } : {}),
        ...(hit.metadata?.title !== undefined ? { title: String(hit.metadata.title) } : {}),
      });
    });

    const latencyMs = Date.now() - t0;

    const overallConfidence =
      rankedEvidence.length > 0
        ? rankedEvidence.slice(0, 3).reduce((s, e) => s + e.finalScore, 0) /
          Math.min(3, rankedEvidence.length)
        : 0;

    const proofChain: RetrievalProofChain = {
      queryId: query.queryId,
      traceId: query.traceId,
      query: query.text,
      strategy: query.strategy,
      modalities,
      embeddingModel: this.embedding.model,
      embeddingProvider: this.embedding.provider,
      rerankerModel: rerankModel,
      rerankerProvider: rerankProvider,
      rankedEvidence,
      totalCandidatesBeforeRerank: totalBeforeRerank,
      totalCandidatesAfterRerank: finalChunks.length,
      overallConfidence,
      latencyMs,
      generatedAt: new Date().toISOString(),
    };

    const result: RetrievalSpecialistResult = {
      queryId: query.queryId,
      chunks: finalChunks,
      strategy: query.strategy,
      reranker: this.reranker ? 'cross-encoder' : 'reciprocal-rank-fusion',
      modalities,
      totalCandidates: totalBeforeRerank,
      latencyMs,
      traceId: query.traceId,
      profileId: query.profileId,
      profileVersion: query.profileVersion,
      embeddingModel: this.embedding.model,
      embeddingProvider: this.embedding.provider,
      rerankerModel: rerankModel,
      rerankerProvider: rerankProvider,
      proofChain,
    };

    return result;
  }
}

export const RETRIEVAL_SPECIALIST_VERSION = '1.0.0' as const;
