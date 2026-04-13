import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";

export type RagModalityType = "text" | "image" | "audio" | "video" | "document" | "structured_data";

export interface MultimodalChunk {
  chunkId: string;
  modalityType: RagModalityType;
  content: string;
  description?: string;
  sourceId?: string;
  sourceName?: string;
  domain?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface RagRetrievalResult {
  chunk: MultimodalChunk;
  relevanceScore: number;
  matchReason: string;
}

export interface MultimodalRagIngestionResult {
  ingestionId: string;
  chunksStored: number;
  modalitiesProcessed: RagModalityType[];
  latencyMs: number;
}

export interface MultimodalRagQueryResult {
  queryId: string;
  query: string;
  results: RagRetrievalResult[];
  fusedSummary: string;
  modalitiesSurfaced: RagModalityType[];
  totalResults: number;
  latencyMs: number;
}

async function ensureMultimodalRagTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS multimodal_rag_chunks (
      id BIGSERIAL PRIMARY KEY,
      chunk_id TEXT NOT NULL UNIQUE,
      modality_type TEXT NOT NULL DEFAULT 'text',
      content TEXT NOT NULL,
      description TEXT,
      source_id TEXT,
      source_name TEXT,
      domain TEXT DEFAULT 'general',
      tags TEXT[] DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      embedding_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_mm_rag_modality ON multimodal_rag_chunks(modality_type);
    CREATE INDEX IF NOT EXISTS idx_mm_rag_domain ON multimodal_rag_chunks(domain);
    CREATE INDEX IF NOT EXISTS idx_mm_rag_source ON multimodal_rag_chunks(source_id);
    CREATE INDEX IF NOT EXISTS idx_mm_rag_tags ON multimodal_rag_chunks USING GIN(tags);
  `).catch(() => {});
}

ensureMultimodalRagTable().catch(() => {});

function generateEmbeddingText(chunk: Omit<MultimodalChunk, "chunkId">): string {
  const parts: string[] = [];
  if (chunk.sourceName) parts.push(`Source: ${chunk.sourceName}`);
  if (chunk.domain) parts.push(`Domain: ${chunk.domain}`);
  parts.push(`Modality: ${chunk.modalityType}`);
  if (chunk.description) parts.push(`Description: ${chunk.description}`);
  parts.push(`Content: ${chunk.content.slice(0, 500)}`);
  if (chunk.tags?.length) parts.push(`Tags: ${chunk.tags.join(", ")}`);
  return parts.join(". ");
}

export async function ingestMultimodalContent(
  chunks: Omit<MultimodalChunk, "chunkId">[],
  options?: {
    triggeredBy?: string;
    batchId?: string;
  }
): Promise<MultimodalRagIngestionResult> {
  const ingestionId = `mmrag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  const modalitiesProcessed = new Set<RagModalityType>();
  let chunksStored = 0;

  for (const chunk of chunks) {
    const chunkId = `chunk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const embeddingText = generateEmbeddingText(chunk);

    try {
      await pool.query(
        `INSERT INTO multimodal_rag_chunks
         (chunk_id, modality_type, content, description, source_id, source_name, domain, tags, metadata, embedding_text, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
         ON CONFLICT (chunk_id) DO UPDATE SET
           content = EXCLUDED.content,
           description = EXCLUDED.description,
           embedding_text = EXCLUDED.embedding_text`,
        [
          chunkId, chunk.modalityType, chunk.content.slice(0, 10000),
          chunk.description ?? null, chunk.sourceId ?? null, chunk.sourceName ?? null,
          chunk.domain ?? "general", chunk.tags ?? [],
          JSON.stringify(chunk.metadata ?? {}), embeddingText,
        ]
      );
      modalitiesProcessed.add(chunk.modalityType);
      chunksStored++;
    } catch (err) {
      logger.warn({ err, chunkId }, "Failed to store multimodal RAG chunk");
    }
  }

  const latencyMs = Date.now() - startTime;
  logger.info({ ingestionId, chunksStored, latencyMs }, "Multimodal RAG ingestion completed");

  return {
    ingestionId,
    chunksStored,
    modalitiesProcessed: Array.from(modalitiesProcessed),
    latencyMs,
  };
}

export async function queryMultimodalRag(
  query: string,
  options?: {
    domain?: string;
    modalityTypes?: RagModalityType[];
    topK?: number;
    sourceIds?: string[];
    tags?: string[];
    produceSummary?: boolean;
  }
): Promise<MultimodalRagQueryResult> {
  const queryId = `ragq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  const topK = options?.topK ?? 10;

  const conditions: string[] = ["1=1"];
  const params: any[] = [];
  let paramIdx = 1;

  if (options?.domain) {
    conditions.push(`domain = $${paramIdx}`);
    params.push(options.domain);
    paramIdx++;
  }

  if (options?.modalityTypes?.length) {
    conditions.push(`modality_type = ANY($${paramIdx})`);
    params.push(options.modalityTypes);
    paramIdx++;
  }

  if (options?.sourceIds?.length) {
    conditions.push(`source_id = ANY($${paramIdx})`);
    params.push(options.sourceIds);
    paramIdx++;
  }

  if (options?.tags?.length) {
    conditions.push(`tags && $${paramIdx}`);
    params.push(options.tags);
    paramIdx++;
  }

  const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  if (searchTerms.length > 0) {
    const searchConditions = searchTerms.slice(0, 5).map((_, i) => {
      const p = paramIdx + i;
      return `(embedding_text ILIKE $${p} OR content ILIKE $${p})`;
    });
    conditions.push(`(${searchConditions.join(" OR ")})`);
    for (const term of searchTerms.slice(0, 5)) {
      params.push(`%${term}%`);
      paramIdx++;
    }
  }

  params.push(topK);
  let rawChunks: any[] = [];

  try {
    const result = await pool.query(
      `SELECT chunk_id, modality_type, content, description, source_id, source_name, domain, tags, metadata
       FROM multimodal_rag_chunks
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${paramIdx}`,
      params
    );
    rawChunks = result.rows;
  } catch (err) {
    logger.warn({ err }, "Multimodal RAG query failed — returning empty results");
  }

  if (rawChunks.length === 0) {
    return {
      queryId,
      query,
      results: [],
      fusedSummary: "No relevant content found in the multimodal knowledge base.",
      modalitiesSurfaced: [],
      totalResults: 0,
      latencyMs: Date.now() - startTime,
    };
  }

  const rankingResponse = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: "You are a multimodal relevance ranker. Given a query and retrieved chunks from multiple modalities (text, images, audio transcripts, documents, structured data), rank them by relevance and explain why each is relevant.",
      },
      {
        role: "user",
        content: `Query: "${query}"

Retrieved chunks (${rawChunks.length} total from ${new Set(rawChunks.map(c => c.modality_type)).size} modalities):

${rawChunks.map((c, i) => `[${i}] Modality: ${c.modality_type} | Source: ${c.source_name ?? "unknown"}\nContent: ${c.content.slice(0, 200)}`).join("\n\n")}

Return JSON array with relevance scores:
[{"index": 0, "relevanceScore": 0.0-1.0, "matchReason": "why this is relevant"}]`,
      },
    ],
    maxTokens: 1000,
    strategy: "fastest",
  }).catch(() => null);

  const relevanceMap = new Map<number, { score: number; reason: string }>();
  if (rankingResponse) {
    try {
      const match = rankingResponse.content.match(/\[[\s\S]*\]/);
      if (match) {
        const rankings = JSON.parse(match[0]) as Array<{ index: number; relevanceScore: number; matchReason: string }>;
        for (const r of rankings) {
          relevanceMap.set(r.index, { score: r.relevanceScore ?? 0.5, reason: r.matchReason ?? "Relevant to query" });
        }
      }
    } catch { }
  }

  const results: RagRetrievalResult[] = rawChunks.map((chunk, i) => {
    const relevance = relevanceMap.get(i) ?? { score: 0.5, reason: "Keyword match" };
    return {
      chunk: {
        chunkId: chunk.chunk_id,
        modalityType: chunk.modality_type as RagModalityType,
        content: chunk.content,
        description: chunk.description,
        sourceId: chunk.source_id,
        sourceName: chunk.source_name,
        domain: chunk.domain,
        tags: chunk.tags,
        metadata: chunk.metadata,
      },
      relevanceScore: relevance.score,
      matchReason: relevance.reason,
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);

  const modalitiesSurfaced = [...new Set(results.map(r => r.chunk.modalityType))];

  let fusedSummary = "No summary generated";
  if (options?.produceSummary !== false && results.length > 0) {
    const summaryContext = results.slice(0, 5).map(r =>
      `[${r.chunk.modalityType}] ${r.chunk.sourceName ?? ""}: ${r.chunk.content.slice(0, 200)}`
    ).join("\n\n");

    const summaryResponse = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: "Synthesize retrieved multimodal content into a coherent answer to the query. Reference specific modalities and sources.",
        },
        {
          role: "user",
          content: `Query: "${query}"\n\nRetrieved content:\n${summaryContext}\n\nProvide a 2-3 sentence synthesized answer that references the modalities.`,
        },
      ],
      maxTokens: 400,
      strategy: "fastest",
    }).catch(() => null);

    if (summaryResponse) fusedSummary = summaryResponse.content;
  }

  const latencyMs = Date.now() - startTime;
  logger.info({ queryId, resultsCount: results.length, modalitiesSurfaced, latencyMs }, "Multimodal RAG query completed");

  return {
    queryId,
    query,
    results,
    fusedSummary,
    modalitiesSurfaced,
    totalResults: results.length,
    latencyMs,
  };
}

