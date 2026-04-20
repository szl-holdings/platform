import type { UseOfflineSyncResult } from '@szl-holdings/mobile-shared/hooks';
import { useOfflineQueue, useOfflineSync } from '@szl-holdings/mobile-shared/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : null;

const TOKEN_KEY = 'auth_token';

async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
  }
  try {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export interface VesselsOfflineSyncResult extends UseOfflineSyncResult {
  queueAisGapReport: (params: {
    vesselId: number;
    title: string;
    description?: string;
    severity: 'watch' | 'warning' | 'critical';
  }) => Promise<void>;
  queueComplianceDecision: (params: {
    vesselId: number;
    eventId?: number;
    workflowType: string;
    notes?: string;
    assignedTo?: string;
  }) => Promise<void>;
}

export function useVesselsOfflineSync(): VesselsOfflineSyncResult {
  const qc = useQueryClient();

  const { enqueue, queueLength, conflictCount } = useOfflineQueue({
    domain: 'vessels',
    getToken: getAuthToken,
    onReplay: (replayed) => {
      if (replayed > 0) {
        qc.invalidateQueries({ queryKey: ['vessels'] });
        qc.invalidateQueries({ queryKey: ['vessels-events'] });
        qc.invalidateQueries({ queryKey: ['vessels-alerts'] });
      }
    },
    onConflict: (count) => {
      if (count > 0) {
        qc.invalidateQueries({ queryKey: ['vessels-conflicts'] });
      }
    },
  });

  const handleSync = useCallback(async () => {
    if (!API_BASE) return;
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const watermarkKey = 'vessels:sync-watermark';
    let sinceTs = 0;
    try {
      const stored =
        typeof window !== 'undefined' ? window.localStorage.getItem(watermarkKey) : null;
      if (stored) sinceTs = Number(stored);
    } catch {}

    try {
      let currentCursor: string | undefined;
      let latestServerTime: number | undefined;
      let hasChanges = false;
      let pageCount = 0;

      while (pageCount < 20) {
        const url = currentCursor
          ? `${API_BASE}/vessels/sync?cursor=${encodeURIComponent(currentCursor)}&limit=50`
          : `${API_BASE}/vessels/sync?since=${sinceTs}&limit=50`;

        const res = await fetch(url, { headers });
        if (!res.ok) break;

        const data = await res.json();
        if (data?.serverTime) latestServerTime = data.serverTime;
        if ((data?.changes?.length ?? 0) > 0) hasChanges = true;

        pageCount++;
        if (!data?.hasMore || !data?.nextCursor) break;
        currentCursor = data.nextCursor;
      }

      if (latestServerTime) {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(watermarkKey, String(latestServerTime));
          }
        } catch {}
      }
      if (hasChanges) {
        qc.invalidateQueries({ queryKey: ['vessels'] });
        qc.invalidateQueries({ queryKey: ['vessels-fleets'] });
        qc.invalidateQueries({ queryKey: ['vessels-positions'] });
        qc.invalidateQueries({ queryKey: ['vessels-events'] });
      }
    } catch {}
  }, [qc]);

  const syncResult = useOfflineSync({
    domain: 'vessels',
    getQueueCount: async () => queueLength,
    getConflictCount: async () => conflictCount,
    onSync: handleSync,
    syncIntervalMs: 90_000,
  });

  const queueAisGapReport = useCallback(
    async (params: {
      vesselId: number;
      title: string;
      description?: string;
      severity: 'watch' | 'warning' | 'critical';
    }) => {
      if (!API_BASE) return;
      await enqueue({
        method: 'POST',
        url: `${API_BASE}/vessels/events`,
        body: {
          vesselId: params.vesselId,
          eventType: 'ais_dark',
          title: params.title,
          description: params.description,
          severity: params.severity,
          status: 'open',
        },
      });
    },
    [enqueue],
  );

  const queueComplianceDecision = useCallback(
    async (params: {
      vesselId: number;
      eventId?: number;
      workflowType: string;
      notes?: string;
      assignedTo?: string;
    }) => {
      if (!API_BASE) return;
      await enqueue({
        method: 'POST',
        url: `${API_BASE}/vessels/command-workflows`,
        body: {
          vesselId: params.vesselId,
          eventId: params.eventId,
          workflowType: params.workflowType,
          notes: params.notes,
          assignedTo: params.assignedTo,
          status: 'pending',
        },
      });
    },
    [enqueue],
  );

  return {
    ...syncResult,
    pendingCount: queueLength,
    hasPending: queueLength > 0,
    queueAisGapReport,
    queueComplianceDecision,
  };
}
