import pino from "pino";
import type { SensitivityLevel, RagSourceType } from "./types.js";

const logger = pino({ name: "rag-vector-store", level: process.env.LOG_LEVEL ?? "info" });

export type { SensitivityLevel, RagSourceType };

export interface RagChunk {
  id: string;
  tenantId?: string | null;
  content: string;
  source: string;
  sourceType: RagSourceType;
  domain: string;
  sensitivityLevel: SensitivityLevel;
  objectId: string | null;
  chunkIndex: number;
  chunkHash: string;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RagSearchResult extends RagChunk {
  score: number;
  matchType: "semantic" | "keyword" | "hybrid";
}

const SENSITIVITY_ORDER: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];

async function getPool() {
  const { pool } = await import("@szl-holdings/db");
  return pool;
}


function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function upsertChunk(chunk: Omit<RagChunk, "createdAt" | "updatedAt">): Promise<void> {
  try {
    const pool = await getPool();
    const embeddingLiteral = chunk.embedding ? toVectorLiteral(chunk.embedding) : null;
    await pool.query(
      `INSERT INTO rag_knowledge_chunks
        (id, tenant_id, content, source, source_type, domain, sensitivity_level, object_id, chunk_index, chunk_hash, metadata, embedding, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::vector, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         content = EXCLUDED.content,
         source = EXCLUDED.source,
         metadata = EXCLUDED.metadata,
         embedding = EXCLUDED.embedding,
         updated_at = NOW()`,
      [
        chunk.id,
        chunk.tenantId ?? null,
        chunk.content,
        chunk.source,
        chunk.sourceType,
        chunk.domain,
        chunk.sensitivityLevel,
        chunk.objectId,
        chunk.chunkIndex,
        chunk.chunkHash,
        JSON.stringify(chunk.metadata),
        embeddingLiteral,
      ],
    );
  } catch (err) {
    logger.error({ err }, "Failed to upsert chunk");
  }
}

export async function upsertChunksBatch(chunks: Array<Omit<RagChunk, "createdAt" | "updatedAt">>): Promise<void> {
  for (const chunk of chunks) {
    await upsertChunk(chunk);
  }
}

export interface SemanticSearchOptions {
  queryEmbedding: number[];
  tenantId?: string;
  topK?: number;
  domains?: string[];
  maxSensitivityLevel?: SensitivityLevel;
  sourceTypes?: RagSourceType[];
}

