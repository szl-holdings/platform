import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import { Shield, CheckCircle, Clock, FileText, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface WorkflowRun {
  id: number;
  workflowId?: number | null;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  input?: Record<string, unknown> | null;
  createdAt: string;
}

interface Artifact {
  id: number;
  name: string;
  status: string;
  kind?: string;
  approvedBy?: number | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

interface AuditEntry {
  id: string;
  type: "run" | "artifact";
  title: string;
  status: string;
  timestamp: string;
  details: string;
  entityId: number;
}

function useAuditData() {
  const [runs, artifacts] = [
    useQuery({
      queryKey: ["alloyRuns"],
      queryFn: async () => {
        const resp = await apiFetch<WorkflowRun[] | { data: WorkflowRun[] }>("/alloy/runs?limit=100");
        if (resp && typeof resp === "object" && "data" in resp) return resp.data;
        return resp as WorkflowRun[];
      },
    }),
    useQuery({
      queryKey: ["alloyArtifacts"],
      queryFn: async () => {
        const resp = await apiFetch<Artifact[] | { data: Artifact[] }>("/alloy/artifacts");
        if (resp && typeof resp === "object" && "data" in resp) return resp.data;
        return resp as Artifact[];
      },
    }),
  ];

  const isLoading = runs.isLoading || artifacts.isLoading;
  const isError = runs.isError || artifacts.isError;

  const entries: AuditEntry[] = [
    ...(runs.data ?? []).map(r => ({
      id: `run-${r.id}`,
      type: "run" as const,
      title: `Execution Run #${r.id}`,
      status: r.status,
      timestamp: r.startedAt ?? r.createdAt,
      details: `Workflow ${r.workflowId ?? "N/A"} · Retries: ${r.retryCount}${r.errorMessage ? ` · ${r.errorMessage}` : ""}`,
      entityId: r.id,
    })),
    ...(artifacts.data ?? []).map(a => ({
      id: `artifact-${a.id}`,
      type: "artifact" as const,
      title: `Artifact: ${a.name}`,
      status: a.status,
      timestamp: a.approvedAt ?? a.rejectedAt ?? a.createdAt,
      details: `Kind: ${a.kind ?? "N/A"} · Status: ${a.status}${a.approvedBy ? ` · Approved by ${a.approvedBy}` : ""}`,
      entityId: a.id,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { entries, isLoading, isError, refetch: () => { runs.refetch(); artifacts.refetch(); } };
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  completed: { color: "#10b981", label: "Completed" },
  failed: { color: "#ef4444", label: "Failed" },
  running: { color: "#00d4ff", label: "Running" },
  retrying: { color: "#8b5cf6", label: "Retrying" },
  queued: { color: "#f59e0b", label: "Queued" },
  cancelled: { color: "#6b7280", label: "Cancelled" },
  pending: { color: "#f59e0b", label: "Pending" },
  approved: { color: "#10b981", label: "Approved" },
  rejected: { color: "#ef4444", label: "Rejected" },
};

export default function GovernanceAudit() {
  const { entries, isLoading, isError, refetch } = useAuditData();
  const [typeFilter, setTypeFilter] = useState<"all" | "run" | "artifact">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = entries.filter(e => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  const completedCount = entries.filter(e => ["completed", "approved"].includes(e.status)).length;
  const failedCount = entries.filter(e => ["failed", "rejected"].includes(e.status)).length;
  const pendingCount = entries.filter(e => ["pending", "queued"].includes(e.status)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4" style={{ color: "#00d4ff" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#00d4ff" }}>Alloy · Governance & Audit</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Governance & Audit</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Full audit trail — execution logs, artifact approvals, compliance evidence, and system decisions.</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: entries.length, color: "#00d4ff" },
          { label: "Completed / Approved", value: completedCount, color: "#10b981" },
          { label: "Failed / Rejected", value: failedCount, color: "#ef4444" },
          { label: "Pending / Queued", value: pendingCount, color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Type:</span>
          {(["all", "run", "artifact"] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} className="text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all"
              style={{ background: typeFilter === f ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)", borderColor: typeFilter === f ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.07)", color: typeFilter === f ? "#00d4ff" : "rgba(255,255,255,0.4)" }}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Status:</span>
          {["all", "completed", "failed", "running", "pending", "approved", "rejected"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className="text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all"
              style={{ background: statusFilter === f ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)", borderColor: statusFilter === f ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.07)", color: statusFilter === f ? "#00d4ff" : "rgba(255,255,255,0.4)" }}>
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{filtered.length} entries</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading audit trail…</span>
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Failed to load audit data. Check API connectivity.
        </div>
      )}

      <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.01)" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <FileText className="w-3.5 h-3.5" style={{ color: "#00d4ff" }} />
          <span className="text-sm font-semibold text-white">Full Audit Trail</span>
          <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{filtered.length} records</span>
        </div>
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="py-12 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(16,185,129,0.2)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No audit records found</p>
          </div>
        )}
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
          {filtered.map(entry => {
            const s = STATUS_STYLES[entry.status] ?? { color: "#fff", label: entry.status };

            return (
              <div key={entry.id} className="px-5 py-3 flex items-start gap-4 hover:bg-white/[0.01] transition-colors">
                <div className="shrink-0 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white/80">{entry.title}</span>
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded uppercase tracking-wide" style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}25` }}>{s.label}</span>
                    {entry.type === "artifact" && (
                      <span className="text-[9px] px-1 py-0.5 rounded border" style={{ color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.08)" }}>artifact</span>
                    )}
                  </div>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{entry.details}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
