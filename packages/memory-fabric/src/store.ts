import type { MemoryEntry, MemoryType } from "./types.js";

type MemoryTier = MemoryType;

export interface MemoryStoreQuery {
  tier?: MemoryType;
  key?: string;
  scopeId?: string;
  tags?: string[];
  includeStale?: boolean;
  minConfidence?: number;
  sensitivity?: MemoryEntry["sensitivity"];
  search?: string;
  sortBy?: "confidence" | "freshness" | "default";
}

export interface MemoryStore {
  put(entry: MemoryEntry): void;
  get(id: string): MemoryEntry | undefined;
  getByKey(tier: MemoryType, key: string, scopeId?: string): MemoryEntry | undefined;
  list(query?: MemoryStoreQuery): MemoryEntry[];
  search(query: string, tier?: MemoryType): MemoryEntry[];
  delete(id: string): boolean;
  evictExpired(): number;
  count(tier?: MemoryType): number;
  clear(tier?: MemoryType): void;
}

export class InMemoryStore implements MemoryStore {
  private readonly entries = new Map<string, MemoryEntry>();

  put(entry: MemoryEntry): void {
    const updated: MemoryEntry = {
      ...entry,
      memoryType: entry.memoryType ?? entry.tier,
      freshness: {
        ...entry.freshness,
        lastUpdatedAt: new Date().toISOString(),
      },
    };
    this.entries.set(entry.id, updated);
  }

  get(id: string): MemoryEntry | undefined {
    const entry = this.entries.get(id);
    if (entry) {
      const updated = {
        ...entry,
        freshness: { ...entry.freshness, lastAccessedAt: new Date().toISOString() },
      };
      this.entries.set(id, updated);
      return updated;
    }
    return undefined;
  }

  getByKey(tier: MemoryType, key: string, scopeId?: string): MemoryEntry | undefined {
    for (const entry of this.entries.values()) {
      if (entry.tier === tier && entry.key === key) {
        if (scopeId === undefined || entry.scopeId === scopeId) return entry;
      }
    }
    return undefined;
  }

  list(query?: MemoryStoreQuery): MemoryEntry[] {
    let results = Array.from(this.entries.values());

    if (query?.tier) results = results.filter((e) => e.tier === query.tier);
    if (query?.key) results = results.filter((e) => e.key === query.key);
    if (query?.scopeId) results = results.filter((e) => e.scopeId === query.scopeId);
    if (query?.tags?.length) {
      results = results.filter((e) => query.tags!.every((t) => e.tags.includes(t)));
    }
    if (!query?.includeStale) {
      results = results.filter((e) => !e.freshness.isStale);
    }
    if (query?.minConfidence !== undefined) {
      results = results.filter((e) => e.confidence >= query.minConfidence!);
    }
    if (query?.search) {
      const needle = query.search.toLowerCase();
      results = results.filter((e) =>
        e.key.toLowerCase().includes(needle) ||
        (typeof e.value === "string" && e.value.toLowerCase().includes(needle)) ||
        (e.summary && e.summary.toLowerCase().includes(needle)) ||
        e.tags.some((t) => t.toLowerCase().includes(needle))
      );
    }

    if (query?.sortBy === "confidence") {
      results.sort((a, b) => b.confidence - a.confidence);
    } else if (query?.sortBy === "freshness") {
      results.sort(
        (a, b) =>
          new Date(b.freshness.lastUpdatedAt).getTime() -
          new Date(a.freshness.lastUpdatedAt).getTime()
      );
    }

    return results;
  }

  search(query: string, tier?: MemoryType): MemoryEntry[] {
    return this.list({ search: query, tier, includeStale: false, sortBy: "confidence" });
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }

  evictExpired(): number {
    const now = new Date();
    let count = 0;
    for (const [id, entry] of this.entries) {
      if (entry.retention.expiresAt && new Date(entry.retention.expiresAt) < now) {
        if (!entry.retention.pinned) {
          this.entries.delete(id);
          count++;
        }
      }
    }
    return count;
  }

  count(tier?: MemoryType): number {
    if (!tier) return this.entries.size;
    let n = 0;
    for (const e of this.entries.values()) {
      if (e.tier === tier) n++;
    }
    return n;
  }

  clear(tier?: MemoryType): void {
    if (!tier) {
      this.entries.clear();
      return;
    }
    for (const [id, e] of this.entries) {
      if (e.tier === tier) this.entries.delete(id);
    }
  }
}

/**
 * A MemoryStore wrapper that delegates to a swappable backend. Used as the
 * process-wide `defaultMemoryStore` so the API server can register a durable
 * Postgres-backed implementation at boot time.
 */
export class MutableMemoryStore implements MemoryStore {
  private backend: MemoryStore;

  constructor(initial: MemoryStore = new InMemoryStore()) {
    this.backend = initial;
  }

  setBackend(store: MemoryStore): void {
    this.backend = store;
  }

  getBackend(): MemoryStore {
    return this.backend;
  }

  put(entry: MemoryEntry): void { this.backend.put(entry); }
  get(id: string): MemoryEntry | undefined { return this.backend.get(id); }
  getByKey(tier: MemoryTier, key: string, scopeId?: string): MemoryEntry | undefined {
    return this.backend.getByKey(tier, key, scopeId);
  }
  list(query?: MemoryStoreQuery): MemoryEntry[] { return this.backend.list(query); }
  search(query: string, tier?: MemoryType): MemoryEntry[] { return this.backend.search(query, tier); }
  delete(id: string): boolean { return this.backend.delete(id); }
  evictExpired(): number { return this.backend.evictExpired(); }
  count(tier?: MemoryTier): number { return this.backend.count(tier); }
  clear(tier?: MemoryTier): void { this.backend.clear(tier); }
}

export const defaultMemoryStore: MutableMemoryStore = new MutableMemoryStore();
