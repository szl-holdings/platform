import { and, desc, eq, type InferInsertModel, inArray, lt, or } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { MemoryEntry, MemoryTier } from "./types.js";
import type { MemoryStore, MemoryStoreQuery } from "./store.js";

export interface PostgresMemoryStoreLogger {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

/**
 * Structural shape of the memory_records table columns this store reads or
 * writes. Callers pass the actual Drizzle table; no schema imports needed.
 */
export interface MemoryRecordsTableLike extends PgTable {
  externalId: PgColumn;
  retentionPolicy: PgColumn;
  expiresAt: PgColumn;
  lastUpdatedAt: PgColumn;
}

export interface PostgresMemoryStoreOptions {
  db: NodePgDatabase<Record<string, unknown>>;
  memoryRecordsTable: MemoryRecordsTableLike;
  flushIntervalMs?: number;
  hydrateLimit?: number;
  logger?: PostgresMemoryStoreLogger;
}

interface MemoryRowShape {
  externalId: string;
  tier: MemoryTier;
  key: string;
  value: unknown;
  scopeId: string | null;
  confidence: string | number | null;
  sensitivity: MemoryEntry["sensitivity"];
  retentionPolicy: MemoryEntry["retention"]["policy"];
  expiresAt: Date | null;
  maxAgeDays: number | null;
  isStale: boolean | null;
  provenanceSource: MemoryEntry["provenance"]["source"];
  provenanceSourceId: string | null;
  provenanceAuthor: string | null;
  provenanceMethod: MemoryEntry["provenance"]["method"];
  linkedEntities: string[] | null;
  linkedTraces: string[] | null;
  linkedActions: string[] | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  lastAccessedAt: Date | null;
  lastUpdatedAt: Date | null;
  createdAt: Date | null;
}

function buildRow(entry: MemoryEntry): InferInsertModel<MemoryRecordsTableLike> {
  const row = {
    externalId: entry.id,
    tier: entry.tier,
    key: entry.key,
    value: entry.value ?? null,
    scopeId: entry.scopeId ?? null,
    confidence: String(entry.confidence ?? 1),
    sensitivity: entry.sensitivity,
    retentionPolicy: entry.retention.policy,
    expiresAt: entry.retention.expiresAt ? new Date(entry.retention.expiresAt) : null,
    maxAgeDays: entry.retention.maxAgeDays ?? null,
    isStale: entry.freshness.isStale ?? false,
    provenanceSource: entry.provenance.source,
    provenanceSourceId: entry.provenance.sourceId ?? null,
    provenanceAuthor: entry.provenance.author ?? null,
    provenanceMethod: entry.provenance.method,
    linkedEntities: entry.linkedEntities ?? [],
    linkedTraces: entry.linkedTraces ?? [],
    linkedActions: entry.linkedActions ?? [],
    tags: entry.tags ?? [],
    metadata: entry.metadata ?? {},
    lastAccessedAt: entry.freshness.lastAccessedAt
      ? new Date(entry.freshness.lastAccessedAt)
      : null,
    lastUpdatedAt: new Date(entry.freshness.lastUpdatedAt ?? new Date().toISOString()),
  };
  return row as InferInsertModel<MemoryRecordsTableLike>;
}

function rowToEntry(raw: unknown): MemoryEntry | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Partial<MemoryRowShape>;
  if (typeof row.externalId !== "string") return undefined;
  return {
    id: row.externalId,
    tier: row.tier as MemoryTier,
    key: row.key ?? "",
    value: row.value ?? undefined,
    scopeId: row.scopeId ?? undefined,
    confidence:
      typeof row.confidence === "string"
        ? Number(row.confidence)
        : row.confidence ?? 1,
    sensitivity: row.sensitivity as MemoryEntry["sensitivity"],
    provenance: {
      source: row.provenanceSource as MemoryEntry["provenance"]["source"],
      sourceId: row.provenanceSourceId ?? undefined,
      author: row.provenanceAuthor ?? undefined,
      method: row.provenanceMethod as MemoryEntry["provenance"]["method"],
      createdAt: (row.createdAt instanceof Date
        ? row.createdAt
        : new Date(Date.now())
      ).toISOString(),
    },
    freshness: {
      lastAccessedAt: row.lastAccessedAt
        ? new Date(row.lastAccessedAt).toISOString()
        : undefined,
      lastUpdatedAt: (row.lastUpdatedAt instanceof Date
        ? row.lastUpdatedAt
        : new Date(Date.now())
      ).toISOString(),
      isStale: !!row.isStale,
    },
    retention: {
      policy: row.retentionPolicy as MemoryEntry["retention"]["policy"],
      expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : undefined,
      maxAgeDays: row.maxAgeDays ?? undefined,
    },
    linkedEntities: Array.isArray(row.linkedEntities) ? row.linkedEntities : [],
    linkedTraces: Array.isArray(row.linkedTraces) ? row.linkedTraces : [],
    linkedActions: Array.isArray(row.linkedActions) ? row.linkedActions : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    metadata:
      row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  };
}

