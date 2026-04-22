/**
 * Embedding Pipeline — multi-provider embedding generation with versioning,
 * batch processing, and automatic re-embedding on model change.
 */

export interface EmbeddingProvider {
  id: string;
  name: string;
  dimensions: number;
  maxBatchSize: number;
  embed(texts: string[]): Promise<number[][]>;
}

// ─── HuggingFace Embedding Provider ──────────────────────────────────────────

class HuggingFaceEmbeddingProvider implements EmbeddingProvider {
  id: string;
  name: string;
  dimensions: number;
  maxBatchSize = 32;

  constructor(modelId: string, dimensions = 1536) {
    this.id = modelId;
    this.name = modelId.split('/').pop() ?? modelId;
    this.dimensions = dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const token = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
    if (!token) {
      return texts.map(() => new Array(this.dimensions).fill(0) as number[]);
    }

    const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.id}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
      });

      if (!response.ok) {
        const _errText = await response.text().catch(() => 'unknown');
        return texts.map(() => new Array(this.dimensions).fill(0) as number[]);
      }

      const data = (await response.json()) as number[][] | number[][][];

      if (!Array.isArray(data)) {
        return texts.map(() => new Array(this.dimensions).fill(0) as number[]);
      }

      return data.map((item) => {
        if (Array.isArray(item) && Array.isArray(item[0])) {
          const nested = item as number[][];
          const vec = nested[0]!;
          return vec;
        }
        return item as number[];
      });
    } catch (_err) {
      return texts.map(() => new Array(this.dimensions).fill(0) as number[]);
    }
  }
}

// ─── OpenAI-compatible Embedding Provider ─────────────────────────────────────

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  id: string;
  name: string;
  dimensions: number;
  maxBatchSize = 100;
  private apiKey: string;
  private baseUrl: string;

  constructor(
    modelId: string,
    dimensions = 1536,
    apiKey?: string,
    baseUrl = 'https://api.openai.com/v1',
  ) {
    this.id = modelId;
    this.name = modelId;
    this.dimensions = dimensions;
    this.apiKey = apiKey ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? '';
    this.baseUrl = baseUrl;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      return texts.map(() => new Array(this.dimensions).fill(0) as number[]);
    }

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: this.id, input: texts }),
      });

      if (!response.ok) {
        return texts.map(() => new Array(this.dimensions).fill(0) as number[]);
      }

      const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
      return data.data.map((d) => d.embedding);
    } catch (_err) {
      return texts.map(() => new Array(this.dimensions).fill(0) as number[]);
    }
  }
}

// ─── Gemini Embedding Provider ────────────────────────────────────────────────

class GeminiEmbeddingProvider implements EmbeddingProvider {
  id: string;
  name: string;
  dimensions: number;
  maxBatchSize = 1;

  constructor(modelId = 'models/text-embedding-004', dimensions = 768) {
    this.id = modelId;
    this.name = modelId.split('/').pop() ?? modelId;
    this.dimensions = dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return texts.map(() => new Array(this.dimensions).fill(0) as number[]);
    }

    const results: number[][] = [];
    for (const text of texts) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${this.id}:embedContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: this.id,
              content: { parts: [{ text: text.slice(0, 8000) }] },
            }),
          },
        );
        if (!response.ok) {
          results.push(new Array(this.dimensions).fill(0) as number[]);
          continue;
        }
        const data = (await response.json()) as { embedding?: { values?: number[] } };
        results.push(data.embedding?.values ?? (new Array(this.dimensions).fill(0) as number[]));
      } catch (_err) {
        results.push(new Array(this.dimensions).fill(0) as number[]);
      }
    }
    return results;
  }
}

// ─── Local / Ollama-Compatible Embedding Provider ─────────────────────────────

class LocalOllamaEmbeddingProvider implements EmbeddingProvider {
  id: string;
  name: string;
  dimensions: number;
  maxBatchSize = 16;
  private baseUrl: string;

