import { createRequire } from 'node:module';
import type {
  ChunkRecord,
  ChunkStore,
  EvalFixtureRecord,
  EvalFixtureStore,
  MetadataIndexRecord,
  MetadataIndexStore,
  RawDocRecord,
  RawDocStore,
  StorageBundle,
  VectorRecord,
  VectorStore,
} from './interfaces.js';

const _require = createRequire(import.meta.url);

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function keywordScore(text: string, terms: string): number {
  const words = terms.toLowerCase().split(/\s+/);
  const lowerText = text.toLowerCase();
  let matches = 0;
  for (const word of words) {
    if (word.length > 0 && lowerText.includes(word)) matches++;
  }
  return words.length > 0 ? matches / words.length : 0;
}

interface SqliteDb {
  prepare(sql: string): SqliteStatement;
  exec(sql: string): void;
  pragma(str: string): unknown;
}

interface SqliteStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

function openDatabase(filePath: string): SqliteDb {
  try {
    const BetterSqlite3 = _require('better-sqlite3') as (path: string, opts?: unknown) => SqliteDb;
    return BetterSqlite3(filePath, { fileMustExist: false });
  } catch {
    throw new Error(
      'better-sqlite3 is not installed. Install it to use SqliteStorageBundle, or use LocalFsStorageBundle for development.',
    );
  }
}

export class SqliteRawDocStore implements RawDocStore {
  private db: SqliteDb;

  constructor(filePath: string) {
    this.db = openDatabase(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS raw_docs (
        source_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        profile_id TEXT,
        title TEXT,
        source_uri TEXT,
        content_type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        ingested_at TEXT NOT NULL,
        PRIMARY KEY (source_id, tenant_id)
      )
    `);
  }

  async upsert(doc: RawDocRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO raw_docs
        (source_id, tenant_id, profile_id, title, source_uri, content_type, content, metadata, ingested_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      doc.sourceId,
      doc.tenantId,
      doc.profileId ?? null,
      doc.title ?? null,
      doc.sourceUri ?? null,
      doc.contentType,
      doc.content,
      JSON.stringify(doc.metadata),
      doc.ingestedAt,
    );
  }

  async get(sourceId: string, tenantId: string): Promise<RawDocRecord | undefined> {
    const stmt = this.db.prepare(`SELECT * FROM raw_docs WHERE source_id = ? AND tenant_id = ?`);
    const row = stmt.get(sourceId, tenantId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.rowToRecord(row);
  }

  async list(tenantId: string, profileId?: string): Promise<RawDocRecord[]> {
    const stmt = profileId
      ? this.db.prepare(`SELECT * FROM raw_docs WHERE tenant_id = ? AND profile_id = ?`)
      : this.db.prepare(`SELECT * FROM raw_docs WHERE tenant_id = ?`);
    const rows = (profileId ? stmt.all(tenantId, profileId) : stmt.all(tenantId)) as Record<
      string,
      unknown
    >[];
    return rows.map((r) => this.rowToRecord(r));
  }

  async delete(sourceId: string, tenantId: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM raw_docs WHERE source_id = ? AND tenant_id = ?`);
    const result = stmt.run(sourceId, tenantId) as { changes: number };
    return result.changes > 0;
  }

