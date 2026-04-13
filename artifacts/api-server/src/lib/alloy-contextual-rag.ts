import { pool } from "@szl-holdings/db";
import { gatewayInfer } from "./ai-gateway";
import { logger } from "./logger";

export interface ContextualChunk {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  rawContent: string;
  contextualDescription: string;
  enrichedContent: string;
  domain: string;
  tokenCount: number;
  bm25Keywords: string[];
}

export interface RagSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  contextualDescription: string;
  domain: string;
  vectorScore: number;
  bm25Score: number;
  combinedScore: number;
  rerankScore?: number;
  snippet: string;
}

export interface RagSearchOptions {
  query: string;
  domain?: string;
  topK?: number;
  vectorWeight?: number;
  bm25Weight?: number;
  rerank?: boolean;
  minScore?: number;
}

async function ensureRagTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_contextual_chunks (
      chunk_id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      chunk_index INT NOT NULL DEFAULT 0,
      raw_content TEXT NOT NULL,
      contextual_description TEXT NOT NULL DEFAULT '',
      enriched_content TEXT NOT NULL,
      domain TEXT NOT NULL DEFAULT 'general',
      token_count INT NOT NULL DEFAULT 0,
      bm25_keywords TEXT[] NOT NULL DEFAULT '{}',
      embedding_model TEXT DEFAULT 'postgres-fts',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_chunks_document ON alloy_contextual_chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_domain ON alloy_contextual_chunks(domain);
    CREATE INDEX IF NOT EXISTS idx_chunks_bm25 ON alloy_contextual_chunks USING GIN(bm25_keywords);
    ALTER TABLE alloy_contextual_chunks ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
    CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON alloy_contextual_chunks USING GIN(search_vector);
  `);
}

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try { await ensureRagTables(); tablesEnsured = true; } catch (err) {
    logger.warn({ err }, "RAG table ensure failed");
  }
}

function chunkDocument(content: string, chunkSize = 800, overlap = 100): string[] {
  const sentences = content.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      const overlapWords = current.split(/\s+/).slice(-Math.floor(overlap / 5));
      current = overlapWords.join(" ") + " " + sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function extractBm25Keywords(text: string): string[] {
  const stopwords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "shall", "should", "may", "might", "must", "can", "could", "of", "it", "its", "that", "this", "with", "as"]);
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopwords.has(w)) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w]) => w);
}

function bm25Score(query: string, keywords: string[], k1 = 1.5, b = 0.75): number {
  const queryTerms = query.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  let score = 0;
  const dl = keywords.length;
  const avgdl = 20;
  for (const term of queryTerms) {
    const tf = keywords.filter(k => k === term).length;
    if (tf > 0) {
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (dl / avgdl));
      score += numerator / denominator;
    }
  }
  return Math.min(1, score / Math.max(queryTerms.length, 1));
}

export async function ingestDocumentWithContextualEmbeddings(params: {
  documentId: string;
  content: string;
  domain: string;
  filename?: string;
  chunkSize?: number;
}): Promise<{ chunksCreated: number; tokensUsed: number }> {
  await ensureTables();

  const rawChunks = chunkDocument(params.content, params.chunkSize ?? 800);
  const documentSummary = params.content.slice(0, 400);

  let totalTokens = 0;
  let chunksCreated = 0;

  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i];
    const chunkId = `chunk_${params.documentId}_${i}`;

    let contextualDescription = `Chunk ${i + 1} of ${rawChunks.length} from document.`;
    try {
      const response = await gatewayInfer({
        messages: [
          {
            role: "system",
            content: `You are a contextual embedding assistant. Generate a brief (1-2 sentence) description that situates this chunk within its parent document context. This description will be prepended to the chunk before embedding to improve retrieval accuracy.`,
          },
          {
            role: "user",
            content: `Document summary: ${documentSummary}\n\nChunk ${i + 1}/${rawChunks.length}:\n${chunk}`,
          },
        ],
        maxTokens: 150,
        strategy: "cheapest",
      });
      contextualDescription = response.content.trim();
      totalTokens += response.usage?.totalTokens ?? 0;
    } catch (err) {
      logger.warn({ err, chunkId }, "Contextual description generation failed");
    }

    const enrichedContent = `${contextualDescription}\n\n${chunk}`;
    const keywords = extractBm25Keywords(enrichedContent);
    const tokenCount = Math.ceil(enrichedContent.length / 4);

    try {
      await pool.query(
        `INSERT INTO alloy_contextual_chunks
         (chunk_id, document_id, chunk_index, raw_content, contextual_description, enriched_content, domain, token_count, bm25_keywords, search_vector)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_tsvector('english', $6))
         ON CONFLICT (chunk_id) DO UPDATE SET
           contextual_description = $5,
           enriched_content = $6,
           bm25_keywords = $9,
           domain = $7,
           search_vector = to_tsvector('english', $6)`,
        [chunkId, params.documentId, i, chunk, contextualDescription, enrichedContent,
         params.domain, tokenCount, keywords]
      );
      chunksCreated++;
    } catch (err) {
      logger.warn({ err, chunkId }, "Failed to store contextual chunk");
    }
  }

  return { chunksCreated, tokensUsed: totalTokens };
}

export async function hybridRagSearch(options: RagSearchOptions): Promise<RagSearchResult[]> {
  await ensureTables();
  const topK = options.topK ?? 10;
  const vectorWeight = options.vectorWeight ?? 0.6;
  const bm25Weight = options.bm25Weight ?? 0.4;

  const queryKeywords = extractBm25Keywords(options.query);

  // Sanitize query for plainto_tsquery (strip special chars)
  const sanitizedQuery = options.query.replace(/[^a-zA-Z0-9\s]/g, " ").trim() || "general";

  const conditions: string[] = [];
  const values: unknown[] = [sanitizedQuery, topK * 3];
  let idx = 3;

  if (options.domain) {
    conditions.push(`domain = $${idx++}`);
    values.push(options.domain);
  }

  if (queryKeywords.length > 0) {
    conditions.push(`(bm25_keywords && $${idx++} OR search_vector @@ plainto_tsquery('english', $1))`);
    values.push(queryKeywords.slice(0, 10));
  } else {
    conditions.push(`search_vector @@ plainto_tsquery('english', $1)`);
  }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  let chunks: Array<{ chunk_id: string; document_id: string; raw_content: string; contextual_description: string; enriched_content: string; domain: string; bm25_keywords: string[]; ts_rank: number }> = [];
  try {
    const { rows } = await pool.query(
      `SELECT chunk_id, document_id, raw_content, contextual_description, enriched_content, domain, bm25_keywords,
              COALESCE(ts_rank(search_vector, plainto_tsquery('english', $1)), 0) as ts_rank
       FROM alloy_contextual_chunks
       WHERE 1=1 ${whereClause}
       ORDER BY ts_rank DESC, created_at DESC
       LIMIT $2`,
      values
    );
    chunks = rows;
  } catch (err) {
    logger.warn({ err }, "RAG search query failed");
    return [];
  }

  // Normalize ts_rank scores to 0-1 range
  const maxRank = Math.max(...chunks.map(c => c.ts_rank), 0.001);

  const scored: RagSearchResult[] = chunks.map(chunk => {
    const vectorScore = maxRank > 0 ? Math.min(1, chunk.ts_rank / maxRank) : 0;
    const bm25 = bm25Score(options.query, chunk.bm25_keywords || []);
    const combined = vectorScore * vectorWeight + bm25 * bm25Weight;

    const queryLower = options.query.toLowerCase();
    const contentLower = chunk.enriched_content.toLowerCase();
    const snippetStart = Math.max(0, contentLower.indexOf(queryLower.split(" ")[0]) - 50);
    const snippet = chunk.enriched_content.slice(snippetStart, snippetStart + 200);

    return {
      chunkId: chunk.chunk_id,
      documentId: chunk.document_id,
      content: chunk.enriched_content,
      contextualDescription: chunk.contextual_description,
      domain: chunk.domain,
      vectorScore,
      bm25Score: bm25,
      combinedScore: combined,
      snippet,
    };
  }).sort((a, b) => b.combinedScore - a.combinedScore);

  const topResults = scored.slice(0, topK * 2);

  if (options.rerank && topResults.length > 0) {
    return await rerankResults(options.query, topResults, topK);
  }

  return topResults.slice(0, topK).filter(r => r.combinedScore >= (options.minScore ?? 0));
}

async function rerankResults(
  query: string,
  results: RagSearchResult[],
  topK: number
): Promise<RagSearchResult[]> {
  try {
    const snippets = results.map((r, i) => `[${i}] ${r.snippet}`).join("\n\n");
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a relevance re-ranker. Given a query and search result snippets, return a JSON array of indices ordered by relevance (most relevant first).
Return ONLY a JSON array of integers, e.g.: [2, 0, 4, 1, 3]`,
        },
        { role: "user", content: `Query: ${query}\n\nResults:\n${snippets.slice(0, 3000)}` },
      ],
      maxTokens: 100,
      strategy: "cheapest",
    });

    const match = response.content.match(/\[[\d,\s]+\]/);
    if (match) {
      const ranking: number[] = JSON.parse(match[0]);
      const reranked = ranking
        .filter(i => i >= 0 && i < results.length)
        .map((i, rank) => ({ ...results[i], rerankScore: 1 - rank / results.length }));
      return reranked.slice(0, topK);
    }
  } catch (err) {
    logger.warn({ err }, "Re-ranking failed, using combined score order");
  }

  return results.slice(0, topK);
}

