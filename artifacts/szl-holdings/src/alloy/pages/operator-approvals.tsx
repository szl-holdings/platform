import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  RefreshCw,
  GitBranch,
  Activity,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revised"
  | "escalated"
  | "expired"
  | "withdrawn";

type ApprovalPriority = "low" | "medium" | "high" | "critical";

interface RuleCondition {
  field: string;
  operator: string;
  value: unknown;
}

interface MatchedRuleDetails {
  id: string;
  name: string;
  description?: string;
  tier: string;
  action: string;
  conditions: RuleCondition[];
  priority: number;
  enabled: boolean;
  owner?: string;
  tags: string[];
  source: "guardian-engine" | "unknown";
}

interface TierDetails {
  tier: string;
  tierNumber: number;
  description: string;
  riskLevel: number;
  approvalGate: "none" | "single" | "dual";
  requiresRollback: boolean;
  redactPII: boolean;
  allowExternalComms: boolean;
}

interface ApprovalPayload {
  runId?: string;
  workflowId?: string;
  agentId?: string | null;
  stepId?: string;
  stepIndex?: number;
  reason?: string;
  matchedRuleId?: string | null;
  tier?: string | null;
  requiredApprovers?: string[];
  context?: Record<string, unknown>;
  matchedRuleDetails?: MatchedRuleDetails | null;
  tierDetails?: TierDetails | null;
  [k: string]: unknown;
}

