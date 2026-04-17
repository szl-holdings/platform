import { desc, type InferInsertModel, inArray, lt } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { TraceRecord } from "./schema.js";
import type { TraceStore } from "./store.js";

export interface PostgresTraceStoreLogger {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

/**
 * Structural shape of the columns this store needs to read or write on the
 * traces table. Implementations supply the actual Drizzle table; callers do
 * not need to import schema types from this package.
 */
export interface TracesTableLike extends PgTable {
  traceId: PgColumn;
  startedAt: PgColumn;
}

export interface PostgresTraceStoreOptions {
  db: NodePgDatabase<Record<string, unknown>>;
  tracesTable: TracesTableLike;
  flushIntervalMs?: number;
  hydrateLimit?: number;
  retentionDays?: number;
  logger?: PostgresTraceStoreLogger;
}

interface TraceRowOutputs {
  record: TraceRecord;
}

interface TraceRowShape {
  traceId: string;
  outputs: TraceRowOutputs | null;
}

function buildRow(trace: TraceRecord): InferInsertModel<TracesTableLike> {
  const md = trace.metadata ?? {};
  const domain = typeof md["domain"] === "string" ? (md["domain"] as string) : null;
  const row = {
    traceId: trace.traceId,
    requestId: trace.requestId ?? null,
    sessionId: trace.sessionId ?? null,
    workflowId: trace.workflowId ?? null,
    agentId: trace.agentId ?? null,
    model: trace.model ?? null,
    promptVersion: trace.promptVersion ?? null,
    status: trace.status,
    latencyMs: trace.latencyMs ?? null,
    totalTokens: trace.totalTokens ?? null,
    promptTokens: trace.promptTokens ?? null,
    completionTokens: trace.completionTokens ?? null,
    costUsd: trace.costUsd ?? null,
    retries: trace.retries ?? 0,
    rollbackId: trace.rollbackId ?? null,
    businessImpact: trace.businessImpact ?? null,
    outputs: { record: trace } satisfies TraceRowOutputs,
    metadata: md,
    domain,
    startedAt: new Date(trace.startedAt),
    completedAt: trace.completedAt ? new Date(trace.completedAt) : null,
  };
  return row as InferInsertModel<TracesTableLike>;
}

function fromRow(row: unknown): TraceRecord | undefined {
  if (!row || typeof row !== "object") return undefined;
  const r = row as Partial<TraceRowShape>;
  const rec = r.outputs?.record;
  if (rec && typeof rec === "object" && typeof (rec as TraceRecord).traceId === "string") {
    return rec as TraceRecord;
  }
  return undefined;
}

export class PostgresTraceStore implements TraceStore {
  private readonly cache = new Map<string, TraceRecord>();
  private readonly pendingWrites = new Map<string, TraceRecord>();
  private readonly pendingDeletes = new Set<string>();
  private flushing = false;
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private readonly opts: Required<
    Pick<PostgresTraceStoreOptions, "flushIntervalMs" | "hydrateLimit" | "retentionDays">
  > &
    PostgresTraceStoreOptions;

  constructor(opts: PostgresTraceStoreOptions) {
    this.opts = {
      flushIntervalMs: 1000,
      hydrateLimit: 1000,
      retentionDays: 30,
      ...opts,
    };
    if (this.opts.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush().catch((err) =>
          this.opts.logger?.warn?.({ err }, "PostgresTraceStore: scheduled flush failed"),
        );
      }, this.opts.flushIntervalMs);
      this.flushTimer.unref?.();
    }
  }

  save(trace: TraceRecord): void {
    const copy: TraceRecord = JSON.parse(JSON.stringify(trace));
    this.cache.set(trace.traceId, copy);
    this.pendingWrites.set(trace.traceId, copy);
    this.pendingDeletes.delete(trace.traceId);
  }

  get(traceId: string): TraceRecord | undefined {
    return this.cache.get(traceId);
  }

  list(filter?: {
    sessionId?: string;
    workflowId?: string;
    agentId?: string;
    status?: TraceRecord["status"];
  }): TraceRecord[] {
    let results = Array.from(this.cache.values());
    if (filter?.sessionId) results = results.filter((t) => t.sessionId === filter.sessionId);
    if (filter?.workflowId) results = results.filter((t) => t.workflowId === filter.workflowId);
    if (filter?.agentId) results = results.filter((t) => t.agentId === filter.agentId);
    if (filter?.status) results = results.filter((t) => t.status === filter.status);
    return results;
  }

  delete(traceId: string): boolean {
    const had = this.cache.delete(traceId);
    if (had) {
      this.pendingWrites.delete(traceId);
      this.pendingDeletes.add(traceId);
    }
    return had;
  }

  count(): number {
    return this.cache.size;
  }

  async hydrate(limit?: number): Promise<number> {
    const max = limit ?? this.opts.hydrateLimit;
    try {
      const rows = await this.opts.db
        .select()
        .from(this.opts.tracesTable)
        .orderBy(desc(this.opts.tracesTable.startedAt))
        .limit(max);
      let loaded = 0;
      for (const row of rows) {
        const rec = fromRow(row);
        if (rec) {
          this.cache.set(rec.traceId, rec);
          loaded++;
        }
      }
      this.opts.logger?.info?.(
        { loaded, max },
        "PostgresTraceStore: hydrated cache from database",
      );
      return loaded;
    } catch (err) {
      this.opts.logger?.error?.(
        { err },
        "PostgresTraceStore: failed to hydrate from database",
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
      for (const trace of writes) {
        try {
          const row = buildRow(trace);
          await this.opts.db
            .insert(this.opts.tracesTable)
            .values(row)
            .onConflictDoUpdate({
              target: this.opts.tracesTable.traceId,
              set: row,
            });
          saved++;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, traceId: trace.traceId },
            "PostgresTraceStore: upsert failed; re-queuing",
          );
          this.pendingWrites.set(trace.traceId, trace);
        }
      }
      if (deletes.length > 0) {
        try {
          await this.opts.db
            .delete(this.opts.tracesTable)
            .where(inArray(this.opts.tracesTable.traceId, deletes));
          deleted = deletes.length;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err },
            "PostgresTraceStore: bulk delete failed; re-queuing",
          );
          for (const id of deletes) this.pendingDeletes.add(id);
        }
      }
      return { saved, deleted };
    } finally {
      this.flushing = false;
    }
  }

  async runRetention(maxAgeDays?: number): Promise<{ cacheRemoved: number; dbRemoved: number }> {
    const days = maxAgeDays ?? this.opts.retentionDays;
    if (!days || days <= 0) return { cacheRemoved: 0, dbRemoved: 0 };
    const cutoff = new Date(Date.now() - days * 86400000);
    let cacheRemoved = 0;
    for (const [id, trace] of this.cache) {
      if (new Date(trace.startedAt) < cutoff) {
        this.cache.delete(id);
        this.pendingDeletes.add(id);
        cacheRemoved++;
      }
    }
    let dbRemoved = 0;
    try {
      const result = await this.opts.db
        .delete(this.opts.tracesTable)
        .where(lt(this.opts.tracesTable.startedAt, cutoff));
      dbRemoved = (result as { rowCount?: number | null }).rowCount ?? 0;
    } catch (err) {
      this.opts.logger?.warn?.({ err }, "PostgresTraceStore: retention sweep failed");
    }
    this.opts.logger?.info?.(
      { cacheRemoved, dbRemoved, cutoff: cutoff.toISOString() },
      "PostgresTraceStore: retention sweep complete",
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
