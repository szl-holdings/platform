/**
 * Counsel Matter Knowledge Index API
 *
 * LightRAG-style graph+vector knowledge index over matter documents.
 * Uses OpenAI chat completions for entity/relation extraction and Q&A.
 * Retrieval uses Okapi BM25 (weighted term-frequency ranking) over indexed
 * chunks, combined with entity/relation graph context for multi-hop answers.
 *
 * Note: The Replit AI Integrations proxy does not expose the OpenAI
 * embeddings endpoint (POST /embeddings → INVALID_ENDPOINT). BM25 over
 * tokenised chunks provides principled, query-length-normalised retrieval
 * and is the industry standard sparse retrieval baseline (used in
 * Elasticsearch, Lucene, and the BM25 variant in LightRAG itself).
 * Upgrade path: swap bm25Score() for cosine-similarity over pgvector
 * embeddings once a supported embeddings provider is available.
 */
import {
  counselKnowledgeChunksTable,
  counselKnowledgeDocumentsTable,
  counselKnowledgeEntitiesTable,
  counselKnowledgeQueriesTable,
  counselKnowledgeRelationsTable,
  db,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import multer from 'multer';
import { createResponse } from '@szl-holdings/ai-engine/providers/openai';
import { callModel } from '../services/ai/call-model';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|pdf|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are supported'));
    }
  },
});

// --- Utility Functions ---

/**
 * Extract plain text from uploaded file buffer.
 * Supports TXT (direct), DOCX (via mammoth), PDF (basic extraction).
 */
async function extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();

  if (ext === 'txt' || mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    // Basic PDF text extraction: strip binary, extract readable ASCII runs
    const text = buffer.toString('binary');
    const matches = text.match(/BT[\s\S]*?ET/g) || [];
    const extracted = matches
      .join('\n')
      .replace(/\(([^)]+)\)\s*Tj/g, '$1 ')
      .replace(/\(([^)]+)\)\s*T\*/g, '$1\n')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
    if (extracted.length > 100) return extracted;
    // Fallback: extract printable strings
    return buffer.toString('binary').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return buffer.toString('utf-8');
}

/**
 * Split text into overlapping chunks of ~600 words each.
 */
function chunkText(text: string, chunkSize = 600): Array<{ content: string; startChar: number; endChar: number; sectionHint: string | null }> {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: Array<{ content: string; startChar: number; endChar: number; sectionHint: string | null }> = [];
  const overlap = 50;
  let pos = 0;

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const slice = words.slice(i, i + chunkSize);
    const content = slice.join(' ');
    const startChar = pos;
    const endChar = pos + content.length;
    pos = endChar + 1;

    // Try to detect section from heading-like lines
    const firstLine = content.split('\n')[0]?.trim() ?? null;
    const sectionHint =
      firstLine && firstLine.length < 80 && /^[A-Z\s\d.]{5,}$/.test(firstLine)
        ? firstLine
        : null;

    chunks.push({ content, startChar, endChar, sectionHint });
    if (i + chunkSize >= words.length) break;
  }
  return chunks;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'it', 'its', 'he', 'she', 'they', 'we', 'you',
  'as', 'if', 'not', 'no', 'any', 'all', 'each', 'both', 'also',
]);

/**
 * Tokenize text into lowercase terms, removing stop words.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Count term frequencies in a token list.
 */
function termFrequencies(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  return freq;
}

/**
 * Extract top-N keywords from text (stored in the DB keywords column for quick filtering).
 */
function extractKeywords(text: string): string[] {
  const freq = termFrequencies(tokenize(text));
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w]) => w);
}

/**
 * Okapi BM25 ranking over a corpus of chunks.
 *
 * BM25 is the industry-standard sparse retrieval function used by
 * Elasticsearch, Lucene, and (in BM25F variant) LightRAG itself.
 * It addresses TF saturation and document-length normalisation — two
 * deficiencies of raw keyword overlap scoring.
 *
 * Parameters: k1 = 1.5 (TF saturation), b = 0.75 (length normalisation).
 *
 * @param query - Natural-language question
 * @param corpus - All chunks for this matter, each with their full content
 * @returns chunks sorted descending by BM25 score
 */
function rankChunksBM25(
  query: string,
  corpus: Array<{ id: number; documentId: number; chunkIndex: number; content: string; sectionHint: string | null; keywords: unknown }>,
): Array<typeof corpus[0] & { score: number }> {
  const K1 = 1.5;
  const B = 0.75;

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0 || corpus.length === 0) {
    return corpus.map((c) => ({ ...c, score: 0 }));
  }

  // Pre-compute per-chunk token frequencies and lengths
  const chunkTFs = corpus.map((c) => ({ id: c.id, tf: termFrequencies(tokenize(c.content)), len: tokenize(c.content).length }));

  const avgdl = chunkTFs.reduce((s, c) => s + c.len, 0) / chunkTFs.length;
  const N = corpus.length;

  // Document frequency per query term
  const df = new Map<string, number>();
  for (const qt of new Set(queryTerms)) {
    let count = 0;
    for (const { tf } of chunkTFs) {
      if ((tf.get(qt) ?? 0) > 0) count++;
    }
    df.set(qt, count);
  }

  // Score each chunk
  return corpus.map((chunk, idx) => {
    const { tf, len } = chunkTFs[idx]!;
    let score = 0;
    for (const qt of queryTerms) {
      const f = tf.get(qt) ?? 0;
      if (f === 0) continue;
      const docFreq = df.get(qt) ?? 0;
      const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);
      const numerator = f * (K1 + 1);
      const denominator = f + K1 * (1 - B + B * (len / avgdl));
      score += idf * (numerator / denominator);
    }
    return { ...chunk, score };
  });
}

/**
 * Extract entities and relations from a chunk using OpenAI.
 */
async function extractEntitiesAndRelations(
  content: string,
  documentName: string,
): Promise<{
  entities: Array<{ name: string; type: string; description: string }>;
  relations: Array<{ subject: string; predicate: string; object: string; description: string }>;
}> {
  const prompt = `You are a legal document analysis AI. Extract named entities and relationships from this legal document excerpt.

Document: ${documentName}
Excerpt: ${content.slice(0, 2000)}

Return a JSON object with:
- entities: array of {name, type, description} where type is one of: PARTY, PERSON, ORGANIZATION, DATE, OBLIGATION, CLAIM, JURISDICTION, AMOUNT, DOCUMENT, COURT, REGULATION
- relations: array of {subject, predicate, object, description} representing relationships between entities

Focus on legally significant entities and relationships (obligations, claims, parties, amounts, deadlines).
Return ONLY valid JSON, no markdown.`;

  try {
    const entityResult = await callModel({
      provider: 'openai', model: 'gpt-5-mini', surface: 'counsel-knowledge',
      fn: async () => {
        const r = await createResponse([{ role: 'user', content: prompt }], { model: 'gpt-5-mini', maxOutputTokens: 2000 });
        return { promptTokens: r.usage.promptTokens, completionTokens: r.usage.completionTokens, content: r.content };
      },
    });
    const raw = entityResult.content ?? '{}';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      relations: Array.isArray(parsed.relations) ? parsed.relations : [],
    };
  } catch {
    return { entities: [], relations: [] };
  }
}

/**
 * Answer a question using retrieved chunks + entity graph context.
 */
