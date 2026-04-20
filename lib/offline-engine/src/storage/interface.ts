export interface StorageAdapter {
  get<T = unknown>(store: string, key: string): Promise<T | undefined>;
  put<T = unknown>(store: string, key: string, value: T): Promise<void>;
  delete(store: string, key: string): Promise<void>;
  getAll<T = unknown>(store: string): Promise<T[]>;
  query<T = unknown>(store: string, filter: (item: T) => boolean): Promise<T[]>;
  clear(store: string): Promise<void>;
  count(store: string): Promise<number>;
}

export type StoragePlatform = 'web' | 'mobile' | 'auto';

export interface StorageAdapterOptions {
  dbName?: string;
  version?: number;
  stores?: string[];
}