export class PostgresMemoryStore implements MemoryStore {
  private readonly cache = new Map<string, MemoryEntry>();
  private readonly pendingWrites = new Map<string, MemoryEntry>();
  private readonly pendingDeletes = new Set<string>();
  private flushing = false;
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private readonly opts: Required<
    Pick<PostgresMemoryStoreOptions, "flushIntervalMs" | "hydrateLimit">
  > &
    PostgresMemoryStoreOptions;

  constructor(opts: PostgresMemoryStoreOptions) {
    this.opts = { flushIntervalMs: 1000, hydrateLimit: 5000, ...opts };
    if (this.opts.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush().catch((err) =>
          this.opts.logger?.warn?.(
            { err },
            "PostgresMemoryStore: scheduled flush failed",
          ),
        );
      }, this.opts.flushIntervalMs);
      this.flushTimer.unref?.();
    }
  }

  put(entry: MemoryEntry): void {
    const updated: MemoryEntry = {
      ...entry,
      freshness: { ...entry.freshness, lastUpdatedAt: new Date().toISOString() },
    };
    const copy: MemoryEntry = JSON.parse(JSON.stringify(updated));
    this.cache.set(entry.id, copy);
    this.pendingWrites.set(entry.id, copy);
    this.pendingDeletes.delete(entry.id);
  }

  get(id: string): MemoryEntry | undefined {
    const entry = this.cache.get(id);
    if (entry) {
      const updated: MemoryEntry = {
        ...entry,
        freshness: { ...entry.freshness, lastAccessedAt: new Date().toISOString() },
      };
      this.cache.set(id, updated);
      this.pendingWrites.set(id, updated);
      return updated;
    }
    return undefined;
  }

  getByKey(tier: MemoryTier, key: string, scopeId?: string): MemoryEntry | undefined {
    for (const entry of this.cache.values()) {
      if (entry.tier === tier && entry.key === key) {
        if (scopeId === undefined || entry.scopeId === scopeId) return entry;
      }
    }
    return undefined;
  }

  list(query?: MemoryStoreQuery): MemoryEntry[] {
    let results = Array.from(this.cache.values());
    if (query?.tier) results = results.filter((e) => e.tier === query.tier);
    if (query?.key) results = results.filter((e) => e.key === query.key);
    if (query?.scopeId) results = results.filter((e) => e.scopeId === query.scopeId);
    if (query?.tags?.length) {
      results = results.filter((e) => query.tags!.every((t) => e.tags.includes(t)));
    }
    if (!query?.includeStale) {
      results = results.filter((e) => !e.freshness.isStale);
    }
    return results;
  }

  delete(id: string): boolean {
    const had = this.cache.delete(id);
    if (had) {
      this.pendingWrites.delete(id);
      this.pendingDeletes.add(id);
    }
    return had;
  }

  evictExpired(): number {
    const now = new Date();
    let count = 0;
    for (const [id, entry] of this.cache) {
      if (entry.retention.expiresAt && new Date(entry.retention.expiresAt) < now) {
        this.cache.delete(id);
        this.pendingWrites.delete(id);
        this.pendingDeletes.add(id);
        count++;
      }
    }
    return count;
  }

  count(tier?: MemoryTier): number {
    if (!tier) return this.cache.size;
    let n = 0;
    for (const e of this.cache.values()) {
      if (e.tier === tier) n++;
    }
    return n;
  }

  clear(tier?: MemoryTier): void {
    if (!tier) {
      for (const id of this.cache.keys()) this.pendingDeletes.add(id);
      this.cache.clear();
      this.pendingWrites.clear();
      return;
    }
    for (const [id, e] of this.cache) {
      if (e.tier === tier) {
        this.cache.delete(id);
        this.pendingWrites.delete(id);
        this.pendingDeletes.add(id);
      }
    }
  }

  /**
   * Load the most recently updated memory entries into the in-process cache.
   * Ordered by `last_updated_at DESC` so that — for the standard case where
   * the live working set fits within `hydrateLimit` — the most relevant
   * entries are warm immediately after restart. Older entries remain durably
   * persisted in Postgres and are available via direct DB queries.
   */
  async hydrate(limit?: number): Promise<number> {
    const max = limit ?? this.opts.hydrateLimit;
    try {
      const rows = await this.opts.db
        .select()
        .from(this.opts.memoryRecordsTable)
        .orderBy(desc(this.opts.memoryRecordsTable.lastUpdatedAt))
        .limit(max);
      let loaded = 0;
      for (const row of rows) {
        const entry = rowToEntry(row);
        if (entry) {
          this.cache.set(entry.id, entry);
          loaded++;
        }
      }
      this.opts.logger?.info?.(
        { loaded, max },
        "PostgresMemoryStore: hydrated cache from database",
      );
      return loaded;
    } catch (err) {
      this.opts.logger?.error?.(
        { err },
        "PostgresMemoryStore: failed to hydrate from database",
      );
      return 0;
    }
  }

  async flush(): Promise<{ saved: number; deleted: number }> {
    if (this.flushing) return { saved: 0, deleted: 0 };
    if (this.pendingWrites.size === 0 && this.pendingDeletes.size === 0) {
      return { saved: 0, deleted: 0 };
    }
    this.flushing = true;
    const writes = Array.from(this.pendingWrites.values());
    const deletes = Array.from(this.pendingDeletes);
    this.pendingWrites.clear();
    this.pendingDeletes.clear();

    let saved = 0;
    let deleted = 0;
    try {
      for (const entry of writes) {
        try {
          const row = buildRow(entry);
          await this.opts.db
            .insert(this.opts.memoryRecordsTable)
            .values(row)
            .onConflictDoUpdate({
              target: this.opts.memoryRecordsTable.externalId,
              set: row,
            });
          saved++;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, id: entry.id },
            "PostgresMemoryStore: upsert failed; re-queuing",
          );
          this.pendingWrites.set(entry.id, entry);
        }
      }
      if (deletes.length > 0) {
        try {
          await this.opts.db
            .delete(this.opts.memoryRecordsTable)
            .where(inArray(this.opts.memoryRecordsTable.externalId, deletes));
          deleted = deletes.length;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err },
            "PostgresMemoryStore: bulk delete failed; re-queuing",
          );
          for (const id of deletes) this.pendingDeletes.add(id);
        }
      }
      return { saved, deleted };
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Run retention/eviction across both cache and database. Removes any record
   * past `expires_at` and any record whose retention policy is `ephemeral`
   * older than `ephemeralMaxAgeMinutes` minutes.
   */
  async runRetention(
    opts: { ephemeralMaxAgeMinutes?: number } = {},
  ): Promise<{ cacheRemoved: number; dbRemoved: number }> {
    let cacheRemoved = this.evictExpired();
    const now = new Date();
    const ephemeralCutoff = new Date(
      Date.now() - (opts.ephemeralMaxAgeMinutes ?? 60) * 60 * 1000,
    );
    // Evict ephemeral-over-age entries from cache so the in-process view stays
    // consistent with the database after the retention sweep below.
    for (const [id, entry] of this.cache) {
      if (
        entry.retention.policy === "ephemeral" &&
        new Date(entry.freshness.lastUpdatedAt) < ephemeralCutoff
      ) {
        this.cache.delete(id);
        this.pendingWrites.delete(id);
        this.pendingDeletes.add(id);
        cacheRemoved++;
      }
    }
    let dbRemoved = 0;
    try {
      const result = await this.opts.db
        .delete(this.opts.memoryRecordsTable)
        .where(
          or(
            lt(this.opts.memoryRecordsTable.expiresAt, now),
            and(
              eq(this.opts.memoryRecordsTable.retentionPolicy, "ephemeral"),
              lt(this.opts.memoryRecordsTable.lastUpdatedAt, ephemeralCutoff),
            ),
          ),
        );
      dbRemoved = (result as { rowCount?: number | null }).rowCount ?? 0;
    } catch (err) {
      this.opts.logger?.warn?.({ err }, "PostgresMemoryStore: retention sweep failed");
    }
    this.opts.logger?.info?.(
      { cacheRemoved, dbRemoved },
      "PostgresMemoryStore: retention sweep complete",
    );
    return { cacheRemoved, dbRemoved };
  }

  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    await this.flush();
  }
}
