import { WORKFLOWS_UI, formatCurrency, getStateColor } from "@workspace/shared-ui/core-observability-data";
import { GitBranch, User, Clock, ArrowRight, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";

export default function WorkflowOrchestration() {
  const blocked = WORKFLOWS_UI.filter(w => w.state === "blocked" || w.state === "escalated");
  const degraded = WORKFLOWS_UI.filter(w => w.state === "degraded" || w.state === "pending_approval");
  const active = WORKFLOWS_UI.filter(w => w.state === "healthy" || w.state === "executing");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-4 h-4" style={{ color: "#00d4ff" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#00d4ff" }}>AlloyScape · Workflow Orchestration</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Workflow Orchestration</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Visual workflow management — step owners, SLA tracking, blocked steps, and reroute capabilities.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Blocked / Escalated", value: blocked.length, color: "#ef4444" },
          { label: "Degraded / Pending", value: degraded.length, color: "#f97316" },
          { label: "Healthy / Active", value: active.length, color: "#10b981" },
          { label: "Total Value at Risk", value: formatCurrency(WORKFLOWS_UI.reduce((s, w) => s + w.value_at_risk, 0)), color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {WORKFLOWS_UI.map(w => {
          const stateColor = getStateColor(w.state);
          const isBlockedOrEscalated = w.state === "blocked" || w.state === "escalated";
          return (
            <div key={w.id} className="rounded-xl border p-5" style={{
              borderColor: isBlockedOrEscalated ? "rgba(239,68,68,0.2)" : w.state === "degraded" ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.07)",
              background: isBlockedOrEscalated ? "rgba(239,68,68,0.02)" : "rgba(255,255,255,0.01)",
            }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: stateColor, background: `${stateColor}12`, border: `1px solid ${stateColor}25` }}>{w.state.replace("_", " ")}</span>
                    <span className="text-[9px] text-white/40">{w.type.replace("_", " ")}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-0.5">{w.name}</div>
                  <div className="text-[10px] flex items-center gap-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {w.owner ? w.owner : <span style={{ color: "#ef4444" }}>Unassigned</span>}
                    </span>
                    <span>{w.team}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />SLA: {w.sla_deadline}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {w.value_at_risk > 0 && (
                    <>
                      <div className="text-sm font-bold" style={{ color: "#f59e0b" }}>{formatCurrency(w.value_at_risk)}</div>
                      <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>value at risk</div>
                    </>
                  )}
                </div>
              </div>

              {w.steps.length > 0 && (
                <div className="mb-4">
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Workflow Steps</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {w.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded" style={{
                          background: step.status === "completed" ? "rgba(16,185,129,0.08)" : step.status === "blocked" ? "rgba(239,68,68,0.08)" : step.status === "in_progress" ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${step.status === "completed" ? "rgba(16,185,129,0.2)" : step.status === "blocked" ? "rgba(239,68,68,0.2)" : step.status === "in_progress" ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.07)"}`,
                          color: step.status === "completed" ? "#10b981" : step.status === "blocked" ? "#ef4444" : step.status === "in_progress" ? "#00d4ff" : "rgba(255,255,255,0.4)",
                        }}>
                          {step.status === "completed" && <CheckCircle className="w-3 h-3" />}
                          {step.status === "blocked" && <AlertTriangle className="w-3 h-3" />}
                          <span>{step.name}</span>
                          {step.assignee && <span className="text-[9px] opacity-60">· {step.assignee}</span>}
                        </div>
                        {i < w.steps.length - 1 && <ArrowRight className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {w.blocked_step && (
                <div className="rounded-lg p-2.5 mb-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="text-[10px]" style={{ color: "#ef4444" }}>Blocked at: {w.blocked_step}</div>
                </div>
              )}

              <div className="flex gap-2">
                {isBlockedOrEscalated && (
                  <a href="/lyte-command-center/" className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    <ExternalLink className="w-3 h-3" /> Resolve in Lyte
                  </a>
                )}
                <button className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80" style={{ color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
                  Reroute
                </button>
                <a href="/terra/" className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1" style={{ color: "#0ea5e9", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.12)" }}>
                  <ExternalLink className="w-3 h-3" /> Beacon Drilldown
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
