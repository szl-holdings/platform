import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Fuel,
  MapPin,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface BunkerPort {
  port: string;
  country: string;
  code: string;
  vlsfo: number;
  lsmgo: number;
  mdo: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  availability: 'good' | 'limited' | 'unavailable';
  leadTime: string;
  supplierCount: number;
}

interface RouteOptimization {
  vessel: string;
  route: string;
  currentPlan: { port: string; qty: number; fuel: string; cost: number }[];
  optimizedPlan: {
    port: string;
    qty: number;
    fuel: string;
    cost: number;
    saving: number;
    reason: string;
  }[];
  totalSaving: number;
  co2Saving: number;
  recommendation: string;
}

const BUNKER_PORTS: BunkerPort[] = [
  {
    port: 'Rotterdam',
    country: 'NL',
    code: 'NLRTM',
    vlsfo: 598,
    lsmgo: 718,
    mdo: 742,
    trend: 'down',
    change: -12,
    availability: 'good',
    leadTime: '24h',
    supplierCount: 14,
  },
  {
    port: 'Singapore',
    country: 'SG',
    code: 'SGSIN',
    vlsfo: 612,
    lsmgo: 742,
    mdo: 768,
    trend: 'up',
    change: +8,
    availability: 'good',
    leadTime: '12h',
    supplierCount: 22,
  },
  {
    port: 'Fujairah',
    country: 'AE',
    code: 'AEJEA',
    vlsfo: 604,
    lsmgo: 724,
    mdo: 748,
    trend: 'stable',
    change: 0,
    availability: 'good',
    leadTime: '18h',
    supplierCount: 9,
  },
  {
    port: 'Houston',
    country: 'US',
    code: 'USHSL',
    vlsfo: 618,
    lsmgo: 748,
    mdo: 772,
    trend: 'up',
    change: +14,
    availability: 'good',
    leadTime: '36h',
    supplierCount: 11,
  },
  {
    port: 'Busan',
    country: 'KR',
    code: 'KRPUS',
    vlsfo: 608,
    lsmgo: 736,
    mdo: 760,
    trend: 'down',
    change: -6,
    availability: 'good',
    leadTime: '24h',
    supplierCount: 8,
  },
  {
    port: 'Las Palmas',
    country: 'ES',
    code: 'ESLPA',
    vlsfo: 594,
    lsmgo: 716,
    mdo: 740,
    trend: 'down',
    change: -4,
    availability: 'limited',
    leadTime: '48h',
    supplierCount: 5,
  },
  {
    port: 'Colombo',
    country: 'LK',
    code: 'LKCMB',
    vlsfo: 616,
    lsmgo: 744,
    mdo: 768,
    trend: 'stable',
    change: +2,
    availability: 'good',
    leadTime: '24h',
    supplierCount: 4,
  },
  {
    port: 'Gibraltar',
    country: 'GI',
    code: 'GIGIB',
    vlsfo: 602,
    lsmgo: 720,
    mdo: 744,
    trend: 'up',
    change: +5,
    availability: 'good',
    leadTime: '12h',
    supplierCount: 7,
  },
];

