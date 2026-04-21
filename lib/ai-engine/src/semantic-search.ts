/**
 * Semantic Search — unified multi-domain search with vector similarity,
 * full-text, and metadata fusion using Reciprocal Rank Fusion (RRF).
 */

import { generateEmbedding, toVectorLiteral } from "./embedding-pipeline.js";
import type { RagSourceType, SensitivityLevel } from "./types.js";

async function getPool() {
  const { pool } = await import("@szl-holdings/db");
  return pool;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SemanticSearchResult {
  id: string;
  title: string;
  content: string;
  snippet: string;
  domain: string;
  sourceType: string;
  score: number;
  vectorScore: number;
  textScore: number;
  matchType: "semantic" | "keyword" | "hybrid";
  metadata: Record<string, unknown>;
  citationId?: string;
}

export interface HybridSearchOptions {
  query: string;
  domains?: string[];
  sourceTypes?: string[];
  limit?: number;
  minScore?: number;
  vectorWeight?: number;
  textWeight?: number;
  metadataFilters?: Record<string, unknown>;
  sensitivityLevel?: SensitivityLevel;
  includeEmbeddings?: boolean;
  /** Org/tenant ID for multi-tenant isolation. Restricts results to entities whose
   *  tenant_id matches or is NULL (shared/global entities). */
  tenantId?: string;
}

export interface HybridSearchResponse {
  results: SemanticSearchResult[];
  query: string;
  totalFound: number;
  latencyMs: number;
  method: "semantic" | "keyword" | "hybrid";
  modelUsed?: string;
}

// ─── RRF Scoring ──────────────────────────────────────────────────────────────

const RRF_K = 60;

/**
 * Normalized RRF score: raw = 1/(K+rank), then * (K+1) so rank=1 gives 1.0.
 * This maps scores to a (0, 1] range compatible with minScore thresholds.
 * - Rank 1: 1.0  (i.e. 61/61)
 * - Rank 10: ~0.86  (61/70)
 * - Rank 100: ~0.38  (61/160)
 */
function rrfScore(rank: number): number {
  return (RRF_K + 1) / (RRF_K + rank);
}

function mergeWithRRF(
  vectorResults: Array<{ id: string; score: number }>,
  textResults: Array<{ id: string; score: number }>,
  vectorWeight = 0.7,
  textWeight = 0.3,
): Map<string, { vectorScore: number; textScore: number; rrfScore: number }> {
  const scores = new Map<string, { vectorScore: number; textScore: number; rrfScore: number }>();

  vectorResults.forEach((r, i) => {
    scores.set(r.id, {
      vectorScore: r.score,
      textScore: 0,
      rrfScore: rrfScore(i + 1) * vectorWeight,
    });
  });

  textResults.forEach((r, i) => {
    const existing = scores.get(r.id);
    const textRRF = rrfScore(i + 1) * textWeight;
    if (existing) {
      existing.textScore = r.score;
      existing.rrfScore += textRRF;
    } else {
      scores.set(r.id, {
        vectorScore: 0,
        textScore: r.score,
        rrfScore: textRRF,
      });
    }
  });

  return scores;
}

// ─── Semantic Search on RAG Chunks ────────────────────────────────────────────

export async function hybridSearch(options: HybridSearchOptions): Promise<HybridSearchResponse> {
  const startMs = Date.now();
  const {
    query,
    domains,
    sourceTypes,
    limit = 10,
    minScore = 0.1,
    vectorWeight = 0.7,
    textWeight = 0.3,
    sensitivityLevel = "restricted",
    tenantId,
  } = options;

  const pool = await getPool();

  const SENSITIVITY_ORDER: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];
  const allowedLevels = SENSITIVITY_ORDER.slice(0, SENSITIVITY_ORDER.indexOf(sensitivityLevel) + 1);

  let vectorResults: Array<{ id: string; content: string; source: string; sourceType: string; domain: string; metadata: Record<string, unknown>; score: number }> = [];
  let textResults: Array<{ id: string; content: string; source: string; sourceType: string; domain: string; metadata: Record<string, unknown>; score: number }> = [];
  let modelUsed: string | undefined;

  try {
    const embedding = await generateEmbedding(query);
    modelUsed = process.env["HF_EMBED_MODEL"] ?? "BAAI/bge-m3";

    // A zero vector means the embedding provider failed (auth error, API down, etc.).
    // Running vector similarity on a zero query would return arbitrary low-quality
    // results rather than semantically relevant ones. Fall back to text-only mode.
    const isZeroQuery = embedding.length === 0 || embedding.every((v) => v === 0);
    if (isZeroQuery) {
      console.warn(`[semantic-search] Zero query embedding for hybridSearch — falling back to text-only`);
      throw new Error("zero-embedding-fallback");
    }

    const vecParams: unknown[] = [toVectorLiteral(embedding), allowedLevels];
    const vecConditions = ["sensitivity_level = ANY($2)", "embedding IS NOT NULL"];
    let vecP = 3;
    if (domains?.length) { vecConditions.push(`domain = ANY($${vecP++})`); vecParams.push(domains); }
    if (sourceTypes?.length) { vecConditions.push(`source_type = ANY($${vecP++})`); vecParams.push(sourceTypes); }
    // Tenant isolation: restrict to chunks without an org context (shared) or matching the caller's org
    if (tenantId) { vecConditions.push(`(metadata->>'orgId' IS NULL OR metadata->>'orgId' = $${vecP++})`); vecParams.push(tenantId); }
    if (options.metadataFilters && Object.keys(options.metadataFilters).length > 0) {
      vecConditions.push(`metadata @> $${vecP++}::jsonb`);
      vecParams.push(JSON.stringify(options.metadataFilters));
    }
    vecParams.push(limit * 3);

    const vectorSql = `
      SELECT id, content, source, source_type, domain, metadata,
             1 - (embedding <=> $1::vector) AS score
      FROM rag_knowledge_chunks
      WHERE ${vecConditions.join(" AND ")}
      ORDER BY embedding <=> $1::vector
      LIMIT $${vecP}
    `;

    const vecResult = await pool.query(vectorSql, vecParams);
    vectorResults = vecResult.rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      content: r.content as string,
      source: r.source as string,
      sourceType: r.source_type as string,
      domain: r.domain as string,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      score: parseFloat(String(r.score ?? 0)),
    }));
  } catch (err) {
    console.warn("[semantic-search] Vector search failed:", err);
  }

  try {
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (queryWords.length > 0) {
      const tsQuery = queryWords.map((w) => `${w}:*`).join(" | ");
      const textParams: unknown[] = [allowedLevels];
      const textConditions = ["sensitivity_level = ANY($1)"];
      let txtP = 2;
      if (domains?.length) { textConditions.push(`domain = ANY($${txtP++})`); textParams.push(domains); }
      if (sourceTypes?.length) { textConditions.push(`source_type = ANY($${txtP++})`); textParams.push(sourceTypes); }
      if (tenantId) { textConditions.push(`(metadata->>'orgId' IS NULL OR metadata->>'orgId' = $${txtP++})`); textParams.push(tenantId); }
      if (options.metadataFilters && Object.keys(options.metadataFilters).length > 0) {
        textConditions.push(`metadata @> $${txtP++}::jsonb`);
        textParams.push(JSON.stringify(options.metadataFilters));
      }
      textParams.push(tsQuery);
      textParams.push(limit * 3);

      const textSql = `
        SELECT id, content, source, source_type, domain, metadata,
               ts_rank(to_tsvector('english', content), to_tsquery('english', $${txtP})) AS score
        FROM rag_knowledge_chunks
        WHERE ${textConditions.join(" AND ")}
          AND to_tsvector('english', content) @@ to_tsquery('english', $${txtP})
        ORDER BY score DESC
        LIMIT $${txtP + 1}
      `;

      const textResult = await pool.query(textSql, textParams);
      textResults = textResult.rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        content: r.content as string,
        source: r.source as string,
        sourceType: r.source_type as string,
        domain: r.domain as string,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
        score: parseFloat(String(r.score ?? 0)),
      }));
    }
  } catch (err) {
    console.warn("[semantic-search] Text search failed:", err);
  }

  const hasVector = vectorResults.length > 0;
  const hasText = textResults.length > 0;

  let method: "semantic" | "keyword" | "hybrid" = "hybrid";
  if (hasVector && !hasText) method = "semantic";
  else if (!hasVector && hasText) method = "keyword";

  const rrfScores = mergeWithRRF(
    vectorResults.map((r) => ({ id: r.id, score: r.score })),
    textResults.map((r) => ({ id: r.id, score: r.score })),
    vectorWeight,
    textWeight,
  );

  const allResults = new Map<string, (typeof vectorResults)[0]>();
  for (const r of vectorResults) allResults.set(r.id, r);
  for (const r of textResults) {
    if (!allResults.has(r.id)) allResults.set(r.id, r);
  }

  const merged = Array.from(rrfScores.entries())
    .map(([id, scores]) => {
      const result = allResults.get(id);
      if (!result) return null;
      const snippet = result.content.slice(0, 300).replace(/\s+/g, " ").trim() + (result.content.length > 300 ? "..." : "");
      return {
        id,
        title: (result.metadata?.title as string) || result.source || id,
        content: result.content,
        snippet,
        domain: result.domain,
        sourceType: result.sourceType,
        score: scores.rrfScore,
        vectorScore: scores.vectorScore,
        textScore: scores.textScore,
        matchType: method,
        metadata: result.metadata,
        citationId: `cite:${id}`,
      } as SemanticSearchResult;
    })
    .filter((r): r is SemanticSearchResult => r !== null && r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    results: merged,
    query,
    totalFound: rrfScores.size,
    latencyMs: Date.now() - startMs,
    method,
    ...(modelUsed !== undefined ? { modelUsed } : {}),
  };
}