  constructor(modelId: string, dimensions = 1024, baseUrl?: string) {
    this.id = modelId;
    this.name = `local:${modelId}`;
    this.dimensions = dimensions;
    this.baseUrl = baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      try {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: this.id, prompt: text.slice(0, 8000) }),
        });
        if (!response.ok) {
          results.push(new Array(this.dimensions).fill(0) as number[]);
          continue;
        }
        const data = (await response.json()) as { embedding?: number[] };
        results.push(data.embedding ?? (new Array(this.dimensions).fill(0) as number[]));
      } catch (_err) {
        results.push(new Array(this.dimensions).fill(0) as number[]);
      }
    }
    return results;
  }
}

// ─── Schema Dimension & Normalisation ─────────────────────────────────────────
// The canonical vector column width is set by VECTOR_DIM (default 1024, matching
// the BAAI/bge-m3 migrations). Providers with a different native dimension are
// supported via dimension normalisation: vectors are truncated (with L2
// renormalisation) when larger, or zero-padded when smaller. This allows OpenAI,
// Gemini, and local models to coexist without schema changes; the tradeoff is a
// minor accuracy loss for mismatched providers, which is acceptable while the
// schema uses a single shared column. Operators can change VECTOR_DIM and run a
// new migration + full re-embed to switch canonical dimensions.

export const SCHEMA_VECTOR_DIM: number = parseInt(process.env.VECTOR_DIM ?? '1024', 10);

export class EmbeddingDimensionError extends Error {
  constructor(
    public readonly modelId: string,
    public readonly actual: number,
  ) {
    super(
      `Embedding model "${modelId}" produces ${actual}-dimensional vectors (VECTOR_DIM=${SCHEMA_VECTOR_DIM})`,
    );
    this.name = 'EmbeddingDimensionError';
  }
}

export function normalizeEmbeddingDimension(vec: number[], targetDim: number): number[] {
  if (vec.length === targetDim) return vec;
  if (vec.length > targetDim) {
    const truncated = vec.slice(0, targetDim);
    let norm = 0;
    for (const v of truncated) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    return truncated.map((v) => v / norm);
  }
  const padded = new Array(targetDim).fill(0) as number[];
  for (let i = 0; i < vec.length; i++) padded[i] = vec[i]!;
  return padded;
}

// ─── Provider Registry ────────────────────────────────────────────────────────

const BUILTIN_PROVIDERS: Record<string, EmbeddingProvider> = {
  'BAAI/bge-m3': new HuggingFaceEmbeddingProvider('BAAI/bge-m3', 1024),
  'sentence-transformers/all-MiniLM-L6-v2': new HuggingFaceEmbeddingProvider(
    'sentence-transformers/all-MiniLM-L6-v2',
    384,
  ),
  'text-embedding-3-small': new OpenAIEmbeddingProvider('text-embedding-3-small', 1536),
  'text-embedding-3-large': new OpenAIEmbeddingProvider('text-embedding-3-large', 3072),
  'text-embedding-ada-002': new OpenAIEmbeddingProvider('text-embedding-ada-002', 1536),
  'models/text-embedding-004': new GeminiEmbeddingProvider('models/text-embedding-004', 768),
  'models/embedding-001': new GeminiEmbeddingProvider('models/embedding-001', 768),
  'nomic-embed-text': new LocalOllamaEmbeddingProvider('nomic-embed-text', 768),
  'mxbai-embed-large': new LocalOllamaEmbeddingProvider('mxbai-embed-large', 1024),
};

const customProviders: Map<string, EmbeddingProvider> = new Map();

export function registerEmbeddingProvider(provider: EmbeddingProvider): void {
  customProviders.set(provider.id, provider);
}

export function getEmbeddingProvider(modelId?: string): EmbeddingProvider {
  const id = modelId ?? process.env.HF_EMBED_MODEL ?? 'BAAI/bge-m3';
  return (
    customProviders.get(id) ??
    BUILTIN_PROVIDERS[id] ??
    new HuggingFaceEmbeddingProvider(id, SCHEMA_VECTOR_DIM)
  );
}

