import { useCallback, useEffect, useRef, useState } from 'react';
import { useApiStatus } from './useApiStatus';

export type SyncState = 'synced' | 'syncing' | 'pending' | 'conflict' | 'error' | 'offline';

export interface OfflineSyncState {
  syncState: SyncState;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  hasConflicts: boolean;
  hasPending: boolean;
}

export interface UseOfflineSyncOptions {
  domain: string;
  getQueueCount?: () => Promise<number>;
  getConflictCount?: () => Promise<number>;
  onSync?: () => Promise<void>;
  syncIntervalMs?: number;
}

export interface UseOfflineSyncResult extends OfflineSyncState {
  triggerSync: () => Promise<void>;
  clearConflicts: () => void;
}

export function useOfflineSync({
  domain,
  getQueueCount,
  getConflictCount,
  onSync,
  syncIntervalMs = 60_000,
}: UseOfflineSyncOptions): UseOfflineSyncResult {
  const { status, isOffline } = useApiStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const wasOfflineRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const domainRef = useRef(domain);
  domainRef.current = domain;
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;
  const getQueueCountRef = useRef(getQueueCount);
  getQueueCountRef.current = getQueueCount;
  const getConflictCountRef = useRef(getConflictCount);
  getConflictCountRef.current = getConflictCount;

  const refreshCounts = useCallback(async () => {
    try {
      const [qc, cc] = await Promise.all([
        getQueueCountRef.current?.() ?? Promise.resolve(0),
        getConflictCountRef.current?.() ?? Promise.resolve(0),
      ]);
      setPendingCount(qc);
      setConflictCount(cc);
    } catch {}
  }, []);

  const triggerSync = useCallback(async () => {
    if (isOffline || isSyncing) return;
    setIsSyncing(true);
    setSyncError(false);
    try {
      await onSyncRef.current?.();
      await refreshCounts();
      setLastSyncedAt(new Date());
    } catch {
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, isSyncing, refreshCounts]);

  const clearConflicts = useCallback(() => {
    setConflictCount(0);
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    const wasOffline = wasOfflineRef.current;
    wasOfflineRef.current = isOffline;

    if (!isOffline && wasOffline) {
      triggerSync();
    }
  }, [isOffline, triggerSync]);

  useEffect(() => {
    if (syncIntervalMs <= 0) return;
    syncTimerRef.current = setInterval(() => {
      if (!isOffline) {
        triggerSync();
      }
    }, syncIntervalMs);
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [syncIntervalMs, isOffline, triggerSync]);

  const syncState: SyncState = (() => {
    if (isOffline) return 'offline';
    if (isSyncing) return 'syncing';
    if (syncError) return 'error';
    if (conflictCount > 0) return 'conflict';
    if (pendingCount > 0) return 'pending';
    return 'synced';
  })();

  return {
    syncState,
    pendingCount,
    conflictCount,
    lastSyncedAt,
    isSyncing,
    hasConflicts: conflictCount > 0,
    hasPending: pendingCount > 0,
    triggerSync,
    clearConflicts,
  };
}
