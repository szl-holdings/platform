import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock, Users, Lock,
  BarChart3, Plus, Edit2, Trash2, Activity, FileText, Eye,
  ChevronDown, ChevronUp, Play, TrendingDown, Globe, Loader2
} from "lucide-react";

const RULE_TYPE_COLORS: Record<string, string> = {
  license: "#f59e0b",
  benchmark: "#60a5fa",
  cost: "#22c55e",
  security: "#f43f5e",
  residency: "#a78bfa",
};

const ACTION_CONFIG = {
  block: { label: "Block", className: "badge-error" },
  flag: { label: "Flag", className: "badge-warning" },
  "require-approval": { label: "Require Approval", className: "badge-staged" },
  restrict: { label: "Restrict", className: "badge-idle" },
};

const DECISION_CONFIG = {
  approved: { label: "Approved", icon: CheckCircle, color: "text-emerald-400" },
  blocked: { label: "Blocked", icon: XCircle, color: "text-red-400" },
  flagged: { label: "Flagged", icon: AlertTriangle, color: "text-amber-400" },
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  meta: "#a78bfa",
  alibaba: "#f43f5e",
  microsoft: "#22d3ee",
};

export function GovernanceEngine() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"compliance" | "policies" | "audit">("compliance");
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  const policiesQuery = useQuery({
    queryKey: ["inca-governance-policies"],
    queryFn: () => api.getGovernancePolicies(),
    staleTime: 30_000,
  });

  const auditQuery = useQuery({
    queryKey: ["inca-model-audit-log"],
    queryFn: () => api.getModelAuditLog(),
    staleTime: 30_000,
  });

  const complianceQuery = useQuery({
    queryKey: ["inca-compliance-status"],
    queryFn: () => api.getComplianceStatus(),
    staleTime: 30_000,
  });

  const togglePolicyMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.updateGovernancePolicy(id, { enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inca-governance-policies"] });
    },
  });

  const policies = policiesQuery.data?.data ?? [];
  const auditLog = auditQuery.data?.data ?? [];
  const compliance = complianceQuery.data?.data ?? [];

  const compliantCount = compliance.filter(c => c.overallCompliant).length;
  const nonCompliantCount = compliance.filter(c => !c.overallCompliant).length;
  const driftingCount = compliance.filter(c => c.drift).length;
  const enabledPolicies = policies.filter(p => p.enabled).length;

  const isLoading = policiesQuery.isLoading || auditQuery.isLoading || complianceQuery.isLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Governance Engine</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Enterprise AI governance: RBAC model deployment, server-enforced policy rules, full audit trails, and adaptive compliance monitoring. Policy decisions are evaluated server-side and written to an immutable audit log.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading governance data…</span>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Compliant Models</div>
              <div className="text-xl font-display font-bold text-emerald-400">{compliantCount}/{compliance.length}</div>
              <div className="text-xs text-muted-foreground">all policies passing</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Policy Violations</div>
              <div className={cn("text-xl font-display font-bold", nonCompliantCount > 0 ? "text-red-400" : "text-foreground")}>{nonCompliantCount}</div>
              <div className="text-xs text-muted-foreground">require remediation</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Drift Detected</div>
              <div className={cn("text-xl font-display font-bold", driftingCount > 0 ? "text-amber-400" : "text-foreground")}>{driftingCount}</div>
              <div className="text-xs text-muted-foreground">re-evaluation triggered</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Active Policies</div>
              <div className="text-xl font-display font-bold text-primary">{enabledPolicies}</div>
              <div className="text-xs text-muted-foreground">of {policies.length} configured</div>
            </div>
          </div>

          <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
            <button onClick={() => setTab("compliance")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "compliance" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <BarChart3 className="w-3.5 h-3.5" /> Compliance Dashboard
            </button>
            <button onClick={() => setTab("policies")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "policies" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Shield className="w-3.5 h-3.5" /> Policy Engine
            </button>
            <button onClick={() => setTab("audit")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "audit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <FileText className="w-3.5 h-3.5" /> Audit Trail
            </button>
          </div>

          {tab === "compliance" && (
            <div className="space-y-3">
              {compliance.map((c) => {
                const pColor = PROVIDER_COLORS[c.provider] || "#888";
                const checks = [
                  { label: "Security Policy", ok: c.securityPolicyMet },
                  { label: "License Gate", ok: c.licensePolicyMet },
                  { label: "Benchmark Min", ok: c.benchmarkPolicyMet },
                  { label: "Cost Cap", ok: c.costPolicyMet },
                  { label: "No Active Vulns", ok: c.noActiveHighVulnerabilities },
                ];
                return (
                  <div key={c.modelId} className={cn("inca-panel p-4", !c.overallCompliant && "border-red-500/20", c.drift && "border-amber-500/20")}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${pColor}18`, border: `1px solid ${pColor}30` }}>
                        <Shield className="w-4 h-4" style={{ color: pColor }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{c.model}</span>
                          <span className="text-xs text-muted-foreground capitalize">{c.provider}</span>
                          {c.overallCompliant ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              <CheckCircle className="w-3 h-3" /> Compliant
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                              <XCircle className="w-3 h-3" /> Non-Compliant
                            </span>
                          )}
                          {c.drift && (
                            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              <TrendingDown className="w-3 h-3" /> Drift Detected
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {checks.map(({ label, ok }) => (
                            <div key={label} className="flex items-center gap-1">
                              {ok ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                              <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Last reviewed: {c.lastReviewed}</span>
                        </div>
                      </div>
                      {!c.overallCompliant && (
                        <button className="flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg hover:bg-primary/15 transition-colors flex-shrink-0">
                          <Play className="w-3 h-3" /> Initiate Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {compliance.length === 0 && (
                <div className="inca-panel p-10 text-center text-muted-foreground text-sm">No compliance data available.</div>
              )}
            </div>
          )}

          {tab === "policies" && (
            <div className="space-y-3">
              <div className="flex justify-end mb-2">
                <button className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/15 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New Policy Rule
                </button>
              </div>
              {policies.map((policy) => {
                const ruleColor = RULE_TYPE_COLORS[policy.ruleType] || "#888";
                const actionCfg = ACTION_CONFIG[policy.action];
                const isToggling = togglePolicyMutation.isPending && togglePolicyMutation.variables?.id === policy.id;
                return (
                  <div key={policy.id} className={cn("inca-panel p-4", !policy.enabled && "opacity-60")}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${ruleColor}18`, border: `1px solid ${ruleColor}30` }}>
                        <Lock className="w-3.5 h-3.5" style={{ color: ruleColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{policy.name}</span>
                          <span className={cn("px-1.5 py-0.5 rounded text-xs capitalize", actionCfg.className)}>{actionCfg.label}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded border capitalize" style={{ background: `${ruleColor}15`, color: ruleColor, borderColor: `${ruleColor}35` }}>{policy.ruleType}</span>
                          {!policy.enabled && <span className="badge-idle px-1.5 py-0.5 rounded text-xs">disabled</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{policy.description}</div>
                        <div className="font-mono text-xs bg-secondary px-2 py-1.5 rounded text-foreground mb-2">{policy.condition}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Triggered {policy.triggeredCount}×</span>
                          {policy.lastTriggered && <span>Last: {policy.lastTriggered}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isToggling ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <button
                            onClick={() => togglePolicyMutation.mutate({ id: policy.id, enabled: !policy.enabled })}
                            className={cn("w-9 h-5 rounded-full transition-all relative", policy.enabled ? "bg-primary" : "bg-secondary border border-border")}
                          >
                            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", policy.enabled ? "left-4" : "left-0.5")} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "audit" && (
            <div className="space-y-2">
              {auditLog.map((evt) => {
                const decCfg = DECISION_CONFIG[evt.decision];
                const DecIcon = decCfg.icon;
                const isExpanded = expandedAudit === evt.id;
                return (
                  <div key={evt.id} className="inca-panel overflow-hidden">
                    <button
                      className="w-full p-4 text-left"
                      onClick={() => setExpandedAudit(isExpanded ? null : evt.id)}
                    >
                      <div className="flex items-center gap-3">
                        <DecIcon className={cn("w-4 h-4 flex-shrink-0", decCfg.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{evt.action}</span>
                            <span className="font-mono text-xs text-primary">{evt.model}</span>
                            <span className={cn("text-xs capitalize", decCfg.color)}>{decCfg.label}</span>
                            {evt.policyTriggered && (
                              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">policy triggered</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{evt.timestamp.replace("T", " ").slice(0, 16)}</span>
                            <span>{evt.actor}</span>
                            <span>Role: {evt.role}</span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2 animate-fade-in">
                        {evt.benchmarksPassed.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Benchmarks at Review</div>
                            <div className="flex flex-wrap gap-1.5">
                              {evt.benchmarksPassed.map(b => (
                                <span key={b} className="text-xs bg-secondary border border-border rounded px-1.5 py-0.5 font-mono text-foreground">{b}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {evt.policyTriggered && (
                          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                            Policy: {policies.find(p => p.id === evt.policyTriggered)?.name || evt.policyTriggered}
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Notes</div>
                          <div className="text-xs text-foreground bg-secondary rounded-lg px-3 py-2">{evt.notes}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {auditLog.length === 0 && (
                <div className="inca-panel p-10 text-center text-muted-foreground text-sm">No audit records found.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
