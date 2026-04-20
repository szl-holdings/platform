import { useState } from "react";
import { useLocation } from "wouter";
import { fireBriefSignal } from "../lib/briefSignal";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { cn } from "@szl-holdings/shared-ui/utils";
import {
  DollarSign, TrendingUp, TrendingDown, Ship, Fuel, Clock, Anchor,
  Wind, Navigation, AlertTriangle, BarChart3, ChevronDown, ChevronRight,
  Calculator, Sliders, Zap, Activity, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";
import { useFreightBenchmarks, formatAsOf, type FreightBenchmark } from "../lib/freight-benchmarks";

type VoyageBenchmark = Pick<FreightBenchmark, "tce" | "changePct" | "fleetAvg" | "topQuartile" | "bottomQuartile">;

const VOYAGES = [
  {
    id: "VOY-2841",
    vessel: "NORDIC CROWN",
    type: "VLCC",
    from: "Ras Tanura, Saudi Arabia",
    to: "Ningbo, China",
    cargo: "Crude Oil",
    cargoMT: 260000,
    freightRate: 42.8,
    status: "Pre-departure",
    departureETA: "Apr 16, 2026",
    distanceNM: 6840,
    baseDaysAtSea: 28,
    scenarios: {
      base: {
        label: "Base Case",
        fuelMT: 2980,
        bunkerprice: 540,
        fuelCost: 1609200,
        portCost: 485000,
        canalCost: 0,
        canalName: "None (direct)",
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 2094200,
        grossRevenue: 11128000,
        netRevenue: 9033800,
        margin: 81.2,
        irr: 14.2,
      },
      optimistic: {
        label: "Tailwind / Low Bunker",
        fuelMT: 2740,
        bunkerprice: 490,
        fuelCost: 1342600,
        portCost: 465000,
        canalCost: 0,
        canalName: "None (direct)",
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 1807600,
        grossRevenue: 11128000,
        netRevenue: 9320400,
        margin: 83.8,
        irr: 16.9,
      },
      pessimistic: {
        label: "Weather Reroute + High Bunker",
        fuelMT: 3580,
        bunkerprice: 610,
        fuelCost: 2183800,
        portCost: 560000,
        canalCost: 180000,
        canalName: "Lombok Strait detour",
        weatherDelay: 3.5,
        delayCost: 245000,
        totalCost: 3168800,
        grossRevenue: 11128000,
        netRevenue: 7959200,
        margin: 71.5,
        irr: 9.1,
      },
    },
  },
  {
    id: "VOY-2835",
    vessel: "EXCEL GALAXY",
    type: "Capesize",
    from: "Port Hedland, Australia",
    to: "Qingdao, China",
    cargo: "Iron Ore",
    cargoMT: 165000,
    freightRate: 14.2,
    status: "Pre-departure",
    departureETA: "Apr 18, 2026",
    distanceNM: 4290,
    baseDaysAtSea: 17,
    scenarios: {
      base: {
        label: "Base Case",
        fuelMT: 1120,
        bunkerprice: 510,
        fuelCost: 571200,
        portCost: 280000,
        canalCost: 0,
        canalName: "None",
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 851200,
        grossRevenue: 2343000,
        netRevenue: 1491800,
        margin: 63.7,
        irr: 11.4,
      },
      optimistic: {
        label: "Favorable Seas",
        fuelMT: 1010,
        bunkerprice: 490,
        fuelCost: 494900,
        portCost: 265000,
        canalCost: 0,
        canalName: "None",
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 759900,
        grossRevenue: 2343000,
        netRevenue: 1583100,
        margin: 67.6,
        irr: 13.8,
      },
      pessimistic: {
        label: "SW Monsoon + Congestion",
        fuelMT: 1380,
        bunkerprice: 580,
        fuelCost: 800400,
        portCost: 340000,
        canalCost: 0,
        canalName: "None",
        weatherDelay: 2.0,
        delayCost: 98000,
        totalCost: 1238400,
        grossRevenue: 2343000,
        netRevenue: 1104600,
        margin: 47.1,
        irr: 6.2,
      },
    },
  },
  {
    id: "VOY-2828",
    vessel: "ATLANTIC GAS",
    type: "LNG Carrier",
    from: "Sabine Pass, USA",
    to: "Zeebrugge, Belgium",
    cargo: "LNG",
    cargoMT: 68000,
    freightRate: 62400,
    status: "Pre-departure",
    departureETA: "Apr 20, 2026",
    distanceNM: 5800,
    baseDaysAtSea: 22,
    scenarios: {
      base: {
        label: "Base Case",
        fuelMT: 1640,
        bunkerprice: 580,
        fuelCost: 951200,
        portCost: 620000,
        canalCost: 0,
        canalName: "None (Atlantic)",
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 1571200,
        grossRevenue: 1372800,
        netRevenue: -198400,
        margin: -14.4,
        irr: -2.1,
      },
      optimistic: {
        label: "Spot Rate Spike +15%",
        fuelMT: 1580,
        bunkerprice: 550,
        fuelCost: 869000,
        portCost: 600000,
        canalCost: 0,
        canalName: "None (Atlantic)",
        weatherDelay: 0,
        delayCost: 0,
        totalCost: 1469000,
        grossRevenue: 1578720,
        netRevenue: 109720,
        margin: 6.9,
        irr: 4.2,
      },
      pessimistic: {
        label: "Winter Storm + High Bunker",
        fuelMT: 2010,
        bunkerprice: 650,
        fuelCost: 1306500,
        portCost: 720000,
        canalCost: 0,
        canalName: "None (Atlantic)",
        weatherDelay: 4.0,
        delayCost: 249600,
        totalCost: 2276100,
        grossRevenue: 1372800,
        netRevenue: -903300,
        margin: -65.8,
        irr: -12.4,
      },
    },
  },
];

type ScenarioKey = "base" | "optimistic" | "pessimistic";

const scenarioColors: Record<ScenarioKey, string> = {
  base: "#38bdf8",
  optimistic: "#22c55e",
  pessimistic: "#ef4444",
};

function fmtMoney(n: number, decimals = 0) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(decimals)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function VoyagePnLCard({ voyage, benchmark }: { voyage: typeof VOYAGES[0]; benchmark: VoyageBenchmark | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const [scenario, setScenario] = useState<ScenarioKey>("base");
  const [, navigate] = useLocation();
  const s = voyage.scenarios[scenario];
  const isPositive = s.netRevenue >= 0;

  const costBreakdownData = [
    { name: "Fuel", value: Math.round(s.fuelCost / 1000) },
    { name: "Port", value: Math.round(s.portCost / 1000) },
    { name: "Canal", value: Math.round(s.canalCost / 1000) },
    { name: "Delay", value: Math.round(s.delayCost / 1000) },
  ].filter(d => d.value > 0);

  const totalDays = voyage.baseDaysAtSea + (s.weatherDelay || 0);
  const voyageTCE = totalDays > 0 ? s.netRevenue / totalDays : 0;
  const tceDelta = benchmark ? voyageTCE - benchmark.tce : 0;
  const tceDeltaPct = benchmark && benchmark.tce !== 0 ? (tceDelta / benchmark.tce) * 100 : 0;
  const aboveMarket = tceDelta >= 0;
  const benchmarkChartData = benchmark
    ? [
        { name: "Bottom Q", value: Math.round(benchmark.bottomQuartile / 1000) },
        { name: "Fleet Avg", value: Math.round(benchmark.fleetAvg / 1000) },
        { name: "Market", value: Math.round(benchmark.tce / 1000) },
        { name: "Top Q", value: Math.round(benchmark.topQuartile / 1000) },
        { name: "This Voyage", value: Math.round(voyageTCE / 1000) },
      ]
    : [];

  return (
    <div
      className={cn(
        "bg-[#0a1628]/80 border rounded-xl overflow-hidden transition-all",
        expanded ? "border-sky-500/30" : "border-sky-500/10 hover:border-sky-500/20"
      )}
    >
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/5 border border-sky-500/10 flex items-center justify-center shrink-0">
              <Ship className="w-4.5 h-4.5 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-bold text-sky-100">{voyage.id} — {voyage.vessel}</p>
                <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/10">{voyage.type}</Badge>
                <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/20">{voyage.status}</Badge>
              </div>
              <p className="text-[10px] text-sky-400/50 mb-2">{voyage.from} → {voyage.to} · {voyage.cargo} · {voyage.distanceNM.toLocaleString()} NM</p>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-sky-400/50 flex items-center gap-1"><Clock className="w-3 h-3" /> Departs {voyage.departureETA}</span>
                <span className={cn("flex items-center gap-1 font-mono font-bold", isPositive ? "text-emerald-400" : "text-red-400")}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  Net: {fmtMoney(s.netRevenue)}
                </span>
                <span className={cn("font-mono text-[10px]", isPositive ? "text-emerald-400/70" : "text-red-400/70")}>
                  Margin: {s.margin.toFixed(1)}%
                </span>
                {benchmark && (
                  <span
                    className={cn(
                      "flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border",
                      aboveMarket
                        ? "text-emerald-300 border-emerald-500/20 bg-emerald-500/5"
                        : "text-red-300 border-red-500/20 bg-red-500/5"
                    )}
                    title={`Voyage TCE ${fmtMoney(voyageTCE)}/day vs market ${fmtMoney(benchmark.tce)}/day`}
                  >
                    <Activity className="w-3 h-3" />
                    vs Market: {aboveMarket ? "+" : ""}{tceDeltaPct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className={cn("w-4 h-4 text-sky-400/30 shrink-0 mt-1 transition-transform", expanded && "rotate-90")} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-sky-500/10 p-4 space-y-4 bg-sky-500/2">
          {/* Scenario selector */}
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-sky-400/40" />
            <span className="text-[10px] text-sky-400/40 uppercase tracking-wider">Scenario:</span>
            {(["base", "optimistic", "pessimistic"] as ScenarioKey[]).map(key => (
              <button
                key={key}
                onClick={(e) => { e.stopPropagation(); setScenario(key); }}
                className={cn(
                  "text-[10px] px-3 py-1 rounded-full border transition-colors capitalize",
                  scenario === key
                    ? "border-sky-500/30 text-sky-300 bg-sky-500/10"
                    : "border-sky-500/10 text-sky-400/40 hover:text-sky-300"
                )}
              >
                {voyage.scenarios[key].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* P&L summary */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-sky-400/40">Voyage P&L — {s.label}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs py-1 border-b border-sky-500/5">
                  <span className="text-sky-400/50">Gross Freight Revenue</span>
                  <span className="text-emerald-400 font-mono font-bold">{fmtMoney(s.grossRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-sky-400/50 flex items-center gap-1"><Fuel className="w-3 h-3" /> Bunker Cost</span>
                  <span className="text-red-400/80 font-mono">({fmtMoney(s.fuelCost)})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-sky-400/50 flex items-center gap-1"><Anchor className="w-3 h-3" /> Port Fees</span>
                  <span className="text-red-400/80 font-mono">({fmtMoney(s.portCost)})</span>
                </div>
                {s.canalCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-sky-400/50 flex items-center gap-1"><Navigation className="w-3 h-3" /> Canal / Rerouting</span>
                    <span className="text-red-400/80 font-mono">({fmtMoney(s.canalCost)})</span>
                  </div>
                )}
                {s.delayCost > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-sky-400/50 flex items-center gap-1"><Wind className="w-3 h-3" /> Weather Delay ({s.weatherDelay}d)</span>
                    <span className="text-red-400/80 font-mono">({fmtMoney(s.delayCost)})</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-sky-500/15 pt-2">
                  <span className={cn("font-bold", isPositive ? "text-emerald-400" : "text-red-400")}>Net Voyage P&L</span>
                  <span className={cn("font-bold font-mono", isPositive ? "text-emerald-400" : "text-red-400")}>{fmtMoney(s.netRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-sky-400/50">Margin</span>
                  <span className={cn("font-mono", isPositive ? "text-emerald-400/70" : "text-red-400/70")}>{s.margin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-sky-400/50">Est. IRR</span>
                  <span className={cn("font-mono", s.irr >= 0 ? "text-sky-300" : "text-red-400")}>{s.irr.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-sky-400/50">Bunker: {s.fuelMT.toLocaleString()} MT @ ${s.bunkerprice}/MT</span>
                  <span className="text-sky-400/30">{s.canalName}</span>
                </div>
              </div>
            </div>

            {/* Cost breakdown chart */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-sky-400/40 mb-3">Cost Breakdown (USD 000s)</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={costBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#4a7fa5" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#4a7fa5" }} />
                  <Tooltip
                    contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`$${v}K`, "Cost"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={scenarioColors[scenario]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {benchmark && (
            <div className="bg-[#0a1628]/60 border border-sky-500/10 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <p className="text-[10px] uppercase tracking-widest text-sky-400/60">Freight Rate Benchmark — {voyage.type}</p>
                  <Badge variant="outline" className="text-[9px] text-sky-400/60 border-sky-500/15">FRED · WPU3012</Badge>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/freight-rates"); }}
                  className="text-[10px] text-sky-400/60 hover:text-sky-300 underline-offset-2 hover:underline"
                >
                  View full benchmark →
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-sky-400/40">Voyage TCE</p>
                  <p className={cn("text-sm font-bold font-mono", aboveMarket ? "text-emerald-400" : "text-red-400")}>
                    {fmtMoney(voyageTCE)}<span className="text-[9px] text-sky-400/40 font-normal">/day</span>
                  </p>
                  <p className="text-[9px] text-sky-400/40 mt-0.5">over {totalDays.toFixed(1)} days</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-sky-400/40">Market Benchmark</p>
                  <p className="text-sm font-bold font-mono text-sky-200">
                    {fmtMoney(benchmark.tce)}<span className="text-[9px] text-sky-400/40 font-normal">/day</span>
                  </p>
                  <p className={cn("text-[9px] mt-0.5 font-mono", benchmark.changePct >= 0 ? "text-emerald-400/70" : "text-red-400/70")}>
                    Spot {benchmark.changePct >= 0 ? "+" : ""}{benchmark.changePct.toFixed(2)}% wk
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-sky-400/40">vs Market</p>
                  <p className={cn("text-sm font-bold font-mono flex items-center gap-1", aboveMarket ? "text-emerald-400" : "text-red-400")}>
                    {aboveMarket ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {aboveMarket ? "+" : ""}{tceDeltaPct.toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-sky-400/40 mt-0.5">{aboveMarket ? "+" : ""}{fmtMoney(tceDelta)}/day</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-sky-400/40">Fleet-Class Avg</p>
                  <p className="text-sm font-bold font-mono text-sky-300">
                    {fmtMoney(benchmark.fleetAvg)}<span className="text-[9px] text-sky-400/40 font-normal">/day</span>
                  </p>
                  <p className="text-[9px] text-sky-400/40 mt-0.5">Q1: {fmtMoney(benchmark.bottomQuartile)} · Q3: {fmtMoney(benchmark.topQuartile)}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-sky-400/40 mb-2">TCE vs Fleet-Class Distribution (USD 000s/day)</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={benchmarkChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#4a7fa5" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#4a7fa5" }} />
                    <Tooltip
                      contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number) => [`$${v}K/day`, "TCE"]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {benchmarkChartData.map((d, i) => {
                        const isVoyage = d.name === "This Voyage";
                        const isBaltic = d.name === "Market";
                        const fill = isVoyage
                          ? (aboveMarket ? "#22c55e" : "#ef4444")
                          : isBaltic ? "#38bdf8" : "#1e3a5f";
                        return <Cell key={i} fill={fill} fillOpacity={isVoyage || isBaltic ? 0.9 : 0.6} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!isPositive && scenario !== "base" && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 space-y-2">
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Voyage unprofitable under this scenario. Consider renegotiating freight rate or delaying departure.
              </p>
              <button
                onClick={e => {
                  e.stopPropagation();
                  fireBriefSignal({
                    query: `Generate a maritime intelligence brief for voyage loss-risk assessment: ${voyage.vessel} (${voyage.type}) on route ${voyage.from} → ${voyage.to}. Under the ${scenario} scenario, net P&L is ${fmtMoney(s.netRevenue)} (margin: ${s.margin.toFixed(1)}%). Bunker cost: ${fmtMoney(s.fuelCost)}, Port fees: ${fmtMoney(s.portCost)}, Cargo: ${voyage.cargo} (${voyage.cargoMT.toLocaleString()} MT), Distance: ${voyage.distanceNM.toLocaleString()} NM. Provide a financial risk briefing, alternative routing options, and 3 recommended actions to restore profitability.`,
                    context: `Voyage P&L Predictor signal — ${scenario} scenario shows loss, voyage ${voyage.vessel}`,
                    source: `Voyage P&L Predictor — ${voyage.vessel} (${scenario} scenario, ${fmtMoney(s.netRevenue)} net)`,
                  });
                  navigate("/intelligence-briefs");
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
  const avgMargin = VOYAGES.reduce((s, v) => s + v.scenarios.base.margin, 0) / VOYAGES.length;
  const lossCount = VOYAGES.filter(v => v.scenarios.pessimistic.netRevenue < 0).length;

  const { data: benchmarks, isLoading: benchmarksLoading, isError: benchmarksError } = useFreightBenchmarks();
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
            <h1 className="text-xl font-bold text-sky-50 font-display">Voyage P&L Predictor</h1>
            <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5">PRE-DEPARTURE ANALYSIS</Badge>
          </div>
          <p className="text-xs text-sky-400/50">Full voyage economics with scenario modeling for fuel, weather delays, port fees, and rerouting — before ships depart</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-sky-400/60 font-mono bg-[#0a1628]/80 border border-sky-500/15 rounded-md px-2.5 py-1.5">
          <Clock className="w-3 h-3" />
          <span>
            {benchmarksLoading
              ? "Loading market benchmark…"
              : benchmarksError
                ? "Market benchmark feed unavailable"
                : `${benchmarks?.source ?? "Market benchmark"} · as of ${formatAsOf(benchmarks?.asOf)}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Voyages Modeled", value: VOYAGES.length, sub: "pre-departure", icon: Ship, color: "text-sky-400", fmt: (v: number) => `${v}` },
          { label: "Gross Revenue (Base)", value: totalRevenue, sub: "combined freight", icon: DollarSign, color: "text-emerald-400", fmt: (v: number) => `$${(v / 1_000_000).toFixed(1)}M` },
          { label: "Net P&L (Base Case)", value: totalNet, sub: "after all voyage costs", icon: TrendingUp, color: totalNet >= 0 ? "text-emerald-400" : "text-red-400", fmt: (v: number) => v >= 0 ? `$${(v / 1_000_000).toFixed(1)}M` : `-$${(Math.abs(v) / 1_000_000).toFixed(1)}M` },
          { label: "Voyages Loss Risk", value: lossCount, sub: "unprofitable under pessimistic", icon: AlertTriangle, color: "text-amber-400", fmt: (v: number) => `${v}` },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-sky-400/40">{kpi.label}</p>
              <kpi.icon className={cn("w-4 h-4", kpi.color)} />
            </div>
            <p className={cn("text-xl font-bold font-mono", kpi.color)}>{kpi.fmt(kpi.value)}</p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-sky-200">Voyage Assessments</p>
          <p className="text-[10px] text-sky-400/40">Expand to compare scenarios</p>
        </div>
        {VOYAGES.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            headline="No voyages awaiting modeling"
            description="Every booked voyage has been priced — model a new voyage when one is fixed."
            accentColor="#10b981"
          />
        ) : VOYAGES.map(v => (
          <VoyagePnLCard key={v.id} voyage={v} benchmark={lookupBenchmark(v.type)} />
        ))}
      </div>
    </div>
  );
}