export async function semanticSearch(opts: SemanticSearchOptions): Promise<RagSearchResult[]> {
  const { queryEmbedding, tenantId, topK = 12, domains, maxSensitivityLevel = "restricted", sourceTypes } = opts;
  const allowedLevels = SENSITIVITY_ORDER.slice(0, SENSITIVITY_ORDER.indexOf(maxSensitivityLevel) + 1);
  const conditions: string[] = [`sensitivity_level = ANY($2)`, `embedding IS NOT NULL`];
  const params: unknown[] = [toVectorLiteral(queryEmbedding), allowedLevels];
  let paramIdx = 3;

  if (!tenantId) {
    logger.warn("semanticSearch called without tenantId — returning empty (fail-closed)");
    return [];
  }
  conditions.push(`tenant_id = $${paramIdx++}`);
  params.push(tenantId);
  if (domains && domains.length > 0) {
    conditions.push(`domain = ANY($${paramIdx++})`);
    params.push(domains);
  }
  if (sourceTypes && sourceTypes.length > 0) {
    conditions.push(`source_type = ANY($${paramIdx++})`);
    params.push(sourceTypes);
  }
  params.push(topK);

  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT *, 1 - (embedding <=> $1::vector) AS score
       FROM rag_knowledge_chunks
       WHERE ${conditions.join(" AND ")}
       ORDER BY embedding <=> $1::vector
       LIMIT $${paramIdx}`,
      params,
    );
    return result.rows.map(r => rowToResult(r, "semantic"));
  } catch (err) {
    logger.error({ err }, "Semantic search failed");
    return [];
  }
}

export interface KeywordSearchOptions {
  query: string;
  tenantId?: string;
  topK?: number;
  domains?: string[];
  maxSensitivityLevel?: SensitivityLevel;
  sourceTypes?: RagSourceType[];
}

export async function keywordSearch(opts: KeywordSearchOptions): Promise<RagSearchResult[]> {
  const { query, tenantId, topK = 12, domains, maxSensitivityLevel = "restricted", sourceTypes } = opts;
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return [];

  const tsQuery = terms.join(" | ");
  const allowedLevels = SENSITIVITY_ORDER.slice(0, SENSITIVITY_ORDER.indexOf(maxSensitivityLevel) + 1);
  const conditions: string[] = [`sensitivity_level = ANY($2)`, `to_tsvector('english', content) @@ to_tsquery('english', $1)`];
  const params: unknown[] = [tsQuery, allowedLevels];
  let paramIdx = 3;

  if (!tenantId) {
    logger.warn("keywordSearch called without tenantId — returning empty (fail-closed)");
    return [];
  }
  conditions.push(`tenant_id = $${paramIdx++}`);
  params.push(tenantId);
  if (domains && domains.length > 0) {
    conditions.push(`domain = ANY($${paramIdx++})`);
    params.push(domains);
  }
  if (sourceTypes && sourceTypes.length > 0) {
    conditions.push(`source_type = ANY($${paramIdx++})`);
    params.push(sourceTypes);
  }
  params.push(topK);

  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT *, ts_rank_cd(to_tsvector('english', content), to_tsquery('english', $1)) AS score
       FROM rag_knowledge_chunks
       WHERE ${conditions.join(" AND ")}
       ORDER BY score DESC
       LIMIT $${paramIdx}`,
      params,
    );
    return result.rows.map(r => rowToResult(r, "keyword"));
  } catch (err) {
    logger.error({ err }, "Keyword search failed");
    return [];
  }
}

export interface HybridSearchOptions {
  query: string;
  queryEmbedding: number[] | null;
  tenantId?: string;
  topK?: number;
  domains?: string[];
  maxSensitivityLevel?: SensitivityLevel;
  sourceTypes?: RagSourceType[];
  semanticWeight?: number;
}

export async function hybridSearch(opts: HybridSearchOptions): Promise<{ results: RagSearchResult[]; totalIndexed: number; latencyMs: number }> {
  const start = Date.now();
  const { query, queryEmbedding, tenantId, topK = 10, semanticWeight = 0.7 } = opts;

  const [semanticResults, keywordResults] = await Promise.all([
    queryEmbedding
      ? semanticSearch({ queryEmbedding, tenantId, topK: topK * 2, domains: opts.domains, maxSensitivityLevel: opts.maxSensitivityLevel, sourceTypes: opts.sourceTypes })
      : Promise.resolve([]),
    keywordSearch({ query, tenantId, topK: topK * 2, domains: opts.domains, maxSensitivityLevel: opts.maxSensitivityLevel, sourceTypes: opts.sourceTypes }),
  ]);

  const merged = new Map<string, RagSearchResult>();
  for (const chunk of semanticResults) {
    merged.set(chunk.id, { ...chunk, score: chunk.score * semanticWeight, matchType: "semantic" });
  }
  for (const chunk of keywordResults) {
    const existing = merged.get(chunk.id);
    if (existing) {
      existing.score += chunk.score * (1 - semanticWeight);
      existing.matchType = "hybrid";
    } else {
      merged.set(chunk.id, { ...chunk, score: chunk.score * (1 - semanticWeight), matchType: "keyword" });
    }
  }

  const results = [...merged.values()].sort((a, b) => b.score - a.score).slice(0, topK);
  const totalIndexed = await getChunkCount({ tenantId, sourceType: opts.sourceTypes?.[0] });

  return { results, totalIndexed, latencyMs: Date.now() - start };
}