// ─── Cross-Domain Unified Search ──────────────────────────────────────────────

export interface UnifiedSearchOptions {
  query: string;
  domains?: string[];
  limit?: number;
  includeGraph?: boolean;
  tenantId?: string;
}

export interface UnifiedSearchResult {
  chunks: SemanticSearchResult[];
  graphEntities?: Array<{
    id: string;
    name: string;
    entityType: string;
    domain: string;
    score: number;
  }>;
  totalFound: number;
  latencyMs: number;
}

export async function unifiedSemanticSearch(options: UnifiedSearchOptions): Promise<UnifiedSearchResult> {
  const startMs = Date.now();
  const pool = await getPool();
  const { query, domains, limit = 10, includeGraph = false, tenantId } = options;

  const [chunkResults, graphResults] = await Promise.all([
    hybridSearch({ query, limit, minScore: 0.05, ...(domains !== undefined ? { domains } : {}), ...(tenantId !== undefined ? { tenantId } : {}) }).catch(() => null),
    includeGraph
      ? (async () => {
          const embedding = await generateEmbedding(query).catch(() => [] as number[]);
          if (embedding.length === 0) return [];
          // Guard: all-zero vector produces meaningless cosine similarity scores — skip.
          if (embedding.every((v) => v === 0)) return [];
          const conditions = ["is_active = true", "embedding IS NOT NULL"];
          const params: unknown[] = [toVectorLiteral(embedding)];
          let p = 2;
          if (domains?.length) {
            conditions.push(`domain = ANY($${p++})`);
            params.push(domains);
          }
          if (tenantId) {
            conditions.push(`(tenant_id IS NULL OR tenant_id = $${p++})`);
            params.push(tenantId);
          }
          params.push(limit);
          const result = await pool.query(
            `SELECT id, name, entity_type, domain, 1 - (embedding <=> $1::vector) AS score
             FROM kg_entities
             WHERE ${conditions.join(" AND ")}
             ORDER BY embedding <=> $1::vector
             LIMIT $${params.length}`,
            params,
          );
          return result.rows.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            name: r.name as string,
            entityType: r.entity_type as string,
            domain: r.domain as string,
            score: parseFloat(String(r.score ?? 0)),
          }));
        })()
      : Promise.resolve(undefined),
  ]);

  const _graphEntities = graphResults as UnifiedSearchResult["graphEntities"];
  return {
    chunks: chunkResults?.results ?? [],
    ...(_graphEntities !== undefined ? { graphEntities: _graphEntities } : {}),
    totalFound: (chunkResults?.totalFound ?? 0) + ((graphResults as unknown[])?.length ?? 0),
    latencyMs: Date.now() - startMs,
  };
}

