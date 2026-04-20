import type { EmbedOptions } from '../embedding/index.js';
import type { EvidenceItem } from '../schemas/action-decision.js';
import type { RagSourceType, SensitivityLevel } from '../types.js';

export interface RetrievalChunk {
  id: string;
  tenantId: string;
  content: string;
  source: string;
  sourceType: EvidenceItem['sourceType'];
  objectId: string | null;
  timestamp: string | null;
  sensitivityClass: 'public' | 'internal' | 'confidential' | 'restricted';
  embedding?: number[];
  metadata: Record<string, unknown>;
}

export interface RetrievalResult {
  chunks: ScoredChunk[];
  query: string;
  method: 'semantic' | 'keyword' | 'hybrid';
  totalIndexed: number;
  latencyMs: number;
}

export interface ScoredChunk extends RetrievalChunk {
  score: number;
  matchType: 'semantic' | 'keyword';
}

export interface RerankResult {
  chunks: ScoredChunk[];
  model: string;
  latencyMs: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  return magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

export class AlloyRetrievalEngine {
  private chunks: RetrievalChunk[] = [];
  private static readonly MAX_CHUNKS = 10000;

  get indexedCount(): number {
    return this.chunks.length;
  }

  tenantIndexedCount(tenantId: string): number {
    if (!tenantId) return 0;
    return this.chunks.filter((c) => c.tenantId === tenantId).length;
  }

  /**
   * Ingest content into the in-memory knowledge store.
   * `tenantId` is REQUIRED. Calls without a valid tenant identifier are
   * rejected (return empty array) to prevent globally-visible artifacts.
   */
  ingest(
    content: string,
    source: string,
    sourceType: RetrievalChunk['sourceType'],
    metadata?: Record<string, unknown>,
    tenantId: string = '',
  ): RetrievalChunk[] {
    const resolvedTenantId = tenantId || (metadata?.tenantId as string | undefined);
    if (!resolvedTenantId) {
      process.stderr.write(
        '[alloy-retrieval] ingest() called without tenantId — rejecting to prevent cross-tenant artifact\n',
      );
      return [];
    }

    const paragraphs = content.split(/\n{2,}/);
    const words = content.split(/\s+/);
    const chunkTexts: string[] = [];
    if (paragraphs.length > 1 && paragraphs.every((p) => p.length < 2000)) {
      let current = '';
      for (const p of paragraphs) {
        if (current.length + p.length > 1500 && current.length > 0) {
          chunkTexts.push(current.trim());
          current = p;
        } else {
          current += (current ? '\n\n' : '') + p;
        }
      }
      if (current.trim()) chunkTexts.push(current.trim());
    } else {
      for (let i = 0; i < words.length; i += 300) {
        chunkTexts.push(words.slice(i, i + 350).join(' '));
      }
    }

    const newChunks: RetrievalChunk[] = chunkTexts.map((text, idx) => ({
      id: `chunk-${source}-${Date.now()}-${idx}`,
      tenantId: resolvedTenantId,
      content: text,
      source,
      sourceType,
      objectId: (metadata?.objectId as string) || null,
      timestamp: (metadata?.timestamp as string) || new Date().toISOString(),
      sensitivityClass:
        (metadata?.sensitivityClass as RetrievalChunk['sensitivityClass']) || 'internal',
      metadata: metadata || {},
    }));

    this.chunks.push(...newChunks);
    if (this.chunks.length > AlloyRetrievalEngine.MAX_CHUNKS) {
      this.chunks.splice(0, this.chunks.length - AlloyRetrievalEngine.MAX_CHUNKS);
    }
    return newChunks;
  }

  setEmbedding(chunkId: string, embedding: number[]): void {
    const chunk = this.chunks.find((c) => c.id === chunkId);
    if (chunk) chunk.embedding = embedding;
  }

