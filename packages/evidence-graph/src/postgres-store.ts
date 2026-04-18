/**
 * Postgres-backed implementations for the evidence graph stores and the
 * entity registry. These follow the same write-through cache pattern used
 * by `@workspace/trace-graph`'s `PostgresTraceStore`: synchronous in-memory
 * reads/writes serve the existing API surface while a background flush
 * persists records to PostgreSQL so they survive process restarts.
 */

import { desc, eq, inArray } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { EvidenceItem, Recommendation } from "@workspace/ontology";
// Import EntitySnapshot/EntityRegistryBackend directly to avoid the
// pre-existing name collision between the Zod-based `entity.ts` and the
// interface-based `entity-snapshot.ts` re-exports in `@workspace/ontology`.
import type { EntitySnapshot, EntityRegistryBackend } from "@workspace/ontology/entity";
import {
  InMemoryEvidenceStore,
  InMemoryRecommendationStore,
  type EvidenceStoreBackend,
  type RecommendationStoreBackend,
} from "./store.js";

export interface PostgresStoreLogger {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

// Structural shapes of the columns these stores need on each table.
export interface MeshEvidenceItemsTableLike extends PgTable {
  evidenceId: PgColumn;
  observedAt: PgColumn;
}

export interface MeshRecommendationsTableLike extends PgTable {
  recommendationId: PgColumn;
  generatedAt: PgColumn;
}

export interface MeshEntitySnapshotsTableLike extends PgTable {
  entityId: PgColumn;
  snapshotAt: PgColumn;
}

export interface MeshEvidenceEntityLinksTableLike extends PgTable {
  evidenceId: PgColumn;
  entityId: PgColumn;
}

type Db = NodePgDatabase<Record<string, unknown>>;

interface BaseOpts {
  db: Db;
  flushIntervalMs?: number;
  hydrateLimit?: number;
  logger?: PostgresStoreLogger;
}

// ─── Evidence Store ───────────────────────────────────────────────────────────

export interface PostgresEvidenceStoreOptions extends BaseOpts {
  evidenceItemsTable: MeshEvidenceItemsTableLike;
  evidenceEntityLinksTable: MeshEvidenceEntityLinksTableLike;
}

export class PostgresEvidenceStore implements EvidenceStoreBackend {
  private readonly cache = new InMemoryEvidenceStore();
  private readonly pending = new Map<string, EvidenceItem>();
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private flushing = false;
  private readonly opts: Required<Pick<BaseOpts, "flushIntervalMs" | "hydrateLimit">> &
    PostgresEvidenceStoreOptions;

