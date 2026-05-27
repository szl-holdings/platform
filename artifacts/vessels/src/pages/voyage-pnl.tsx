import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Anchor,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Fuel,
  Navigation,
  Ship,
  Sliders,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocation } from 'wouter';
import { fireBriefSignal } from '../lib/briefSignal';
import { type FreightBenchmark, formatAsOf, useFreightBenchmarks } from '../lib/freight-benchmarks';

type VoyageBenchmark = Pick<
  FreightBenchmark,
  'tce' | 'changePct' | 'fleetAvg' | 'topQuartile' | 'bottomQuartile'
>;

// Voyage P&L scenarios for the Dorian LPG VLGC trade book.
// Cargo quantities (~44–46k MT per VLGC = ~84k cbm of propane @ ρ≈0.52 t/m³).
// TCE / spot rate basis: Baltic Ras Tanura–Chiba (BLPG1) and Houston–Chiba
// (BLPG3) — Q4 FY25 averaged $35.3K TCE/day; FY26 recovered to ~$45–55K/day.
// Bunker burn for a 17-knot VLGC laden + ballast ≈ 38 MT VLSFO/day at sea.
const VOYAGES = [
  {
    id: 'VOY-DLPG-26-041',
    vessel: 'CAPTAIN MARKOS NL',
    type: 'VLGC (82k cbm)',
    from: 'Ras Tanura, Saudi Arabia',
    to: 'Chiba, Japan',
    cargo: 'LPG (Propane)',
    cargoMT: 44000,
    // Baltic Ras Tanura–Chiba (BLPG1) ≈ $75/MT in May 2026
    freightRate: 75.0,
    status: 'Loading',
    departureETA: 'May 30, 2026',
    distanceNM: 6480,
    baseDaysAtSea: 22,
    scenarios: {
      base: {
        label: 'Base — Baltic Index BLPG1 $75/MT',
        // 22 days at sea × 38 MT/day round-trip incl ballast leg = 1,520 MT
        fuelMT: 1520,
        bunkerprice: 570,
        fuelCost: 866400,
        portCost: 195000,
        canalCost: 0,
        canalName: 'None — Strait of Malacca direct',
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 1061400,
        // 44,000 MT × $75/MT
        grossRevenue: 3300000,
        netRevenue: 2238600,
        margin: 67.8,
        irr: 18.4,
      },
      optimistic: {
        label: 'Tight market — BLPG1 spikes to $92/MT',
        fuelMT: 1460,
        bunkerprice: 540,
        fuelCost: 788400,
        portCost: 188000,
        canalCost: 0,
        canalName: 'None — Strait of Malacca direct',
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 976400,
        grossRevenue: 4048000,
        netRevenue: 3071600,
        margin: 75.9,
        irr: 25.2,
      },
      pessimistic: {
        label: 'Arb collapse + Hormuz war-risk premium',
        fuelMT: 1640,
        bunkerprice: 640,
        fuelCost: 1049600,
        portCost: 245000,
        canalCost: 0,
        canalName: 'None — Strait of Malacca direct',
        weatherDelay: 1.5,
        delayCost: 78000,
        totalCost: 1372600,
        // Rate compression to $58/MT (1H FY25 low) + $180K war-risk surcharge
        grossRevenue: 2552000,
        netRevenue: 1179400,
        margin: 46.2,
        irr: 7.8,
      },
    },
  },
  {
    id: 'VOY-DLPG-26-042',
    vessel: 'CONSTITUTION',
    type: 'VLGC ECO (84k cbm)',
    from: 'Houston, USA',
    to: 'Chiba, Japan',
    cargo: 'LPG (Propane)',
    cargoMT: 45000,
    // Baltic Houston–Chiba (BLPG3) ≈ $130/MT in May 2026
    freightRate: 130.0,
    status: 'Pre-departure',
    departureETA: 'Jun 02, 2026',
    distanceNM: 9180,
    baseDaysAtSea: 35,
    scenarios: {
      base: {
        label: 'Base — Panama Canal transit (Neopanamax slot)',
        // 35 days × 38 MT/day = 1,330 MT laden + ballast back ~38d = 2,750 MT
        fuelMT: 2750,
        bunkerprice: 560,
        fuelCost: 1540000,
        portCost: 285000,
        canalCost: 535000, // Panama Canal LPG/Neopanamax toll incl reservation
        canalName: 'Panama Canal — Neopanamax lock',
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 2360000,
        // 45,000 MT × $130/MT
        grossRevenue: 5850000,
        netRevenue: 3490000,
        margin: 59.7,
        irr: 21.6,
      },
      optimistic: {
        label: 'Strong arb — BLPG3 $158/MT, fast Canal slot',
        fuelMT: 2680,
        bunkerprice: 540,
        fuelCost: 1447200,
        portCost: 278000,
        canalCost: 510000,
        canalName: 'Panama Canal — booked slot',
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 2235200,
        grossRevenue: 7110000,
        netRevenue: 4874800,
        margin: 68.6,
        irr: 31.4,
      },
      pessimistic: {
        label: 'Canal drought rerouting via Cape of Good Hope',
        // Cape route adds ~16 days + zero canal fee, but burns 1,200MT extra
        fuelMT: 3950,
        bunkerprice: 605,
        fuelCost: 2389750,
        portCost: 312000,
        canalCost: 0,
        canalName: 'Cape of Good Hope (Panama drought reroute)',
        weatherDelay: 2.0,
        delayCost: 140000,
        totalCost: 2841750,
        grossRevenue: 4905000, // discount for delivery window slip
        netRevenue: 2063250,
        margin: 42.1,
        irr: 9.7,
      },
    },
  },
  {
    id: 'VOY-DLPG-26-043',
    vessel: 'HLS CITRINE',
    type: 'VLGC Dual-Fuel (86k cbm)',
    from: 'Houston, USA',
    to: 'Flushing, Netherlands',
    cargo: 'LPG (Mixed)',
    cargoMT: 46000,
    // Houston–NWE ≈ $52/MT in May 2026
    freightRate: 52.0,
    status: 'At sea',
    departureETA: 'May 18, 2026',
    distanceNM: 5180,
    baseDaysAtSea: 17,
    scenarios: {
      base: {
        label: 'Base — burning LPG-as-fuel (dual-fuel ECO mode)',
        // Dual-fuel ME-LGIP engine burns ~25 MT/day LPG-as-fuel vs 38 MT VLSFO
        fuelMT: 850, // LPG cargo consumed as fuel
        bunkerprice: 545, // LPG-as-fuel cost equivalent
        fuelCost: 463250,
        portCost: 195000,
        canalCost: 0,
        canalName: 'None — direct Atlantic crossing',
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 658250,
        // 46,000 MT × $52/MT
        grossRevenue: 2392000,
        netRevenue: 1733750,
        margin: 72.5,
        // CII rating boost from LPG-as-fuel raises asset utilisation premium
        irr: 22.4,
      },
      optimistic: {
        label: 'Strong NWE pull + carbon-price advantage',
        fuelMT: 820,
        bunkerprice: 520,
        fuelCost: 426400,
        portCost: 188000,
        canalCost: 0,
        canalName: 'None — direct Atlantic crossing',
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 614400,
        // NWE rate spike + €78/tCO₂ EU ETS premium captured by dual-fuel
        grossRevenue: 2622000,
        netRevenue: 2007600,
        margin: 76.6,
        irr: 28.1,
      },
      pessimistic: {
        label: 'North Atlantic depression + bunker-fuel switchover',
        // Storms force engine reversion to VLSFO mode mid-voyage
        fuelMT: 1280,
        bunkerprice: 615,
        fuelCost: 787200,
        portCost: 245000,
        canalCost: 0,
        canalName: 'None — direct Atlantic crossing',
        weatherDelay: 3.5,
        delayCost: 156000,
        totalCost: 1188200,
        grossRevenue: 2208000,
        netRevenue: 1019800,
        margin: 46.2,
        irr: 10.3,
      },
    },
  },
];

