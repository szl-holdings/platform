import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface MacroIndicator {
  id: string;
  label: string;
  category: 'equity' | 'fx' | 'commodity' | 'rates';
  value: number;
  formattedValue: string;
  change: number | null;
  changePct: number | null;
  unit: string;
  asOf: string;
  provider: string;
  delayWindow: string;
  staleThresholdHours: number;
  isStale: boolean;
  dataQuality: 'live' | 'delayed' | 'eod' | 'monthly' | 'seed';
}

export interface MarketDataSnapshot {
  indicators: MacroIndicator[];
  refreshedAt: string;
  nextRefreshAt: string;
  providerConfigured: boolean;
  cacheAgeSeconds: number;
  isStale: boolean;
  provider: string;
  fetchedAt?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${path}`);
  const body = await res.json();
  return (body.data ?? body) as T;
}

async function postJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${path}`);
  const body = await res.json();
  return (body.data ?? body) as T;
}

export function useMarketIndicators() {
  return useQuery({
    queryKey: ['lyte', 'market-indicators'],
    queryFn: () => getJson<MarketDataSnapshot>('/api/lyte/market-indicators'),
    refetchInterval: 4 * 60 * 1000,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useRefreshMarketIndicators() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postJson<{ refreshed: boolean; count: number }>('/api/lyte/market-indicators/refresh'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lyte', 'market-indicators'] });
    },
  });
}