export async function processDocumentIntoChunks(params: {
  content: string;
  sourceName: string;
  sourceId?: string;
  domain?: string;
  chunkSize?: number;
}): Promise<Omit<MultimodalChunk, "chunkId">[]> {
  const chunkSize = params.chunkSize ?? 1000;
  const chunks: Omit<MultimodalChunk, "chunkId">[] = [];

  const textChunks = [];
  let start = 0;
  while (start < params.content.length) {
    const end = Math.min(start + chunkSize, params.content.length);
    const overlap = start > 0 ? 100 : 0;
    textChunks.push(params.content.slice(Math.max(0, start - overlap), end));
    start = end;
  }

  for (let i = 0; i < textChunks.length; i++) {
    chunks.push({
      modalityType: "document",
      content: textChunks[i],
      description: `Document chunk ${i + 1}/${textChunks.length} from ${params.sourceName}`,
      sourceName: params.sourceName,
      sourceId: params.sourceId,
      domain: params.domain,
      tags: ["document", `chunk_${i + 1}`],
      metadata: { chunkIndex: i, totalChunks: textChunks.length },
    });
  }

  return chunks;
}

export async function getChunk(chunkId: string): Promise<MultimodalChunk | null> {
  try {
    const result = await pool.query("SELECT * FROM multimodal_rag_chunks WHERE chunk_id = $1", [chunkId]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      chunkId: row.chunk_id,
      modalityType: row.modality_type,
      content: row.content,
      description: row.description,
      sourceId: row.source_id,
      sourceName: row.source_name,
      domain: row.domain,
      tags: row.tags,
      metadata: row.metadata,
    };
  } catch { return null; }
}

export async function listChunks(filters?: { domain?: string; modalityType?: string; sourceId?: string; limit?: number }): Promise<any[]> {
  try {
    const params: any[] = [];
    let query = `SELECT chunk_id, modality_type, source_name, domain, tags, created_at FROM multimodal_rag_chunks WHERE 1=1`;
    let idx = 1;
    if (filters?.domain) { query += ` AND domain = $${idx}`; params.push(filters.domain); idx++; }
    if (filters?.modalityType) { query += ` AND modality_type = $${idx}`; params.push(filters.modalityType); idx++; }
    if (filters?.sourceId) { query += ` AND source_id = $${idx}`; params.push(filters.sourceId); idx++; }
    params.push(filters?.limit ?? 50);
    const result = await pool.query(query + ` ORDER BY created_at DESC LIMIT $${idx}`, params);
    return result.rows;
  } catch { return []; }
}
