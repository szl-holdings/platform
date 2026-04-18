/**
 * Evidence Graph Store — in-memory store with schema definitions for:
 *   - EvidenceItems linked to entities and signals
 *   - Recommendations with their evidence chains
 *
 * The default singletons (`defaultEvidenceStore`, `defaultRecommendationStore`)
 * are mutable wrappers that delegate to a backend. The default backend is the
 * in-memory implementation. The API server may swap in a Postgres-backed
 * backend at boot time via `defaultEvidenceStore.setBackend(pg)` so that data
 * survives process restarts.
 *
 * SQL schema for the Postgres-backed backend lives in
 * `lib/db/src/schema/signal_mesh.ts` (tables: `mesh_signals`,
 * `mesh_evidence_items`, `mesh_recommendations`, `mesh_entity_snapshots`,
 * `mesh_evidence_entity_links`).
 */

import type { EvidenceItem, Recommendation } from "@workspace/ontology";

export interface EvidenceEntityLink {
  evidenceId: string;
  entityId: string;
  entityType: string;
  domain: string;
  linkedAt: string;
}

export interface EvidenceStoreBackend {
  save(item: EvidenceItem): void;
  get(evidenceId: string): EvidenceItem | undefined;
  getMany(evidenceIds: string[]): EvidenceItem[];
  forEntity(entityId: string): EvidenceItem[];
  forSignal(signalId: string): EvidenceItem[];
  list(filter?: {
    domain?: string;
    type?: EvidenceItem["type"];
    limit?: number;
    offset?: number;
  }): EvidenceItem[];
  count(): number;
}

