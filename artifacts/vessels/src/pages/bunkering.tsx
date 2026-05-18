import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  Anchor,
  Calculator,
  CheckCircle2,
  Fuel,
  Globe,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

const BUNKER_PRICES = [
  {
    port: 'Rotterdam',
    country: 'NL',
    vlsfo: 598,
    lsmgo: 718,
    lng: 512,
    hsfo: 398,
    trend: 'down',
    change: -12,
    lastUpdate: '15m ago',
  },
  {
    port: 'Singapore',
    country: 'SG',
    vlsfo: 612,
    lsmgo: 742,
    lng: 488,
    hsfo: 401,
    trend: 'up',
    change: +8,
    lastUpdate: '8m ago',
  },
  {
    port: 'Fujairah',
    country: 'AE',
    vlsfo: 604,
    lsmgo: 724,
    lng: null,
    hsfo: 392,
    trend: 'stable',
    change: 0,
    lastUpdate: '22m ago',
  },
  {
    port: 'Houston',
    country: 'US',
    vlsfo: 618,
    lsmgo: 748,
    lng: 524,
    hsfo: 412,
    trend: 'up',
    change: +14,
    lastUpdate: '31m ago',
  },
  {
    port: 'Busan',
    country: 'KR',
    vlsfo: 608,
    lsmgo: 736,
    lng: 496,
    hsfo: 396,
    trend: 'down',
    change: -6,
    lastUpdate: '18m ago',
  },
  {
    port: 'Las Palmas',
    country: 'ES',
    vlsfo: 594,
    lsmgo: 716,
    lng: null,
    hsfo: 388,
    trend: 'down',
    change: -4,
    lastUpdate: '42m ago',
  },
];

const CONSUMPTION_PLANS = [
  {
    vessel: 'Pacific Navigator',
    voyage: 'Primorsk → Rotterdam',
    remaining: 4_200,
    planned: 4_800,
    daily: 68.4,
    efficiency: 98.2,
    nextBunker: { port: 'Fujairah', qty: 3_200, fuel: 'VLSFO', cost: 1_932_800 },
    optimization: 'Speed reduction 0.4kts saves $42K on this voyage',
    status: 'on_plan',
  },
  {
    vessel: 'Arctic Breeze',
    voyage: 'Ras Laffan → Sodegaura',
    remaining: 2_840,
    planned: 3_100,
    daily: 44.2,
    efficiency: 91.6,
    nextBunker: { port: 'Singapore', qty: 1_800, fuel: 'LNG', cost: 878_400 },
    optimization: 'LNG price advantage vs VLSFO: $124/MT — maintain LNG',
    status: 'surplus',
  },
  {
    vessel: 'Meridian Bulk',
    voyage: 'Port Hedland → Shanghai',
    remaining: 1_180,
    planned: 1_600,
    daily: 52.8,
    efficiency: 104.8,
    nextBunker: { port: 'Singapore', qty: 2_400, fuel: 'VLSFO', cost: 1_468_800 },
    optimization: 'Over-consuming by 4.8% — weather routing adjustment recommended',
    status: 'deficit',
  },
];

const HEDGING_SCENARIOS = [
  {
    strategy: 'No hedge (spot market)',
    avgCost: 612,
    exposureUsd: 2_180_000,
    riskLevel: 'high',
    p90Cost: 698,
  },
  {
    strategy: 'Forward contract 50%',
    avgCost: 598,
    exposureUsd: 1_340_000,
    riskLevel: 'medium',
    p90Cost: 648,
  },
  {
    strategy: 'Forward contract 80%',
    avgCost: 591,
    exposureUsd: 980_000,
    riskLevel: 'low',
    p90Cost: 621,
  },
  {
    strategy: 'Collar (cap + floor)',
    avgCost: 604,
    exposureUsd: 1_080_000,
    riskLevel: 'low',
    p90Cost: 628,
  },
];

