import { useReadiness, useUpdateReadinessItem } from "@/hooks/use-lyte";
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  complete: { label: "Complete", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  in_progress: { label: "In Progress", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  blocked: { label: "Blocked", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  pending: { label: "Pending", icon: AlertTriangle, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

export default function ReadinessPage() {
  const { data, isLoading, isError, refetch } = useReadiness();
  const updateItem = useUpdateReadinessItem();

  const items = data?.items ?? [];
  const summary = data?.summary ?? { total: 0, complete: 0, blocked: 0, score: 0 };

  const groupedByCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-amber-400">Lyte · Readiness</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Readiness Module</h1>
          <p className="text-sm text-slate-400 mt-1">Operational readiness items with scores and status</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-amber-300 mb-1">{summary.score}%</div>
          <div className="text-[11px] text-amber-400/70 uppercase tracking-wide">Readiness Score</div>
        </div>
        {[
          { label: "Total Items", value: summary.total, color: "text-slate-300" },
          { label: "Complete", value: summary.complete, color: "text-emerald-400" },
          { label: "Blocked", value: summary.blocked, color: "text-red-400" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-[10px] text-slate-500 mb-1">{c.label}</div>
            <div className={cn("text-2xl font-bold", c.color)}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 h-3">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
          style={{ width: `${summary.score}%` }}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-slate-400">Loading readiness data…</span>
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Failed to load readiness data. Check API connectivity.
        </div>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <div className="rounded-xl border border-white/5 p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400/20 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No readiness items configured yet</p>
        </div>
      )}

      {Object.entries(groupedByCategory).map(([category, catItems]) => (
        <div key={category}>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</h2>
          <div className="space-y-2">
            {catItems.map(item => {
              const config = statusConfig[item.status] ?? statusConfig.pending;
              const Icon = config.icon;
              return (
                <div key={item.id} className={cn("rounded-xl border bg-white/[0.02] p-4 flex items-start gap-3", config.border)}>
                  <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-white/90">{item.title}</p>
                        {item.description && <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>}
                        {item.owner && <p className="text-[10px] text-slate-500 mt-0.5">{item.owner}{item.ownerTeam ? ` · ${item.ownerTeam}` : ""}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.score != null && (
                          <span className="text-[10px] font-mono text-amber-400">{item.score}%</span>
                        )}
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wide", config.color, config.bg, config.border)}>{config.label}</span>
                      </div>
                    </div>
                    {item.status !== "complete" && (
                      <div className="flex gap-2 mt-2">
                        {item.status !== "in_progress" && (
                          <button
                            onClick={() => updateItem.mutate({ id: item.id, status: "in_progress" })}
                            className="text-[9px] px-2 py-1 rounded border border-amber-500/20 text-amber-400 bg-amber-500/10 hover:opacity-80 transition-all"
                          >
                            Mark In Progress
                          </button>
                        )}
                        <button
                          onClick={() => updateItem.mutate({ id: item.id, status: "complete", score: 100 })}
                          className="text-[9px] px-2 py-1 rounded border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 hover:opacity-80 transition-all"
                        >
                          Mark Complete
                        </button>
                        {item.status !== "blocked" && (
                          <button
                            onClick={() => updateItem.mutate({ id: item.id, status: "blocked" })}
                            className="text-[9px] px-2 py-1 rounded border border-red-500/20 text-red-400 bg-red-500/10 hover:opacity-80 transition-all"
                          >
                            Mark Blocked
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