export interface RecommendationStoreBackend {
  save(rec: Recommendation): void;
  get(recommendationId: string): Recommendation | undefined;
  list(filter?: {
    domain?: string;
    status?: Recommendation["status"];
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Recommendation[];
  updateStatus(
    recommendationId: string,
    status: Recommendation["status"],
  ): boolean;
  forEntity(entityId: string): Recommendation[];
  count(): number;
}

export class InMemoryEvidenceStore implements EvidenceStoreBackend {
  private readonly items = new Map<string, EvidenceItem>();
  private readonly entityLinks = new Map<string, Set<string>>();

  save(item: EvidenceItem): void {
    this.items.set(item.evidenceId, item);
    for (const ref of item.entityRefs) {
      const set = this.entityLinks.get(ref.entityId) ?? new Set();
      set.add(item.evidenceId);
      this.entityLinks.set(ref.entityId, set);
    }
    if (item.signalId) {
      const set = this.entityLinks.get(`signal:${item.signalId}`) ?? new Set();
      set.add(item.evidenceId);
      this.entityLinks.set(`signal:${item.signalId}`, set);
    }
  }

  get(evidenceId: string): EvidenceItem | undefined {
    return this.items.get(evidenceId);
  }

  getMany(evidenceIds: string[]): EvidenceItem[] {
    return evidenceIds.flatMap((id) => {
      const item = this.items.get(id);
      return item ? [item] : [];
    });
  }

  forEntity(entityId: string): EvidenceItem[] {
    const ids = this.entityLinks.get(entityId) ?? new Set();
    return this.getMany(Array.from(ids));
  }

  forSignal(signalId: string): EvidenceItem[] {
    const ids = this.entityLinks.get(`signal:${signalId}`) ?? new Set();
    return this.getMany(Array.from(ids));
  }

  list(filter?: {
    domain?: string;
    type?: EvidenceItem["type"];
    limit?: number;
    offset?: number;
  }): EvidenceItem[] {
    let results = Array.from(this.items.values());
    if (filter?.domain) results = results.filter((e) => e.domain === filter.domain);
    if (filter?.type) results = results.filter((e) => e.type === filter.type);
    results.sort((a, b) => b.observedAt.localeCompare(a.observedAt));
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 100;
    return results.slice(offset, offset + limit);
  }

  count(): number {
    return this.items.size;
  }
}

export class InMemoryRecommendationStore implements RecommendationStoreBackend {
  private readonly recs = new Map<string, Recommendation>();

  save(rec: Recommendation): void {
    this.recs.set(rec.recommendationId, rec);
  }

  get(recommendationId: string): Recommendation | undefined {
    return this.recs.get(recommendationId);
  }

  list(filter?: {
    domain?: string;
    status?: Recommendation["status"];
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Recommendation[] {
    let results = Array.from(this.recs.values());
    if (filter?.domain) results = results.filter((r) => r.domain === filter.domain);
    if (filter?.status) results = results.filter((r) => r.status === filter.status);
    if (filter?.tenantId) results = results.filter((r) => r.tenantId === filter.tenantId);
    results.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  updateStatus(recommendationId: string, status: Recommendation["status"]): boolean {
    const rec = this.recs.get(recommendationId);
    if (!rec) return false;
    this.recs.set(recommendationId, {
      ...rec,
      status,
      resolvedAt: ["accepted", "rejected", "completed", "failed"].includes(status)
        ? new Date().toISOString()
        : rec.resolvedAt,
    });
    return true;
  }

  forEntity(entityId: string): Recommendation[] {
    return Array.from(this.recs.values()).filter((r) =>
      r.entityRefs.some((ref) => ref.entityId === entityId),
    );
  }

  count(): number {
    return this.recs.size;
  }
}

/**
 * Mutable EvidenceStore — wraps a swappable backend. The API server may call
 * `setBackend()` at boot to install a Postgres-backed implementation while
 * existing imports of `defaultEvidenceStore` continue to work.
 */
export class EvidenceStore implements EvidenceStoreBackend {
  private backend: EvidenceStoreBackend;

  constructor(initial: EvidenceStoreBackend = new InMemoryEvidenceStore()) {
    this.backend = initial;
  }

  setBackend(store: EvidenceStoreBackend): void {
    this.backend = store;
  }

  getBackend(): EvidenceStoreBackend {
    return this.backend;
  }

  save(item: EvidenceItem): void {
    this.backend.save(item);
  }

  get(evidenceId: string): EvidenceItem | undefined {
    return this.backend.get(evidenceId);
  }

  getMany(evidenceIds: string[]): EvidenceItem[] {
    return this.backend.getMany(evidenceIds);
  }

  forEntity(entityId: string): EvidenceItem[] {
    return this.backend.forEntity(entityId);
  }

  forSignal(signalId: string): EvidenceItem[] {
    return this.backend.forSignal(signalId);
  }

  list(filter?: {
    domain?: string;
    type?: EvidenceItem["type"];
    limit?: number;
    offset?: number;
  }): EvidenceItem[] {
    return this.backend.list(filter);
  }

  count(): number {
    return this.backend.count();
  }
}

export class RecommendationStore implements RecommendationStoreBackend {
  private backend: RecommendationStoreBackend;

  constructor(initial: RecommendationStoreBackend = new InMemoryRecommendationStore()) {
    this.backend = initial;
  }

  setBackend(store: RecommendationStoreBackend): void {
    this.backend = store;
  }

  getBackend(): RecommendationStoreBackend {
    return this.backend;
  }

  save(rec: Recommendation): void {
    this.backend.save(rec);
  }

  get(recommendationId: string): Recommendation | undefined {
    return this.backend.get(recommendationId);
  }

  list(filter?: {
    domain?: string;
    status?: Recommendation["status"];
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Recommendation[] {
    return this.backend.list(filter);
  }

  updateStatus(
    recommendationId: string,
    status: Recommendation["status"],
  ): boolean {
    return this.backend.updateStatus(recommendationId, status);
  }

  forEntity(entityId: string): Recommendation[] {
    return this.backend.forEntity(entityId);
  }

  count(): number {
    return this.backend.count();
  }
}

export const defaultEvidenceStore = new EvidenceStore();
export const defaultRecommendationStore = new RecommendationStore();
