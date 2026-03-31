import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import {
  Ship, AlertTriangle, Clock, Wrench, TrendingUp, TrendingDown,
  ChevronRight, Activity, DollarSign, Fuel, CloudLightning, BarChart3,
  CheckCircle2, XCircle, Minus, RefreshCw
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { CommandModeSurface, type CommandModeSignal } from "@workspace/shared-ui";
import { useVessels, useFleetExceptions, useVoyages, useMaintenance } from "@/hooks/use-vessels-data";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  at_sea: { label: "At Sea", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  active: { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  in_port: { label: "In Port", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dot: "bg-sky-400" },
  anchored: { label: "Anchored", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  maintenance: { label: "Maintenance", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  under_maintenance: { label: "Maintenance", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  delayed: { label: "Delayed", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", dot: "bg-orange-400" },
  loading: { label: "Loading", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", dot: "bg-violet-400" },
  risk_watch: { label: "Risk Watch", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  exception_active: { label: "Exception Active", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
};

const severityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Critical" },
  high: { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", label: "High" },
  watch: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Watch" },
  medium: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Medium" },
  normal: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Normal" },
};

function StatCard({ label, value, sub, accent, icon: Icon, trend, pulse }: {
  label: string; value: string | number; sub?: string; accent: string;
  icon: React.ElementType; trend?: "up" | "down" | "neutral"; pulse?: boolean;
}) {
  return (
    <div className={cn("bg-[#0a1628]/80 border rounded-xl p-4 flex flex-col gap-2 hover:border-sky-500/20 transition-all", accent)}>
      <div className="flex items-start justify-between">
        <Icon className="w-4 h-4 text-sky-400/60 shrink-0 mt-0.5" />
        {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-400" />}
        {trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
        {trend === "neutral" && <Minus className="w-3 h-3 text-sky-400/40" />}
      </div>
      <div>
        <p className={cn("text-2xl font-bold font-display leading-none", pulse && "animate-pulse")}>{value}</p>
        <p className="text-[10px] text-sky-400/50 uppercase tracking-wider mt-1">{label}</p>
        {sub && <p className="text-[10px] text-sky-400/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

type ViewProps = {
  vessels: ReturnType<typeof useVessels>["vessels"];
  fleetExceptions: ReturnType<typeof useFleetExceptions>["fleetExceptions"];
  voyageEconomics: ReturnType<typeof useVoyages>["voyageEconomics"];
  maintenanceItems: ReturnType<typeof useMaintenance>["maintenanceItems"];
};

function ExecutiveView({ vessels, fleetExceptions, voyageEconomics }: ViewProps) {
  const activeVoyages = vessels.filter(v => ["at_sea", "loading", "exception_active"].includes(v.status)).length;
  const totalVessels = vessels.length;
  const totalRevenue = voyageEconomics.filter(v => v.status === "active").reduce((a, v) => a + v.estimatedRevenue, 0);
  const totalMargin = voyageEconomics.filter(v => v.status === "active").reduce((a, v) => a + v.marginEstimate, 0);
  const avgMarginPct = totalRevenue > 0 ? totalMargin / totalRevenue * 100 : 0;
  const criticalExc = fleetExceptions.filter(e => e.severity === "critical" && e.status === "active").length;
  const activeVessels = vessels.filter(v => v.status !== "maintenance");
  const fleetUtil = activeVessels.length > 0 ? activeVessels.reduce((a, v) => a + v.utilization, 0) / activeVessels.length : 0;
  const utilizingVessels = vessels.filter(v => v.utilization > 0);
  const avgTCE = utilizingVessels.length > 0 ? utilizingVessels.reduce((a, v) => a + v.tce, 0) / utilizingVessels.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Strategic Fleet Position</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Active Voyages" value={activeVoyages} sub={`of ${totalVessels} vessels`} accent="border-emerald-500/10" icon={Ship} trend="up" />
          <StatCard label="Fleet Utilization" value={`${fleetUtil.toFixed(1)}%`} sub="excluding maintenance" accent="border-sky-500/10" icon={Activity} trend="up" />
          <StatCard label="Avg TCE" value={`$${(avgTCE / 1000).toFixed(1)}K`} sub="per vessel/day" accent="border-violet-500/10" icon={DollarSign} trend="up" />
          <StatCard label="Critical Exceptions" value={criticalExc} sub="require immediate action" accent="border-red-500/10" icon={AlertTriangle} pulse={criticalExc > 0} />
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Voyage P&amp;L Snapshot</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider">Estimated Revenue</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">${(totalRevenue / 1e6).toFixed(1)}M</p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">Active voyages combined</p>
          </div>
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider">Operating Cost</p>
            <p className="text-xl font-bold text-amber-400 mt-1">${((totalRevenue - totalMargin) / 1e6).toFixed(1)}M</p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">Fuel, port, operating</p>
          </div>
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider">Margin Estimate</p>
            <p className="text-xl font-bold text-sky-300 mt-1">${(totalMargin / 1e6).toFixed(1)}M <span className="text-sm text-sky-400/60">({avgMarginPct.toFixed(1)}%)</span></p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">Blended fleet average</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Fleet Status at a Glance</h3>
        <div className="space-y-2">
          {vessels.map(v => {
            const sc = statusConfig[v.status] || { label: v.status, color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dot: "bg-sky-400" };
            return (
              <Link key={v.id} href={`/vessel/${v.id}`}>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg hover:border-sky-500/20 hover:bg-sky-500/5 cursor-pointer transition-all">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", sc.dot)} />
                  <span className="text-xs font-medium text-sky-100 flex-1">{v.name}</span>
                  <span className="text-[10px] text-sky-400/50 font-mono">{v.type}</span>
                  <Badge variant="outline" className={cn("text-[9px] shrink-0", sc.color)}>{sc.label}</Badge>
                  <div className="text-[10px] text-sky-400/40 font-mono w-16 text-right">{v.utilization > 0 ? `${v.tce.toLocaleString()}/d` : "—"}</div>
                  <ChevronRight className="w-3 h-3 text-sky-400/30 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OperationsView({ vessels, fleetExceptions, maintenanceItems }: ViewProps) {
  const activeExceptions = fleetExceptions.filter(e => e.status === "active");
  const maintenanceWatch = maintenanceItems.filter(m => ["overdue", "in_progress", "due_soon"].includes(m.status));
  const maintenanceCount = maintenanceWatch.length;
  const delayedCount = vessels.filter(v => ["delayed", "exception_active", "anchored"].includes(v.status)).length;
  const inPortCount = vessels.filter(v => v.status === "in_port" || v.status === "loading").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Exceptions" value={activeExceptions.length} sub="require response" accent="border-red-500/10" icon={AlertTriangle} pulse={activeExceptions.some(e => e.severity === "critical")} />
        <StatCard label="Delayed / Disrupted" value={delayedCount} sub="vessels off schedule" accent="border-orange-500/10" icon={Clock} />
        <StatCard label="Maintenance Watch" value={maintenanceCount} sub="vessels in maintenance" accent="border-amber-500/10" icon={Wrench} />
        <StatCard label="In Port" value={inPortCount} sub="turnaround vessels" accent="border-sky-500/10" icon={Ship} />
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Exception Queue</h3>
        <div className="space-y-2">
          {activeExceptions.map((exc) => {
            const sc = severityConfig[exc.severity] ?? severityConfig.normal;
            const impact = (exc as { estimatedImpactUSD?: number; estimatedImpact?: number; valueAtRiskUsd?: string }).estimatedImpactUSD ?? ((exc as { valueAtRiskUsd?: string }).valueAtRiskUsd ? parseFloat((exc as { valueAtRiskUsd: string }).valueAtRiskUsd) : ((exc as { estimatedImpact?: number }).estimatedImpact ?? 0));
            return (
              <Link key={exc.id} href="/exceptions">
                <div className="px-4 py-3 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg hover:border-sky-500/20 transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className={cn("text-[9px] shrink-0 mt-0.5", sc.color)}>{sc.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-sky-100">{exc.title}</p>
                      <p className="text-[10px] text-sky-400/50 mt-0.5">{exc.vesselName ?? ""}</p>
                    </div>
                    {impact > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-mono text-amber-400">${(impact / 1000).toFixed(0)}K</p>
                        <p className="text-[9px] text-sky-400/40">exposure</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Maintenance Watch</h3>
        <div className="space-y-2">
          {maintenanceWatch.slice(0, 5).map((m) => {
            const mv = m as { id: number | string; name?: string; vesselName?: string; component?: string; vesselType?: string | null; flag?: string | null; priority?: string; status?: string; daysToDue?: number };
            const label = mv.vesselName ?? mv.name ?? "—";
            const sub = mv.component ?? mv.vesselType ?? mv.flag ?? "";
            return (
              <div key={mv.id} className="flex items-center gap-3 px-4 py-2.5 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg">
                <div className={cn("w-2 h-2 rounded-full shrink-0", mv.status === "overdue" ? "bg-red-400" : mv.status === "in_progress" ? "bg-amber-400" : "bg-sky-400")} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sky-100 truncate">{label}{sub ? ` — ${sub}` : ""}</p>
                  {mv.daysToDue !== undefined && (
                    <p className="text-[10px] text-sky-400/50">{mv.status === "overdue" ? `${Math.abs(mv.daysToDue)}d overdue` : `Due in ${mv.daysToDue}d`}</p>
                  )}
                </div>
                {mv.priority && (
                  <Badge variant="outline" className={cn("text-[9px]", mv.priority === "critical" ? "text-red-400 border-red-500/20 bg-red-500/10" : mv.priority === "high" ? "text-orange-400 border-orange-500/20 bg-orange-500/10" : "text-amber-400 border-amber-500/20 bg-amber-500/10")}>
                    {mv.priority}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CommercialView({ voyageEconomics }: ViewProps) {
  const activeVoyages = voyageEconomics.filter(v => v.status === "active");
  const underperforming = activeVoyages.filter(v => v.performanceVsBudget < -5);
  const overperforming = activeVoyages.filter(v => v.performanceVsBudget > 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Voyages" value={activeVoyages.length} sub="charters running" accent="border-emerald-500/10" icon={Ship} />
        <StatCard label="Beating Budget" value={overperforming.length} sub="voyages outperforming" accent="border-emerald-500/10" icon={TrendingUp} trend="up" />
        <StatCard label="Under Budget" value={underperforming.length} sub="voyages at risk" accent="border-red-500/10" icon={TrendingDown} trend="down" />
        <StatCard label="Delay Cost Exposure" value={`$${(activeVoyages.reduce((a, v) => a + v.delayCost, 0) / 1000).toFixed(0)}K`} sub="fleet-wide" accent="border-amber-500/10" icon={Clock} />
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Voyage P&amp;L by Charter</h3>
        <div className="space-y-2">
          {activeVoyages.map(v => {
            const perf = v.performanceVsBudget;
            const isUp = perf > 0;
            return (
              <div key={v.voyageId} className="px-4 py-3 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-sky-100">{v.vesselName}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400/60 border border-sky-500/10">{v.charterType.replace("_", " ")}</span>
                    </div>
                    <p className="text-[10px] text-sky-400/50 mt-0.5">{v.route}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs font-mono text-sky-100">${(v.marginEstimate / 1e6).toFixed(2)}M</p>
                    <div className={cn("flex items-center gap-1 justify-end text-[10px] font-mono", isUp ? "text-emerald-400" : "text-red-400")}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isUp ? "+" : ""}{perf.toFixed(1)}% vs budget
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-[10px] text-sky-400/40">
                  <span>Rev: ${(v.estimatedRevenue / 1e6).toFixed(2)}M</span>
                  <span>Fuel: ${(v.fuelCost / 1e3).toFixed(0)}K</span>
                  <span>Port: ${(v.portCost / 1e3).toFixed(0)}K</span>
                  {v.delayCost > 0 && <span className="text-orange-400">Delay: ${(v.delayCost / 1e3).toFixed(0)}K</span>}
                  <span className="ml-auto">TCE: ${v.tce.toLocaleString()}/d</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type TabId = "exec" | "ops" | "commercial";

export default function CommandOverviewPage() {
  const { user } = useAuth();
  const { vessels, isLive, refetch } = useVessels();
  const { fleetExceptions } = useFleetExceptions();
  const { voyageEconomics } = useVoyages();
  const { maintenanceItems } = useMaintenance();

  const [activeTab, setActiveTab] = useState<TabId>(
    user.role === "exec" ? "exec" : user.role === "compliance" ? "commercial" : "ops"
  );

  const viewProps: ViewProps = { vessels, fleetExceptions, voyageEconomics, maintenanceItems };

  const totalVessels = vessels.length;
  const atSea = vessels.filter(v => v.status === "at_sea").length;
  const delayed = vessels.filter(v => ["delayed", "exception_active", "anchored"].includes(v.status) && v.etaDelta > 8).length;
  const inPort = vessels.filter(v => v.status === "in_port" || v.status === "loading").length;
  const maintenanceCount = vessels.filter(v => v.status === "maintenance").length;
  const criticalExceptions = fleetExceptions.filter(e => e.severity === "critical" && e.status === "active").length;
  const weatherAffected = vessels.filter(v => v.status === "exception_active" || (v.status === "delayed" && v.etaDelta > 12)).length;
  const activeVessels = vessels.filter(v => v.status !== "maintenance");
  const fleetUtil = activeVessels.length > 0 ? Math.round(activeVessels.reduce((a, v) => a + v.utilization, 0) / activeVessels.length) : 0;

  const tabs: { id: TabId; label: string }[] = [
    { id: "exec", label: "Executive" },
    { id: "ops", label: "Operations" },
    { id: "commercial", label: "Commercial" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-none">
      {/* Command Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ship className="w-3.5 h-3.5 text-sky-400/70" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-sky-400/70">Vessels · Fleet Command</span>
          </div>
          <h1 className="font-display text-xl font-bold text-sky-50 tracking-tight">Fleet Command Overview</h1>
          <p className="text-[11px] text-sky-400/50 mt-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · All times UTC
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isLive && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">DEMO</span>
          )}
          <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-sky-500/10 text-sky-400/50 hover:text-sky-300 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
            <span className="text-[10px] text-sky-400/60 font-mono">{isLive ? "Live" : "Demo"} · {totalVessels} vessels</span>
          </div>
        </div>
      </div>

      {/* Fleet status command strip */}
      {criticalExceptions > 0 && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
          <span className="text-xs font-medium text-red-400">{criticalExceptions} critical exception{criticalExceptions > 1 ? "s" : ""} require immediate action</span>
          <Link href="/exceptions">
            <button className="ml-auto text-[10px] px-2.5 py-1 rounded-lg text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      )}

      {/* Fleet metrics strip */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(14,165,233,0.12)", background: "rgba(14,165,233,0.015)" }}>
        <div className="grid grid-cols-4 md:grid-cols-8">
          {[
            { label: "Total", value: totalVessels, color: "text-sky-400", borderColor: "transparent" },
            { label: "At Sea", value: atSea, color: "text-emerald-400", borderColor: "rgba(14,165,233,0.08)" },
            { label: "In Port", value: inPort, color: "text-sky-300", borderColor: "rgba(14,165,233,0.08)" },
            { label: "Delayed", value: delayed, color: "text-orange-400", borderColor: "rgba(14,165,233,0.08)" },
            { label: "Maintenance", value: maintenanceCount, color: "text-red-400", borderColor: "rgba(14,165,233,0.08)" },
            { label: "Exceptions", value: criticalExceptions, color: criticalExceptions > 0 ? "text-red-400" : "text-sky-400/40", borderColor: "rgba(14,165,233,0.08)" },
            { label: "Util.", value: `${fleetUtil}%`, color: "text-violet-400", borderColor: "rgba(14,165,233,0.08)" },
            { label: "Weather", value: weatherAffected, color: "text-amber-400", borderColor: "rgba(14,165,233,0.08)" },
          ].map((item, i) => (
            <div key={item.label} className="px-3 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(14,165,233,0.08)" : "none" }}>
              <p className={cn("text-lg font-bold font-display leading-none", item.color)}>{item.value}</p>
              <p className="text-[9px] text-sky-400/40 mt-0.5 uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-sky-500/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-sky-400/50 hover:text-sky-300"
            )}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2">
          <Link href="/dashboard/fleet">
            <button className="text-[10px] text-sky-400/50 hover:text-sky-300 flex items-center gap-1 transition-colors">
              Fleet Map <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
          <Link href="/exceptions">
            <button className="text-[10px] text-sky-400/50 hover:text-sky-300 flex items-center gap-1 transition-colors">
              Exceptions <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      {activeTab === "exec" && <ExecutiveView {...viewProps} />}
      {activeTab === "ops" && <OperationsView {...viewProps} />}
      {activeTab === "commercial" && <CommercialView {...viewProps} />}

      <div className="mt-6">
        <CommandModeSurface
          title="Command Mode — Fleet Signals"
          accentColor="#3b82f6"
          signals={FLEET_SIGNALS}
        />
      </div>
    </div>
  );
}

const FLEET_SIGNALS: CommandModeSignal[] = [
  {
    id: "vs-001",
    level: "critical",
    what: "Atlantic Pioneer — AIS transponder silent for 6h in high-risk corridor",
    why: "Vessel last reported position in Gulf of Guinea. No signal for 6 hours exceeds 4h threshold. Pattern consistent with dark vessel behaviour or equipment failure.",
    owner: "Operations Desk",
    next: "Initiate contact via satellite phone. Alert flag state if no response within 2h.",
    valueAtRisk: "$2.1M cargo",
    category: "Dark Vessel",
  },
  {
    id: "vs-002",
    level: "high",
    what: "MV Northern Star — ETA deviation of 34h on Hamburg–Singapore route",
    why: "Weather system in Indian Ocean forcing reroute. Fuel burn increase of ~18%. Charter party deadline at risk — demurrage clause activates after 48h delay.",
    owner: "Captain Rodrigues",
    next: "Reroute via Alloy weather model. Notify charterer of revised ETA.",
    valueAtRisk: "$180K demurrage",
    category: "Voyage",
  },
  {
    id: "vs-003",
    level: "high",
    what: "Pacific Meridian — main engine overdue for 500h inspection by 120h",
    why: "Class society inspection window expired. Continued operation risks insurance coverage lapse and port state detention at next call.",
    owner: "Fleet Technical",
    next: "Schedule emergency dry dock at next port of call (Singapore ETA 3 days)",
    category: "Maintenance",
  },
  {
    id: "vs-004",
    level: "medium",
    what: "Caspian Venture — bunker fuel quality below ISO 8217 threshold",
    why: "Lab results from Rotterdam bunkering show sulphur content at 0.52% vs 0.50% MARPOL limit. Non-compliance risk at next ECA transit.",
    owner: "Bunker Desk",
    next: "Switch to compliant tank before Dover Strait ECA entry",
    category: "Compliance",
  },
];
