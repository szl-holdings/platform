import { desc, eq, lt, or, type InferInsertModel } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { CheckpointEntry, CheckpointStore } from "./checkpoint.js";
import type { CognitiveLoopRun } from "./types.js";

/**
 * Minimal write-target abstraction the store actually uses on the table. We
 * accept any database-like object that exposes an `insert` and `delete`
 * builder; this lets tests inject a fake without coupling to a live pool.
 */
export interface CheckpointDb {
  select: NodePgDatabase<Record<string, unknown>>["select"];
  insert: NodePgDatabase<Record<string, unknown>>["insert"];
  delete: NodePgDatabase<Record<string, unknown>>["delete"];
}

export interface PostgresCheckpointStoreLogger {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

/**
 * Structural shape of the columns required on the orchestration_checkpoints
 * table. Callers pass the actual Drizzle table without forcing this package
 * to depend on the schema package.
 */
export interface OrchestrationCheckpointsTableLike extends PgTable {
  ref: PgColumn;
  runId: PgColumn;
  agentId: PgColumn;
  createdAt: PgColumn;
  expiresAt: PgColumn;
}

export interface PostgresCheckpointStoreOptions {
  db: CheckpointDb;
  table: OrchestrationCheckpointsTableLike;
  flushIntervalMs?: number;
  hydrateLimit?: number;
  logger?: PostgresCheckpointStoreLogger;
}

interface SnapshotEnvelope {
  entry: CheckpointEntry;
}

function buildRow(entry: CheckpointEntry): InferInsertModel<OrchestrationCheckpointsTableLike> {
  return {
    ref: entry.ref,
    runId: entry.runId,
    agentId: entry.agentId,
    objective: entry.objective,
    phase: entry.phase,
    stepIndex: entry.stepIndex,
    snapshot: { entry } satisfies SnapshotEnvelope,
    createdAt: new Date(entry.createdAt),
    expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : null,
  } as InferInsertModel<OrchestrationCheckpointsTableLike>;
}

function fromRow(row: unknown): CheckpointEntry | undefined {
  if (!row || typeof row !== "object") return undefined;
  const r = row as { snapshot?: SnapshotEnvelope; ref?: string };
  const entry = r.snapshot?.entry;
  if (entry && typeof entry === "object" && typeof entry.ref === "string") {
    return entry;
  }
  return undefined;
}

/**
 * Postgres-backed CheckpointStore with a write-behind cache. Uses the same
 * pattern as PostgresTraceStore: synchronous in-memory mirror is updated
 * immediately so callers see fresh data, while a flush timer persists dirty
 * refs to the database every `flushIntervalMs` (default 1000ms — matching
 * the ≤1s data-loss budget required by the runtime persistence spec).
 */
export class PostgresCheckpointStore implements CheckpointStore {
  private readonly cache = new Map<string, CheckpointEntry>();
  private readonly dirty = new Set<string>();
  private readonly deleted = new Set<string>();
  private readonly db: CheckpointDb;
  private readonly table: OrchestrationCheckpointsTableLike;
  private readonly flushIntervalMs: number;
  private readonly hydrateLimit: number;
  private readonly logger?: PostgresCheckpointStoreLogger;
  private flushTimer?: ReturnType<typeof setInterval>;
  private flushing = false;

