import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OpsLayout } from "../components/ops-layout";
import { Shield, FileText, CheckCircle2, Clock, AlertTriangle, Plus, ChevronRight, ChevronDown, User } from "lucide-react";

interface ApiGovernanceResponse {
  policies: Policy[];
  summary: { total: number; active: number; draft: number };
  generatedAt: string;
  dataSource: string;
}

type PolicyStatus = "active" | "draft" | "pending-approval" | "archived";
type PolicyCategory = "data" | "access" | "compliance" | "security" | "operational";

interface ApprovalStep {
  role: string;
  approver: string;
  status: "approved" | "pending" | "rejected";
  date?: string;
  comment?: string;
}

interface Policy {
  id: string;
  title: string;
  category: PolicyCategory;
  status: PolicyStatus;
  domains: string[];
  version: string;
  owner: string;
  lastUpdated: string;
  effectiveDate: string;
  description: string;
  approvalChain: ApprovalStep[];
  auditLog: { date: string; action: string; actor: string }[];
  enforcement: "auto" | "manual" | "advisory";
}

const FALLBACK_POLICIES: Policy[] = [
  {
    id: "p1", title: "Data Retention & Disposal Policy", category: "data", status: "active",
    domains: ["All Domains"], version: "v2.1", owner: "Priya Nair", lastUpdated: "Apr 10",
    effectiveDate: "Jan 1, 2026", description: "Defines mandatory data retention periods by classification, automated disposal schedules, and legal hold procedures for all SZL ecosystem applications.",
    enforcement: "auto",
    approvalChain: [
      { role: "Legal Counsel", approver: "Priya Nair", status: "approved", date: "Dec 28", comment: "Compliant with GDPR & CCPA requirements." },
      { role: "CISO", approver: "James Okafor", status: "approved", date: "Dec 30" },
      { role: "CEO", approver: "Stephen Lutar", status: "approved", date: "Dec 31" },
    ],
    auditLog: [
      { date: "Apr 10", action: "Policy reviewed — no changes", actor: "Priya Nair" },
      { date: "Jan 1", action: "Policy became effective", actor: "System" },
      { date: "Dec 31", action: "Final approval granted", actor: "Stephen Lutar" },
    ],
  },
  {
    id: "p2", title: "Cross-Domain Access Control Framework", category: "access", status: "active",
    domains: ["Aegis", "Vessels", "Terra", "Lyte", "PRISM"], version: "v1.4", owner: "James Okafor",
    lastUpdated: "Apr 8", effectiveDate: "Mar 15, 2026", description: "Defines role-based access control (RBAC) requirements, privilege escalation procedures, and audit requirements for cross-domain data access.",
    enforcement: "auto",
    approvalChain: [
      { role: "CISO", approver: "James Okafor", status: "approved", date: "Mar 10" },
      { role: "Legal Counsel", approver: "Priya Nair", status: "approved", date: "Mar 12" },
      { role: "CEO", approver: "Stephen Lutar", status: "approved", date: "Mar 14" },
    ],
    auditLog: [
      { date: "Apr 8", action: "Minor update: added Carlota Jo scope", actor: "James Okafor" },
      { date: "Mar 15", action: "Policy activated", actor: "System" },
    ],
  },
  {
    id: "p3", title: "AI Model Governance & Output Validation", category: "compliance", status: "pending-approval",
    domains: ["Command", "Aegis", "PRISM", "Terra"], version: "v1.0-draft", owner: "Stephen Lutar",
    lastUpdated: "Apr 14", effectiveDate: "TBD", description: "Governs the use of AI-generated outputs in decision-making workflows. Requires human review for decisions above defined risk thresholds. Establishes explainability requirements.",
    enforcement: "manual",
    approvalChain: [
      { role: "Legal Counsel", approver: "Priya Nair", status: "approved", date: "Apr 13", comment: "Legal framework sound. Recommend adding liability clauses." },
      { role: "CISO", approver: "James Okafor", status: "pending" },
      { role: "CEO", approver: "Stephen Lutar", status: "pending" },
    ],
    auditLog: [
      { date: "Apr 14", action: "Submitted for CISO approval", actor: "Priya Nair" },
      { date: "Apr 13", action: "Legal review completed", actor: "Priya Nair" },
      { date: "Apr 10", action: "Policy draft created", actor: "Stephen Lutar" },
    ],
  },
  {
    id: "p4", title: "Maritime Cybersecurity Incident Response", category: "security", status: "active",
    domains: ["Vessels", "Aegis"], version: "v3.2", owner: "James Okafor",
    lastUpdated: "Apr 5", effectiveDate: "Feb 1, 2026", description: "Prescribes response procedures for OT/IT cyber incidents affecting vessel systems, including isolation protocols, crew notification, and port authority reporting obligations.",
    enforcement: "auto",
    approvalChain: [
      { role: "CISO", approver: "James Okafor", status: "approved", date: "Jan 28" },
      { role: "Fleet Operations Lead", approver: "Marcus Chen", status: "approved", date: "Jan 30" },
      { role: "Legal Counsel", approver: "Priya Nair", status: "approved", date: "Jan 31" },
    ],
    auditLog: [
      { date: "Apr 5", action: "Updated port authority contacts — Singapore MPA", actor: "Marcus Chen" },
      { date: "Feb 1", action: "Policy activated", actor: "System" },
    ],
  },
  {
    id: "p5", title: "Real Estate Deal Approval Thresholds", category: "operational", status: "draft",
    domains: ["Terra"], version: "v1.0-draft", owner: "Sofia Reyes",
    lastUpdated: "Apr 15", effectiveDate: "TBD", description: "Defines approval authority levels for real estate acquisitions and dispositions based on deal size, asset class, and leverage ratios.",
    enforcement: "manual",
    approvalChain: [
      { role: "RE Lead", approver: "Sofia Reyes", status: "pending" },
      { role: "CFO", approver: "Aisha Kamara", status: "pending" },
      { role: "CEO", approver: "Stephen Lutar", status: "pending" },
    ],
    auditLog: [
      { date: "Apr 15", action: "Draft policy created", actor: "Sofia Reyes" },
    ],
  },
];