interface ApprovalRequest {
  id: number;
  orgId: number | null;
  resourceType: string;
  resourceId: string;
  title: string;
  description: string | null;
  actionClass: string;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  requiredApproverRole: string | null;
  serviceAttribution: string | null;
  correlationId: string | null;
  payload: ApprovalPayload | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

interface AuditEntry {
  id: number;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  actorRole: string | null;
  serviceAttribution: string | null;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<ApprovalPriority, { color: string; label: string }> = {
  critical: { color: "#ef4444", label: "Critical" },
  high: { color: "#f59e0b", label: "High" },
  medium: { color: "#8b7ac8", label: "Medium" },
  low: { color: "#6b7280", label: "Low" },
};

const STATUS_CONFIG: Record<ApprovalStatus, { color: string; label: string; bg: string; border: string }> = {
  pending: { color: "#f59e0b", label: "Pending", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  escalated: { color: "#8b7ac8", label: "Escalated", bg: "rgba(139,122,200,0.08)", border: "rgba(139,122,200,0.2)" },
  approved: { color: "#10b981", label: "Approved", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  rejected: { color: "#ef4444", label: "Rejected", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  revised: { color: "#4B8BDB", label: "Revised", bg: "rgba(75,139,219,0.08)", border: "rgba(75,139,219,0.2)" },
  expired: { color: "#6b7280", label: "Expired", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
  withdrawn: { color: "#6b7280", label: "Withdrawn", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
};

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

function unwrap<T>(resp: T | ApiEnvelope<T>): T {
  if (resp && typeof resp === "object" && "data" in (resp as Record<string, unknown>)) {
    return (resp as ApiEnvelope<T>).data as T;
  }
  return resp as T;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function ApprovalDetail({ approval }: { approval: ApprovalRequest }) {
  const { data: trail } = useStandardQuery({
    queryKey: ["approval-audit", approval.id],
    queryFn: async () => {
      try {
        const r = await apiRequest<ApiEnvelope<AuditEntry[]> | AuditEntry[]>("GET", `/api/approvals/${approval.id}/audit-trail`);
        return unwrap(r);
      } catch {
        return [] as AuditEntry[];
      }
    },
  });

  const payload = approval.payload ?? {};
  const ctx = (payload.context ?? {}) as Record<string, unknown>;
  const rule = payload.matchedRuleDetails ?? null;
  const tier = payload.tierDetails ?? null;

  return (
    <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      {payload.reason && (
        <div className="rounded-lg p-3" style={{ background: "rgba(75,139,219,0.04)", border: "1px solid rgba(75,139,219,0.1)" }}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(75,139,219,0.7)" }}>
            Guardian Reason
          </div>
          <div className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>
            {payload.reason}
          </div>
        </div>
      )}

      {rule && <MatchedRuleCard rule={rule} />}
      {tier && <TierCard tier={tier} />}

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {payload.matchedRuleId && !rule && (
          <Field label="Matched Rule" value={payload.matchedRuleId} mono />
        )}
        {payload.tier && !tier && <Field label="Policy Tier" value={payload.tier} mono />}
        {payload.runId && <Field label="Run ID" value={payload.runId} mono />}
        {payload.workflowId && <Field label="Workflow" value={payload.workflowId} mono />}
        {payload.stepId && <Field label="Step" value={payload.stepId} mono />}
        {payload.agentId && <Field label="Agent" value={String(payload.agentId)} mono />}
        {approval.serviceAttribution && (
          <Field label="Service" value={approval.serviceAttribution} mono />
        )}
        {approval.correlationId && (
          <Field label="Correlation" value={approval.correlationId} mono />
        )}
      </div>

      {payload.requiredApprovers && payload.requiredApprovers.length > 0 && (
        <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Shield className="w-3 h-3" />
          Required approvers:
          {payload.requiredApprovers.map((r) => (
            <span
              key={r}
              className="px-1.5 py-0.5 rounded font-mono"
              style={{ color: "rgba(75,139,219,0.8)", background: "rgba(75,139,219,0.06)", border: "1px solid rgba(75,139,219,0.15)" }}
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {Object.keys(ctx).length > 0 && (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            Context
          </div>
          <pre
            className="text-[10px] font-mono p-2 rounded overflow-x-auto"
            style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
          >
            {JSON.stringify(ctx, null, 2)}
          </pre>
        </div>
      )}

      {trail && trail.length > 0 && (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            Audit Trail
          </div>
          <div className="space-y-1">
            {trail.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 text-[10px] px-2 py-1 rounded"
                style={{ background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.55)" }}
              >
                <Activity className="w-2.5 h-2.5" style={{ color: "rgba(75,139,219,0.6)" }} />
                <span className="font-mono uppercase tracking-wider text-[9px]" style={{ color: "#4B8BDB" }}>
                  {t.action}
                </span>
                {t.fromStatus && t.toStatus && (
                  <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {t.fromStatus} → {t.toStatus}
                  </span>
                )}
                {t.actorRole && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>· {t.actorRole}</span>}
                {t.note && <span className="text-[9px] italic" style={{ color: "rgba(255,255,255,0.45)" }}>"{t.note}"</span>}
                <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {relativeTime(t.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function tierRiskColor(level: number): string {
  if (level >= 5) return "#ef4444";
  if (level >= 4) return "#f59e0b";
  if (level >= 3) return "#8b7ac8";
  if (level >= 2) return "#4B8BDB";
  return "#10b981";
}

function MatchedRuleCard({ rule }: { rule: MatchedRuleDetails }) {
  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{ background: "rgba(139,122,200,0.05)", border: "1px solid rgba(139,122,200,0.18)" }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Shield className="w-3 h-3" style={{ color: "rgba(139,122,200,0.85)" }} />
        <span
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: "rgba(139,122,200,0.85)" }}
        >
          Guardian Rule
        </span>
        <span className="text-[11px] font-semibold text-white">{rule.name}</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)" }}>
          {rule.id}
        </span>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded ml-auto"
          style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.08)", border: "1px solid rgba(75,139,219,0.18)" }}
          title={`Engine action when this rule matches: ${rule.action}`}
        >
          {rule.action}
        </span>
      </div>

      {rule.description && (
        <div className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>
          {rule.description}
        </div>
      )}

      {rule.conditions.length > 0 && (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            Conditions ({rule.conditions.length})
          </div>
          <div className="space-y-1">
            {rule.conditions.map((c, i) => (
              <div
                key={`${c.field}-${i}`}
                className="text-[10px] font-mono px-2 py-1 rounded flex items-center gap-2 flex-wrap"
                style={{ background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span style={{ color: "#8b7ac8" }}>{c.field}</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{c.operator}</span>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>
                  {typeof c.value === "string" ? c.value : JSON.stringify(c.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        <span>priority {rule.priority}</span>
        {rule.owner && <span>· owner {rule.owner}</span>}
        {!rule.enabled && (
          <span style={{ color: "#ef4444" }}>· disabled</span>
        )}
        {rule.tags.length > 0 && (
          <span className="flex items-center gap-1 flex-wrap">
            ·
            {rule.tags.map((t) => (
              <span
                key={t}
                className="px-1 py-0.5 rounded font-mono"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}
              >
                {t}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function TierCard({ tier }: { tier: TierDetails }) {
  const color = tierRiskColor(tier.riskLevel);
  const gateLabel =
    tier.approvalGate === "dual"
      ? "Dual approval required"
      : tier.approvalGate === "single"
        ? "Single approval required"
        : "No approval gate";
  const summary = `${tier.description}\n\nApproval gate: ${gateLabel}\nRisk level: ${tier.riskLevel} / 6\nRollback required: ${tier.requiresRollback ? "yes" : "no"}\nPII redacted: ${tier.redactPII ? "yes" : "no"}\nExternal comms: ${tier.allowExternalComms ? "allowed" : "blocked"}`;
  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
      title={summary}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color }}
        >
          Policy Tier
        </span>
        <span className="text-[11px] font-mono font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
          T{tier.tierNumber} · {tier.tier}
        </span>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded ml-auto"
          style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
        >
          risk {tier.riskLevel}/6
        </span>
      </div>
      <div className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>
        {tier.description}
      </div>
      <div className="flex items-center gap-2 flex-wrap text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>
        <span
          className="px-1.5 py-0.5 rounded font-mono"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
        >
          {gateLabel}
        </span>
        {tier.requiresRollback && (
          <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
            rollback required
          </span>
        )}
        {tier.redactPII && (
          <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(75,139,219,0.08)", color: "#4B8BDB" }}>
            PII redacted
          </span>
        )}
        {!tier.allowExternalComms && (
          <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(139,122,200,0.08)", color: "#8b7ac8" }}>
            no external comms
          </span>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded p-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
        {label}
      </div>
      <div
        className={mono ? "text-[10px] font-mono mt-0.5" : "text-[11px] mt-0.5"}
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        {value}
      </div>
    </div>
  );
}

function ApprovalRow({ approval }: { approval: ApprovalRequest }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_CONFIG[approval.status];
  const priority = PRIORITY_CONFIG[approval.priority];
  const isActionable = approval.status === "pending" || approval.status === "escalated";

  const reviewMutation = useStandardMutation({
    mutationFn: async (decision: "approved" | "rejected" | "revised") => {
      return apiRequest("POST", `/api/approvals/${approval.id}/review`, { decision, note: note.trim() || undefined });
    },
    onSuccess: () => {
      setError(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["operator-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approval-audit", approval.id] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const escalateMutation = useStandardMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/approvals/${approval.id}/escalate`, { reason: escalateReason.trim() });
    },
    onSuccess: () => {
      setError(null);
      setEscalateReason("");
      setShowEscalate(false);
      queryClient.invalidateQueries({ queryKey: ["operator-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approval-audit", approval.id] });
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: approval.status === "pending" ? "rgba(245,158,11,0.18)" : status.border,
        background: "rgba(255,255,255,0.012)",
      }}
    >
      <div className="p-4 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        <div className="flex items-start gap-3">
          <div
            className="p-1.5 rounded-lg shrink-0 mt-0.5"
            style={{ background: `${priority.color}15`, border: `1px solid ${priority.color}25` }}
          >
            <GitBranch className="w-3.5 h-3.5" style={{ color: priority.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border"
                style={{ color: priority.color, background: `${priority.color}15`, borderColor: `${priority.color}30` }}
              >
                {priority.label}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: status.color, background: status.bg }}>
                {status.label}
              </span>
              {approval.payload?.tier && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{ color: "rgba(75,139,219,0.8)", background: "rgba(75,139,219,0.06)" }}
                >
                  {approval.payload.tier}
                </span>
              )}
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
                · {relativeTime(approval.createdAt)}
              </span>
            </div>
            <div className="text-[12px] font-semibold text-white mb-0.5">{approval.title}</div>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span className="font-mono">{approval.resourceType}</span>
              <span> · {approval.resourceId}</span>
              {approval.requiredApproverRole && (
                <>
                  {" "}
                  · approver:{" "}
                  <span style={{ color: "rgba(75,139,219,0.85)" }}>{approval.requiredApproverRole}</span>
                </>
              )}
            </div>
          </div>
          <ChevronRight
            className="w-3.5 h-3.5 transition-transform shrink-0"
            style={{ color: "rgba(255,255,255,0.3)", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        </div>
      </div>

      {expanded && <ApprovalDetail approval={approval} />}

      {expanded && isActionable && (
        <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional decision note (recorded to ledger and audit trail)…"
            rows={2}
            className="w-full text-[11px] rounded-lg p-2 resize-none"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.85)",
            }}
          />
          {error && (
            <div className="text-[10px] px-2 py-1 rounded" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
              {error}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              disabled={reviewMutation.isPending || escalateMutation.isPending}
              onClick={() => reviewMutation.mutate("approved")}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
              style={{ color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <CheckCircle className="w-3 h-3" /> Approve
            </button>
            <button
              disabled={reviewMutation.isPending || escalateMutation.isPending}
              onClick={() => reviewMutation.mutate("rejected")}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <XCircle className="w-3 h-3" /> Deny
            </button>
            {approval.status === "pending" && (
              <button
                disabled={reviewMutation.isPending || escalateMutation.isPending}
                onClick={() => setShowEscalate((s) => !s)}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-medium ml-auto disabled:opacity-50"
                style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.08)", border: "1px solid rgba(139,122,200,0.2)" }}
              >
                <AlertTriangle className="w-3 h-3" /> Escalate
              </button>
            )}
          </div>
          {showEscalate && approval.status === "pending" && (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Escalation reason (required)"
                className="flex-1 text-[11px] rounded p-1.5"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(139,122,200,0.25)", color: "rgba(255,255,255,0.85)" }}
              />
              <button
                disabled={!escalateReason.trim() || escalateMutation.isPending}
                onClick={() => escalateMutation.mutate()}
                className="text-[11px] px-3 py-1.5 rounded font-medium disabled:opacity-40"
                style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.15)", border: "1px solid rgba(139,122,200,0.3)" }}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OperatorApprovalsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"active" | "all">("active");

  const { data, isLoading, isFetching, error } = useStandardQuery({
    queryKey: ["operator-approvals", filter],
    queryFn: async () => {
      const path = filter === "all" ? "/api/approvals?status=all" : "/api/approvals?status=pending";
      const r = await apiRequest<ApiEnvelope<ApprovalRequest[]> | ApprovalRequest[]>("GET", path);
      return unwrap(r);
    },
    refetchInterval: 15000,
  });

  const approvals = data ?? [];
  const pending = approvals.filter((a) => a.status === "pending");
  const escalated = approvals.filter((a) => a.status === "escalated");

  // Toast/banner the on-call operator the moment a new approval lands.
  // Tracks IDs we've already surfaced so we only toast genuinely new
  // requests (not on initial mount, not on re-renders).
  const seenApprovalIds = useRef<Set<number> | null>(null);
  useEffect(() => {
    const queue = [...pending, ...escalated];
    if (queue.length === 0) return;
    if (seenApprovalIds.current === null) {
      seenApprovalIds.current = new Set(queue.map((a) => a.id));
      return;
    }
    const seen = seenApprovalIds.current;
    const fresh = queue.filter((a) => !seen.has(a.id));
    fresh.forEach((a) => {
      seen.add(a.id);
      const isCritical =
        a.priority === "critical" ||
        a.actionClass === "human-approval-mandatory" ||
        /tier[\s_-]?8/i.test(String(a.payload?.tier ?? ""));
      const description = `${a.resourceType}/${a.resourceId} · ${a.actionClass}${a.requiredApproverRole ? ` · ${a.requiredApproverRole}` : ""}`;
      const fn = isCritical ? toast.error : toast.warning;
      fn(`Guardian approval needed: ${a.title}`, {
        description,
        duration: isCritical ? 12000 : 8000,
      });
    });
  }, [pending, escalated]);
  const resolved = approvals.filter((a) =>
    ["approved", "rejected", "revised", "expired", "withdrawn"].includes(a.status),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: "#4B8BDB" }}
            >
              Alloy · Operator Approval Queue
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Guardian Approvals</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Review and resolve actions Guardian flagged as <span className="font-mono">require-approval</span> or
            tier 8 <span className="font-mono">human-approval-mandatory</span>. Decisions write back to the
            Alloy run ledger and unblock the agent.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["active", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[10px] px-3 py-1.5 font-medium uppercase tracking-wider"
                style={{
                  background: filter === f ? "rgba(75,139,219,0.12)" : "transparent",
                  color: filter === f ? "#4B8BDB" : "rgba(255,255,255,0.5)",
                }}
              >
                {f === "active" ? "Active" : "All"}
              </button>
            ))}
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["operator-approvals"] })}
            className="p-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            title="Refresh"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
              style={{ color: "rgba(255,255,255,0.5)" }}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending", value: pending.length, color: "#f59e0b", pulse: pending.length > 0 },
          { label: "Escalated", value: escalated.length, color: "#8b7ac8", pulse: escalated.length > 0 },
          { label: "Resolved", value: resolved.length, color: "#10b981" },
          { label: "Total", value: approvals.length, color: "rgba(255,255,255,0.6)" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {c.label}
              </div>
              {c.pulse && c.value > 0 && (
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.color }} />
              )}
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-[11px]"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
        >
          Failed to load approvals: {(error as Error).message}
        </div>
      )}

      {isLoading && (
        <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Loading queue…
        </div>
      )}

      {!isLoading && approvals.length === 0 && (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}
        >
          <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: "rgba(75,139,219,0.4)" }} />
          <div className="text-[12px] font-semibold text-white mb-1">No approvals to review</div>
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            When Guardian flags an action as require-approval or tier-8, it will appear here.
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <Section icon={<Clock className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />} label="Pending Review">
          {pending.map((a) => (
            <ApprovalRow key={a.id} approval={a} />
          ))}
        </Section>
      )}

      {escalated.length > 0 && (
        <Section icon={<AlertTriangle className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />} label="Escalated">
          {escalated.map((a) => (
            <ApprovalRow key={a.id} approval={a} />
          ))}
        </Section>
      )}

      {resolved.length > 0 && filter === "all" && (
        <Section icon={<CheckCircle className="w-3.5 h-3.5" style={{ color: "#10b981" }} />} label="Resolved">
          {resolved.map((a) => (
            <ApprovalRow key={a.id} approval={a} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[11px] font-semibold text-white">{label}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
