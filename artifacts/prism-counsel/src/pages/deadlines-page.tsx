import { Clock, AlertTriangle, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { usePrismMatters, usePrismDeadlines } from "../hooks/use-prism-api";

export default function DeadlinesPage() {
  const mattersQ = usePrismMatters();
  const deadlinesQ = usePrismDeadlines();
  const isLive = !mattersQ.isLoading && !deadlinesQ.isLoading;
  const hasData = Array.isArray(mattersQ.data) && mattersQ.data.length > 0;

  const allDeadlines = (() => {
    if (Array.isArray(deadlinesQ.data) && deadlinesQ.data.length > 0) {
      return (deadlinesQ.data as Array<{ id: number; title: string; dueDate: string; deadlineType: string; priority: string; matterId: number; matterTitle?: string; caseNumber?: string }>)
        .map(d => ({
          title: d.title,
          date: d.dueDate,
          type: d.deadlineType ?? "deadline",
          priority: d.priority ?? "medium",
          matterId: d.matterId,
          matterTitle: d.matterTitle ?? `Matter #${d.matterId}`,
          caseNumber: d.caseNumber ?? "",
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    if (Array.isArray(mattersQ.data)) {
      return (mattersQ.data as Array<{ id: number; title: string; caseNumber?: string; deadlines?: Array<{ title: string; dueDate: string; deadlineType?: string; priority?: string }> }>)
        .flatMap(m =>
          (m.deadlines ?? []).map(d => ({
            title: d.title,
            date: d.dueDate,
            type: d.deadlineType ?? "deadline",
            priority: d.priority ?? "medium",
            matterId: m.id,
            matterTitle: m.title,
            caseNumber: m.caseNumber ?? "",
          }))
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return [];
  })();

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Deadlines</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {mattersQ.isLoading || deadlinesQ.isLoading
              ? "Loading…"
              : hasData
              ? `${allDeadlines.length} deadlines across all active matters`
              : "No matters loaded — add matters to track deadlines"}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
          mattersQ.isLoading || deadlinesQ.isLoading
            ? "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
            : hasData
            ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20"
            : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
        }`}>
          {mattersQ.isLoading || deadlinesQ.isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : hasData ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {mattersQ.isLoading || deadlinesQ.isLoading ? "LOADING" : hasData ? "LIVE" : "NO DATA"}
        </span>
      </div>

      {isLive && !hasData && (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No matters found</p>
          <p className="text-xs text-slate-600 mt-1">Add matters in the Matters section to start tracking deadlines.</p>
        </div>
      )}

      {isLive && hasData && allDeadlines.length === 0 && (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No deadlines recorded</p>
          <p className="text-xs text-slate-600 mt-1">Deadlines will appear here once added to matters.</p>
        </div>
      )}

      <div className="space-y-2">
        {allDeadlines.map((d, i) => {
          const daysLeft = Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000);
          const urgency = daysLeft <= 7 ? "#c45a4a" : daysLeft <= 30 ? "#d4a054" : "#4a90b8";
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4 flex items-center gap-4" style={{ background: "#0c1220" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: urgency + "15" }}>
                {daysLeft <= 7 ? <AlertTriangle className="w-4 h-4" style={{ color: urgency }} /> : <Clock className="w-4 h-4" style={{ color: urgency }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-200">{d.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Link href={`/prism-counsel/matters/${d.matterId}`}>
                    <span className="text-[10px] text-[#d4a054] hover:underline cursor-pointer">{d.matterTitle}</span>
                  </Link>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">{d.type.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono" style={{ color: urgency }}>
                  {daysLeft > 0 ? `${daysLeft} days` : "OVERDUE"}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
                d.priority === "critical" ? "bg-[#c45a4a]/10 text-[#c45a4a]" :
                d.priority === "high" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                "bg-slate-500/10 text-slate-400"
              }`}>{d.priority.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
