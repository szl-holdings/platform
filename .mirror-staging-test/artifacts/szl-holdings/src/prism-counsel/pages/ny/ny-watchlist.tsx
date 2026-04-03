import { useState } from "react";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useNyMatters, useNyMatterClocks, useNyForecasts, type NyMatterClock, type NyForecastRun } from "../../hooks/use-ny-api";

function ClockStatusBadge({ status }: { status: string }) {
  if (status === "breached") return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#c45a4a]/20 text-[#c45a4a]">BREACHED</span>;
  if (status === "running") return <span className="px-2 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054]">RUNNING</span>;
  return <span className="px-2 py-0.5 rounded text-[9px] bg-white/[0.06] text-slate-400">{status.toUpperCase()}</span>;
}

function MatterClockSection({ matterId, matterTitle }: { matterId: number; matterTitle: string }) {
  const { data: clocks, isLoading } = useNyMatterClocks(matterId);
  const { data: forecasts } = useNyForecasts(matterId);

  if (isLoading) return <div className="text-[10px] text-slate-600 py-2"><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Loading clocks...</div>;
  if (!clocks || clocks.length === 0) return <div className="text-[10px] text-slate-600 py-2">No clocks found for this matter</div>;

  const breachedClocks = clocks.filter(c => c.isBreached || c.status === "breached");
  const urgentClocks = clocks.filter(c => !c.isBreached && c.status === "running" && (c.daysRemaining ?? 999) < 30);
  const deadlineBreachForecast = forecasts?.find(f => f.forecastType === "deadline_breach_risk");

  return (
    <div className="space-y-2">
      {breachedClocks.map((c, i) => (
        <div key={i} className="rounded border border-[#c45a4a]/20 p-3" style={{ background: "#1a0808" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-[#c45a4a]">{c.clockType.replace(/_/g, " ")}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{matterTitle.split(" (")[0]}</div>
              {c.ruleRef && <div className="text-[10px] text-slate-500 mt-0.5">{c.ruleRef}</div>}
            </div>
            <ClockStatusBadge status="breached" />
          </div>
          {c.deadlineAt && (
            <div className="text-[10px] text-slate-500 mt-1">
              Deadline: {new Date(c.deadlineAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          )}
        </div>
      ))}
      {urgentClocks.map((c, i) => (
        <div key={i} className="rounded border border-[#d4a054]/20 p-2.5" style={{ background: "#0e0a04" }}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] text-[#d4a054]">{c.clockType.replace(/_/g, " ")}</span>
            <span className="text-xs font-bold" style={{ color: "#c45a4a" }}>{c.daysRemaining}d</span>
          </div>
          {c.ruleRef && <div className="text-[10px] text-slate-500">{c.ruleRef}</div>}
          {c.notes && <div className="text-[10px] text-slate-600 mt-0.5 truncate">{c.notes}</div>}
        </div>
      ))}
      {deadlineBreachForecast && (
        <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold" style={{ background: "#c45a4a20", color: "#c45a4a" }}>
              {Math.round(Number(deadlineBreachForecast.score))}
            </div>
            <div className="text-[10px] text-slate-400">Breach Risk Score</div>
          </div>
          {deadlineBreachForecast.nextBestAction && (
            <div className="text-[10px] text-[#d4a054]">{deadlineBreachForecast.nextBestAction}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NyWatchlist() {
  const { data: matters, isLoading: mattersLoading } = useNyMatters();

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 text-[#c45a4a]" />
          <h1 className="text-lg font-semibold text-slate-100">NY Deadline Watchlist</h1>
        </div>
        <p className="text-xs text-slate-500">Breach risk queue · statutory clock intelligence · live data from backend</p>
      </div>

      {mattersLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-8">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading matters from API...
        </div>
      ) : !matters || matters.length === 0 ? (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center" style={{ background: "#0c1220" }}>
          <AlertTriangle className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <div className="text-sm text-slate-400">No NY matters found</div>
          <div className="text-xs text-slate-500 mt-1">Use the seed endpoint to load demo matters</div>
        </div>
      ) : (
        <div className="space-y-4">
          {matters.map(matter => (
            <div key={matter.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/[0.04]">
                <Clock className="w-3.5 h-3.5 text-[#d4a054] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">{matter.title.split(" (")[0]}</div>
                  <div className="text-[10px] text-slate-500">{matter.caseNumber} · {matter.jurisdiction?.split(",")[0]}</div>
                </div>
                <div className="text-[11px] font-mono" style={{ color: (matter.healthScore ?? 0) >= 65 ? "#4a90b8" : "#d4a054" }}>
                  {matter.healthScore ?? "—"}
                </div>
              </div>
              <MatterClockSection matterId={matter.id} matterTitle={matter.title} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
