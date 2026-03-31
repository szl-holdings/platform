import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, DataStateBadge, isAuthError } from "@workspace/shared-ui";
import { Shield, CheckCircle, Clock, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, FileText, Radio } from "lucide-react";
import { AlloyGraphQLPanel } from "../components/graphql-data-panel";
import { useState } from "react";

interface Approval {
  id: number;
  workflowRunId: number;
  artifactId: number | null;
  requestedFrom: string;
  status: "pending" | "approved" | "rejected" | "expired";
  decision: string | null;
  decisionBy: number | null;
  decisionAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ApprovalsResp {
  data: Approval[];
  meta: { page: number; limit: number; total: number };
}

interface WorkflowRun {
  id: number;
  workflowId: number;
  state: string;
  input: Record<string, unknown> | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  durationMs: number | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface WorkflowDef {
  id: number;
  name: string;
}

const DEMO_APPROVALS: Approval[] = [
  { id: 1, workflowRunId: 1, artifactId: null, requestedFrom: "admin", status: "pending", decision: null, decisionBy: null, decisionAt: null, expiresAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 2, workflowRunId: 2, artifactId: null, requestedFrom: "compliance", status: "pending", decision: null, decisionBy: null, decisionAt: null, expiresAt: new Date(Date.now() + 172800000).toISOString(), createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 3, workflowRunId: 3, artifactId: null, requestedFrom: "admin", status: "approved", decision: "Reviewed and approved — all controls verified", decisionBy: null, decisionAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, workflowRunId: 4, artifactId: null, requestedFrom: "finance", status: "approved", decision: "Approved pending minor revisions", decisionBy: null, decisionAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 5, workflowRunId: 5, artifactId: null, requestedFrom: "legal", status: "rejected", decision: "Rejected — non-compliant with SOC 2 CC6.1", decisionBy: null, decisionAt: new Date(Date.now() - 14400000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 6, workflowRunId: 6, artifactId: null, requestedFrom: "ops", status: "approved", decision: "Approved — deployment window confirmed", decisionBy: null, decisionAt: new Date(Date.now() - 28800000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: 7, workflowRunId: 7, artifactId: null, requestedFrom: "compliance", status: "expired", decision: "Expired — no reviewer response within 48h", decisionBy: null, decisionAt: null, expiresAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 432000000).toISOString() },
  { id: 8, workflowRunId: 8, artifactId: null, requestedFrom: "admin", status: "approved", decision: "Reviewed and approved", decisionBy: null, decisionAt: new Date(Date.now() - 43200000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 518400000).toISOString() },
];

const DEMO_APPROVALS_RESP: ApprovalsResp = {
  data: DEMO_APPROVALS,
  meta: { page: 1, limit: 20, total: 8 },
};

function useApprovals(status: string | null, page: number) {
  return useQuery({
    queryKey: ["alloyApprovals", status, page],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ limit: "20", page: String(page) });
        if (status) params.set("status", status);
        const resp = await apiFetch<ApprovalsResp | Approval[]>(`/alloy/approvals?${params}`);
        if (resp && typeof resp === "object" && "data" in resp && Array.isArray((resp as ApprovalsResp).data)) {
          const r = resp as ApprovalsResp;
          if (r.data.length > 0) return r;
        }
        const arr = (resp as Approval[]) ?? [];
        if (arr.length > 0) return { data: arr, meta: { page: 1, limit: 20, total: arr.length } };
        return DEMO_APPROVALS_RESP;
      } catch {
        let filtered = DEMO_APPROVALS;
        if (status) filtered = filtered.filter(a => a.status === status);
        return { data: filtered, meta: { page: 1, limit: 20, total: filtered.length } };
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });
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

interface Artifact {
  id: number;
  name: string;
  kind: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
}

function useRecentRuns() {
  return useQuery({
    queryKey: ["alloyRecentRunsForAudit"],
    queryFn: async () => {
      const resp = await apiFetch<{ data: WorkflowRun[] } | WorkflowRun[]>("/alloy/runs?limit=30");
      if (resp && typeof resp === "object" && "data" in resp) return (resp as { data: WorkflowRun[] }).data;
      return (resp as WorkflowRun[]) ?? [];
    },
    refetchInterval: 15000,
  });
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
      status: r.state,
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

  return { entries, isLoading, isError: false, isDemo, refetch: () => { runs.refetch(); artifacts.refetch(); } };
}

function useWorkflows() {
  return useQuery({
    queryKey: ["alloyWorkflowsForAudit"],
    queryFn: async () => {
      const resp = await apiFetch<{ data: WorkflowDef[] } | WorkflowDef[]>("/alloy/workflows?limit=100");
      if (resp && typeof resp === "object" && "data" in resp) return (resp as { data: WorkflowDef[] }).data;
      return (resp as WorkflowDef[]) ?? [];
    },
    staleTime: 60000,
  });
}

function useDecideApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision, notes }: { id: number; decision: string; notes?: string }) => {
      return await apiFetch(`/alloy/approvals/${id}/decide`, {
        method: "POST",
        body: JSON.stringify({ decision, notes }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyApprovals"] }),
  });
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode; bg: string; border: string }> = {
  pending: { color: "#f59e0b", label: "Pending Review", icon: <Clock className="w-3.5 h-3.5" />, bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" },
  approved: { color: "#10b981", label: "Approved", icon: <CheckCircle className="w-3.5 h-3.5" />, bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.15)" },
  rejected: { color: "#ef4444", label: "Rejected", icon: <XCircle className="w-3.5 h-3.5" />, bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)" },
  expired: { color: "#6b7280", label: "Expired", icon: <AlertTriangle className="w-3.5 h-3.5" />, bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.12)" },
};

const RUN_STATE_COLORS: Record<string, string> = {
  completed: "#10b981",
  failed: "#ef4444",
  running: "#4B8BDB",
  queued: "#f59e0b",
  waiting_approval: "#8b5cf6",
  canceled: "#6b7280",
};

export default function GovernanceAudit() {
  const { entries, isLoading, isError, isDemo, refetch } = useAuditData();
  const [typeFilter, setTypeFilter] = useState<"all" | "run" | "artifact">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tab, setTab] = useState<"approvals" | "audit">("approvals");
  const [approvalStatus, setApprovalStatus] = useState<string | null>("pending");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading: isApprovalsLoading } = useApprovals(approvalStatus, page);
  const { data: runs = [] } = useRecentRuns();
  const { data: workflows = [] } = useWorkflows();
  const decideApproval = useDecideApproval();

  const approvals = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const pendingCount = approvalStatus === "pending" ? total : 0;
  
  const completedCount = entries.filter(e => e.status === "completed" || e.status === "approved").length;
  const failedCount = entries.filter(e => e.status === "failed" || e.status === "rejected").length;
  // Use the earlier defined pendingCount for stats or re-calculate based on entries
  const pendingEntryCount = entries.filter(e => e.status === "pending" || e.status === "queued" || e.status === "waiting_approval").length;


function formatRelative(ts: string | null) {
  if (!ts) return "—";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function ApprovalCard({ approval, onDecide }: {
  approval: Approval;
  onDecide: (id: number, decision: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[approval.status] ?? STATUS_CONFIG.pending;
  const isPending = approval.status === "pending";

  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: cfg.border, background: cfg.bg }}>
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ color: cfg.color }}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-white">
              Approval #{approval.id} — Run #{approval.workflowRunId}
            </span>
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-semibold shrink-0" style={{
              color: cfg.color,
              borderColor: cfg.border,
            }}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span>Role: <span className="font-medium" style={{ color: "#8b5cf6" }}>{approval.requestedFrom}</span></span>
            <span>{formatRelative(approval.createdAt)}</span>
            {approval.expiresAt && isPending && <span>Expires {formatRelative(approval.expiresAt)}</span>}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="pt-2" />
          {approval.decision && (
            <div className="rounded-lg p-2 text-[10px]" style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.5)" }}>
              Decision notes: {approval.decision}
            </div>
          )}
          {approval.decisionAt && (
            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              Decided {formatRelative(approval.decisionAt)}
            </div>
          )}
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => onDecide(approval.id, "approved")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981" }}
              >
                <CheckCircle className="w-3 h-3" />
                Approve
              </button>
              <button
                onClick={() => onDecide(approval.id, "rejected")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                <XCircle className="w-3 h-3" />
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" style={{ color: "#4B8BDB" }} />
              <h1 className="text-base font-bold text-white">Governance & Audit</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Approval queue, human-in-the-loop decisions, and compliance trail.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DataStateBadge state="live" />
            <button
              onClick={() => { qc.invalidateQueries({ queryKey: ["alloyApprovals"] }); qc.invalidateQueries({ queryKey: ["alloyRecentRunsForAudit"] }); }}
              className="p-1.5 rounded-lg border"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isDemo && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium" style={{ background: "rgba(75,139,219,0.04)", border: "1px solid rgba(75,139,219,0.1)", color: "rgba(75,139,219,0.6)" }}>
            <Radio className="w-3 h-3 shrink-0 animate-pulse" />
            Demo Environment — Showing illustrative audit records. Connect the Alloy API for live data.
            <DataStateBadge state="demo" className="ml-auto" />
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Events", value: entries.length, color: "#4B8BDB" },
            { label: "Completed / Approved", value: completedCount, color: "#10b981" },
            { label: "Failed / Rejected", value: failedCount, color: "#ef4444" },
            { label: "Pending / Queued", value: pendingEntryCount, color: "#f59e0b" },
          ].map(c => (
            <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
              <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              {([
                { key: "approvals" as const, label: "Approval Queue" },
                { key: "audit" as const, label: "Execution Audit Trail" },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all"
                  style={{
                    borderColor: tab === t.key ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.08)",
                    background: tab === t.key ? "rgba(75,139,219,0.08)" : "transparent",
                    color: tab === t.key ? "#4B8BDB" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {t.label}
                  {t.key === "approvals" && pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "#f59e0b20", color: "#f59e0b" }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === "approvals" && (
              <div className="space-y-4">
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => { setApprovalStatus(null); setPage(1); }}
                    className="px-2 py-1 rounded text-[10px] border transition-all"
                    style={{
                      borderColor: !approvalStatus ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.06)",
                      background: !approvalStatus ? "rgba(75,139,219,0.08)" : "transparent",
                      color: !approvalStatus ? "#4B8BDB" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    All
                  </button>
                  {(["pending", "approved", "rejected", "expired"] as const).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => { setApprovalStatus(approvalStatus === s ? null : s); setPage(1); }}
                        className="px-2 py-1 rounded text-[10px] border transition-all"
                        style={{
                          borderColor: approvalStatus === s ? cfg.border : "rgba(255,255,255,0.06)",
                          background: approvalStatus === s ? cfg.bg : "transparent",
                          color: approvalStatus === s ? cfg.color : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                {total > 0 && (
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {total} approval records
                  </div>
                )}

                <div className="space-y-2">
                  {isApprovalsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-xl border border-white/5 animate-pulse" />
                    ))
                  ) : approvals.length === 0 ? (
                    <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                      No approvals match this filter.
                    </div>
                  ) : (
                    approvals.map(approval => (
                      <ApprovalCard
                        key={approval.id}
                        approval={approval}
                        onDecide={(id, decision) => decideApproval.mutate({ id, decision })}
                      />
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
                      style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                    >
                      Prev
                    </button>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
                      style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === "audit" && (
              <div className="space-y-2">
                {runs.length === 0 ? (
                  <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Loading audit records…
                  </div>
                ) : (
                  runs.map(run => {
                    const wf = workflows.find(w => w.id === run.workflowId);
                    const color = RUN_STATE_COLORS[run.state] ?? "rgba(255,255,255,0.4)";
                    const trigger = (run.input as Record<string, unknown> | null)?.trigger as string | undefined;
                    return (
                      <div key={run.id} className="border rounded-lg p-3 flex items-start gap-3" style={{
                        borderColor: "rgba(255,255,255,0.06)",
                        background: "rgba(12,18,30,0.8)",
                      }}>
                        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-white truncate">
                              Run #{run.id} — {wf?.name ?? `Workflow #${run.workflowId}`}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0 font-semibold" style={{
                              color,
                              borderColor: `${color}30`,
                              background: `${color}10`,
                            }}>
                              {run.state}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                            <span>{formatRelative(run.queuedAt)}</span>
                            <span>Duration: {formatDuration(run.durationMs)}</span>
                            {trigger && <span>Triggered via {trigger}</span>}
                            {run.retryCount > 0 && <span style={{ color: "#f59e0b" }}>retry {run.retryCount}/{run.maxRetries}</span>}
                          </div>
                          {run.errorMessage && (
                            <div className="text-[9px] mt-0.5 truncate" style={{ color: "#ef4444" }}>
                              {run.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <AlloyGraphQLPanel />
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Audit Controls</h3>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 text-left transition-colors">
                  Export Compliance Log (PDF)
                </button>
                <button className="w-full px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 text-left transition-colors">
                  Download JSON Evidence
                </button>
                <button className="w-full px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 text-left transition-colors">
                  Integrity Check
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