const OPTIMIZATIONS: RouteOptimization[] = [
  {
    vessel: 'Pacific Navigator',
    route: 'Rotterdam → Zhoushan',
    currentPlan: [{ port: 'Singapore', qty: 3200, fuel: 'VLSFO', cost: 1_958_400 }],
    optimizedPlan: [
      {
        port: 'Fujairah',
        qty: 1800,
        fuel: 'VLSFO',
        cost: 1_087_200,
        saving: 54_900,
        reason: 'Fujairah $14/MT cheaper than Singapore, partial uplift saves deviation cost',
      },
      {
        port: 'Singapore',
        qty: 1400,
        fuel: 'VLSFO',
        cost: 856_800,
        saving: 14_400,
        reason: 'Reduce Singapore uplift volume, buy remainder at Fujairah',
      },
    ],
    totalSaving: 69_300,
    co2Saving: 0,
    recommendation:
      'Split bunker between Fujairah (1,800MT) and Singapore (1,400MT) — saves $69K vs full Singapore uplift',
  },
  {
    vessel: 'Arctic Breeze',
    route: 'Rotterdam → Sodegaura (LNG Tanker)',
    currentPlan: [{ port: 'Singapore', qty: 2200, fuel: 'LNG', cost: 1_073_600 }],
    optimizedPlan: [
      {
        port: 'Singapore',
        qty: 2200,
        fuel: 'LNG',
        cost: 1_073_600,
        saving: 0,
        reason: 'LNG advantage vs VLSFO maintained: $124/MT differential',
      },
    ],
    totalSaving: 124 * 2200,
    co2Saving: 18.4,
    recommendation:
      'Maintain LNG procurement at Singapore — price advantage $124/MT over VLSFO saves $272,800 with 18.4% CO₂ reduction',
  },
  {
    vessel: 'Meridian Bulk',
    route: 'Port Hedland → Ningbo',
    currentPlan: [{ port: 'Singapore', qty: 2400, fuel: 'VLSFO', cost: 1_468_800 }],
    optimizedPlan: [
      {
        port: 'Colombo',
        qty: 1200,
        fuel: 'VLSFO',
        cost: 739_200,
        saving: 24_000,
        reason: 'Colombo $4/MT cheaper; minor deviation en route',
      },
      {
        port: 'Singapore',
        qty: 1200,
        fuel: 'VLSFO',
        cost: 734_400,
        saving: 0,
        reason: 'Balance remaining requirement at Singapore',
      },
    ],
    totalSaving: 24_000,
    co2Saving: 0,
    recommendation:
      'Split bunker: Colombo (1,200MT) and Singapore (1,200MT) — modest $24K saving with minimal deviation penalty',
  },
];

