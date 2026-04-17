import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bot,
  Workflow,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const ACCENT = "#d4a054";

type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

interface ActionApproval {
  id: number;
  requestId: string;
  toolId: string;
  action: string;
  agentId?: string;
  sessionId?: string;
  workflowId?: string;
  status: ApprovalStatus;
  decisionReason?: string;
  approvedById?: number;
  approvedAt?: string;
  rejectedById?: number;
  rejectedAt?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ToolManifest {
  id: string;
  name: string;
  policyTier: string;
  description?: string;
}

type Tab = "pending" | "history";

interface ListResponse<T> {
  data: T[];
  meta?: { total?: number };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

const TIER_COLORS: Record<string, { fg: string; bg: string; border: string }> = {
  "advisory-only":              { fg: "#7c8a9a", bg: "rgba(124,138,154,0.10)", border: "rgba(124,138,154,0.30)" },
  "internal-workflow":          { fg: "#6b8f71", bg: "rgba(107,143,113,0.10)", border: "rgba(107,143,113,0.30)" },
  "operator-assisted":          { fg: "#8b7ac8", bg: "rgba(139,122,200,0.10)", border: "rgba(139,122,200,0.30)" },
  "executive-facing":           { fg: "#c9a227", bg: "rgba(201,162,39,0.10)",  border: "rgba(201,162,39,0.30)"  },
  "regulated-workflow":         { fg: "#d4a054", bg: "rgba(212,160,84,0.10)",  border: "rgba(212,160,84,0.30)"  },
  "external-client-facing":     { fg: "#0ea5e9", bg: "rgba(14,165,233,0.10)",  border: "rgba(14,165,233,0.30)"  },
  "autonomous-reversible":      { fg: "#22c55e", bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.30)"   },
  "human-approval-mandatory":   { fg: "#ef4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.30)"   },
};

function tierStyle(tier?: string) {
  return tier && TIER_COLORS[tier] ? TIER_COLORS[tier] : { fg: "#7c8a9a", bg: "rgba(124,138,154,0.10)", border: "rgba(124,138,154,0.30)" };
}

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function StatusPill({ status }: { status: ApprovalStatus }) {
  const map: Record<ApprovalStatus, { fg: string; bg: string; border: string; label: string }> = {
    pending:   { fg: "#d4a054", bg: "rgba(212,160,84,0.12)", border: "rgba(212,160,84,0.35)", label: "PENDING" },
    approved:  { fg: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)",  label: "APPROVED" },
    rejected:  { fg: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  label: "REJECTED" },
    expired:   { fg: "#7c8a9a", bg: "rgba(124,138,154,0.12)", border: "rgba(124,138,154,0.35)", label: "EXPIRED" },
    cancelled: { fg: "#7c8a9a", bg: "rgba(124,138,154,0.12)", border: "rgba(124,138,154,0.35)", label: "CANCELLED" },
  };
  const s = map[status];
  return (
    <span className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded" style={{ color: s.fg, background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function ApprovalRow({
  approval,
  toolName,
  toolTier,
  expanded,
  onToggle,
  onApprove,
  onReject,
  busy,
}: {
  approval: ActionApproval;
  toolName: string;
  toolTier?: string;
  expanded: boolean;
  onToggle: () => void;
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState("");
  const tier = tierStyle(toolTier);
  const isPending = approval.status === "pending";

  return (
    <div className="rounded border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span style={{ color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              {toolName}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
              · {approval.action}
            </span>
            <span
              className="text-[8px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
              style={{ color: tier.fg, background: tier.bg, border: `1px solid ${tier.border}` }}
            >
              {toolTier ?? "unknown-tier"}
            </span>
            <StatusPill status={approval.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3" /> {approval.agentId ?? "anon-agent"}
            </span>
            {approval.sessionId && (
              <span className="flex items-center gap-1">
                <Workflow className="w-3 h-3" /> session {approval.sessionId.substring(0, 8)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(approval.createdAt)}
            </span>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>req {approval.requestId}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="text-[9px] uppercase tracking-widest font-mono mb-1.5 mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Payload
          </div>
          <pre
            className="text-[10px] font-mono p-2 rounded overflow-auto max-h-48"
            style={{ background: "rgba(0,0,0,0.35)", color: "rgba(200,210,225,0.85)", border: "1px solid rgba(255,255,255,0.04)" }}
          >
            {JSON.stringify(approval.payload ?? {}, null, 2)}
          </pre>

          {approval.decisionReason && (
            <div className="mt-3">
              <div className="text-[9px] uppercase tracking-widest font-mono mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                Decision Reason
              </div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                {approval.decisionReason}
              </div>
            </div>
          )}

          {!isPending && (approval.approvedAt || approval.rejectedAt) && (
            <div className="mt-2 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
              {approval.status === "approved"
                ? `Approved by user #${approval.approvedById ?? "?"} · ${new Date(approval.approvedAt!).toLocaleString()}`
                : approval.status === "rejected"
                  ? `Rejected by user #${approval.rejectedById ?? "?"} · ${new Date(approval.rejectedAt!).toLocaleString()}`
                  : null}
            </div>
          )}

          {isPending && (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Optional decision reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-[11px] px-2 py-1.5 rounded outline-none"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
              />
              <div className="flex items-center gap-2">
                <button
                  disabled={busy}
                  onClick={() => onApprove(reason || "Approved by operator")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-opacity disabled:opacity-50"
                  style={{ color: "#22c55e", background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.35)" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => onReject(reason || "Rejected by operator")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-opacity disabled:opacity-50"
                  style={{ color: "#ef4444", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)" }}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PolicyApprovalsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const qc = useQueryClient();

  const approvalsQ = useQuery<ListResponse<ActionApproval>>({
    queryKey: ["guardian", "actions", tab],
    queryFn: () => fetchJson<ListResponse<ActionApproval>>(`/api/guardian/actions?limit=100${tab === "pending" ? "&status=pending" : ""}`),
    refetchInterval: tab === "pending" ? 15_000 : 60_000,
  });

  const toolsQ = useQuery<ListResponse<ToolManifest>>({
    queryKey: ["guardian", "tools-index"],
    queryFn: () => fetchJson<ListResponse<ToolManifest>>("/api/guardian/tools?limit=200"),
    staleTime: 5 * 60_000,
  });

  const approveMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      fetchJson(`/api/guardian/actions/${id}/approve`, { method: "POST", body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guardian", "actions"] });
      qc.invalidateQueries({ queryKey: ["guardian", "actions-pending-count"] });
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      fetchJson(`/api/guardian/actions/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guardian", "actions"] });
      qc.invalidateQueries({ queryKey: ["guardian", "actions-pending-count"] });
    },
  });

  const toolIndex = useMemo(() => {
    const map = new Map<string, ToolManifest>();
    for (const t of toolsQ.data?.data ?? []) map.set(t.id, t);
    return map;
  }, [toolsQ.data]);

  const all = approvalsQ.data?.data ?? [];
  const pending = all.filter((a) => a.status === "pending");
  const history = all.filter((a) => a.status !== "pending");

  const visible = tab === "pending" ? pending : history;
  const isLoading = approvalsQ.isLoading;
  const error = approvalsQ.error as Error | null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>
            <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-[14px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.95)" }}>
              Policy Approvals
            </h1>
            <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
              Guardian — tool invocations awaiting human review
            </div>
          </div>
        </div>
        <button
          onClick={() => approvalsQ.refetch()}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-colors hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 ${approvalsQ.isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {(["pending", "history"] as Tab[]).map((t) => {
          const active = tab === t;
          const count = t === "pending" ? pending.length : history.length;
          return (
            <button
              key={t}
              onClick={() => { setTab(t); setExpandedId(null); }}
              className="px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors"
              style={{
                color: active ? ACCENT : "rgba(255,255,255,0.5)",
                background: active ? `${ACCENT}14` : "transparent",
                border: `1px solid ${active ? ACCENT + "30" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {t === "pending" ? "Pending" : "History"}
              <span className="ml-1.5 text-[10px] font-mono" style={{ color: active ? ACCENT : "rgba(255,255,255,0.35)" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded p-3 mb-3 flex items-center gap-2 text-[11px]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed to load approvals: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="text-[11px] font-mono py-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
          Loading approvals…
        </div>
      ) : visible.length === 0 ? (
        <div
          className="rounded py-12 text-center"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.08)" }}
        >
          <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
          <div className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>
            {tab === "pending" ? "No pending approvals. The queue is clear." : "No decided approvals yet."}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((a) => {
            const tool = toolIndex.get(a.toolId);
            return (
              <ApprovalRow
                key={a.id}
                approval={a}
                toolName={tool?.name ?? a.toolId}
                toolTier={tool?.policyTier}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                onApprove={(reason) => approveMut.mutate({ id: a.id, reason })}
                onReject={(reason) => rejectMut.mutate({ id: a.id, reason })}
                busy={approveMut.isPending || rejectMut.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
