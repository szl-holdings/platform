/**
 * Postgres-backed implementations for the evidence graph stores and the
 * entity registry. These follow the same write-through cache pattern used
 * by `@workspace/trace-graph`'s `PostgresTraceStore`: synchronous in-memory
 * reads/writes serve the existing API surface while a background flush
 * persists records to PostgreSQL so they survive process restarts.
 */

import { desc, eq, inArray, lt, getTableColumns, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

const BATCH_SIZE = 500;

function buildExcludedSet(
  table: PgTable,
  sampleRow: Record<string, unknown>,
): Record<string, SQL> {
  const cols = getTableColumns(table) as Record<string, { name: string }>;
  const set: Record<string, SQL> = {};
  for (const key of Object.keys(sampleRow)) {
    const col = cols[key];
    if (col) set[key] = sql.raw(`excluded."${col.name}"`);
  }
  return set;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (arr.length <= size) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
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
  type RecommendationDecision,
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
    try {
      const rows = writes.map((item) => ({
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
      }));
      const updateSet = buildExcludedSet(this.opts.evidenceItemsTable, rows[0]!);

      // Track which evidence rows were successfully upserted in this flush so
      // that links are only attempted for those (preserving the prior
      // per-item atomic relationship between evidence row + its links).
      // `requeued` tracks evidence ids that failed (either at the row upsert
      // or at the link insert step) so that `saved` only counts items whose
      // evidence row + links both persisted, matching the prior per-item
      // accounting.
      const itemsByEvidenceId = new Map<string, EvidenceItem>();
      for (const item of writes) itemsByEvidenceId.set(item.evidenceId, item);
      const succeededItems: EvidenceItem[] = [];
      const requeued = new Set<string>();

      const rowBatches = chunkArray(rows, BATCH_SIZE);
      for (let i = 0; i < rowBatches.length; i++) {
        const batchRows = rowBatches[i]!;
        const batchItems = writes.slice(i * BATCH_SIZE, i * BATCH_SIZE + batchRows.length);
        try {
          await this.opts.db
            .insert(this.opts.evidenceItemsTable)
            .values(batchRows as never)
            .onConflictDoUpdate({
              target: this.opts.evidenceItemsTable.evidenceId,
              set: updateSet as never,
            });
          for (const item of batchItems) succeededItems.push(item);
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, batchSize: batchRows.length },
            "PostgresEvidenceStore: batch upsert failed; re-queuing",
          );
          for (const item of batchItems) {
            this.pending.set(item.evidenceId, item);
            requeued.add(item.evidenceId);
          }
        }
      }

      // Build links only for evidence items that were successfully persisted
      // in this flush. On link batch failure, re-queue the affected evidence
      // items so the link work is retried alongside the evidence row on the
      // next flush — matching the prior per-item failure semantics.
      const linkRows: Array<{
        evidenceId: string;
        entityId: string;
        entityType: string;
        domain: string;
      }> = [];
      for (const item of succeededItems) {
        for (const ref of item.entityRefs) {
          linkRows.push({
            evidenceId: item.evidenceId,
            entityId: ref.entityId,
            entityType: ref.entityType,
            domain: ref.domain ?? item.domain,
          });
        }
      }

      if (linkRows.length > 0) {
        for (const linkBatch of chunkArray(linkRows, BATCH_SIZE)) {
          try {
            await this.opts.db
              .insert(this.opts.evidenceEntityLinksTable)
              .values(linkBatch as never)
              .onConflictDoNothing();
          } catch (err) {
            const affected = new Set(linkBatch.map((l) => l.evidenceId));
            this.opts.logger?.warn?.(
              { err, batchSize: linkBatch.length, affected: affected.size },
              "PostgresEvidenceStore: entity link batch insert failed; re-queuing affected evidence",
            );
            for (const evidenceId of affected) {
              const item = itemsByEvidenceId.get(evidenceId);
              if (item) {
                this.pending.set(evidenceId, item);
                requeued.add(evidenceId);
              }
            }
          }
        }
      }
      return { saved: writes.length - requeued.size };
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Delete evidence items (and their entity links) older than `maxAgeDays`
   * based on `observedAt`. Also drops matching items from the in-memory
   * cache so list/get queries no longer return them.
   */
  async runRetention(maxAgeDays?: number): Promise<{ cacheRemoved: number; dbRemoved: number }> {
    const days = maxAgeDays ?? 0;
    if (!days || days <= 0) return { cacheRemoved: 0, dbRemoved: 0 };
    const cutoff = new Date(Date.now() - days * 86400000);

    let cacheRemoved = 0;
    // Walk the entire cache (list() applies a default page limit), so iterate
    // over all items via a sufficiently large list cap.
    const all = this.cache.list({ limit: Number.MAX_SAFE_INTEGER });
    for (const item of all) {
      if (new Date(item.observedAt) < cutoff) {
        if (this.cache.delete(item.evidenceId)) cacheRemoved++;
      }
    }

    let dbRemoved = 0;
    try {
      const expired = (await this.opts.db
        .select({ id: this.opts.evidenceItemsTable.evidenceId })
        .from(this.opts.evidenceItemsTable)
        .where(lt(this.opts.evidenceItemsTable.observedAt, cutoff))) as Array<{ id: string }>;
      const ids = expired.map((r) => r.id);
      if (ids.length > 0) {
        await this.opts.db
          .delete(this.opts.evidenceEntityLinksTable)
          .where(inArray(this.opts.evidenceEntityLinksTable.evidenceId, ids));
        const result = await this.opts.db
          .delete(this.opts.evidenceItemsTable)
          .where(inArray(this.opts.evidenceItemsTable.evidenceId, ids));
        dbRemoved = (result as { rowCount?: number }).rowCount ?? ids.length;
      }
      if (dbRemoved > 0 || cacheRemoved > 0) {
        this.opts.logger?.info?.(
          { dbRemoved, cacheRemoved, cutoff: cutoff.toISOString(), maxAgeDays: days },
          "PostgresEvidenceStore: retention pruned evidence",
        );
      }
    } catch (err) {
      this.opts.logger?.warn?.({ err }, "PostgresEvidenceStore: retention failed");
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

  recordDecision(decision: RecommendationDecision): void {
    // Decisions are tracked in the in-memory cache; durable persistence is
    // tracked separately via the outcome signal emitted on the bus.
    this.cache.recordDecision(decision);
  }

  listDecisions(recommendationId: string): RecommendationDecision[] {
    return this.cache.listDecisions(recommendationId);
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
      const rows = writes.map((rec) => ({
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
      }));
      const updateSet = buildExcludedSet(this.opts.recommendationsTable, rows[0]!);
      const batches = chunkArray(rows, BATCH_SIZE);
      for (let i = 0; i < batches.length; i++) {
        const batchRows = batches[i]!;
        const batchRecs = writes.slice(i * BATCH_SIZE, i * BATCH_SIZE + batchRows.length);
        try {
          await this.opts.db
            .insert(this.opts.recommendationsTable)
            .values(batchRows as never)
            .onConflictDoUpdate({
              target: this.opts.recommendationsTable.recommendationId,
              set: updateSet as never,
            });
          saved += batchRows.length;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, batchSize: batchRows.length },
            "PostgresRecommendationStore: batch upsert failed; re-queuing",
          );
          for (const rec of batchRecs) {
            this.pending.set(rec.recommendationId, rec);
          }
        }
      }
      return { saved };
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Delete recommendations older than `maxAgeDays` based on `generatedAt`.
   * Also drops matching items from the in-memory cache.
   */
  async runRetention(maxAgeDays?: number): Promise<{ cacheRemoved: number; dbRemoved: number }> {
    const days = maxAgeDays ?? 0;
    if (!days || days <= 0) return { cacheRemoved: 0, dbRemoved: 0 };
    const cutoff = new Date(Date.now() - days * 86400000);

    let cacheRemoved = 0;
    const all = this.cache.list({ limit: Number.MAX_SAFE_INTEGER });
    for (const rec of all) {
      if (new Date(rec.generatedAt) < cutoff) {
        if (this.cache.delete(rec.recommendationId)) cacheRemoved++;
      }
    }

    let dbRemoved = 0;
    try {
      const result = await this.opts.db
        .delete(this.opts.recommendationsTable)
        .where(lt(this.opts.recommendationsTable.generatedAt, cutoff));
      dbRemoved = (result as { rowCount?: number }).rowCount ?? 0;
      if (dbRemoved > 0 || cacheRemoved > 0) {
        this.opts.logger?.info?.(
          { dbRemoved, cacheRemoved, cutoff: cutoff.toISOString(), maxAgeDays: days },
          "PostgresRecommendationStore: retention pruned recommendations",
        );
      }
    } catch (err) {
      this.opts.logger?.warn?.({ err }, "PostgresRecommendationStore: retention failed");
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
      const now = new Date();
      const rows = writes.map((snap) => ({
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
        updatedAt: now,
      }));
      const updateSet = buildExcludedSet(this.opts.entitySnapshotsTable, rows[0]!);
      const batches = chunkArray(rows, BATCH_SIZE);
      for (let i = 0; i < batches.length; i++) {
        const batchRows = batches[i]!;
        const batchSnaps = writes.slice(i * BATCH_SIZE, i * BATCH_SIZE + batchRows.length);
        try {
          await this.opts.db
            .insert(this.opts.entitySnapshotsTable)
            .values(batchRows as never)
            .onConflictDoUpdate({
              target: this.opts.entitySnapshotsTable.entityId,
              set: updateSet as never,
            });
          saved += batchRows.length;
        } catch (err) {
          this.opts.logger?.warn?.(
            { err, batchSize: batchRows.length },
            "PostgresEntityRegistry: batch upsert failed; re-queuing",
          );
          for (const snap of batchSnaps) {
            this.pending.set(snap.entityId, snap);
          }
        }
      }
      return { saved };
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Delete entity snapshots whose `snapshotAt` is older than `maxAgeDays`
   * (i.e. entities that haven't been refreshed in a long time). Also drops
   * matching entries from the in-memory cache. Use a generous default
   * since snapshots represent current entity state, not time-series.
   */
  async runRetention(maxAgeDays?: number): Promise<{ cacheRemoved: number; dbRemoved: number }> {
    const days = maxAgeDays ?? 0;
    if (!days || days <= 0) return { cacheRemoved: 0, dbRemoved: 0 };
    const cutoff = new Date(Date.now() - days * 86400000);

    let cacheRemoved = 0;
    for (const [entityId, snap] of this.cache) {
      if (new Date(snap.snapshotAt) < cutoff) {
        this.cache.delete(entityId);
        cacheRemoved++;
      }
    }

    let dbRemoved = 0;
    try {
      const result = await this.opts.db
        .delete(this.opts.entitySnapshotsTable)
        .where(lt(this.opts.entitySnapshotsTable.snapshotAt, cutoff));
      dbRemoved = (result as { rowCount?: number }).rowCount ?? 0;
      if (dbRemoved > 0 || cacheRemoved > 0) {
        this.opts.logger?.info?.(
          { dbRemoved, cacheRemoved, cutoff: cutoff.toISOString(), maxAgeDays: days },
          "PostgresEntityRegistry: retention pruned entity snapshots",
        );
      }
    } catch (err) {
      this.opts.logger?.warn?.({ err }, "PostgresEntityRegistry: retention failed");
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

// Re-export inArray/eq just so consumers don't need to depend on drizzle-orm
// directly. Not strictly required but mirrors trace-graph ergonomics.
export { inArray, eq };
