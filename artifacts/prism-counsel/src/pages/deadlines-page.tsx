import { Clock, AlertTriangle, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { DEMO_MATTERS } from "../data/demo-matters";
import { usePrismMatters } from "../hooks/use-prism-api";

export default function DeadlinesPage() {
  const mattersQ = usePrismMatters();
  const isLive = Array.isArray(mattersQ.data) && mattersQ.data.length > 0;

  const allDeadlines = DEMO_MATTERS.flatMap(m =>
    (m.deadlines || []).map(d => ({ ...d, matterTitle: m.title, matterId: m.id, caseNumber: m.caseNumber }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Deadlines</h1>
          <p className="text-xs text-slate-500 mt-0.5">{allDeadlines.length} deadlines across all active matters</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
          isLive ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
        }`}>
          {mattersQ.isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {mattersQ.isLoading ? "LOADING" : isLive ? "LIVE" : "DEMO"}
        </span>
      </div>

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
