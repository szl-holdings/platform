/**
 * PgVectorStorageBundle
 *
 * A pgvector-backed StorageBundle for the Alloy Embedding Fabric. It implements
 * the same `VectorStore` / `MetadataIndexStore` interfaces the in-memory and
 * sqlite bundles do, so the shipping `/v1/hybrid-search` route can run against a
 * real Postgres + pgvector index instead of synthetic in-memory data.
 *
 * The retrieval SQL mirrors the proven primitives in
 * `lib/ai-engine/src/rag-vector-store.ts`:
 *   - cosine ANN:    `1 - (embedding <=> $1::vector)` ordered by `embedding <=> $1::vector`
 *   - keyword (FTS): `ts_rank_cd(to_tsvector('english', text), to_tsquery('english', $1))`
 * Both arms fail closed on a missing tenantId (return empty rather than risk
 * cross-tenant leakage), matching the posture in `rag/knowledge-store.ts`.
 *
 * `pg` is loaded lazily via createRequire so importing this module never forces
 * a Postgres dependency on consumers that only use the in-memory/sqlite bundles
 * (the same pattern `sqlite.ts` uses for `better-sqlite3`).
 *
 * Schema: see `packages/db-migrations/sql/0001_aef_pgvector.sql` (created by the
 * RUNBOOK migration step). The vector column dimension must match the embedder
 * (bge-m3 = 1024). No table/column names are interpolated from user input.
 */

import { createRequire } from 'node:module';
import type {
  ChunkStore,
  EvalFixtureStore,
  MetadataIndexStore,
  MetadataIndexRecord,
  RawDocStore,
  StorageBundle,
  VectorRecord,
  VectorStore,
} from './interfaces.js';

const _require = createRequire(import.meta.url);

// Minimal structural type for the subset of `pg.Pool` we use, so this file
// type-checks without a hard compile-time dependency on `@types/pg`.
interface PgQueryResult {
  rows: Array<Record<string, unknown>>;
  rowCount: number | null;
}
interface PgPoolLike {
  query(sql: string, params?: unknown[]): Promise<PgQueryResult>;
  end(): Promise<void>;
}

export interface PgVectorBundleConfig {
  /** Postgres connection string. Defaults to process.env.DATABASE_URL. */
  connectionString?: string;
  /** Table holding chunk text + vector + tsvector. Allowlisted, not user input. */
  table?: string;
  /** Vector column name. */
  vectorColumn?: string;
  /** Embedding dimension (must match the embedder; bge-m3 = 1024). */
  dimensions?: number;
}

const ALLOWED_TABLE = /^[a-z_][a-z0-9_]*$/;

function toVectorLiteral(vec: number[]): string {
  // pgvector accepts a bracketed comma list cast with ::vector.
  return `[${vec.join(',')}]`;
}

function createPool(connectionString: string): PgPoolLike {
  let pg: { Pool: new (cfg: { connectionString: string }) => PgPoolLike };
  try {
    pg = _require('pg') as typeof pg;
  } catch {
    throw new Error(
      "The 'pg' package is not installed. Install it to use PgVectorStorageBundle, " +
        'or use InMemoryStorageBundle / SqliteStorageBundle for development.',
    );
  }
  return new pg.Pool({ connectionString });
}

abstract class PgVectorBase {
  protected readonly pool: PgPoolLike;
  protected readonly table: string;
  protected readonly vectorColumn: string;
  protected readonly dimensions: number;

  constructor(pool: PgPoolLike, cfg: Required<Omit<PgVectorBundleConfig, 'connectionString'>>) {
    this.pool = pool;
    if (!ALLOWED_TABLE.test(cfg.table)) {
      throw new Error(`PgVectorStorageBundle: unsafe table name '${cfg.table}'`);
    }
    if (!ALLOWED_TABLE.test(cfg.vectorColumn)) {
      throw new Error(`PgVectorStorageBundle: unsafe vector column '${cfg.vectorColumn}'`);
    }
    this.table = cfg.table;
    this.vectorColumn = cfg.vectorColumn;
    this.dimensions = cfg.dimensions;
  }
}

