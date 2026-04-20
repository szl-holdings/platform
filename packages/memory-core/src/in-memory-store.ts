/**
 * AEEP Memory Core — In-Memory Store
 *
 * Reference implementation of the memory store interface.
 * Production deployments replace this with a Redis-backed or DB-backed adapter.
 */
import type { MemoryEntry, MemoryScope } from "@szl-holdings/shared-contracts";

export interface MemoryStore {
  get<T = unknown>(scope: MemoryScope, key: string): MemoryEntry<T> | undefined;
  set<T = unknown>(entry: Omit<MemoryEntry<T>, "lastAccessedAt">): void;
  delete(scope: MemoryScope, key: string): boolean;
  keys(scope: MemoryScope): string[];
  expireStale(): number;
  clear(scope?: MemoryScope): void;
}

export class InMemoryStore implements MemoryStore {
  private readonly store = new Map<string, MemoryEntry<unknown>>();

  private storeKey(scope: MemoryScope, key: string): string {
    return `${scope}::${key}`;
  }

  get<T = unknown>(scope: MemoryScope, key: string): MemoryEntry<T> | undefined {
    const entry = this.store.get(this.storeKey(scope, key)) as MemoryEntry<T> | undefined;
    if (!entry) return undefined;
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      this.store.delete(this.storeKey(scope, key));
      return undefined;
    }
    const updated: MemoryEntry<T> = { ...entry, lastAccessedAt: new Date().toISOString() };
    this.store.set(this.storeKey(scope, key), updated as MemoryEntry<unknown>);
    return updated;
  }

  set<T = unknown>(entry: Omit<MemoryEntry<T>, "lastAccessedAt">): void {
    this.store.set(this.storeKey(entry.scope, entry.key), {
      ...entry,
      lastAccessedAt: new Date().toISOString(),
    } as MemoryEntry<T>);
  }

  delete(scope: MemoryScope, key: string): boolean {
    return this.store.delete(this.storeKey(scope, key));
  }

  keys(scope: MemoryScope): string[] {
    const prefix = `${scope}::`;
    return Array.from(this.store.keys())
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length));
  }

  expireStale(): number {
    const now = new Date();
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && new Date(entry.expiresAt) < now) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(scope?: MemoryScope): void {
    if (scope) {
      const prefix = `${scope}::`;
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) this.store.delete(key);
      }
    } else {
      this.store.clear();
    }
  }
}
