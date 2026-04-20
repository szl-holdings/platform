import { useQuery } from '@tanstack/react-query';

const API = '/api';

export interface CarlotaApiData {
  inquiriesTotal: number;
  reservationsTotal: number;
  servicesCount: number;
  isLive: boolean;
  lastFetchedAt: string | null;
}

async function fetchCount(url: string): Promise<number> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  if (json?.meta?.total !== undefined) return json.meta.total;
  if (json?.data?.count !== undefined) return json.data.count;
  if (Array.isArray(json?.data)) return json.data.length;
  return 0;
}

async function fetchServices(): Promise<number> {
  const res = await fetch(`${API}/booking/services`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  if (Array.isArray(json?.data)) return json.data.length;
  return 0;
}

export function useCarlotaApiData(): CarlotaApiData {
  const { data: inquiriesCount = 0, isSuccess: inquiriesOk } = useQuery({
    queryKey: ['carlota-inquiries-count'],
    queryFn: () => fetchCount(`${API}/booking/inquiries?limit=1`),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 120_000,
  });

  const { data: reservationsCount = 0, isSuccess: reservationsOk } = useQuery({
    queryKey: ['carlota-reservations-count'],
    queryFn: () => fetchCount(`${API}/booking/reservations?limit=1`),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 120_000,
  });

  const { data: servicesCount = 0, isSuccess: servicesOk } = useQuery({
    queryKey: ['carlota-services-count'],
    queryFn: fetchServices,
    staleTime: 300_000,
    retry: 1,
    refetchInterval: 300_000,
  });

  const isLive = inquiriesOk || reservationsOk || servicesOk;

  return {
    inquiriesTotal: inquiriesCount,
    reservationsTotal: reservationsCount,
    servicesCount,
    isLive,
    lastFetchedAt: isLive ? new Date().toISOString() : null,
  };
}
