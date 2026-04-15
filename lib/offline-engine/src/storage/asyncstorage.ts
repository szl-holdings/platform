import type { StorageAdapter, StorageAdapterOptions } from "./interface";

const PREFIX = "szl-offline:";

type AsyncStorageInterface = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiGet(keys: string[]): Promise<readonly [string, string | null][]>;
};

async function getStorage(): Promise<AsyncStorageInterface | null> {
  try {
    const mod = await import("@react-native-async-storage/async-storage");
    return mod.default as AsyncStorageInterface;
  } catch {
    return null;
  }
}

export class AsyncStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(options: StorageAdapterOptions = {}) {
    this.prefix = `${PREFIX}${options.dbName ?? "store"}:`;
  }

  private storeKey(store: string, key: string): string {
    return `${this.prefix}${store}:${key}`;
  }

  private storePrefix(store: string): string {
    return `${this.prefix}${store}:`;
  }

  async get<T = unknown>(store: string, key: string): Promise<T | undefined> {
    const storage = await getStorage();
    if (!storage) return undefined;
    const raw = await storage.getItem(this.storeKey(store, key));
    return raw ? (JSON.parse(raw) as T) : undefined;
  }

  async put<T = unknown>(store: string, key: string, value: T): Promise<void> {
    const storage = await getStorage();
    if (!storage) return;
    await storage.setItem(this.storeKey(store, key), JSON.stringify(value));
  }

  async delete(store: string, key: string): Promise<void> {
    const storage = await getStorage();
    if (!storage) return;
    await storage.removeItem(this.storeKey(store, key));
  }

  async getAll<T = unknown>(store: string): Promise<T[]> {
    const storage = await getStorage();
    if (!storage) return [];
    const allKeys = await storage.getAllKeys();
    const prefix = this.storePrefix(store);
    const storeKeys = (allKeys as string[]).filter((k) => k.startsWith(prefix));
    if (storeKeys.length === 0) return [];
    const pairs = await storage.multiGet(storeKeys);
    return pairs
      .map(([, v]) => (v ? (JSON.parse(v) as T) : null))
      .filter((v): v is T => v !== null);
  }

  async query<T = unknown>(store: string, filter: (item: T) => boolean): Promise<T[]> {
    const all = await this.getAll<T>(store);
    return all.filter(filter);
  }

  async clear(store: string): Promise<void> {
    const storage = await getStorage();
    if (!storage) return;
    const allKeys = await storage.getAllKeys();
    const prefix = this.storePrefix(store);
    const storeKeys = (allKeys as string[]).filter((k) => k.startsWith(prefix));
    for (const k of storeKeys) {
      await storage.removeItem(k);
    }
  }

  async count(store: string): Promise<number> {
    const storage = await getStorage();
    if (!storage) return 0;
    const allKeys = await storage.getAllKeys();
    const prefix = this.storePrefix(store);
    return (allKeys as string[]).filter((k) => k.startsWith(prefix)).length;
  }
}
