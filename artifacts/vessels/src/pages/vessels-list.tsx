import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";
import { useState } from "react";
import { Link } from "wouter";
import { useRoster } from "@/hooks/use-vessels-data";
import { type RosterVessel } from "@/lib/api";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { PageDataSkeleton } from "@szl-holdings/shared-ui/page-data-skeleton";
import { Ship, ChevronRight, AlertTriangle, Search, RefreshCw, MapPin, Clock, TrendingUp } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  at_sea: { label: "At Sea", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dotColor: "bg-emerald-400" },
  in_port: { label: "In Port", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dotColor: "bg-sky-400" },
  anchored: { label: "Anchored", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dotColor: "bg-amber-400" },
  maintenance: { label: "Maintenance", color: "text-red-400 bg-red-500/10 border-red-500/20", dotColor: "bg-red-400" },
  active: { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dotColor: "bg-emerald-400" },
  inactive: { label: "Inactive", color: "text-sky-400/40 bg-sky-500/5 border-sky-500/10", dotColor: "bg-sky-400/40" },
  delayed: { label: "Delayed", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", dotColor: "bg-orange-400" },
  loading: { label: "Loading", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", dotColor: "bg-violet-400" },
  risk_watch: { label: "Risk Watch", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dotColor: "bg-amber-400" },
};

function RosterRow({ v }: { v: RosterVessel }) {
  const sc = statusConfig[v.status] ?? { label: v.status, color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dotColor: "bg-sky-400" };
  const lat = v.latitude ? parseFloat(v.latitude) : null;
  const lon = v.longitude ? parseFloat(v.longitude) : null;
  const tce = v.tcePerDay ? parseFloat(v.tcePerDay) : null;
  const eta = v.eta ? new Date(v.eta) : null;

  return (
    <Link href={`/vessel/${v.id}`}>
      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl px-4 py-3 hover:border-sky-500/20 hover:bg-sky-500/5 cursor-pointer transition-all">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
            <Ship className="w-4 h-4 text-sky-400/60" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-sky-100">{v.name}</p>
              <Badge variant="outline" className={cn("text-[9px] shrink-0", sc.color)}>
                <span className={cn("w-1 h-1 rounded-full mr-1", sc.dotColor)} />
                {sc.label}
              </Badge>
              {v.activeExceptions > 0 && (
                <Badge variant="outline" className="text-[9px] text-red-400 bg-red-500/10 border-red-500/20 shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                  {v.activeExceptions}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-sky-400/40 mt-0.5">
              {v.vesselType && <span>{v.vesselType.replace(/_/g, " ")} · </span>}
              {v.imo && <span>IMO {v.imo} · </span>}
              {v.flag && <span>{v.flag}</span>}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-6 shrink-0 text-right">
            {v.destination && (
              <div>
                <p className="text-[9px] text-sky-400/30 flex items-center gap-1 justify-end">
                  <MapPin className="w-2.5 h-2.5" />
                  Destination
                </p>
                <p className="text-[11px] text-sky-200 font-medium">{v.destination}</p>
                {eta && (
                  <p className="text-[9px] text-sky-400/40 flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    ETA {eta.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            )}

            {lat !== null && lon !== null && (
              <div>
                <p className="text-[9px] text-sky-400/30">Position</p>
                <p className="text-[11px] font-mono text-sky-300">
                  {lat.toFixed(2)}°, {lon.toFixed(2)}°
                </p>
                {v.speed && (
                  <p className="text-[9px] text-sky-400/40 mt-0.5">{parseFloat(v.speed).toFixed(1)} kn</p>
                )}
              </div>
            )}

            {tce !== null && tce > 0 && (
              <div>
                <p className="text-[9px] text-sky-400/30 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-2.5 h-2.5" />
                  TCE/day
                </p>
                <p className="text-[11px] font-mono text-emerald-400">${Math.round(tce).toLocaleString()}</p>
                {v.charterType && (
                  <p className="text-[9px] text-sky-400/40 mt-0.5 capitalize">{v.charterType.replace(/_/g, " ")}</p>
                )}
              </div>
            )}

            {v.mmsi && !v.destination && lat === null && (
              <div>
                <p className="text-[9px] text-sky-400/30">MMSI</p>
                <p className="text-[11px] font-mono text-sky-300">{v.mmsi}</p>
              </div>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-sky-400/20 shrink-0" />
        </div>
      </div>
    </Link>
  );
}

export default function VesselsListPage() {
  const { roster, isLive, isLoading, refetch, isRefetching } = useRoster();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "type" | "flag" | "tce">("name");

  const allStatuses = ["all", ...Array.from(new Set(roster.map(v => v.status)))];

  const filtered = roster
    .filter(v => {
      if (search) {
        const q = search.toLowerCase();
        if (!v.name.toLowerCase().includes(q) &&
            !(v.vesselType ?? "").toLowerCase().includes(q) &&
            !(v.flag ?? "").toLowerCase().includes(q) &&
            !(v.imo ?? "").toLowerCase().includes(q) &&
            !(v.destination ?? "").toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "type") return (a.vesselType ?? "").localeCompare(b.vesselType ?? "");
      if (sortBy === "flag") return (a.flag ?? "").localeCompare(b.flag ?? "");
      if (sortBy === "tce") {
        const ta = a.tcePerDay ? parseFloat(a.tcePerDay) : 0;
        const tb = b.tcePerDay ? parseFloat(b.tcePerDay) : 0;
        return tb - ta;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50">Vessel Roster</h1>
          <p className="text-xs text-sky-400/50 mt-0.5">
            {roster.length} vessels · SZL Maritime fleet
            {isLive && <span className="ml-2 text-emerald-400/60">· live</span>}
            {!isLive && !isLoading && <span className="ml-2 text-sky-400/40">· loading</span>}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400/60 hover:text-sky-300 transition-all disabled:opacity-40"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", (isLoading || isRefetching) && "animate-spin")} />
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vessels, destination..."
            className="pl-8 pr-3 py-2 bg-[#0a1628]/80 border border-sky-500/10 rounded-lg text-xs text-sky-200 placeholder:text-sky-400/30 focus:outline-none focus:border-sky-500/30 w-56"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {allStatuses.slice(0, 7).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("text-[10px] px-2 py-1.5 rounded-lg border transition-all capitalize", statusFilter === s ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
              {s === "all" ? "All" : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-sky-400/40 mr-1">Sort:</span>
          {[{ id: "name", label: "Name" }, { id: "type", label: "Type" }, { id: "flag", label: "Flag" }, { id: "tce", label: "TCE" }].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id as typeof sortBy)} className={cn("text-[10px] px-2 py-1.5 rounded-lg border transition-all", sortBy === s.id ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <PageDataSkeleton rows={8} accentColor="#38bdf8" />}

      <div className="space-y-2">
        {filtered.map(v => <RosterRow key={v.id} v={v} />)}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={Ship}
            headline="No vessels match your filters"
            description="Try adjusting your search or status filters to see more vessels."
            compact
            accentColor="#38bdf8"
          />
        )}
      </div>
    </div>
  );
}
