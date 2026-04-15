/**
 * RAG Knowledge Store — upgraded to use vector similarity retrieval.
 * Falls back to full-text and keyword search when vector unavailable.
 */

import { pool } from "@szl-holdings/db";
import { generateEmbedding, toVectorLiteral } from "../embedding-pipeline.js";

export interface KnowledgeDocument {
  docId: string;
  title: string;
  content: string;
  domain: string;
  sourceType: "decision" | "incident" | "case_memory" | "document" | "research" | "policy" | "security_finding" | "threat_scenario" | "security_alert";
  tags: string[];
  importance: number;
  /** Optional extra metadata persisted with the RAG chunk (e.g. orgId for tenant isolation). */
  extraMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RetrievalResult {
  docId: string;
  title: string;
  content: string;
  domain: string;
  sourceType: string;
  relevanceScore: number;
  snippet: string;
  matchType?: "vector" | "fulltext" | "keyword";
  citationId?: string;
}


export async function ingestDocument(doc: Omit<KnowledgeDocument, "createdAt" | "updatedAt">): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO rag_knowledge_documents (doc_id, title, content, domain, source_type, tags, importance, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (doc_id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        tags = EXCLUDED.tags,
        importance = EXCLUDED.importance,
        updated_at = NOW()
    `, [doc.docId, doc.title, doc.content, doc.domain, doc.sourceType, JSON.stringify(doc.tags), doc.importance]);

    const ingestText = `${doc.title}\n\n${doc.content}`.slice(0, 8000);
    const activeModelId = process.env["HF_EMBED_MODEL"] ?? "BAAI/bge-m3";
    generateEmbedding(ingestText).then(async (embedding) => {
      if (embedding.every((v) => v === 0)) {
        console.warn(`[rag-knowledge-store] Zero embedding for doc=${doc.docId}; skipping vector upsert`);
        return;
      }
      await pool.query(
        `INSERT INTO rag_knowledge_chunks
           (id, content, source, source_type, domain, sensitivity_level, object_id, chunk_index, chunk_hash, metadata, embedding, embedding_model, embedding_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'internal', $6, 0, $7, $8, $9::vector, $10, NOW(), NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           content = EXCLUDED.content,
           embedding = EXCLUDED.embedding,
           embedding_model = EXCLUDED.embedding_model,
           embedding_at = EXCLUDED.embedding_at,
           updated_at = NOW()`,
        [
          `doc_${doc.docId}`,
          doc.content.slice(0, 4000),
          doc.title,
          doc.sourceType,
          doc.domain,
          doc.docId,
          doc.docId.slice(0, 16),
          JSON.stringify({ title: doc.title, docId: doc.docId, tags: doc.tags, importance: doc.importance, ...(doc.extraMetadata ?? {}) }),
          toVectorLiteral(embedding),
          activeModelId,
        ],
      );
    }).catch((err: unknown) => {
      console.error(`[rag-knowledge-store] Vector ingest failed for doc=${doc.docId}:`, err);
    });
  } catch (err) {
    console.warn("[rag-knowledge-store] Ingest failed:", err);
  }
}

export async function ingestBatch(docs: Omit<KnowledgeDocument, "createdAt" | "updatedAt">[]): Promise<void> {
  await Promise.all(docs.map(ingestDocument));
}

export async function retrieveRelevantContext(
  query: string,
  options: { domain?: string; limit?: number; minRelevance?: number; tenantId?: string } = {},
): Promise<RetrievalResult[]> {
  const limit = options.limit ?? 5;
  const minRelevance = options.minRelevance ?? 0.05;

  try {
    const embedding = await generateEmbedding(query);
    const hasEmbedding = embedding.some((v) => v !== 0);

    if (hasEmbedding) {
      const vectorResults = await vectorRetrieve(query, embedding, options);
      if (vectorResults.length > 0) {
        return vectorResults.filter((r) => r.relevanceScore >= minRelevance).slice(0, limit);
      }
    }

    // When a tenantId is provided, skip the unscoped fulltext fallback to be
    // fail-closed: rag_knowledge_documents has no orgId column and cannot enforce
    // tenant boundaries. Return empty rather than risk cross-tenant leakage.
    if (options.tenantId) {
      console.warn("[rag-knowledge-store] Vector retrieval unavailable for tenant-scoped query — returning empty (fail-closed)");
      return [];
    }

    return await fulltextRetrieve(query, options);
  } catch (err) {
    console.warn("[rag-knowledge-store] Retrieval failed:", err);
    // Fail-closed: never fall back to unscoped keyword search for tenant-scoped queries.
    // rag_knowledge_documents has no orgId column; using it under a tenantId would risk
    // cross-tenant data exposure.
    if (options.tenantId) {
      return [];
    }
    return await fallbackKeywordSearch(query, options);
  }
}

async function vectorRetrieve(
  query: string,
  embedding: number[],
  options: { domain?: string; limit?: number; tenantId?: string },
): Promise<RetrievalResult[]> {
  const limit = (options.limit ?? 5) * 3;
  const embeddingLiteral = toVectorLiteral(embedding);

  const conditions: string[] = ["embedding IS NOT NULL"];
  const params: unknown[] = [embeddingLiteral];
  let p = 2;

  if (options.domain) {
    conditions.push(`domain = $${p++}`);
    params.push(options.domain);
  }
  if (options.tenantId) {
    // Tenant-scoped retrieval: return chunks with no orgId (shared/global) or matching orgId.
    conditions.push(`(metadata->>'orgId' IS NULL OR metadata->>'orgId' = $${p++})`);
    params.push(options.tenantId);
  }
  params.push(limit);

  const result = await pool.query(
    `SELECT id, content, source, source_type, domain, metadata,
            1 - (embedding <=> $1::vector) AS score
     FROM rag_knowledge_chunks
     WHERE ${conditions.join(" AND ")}
     ORDER BY embedding <=> $1::vector
     LIMIT $${p}`,
    params,
  );

  return result.rows.map((r: Record<string, unknown>) => {
    const content = r.content as string;
    const metadata = (r.metadata as Record<string, unknown>) ?? {};
    const score = parseFloat(String(r.score ?? 0));
    const snippet = content.slice(0, 300).replace(/\s+/g, " ").trim() + (content.length > 300 ? "..." : "");
    return {
      docId: (metadata.docId as string) || (r.id as string),
      title: (metadata.title as string) || (r.source as string) || "Knowledge Item",
      content,
      domain: r.domain as string,
      sourceType: r.source_type as string,
      relevanceScore: score,
      snippet,
      matchType: "vector" as const,
      citationId: `cite:${r.id as string}`,
    };
  });
}

async function fulltextRetrieve(
  query: string,
  options: { domain?: string; limit?: number },
): Promise<RetrievalResult[]> {
  const limit = options.limit ?? 5;
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (queryWords.length === 0) return [];

  const tsQuery = queryWords.map((w) => `${w}:*`).join(" | ");
  const params: unknown[] = [tsQuery];
  let p = 2;

  let sql = `
    SELECT doc_id, title, content, domain, source_type, importance,
           ts_rank(to_tsvector('english', content || ' ' || title), to_tsquery('english', $1)) AS rank
    FROM rag_knowledge_documents
    WHERE to_tsvector('english', content || ' ' || title) @@ to_tsquery('english', $1)
  `;

  if (options.domain) {
    sql += ` AND domain = $${p++}`;
    params.push(options.domain);
  }

  sql += ` ORDER BY rank * importance DESC LIMIT $${p}`;
  params.push(limit * 3);

  const result = await pool.query(sql, params);

  return result.rows.map((r: Record<string, unknown>) => {
    const content = r.content as string;
    const rank = parseFloat(String(r.rank ?? 0));
    const importance = Number(r.importance ?? 5);
    const relevanceScore = Math.min(1.0, (rank * importance) / 50);
    const snippet = content.slice(0, 300).replace(/\s+/g, " ").trim() + (content.length > 300 ? "..." : "");
    return {
      docId: r.doc_id as string,
      title: r.title as string,
      content,
      domain: r.domain as string,
      sourceType: r.source_type as string,
      relevanceScore,
      snippet,
      matchType: "fulltext" as const,
      citationId: `cite:doc_${r.doc_id as string}`,
    };
  });
}

async function fallbackKeywordSearch(
  query: string,
  options: { domain?: string; limit?: number; minRelevance?: number },
): Promise<RetrievalResult[]> {
  try {
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const likeConditions = queryWords.slice(0, 3).map((_, i) => `(LOWER(content) LIKE $${i + 2} OR LOWER(title) LIKE $${i + 2})`).join(" OR ");
    if (!likeConditions) return [];

    const values: unknown[] = [options.domain ?? null, ...queryWords.slice(0, 3).map((w) => `%${w}%`)];
    const domainFilter = options.domain ? "domain = $1 AND" : "";

    const result = await pool.query(`
      SELECT doc_id, title, content, domain, source_type, importance
      FROM rag_knowledge_documents
      WHERE ${domainFilter} (${likeConditions})
      ORDER BY importance DESC
      LIMIT $${values.length + 1}
    `, [...values, options.limit ?? 5]);

    return result.rows.map((r: Record<string, unknown>) => {
      const content = r.content as string;
      const snippet = content.slice(0, 300) + (content.length > 300 ? "..." : "");
      return {
        docId: r.doc_id as string,
        title: r.title as string,
        content,
        domain: r.domain as string,
        sourceType: r.source_type as string,
        relevanceScore: 0.2,
        snippet,
        matchType: "keyword" as const,
      };
    });
  } catch {
    return [];
  }
}

export async function buildRAGContext(query: string, domain?: string): Promise<string> {
  const results = await retrieveRelevantContext(query, { domain, limit: 5 });
  if (results.length === 0) return "";

  const parts = results.map((r) =>
    `[${r.sourceType.toUpperCase()} | ${r.domain} | ${r.matchType ?? "search"} | relevance: ${Math.round(r.relevanceScore * 100)}%]\n**${r.title}**\n${r.snippet}`,
  );

  return `## Retrieved Knowledge Context\n${parts.join("\n\n---\n\n")}`;
}

export async function buildRAGContextWithCitations(
  query: string,
  domain?: string,
): Promise<{ context: string; citations: Array<{ id: string; title: string; domain: string; score: number }> }> {
  const results = await retrieveRelevantContext(query, { domain, limit: 5 });
  if (results.length === 0) return { context: "", citations: [] };

  const parts = results.map((r, i) =>
    `[${i + 1}] [${r.sourceType.toUpperCase()} | ${r.domain} | relevance: ${Math.round(r.relevanceScore * 100)}%]\n**${r.title}**\n${r.snippet}`,
  );

  const context = `## Retrieved Knowledge Context\n\n${parts.join("\n\n---\n\n")}`;
  const citations = results.map((r) => ({
    id: r.citationId ?? r.docId,
    title: r.title,
    domain: r.domain,
    score: r.relevanceScore,
  }));

  return { context, citations };
}

export async function getKnowledgeStoreStats(): Promise<{
  totalDocuments: number;
  byDomain: Record<string, number>;
  bySourceType: Record<string, number>;
  vectorChunks?: number;
}> {
  try {
    const [totalResult, domainResult, sourceResult, vectorResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as total FROM rag_knowledge_documents"),
      pool.query("SELECT domain, COUNT(*)::int as count FROM rag_knowledge_documents GROUP BY domain"),
      pool.query("SELECT source_type, COUNT(*)::int as count FROM rag_knowledge_documents GROUP BY source_type"),
      pool.query("SELECT COUNT(*)::int as total FROM rag_knowledge_chunks WHERE embedding IS NOT NULL").catch(() => null),
    ]);

    const byDomain: Record<string, number> = {};
    for (const row of domainResult.rows as Array<{ domain: string; count: number }>) {
      byDomain[row.domain] = row.count;
    }

    const bySourceType: Record<string, number> = {};
    for (const row of sourceResult.rows as Array<{ source_type: string; count: number }>) {
      bySourceType[row.source_type] = row.count;
    }

    return {
      totalDocuments: (totalResult.rows[0] as { total: number }).total,
      byDomain,
      bySourceType,
      vectorChunks: vectorResult ? (vectorResult.rows[0] as { total: number }).total : undefined,
    };
  } catch {
    return { totalDocuments: 0, byDomain: {}, bySourceType: {} };
  }
}

export async function autoIngestFromDecisionStore(): Promise<number> {
  try {
    const result = await pool.query(`
      SELECT decision_id, recommended_action, rationale_summary, risk_level, model_route, created_at
      FROM alloy_ai_decisions
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const docs = result.rows.map((r: Record<string, unknown>) => ({
      docId: `decision_${r.decision_id}`,
      title: `AI Decision: ${r.recommended_action}`.slice(0, 200),
      content: `Recommended Action: ${r.recommended_action}\n\nRationale: ${r.rationale_summary}\n\nRisk Level: ${r.risk_level}`,
      domain: "orchestration",
      sourceType: "decision" as const,
      tags: ["decision", r.risk_level as string].filter(Boolean),
      importance: r.risk_level === "critical" ? 9 : r.risk_level === "high" ? 7 : 5,
    }));

    await ingestBatch(docs);
    return docs.length;
  } catch (err) {
    console.warn("[rag-knowledge-store] Auto-ingest failed:", err);
    return 0;
  }
}
