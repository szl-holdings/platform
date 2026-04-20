import { useCallback, useEffect, useState } from 'react';
import { getOutbox, getStoredCursor } from '../offline-persistence';
import { useApiStatus } from './useApiStatus';

export interface OfflineReadyResult {
  isOfflineReady: boolean;
  pendingCount: number;
  lastCursor: number;
  refresh: () => Promise<void>;
}

export function useOfflineReady(): OfflineReadyResult {
  const { isOffline } = useApiStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [lastCursor, setLastCursor] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [outbox, cursor] = await Promise.all([getOutbox(), getStoredCursor()]);
      setPendingCount(outbox.length);
      setLastCursor(cursor);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [isOffline, refresh]);

  return {
    isOfflineReady: true,
    pendingCount,
    lastCursor,
    refresh,
  };
}
