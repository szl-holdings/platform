import type { MemoryEntry, MemoryTier } from "./types.js";

export interface MemoryStoreQuery {
  tier?: MemoryTier;
  key?: string;
  scopeId?: string;
  tags?: string[];
  includeStale?: boolean;
}

export interface MemoryStore {
  put(entry: MemoryEntry): void;
  get(id: string): MemoryEntry | undefined;
  getByKey(tier: MemoryTier, key: string, scopeId?: string): MemoryEntry | undefined;
  list(query?: MemoryStoreQuery): MemoryEntry[];
  delete(id: string): boolean;
  evictExpired(): number;
  count(tier?: MemoryTier): number;
  clear(tier?: MemoryTier): void;
}

export class InMemoryStore implements MemoryStore {
  private readonly entries = new Map<string, MemoryEntry>();

  put(entry: MemoryEntry): void {
    const updated: MemoryEntry = {
      ...entry,
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
      this.entries.set(id, {
        ...entry,
        freshness: { ...entry.freshness, lastAccessedAt: new Date().toISOString() },
      });
    }
    return entry;
  }

  getByKey(tier: MemoryTier, key: string, scopeId?: string): MemoryEntry | undefined {
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

    return results;
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }

  evictExpired(): number {
    const now = new Date();
    let count = 0;
    for (const [id, entry] of this.entries) {
      if (entry.retention.expiresAt && new Date(entry.retention.expiresAt) < now) {
        this.entries.delete(id);
        count++;
      }
    }
    return count;
  }

  count(tier?: MemoryTier): number {
    if (!tier) return this.entries.size;
    let n = 0;
    for (const e of this.entries.values()) {
      if (e.tier === tier) n++;
    }
    return n;
  }

  clear(tier?: MemoryTier): void {
    if (!tier) {
      this.entries.clear();
      return;
    }
    for (const [id, e] of this.entries) {
      if (e.tier === tier) this.entries.delete(id);
    }
  }
}

export const defaultMemoryStore = new InMemoryStore();