  async count(tenantId: string): Promise<number> {
    const stmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM raw_docs WHERE tenant_id = ?`);
    const row = stmt.get(tenantId) as { cnt: number };
    return row.cnt;
  }

  private rowToRecord(row: Record<string, unknown>): RawDocRecord {
    const profileId = row.profile_id ? String(row.profile_id) : undefined;
    const title = row.title ? String(row.title) : undefined;
    const sourceUri = row.source_uri ? String(row.source_uri) : undefined;
    return {
      sourceId: String(row.source_id),
      tenantId: String(row.tenant_id),
      ...(profileId !== undefined ? { profileId } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(sourceUri !== undefined ? { sourceUri } : {}),
      contentType: String(row.content_type),
      content: String(row.content),
      metadata: JSON.parse(String(row.metadata ?? '{}')),
      ingestedAt: String(row.ingested_at),
    };
  }
}

export class SqliteChunkStore implements ChunkStore {
  private db: SqliteDb;

  constructor(filePath: string) {
    this.db = openDatabase(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        chunk_id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        profile_id TEXT,
        chunk_index INTEGER NOT NULL,
        text TEXT NOT NULL,
        token_count INTEGER,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      )
    `);
  }

  async upsert(chunk: ChunkRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chunks
        (chunk_id, source_id, tenant_id, profile_id, chunk_index, text, token_count, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      chunk.chunkId,
      chunk.sourceId,
      chunk.tenantId,
      chunk.profileId ?? null,
      chunk.chunkIndex,
      chunk.text,
      chunk.tokenCount ?? null,
      JSON.stringify(chunk.metadata),
      chunk.createdAt,
    );
  }

  async get(chunkId: string): Promise<ChunkRecord | undefined> {
    const stmt = this.db.prepare(`SELECT * FROM chunks WHERE chunk_id = ?`);
    const row = stmt.get(chunkId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.rowToRecord(row);
  }

  async listBySource(sourceId: string, tenantId: string): Promise<ChunkRecord[]> {
    const stmt = this.db.prepare(
      `SELECT * FROM chunks WHERE source_id = ? AND tenant_id = ? ORDER BY chunk_index`,
    );
    return (stmt.all(sourceId, tenantId) as Record<string, unknown>[]).map((r) =>
      this.rowToRecord(r),
    );
  }

  async listByTenant(tenantId: string, limit = 100): Promise<ChunkRecord[]> {
    const stmt = this.db.prepare(`SELECT * FROM chunks WHERE tenant_id = ? LIMIT ?`);
    return (stmt.all(tenantId, limit) as Record<string, unknown>[]).map((r) => this.rowToRecord(r));
  }

  async delete(chunkId: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM chunks WHERE chunk_id = ?`);
    const result = stmt.run(chunkId) as { changes: number };
    return result.changes > 0;
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM chunks WHERE source_id = ? AND tenant_id = ?`);
    const result = stmt.run(sourceId, tenantId) as { changes: number };
    return result.changes;
  }

  async count(tenantId: string): Promise<number> {
    const stmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM chunks WHERE tenant_id = ?`);
    const row = stmt.get(tenantId) as { cnt: number };
    return row.cnt;
  }

  private rowToRecord(row: Record<string, unknown>): ChunkRecord {
    const profileId = row.profile_id ? String(row.profile_id) : undefined;
    const tokenCount = row.token_count ? Number(row.token_count) : undefined;
    return {
      chunkId: String(row.chunk_id),
      sourceId: String(row.source_id),
      tenantId: String(row.tenant_id),
      ...(profileId !== undefined ? { profileId } : {}),
      chunkIndex: Number(row.chunk_index),
      text: String(row.text),
      ...(tokenCount !== undefined ? { tokenCount } : {}),
      metadata: JSON.parse(String(row.metadata ?? '{}')),
      createdAt: String(row.created_at),
    };
  }
}

export class SqliteVectorStore implements VectorStore {
  private db: SqliteDb;

  constructor(filePath: string) {
    this.db = openDatabase(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        chunk_id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        profile_id TEXT,
        model TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        vector TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        indexed_at TEXT NOT NULL
      )
    `);
  }

  async upsert(record: VectorRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO vectors
        (chunk_id, source_id, tenant_id, profile_id, model, dimensions, vector, metadata, indexed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.chunkId,
      record.sourceId,
      record.tenantId,
      record.profileId ?? null,
      record.model,
      record.dimensions,
      JSON.stringify(record.vector),
      JSON.stringify(record.metadata),
      record.indexedAt,
    );
  }

  async get(chunkId: string): Promise<VectorRecord | undefined> {
    const stmt = this.db.prepare(`SELECT * FROM vectors WHERE chunk_id = ?`);
    const row = stmt.get(chunkId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.rowToRecord(row);
  }

  async similaritySearch(opts: {
    vector: number[];
    topK: number;
    tenantId: string;
    profileId?: string;
    metadataFilter?: Record<string, unknown>;
  }): Promise<
    Array<{ chunkId: string; sourceId: string; score: number; metadata: Record<string, unknown> }>
  > {
    const stmt = opts.profileId
      ? this.db.prepare(`SELECT * FROM vectors WHERE tenant_id = ? AND profile_id = ?`)
      : this.db.prepare(`SELECT * FROM vectors WHERE tenant_id = ?`);
    const rows = (
      opts.profileId ? stmt.all(opts.tenantId, opts.profileId) : stmt.all(opts.tenantId)
    ) as Record<string, unknown>[];

    const candidates = rows
      .map((row) => {
        const rec = this.rowToRecord(row);
        if (opts.metadataFilter) {
          for (const [k, v] of Object.entries(opts.metadataFilter)) {
            if (rec.metadata[k] !== v) return null;
          }
        }
        const score = cosineSimilarity(opts.vector, rec.vector);
        return { chunkId: rec.chunkId, sourceId: rec.sourceId, score, metadata: rec.metadata };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, opts.topK);
  }

  async delete(chunkId: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM vectors WHERE chunk_id = ?`);
    const result = stmt.run(chunkId) as { changes: number };
    return result.changes > 0;
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    const stmt = this.db.prepare(`DELETE FROM vectors WHERE source_id = ? AND tenant_id = ?`);
    const result = stmt.run(sourceId, tenantId) as { changes: number };
    return result.changes;
  }

  async count(tenantId: string): Promise<number> {
    const stmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM vectors WHERE tenant_id = ?`);
    const row = stmt.get(tenantId) as { cnt: number };
    return row.cnt;
  }

  private rowToRecord(row: Record<string, unknown>): VectorRecord {
    const profileId = row.profile_id ? String(row.profile_id) : undefined;
    return {
      chunkId: String(row.chunk_id),
      sourceId: String(row.source_id),
      tenantId: String(row.tenant_id),
      ...(profileId !== undefined ? { profileId } : {}),
      model: String(row.model),
      dimensions: Number(row.dimensions),
      vector: JSON.parse(String(row.vector ?? '[]')) as number[],
      metadata: JSON.parse(String(row.metadata ?? '{}')),
      indexedAt: String(row.indexed_at),
    };
  }
}