  /**
   * Semantic (vector) retrieval scoped to a specific tenant.
   * Returns empty array when `tenantId` is absent (fail-closed).
   */
  retrieveSemantic(queryEmbedding: number[], topK: number = 12, tenantId: string): ScoredChunk[] {
    if (!tenantId) return [];
    return this.chunks
      .filter((c) => c.embedding && c.tenantId === tenantId)
      .map((c) => ({
        ...c,
        score: cosineSimilarity(queryEmbedding, c.embedding!),
        matchType: 'semantic' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Keyword retrieval scoped to a specific tenant.
   * Returns empty array when `tenantId` is absent (fail-closed).
   */
  retrieveKeyword(query: string, topK: number = 12, tenantId: string): ScoredChunk[] {
    if (!tenantId) return [];
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    return this.chunks
      .filter((c) => c.tenantId === tenantId)
      .map((c) => {
        const lower = c.content.toLowerCase();
        const matched = terms.filter((t) => lower.includes(t)).length;
        return {
          ...c,
          score: terms.length > 0 ? matched / terms.length : 0,
          matchType: 'keyword' as const,
        };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Hybrid retrieval scoped to a specific tenant.
   * Returns an empty result set when `tenantId` is absent (fail-closed).
   */
  retrieveHybrid(
    query: string,
    queryEmbedding: number[] | null,
    topK: number = 12,
    tenantId: string,
  ): RetrievalResult {
    const start = Date.now();
    if (!tenantId) {
      return {
        chunks: [],
        query,
        method: queryEmbedding ? 'hybrid' : 'keyword',
        totalIndexed: 0,
        latencyMs: Date.now() - start,
      };
    }
    const semanticResults = queryEmbedding
      ? this.retrieveSemantic(queryEmbedding, topK * 2, tenantId)
      : [];
    const keywordResults = this.retrieveKeyword(query, topK * 2, tenantId);

    const merged = new Map<string, ScoredChunk>();
    for (const chunk of semanticResults) {
      merged.set(chunk.id, { ...chunk, score: chunk.score * 0.7 });
    }
    for (const chunk of keywordResults) {
      const existing = merged.get(chunk.id);
      if (existing) {
        existing.score += chunk.score * 0.3;
      } else {
        merged.set(chunk.id, { ...chunk, score: chunk.score * 0.3 });
      }
    }

    const results = [...merged.values()].sort((a, b) => b.score - a.score).slice(0, topK);

    return {
      chunks: results,
      query,
      method: queryEmbedding ? 'hybrid' : 'keyword',
      totalIndexed: this.chunks.filter((c) => c.tenantId === tenantId).length,
      latencyMs: Date.now() - start,
    };
  }

  /**
   * Ingest content and immediately embed it.
   * `tenantId` is REQUIRED — delegates to `ingest()` which is fail-closed.
   */
  async ingestAndEmbed(
    content: string,
    source: string,
    sourceType: RetrievalChunk['sourceType'],
    metadata?: Record<string, unknown>,
    embedOptions?: EmbedOptions,
    tenantId: string = '',
  ): Promise<RetrievalChunk[]> {
    const newChunks = this.ingest(content, source, sourceType, metadata, tenantId);
    if (newChunks.length === 0) return [];
    const { embeddingPipeline } = await import('../embedding/index.js');
    const batchResult = await embeddingPipeline.embedBatch(
      newChunks.map((c) => c.content),
      { ...embedOptions, concurrency: 5 },
    );
    for (let i = 0; i < newChunks.length; i++) {
      const res = batchResult.results[i];
      if (res && !res.error && newChunks[i]) {
        this.setEmbedding(newChunks[i]!.id, res.embedding);
      }
    }
    return newChunks;
  }

  /**
   * Embed query and retrieve hybrid results.
   * `tenantId` is REQUIRED — delegates to `retrieveHybrid()` which is fail-closed.
   */
  async embedAndRetrieveHybrid(
    query: string,
    topK: number = 12,
    embedOptions?: EmbedOptions,
    tenantId: string = '',
  ): Promise<RetrievalResult> {
    const { getEmbedding } = await import('../embedding/index.js');
    const queryEmbedding = await getEmbedding(query, embedOptions);
    return this.retrieveHybrid(query, queryEmbedding, topK, tenantId);
  }

  /**
   * Retrieve from the persistent vector database.
   * `tenantId` is REQUIRED — passed to the DB query for tenant scoping.
   * The fallback path also enforces tenant scope; if no tenantId the
   * fallback returns an empty result set (fail-closed).
   */
  async retrieveFromDb(
    query: string,
    queryEmbedding: number[] | null,
    options: {
      topK?: number;
      maxSensitivityLevel?: SensitivityLevel;
      domains?: string[];
      sourceTypes?: RagSourceType[];
      tenantId: string;
    },
  ): Promise<RetrievalResult> {
    const start = Date.now();
    const {
      topK = 10,
      maxSensitivityLevel = 'restricted',
      domains,
      sourceTypes,
      tenantId,
    } = options;

    if (!tenantId) {
      process.stderr.write(
        '[alloy-retrieval] retrieveFromDb() called without tenantId — returning empty (fail-closed)\n',
      );
      return {
        chunks: [],
        query,
        method: queryEmbedding ? 'hybrid' : 'keyword',
        totalIndexed: 0,
        latencyMs: Date.now() - start,
      };
    }

    try {
      const { hybridSearch } = await import('../rag-vector-store.js');
      const { results, totalIndexed, latencyMs } = await hybridSearch({
        query,
        queryEmbedding,
        tenantId,
        topK,
        maxSensitivityLevel,
        domains,
        sourceTypes,
      });

      const chunks: ScoredChunk[] = results.map((r) => ({
        id: r.id,
        tenantId: r.tenantId ?? tenantId,
        content: r.content,
        source: r.source,
        sourceType: r.sourceType as EvidenceItem['sourceType'],
        objectId: r.objectId,
        timestamp: (r.metadata.timestamp as string) ?? null,
        sensitivityClass: r.sensitivityLevel,
        metadata: r.metadata,
        score: r.score,
        matchType: r.matchType === 'hybrid' ? 'semantic' : r.matchType,
      }));

      return {
        chunks,
        query,
        method: queryEmbedding ? 'hybrid' : 'keyword',
        totalIndexed,
        latencyMs,
      };
    } catch (err) {
      process.stderr.write(
        `[alloy-retrieval] DB retrieval failed, falling back to in-memory (tenant-scoped): ${String(err)}\n`,
      );
      return this.retrieveHybrid(query, queryEmbedding, topK, tenantId);
    }
  }

  toEvidenceItems(chunks: ScoredChunk[]): EvidenceItem[] {
    return chunks.map((c) => ({
      source: c.source,
      sourceType: c.sourceType,
      content: c.content.slice(0, 500),
      relevanceScore: c.score,
      timestamp: c.timestamp,
      objectId: c.objectId,
    }));
  }

  getStats() {
    return {
      totalChunks: this.chunks.length,
      withEmbeddings: this.chunks.filter((c) => c.embedding).length,
      bySources: Object.fromEntries(
        [...new Set(this.chunks.map((c) => c.sourceType))].map((st) => [
          st,
          this.chunks.filter((c) => c.sourceType === st).length,
        ]),
      ),
    };
  }

  clear(): void {
    this.chunks = [];
  }
}

export const alloyRetrieval = new AlloyRetrievalEngine();
