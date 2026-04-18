import { useState } from "react";
import {
  Shield, CheckCircle, AlertTriangle, Clock, Database,
  Users, Zap, ArrowRight,
} from "lucide-react";
import { EnvironmentLabel } from "@szl-holdings/shared-ui/alloy-decision-card";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" } as const;
const TEXT = {
  primary: "rgba(255,255,255,0.88)",
  secondary: "rgba(255,255,255,0.55)",
  tertiary: "rgba(255,255,255,0.28)",
  muted: "rgba(255,255,255,0.14)",
} as const;
const ACCENT = "#d4a054";

type PolicyStatus = "active" | "draft" | "disabled";
type ApprovalStatus = "approved" | "pending" | "rejected";
type ImpactLevel = "Low" | "Medium" | "High";
type ActiveTab = "policies" | "approvals" | "audit";

interface Policy {
  id: string;
  name: string;
  category: string;
  status: PolicyStatus;
  scope: string;
  appliedAt: string;
  description: string;
  violations: number;
  checks: number;
  alert?: string;
}

interface ApprovalEntry {
  id: string;
  action: string;
  agent: string;
  requester: string;
  status: ApprovalStatus;
  approver: string | null;
  at: string;
  impact: ImpactLevel;
  reason?: string;
}

interface SummaryStat {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const POLICIES: Policy[] = [
  {
    id: "pol-001", name: "Human-in-the-Loop Enforcement", category: "Action Control",
    status: "active", scope: "All agents", appliedAt: "14d ago",
    description: "All consequential actions require explicit human approval before execution. No autonomous action in production.",
    violations: 0, checks: 4280,
  },
  {
    id: "pol-002", name: "PII Non-Transmission Policy", category: "Data Governance",
    status: "active", scope: "All agents", appliedAt: "14d ago",
    description: "No personally identifiable information may be included in agent payloads transmitted to external systems.",
    violations: 0, checks: 12480,
  },
  {
    id: "pol-003", name: "Token Budget Enforcement", category: "Resource Governance",
    status: "active", scope: "All LLM agents", appliedAt: "14d ago",
    description: "Daily token budgets enforced per agent. Agents exceeding 80% of budget trigger an alert.",
    violations: 1, checks: 384,
    alert: "Action Router exceeded budget alert threshold on Apr 2",
  },
  {
    id: "pol-004", name: "Approval Delegation Limits", category: "Action Control",
    status: "active", scope: "Action Router", appliedAt: "10d ago",
    description: "Approval delegation permitted for actions under $500 impact. Actions above threshold require senior approval.",
    violations: 0, checks: 124,
  },
  {
    id: "pol-005", name: "Source Attribution Requirement", category: "Explainability",
    status: "active", scope: "All LLM agents", appliedAt: "14d ago",
    description: "Every generated finding must include a source signal chain. Findings without traceable evidence are rejected.",
    violations: 0, checks: 2184,
  },
  {
    id: "pol-006", name: "Audit Trail Completeness", category: "Compliance",
    status: "active", scope: "All agents", appliedAt: "14d ago",
    description: "Every agent run must produce a complete, immutable trace entry. Missing audit records trigger immediate alert.",
    violations: 0, checks: 18240,
  },
];

const RECENT_APPROVALS: ApprovalEntry[] = [
  { id: "apr-001", action: "Notify: Ownership gap — ProjectX", agent: "Lyte Autonomous", requester: "System", status: "approved", approver: "J. Chen", at: "4h ago", impact: "Low" },
  { id: "apr-002", action: "Escalate: Blocker unresolved 72h", agent: "Action Router", requester: "System", status: "approved", approver: "M. Patel", at: "6h ago", impact: "Medium" },
  { id: "apr-003", action: "Route: High-risk signal to CISO", agent: "Correlation Engine", requester: "System", status: "pending", approver: null, at: "32m ago", impact: "High" },
  { id: "apr-004", action: "Archive: Stale workflow (45d)", agent: "Ownership Validator", requester: "System", status: "rejected", approver: "J. Chen", at: "1d ago", impact: "Medium", reason: "Workflow still referenced in Q2 planning" },
  { id: "apr-005", action: "Notify: Token budget alert", agent: "Action Router", requester: "System", status: "approved", approver: "Auto-approved", at: "2d ago", impact: "Low" },
];

const POLICY_STATUS_CONFIG: Record<PolicyStatus, { color: string; bg: string; label: string }> = {
  active: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Active" },
  draft: { color: "#7ba3d4", bg: "rgba(123,163,212,0.1)", label: "Draft" },
  disabled: { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "Disabled" },
};

const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, { color: string; bg: string; label: string }> = {
  approved: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Approved" },
  pending: { color: ACCENT, bg: `${ACCENT}18`, label: "Pending" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Rejected" },
};

const IMPACT_STYLE: Record<ImpactLevel, { bg: string; color: string }> = {
  High: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  Medium: { bg: `${ACCENT}18`, color: ACCENT },
  Low: { bg: "rgba(255,255,255,0.06)", color: TEXT.tertiary },
};

const SUMMARY_STATS: SummaryStat[] = [
  { label: "Active policies", value: "6", icon: Shield, color: "#22c55e" },
  { label: "Total checks today", value: "37.7k", icon: CheckCircle, color: "#22c55e" },
  { label: "Policy violations", value: "1", icon: AlertTriangle, color: "#f97316" },
  { label: "Pending approvals", value: "1", icon: Clock, color: ACCENT },
  { label: "Auto-approved actions", value: "14", icon: Zap, color: "#7ba3d4" },
  { label: "Human-reviewed actions", value: "23", icon: Users, color: "#8b7ac8" },
];

export default function AlloyGovernancePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("policies");
  const tabs: ActiveTab[] = ["policies", "approvals", "audit"];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>Governance Dashboard</span>
          <EnvironmentLabel environment="demo" />
        </div>
        <div className="flex gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-lg px-3 py-1.5 text-[11px] font-medium capitalize transition-all"
              style={{
                background: activeTab === tab ? `${ACCENT}18` : "rgba(255,255,255,0.04)",
                color: activeTab === tab ? ACCENT : TEXT.tertiary,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-6 gap-px" style={{ borderBottom: `1px solid ${BORDER.subtle}`, background: BORDER.subtle }}>
          {SUMMARY_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="px-4 py-3" style={{ background: BG.page }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3" style={{ color: stat.color }} />
                  <span className="text-[10px]" style={{ color: TEXT.muted }}>{stat.label}</span>
                </div>
                <p className="text-[18px] font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {activeTab === "policies" && (
          <div className="p-4 space-y-3">
            {POLICIES.map((policy) => {
              const s = POLICY_STATUS_CONFIG[policy.status];
              return (
                <div key={policy.id} className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="flex items-start justify-between px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[12px] font-semibold" style={{ color: TEXT.primary }}>{policy.name}</p>
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </div>
                      <p className="text-[11px] mb-2" style={{ color: TEXT.secondary }}>{policy.description}</p>
                      <div className="flex items-center gap-4 text-[10px]" style={{ color: TEXT.muted }}>
                        <span>Category: <span style={{ color: TEXT.tertiary }}>{policy.category}</span></span>
                        <span>Scope: <span style={{ color: TEXT.tertiary }}>{policy.scope}</span></span>
                        <span>Since: <span style={{ color: TEXT.tertiary }}>{policy.appliedAt}</span></span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right ml-4">
                      <p className="text-[14px] font-bold font-mono mb-0.5" style={{ color: policy.violations === 0 ? "#22c55e" : "#ef4444" }}>{policy.violations}</p>
                      <p className="text-[9px]" style={{ color: TEXT.muted }}>violations</p>
                      <p className="text-[11px] font-mono mt-1" style={{ color: TEXT.tertiary }}>{policy.checks.toLocaleString()} checks</p>
                    </div>
                  </div>
                  {policy.alert && (
                    <div className="px-4 py-2 flex items-center gap-2 text-[10px]" style={{ background: "rgba(249,115,22,0.06)", borderTop: `1px solid rgba(249,115,22,0.15)`, color: "#f97316" }}>
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {policy.alert}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="p-4 space-y-2">
            {RECENT_APPROVALS.map((approval) => {
              const s = APPROVAL_STATUS_CONFIG[approval.status];
              const imp = IMPACT_STYLE[approval.impact];
              return (
                <div key={approval.id} className="rounded-md px-4 py-3 flex items-center gap-4" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium mb-0.5 truncate" style={{ color: TEXT.primary }}>{approval.action}</p>
                    <p className="text-[10px]" style={{ color: TEXT.tertiary }}>
                      {approval.agent} · {approval.at}{approval.approver ? ` · ${approval.approver}` : ""}
                    </p>
                    {approval.reason && (
                      <p className="text-[10px] mt-1 italic" style={{ color: "#ef4444" }}>Rejected: {approval.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: imp.bg, color: imp.color }}>
                      {approval.impact}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="p-4">
            <div className="rounded-md px-4 py-8 text-center" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
              <Database className="w-8 h-8 mx-auto mb-3" style={{ color: TEXT.muted }} />
              <p className="text-[12px] font-medium mb-1" style={{ color: TEXT.secondary }}>Proof Chain Audit Log</p>
              <p className="text-[11px] mb-4" style={{ color: TEXT.muted }}>Full immutable audit trail is available in the Proof Chain viewer. Every agent action, approval, and inference is recorded and retrievable.</p>
              <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-medium" style={{ background: `${ACCENT}18`, color: ACCENT }}>
                Open Proof Chain <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