  constructor(opts: PostgresCheckpointStoreOptions) {
    this.db = opts.db;
    this.table = opts.table;
    this.flushIntervalMs = opts.flushIntervalMs ?? 1000;
    this.hydrateLimit = opts.hydrateLimit ?? 1000;
    this.logger = opts.logger;
    if (this.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush().catch((err) =>
          this.logger?.warn?.({ err }, "[checkpoint-store] flush failed"),
        );
      }, this.flushIntervalMs);
      this.flushTimer.unref?.();
    }
  }

  save(entry: CheckpointEntry): void {
    this.cache.set(entry.ref, entry);
    this.dirty.add(entry.ref);
    this.deleted.delete(entry.ref);
  }

  load(ref: string): CheckpointEntry | undefined {
    return this.cache.get(ref);
  }

  list(runId?: string): CheckpointEntry[] {
    const all = Array.from(this.cache.values());
    if (runId) return all.filter((e) => e.runId === runId);
    return all;
  }

  listByAgent(agentId: string, runId?: string): CheckpointEntry[] {
    const all = Array.from(this.cache.values()).filter((e) => e.agentId === agentId);
    if (runId) return all.filter((e) => e.runId === runId);
    return all;
  }

  delete(ref: string): boolean {
    const had = this.cache.delete(ref);
    this.dirty.delete(ref);
    if (had) this.deleted.add(ref);
    return had;
  }

  prune(maxAgeMs = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;
    for (const [ref, entry] of this.cache) {
      if (entry.createdAt < cutoff || (entry.expiresAt && entry.expiresAt < Date.now())) {
        this.cache.delete(ref);
        this.deleted.add(ref);
        this.dirty.delete(ref);
        removed++;
      }
    }
    return removed;
  }

  /** Re-read all non-expired checkpoints from the database into the cache. */
  async hydrate(limit: number = this.hydrateLimit): Promise<number> {
    try {
      const rows = await this.db
        .select()
        .from(this.table)
        .orderBy(desc(this.table.createdAt))
        .limit(limit);
      let count = 0;
      const now = Date.now();
      for (const row of rows) {
        const entry = fromRow(row);
        if (!entry) continue;
        if (entry.expiresAt && entry.expiresAt < now) continue;
        this.cache.set(entry.ref, entry);
        count++;
      }
      return count;
    } catch (err) {
      this.logger?.warn?.({ err }, "[checkpoint-store] hydrate failed");
      return 0;
    }
  }

  /** Force a flush of pending writes/deletes to Postgres. */
  async flush(): Promise<void> {
    if (this.flushing) return;
    if (this.dirty.size === 0 && this.deleted.size === 0) return;
    this.flushing = true;
    const dirtyRefs = Array.from(this.dirty);
    const deletedRefs = Array.from(this.deleted);
    this.dirty.clear();
    this.deleted.clear();
    try {
      for (const ref of dirtyRefs) {
        const entry = this.cache.get(ref);
        if (!entry) continue;
        const row = buildRow(entry);
        try {
          await this.db
            .insert(this.table)
            .values(row)
            .onConflictDoUpdate({ target: this.table.ref, set: row });
        } catch (err) {
          this.logger?.warn?.({ err, ref }, "[checkpoint-store] upsert failed");
          this.dirty.add(ref);
        }
      }
      for (const ref of deletedRefs) {
        try {
          await this.db
            .delete(this.table)
            .where(eq(this.table.ref, ref));
        } catch (err) {
          this.logger?.warn?.({ err, ref }, "[checkpoint-store] delete failed");
          this.deleted.add(ref);
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  /** Run retention: removes expired rows from cache + DB. */
  async runRetention(maxAgeMs = 24 * 60 * 60 * 1000): Promise<{ cacheRemoved: number; dbRemoved: number }> {
    const cacheRemoved = this.prune(maxAgeMs);
    let dbRemoved = 0;
    try {
      const cutoff = new Date(Date.now() - maxAgeMs);
      const now = new Date();
      const result = await this.db
        .delete(this.table)
        .where(
          or(
            lt(this.table.createdAt, cutoff),
            lt(this.table.expiresAt, now),
          ),
        );
      dbRemoved = (result as { rowCount?: number }).rowCount ?? 0;
    } catch (err) {
      this.logger?.warn?.({ err }, "[checkpoint-store] retention sweep failed");
    }
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

/** Loosely-typed CognitiveLoopRun re-export for consumers building entries. */
export type { CognitiveLoopRun };
