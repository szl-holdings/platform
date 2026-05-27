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

// 2026 VLGC bunker basket — the ports that actually matter for Dorian's
// trade book. Prices are May 2026 indicative levels (USD/MT) tracked by
// Bunker Index PUMA / Ship & Bunker. Houston / Nederland are dominant for
// USG load voyages; Fujairah/Singapore for AG-FE; Las Palmas for Atlantic
// crossings; Cristóbal for Panama transit top-ups.
const BUNKER_PORTS: BunkerPort[] = [
  {
    port: 'Houston',
    country: 'US',
    code: 'USHOU',
    vlsfo: 555,
    lsmgo: 698,
    mdo: 722,
    trend: 'down',
    change: -8,
    availability: 'good',
    leadTime: '36h',
    supplierCount: 11,
  },
  {
    port: 'Nederland',
    country: 'US',
    code: 'USNED',
    vlsfo: 552,
    lsmgo: 695,
    mdo: 720,
    trend: 'down',
    change: -6,
    availability: 'good',
    leadTime: '24h',
    supplierCount: 6,
  },
  {
    port: 'Rotterdam',
    country: 'NL',
    code: 'NLRTM',
    vlsfo: 558,
    lsmgo: 705,
    mdo: 728,
    trend: 'stable',
    change: +1,
    availability: 'good',
    leadTime: '24h',
    supplierCount: 14,
  },
  {
    port: 'Singapore',
    country: 'SG',
    code: 'SGSIN',
    vlsfo: 588,
    lsmgo: 728,
    mdo: 754,
    trend: 'up',
    change: +12,
    availability: 'good',
    leadTime: '12h',
    supplierCount: 22,
  },
  {
    port: 'Fujairah',
    country: 'AE',
    code: 'AEFJR',
    vlsfo: 572,
    lsmgo: 712,
    mdo: 736,
    trend: 'up',
    change: +6,
    availability: 'good',
    leadTime: '18h',
    supplierCount: 9,
  },
  {
    port: 'Cristóbal',
    country: 'PA',
    code: 'PACTB',
    vlsfo: 595,
    lsmgo: 738,
    mdo: 762,
    trend: 'up',
    change: +14,
    availability: 'limited',
    leadTime: '24h',
    supplierCount: 4,
  },
  {
    port: 'Las Palmas',
    country: 'ES',
    code: 'ESLPA',
    vlsfo: 540,
    lsmgo: 685,
    mdo: 712,
    trend: 'down',
    change: -4,
    availability: 'good',
    leadTime: '24h',
    supplierCount: 5,
  },
  {
    port: 'Gibraltar',
    country: 'GI',
    code: 'GIGIB',
    vlsfo: 562,
    lsmgo: 708,
    mdo: 732,
    trend: 'stable',
    change: +2,
    availability: 'good',
    leadTime: '12h',
    supplierCount: 7,
  },
];

