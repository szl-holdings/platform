import { WORKFLOWS, formatCurrency, formatDuration, getStateColor, type EntityState } from "@szl-holdings/shared-ui/core-observability-data";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Activity, AlertTriangle, Clock, User, ExternalLink } from "lucide-react";

function StateBadge({ state }: { state: EntityState }) {
  const color = getStateColor(state);
  return (
    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>{state.replace("_", " ")}</span>
  );
}

function LatencyBar({ latency, sla }: { latency: number; sla: number }) {
  const pct = Math.min(100, (latency / sla) * 100);
  const overSla = latency > sla;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span style={{ color: "rgba(255,255,255,0.3)" }}>Latency</span>
        <span style={{ color: overSla ? "#ef4444" : "#10b981" }}>{formatDuration(latency)} / SLA {formatDuration(sla)}</span>
      </div>
      <div className="h-1.5 rounded-full w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-1.5 rounded-full transition-all" style={{
          width: `${pct}%`,
          background: overSla ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, #0ea5e9, #10b981)",
          maxWidth: "100%",
        }} />
      </div>
      {overSla && <div className="text-[9px] mt-0.5 font-medium" style={{ color: "#ef4444" }}>SLA BREACHED by {formatDuration(latency - sla)}</div>}
    </div>
  );
}

export default function WorkflowHealth() {
  const blocked = WORKFLOWS.filter(w => w.status === "blocked" || w.status === "escalated");
  const degraded = WORKFLOWS.filter(w => w.status === "degraded" || w.status === "pending_approval");
  const healthy = WORKFLOWS.filter(w => w.status === "healthy" || w.status === "completed");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4" style={{ color: "#0ea5e9" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#0ea5e9" }}>Lyte · Workflow Health</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Workflow Health Monitor</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Latency indicators, blocked steps, ownership gaps, and intervention status across all active workflows.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Blocked / Escalated", count: blocked.length, color: "#ef4444", desc: "Require immediate intervention" },
          { label: "Degraded / Pending", count: degraded.length, color: "#f59e0b", desc: "Above SLA threshold" },
          { label: "Healthy", count: healthy.length, color: "#10b981", desc: "Operating normally" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-2xl font-bold mb-1" style={{ color: c.color }}>{c.count}</div>
            <div className="text-xs font-medium text-white">{c.label}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {[...blocked, ...degraded, ...healthy].map(w => (
          <div key={w.id} className="rounded-xl border p-5" style={{
            borderColor: w.status === "blocked" || w.status === "escalated" ? "rgba(239,68,68,0.2)" : w.status === "degraded" || w.status === "pending_approval" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)",
            background: w.status === "blocked" || w.status === "escalated" ? "rgba(239,68,68,0.03)" : "rgba(255,255,255,0.01)",
          }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <StateBadge state={w.status} />
                  <span className="text-sm font-semibold text-white">{w.name}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {w.owner || <span style={{ color: "#ef4444" }}>Unassigned</span>}
                  </span>
                  <span>{w.team}</span>
                  {w.blocked_step && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" style={{ color: "#f97316" }} />
                      <span style={{ color: "#f97316" }}>{w.blocked_step}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {w.value_at_risk > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-white font-semibold">{formatCurrency(w.value_at_risk)}</div>
                    <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>Value at risk</div>
                  </div>
                )}
                <div className="flex gap-1.5">
                  <a href="/command/operations/" className="text-[9px] px-2 py-1 rounded font-medium hover:opacity-80 transition-opacity" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>Assign in Lyte</a>
                  <a href="/alloy" className="text-[9px] px-2 py-1 rounded font-medium hover:opacity-80 transition-opacity" style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.1)", border: "1px solid rgba(75,139,219,0.2)" }}>Run in Alloy</a>
                </div>
              </div>
            </div>
            <LatencyBar latency={w.latency_ms} sla={w.sla_ms} />
          </div>
        ))}
      </div>
    </div>
  );
}
