import { EXECUTION_RUNS, formatCurrency, GOLDEN_FLOW_CORRELATION_ID } from "@workspace/shared-ui/core-observability-data";
import { Activity, Clock, CheckCircle, XCircle, RotateCcw, ExternalLink } from "lucide-react";

type RunStatus = "completed" | "failed" | "running" | "retried" | "aborted";

const STATUS_STYLES: Record<RunStatus, { color: string; icon: React.ReactNode; label: string }> = {
  completed: { color: "#10b981", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Completed" },
  failed: { color: "#ef4444", icon: <XCircle className="w-3.5 h-3.5" />, label: "Failed" },
  running: { color: "#00d4ff", icon: <Activity className="w-3.5 h-3.5" />, label: "Running" },
  retried: { color: "#8b5cf6", icon: <RotateCcw className="w-3.5 h-3.5" />, label: "Retried" },
  aborted: { color: "#f59e0b", icon: <Clock className="w-3.5 h-3.5" />, label: "Aborted" },
};

export default function ExecutionRuns() {
  const failed = EXECUTION_RUNS.filter(r => r.status === "failed");
  const running = EXECUTION_RUNS.filter(r => r.status === "running");
  const completed = EXECUTION_RUNS.filter(r => r.status === "completed");
  const retried = EXECUTION_RUNS.filter(r => r.status === "retried");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4" style={{ color: "#00d4ff" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#00d4ff" }}>AlloyScape · Execution Runs</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Execution Runs</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Live and historical workflow runs with step-level visibility, retry logic, and exception handling.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Failed", value: failed.length, color: "#ef4444" },
          { label: "Running", value: running.length, color: "#00d4ff" },
          { label: "Retried", value: retried.length, color: "#8b5cf6" },
          { label: "Completed", value: completed.length, color: "#10b981" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {EXECUTION_RUNS.map(run => {
          const s = STATUS_STYLES[run.status as RunStatus] ?? { color: "#fff", icon: null, label: run.status };
          const progress = run.steps_total > 0 ? (run.steps_completed / run.steps_total) * 100 : 0;
          const isGoldenFlow = run.correlation_id === GOLDEN_FLOW_CORRELATION_ID;
          const durationSec = run.duration_ms ? Math.round(run.duration_ms / 1000) : null;

          return (
            <div key={run.id} className="rounded-xl border p-5" style={{
              borderColor: isGoldenFlow ? "rgba(0,212,255,0.2)" : run.status === "failed" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.07)",
              background: isGoldenFlow ? "rgba(0,212,255,0.02)" : "rgba(255,255,255,0.01)",
            }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                      {s.icon} {s.label}
                    </span>
                    {isGoldenFlow && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>Golden Flow</span>}
                  </div>
                  <div className="text-sm font-semibold text-white mb-0.5">{run.workflow_name}</div>
                  <div className="text-[10px] flex items-center gap-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                    <span>Triggered by: {run.triggered_by}</span>
                    <span>Corr: {run.correlation_id}</span>
                    {durationSec && <span>Duration: {durationSec}s</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-medium text-white mb-1">Steps {run.steps_completed}/{run.steps_total}</div>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${progress}%`, background: s.color }} />
                  </div>
                </div>
              </div>

              {run.exception_message && (
                <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="text-[10px] font-medium mb-0.5" style={{ color: "#ef4444" }}>Exception</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{run.exception_message}</div>
                </div>
              )}

              <div className="flex gap-2">
                {run.status === "failed" && (
                  <button className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1" style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                )}
                {run.linked_lyte_action && (
                  <a href="/lyte-command-center/approvals" className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
                    <ExternalLink className="w-3 h-3" /> View in Lyte
                  </a>
                )}
                <a href="/governance" className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Audit Log
                </a>
                <a href="/terra/" className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1 ml-auto" style={{ color: "#0ea5e9", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)" }}>
                  <ExternalLink className="w-3 h-3" /> Beacon Verification
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
