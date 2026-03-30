import { EXECUTION_RUNS, APPROVALS, EVENTS, formatCurrency, GOLDEN_FLOW_CORRELATION_ID } from "@workspace/shared-ui/core-observability-data";
import { Shield, CheckCircle, Clock, User, ExternalLink, FileText } from "lucide-react";

const AUDIT_ENTRIES = [
  ...EXECUTION_RUNS.map(r => ({
    id: `audit-run-${r.id}`,
    type: "execution" as const,
    title: `Execution Run: ${r.workflow_name}`,
    actor: r.triggered_by,
    timestamp: r.started_at,
    status: r.status,
    correlation_id: r.correlation_id,
    details: `Steps: ${r.steps_completed}/${r.steps_total}${r.duration_ms ? ` · Duration: ${Math.round(r.duration_ms / 1000)}s` : ""}${r.exception_message ? ` · Exception: ${r.exception_message}` : ""}`,
  })),
  ...APPROVALS.map(a => ({
    id: `audit-app-${a.id}`,
    type: "approval" as const,
    title: `Approval: ${a.title}`,
    actor: a.owner || "Unassigned",
    timestamp: new Date(Date.now() - a.age_hours * 3600000).toISOString(),
    status: a.status,
    correlation_id: a.correlation_id,
    details: `Impact: ${formatCurrency(a.impact_estimate)} · Team: ${a.team} · Age: ${a.age_hours}h`,
  })),
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  completed: { color: "#10b981", label: "Completed" },
  failed: { color: "#ef4444", label: "Failed" },
  running: { color: "#00d4ff", label: "Running" },
  retried: { color: "#8b5cf6", label: "Retried" },
  waiting_approval: { color: "#f59e0b", label: "Waiting Approval" },
  pending: { color: "#f59e0b", label: "Pending" },
  escalated: { color: "#ec4899", label: "Escalated" },
  approved: { color: "#10b981", label: "Approved" },
};

export default function GovernanceAudit() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4" style={{ color: "#00d4ff" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#00d4ff" }}>Alloy · Governance & Audit</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Governance & Audit</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Full audit trail — approval records, execution logs, compliance evidence, and system decisions.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: AUDIT_ENTRIES.length, color: "#00d4ff" },
          { label: "Completed", value: AUDIT_ENTRIES.filter(a => a.status === "completed" || a.status === "approved").length, color: "#10b981" },
          { label: "Failed", value: AUDIT_ENTRIES.filter(a => a.status === "failed").length, color: "#ef4444" },
          { label: "Pending / Waiting", value: AUDIT_ENTRIES.filter(a => a.status === "pending" || a.status === "escalated").length, color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.01)" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <FileText className="w-3.5 h-3.5" style={{ color: "#00d4ff" }} />
          <span className="text-sm font-semibold text-white">Full Audit Trail</span>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
          {AUDIT_ENTRIES.map(entry => {
            const s = STATUS_STYLES[entry.status] ?? { color: "#fff", label: entry.status };
            const isGoldenFlow = entry.correlation_id === GOLDEN_FLOW_CORRELATION_ID;

            return (
              <div key={entry.id} className="px-5 py-3 flex items-start gap-4" style={{ background: isGoldenFlow ? "rgba(0,212,255,0.01)" : undefined }}>
                <div className="shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white truncate">{entry.title}</span>
                    {isGoldenFlow && <span className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)" }}>GF</span>}
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{entry.details}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[9px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <User className="w-3 h-3" /> {entry.actor}
                    </div>
                    <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25` }}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
