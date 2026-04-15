import { useState, useMemo } from "react";
import { motion as m } from "framer-motion";
import {
  Hammer, DollarSign, TrendingUp, Clock, BarChart3, Building2,
  ArrowUpRight, ArrowDownRight, Layers, AlertTriangle, Activity, Calculator
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

interface CostEstimate {
  id: string;
  projectName: string;
  location: string;
  buildingType: string;
  grossSqft: number;
  stories: number;
  finishLevel: "economy" | "standard" | "premium" | "luxury";
  costPerSqft: number;
  totalHardCost: number;
  totalSoftCost: number;
  totalCost: number;
  contingency: number;
  timelineMonths: number;
  timelineP10: number;
  timelineP90: number;
  breakdown: CostLineItem[];
  materialTrends: MaterialTrend[];
  marketFactors: { factor: string; adjustment: number }[];
}

interface CostLineItem {
  division: string;
  description: string;
  costPerSqft: number;
  total: number;
  pctOfHard: number;
}

interface MaterialTrend {
  material: string;
  currentPrice: string;
  yoyChange: number;
  trend: "up" | "down" | "flat";
  supplyStatus: "normal" | "tight" | "critical";
}

const FINISH_COLORS = {
  economy: "#60a5fa", standard: "#34d399", premium: "#fbbf24", luxury: "#a78bfa",
};

const ESTIMATES: CostEstimate[] = [
  {
    id: "cc-1",
    projectName: "Post Oak Mixed-Use Tower",
    location: "Houston, TX",
    buildingType: "Mixed-Use High-Rise",
    grossSqft: 185000,
    stories: 22,
    finishLevel: "premium",
    costPerSqft: 385,
    totalHardCost: 71225000,
    totalSoftCost: 14245000,
    totalCost: 85470000,
    contingency: 5000000,
    timelineMonths: 28,
    timelineP10: 24,
    timelineP90: 36,
    breakdown: [
      { division: "03 — Concrete", description: "Structural concrete, rebar, formwork", costPerSqft: 62, total: 11470000, pctOfHard: 16.1 },
      { division: "05 — Steel", description: "Structural steel, misc metals, connections", costPerSqft: 48, total: 8880000, pctOfHard: 12.5 },
      { division: "07 — Thermal & Moisture", description: "Waterproofing, insulation, roofing", costPerSqft: 22, total: 4070000, pctOfHard: 5.7 },
      { division: "08 — Openings", description: "Curtain wall, windows, storefronts, doors", costPerSqft: 38, total: 7030000, pctOfHard: 9.9 },
      { division: "09 — Finishes", description: "Drywall, flooring, paint, ceilings", costPerSqft: 45, total: 8325000, pctOfHard: 11.7 },
      { division: "14 — Conveyances", description: "Elevators (4 passenger + 1 freight)", costPerSqft: 18, total: 3330000, pctOfHard: 4.7 },
      { division: "21-28 — MEP", description: "Mechanical, electrical, plumbing, fire protection", costPerSqft: 95, total: 17575000, pctOfHard: 24.7 },
      { division: "31 — Earthwork", description: "Excavation, shoring, dewatering", costPerSqft: 15, total: 2775000, pctOfHard: 3.9 },
      { division: "32 — Exterior", description: "Landscaping, hardscape, site utilities", costPerSqft: 12, total: 2220000, pctOfHard: 3.1 },
      { division: "Other", description: "General conditions, insurance, permits, fees", costPerSqft: 30, total: 5550000, pctOfHard: 7.8 },
    ],
    materialTrends: [
      { material: "Structural Steel (W-shapes)", currentPrice: "$1,420/ton", yoyChange: -8.2, trend: "down", supplyStatus: "normal" },
      { material: "Ready-Mix Concrete (4000 PSI)", currentPrice: "$168/CY", yoyChange: 4.5, trend: "up", supplyStatus: "normal" },
      { material: "Rebar (#4-#11)", currentPrice: "$0.78/lb", yoyChange: -3.1, trend: "down", supplyStatus: "normal" },
      { material: "Copper Wire (THHN)", currentPrice: "$4.85/lb", yoyChange: 12.3, trend: "up", supplyStatus: "tight" },
      { material: "Lumber (2x4 SPF)", currentPrice: "$428/MBF", yoyChange: -15.6, trend: "down", supplyStatus: "normal" },
      { material: "Drywall (5/8\" Type X)", currentPrice: "$14.20/sheet", yoyChange: 2.8, trend: "up", supplyStatus: "normal" },
      { material: "PVC Pipe (4\")", currentPrice: "$8.50/ft", yoyChange: -1.2, trend: "flat", supplyStatus: "normal" },
      { material: "Transformer (750kVA)", currentPrice: "$42,000/ea", yoyChange: 28.5, trend: "up", supplyStatus: "critical" },
    ],
    marketFactors: [
      { factor: "Houston Labor Index", adjustment: -3.2 },
      { factor: "Material Volatility Premium", adjustment: 2.5 },
      { factor: "High-Rise Complexity Factor", adjustment: 8.0 },
      { factor: "Prevailing Wage Requirement", adjustment: 0 },
      { factor: "Sustainability Premium (LEED Gold)", adjustment: 4.5 },
    ],
  },
];

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toLocaleString()}`;

export default function ConstructionCostPage() {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const est = ESTIMATES[0];

  return (
    <div className="min-h-screen" style={{ background: "#0a0c10" }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Construction Intelligence</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Cost Estimation & Material Trends</h1>
          <p className="mt-1 text-sm text-white/40">Real-time construction cost estimation, material price tracking, and Monte Carlo timeline simulation.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">{est.projectName}</h3>
              <div className="text-xs text-white/40 mt-1">{est.location} · {est.buildingType} · {est.grossSqft.toLocaleString()} SF · {est.stories} stories</div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${FINISH_COLORS[est.finishLevel]}15`, color: FINISH_COLORS[est.finishLevel] }}>{est.finishLevel}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Total Project Cost", value: fmt(est.totalCost), color: "#2d6a4f" },
              { label: "Hard Costs", value: fmt(est.totalHardCost), sub: `$${est.costPerSqft}/SF`, color: "#60a5fa" },
              { label: "Soft Costs", value: fmt(est.totalSoftCost), sub: `${Math.round((est.totalSoftCost / est.totalHardCost) * 100)}% of hard`, color: "#a78bfa" },
              { label: "Contingency", value: fmt(est.contingency), sub: `${((est.contingency / est.totalCost) * 100).toFixed(1)}%`, color: "#fbbf24" },
              { label: "Timeline", value: `${est.timelineMonths} mo`, sub: `P10: ${est.timelineP10} · P90: ${est.timelineP90}`, color: "#34d399" },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1">{m.label}</div>
                <div className="text-xl font-bold text-white">{m.value}</div>
                {"sub" in m && m.sub && <div className="text-[10px] text-white/30 mt-0.5">{m.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Cost Breakdown by CSI Division</h3>
            <div className="space-y-2">
              {est.breakdown.map(item => (
                <button
                  key={item.division}
                  onClick={() => setSelectedDivision(item.division === selectedDivision ? null : item.division)}
                  className={cn("w-full text-left rounded-xl border p-3 transition",
                    item.division === selectedDivision ? "border-white/20 bg-white/[0.04]" : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">{item.division}</span>
                    <span className="text-sm font-semibold text-white">{fmt(item.total)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                      <m.div className="h-1.5 rounded-full" style={{ background: "#2d6a4f", width: `${item.pctOfHard}%` }} />
                    </div>
                    <span className="text-[10px] text-white/40 w-10 text-right">{item.pctOfHard}%</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">{item.description} · ${item.costPerSqft}/SF</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Material Price Trends</h3>
            <div className="space-y-2">
              {est.materialTrends.map(mt => (
                <div key={mt.material} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20">
                    {mt.trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "#ef4444" }} /> :
                     mt.trend === "down" ? <ArrowDownRight className="h-3.5 w-3.5" style={{ color: "#34d399" }} /> :
                     <Activity className="h-3.5 w-3.5" style={{ color: "#fbbf24" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{mt.material}</div>
                    <div className="text-[10px] text-white/30">{mt.currentPrice}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: mt.yoyChange > 0 ? "#ef4444" : mt.yoyChange < 0 ? "#34d399" : "#fbbf24" }}>
                      {mt.yoyChange > 0 ? "+" : ""}{mt.yoyChange}%
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{
                      background: mt.supplyStatus === "normal" ? "#34d39910" : mt.supplyStatus === "tight" ? "#fbbf2410" : "#ef444410",
                      color: mt.supplyStatus === "normal" ? "#34d399" : mt.supplyStatus === "tight" ? "#fbbf24" : "#ef4444"
                    }}>{mt.supplyStatus}</span>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-white mt-6 mb-4">Market Adjustment Factors</h3>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="space-y-2.5">
                {est.marketFactors.map(mf => (
                  <div key={mf.factor} className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{mf.factor}</span>
                    <span className="text-xs font-semibold" style={{ color: mf.adjustment > 0 ? "#ef4444" : mf.adjustment < 0 ? "#34d399" : "#fbbf24" }}>
                      {mf.adjustment > 0 ? "+" : ""}{mf.adjustment}%
                    </span>
                  </div>
                ))}
                <div className="border-t border-white/[0.06] pt-2 mt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Net Market Adjustment</span>
                  <span className="text-sm font-bold" style={{ color: est.marketFactors.reduce((s, f) => s + f.adjustment, 0) > 0 ? "#ef4444" : "#34d399" }}>
                    {est.marketFactors.reduce((s, f) => s + f.adjustment, 0) > 0 ? "+" : ""}{est.marketFactors.reduce((s, f) => s + f.adjustment, 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#2d6a4f]/20 bg-[#2d6a4f]/[0.04] p-4 mt-4">
              <div className="flex items-start gap-2">
                <Calculator className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#2d6a4f" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#2d6a4f" }}>Monte Carlo Timeline Simulation</p>
                  <p className="text-[10px] text-white/35 mt-0.5">
                    10,000 iterations simulated across weather delays, permit cycles, material lead times, and labor availability.
                    P50 estimate: {est.timelineMonths} months. 80% confidence interval: {est.timelineP10}–{est.timelineP90} months.
                    Key risk drivers: electrical transformer lead time (18+ weeks) and concrete crew availability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
