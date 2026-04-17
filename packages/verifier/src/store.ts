import type { VerifierDecision } from "./types.js";

export interface VerifierStoreQuery {
  targetType?: VerifierDecision["target"]["targetType"];
  targetId?: string;
  traceId?: string;
  planId?: string;
  outcome?: VerifierDecision["outcome"];
  limit?: number;
  offset?: number;
}

export interface VerifierStore {
  save(decision: VerifierDecision): Promise<VerifierDecision>;
  get(id: string): Promise<VerifierDecision | undefined>;
  latestForTarget(
    targetType: VerifierDecision["target"]["targetType"],
    targetId: string,
  ): Promise<VerifierDecision | undefined>;
  list(query?: VerifierStoreQuery): Promise<{ items: VerifierDecision[]; total: number }>;
  delete(id: string): Promise<void>;
}

export class InMemoryVerifierStore implements VerifierStore {
  private records = new Map<string, VerifierDecision>();

  async save(decision: VerifierDecision): Promise<VerifierDecision> {
    this.records.set(decision.verifierId, decision);
    return decision;
  }

  async get(id: string): Promise<VerifierDecision | undefined> {
    return this.records.get(id);
  }

  async latestForTarget(
    targetType: VerifierDecision["target"]["targetType"],
    targetId: string,
  ): Promise<VerifierDecision | undefined> {
    const all = Array.from(this.records.values())
      .filter((r) => r.target.targetType === targetType && r.target.targetId === targetId)
      .sort((a, b) => b.evaluatedAt - a.evaluatedAt);
    return all[0];
  }

  async list(query: VerifierStoreQuery = {}): Promise<{ items: VerifierDecision[]; total: number }> {
    let items = Array.from(this.records.values());
    if (query.targetType) items = items.filter((r) => r.target.targetType === query.targetType);
    if (query.targetId) items = items.filter((r) => r.target.targetId === query.targetId);
    if (query.traceId) items = items.filter((r) => r.target.traceId === query.traceId);
    if (query.planId) items = items.filter((r) => r.target.planId === query.planId);
    if (query.outcome) items = items.filter((r) => r.outcome === query.outcome);
    items.sort((a, b) => b.evaluatedAt - a.evaluatedAt);
    const total = items.length;
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    return { items: items.slice(offset, offset + limit), total };
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  /** Test-only — drop everything. */
  clear(): void {
    this.records.clear();
  }
}

/**
 * Default singleton used by the verifier engine. Application code can swap
 * the backing store via `setBackend` (e.g. to a DbVerifierStore).
 */
class DefaultVerifierStore implements VerifierStore {
  private backend: VerifierStore = new InMemoryVerifierStore();

  setBackend(store: VerifierStore): void {
    this.backend = store;
  }

  getBackend(): VerifierStore {
    return this.backend;
  }

  save(d: VerifierDecision) {
    return this.backend.save(d);
  }
  get(id: string) {
    return this.backend.get(id);
  }
  latestForTarget(t: VerifierDecision["target"]["targetType"], id: string) {
    return this.backend.latestForTarget(t, id);
  }
  list(q?: VerifierStoreQuery) {
    return this.backend.list(q);
  }
  delete(id: string) {
    return this.backend.delete(id);
  }
}

export const defaultVerifierStore = new DefaultVerifierStore();
