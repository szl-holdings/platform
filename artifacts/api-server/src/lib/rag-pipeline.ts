import { logger } from "./logger";
import { gatewayInfer } from "./ai-gateway";
import { pool } from "@szl-holdings/db";

export interface DocumentChunk {
  documentId: string;
  collection: string;
  content: string;
  chunkIndex: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  documentId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
  chunkIndex: number;
}

export interface IngestResult {
  documentId: string;
  chunksCreated: number;
  collection: string;
}

function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      current = overlapWords.join(" ") + " " + sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: "You are an embedding encoder. Respond with ONLY a JSON array of 64 floating point numbers between -1 and 1 that represent the semantic meaning of the input text. No other text."
        },
        { role: "user", content: `Encode this text: "${text.slice(0, 500)}"` }
      ],
      model: "gpt-5-nano",
      maxTokens: 512,
      strategy: "fastest",
      agentId: "rag-embedder",
      domain: "system",
    });

    const match = result.content.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.slice(0, 64).map((n: number) => Math.max(-1, Math.min(1, n)));
        while (normalized.length < 64) normalized.push(0);
        return normalized;
      }
    }
  } catch (err) {
    logger.warn({ err }, "Embedding generation failed, using keyword fallback");
  }
  return null;
}

function keywordVector(text: string): number[] {
  const keywords = [
    "maritime", "vessel", "fleet", "port", "shipping", "cargo", "route", "ais",
    "security", "threat", "incident", "soc", "defense", "compliance", "vulnerability", "firewall",
    "ai", "model", "ml", "deployment", "training", "inference", "performance", "gpu",
    "property", "real estate", "pipeline", "deal", "market", "valuation", "distress", "listing",
    "legal", "matter", "case", "billing", "counsel", "compliance", "contract", "litigation",
    "consulting", "client", "advisory", "luxury", "engagement", "strategy", "service", "relationship",
    "enterprise", "platform", "analytics", "dashboard", "api", "database", "infrastructure", "system",
    "revenue", "growth", "metric", "kpi", "status", "operational", "monitor", "alert",
  ];
  const lower = text.toLowerCase();
  return keywords.map(k => lower.includes(k) ? 1.0 : 0.0);
}

export async function ingestDocument(
  documentId: string,
  content: string,
  collection = "general",
  metadata: Record<string, unknown> = {}
): Promise<IngestResult> {
  const chunks = chunkText(content);

  await pool.query("DELETE FROM ai_embeddings WHERE document_id = $1", [documentId]);

  let chunksCreated = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);
    const fallbackVec = embedding || keywordVector(chunk);
    const vecStr = `[${fallbackVec.join(",")}]`;

    try {
      await pool.query(
        `INSERT INTO ai_embeddings (collection, document_id, chunk_index, content, metadata, embedding, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::vector, NOW(), NOW())`,
        [collection, documentId, i, chunk, JSON.stringify(metadata), vecStr]
      );
      chunksCreated++;
    } catch (err) {
      logger.error({ err, documentId, chunkIndex: i }, "Failed to insert embedding chunk");
      await pool.query(
        `INSERT INTO ai_embeddings (collection, document_id, chunk_index, content, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [collection, documentId, i, chunk, JSON.stringify(metadata)]
      );
      chunksCreated++;
    }
  }

  logger.info({ documentId, collection, chunksCreated }, "Document ingested");
  return { documentId, chunksCreated, collection };
}

export async function searchKnowledge(
  query: string,
  options: { collection?: string; limit?: number; minSimilarity?: number } = {}
): Promise<SearchResult[]> {
  const { collection, limit = 5, minSimilarity = 0.1 } = options;

  const queryEmbedding = await generateEmbedding(query);
  const queryVec = queryEmbedding || keywordVector(query);
  const vecStr = `[${queryVec.join(",")}]`;

  try {
    let sql: string;
    let params: unknown[];

    if (queryEmbedding) {
      sql = `
        SELECT document_id, content, chunk_index, metadata,
               1 - (embedding <=> $1::vector) as similarity
        FROM ai_embeddings
        WHERE embedding IS NOT NULL
        ${collection ? "AND collection = $3" : ""}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;
      params = collection ? [vecStr, limit, collection] : [vecStr, limit];
    } else {
      sql = `
        SELECT document_id, content, chunk_index, metadata,
               ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) as similarity
        FROM ai_embeddings
        WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
        ${collection ? "AND collection = $3" : ""}
        ORDER BY similarity DESC
        LIMIT $2
      `;
      params = collection ? [query, limit, collection] : [query, limit];
    }

    const result = await pool.query(sql, params);

    return result.rows
      .filter((row: any) => row.similarity >= minSimilarity)
      .map((row: any) => ({
        documentId: row.document_id,
        content: row.content,
        similarity: parseFloat(row.similarity),
        metadata: row.metadata || {},
        chunkIndex: row.chunk_index,
      }));
  } catch (err) {
    logger.error({ err, query }, "Knowledge search failed, falling back to text search");
    try {
      const fallbackResult = await pool.query(
        `SELECT document_id, content, chunk_index, metadata, 0.5 as similarity
         FROM ai_embeddings
         WHERE content ILIKE $1
         ${collection ? "AND collection = $2" : ""}
         LIMIT $${collection ? "3" : "2"}`,
        collection ? [`%${query.slice(0, 100)}%`, collection, limit] : [`%${query.slice(0, 100)}%`, limit]
      );
      return fallbackResult.rows.map((row: any) => ({
        documentId: row.document_id,
        content: row.content,
        similarity: 0.5,
        metadata: row.metadata || {},
        chunkIndex: row.chunk_index,
      }));
    } catch {
      return [];
    }
  }
}

export async function ragQuery(
  question: string,
  options: { collection?: string; agentId?: string; systemContext?: string } = {}
): Promise<{ answer: string; sources: SearchResult[]; tokensUsed: number }> {
  const sources = await searchKnowledge(question, {
    collection: options.collection,
    limit: 5,
  });

  const contextChunks = sources.map((s, i) =>
    `[Source ${i + 1} — ${s.documentId} (relevance: ${(s.similarity * 100).toFixed(0)}%)]\n${s.content}`
  ).join("\n\n---\n\n");

  const systemPrompt = options.systemContext ||
    "You are an intelligent assistant for SZL Holdings. Answer questions based on the provided context. If the context doesn't contain enough information, say so clearly. Always cite which source(s) you used.";

  const messages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: contextChunks
        ? `Context:\n${contextChunks}\n\n---\n\nQuestion: ${question}`
        : `Question: ${question}\n\n(No relevant context was found in the knowledge base. Please answer based on your general knowledge and note that no specific sources were available.)`
    },
  ];

  const result = await gatewayInfer({
    messages,
    model: "gpt-5.2",
    maxTokens: 2048,
    strategy: "fastest",
    agentId: options.agentId || "rag-assistant",
    domain: "knowledge",
  });

  return {
    answer: result.content,
    sources,
    tokensUsed: result.usage.totalTokens,
  };
}

export async function getCollectionStats(): Promise<{ collection: string; documentCount: number; chunkCount: number }[]> {
  try {
    const result = await pool.query(`
      SELECT collection, COUNT(DISTINCT document_id) as doc_count, COUNT(*) as chunk_count
      FROM ai_embeddings GROUP BY collection ORDER BY collection
    `);
    return result.rows.map((row: any) => ({
      collection: row.collection,
      documentCount: parseInt(row.doc_count),
      chunkCount: parseInt(row.chunk_count),
    }));
  } catch {
    return [];
  }
}
