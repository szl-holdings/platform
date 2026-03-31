import { useQuery } from "@tanstack/react-query";
import { apiFetch, DataStateBadge } from "@workspace/shared-ui";
import { Shield, CheckCircle, Clock, FileText, RefreshCw, Radio } from "lucide-react";
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

function generateDemoAuditEntries(): AuditEntry[] {
  const now = Date.now();
  const ago = (h: number) => new Date(now - h * 3600000).toISOString();
  return [
    { id: "run-101", type: "run", title: "Execution Run #101 — Client Onboarding", status: "completed", timestamp: ago(0.5), details: "Workflow 1 · Retries: 0 · Duration: 12m 34s · Enterprise onboarding for Meridian Corp", entityId: 101 },
    { id: "artifact-201", type: "artifact", title: "Artifact: Q1 2026 Compliance Report", status: "approved", timestamp: ago(1.2), details: "Kind: compliance · Status: approved · Approved by Diana Park · SOC 2 Type II evidence package", entityId: 201 },
    { id: "run-100", type: "run", title: "Execution Run #100 — Contract Renewal", status: "completed", timestamp: ago(2), details: "Workflow 2 · Retries: 0 · Duration: 3m 18s · Atlas Industries renewal processed", entityId: 100 },
    { id: "run-99", type: "run", title: "Execution Run #99 — Invoice Approval", status: "completed", timestamp: ago(3.5), details: "Workflow 4 · Retries: 0 · Duration: 1m 47s · Vendor invoice $24,500 — 3-tier approval chain complete", entityId: 99 },
    { id: "run-98", type: "run", title: "Execution Run #98 — Data Pipeline Monitor", status: "failed", timestamp: ago(5), details: "Workflow 8 · Retries: 3 · Schema drift detected in staging ETL — alerting data engineering", entityId: 98 },
    { id: "artifact-200", type: "artifact", title: "Artifact: Vendor Risk Assessment — CloudSync", status: "pending", timestamp: ago(6), details: "Kind: compliance · Status: pending · Risk questionnaire sent, awaiting vendor response", entityId: 200 },
    { id: "run-97", type: "run", title: "Execution Run #97 — Employee Offboarding", status: "completed", timestamp: ago(8), details: "Workflow 7 · Retries: 0 · Duration: 8m 12s · IT deprovisioning + badge revocation complete", entityId: 97 },
    { id: "artifact-199", type: "artifact", title: "Artifact: Board Materials — Q4 2025", status: "approved", timestamp: ago(12), details: "Kind: automation · Status: approved · Approved by Lisa Thornton · 12-source data assembly", entityId: 199 },
    { id: "run-96", type: "run", title: "Execution Run #96 — SOC 2 Evidence Collection", status: "completed", timestamp: ago(14), details: "Workflow 3 · Retries: 0 · Duration: 45m · Monthly evidence snapshot — all control families", entityId: 96 },
    { id: "run-95", type: "run", title: "Execution Run #95 — Client Onboarding", status: "retrying", timestamp: ago(16), details: "Workflow 1 · Retries: 1 · KYC verification timeout for Pinnacle Healthcare — retrying", entityId: 95 },
    { id: "artifact-198", type: "artifact", title: "Artifact: Marketing Campaign — Spring Launch", status: "rejected", timestamp: ago(20), details: "Kind: approval · Status: rejected · Legal review flagged non-compliant claims in ad copy", entityId: 198 },
    { id: "run-94", type: "run", title: "Execution Run #94 — Contract Renewal", status: "completed", timestamp: ago(24), details: "Workflow 2 · Retries: 0 · Duration: 2m 51s · Vertex Labs renewal — pricing tier updated", entityId: 94 },
    { id: "run-93", type: "run", title: "Execution Run #93 — Incident Post-Mortem", status: "completed", timestamp: ago(30), details: "Workflow 10 · Retries: 0 · Duration: 22m · INC-2841 post-mortem published with 4 action items", entityId: 93 },
    { id: "run-92", type: "run", title: "Execution Run #92 — Invoice Approval", status: "cancelled", timestamp: ago(36), details: "Workflow 4 · Retries: 0 · Duplicate invoice detected — auto-cancelled by validation step", entityId: 92 },
    { id: "artifact-197", type: "artifact", title: "Artifact: Vendor Risk Report — DataVault Inc", status: "approved", timestamp: ago(48), details: "Kind: compliance · Status: approved · Approved by Diana Park · Risk score: 72/100 — acceptable", entityId: 197 },
  ];
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

  const apiEntries: AuditEntry[] = [
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

  const isDemo = isError || (!isLoading && apiEntries.length === 0);
  const entries = isDemo ? generateDemoAuditEntries() : apiEntries;

  return { entries, isLoading, isDemo, refetch: () => { runs.refetch(); artifacts.refetch(); } };
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
  const { entries, isLoading, isDemo, refetch } = useAuditData();
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

      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)", color: "rgba(0,212,255,0.6)" }}>
          <Radio className="w-3 h-3 shrink-0 animate-pulse" />
          Demo Environment — Showing illustrative audit records. Connect the Alloy API for live data.
          <DataStateBadge state="demo" className="ml-auto" />
        </div>
      )}

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

      <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.01)" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <FileText className="w-3.5 h-3.5" style={{ color: "#00d4ff" }} />
          <span className="text-sm font-semibold text-white">Full Audit Trail</span>
          <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{filtered.length} records</span>
        </div>
        {!isLoading && filtered.length === 0 && (
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