async function answerQuestion(
  question: string,
  relevantChunks: Array<{ content: string; fileName: string; chunkIndex: number; sectionHint: string | null; documentId: number }>,
  entityContext: string,
): Promise<{ answer: string }> {
  const chunkContext = relevantChunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.fileName}${c.sectionHint ? `, Section: ${c.sectionHint}` : ''}, Chunk ${c.chunkIndex + 1}]\n${c.content.slice(0, 800)}`,
    )
    .join('\n\n---\n\n');

  const prompt = `You are an expert legal research assistant. Answer the following question based on the provided matter documents. Cite your sources using [Source N] notation.

Question: ${question}

Entity/Relationship Context (extracted from documents):
${entityContext.slice(0, 800)}

Relevant Document Excerpts:
${chunkContext}

Provide a comprehensive, accurate answer. Cite every claim with [Source N]. If information spans multiple documents, synthesize it clearly. If the answer cannot be fully determined from the provided context, say so explicitly.`;

  const qaResult = await callModel({
    provider: 'openai', model: 'gpt-5.1', surface: 'counsel-knowledge',
    fn: async () => {
      const r = await createResponse([{ role: 'user', content: prompt }], { model: 'gpt-5.1', maxOutputTokens: 2000 });
      return { promptTokens: r.usage.promptTokens, completionTokens: r.usage.completionTokens, content: r.content };
    },
  });

  return { answer: qaResult.content ?? 'Unable to generate an answer.' };
}

// --- Routes ---

/**
 * Extract the caller's orgId from the authenticated session.
 * Falls back to 'counsel-demo' for unauthenticated demo usage.
 * This value is NEVER accepted from the client body or query string.
 */
function extractOrgId(req: Parameters<Parameters<typeof router.get>[1]>[0]): string {
  return (req as { user?: { orgId?: string } }).user?.orgId ?? 'counsel-demo';
}

/**
 * GET /counsel-knowledge/:matterId/documents
 * List all documents indexed for a matter (scoped to caller's org).
 */
router.get('/counsel-knowledge/:matterId/documents', async (req, res) => {
  try {
    const { matterId } = req.params;
    const orgId = extractOrgId(req);
    const docs = await db
      .select({
        id: counselKnowledgeDocumentsTable.id,
        fileName: counselKnowledgeDocumentsTable.fileName,
        fileType: counselKnowledgeDocumentsTable.fileType,
        fileSize: counselKnowledgeDocumentsTable.fileSize,
        status: counselKnowledgeDocumentsTable.status,
        errorMessage: counselKnowledgeDocumentsTable.errorMessage,
        chunkCount: counselKnowledgeDocumentsTable.chunkCount,
        entityCount: counselKnowledgeDocumentsTable.entityCount,
        createdAt: counselKnowledgeDocumentsTable.createdAt,
        indexedAt: counselKnowledgeDocumentsTable.indexedAt,
      })
      .from(counselKnowledgeDocumentsTable)
      .where(
        and(
          eq(counselKnowledgeDocumentsTable.matterId, matterId),
          eq(counselKnowledgeDocumentsTable.orgId, orgId),
        ),
      )
      .orderBy(desc(counselKnowledgeDocumentsTable.createdAt));
    return sendSuccess(res, docs);
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * GET /counsel-knowledge/:matterId/status
 * Get summary status of the knowledge index for a matter (scoped to caller's org).
 */
router.get('/counsel-knowledge/:matterId/status', async (req, res) => {
  try {
    const { matterId } = req.params;
    const orgId = extractOrgId(req);
    const [docs, entities, relations] = await Promise.all([
      db
        .select({
          id: counselKnowledgeDocumentsTable.id,
          status: counselKnowledgeDocumentsTable.status,
          chunkCount: counselKnowledgeDocumentsTable.chunkCount,
          entityCount: counselKnowledgeDocumentsTable.entityCount,
        })
        .from(counselKnowledgeDocumentsTable)
        .where(
          and(
            eq(counselKnowledgeDocumentsTable.matterId, matterId),
            eq(counselKnowledgeDocumentsTable.orgId, orgId),
          ),
        ),
      db
        .select({ id: counselKnowledgeEntitiesTable.id })
        .from(counselKnowledgeEntitiesTable)
        .where(
          and(
            eq(counselKnowledgeEntitiesTable.matterId, matterId),
            eq(counselKnowledgeEntitiesTable.orgId, orgId),
          ),
        ),
      db
        .select({ id: counselKnowledgeRelationsTable.id })
        .from(counselKnowledgeRelationsTable)
        .where(
          and(
            eq(counselKnowledgeRelationsTable.matterId, matterId),
            eq(counselKnowledgeRelationsTable.orgId, orgId),
          ),
        ),
    ]);
    return sendSuccess(res, {
      totalDocuments: docs.length,
      indexedDocuments: docs.filter((d) => d.status === 'indexed').length,
      pendingDocuments: docs.filter((d) => d.status === 'pending' || d.status === 'indexing').length,
      errorDocuments: docs.filter((d) => d.status === 'error').length,
      totalChunks: docs.reduce((s, d) => s + d.chunkCount, 0),
      totalEntities: entities.length,
      totalRelations: relations.length,
    });
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * GET /counsel-knowledge/:matterId/entities
 * List extracted entities for a matter (scoped to caller's org).
 */
router.get('/counsel-knowledge/:matterId/entities', async (req, res) => {
  try {
    const { matterId } = req.params;
    const orgId = extractOrgId(req);
    const entities = await db
      .select()
      .from(counselKnowledgeEntitiesTable)
      .where(
        and(
          eq(counselKnowledgeEntitiesTable.matterId, matterId),
          eq(counselKnowledgeEntitiesTable.orgId, orgId),
        ),
      )
      .orderBy(desc(counselKnowledgeEntitiesTable.mentionCount))
      .limit(50);
    return sendSuccess(res, entities);
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * GET /counsel-knowledge/:matterId/relations
 * List extracted entity relations for a matter (scoped to caller's org).
 */
router.get('/counsel-knowledge/:matterId/relations', async (req, res) => {
  try {
    const { matterId } = req.params;
    const orgId = extractOrgId(req);
    const relations = await db
      .select()
      .from(counselKnowledgeRelationsTable)
      .where(
        and(
          eq(counselKnowledgeRelationsTable.matterId, matterId),
          eq(counselKnowledgeRelationsTable.orgId, orgId),
        ),
      )
      .limit(100);
    return sendSuccess(res, relations);
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * GET /counsel-knowledge/:matterId/queries
 * List past queries for a matter (scoped to caller's org).
 */
router.get('/counsel-knowledge/:matterId/queries', async (req, res) => {
  try {
    const { matterId } = req.params;
    const orgId = extractOrgId(req);
    const queries = await db
      .select()
      .from(counselKnowledgeQueriesTable)
      .where(
        and(
          eq(counselKnowledgeQueriesTable.matterId, matterId),
          eq(counselKnowledgeQueriesTable.orgId, orgId),
        ),
      )
      .orderBy(desc(counselKnowledgeQueriesTable.createdAt))
      .limit(20);
    return sendSuccess(res, queries);
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * GET /counsel-knowledge/:matterId/chunks/:chunkId
 * Fetch the full content of a specific indexed chunk (for citation source viewing).
 * Scoped to caller's org — cannot access chunks from other organizations.
 */
router.get('/counsel-knowledge/:matterId/chunks/:chunkId', async (req, res) => {
  try {
    const { matterId, chunkId } = req.params;
    const id = parseInt(chunkId, 10);
    if (isNaN(id)) return sendBadRequest(res, 'Invalid chunk ID');
    const orgId = extractOrgId(req);

    const [chunk] = await db
      .select({
        id: counselKnowledgeChunksTable.id,
        documentId: counselKnowledgeChunksTable.documentId,
        matterId: counselKnowledgeChunksTable.matterId,
        chunkIndex: counselKnowledgeChunksTable.chunkIndex,
        content: counselKnowledgeChunksTable.content,
        sectionHint: counselKnowledgeChunksTable.sectionHint,
        startChar: counselKnowledgeChunksTable.startChar,
        endChar: counselKnowledgeChunksTable.endChar,
        keywords: counselKnowledgeChunksTable.keywords,
      })
      .from(counselKnowledgeChunksTable)
      .where(
        and(
          eq(counselKnowledgeChunksTable.id, id),
          eq(counselKnowledgeChunksTable.matterId, matterId),
          eq(counselKnowledgeChunksTable.orgId, orgId),
        ),
      )
      .limit(1);

    if (!chunk) return sendNotFound(res, 'Chunk not found');

    // Also fetch the parent document name (scoped to same org)
    const [doc] = await db
      .select({ fileName: counselKnowledgeDocumentsTable.fileName })
      .from(counselKnowledgeDocumentsTable)
      .where(
        and(
          eq(counselKnowledgeDocumentsTable.id, chunk.documentId),
          eq(counselKnowledgeDocumentsTable.orgId, orgId),
        ),
      )
      .limit(1);

    return sendSuccess(res, { ...chunk, fileName: doc?.fileName ?? 'Unknown' });
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * GET /counsel-knowledge/:matterId/documents/:docId/chunks
 * List all chunks for a specific document (scoped to caller's org).
 */
router.get('/counsel-knowledge/:matterId/documents/:docId/chunks', async (req, res) => {
  try {
    const { matterId, docId } = req.params;
    const id = parseInt(docId, 10);
    if (isNaN(id)) return sendBadRequest(res, 'Invalid document ID');
    const orgId = extractOrgId(req);

    // Verify the document belongs to this matter AND org
    const [doc] = await db
      .select({ id: counselKnowledgeDocumentsTable.id, fileName: counselKnowledgeDocumentsTable.fileName })
      .from(counselKnowledgeDocumentsTable)
      .where(
        and(
          eq(counselKnowledgeDocumentsTable.id, id),
          eq(counselKnowledgeDocumentsTable.matterId, matterId),
          eq(counselKnowledgeDocumentsTable.orgId, orgId),
        ),
      )
      .limit(1);

    if (!doc) return sendNotFound(res, 'Document not found');

    const chunks = await db
      .select({
        id: counselKnowledgeChunksTable.id,
        chunkIndex: counselKnowledgeChunksTable.chunkIndex,
        content: counselKnowledgeChunksTable.content,
        sectionHint: counselKnowledgeChunksTable.sectionHint,
        startChar: counselKnowledgeChunksTable.startChar,
        endChar: counselKnowledgeChunksTable.endChar,
      })
      .from(counselKnowledgeChunksTable)
      .where(
        and(
          eq(counselKnowledgeChunksTable.documentId, id),
          eq(counselKnowledgeChunksTable.matterId, matterId),
          eq(counselKnowledgeChunksTable.orgId, orgId),
        ),
      )
      .orderBy(counselKnowledgeChunksTable.chunkIndex);

    return sendSuccess(res, { fileName: doc.fileName, chunks });
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * POST /counsel-knowledge/:matterId/upload
 * Upload and index a document for a matter.
 */
router.post(
  '/counsel-knowledge/:matterId/upload',
  upload.single('document'),
  async (req, res) => {
    try {
      const { matterId } = req.params;
      if (!req.file) return sendBadRequest(res, 'No document file uploaded');

      const { buffer, originalname, mimetype, size } = req.file;
      const orgId = extractOrgId(req);

      // Extract text
      const textContent = await extractText(buffer, mimetype, originalname);
      if (!textContent || textContent.trim().length < 50) {
        return sendBadRequest(res, 'Could not extract readable text from the document. Ensure it is a text-based PDF, DOCX, or TXT file.');
      }

      // Create document record
      const [doc] = await db
        .insert(counselKnowledgeDocumentsTable)
        .values({
          matterId,
          orgId,
          fileName: originalname,
          fileType: mimetype,
          fileSize: size,
          textContent,
          status: 'indexing',
        })
        .returning({ id: counselKnowledgeDocumentsTable.id });

      if (!doc) return sendBadRequest(res, 'Failed to create document record');

      // Kick off async indexing — respond immediately with document ID
      indexDocument(doc.id, matterId, orgId, originalname, textContent).catch((err) => {
        console.error('[counsel-knowledge] indexing error', err);
      });

      return sendSuccess(res, { documentId: doc.id, status: 'indexing', message: 'Document upload accepted. Indexing in progress.' });
    } catch (err) {
      return handleRouteError(res, err, 'counsel-knowledge');
    }
  },
);

/**
 * DELETE /counsel-knowledge/:matterId/documents/:docId
 * Remove a document and its index data from a matter (scoped to caller's org).
 */
router.delete('/counsel-knowledge/:matterId/documents/:docId', async (req, res) => {
  try {
    const { matterId, docId } = req.params;
    const id = parseInt(docId, 10);
    if (isNaN(id)) return sendBadRequest(res, 'Invalid document ID');
    const orgId = extractOrgId(req);

    const [existing] = await db
      .select({ id: counselKnowledgeDocumentsTable.id })
      .from(counselKnowledgeDocumentsTable)
      .where(
        and(
          eq(counselKnowledgeDocumentsTable.id, id),
          eq(counselKnowledgeDocumentsTable.matterId, matterId),
          eq(counselKnowledgeDocumentsTable.orgId, orgId),
        ),
      )
      .limit(1);

    if (!existing) return sendNotFound(res, 'Document not found');

    await db
      .delete(counselKnowledgeDocumentsTable)
      .where(
        and(
          eq(counselKnowledgeDocumentsTable.id, id),
          eq(counselKnowledgeDocumentsTable.orgId, orgId),
        ),
      );

    return sendSuccess(res, { deleted: true });
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * POST /counsel-knowledge/:matterId/query
 * Ask a natural-language question against the matter knowledge index.
 */
router.post('/counsel-knowledge/:matterId/query', async (req, res) => {
  try {
    const { matterId } = req.params;
    const { question } = req.body as { question?: string };
    const orgId = extractOrgId(req);

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return sendBadRequest(res, 'A question is required (minimum 3 characters)');
    }

    // Check that we have indexed documents for this matter (scoped to org)
    const indexedDocs = await db
      .select({ id: counselKnowledgeDocumentsTable.id, fileName: counselKnowledgeDocumentsTable.fileName })
      .from(counselKnowledgeDocumentsTable)
      .where(
        and(
          eq(counselKnowledgeDocumentsTable.matterId, matterId),
          eq(counselKnowledgeDocumentsTable.orgId, orgId),
          eq(counselKnowledgeDocumentsTable.status, 'indexed'),
        ),
      );

    if (indexedDocs.length === 0) {
      return sendBadRequest(res, 'No indexed documents found for this matter. Upload and index documents first.');
    }

    // Retrieve all chunks for this matter (scoped to org)
    const allChunks = await db
      .select({
        id: counselKnowledgeChunksTable.id,
        documentId: counselKnowledgeChunksTable.documentId,
        chunkIndex: counselKnowledgeChunksTable.chunkIndex,
        content: counselKnowledgeChunksTable.content,
        sectionHint: counselKnowledgeChunksTable.sectionHint,
        keywords: counselKnowledgeChunksTable.keywords,
      })
      .from(counselKnowledgeChunksTable)
      .where(
        and(
          eq(counselKnowledgeChunksTable.matterId, matterId),
          eq(counselKnowledgeChunksTable.orgId, orgId),
        ),
      );

    // Rank chunks using Okapi BM25 — proper sparse IR ranking
    const docNameMap = new Map(indexedDocs.map((d) => [d.id, d.fileName]));
    const ranked = rankChunksBM25(question, allChunks);
    const topBM25 = ranked
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((c) => ({ ...c, fileName: docNameMap.get(c.documentId) ?? 'Unknown' }));

    // Fallback: use first 3 chunks if BM25 returns nothing (e.g. stop-word-only query)
    const topChunks = topBM25.length > 0
      ? topBM25
      : allChunks.slice(0, 3).map((c) => ({ ...c, fileName: docNameMap.get(c.documentId) ?? 'Unknown', score: 0 }));

    // Get entity context relevant to the query (scoped to org)
    const entities = await db
      .select({
        name: counselKnowledgeEntitiesTable.name,
        type: counselKnowledgeEntitiesTable.type,
        description: counselKnowledgeEntitiesTable.description,
      })
      .from(counselKnowledgeEntitiesTable)
      .where(
        and(
          eq(counselKnowledgeEntitiesTable.matterId, matterId),
          eq(counselKnowledgeEntitiesTable.orgId, orgId),
        ),
      )
      .orderBy(desc(counselKnowledgeEntitiesTable.mentionCount))
      .limit(20);

    const entityContext = entities
      .map((e) => `${e.name} (${e.type}): ${e.description ?? ''}`)
      .join('\n');

    // Create query record
    const [queryRecord] = await db
      .insert(counselKnowledgeQueriesTable)
      .values({ matterId, orgId, question: question.trim(), status: 'pending' })
      .returning({ id: counselKnowledgeQueriesTable.id });

    // Generate answer
    const { answer } = await answerQuestion(question, topChunks, entityContext);

    // Build citations (include chunkId so clients can fetch full chunk content)
    const citations = topChunks.map((c) => ({
      chunkId: c.id,
      documentId: c.documentId,
      fileName: c.fileName,
      chunkIndex: c.chunkIndex,
      sectionHint: c.sectionHint,
      excerpt: c.content.slice(0, 300),
    }));

    // Update query record
    if (queryRecord) {
      await db
        .update(counselKnowledgeQueriesTable)
        .set({ answer, citations, status: 'answered', answeredAt: new Date() })
        .where(eq(counselKnowledgeQueriesTable.id, queryRecord.id));
    }

    return sendSuccess(res, { answer, citations, queryId: queryRecord?.id });
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

/**
 * POST /counsel-knowledge/:matterId/seed
 * Seed sample documents for demo purposes.
 */
router.post('/counsel-knowledge/:matterId/seed', async (req, res) => {
  try {
    const { matterId } = req.params;
    const orgId = extractOrgId(req);

    // Check if already seeded (scoped to org)
    const existing = await db
      .select({ id: counselKnowledgeDocumentsTable.id })
      .from(counselKnowledgeDocumentsTable)
      .where(
        and(
          eq(counselKnowledgeDocumentsTable.matterId, matterId),
          eq(counselKnowledgeDocumentsTable.orgId, orgId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return sendSuccess(res, { seeded: false, message: 'Matter already has documents' });
    }

    const sampleDocs = getSampleDocuments(matterId);
    const results: number[] = [];

    for (const doc of sampleDocs) {
      const [inserted] = await db
        .insert(counselKnowledgeDocumentsTable)
        .values({
          matterId,
          orgId,
          fileName: doc.fileName,
          fileType: 'text/plain',
          fileSize: doc.content.length,
          textContent: doc.content,
          status: 'indexing',
        })
        .returning({ id: counselKnowledgeDocumentsTable.id });

      if (inserted) {
        results.push(inserted.id);
        indexDocument(inserted.id, matterId, orgId, doc.fileName, doc.content).catch(console.error);
      }
    }

    return sendSuccess(res, { seeded: true, documentIds: results, count: results.length });
  } catch (err) {
    return handleRouteError(res, err, 'counsel-knowledge');
  }
});

// --- Background Indexing ---

async function indexDocument(
  documentId: number,
  matterId: string,
  orgId: string,
  fileName: string,
  textContent: string,
): Promise<void> {
  try {
    const chunks = chunkText(textContent);

    // Insert all chunks
    const insertedChunks: number[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      const keywords = extractKeywords(chunk.content);
      const [inserted] = await db
        .insert(counselKnowledgeChunksTable)
        .values({
          documentId,
          matterId,
          orgId,
          chunkIndex: i,
          content: chunk.content,
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          sectionHint: chunk.sectionHint,
          keywords,
        })
        .returning({ id: counselKnowledgeChunksTable.id });
      if (inserted) insertedChunks.push(inserted.id);
    }

    // Extract entities/relations from first 3 chunks (to control LLM costs)
    const chunksForExtraction = chunks.slice(0, 3);
    const allEntities: Array<{ name: string; type: string; description: string }> = [];
    const allRelations: Array<{ subject: string; predicate: string; object: string; description: string }> = [];

    for (let i = 0; i < chunksForExtraction.length; i++) {
      const chunk = chunksForExtraction[i]!;
      const { entities, relations } = await extractEntitiesAndRelations(chunk.content, fileName);
      allEntities.push(...entities);
      allRelations.push(...relations);

      // Upsert entities (merge by name)
      for (const entity of entities) {
        if (!entity.name || !entity.type) continue;
        const existing = await db
          .select({ id: counselKnowledgeEntitiesTable.id, documentIds: counselKnowledgeEntitiesTable.documentIds, chunkIds: counselKnowledgeEntitiesTable.chunkIds, mentionCount: counselKnowledgeEntitiesTable.mentionCount })
          .from(counselKnowledgeEntitiesTable)
          .where(and(eq(counselKnowledgeEntitiesTable.matterId, matterId), eq(counselKnowledgeEntitiesTable.name, entity.name.slice(0, 200))))
          .limit(1);

        const chunkId = insertedChunks[i];
        if (existing.length > 0) {
          const ex = existing[0]!;
          const docIds = Array.isArray(ex.documentIds) ? ex.documentIds : [];
          const chunkIds = Array.isArray(ex.chunkIds) ? ex.chunkIds : [];
          if (!docIds.includes(documentId)) docIds.push(documentId);
          if (chunkId && !chunkIds.includes(chunkId)) chunkIds.push(chunkId);
          await db
            .update(counselKnowledgeEntitiesTable)
            .set({ documentIds: docIds, chunkIds, mentionCount: ex.mentionCount + 1 })
            .where(eq(counselKnowledgeEntitiesTable.id, ex.id));
        } else {
          await db.insert(counselKnowledgeEntitiesTable).values({
            matterId,
            orgId,
            name: entity.name.slice(0, 200),
            type: entity.type,
            description: entity.description,
            documentIds: [documentId],
            chunkIds: chunkId ? [chunkId] : [],
          });
        }
      }

      // Insert relations
      for (const rel of relations) {
        if (!rel.subject || !rel.predicate || !rel.object) continue;
        await db.insert(counselKnowledgeRelationsTable).values({
          matterId,
          orgId,
          subjectEntity: rel.subject.slice(0, 200),
          predicate: rel.predicate.slice(0, 200),
          objectEntity: rel.object.slice(0, 200),
          description: rel.description,
          documentId,
          chunkId: insertedChunks[i],
        });
      }
    }

    // Mark document as indexed
    await db
      .update(counselKnowledgeDocumentsTable)
      .set({
        status: 'indexed',
        chunkCount: chunks.length,
        entityCount: allEntities.length,
        indexedAt: new Date(),
      })
      .where(eq(counselKnowledgeDocumentsTable.id, documentId));
  } catch (err) {
    await db
      .update(counselKnowledgeDocumentsTable)
      .set({ status: 'error', errorMessage: String(err).slice(0, 500) })
      .where(eq(counselKnowledgeDocumentsTable.id, documentId));
    throw err;
  }
}

// --- Sample Documents ---

function getSampleDocuments(matterId: string): Array<{ fileName: string; content: string }> {
  const matterDocs: Record<string, Array<{ fileName: string; content: string }>> = {
    'M-2024-001': apexAcquisitionDocs(),
    'M-2024-002': neuralTechDocs(),
    'M-2024-003': citadelSecDocs(),
  };
  return matterDocs[matterId] ?? apexAcquisitionDocs();
}

function apexAcquisitionDocs(): Array<{ fileName: string; content: string }> {
  return [
    {
      fileName: 'Apex-Meridian_Merger_Agreement_v4.txt',
      content: `DEFINITIVE MERGER AGREEMENT

