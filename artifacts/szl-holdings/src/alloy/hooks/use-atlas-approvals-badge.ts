import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface ApiApprovalLite {
  id: number;
  status: string;
  createdAt: string;
}

const STORAGE_KEY = 'szl_atlas_approvals_last_seen_ms';
const POLL_INTERVAL_MS = 30_000;
export const ATLAS_APPROVALS_BADGE_QUERY_KEY = ['atlas-approvals', 'pending-badge'] as const;

function readLastSeen(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeLastSeen(ms: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(ms));
    window.dispatchEvent(new CustomEvent('atlas-approvals-seen', { detail: ms }));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export interface AtlasApprovalsBadge {
  pendingCount: number;
  newCount: number;
  isLoading: boolean;
  markAllSeen: () => void;
}

export function useAtlasApprovalsBadge(): AtlasApprovalsBadge {
  const [lastSeen, setLastSeen] = useState<number>(() => readLastSeen());

  useEffect(() => {
    function onSeen(e: Event) {
      const ce = e as CustomEvent<number>;
      if (typeof ce.detail === 'number') setLastSeen(ce.detail);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setLastSeen(readLastSeen());
    }
    window.addEventListener('atlas-approvals-seen', onSeen);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('atlas-approvals-seen', onSeen);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const { data, isLoading } = useQuery<ApiApprovalLite[]>({
    queryKey: ATLAS_APPROVALS_BADGE_QUERY_KEY,
    queryFn: async () => {
      const result = await apiRequest<ApiApprovalLite[] | { data: ApiApprovalLite[] }>(
        'GET',
        '/api/approvals?status=pending',
      );
      return Array.isArray(result) ? result : ((result as { data: ApiApprovalLite[] }).data ?? []);
    },
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    retry: 1,
  });

  const pending = useMemo(
    () => (Array.isArray(data) ? data.filter((a) => a.status === 'pending') : []),
    [data],
  );

  const newCount = useMemo(() => {
    if (!lastSeen) return pending.length;
    return pending.filter((a) => {
      const t = new Date(a.createdAt).getTime();
      return Number.isFinite(t) && t > lastSeen;
    }).length;
  }, [pending, lastSeen]);

  const markAllSeen = useCallback(() => {
    const now = Date.now();
    writeLastSeen(now);
    setLastSeen(now);
  }, []);

  return {
    pendingCount: pending.length,
    newCount,
    isLoading,
    markAllSeen,
  };
}
