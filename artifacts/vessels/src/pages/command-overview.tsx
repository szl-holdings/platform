import { useState } from "react";
import { Link } from "wouter";
import { vesselsDomainMockData } from "@/data/mock-data";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import {
  Ship, AlertTriangle, Clock, Wrench, TrendingUp, TrendingDown,
  ChevronRight, Activity, DollarSign, Fuel, CloudLightning, BarChart3,
  CheckCircle2, XCircle, Minus
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const { vessels, fleetExceptions, maintenanceItems, voyageEconomics, performanceMetrics } = vesselsDomainMockData;

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  at_sea: { label: "At Sea", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  in_port: { label: "In Port", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dot: "bg-sky-400" },
  anchored: { label: "Anchored", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  maintenance: { label: "Maintenance", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  delayed: { label: "Delayed", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", dot: "bg-orange-400" },
  loading: { label: "Loading", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", dot: "bg-violet-400" },
  risk_watch: { label: "Risk Watch", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  exception_active: { label: "Exception Active", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
};

const severityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Critical" },
  high: { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", label: "High" },
  watch: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Watch" },
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

function ExecutiveView() {
  const activeVoyages = vessels.filter(v => ["at_sea", "loading", "exception_active"].includes(v.status)).length;
  const totalRevenue = voyageEconomics.filter(v => v.status === "active").reduce((a, v) => a + v.estimatedRevenue, 0);
  const totalMargin = voyageEconomics.filter(v => v.status === "active").reduce((a, v) => a + v.marginEstimate, 0);
  const avgMarginPct = totalMargin / totalRevenue * 100;
  const criticalExc = fleetExceptions.filter(e => e.severity === "critical" && e.status === "active").length;
  const fleetUtil = vessels.filter(v => v.status !== "maintenance").reduce((a, v) => a + v.utilization, 0) / vessels.filter(v => v.status !== "maintenance").length;
  const avgTCE = vessels.filter(v => v.utilization > 0).reduce((a, v) => a + v.tce, 0) / vessels.filter(v => v.utilization > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Strategic Fleet Position</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Active Voyages" value={activeVoyages} sub={`of ${vessels.length} vessels`} accent="border-emerald-500/10" icon={Ship} trend="up" />
          <StatCard label="Fleet Utilization" value={`${fleetUtil.toFixed(1)}%`} sub="excluding maintenance" accent="border-sky-500/10" icon={Activity} trend="up" />
          <StatCard label="Avg TCE" value={`$${(avgTCE / 1000).toFixed(1)}K`} sub="per vessel/day" accent="border-violet-500/10" icon={DollarSign} trend="up" />
          <StatCard label="Critical Exceptions" value={criticalExc} sub="require immediate action" accent="border-red-500/10" icon={AlertTriangle} pulse={criticalExc > 0} />
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Voyage P&L Snapshot</h3>
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

function OperationsView() {
  const activeExceptions = fleetExceptions.filter(e => e.status === "active");
  const maintenanceWatch = maintenanceItems.filter(m => ["overdue", "in_progress", "due_soon"].includes(m.status));
  const delayedVessels = vessels.filter(v => ["delayed", "exception_active", "anchored"].includes(v.status));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Exceptions" value={activeExceptions.length} sub="require response" accent="border-red-500/10" icon={AlertTriangle} pulse={activeExceptions.filter(e => e.severity === "critical").length > 0} />
        <StatCard label="Delayed / Disrupted" value={delayedVessels.length} sub="vessels off schedule" accent="border-orange-500/10" icon={Clock} />
        <StatCard label="Maintenance Watch" value={maintenanceWatch.length} sub="action items" accent="border-amber-500/10" icon={Wrench} />
        <StatCard label="In Port" value={vessels.filter(v => v.status === "in_port").length} sub="turnaround vessels" accent="border-sky-500/10" icon={Ship} />
      </div>

      <div>
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Exception Queue</h3>
        <div className="space-y-2">
          {activeExceptions.map(exc => {
            const sc = severityConfig[exc.severity];
            return (
              <Link key={exc.id} href="/exceptions">
                <div className="px-4 py-3 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg hover:border-sky-500/20 transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className={cn("text-[9px] shrink-0 mt-0.5", sc.color)}>{sc.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-sky-100">{exc.title}</p>
                      <p className="text-[10px] text-sky-400/50 mt-0.5">{exc.vesselName} · {exc.route}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono text-amber-400">${(exc.estimatedImpactUSD / 1000).toFixed(0)}K</p>
                      <p className="text-[9px] text-sky-400/40">exposure</p>
                    </div>
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
          {maintenanceWatch.slice(0, 5).map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 bg-[#0a1628]/60 border border-sky-500/10 rounded-lg">
              <div className={cn("w-2 h-2 rounded-full shrink-0", m.status === "overdue" ? "bg-red-400" : m.status === "in_progress" ? "bg-amber-400" : "bg-sky-400")} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sky-100 truncate">{m.vesselName} — {m.component}</p>
                <p className="text-[10px] text-sky-400/50">{m.status === "overdue" ? `${Math.abs(m.daysToDue)}d overdue` : `Due in ${m.daysToDue}d`}</p>
              </div>
              <Badge variant="outline" className={cn("text-[9px]", m.priority === "critical" ? "text-red-400 border-red-500/20 bg-red-500/10" : m.priority === "high" ? "text-orange-400 border-orange-500/20 bg-orange-500/10" : "text-amber-400 border-amber-500/20 bg-amber-500/10")}>
                {m.priority}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommercialView() {
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
        <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Voyage P&L by Charter</h3>
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
  const [activeTab, setActiveTab] = useState<TabId>(
    user.role === "exec" ? "exec" : user.role === "commercial" || user.role === "charterer" || user.role === "finance" ? "commercial" : "ops"
  );

  const totalVessels = vessels.length;
  const atSea = vessels.filter(v => v.status === "at_sea").length;
  const delayed = vessels.filter(v => ["delayed", "exception_active", "anchored"].includes(v.status) && v.etaDelta > 8).length;
  const inPort = vessels.filter(v => v.status === "in_port" || v.status === "loading").length;
  const maintenanceCount = vessels.filter(v => v.status === "maintenance").length;
  const criticalExceptions = fleetExceptions.filter(e => e.severity === "critical" && e.status === "active").length;
  const weatherAffected = vessels.filter(v => v.status === "exception_active" || (v.status === "delayed" && v.etaDelta > 12)).length;
  const fleetUtil = Math.round(vessels.filter(v => v.status !== "maintenance").reduce((a, v) => a + v.utilization, 0) / vessels.filter(v => v.status !== "maintenance").length);

  const tabs: { id: TabId; label: string }[] = [
    { id: "exec", label: "Executive" },
    { id: "ops", label: "Operations" },
    { id: "commercial", label: "Commercial" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-none">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50">Fleet Command Overview</h1>
          <p className="text-xs text-sky-400/50 mt-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · All times UTC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-sky-400/50 font-mono">Live · {totalVessels} vessels tracked</span>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {[
          { label: "Total Vessels", value: totalVessels, icon: Ship, color: "text-sky-400" },
          { label: "At Sea", value: atSea, icon: Activity, color: "text-emerald-400" },
          { label: "In Port", value: inPort, icon: Ship, color: "text-sky-400" },
          { label: "Delayed", value: delayed, icon: Clock, color: "text-orange-400" },
          { label: "Maintenance", value: maintenanceCount, icon: Wrench, color: "text-red-400" },
          { label: "Exceptions", value: criticalExceptions, icon: AlertTriangle, color: "text-red-400" },
          { label: "Fleet Util.", value: `${fleetUtil}%`, icon: BarChart3, color: "text-violet-400" },
          { label: "Weather Hit", value: weatherAffected, icon: CloudLightning, color: "text-amber-400" },
        ].map(item => (
          <div key={item.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-lg px-3 py-2.5 flex flex-col items-center text-center">
            <item.icon className={cn("w-3.5 h-3.5 mb-1", item.color)} />
            <p className={cn("text-lg font-bold font-display leading-none", item.color)}>{item.value}</p>
            <p className="text-[9px] text-sky-400/40 mt-0.5 uppercase tracking-wide">{item.label}</p>
          </div>
        ))}
      </div>

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
          <Link href="/fleet">
            <button className="text-[10px] text-sky-400/50 hover:text-sky-300 flex items-center gap-1 transition-colors">
              Full Fleet Map <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
          <Link href="/exceptions">
            <button className="text-[10px] text-sky-400/50 hover:text-sky-300 flex items-center gap-1 transition-colors">
              All Exceptions <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      {activeTab === "exec" && <ExecutiveView />}
      {activeTab === "ops" && <OperationsView />}
      {activeTab === "commercial" && <CommercialView />}
    </div>
  );
}