const CATEGORY_COLORS: Record<PolicyCategory, string> = {
  data: "#0ea5e9",
  access: "#a855f7",
  compliance: "#22c55e",
  security: "#ef4444",
  operational: "#f59e0b",
};

const STATUS_COLORS: Record<PolicyStatus, string> = {
  active: "var(--color-low)",
  draft: "var(--color-fg-muted)",
  "pending-approval": "var(--color-medium)",
  archived: "var(--color-fg-muted)",
};

export default function GovernancePage() {
  const { data: apiData } = useQuery<ApiGovernanceResponse>({
    queryKey: ["command-governance"],
    queryFn: async () => {
      const res = await fetch("/api/command/governance", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load governance");
      const json = await res.json();
      return (json?.data ?? json) as ApiGovernanceResponse;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const POLICIES: Policy[] = apiData?.policies && apiData.policies.length > 0 ? apiData.policies : FALLBACK_POLICIES;

  const [selected, setSelected] = useState<string | null>("p1");
  const [tab, setTab] = useState<"policies" | "audit">("policies");
  const [categoryFilter, setCategoryFilter] = useState<PolicyCategory | "all">("all");

  const selectedPolicy = POLICIES.find((p) => p.id === selected);

  const filtered = POLICIES.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  const pendingPolicies = POLICIES.filter((p) => p.status === "pending-approval");
  const allAuditEvents = POLICIES.flatMap((p) => p.auditLog.map((e) => ({ ...e, policy: p.title, domain: p.domains[0] }))).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <OpsLayout title="Governance">
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Policies", value: POLICIES.filter(p => p.status === "active").length, color: "var(--color-low)", icon: CheckCircle2 },
            { label: "Pending Approval", value: pendingPolicies.length, color: "var(--color-medium)", icon: Clock },
            { label: "Drafts", value: POLICIES.filter(p => p.status === "draft").length, color: "var(--color-fg-muted)", icon: FileText },
            { label: "Domains Covered", value: 6, color: "#8b7ac8", icon: Shield },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--color-fg-muted)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Approvals Banner */}
        {pendingPolicies.length > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "color-mix(in srgb, var(--color-medium) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-medium) 25%, transparent)" }}>
            <Clock className="w-4 h-4" style={{ color: "var(--color-medium)" }} />
            <div className="flex-1">
              <span className="text-sm font-semibold" style={{ color: "var(--color-fg-primary)" }}>{pendingPolicies.length} polic{pendingPolicies.length > 1 ? "ies require" : "y requires"} your review and approval</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {pendingPolicies.map((p) => (
                  <button key={p.id} onClick={() => { setSelected(p.id); setTab("policies"); }} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)", color: "var(--color-medium)" }}>{p.title}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
          {(["policies", "audit"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-1.5 rounded-lg text-xs font-medium capitalize" style={{ backgroundColor: tab === t ? "var(--color-bg-elevated)" : "transparent", color: tab === t ? "var(--color-fg-primary)" : "var(--color-fg-muted)" }}>
              {t === "audit" ? "Audit Trail" : "Policies"}
            </button>
          ))}
        </div>

        {tab === "policies" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Policy List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as PolicyCategory | "all")} className="px-2 py-1.5 rounded-lg text-xs flex-1" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}>
                  <option value="all">All Categories</option>
                  {(["data", "access", "compliance", "security", "operational"] as PolicyCategory[]).map((c) => (
                    <option key={c} value={c} style={{ textTransform: "capitalize" }}>{c}</option>
                  ))}
                </select>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs" style={{ backgroundColor: "#8b7ac820", border: "1px solid #8b7ac840", color: "#8b7ac8" }}>
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              {filtered.map((policy) => {
                const isSelected = selected === policy.id;
                const pendingSteps = policy.approvalChain.filter((s) => s.status === "pending").length;
                return (
                  <div
                    key={policy.id}
                    onClick={() => setSelected(isSelected ? null : policy.id)}
                    className="rounded-xl p-4 cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSelected ? "var(--color-bg-elevated)" : "var(--color-surface-base)",
                      border: `1px solid ${isSelected ? "#8b7ac8" : "var(--color-surface-border)"}`,
                      borderLeftWidth: "3px",
                      borderLeftColor: CATEGORY_COLORS[policy.category],
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: `color-mix(in srgb, ${CATEGORY_COLORS[policy.category]} 12%, transparent)`, color: CATEGORY_COLORS[policy.category] }}>{policy.category}</span>
                          <span className="text-[9px] font-mono" style={{ color: "var(--color-fg-muted)" }}>{policy.version}</span>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: "var(--color-fg-primary)" }}>{policy.title}</div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold capitalize shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[policy.status]} 12%, transparent)`, color: STATUS_COLORS[policy.status] }}>{policy.status.replace("-", " ")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--color-fg-muted)" }}>
                      <span>{policy.domains.join(", ")}</span>
                      {pendingSteps > 0 && (
                        <span className="ml-auto font-bold" style={{ color: "var(--color-medium)" }}>{pendingSteps} approval{pendingSteps > 1 ? "s" : ""} pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Policy Detail */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {selectedPolicy ? (
                <>
                  <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: `color-mix(in srgb, ${CATEGORY_COLORS[selectedPolicy.category]} 12%, transparent)`, color: CATEGORY_COLORS[selectedPolicy.category] }}>{selectedPolicy.category}</span>
                          <span className="text-[9px] font-mono" style={{ color: "var(--color-fg-muted)" }}>{selectedPolicy.version}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold capitalize" style={{ backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[selectedPolicy.status]} 12%, transparent)`, color: STATUS_COLORS[selectedPolicy.status] }}>{selectedPolicy.status.replace("-", " ")}</span>
                        </div>
                        <div className="text-lg font-bold" style={{ color: "var(--color-fg-primary)" }}>{selectedPolicy.title}</div>
                        <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>{selectedPolicy.description}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
                      {[
                        { label: "Owner", value: selectedPolicy.owner },
                        { label: "Effective", value: selectedPolicy.effectiveDate },
                        { label: "Enforcement", value: selectedPolicy.enforcement, color: selectedPolicy.enforcement === "auto" ? "var(--color-low)" : "var(--color-medium)" },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "var(--color-fg-muted)" }}>{label}</div>
                          <div className="text-xs font-semibold capitalize" style={{ color: color ?? "var(--color-fg-secondary)" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Approval Chain */}
                  <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
                    <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-fg-muted)" }}>Approval Chain</div>
                    <div className="flex flex-col gap-3">
                      {selectedPolicy.approvalChain.map((step, i) => {
                        const colors = { approved: "var(--color-low)", pending: "var(--color-medium)", rejected: "var(--color-critical)" };
                        const icons = { approved: CheckCircle2, pending: Clock, rejected: AlertTriangle };
                        const Icon = icons[step.status];
                        return (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${colors[step.status]} 15%, transparent)`, border: `2px solid ${colors[step.status]}` }}>
                                <Icon className="w-3 h-3" style={{ color: colors[step.status] }} />
                              </div>
                              {i < selectedPolicy.approvalChain.length - 1 && (
                                <div className="w-px flex-1 my-1" style={{ backgroundColor: "var(--color-surface-border)", minHeight: "16px" }} />
                              )}
                            </div>
                            <div className="flex-1 pb-3">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-semibold" style={{ color: "var(--color-fg-primary)" }}>{step.role}</span>
                                <span className="text-[10px]" style={{ color: "var(--color-fg-muted)" }}>— {step.approver}</span>
                                {step.date && <span className="text-[10px] ml-auto" style={{ color: "var(--color-fg-muted)" }}>{step.date}</span>}
                              </div>
                              {step.comment && <div className="text-xs italic" style={{ color: "var(--color-fg-muted)" }}>"{step.comment}"</div>}
                              {step.status === "pending" && selectedPolicy.approvalChain[i - 1]?.status === "approved" && (
                                <div className="flex gap-2 mt-2">
                                  <button className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: "var(--color-low)", color: "#fff" }}>Approve</button>
                                  <button className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)", color: "var(--color-critical)" }}>Reject</button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full py-20 rounded-xl" style={{ backgroundColor: "var(--color-surface-base)", border: "1px dashed var(--color-surface-border)" }}>
                  <div className="text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-fg-muted)", opacity: 0.3 }} />
                    <div className="text-sm" style={{ color: "var(--color-fg-muted)" }}>Select a policy to review</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "audit" && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)" }}>
            <div className="text-[10px] font-mono uppercase tracking-widest px-5 py-3" style={{ color: "var(--color-fg-muted)", borderBottom: "1px solid var(--color-surface-border)" }}>
              Full Audit Trail — {allAuditEvents.length} events
            </div>
            {allAuditEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--color-bg-elevated)]" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
                <span className="text-[10px] font-mono w-14 shrink-0" style={{ color: "var(--color-fg-muted)" }}>{event.date}</span>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#8b7ac820", border: "1px solid #8b7ac840" }}
                >
                  <User className="w-2.5 h-2.5" style={{ color: "#8b7ac8" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium" style={{ color: "var(--color-fg-primary)" }}>{event.action}</span>
                  <span className="text-xs mx-2" style={{ color: "var(--color-fg-muted)", opacity: 0.5 }}>·</span>
                  <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>{event.policy}</span>
                </div>
                <span className="text-xs shrink-0" style={{ color: "#8b7ac8" }}>{event.actor}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </OpsLayout>
  );
}