  constructor(opts: PostgresEvidenceStoreOptions) {
    this.opts = { flushIntervalMs: 1000, hydrateLimit: 5000, ...opts };
    if (this.opts.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush().catch((err) =>
          this.opts.logger?.warn?.({ err }, "PostgresEvidenceStore: flush failed"),
        );
      }, this.opts.flushIntervalMs);
      this.flushTimer.unref?.();
    }
  }

  save(item: EvidenceItem): void {
    this.cache.save(item);
    this.pending.set(item.evidenceId, item);
  }

  get(evidenceId: string): EvidenceItem | undefined {
    return this.cache.get(evidenceId);
  }

  getMany(ids: string[]): EvidenceItem[] {
    return this.cache.getMany(ids);
  }

  forEntity(entityId: string): EvidenceItem[] {
    return this.cache.forEntity(entityId);
  }

  forSignal(signalId: string): EvidenceItem[] {
    return this.cache.forSignal(signalId);
  }

  list(filter?: Parameters<EvidenceStoreBackend["list"]>[0]): EvidenceItem[] {
    return this.cache.list(filter);
  }

  count(): number {
    return this.cache.count();
  }

  async hydrate(limit?: number): Promise<number> {
    const max = limit ?? this.opts.hydrateLimit;
    try {
      const rows = await this.opts.db
        .select()
        .from(this.opts.evidenceItemsTable)
        .orderBy(desc(this.opts.evidenceItemsTable.observedAt))
        .limit(max);
      let loaded = 0;
      for (const r of rows as Array<{ payload?: { evidenceItem?: EvidenceItem } | null }>) {
        const ev = r.payload?.evidenceItem;
        if (ev && typeof ev === "object" && typeof ev.evidenceId === "string") {
          this.cache.save(ev);
          loaded++;
        }
      }
      this.opts.logger?.info?.({ loaded }, "PostgresEvidenceStore: hydrated");
      return loaded;
    } catch (err) {
      this.opts.logger?.error?.({ err }, "PostgresEvidenceStore: hydrate failed");
      return 0;
    }
  }

  async flush(): Promise<{ saved: number }> {
    if (this.flushing || this.pending.size === 0) return { saved: 0 };
    this.flushing = true;
    const writes = Array.from(this.pending.values());
    this.pending.clear();
    let saved = 0;
    try {
      for (const item of writes) {
        try {
          const row = {
            evidenceId: item.evidenceId,
            type: item.type,
            domain: item.domain,
            signalId: item.signalId ?? null,
            summary: item.summary,
            confidence: item.confidence,
            freshness: item.freshness,
            weight: item.weight,
            observedAt: new Date(item.observedAt),
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
            payload: { evidenceItem: item },
          };
          await this.opts.db
            .insert(this.opts.evidenceItemsTable)
            .values(row as never)
            .onConflictDoUpdate({
              target: this.opts.evidenceItemsTable.evidenceId,
              set: row as never,
            });

          if (item.entityRefs.length > 0) {
            const links = item.entityRefs.map((ref) => ({
              evidenceId: item.evidenceId,
              entityId: ref.entityId,
              entityType: ref.entityType,
              domain: ref.domain ?? item.domain,
            }));
            await this.opts.db
              .insert(this.opts.evidenceEntityLinksTable)
              .values(links as never)
              .onConflictDoNothing();
          }
          saved++;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, evidenceId: item.evidenceId },
            "PostgresEvidenceStore: upsert failed; re-queuing",
          );
          this.pending.set(item.evidenceId, item);
        }
      }
      return { saved };
    } finally {
      this.flushing = false;
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

// ─── Recommendation Store ─────────────────────────────────────────────────────

export interface PostgresRecommendationStoreOptions extends BaseOpts {
  recommendationsTable: MeshRecommendationsTableLike;
}

export class PostgresRecommendationStore implements RecommendationStoreBackend {
  private readonly cache = new InMemoryRecommendationStore();
  private readonly pending = new Map<string, Recommendation>();
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private flushing = false;
  private readonly opts: Required<Pick<BaseOpts, "flushIntervalMs" | "hydrateLimit">> &
    PostgresRecommendationStoreOptions;

  constructor(opts: PostgresRecommendationStoreOptions) {
    this.opts = { flushIntervalMs: 1000, hydrateLimit: 2000, ...opts };
    if (this.opts.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush().catch((err) =>
          this.opts.logger?.warn?.({ err }, "PostgresRecommendationStore: flush failed"),
        );
      }, this.opts.flushIntervalMs);
      this.flushTimer.unref?.();
    }
  }

  save(rec: Recommendation): void {
    this.cache.save(rec);
    this.pending.set(rec.recommendationId, rec);
  }

  get(id: string): Recommendation | undefined {
    return this.cache.get(id);
  }

  list(filter?: Parameters<RecommendationStoreBackend["list"]>[0]): Recommendation[] {
    return this.cache.list(filter);
  }

  updateStatus(id: string, status: Recommendation["status"]): boolean {
    const ok = this.cache.updateStatus(id, status);
    const updated = this.cache.get(id);
    if (ok && updated) this.pending.set(id, updated);
    return ok;
  }

  forEntity(entityId: string): Recommendation[] {
    return this.cache.forEntity(entityId);
  }

  count(): number {
    return this.cache.count();
  }

  async hydrate(limit?: number): Promise<number> {
    const max = limit ?? this.opts.hydrateLimit;
    try {
      const rows = await this.opts.db
        .select()
        .from(this.opts.recommendationsTable)
        .orderBy(desc(this.opts.recommendationsTable.generatedAt))
        .limit(max);
      let loaded = 0;
      for (const r of rows as Array<{ payload?: { recommendation?: Recommendation } | null }>) {
        const rec = r.payload?.recommendation;
        if (rec && typeof rec === "object" && typeof rec.recommendationId === "string") {
          this.cache.save(rec);
          loaded++;
        }
      }
      this.opts.logger?.info?.({ loaded }, "PostgresRecommendationStore: hydrated");
      return loaded;
    } catch (err) {
      this.opts.logger?.error?.({ err }, "PostgresRecommendationStore: hydrate failed");
      return 0;
    }
  }

  async flush(): Promise<{ saved: number }> {
    if (this.flushing || this.pending.size === 0) return { saved: 0 };
    this.flushing = true;
    const writes = Array.from(this.pending.values());
    this.pending.clear();
    let saved = 0;
    try {
      for (const rec of writes) {
        try {
          const row = {
            recommendationId: rec.recommendationId,
            domain: rec.domain,
            title: rec.title,
            suggestedAction: rec.suggestedAction,
            status: rec.status,
            confidence: rec.confidence,
            freshness: rec.freshness,
            tenantId: rec.tenantId ?? null,
            generatedBy: rec.generatedBy ?? null,
            generatedAt: new Date(rec.generatedAt),
            expiresAt: rec.expiresAt ? new Date(rec.expiresAt) : null,
            resolvedAt: rec.resolvedAt ? new Date(rec.resolvedAt) : null,
            payload: { recommendation: rec },
          };
          await this.opts.db
            .insert(this.opts.recommendationsTable)
            .values(row as never)
            .onConflictDoUpdate({
              target: this.opts.recommendationsTable.recommendationId,
              set: row as never,
            });
          saved++;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, recommendationId: rec.recommendationId },
            "PostgresRecommendationStore: upsert failed; re-queuing",
          );
          this.pending.set(rec.recommendationId, rec);
        }
      }
      return { saved };
    } finally {
      this.flushing = false;
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

// ─── Entity Registry ──────────────────────────────────────────────────────────

export interface PostgresEntityRegistryOptions extends BaseOpts {
  entitySnapshotsTable: MeshEntitySnapshotsTableLike;
}

export class PostgresEntityRegistry implements EntityRegistryBackend {
  private readonly cache = new Map<string, EntitySnapshot>();
  private readonly pending = new Map<string, EntitySnapshot>();
  private flushTimer: ReturnType<typeof setInterval> | undefined;
  private flushing = false;
  private readonly opts: Required<Pick<BaseOpts, "flushIntervalMs" | "hydrateLimit">> &
    PostgresEntityRegistryOptions;

  constructor(opts: PostgresEntityRegistryOptions) {
    this.opts = { flushIntervalMs: 1000, hydrateLimit: 5000, ...opts };
    if (this.opts.flushIntervalMs > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush().catch((err) =>
          this.opts.logger?.warn?.({ err }, "PostgresEntityRegistry: flush failed"),
        );
      }, this.opts.flushIntervalMs);
      this.flushTimer.unref?.();
    }
  }

  upsert(snapshot: EntitySnapshot): void {
    const existing = this.cache.get(snapshot.entityId);
    if (!existing || new Date(snapshot.snapshotAt) >= new Date(existing.snapshotAt)) {
      this.cache.set(snapshot.entityId, snapshot);
    }
    this.pending.set(snapshot.entityId, this.cache.get(snapshot.entityId)!);
  }

  get(entityId: string): EntitySnapshot | undefined {
    return this.cache.get(entityId);
  }

  list(filter?: { domain?: string; entityType?: string; health?: EntitySnapshot["health"] }): EntitySnapshot[] {
    let results = Array.from(this.cache.values());
    if (filter?.domain) results = results.filter((e) => e.domain === filter.domain);
    if (filter?.entityType) results = results.filter((e) => e.entityType === filter.entityType);
    if (filter?.health) results = results.filter((e) => e.health === filter.health);
    return results;
  }

  linkSignal(entityId: string, signalId: string): void {
    const snap = this.cache.get(entityId);
    if (snap && !snap.activeSignalIds.includes(signalId)) {
      snap.activeSignalIds.push(signalId);
      this.pending.set(entityId, snap);
    }
  }

  linkRecommendation(entityId: string, recommendationId: string): void {
    const snap = this.cache.get(entityId);
    if (snap && !snap.activeRecommendationIds.includes(recommendationId)) {
      snap.activeRecommendationIds.push(recommendationId);
      this.pending.set(entityId, snap);
    }
  }

  count(): number {
    return this.cache.size;
  }

  async hydrate(limit?: number): Promise<number> {
    const max = limit ?? this.opts.hydrateLimit;
    try {
      const rows = await this.opts.db
        .select()
        .from(this.opts.entitySnapshotsTable)
        .orderBy(desc(this.opts.entitySnapshotsTable.snapshotAt))
        .limit(max);
      let loaded = 0;
      for (const r of rows as Array<{ payload?: { snapshot?: EntitySnapshot } | null }>) {
        const snap = r.payload?.snapshot;
        if (snap && typeof snap === "object" && typeof snap.entityId === "string") {
          this.cache.set(snap.entityId, snap);
          loaded++;
        }
      }
      this.opts.logger?.info?.({ loaded }, "PostgresEntityRegistry: hydrated");
      return loaded;
    } catch (err) {
      this.opts.logger?.error?.({ err }, "PostgresEntityRegistry: hydrate failed");
      return 0;
    }
  }

  async flush(): Promise<{ saved: number }> {
    if (this.flushing || this.pending.size === 0) return { saved: 0 };
    this.flushing = true;
    const writes = Array.from(this.pending.values());
    this.pending.clear();
    let saved = 0;
    try {
      for (const snap of writes) {
        try {
          const row = {
            entityId: snap.entityId,
            snapshotId: snap.snapshotId,
            entityType: snap.entityType,
            domain: snap.domain,
            displayName: snap.displayName,
            health: snap.health,
            tenantId: snap.tenantId ?? null,
            snapshotAt: new Date(snap.snapshotAt),
            validUntil: snap.validUntil ? new Date(snap.validUntil) : null,
            payload: { snapshot: snap },
            updatedAt: new Date(),
          };
          await this.opts.db
            .insert(this.opts.entitySnapshotsTable)
            .values(row as never)
            .onConflictDoUpdate({
              target: this.opts.entitySnapshotsTable.entityId,
              set: row as never,
            });
          saved++;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, entityId: snap.entityId },
            "PostgresEntityRegistry: upsert failed; re-queuing",
          );
          this.pending.set(snap.entityId, snap);
        }
      }
      return { saved };
    } finally {
      this.flushing = false;
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

// Re-export inArray/eq just so consumers don't need to depend on drizzle-orm
// directly. Not strictly required but mirrors trace-graph ergonomics.
export { inArray, eq };
