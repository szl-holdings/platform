import { useState } from "react";
import { vesselsDomainMockData } from "@/data/mock-data";
import { BarChart3, TrendingUp, TrendingDown, Clock, Ship, Activity, Minus } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const { performanceMetrics, corridors, vessels } = vesselsDomainMockData;

function SparkBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div key={i} className={cn("flex-1 rounded-sm", color)} style={{ height: `${(v / max) * 100}%`, opacity: 0.4 + (i / values.length) * 0.6 }} />
      ))}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max((value / max) * 100, 2)}%` }} />
      </div>
      <span className="text-[10px] font-mono text-sky-300 w-12 text-right shrink-0">{value.toFixed(1)}</span>
    </div>
  );
}

export default function PerformanceAnalyticsPage() {
  const [view, setView] = useState<"utilization" | "ontime" | "tce" | "routes">("utilization");

  const sortedByUtil = [...performanceMetrics].sort((a, b) => b.utilization - a.utilization);
  const sortedByOTA = [...performanceMetrics].sort((a, b) => b.onTimeArrivalRate - a.onTimeArrivalRate);
  const sortedByTCE = [...performanceMetrics].sort((a, b) => b.tce - a.tce);
  const sortedByDelay = [...performanceMetrics].sort((a, b) => b.avgDelayHours - a.avgDelayHours);

  const fleetOnTime = performanceMetrics.filter(m => m.utilization > 0).reduce((a, m) => a + m.onTimeArrivalRate, 0) / performanceMetrics.filter(m => m.utilization > 0).length;
  const fleetUtil = performanceMetrics.filter(m => m.utilization > 0).reduce((a, m) => a + m.utilization, 0) / performanceMetrics.filter(m => m.utilization > 0).length;
  const fleetTCE = performanceMetrics.filter(m => m.tce > 0).reduce((a, m) => a + m.tce, 0) / performanceMetrics.filter(m => m.tce > 0).length;
  const totalDelayHours = performanceMetrics.reduce((a, m) => a + m.avgDelayHours, 0);

  const corridorWeatherRisk: Record<string, string> = { low: "text-emerald-400", moderate: "text-amber-400", high: "text-orange-400", severe: "text-red-400" };
  const corridorCongestion: Record<string, string> = { low: "text-emerald-400", moderate: "text-amber-400", high: "text-orange-400" };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50">Performance Analytics</h1>
        <p className="text-xs text-sky-400/50 mt-0.5">Fleet-wide performance metrics, route profitability, and corridor analysis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Fleet Utilization", value: `${fleetUtil.toFixed(1)}%`, color: "text-emerald-400", icon: Activity, sub: "avg excl. maintenance", trend: "up" as const },
          { label: "On-Time Arrival", value: `${fleetOnTime.toFixed(1)}%`, color: "text-sky-400", icon: Clock, sub: "fleet average", trend: fleetOnTime >= 85 ? "up" as const : "down" as const },
          { label: "Avg Fleet TCE", value: `$${(fleetTCE / 1000).toFixed(1)}K`, color: "text-violet-400", icon: TrendingUp, sub: "per vessel/day", trend: "up" as const },
          { label: "Total Delay Hours", value: `${totalDelayHours.toFixed(0)}h`, color: "text-orange-400", icon: Clock, sub: "fleet this month", trend: "down" as const },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={cn("w-4 h-4", s.color)} />
              {s.trend === "up" ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
            </div>
            <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
            <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mt-1">{s.label}</p>
            <p className="text-[9px] text-sky-400/30 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b border-sky-500/10 pb-3">
        {[
          { id: "utilization", label: "Utilization" },
          { id: "ontime", label: "On-Time Arrival" },
          { id: "tce", label: "TCE Performance" },
          { id: "routes", label: "Route/Corridor" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id as typeof view)}
            className={cn("px-4 py-2 text-xs font-medium rounded-lg transition-all", view === tab.id ? "bg-sky-500/10 text-sky-300" : "text-sky-400/40 hover:text-sky-300")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "utilization" && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Fleet Utilization by Vessel</h3>
          <div className="space-y-3">
            {sortedByUtil.map(m => (
              <div key={m.vesselId} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Ship className="w-3.5 h-3.5 text-sky-400/50" />
                  <span className="text-xs font-semibold text-sky-100 flex-1">{m.vesselName}</span>
                  <span className={cn("text-sm font-bold font-mono", m.utilization >= 90 ? "text-emerald-400" : m.utilization >= 70 ? "text-amber-400" : m.utilization === 0 ? "text-red-400" : "text-sky-300")}>
                    {m.utilization > 0 ? `${m.utilization}%` : "Unavailable"}
                  </span>
                </div>
                <div className="h-2 bg-sky-500/10 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", m.utilization >= 90 ? "bg-emerald-400" : m.utilization >= 70 ? "bg-amber-400" : m.utilization === 0 ? "bg-red-400" : "bg-sky-400")}
                    style={{ width: `${m.utilization}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-sky-400/40">
                  <span>OTA: {m.onTimeArrivalRate > 0 ? `${m.onTimeArrivalRate}%` : "—"}</span>
                  <span>Avg delay: {m.avgDelayHours > 0 ? `${m.avgDelayHours}h` : "None"}</span>
                  <span className="ml-auto">Fuel eff.: {m.fuelEfficiency > 0 ? `${m.fuelEfficiency}` : "—"} gCO2/MT-nm</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "ontime" && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">On-Time Arrival Rate by Vessel</h3>
          <div className="space-y-2">
            {sortedByOTA.filter(m => m.utilization > 0).map(m => (
              <div key={m.vesselId} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold text-sky-100 flex-1">{m.vesselName}</span>
                  <span className={cn("text-sm font-bold font-mono", m.onTimeArrivalRate >= 90 ? "text-emerald-400" : m.onTimeArrivalRate >= 75 ? "text-amber-400" : "text-red-400")}>
                    {m.onTimeArrivalRate}%
                  </span>
                </div>
                <MiniBar value={m.onTimeArrivalRate} max={100} color={m.onTimeArrivalRate >= 90 ? "bg-emerald-400" : m.onTimeArrivalRate >= 75 ? "bg-amber-400" : "bg-red-400"} />
                <div className="flex items-center gap-4 mt-2 text-[10px] text-sky-400/40">
                  <span>Avg delay: {m.avgDelayHours > 0 ? `${m.avgDelayHours.toFixed(1)}h` : "None"}</span>
                  <span className="ml-auto">Route margin: {m.routeProfitability > 0 ? `${m.routeProfitability.toFixed(1)}%` : "N/A"}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <h4 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Delay Frequency Analysis</h4>
            <div className="space-y-2">
              {sortedByDelay.filter(m => m.avgDelayHours > 0).map(m => (
                <div key={m.vesselId} className="flex items-center gap-3">
                  <span className="text-[10px] text-sky-200/60 w-32 truncate">{m.vesselName}</span>
                  <div className="flex-1 h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", m.avgDelayHours >= 20 ? "bg-red-400" : m.avgDelayHours >= 10 ? "bg-orange-400" : "bg-amber-400")}
                      style={{ width: `${(m.avgDelayHours / 250) * 100}%` }}
                    />
                  </div>
                  <span className={cn("text-[10px] font-mono w-12 text-right", m.avgDelayHours >= 20 ? "text-red-400" : m.avgDelayHours >= 10 ? "text-orange-400" : "text-amber-400")}>
                    {m.avgDelayHours.toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "tce" && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">TCE Performance Ranking</h3>
          <div className="space-y-2">
            {sortedByTCE.filter(m => m.tce > 0).map((m, i) => (
              <div key={m.vesselId} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-sky-400/30 w-5">{i + 1}</span>
                  <span className="text-xs font-semibold text-sky-100 flex-1">{m.vesselName}</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">${m.tce.toLocaleString()}<span className="text-xs text-sky-400/40">/d</span></span>
                </div>
                <MiniBar value={m.tce} max={60000} color="bg-violet-400" />
                <div className="flex items-center gap-4 mt-2 text-[10px] text-sky-400/40">
                  <span>Utilization: {m.utilization}%</span>
                  <span>Route margin: {m.routeProfitability.toFixed(1)}%</span>
                  <span className="ml-auto">Fuel eff.: {m.fuelEfficiency.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "routes" && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Active Corridor Analysis</h3>
          <div className="space-y-3">
            {corridors.map(corridor => (
              <div key={corridor.id} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-sky-100">{corridor.name}</p>
                      {corridor.activeAlerts > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{corridor.activeAlerts} alerts</span>
                      )}
                    </div>
                    <p className="text-[10px] text-sky-400/50 mt-0.5">{corridor.origin} → {corridor.destination} · {corridor.commodity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold font-mono", corridor.profitabilityIndex >= 70 ? "text-emerald-400" : corridor.profitabilityIndex >= 50 ? "text-amber-400" : "text-red-400")}>
                      {corridor.profitabilityIndex}
                    </p>
                    <p className="text-[9px] text-sky-400/40">profit index</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  <div className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
                    <p className="text-[9px] text-sky-400/40">Vessels</p>
                    <p className="text-[10px] font-mono text-sky-300">{corridor.vesselCount}</p>
                  </div>
                  <div className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
                    <p className="text-[9px] text-sky-400/40">Delay Rate</p>
                    <p className={cn("text-[10px] font-mono", corridor.delayRate >= 30 ? "text-red-400" : corridor.delayRate >= 15 ? "text-amber-400" : "text-emerald-400")}>{corridor.delayRate}%</p>
                  </div>
                  <div className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
                    <p className="text-[9px] text-sky-400/40">Weather</p>
                    <p className={cn("text-[10px] font-mono capitalize", corridorWeatherRisk[corridor.weatherRisk])}>{corridor.weatherRisk}</p>
                  </div>
                  <div className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
                    <p className="text-[9px] text-sky-400/40">Congestion</p>
                    <p className={cn("text-[10px] font-mono capitalize", corridorCongestion[corridor.portCongestionRisk])}>{corridor.portCongestionRisk}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-[10px] text-sky-400/40">
                  <span>Transit: {corridor.avgTransitDays}d avg</span>
                  <span>Volume: {corridor.weeklyVolume}/wk</span>
                  <span className={cn("ml-auto flex items-center gap-1", corridor.trend === "up" ? "text-emerald-400" : corridor.trend === "down" ? "text-red-400" : "text-sky-400/40")}>
                    {corridor.trend === "up" ? <TrendingUp className="w-3 h-3" /> : corridor.trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {corridor.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
