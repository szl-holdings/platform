import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useVesselDetail, useFleetExceptions } from "@/hooks/use-vessels-data";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import {
  ArrowLeft, Ship, MapPin, Navigation, Clock, Wrench, AlertTriangle,
  DollarSign, Activity, TrendingUp, TrendingDown, ChevronRight,
  Fuel, Shield, Radio, RefreshCw, Package, Globe, History
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import {
  OperationalAuditTimeline,
  OperationalOwnerChip,
  OperationalStatusBadge,
  OperationalRiskBadge,
  type AuditHistoryEntry,
} from "@szl-holdings/shared-ui/operational-primitives";

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  at_sea: { label: "At Sea", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dotColor: "#22c55e" },
  in_port: { label: "In Port", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dotColor: "#0ea5e9" },
  anchored: { label: "Anchored", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dotColor: "#f59e0b" },
  maintenance: { label: "Maintenance", color: "text-red-400 bg-red-500/10 border-red-500/20", dotColor: "#ef4444" },
  delayed: { label: "Delayed", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", dotColor: "#f97316" },
  loading: { label: "Loading", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", dotColor: "#a78bfa" },
  active: { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dotColor: "#22c55e" },
};

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function fmtUsd(v: string | null | undefined) {
  if (!v) return "—";
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtNum(v: string | null | undefined, decimals = 1) {
  if (!v) return "—";
  const n = parseFloat(v);
  return isNaN(n) ? "—" : n.toFixed(decimals);
}

export default function VesselDetailEnhancedPage() {
  const [matchShort, paramsShort] = useRoute("/vessel/:id");
  const [matchLong, paramsLong] = useRoute("/vessels/:id");
  const params = paramsShort ?? paramsLong;
  const vesselId = Number(params?.id);
  const [tab, setTab] = useState<"overview" | "voyage" | "maintenance" | "portcalls" | "history" | "audit">("overview");

  const { detail, isLoading, refetch } = useVesselDetail(vesselId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 text-sky-400/40 animate-spin mr-2" />
        <span className="text-sm text-sky-400/40">Loading vessel data...</span>
      </div>
    );
  }

  if (!detail) {
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

  const { vessel, position, activeVoyage, voyageHistory, maintenance, portCalls, exceptions, sanctions } = detail;
  const sc = statusConfig[vessel.status] ?? { label: vessel.status, color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dotColor: "#0ea5e9" };

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "voyage" as const, label: "Voyage Economics" },
    { id: "maintenance" as const, label: "Maintenance" },
    { id: "portcalls" as const, label: "Port Calls" },
    { id: "history" as const, label: "Voyage History" },
    { id: "audit" as const, label: "Event History" },
  ];

  const now = new Date().toISOString();
  const vesselAny = vessel as any;
  const vesselCreatedAt: string = vesselAny.createdAt ?? now;
  const vesselUpdatedAt: string = vesselAny.updatedAt ?? vesselCreatedAt;

  const auditEntries: AuditHistoryEntry[] = (() => {
    const entries: AuditHistoryEntry[] = [];
    entries.push({ id: "vessel-added", action: "Vessel in fleet registry", actor: "System", actorType: "system", newState: vessel.status, timestamp: vesselCreatedAt });
    exceptions.forEach((exc: any, i: number) => {
      entries.push({ id: `exc-${i}`, action: `Exception raised: ${exc.title}`, actor: exc.ownerFunction ?? "Fleet Ops", actorType: "user", newState: "exception_open", notes: exc.description?.slice(0, 80), timestamp: exc.raisedAt ?? exc.detectedAt ?? vesselCreatedAt });
    });
    portCalls.slice(0, 5).forEach((pc: any, i: number) => {
      entries.push({ id: `pc-${i}`, action: `Port call: ${pc.portName}`, actor: "AIS System", actorType: "system", newState: "in_port", notes: pc.purpose ? `Purpose: ${pc.purpose}` : undefined, timestamp: pc.arrivalAt ?? pc.arrivedAt ?? vesselCreatedAt });
    });
    if (activeVoyage) {
      entries.push({ id: "voyage-active", action: `Active voyage: ${activeVoyage.originPort} → ${activeVoyage.destinationPort}`, actor: "Voyage System", actorType: "system", newState: "at_sea", notes: activeVoyage.voyageRef, timestamp: activeVoyage.scheduledDepartureAt ?? vesselCreatedAt });
    }
    maintenance.slice(0, 3).forEach((m: any, i: number) => {
      if (m.status === "in_progress") {
        entries.push({ id: `maint-${i}`, action: `Maintenance in progress: ${m.component}`, actor: m.technician ?? "Maintenance Ops", actorType: "user", notes: m.description?.slice(0, 60), timestamp: vesselUpdatedAt });
      }
    });
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  })();

  const openMaintenance = maintenance.filter(m => m.status !== "completed");

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
            {exceptions.length > 0 && (
              <Badge variant="outline" className="text-xs text-red-400 bg-red-500/10 border-red-500/20">
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                {exceptions.length} active exception{exceptions.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <p className="text-xs text-sky-400/50 mt-1 font-mono">
            {vessel.imo && `IMO ${vessel.imo}`}
            {vessel.mmsi && ` · MMSI ${vessel.mmsi}`}
            {vessel.flag && ` · ${vessel.flag}`}
            {vessel.vesselType && ` · ${vessel.vesselType.replace(/_/g, " ")}`}
            {vessel.yearBuilt && ` · ${vessel.yearBuilt}`}
          </p>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400/60 hover:text-sky-300 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider flex items-center gap-1"><Ship className="w-3 h-3" />Type</p>
          <p className="text-[11px] text-sky-200 font-medium mt-0.5 capitalize">{vessel.vesselType?.replace(/_/g, " ") ?? "—"}</p>
        </div>
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider flex items-center gap-1"><Package className="w-3 h-3" />Gross Tonnage</p>
          <p className="text-[11px] text-sky-200 font-medium mt-0.5">{vessel.grossTonnage ? `${parseFloat(vessel.grossTonnage).toLocaleString()} GT` : "—"}</p>
        </div>
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" />Flag State</p>
          <p className="text-[11px] text-sky-200 font-medium mt-0.5">{vessel.flag ?? "—"}</p>
        </div>
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider flex items-center gap-1"><Radio className="w-3 h-3" />Built</p>
          <p className="text-[11px] text-sky-200 font-medium mt-0.5">{vessel.yearBuilt ?? "—"}</p>
        </div>
      </div>

      {position && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 col-span-2">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-3 flex items-center gap-1"><Navigation className="w-3 h-3" />Position & Navigation</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Latitude", value: `${parseFloat(position.latitude).toFixed(4)}°` },
                { label: "Longitude", value: `${parseFloat(position.longitude).toFixed(4)}°` },
                { label: "Speed", value: position.speed ? `${parseFloat(position.speed).toFixed(1)} kn` : "—" },
                { label: "Heading", value: position.heading ? `${parseFloat(position.heading).toFixed(0)}°` : "—" },
                { label: "Last Fix", value: fmtDt(position.recordedAt) },
                { label: "AIS Status", value: "Indicative" },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[9px] text-sky-400/30">{item.label}</p>
                  <p className="text-xs font-mono text-sky-100">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {activeVoyage && (
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" />Current Voyage</p>
              <div className="flex items-center gap-1 text-[10px] text-sky-400/60 mb-2">
                <span className="truncate">{activeVoyage.originPort}</span>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="truncate font-medium text-sky-300">{activeVoyage.destinationPort}</span>
              </div>
              <p className="text-[9px] text-sky-400/40 mt-2">ETA</p>
              <p className="text-[10px] font-mono text-sky-200">{fmtDt(activeVoyage.estimatedArrivalAt)}</p>
              <p className="text-[9px] text-sky-400/40 mt-2">Ref</p>
              <p className="text-[9px] font-mono text-sky-400/60">{activeVoyage.voyageRef}</p>
            </div>
          )}

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-3">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Compliance</p>
            {sanctions ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-sky-400/40">OFAC</p>
                  <Badge variant="outline" className={cn("text-[8px]", sanctions.ofacStatus === "clear" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20")}>
                    {sanctions.ofacStatus?.toUpperCase() ?? "—"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-sky-400/40">PSC</p>
                  <Badge variant="outline" className={cn("text-[8px]", sanctions.pscResult === "passed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20")}>
                    {sanctions.pscResult?.replace(/_/g, " ").toUpperCase() ?? "—"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-sky-400/40">Score</p>
                  <p className={cn("text-xs font-mono font-bold", parseFloat(sanctions.complianceScore ?? "0") >= 75 ? "text-emerald-400" : "text-amber-400")}>{fmtNum(sanctions.complianceScore, 0)}/100</p>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-sky-400/30">No screening data</p>
            )}
          </div>
        </div>
      )}

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
                <Shield className="w-6 h-6 text-emerald-400/30 mx-auto mb-2" />
                <p className="text-xs text-emerald-400/50">No active exceptions</p>
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

            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mt-4">Open Maintenance</h3>
            {openMaintenance.length === 0 ? (
              <div className="py-6 text-center border border-sky-500/10 rounded-xl bg-[#0a1628]/60">
                <p className="text-xs text-emerald-400/60">No open maintenance items</p>
              </div>
            ) : openMaintenance.slice(0, 3).map(m => (
              <div key={m.id} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Wrench className="w-3.5 h-3.5 text-amber-400/60 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-sky-100">{m.component}</p>
                    <p className="text-[10px] text-sky-400/50 mt-0.5">{(m.description ?? "").slice(0, 80)}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[9px]">
                      {m.dueDate && (
                        <span className={cn(new Date(m.dueDate) < new Date() ? "text-red-400" : "text-sky-400/40")}>
                          Due {fmt(m.dueDate)}
                        </span>
                      )}
                      <span className="text-sky-400/30">{fmtUsd(m.estimatedCost)}</span>
                      <Badge variant="outline" className={cn("text-[8px]", m.priority === "critical" ? "text-red-400 bg-red-500/10 border-red-500/20" : m.priority === "high" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20")}>
                        {m.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Current Voyage Economics</h3>
            {activeVoyage ? (
              <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-medium text-sky-200">{activeVoyage.originPort} → {activeVoyage.destinationPort}</p>
                  <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/20 ml-auto capitalize">{activeVoyage.charterType?.replace(/_/g, " ")}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Gross Revenue", value: fmtUsd(activeVoyage.grossRevenue), color: "text-emerald-400" },
                    { label: "Total Costs", value: fmtUsd(activeVoyage.totalCostsUsd), color: "text-amber-400" },
                    { label: "Net Margin", value: fmtUsd(activeVoyage.netMarginUsd), color: "text-sky-300" },
                    { label: "Margin %", value: activeVoyage.marginPct ? `${parseFloat(activeVoyage.marginPct) * 100 > 1 ? parseFloat(activeVoyage.marginPct).toFixed(1) : (parseFloat(activeVoyage.marginPct) * 100).toFixed(1)}%` : "—", color: "text-violet-400" },
                    { label: "TCE/day", value: activeVoyage.tcePerDay ? `$${Math.round(parseFloat(activeVoyage.tcePerDay)).toLocaleString()}` : "—", color: "text-violet-400" },
                    { label: "Fuel Cost", value: fmtUsd(activeVoyage.fuelCostUsd), color: "text-amber-400" },
                  ].map(item => (
                    <div key={item.label} className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
                      <p className="text-[9px] text-sky-400/40">{item.label}</p>
                      <p className={cn("text-xs font-mono font-bold mt-0.5", item.color)}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {activeVoyage.cargoType && (
                  <div className="pt-2 border-t border-sky-500/10 flex items-center gap-2 text-[10px]">
                    <Package className="w-3 h-3 text-sky-400/40" />
                    <span className="text-sky-400/60">{activeVoyage.cargoType}</span>
                    {activeVoyage.cargoQuantityMt && <span className="text-sky-400/40">· {parseFloat(activeVoyage.cargoQuantityMt).toLocaleString()} MT</span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center border border-sky-500/10 rounded-xl bg-[#0a1628]/60">
                <p className="text-xs text-sky-400/30">No active voyage economics</p>
              </div>
            )}

            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mt-2">Compliance Status</h3>
            {sanctions ? (
              <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-2">
                {[
                  { label: "OFAC SDN", value: sanctions.ofacStatus, good: "clear" },
                  { label: "EU Sanctions", value: sanctions.euStatus, good: "clear" },
                  { label: "UN Sanctions", value: sanctions.unStatus, good: "clear" },
                  { label: "UK Sanctions", value: sanctions.ukStatus, good: "clear" },
                  { label: "PSC Inspection", value: sanctions.pscResult, good: "passed" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <p className="text-[10px] text-sky-400/50">{row.label}</p>
                    <Badge variant="outline" className={cn("text-[8px]", row.value === row.good ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20")}>
                      {row.value?.replace(/_/g, " ").toUpperCase() ?? "—"}
                    </Badge>
                  </div>
                ))}
                {sanctions.knownOwner && (
                  <div className="pt-2 border-t border-sky-500/10 text-[9px] text-sky-400/40">
                    Owner: <span className="text-sky-300/60">{sanctions.knownOwner}</span>
                    {sanctions.knownManager && <span> · Mgr: <span className="text-sky-300/60">{sanctions.knownManager}</span></span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center border border-sky-500/10 rounded-xl bg-[#0a1628]/60">
                <p className="text-xs text-sky-400/30">No sanctions screening data</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "voyage" && (
        <div className="space-y-4">
          {activeVoyage ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Route</p>
                  <p className="text-sm font-medium text-sky-100 mt-1">{activeVoyage.originPort} → {activeVoyage.destinationPort}</p>
                  <p className="text-[10px] text-sky-400/50">{activeVoyage.cargoType} · {activeVoyage.cargoQuantityMt ? `${parseFloat(activeVoyage.cargoQuantityMt).toLocaleString()} MT` : "—"}</p>
                </div>
                <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Charter</p>
                  <p className="text-sm font-medium text-sky-100 mt-1 capitalize">{activeVoyage.charterType?.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-sky-400/50">Rate: {activeVoyage.charterRatePerDay ? `$${Math.round(parseFloat(activeVoyage.charterRatePerDay)).toLocaleString()}/day` : "—"}</p>
                </div>
                <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Delay Status</p>
                  <p className={cn("text-sm font-medium mt-1", parseFloat(activeVoyage.delayHours ?? "0") > 0 ? "text-orange-400" : "text-emerald-400")}>
                    {parseFloat(activeVoyage.delayHours ?? "0") > 0 ? `${parseFloat(activeVoyage.delayHours!).toFixed(0)}h delayed` : "On schedule"}
                  </p>
                  {parseFloat(activeVoyage.delayCostUsd ?? "0") > 0 && <p className="text-[10px] text-orange-400/70">{fmtUsd(activeVoyage.delayCostUsd)} delay cost</p>}
                </div>
              </div>

              <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-4">P&L Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[9px] text-sky-400/40">Revenue</p>
                    <p className="text-lg font-bold text-emerald-400">{fmtUsd(activeVoyage.grossRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-sky-400/40">Total Cost</p>
                    <p className="text-lg font-bold text-amber-400">{fmtUsd(activeVoyage.totalCostsUsd)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-sky-400/40">Net Margin</p>
                    <p className="text-lg font-bold text-sky-300">{fmtUsd(activeVoyage.netMarginUsd)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-sky-400/40">TCE/day</p>
                    <p className="text-lg font-bold text-violet-400">{activeVoyage.tcePerDay ? `$${Math.round(parseFloat(activeVoyage.tcePerDay)).toLocaleString()}` : "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Fuel Cost", value: fmtUsd(activeVoyage.fuelCostUsd), sub: activeVoyage.fuelConsumedMt ? `${parseFloat(activeVoyage.fuelConsumedMt).toFixed(0)}t consumed` : "—", icon: Fuel, color: "text-amber-400" },
                  { label: "Port Costs", value: fmtUsd(activeVoyage.portCostsUsd), sub: "dues, fees, pilotage", icon: Activity, color: "text-sky-300" },
                  { label: "Delay Impact", value: parseFloat(activeVoyage.delayCostUsd ?? "0") > 0 ? fmtUsd(activeVoyage.delayCostUsd) : "None", sub: parseFloat(activeVoyage.delayHours ?? "0") > 0 ? `${parseFloat(activeVoyage.delayHours!).toFixed(0)}h delay` : "On schedule", icon: Clock, color: parseFloat(activeVoyage.delayCostUsd ?? "0") > 0 ? "text-orange-400" : "text-emerald-400" },
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
            </>
          ) : (
            <div className="py-16 text-center border border-sky-500/10 rounded-xl">
              <DollarSign className="w-10 h-10 text-sky-400/20 mx-auto mb-3" />
              <p className="text-sky-400/40">No active voyage economics</p>
            </div>
          )}
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
                        {m.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-sky-400/60 mt-1">{m.description}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-[9px] text-sky-400/30">Due Date</p>
                      <p className={cn("text-[10px] font-mono", m.dueDate && new Date(m.dueDate) < new Date() ? "text-red-400" : "text-sky-300")}>{fmt(m.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">Est. Cost</p>
                      <p className="text-[10px] font-mono text-sky-300">{fmtUsd(m.estimatedCost)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">Asset Health</p>
                      <p className={cn("text-[10px] font-mono", parseFloat(m.assetHealth ?? "75") >= 80 ? "text-emerald-400" : parseFloat(m.assetHealth ?? "75") >= 60 ? "text-amber-400" : "text-red-400")}>{fmtNum(m.assetHealth, 0)}/100</p>
                    </div>
                  </div>
                  {m.technician && m.technician !== "TBD" && <p className="text-[9px] text-sky-400/30 mt-2">Technician: {m.technician}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "portcalls" && (
        <div className="space-y-3">
          {portCalls.length === 0 ? (
            <div className="py-16 text-center border border-sky-500/10 rounded-xl">
              <MapPin className="w-10 h-10 text-sky-400/20 mx-auto mb-3" />
              <p className="text-sky-400/40">No port call records</p>
            </div>
          ) : portCalls.map(pc => (
            <div key={pc.id} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-sky-400/50 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-sky-100 flex-1">{pc.portName}</p>
                    <div className="flex gap-1.5 shrink-0">
                      {pc.portLocode && <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/20">{pc.portLocode}</Badge>}
                      {pc.purpose && <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/20 capitalize">{pc.purpose}</Badge>}
                    </div>
                  </div>
                  <p className="text-[10px] text-sky-400/40 mt-0.5">{pc.portCountry}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-[9px] text-sky-400/30">Arrival</p>
                      <p className="text-[10px] font-mono text-sky-300">{fmtDt(pc.arrivalAt)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">Duration</p>
                      <p className="text-[10px] font-mono text-sky-300">{pc.durationHours ? `${parseFloat(pc.durationHours).toFixed(0)}h` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">Port Cost</p>
                      <p className="text-[10px] font-mono text-sky-300">{fmtUsd(pc.portCostUsd)}</p>
                    </div>
                  </div>
                  {pc.canalTransit && pc.canalName && (
                    <p className="text-[9px] text-amber-400/60 mt-2">Canal transit: {pc.canalName} · {fmtUsd(pc.canalFeeUsd)}</p>
                  )}
                  {pc.agentName && <p className="text-[9px] text-sky-400/30 mt-1">Agent: {pc.agentName}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-sky-100">Event History</h3>
              <p className="text-[10px] text-sky-400/40 mt-0.5">Chronological record of fleet events, exceptions, maintenance, and voyage state changes</p>
            </div>
            {sanctions?.knownOwner && (
              <div className="text-right">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Registered Owner</p>
                <OperationalOwnerChip owner={{ name: sanctions.knownOwner, role: sanctions.knownManager ? `Mgr: ${sanctions.knownManager}` : "Owner" }} size="xs" />
              </div>
            )}
          </div>
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            {auditEntries.length === 0 ? (
              <div className="py-8 text-center">
                <History className="w-8 h-8 text-sky-400/20 mx-auto mb-2" />
                <p className="text-xs text-sky-400/30">No event history available</p>
              </div>
            ) : (
              <OperationalAuditTimeline entries={auditEntries} />
            )}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Voyage History</h3>
          {voyageHistory.length === 0 ? (
            <div className="py-16 text-center border border-sky-500/10 rounded-xl">
              <Activity className="w-10 h-10 text-sky-400/20 mx-auto mb-3" />
              <p className="text-sky-400/40">No voyage history</p>
            </div>
          ) : voyageHistory.map(v => (
            <div key={v.id} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", v.status === "completed" ? "bg-emerald-400" : v.status === "at_sea" ? "bg-sky-400 animate-pulse" : "bg-sky-400/30")} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium text-sky-100">{v.originPort} → {v.destinationPort}</p>
                    <Badge variant="outline" className={cn("text-[8px]", v.status === "completed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : v.status === "at_sea" ? "text-sky-400 bg-sky-500/10 border-sky-500/20" : "text-sky-400/40 border-sky-500/10")}>
                      {v.status?.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[9px] text-sky-400/40 font-mono ml-auto">{v.voyageRef}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div>
                      <p className="text-[9px] text-sky-400/30">Revenue</p>
                      <p className="text-[10px] font-mono text-emerald-400">{fmtUsd(v.grossRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">Margin</p>
                      <p className="text-[10px] font-mono text-sky-300">{fmtUsd(v.netMarginUsd)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">TCE/day</p>
                      <p className="text-[10px] font-mono text-violet-400">{v.tcePerDay ? `$${Math.round(parseFloat(v.tcePerDay)).toLocaleString()}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-400/30">Departed</p>
                      <p className="text-[10px] font-mono text-sky-400/50">{fmt(v.scheduledDepartureAt)}</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-sky-400/30 mt-1.5 capitalize">{v.charterType?.replace(/_/g, " ")} · {v.cargoType}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