const availColor: Record<string, string> = {
  good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  limited: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  unavailable: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const trendColor: Record<string, string> = {
  up: 'text-red-400',
  down: 'text-emerald-400',
  stable: 'text-sky-400/40',
};

export default function BunkerOptimizerPage() {
  const [sortBy, setSortBy] = useState<'vlsfo' | 'lsmgo' | 'mdo'>('vlsfo');
  const [selectedVessel, setSelectedVessel] = useState(OPTIMIZATIONS[0].vessel);

  const sorted = [...BUNKER_PORTS].sort((a, b) => a[sortBy] - b[sortBy]);
  const optimization = OPTIMIZATIONS.find((o) => o.vessel === selectedVessel) ?? OPTIMIZATIONS[0];

  const totalSavings = OPTIMIZATIONS.reduce((a, o) => a + o.totalSaving, 0);
  const cheapestVLSFO = Math.min(...BUNKER_PORTS.map((p) => p.vlsfo));
  const mostExpensiveVLSFO = Math.max(...BUNKER_PORTS.map((p) => p.vlsfo));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
          <Fuel className="w-5 h-5 text-amber-400" />
          Bunker Procurement Optimizer
        </h1>
        <p className="text-xs text-sky-400/50 mt-0.5">
          Multi-port fuel price comparison and optimal bunkering route recommendations factoring
          voyage economics
        </p>
        <Badge variant="outline" className="text-[9px] mt-1 text-sky-400/30 border-sky-500/15">
          Simulated data — for demonstration purposes
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Monitored Ports',
            value: BUNKER_PORTS.length,
            color: 'text-sky-300',
            icon: MapPin,
          },
          {
            label: 'Fleet Saving Potential',
            value: `$${(totalSavings / 1000).toFixed(0)}K`,
            color: 'text-emerald-400',
            icon: TrendingDown,
          },
          {
            label: 'Cheapest VLSFO',
            value: `$${cheapestVLSFO}/MT`,
            color: 'text-emerald-400',
            icon: Fuel,
          },
          {
            label: 'Spread (Hi/Lo)',
            value: `$${mostExpensiveVLSFO - cheapestVLSFO}/MT`,
            color: 'text-amber-400',
            icon: BarChart3,
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn('w-3.5 h-3.5', s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">
              Live Bunker Price Comparison
            </span>
          </div>
          <div className="flex gap-1">
            {(['vlsfo', 'lsmgo', 'mdo'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSortBy(f)}
                className={cn(
                  'text-[10px] px-2.5 py-1 rounded border uppercase transition-all',
                  sortBy === f
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    : 'border-sky-500/10 text-sky-400/40 hover:text-sky-300',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-sky-500/5">
          {sorted.map((p, i) => (
            <div
              key={p.code}
              className="px-4 py-3 flex items-center gap-4 hover:bg-sky-500/5 transition-colors"
            >
              <span className="text-[10px] text-sky-400/30 w-4 shrink-0">{i + 1}</span>
              <div className="w-28 shrink-0">
                <p className="text-xs font-bold text-sky-200">{p.port}</p>
                <p className="text-[9px] text-sky-400/40">
                  {p.country} · {p.code}
                </p>
              </div>
              <div className="flex gap-4 flex-1">
                {['vlsfo', 'lsmgo', 'mdo'].map((fuel) => (
                  <div
                    key={fuel}
                    className={cn(
                      'text-center min-w-0',
                      fuel === sortBy ? 'opacity-100' : 'opacity-60',
                    )}
                  >
                    <p className="text-[9px] text-sky-400/30 uppercase">{fuel}</p>
                    <p
                      className={cn(
                        'text-xs font-mono font-bold',
                        i === 0 && fuel === sortBy
                          ? 'text-emerald-400'
                          : i === sorted.length - 1 && fuel === sortBy
                            ? 'text-red-400'
                            : 'text-sky-300',
                      )}
                    >
                      ${p[fuel as keyof BunkerPort] as number}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('text-[10px] font-mono', trendColor[p.trend])}>
                  {p.trend === 'up' ? '+' : p.trend === 'down' ? '' : '±'}
                  {p.change !== 0 ? `$${Math.abs(p.change)}` : '$0'}
                </span>
                {p.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-red-400" />
                ) : p.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-emerald-400" />
                ) : null}
              </div>
              <Badge
                variant="outline"
                className={cn('text-[9px] shrink-0', availColor[p.availability])}
              >
                {p.availability}
              </Badge>
              <span className="text-[9px] text-sky-400/30 w-8 shrink-0">{p.leadTime}</span>
              <span className="text-[9px] text-sky-400/30 w-10 shrink-0">
                {p.supplierCount} sup.
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">
              Voyage Optimization Recommendations
            </span>
          </div>
          <div className="flex gap-1">
            {OPTIMIZATIONS.map((o) => (
              <button
                key={o.vessel}
                onClick={() => setSelectedVessel(o.vessel)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded border transition-all',
                  selectedVessel === o.vessel
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    : 'border-sky-500/10 text-sky-400/40 hover:text-sky-300',
                )}
              >
                {o.vessel.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-sky-100">{optimization.vessel}</p>
              <p className="text-[10px] text-sky-400/50">{optimization.route}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold font-mono text-emerald-400">
                ${(optimization.totalSaving / 1000).toFixed(0)}K saved
              </p>
              {optimization.co2Saving > 0 && (
                <p className="text-[10px] text-emerald-400/60">↓ {optimization.co2Saving}% CO₂</p>
              )}
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Recommendation
            </p>
            <p className="text-xs text-emerald-300/80">{optimization.recommendation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">
                Current Plan
              </p>
              {optimization.currentPlan.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-sky-500/5 rounded-lg border border-sky-500/10 mb-2"
                >
                  <Fuel className="w-3 h-3 text-sky-400/40 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-sky-200">
                      {s.port} · {s.qty.toLocaleString()}MT {s.fuel}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-sky-300">
                    ${(s.cost / 1000).toFixed(0)}K
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[9px] text-emerald-400 uppercase tracking-wider mb-2">
                Optimized Plan
              </p>
              {optimization.optimizedPlan.map((s, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/15 mb-2"
                >
                  <div className="flex items-center gap-3">
                    <Fuel className="w-3 h-3 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-sky-200">
                        {s.port} · {s.qty.toLocaleString()}MT {s.fuel}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">
                      ${(s.cost / 1000).toFixed(0)}K
                    </span>
                  </div>
                  {s.saving > 0 && (
                    <p className="text-[9px] text-emerald-400/60 mt-1 ml-6">
                      Saves ${(s.saving / 1000).toFixed(0)}K — {s.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