This Definitive Merger Agreement ("Agreement") is entered into as of January 15, 2024, by and among:
- APEX CAPITAL PARTNERS LP, a Delaware limited partnership ("Acquiror")
- MERIDIAN SOFTWARE GROUP, INC., a Delaware corporation ("Target")
- ACQ MERGER SUB, INC., a Delaware corporation and wholly-owned subsidiary of Acquiror ("Merger Sub")

RECITALS

WHEREAS, the Board of Directors of Target has unanimously determined that this Agreement and the transactions contemplated hereby are advisable, fair and in the best interests of Target and its stockholders;

WHEREAS, Acquiror desires to acquire Target through a merger of Merger Sub with and into Target (the "Merger"), with Target surviving as a wholly-owned subsidiary of Acquiror;

ARTICLE I: THE MERGER

1.1 The Merger. Upon the terms and subject to the conditions set forth in this Agreement, and in accordance with the Delaware General Corporation Law, Merger Sub shall be merged with and into Target. Target shall be the surviving corporation (the "Surviving Corporation") and shall continue its corporate existence under the laws of the State of Delaware.

1.2 Merger Consideration. Each share of Target Common Stock issued and outstanding immediately prior to the Effective Time shall be converted into the right to receive $42.50 per share in cash (the "Merger Consideration"), without interest.

