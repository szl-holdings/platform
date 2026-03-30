import { useState } from "react";
import { Link } from "wouter";
import { vesselsDomainMockData } from "@/data/mock-data";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Ship, ChevronRight, AlertTriangle, Wrench, TrendingUp, TrendingDown, Search } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const { vessels } = vesselsDomainMockData;

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  at_sea: { label: "At Sea", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dotColor: "bg-emerald-400" },
  in_port: { label: "In Port", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dotColor: "bg-sky-400" },
  anchored: { label: "Anchored", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dotColor: "bg-amber-400" },
  maintenance: { label: "Maintenance", color: "text-red-400 bg-red-500/10 border-red-500/20", dotColor: "bg-red-400" },
  delayed: { label: "Delayed", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", dotColor: "bg-orange-400" },
  loading: { label: "Loading", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", dotColor: "bg-violet-400" },
  risk_watch: { label: "Risk Watch", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dotColor: "bg-amber-400" },
  exception_active: { label: "Exception Active", color: "text-red-400 bg-red-500/10 border-red-500/20", dotColor: "bg-red-400" },
};

const readinessColors: Record<string, string> = {
  ready: "text-emerald-400",
  watch: "text-amber-400",
  limited: "text-orange-400",
  unavailable: "text-red-400",
};

export default function VesselsListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "tce" | "readiness" | "utilization">("tce");

  const statuses = ["all", ...Array.from(new Set(vessels.map(v => v.status)))];

  const filtered = vessels
    .filter(v => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.type.toLowerCase().includes(search.toLowerCase()) && !v.flag.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "tce") return b.tce - a.tce;
      if (sortBy === "readiness") return b.readinessScore - a.readinessScore;
      if (sortBy === "utilization") return b.utilization - a.utilization;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50">Vessel Roster</h1>
        <p className="text-xs text-sky-400/50 mt-0.5">{vessels.length} vessels · SZL Maritime fleet</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vessels..."
            className="pl-8 pr-3 py-2 bg-[#0a1628]/80 border border-sky-500/10 rounded-lg text-xs text-sky-200 placeholder:text-sky-400/30 focus:outline-none focus:border-sky-500/30 w-48"
          />
        </div>
        <div className="flex items-center gap-1">
          {statuses.slice(0, 6).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("text-[10px] px-2 py-1.5 rounded-lg border transition-all capitalize", statusFilter === s ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
              {s === "all" ? "All" : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-sky-400/40 mr-1">Sort:</span>
          {[{ id: "tce", label: "TCE" }, { id: "readiness", label: "Readiness" }, { id: "utilization", label: "Utilization" }, { id: "name", label: "Name" }].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id as typeof sortBy)} className={cn("text-[10px] px-2 py-1.5 rounded-lg border transition-all", sortBy === s.id ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(v => {
          const sc = statusConfig[v.status] || { label: v.status, color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dotColor: "bg-sky-400" };
          return (
            <Link key={v.id} href={`/vessel/${v.id}`}>
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
                      {v.alertCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] text-red-400">
                          <AlertTriangle className="w-2.5 h-2.5" />{v.alertCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-sky-400/40 mt-0.5">
                      {v.type} · IMO {v.imo} · {v.flag} · {v.fleet}
                    </p>
                  </div>

                  <div className="hidden md:grid grid-cols-5 gap-4 shrink-0 items-center">
                    <div className="text-center">
                      <p className="text-[9px] text-sky-400/30">TCE</p>
                      <p className="text-[11px] font-mono text-sky-300">{v.tce > 0 ? `$${(v.tce / 1000).toFixed(1)}K` : "—"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-sky-400/30">Utilization</p>
                      <p className="text-[11px] font-mono text-sky-300">{v.utilization > 0 ? `${v.utilization}%` : "—"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-sky-400/30">CII</p>
                      <p className={cn("text-[11px] font-mono font-bold", v.ciiRating === "A" ? "text-emerald-400" : v.ciiRating === "B" ? "text-sky-400" : "text-amber-400")}>{v.ciiRating}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-sky-400/30">Readiness</p>
                      <p className={cn("text-[11px] font-mono font-bold", readinessColors[v.readinessState])}>{v.readinessScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-sky-400/30">ETA Δ</p>
                      <p className={cn("text-[11px] font-mono", v.etaDelta < 0 ? "text-emerald-400" : v.etaDelta > 0 ? "text-orange-400" : "text-sky-400/40")}>
                        {v.etaDelta === 0 ? "On time" : v.etaDelta > 0 ? `+${v.etaDelta}h` : `${v.etaDelta}h`}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-sky-400/20 shrink-0" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