/**
 * Lists all registered embedding providers with their native dimensions and
 * schema compatibility status. Providers whose native dimension differs from
 * SCHEMA_VECTOR_DIM are still usable (vectors are normalised at write time)
 * but are marked `schemaCompatible: false` for informational purposes.
 */
export function listEmbeddingProviders(): Array<{
  id: string;
  name: string;
  dimensions: number;
  schemaDimension: number;
  schemaCompatible: boolean;
  normalisationApplied: boolean;
}> {
  const all = [...Object.values(BUILTIN_PROVIDERS), ...Array.from(customProviders.values())];
  return all.map((p) => ({
    id: p.id,
    name: p.name,
    dimensions: p.dimensions,
    schemaDimension: SCHEMA_VECTOR_DIM,
    schemaCompatible: p.dimensions === SCHEMA_VECTOR_DIM,
    normalisationApplied: p.dimensions !== SCHEMA_VECTOR_DIM,
  }));
}

// ─── Core Embedding Functions ─────────────────────────────────────────────────

export async function generateEmbedding(text: string, modelId?: string): Promise<number[]> {
  const provider = getEmbeddingProvider(modelId);
  const results = await provider.embed([text.slice(0, 8000)]);
  const raw = results[0] ?? [];
  return raw.length === SCHEMA_VECTOR_DIM
    ? raw
    : normalizeEmbeddingDimension(raw, SCHEMA_VECTOR_DIM);
}

export async function generateEmbeddingsBatch(
  texts: string[],
  modelId?: string,
): Promise<number[][]> {
  const provider = getEmbeddingProvider(modelId);
  const batchSize = provider.maxBatchSize;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 8000));
    const embeddings = await provider.embed(batch);
    results.push(
      ...embeddings.map((v) =>
        v.length === SCHEMA_VECTOR_DIM ? v : normalizeEmbeddingDimension(v, SCHEMA_VECTOR_DIM),
      ),
    );
  }

  return results;
}

// ─── Vector Format Utilities ──────────────────────────────────────────────────

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── Async Embedding Task Processor ──────────────────────────────────────────

async function getPool() {
  const { pool } = await import('@szl-holdings/db');
  return pool;
}

export interface EmbeddingTaskSpec {
  targetTable: string;
  targetId: string;
  contentColumn?: string;
  targetColumn?: string;
  modelId?: string;
  priority?: number;
}

export async function scheduleEmbeddingTask(task: EmbeddingTaskSpec): Promise<void> {
    const pool = await getPool();
    await pool.query(
      `INSERT INTO embedding_tasks (target_table, target_id, content_column, target_column, model_id, status, priority)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       ON CONFLICT (target_table, target_id, target_column) DO UPDATE SET
         status = 'pending',
         attempts = 0,
         error_message = NULL,
         scheduled_at = NOW()`,
      [
        task.targetTable,
        task.targetId,
        task.contentColumn ?? 'content',
        task.targetColumn ?? 'embedding',
        task.modelId ?? null,
        task.priority ?? 5,
      ],
    );
}