1.3 Effective Time. The Merger shall become effective when the Certificate of Merger is filed with the Secretary of State of Delaware.

ARTICLE II: REPRESENTATIONS AND WARRANTIES OF TARGET

2.1 Organization. Target is a corporation duly organized, validly existing, and in good standing under the laws of the State of Delaware.

2.2 Capitalization. The authorized capital stock of Target consists of 200,000,000 shares of Common Stock and 50,000,000 shares of Preferred Stock.

2.3 No Conflicts. The execution and delivery of this Agreement does not conflict with any provision of Target's certificate of incorporation or bylaws.

ARTICLE III: REGULATORY APPROVALS

3.1 HSR Filing. Each party shall, as promptly as practicable after the date of this Agreement, file or cause to be filed with the Federal Trade Commission and the Department of Justice the notification and report form required by the Hart-Scott-Rodino Antitrust Improvements Act of 1976. The parties agree to cooperate and use commercially reasonable efforts to obtain HSR clearance as promptly as practicable.

3.2 HSR Waiting Period. The Merger shall not be consummated until the applicable waiting period under the HSR Act shall have expired or been terminated. The current waiting period expires March 15, 2024.

3.3 Regulatory Obligations. Apex Capital agrees to make all necessary regulatory filings and to respond promptly to any second request from the FTC or DOJ.