export class SqliteMetadataIndexStore implements MetadataIndexStore {
  private db: SqliteDb;

  constructor(filePath: string) {
    this.db = openDatabase(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metadata_index (
        chunk_id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        profile_id TEXT,
        title TEXT,
        page INTEGER,
        section TEXT,
        metadata TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL
      )
    `);
  }

  async upsert(record: MetadataIndexRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO metadata_index
        (chunk_id, source_id, tenant_id, profile_id, title, page, section, metadata, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.chunkId,
      record.sourceId,
      record.tenantId,
      record.profileId ?? null,
      record.title ?? null,
      record.page ?? null,
      record.section ?? null,
      JSON.stringify(record.metadata),
      record.updatedAt,
    );
  }

  async get(chunkId: string): Promise<MetadataIndexRecord | undefined> {
    const stmt = this.db.prepare(`SELECT * FROM metadata_index WHERE chunk_id = ?`);
    const row = stmt.get(chunkId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.rowToRecord(row);
  }

  async keywordSearch(opts: {
    terms: string;
    topK: number;
    tenantId: string;
    metadataFilter?: Record<string, unknown>;
  }): Promise<
    Array<{
      chunkId: string;
      sourceId: string;
      score: number;
      highlights: string[];
      metadata: Record<string, unknown>;
    }>
  > {
    const stmt = this.db.prepare(`SELECT * FROM metadata_index WHERE tenant_id = ?`);
    const rows = stmt.all(opts.tenantId) as Record<string, unknown>[];

    const candidates = rows
      .map((row) => {
        const rec = this.rowToRecord(row);
        if (opts.metadataFilter) {
          for (const [k, v] of Object.entries(opts.metadataFilter)) {
            if (rec.metadata[k] !== v) return null;
          }
        }
        const textContent = [rec.title, rec.section, ...Object.values(rec.metadata).map(String)]
          .filter(Boolean)
          .join(' ');
        const score = keywordScore(textContent, opts.terms);
        if (score === 0) return null;
        const highlights = opts.terms
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w && textContent.toLowerCase().includes(w));
        return {
          chunkId: rec.chunkId,
          sourceId: rec.sourceId,
          score,
          highlights,
          metadata: rec.metadata,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, opts.topK);
  }

  async delete(chunkId: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM metadata_index WHERE chunk_id = ?`);
    const result = stmt.run(chunkId) as { changes: number };
    return result.changes > 0;
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    const stmt = this.db.prepare(
      `DELETE FROM metadata_index WHERE source_id = ? AND tenant_id = ?`,
    );
    const result = stmt.run(sourceId, tenantId) as { changes: number };
    return result.changes;
  }