export async function getRagStats(): Promise<{
  totalChunks: number;
  chunksByDomain: Record<string, number>;
  avgChunkTokens: number;
  documentsIndexed: number;
}> {
  try {
    const { rows } = await pool.query(
      `SELECT domain, COUNT(*) as chunks, COUNT(DISTINCT document_id) as docs, AVG(token_count) as avg_tokens
       FROM alloy_contextual_chunks GROUP BY domain`
    );

    const chunksByDomain: Record<string, number> = {};
    let totalChunks = 0;
    let totalDocs = 0;
    let totalAvgTokens = 0;

    for (const row of rows) {
      chunksByDomain[row.domain] = parseInt(row.chunks);
      totalChunks += parseInt(row.chunks);
      totalDocs += parseInt(row.docs);
      totalAvgTokens += parseFloat(row.avg_tokens) * parseInt(row.chunks);
    }

    return {
      totalChunks,
      chunksByDomain,
      avgChunkTokens: totalChunks > 0 ? Math.round(totalAvgTokens / totalChunks) : 0,
      documentsIndexed: totalDocs,
    };
  } catch (err) {
    logger.warn({ err }, "Failed to fetch RAG stats");
    return { totalChunks: 0, chunksByDomain: {}, avgChunkTokens: 0, documentsIndexed: 0 };
  }
}