ARTICLE IV: COVENANTS

4.1 Conduct of Business. During the period from the date of this Agreement and continuing until the earlier of the termination of this Agreement and the Effective Time, Target shall conduct its business in the ordinary course.

4.2 No Solicitation. Target shall not, and shall cause its officers and directors not to, solicit, initiate, or knowingly encourage any Acquisition Proposal.

4.3 Employee Matters. Acquiror shall maintain compensation and benefit programs substantially equivalent to those currently provided to Target employees for at least 12 months following the Effective Time.

4.4 WARN Act Obligations. If the Merger results in any "plant closing" or "mass layoff" as defined by the WARN Act, Acquiror shall provide 60 days advance written notice to affected employees or pay in lieu thereof.

ARTICLE V: CONDITIONS TO CLOSING

5.1 Conditions to Acquiror's Obligations:
(a) HSR clearance obtained
(b) No Material Adverse Effect on Target
(c) Target representations accurate in all material respects
(d) Board approval resolution duly adopted

5.2 Conditions to Target's Obligations:
(a) Acquiror representations accurate in all material respects
(b) Merger consideration available

ARTICLE VI: TERMINATION

6.1 Termination Rights. This Agreement may be terminated prior to the Effective Time:
(a) By mutual written consent of Acquiror and Target
(b) By either party if the Merger is not consummated by June 30, 2024 (the "Outside Date")
(c) By either party if a governmental entity issues a final non-appealable order prohibiting the Merger

6.2 Termination Fee. If this Agreement is terminated by Target to accept a Superior Proposal, Target shall pay Acquiror a termination fee of $85,000,000.

ARTICLE VII: GENERAL PROVISIONS

7.1 Governing Law. This Agreement shall be governed by the laws of the State of Delaware.
7.2 Entire Agreement. This Agreement constitutes the entire agreement among the parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

APEX CAPITAL PARTNERS LP
By: /s/ M. Farooq
Name: M. Farooq
Title: Managing Partner

MERIDIAN SOFTWARE GROUP, INC.
By: /s/ CEO
Name: [CEO Signature]
Title: Chief Executive Officer`,
    },
    {
      fileName: 'HSR_Filing_Memo_FTC_DOJ.txt',
      content: `MEMORANDUM

TO: M. Farooq, R. Chen
FROM: Antitrust Group
RE: HSR Premerger Notification — Apex Capital / Meridian Software Group
DATE: January 20, 2024
MATTER: 2024-MA-001

EXECUTIVE SUMMARY

This memorandum outlines the Hart-Scott-Rodino (HSR) premerger notification obligations arising from Apex Capital Partners LP's proposed acquisition of Meridian Software Group, Inc. The transaction value exceeds the applicable HSR threshold, requiring notification to both the Federal Trade Commission (FTC) and the Department of Justice (DOJ) Antitrust Division.

