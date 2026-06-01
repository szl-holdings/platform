/**
 * Tier implementations.
 *
 * - HotTier:  in-memory LRU map (analogue of FlexTensor's GPU-resident tensor pool).
 * - WarmTier: pluggable — IndexedDB in the browser, in-memory in Node
 *             (analogue of FlexTensor's CPU-resident tier).
 * - Cold:     not a class — cold means "loader will be called".
 */

import type { CacheEntry } from './types';

export interface Tier {
  has(key: string): Promise<boolean>;
  get<T>(key: string): Promise<CacheEntry<T> | undefined>;
  put<T>(entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  size(): Promise<number>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

/**
 * HotTier — synchronous Map under the hood, but Promise-typed for parity
 * with WarmTier so callers can treat them uniformly.
 *
 * Eviction is LRU by `lastAccessAt`. The manager calls `evictIfNeeded` after
 * each insert so the size never silently grows past `maxEntries`.
 */
export class HotTier implements Tier {
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  constructor(private readonly maxEntries: number) {}

  async has(key: string): Promise<boolean> {
    return this.entries.has(key);
  }

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    return this.entries.get(key) as CacheEntry<T> | undefined;
  }

  async put<T>(entry: CacheEntry<T>): Promise<void> {
    this.entries.set(entry.key, entry as CacheEntry<unknown>);
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async size(): Promise<number> {
    return this.entries.size;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.entries.keys());
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  /**
   * Evict least-recently-accessed entries until size ≤ max.
   * Returns the keys that were evicted.
   */
  evictIfNeeded(): string[] {
    if (this.entries.size <= this.maxEntries) return [];
    const sorted = Array.from(this.entries.values()).sort(
      (a, b) => a.lastAccessAt - b.lastAccessAt,
    );
    const toRemove = sorted.slice(0, this.entries.size - this.maxEntries);
    for (const e of toRemove) this.entries.delete(e.key);
    return toRemove.map((e) => e.key);
  }

  capacity(): number {
    return this.maxEntries;
  }
}

/** Warm tier backed by an in-memory Map (Node and SSR-safe fallback). */
export class MemoryWarmTier implements Tier {
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  constructor(private readonly maxEntries: number) {}

  async has(key: string): Promise<boolean> {
    return this.entries.has(key);
  }

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    return this.entries.get(key) as CacheEntry<T> | undefined;
  }

  async put<T>(entry: CacheEntry<T>): Promise<void> {
    this.entries.set(entry.key, entry as CacheEntry<unknown>);
    this.evictIfNeeded();
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async size(): Promise<number> {
    return this.entries.size;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.entries.keys());
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  private evictIfNeeded(): void {
    if (this.entries.size <= this.maxEntries) return;
    const sorted = Array.from(this.entries.values()).sort(
      (a, b) => a.lastAccessAt - b.lastAccessAt,
    );
    const toRemove = sorted.slice(0, this.entries.size - this.maxEntries);
    for (const e of toRemove) this.entries.delete(e.key);
  }
}

/**
 * Warm tier backed by IndexedDB. Falls back to MemoryWarmTier when IndexedDB
 * isn't available (Node, SSR, private browsing, etc.).
 *
 * Best-effort: failures degrade to no-op rather than throwing — the manager
 * will still serve the key from cold on the next call.
 */
export class IndexedDBWarmTier implements Tier {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private readonly fallback: MemoryWarmTier;
  private readonly storeName = 'flexcache-warm';

  constructor(
    private readonly dbName: string,
    private readonly maxEntries: number,
  ) {
    this.fallback = new MemoryWarmTier(maxEntries);
  }

  private getDb(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve) => {
      if (
        typeof globalThis === 'undefined' ||
        typeof (globalThis as { indexedDB?: IDBFactory }).indexedDB ===
          'undefined'
      ) {
        resolve(null);
        return;
      }
      try {
        const req = (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB.open(
          this.dbName,
          1,
        );
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    return this.dbPromise;
  }

  private async withStore<R>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => Promise<R> | R,
  ): Promise<R | null> {
    const db = await this.getDb();
    if (!db) return null;
    return new Promise<R | null>((resolve) => {
      try {
        const tx = db.transaction(this.storeName, mode);
        const store = tx.objectStore(this.storeName);
        const result = fn(store);
        tx.oncomplete = async () => resolve(await result);
        tx.onerror = () => resolve(null);
        tx.onabort = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async has(key: string): Promise<boolean> {
    const r = await this.withStore('readonly', (store) =>
      new Promise<boolean>((resolve) => {
        const req = store.getKey(key);
        req.onsuccess = () => resolve(req.result != null);
        req.onerror = () => resolve(false);
      }),
    );
    if (r === null) return this.fallback.has(key);
    return r;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    const r = await this.withStore('readonly', (store) =>
      new Promise<CacheEntry<T> | undefined>((resolve) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result as CacheEntry<T> | undefined);
        req.onerror = () => resolve(undefined);
      }),
    );
    if (r === null) return this.fallback.get<T>(key);
    return r;
  }

  async put<T>(entry: CacheEntry<T>): Promise<void> {
    const r = await this.withStore('readwrite', (store) =>
      new Promise<void>((resolve) => {
        const req = store.put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      }),
    );
    if (r === null) {
      await this.fallback.put(entry);
      return;
    }
    // Fire-and-forget eviction sweep. We don't block the put on it.
    void this.evictIfNeeded();
  }

  async delete(key: string): Promise<void> {
    const r = await this.withStore('readwrite', (store) =>
      new Promise<void>((resolve) => {
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      }),
    );
    if (r === null) await this.fallback.delete(key);
  }

  async size(): Promise<number> {
    const r = await this.withStore('readonly', (store) =>
      new Promise<number>((resolve) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      }),
    );
    if (r === null) return this.fallback.size();
    return r;
  }

  async keys(): Promise<string[]> {
    const r = await this.withStore('readonly', (store) =>
      new Promise<string[]>((resolve) => {
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result.map((k) => String(k)));
        req.onerror = () => resolve([]);
      }),
    );
    if (r === null) return this.fallback.keys();
    return r;
  }

  async clear(): Promise<void> {
    const r = await this.withStore('readwrite', (store) =>
      new Promise<void>((resolve) => {
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      }),
    );
    if (r === null) await this.fallback.clear();
  }

  private async evictIfNeeded(): Promise<void> {
    const total = await this.size();
    if (total <= this.maxEntries) return;
    const allKeys = await this.keys();
    const entries: CacheEntry<unknown>[] = [];
    for (const k of allKeys) {
      const e = await this.get(k);
      if (e) entries.push(e);
    }
    entries.sort((a, b) => a.lastAccessAt - b.lastAccessAt);
    const toRemove = entries.slice(0, entries.length - this.maxEntries);
    for (const e of toRemove) await this.delete(e.key);
  }
}

export function createWarmTier(
  backend: 'auto' | 'memory' | 'indexeddb',
  dbName: string,
  maxEntries: number,
): Tier {
  if (backend === 'memory') return new MemoryWarmTier(maxEntries);
  const hasIdb =
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { indexedDB?: IDBFactory }).indexedDB !== 'undefined';
  if (backend === 'indexeddb' || (backend === 'auto' && hasIdb)) {
    return new IndexedDBWarmTier(dbName, maxEntries);
  }
  return new MemoryWarmTier(maxEntries);
}
