export { AsyncStorageAdapter } from './asyncstorage';
export { IndexedDBAdapter } from './indexeddb';
export type { StorageAdapter, StorageAdapterOptions, StoragePlatform } from './interface';

export async function createStorageAdapterAsync(
  platform: 'web' | 'mobile' | 'auto' = 'auto',
  options?: import('./interface').StorageAdapterOptions,
): Promise<import('./interface').StorageAdapter> {
  const resolved =
    platform === 'auto'
      ? typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
        ? 'web'
        : 'mobile'
      : platform;

  if (resolved === 'web') {
    const { IndexedDBAdapter } = await import('./indexeddb');
    return new IndexedDBAdapter(options);
  } else {
    const { AsyncStorageAdapter } = await import('./asyncstorage');
    return new AsyncStorageAdapter(options);
  }
}