HSR THRESHOLD ANALYSIS

The proposed acquisition involves a transaction valued at approximately $340,000,000, which exceeds the current HSR threshold of $119.5 million (adjusted annually). Both Apex Capital and Meridian Software Group are required to file notification forms.

Size of Person Test:
- Apex Capital Partners LP has assets exceeding $500M → qualifies as "large party"
- Meridian Software Group has annual revenues exceeding $100M → qualifies as "acquired party"
- Transaction value: $340M → exceeds all applicable thresholds

FILING REQUIREMENTS

1. Both parties must file separately with the FTC and DOJ
2. Filing fee: $280,000 (for transactions between $100M and $500M)
3. Initial waiting period: 30 calendar days from filing date
4. Early termination request: Will be submitted simultaneously

PRODUCT MARKET ANALYSIS

Meridian Software Group operates primarily in:
- Enterprise Resource Planning (ERP) software
- Supply chain management solutions
- Cloud-based business intelligence platforms

Apex Capital's portfolio does not include direct competitors in these segments. However, the FTC may conduct market analysis of adjacent markets.

POTENTIAL CONCERNS

The Antitrust Division may scrutinize:
1. Meridian's market share in mid-market ERP (estimated 8-12%)
2. Potential bundling of Apex portfolio companies' services with Meridian products
3. Data concentration concerns given Meridian's access to enterprise operational data

OBLIGATIONS AND DEADLINES

IMMEDIATE ACTIONS REQUIRED:
- File HSR forms by March 12, 2024 (3 days from today)
- $50,000/day penalty for late filing
- Submit all required documents: acquisition documents, financial statements, annual reports

WAITING PERIOD:
- 30-day initial waiting period begins upon filing
- If no second request received by April 11, 2024, clearance is presumed
- Second request would extend waiting period by additional 30+ days

STRATEGIC RECOMMENDATIONS

1. File for early termination to accelerate clearance timeline
2. Prepare comprehensive data room for potential second request
3. Pre-notify FTC staff counsel of planned filing
4. Ensure all financial data is current and accurate

CONCLUSION

The HSR filing must be submitted no later than March 12, 2024 to avoid penalties. Counsel is coordinating with Goldman Sachs for required financial data. All parties should be prepared for the possibility of a second request from the FTC, which would delay the targeted April 15, 2024 closing date.`,
    },
    {
      fileName: 'Apex_Board_Approval_Resolution.txt',
      content: `RESOLUTIONS OF THE BOARD OF DIRECTORS
MERIDIAN SOFTWARE GROUP, INC.

Action by Written Consent in Lieu of a Meeting
Dated: January 18, 2024

The undersigned, constituting all of the members of the Board of Directors of Meridian Software Group, Inc., a Delaware corporation (the "Company"), hereby adopt the following resolutions by written consent:

WHEREAS, the Board has reviewed the Definitive Merger Agreement (the "Merger Agreement") dated January 15, 2024, by and among Apex Capital Partners LP ("Acquiror"), ACQ Merger Sub, Inc., and the Company, pursuant to which Merger Sub will merge with and into the Company (the "Merger");

WHEREAS, Goldman Sachs & Co. LLC has delivered a written opinion to the Board (the "Fairness Opinion") that the Merger Consideration of $42.50 per share is fair, from a financial point of view, to the holders of the Company's common stock;

WHEREAS, the Board has received, reviewed, and considered the Merger Agreement and all documents related thereto, as well as the Fairness Opinion, the presentations of management and legal counsel, and such other materials as the Board deemed relevant;

NOW, THEREFORE, BE IT RESOLVED:

RESOLUTION 1: APPROVAL OF MERGER AGREEMENT
That the Merger Agreement, substantially in the form presented to the Board, and the transactions contemplated thereby, including the Merger, are hereby approved, adopted, and declared advisable by the Board.

RESOLUTION 2: FAIRNESS DETERMINATION
That the Board determines that the Merger Agreement and the Merger are fair to, and in the best interests of, the Company and its stockholders.

RESOLUTION 3: STOCKHOLDER MEETING
That the Board hereby directs that the Merger Agreement be submitted to the stockholders of the Company for their adoption and approval at a Special Meeting of Stockholders, which shall be called and held as soon as practicable.

RESOLUTION 4: RECOMMENDATION
That the Board hereby recommends that the stockholders of the Company vote in favor of the adoption of the Merger Agreement.

RESOLUTION 5: OFFICERS AUTHORIZED
That the officers of the Company are hereby authorized and directed, on behalf of the Company, to execute, deliver, and perform the Merger Agreement and all other documents and agreements contemplated therein.

FINANCIAL ADVISOR FEES
The Board approved payment to Goldman Sachs of a transaction fee equal to 0.65% of the aggregate transaction value, payable upon closing of the Merger.

LEGAL COUNSEL FEES
The Board approved engagement letter with Latham & Watkins LLP for legal representation of the Target in connection with the Merger.

OBLIGATIONS CONFIRMED
The Board acknowledges the following obligations arising under the Merger Agreement:
1. HSR filing obligation (due March 12, 2024)
2. No-shop covenant during pendency of the Merger
3. WARN Act notice obligations upon closing
4. Representation accuracy maintenance through closing

This Written Consent may be executed in counterparts and shall be effective when executed by all directors.

/s/ [Director 1]   /s/ [Director 2]   /s/ [Director 3]
/s/ [Director 4]   /s/ [Director 5]`,
    },
    {
      fileName: 'Merger_Due_Diligence_Report.txt',
      content: `DUE DILIGENCE REPORT — MERIDIAN SOFTWARE GROUP ACQUISITION
Prepared by: R. Chen, Associate
For: M. Farooq, Partner
Matter: 2024-MA-001 — Apex Capital / Meridian Software Group
Date: February 1, 2024
CONFIDENTIAL — ATTORNEY-CLIENT PRIVILEGE

EXECUTIVE SUMMARY

This report summarizes the legal due diligence conducted on Meridian Software Group, Inc. ("Target") in connection with the proposed acquisition by Apex Capital Partners LP ("Acquiror"). Due diligence was conducted via access to Meridian's Virtual Data Room (VDR) containing 14,200 documents reviewed over a four-week period.

I. CORPORATE STRUCTURE

The Target is incorporated in Delaware and maintains its principal offices in San Francisco, California. The Target has three material subsidiaries: Meridian Cloud Services, LLC (Delaware); Meridian Analytics, Inc. (Delaware); and Meridian International GmbH (Germany).

All subsidiaries are wholly-owned. No material restrictions on transfer of subsidiary shares were identified.

II. MATERIAL CONTRACTS REVIEW

A. Key Customer Contracts
- Enterprise SaaS agreements with 847 enterprise customers
- Weighted average remaining contract term: 2.8 years
- Annual Recurring Revenue (ARR): $215M
- Net Revenue Retention: 118%
- Three customers represent >5% of revenue each; no single customer exceeds 12%

B. Key Vendor Contracts
- AWS cloud infrastructure agreement (expires 2027): $18M/year
- Microsoft Azure agreement (expires 2026): $4.2M/year
- Salesforce CRM agreement (expires 2025): $2.1M/year

C. Change-of-Control Provisions
MATERIAL FINDING: 23 enterprise customer contracts contain change-of-control notification requirements. Three contracts contain consent requirements (representing approximately $22M ARR). R. Chen is coordinating outreach to these customers.

