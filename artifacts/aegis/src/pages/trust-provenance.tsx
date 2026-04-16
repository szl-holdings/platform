import React, { useState } from "react";
import { DashboardShell, SidebarNav } from "@szl-holdings/shared-ui/design-system";
import { Shield, FileSearch, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { ProofPanel, PolicyResult, AdminAuditTrail, SimulationCockpit } from "@szl-holdings/shared-ui";
import type { ProofPanelData, PolicyDecisionRecord, AuditTrailEntry, SimulationScenario } from "@szl-holdings/shared-ui";

function getCsrfToken(): string {
  const match = typeof document !== "undefined"
    ? document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
    : null;
  return match ? decodeURIComponent(match[1] ?? "") : "";
}

async function ensureCsrfToken(): Promise<string> {
  const existing = getCsrfToken();
  if (existing) return existing;
  try {
    await fetch("/api/csrf-token", { credentials: "include" });
  } catch {
    return "";
  }
  return getCsrfToken();
}

async function postPolicyAppeal(body: Record<string, unknown>): Promise<void> {
  const token = await ensureCsrfToken();
  let res: Response;
  try {
    res = await fetch("/api/audit-log/policy-appeal", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "x-csrf-token": token } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("[policy-appeal] network error", err);
    if (typeof window !== "undefined") {
      window.alert("Could not reach the audit log. Please try again.");
    }
    return;
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.warn("[policy-appeal] request failed", res.status, detail);
    if (typeof window !== "undefined") {
      window.alert(`Submission failed (HTTP ${res.status}). Your appeal was not recorded.`);
    }
  }
}

const ACCENT = LANE_ACCENT_HEX.aegis.primary;

const DEMO_PROOFS: ProofPanelData[] = [
  {
    proofId: 1001,
    contentId: "threat-summary-v4",
    contentType: "threat_assessment",
    sourceClass: "llm_generated",
    confidenceScore: 0.87,
    modelId: "gpt-4o",
    modelProvider: "OpenAI",
    modelVersion: "2024-11",
    modelLane: "threat-intelligence",
    reviewState: "approved",
    exportSafetyState: "safe",
    reviewedBy: "Sarah K. — SOC Lead",
    reviewedAt: new Date(Date.now() - 3600000).toISOString(),
    reviewNote: "Verified against MITRE ATT&CK framework. Recommend immediate action.",
    generatedAt: new Date(Date.now() - 7200000).toISOString(),
    serviceAttribution: "CORTEX-Sentinel v2.1",
    actorAttribution: "Autonomous Threat Engine",
    inputSources: [
      { type: "threat_feed", id: "feed-001", label: "CISA Advisory AA24-193A" },
      { type: "internal_log", id: "siem-4421", label: "SIEM Event Cluster #4421" },
      { type: "osint", id: "osint-9982", label: "Shodan Scan Results" },
    ],
    lineage: [
      { label: "Raw SIEM logs ingested", sourceClass: "sensor_data", at: new Date(Date.now() - 10800000).toISOString() },
      { label: "Pattern correlation run", sourceClass: "system_computed", at: new Date(Date.now() - 9000000).toISOString() },
      { label: "Threat narrative generated", sourceClass: "llm_generated", at: new Date(Date.now() - 7200000).toISOString() },
    ],
  },
  {
    proofId: 1002,
    contentId: "incident-report-ir-2026-044",
    contentType: "incident_report",
    sourceClass: "hybrid",
    confidenceScore: 0.72,
    modelId: "claude-3-5-sonnet",
    modelProvider: "Anthropic",
    modelLane: "incident-response",
    reviewState: "unreviewed",
    exportSafetyState: "pending_review",
    generatedAt: new Date(Date.now() - 1800000).toISOString(),
    serviceAttribution: "CORTEX-IR v1.8",
    inputSources: [
      { type: "incident_ticket", id: "ir-044", label: "Incident IR-2026-044" },
      { type: "forensic_log", id: "forlog-221", label: "Endpoint Forensic Data" },
    ],
    contradictionMarkers: [
      "Timeline inconsistency between endpoint log and SIEM — delta 4 min",
      "Threat actor TTPs partially overlap with known APT29 but attribution uncertain",
    ],
  },
  {
    proofId: 1003,
    contentId: "vuln-assessment-2026-q2",
    contentType: "vulnerability_assessment",
    sourceClass: "system_computed",
    confidenceScore: 0.95,
    reviewState: "approved",
    exportSafetyState: "safe",
    reviewedBy: "James M. — CISO",
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
    generatedAt: new Date(Date.now() - 172800000).toISOString(),
    serviceAttribution: "AVM Engine v3",
    inputSources: [
      { type: "scan_result", id: "scan-q2-01", label: "Nessus Q2 Scan" },
      { type: "cve_database", id: "nvd-2026", label: "NVD CVE Database" },
    ],
  },
];

const DEMO_POLICY_DECISIONS: PolicyDecisionRecord[] = [
  {
    requestId: "cov-req-001",
    effect: "escalate",
    allowed: false,
    policyName: "Security Incident Response",
    reason: "Critical incident response requires CISO approval before external notification",
    matchedPolicies: ["security_incident_response", "external_communication_review"],
    subject: { userId: "user-sarah-k", roles: ["analyst", "soc_lead"] },
    resource: { type: "incident_notification", domain: "aegis", actionClass: "external_communication" },
    action: "send_external_notification",
    escalationPath: [
      "SOC Lead (initiator)",
      "Security Manager — review within 1 hour",
      "CISO — final approval for external communications",
    ],
    approvalHistory: [
      { approver: "Sarah K. — SOC Lead", decision: "approved", at: new Date(Date.now() - 900000).toISOString(), note: "Escalating per IR policy" },
      { approver: "Michael T. — Security Manager", decision: "pending", at: new Date(Date.now() - 300000).toISOString() },
    ],
    whatNeedsToChange: [
      "CISO role must approve external communications for critical incidents",
      "Notification draft must be reviewed for PII/sensitive data",
      "Legal review required if incident involves potential regulatory breach",
    ],
    evaluatedAt: Date.now() - 1200000,
    durationMs: 3,
  },
  {
    requestId: "cov-req-002",
    effect: "deny",
    allowed: false,
    policyName: "Audit Log Immutability Guard",
    reason: "Audit log modification is permanently prohibited — append-only enforcement",
    matchedPolicies: ["audit_immutability_policy"],
    deniedBy: "covenant:audit-immutability-guard",
    subject: { userId: "user-ops-001", roles: ["operator"] },
    resource: { type: "audit_log", domain: "aegis" },
    action: "modify_audit_log",
    whatNeedsToChange: [
      "This action is permanently blocked regardless of role",
      "Audit logs are immutable by design — no exception path exists",
      "If correction is needed, create an amendment record instead",
    ],
    evaluatedAt: Date.now() - 5400000,
    durationMs: 1,
  },
];

const DEMO_AUDIT_ENTRIES: AuditTrailEntry[] = [
  {
    id: "aud-001", timestamp: Date.now() - 300000, actionType: "ai_decision", actor: "CORTEX-Sentinel",
    actorType: "ai_model", domain: "Aegis", action: "Threat assessment generated for APT-class activity",
    entityType: "threat", confidence: 0.87, modelUsed: "gpt-4o", proofId: 1001,
    outcome: "High-severity alert raised · Human review queued", riskLevel: "high",
    immutableHash: "a3f9d2c7e1b84fa6",
  },
  {
    id: "aud-002", timestamp: Date.now() - 900000, actionType: "human_approval", actor: "Sarah K.",
    actorType: "human", domain: "Aegis", action: "Approved threat assessment and escalated to incident response",
    entityType: "threat", approvedBy: "Sarah K. — SOC Lead", outcome: "IR-2026-044 opened",
    riskLevel: "high", immutableHash: "b7e4f1a9c3d25e08", chainLink: "aud-001",
  },
  {
    id: "aud-003", timestamp: Date.now() - 1800000, actionType: "policy_evaluation", actor: "Covenant Engine",
    actorType: "system", domain: "Aegis", action: "External notification policy evaluated — ESCALATE",
    policyId: "security_incident_response", outcome: "Escalation to Security Manager initiated",
    riskLevel: "medium", immutableHash: "c2a8f3b1d74e96f0",
  },
  {
    id: "aud-004", timestamp: Date.now() - 3600000, actionType: "agent_action", actor: "CORTEX-Graph",
    actorType: "agent", domain: "Multi-Domain", action: "Cross-domain correlation: Aegis threat linked to Vessels AIS anomaly",
    confidence: 0.74, outcome: "Correlation published to PRISM Bus", riskLevel: "high",
    immutableHash: "d5c1e9a2f3b74806",
  },
  {
    id: "aud-005", timestamp: Date.now() - 7200000, actionType: "human_denial", actor: "James M.",
    actorType: "human", domain: "Aegis", action: "Denied automated IP blocking rule — insufficient evidence",
    overrideReason: "Correlation score below threshold for automated action. Requires manual investigation first.",
    outcome: "Agent action blocked · Manual review assigned", riskLevel: "medium",
    immutableHash: "e8b6d0c4f2a31975",
  },
  {
    id: "aud-006", timestamp: Date.now() - 10800000, actionType: "proof_review", actor: "Sarah K.",
    actorType: "human", domain: "Aegis", action: "Proof chain reviewed and approved for Q2 vulnerability assessment",
    proofId: 1003, outcome: "Export safety state updated to 'safe'", riskLevel: "low",
    immutableHash: "f1a7c3e5b9d04268",
  },
  {
    id: "aud-007", timestamp: Date.now() - 14400000, actionType: "export", actor: "Michael T.",
    actorType: "human", domain: "Aegis", action: "Vulnerability assessment exported to board risk report",
    entityType: "document", proofId: 1003, outcome: "Export completed · 3 recipients", riskLevel: "low",
    immutableHash: "a9e2b5f8c0d31674",
  },
  {
    id: "aud-008", timestamp: Date.now() - 86400000, actionType: "config_change", actor: "System",
    actorType: "system", domain: "Aegis", action: "Threat intelligence feed rotation — CISA feeds updated",
    outcome: "4 feeds rotated · Coverage gap: none", riskLevel: "info",
    immutableHash: "b3f0a7d4c8e91502",
  },
];

const DEMO_SCENARIOS: SimulationScenario[] = [
  {
    id: "contain-fast",
    label: "Rapid Contain",
    description: "Immediate isolation and remediation",
    probability: 0.4,
    tag: "preferred",
    primaryMetric: { best: 2, base: 4, worst: 8, unit: "days", format: "days" },
    metrics: {
      exposure_cost: { label: "Exposure Cost", best: 85000, base: 150000, worst: 380000, format: "currency", unit: "$" },
      affected_systems: { label: "Affected Systems", best: 3, base: 7, worst: 18, format: "number" },
    },
    sensitivityDrivers: [
      { id: "isolation_speed", label: "Isolation Speed", impact: -0.52, direction: "positive" },
      { id: "lateral_movement", label: "Lateral Movement Risk", impact: 0.41, direction: "negative" },
      { id: "patch_coverage", label: "Patch Coverage", impact: -0.28, direction: "positive" },
    ],
    costOfWaiting: { perDay: 38000, perWeek: 210000, description: "Each day of delay increases blast radius and recovery cost" },
    recommendation: "Initiate containment protocol immediately. Isolate affected segments before threat actor achieves persistence.",
    recommendationStrength: "strong",
  },
  {
    id: "monitor-assess",
    label: "Monitor & Assess",
    description: "Observe before acting to gather intelligence",
    probability: 0.35,
    tag: "low-risk",
    primaryMetric: { best: 5, base: 9, worst: 21, unit: "days", format: "days" },
    metrics: {
      exposure_cost: { label: "Exposure Cost", best: 150000, base: 320000, worst: 850000, format: "currency", unit: "$" },
      affected_systems: { label: "Affected Systems", best: 6, base: 14, worst: 35, format: "number" },
    },
    sensitivityDrivers: [
      { id: "threat_actor_speed", label: "Threat Actor Speed", impact: 0.65, direction: "negative" },
      { id: "intelligence_gain", label: "Intelligence Gained", impact: -0.18, direction: "positive" },
    ],
    costOfWaiting: { perDay: 52000, description: "Higher daily cost vs rapid contain due to ongoing exposure window" },
    recommendation: "Only viable if threat actor is early-stage and intelligence value outweighs exposure risk.",
    recommendationStrength: "weak",
  },
  {
    id: "baseline",
    label: "No Action",
    description: "Current state baseline for comparison",
    probability: 0.25,
    tag: "baseline",
    primaryMetric: { best: 14, base: 30, worst: 90, unit: "days", format: "days" },
    metrics: {
      exposure_cost: { label: "Exposure Cost", best: 400000, base: 1200000, worst: 4500000, format: "currency", unit: "$" },
      affected_systems: { label: "Affected Systems", best: 20, base: 55, worst: 140, format: "number" },
    },
    costOfWaiting: { perDay: 40000, perWeek: 280000 },
    recommendation: "Not recommended. Without action, threat actor likely achieves full persistence.",
    recommendationStrength: "strong",
  },
];

type ActiveView = "proofs" | "policy" | "audit" | "simulation";

export default function TrustProvenancePage() {
  const [activeView, setActiveView] = useState<ActiveView>("proofs");
  const [expandedProofId, setExpandedProofId] = useState<number | string | null>(null);

  const tabs: Array<{ id: ActiveView; label: string; icon: React.ReactNode }> = [
    { id: "proofs", label: "Proof Chains", icon: <FileSearch className="w-3.5 h-3.5" /> },
    { id: "policy", label: "Policy Results", icon: <Shield className="w-3.5 h-3.5" /> },
    { id: "audit", label: "Audit Trail", icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "simulation", label: "Decision Cockpit", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-orange-50">Trust & Provenance Center</h1>
          <p className="text-xs text-orange-400/50">Proof chain visibility · Policy governance · Decision audit · Simulation cockpit</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Proof Records", value: 1_847, icon: FileSearch, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Policies Active", value: 24, icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Pending Reviews", value: 3, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Audit Events Today", value: 312, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#09080f]/80 border border-orange-500/10 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-orange-50">{value.toLocaleString()}</div>
              <div className="text-[10px] text-orange-400/50">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-[#09080f]/60 border border-orange-500/10 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeView === tab.id
                ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
                : "text-orange-400/50 hover:text-orange-400/80"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Proof Chains View */}
      {activeView === "proofs" && (
        <div className="space-y-4">
          <div className="text-xs text-orange-400/50 px-1">
            {DEMO_PROOFS.length} proof records · Showing AI-generated content provenance, review states, and export safety indicators
          </div>
          {DEMO_PROOFS.map(proof => (
            <div key={proof.proofId}>
              <div
                className="cursor-pointer"
                onClick={() => setExpandedProofId(prev => prev === proof.proofId ? null : (proof.proofId ?? null))}
              >
                <ProofPanel
                  proof={proof}
                  variant={expandedProofId === proof.proofId ? "drawer" : "inline"}
                  accentColor={ACCENT}
                  showActions
                  onReview={(state) => {
                    console.log("Review state:", state, "for proof:", proof.proofId);
                  }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-orange-400/40 pt-2">
            <span>📌</span>
            <span>Proof panels can be embedded inline in any AI output panel. Click a proof to expand or collapse details.</span>
          </div>
        </div>
      )}

      {/* Policy Results View */}
      {activeView === "policy" && (
        <div className="space-y-4">
          <div className="text-xs text-orange-400/50 px-1">
            Recent policy evaluations — approval history, denial reasons, escalation paths, and remediation guidance
          </div>
          {DEMO_POLICY_DECISIONS.map((decision, i) => (
            <PolicyResult
              key={i}
              decision={decision}
              accentColor={ACCENT}
              showDetails
              onEscalate={() => {
                void postPolicyAppeal({
                  requestId: decision.requestId,
                  action: "escalate",
                });
              }}
              onAppeal={(reason) => {
                void postPolicyAppeal({
                  requestId: decision.requestId,
                  action: "appeal",
                  justification: reason,
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Audit Trail View */}
      {activeView === "audit" && (
        <AdminAuditTrail
          entries={DEMO_AUDIT_ENTRIES}
          title="Aegis Decision Audit Trail"
          accentColor={ACCENT}
          showFilters
          domainLabel="Security Operations"
        />
      )}

      {/* Simulation Cockpit View */}
      {activeView === "simulation" && (
        <div className="space-y-4">
          <div className="text-xs text-orange-400/50 px-1">
            Incident response scenario analysis — Monte Carlo simulation with best/base/worst ranges and sensitivity drivers
          </div>
          <SimulationCockpit
            title="Incident Response Decision Cockpit"
            description="APT-class threat — IR-2026-044 · Simulation based on 10,000 Monte Carlo iterations"
            scenarios={DEMO_SCENARIOS}
            primaryMetricLabel="Time to Containment"
            iterationsRun={10000}
            confidenceLevel={0.95}
            lastRunAt="2 hours ago"
            accentColor={ACCENT}
            predictedVsActual={[
              { label: "IR-2026-038 — Ransomware containment", predicted: 6, actual: 5, format: "days", unit: "days", at: "March 2026", delta: -1 },
              { label: "IR-2026-021 — Supply chain compromise", predicted: 12, actual: 18, format: "days", unit: "days", at: "January 2026", delta: 6 },
            ]}
          />
        </div>
      )}
    </div>
  );
}
