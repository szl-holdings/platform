import { useQuery } from '@tanstack/react-query';
import { type LiveMetrics, investorDeckApi } from '../lib/investor-deck-api';

const FALLBACK_METRICS: LiveMetrics = {
  arr: '$2.4M',
  arrRaw: 2_400_000,
  mrr: '$200K',
  mrrRaw: 200_000,
  mrrGrowthPct: 12.5,
  customers: 47,
  customerGrowthPct: 8.3,
  nrr: 118,
  churnRatePct: 2.1,
  openCriticals: 3,
  meanTimeToRespondMin: 14,
  compliancePct: 94,
  activeThreats: 8,
  aggregateRisk: 42,
  platformUptime: 99.98,
  fetchedAt: new Date().toISOString(),
};

export function useLiveMetrics(opts?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['aegis-investor-metrics'],
    queryFn: () => investorDeckApi.getMetrics(),
    refetchInterval: opts?.refetchInterval ?? 60_000,
    staleTime: 30_000,
    retry: 2,
    placeholderData: FALLBACK_METRICS,
  });
}

export { FALLBACK_METRICS };