III. INTELLECTUAL PROPERTY

A. Patents
Target holds 47 issued US patents and 12 pending applications covering core ERP workflow automation technologies.

B. Trade Secrets
Target's AI-driven demand forecasting algorithm represents significant trade secret value. Counsel confirmed appropriate NDA and employment agreements are in place.

C. Open Source Compliance
Software audit identified 3 instances of potentially incompatible open source license usage. Remediation underway. No material risk identified.

IV. EMPLOYMENT AND BENEFITS

A. Key Employee Retention
12 senior engineers identified as key retention risks. Retention bonus agreements should be prepared for execution at closing.

B. WARN Act Analysis
Projected workforce changes post-merger may trigger WARN Act obligations:
- California office: 340 employees in roles with restructuring risk
- WARN Act requires 60-day advance notice
- Recommend notification letters be prepared and held for execution upon closing

C. Employee Benefits
Target's 401(k) plan, health insurance, and equity compensation plans are consistent with market. No material ERISA compliance issues identified.

V. LITIGATION AND REGULATORY

A. Active Litigation
Target is a defendant in two patent infringement matters:
1. SmartERP LLC v. Meridian (filed 2023): Validity challenge, estimated exposure $2.1M
2. Former employee discrimination claim (2023): Exposure estimated at $450,000

Neither matter represents a Material Adverse Effect.

B. Regulatory Compliance
Target maintains SOC 2 Type II certification. GDPR and CCPA compliance programs are in place and operational. No material regulatory findings.

VI. FINANCIAL REVIEW

A. Balance Sheet
- Cash: $67M
- Total debt: $145M (revolving credit facility, 4.2% rate)
- Net debt: $78M

B. Financial Representations
Target's representations regarding financial statements are accurate. PwC audit opinion (unqualified) confirmed for fiscal years 2021, 2022, 2023.

VII. MATERIAL ADVERSE EFFECT ASSESSMENT

Based on due diligence conducted, no Material Adverse Effect (as defined in the Merger Agreement) has been identified. The due diligence findings support proceeding to closing, subject to resolution of the change-of-control consent requirements.

VIII. RECOMMENDED CONDITIONS

Prior to closing, the following should be addressed:
1. Obtain change-of-control consents from three material customers
2. Finalize WARN Act notification strategy
3. Execute key employee retention agreements
4. Complete open source license remediation
5. Obtain representation and warranty insurance (RWI) quote`,
    },
    {
      fileName: 'WARN_Act_Notice_Template.txt',
      content: `WARN ACT NOTICE TEMPLATE — DRAFT
ATTORNEY-CLIENT PRIVILEGE — CONFIDENTIAL WORK PRODUCT

BACKGROUND

The Worker Adjustment and Retraining Notification Act (WARN Act), 29 U.S.C. § 2101 et seq., requires employers with 100 or more employees to provide 60 calendar days advance written notice before a "plant closing" or "mass layoff."

APPLICABILITY ANALYSIS

Meridian Software Group qualifies as a "covered employer" with approximately 2,400 employees. Post-merger restructuring plans indicate the following may occur:

San Francisco HQ: Role elimination risk affects approximately 340 employees in redundant corporate functions.

DEFINITION ANALYSIS

"Mass Layoff" under WARN: 
- 500 or more employees, OR
- 33% of employees AND at least 50 employees at a single site

Based on current projections, the San Francisco site may approach but not clearly exceed the mass layoff threshold. Counsel recommends conservative approach: prepare WARN notices to be held pending final restructuring decisions.

EMPLOYEE OBLIGATION

Obligation arises: Upon announcement of specific layoff decisions
Notice due to: Individual employees, state dislocated worker unit (California EDD), chief elected official of local government

California Addendum: California's WARN Act (WARN II, Lab. Code § 1400 et seq.) applies to employers with 75+ employees and covers "mass layoffs" of 50+ employees within 30 days. California provides no exceptions for "faltering company" or "unforeseeable business circumstances."

PENALTIES FOR NON-COMPLIANCE

Federal WARN: $500 per employee per day of violation (up to 60 days)
California WARN: Similar civil liability

RECOMMENDATION

M. Farooq advises:
1. Prepare template notices for all potentially affected positions
2. Hold notices in escrow pending final headcount decisions
3. Issue notices simultaneously with any public announcement of restructuring
4. Engage California employment counsel for local compliance

THIS DOCUMENT IS ATTORNEY WORK PRODUCT PREPARED IN ANTICIPATION OF LITIGATION. NOT FOR DISTRIBUTION.`,
    },
  ];
}

function neuralTechDocs(): Array<{ fileName: string; content: string }> {
  return [
    {
      fileName: 'NeuralTech_Complaint_NDCal.txt',
      content: `UNITED STATES DISTRICT COURT
NORTHERN DISTRICT OF CALIFORNIA
SAN JOSE DIVISION

NEURALTECH CORPORATION,
    Plaintiff,
vs.
PROMETHEUS AI INC.,
    Defendant.

Case No. 5:24-cv-03817-MC

COMPLAINT FOR PATENT INFRINGEMENT

Plaintiff NeuralTech Corporation alleges as follows:

PARTIES

1. NeuralTech Corporation is a Delaware corporation with its principal place of business in Palo Alto, California.
2. Prometheus AI Inc. is a Delaware corporation with its principal place of business in Seattle, Washington.

PATENTS-IN-SUIT

3. NeuralTech is the owner of the following United States patents:
   - US 11,234,567: "Multi-Head Attention Mechanism for Neural Language Processing"
   - US 11,345,678: "Transformer Architecture with Efficient Self-Attention"
   - US 11,456,789: "Training Method for Large-Scale Language Models"
   - US 11,567,890: "Inference Optimization for Transformer Networks"

INFRINGEMENT ALLEGATIONS

4. Prometheus AI has infringed and continues to infringe the Patents-in-Suit through its PromGen AI platform, which incorporates transformer attention mechanisms substantially similar to those claimed in the Patents-in-Suit.

5. NeuralTech has suffered and continues to suffer damages as a result of Prometheus AI's infringement, including lost profits and reasonable royalties.

PRAYER FOR RELIEF

Plaintiff requests:
a) A declaration that Prometheus AI has infringed the Patents-in-Suit
b) Permanent injunction preventing further infringement
c) Damages, including lost profits, not less than $125,000,000
d) Willfulness finding and enhanced damages under 35 U.S.C. § 284
e) Attorneys' fees under 35 U.S.C. § 285`,
    },
    {
      fileName: 'Expert_Report_Voss_Technical.txt',
      content: `EXPERT REPORT OF DR. ALAN VOSS
Technical Patent Infringement Analysis
NeuralTech Corporation v. Prometheus AI Inc.
Case No. 5:24-cv-03817-MC

INTRODUCTION

I, Dr. Alan Voss, Professor of Computer Science at MIT, have been retained by NeuralTech Corporation to provide expert opinion on the technical aspects of patent infringement in this matter.

OPINIONS

1. CLAIM 1 OF US 11,234,567 IS LITERALLY INFRINGED

Claim 1 requires: "A method for processing natural language comprising: receiving input tokens; computing query, key, and value matrices; computing attention weights using scaled dot-product attention; and generating output representations."

The PromGen AI platform (version 3.0+) performs each of these steps. I have analyzed the PromGen source code provided in discovery and confirm that:
- Input tokens are received through the tokenization layer
- Q, K, V matrices are computed via learned linear projections
- Attention weights are computed using scaled dot-product formula identical to Claim 1
- Output representations are generated through the feedforward network

CONCLUSION ON CLAIM 1: Literally infringed.

2. CLAIMS 4 AND 7 ARE INFRINGED UNDER DOCTRINE OF EQUIVALENTS

Even if the court were to find that Prometheus's implementation differs from Claims 4 and 7 in some technical respects, Prometheus achieves substantially the same function in substantially the same way to achieve substantially the same result.

3. WILLFULNESS

The evidence suggests Prometheus was aware of NeuralTech's patents prior to developing the infringing features, based on: (a) technical staff LinkedIn profiles showing prior employment at NeuralTech, and (b) internal emails referencing NeuralTech's patent portfolio.

ESTIMATED DAMAGES

A reasonable royalty analysis yields damages of $45-75 million. Lost profits analysis (NeuralTech's lost market share) yields damages of $80-125 million. I recommend the higher lost profits figure.`,
    },
  ];
}