  async count(tenantId: string): Promise<number> {
    const stmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM metadata_index WHERE tenant_id = ?`);
    const row = stmt.get(tenantId) as { cnt: number };
    return row.cnt;
  }

  private rowToRecord(row: Record<string, unknown>): MetadataIndexRecord {
    const profileId = row.profile_id ? String(row.profile_id) : undefined;
    const title = row.title ? String(row.title) : undefined;
    const page =
      row.page !== null && row.page !== undefined ? Number(row.page) : undefined;
    const section = row.section ? String(row.section) : undefined;
    return {
      chunkId: String(row.chunk_id),
      sourceId: String(row.source_id),
      tenantId: String(row.tenant_id),
      ...(profileId !== undefined ? { profileId } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(page !== undefined ? { page } : {}),
      ...(section !== undefined ? { section } : {}),
      metadata: JSON.parse(String(row.metadata ?? '{}')),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqliteEvalFixtureStore implements EvalFixtureStore {
  private db: SqliteDb;

  constructor(filePath: string) {
    this.db = openDatabase(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS eval_fixtures (
        fixture_id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        query_id TEXT NOT NULL,
        query TEXT NOT NULL,
        relevant_chunk_ids TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}'
      )
    `);
  }

  async upsert(fixture: EvalFixtureRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO eval_fixtures
        (fixture_id, profile_id, tenant_id, query_id, query, relevant_chunk_ids, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      fixture.fixtureId,
      fixture.profileId,
      fixture.tenantId,
      fixture.queryId,
      fixture.query,
      JSON.stringify(fixture.relevantChunkIds),
      JSON.stringify(fixture.metadata),
    );
  }

  async get(fixtureId: string): Promise<EvalFixtureRecord | undefined> {
    const stmt = this.db.prepare(`SELECT * FROM eval_fixtures WHERE fixture_id = ?`);
    const row = stmt.get(fixtureId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.rowToRecord(row);
  }

  async listByProfile(profileId: string): Promise<EvalFixtureRecord[]> {
    const stmt = this.db.prepare(`SELECT * FROM eval_fixtures WHERE profile_id = ?`);
    return (stmt.all(profileId) as Record<string, unknown>[]).map((r) => this.rowToRecord(r));
  }

  async delete(fixtureId: string): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM eval_fixtures WHERE fixture_id = ?`);
    const result = stmt.run(fixtureId) as { changes: number };
    return result.changes > 0;
  }

  async count(profileId: string): Promise<number> {
    const stmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM eval_fixtures WHERE profile_id = ?`);
    const row = stmt.get(profileId) as { cnt: number };
    return row.cnt;
  }

  private rowToRecord(row: Record<string, unknown>): EvalFixtureRecord {
    return {
      fixtureId: String(row.fixture_id),
      profileId: String(row.profile_id),
      tenantId: String(row.tenant_id),
      queryId: String(row.query_id),
      query: String(row.query),
      relevantChunkIds: JSON.parse(String(row.relevant_chunk_ids ?? '[]')) as string[],
      metadata: JSON.parse(String(row.metadata ?? '{}')),
    };
  }
}

export function createSqliteStorageBundle(filePath: string): StorageBundle {
  return {
    rawDocs: new SqliteRawDocStore(filePath),
    chunks: new SqliteChunkStore(filePath),
    vectors: new SqliteVectorStore(filePath),
    metadataIndex: new SqliteMetadataIndexStore(filePath),
    evalFixtures: new SqliteEvalFixtureStore(filePath),
  };
}
