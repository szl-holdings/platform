import { useState } from "react";
import { vesselsDomainMockData, type VoyageEconomics } from "@/data/mock-data";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Fuel, Clock, Anchor, Ship, BarChart3, Minus } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const { voyageEconomics, vessels } = vesselsDomainMockData;

const charterColors: Record<string, string> = {
  time_charter: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  voyage_charter: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  spot: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

function CostBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-sky-400/50">{label}</span>
        <span className="text-[10px] font-mono text-sky-300">${(value / 1000).toFixed(0)}K <span className="text-sky-400/40">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function VoyageCard({ voyage }: { voyage: VoyageEconomics }) {
  const [expanded, setExpanded] = useState(false);
  const perf = voyage.performanceVsBudget;
  const isUp = perf > 0;
  const vessel = vessels.find(v => v.id === voyage.vesselId);

  return (
    <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden hover:border-sky-500/20 transition-all">
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="px-4 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-sky-100">{voyage.vesselName}</p>
                <Badge variant="outline" className={cn("text-[9px]", charterColors[voyage.charterType])}>
                  {voyage.charterType.replace("_", " ")}
                </Badge>
                {voyage.delayHours > 0 && (
                  <Badge variant="outline" className="text-[9px] text-orange-400 bg-orange-500/10 border-orange-500/20">
                    +{voyage.delayHours}h delay
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-sky-400/50 mt-0.5">{voyage.route}</p>
              <p className="text-[10px] text-sky-400/30 mt-0.5">
                {voyage.cargoType} · {voyage.cargoQuantity.toLocaleString()} MT · Depart {voyage.departureDate}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold font-mono text-sky-100">${(voyage.marginEstimate / 1e6).toFixed(2)}M</p>
              <p className="text-[10px] text-sky-400/50">{voyage.marginPct.toFixed(1)}% margin</p>
              <div className={cn("flex items-center gap-1 justify-end mt-1 text-[10px] font-mono", isUp ? "text-emerald-400" : "text-red-400")}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? "+" : ""}{perf.toFixed(1)}% vs budget
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-3">
            {[
              { label: "Revenue", value: `$${(voyage.estimatedRevenue / 1e6).toFixed(2)}M`, icon: DollarSign, color: "text-emerald-400" },
              { label: "Op Cost", value: `$${(voyage.operatingCost / 1e6).toFixed(2)}M`, icon: BarChart3, color: "text-amber-400" },
              { label: "TCE/day", value: `$${voyage.tce.toLocaleString()}`, icon: TrendingUp, color: "text-sky-400" },
              { label: "Fuel MT", value: `${voyage.fuelConsumptionTotal}t`, icon: Fuel, color: "text-violet-400" },
            ].map(item => (
              <div key={item.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{item.label}</p>
                <p className={cn("text-xs font-mono font-bold mt-0.5", item.color)}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-sky-500/10 pt-4 space-y-4">
          <div>
            <h4 className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-3">Cost Breakdown</h4>
            <div className="space-y-2">
              <CostBar label="Fuel" value={voyage.fuelCost} total={voyage.operatingCost} color="bg-amber-400" />
              <CostBar label="Port Costs" value={voyage.portCost} total={voyage.operatingCost} color="bg-sky-400" />
              {voyage.delayCost > 0 && (
                <CostBar label="Delay Impact" value={voyage.delayCost} total={voyage.operatingCost} color="bg-orange-400" />
              )}
              <CostBar label="Other Op Ex" value={voyage.operatingCost - voyage.fuelCost - voyage.portCost - voyage.delayCost} total={voyage.operatingCost} color="bg-violet-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Fuel Impact</p>
              <p className="text-xs font-mono text-amber-400 mt-1">${(voyage.fuelCost / 1000).toFixed(0)}K</p>
              <p className="text-[9px] text-sky-400/40">{voyage.fuelConsumptionTotal}t consumed</p>
            </div>
            <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Port Cost Impact</p>
              <p className="text-xs font-mono text-sky-300 mt-1">${(voyage.portCost / 1000).toFixed(0)}K</p>
              <p className="text-[9px] text-sky-400/40">incl. dues and fees</p>
            </div>
            <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Delay Impact</p>
              <p className={cn("text-xs font-mono mt-1", voyage.delayCost > 0 ? "text-orange-400" : "text-emerald-400")}>
                {voyage.delayCost > 0 ? `$${(voyage.delayCost / 1000).toFixed(0)}K` : "None"}
              </p>
              <p className="text-[9px] text-sky-400/40">{voyage.delayHours > 0 ? `${voyage.delayHours}h delay` : "On schedule"}</p>
            </div>
          </div>

          {vessel && (
            <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">Charter Performance Indicator</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-sky-500/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", perf >= 5 ? "bg-emerald-400" : perf >= -5 ? "bg-sky-400" : "bg-red-400")}
                    style={{ width: `${Math.min(Math.max(50 + perf * 3, 5), 95)}%` }}
                  />
                </div>
                <span className={cn("text-xs font-mono font-bold shrink-0", isUp ? "text-emerald-400" : "text-red-400")}>
                  {isUp ? "+" : ""}{perf.toFixed(1)}%
                </span>
              </div>
              <p className="text-[9px] text-sky-400/40 mt-1">
                {perf > 10 ? "Significantly outperforming budget" : perf > 0 ? "Ahead of budget" : perf > -10 ? "Slightly under budget" : "Underperforming — review required"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VoyageEconomicsPage() {
  const [sortBy, setSortBy] = useState<"margin" | "tce" | "performance">("margin");

  const sorted = [...voyageEconomics].sort((a, b) => {
    if (sortBy === "margin") return b.marginEstimate - a.marginEstimate;
    if (sortBy === "tce") return b.tce - a.tce;
    return b.performanceVsBudget - a.performanceVsBudget;
  });

  const totalRevenue = voyageEconomics.reduce((a, v) => a + v.estimatedRevenue, 0);
  const totalMargin = voyageEconomics.reduce((a, v) => a + v.marginEstimate, 0);
  const totalFuel = voyageEconomics.reduce((a, v) => a + v.fuelCost, 0);
  const totalDelay = voyageEconomics.reduce((a, v) => a + v.delayCost, 0);
  const avgTCE = voyageEconomics.filter(v => v.tce > 0).reduce((a, v) => a + v.tce, 0) / voyageEconomics.filter(v => v.tce > 0).length;
  const avgPerf = voyageEconomics.reduce((a, v) => a + v.performanceVsBudget, 0) / voyageEconomics.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50">Voyage Economics</h1>
        <p className="text-xs text-sky-400/50 mt-0.5">Revenue, margin, and cost performance across active voyages</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Fleet Revenue", value: `$${(totalRevenue / 1e6).toFixed(1)}M`, color: "text-emerald-400", icon: DollarSign, sub: "active voyages" },
          { label: "Fleet Margin", value: `$${(totalMargin / 1e6).toFixed(1)}M`, color: "text-sky-300", icon: TrendingUp, sub: `${(totalMargin / totalRevenue * 100).toFixed(1)}% avg` },
          { label: "Avg Fleet TCE", value: `$${(avgTCE / 1000).toFixed(1)}K/d`, color: "text-violet-400", icon: BarChart3, sub: "per vessel/day" },
          { label: "Delay Exposure", value: `$${(totalDelay / 1000).toFixed(0)}K`, color: "text-orange-400", icon: Clock, sub: "fleet-wide cost" },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={cn("w-4 h-4", s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-4">Route Profitability Comparison</h3>
        <div className="space-y-3">
          {[...voyageEconomics].sort((a, b) => b.marginPct - a.marginPct).map((v, i) => (
            <div key={v.voyageId} className="flex items-center gap-3">
              <span className="text-[10px] text-sky-400/30 w-4 shrink-0">{i + 1}</span>
              <div className="w-32 shrink-0">
                <p className="text-[10px] text-sky-200 truncate">{v.vesselName}</p>
                <p className="text-[9px] text-sky-400/40 truncate">{v.origin.split(",")[0]} → {v.destination.split(",")[0]}</p>
              </div>
              <div className="flex-1 h-2 bg-sky-500/10 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", v.marginPct >= 50 ? "bg-emerald-400" : v.marginPct >= 35 ? "bg-sky-400" : "bg-amber-400")}
                  style={{ width: `${Math.max(v.marginPct, 5)}%` }}
                />
              </div>
              <span className={cn("text-[10px] font-mono w-12 text-right", v.marginPct >= 50 ? "text-emerald-400" : v.marginPct >= 35 ? "text-sky-400" : "text-amber-400")}>
                {v.marginPct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-sky-400/40">Sort by:</span>
        {[{ id: "margin", label: "Margin" }, { id: "tce", label: "TCE/day" }, { id: "performance", label: "vs Budget" }].map(opt => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id as typeof sortBy)}
            className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border transition-all", sortBy === opt.id ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map(v => <VoyageCard key={v.voyageId} voyage={v} />)}
      </div>
    </div>
  );
}