export async function processEmbeddingTasks(
  limit = 20,
): Promise<{ processed: number; failed: number }> {
  const pool = await getPool();
  let processed = 0;
  let failed = 0;

  try {
    // Atomically claim tasks: the UPDATE + RETURNING pattern eliminates the
    // window between SELECT FOR UPDATE and the follow-up UPDATE where a second
    // concurrent worker could pick the same row after autocommit.
    const taskResult = await pool.query(
      `UPDATE embedding_tasks
       SET status = 'running', started_at = NOW(), attempts = attempts + 1
       WHERE id IN (
         SELECT id FROM embedding_tasks
         WHERE status = 'pending' AND attempts < max_attempts
         ORDER BY priority ASC, scheduled_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [limit],
    );

    for (const task of taskResult.rows as Array<Record<string, unknown>>) {
      const taskId = task.id as string;
      const targetTable = task.target_table as string;
      const targetId = task.target_id as string;
      const contentColumn = task.content_column as string;
      const targetColumn = task.target_column as string;
      const modelId = task.model_id as string | null;

      try {
        const allowedEntry = ALLOWED_EMBED_TABLES[targetTable];
        if (!allowedEntry) {
          await pool.query(
            `UPDATE embedding_tasks SET status = 'failed', error_message = 'Table not allowed' WHERE id = $1`,
            [taskId],
          );
          failed++;
          continue;
        }
        if (
          !allowedEntry.allowedContent.includes(contentColumn) ||
          !allowedEntry.allowedTarget.includes(targetColumn)
        ) {
          await pool.query(
            `UPDATE embedding_tasks SET status = 'failed', error_message = 'Column not allowed' WHERE id = $1`,
            [taskId],
          );
          failed++;
          continue;
        }

        const safeTable = targetTable;
        const safeIdCol = allowedEntry.idCol;
        const safeContent = contentColumn;
        const safeTarget = targetColumn;

        const contentResult = await pool.query(
          `SELECT ${safeContent} FROM ${safeTable} WHERE ${safeIdCol} = $1`,
          [targetId],
        );

        if (!contentResult.rows[0]) {
          await pool.query(
            `UPDATE embedding_tasks SET status = 'failed', error_message = 'Row not found' WHERE id = $1`,
            [taskId],
          );
          failed++;
          continue;
        }

        const content = contentResult.rows[0][safeContent] as string;
        if (!content) {
          await pool.query(
            `UPDATE embedding_tasks SET status = 'failed', error_message = 'Empty content' WHERE id = $1`,
            [taskId],
          );
          failed++;
          continue;
        }

        const embedding = await generateEmbedding(content, modelId ?? undefined);

        // Reject all-zero vectors — they signal a provider/auth failure, not a real
        // embedding. Persisting zeros would silently poison retrieval quality.
        // Leave the column NULL and requeue via the retry mechanism instead.
        const isZeroVector = embedding.length === 0 || embedding.every((v) => v === 0);
        if (isZeroVector) {
          const currentAttempts = task.attempts as number;
          const maxAttempts = task.max_attempts as number;
          if (currentAttempts >= maxAttempts) {
            await pool.query(
              `UPDATE embedding_tasks SET status = 'failed', error_message = 'Provider returned zero vector — retries exhausted' WHERE id = $1`,
              [taskId],
            );
          } else {
            await pool.query(
              `UPDATE embedding_tasks SET status = 'pending', error_message = 'Provider returned zero vector — will retry' WHERE id = $1`,
              [taskId],
            );
          }
          failed++;
          continue;
        }

        const embeddingLiteral = toVectorLiteral(embedding);

        await pool.query(
          `UPDATE ${safeTable} SET ${safeTarget} = $1::vector WHERE ${safeIdCol} = $2`,
          [embeddingLiteral, targetId],
        );

        // Persist model provenance on tables that track it (kg_entities, rag_knowledge_chunks).
        const effectiveModelId = modelId ?? process.env.HF_EMBED_MODEL ?? 'BAAI/bge-m3';
        if (safeTable === 'kg_entities') {
          await pool.query(
            `UPDATE kg_entities SET embedding_model = $1, embedding_at = NOW() WHERE id = $2`,
            [effectiveModelId, targetId],
          );
        } else if (safeTable === 'rag_knowledge_chunks') {
          await pool.query(
            `UPDATE rag_knowledge_chunks SET embedding_model = $1, embedding_at = NOW() WHERE id = $2`,
            [effectiveModelId, targetId],
          );
        }

        await pool.query(
          `UPDATE embedding_tasks SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [taskId],
        );
        processed++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        // When a task has consumed all its allowed attempts, mark it as 'failed' so it
        // is not re-queued indefinitely. The SELECT above already incremented `attempts`
        // (via `attempts = attempts + 1`), so `task.attempts` reflects the current count.
        const currentAttempts = task.attempts as number;
        const maxAttempts = task.max_attempts as number;
        if (currentAttempts >= maxAttempts) {
          await pool.query(
            `UPDATE embedding_tasks SET status = 'failed', error_message = $1 WHERE id = $2`,
            [`retries exhausted (${currentAttempts}/${maxAttempts}): ${errMsg}`, taskId],
          );
        } else {
          await pool.query(
            `UPDATE embedding_tasks SET status = 'pending', error_message = $1 WHERE id = $2`,
            [errMsg, taskId],
          );
        }
        failed++;
      }
    }
  } catch (_err) {
  }

  return { processed, failed };
}