function citadelSecDocs(): Array<{ fileName: string; content: string }> {
  return [
    {
      fileName: 'SEC_Subpoena_CID.txt',
      content: `SECURITIES AND EXCHANGE COMMISSION
FORMAL ORDER OF INVESTIGATION

Matter: In the Matter of Citadel Financial Holdings — Dark Pool Trading Practices
File No.: HO-14827
Date: October 1, 2023

The Securities and Exchange Commission ("Commission"), having determined that it is in the public interest and for the protection of investors to investigate the matters described herein, ORDERS, pursuant to Sections 19(b) and 21(a) of the Securities Exchange Act of 1934:

SCOPE OF INVESTIGATION

The Commission staff is hereby authorized to conduct a formal investigation to determine whether persons or entities have violated or are about to violate the federal securities laws with respect to the following:

1. Dark Pool Order Routing Practices (2022-2024)
Whether Citadel Financial Holdings and its affiliates have engaged in deceptive order routing practices in connection with their Alternative Trading System (ATS/dark pool), including but not limited to:
- Preferential order routing to affiliated entities
- Failure to provide best execution to retail customers
- Misrepresentation of order handling practices to customers

2. Best Execution Obligations
Whether Citadel Financial has satisfied its best execution obligations under SEC Rule 10b-5 and applicable SRO rules with respect to customer orders routed through its dark pool.

3. Disclosure Deficiencies
Whether Citadel Financial has made material misrepresentations or omissions in its Form ATS-N disclosures regarding its alternative trading system's operations.

SUBPOENA AND DOCUMENT PRODUCTION

Civil Investigative Demand requires production of:
- All order routing records (2022-2024)
- Internal communications regarding dark pool operations
- Compliance program documentation
- Customer order handling procedures
- Technology platform specifications
- All documents relating to best execution analysis

PRODUCTION DEADLINE: November 15, 2023 (extended by agreement to February 10, 2024)

COOPERATING INDIVIDUALS: The Commission notes its cooperation program; substantial cooperation may be considered in determining remedies.`,
    },
    {
      fileName: 'Wells_Notice_Response_Outline.txt',
      content: `WELLS NOTICE RESPONSE OUTLINE
Citadel Financial Holdings
SEC Investigation — Dark Pool Trading Practices
ATTORNEY-CLIENT PRIVILEGE / WORK PRODUCT
P. Rodriguez, Partner

STRATEGIC OVERVIEW

The SEC's Wells Notice indicates the staff intends to recommend civil charges under:
- Section 10(b) and Rule 10b-5 (fraud/material misrepresentation)
- Section 17(a) (securities fraud)
- Potential Section 15(c)(3) violations (best execution)

Our response strategy must accomplish three goals:
1. Demonstrate Citadel's good faith compliance program
2. Present factual and legal defenses to each allegation
3. Mitigate exposure by establishing cooperation credit

FACTUAL DEFENSES

A. Order Routing Was Consistent with Best Execution Obligations
Evidence shows Citadel's dark pool provided superior execution quality metrics:
- Average fill rates 15% above NBBO
- Execution speed within 50 microseconds
- Price improvement provided on 67% of eligible orders

B. No Material Misrepresentations in Form ATS-N
Citadel's Form ATS-N disclosures accurately described its order routing logic. The staff's reading of "preferential routing" mischaracterizes the standard practice of internalizing order flow for market-making purposes.

C. No Intent to Defraud
All order handling decisions were based on automated systems designed to optimize execution quality. Human judgment was applied only at the policy level, not individual order level.

LEGAL DEFENSES

1. First Amendment / Compelled Disclosure Issues
   SEC's expansive reading of disclosure obligations raises constitutional concerns.

2. Scienter
   Section 10(b) requires specific intent to defraud. Citadel's documented compliance program negates scienter.

3. Materiality
   No evidence of actual investor harm arising from the alleged misrepresentations.

SETTLEMENT PARAMETERS

If settlement becomes appropriate:
- Civil penalty: Target below $50M
- Admit/deny: Maintain no admission
- Remediation: Enhanced compliance program, not operational changes
- Term of supervision: 3 years maximum`,
    },
    {
      fileName: 'Privilege_Log_Summary.txt',
      content: `PRIVILEGE LOG SUMMARY
Matter: Citadel Financial Holdings v. SEC
Document Production — Privilege Review
Attorney: K. Morrison, Partner
Date: January 25, 2024

OVERVIEW

3,200 documents withheld from production on grounds of attorney-client privilege and work product doctrine. This summary describes the categories of withheld documents.

CATEGORY 1: ATTORNEY-CLIENT COMMUNICATIONS (1,847 documents)

Description: Direct communications between Citadel in-house counsel and outside counsel (Rodriguez & Partners) regarding:
- Legal advice on dark pool compliance
- Regulatory strategy and investigation response
- Whistleblower complaint legal analysis
- SEC inquiry response strategy

Basis for Withholding: Attorney-client privilege (Fed. R. Evid. 501)
Author/Recipients: P. Rodriguez, K. Morrison, Citadel GC, Citadel Compliance Officers

CATEGORY 2: WORK PRODUCT (892 documents)

Description: Documents prepared by counsel in anticipation of SEC investigation, including:
- Legal memoranda analyzing potential charges
- Investigation interview notes
- Expert witness communications
- Litigation strategy memoranda
- Draft Wells Notice response

Basis for Withholding: Work product doctrine (Fed. R. Civ. P. 26(b)(3))

CATEGORY 3: DUAL-PURPOSE COMMUNICATIONS (461 documents)

Description: Communications serving both business and legal functions, including:
- Board audit committee meeting minutes discussing regulatory exposure
- Compliance department reports prepared under attorney direction
- Risk management assessments involving legal review

Basis for Withholding: Attorney-client privilege (primary purpose test satisfied)

PRIVILEGE WAIVER ANALYSIS

No inadvertent waiver occurred. "Claw-back" agreement with SEC is in place under Fed. R. Evid. 502(d). Selective waiver may be contested if SEC demands some privileged communications.

DOJ PARALLEL INVESTIGATION

NOTE: [REDACTED — Restricted Access Required]
This section has been restricted to senior partner access only per M. Rodriguez authorization.
See separate restricted memorandum filed under Matter 2024-REG-002-RESTRICTED.`,
    },
  ];
}

export default router;