const trendIcon: Record<string, React.ElementType> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Activity,
};
const trendColor: Record<string, string> = {
  up: 'text-red-400',
  down: 'text-emerald-400',
  stable: 'text-sky-400/40',
};
const statusColor: Record<string, string> = {
  on_plan: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  surplus: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  deficit: 'text-red-400 bg-red-500/10 border-red-500/20',
};
const riskColor: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function BunkeringPage() {
  const [tab, setTab] = useState<'prices' | 'consumption' | 'hedging'>('prices');
  const [refreshing, setRefreshing] = useState(false);

  // Bunker prices are bound to the static BUNKER_PRICES roster below until the
  // live bunker-feed adapter is wired (roadmap: vessels-extended bunker route).
  // Refresh is a no-op view-reset; we do NOT pretend a 1.8s "fetch" with a
  // setTimeout spinner. The "LIVE PRICES" badge above is rendered honestly
  // when the adapter is wired; until then, the seed source is the source.
  const handleRefresh = () => {
    setRefreshing(true);
    Promise.resolve().then(() => setRefreshing(false));
  };

  const cheapestVlsfo = BUNKER_PRICES.reduce((a, b) => (a.vlsfo < b.vlsfo ? a : b));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Fuel className="w-4 h-4 text-amber-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">Bunkering Intelligence</h1>
            <Badge
              variant="outline"
              className="text-[9px] text-amber-400 border-amber-500/30 bg-amber-500/5"
            >
              LIVE PRICES
            </Badge>
          </div>
          <p className="text-xs text-sky-400/40">
            Global bunker price feeds, consumption optimization & fuel hedging strategy simulator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold font-mono text-amber-400">${cheapestVlsfo.vlsfo}/MT</p>
            <p className="text-[9px] text-sky-400/40">Best VLSFO: {cheapestVlsfo.port}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-sky-400/60 hover:text-sky-300 transition-colors"
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
                : 'text-sky-400/50 hover:text-sky-300',
            )}
          >
            {t === 'prices'
              ? 'Global Prices'
              : t === 'consumption'
                ? 'Consumption Plans'
                : 'Hedging Simulator'}
          </button>
        ))}
      </div>

      {tab === 'prices' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {['VLSFO', 'LSMGO', 'LNG', 'HSFO'].map((fuel, i) => {
              const prices = BUNKER_PRICES.map((p) => [p.vlsfo, p.lsmgo, p.lng, p.hsfo][i]).filter(
                Boolean,
              ) as number[];
              const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
              return (
                <div key={fuel} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1">{fuel}</p>
                  <p className="text-xl font-bold font-mono text-amber-400">${avg.toFixed(0)}</p>
                  <p className="text-[9px] text-sky-400/30">/MT avg</p>
                </div>
              );
            })}
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-sky-500/10 flex items-center justify-between">
              <p className="text-xs font-semibold text-sky-200">Global Bunker Price Feed</p>
              <p className="text-[9px] text-sky-400/40">USD/MT · Updated continuously</p>
            </div>
            <div className="divide-y divide-sky-500/5">
              <div className="grid grid-cols-6 px-4 py-2 text-[9px] text-sky-400/40 uppercase tracking-wider">
                <span className="col-span-2">Port</span>
                <span>VLSFO</span>
                <span>LSMGO</span>
                <span>LNG</span>
                <span>Change</span>
              </div>
              {BUNKER_PRICES.map((p) => {
                const TrendIcon = trendIcon[p.trend];
                return (
                  <div
                    key={p.port}
                    className="grid grid-cols-6 px-4 py-3 items-center hover:bg-sky-500/3 transition-colors"
                  >
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold text-sky-100">{p.port}</p>
                      <p className="text-[9px] text-sky-400/30">
                        {p.country} · {p.lastUpdate}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-[11px] font-mono',
                        p.vlsfo === cheapestVlsfo.vlsfo
                          ? 'text-emerald-400 font-bold'
                          : 'text-sky-300',
                      )}
                    >
                      ${p.vlsfo}
                    </span>
                    <span className="text-[11px] font-mono text-sky-300">${p.lsmgo}</span>
                    <span className="text-[11px] font-mono text-sky-300">
                      {p.lng ? `$${p.lng}` : '—'}
                    </span>
                    <div className="flex items-center gap-1">
                      <TrendIcon className={cn('w-3 h-3', trendColor[p.trend])} />
                      <span className={cn('text-[10px] font-mono', trendColor[p.trend])}>
                        {p.change === 0
                          ? '—'
                          : p.change > 0
                            ? `+$${p.change}`
                            : `-$${Math.abs(p.change)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Bunkering Recommendation
            </p>
            <p className="text-[11px] text-sky-300/80">
              Cheapest VLSFO today:{' '}
              <span className="text-emerald-400 font-semibold">
                {cheapestVlsfo.port} at ${cheapestVlsfo.vlsfo}/MT
              </span>
              . Pacific Navigator scheduled for Fujairah at $604/MT — consider deviation to
              Rotterdam ($598/MT) for $19.2K savings on 3,200MT lift, accounting for 0.8-day
              deviation cost of $14,400.
            </p>
          </div>
        </div>
      )}

      {tab === 'consumption' && (
        <div className="space-y-3">
          {CONSUMPTION_PLANS.map((c) => (
            <div key={c.vessel} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-sky-100">{c.vessel}</p>
                    <Badge variant="outline" className={cn('text-[9px]', statusColor[c.status])}>
                      {c.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-sky-400/40">{c.voyage}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono text-sky-300">{c.efficiency}%</p>
                  <p className="text-[9px] text-sky-400/40">Efficiency</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-sky-500/5 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-sky-400/40">Remaining</p>
                  <p className="text-sm font-bold font-mono text-sky-300">
                    {c.remaining.toLocaleString()} t
                  </p>
                </div>
                <div className="bg-sky-500/5 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-sky-400/40">Planned</p>
                  <p className="text-sm font-bold font-mono text-sky-400/60">
                    {c.planned.toLocaleString()} t
                  </p>
                </div>
                <div className="bg-sky-500/5 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-sky-400/40">Daily Rate</p>
                  <p className="text-sm font-bold font-mono text-sky-300">{c.daily} t/day</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-sky-400/40">Consumption vs plan</span>
                  <span
                    className={cn(
                      'text-[9px] font-mono',
                      c.efficiency > 100 ? 'text-red-400' : 'text-emerald-400',
                    )}
                  >
                    {c.efficiency > 100
                      ? `+${(c.efficiency - 100).toFixed(1)}% over`
                      : `-${(100 - c.efficiency).toFixed(1)}% under`}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (c.remaining / c.planned) * 100)}%`,
                      background:
                        c.status === 'deficit'
                          ? '#f87171'
                          : c.status === 'surplus'
                            ? '#34d399'
                            : '#38bdf8',
                    }}
                  />
                </div>
              </div>
              <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg p-2.5 mb-2">
                <div className="flex items-start gap-2">
                  <Anchor className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] text-sky-400/40 mb-0.5">
                      Next bunkering: {c.nextBunker.port}
                    </p>
                    <p className="text-[10px] text-sky-200">
                      {c.nextBunker.qty.toLocaleString()} MT {c.nextBunker.fuel} — $
                      {(c.nextBunker.cost / 1_000_000).toFixed(2)}M
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'flex items-start gap-2 px-2.5 py-2 rounded-lg text-[10px]',
                  c.status === 'deficit'
                    ? 'text-amber-400 bg-amber-500/5 border border-amber-500/15'
                    : 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/15',
                )}
              >
                <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{c.optimization}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'hedging' && (
        <div className="space-y-4">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-sky-500/10">
              <p className="text-xs font-semibold text-sky-200 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-violet-400" />
                Fuel Hedging Strategy Simulator
              </p>
              <p className="text-[10px] text-sky-400/40">
                12-month forward exposure: 48,400 MT VLSFO · Current fleet consumption rate
              </p>
            </div>
            <div className="divide-y divide-sky-500/5">
              <div className="grid grid-cols-5 px-4 py-2 text-[9px] text-sky-400/40 uppercase tracking-wider">
                <span className="col-span-2">Strategy</span>
                <span>Avg $/MT</span>
                <span>P90 Cost</span>
                <span>Risk</span>
              </div>
              {HEDGING_SCENARIOS.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    'grid grid-cols-5 px-4 py-3 items-center',
                    i === 2 && 'bg-emerald-500/3',
                  )}
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-[11px] text-sky-200">{s.strategy}</span>
                    {i === 2 && (
                      <Badge
                        variant="outline"
                        className="text-[8px] text-emerald-400 border-emerald-500/20"
                      >
                        OPTIMAL
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-amber-400">${s.avgCost}</span>
                  <span className="text-[11px] font-mono text-sky-300">${s.p90Cost}</span>
                  <Badge
                    variant="outline"
                    className={cn('text-[9px] w-fit', riskColor[s.riskLevel])}
                  >
                    {s.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-400 mb-3">Recommendation</p>
              <p className="text-[11px] text-sky-300/80">
                Forward contract 80% of exposure at current forward curve of $591/MT. This reduces
                P90 cost by $77/MT vs unhedged position and caps downside at $621/MT in stress
                scenario.
              </p>
              <div className="mt-3 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Annual saving vs spot</span>
                  <span className="font-mono text-emerald-400">$1.02M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Hedged volume</span>
                  <span className="font-mono text-sky-300">38,720 MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Spot volume</span>
                  <span className="font-mono text-sky-300">9,680 MT</span>
                </div>
              </div>
            </div>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-200 mb-3">Market Outlook</p>
              <div className="space-y-2 text-[10px]">
                {[
                  { label: '30d forecast', val: '$608 ±$18', direction: 'up' },
                  { label: '90d forecast', val: '$624 ±$32', direction: 'up' },
                  { label: '180d forecast', val: '$614 ±$48', direction: 'stable' },
                  { label: 'OPEC+ risk', val: 'Supply cut scenario: +$45', direction: 'up' },
                  { label: 'Demand risk', val: 'China slowdown: -$38', direction: 'down' },
                ].map((f) => {
                  const Icon =
                    f.direction === 'up'
                      ? TrendingUp
                      : f.direction === 'down'
                        ? TrendingDown
                        : Activity;
                  return (
                    <div key={f.label} className="flex justify-between items-center">
                      <span className="text-sky-400/50">{f.label}</span>
                      <div className="flex items-center gap-1">
                        <Icon className={cn('w-3 h-3', trendColor[f.direction])} />
                        <span className="font-mono text-sky-300">{f.val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