// ─── Identifier Allowlist (prevents SQL injection from table/column names) ────

// NOTE: rag_knowledge_documents is intentionally excluded — it has no vector column.
// Only tables with a vector(1024) column may appear in this allowlist.
const ALLOWED_EMBED_TABLES: Record<
  string,
  { idCol: string; allowedContent: string[]; allowedTarget: string[] }
> = {
  kg_entities: {
    idCol: 'id',
    allowedContent: ['name', 'description'],
    allowedTarget: ['embedding'],
  },
  rag_knowledge_chunks: {
    idCol: 'id',
    allowedContent: ['content'],
    allowedTarget: ['embedding'],
  },
  // rag_knowledge_documents intentionally removed — no vector column exists on that table.
};

/** Returns the set of allowed table names for request-time validation in API routes. */
export function getAllowedEmbedTableNames(): string[] {
  return Object.keys(ALLOWED_EMBED_TABLES);
}

function assertAllowedIdentifier(table: string, contentCol: string, targetCol: string): void {
  const entry = ALLOWED_EMBED_TABLES[table];
  if (!entry) throw new Error(`[embedding-pipeline] Table not in allowlist: ${table}`);
  if (!entry.allowedContent.includes(contentCol))
    throw new Error(
      `[embedding-pipeline] Content column not in allowlist: ${contentCol} for ${table}`,
    );
  if (!entry.allowedTarget.includes(targetCol))
    throw new Error(
      `[embedding-pipeline] Target column not in allowlist: ${targetCol} for ${table}`,
    );
}

export async function batchEmbedTable(
  tableName: string,
  _idColumn: string,
  contentColumn: string,
  embeddingColumn: string,
  modelId?: string,
  batchSize = 50,
): Promise<{ processed: number; skipped: number }> {
  assertAllowedIdentifier(tableName, contentColumn, embeddingColumn);
  const safeTable = tableName;
  const safeId = ALLOWED_EMBED_TABLES[tableName]?.idCol;
  const safeContent = contentColumn;
  const safeTarget = embeddingColumn;

  const pool = await getPool();
  let processed = 0;
  let skipped = 0;
  let lastId: string | null = null;

  while (true) {
    const cursorClause = lastId ? `AND ${safeId} > $2` : '';
    const params = lastId ? [batchSize, lastId] : [batchSize];
    const result = await pool.query(
      `SELECT ${safeId}, ${safeContent} FROM ${safeTable}
       WHERE ${safeTarget} IS NULL AND ${safeContent} IS NOT NULL AND ${safeContent} != ''
       ${cursorClause}
       ORDER BY ${safeId}
       LIMIT $1`,
      params,
    );

    if (result.rows.length === 0) break;

    lastId = result.rows[result.rows.length - 1][safeId] as string;
    const texts = result.rows.map((r: Record<string, unknown>) =>
      String(r[safeContent] ?? '').slice(0, 8000),
    );
    const ids = result.rows.map((r: Record<string, unknown>) => r[safeId]);

    try {
      const embeddings = await generateEmbeddingsBatch(texts, modelId);

      for (let i = 0; i < embeddings.length; i++) {
        const embedding = embeddings[i];
        if (!embedding || embedding.every((v) => v === 0)) {
          skipped++;
          continue;
        }
        await pool.query(
          `UPDATE ${safeTable} SET ${safeTarget} = $1::vector WHERE ${safeId} = $2`,
          [toVectorLiteral(embedding), ids[i]],
        );
        processed++;
      }
    } catch (_err) {
      skipped += result.rows.length;
    }
  }

  return { processed, skipped };
}

