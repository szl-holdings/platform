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

import { desc, lt } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
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
      for (const signal of writes) {
        try {
          const row = {
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
          };
          await this.opts.db
            .insert(this.opts.signalsTable)
            .values(row as never)
            .onConflictDoUpdate({
              target: this.opts.signalsTable.signalId,
              set: row as never,
            });
          saved++;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, signalId: signal.signalId },
            "PostgresSignalBusStore: upsert failed; re-queuing",
          );
          this.pending.set(signal.signalId, signal);
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
