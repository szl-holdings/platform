import { type UseOfflineSyncResult, useOfflineQueue, useOfflineSync } from '@szl-holdings/mobile-shared/hooks';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { AUTH_TOKEN_KEY } from '@/context/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : null;

async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
  }
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export interface AegisOfflineSyncResult extends UseOfflineSyncResult {
  queueIncidentReport: (params: {
    title: string;
    description?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    assignedAnalyst?: string;
  }) => Promise<void>;
  queueTriageDecision: (incidentId: number, status: string, notes?: string) => Promise<void>;
}

export function useAegisOfflineSync(): AegisOfflineSyncResult {
  const qc = useQueryClient();

  const { enqueue, queueLength, conflictCount } = useOfflineQueue({
    domain: 'aegis',
    getToken: getAuthToken,
    onReplay: (replayed) => {
      if (replayed > 0) {
        qc.invalidateQueries({ queryKey: ['aegis-incidents'] });
        qc.invalidateQueries({ queryKey: ['aegis-threat-summary'] });
      }
    },
    onConflict: (count) => {
      if (count > 0) {
        qc.invalidateQueries({ queryKey: ['aegis-conflicts'] });
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

    const watermarkKey = 'aegis:sync-watermark';
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
          ? `${API_BASE}/aegis/sync?cursor=${encodeURIComponent(currentCursor)}&limit=50`
          : `${API_BASE}/aegis/sync?since=${sinceTs}&limit=50`;

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
        qc.invalidateQueries({ queryKey: ['aegis-incidents'] });
        qc.invalidateQueries({ queryKey: ['aegis-alerts'] });
        qc.invalidateQueries({ queryKey: ['aegis-threat-summary'] });
      }
    } catch {}
  }, [qc]);

  const syncResult = useOfflineSync({
    domain: 'aegis',
    getQueueCount: async () => queueLength,
    getConflictCount: async () => conflictCount,
    onSync: handleSync,
    syncIntervalMs: 90_000,
  });

  const queueIncidentReport = useCallback(
    async (params: {
      title: string;
      description?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      assignedAnalyst?: string;
    }) => {
      if (!API_BASE) return;
      await enqueue({
        method: 'POST',
        url: `${API_BASE}/aegis/incidents`,
        body: {
          title: params.title,
          description: params.description,
          severity: params.severity,
          assignedAnalyst: params.assignedAnalyst,
          status: 'detection',
        },
      });
    },
    [enqueue],
  );

  const queueTriageDecision = useCallback(
    async (incidentId: number, status: string, notes?: string) => {
      if (!API_BASE) return;
      await enqueue({
        method: 'PATCH',
        url: `${API_BASE}/aegis/incidents/${incidentId}`,
        body: { status, notes },
      });
    },
    [enqueue],
  );

  return {
    ...syncResult,
    pendingCount: queueLength,
    hasPending: queueLength > 0,
    queueIncidentReport,
    queueTriageDecision,
  };
}
