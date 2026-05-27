import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Anchor,
  Calculator,
  CheckCircle2,
  Fuel,
  Globe,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  api,
  type BunkerPrice,
  type BunkerPricesResponse,
  type VoyageEconomics,
} from '@/lib/api';

interface HedgingScenario {
  strategy: string;
  avgCost: number;
  exposureUsd: number;
  riskLevel: 'low' | 'medium' | 'high';
  p90Cost: number;
}

const statusColor: Record<string, string> = {
  on_plan: 'text-[#c9b787] bg-[#c9b787]/10 border-white/[0.08]',
  surplus: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  deficit: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const riskColor: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function deriveHedgingScenarios(prices: BunkerPrice[]): HedgingScenario[] {
  if (prices.length === 0) return [];
  const avgVlsfo = prices.reduce((a, p) => a + p.vlsfoUsdPerMt, 0) / prices.length;
  const minVlsfo = Math.min(...prices.map((p) => p.vlsfoUsdPerMt));
  const maxVlsfo = Math.max(...prices.map((p) => p.vlsfoUsdPerMt));
  const spread = Math.max(maxVlsfo - minVlsfo, 10);

  return [
    {
      strategy: 'No hedge (spot market)',
      avgCost: Math.round(avgVlsfo),
      exposureUsd: Math.round(avgVlsfo * 3_500),
      riskLevel: 'high',
      p90Cost: Math.round(avgVlsfo + spread * 1.5),
    },
    {
      strategy: 'Forward contract 50%',
      avgCost: Math.round(avgVlsfo - spread * 0.2),
      exposureUsd: Math.round(avgVlsfo * 2_200),
      riskLevel: 'medium',
      p90Cost: Math.round(avgVlsfo + spread * 0.8),
    },
    {
      strategy: 'Forward contract 80%',
      avgCost: Math.round(avgVlsfo - spread * 0.35),
      exposureUsd: Math.round(avgVlsfo * 1_600),
      riskLevel: 'low',
      p90Cost: Math.round(avgVlsfo + spread * 0.5),
    },
    {
      strategy: 'Collar (cap + floor)',
      avgCost: Math.round(avgVlsfo - spread * 0.15),
      exposureUsd: Math.round(avgVlsfo * 1_800),
      riskLevel: 'low',
      p90Cost: Math.round(avgVlsfo + spread * 0.6),
    },
  ];
}

function ConsumptionPlanFromVoyage({ voyage }: { voyage: VoyageEconomics }) {
  const consumed = Number(voyage.fuelConsumedMt ?? 0);
  const cost = Number(voyage.fuelCostUsd ?? 0);
  const duration = Number(voyage.durationDays ?? 0);
  const dailyRate = duration > 0 ? consumed / duration : 0;
  const distance = Number(voyage.distanceNm ?? 0);
  const efficiency = distance > 0 && consumed > 0 ? (distance / consumed).toFixed(1) : '—';

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-[#f5f5f5]">{voyage.vesselName ?? `Vessel #${voyage.vesselId}`}</p>
            <Badge variant="outline" className="text-[9px] text-[#c9b787] bg-[#c9b787]/10 border-white/[0.08]">
              {voyage.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-[10px] text-[#6a6a6a]">
            {voyage.voyageRef} · {voyage.originPort} → {voyage.destinationPort}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold font-mono text-[#d4c598]">{efficiency}</p>
          <p className="text-[9px] text-[#6a6a6a]">nm/MT</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#c9b787]/8 rounded-lg p-2 text-center">
          <p className="text-[9px] text-[#6a6a6a]">Consumed</p>
          <p className="text-sm font-bold font-mono text-[#d4c598]">
            {consumed.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT
          </p>
        </div>
        <div className="bg-[#c9b787]/8 rounded-lg p-2 text-center">
          <p className="text-[9px] text-[#6a6a6a]">Fuel cost</p>
          <p className="text-sm font-bold font-mono text-amber-400">
            ${(cost / 1_000).toFixed(0)}K
          </p>
        </div>
        <div className="bg-[#c9b787]/8 rounded-lg p-2 text-center">
          <p className="text-[9px] text-[#6a6a6a]">Daily rate</p>
          <p className="text-sm font-bold font-mono text-[#d4c598]">
            {dailyRate ? `${dailyRate.toFixed(1)} t/day` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BunkeringPage() {
  const [tab, setTab] = useState<'prices' | 'consumption' | 'hedging'>('prices');

  const pricesQuery = useQuery({
    queryKey: ['vessels-bunker-prices'],
    queryFn: () => api.voyageCalc.bunkerPrices(),
    staleTime: 60_000,
  });

  const voyagesQuery = useQuery({
    queryKey: ['vessels-voyage-economics-active'],
    queryFn: () => api.voyageEconomics.list({ status: 'in_progress' }),
    staleTime: 30_000,
    enabled: tab === 'consumption',
  });

  const prices = pricesQuery.data?.bunkerPrices ?? [];
  const cheapestVlsfo = useMemo(
    () => (prices.length ? prices.reduce((a, b) => (a.vlsfoUsdPerMt < b.vlsfoUsdPerMt ? a : b)) : null),
    [prices],
  );

  const handleRefresh = () => {
    void pricesQuery.refetch();
    if (tab === 'consumption') void voyagesQuery.refetch();
  };

  const refreshing = pricesQuery.isFetching || voyagesQuery.isFetching;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Fuel className="w-4 h-4 text-amber-400" />
            <h1 className="font-display text-xl font-bold text-[#f5f5f5]">Bunkering Intelligence</h1>
            <Badge
              variant="outline"
              className="text-[9px] text-amber-400 border-amber-500/30 bg-amber-500/5"
            >
              LIVE PRICES
            </Badge>
          </div>
          <p className="text-xs text-[#6a6a6a]">
            Global bunker price feeds, consumption from active voyages & fuel hedging strategy simulator
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cheapestVlsfo && (
            <div className="text-right">
              <p className="text-sm font-bold font-mono text-amber-400">
                ${cheapestVlsfo.vlsfoUsdPerMt}/MT
              </p>
              <p className="text-[9px] text-[#6a6a6a]">Best VLSFO: {cheapestVlsfo.port}</p>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#c9b787]/8 text-[#9a9a9a] hover:text-[#d4c598] transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-1">
        {(['prices', 'consumption', 'hedging'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'text-xs px-4 py-1.5 rounded-lg capitalize transition-colors',
              tab === t
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'text-[#8a8a8a] hover:text-[#d4c598]',
            )}
          >
            {t === 'prices'
              ? 'Global Prices'
              : t === 'consumption'
                ? 'Active Voyages'
                : 'Hedging Simulator'}
          </button>
        ))}
      </div>

      {tab === 'prices' && (
        <PricesTab query={pricesQuery} prices={prices} cheapestVlsfo={cheapestVlsfo} />
      )}

      {tab === 'consumption' && <ConsumptionTab query={voyagesQuery} />}

      {tab === 'hedging' && <HedgingTab query={pricesQuery} prices={prices} />}
    </div>
  );
}

function PricesTab({
  query,
  prices,
  cheapestVlsfo,
}: {
  query: ReturnType<typeof useQuery<BunkerPricesResponse>>;
  prices: BunkerPrice[];
  cheapestVlsfo: BunkerPrice | null;
}) {
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#9a9a9a]">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-xs">Loading bunker price feed…</span>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-red-300">Bunker price feed unavailable</p>
          <p className="text-[11px] text-red-300/70 mt-1">
            {(query.error as Error)?.message ?? 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
  if (prices.length === 0) {
    return (
      <EmptyState
        icon={Fuel}
        headline="No bunker prices published"
        description="The bunker price feed returned no port quotes — check back once the upstream provider re-publishes."
        accentColor="#f59e0b"
      />
    );
  }

  const fuels = [
    { key: 'vlsfoUsdPerMt' as const, label: 'VLSFO' },
    { key: 'mgoUsdPerMt' as const, label: 'MGO' },
    { key: 'hfoUsdPerMt' as const, label: 'HFO' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 mb-4">
        {fuels.map((f) => {
          const avg = prices.reduce((a, p) => a + p[f.key], 0) / prices.length;
          return (
            <div key={f.key} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
              <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-1">{f.label}</p>
              <p className="text-xl font-bold font-mono text-amber-400">${avg.toFixed(0)}</p>
              <p className="text-[9px] text-[#5a5a5a]">/MT avg</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-xs font-semibold text-[#e0e0e0]">Global Bunker Price Feed</p>
          <p className="text-[9px] text-[#6a6a6a]">
            USD/MT · As of {query.data?.asOfDate ?? '—'}
          </p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          <div className="grid grid-cols-5 px-4 py-2 text-[9px] text-[#6a6a6a] uppercase tracking-wider">
            <span className="col-span-2">Port</span>
            <span>VLSFO</span>
            <span>MGO</span>
            <span>HFO</span>
          </div>
          {prices.map((p) => (
            <div
              key={p.port}
              className="grid grid-cols-5 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors"
            >
              <div className="col-span-2">
                <p className="text-[11px] font-semibold text-[#f5f5f5]">{p.port}</p>
                <p className="text-[9px] text-[#5a5a5a]">As of {p.asOfDate}</p>
              </div>
              <span
                className={cn(
                  'text-[11px] font-mono',
                  cheapestVlsfo && p.vlsfoUsdPerMt === cheapestVlsfo.vlsfoUsdPerMt
                    ? 'text-emerald-400 font-bold'
                    : 'text-[#d4c598]',
                )}
              >
                ${p.vlsfoUsdPerMt}
              </span>
              <span className="text-[11px] font-mono text-[#d4c598]">${p.mgoUsdPerMt}</span>
              <span className="text-[11px] font-mono text-[#d4c598]">${p.hfoUsdPerMt}</span>
            </div>
          ))}
        </div>
      </div>

      {cheapestVlsfo && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Bunkering Recommendation
          </p>
          <p className="text-[11px] text-[#d4c598]/80">
            Cheapest VLSFO today:{' '}
            <span className="text-emerald-400 font-semibold">
              {cheapestVlsfo.port} at ${cheapestVlsfo.vlsfoUsdPerMt}/MT
            </span>
            . Vessels routing through this port avoid a ${(prices.reduce((a, p) => a + p.vlsfoUsdPerMt, 0) / prices.length - cheapestVlsfo.vlsfoUsdPerMt).toFixed(0)}/MT premium versus the global average.
          </p>
        </div>
      )}
    </div>
  );
}

function ConsumptionTab({ query }: { query: ReturnType<typeof useQuery<VoyageEconomics[]>> }) {
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#9a9a9a]">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-xs">Loading active voyages…</span>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-red-300">Could not load voyage consumption data</p>
          <p className="text-[11px] text-red-300/70 mt-1">
            {(query.error as Error)?.message ?? 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
  const voyages = query.data ?? [];
  if (voyages.length === 0) {
    return (
      <EmptyState
        icon={Anchor}
        headline="No voyages in progress"
        description="Fuel consumption plans appear once a vessel begins an active voyage."
        accentColor="#38bdf8"
      />
    );
  }
  return (
    <div className="space-y-3">
      {voyages.map((v) => (
        <ConsumptionPlanFromVoyage key={v.id} voyage={v} />
      ))}
    </div>
  );
}

function HedgingTab({
  query,
  prices,
}: {
  query: ReturnType<typeof useQuery<BunkerPricesResponse>>;
  prices: BunkerPrice[];
}) {
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#9a9a9a]">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-xs">Loading bunker price feed…</span>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-red-300">
            Hedging simulator requires live bunker prices
          </p>
          <p className="text-[11px] text-red-300/70 mt-1">
            {(query.error as Error)?.message ?? 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
  if (prices.length === 0) {
    return (
      <EmptyState
        icon={Calculator}
        headline="Hedging simulator needs live prices"
        description="Scenarios are computed from the live bunker price feed — none was returned."
        accentColor="#a78bfa"
      />
    );
  }

  const scenarios = deriveHedgingScenarios(prices);
  const optimalIdx = scenarios.reduce(
    (best, s, i) => (s.p90Cost < scenarios[best]!.p90Cost ? i : best),
    0,
  );
  const optimal = scenarios[optimalIdx]!;
  const avgVlsfo = prices.reduce((a, p) => a + p.vlsfoUsdPerMt, 0) / prices.length;

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-xs font-semibold text-[#e0e0e0] flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-violet-400" />
            Fuel Hedging Strategy Simulator
          </p>
          <p className="text-[10px] text-[#6a6a6a]">
            Derived from {prices.length} live bunker quotes · Avg VLSFO ${avgVlsfo.toFixed(0)}/MT
          </p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          <div className="grid grid-cols-5 px-4 py-2 text-[9px] text-[#6a6a6a] uppercase tracking-wider">
            <span className="col-span-2">Strategy</span>
            <span>Avg $/MT</span>
            <span>P90 Cost</span>
            <span>Risk</span>
          </div>
          {scenarios.map((s, i) => (
            <div
              key={s.strategy}
              className={cn(
                'grid grid-cols-5 px-4 py-3 items-center',
                i === optimalIdx && 'bg-emerald-500/3',
              )}
            >
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-[11px] text-[#e0e0e0]">{s.strategy}</span>
                {i === optimalIdx && (
                  <Badge
                    variant="outline"
                    className="text-[8px] text-emerald-400 border-emerald-500/20"
                  >
                    OPTIMAL
                  </Badge>
                )}
              </div>
              <span className="text-[11px] font-mono text-amber-400">${s.avgCost}</span>
              <span className="text-[11px] font-mono text-[#d4c598]">${s.p90Cost}</span>
              <Badge variant="outline" className={cn('text-[9px] w-fit', riskColor[s.riskLevel])}>
                {s.riskLevel}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Recommendation
        </p>
        <p className="text-[11px] text-[#d4c598]/80">
          Lowest P90 exposure: <span className="text-emerald-400 font-semibold">{optimal.strategy}</span>{' '}
          at ${optimal.avgCost}/MT average and ${optimal.p90Cost}/MT P90 — saves $
          {scenarios[0]!.p90Cost - optimal.p90Cost}/MT versus unhedged spot exposure.
        </p>
      </div>
    </div>
  );
}
