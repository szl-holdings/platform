/**
 * Postgres-backed SignalBusStore.
 *
 * Mirrors the write-through cache + flush pattern used by
 * `@workspace/trace-graph`'s PostgresTraceStore: published signals are
 * cached in-process, queued for upsert, and asynchronously flushed to
 * PostgreSQL so that the live signal mesh survives process restarts.
 *
 * Hydration (`hydrate()`) loads the most recent signals back into the
 * in-memory bus so that the snapshot API and connected dashboards continue
 * to show recent activity immediately after a boot.
 */

import { desc, lt, getTableColumns, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

const BATCH_SIZE = 500;

function buildExcludedSet(
  table: PgTable,
  sampleRow: Record<string, unknown>,
): Record<string, SQL> {
  // getTableColumns returns undefined for plain objects (e.g. in-memory test
  // stubs). Fall back to treating the table itself as a column-name map so
  // the upsert ON CONFLICT set clause can still be constructed.
  const cols = (getTableColumns(table) as Record<string, { name: string }> | undefined)
    ?? (table as unknown as Record<string, { name: string }>);
  const set: Record<string, SQL> = {};
  for (const key of Object.keys(sampleRow)) {
    const col = cols[key];
    if (col) set[key] = sql.raw(`excluded."${col.name}"`);
  }
  return set;
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length <= size) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Signal } from "@workspace/ontology/signal";
import type { SignalBusStore } from "./bus.js";

export interface PostgresSignalBusLogger {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

export interface MeshSignalsTableLike extends PgTable {
  signalId: PgColumn;
  receivedAt: PgColumn;
}

export interface PostgresSignalBusStoreOptions {
  db: NodePgDatabase<Record<string, unknown>>;
  signalsTable: MeshSignalsTableLike;
  flushIntervalMs?: number;
  hydrateLimit?: number;
  logger?: PostgresSignalBusLogger;
}

export class PostgresSignalBusStore implements SignalBusStore {
  private readonly pending = new Map<string, Signal>();
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private flushing = false;
  private readonly opts: Required<
    Pick<PostgresSignalBusStoreOptions, "flushIntervalMs" | "hydrateLimit">
  > &
    PostgresSignalBusStoreOptions;

  constructor(opts: PostgresSignalBusStoreOptions) {
    this.opts = { flushIntervalMs: 1000, hydrateLimit: 1000, ...opts };
    if (this.opts.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush().catch((err) =>
          this.opts.logger?.warn?.({ err }, "PostgresSignalBusStore: flush failed"),
        );
      }, this.opts.flushIntervalMs);
      this.flushTimer.unref?.();
    }
  }

  persist(signal: Signal): void {
    this.pending.set(signal.signalId, signal);
  }

  async hydrate(limit?: number): Promise<Signal[]> {
    const max = limit ?? this.opts.hydrateLimit;
    try {
      const rows = await this.opts.db
        .select()
        .from(this.opts.signalsTable)
        .orderBy(desc(this.opts.signalsTable.receivedAt))
        .limit(max);
      const signals: Signal[] = [];
      for (const r of rows as Array<{ payload?: { signal?: Signal } | null }>) {
        const sig = r.payload?.signal;
        if (sig && typeof sig === "object" && typeof sig.signalId === "string") {
          signals.push(sig);
        }
      }
      // Return chronological order so loadBuffer keeps newest at the tail.
      signals.reverse();
      this.opts.logger?.info?.({ loaded: signals.length }, "PostgresSignalBusStore: hydrated");
      return signals;
    } catch (err) {
      this.opts.logger?.error?.({ err }, "PostgresSignalBusStore: hydrate failed");
      return [];
    }
  }

  async flush(): Promise<{ saved: number }> {
    if (this.flushing || this.pending.size === 0) return { saved: 0 };
    this.flushing = true;
    const writes = Array.from(this.pending.values());
    this.pending.clear();
    let saved = 0;
    try {
      const rows = writes.map((signal) => ({
        signalId: signal.signalId,
        source: signal.source,
        type: signal.type,
        domain: signal.domain,
        severity: signal.severity ?? null,
        stage: signal.stage,
        tenantId: signal.tenantId ?? null,
        sessionId: signal.sessionId ?? null,
        freshness: signal.freshness,
        confidence: signal.confidence,
        occurredAt: new Date(signal.occurredAt),
        receivedAt: new Date(signal.receivedAt),
        processedAt: signal.processedAt ? new Date(signal.processedAt) : null,
        expiresAt: signal.expiresAt ? new Date(signal.expiresAt) : null,
        payload: { signal },
      }));
      const updateSet = buildExcludedSet(this.opts.signalsTable, rows[0]!);
      const batches = chunk(rows, BATCH_SIZE);
      for (let i = 0; i < batches.length; i++) {
        const batchRows = batches[i]!;
        const batchSignals = writes.slice(i * BATCH_SIZE, i * BATCH_SIZE + batchRows.length);
        try {
          await this.opts.db
            .insert(this.opts.signalsTable)
            .values(batchRows as never)
            .onConflictDoUpdate({
              target: this.opts.signalsTable.signalId,
              set: updateSet as never,
            });
          saved += batchRows.length;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, batchSize: batchRows.length },
            "PostgresSignalBusStore: batch upsert failed; re-queuing",
          );
          for (const signal of batchSignals) {
            this.pending.set(signal.signalId, signal);
          }
        }
      }
      return { saved };
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Delete signals from the database whose `receivedAt` is older than
   * `maxAgeDays`. Returns the number of rows removed. The in-memory bus
   * buffer self-caps via SignalBus.MAX_BUFFER so no cache pruning is
   * needed here.
   */
  async runRetention(maxAgeDays?: number): Promise<{ dbRemoved: number }> {
    const days = maxAgeDays ?? 0;
    if (!days || days <= 0) return { dbRemoved: 0 };
    const cutoff = new Date(Date.now() - days * 86400000);
    try {
      const result = await this.opts.db
        .delete(this.opts.signalsTable)
        .where(lt(this.opts.signalsTable.receivedAt, cutoff));
      const dbRemoved = (result as { rowCount?: number }).rowCount ?? 0;
      if (dbRemoved > 0) {
        this.opts.logger?.info?.(
          { dbRemoved, cutoff: cutoff.toISOString(), maxAgeDays: days },
          "PostgresSignalBusStore: retention pruned signals",
        );
      }
      return { dbRemoved };
    } catch (err) {
      this.opts.logger?.warn?.({ err }, "PostgresSignalBusStore: retention failed");
      return { dbRemoved: 0 };
    }
  }

  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    await this.flush();
  }
}
