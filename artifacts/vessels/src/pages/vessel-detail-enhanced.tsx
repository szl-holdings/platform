import { useState } from "react";
import { useRoute, Link } from "wouter";
import { vesselsDomainMockData } from "@/data/mock-data";
import { Badge } from "@workspace/shared-ui/ui/badge";
import {
  ArrowLeft, Ship, MapPin, Navigation, Clock, Wrench, AlertTriangle,
  DollarSign, Activity, TrendingUp, TrendingDown, Package, ChevronRight,
  Fuel, Shield, Radio
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const { vessels, voyageEconomics, fleetExceptions, maintenanceItems, eventLogs, shipmentRecords } = vesselsDomainMockData;

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  at_sea: { label: "At Sea", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dotColor: "#22c55e" },
  in_port: { label: "In Port", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dotColor: "#0ea5e9" },
  anchored: { label: "Anchored", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dotColor: "#f59e0b" },
  maintenance: { label: "Maintenance", color: "text-red-400 bg-red-500/10 border-red-500/20", dotColor: "#ef4444" },
  delayed: { label: "Delayed", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", dotColor: "#f97316" },
  loading: { label: "Loading", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", dotColor: "#a78bfa" },
  risk_watch: { label: "Risk Watch", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dotColor: "#f59e0b" },
  exception_active: { label: "Exception Active", color: "text-red-400 bg-red-500/10 border-red-500/20", dotColor: "#ef4444" },
};

const readinessStateColors: Record<string, string> = {
  ready: "text-emerald-400",
  watch: "text-amber-400",
  limited: "text-orange-400",
  unavailable: "text-red-400",
};

function HistoryTimeline({ vesselId }: { vesselId: number }) {
  const logs = eventLogs.filter(e => e.vesselId === vesselId);
  if (logs.length === 0) {
    return <p className="text-xs text-sky-400/40 italic py-4 text-center">No recent events recorded</p>;
  }
  return (
    <div className="space-y-0">
      {logs.map((log, i) => (
        <div key={log.id} className="flex items-start gap-3 pb-3">
          <div className="flex flex-col items-center">
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 mt-0.5", log.severity === "Critical" ? "bg-red-400" : log.severity === "Warning" ? "bg-amber-400" : "bg-sky-400")} />
            {i < logs.length - 1 && <div className="w-px flex-1 bg-sky-500/10 mt-1 min-h-[16px]" />}
          </div>
          <div className="flex-1 min-w-0 pb-0">
            <div className="flex items-start gap-2">
              <p className="text-[11px] font-medium text-sky-200 flex-1">{log.message}</p>
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded border shrink-0", log.severity === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/20" : log.severity === "Warning" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-sky-400 bg-sky-500/10 border-sky-500/20")}>
                {log.severity}
              </span>
            </div>
            <p className="text-[10px] text-sky-400/40 mt-0.5">{log.details.slice(0, 80)}{log.details.length > 80 ? "..." : ""}</p>
            <p className="text-[9px] text-sky-400/30 mt-0.5">
              {new Date(log.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} UTC · {log.category}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VesselDetailEnhancedPage() {
  const [matchShort, paramsShort] = useRoute("/vessel/:id");
  const [matchLong, paramsLong] = useRoute("/vessels/:id");
  const params = paramsShort ?? paramsLong;
  const vesselId = Number(params?.id);
  const [tab, setTab] = useState<"overview" | "voyage" | "maintenance" | "history">("overview");

  const vessel = vessels.find(v => v.id === vesselId);

  if (!vessel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Ship className="w-12 h-12 text-sky-400/20 mx-auto mb-3" />
          <p className="text-sky-400/50 font-medium">Vessel not found</p>
          <Link href="/fleet"><p className="text-xs text-sky-400 mt-2 hover:underline">Return to Fleet Map</p></Link>
        </div>
      </div>
    );
  }

  const sc = statusConfig[vessel.status] || { label: vessel.status, color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dotColor: "#0ea5e9" };
  const voyage = voyageEconomics.find(v => v.voyageId === vessel.currentVoyageId);
  const exceptions = fleetExceptions.filter(e => e.vesselId === vessel.id);
  const maintenance = maintenanceItems.filter(m => m.vesselId === vessel.id);
  const shipments = shipmentRecords.filter(s => s.vesselId === vessel.id);

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "voyage" as const, label: "Voyage Economics" },
    { id: "maintenance" as const, label: "Maintenance" },
    { id: "history" as const, label: "History" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/fleet">
          <button className="flex items-center gap-1.5 text-xs text-sky-400/50 hover:text-sky-300 transition-colors mt-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Fleet Map
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-sky-50">{vessel.name}</h1>
            <Badge variant="outline" className={cn("text-xs", sc.color)}>
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: sc.dotColor }} />
              {sc.label}
            </Badge>
            {vessel.alertCount > 0 && (
              <Badge variant="outline" className="text-xs text-red-400 bg-red-500/10 border-red-500/20">
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                {vessel.alertCount} alert{vessel.alertCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-xs text-sky-400/50 mt-1 font-mono">
            IMO {vessel.imo} · MMSI {vessel.mmsi} · {vessel.flag} · {vessel.type} · {vessel.yearBuilt}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Class", value: vessel.vesselClass.replace("_", " "), icon: Ship },
          { label: "DWT", value: `${vessel.dwt.toLocaleString()} MT`, icon: Package },
          { label: "Cargo", value: vessel.cargoType, icon: Package },
          { label: "Fleet", value: vessel.fleet, icon: Radio },
          { label: "Manager", value: vessel.manager, icon: Shield },
          { label: "Region", value: vessel.region, icon: MapPin },
        ].map(item => (
          <div key={item.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{item.label}</p>
            <p className="text-[11px] text-sky-200 font-medium mt-0.5 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 col-span-2">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-3">Position & Navigation</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Latitude", value: `${vessel.lat.toFixed(4)}°` },
              { label: "Longitude", value: `${vessel.lon.toFixed(4)}°` },
              { label: "Speed", value: `${vessel.currentSpeed} kn` },
              { label: "Heading", value: `${vessel.heading}°` },
              { label: "Draught", value: `${vessel.draught}m` },
              { label: "CII Rating", value: vessel.ciiRating },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[9px] text-sky-400/30">{item.label}</p>
                <p className="text-xs font-mono text-sky-100">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-3">Route Progress</p>
          <div className="flex items-center gap-1 text-[10px] text-sky-400/60 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{vessel.lastPort}</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="truncate">{vessel.nextPort}</span>
          </div>
          <div className="h-2 bg-sky-500/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${vessel.routeProgress}%` }} />
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-sky-400/40">{vessel.routeProgress}%</span>
            <span className={cn("font-mono", vessel.etaDelta < 0 ? "text-emerald-400" : vessel.etaDelta > 0 ? "text-orange-400" : "text-sky-400/40")}>
              ETA: {vessel.etaDelta < 0 ? `${Math.abs(vessel.etaDelta)}h ahead` : vessel.etaDelta > 0 ? `+${vessel.etaDelta}h` : "On schedule"}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-sky-500/10">
            <p className="text-[9px] text-sky-400/40">Next: {vessel.nextPort}</p>
            <p className="text-[10px] text-sky-200 font-mono">{new Date(vessel.eta).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>

        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-3">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Health & Readiness</p>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] text-sky-400/40">Readiness Score</p>
                <p className={cn("text-xs font-bold font-mono", vessel.readinessScore >= 80 ? "text-emerald-400" : vessel.readinessScore >= 60 ? "text-amber-400" : "text-red-400")}>{vessel.readinessScore}/100</p>
              </div>
              <div className="h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", vessel.readinessScore >= 80 ? "bg-emerald-400" : vessel.readinessScore >= 60 ? "bg-amber-400" : "bg-red-400")}
                  style={{ width: `${vessel.readinessScore}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] text-sky-400/40">Utilization</p>
                <p className="text-xs font-bold font-mono text-sky-300">{vessel.utilization > 0 ? `${vessel.utilization}%` : "Unavailable"}</p>
              </div>
              {vessel.utilization > 0 && (
                <div className="h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${vessel.utilization}%` }} />
                </div>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-sky-500/10">
            <p className="text-[9px] text-sky-400/40">Readiness State</p>
            <p className={cn("text-xs font-medium capitalize", readinessStateColors[vessel.readinessState])}>{vessel.readinessState.replace("_", " ")}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-sky-500/10 pb-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all", tab === t.id ? "border-sky-400 text-sky-300" : "border-transparent text-sky-400/50 hover:text-sky-300")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Active Exceptions</h3>
            {exceptions.length === 0 ? (
              <div className="py-8 text-center border border-sky-500/10 rounded-xl bg-[#0a1628]/60">
                <p className="text-xs text-sky-400/30">No active exceptions</p>
              </div>
            ) : exceptions.map(exc => (
              <div key={exc.id} className={cn("border rounded-xl p-3", exc.severity === "critical" ? "border-red-500/20 bg-red-500/5" : "border-orange-500/15 bg-orange-500/5")}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", exc.severity === "critical" ? "text-red-400" : "text-orange-400")} />
                  <div>
                    <p className="text-xs font-medium text-sky-100">{exc.title}</p>
                    <p className="text-[10px] text-sky-400/50 mt-0.5">{exc.description.slice(0, 100)}...</p>
                    <p className="text-[9px] text-sky-400/30 mt-1">{exc.ownerFunction} · {exc.owner}</p>
                  </div>
                </div>
              </div>
            ))}

            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mt-4">Cargo & Shipments</h3>
            {shipments.length === 0 ? (
              <div className="py-8 text-center border border-sky-500/10 rounded-xl bg-[#0a1628]/60">
                <p className="text-xs text-sky-400/30">No cargo records</p>
              </div>
            ) : shipments.map(s => (
              <div key={s.id} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-sky-400/50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-sky-100">{s.cargo}</p>
                    <p className="text-[10px] text-sky-400/50">{s.quantity.toLocaleString()} {s.unit} · {s.origin} → {s.destination}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] text-sky-400/60 border-sky-500/20 shrink-0">{s.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-[9px] text-sky-400/30 mt-1.5 pl-5.5">Value: ${s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Vessel Economics (Current Voyage)</h3>
            {voyage ? (
              <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Estimated Revenue", value: `$${(voyage.estimatedRevenue / 1e6).toFixed(2)}M`, color: "text-emerald-400" },
                    { label: "Operating Cost", value: `$${(voyage.operatingCost / 1e6).toFixed(2)}M`, color: "text-amber-400" },
                    { label: "Margin Estimate", value: `$${(voyage.marginEstimate / 1e6).toFixed(2)}M`, color: "text-sky-300" },
                    { label: "Margin %", value: `${voyage.marginPct.toFixed(1)}%`, color: voyage.marginPct >= 40 ? "text-emerald-400" : "text-amber-400" },
                    { label: "TCE/day", value: `$${voyage.tce.toLocaleString()}`, color: "text-violet-400" },
                    { label: "Fuel Cost", value: `$${(voyage.fuelCost / 1000).toFixed(0)}K`, color: "text-amber-400" },
                  ].map(item => (
                    <div key={item.label} className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
                      <p className="text-[9px] text-sky-400/40">{item.label}</p>
                      <p className={cn("text-xs font-mono font-bold mt-0.5", item.color)}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-sky-500/10 flex items-center gap-2">
                  <div className={cn("flex items-center gap-1 text-[10px] font-mono", voyage.performanceVsBudget >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {voyage.performanceVsBudget >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {voyage.performanceVsBudget >= 0 ? "+" : ""}{voyage.performanceVsBudget.toFixed(1)}% vs budget
                  </div>
                  <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/20 ml-auto">{voyage.charterType.replace("_", " ")}</Badge>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border border-sky-500/10 rounded-xl bg-[#0a1628]/60">
                <p className="text-xs text-sky-400/30">No active voyage economics</p>
              </div>
            )}

            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mt-2">Maintenance Status</h3>
            {maintenance.filter(m => m.status !== "completed").length === 0 ? (
              <div className="py-6 text-center border border-sky-500/10 rounded-xl bg-[#0a1628]/60">
                <p className="text-xs text-emerald-400/60">No open maintenance items</p>
              </div>
            ) : maintenance.filter(m => m.status !== "completed").map(m => (
              <div key={m.id} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Wrench className="w-3.5 h-3.5 text-amber-400/60 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-sky-100">{m.component}</p>
                    <p className="text-[10px] text-sky-400/50 mt-0.5">{m.description.slice(0, 80)}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[9px]">
                      <span className={cn(m.daysToDue < 0 ? "text-red-400" : m.daysToDue <= 14 ? "text-orange-400" : "text-sky-400/40")}>
                        {m.daysToDue < 0 ? `${Math.abs(m.daysToDue)}d overdue` : `Due in ${m.daysToDue}d`}
                      </span>
                      <span className="text-sky-400/30">${m.estimatedCost.toLocaleString()}</span>
                      <Badge variant="outline" className={cn("text-[8px]", m.priority === "critical" ? "text-red-400 bg-red-500/10 border-red-500/20" : m.priority === "high" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20")}>
                        {m.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "voyage" && voyage && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Route</p>
              <p className="text-sm font-medium text-sky-100 mt-1">{voyage.route}</p>
              <p className="text-[10px] text-sky-400/50">{voyage.cargoType} · {voyage.cargoQuantity.toLocaleString()} MT</p>
            </div>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Charter</p>
              <p className="text-sm font-medium text-sky-100 mt-1 capitalize">{voyage.charterType.replace("_", " ")}</p>
              <p className={cn("text-[10px] font-mono mt-0.5", voyage.performanceVsBudget >= 0 ? "text-emerald-400" : "text-red-400")}>
                {voyage.performanceVsBudget >= 0 ? "+" : ""}{voyage.performanceVsBudget.toFixed(1)}% vs budget
              </p>
            </div>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Delay Status</p>
              <p className={cn("text-sm font-medium mt-1", voyage.delayHours > 0 ? "text-orange-400" : "text-emerald-400")}>
                {voyage.delayHours > 0 ? `${voyage.delayHours}h delayed` : "On schedule"}
              </p>
              {voyage.delayCost > 0 && <p className="text-[10px] text-orange-400/70">${(voyage.delayCost / 1000).toFixed(0)}K delay cost</p>}
            </div>
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-4">P&L Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[9px] text-sky-400/40">Revenue</p>
                <p className="text-lg font-bold text-emerald-400">${(voyage.estimatedRevenue / 1e6).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-[9px] text-sky-400/40">Total Cost</p>
                <p className="text-lg font-bold text-amber-400">${(voyage.operatingCost / 1e6).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-[9px] text-sky-400/40">Margin</p>
                <p className="text-lg font-bold text-sky-300">${(voyage.marginEstimate / 1e6).toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-[9px] text-sky-400/40">Margin %</p>
                <p className={cn("text-lg font-bold", voyage.marginPct >= 40 ? "text-emerald-400" : "text-amber-400")}>{voyage.marginPct.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Fuel Impact", value: `$${(voyage.fuelCost / 1000).toFixed(0)}K`, sub: `${voyage.fuelConsumptionTotal}t consumed`, icon: Fuel, color: "text-amber-400" },
              { label: "Port Cost Impact", value: `$${(voyage.portCost / 1000).toFixed(0)}K`, sub: "dues, fees, pilotage", icon: Activity, color: "text-sky-300" },
              { label: "Delay Impact", value: voyage.delayCost > 0 ? `$${(voyage.delayCost / 1000).toFixed(0)}K` : "None", sub: voyage.delayHours > 0 ? `${voyage.delayHours}h delay` : "On schedule", icon: Clock, color: voyage.delayCost > 0 ? "text-orange-400" : "text-emerald-400" },
            ].map(item => (
              <div key={item.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={cn("w-4 h-4", item.color)} />
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{item.label}</p>
                </div>
                <p className={cn("text-xl font-bold font-mono", item.color)}>{item.value}</p>
                <p className="text-[9px] text-sky-400/30 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "maintenance" && (
        <div className="space-y-3">
          {maintenance.length === 0 ? (
            <div className="py-16 text-center border border-sky-500/10 rounded-xl">
              <Wrench className="w-10 h-10 text-sky-400/20 mx-auto mb-3" />
              <p className="text-sky-400/40">No maintenance records</p>
            </div>
          ) : maintenance.map(m => (
            <div key={m.id} className={cn("bg-[#0a1628]/80 border rounded-xl p-4", m.status === "overdue" ? "border-red-500/20" : m.priority === "critical" ? "border-orange-500/15" : "border-sky-500/10")}>
              <div className="flex items-start gap-3">
                <Wrench className={cn("w-4 h-4 shrink-0 mt-0.5", m.status === "overdue" ? "text-red-400" : m.status === "in_progress" ? "text-amber-400" : "text-sky-400/50")} />
                <div className="flex-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-sky-100 flex-1">{m.component}</p>
                    <div className="flex gap-1.5 shrink-0">
                      <Badge variant="outline" className={cn("text-[9px]", m.priority === "critical" ? "text-red-400 bg-red-500/10 border-red-500/20" : m.priority === "high" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20")}>
                        {m.priority}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[9px]", m.status === "overdue" ? "text-red-400 bg-red-500/10 border-red-500/20" : m.status === "in_progress" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-sky-400 bg-sky-500/10 border-sky-500/20")}>
                        {m.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-sky-400/60 mt-1">{m.description}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-[9px] text-sky-400/30">Due Date</p>
                      <p className={cn("text-[10px] font-mono", m.daysToDue < 0 ? "text-red-400" : m.daysToDue <= 14 ? "text-orange-400" : "text-sky-300")}>{m.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">Est. Cost</p>
                      <p className="text-[10px] font-mono text-sky-300">${m.estimatedCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">Asset Health</p>
                      <p className={cn("text-[10px] font-mono", m.assetHealth >= 80 ? "text-emerald-400" : m.assetHealth >= 60 ? "text-amber-400" : "text-red-400")}>{m.assetHealth}/100</p>
                    </div>
                  </div>
                  {m.technician !== "TBD" && <p className="text-[9px] text-sky-400/30 mt-2">Technician: {m.technician}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-4">Recent Event History</h3>
          <HistoryTimeline vesselId={vessel.id} />
          {eventLogs.filter(e => e.vesselId === vessel.id).length === 0 && (
            <div className="space-y-2">
              {[
                { msg: `${vessel.name} departed ${vessel.lastPort}`, type: "Info", date: "Mar 28, 2026" },
                { msg: "Cargo loading completed — manifest confirmed", type: "Info", date: "Mar 27, 2026" },
                { msg: "Bunker operation completed — 420MT VLSFO", type: "Info", date: "Mar 27, 2026" },
                { msg: "Port departure clearance received", type: "Info", date: "Mar 28, 2026" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-[11px] text-sky-200">{item.msg}</p>
                    <p className="text-[9px] text-sky-400/30 mt-0.5">{item.date} · {item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