// ─── RAG Context Builder (vector-powered) ─────────────────────────────────────

export async function buildVectorRAGContext(
  query: string,
  options: {
    domain?: string;
    limit?: number;
    minScore?: number;
    includeGraph?: boolean;
    tenantId?: string;
  } = {},
): Promise<{ context: string; citations: Array<{ id: string; title: string; domain: string; score: number }> }> {
  const { domain, limit = 5, minScore = 0.05, includeGraph = false, tenantId } = options;

  const _vDomains = domain ? [domain] : undefined;
  const [chunkResults, graphResult] = await Promise.all([
    hybridSearch({
      query,
      limit,
      minScore,
      ...(_vDomains !== undefined ? { domains: _vDomains } : {}),
      ...(tenantId !== undefined ? { tenantId } : {}),
    }),
    includeGraph
      ? unifiedSemanticSearch({ query, limit, includeGraph: true, ...(_vDomains !== undefined ? { domains: _vDomains } : {}), ...(tenantId !== undefined ? { tenantId } : {}) })
      : Promise.resolve(null),
  ]);

  if (chunkResults.results.length === 0 && !graphResult?.graphEntities?.length) {
    return { context: "", citations: [] };
  }

  const parts = chunkResults.results.map((r, i) =>
    `[${i + 1}] [${r.sourceType.toUpperCase()} | ${r.domain} | relevance: ${Math.round(r.score * 100)}%]\n**${r.title}**\n${r.snippet}`,
  );

  if (graphResult?.graphEntities?.length) {
    const graphParts = graphResult.graphEntities.map(
      (e, i) =>
        `[G${i + 1}] [GRAPH ENTITY | ${e.domain} | relevance: ${Math.round((e.score ?? 0) * 100)}%]\n**${e.name}** (${e.entityType})`,
    );
    parts.push(...graphParts);
  }

  const method = `${chunkResults.method}${includeGraph ? "+graph" : ""}`;
  const context = `## Retrieved Knowledge Context (${method})\n\n${parts.join("\n\n---\n\n")}`;
  const citations = chunkResults.results.map((r) => ({
    id: r.citationId ?? r.id,
    title: r.title,
    domain: r.domain,
    score: r.score,
  }));

  return { context, citations };
}
