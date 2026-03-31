import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type VesselMaintenance } from "@/lib/api";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Wrench, AlertTriangle, Clock, CheckCircle2, TrendingDown, Ship, Calendar, RefreshCw } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  overdue: { label: "Overdue", color: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  in_progress: { label: "In Progress", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
  due_soon: { label: "Due Soon", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", dot: "bg-orange-400" },
  scheduled: { label: "Scheduled", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", dot: "bg-sky-400" },
  completed: { label: "Completed", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  high: { label: "High", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  medium: { label: "Medium", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  low: { label: "Low", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
};

function num(val: string | number | undefined | null, def = 0): number {
  if (val == null) return def;
  if (typeof val === "number") return val;
  const n = parseFloat(val);
  return isNaN(n) ? def : n;
}

function daysToDue(dueDate?: string | null): number {
  if (!dueDate) return 999;
  const due = new Date(dueDate);
  const now = new Date();
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type DisplayItem = {
  id: number;
  vesselId: number;
  vesselName: string;
  component: string;
  description?: string;
  status: string;
  priority: string;
  daysToDue: number;
  riskOfServiceIssue: number;
  estimatedCost: number;
  impactsVoyageAvailability: boolean;
  assetHealth: number;
  technician?: string;
};

function adaptMaintenanceItem(item: VesselMaintenance, vesselName: string): DisplayItem {
  return {
    id: item.id,
    vesselId: item.vesselId,
    vesselName,
    component: item.component,
    description: item.description,
    status: item.status,
    priority: item.priority,
    daysToDue: daysToDue(item.dueDate),
    riskOfServiceIssue: num(item.riskOfServiceIssue, 0),
    estimatedCost: num(item.estimatedCost, 0),
    impactsVoyageAvailability: item.impactsVoyageAvailability,
    assetHealth: num(item.assetHealth, 75),
    technician: item.technician,
  };
}

function AssetHealthBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? "bg-emerald-400" : value >= 60 ? "bg-amber-400" : value >= 40 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-sky-400/40 w-20 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-[10px] font-mono w-8 text-right shrink-0", color.replace("bg-", "text-"))}>{value}</span>
    </div>
  );
}

function MaintenanceCard({ item }: { item: DisplayItem }) {
  const sc = statusConfig[item.status] ?? statusConfig.scheduled;
  const pc = priorityConfig[item.priority] ?? priorityConfig.medium;

  return (
    <div className={cn("bg-[#0a1628]/80 border rounded-xl p-4", item.status === "overdue" ? "border-red-500/20" : item.priority === "critical" ? "border-orange-500/15" : "border-sky-500/10")}>
      <div className="flex items-start gap-3">
        <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", sc.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sky-100">{item.vesselName}</p>
              <p className="text-[11px] text-sky-300/70 mt-0.5">{item.component}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className={cn("text-[9px]", pc.color)}>{pc.label}</Badge>
              <Badge variant="outline" className={cn("text-[9px]", sc.color)}>{sc.label}</Badge>
            </div>
          </div>

          {item.description && (
            <p className="text-[10px] text-sky-400/50 mt-1.5">{item.description}</p>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase">Due</p>
              <p className={cn("text-[10px] font-mono mt-0.5", item.daysToDue < 0 ? "text-red-400" : item.daysToDue <= 14 ? "text-orange-400" : "text-sky-300")}>
                {item.daysToDue < 0 ? `${Math.abs(item.daysToDue)}d overdue` : item.daysToDue === 0 ? "Today" : item.daysToDue > 900 ? "—" : `In ${item.daysToDue}d`}
              </p>
            </div>
            <div className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase">Service Risk</p>
              <p className={cn("text-[10px] font-mono mt-0.5", item.riskOfServiceIssue >= 80 ? "text-red-400" : item.riskOfServiceIssue >= 60 ? "text-orange-400" : "text-amber-400")}>
                {item.riskOfServiceIssue > 0 ? `${item.riskOfServiceIssue.toFixed(0)}%` : "—"}
              </p>
            </div>
            <div className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase">Est. Cost</p>
              <p className="text-[10px] font-mono text-sky-300 mt-0.5">
                {item.estimatedCost > 0 ? `$${item.estimatedCost.toLocaleString()}` : "—"}
              </p>
            </div>
          </div>

          {item.impactsVoyageAvailability && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400/80">
              <AlertTriangle className="w-2.5 h-2.5" />
              Impacts voyage availability
            </div>
          )}

          {item.technician && item.technician !== "TBD" && (
            <p className="mt-1 text-[10px] text-sky-400/40">Assigned: {item.technician}</p>
          )}
        </div>
      </div>

      {item.assetHealth > 0 && (
        <div className="mt-3 pt-3 border-t border-sky-500/10">
          <AssetHealthBar value={Math.round(item.assetHealth)} label="Asset Health" />
        </div>
      )}
    </div>
  );
}

type FilterType = "all" | "overdue" | "in_progress" | "due_soon" | "scheduled" | "completed";

export default function MaintenanceReadinessPage() {
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: liveItems = [], isLoading: itemsLoading, refetch } = useQuery({
    queryKey: ["vessels-maintenance"],
    queryFn: () => api.maintenance.list(),
    refetchInterval: 120_000,
  });

  const { data: liveVessels = [] } = useQuery({
    queryKey: ["vessels-list"],
    queryFn: () => api.vessels.list(),
  });

  const vesselNameMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const v of liveVessels) m.set(v.id, v.name);
    return m;
  }, [liveVessels]);

  const allItems: DisplayItem[] = useMemo(() => {
    return liveItems.map(item => adaptMaintenanceItem(item, vesselNameMap.get(item.vesselId) ?? `Vessel ${item.vesselId}`));
  }, [liveItems, vesselNameMap]);

  const isLive = liveItems.length > 0;

  const filtered = useMemo(() =>
    allItems.filter(m => filter === "all" || m.status === filter)
      .sort((a, b) => {
        const order: Record<string, number> = { overdue: 0, in_progress: 1, due_soon: 2, scheduled: 3, completed: 4 };
        return (order[a.status] ?? 5) - (order[b.status] ?? 5);
      }),
  [allItems, filter]);

  const overdue = allItems.filter(m => m.status === "overdue").length;
  const inProgress = allItems.filter(m => m.status === "in_progress").length;
  const dueSoon = allItems.filter(m => m.status === "due_soon").length;
  const backlogCost = allItems.filter(m => m.status !== "completed").reduce((a, m) => a + m.estimatedCost, 0);

  const vesselReadiness = useMemo(() => {
    const map = new Map<string, { name: string; items: DisplayItem[] }>();
    for (const item of allItems.filter(m => m.status !== "completed")) {
      const k = item.vesselName;
      if (!map.has(k)) map.set(k, { name: k, items: [] });
      map.get(k)!.items.push(item);
    }
    return Array.from(map.values()).map(v => {
      const health = v.items.length > 0
        ? Math.round(v.items.reduce((a, i) => a + i.assetHealth, 0) / v.items.length)
        : 90;
      const score = Math.max(0, health - v.items.filter(i => i.status === "overdue").length * 10);
      const state = score >= 80 ? "ready" : score >= 60 ? "watch" : score >= 40 ? "limited" : "unavailable";
      return { name: v.name, score, state, itemCount: v.items.length };
    }).sort((a, b) => a.score - b.score);
  }, [allItems]);

  const readinessColors: Record<string, string> = {
    ready: "text-emerald-400",
    watch: "text-amber-400",
    limited: "text-orange-400",
    unavailable: "text-red-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-sky-50">Maintenance Readiness</h1>
            {isLive && (
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono uppercase">Live</span>
            )}
          </div>
          <p className="text-xs text-sky-400/50 mt-0.5">Asset health, service risk, and maintenance watchlist</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-sky-500/10 text-sky-400/50 hover:text-sky-300 hover:border-sky-500/20 transition-all"
        >
          <RefreshCw className={cn("w-4 h-4", itemsLoading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overdue", value: overdue, color: "text-red-400", icon: AlertTriangle },
          { label: "In Progress", value: inProgress, color: "text-amber-400", icon: Wrench },
          { label: "Due Soon", value: dueSoon, color: "text-orange-400", icon: Clock },
          { label: "Backlog Cost", value: `$${(backlogCost / 1000).toFixed(0)}K`, color: "text-sky-300", icon: TrendingDown },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 flex items-center gap-3">
            <s.icon className={cn("w-5 h-5 shrink-0", s.color)} />
            <div>
              <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Maintenance Watchlist</h2>
            <div className="flex items-center gap-1 ml-4 flex-wrap">
              {(["all", "overdue", "in_progress", "due_soon", "scheduled", "completed"] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={cn("text-[9px] px-2 py-1 rounded border transition-all capitalize", filter === f ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {itemsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-sky-500/5 border border-sky-500/10 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sky-400/30 text-sm border border-sky-500/10 rounded-xl">No items match this filter.</div>
              ) : (
                filtered.map(item => <MaintenanceCard key={item.id} item={item} />)
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Vessel Readiness Scores</h2>
          {vesselReadiness.length === 0 ? (
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-[11px] text-sky-400/40">No open maintenance items</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vesselReadiness.map(v => (
                <div key={v.name} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Ship className="w-3.5 h-3.5 text-sky-400/50" />
                    <span className="text-xs font-medium text-sky-100 flex-1">{v.name}</span>
                    <span className={cn("text-sm font-bold font-mono", readinessColors[v.state] ?? "text-sky-400")}>{v.score}</span>
                  </div>
                  <div className="h-1.5 bg-sky-500/10 rounded-full overflow-hidden mb-2">
                    <div
                      className={cn("h-full rounded-full transition-all", v.score >= 80 ? "bg-emerald-400" : v.score >= 60 ? "bg-amber-400" : v.score >= 40 ? "bg-orange-400" : "bg-red-400")}
                      style={{ width: `${v.score}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-sky-400/40">
                    <span className={cn("capitalize font-medium", readinessColors[v.state] ?? "text-sky-400")}>{v.state.replace("_", " ")}</span>
                    {v.itemCount > 0 && (
                      <span className="ml-auto text-amber-400/60">{v.itemCount} open item{v.itemCount > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <h3 className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider mb-3">Coming Due (30 days)</h3>
            <div className="space-y-2">
              {allItems
                .filter(m => m.daysToDue >= 0 && m.daysToDue <= 30 && m.status !== "completed")
                .sort((a, b) => a.daysToDue - b.daysToDue)
                .slice(0, 5)
                .map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-sky-400/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-sky-200/70 truncate">{item.vesselName}</p>
                      <p className="text-[9px] text-sky-400/40 truncate">{item.component}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-[10px] font-mono", item.daysToDue <= 7 ? "text-orange-400" : "text-sky-300")}>
                        in {item.daysToDue}d
                      </p>
                    </div>
                  </div>
                ))}
              {allItems.filter(m => m.daysToDue >= 0 && m.daysToDue <= 30 && m.status !== "completed").length === 0 && (
                <p className="text-[11px] text-sky-400/30">Nothing due in the next 30 days</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
