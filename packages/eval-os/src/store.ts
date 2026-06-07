/**
 * @workspace/eval-os — Jury Score Persistence
 *
 * Persists jury verdicts so they can be retrieved alongside recommendation IDs.
 * Backed by an in-memory store by default; call setJuryStoreAdapter() to
 * replace with a DB-backed adapter at startup.
 *
 * The public `defaultJuryStore` is a MutableDelegatingJuryStore that forwards
 * every call to the currently configured adapter.  This ensures that swapping
 * the adapter via setJuryStoreAdapter() works correctly for class-based
 * adapters whose prototype methods are not copied by Object.assign.
 */

// ─── Record shape ─────────────────────────────────────────────────────────────

export interface JuryRecord {
  juryId: string;
  recommendationId: string;
  domain: string;
  title?: string;
  summary?: string;
  grounding: number;
  actionability: number;
  policyCompliance: number;
  reversibility: number;
  confidence: number;
  composite: number;
  passed: boolean;
  evaluatedAt: string;
}

// ─── Store interface ──────────────────────────────────────────────────────────

export interface JuryStore {
  save(record: JuryRecord): void;
  getByJuryId(juryId: string): JuryRecord | undefined;
  getByRecommendationId(recommendationId: string): JuryRecord[];
  list(filter?: {
    domain?: string;
    passed?: boolean;
    limit?: number;
    offset?: number;
  }): JuryRecord[];
  count(): number;
}

// ─── In-memory implementation ─────────────────────────────────────────────────

export class InMemoryJuryStore implements JuryStore {
  private readonly byJuryId = new Map<string, JuryRecord>();
  private readonly byRecommendationId = new Map<string, JuryRecord[]>();

  save(record: JuryRecord): void {
    this.byJuryId.set(record.juryId, record);
    const existing = this.byRecommendationId.get(record.recommendationId) ?? [];
    this.byRecommendationId.set(record.recommendationId, [...existing, record]);
  }

  getByJuryId(juryId: string): JuryRecord | undefined {
    return this.byJuryId.get(juryId);
  }

  getByRecommendationId(recommendationId: string): JuryRecord[] {
    return this.byRecommendationId.get(recommendationId) ?? [];
  }

  list(filter?: { domain?: string; passed?: boolean; limit?: number; offset?: number }): JuryRecord[] {
    let all = Array.from(this.byJuryId.values()).sort(
      (a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime(),
    );
    if (filter?.domain) all = all.filter((r) => r.domain === filter.domain);
    if (filter?.passed !== undefined) all = all.filter((r) => r.passed === filter.passed);
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 50;
    return all.slice(offset, offset + limit);
  }

  count(): number {
    return this.byJuryId.size;
  }
}

// ─── Mutable delegating store ─────────────────────────────────────────────────
//
// Holds a mutable reference to the active adapter and forwards every method
// call to it.  This is the correct way to support adapter hot-swapping because
// Object.assign only copies own enumerable properties — it does NOT copy
// prototype methods from class-based adapters, meaning calls would continue
// using the original in-memory implementation.

class MutableDelegatingJuryStore implements JuryStore {
  private _delegate: JuryStore;

  constructor(initial: JuryStore) {
    this._delegate = initial;
  }

  /** Replace the delegate.  All subsequent calls are forwarded to the new adapter. */
  setDelegate(adapter: JuryStore): void {
    this._delegate = adapter;
  }

  getDelegate(): JuryStore {
    return this._delegate;
  }

  save(record: JuryRecord): void {
    this._delegate.save(record);
  }

  getByJuryId(juryId: string): JuryRecord | undefined {
    return this._delegate.getByJuryId(juryId);
  }

  getByRecommendationId(recommendationId: string): JuryRecord[] {
    return this._delegate.getByRecommendationId(recommendationId);
  }

  list(filter?: { domain?: string; passed?: boolean; limit?: number; offset?: number }): JuryRecord[] {
    return this._delegate.list(filter);
  }

  count(): number {
    return this._delegate.count();
  }
}

// ─── Default store singleton ──────────────────────────────────────────────────

const _delegatingStore = new MutableDelegatingJuryStore(new InMemoryJuryStore());

/**
 * The module-level jury store.  Always delegates to the currently configured
 * adapter (default: InMemoryJuryStore).
 */
export const defaultJuryStore: JuryStore = _delegatingStore;

export type JuryStoreAdapter = JuryStore;

/**
 * Replace the backing store with a DB-backed adapter.
 * Call once at startup before any verdicts are persisted.
 *
 * Works correctly for class-based adapters because the delegating store
 * holds a reference to the adapter object rather than copying its properties.
 */
export function setJuryStoreAdapter(adapter: JuryStoreAdapter): void {
  _delegatingStore.setDelegate(adapter);
}

export function getJuryStoreAdapter(): JuryStoreAdapter {
  return _delegatingStore.getDelegate();
}