export class PgVectorStore extends PgVectorBase implements VectorStore {
  async upsert(record: VectorRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${this.table}
         (chunk_id, source_id, tenant_id, profile_id, model, dimensions, ${this.vectorColumn}, text, metadata, indexed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, $9::jsonb, $10)
       ON CONFLICT (chunk_id) DO UPDATE SET
         source_id = EXCLUDED.source_id,
         tenant_id = EXCLUDED.tenant_id,
         profile_id = EXCLUDED.profile_id,
         model = EXCLUDED.model,
         dimensions = EXCLUDED.dimensions,
         ${this.vectorColumn} = EXCLUDED.${this.vectorColumn},
         text = EXCLUDED.text,
         metadata = EXCLUDED.metadata,
         indexed_at = EXCLUDED.indexed_at`,
      [
        record.chunkId,
        record.sourceId,
        record.tenantId,
        record.profileId ?? null,
        record.model,
        record.dimensions,
        toVectorLiteral(record.vector),
        String((record.metadata.text as string | undefined) ?? ''),
        JSON.stringify(record.metadata),
        record.indexedAt,
      ],
    );
  }

  async get(chunkId: string): Promise<VectorRecord | undefined> {
    const res = await this.pool.query(
      `SELECT chunk_id, source_id, tenant_id, profile_id, model, dimensions, ${this.vectorColumn}::text AS vec, metadata, indexed_at
       FROM ${this.table} WHERE chunk_id = $1`,
      [chunkId],
    );
    const row = res.rows[0];
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
    // Fail closed: never run an unscoped vector scan.
    if (!opts.tenantId) return [];

    const conditions: string[] = [`tenant_id = $2`, `${this.vectorColumn} IS NOT NULL`];
    const params: unknown[] = [toVectorLiteral(opts.vector), opts.tenantId];
    let idx = 3;
    if (opts.profileId) {
      conditions.push(`profile_id = $${idx++}`);
      params.push(opts.profileId);
    }
    if (opts.metadataFilter) {
      for (const [k, v] of Object.entries(opts.metadataFilter)) {
        conditions.push(`metadata ->> $${idx++} = $${idx++}`);
        params.push(k, String(v));
      }
    }
    params.push(opts.topK);

    // cosine ANN — mirrors rag-vector-store.ts:130-133
    const res = await this.pool.query(
      `SELECT chunk_id, source_id, metadata, 1 - (${this.vectorColumn} <=> $1::vector) AS score
       FROM ${this.table}
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${this.vectorColumn} <=> $1::vector
       LIMIT $${idx}`,
      params,
    );
    return res.rows.map((r) => ({
      chunkId: String(r.chunk_id),
      sourceId: String(r.source_id),
      score: Number(r.score),
      metadata: this.parseMetadata(r.metadata),
    }));
  }

  async delete(chunkId: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM ${this.table} WHERE chunk_id = $1`, [chunkId]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    const res = await this.pool.query(
      `DELETE FROM ${this.table} WHERE source_id = $1 AND tenant_id = $2`,
      [sourceId, tenantId],
    );
    return res.rowCount ?? 0;
  }

  async count(tenantId: string): Promise<number> {
    const res = await this.pool.query(
      `SELECT COUNT(*)::int AS cnt FROM ${this.table} WHERE tenant_id = $1`,
      [tenantId],
    );
    return Number(res.rows[0]?.cnt ?? 0);
  }

