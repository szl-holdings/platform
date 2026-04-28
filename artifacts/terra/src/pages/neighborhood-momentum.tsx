import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AmbientBar, type AmbientSignal } from '@szl-holdings/shared-ui/ambient-intelligence';
import {
  CorrelationFeed,
  type CrossDomainCorrelation,
} from '@szl-holdings/shared-ui/cross-domain-correlation';
import { type EnergyMetrics, EnergyPulse } from '@szl-holdings/shared-ui/energy-heartbeat';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Layers,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { api } from '@/lib/api';

type Trajectory = 'accelerating' | 'gentrifying' | 'stable' | 'declining' | 'distressed';

interface MicroMarket {
  id: string;
  name: string;
  borough: string;
  trajectory: Trajectory;
  momentumScore: number;
  priceChangePct: number;
  permitActivity: number;
  institutionalFlowM: number;
  populationGrowthPct: number;
  medianPrice: number;
  capRateCompression: number;
  topSignals: string[];
  description: string;
  lat: number;
  lng: number;
}

const TRAJECTORY_META: Record<
  Trajectory,
  { label: string; color: string; bg: string; barColor: string; icon: typeof TrendingUp }
> = {
  accelerating: {
    label: 'Accelerating',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    barColor: '#34d399',
    icon: TrendingUp,
  },
  gentrifying: {
    label: 'Gentrifying',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10 border-sky-400/20',
    barColor: '#38bdf8',
    icon: ArrowUpRight,
  },
  stable: {
    label: 'Stable',
    color: 'text-slate-400',
    bg: 'bg-slate-400/10 border-slate-400/20',
    barColor: '#94a3b8',
    icon: Activity,
  },
  declining: {
    label: 'Declining',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    barColor: '#fbbf24',
    icon: TrendingDown,
  },
  distressed: {
    label: 'Distressed',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
    barColor: '#f87171',
    icon: ArrowDownRight,
  },
};

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function MomentumBar({ score, trajectory }: { score: number; trajectory: Trajectory }) {
  const meta = TRAJECTORY_META[trajectory];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-white/5 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${score}%`, background: meta.barColor }}
        />
      </div>
      <span className="text-xs font-bold w-6 text-right" style={{ color: meta.barColor }}>
        {score}
      </span>
    </div>
  );
}

function HeatmapCanvas({
  markets,
  selected,
  onSelect,
}: {
  markets: MicroMarket[];
  selected: MicroMarket | null;
  onSelect: (m: MicroMarket) => void;
}) {
  const minLat = Math.min(...markets.map((m) => m.lat));
  const maxLat = Math.max(...markets.map((m) => m.lat));
  const minLng = Math.min(...markets.map((m) => m.lng));
  const maxLng = Math.max(...markets.map((m) => m.lng));
  const padLat = (maxLat - minLat) * 0.15 || 0.05;
  const padLng = (maxLng - minLng) * 0.15 || 0.05;

  const W = 620,
    H = 320;
  const toXY = (lat: number, lng: number) => ({
    x: ((lng - (minLng - padLng)) / (maxLng + padLng - (minLng - padLng))) * W,
    y: (1 - (lat - (minLat - padLat)) / (maxLat + padLat - (minLat - padLat))) * H,
  });

  const scoreToOpacity = (score: number) => 0.15 + (score / 100) * 0.55;
  const scoreToRadius = (score: number) => 28 + (score / 100) * 32;

  return (
    <div
      className="relative bg-[#06090e] rounded-xl border border-white/6 overflow-hidden"
      style={{ height: H }}
    >
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hmGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hmGrid)" />
        </svg>
      </div>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
        <defs>
          {markets.map((m) => {
            const meta = TRAJECTORY_META[m.trajectory];
            const { x, y } = toXY(m.lat, m.lng);
            const _r = scoreToRadius(m.momentumScore);
            return (
              <radialGradient key={m.id} id={`hm-${m.id}`} cx="50%" cy="50%" r="50%">
                <stop
                  offset="0%"
                  stopColor={meta.barColor}
                  stopOpacity={scoreToOpacity(m.momentumScore)}
                />
                <stop offset="100%" stopColor={meta.barColor} stopOpacity={0} />
              </radialGradient>
            );
          })}
        </defs>
        {markets.map((m) => {
          const { x, y } = toXY(m.lat, m.lng);
          const r = scoreToRadius(m.momentumScore);
          return <circle key={`hm-blob-${m.id}`} cx={x} cy={y} r={r} fill={`url(#hm-${m.id})`} />;
        })}
        {markets.map((m) => {
          const { x, y } = toXY(m.lat, m.lng);
          const meta = TRAJECTORY_META[m.trajectory];
          const isSelected = selected?.id === m.id;
          return (
            <g key={m.id} onClick={() => onSelect(m)} style={{ cursor: 'pointer' }}>
              {isSelected && <circle cx={x} cy={y} r={16} fill={meta.barColor} fillOpacity={0.2} />}
              <circle cx={x} cy={y} r={isSelected ? 7 : 5} fill={meta.barColor} />
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 7 : 5}
                fill="none"
                stroke={meta.barColor}
                strokeWidth={2}
                strokeOpacity={0.4}
              />
              <foreignObject x={x + 10} y={y - 16} width={130} height={34}>
                <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-1.5 py-1">
                  <p className="text-[9px] font-semibold text-white leading-tight">{m.name}</p>
                  <p className="text-[9px]" style={{ color: meta.barColor }}>
                    Score {m.momentumScore} · {meta.label}
                  </p>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 text-[9px] text-white/30 flex items-center gap-1">
        <Layers className="w-3 h-3" />
        Neighborhood Momentum Heatmap
      </div>
    </div>
  );
}

function MarketCard({
  market,
  selected,
  onClick,
}: {
  market: MicroMarket;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = TRAJECTORY_META[market.trajectory];
  const Icon = meta.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border cursor-pointer transition-all duration-200',
        selected
          ? 'bg-white/4 border-white/15'
          : 'bg-[#0f1115] border-white/5 hover:border-white/10',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{market.name}</span>
            <span className="text-xs text-white/30">· {market.borough}</span>
            <div
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold',
                meta.bg,
              )}
            >
              <Icon className={cn('w-2.5 h-2.5', meta.color)} />
              <span className={meta.color}>{meta.label}</span>
            </div>
          </div>
          <div className="mt-2">
            <MomentumBar score={market.momentumScore} trajectory={market.trajectory} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>
              <p className="text-[9px] text-white/30">Price Δ (YoY)</p>
              <p
                className={cn(
                  'text-xs font-bold',
                  market.priceChangePct > 0 ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {market.priceChangePct > 0 ? '+' : ''}
                {market.priceChangePct}%
              </p>
            </div>
            <div>
              <p className="text-[9px] text-white/30">Inst. Capital</p>
              <p className="text-xs font-bold text-sky-400">${market.institutionalFlowM}M</p>
            </div>
            <div>
              <p className="text-[9px] text-white/30">Median Price</p>
              <p className="text-xs font-bold text-white/70">
                {formatCurrency(market.medianPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetailSidebar({ market, onClose }: { market: MicroMarket; onClose: () => void }) {
  const meta = TRAJECTORY_META[market.trajectory];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      className="flex flex-col bg-[#0a0c10] border-l border-white/6 overflow-hidden"
      style={{ width: 380, flexShrink: 0 }}
    >
      <div className="p-5 border-b border-white/6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">{market.name}</h3>
            <p className="text-xs text-white/40">{market.borough}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
          >
            <span className="text-white/30 text-lg leading-none">×</span>
          </button>
        </div>
        <div className={cn('flex items-center gap-2 mt-3 px-2 py-1.5 rounded-lg border', meta.bg)}>
          <Icon className={cn('w-4 h-4', meta.color)} />
          <span className={cn('text-sm font-semibold', meta.color)}>{meta.label}</span>
          <span className="ml-auto text-xs text-white/40">Score {market.momentumScore}/100</span>
        </div>
      </div>

      <div className="p-5 border-b border-white/6">
        <p className="text-xs text-white/50 leading-relaxed">{market.description}</p>
      </div>

      <div className="p-5 border-b border-white/6">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Momentum Metrics</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'Price Change YoY',
              value: `${market.priceChangePct > 0 ? '+' : ''}${market.priceChangePct}%`,
              color: market.priceChangePct > 0 ? 'text-emerald-400' : 'text-red-400',
            },
            {
              label: 'Permit Activity',
              value: `${market.permitActivity}/100`,
              color: 'text-sky-400',
            },
            {
              label: 'Institutional Flow',
              value: `$${market.institutionalFlowM}M`,
              color: 'text-purple-400',
            },
            {
              label: 'Population Growth',
              value: `${market.populationGrowthPct > 0 ? '+' : ''}${market.populationGrowthPct}%`,
              color: market.populationGrowthPct > 0 ? 'text-emerald-400' : 'text-red-400',
            },
            {
              label: 'Median Price',
              value: formatCurrency(market.medianPrice),
              color: 'text-white/80',
            },
            {
              label: 'Cap Rate Δ',
              value: `${market.capRateCompression > 0 ? '+' : ''}${market.capRateCompression}%`,
              color: market.capRateCompression < 0 ? 'text-emerald-400' : 'text-red-400',
            },
          ].map((m) => (
            <div key={m.label} className="bg-white/3 border border-white/5 rounded-lg p-2.5">
              <p className="text-[9px] text-white/30">{m.label}</p>
              <p className={cn('text-sm font-bold mt-0.5', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 flex-1">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">
          Key Momentum Signals
        </p>
        <div className="space-y-2">
          {market.topSignals.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: meta.barColor }}
              />
              <p className="text-xs text-white/60">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/6">
        <button className="w-full py-2.5 rounded-lg border border-[#40856a]/30 text-[#40856a] text-sm font-medium hover:bg-[#40856a]/10 transition-colors flex items-center justify-center gap-2">
          <Target className="w-4 h-4" />
          Find Distressed Properties Here
        </button>
      </div>
    </motion.div>
  );
}

export default function NeighborhoodMomentum() {
  const [, params] = useRoute<{ propertyId: string }>('/neighborhood-momentum/:propertyId');
  const propertyId = params?.propertyId;

  const { data: propertyData, isLoading: propertyLoading } = useStandardQuery({
    queryKey: ['terra-neighborhood-momentum', propertyId],
    queryFn: () => api.properties.neighborhoodMomentum(propertyId!),
    enabled: !!propertyId,
    staleTime: 300_000,
  });

  const {
    data: portfolioData,
    isLoading: portfolioLoading,
    isError: portfolioError,
  } = useStandardQuery({
    queryKey: ['terra-portfolio-neighborhood-momentum'],
    queryFn: () => api.portfolio.neighborhoodMomentum(),
    enabled: !propertyId,
    staleTime: 300_000,
  });

  const NEIGHBORHOODS: MicroMarket[] =
    (portfolioData?.neighborhoods as MicroMarket[] | undefined) ?? [];

  const [selected, setSelected] = useState<MicroMarket | null>(null);
  const [trajectoryFilter, setTrajectoryFilter] = useState<Trajectory | 'all'>('all');

  const filtered = NEIGHBORHOODS.filter(
    (m) => trajectoryFilter === 'all' || m.trajectory === trajectoryFilter,
  ).sort((a, b) => b.momentumScore - a.momentumScore);

  const ambientSignals: AmbientSignal[] = [
    {
      id: 'sig-1',
      domain: 'terra',
      title: 'Momentum Surge',
      summary: 'Neighborhood momentum score surged in 4 target markets',
      severity: 'medium',
      score: 0.71,
      timestamp: Date.now(),
    },
  ];
  const energyMetrics: EnergyMetrics = {
    apiCallsPerMinute: 92,
    wsMessagesPerMinute: 180,
    chartRendersPerMinute: 14,
    dataRefreshesPerMinute: 10,
    activeSubscriptions: 28,
    deferredUpdates: 3,
    totalBudget: 120,
    usedBudget: 62,
  };
  const correlations: CrossDomainCorrelation[] = [
    {
      id: 'cor-2',
      title: 'Port Congestion → Material Delays',
      description:
        'Port congestion signals from SEXTANT predict construction material delivery delays by 48 hours',
      domains: ['vessels', 'terra'],
      confidence: 0.84,
      timestamp: Date.now(),
      signals: [
        { domain: 'vessels', event: 'Shanghai port congestion +18%', severity: 'medium' },
        { domain: 'terra', event: 'Steel delivery delays in 3 projects', severity: 'high' },
      ],
      impact: 'high',
    },
  ];

  const summaryStats = {
    accelerating: NEIGHBORHOODS.filter((n) => n.trajectory === 'accelerating').length,
    gentrifying: NEIGHBORHOODS.filter((n) => n.trajectory === 'gentrifying').length,
    declining: NEIGHBORHOODS.filter(
      (n) => n.trajectory === 'declining' || n.trajectory === 'distressed',
    ).length,
    totalInstitutional: NEIGHBORHOODS.reduce((s, n) => s + n.institutionalFlowM, 0),
  };

  if (propertyId) {
    const d = propertyData?.data;
    const trajectoryMeta = d ? TRAJECTORY_META[d.trajectory as Trajectory] : null;
    return (
      <div className="min-h-screen p-6" style={{ background: '#0a0c10' }}>
        <div className="max-w-5xl mx-auto">
          <Link href={`/property/${propertyId}`}>
            <span
              className="inline-flex items-center gap-1 text-xs mb-5 cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Property
            </span>
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Neighborhood Momentum</h1>
            {d && trajectoryMeta && (
              <span
                className={cn(
                  'text-[9px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide',
                  trajectoryMeta.bg,
                  trajectoryMeta.color,
                )}
              >
                {trajectoryMeta.label}
              </span>
            )}
          </div>
          <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Micro-market trajectory &amp; institutional capital flow analysis for property{' '}
            <code className="text-emerald-400">{propertyId}</code>
          </p>

          {propertyLoading || !d ? (
            <div
              className="flex items-center gap-3 p-8 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Fetching momentum data…
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  {
                    label: 'Momentum Score',
                    value: d.momentumScore.toString(),
                    color:
                      d.momentumScore >= 70
                        ? '#34d399'
                        : d.momentumScore >= 45
                          ? '#60a5fa'
                          : '#f87171',
                    sub: trajectoryMeta?.label ?? '',
                  },
                  {
                    label: 'Institutional Flow',
                    value: `$${Math.abs(d.institutionalFlowM)}M`,
                    color: d.institutionalFlowM >= 0 ? '#34d399' : '#ef4444',
                    sub: d.institutionalFlowM >= 0 ? 'inflows' : 'outflows',
                  },
                  {
                    label: '12m Price Growth',
                    value: `${d.priceAppreciation12m > 0 ? '+' : ''}${d.priceAppreciation12m}%`,
                    color: d.priceAppreciation12m >= 0 ? '#34d399' : '#ef4444',
                    sub: 'trailing 12 months',
                  },
                  {
                    label: 'Walk Score',
                    value: d.walkScore.toString(),
                    color: '#60a5fa',
                    sub: `Transit: ${d.transitScore}`,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p
                      className="text-[9px] uppercase tracking-wider mb-1"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {m.label}
                    </p>
                    <p className="text-xl font-bold" style={{ color: m.color }}>
                      {m.value}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {m.sub}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl p-5 mb-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-sm font-semibold text-white mb-3">Market Signals</p>
                <div className="space-y-2">
                  {(d.topSignals as string[]).map((sig: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <p className="text-xs text-white/70">{sig}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl p-5 mb-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-sm font-semibold text-white mb-3">Micro-Market Comparison</p>
                <div className="space-y-3">
                  {d.microMarkets.map((mm) => {
                    const meta = TRAJECTORY_META[mm.trajectory as Trajectory];
                    return (
                      <div key={mm.name} className="flex items-center gap-4">
                        <div className="w-36 shrink-0">
                          <p className="text-xs text-white/70">{mm.name}</p>
                          <span className={cn('text-[9px] font-semibold', meta?.color ?? '')}>
                            {meta?.label}
                          </span>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${mm.score}%`,
                              background: meta?.barColor ?? '#94a3b8',
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white/70 w-8 text-right">
                          {mm.score}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] w-12 text-right',
                            mm.deltaQoQ >= 0 ? 'text-emerald-400' : 'text-red-400',
                          )}
                        >
                          {mm.deltaQoQ >= 0 ? '+' : ''}
                          {mm.deltaQoQ}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Retail Vacancy',
                    value: `${d.retailVacancyPct}%`,
                    color: d.retailVacancyPct < 10 ? '#34d399' : '#f97316',
                  },
                  {
                    label: 'Median HH Income',
                    value: formatCurrency(d.medianHHIncome),
                    color: '#60a5fa',
                  },
                  {
                    label: 'Income Growth 5yr',
                    value: `${d.incomeGrowth5y > 0 ? '+' : ''}${d.incomeGrowth5y}%`,
                    color: d.incomeGrowth5y >= 0 ? '#34d399' : '#ef4444',
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p
                      className="text-[9px] uppercase tracking-wider mb-1"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {m.label}
                    </p>
                    <p className="text-base font-bold" style={{ color: m.color }}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[9px] mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Source: {d.dataSource}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (portfolioLoading || (!portfolioData && !portfolioError)) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: '#0a0c10' }}>
        <div
          className="flex items-center gap-3 px-6 py-4 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <p className="text-sm text-white/50">Loading neighborhood portfolio…</p>
        </div>
      </div>
    );
  }

  if (portfolioError) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: '#0a0c10' }}>
        <div
          className="px-6 py-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <p className="text-sm text-red-400">Unable to load neighborhood portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-white/6">
          <AmbientBar signals={ambientSignals} appDomain="terra" accentColor="#22c55e" compact />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#40856a]" />
                Neighborhood Momentum Score
              </h1>
              <p className="text-xs text-white/40 mt-1">
                Micro-market trajectory analysis — gentrification indicators, capital flows, and
                entry timing intelligence
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              {
                label: 'Accelerating Markets',
                value: summaryStats.accelerating.toString(),
                color: 'text-emerald-400',
              },
              {
                label: 'Gentrifying Markets',
                value: summaryStats.gentrifying.toString(),
                color: 'text-sky-400',
              },
              {
                label: 'Declining / Distressed',
                value: summaryStats.declining.toString(),
                color: 'text-red-400',
              },
              {
                label: 'Institutional Capital Flow',
                value: `$${(summaryStats.totalInstitutional / 1000).toFixed(1)}B`,
                color: 'text-purple-400',
              },
            ].map((m) => (
              <div key={m.label} className="bg-white/2 border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-white/30 uppercase tracking-wider">{m.label}</p>
                <p className={cn('text-xl font-bold mt-1', m.color)}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-b border-white/6 flex items-center gap-2">
          {(
            ['all', 'accelerating', 'gentrifying', 'stable', 'declining', 'distressed'] as const
          ).map((t) => {
            const meta = t !== 'all' ? TRAJECTORY_META[t] : null;
            return (
              <button
                key={t}
                onClick={() => setTrajectoryFilter(t)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs border transition-colors font-medium',
                  trajectoryFilter === t
                    ? meta
                      ? `${meta.bg} ${meta.color} border-current/40`
                      : 'bg-white/8 text-white border-white/20'
                    : 'text-white/30 border-white/8 hover:border-white/15 hover:text-white/50',
                )}
              >
                {t === 'all' ? 'All' : TRAJECTORY_META[t].label}
              </button>
            );
          })}
          <span className="ml-auto text-xs text-white/30">{filtered.length} neighborhoods</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <HeatmapCanvas markets={filtered} selected={selected} onSelect={setSelected} />
          <div className="space-y-2 mt-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-3">
              Ranked by Momentum Score
            </p>
            {filtered.map((m) => (
              <MarketCard
                key={m.id}
                market={m}
                selected={selected?.id === m.id}
                onClick={() => setSelected(m)}
              />
            ))}
          </div>
        </div>
      </div>

      {selected && <DetailSidebar market={selected} onClose={() => setSelected(null)} />}

      <div className="absolute bottom-0 left-0 right-0 bg-[#060810]/95 border-t border-white/5 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <CorrelationFeed
              correlations={correlations}
              currentDomain="terra"
              accentColor="#22c55e"
            />
          </div>
          <div className="flex items-start justify-center">
            <EnergyPulse
              metrics={energyMetrics}
              utilization={energyMetrics.usedBudget / energyMetrics.totalBudget}
              accentColor="#22c55e"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
