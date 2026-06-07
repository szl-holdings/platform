import type { VerifierDecision } from './types.js';

export interface VerifierStoreQuery {
  targetType?: VerifierDecision['target']['targetType'];
  targetId?: string;
  traceId?: string;
  planId?: string;
  outcome?: VerifierDecision['outcome'];
  /**
   * Restrict results to records owned by any of these org ids. When
   * undefined, no org filter is applied (caller is trusted to be
   * cross-org allowed). When an empty array is supplied, the result is
   * empty (no orgs visible).
   */
  orgIds?: number[];
  limit?: number;
  offset?: number;
}

/**
 * Optional scope passed to single-record reads/writes. When `orgIds` is
 * supplied the record must carry an orgId in that list — otherwise the
 * operation behaves as if the record does not exist (404, no leakage).
 */
export interface VerifierAccessScope {
  orgIds?: number[];
}

function inScope(orgId: number | null | undefined, scope?: VerifierAccessScope): boolean {
  if (!scope || scope.orgIds === undefined) return true;
  if (orgId === null || orgId === undefined) return false;
  return scope.orgIds.includes(orgId);
}

export interface VerifierStore {
  save(decision: VerifierDecision): Promise<VerifierDecision>;
  get(id: string, scope?: VerifierAccessScope): Promise<VerifierDecision | undefined>;
  latestForTarget(
    targetType: VerifierDecision['target']['targetType'],
    targetId: string,
    scope?: VerifierAccessScope,
  ): Promise<VerifierDecision | undefined>;
  list(query?: VerifierStoreQuery): Promise<{ items: VerifierDecision[]; total: number }>;
  delete(id: string, scope?: VerifierAccessScope): Promise<boolean>;
}

export class InMemoryVerifierStore implements VerifierStore {
  private records = new Map<string, VerifierDecision>();

  async save(decision: VerifierDecision): Promise<VerifierDecision> {
    this.records.set(decision.verifierId, decision);
    return decision;
  }

  async get(id: string, scope?: VerifierAccessScope): Promise<VerifierDecision | undefined> {
    const r = this.records.get(id);
    if (!r) return undefined;
    if (!inScope(r.orgId, scope)) return undefined;
    return r;
  }

  async latestForTarget(
    targetType: VerifierDecision['target']['targetType'],
    targetId: string,
    scope?: VerifierAccessScope,
  ): Promise<VerifierDecision | undefined> {
    const all = Array.from(this.records.values())
      .filter(
        (r) =>
          r.target.targetType === targetType &&
          r.target.targetId === targetId &&
          inScope(r.orgId, scope),
      )
      .sort((a, b) => b.evaluatedAt - a.evaluatedAt);
    return all[0];
  }

  async list(
    query: VerifierStoreQuery = {},
  ): Promise<{ items: VerifierDecision[]; total: number }> {
    let items = Array.from(this.records.values());
    if (query.targetType) items = items.filter((r) => r.target.targetType === query.targetType);
    if (query.targetId) items = items.filter((r) => r.target.targetId === query.targetId);
    if (query.traceId) items = items.filter((r) => r.target.traceId === query.traceId);
    if (query.planId) items = items.filter((r) => r.target.planId === query.planId);
    if (query.outcome) items = items.filter((r) => r.outcome === query.outcome);
    if (query.orgIds !== undefined) {
      const allowed = new Set(query.orgIds);
      items = items.filter(
        (r) => r.orgId !== null && r.orgId !== undefined && allowed.has(r.orgId),
      );
    }
    items.sort((a, b) => b.evaluatedAt - a.evaluatedAt);
    const total = items.length;
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    return { items: items.slice(offset, offset + limit), total };
  }

  async delete(id: string, scope?: VerifierAccessScope): Promise<boolean> {
    const r = this.records.get(id);
    if (!r) return false;
    if (!inScope(r.orgId, scope)) return false;
    this.records.delete(id);
    return true;
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
  get(id: string, scope?: VerifierAccessScope) {
    return this.backend.get(id, scope);
  }
  latestForTarget(
    t: VerifierDecision['target']['targetType'],
    id: string,
    scope?: VerifierAccessScope,
  ) {
    return this.backend.latestForTarget(t, id, scope);
  }
  list(q?: VerifierStoreQuery) {
    return this.backend.list(q);
  }
  delete(id: string, scope?: VerifierAccessScope) {
    return this.backend.delete(id, scope);
  }
}

export const defaultVerifierStore = new DefaultVerifierStore();
