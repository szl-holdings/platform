import { pool } from "@szl-holdings/db";

export interface KnowledgeDocument {
  docId: string;
  title: string;
  content: string;
  domain: string;
  sourceType: "decision" | "incident" | "case_memory" | "document" | "research" | "policy";
  tags: string[];
  importance: number;
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
}

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS rag_knowledge_documents (
  doc_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  source_type TEXT NOT NULL DEFAULT 'document',
  tags JSONB NOT NULL DEFAULT '[]',
  importance INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rag_docs_domain_idx ON rag_knowledge_documents(domain);
CREATE INDEX IF NOT EXISTS rag_docs_source_type_idx ON rag_knowledge_documents(source_type);
`;

let bootstrapped = false;

async function ensureTables(): Promise<void> {
  if (bootstrapped) return;
  try {
    await pool.query(BOOTSTRAP_SQL);
    bootstrapped = true;
  } catch (err) {
    console.warn("[rag-knowledge-store] Bootstrap failed (non-fatal):", err);
  }
}

export async function ingestDocument(doc: Omit<KnowledgeDocument, "createdAt" | "updatedAt">): Promise<void> {
  await ensureTables();
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
  } catch (err) {
    console.warn("[rag-knowledge-store] Ingest failed:", err);
  }
}

export async function ingestBatch(docs: Omit<KnowledgeDocument, "createdAt" | "updatedAt">[]): Promise<void> {
  await Promise.all(docs.map(ingestDocument));
}

function computeKeywordRelevance(content: string, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const contentLower = content.toLowerCase();
  let matches = 0;
  for (const word of queryWords) {
    const count = (contentLower.match(new RegExp(word, "g")) ?? []).length;
    matches += Math.min(count, 3);
  }
  return Math.min(1.0, matches / Math.max(queryWords.length * 2, 1));
}

export async function retrieveRelevantContext(
  query: string,
  options: { domain?: string; limit?: number; minRelevance?: number } = {},
): Promise<RetrievalResult[]> {
  await ensureTables();

  const limit = options.limit ?? 5;
  const minRelevance = options.minRelevance ?? 0.1;

  try {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (queryWords.length === 0) return [];

    const tsQuery = queryWords.map(w => `${w}:*`).join(" | ");

    let sql = `
      SELECT doc_id, title, content, domain, source_type, importance,
             ts_rank(to_tsvector('english', content || ' ' || title), to_tsquery('english', $1)) AS rank
      FROM rag_knowledge_documents
      WHERE to_tsvector('english', content || ' ' || title) @@ to_tsquery('english', $1)
    `;
    const values: unknown[] = [tsQuery];

    if (options.domain) {
      sql += ` AND domain = $${values.length + 1}`;
      values.push(options.domain);
    }

    sql += ` ORDER BY rank * importance DESC LIMIT $${values.length + 1}`;
    values.push(limit * 3);

    const result = await pool.query(sql, values);

    const scored: RetrievalResult[] = result.rows
      .map((r: Record<string, unknown>) => {
        const content = r.content as string;
        const relevanceScore = computeKeywordRelevance(content, query) * (Number(r.importance ?? 5) / 10);
        const snippet = content.slice(0, 300).replace(/\s+/g, " ").trim() + (content.length > 300 ? "..." : "");
        return {
          docId: r.doc_id as string,
          title: r.title as string,
          content,
          domain: r.domain as string,
          sourceType: r.source_type as string,
          relevanceScore,
          snippet,
        };
      })
      .filter(r => r.relevanceScore >= minRelevance)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return scored;
  } catch (err) {
    console.warn("[rag-knowledge-store] Retrieval failed:", err);
    return await fallbackKeywordSearch(query, options);
  }
}

async function fallbackKeywordSearch(
  query: string,
  options: { domain?: string; limit?: number; minRelevance?: number },
): Promise<RetrievalResult[]> {
  try {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const likeConditions = queryWords.slice(0, 3).map((_, i) => `(LOWER(content) LIKE $${i + 2} OR LOWER(title) LIKE $${i + 2})`).join(" OR ");
    if (!likeConditions) return [];

    const values: unknown[] = [options.domain ?? null, ...queryWords.slice(0, 3).map(w => `%${w}%`)];
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
      const relevance = computeKeywordRelevance(content, query);
      return {
        docId: r.doc_id as string,
        title: r.title as string,
        content,
        domain: r.domain as string,
        sourceType: r.source_type as string,
        relevanceScore: relevance,
        snippet: content.slice(0, 300) + (content.length > 300 ? "..." : ""),
      };
    }).filter(r => r.relevanceScore >= (options.minRelevance ?? 0.1));
  } catch {
    return [];
  }
}

export async function buildRAGContext(query: string, domain?: string): Promise<string> {
  const results = await retrieveRelevantContext(query, { domain, limit: 5 });
  if (results.length === 0) return "";

  const parts = results.map(r =>
    `[${r.sourceType.toUpperCase()} | ${r.domain} | relevance: ${Math.round(r.relevanceScore * 100)}%]\n**${r.title}**\n${r.snippet}`
  );

  return `## Retrieved Knowledge Context\n${parts.join("\n\n---\n\n")}`;
}

export async function getKnowledgeStoreStats(): Promise<{
  totalDocuments: number;
  byDomain: Record<string, number>;
  bySourceType: Record<string, number>;
}> {
  await ensureTables();
  try {
    const [totalResult, domainResult, sourceResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as total FROM rag_knowledge_documents"),
      pool.query("SELECT domain, COUNT(*)::int as count FROM rag_knowledge_documents GROUP BY domain"),
      pool.query("SELECT source_type, COUNT(*)::int as count FROM rag_knowledge_documents GROUP BY source_type"),
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
    };
  } catch {
    return { totalDocuments: 0, byDomain: {}, bySourceType: {} };
  }
}

export async function autoIngestFromDecisionStore(): Promise<number> {
  await ensureTables();
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
