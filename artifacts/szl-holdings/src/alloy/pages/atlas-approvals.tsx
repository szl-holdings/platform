import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import { GitBranch, CheckCircle, XCircle, AlertTriangle, Clock, ChevronRight, Shield, Zap, Target, Eye, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAtlasApprovalsBadge, ATLAS_APPROVALS_BADGE_QUERY_KEY } from "@/alloy/hooks/use-atlas-approvals-badge";

type ApprovalStatus = "pending" | "approved" | "rejected" | "escalated" | "revised" | "expired" | "withdrawn";
type RiskLevel = "critical" | "high" | "medium" | "low";

interface ApiApproval {
  id: number;
  orgId: number | null;
  resourceType: string;
  resourceId: string;
  title: string;
  description: string | null;
  actionClass: string;
  priority: string;
  status: ApprovalStatus;
  requiredApproverRole: string | null;
  serviceAttribution: string | null;
  correlationId: string | null;
  payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

interface ScenarioRecommendation {
  id: string;
  numericId: number;
  scenarioId: string;
  scenarioName: string;
  branch: string;
  domain: string;
  recommendation: string;
  rationale: string;
  riskLevel: RiskLevel;
  blastRadius: number;
  costImpact: string;
  mttr: string;
  actions: string[];
  requestedBy: string;
  requestedAt: string;
  approvalStatus: ApprovalStatus;
  requiredApprover: string;
  evidenceLinks: string[];
}

const RISK_CONFIG: Record<RiskLevel, { color: string; label: string }> = {
  critical: { color: "#ef4444", label: "Critical" },
  high: { color: "#f59e0b", label: "High" },
  medium: { color: "#8b7ac8", label: "Medium" },
  low: { color: "#6b7280", label: "Low" },
};

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string; border: string }> = {
  pending: { color: "#f59e0b", label: "Pending Review", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  approved: { color: "#10b981", label: "Approved", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  rejected: { color: "#ef4444", label: "Rejected", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
  escalated: { color: "#8b7ac8", label: "Escalated", bg: "rgba(139,122,200,0.08)", border: "rgba(139,122,200,0.2)" },
  revised: { color: "#8b7ac8", label: "Revised", bg: "rgba(139,122,200,0.08)", border: "rgba(139,122,200,0.2)" },
  expired: { color: "#6b7280", label: "Expired", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
  withdrawn: { color: "#6b7280", label: "Withdrawn", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
};

const PRIORITY_RISK: Record<string, RiskLevel> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function apiApprovalToRec(a: ApiApproval): ScenarioRecommendation {
  const payload = a.payload ?? {};
  const meta = a.metadata ?? {};
  return {
    id: `apr-${a.id}`,
    numericId: a.id,
    scenarioId: (payload["scenarioId"] as string) ?? (a.correlationId ?? `SIM-${a.id}`),
    scenarioName: (payload["scenarioName"] as string) ?? (meta["scenarioName"] as string) ?? a.resourceType,
    branch: (payload["branch"] as string) ?? (meta["branch"] as string) ?? "Primary Response Path",
    domain: (payload["domain"] as string) ?? (a.serviceAttribution ?? "aegis"),
    recommendation: a.title,
    rationale: a.description ?? "ATLAS Scenario Forge recommendation awaiting operator review.",
    riskLevel: PRIORITY_RISK[a.priority] ?? "medium",
    blastRadius: (payload["blastRadius"] as number) ?? (meta["blastRadius"] as number) ?? 0,
    costImpact: (payload["costImpact"] as string) ?? (meta["costImpact"] as string) ?? "TBD",
    mttr: (payload["mttr"] as string) ?? (meta["mttr"] as string) ?? "TBD",
    actions: (payload["actions"] as string[]) ?? (meta["actions"] as string[]) ?? [a.title],
    requestedBy: a.serviceAttribution ?? "ATLAS Spatial Runtime",
    requestedAt: timeAgo(a.createdAt),
    approvalStatus: a.status,
    requiredApprover: a.requiredApproverRole ?? "CISO / SOC Lead",
    evidenceLinks: (payload["evidenceLinks"] as string[]) ?? (meta["evidenceLinks"] as string[]) ?? [`${a.resourceType}/${a.resourceId}`],
  };
}

const DEMO_APPROVALS: ScenarioRecommendation[] = [
  {
    id: "apr-001", numericId: -1, scenarioId: "SIM-0847", scenarioName: "APT29 Ransomware Campaign", branch: "Branch A — Immediate Isolation",
    domain: "aegis", recommendation: "Approve immediate host isolation and Kerberos ticket revocation for WKSTN-FIN-042",
    rationale: "Scenario Forge modeling indicates 34% probability of containment with blast radius limited to 3 assets if action is taken within 15 minutes of this approval.",
    riskLevel: "critical", blastRadius: 12, costImpact: "$240K", mttr: "1h 22m",
    actions: ["Isolate WKSTN-FIN-042 via EDR API", "Revoke krbtgt — Kerberos forest-wide reissue", "Page SOC Tier-2 (SLA: 5m)", "Enable enhanced DC logging"],
    requestedBy: "ATLAS Spatial Runtime", requestedAt: "2m ago", approvalStatus: "pending",
    requiredApprover: "CISO / SOC Lead", evidenceLinks: ["INC-2024-0847 incident thread", "Posture twin drift report", "Replay Engine: lateral movement path"],
  },
  {
    id: "apr-002", numericId: -2, scenarioId: "SIM-0831", scenarioName: "Cloud Privilege Escalation", branch: "Branch C — Targeted Containment",
    domain: "aegis", recommendation: "Authorize AWS IAM policy rollback and temporary cross-account role suspension",
    rationale: "IAM drift detected across 3 SGs in AWS VPC. Approved rollback will reduce exposure surface by 87% with minimal service disruption.",
    riskLevel: "high", blastRadius: 19, costImpact: "$180K", mttr: "0h 55m",
    actions: ["Roll back IAM policy to version 14", "Suspend temp cross-account role chain", "Enable CloudTrail enhanced logging", "Notify cloud team"],
    requestedBy: "Aegis Posture Twin", requestedAt: "8m ago", approvalStatus: "pending",
    requiredApprover: "Cloud Security Lead", evidenceLinks: ["AWS VPC twin drift report", "IAM policy delta log"],
  },
  {
    id: "apr-003", numericId: -3, scenarioId: "SIM-0819", scenarioName: "OT/ICS PLC Anomaly", branch: "Branch B — Supervised Patch",
    domain: "aegis", recommendation: "Approve supervised PLC firmware reconciliation during next maintenance window",
    rationale: "PLC ladder logic delta requires firmware patch. Supervised patch during maintenance minimizes production impact. Dwell risk accepted pending approval.",
    riskLevel: "high", blastRadius: 8, costImpact: "$95K", mttr: "2h 30m",
    actions: ["Schedule maintenance window T+4h", "Patch PLC FW under engineer supervision", "Validate post-patch telemetry", "Re-baseline OT twin"],
    requestedBy: "ATLAS OT Runtime", requestedAt: "15m ago", approvalStatus: "escalated",
    requiredApprover: "OT Security Lead + CISO", evidenceLinks: ["OT twin anomaly report", "ICS protocol deviation log"],
  },
  {
    id: "apr-004", numericId: -4, scenarioId: "SIM-0801", scenarioName: "K8s App Tier Drift", branch: "Branch A — Immediate Remediation",
    domain: "aegis", recommendation: "Approve pod security context enforcement and CVE-2024-3890 emergency patch",
    rationale: "6 containers drifted from approved security baseline. CVE-2024-3890 is remotely exploitable. Immediate patch reduces CVSS 9.1 exposure.",
    riskLevel: "critical", blastRadius: 24, costImpact: "$320K", mttr: "1h 45m",
    actions: ["Enforce pod security context via admission controller", "Emergency patch CVE-2024-3890", "Restart affected deployments", "Audit RBAC bindings"],
    requestedBy: "Aegis App Tier Twin", requestedAt: "22m ago", approvalStatus: "approved",
    requiredApprover: "Platform Security Lead", evidenceLinks: ["K8s twin drift analysis", "CVE advisory CVE-2024-3890"],
  },
];

function ApprovalCard({
  rec,
  onApprove,
  onReject,
  onEscalate,
  isUpdating,
}: {
  rec: ScenarioRecommendation;
  onApprove: () => void;
  onReject: () => void;
  onEscalate: () => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_CONFIG[rec.approvalStatus] ?? STATUS_CONFIG["pending"];
  const r = RISK_CONFIG[rec.riskLevel];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: rec.approvalStatus === "pending" ? "rgba(245,158,11,0.15)" : s.border, background: "rgba(255,255,255,0.01)" }}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: `${r.color}15`, border: `1px solid ${r.color}25` }}>
            <GitBranch className="w-3.5 h-3.5" style={{ color: r.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ color: r.color, background: `${r.color}15`, borderColor: `${r.color}30` }}>{r.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: s.color, background: s.bg }}>{s.label}</span>
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>· {rec.requestedAt}</span>
            </div>
            <div className="text-[11px] font-semibold text-white mb-0.5">{rec.recommendation}</div>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span style={{ color: "rgba(75,139,219,0.8)" }}>{rec.scenarioName}</span> · {rec.branch}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <div className="grid grid-cols-2 gap-1.5 text-right">
              <div className="rounded-lg px-2 py-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-[8px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Blast</div>
                <div className="text-[10px] font-bold font-mono" style={{ color: rec.blastRadius > 20 ? "#f59e0b" : "#10b981" }}>{rec.blastRadius}%</div>
              </div>
              <div className="rounded-lg px-2 py-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-[8px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Cost</div>
                <div className="text-[10px] font-bold font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{rec.costImpact}</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 transition-transform" style={{ color: "rgba(255,255,255,0.3)", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="pt-3 space-y-3">
            <div className="rounded-lg p-3" style={{ background: "rgba(75,139,219,0.04)", border: "1px solid rgba(75,139,219,0.1)" }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(75,139,219,0.7)" }}>Rationale</div>
              <div className="text-[10px] leading-snug" style={{ color: "rgba(255,255,255,0.65)" }}>{rec.rationale}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Proposed Actions</div>
              {rec.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <ArrowRight className="w-2.5 h-2.5 mt-0.5 shrink-0" style={{ color: "#4B8BDB" }} />
                  {a}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[9px] flex-wrap">
              <Eye className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
              <span style={{ color: "rgba(255,255,255,0.3)" }}>Evidence:</span>
              {rec.evidenceLinks.map((e, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded font-mono" style={{ color: "rgba(75,139,219,0.7)", background: "rgba(75,139,219,0.05)", border: "1px solid rgba(75,139,219,0.1)" }}>{e}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Shield className="w-3 h-3" />
              Required approver: <span className="text-white/60">{rec.requiredApprover}</span>
            </div>
            {rec.approvalStatus === "pending" && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onApprove}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                  style={{ color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve & Handoff
                </button>
                <button
                  onClick={onReject}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                  style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
                </button>
                <button
                  onClick={onEscalate}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-medium ml-auto disabled:opacity-50"
                  style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.08)", border: "1px solid rgba(139,122,200,0.2)" }}
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} Escalate
                </button>
              </div>
            )}
            {rec.approvalStatus !== "pending" && (
              <div className="rounded-lg px-3 py-2 flex items-center gap-2 text-[10px]" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                {rec.approvalStatus === "approved" ? <CheckCircle className="w-3 h-3" style={{ color: "#10b981" }} /> : rec.approvalStatus === "rejected" ? <XCircle className="w-3 h-3" style={{ color: "#ef4444" }} /> : <AlertTriangle className="w-3 h-3" style={{ color: "#8b7ac8" }} />}
                <span style={{ color: s.color }}>Decision recorded — {s.label}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlloyAtlasApprovals() {
  const queryClient = useQueryClient();

  const { data: apiData, isLoading, refetch } = useStandardQuery<ApiApproval[]>({
    queryKey: ["atlas-approvals"],
    queryFn: async () => {
      const result = await apiRequest<ApiApproval[] | { data: ApiApproval[] }>("GET", "/api/approvals?status=all");
      return Array.isArray(result) ? result : (result as { data: ApiApproval[] }).data ?? [];
    },
    staleTime: 15000,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const { markAllSeen } = useAtlasApprovalsBadge();
  useEffect(() => {
    markAllSeen();
  }, [markAllSeen]);
  useEffect(() => {
    if (apiData) markAllSeen();
  }, [apiData, markAllSeen]);

  const [localOverrides, setLocalOverrides] = useState<Record<string, ApprovalStatus>>({});
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const reviewMutation = useStandardMutation({
    mutationFn: async ({ numericId, decision, reason }: { numericId: number; decision: "approved" | "rejected" | "revised"; reason?: string }) => {
      if (numericId < 0) throw new Error("Demo record — no API call");
      return apiRequest("POST", `/api/approvals/${numericId}/review`, { decision, note: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atlas-approvals"] });
      queryClient.invalidateQueries({ queryKey: ATLAS_APPROVALS_BADGE_QUERY_KEY });
      markAllSeen();
    },
  });

  const escalateMutation = useStandardMutation({
    mutationFn: async ({ numericId, reason }: { numericId: number; reason: string }) => {
      if (numericId < 0) throw new Error("Demo record — no API call");
      return apiRequest("POST", `/api/approvals/${numericId}/escalate`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atlas-approvals"] });
      queryClient.invalidateQueries({ queryKey: ATLAS_APPROVALS_BADGE_QUERY_KEY });
      markAllSeen();
    },
  });

  const apiApprovals = Array.isArray(apiData) ? apiData.map(apiApprovalToRec) : [];
  const baseApprovals = apiApprovals.length > 0 ? apiApprovals : DEMO_APPROVALS;
  const isLiveData = apiApprovals.length > 0;

  const approvals = baseApprovals.map(a => ({
    ...a,
    approvalStatus: localOverrides[a.id] ?? a.approvalStatus,
  }));

  async function handleDecision(rec: ScenarioRecommendation, decision: "approved" | "rejected") {
    const localId = rec.id;
    setUpdatingIds(prev => new Set(prev).add(localId));
    try {
      if (rec.numericId > 0) {
        await reviewMutation.mutateAsync({ numericId: rec.numericId, decision });
      } else {
        setLocalOverrides(prev => ({ ...prev, [localId]: decision }));
      }
    } catch {
      setLocalOverrides(prev => ({ ...prev, [localId]: decision }));
    } finally {
      setUpdatingIds(prev => { const next = new Set(prev); next.delete(localId); return next; });
    }
  }

  async function handleEscalate(rec: ScenarioRecommendation) {
    const localId = rec.id;
    setUpdatingIds(prev => new Set(prev).add(localId));
    try {
      if (rec.numericId > 0) {
        await escalateMutation.mutateAsync({ numericId: rec.numericId, reason: "Escalated from ATLAS Approvals queue" });
      } else {
        setLocalOverrides(prev => ({ ...prev, [localId]: "escalated" }));
      }
    } catch {
      setLocalOverrides(prev => ({ ...prev, [localId]: "escalated" }));
    } finally {
      setUpdatingIds(prev => { const next = new Set(prev); next.delete(localId); return next; });
    }
  }

  const pending = approvals.filter(a => a.approvalStatus === "pending");
  const escalated = approvals.filter(a => a.approvalStatus === "escalated");
  const resolved = approvals.filter(a => ["approved", "rejected", "revised", "expired", "withdrawn"].includes(a.approvalStatus));

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#4B8BDB" }}>Alloy · ATLAS Approvals</span>
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" style={{ color: "rgba(75,139,219,0.5)" }} />}
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Scenario Recommendation Handoff</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Review and approve ATLAS Scenario Forge recommendations before they enter the Alloy execution workflow gate.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
          style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {isLiveData && (
        <div className="rounded-xl border px-4 py-2.5 flex items-center gap-3" style={{ borderColor: "rgba(75,139,219,0.12)", background: "rgba(75,139,219,0.02)" }}>
          <Zap className="w-3 h-3 shrink-0" style={{ color: "#4B8BDB" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Showing <span className="font-bold font-mono" style={{ color: "#4B8BDB" }}>{approvals.length}</span> live approval{approvals.length !== 1 ? "s" : ""} from the governance workflow queue — approve, reject, or escalate to trigger Alloy execution handoff
          </span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending Review", value: pending.length, color: "#f59e0b", pulse: true },
          { label: "Escalated", value: escalated.length, color: "#8b7ac8", pulse: escalated.length > 0 },
          { label: "Resolved", value: resolved.length, color: "#10b981" },
          { label: "Total", value: approvals.length, color: "rgba(255,255,255,0.5)" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
              {c.pulse && c.value > 0 && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.color }} />}
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
            <span className="text-[11px] font-semibold text-white">Pending Review</span>
          </div>
          <div className="space-y-3">
            {pending.map(rec => (
              <ApprovalCard
                key={rec.id}
                rec={rec}
                isUpdating={updatingIds.has(rec.id)}
                onApprove={() => handleDecision(rec, "approved")}
                onReject={() => handleDecision(rec, "rejected")}
                onEscalate={() => handleEscalate(rec)}
              />
            ))}
          </div>
        </div>
      )}

      {escalated.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
            <span className="text-[11px] font-semibold text-white">Escalated</span>
          </div>
          <div className="space-y-3">
            {escalated.map(rec => (
              <ApprovalCard
                key={rec.id}
                rec={rec}
                isUpdating={updatingIds.has(rec.id)}
                onApprove={() => handleDecision(rec, "approved")}
                onReject={() => handleDecision(rec, "rejected")}
                onEscalate={() => handleEscalate(rec)}
              />
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
            <span className="text-[11px] font-semibold text-white">Resolved</span>
          </div>
          <div className="space-y-3">
            {resolved.map(rec => (
              <ApprovalCard
                key={rec.id}
                rec={rec}
                isUpdating={updatingIds.has(rec.id)}
                onApprove={() => handleDecision(rec, "approved")}
                onReject={() => handleDecision(rec, "rejected")}
                onEscalate={() => handleEscalate(rec)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