// ─── Model-Change Re-Embedding Orchestration ──────────────────────────────────

export interface ReembeddingStatus {
  table: string;
  scheduled: number;
  alreadyCurrent: number;
  totalRows: number;
}

/**
 * Detects rows whose `embedding_model` differs from the current active model
 * (or is NULL) and enqueues them for re-embedding. Call this when the model
 * is changed via HF_EMBED_MODEL env var to trigger a full re-embed migration.
 */
export async function scheduleReembeddingOnModelChange(options: {
  targetModelId?: string;
  tables?: Array<{ table: string; contentColumn: string; targetColumn?: string }>;
  priority?: number;
}): Promise<ReembeddingStatus[]> {
  const pool = await getPool();
  const modelId = options.targetModelId ?? process.env.HF_EMBED_MODEL ?? 'BAAI/bge-m3';
  const priority = options.priority ?? 8;

  const watchedTables = options.tables ?? [
    { table: 'kg_entities', contentColumn: 'description', targetColumn: 'embedding' },
    { table: 'rag_knowledge_chunks', contentColumn: 'content', targetColumn: 'embedding' },
  ];

  const results: ReembeddingStatus[] = [];

  for (const { table, contentColumn, targetColumn = 'embedding' } of watchedTables) {
    const entry = ALLOWED_EMBED_TABLES[table];
    if (!entry) {
      continue;
    }
    if (
      !entry.allowedContent.includes(contentColumn) ||
      !entry.allowedTarget.includes(targetColumn)
    ) {
      continue;
    }

    const safeTable = table;
    const safeId = entry.idCol;

    // Both kg_entities and rag_knowledge_chunks now track embedding_model provenance.
    // We re-queue any row whose embedding_model is NULL (never embedded) or differs
    // from the target model (stale, produced by an older model).
    const hasModelCol = safeTable === 'kg_entities' || safeTable === 'rag_knowledge_chunks';
    const whereClause = hasModelCol
      ? `WHERE ${contentColumn} IS NOT NULL AND ${contentColumn} != '' AND (embedding_model IS NULL OR embedding_model != $1)`
      : `WHERE ${contentColumn} IS NOT NULL AND ${contentColumn} != '' AND ${targetColumn} IS NULL`;

    const countParams = hasModelCol ? [modelId] : [];
    // Count rows that need re-embedding (stale or never embedded).
    const staleCountResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM ${safeTable} ${whereClause}`,
      countParams,
    );
    const staleCount = (staleCountResult.rows[0] as { total: number }).total;
    // Count all rows in the table to report alreadyCurrent accurately.
    const totalCountResult = await pool.query(`SELECT COUNT(*)::int AS total FROM ${safeTable}`);
    const totalRows = (totalCountResult.rows[0] as { total: number }).total;

    const rowResult = await pool.query(
      `SELECT ${safeId} FROM ${safeTable} ${whereClause} ORDER BY ${safeId}`,
      countParams,
    );

    let scheduled = 0;
    for (const row of rowResult.rows as Array<Record<string, string>>) {
      const targetId = row[safeId]!;
      await pool.query(
        `INSERT INTO embedding_tasks (target_table, target_id, content_column, target_column, model_id, status, priority)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         ON CONFLICT (target_table, target_id, target_column) DO UPDATE SET
           status = 'pending',
           model_id = EXCLUDED.model_id,
           attempts = 0,
           error_message = NULL,
           scheduled_at = NOW()`,
        [safeTable, targetId, contentColumn, targetColumn, modelId, priority],
      );
      scheduled++;
    }

    results.push({
      table: safeTable,
      scheduled,
      // alreadyCurrent: rows with current model (not stale) — correctly reflects
      // the full-table total minus those actually needing re-embedding.
      alreadyCurrent: totalRows - staleCount,
      totalRows,
    });

    if (scheduled > 0) {
    }
  }

  return results;
}
