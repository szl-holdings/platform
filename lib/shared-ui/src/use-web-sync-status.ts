import { useCallback, useEffect, useRef, useState } from 'react';
import type { SyncState } from './sync-status-badge';

export interface WebSyncStatusOptions {
  domain: 'aegis' | 'vessels' | 'alloy';
  syncEndpoint: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  syncIntervalMs?: number;
  getPendingCount?: () => Promise<number>;
  getConflictCount?: () => Promise<number>;
  countPollIntervalMs?: number;
}

export interface WebSyncStatus {
  syncState: SyncState;
  lastSyncedAt: Date | null;
  pendingCount: number;
  conflictCount: number;
  triggerSync: () => void;
}

const WATERMARK_KEY_PREFIX = 'szl:sync-watermark:';
const MAX_PAGES = 20;

export function useWebSyncStatus({
  domain,
  syncEndpoint,
  getAuthToken,
  syncIntervalMs = 120_000,
  getPendingCount,
  getConflictCount,
  countPollIntervalMs = 30_000,
}: WebSyncStatusOptions): WebSyncStatus {
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const watermarkKey = `${WATERMARK_KEY_PREFIX}${domain}`;
  const syncingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshCounts = useCallback(async () => {
    try {
      const [pending, conflict] = await Promise.all([
        getPendingCount ? getPendingCount() : Promise.resolve(0),
        getConflictCount ? getConflictCount() : Promise.resolve(0),
      ]);
      setPendingCount(pending);
      setConflictCount(conflict);
      if (conflict > 0) {
        setSyncState('conflict');
      } else if (pending > 0) {
        setSyncState((prev) => (prev === 'synced' || prev === 'conflict' ? 'pending' : prev));
      }
    } catch {}
  }, [getPendingCount, getConflictCount]);

  const doSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncState('syncing');

    try {
      let sinceTs = 0;
      try {
        const stored = localStorage.getItem(watermarkKey);
        if (stored) sinceTs = Number(stored);
      } catch {}

      const headers: Record<string, string> = {};
      if (getAuthToken) {
        const token = await getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      let currentCursor: string | undefined;
      let pageCount = 0;
      let latestServerTime: number | undefined;

      while (pageCount < MAX_PAGES) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);

        const url = currentCursor
          ? `${syncEndpoint}?cursor=${encodeURIComponent(currentCursor)}&limit=100`
          : `${syncEndpoint}?since=${sinceTs}&limit=100`;

        const res = await fetch(url, {
          headers,
          signal: controller.signal,
          credentials: 'include',
        });
        clearTimeout(timeout);

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setSyncState('synced');
          } else {
            setSyncState('error');
          }
          return;
        }

        const data = await res.json();
        if (data?.serverTime) {
          latestServerTime = data.serverTime;
        }

        pageCount++;

        if (!data?.hasMore || !data?.nextCursor) {
          break;
        }
        currentCursor = data.nextCursor;
      }

      if (latestServerTime) {
        try {
          localStorage.setItem(watermarkKey, String(latestServerTime));
        } catch {}
      }

      setSyncState('synced');
      setLastSyncedAt(new Date());
      await refreshCounts();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setSyncState('error');
      } else if (!navigator.onLine) {
        setSyncState('offline');
      } else {
        setSyncState('error');
      }
    } finally {
      syncingRef.current = false;
    }
  }, [syncEndpoint, watermarkKey, getAuthToken, refreshCounts]);

  useEffect(() => {
    function handleOnline() {
      doSync();
    }
    function handleOffline() {
      setSyncState('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setSyncState('offline');
    } else {
      doSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [doSync]);

  useEffect(() => {
    if (syncIntervalMs <= 0) return;
    intervalRef.current = setInterval(() => {
      if (navigator.onLine) doSync();
    }, syncIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [doSync, syncIntervalMs]);

  useEffect(() => {
    if (!getPendingCount && !getConflictCount) return;
    if (countPollIntervalMs <= 0) return;
    countIntervalRef.current = setInterval(refreshCounts, countPollIntervalMs);
    return () => {
      if (countIntervalRef.current) clearInterval(countIntervalRef.current);
    };
  }, [refreshCounts, getPendingCount, getConflictCount, countPollIntervalMs]);

  return {
    syncState,
    lastSyncedAt,
    pendingCount,
    conflictCount,
    triggerSync: doSync,
  };
}