export async function getChunkCount(opts?: { tenantId?: string; sourceType?: RagSourceType }): Promise<number> {
  try {
    const pool = await getPool();
    const { tenantId, sourceType } = opts ?? {};
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (tenantId) {
      params.push(tenantId);
      conditions.push(`tenant_id = $${params.length}`);
    }
    if (sourceType) {
      params.push(sourceType);
      conditions.push(`source_type = $${params.length}`);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total FROM rag_knowledge_chunks ${where}`,
      params,
    );
    return (result.rows[0] as { total: number }).total;
  } catch {
    return 0;
  }
}

export async function getKnowledgeBaseStats(): Promise<{
  totalChunks: number;
  withEmbeddings: number;
  bySourceType: Record<string, number>;
  byDomain: Record<string, number>;
  bySensitivity: Record<string, number>;
  lastUpdated: string | null;
}> {
  try {
    const pool = await getPool();
    const [totalResult, embeddingResult, byTypeResult, byDomainResult, bySensResult, lastResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM rag_knowledge_chunks`),
      pool.query(`SELECT COUNT(*)::int AS total FROM rag_knowledge_chunks WHERE embedding IS NOT NULL`),
      pool.query(`SELECT source_type, COUNT(*)::int AS count FROM rag_knowledge_chunks GROUP BY source_type`),
      pool.query(`SELECT domain, COUNT(*)::int AS count FROM rag_knowledge_chunks GROUP BY domain`),
      pool.query(`SELECT sensitivity_level, COUNT(*)::int AS count FROM rag_knowledge_chunks GROUP BY sensitivity_level`),
      pool.query(`SELECT MAX(updated_at) AS last_updated FROM rag_knowledge_chunks`),
    ]);

    return {
      totalChunks: (totalResult.rows[0] as { total: number }).total,
      withEmbeddings: (embeddingResult.rows[0] as { total: number }).total,
      bySourceType: Object.fromEntries((byTypeResult.rows as Array<{ source_type: string; count: number }>).map(r => [r.source_type, r.count])),
      byDomain: Object.fromEntries((byDomainResult.rows as Array<{ domain: string; count: number }>).map(r => [r.domain, r.count])),
      bySensitivity: Object.fromEntries((bySensResult.rows as Array<{ sensitivity_level: string; count: number }>).map(r => [r.sensitivity_level, r.count])),
      lastUpdated: (lastResult.rows[0] as { last_updated: string | null }).last_updated,
    };
  } catch {
    return { totalChunks: 0, withEmbeddings: 0, bySourceType: {}, byDomain: {}, bySensitivity: {}, lastUpdated: null };
  }
}

export async function deleteChunksByObjectId(objectId: string, sourceType?: RagSourceType): Promise<number> {
  try {
    const pool = await getPool();
    const result = await pool.query(
      sourceType
        ? `DELETE FROM rag_knowledge_chunks WHERE object_id = $1 AND source_type = $2`
        : `DELETE FROM rag_knowledge_chunks WHERE object_id = $1`,
      sourceType ? [objectId, sourceType] : [objectId],
    );
    return result.rowCount ?? 0;
  } catch {
    return 0;
  }
}

function rowToResult(r: Record<string, unknown>, defaultMatchType: "semantic" | "keyword"): RagSearchResult {
  return {
    id: r.id as string,
    tenantId: (r.tenant_id as string | null) ?? null,
    content: r.content as string,
    source: r.source as string,
    sourceType: r.source_type as RagSourceType,
    domain: r.domain as string,
    sensitivityLevel: r.sensitivity_level as SensitivityLevel,
    objectId: r.object_id as string | null,
    chunkIndex: r.chunk_index as number,
    chunkHash: r.chunk_hash as string,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    embedding: null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    score: parseFloat(String(r.score ?? 0)),
    matchType: defaultMatchType,
  };
}