  private parseMetadata(raw: unknown): Record<string, unknown> {
    if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
    try {
      return JSON.parse(String(raw ?? '{}')) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private rowToRecord(row: Record<string, unknown>): VectorRecord {
    const profileId = row.profile_id ? String(row.profile_id) : undefined;
    const vecText = String(row.vec ?? '[]');
    const vector = vecText
      .replace(/^\[|\]$/g, '')
      .split(',')
      .filter((s) => s.length > 0)
      .map(Number);
    return {
      chunkId: String(row.chunk_id),
      sourceId: String(row.source_id),
      tenantId: String(row.tenant_id),
      ...(profileId !== undefined ? { profileId } : {}),
      model: String(row.model),
      dimensions: Number(row.dimensions),
      vector,
      metadata: this.parseMetadata(row.metadata),
      indexedAt: String(row.indexed_at),
    };
  }
}

export class PgVectorMetadataIndexStore extends PgVectorBase implements MetadataIndexStore {
  async upsert(record: MetadataIndexRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${this.table}
         (chunk_id, source_id, tenant_id, profile_id, title, page, section, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (chunk_id) DO UPDATE SET
         title = EXCLUDED.title,
         page = EXCLUDED.page,
         section = EXCLUDED.section,
         metadata = EXCLUDED.metadata`,
      [
        record.chunkId,
        record.sourceId,
        record.tenantId,
        record.profileId ?? null,
        record.title ?? null,
        record.page ?? null,
        record.section ?? null,
        JSON.stringify(record.metadata),
      ],
    );
  }

  async get(chunkId: string): Promise<MetadataIndexRecord | undefined> {
    const res = await this.pool.query(
      `SELECT chunk_id, source_id, tenant_id, profile_id, title, page, section, metadata, indexed_at AS updated_at
       FROM ${this.table} WHERE chunk_id = $1`,
      [chunkId],
    );
    const row = res.rows[0];
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
    // Fail closed: refuse an unscoped fulltext fallback (cross-tenant leakage guard).
    if (!opts.tenantId) return [];

    const words = opts.terms
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    if (words.length === 0) return [];
    const tsQuery = words.join(' | ');

    const conditions: string[] = [
      `tenant_id = $2`,
      `to_tsvector('english', text) @@ to_tsquery('english', $1)`,
    ];
    const params: unknown[] = [tsQuery, opts.tenantId];
    let idx = 3;
    if (opts.metadataFilter) {
      for (const [k, v] of Object.entries(opts.metadataFilter)) {
        conditions.push(`metadata ->> $${idx++} = $${idx++}`);
        params.push(k, String(v));
      }
    }
    params.push(opts.topK);

    // FTS — mirrors rag-vector-store.ts keywordSearch (ts_rank_cd / to_tsvector).
    const res = await this.pool.query(
      `SELECT chunk_id, source_id, metadata,
              ts_rank_cd(to_tsvector('english', text), to_tsquery('english', $1)) AS score
       FROM ${this.table}
       WHERE ${conditions.join(' AND ')}
       ORDER BY score DESC
       LIMIT $${idx}`,
      params,
    );
    return res.rows.map((r) => ({
      chunkId: String(r.chunk_id),
      sourceId: String(r.source_id),
      score: Number(r.score),
      highlights: words,
      metadata: this.parseMetadata(r.metadata),
    }));
  }

  async delete(chunkId: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM ${this.table} WHERE chunk_id = $1`, [chunkId]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    const res = await this.pool.query(
      `DELETE FROM ${this.table} WHERE source_id = $1 AND tenant_id = $2`,
      [sourceId, tenantId],
    );
    return res.rowCount ?? 0;
  }

  async count(tenantId: string): Promise<number> {
    const res = await this.pool.query(
      `SELECT COUNT(*)::int AS cnt FROM ${this.table} WHERE tenant_id = $1`,
      [tenantId],
    );
    return Number(res.rows[0]?.cnt ?? 0);
  }

  private parseMetadata(raw: unknown): Record<string, unknown> {
    if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
    try {
      return JSON.parse(String(raw ?? '{}')) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private rowToRecord(row: Record<string, unknown>): MetadataIndexRecord {
    const profileId = row.profile_id ? String(row.profile_id) : undefined;
    const title = row.title ? String(row.title) : undefined;
    const page = row.page !== null && row.page !== undefined ? Number(row.page) : undefined;
    const section = row.section ? String(row.section) : undefined;
    return {
      chunkId: String(row.chunk_id),
      sourceId: String(row.source_id),
      tenantId: String(row.tenant_id),
      ...(profileId !== undefined ? { profileId } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(page !== undefined ? { page } : {}),
      ...(section !== undefined ? { section } : {}),
      metadata: this.parseMetadata(row.metadata),
      updatedAt: String(row.updated_at),
    };
  }
}

/**
 * The pgvector bundle shares one table (and one pg.Pool) for both the vector and
 * keyword arms — the chunk text, its embedding, and its tsvector all live on the
 * same `aef_rag_chunks` row, so dense ANN and FTS hit the same source of truth.
 *
 * rawDocs / chunks / evalFixtures are not required by the hybrid-search route and
 * are intentionally left unimplemented here; ingestion uses the dedicated
 * ingestion-orchestrator. Calling them throws an explicit error rather than
 * silently returning fake data.
 */
export interface PgVectorStorageBundle extends StorageBundle {
  close(): Promise<void>;
}

function notImplemented(name: string): never {
  throw new Error(
    `PgVectorStorageBundle.${name} is not implemented — ingestion goes through the ingestion-orchestrator. ` +
      'Only vectors.similaritySearch and metadataIndex.keywordSearch are served on the hybrid-search path.',
  );
}

export function createPgVectorStorageBundle(
  config: PgVectorBundleConfig = {},
): PgVectorStorageBundle {
  const connectionString = config.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'PgVectorStorageBundle requires DATABASE_URL (or config.connectionString). ' +
        'Set it, or use InMemoryStorageBundle for development.',
    );
  }
  const resolved: Required<Omit<PgVectorBundleConfig, 'connectionString'>> = {
    table: config.table ?? process.env.AEF_PGVECTOR_TABLE ?? 'aef_rag_chunks',
    vectorColumn: config.vectorColumn ?? 'embedding',
    dimensions: config.dimensions ?? Number(process.env.VECTOR_DIM ?? 1024),
  };
  const pool = createPool(connectionString);

  const stub = (label: string): never => notImplemented(label);

  return {
    rawDocs: {
      upsert: () => stub('rawDocs.upsert'),
      get: () => stub('rawDocs.get'),
      list: () => stub('rawDocs.list'),
      delete: () => stub('rawDocs.delete'),
      count: () => stub('rawDocs.count'),
    } as unknown as RawDocStore,
    chunks: {
      upsert: () => stub('chunks.upsert'),
      get: () => stub('chunks.get'),
      listBySource: () => stub('chunks.listBySource'),
      listByTenant: () => stub('chunks.listByTenant'),
      delete: () => stub('chunks.delete'),
      deleteBySource: () => stub('chunks.deleteBySource'),
      count: () => stub('chunks.count'),
    } as unknown as ChunkStore,
    vectors: new PgVectorStore(pool, resolved),
    metadataIndex: new PgVectorMetadataIndexStore(pool, resolved),
    evalFixtures: {
      upsert: () => stub('evalFixtures.upsert'),
      get: () => stub('evalFixtures.get'),
      listByProfile: () => stub('evalFixtures.listByProfile'),
      delete: () => stub('evalFixtures.delete'),
      count: () => stub('evalFixtures.count'),
    } as unknown as EvalFixtureStore,
    close: () => pool.end(),
  };
}
