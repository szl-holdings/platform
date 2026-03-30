import { useState } from "react";
import { useSignals, useUpdateSignal } from "@/hooks/use-lyte";
import { Activity, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const severityColors: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  critical: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-500" },
  high: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-500" },
  medium: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
  low: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400" },
};

const statusColors: Record<string, string> = {
  new: "text-red-400 bg-red-500/10 border-red-500/20",
  acknowledged: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  closed: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

function SignalDrawer({ signal, onClose, onUpdate }: { signal: any; onClose: () => void; onUpdate: (id: number, status: string) => void }) {
  const transitions: { label: string; status: string; color: string }[] = [
    { label: "Acknowledge", status: "acknowledged", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { label: "Resolve", status: "resolved", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { label: "Escalate", status: "escalated", color: "text-red-400 border-red-500/30 bg-red-500/10" },
  ];
  const sc = severityColors[signal.severity] ?? severityColors.medium;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div className="w-full max-w-lg bg-[#0c1626] border-l border-white/10 flex flex-col h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide", sc.text, sc.bg, sc.border)}>{signal.severity}</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <h2 className="text-sm font-semibold text-white">{signal.title}</h2>
          <p className="text-[11px] text-slate-400 mt-1">{signal.source} · {signal.sourceType}</p>
        </div>
        {signal.body && (
          <div className="p-5 border-b border-white/5">
            <p className="text-[11px] text-slate-300 leading-relaxed">{signal.body}</p>
          </div>
        )}
        <div className="p-5 border-b border-white/5">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Signal History</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-slate-400">Received</span>
              <span className="text-slate-500 ml-auto">{new Date(signal.receivedAt || signal.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            {signal.status !== "new" && (
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-slate-400">Status: {signal.status}</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {transitions.map(t => (
              <button
                key={t.status}
                onClick={() => { onUpdate(signal.id, t.status); onClose(); }}
                className={cn("text-[10px] px-3 py-1.5 rounded-lg border font-medium transition-all hover:opacity-80", t.color)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignalsPage() {
  const { data: signals = [], isLoading, isError, refetch } = useSignals();
  const updateSignal = useUpdateSignal();
  const [selectedSignal, setSelectedSignal] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = signals.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (severityFilter !== "all" && s.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = signals.filter(s => s.severity === "critical" && s.status === "new").length;
  const activeCount = signals.filter(s => s.status === "new").length;
  const ackCount = signals.filter(s => s.status === "acknowledged").length;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-amber-400">Lyte · Signals Feed</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Signals</h1>
          <p className="text-sm text-slate-400 mt-1">Live signal feed — all sources, all severities</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Signals", value: activeCount, color: "text-red-400" },
          { label: "Acknowledged", value: ackCount, color: "text-amber-400" },
          { label: "Critical Now", value: criticalCount, color: "text-red-400" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-[10px] text-slate-500 mb-1">{c.label}</div>
            <div className={cn("text-2xl font-bold", c.color)}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500 mr-1">Status:</span>
          {["all", "new", "acknowledged", "resolved"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all", statusFilter === f ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "border-white/5 text-slate-500 hover:text-white")}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500 mr-1">Severity:</span>
          {["all", "critical", "high", "medium", "low"].map(f => (
            <button key={f} onClick={() => setSeverityFilter(f)} className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all", severityFilter === f ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "border-white/5 text-slate-500 hover:text-white")}>
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-slate-500">{filtered.length} signals</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-slate-400">Loading signals…</span>
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Failed to load signals. Check API connectivity.
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl border border-white/5 p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400/20 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No signals match current filters</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(signal => {
          const sc = severityColors[signal.severity] ?? severityColors.medium;
          const sColor = statusColors[signal.status] ?? statusColors.new;
          return (
            <div
              key={signal.id}
              className={cn("rounded-xl border bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition-all", sc.border)}
              onClick={() => setSelectedSignal(signal)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", sc.dot, signal.severity === "critical" && signal.status === "new" && "animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/90 leading-tight mb-1">{signal.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className={sc.text}>{signal.source}</span>
                      <span className="text-slate-700">·</span>
                      <span>{signal.sourceType}</span>
                      <span className="text-slate-700">·</span>
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(signal.receivedAt || signal.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide", sc.text, sc.bg, sc.border)}>{signal.severity}</span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wide", sColor)}>{signal.status}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedSignal && (
        <SignalDrawer
          signal={selectedSignal}
          onClose={() => setSelectedSignal(null)}
          onUpdate={(id, status) => updateSignal.mutate({ id, status })}
        />
      )}
    </div>
  );
}
