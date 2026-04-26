import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  type CachedEntity,
  type ConflictRecord,
  type SyncResult,
  type SyncExecutor,
  cacheEntity,
  getCachedEntity,
  getCachedEntitiesByType,
  enqueueSync,
  processSync,
  getConflicts,
  resolveConflict,
  getLastSyncInfo,
  getCacheStats,
  type ConflictResolution,
  getSyncQueueSize,
} from '../lib/offline-sync';

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  conflictCount: number;
  lastSyncAt: number | null;
  lastSyncResult: SyncResult | null;
}

const BACKGROUND_SYNC_INTERVAL_MS = 30_000;

export function useOfflineSync(executor: SyncExecutor) {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: true,
    isSyncing: false,
    pendingSyncCount: 0,
    conflictCount: 0,
    lastSyncAt: null,
    lastSyncResult: null,
  });

  const mountedRef = useRef(true);
  const syncingRef = useRef(false);
  const isOnlineRef = useRef(true);
  const executorRef = useRef(executor);

  executorRef.current = executor;

  const refreshState = useCallback(async () => {
    const [pendingSyncCount, conflicts, lastSync] = await Promise.all([
      getSyncQueueSize(),
      getConflicts(),
      getLastSyncInfo(),
    ]);

    if (mountedRef.current) {
      setState((prev) => ({
        ...prev,
        pendingSyncCount,
        conflictCount: conflicts.length,
        lastSyncAt: lastSync?.timestamp ?? null,
      }));
    }
  }, []);

  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (syncingRef.current || !isOnlineRef.current) return null;
    syncingRef.current = true;

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, isSyncing: true }));
    }

    try {
      const result = await processSync(executorRef.current);

      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncResult: result,
          lastSyncAt: Date.now(),
        }));
      }

      await refreshState();
      return result;
    } catch {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, isSyncing: false }));
      }
      return null;
    } finally {
      syncingRef.current = false;
    }
  }, [refreshState]);

  const syncRef = useRef(sync);
  syncRef.current = sync;

  const cacheAndSync = useCallback(
    async (
      entityType: string,
      entityId: string,
      data: Record<string, unknown>,
      operation: 'create' | 'update' | 'delete' = 'update',
    ) => {
      const entity: CachedEntity = {
        id: entityId,
        entityType,
        data,
        version: (data.version as number) ?? 1,
        cachedAt: Date.now(),
        lastModifiedAt: Date.now(),
        syncStatus: 'pending',
      };

      await cacheEntity(entity);
      await enqueueSync(entityType, entityId, operation, data);
      await refreshState();

      if (isOnlineRef.current) {
        void syncRef.current();
      }
    },
    [refreshState],
  );

  const handleResolveConflict = useCallback(
    async (entityId: string, entityType: string, resolution: ConflictResolution) => {
      await resolveConflict(entityId, entityType, resolution);
      await refreshState();
    },
    [refreshState],
  );

  useEffect(() => {
    mountedRef.current = true;
    refreshState();

    const unsubscribe = NetInfo.addEventListener((netState) => {
      const online = netState.isConnected ?? false;
      isOnlineRef.current = online;

      if (mountedRef.current) {
        setState((prev) => {
          if (prev.isOnline !== online) {
            if (online && !syncingRef.current) {
              void syncRef.current();
            }
            return { ...prev, isOnline: online };
          }
          return prev;
        });
      }
    });

    const intervalId = setInterval(() => {
      if (isOnlineRef.current && !syncingRef.current) {
        void syncRef.current();
      }
    }, BACKGROUND_SYNC_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [refreshState]);

  return {
    ...state,
    sync,
    cacheAndSync,
    resolveConflict: handleResolveConflict,
    getCachedEntity,
    getCachedEntitiesByType,
    getConflicts,
    getCacheStats,
    refreshState,
  };
}
