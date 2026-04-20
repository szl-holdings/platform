import type { StorageAdapter, StorageAdapterOptions } from './interface';

const DEFAULT_STORES = [
  'offline-commands',
  'sync-watermarks',
  'aegis-incidents',
  'aegis-signals',
  'vessels-positions',
  'vessels-fleets',
  'conflict-queue',
  'cache-metadata',
];

export class IndexedDBAdapter implements StorageAdapter {
  private dbName: string;
  private version: number;
  private stores: string[];
  private _db: IDBDatabase | null = null;

  constructor(options: StorageAdapterOptions = {}) {
    this.dbName = options.dbName ?? 'szl-offline-store';
    this.version = options.version ?? 1;
    this.stores = options.stores ?? DEFAULT_STORES;
  }

  private async db(): Promise<IDBDatabase> {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.version);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const store of this.stores) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'key' });
          }
        }
      };

      req.onsuccess = (event) => {
        this._db = (event.target as IDBOpenDBRequest).result;
        resolve(this._db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async get<T = unknown>(store: string, key: string): Promise<T | undefined> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () =>
        resolve(req.result ? (req.result as { key: string; value: T }).value : undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T = unknown>(store: string, key: string, value: T): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(store: string, key: string): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAll<T = unknown>(store: string): Promise<T[]> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => {
        const results = (req.result as Array<{ key: string; value: T }>).map((r) => r.value);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async query<T = unknown>(store: string, filter: (item: T) => boolean): Promise<T[]> {
    const all = await this.getAll<T>(store);
    return all.filter(filter);
  }

  async clear(store: string): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async count(store: string): Promise<number> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}