type ScenarioKey = 'base' | 'optimistic' | 'pessimistic';

const scenarioColors: Record<ScenarioKey, string> = {
  base: '#38bdf8',
  optimistic: '#22c55e',
  pessimistic: '#ef4444',
};

function fmtMoney(n: number, decimals = 0) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(decimals)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function VoyagePnLCard({
  voyage,
  benchmark,
}: {
  voyage: (typeof VOYAGES)[0];
  benchmark: VoyageBenchmark | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [scenario, setScenario] = useState<ScenarioKey>('base');
  const [, navigate] = useLocation();
  const s = voyage.scenarios[scenario];
  const isPositive = s.netRevenue >= 0;

  const costBreakdownData = [
    { name: 'Fuel', value: Math.round(s.fuelCost / 1000) },
    { name: 'Port', value: Math.round(s.portCost / 1000) },
    { name: 'Canal', value: Math.round(s.canalCost / 1000) },
    { name: 'Delay', value: Math.round(s.delayCost / 1000) },
  ].filter((d) => d.value > 0);

  const totalDays = voyage.baseDaysAtSea + (s.weatherDelay || 0);
  const voyageTCE = totalDays > 0 ? s.netRevenue / totalDays : 0;
  const tceDelta = benchmark ? voyageTCE - benchmark.tce : 0;
  const tceDeltaPct = benchmark && benchmark.tce !== 0 ? (tceDelta / benchmark.tce) * 100 : 0;
  const aboveMarket = tceDelta >= 0;
  const benchmarkChartData = benchmark
    ? [
        { name: 'Bottom Q', value: Math.round(benchmark.bottomQuartile / 1000) },
        { name: 'Fleet Avg', value: Math.round(benchmark.fleetAvg / 1000) },
        { name: 'Market', value: Math.round(benchmark.tce / 1000) },
        { name: 'Top Q', value: Math.round(benchmark.topQuartile / 1000) },
        { name: 'This Voyage', value: Math.round(voyageTCE / 1000) },
      ]
    : [];

  return (
    <div
      className={cn(
        'bg-white/[0.02] border rounded-xl overflow-hidden transition-all',
        expanded ? 'border-[#c9b787]/24' : 'border-white/[0.06] hover:border-white/[0.08]',
      )}
    >
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#c9b787]/8 border border-white/[0.06] flex items-center justify-center shrink-0">
              <Ship className="w-4.5 h-4.5 text-[#c9b787]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-bold text-[#f5f5f5]">
                  {voyage.id} — {voyage.vessel}
                </p>
                <Badge variant="outline" className="text-[9px] text-[#8a8a8a] border-white/[0.06]">
                  {voyage.type}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[9px] text-emerald-400 border-emerald-500/20"
                >
                  {voyage.status}
                </Badge>
              </div>
              <p className="text-[10px] text-[#8a8a8a] mb-2">
                {voyage.from} → {voyage.to} · {voyage.cargo} · {voyage.distanceNM.toLocaleString()}{' '}
                NM
              </p>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-[#8a8a8a] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Departs {voyage.departureETA}
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1 font-mono font-bold',
                    isPositive ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  Net: {fmtMoney(s.netRevenue)}
                </span>
                <span
                  className={cn(
                    'font-mono text-[10px]',
                    isPositive ? 'text-emerald-400/70' : 'text-red-400/70',
                  )}
                >
                  Margin: {s.margin.toFixed(1)}%
                </span>
                {benchmark && (
                  <span
                    className={cn(
                      'flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border',
                      aboveMarket
                        ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/5'
                        : 'text-red-300 border-red-500/20 bg-red-500/5',
                    )}
                    title={`Voyage TCE ${fmtMoney(voyageTCE)}/day vs market ${fmtMoney(benchmark.tce)}/day`}
                  >
                    <Activity className="w-3 h-3" />
                    vs Market: {aboveMarket ? '+' : ''}
                    {tceDeltaPct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <ChevronRight
              className={cn(
                'w-4 h-4 text-[#5a5a5a] shrink-0 mt-1 transition-transform',
                expanded && 'rotate-90',
              )}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] p-4 space-y-4 bg-[#c9b787]/14">
          {/* Scenario selector */}
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#6a6a6a]" />
            <span className="text-[10px] text-[#6a6a6a] uppercase tracking-wider">Scenario:</span>
            {(['base', 'optimistic', 'pessimistic'] as ScenarioKey[]).map((key) => (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  setScenario(key);
                }}
                className={cn(
                  'text-[10px] px-3 py-1 rounded-full border transition-colors capitalize',
                  scenario === key
                    ? 'border-[#c9b787]/24 text-[#d4c598] bg-[#c9b787]/10'
                    : 'border-white/[0.06] text-[#6a6a6a] hover:text-[#d4c598]',
                )}
              >
                {voyage.scenarios[key].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* P&L summary */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a]">
                Voyage P&L — {s.label}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs py-1 border-b border-white/[0.08]">
                  <span className="text-[#8a8a8a]">Gross Freight Revenue</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {fmtMoney(s.grossRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8a8a8a] flex items-center gap-1">
                    <Fuel className="w-3 h-3" /> Bunker Cost
                  </span>
                  <span className="text-red-400/80 font-mono">({fmtMoney(s.fuelCost)})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8a8a8a] flex items-center gap-1">
                    <Anchor className="w-3 h-3" /> Port Fees
                  </span>
                  <span className="text-red-400/80 font-mono">({fmtMoney(s.portCost)})</span>
                </div>
                {s.canalCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8a8a8a] flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Canal / Rerouting
                    </span>
                    <span className="text-red-400/80 font-mono">({fmtMoney(s.canalCost)})</span>
                  </div>
                )}
                {s.delayCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8a8a8a] flex items-center gap-1">
                      <Wind className="w-3 h-3" /> Weather Delay ({s.weatherDelay}d)
                    </span>
                    <span className="text-red-400/80 font-mono">({fmtMoney(s.delayCost)})</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-white/[0.08] pt-2">
                  <span
                    className={cn('font-bold', isPositive ? 'text-emerald-400' : 'text-red-400')}
                  >
                    Net Voyage P&L
                  </span>
                  <span
                    className={cn(
                      'font-bold font-mono',
                      isPositive ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {fmtMoney(s.netRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8a8a8a]">Margin</span>
                  <span
                    className={cn(
                      'font-mono',
                      isPositive ? 'text-emerald-400/70' : 'text-red-400/70',
                    )}
                  >
                    {s.margin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8a8a8a]">Est. IRR</span>
                  <span className={cn('font-mono', s.irr >= 0 ? 'text-[#d4c598]' : 'text-red-400')}>
                    {s.irr.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8a8a8a]">
                    Bunker: {s.fuelMT.toLocaleString()} MT @ ${s.bunkerprice}/MT
                  </span>
                  <span className="text-[#5a5a5a]">{s.canalName}</span>
                </div>
              </div>
            </div>

            {/* Cost breakdown chart */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a] mb-3">
                Cost Breakdown (USD 000s)
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={costBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#4a7fa5' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#4a7fa5' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a1628',
                      border: '1px solid #1e3a5f',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(v: number) => [`$${v}K`, 'Cost']}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    fill={scenarioColors[scenario]}
                    fillOpacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {benchmark && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#c9b787]" />
                  <p className="text-[10px] uppercase tracking-widest text-[#9a9a9a]">
                    Freight Rate Benchmark — {voyage.type}
                  </p>
                  <Badge variant="outline" className="text-[9px] text-[#9a9a9a] border-white/[0.08]">
                    FRED · WPU3012
                  </Badge>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/freight-rates');
                  }}
                  className="text-[10px] text-[#9a9a9a] hover:text-[#d4c598] underline-offset-2 hover:underline"
                >
                  View full benchmark →
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#6a6a6a]">Voyage TCE</p>
                  <p
                    className={cn(
                      'text-sm font-bold font-mono',
                      aboveMarket ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {fmtMoney(voyageTCE)}
                    <span className="text-[9px] text-[#6a6a6a] font-normal">/day</span>
                  </p>
                  <p className="text-[9px] text-[#6a6a6a] mt-0.5">
                    over {totalDays.toFixed(1)} days
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#6a6a6a]">
                    Market Benchmark
                  </p>
                  <p className="text-sm font-bold font-mono text-[#e0e0e0]">
                    {fmtMoney(benchmark.tce)}
                    <span className="text-[9px] text-[#6a6a6a] font-normal">/day</span>
                  </p>
                  <p
                    className={cn(
                      'text-[9px] mt-0.5 font-mono',
                      benchmark.changePct >= 0 ? 'text-emerald-400/70' : 'text-red-400/70',
                    )}
                  >
                    Spot {benchmark.changePct >= 0 ? '+' : ''}
                    {benchmark.changePct.toFixed(2)}% wk
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#6a6a6a]">vs Market</p>
                  <p
                    className={cn(
                      'text-sm font-bold font-mono flex items-center gap-1',
                      aboveMarket ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {aboveMarket ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {aboveMarket ? '+' : ''}
                    {tceDeltaPct.toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-[#6a6a6a] mt-0.5">
                    {aboveMarket ? '+' : ''}
                    {fmtMoney(tceDelta)}/day
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#6a6a6a]">
                    Fleet-Class Avg
                  </p>
                  <p className="text-sm font-bold font-mono text-[#d4c598]">
                    {fmtMoney(benchmark.fleetAvg)}
                    <span className="text-[9px] text-[#6a6a6a] font-normal">/day</span>
                  </p>
                  <p className="text-[9px] text-[#6a6a6a] mt-0.5">
                    Q1: {fmtMoney(benchmark.bottomQuartile)} · Q3: {fmtMoney(benchmark.topQuartile)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a] mb-2">
                  TCE vs Fleet-Class Distribution (USD 000s/day)
                </p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={benchmarkChartData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#4a7fa5' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#4a7fa5' }} />
                    <Tooltip
                      contentStyle={{
                        background: '#0a1628',
                        border: '1px solid #1e3a5f',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(v: number) => [`$${v}K/day`, 'TCE']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {benchmarkChartData.map((d, i) => {
                        const isVoyage = d.name === 'This Voyage';
                        const isBaltic = d.name === 'Market';
                        const fill = isVoyage
                          ? aboveMarket
                            ? '#22c55e'
                            : '#ef4444'
                          : isBaltic
                            ? '#38bdf8'
                            : '#1e3a5f';
                        return (
                          <Cell
                            key={i}
                            fill={fill}
                            fillOpacity={isVoyage || isBaltic ? 0.9 : 0.6}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!isPositive && scenario !== 'base' && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 space-y-2">
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Voyage unprofitable under this scenario.
                Consider renegotiating freight rate or delaying departure.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fireBriefSignal({
                    query: `Generate a maritime intelligence brief for voyage loss-risk assessment: ${voyage.vessel} (${voyage.type}) on route ${voyage.from} → ${voyage.to}. Under the ${scenario} scenario, net P&L is ${fmtMoney(s.netRevenue)} (margin: ${s.margin.toFixed(1)}%). Bunker cost: ${fmtMoney(s.fuelCost)}, Port fees: ${fmtMoney(s.portCost)}, Cargo: ${voyage.cargo} (${voyage.cargoMT.toLocaleString()} MT), Distance: ${voyage.distanceNM.toLocaleString()} NM. Provide a financial risk briefing, alternative routing options, and 3 recommended actions to restore profitability.`,
                    context: `Voyage P&L Predictor signal — ${scenario} scenario shows loss, voyage ${voyage.vessel}`,
                    source: `Voyage P&L Predictor — ${voyage.vessel} (${scenario} scenario, ${fmtMoney(s.netRevenue)} net)`,
                  });
                  navigate('/intelligence-briefs');
                }}
                className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-300 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg py-2 transition-colors"
              >
                <Zap className="w-3 h-3" /> Generate Intelligence Brief for this Voyage Risk
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VoyagePnL() {
  const totalRevenue = VOYAGES.reduce((s, v) => s + v.scenarios.base.grossRevenue, 0);
  const totalNet = VOYAGES.reduce((s, v) => s + v.scenarios.base.netRevenue, 0);
  const _avgMargin = VOYAGES.reduce((s, v) => s + v.scenarios.base.margin, 0) / VOYAGES.length;
  const lossCount = VOYAGES.filter((v) => v.scenarios.pessimistic.netRevenue < 0).length;

  const {
    data: benchmarks,
    isLoading: benchmarksLoading,
    isError: benchmarksError,
  } = useFreightBenchmarks();
  const lookupBenchmark = (type: string): VoyageBenchmark | undefined => {
    if (!benchmarks) return undefined;
    return benchmarks.benchmarksByLabel[type];
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-[#f5f5f5] font-display">Voyage P&L Predictor</h1>
            <Badge
              variant="outline"
              className="text-[9px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
            >
              PRE-DEPARTURE ANALYSIS
            </Badge>
          </div>
          <p className="text-xs text-[#8a8a8a]">
            Full voyage economics with scenario modeling for fuel, weather delays, port fees, and
            rerouting — before ships depart
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#9a9a9a] font-mono bg-white/[0.02] border border-white/[0.08] rounded-md px-2.5 py-1.5">
          <Clock className="w-3 h-3" />
          <span>
            {benchmarksLoading
              ? 'Loading market benchmark…'
              : benchmarksError
                ? 'Market benchmark feed unavailable'
                : `${benchmarks?.source ?? 'Market benchmark'} · as of ${formatAsOf(benchmarks?.asOf)}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Voyages Modeled',
            value: VOYAGES.length,
            sub: 'pre-departure',
            icon: Ship,
            color: 'text-[#c9b787]',
            fmt: (v: number) => `${v}`,
          },
          {
            label: 'Gross Revenue (Base)',
            value: totalRevenue,
            sub: 'combined freight',
            icon: DollarSign,
            color: 'text-emerald-400',
            fmt: (v: number) => `$${(v / 1_000_000).toFixed(1)}M`,
          },
          {
            label: 'Net P&L (Base Case)',
            value: totalNet,
            sub: 'after all voyage costs',
            icon: TrendingUp,
            color: totalNet >= 0 ? 'text-emerald-400' : 'text-red-400',
            fmt: (v: number) =>
              v >= 0
                ? `$${(v / 1_000_000).toFixed(1)}M`
                : `-$${(Math.abs(v) / 1_000_000).toFixed(1)}M`,
          },
          {
            label: 'Voyages Loss Risk',
            value: lossCount,
            sub: 'unprofitable under pessimistic',
            icon: AlertTriangle,
            color: 'text-amber-400',
            fmt: (v: number) => `${v}`,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a]">{kpi.label}</p>
              <kpi.icon className={cn('w-4 h-4', kpi.color)} />
            </div>
            <p className={cn('text-xl font-bold font-mono', kpi.color)}>{kpi.fmt(kpi.value)}</p>
            <p className="text-[10px] text-[#6a6a6a] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#e0e0e0]">Voyage Assessments</p>
          <p className="text-[10px] text-[#6a6a6a]">Expand to compare scenarios</p>
        </div>
        {VOYAGES.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            headline="No voyages awaiting modeling"
            description="Every booked voyage has been priced — model a new voyage when one is fixed."
            accentColor="#10b981"
          />
        ) : (
          VOYAGES.map((v) => (
            <VoyagePnLCard key={v.id} voyage={v} benchmark={lookupBenchmark(v.type)} />
          ))
        )}
      </div>
    </div>
  );
}
