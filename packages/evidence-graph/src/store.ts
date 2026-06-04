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

import type { EvidenceItem, Recommendation } from '@workspace/ontology';

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
    type?: EvidenceItem['type'];
    limit?: number;
    offset?: number;
  }): EvidenceItem[];
  count(): number;
}

export type RecommendationDecisionType = 'approve' | 'reject' | 'escalate' | 'defer';

export interface RecommendationDecision {
  decisionId: string;
  recommendationId: string;
  decision: RecommendationDecisionType;
  actorId: string;
  actorRole?: string;
  /** Tenant / org the actor decided on behalf of (when known). */
  orgId?: string;
  justification?: string;
  policyOutcome: 'allow' | 'require-approval' | 'block' | 'pending';
  previousStatus: Recommendation['status'];
  newStatus: Recommendation['status'];
  decidedAt: string;
  /**
   * Product surface that submitted the decision (e.g. `evidence-explorer`,
   * `unified-command`). Useful for downstream audit + analytics.
   */
  sourceSurface?: string;
}

export interface RecommendationStoreBackend {
  save(rec: Recommendation): void;
  get(recommendationId: string): Recommendation | undefined;
  list(filter?: {
    domain?: string;
    status?: Recommendation['status'];
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Recommendation[];
  updateStatus(recommendationId: string, status: Recommendation['status']): boolean;
  forEntity(entityId: string): Recommendation[];
  count(): number;
  recordDecision(decision: RecommendationDecision): void;
  listDecisions(recommendationId: string): RecommendationDecision[];
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
    type?: EvidenceItem['type'];
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

  delete(evidenceId: string): boolean {
    const item = this.items.get(evidenceId);
    if (!item) return false;
    this.items.delete(evidenceId);
    for (const ref of item.entityRefs) {
      const set = this.entityLinks.get(ref.entityId);
      if (set) {
        set.delete(evidenceId);
        if (set.size === 0) this.entityLinks.delete(ref.entityId);
      }
    }
    if (item.signalId) {
      const set = this.entityLinks.get(`signal:${item.signalId}`);
      if (set) {
        set.delete(evidenceId);
        if (set.size === 0) this.entityLinks.delete(`signal:${item.signalId}`);
      }
    }
    return true;
  }
}

export class InMemoryRecommendationStore implements RecommendationStoreBackend {
  private readonly recs = new Map<string, Recommendation>();
  private readonly decisions = new Map<string, RecommendationDecision[]>();

  save(rec: Recommendation): void {
    this.recs.set(rec.recommendationId, rec);
  }

  get(recommendationId: string): Recommendation | undefined {
    return this.recs.get(recommendationId);
  }

  list(filter?: {
    domain?: string;
    status?: Recommendation['status'];
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

  updateStatus(recommendationId: string, status: Recommendation['status']): boolean {
    const rec = this.recs.get(recommendationId);
    if (!rec) return false;
    this.recs.set(recommendationId, {
      ...rec,
      status,
      resolvedAt: ['accepted', 'rejected', 'completed', 'failed'].includes(status)
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

  delete(recommendationId: string): boolean {
    this.decisions.delete(recommendationId);
    return this.recs.delete(recommendationId);
  }

  recordDecision(decision: RecommendationDecision): void {
    const list = this.decisions.get(decision.recommendationId) ?? [];
    list.push(decision);
    this.decisions.set(decision.recommendationId, list);
  }

  listDecisions(recommendationId: string): RecommendationDecision[] {
    return [...(this.decisions.get(recommendationId) ?? [])];
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
    type?: EvidenceItem['type'];
    limit?: number;
    offset?: number;
  }): EvidenceItem[] {
    return this.backend.list(filter);
  }

  count(): number {
    return this.backend.count();
  }
}

export type RecommendationEventKind = 'saved' | 'status-changed';

export interface RecommendationEvent {
  kind: RecommendationEventKind;
  recommendation: Recommendation;
}

export type RecommendationEventHandler = (event: RecommendationEvent) => void;

export interface RecommendationEventSubscription {
  unsubscribe(): void;
}

export class RecommendationStore implements RecommendationStoreBackend {
  private backend: RecommendationStoreBackend;
  private readonly listeners = new Set<RecommendationEventHandler>();

  constructor(initial: RecommendationStoreBackend = new InMemoryRecommendationStore()) {
    this.backend = initial;
  }

  setBackend(store: RecommendationStoreBackend): void {
    this.backend = store;
  }

  getBackend(): RecommendationStoreBackend {
    return this.backend;
  }

  on(handler: RecommendationEventHandler): RecommendationEventSubscription {
    this.listeners.add(handler);
    return { unsubscribe: () => this.listeners.delete(handler) };
  }

  private emit(event: RecommendationEvent): void {
    for (const h of this.listeners) {
      try {
        h(event);
      } catch (_err) {
      }
    }
  }

  save(rec: Recommendation): void {
    this.backend.save(rec);
    this.emit({ kind: 'saved', recommendation: rec });
  }

  get(recommendationId: string): Recommendation | undefined {
    return this.backend.get(recommendationId);
  }

  list(filter?: {
    domain?: string;
    status?: Recommendation['status'];
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Recommendation[] {
    return this.backend.list(filter);
  }

  updateStatus(recommendationId: string, status: Recommendation['status']): boolean {
    const ok = this.backend.updateStatus(recommendationId, status);
    if (ok) {
      const updated = this.backend.get(recommendationId);
      if (updated) this.emit({ kind: 'status-changed', recommendation: updated });
    }
    return ok;
  }

  forEntity(entityId: string): Recommendation[] {
    return this.backend.forEntity(entityId);
  }

  count(): number {
    return this.backend.count();
  }

  recordDecision(decision: RecommendationDecision): void {
    this.backend.recordDecision(decision);
  }

  listDecisions(recommendationId: string): RecommendationDecision[] {
    return this.backend.listDecisions(recommendationId);
  }
}

export const defaultEvidenceStore = new EvidenceStore();
export const defaultRecommendationStore = new RecommendationStore();