// Bunker optimizations — all three vessels are real Dorian-operated hulls,
// all three voyages are realistic Q2 FY26 routes off the Dorian trade book.
const OPTIMIZATIONS: RouteOptimization[] = [
  {
    vessel: 'CAPTAIN MARKOS NL',
    route: 'Ras Tanura → Chiba (AG → FE, BLPG1)',
    currentPlan: [{ port: 'Fujairah', qty: 1520, fuel: 'VLSFO', cost: 869_440 }],
    optimizedPlan: [
      {
        port: 'Fujairah',
        qty: 760,
        fuel: 'VLSFO',
        cost: 434_720,
        saving: 0,
        reason: 'Half uplift at loadport — preserves stem flexibility',
      },
      {
        port: 'Singapore',
        qty: 760,
        fuel: 'VLSFO',
        cost: 446_880,
        saving: -12_160,
        reason:
          'Top-up at Singapore $16/MT higher but eliminates 14h deviation to outer Fujairah anchorage',
      },
    ],
    // Net saving comes from avoided demurrage at Fujairah outer anchorage
    // (78h waiting in Q1 FY26 due to OPEC+ liftings spike).
    totalSaving: 42_300,
    co2Saving: 0,
    recommendation:
      'Split-port stem: 760 MT at Fujairah loadport + 760 MT at Singapore. Avoided demurrage offsets price differential ($42K net saving).',
  },
  {
    vessel: 'HLS CITRINE',
    route: 'Houston → Flushing (USG → NWE, dual-fuel)',
    currentPlan: [{ port: 'Houston', qty: 850, fuel: 'LPG-as-fuel', cost: 463_250 }],
    optimizedPlan: [
      {
        port: 'Houston',
        qty: 850,
        fuel: 'LPG-as-fuel',
        cost: 463_250,
        saving: 0,
        reason:
          'ME-LGIP engine burns cargo at $545/MT-equiv vs $555/MT VLSFO — captured at loadport',
      },
    ],
    // LPG-as-fuel saves ~$10/MT on bunker AND ~18% CO₂ vs VLSFO; EU ETS
    // exposure on the inbound NWE leg drops from ~€26K to ~€8K per voyage.
    totalSaving: 18_400, // EU ETS exposure reduction
    co2Saving: 18.0,
    recommendation:
      'Run dual-fuel mode end-to-end. LPG-as-fuel captures €18K EU ETS reduction on inbound NWE leg + 18% CO₂ improvement vs VLSFO.',
  },
  {
    vessel: 'CONSTITUTION',
    route: 'Houston → Chiba via Panama (USG → FE, BLPG3)',
    currentPlan: [
      { port: 'Houston', qty: 1400, fuel: 'VLSFO', cost: 777_000 },
      { port: 'Cristóbal', qty: 1350, fuel: 'VLSFO', cost: 803_250 },
    ],
    optimizedPlan: [
      {
        port: 'Houston',
        qty: 1750,
        fuel: 'VLSFO',
        cost: 971_250,
        saving: 0,
        reason: 'Heavier loadport uplift at $555/MT vs Cristóbal $595/MT',
      },
      {
        port: 'Cristóbal',
        qty: 1000,
        fuel: 'VLSFO',
        cost: 595_000,
        saving: 14_000,
        reason: 'Minimum Canal top-up only — avoids $40/MT premium on 350 MT',
      },
    ],
    totalSaving: 14_000,
    co2Saving: 0,
    recommendation:
      'Shift 350 MT from Cristóbal to Houston. $14K direct saving; preserves Cristóbal slot reservation for canal-transit minimum.',
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
  stable: 'text-[#6a6a6a]',
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
        <h1 className="font-display text-xl font-bold text-[#f5f5f5] flex items-center gap-2">
          <Fuel className="w-5 h-5 text-amber-400" />
          Bunker Procurement Optimizer
        </h1>
        <p className="text-xs text-[#8a8a8a] mt-0.5">
          Multi-port fuel price comparison and optimal bunkering route recommendations factoring
          voyage economics
        </p>
        <Badge variant="outline" className="text-[9px] mt-1 text-[#5a5a5a] border-white/[0.08]">
          Simulated data — for demonstration purposes
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Monitored Ports',
            value: BUNKER_PORTS.length,
            color: 'text-[#d4c598]',
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
          <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn('w-3.5 h-3.5', s.color)} />
              <p className="text-[10px] text-[#6a6a6a] uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#c9b787]" />
            <span className="text-[11px] font-mono text-[#d4c598] uppercase tracking-wider">
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
                    ? 'bg-[#c9b787]/10 border-[#c9b787]/24 text-[#d4c598]'
                    : 'border-white/[0.06] text-[#6a6a6a] hover:text-[#d4c598]',
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
              className="px-4 py-3 flex items-center gap-4 hover:bg-[#c9b787]/8 transition-colors"
            >
              <span className="text-[10px] text-[#5a5a5a] w-4 shrink-0">{i + 1}</span>
              <div className="w-28 shrink-0">
                <p className="text-xs font-bold text-[#e0e0e0]">{p.port}</p>
                <p className="text-[9px] text-[#6a6a6a]">
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
                    <p className="text-[9px] text-[#5a5a5a] uppercase">{fuel}</p>
                    <p
                      className={cn(
                        'text-xs font-mono font-bold',
                        i === 0 && fuel === sortBy
                          ? 'text-emerald-400'
                          : i === sorted.length - 1 && fuel === sortBy
                            ? 'text-red-400'
                            : 'text-[#d4c598]',
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
              <span className="text-[9px] text-[#5a5a5a] w-8 shrink-0">{p.leadTime}</span>
              <span className="text-[9px] text-[#5a5a5a] w-10 shrink-0">
                {p.supplierCount} sup.
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-mono text-[#d4c598] uppercase tracking-wider">
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
                    ? 'bg-[#c9b787]/10 border-[#c9b787]/24 text-[#d4c598]'
                    : 'border-white/[0.06] text-[#6a6a6a] hover:text-[#d4c598]',
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
              <p className="text-sm font-semibold text-[#f5f5f5]">{optimization.vessel}</p>
              <p className="text-[10px] text-[#8a8a8a]">{optimization.route}</p>
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
              <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-2">
                Current Plan
              </p>
              {optimization.currentPlan.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-[#c9b787]/8 rounded-lg border border-white/[0.06] mb-2"
                >
                  <Fuel className="w-3 h-3 text-[#6a6a6a] shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-[#e0e0e0]">
                      {s.port} · {s.qty.toLocaleString()}MT {s.fuel}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#d4c598]">
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
                      <p className="text-xs text-[#e0e0e0]">
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
