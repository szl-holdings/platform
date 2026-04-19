/**
 * Decision Seed Data
 *
 * Seeds 12 realistic decision cards across 3 domain packs (Lyte, Aegis, Vessels)
 * with evidence, validation results, run traces, and audit events.
 * Runs at boot if the decisions_runtime table is empty for the demo workspace.
 */

import { db } from "@szl-holdings/db";
import {
  decisionsRuntimeTable,
  decisionEvidenceTable,
  decisionValidationsTable,
  decisionRunsTable,
  decisionAuditEventsTable,
  workspaceConstitutionsTable,
} from "@szl-holdings/db";
import { eq, count } from "drizzle-orm";
import { logger } from "../lib/logger";
import { runAdversarialValidation } from "./decision-adversarial-validation";
import { evaluateDecisionPolicy } from "./decision-policy-engine";
import type { EvidenceItem } from "./decision-adversarial-validation";
import type { DecisionInput } from "./decision-policy-engine";

const DEMO_WORKSPACE = "ws-demo-001";

// ─── Seed Constitution ────────────────────────────────────────────────────────

async function ensureConstitution() {
  const rows = await db
    .select({ c: count() })
    .from(workspaceConstitutionsTable)
    .where(eq(workspaceConstitutionsTable.workspaceId, DEMO_WORKSPACE));

  if (Number(rows[0]?.c) > 0) return;

  await db.insert(workspaceConstitutionsTable).values({
    workspaceId: DEMO_WORKSPACE,
    version: "1.2",
    name: "SZL Demo Workspace Constitution",
    isActive: true,
    requiredApprovals: {
      "execute-with-approval": { roles: ["operator", "admin", "owner"], sla_minutes: 60 },
      "auto-execute": { roles: [], sla_minutes: 0 },
    },
    actionRedlines: [
      "notify_external_party",
      "delete_record",
      "submit_regulatory_filing",
      "send_external_communication",
    ],
    autonomyCeilings: {
      critical: "execute-with-approval",
      high: "execute-with-approval",
      medium: "recommend",
      low: "auto-execute",
    },
    confidenceFloor: 0.70,
    freshnessMaxHours: 48,
  });

  logger.info("Seeded demo workspace constitution");
}

// ─── Card definitions ─────────────────────────────────────────────────────────

interface SeedCard {
  cardId: string;
  domain: "lyte" | "aegis" | "vessels" | "terra" | "counsel" | "carlota" | "cross_domain";
  title: string;
  summary: string;
  severity: "critical" | "high" | "medium" | "low";
  autonomyMode: "observe" | "recommend" | "draft" | "execute-with-approval" | "auto-execute";
  status: "ready-for-review" | "approved" | "rejected" | "changes-requested" | "validation-pending";
  confidence: number;
  entityScope: string[];
  recommendedAction: string;
  reasoning: string;
  owner: string;
  priority: number;
  evidence: Array<{
    label: string;
    value: string;
    source: string;
    excerpt?: string;
    sourceType: "signal" | "database" | "document" | "api" | "human" | "model";
    freshness: "live" | "recent" | "stale" | "expired";
    confidence: number;
  }>;
  runSteps: Array<{
    stepType: "model-call" | "tool-call" | "handoff";
    name: string;
    latencyMs: number;
    inputTokens?: number;
    outputTokens?: number;
    costUsd?: number;
    model?: string;
    tool?: string;
    status: "completed" | "failed";
    outputSummary?: string;
  }>;
}

const SEED_CARDS: SeedCard[] = [
  // ─── LYTE DOMAIN (4 cards) ────────────────────────────────────────────────
  {
    cardId: "card-lyte-001",
    domain: "lyte",
    title: "Vantex Acquisition Approval Chain Failure — Executive Override Required",
    summary: "The $4.2M Vantex acquisition has been stalled for 47 days due to a departed VP with no recorded handoff. Three automated escalation attempts were blocked by policy. Immediate executive override is required to unblock the approval chain.",
    severity: "critical",
    autonomyMode: "execute-with-approval",
    status: "ready-for-review",
    confidence: 0.91,
    entityScope: ["Vantex Corp", "Q2 Pipeline", "VP Sales (departed)"],
    recommendedAction: "Escalate approval authority to CFO — issue emergency override memo and reassign approval chain",
    reasoning: "The approval chain stall is attributable to a single point of failure: a departed VP whose approval is required under the existing workflow configuration. The 47-day stall has elevated financial exposure to $4.2M. Three escalation attempts have failed because the policy requires VP-level sign-off that no longer exists. The only path to unblocking is an executive override that reassigns approval authority to an active executive (CFO or equivalent). This is classified as reversible because the override can be revoked and the approval chain re-routed if circumstances change.",
    owner: "CFO Office",
    priority: 99,
    evidence: [
      { label: "Approval chain stall duration", value: "47 days since last activity", source: "Lyte Workflow Monitor", sourceType: "signal", freshness: "live", confidence: 0.98 },
      { label: "Financial exposure", value: "$4.2M ARR at risk — Vantex acquisition deal value", source: "CRM Pipeline DB", sourceType: "database", freshness: "live", confidence: 0.95 },
      { label: "Failed escalation attempts", value: "3 automated escalation attempts blocked — policy requires VP-level approval", source: "Alloy Escalation Log", sourceType: "signal", freshness: "live", confidence: 0.99 },
      { label: "Departed approver status", value: "VP Sales (Marcus Reed) terminated 2026-03-01 — no handoff recorded", source: "HRIS Integration", sourceType: "database", freshness: "recent", confidence: 0.97 },
      { label: "Deal stage", value: "Legal review complete — blocked on VP Sales approval for 47 days", source: "CRM Deal Stage", sourceType: "database", freshness: "live", confidence: 0.93 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "fetch_approval_chain_status", tool: "workflow-inspector", latencyMs: 120, status: "completed", outputSummary: "Chain stalled at VP Sales node for 47 days" },
      { stepType: "tool-call", name: "lookup_approver_hris", tool: "hris-connector", latencyMs: 340, status: "completed", outputSummary: "Marcus Reed: terminated 2026-03-01, no handoff recorded" },
      { stepType: "model-call", name: "risk_assessment", model: "gpt-4o", latencyMs: 1840, inputTokens: 2340, outputTokens: 680, costUsd: 0.0212, status: "completed", outputSummary: "Critical risk: 47-day stall with $4.2M exposure, no active approver" },
      { stepType: "model-call", name: "action_recommendation", model: "claude-3-5-sonnet", latencyMs: 2100, inputTokens: 1890, outputTokens: 420, costUsd: 0.0189, status: "completed", outputSummary: "Executive override is the only viable path given policy constraints" },
      { stepType: "tool-call", name: "policy_evaluate", tool: "policy-engine", latencyMs: 89, status: "completed", outputSummary: "require-approval: executive-level sign-off required" },
    ],
  },
  {
    cardId: "card-lyte-002",
    domain: "lyte",
    title: "RevOps Approval Latency — 8 Deals Frozen Beyond 14-Day SLA",
    summary: "Eight active deals have exceeded the 14-day approval SLA threshold with no owner action. Combined pipeline value at risk is $1.8M. Pattern analysis indicates systemic approval bottleneck in the RevOps workflow.",
    severity: "high",
    autonomyMode: "recommend",
    status: "ready-for-review",
    confidence: 0.85,
    entityScope: ["Q2 Pipeline", "RevOps Team", "8 Active Deals"],
    recommendedAction: "Dispatch automated SLA breach notifications to deal owners and their direct managers — flag in weekly ops review",
    reasoning: "The 14-day SLA was established as the operational standard for approval chain velocity. Eight deals have now exceeded this threshold, suggesting a systemic issue rather than isolated approver delay. The root cause appears to be a combination of unclear ownership and insufficient escalation triggers. The recommended action (SLA breach notifications) is within recommend autonomy mode — it surfaces the problem without executing consequential actions.",
    owner: "RevOps Lead",
    priority: 78,
    evidence: [
      { label: "SLA breach count", value: "8 deals exceeded 14-day approval SLA", source: "Lyte SLA Monitor", sourceType: "signal", freshness: "live", confidence: 0.94 },
      { label: "Combined deal value at risk", value: "$1.8M pipeline revenue at risk from approval delays", source: "CRM Pipeline", sourceType: "database", freshness: "recent", confidence: 0.88 },
      { label: "Approval velocity trend", value: "Avg approval time: 18.4 days vs. 11.2 days 30 days ago (+64%)", source: "Lyte Analytics", sourceType: "signal", freshness: "recent", confidence: 0.86 },
      { label: "Owner notification status", value: "No owner-initiated actions logged in past 7 days for any of the 8 deals", source: "Workflow Activity Log", sourceType: "database", freshness: "live", confidence: 0.91 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "scan_sla_breaches", tool: "sla-monitor", latencyMs: 230, status: "completed", outputSummary: "8 deals above 14-day threshold" },
      { stepType: "model-call", name: "pattern_analysis", model: "gpt-4o-mini", latencyMs: 890, inputTokens: 1240, outputTokens: 310, costUsd: 0.0034, status: "completed", outputSummary: "Systemic bottleneck pattern identified — not isolated approver delays" },
      { stepType: "tool-call", name: "policy_evaluate", tool: "policy-engine", latencyMs: 78, status: "completed", outputSummary: "allow: notification action within recommend mode bounds" },
    ],
  },
  {
    cardId: "card-lyte-003",
    domain: "lyte",
    title: "Budget Leakage Detected — Vendor Spend Exceeding Approved Limits",
    summary: "Lyte signal fusion has detected $340K in vendor spend that exceeds approved budget limits across 6 vendors. No corresponding budget amendment requests have been filed. Policy requires approval before spend threshold is exceeded.",
    severity: "high",
    autonomyMode: "recommend",
    status: "approved",
    confidence: 0.88,
    entityScope: ["Finance Team", "6 Vendors", "Q2 Budget"],
    recommendedAction: "Flag vendors for immediate budget review — generate amendment request drafts for CFO approval",
    reasoning: "Budget overruns of this magnitude without corresponding amendment requests represent a policy control failure. The affected vendors span 3 departments. The recommended action generates draft amendment requests (draft mode) rather than any financial action — preserving the human decision on whether to approve, reject, or reclassify the spend.",
    owner: "Finance Controller",
    priority: 72,
    evidence: [
      { label: "Budget overrun amount", value: "$340K spend above approved limits across 6 vendors", source: "ERP Financial System", sourceType: "database", freshness: "recent", confidence: 0.92 },
      { label: "Amendment requests filed", value: "0 amendment requests filed for any of the 6 vendors", source: "Budget Management System", sourceType: "database", freshness: "live", confidence: 0.97 },
      { label: "Vendor categories", value: "Software licenses (2), professional services (3), cloud infrastructure (1)", source: "Vendor Registry", sourceType: "database", freshness: "recent", confidence: 0.89 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "pull_vendor_spend", tool: "erp-connector", latencyMs: 450, status: "completed", outputSummary: "6 vendors over budget, $340K aggregate overrun" },
      { stepType: "model-call", name: "spend_classification", model: "gpt-4o-mini", latencyMs: 670, inputTokens: 980, outputTokens: 240, costUsd: 0.0021, status: "completed", outputSummary: "All overruns appear to be legitimate spend without proper approval process" },
    ],
  },
  {
    cardId: "card-lyte-004",
    domain: "lyte",
    title: "Workflow Health Decline — 38% of Tracked Workflows Have Active Bottlenecks",
    summary: "Platform-wide workflow health has declined 11 percentage points in 30 days to 62%. Root cause analysis identifies three systemic bottlenecks: approval chain gaps, missing owner assignments, and incomplete SLA configurations.",
    severity: "medium",
    autonomyMode: "recommend",
    status: "changes-requested",
    confidence: 0.79,
    entityScope: ["Operations Team", "All Active Workflows"],
    recommendedAction: "Schedule workflow health review with operations leads — prioritize top 5 bottleneck workflows for owner assignment",
    reasoning: "The 11pp decline in workflow health over 30 days is statistically significant and indicates a compounding systemic problem rather than random variance. The three root causes identified are all solvable with process changes rather than architectural changes. Recommending a targeted review session rather than an automated fix because owner assignment is a human decision.",
    owner: "Operations Lead",
    priority: 55,
    evidence: [
      { label: "Workflow health score", value: "62% — down 11pp from 73% 30 days ago", source: "Lyte Workflow Analytics", sourceType: "signal", freshness: "live", confidence: 0.91 },
      { label: "Bottleneck categories", value: "Approval gaps (18 workflows), missing owners (12 workflows), incomplete SLA configs (8 workflows)", source: "Workflow Health Monitor", sourceType: "signal", freshness: "live", confidence: 0.85 },
      { label: "Trend direction", value: "7-day trailing average still declining: -1.2pp per week", source: "Lyte Trend Engine", sourceType: "model", freshness: "recent", confidence: 0.76 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "workflow_health_scan", tool: "workflow-inspector", latencyMs: 380, status: "completed", outputSummary: "38% of workflows have active bottlenecks" },
      { stepType: "model-call", name: "root_cause_analysis", model: "claude-3-5-sonnet", latencyMs: 2340, inputTokens: 3120, outputTokens: 780, costUsd: 0.0248, status: "completed", outputSummary: "Three systemic bottleneck categories identified" },
    ],
  },

  // ─── AEGIS DOMAIN (4 cards) ────────────────────────────────────────────────
  {
    cardId: "card-aegis-001",
    domain: "aegis",
    title: "Critical CVE Exploit Detected — Active Exploitation in Production Environment",
    summary: "CVE-2026-1234 (CVSS 9.8) has been detected in active exploitation across 3 production hosts. The vulnerability allows unauthenticated remote code execution. CISA KEV listing confirmed. Immediate containment required.",
    severity: "critical",
    autonomyMode: "execute-with-approval",
    status: "ready-for-review",
    confidence: 0.94,
    entityScope: ["Production Environment", "3 Hosts", "CVE-2026-1234"],
    recommendedAction: "Isolate affected hosts from network — deploy emergency patch to unaffected systems — initiate incident response playbook IR-CRIT-001",
    reasoning: "CVE-2026-1234 carries a CVSS score of 9.8 with confirmed active exploitation. CISA KEV listing indicates this is being actively exploited in the wild. Three production hosts show indicators of compromise. Network isolation is the standard first containment step per IR-CRIT-001. Patch deployment to unaffected systems is pre-approved under emergency patch protocol EPP-001. Both actions are reversible — isolation can be lifted and patches can be rolled back.",
    owner: "SOC Lead",
    priority: 100,
    evidence: [
      { label: "CVE severity", value: "CVE-2026-1234 — CVSS 9.8 Critical — Unauthenticated RCE via HTTP header injection", source: "NVD Feed", sourceType: "api", freshness: "live", confidence: 0.99 },
      { label: "CISA KEV status", value: "Listed in CISA Known Exploited Vulnerabilities catalog — active exploitation confirmed", source: "CISA KEV API", sourceType: "api", freshness: "live", confidence: 0.99 },
      { label: "Affected hosts", value: "3 production hosts: web-prod-01, web-prod-02, api-gateway-01 — IOC pattern matched", source: "Aegis Threat Detector", sourceType: "signal", freshness: "live", confidence: 0.91 },
      { label: "MITRE ATT&CK mapping", value: "T1190 (Exploit Public-Facing Application) + T1059 (Command and Scripting Interpreter)", source: "Aegis MITRE Mapper", sourceType: "signal", freshness: "live", confidence: 0.87 },
      { label: "Patch availability", value: "Vendor patch available as of 2026-04-17 — tested in staging, passed QA", source: "Patch Management System", sourceType: "database", freshness: "recent", confidence: 0.95 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "nvd_cve_lookup", tool: "cve-scanner", latencyMs: 340, status: "completed", outputSummary: "CVE-2026-1234: CVSS 9.8, unauthenticated RCE" },
      { stepType: "tool-call", name: "cisa_kev_check", tool: "cisa-connector", latencyMs: 210, status: "completed", outputSummary: "Confirmed in KEV catalog — active exploitation" },
      { stepType: "tool-call", name: "ioc_scan_production", tool: "threat-detector", latencyMs: 1240, status: "completed", outputSummary: "3 hosts: IOC pattern matched on web-prod-01, web-prod-02, api-gateway-01" },
      { stepType: "model-call", name: "incident_classification", model: "gpt-4o", latencyMs: 1890, inputTokens: 2100, outputTokens: 560, costUsd: 0.0198, status: "completed", outputSummary: "Severity: CRITICAL. IR-CRIT-001 applicable. Immediate containment required." },
      { stepType: "tool-call", name: "policy_evaluate", tool: "policy-engine", latencyMs: 92, status: "completed", outputSummary: "require-approval: critical severity, containment action requires SOC Lead sign-off" },
    ],
  },
  {
    cardId: "card-aegis-002",
    domain: "aegis",
    title: "Anomalous Authentication Pattern — Credential Stuffing Attack in Progress",
    summary: "Aegis detection engine has identified a coordinated credential stuffing attack against the customer portal. 4,200 failed login attempts in 15 minutes from 89 distinct IPs. Success rate: 0.3% (12 accounts potentially compromised).",
    severity: "high",
    autonomyMode: "execute-with-approval",
    status: "ready-for-review",
    confidence: 0.89,
    entityScope: ["Customer Portal", "12 Potentially Compromised Accounts", "89 Attack IPs"],
    recommendedAction: "Enable rate limiting at WAF for affected IP ranges — force password reset on the 12 flagged accounts — trigger MFA enrollment prompt for all active sessions",
    reasoning: "The pattern matches a known credential stuffing signature: high-volume rapid-fire authentication attempts from geographically dispersed IPs using known-breached credential pairs. The 0.3% success rate is consistent with stuffing attacks on large datasets. Immediate WAF intervention stops ongoing compromise attempts. Password resets on 12 flagged accounts close the known breach window.",
    owner: "Identity Security Lead",
    priority: 88,
    evidence: [
      { label: "Login attempt volume", value: "4,200 failed logins in 15 minutes — 280x above normal rate", source: "Auth Service Telemetry", sourceType: "signal", freshness: "live", confidence: 0.98 },
      { label: "IP diversity", value: "89 distinct source IPs across 23 countries — consistent with botnet distribution", source: "WAF Access Logs", sourceType: "signal", freshness: "live", confidence: 0.94 },
      { label: "Compromised accounts", value: "12 accounts show successful authentication followed by anomalous session behavior", source: "Aegis Session Analyzer", sourceType: "signal", freshness: "live", confidence: 0.83 },
      { label: "Credential pair match", value: "Credential pairs match known breach dataset (HaveIBeenPwned API — 4 matched sets)", source: "HIBP Integration", sourceType: "api", freshness: "live", confidence: 0.79 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "auth_anomaly_detect", tool: "auth-monitor", latencyMs: 180, status: "completed", outputSummary: "Credential stuffing pattern: 4,200 attempts/15min, 89 IPs" },
      { stepType: "tool-call", name: "hibp_credential_check", tool: "hibp-connector", latencyMs: 620, status: "completed", outputSummary: "4 breached credential pairs confirmed" },
      { stepType: "model-call", name: "attack_classification", model: "gpt-4o", latencyMs: 1340, inputTokens: 1780, outputTokens: 480, costUsd: 0.0156, status: "completed", outputSummary: "High confidence credential stuffing — WAF + account remediation recommended" },
    ],
  },
  {
    cardId: "card-aegis-003",
    domain: "aegis",
    title: "SOC 2 Type II Control Gap — Logging Deficiency in 3 Critical Systems",
    summary: "Pre-audit scan has identified insufficient audit logging in 3 systems required for SOC 2 Type II compliance: payment processor integration, admin access panel, and data export service. Audit engagement begins in 60 days.",
    severity: "high",
    autonomyMode: "recommend",
    status: "ready-for-review",
    confidence: 0.86,
    entityScope: ["SOC 2 Audit Program", "3 Systems", "Compliance Team"],
    recommendedAction: "Implement structured audit logging on 3 identified systems — schedule logging coverage review with compliance team before audit engagement",
    reasoning: "SOC 2 Type II requires continuous audit trail evidence across the audit period. The three identified systems lack sufficient coverage for CC7.1 (system monitoring), CC6.2 (access control monitoring), and CC6.3 (data classification monitoring). With 60 days until audit engagement begins, there is sufficient time to implement logging if action is taken within 14 days.",
    owner: "Compliance Officer",
    priority: 81,
    evidence: [
      { label: "Logging coverage assessment", value: "Payment processor: no admin action logging. Admin panel: session events not recorded. Export service: no data classification logging.", source: "Aegis Compliance Scanner", sourceType: "signal", freshness: "recent", confidence: 0.93 },
      { label: "SOC 2 control mapping", value: "Affected controls: CC7.1, CC6.2, CC6.3 — all required for Type II", source: "Compliance Framework DB", sourceType: "database", freshness: "recent", confidence: 0.97 },
      { label: "Audit timeline", value: "Audit engagement scheduled: 2026-06-15. Logging must be in place for full coverage period.", source: "Audit Schedule", sourceType: "document", freshness: "recent", confidence: 0.99 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "compliance_scan", tool: "aegis-compliance-scanner", latencyMs: 890, status: "completed", outputSummary: "3 systems with logging deficiencies identified" },
      { stepType: "model-call", name: "gap_analysis", model: "claude-3-5-sonnet", latencyMs: 2100, inputTokens: 2800, outputTokens: 640, costUsd: 0.0234, status: "completed", outputSummary: "CC7.1, CC6.2, CC6.3 at risk — 60-day remediation window" },
    ],
  },
  {
    cardId: "card-aegis-004",
    domain: "aegis",
    title: "Lateral Movement Indicator — Internal Host-to-Host Connection Anomaly",
    summary: "Aegis network analysis has detected anomalous east-west traffic patterns consistent with lateral movement behavior. A compromised workstation (ws-eng-047) has initiated connections to 14 internal hosts outside its normal network segment.",
    severity: "critical",
    autonomyMode: "execute-with-approval",
    status: "validation-pending",
    confidence: 0.82,
    entityScope: ["ws-eng-047", "14 Internal Hosts", "Engineering Network Segment"],
    recommendedAction: "Quarantine ws-eng-047 from internal network — run memory forensics — alert threat hunting team for full-scope investigation",
    reasoning: "Lateral movement from a single compromised endpoint is one of the highest-risk attacker behaviors — it indicates an active intrusion attempting to expand access. The 14 host connections are outside the workstation's baseline profile. Quarantine stops the active spread. Memory forensics captures attacker tools and techniques before they can be erased. The investigation scope should be assumed broader than current indicators suggest until proven otherwise.",
    owner: "Threat Hunting Team",
    priority: 97,
    evidence: [
      { label: "Anomalous connection count", value: "14 lateral connections to internal hosts outside normal profile for ws-eng-047", source: "Network Flow Analyzer", sourceType: "signal", freshness: "live", confidence: 0.87 },
      { label: "Baseline deviation", value: "Normal: 2-3 internal connections/hour. Current: 47 connections in 12 minutes", source: "Behavioral Baseline DB", sourceType: "signal", freshness: "live", confidence: 0.91 },
      { label: "Process anomaly", value: "powershell.exe spawned cmd.exe — unusual for workstation role profile", source: "EDR Telemetry", sourceType: "signal", freshness: "live", confidence: 0.79 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "network_flow_analysis", tool: "network-inspector", latencyMs: 560, status: "completed", outputSummary: "14 lateral connections detected from ws-eng-047" },
      { stepType: "tool-call", name: "edr_process_scan", tool: "edr-connector", latencyMs: 320, status: "completed", outputSummary: "Suspicious process chain: powershell → cmd" },
      { stepType: "model-call", name: "lateral_movement_classify", model: "gpt-4o", latencyMs: 1680, inputTokens: 2240, outputTokens: 590, costUsd: 0.0188, status: "completed", outputSummary: "High confidence lateral movement — quarantine recommended" },
    ],
  },

  // ─── VESSELS DOMAIN (4 cards) ─────────────────────────────────────────────
  {
    cardId: "card-vessels-001",
    domain: "vessels",
    title: "Dark Vessel Suspected — MV Ariadne AIS Gap of 127 Minutes in Sanctioned Area",
    summary: "MV Ariadne has a 127-minute AIS gap while transiting a known sanctioned port area. Vessel deviated 43nm from its declared route Fujairah→Singapore. Historical pattern: 3 prior AIS anomalies on similar route segments. OFAC screening required.",
    severity: "critical",
    autonomyMode: "execute-with-approval",
    status: "ready-for-review",
    confidence: 0.87,
    entityScope: ["MV Ariadne", "Fujairah-Singapore Route", "OFAC Screening"],
    recommendedAction: "Initiate OFAC sanctions screening — place voyage approval hold pending clearance — alert compliance officer",
    reasoning: "A 127-minute AIS gap combined with a 43nm route deviation in proximity to a sanctioned port area is a strong indicator of deliberate AIS manipulation (dark vessel behavior). The historical pattern of 3 prior anomalies on similar route segments for this vessel increases the probability of intentional evasion. OFAC screening is required before voyage approval can proceed under the maritime compliance policy. This is a time-sensitive action — voyage approval is pending.",
    owner: "Compliance Officer",
    priority: 96,
    evidence: [
      { label: "AIS gap duration", value: "127-minute AIS gap — threshold: 60 minutes for critical classification", source: "AIS Feed (ExactEarth)", sourceType: "api", freshness: "live", confidence: 0.96 },
      { label: "Route deviation", value: "43nm deviation from declared Fujairah→Singapore route — threshold: 20nm", source: "Route Compliance Monitor", sourceType: "signal", freshness: "live", confidence: 0.91 },
      { label: "Sanctioned area proximity", value: "Last confirmed position 12km from sanctioned port area during gap period", source: "OFAC Geography DB", sourceType: "database", freshness: "recent", confidence: 0.88 },
      { label: "Historical anomaly count", value: "3 prior AIS anomalies for MV Ariadne on similar route segments in past 18 months", source: "Vessels Historical DB", sourceType: "database", freshness: "recent", confidence: 0.94 },
      { label: "Flag state risk", value: "Panama-flagged vessel — flag state classified moderate-high risk for OFAC evasion", source: "Flag State Risk Registry", sourceType: "database", freshness: "stale", confidence: 0.78 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "ais_gap_detect", tool: "ais-monitor", latencyMs: 280, status: "completed", outputSummary: "127-minute gap detected — above 60min threshold" },
      { stepType: "tool-call", name: "route_compliance_check", tool: "route-inspector", latencyMs: 340, status: "completed", outputSummary: "43nm deviation from declared route" },
      { stepType: "tool-call", name: "sanctioned_proximity_check", tool: "ofac-geography", latencyMs: 210, status: "completed", outputSummary: "12km from sanctioned area at last known position" },
      { stepType: "model-call", name: "dark_vessel_classify", model: "claude-3-5-sonnet", latencyMs: 2240, inputTokens: 3100, outputTokens: 710, costUsd: 0.0268, status: "completed", outputSummary: "87% dark vessel confidence — OFAC screening triggered" },
      { stepType: "tool-call", name: "policy_evaluate", tool: "policy-engine", latencyMs: 95, status: "completed", outputSummary: "require-approval: critical severity maritime action" },
    ],
  },
  {
    cardId: "card-vessels-002",
    domain: "vessels",
    title: "Voyage P&L Alert — MV Poseidon Freight Rate Below Breakeven",
    summary: "Real-time voyage economics modeling shows MV Poseidon's current voyage (Rotterdam→Houston) is operating at 8% below the breakeven freight rate. Bunker cost overrun of $47K is the primary driver. Proactive rate renegotiation window is closing.",
    severity: "high",
    autonomyMode: "recommend",
    status: "approved",
    confidence: 0.83,
    entityScope: ["MV Poseidon", "Rotterdam-Houston Voyage", "Commercial Team"],
    recommendedAction: "Alert commercial team to initiate freight rate renegotiation with charterer — evaluate alternative port call to reduce bunker costs",
    reasoning: "The voyage P&L deterioration is driven by a $47K bunker cost overrun caused by a 3-day weather routing delay, combined with a freight rate that was fixed before current bunker prices. The renegotiation window exists because the charterer has incentive to maintain the relationship. Waiting until voyage completion reduces leverage. The commercial team should be notified now while there is still time to act.",
    owner: "Commercial Director",
    priority: 74,
    evidence: [
      { label: "Current freight rate vs breakeven", value: "Current: $18.40/MT — Breakeven: $20.00/MT (8% below)", source: "Voyage P&L Engine", sourceType: "model", freshness: "live", confidence: 0.88 },
      { label: "Bunker cost overrun", value: "$47K bunker overrun — weather routing delay added 3 days", source: "Bunker Management System", sourceType: "database", freshness: "recent", confidence: 0.91 },
      { label: "Voyage completion ETA", value: "ETA Houston: 11 days — renegotiation window: 7 days before cargo landed", source: "AIS Tracking", sourceType: "api", freshness: "live", confidence: 0.96 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "voyage_pnl_model", tool: "voyage-economics", latencyMs: 670, status: "completed", outputSummary: "8% below breakeven — $47K bunker overrun" },
      { stepType: "model-call", name: "commercial_recommendation", model: "gpt-4o-mini", latencyMs: 780, inputTokens: 1100, outputTokens: 280, costUsd: 0.0024, status: "completed", outputSummary: "Renegotiation recommended — 7-day window before leverage diminishes" },
    ],
  },
  {
    cardId: "card-vessels-003",
    domain: "vessels",
    title: "Fleet-Wide Scrubber Compliance Gap — IMO 2026 SOx Limit Applies in 90 Days",
    summary: "Regulatory intelligence scan shows 4 of 12 fleet vessels are non-compliant with IMO 2026 SOx emission limits effective in 90 days. Three options: scrubber retrofit, fuel switch to VLSFO, or route modification away from ECA zones.",
    severity: "high",
    autonomyMode: "recommend",
    status: "ready-for-review",
    confidence: 0.91,
    entityScope: ["4 Fleet Vessels", "IMO 2026 SOx Compliance", "Technical Team"],
    recommendedAction: "Schedule compliance review with technical superintendent — assess scrubber retrofit vs. fuel switch options per vessel — engage broker for charter clause review",
    reasoning: "IMO 2026 SOx limits represent a hard regulatory deadline — there is no grace period. Four vessels are currently running high-sulfur fuel in ECA zones where the new limits will apply. Scrubber retrofit is the most cost-effective solution for high-utilization routes, while VLSFO switch is preferable for vessels with irregular ECA exposure. Charter clauses may need amendment to pass through fuel cost differences. 90 days is the minimum viable timeline for either option.",
    owner: "Technical Superintendent",
    priority: 82,
    evidence: [
      { label: "Non-compliant vessels", value: "MV Atlas, MV Kronos, MV Helios, MV Tethys — all running HFO in future ECA zones", source: "Fleet Compliance DB", sourceType: "database", freshness: "recent", confidence: 0.95 },
      { label: "Regulatory timeline", value: "IMO 2026 SOx: 0.1% sulfur limit in ECA zones — effective 2026-07-01", source: "IMO Regulatory Feed", sourceType: "api", freshness: "live", confidence: 0.99 },
      { label: "Retrofit lead time", value: "Scrubber installation: 45-60 days yard time per vessel — must schedule immediately", source: "Technical Operations", sourceType: "document", freshness: "recent", confidence: 0.88 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "fleet_compliance_scan", tool: "compliance-scanner", latencyMs: 920, status: "completed", outputSummary: "4 vessels non-compliant for IMO 2026" },
      { stepType: "tool-call", name: "imo_regulatory_lookup", tool: "regulatory-feed", latencyMs: 340, status: "completed", outputSummary: "SOx 0.1% ECA limit confirmed for 2026-07-01" },
      { stepType: "model-call", name: "compliance_options_analysis", model: "claude-3-5-sonnet", latencyMs: 2890, inputTokens: 3400, outputTokens: 840, costUsd: 0.0312, status: "completed", outputSummary: "Three options analyzed — scrubber retrofit recommended for high-utilization routes" },
    ],
  },
  {
    cardId: "card-vessels-004",
    domain: "vessels",
    title: "Port Congestion Alert — Houston Calls Delayed 4.2 Days Average",
    summary: "Houston port congestion has reached 4.2-day average waiting time for container vessels. 3 fleet vessels have upcoming Houston calls in the next 14 days. Route alternatives available via New Orleans or Mobile that reduce expected delay to 1.8 days.",
    severity: "medium",
    autonomyMode: "recommend",
    status: "ready-for-review",
    confidence: 0.77,
    entityScope: ["MV Poseidon", "MV Titan", "MV Celeste", "Houston Port"],
    recommendedAction: "Evaluate port call rerouting to New Orleans or Mobile for the 3 upcoming Houston calls — model voyage P&L impact of alternative ports",
    reasoning: "A 4.2-day average delay represents significant demurrage risk and P&L impact for container voyages. The alternative ports (New Orleans, Mobile) have current wait times of 1.8 days and comparable cargo handling capacity for the freight in question. The decision must be made 7+ days before arrival to give adequate notice to charterers and port agents. The three affected vessels are within the decision window.",
    owner: "Fleet Operations Manager",
    priority: 48,
    evidence: [
      { label: "Houston average waiting time", value: "4.2 days avg wait — up from 1.1 days 3 weeks ago (port labor action)", source: "Port Authority Live Feed", sourceType: "api", freshness: "live", confidence: 0.89 },
      { label: "Alternative port wait times", value: "New Orleans: 1.8 days. Mobile: 1.9 days. Comparable cargo handling capacity.", source: "Port Operations DB", sourceType: "api", freshness: "recent", confidence: 0.84 },
      { label: "Affected vessel ETAs", value: "MV Poseidon ETA Houston: +11d. MV Titan: +8d. MV Celeste: +14d.", source: "AIS Tracking", sourceType: "api", freshness: "live", confidence: 0.97 },
    ],
    runSteps: [
      { stepType: "tool-call", name: "port_congestion_check", tool: "port-monitor", latencyMs: 280, status: "completed", outputSummary: "Houston: 4.2 days avg — labor action confirmed" },
      { stepType: "model-call", name: "route_alternative_analysis", model: "gpt-4o-mini", latencyMs: 940, inputTokens: 1380, outputTokens: 340, costUsd: 0.0031, status: "completed", outputSummary: "New Orleans and Mobile viable alternatives — 2.4-day reduction in expected delay" },
    ],
  },
];

// ─── Seed function ────────────────────────────────────────────────────────────

export async function seedDecisionsIfEmpty(): Promise<void> {
  try {
    const existing = await db
      .select({ c: count() })
      .from(decisionsRuntimeTable)
      .where(eq(decisionsRuntimeTable.workspaceId, DEMO_WORKSPACE));

    if (Number(existing[0]?.c) > 0) {
      logger.info("Decision cards already seeded — skipping");
      return;
    }

    await ensureConstitution();

    logger.info("Seeding decision cards...");

    for (const card of SEED_CARDS) {
      // Evaluate policy for this card
      const decisionInput: DecisionInput = {
        cardId: card.cardId,
        workspaceId: DEMO_WORKSPACE,
        severity: card.severity,
        autonomyMode: card.autonomyMode,
        recommendedAction: card.recommendedAction,
        confidence: card.confidence,
      };

      const policyEval = await evaluateDecisionPolicy(decisionInput);

      // Run adversarial validation
      const evidenceItems: EvidenceItem[] = card.evidence.map(e => ({
        label: e.label,
        value: e.value,
        source: e.source,
        freshness: e.freshness,
        confidence: e.confidence,
        sourceType: e.sourceType,
      }));

      const validationResult = runAdversarialValidation({
        cardId: card.cardId,
        title: card.title,
        summary: card.summary,
        severity: card.severity,
        confidence: card.confidence,
        recommendedAction: card.recommendedAction,
        reasoning: card.reasoning,
        domain: card.domain,
        evidence: evidenceItems,
        policyEvaluation: policyEval,
      });

      const auditEventId = `audit-${card.cardId}-created`;

      // Determine final policy state
      const policyState = policyEval.decision === "allow" ? "cleared"
        : policyEval.decision === "require-approval" ? "conditional"
        : "blocked";

      // Insert card
      await db.insert(decisionsRuntimeTable).values({
        cardId: card.cardId,
        workspaceId: DEMO_WORKSPACE,
        domain: card.domain,
        title: card.title,
        summary: card.summary,
        severity: card.severity,
        autonomyMode: card.autonomyMode,
        status: card.status,
        policyState: policyState as "cleared" | "conditional" | "blocked" | "flagged" | "pending",
        freshness: card.evidence.some(e => e.freshness === "live") ? "live" : "recent",
        confidence: card.confidence,
        entityScope: card.entityScope,
        recommendedAction: card.recommendedAction,
        reasoning: card.reasoning,
        owner: card.owner,
        priority: card.priority,
        policyEvaluation: policyEval as Record<string, unknown>,
        validationSummary: {
          allPassed: validationResult.allPassed,
          checkCount: validationResult.checks.length,
          blockingFailures: validationResult.blockingFailures.length,
          warnings: validationResult.warnings.length,
        } as Record<string, unknown>,
        auditEventId,
        generatedAt: new Date(),
      });

      // Insert evidence
      for (let i = 0; i < card.evidence.length; i++) {
        const ev = card.evidence[i];
        await db.insert(decisionEvidenceTable).values({
          cardId: card.cardId,
          workspaceId: DEMO_WORKSPACE,
          label: ev.label,
          value: ev.value,
          source: ev.source,
          excerpt: ev.excerpt,
          sourceType: ev.sourceType,
          freshness: ev.freshness,
          confidence: ev.confidence,
          orderIdx: i,
          capturedAt: new Date(),
        });
      }

      // Insert validation results
      for (const check of validationResult.checks) {
        await db.insert(decisionValidationsTable).values({
          cardId: card.cardId,
          workspaceId: DEMO_WORKSPACE,
          checkType: check.checkType,
          passed: check.passed,
          explanation: check.explanation,
          severity: check.severity,
          metadata: (check.metadata ?? {}) as Record<string, unknown>,
          ranAt: new Date(),
        });
      }

      // Build run trace
      const totalLatency = card.runSteps.reduce((s, r) => s + r.latencyMs, 0);
      const totalInputTokens = card.runSteps.reduce((s, r) => s + (r.inputTokens ?? 0), 0);
      const totalOutputTokens = card.runSteps.reduce((s, r) => s + (r.outputTokens ?? 0), 0);
      const estimatedCost = card.runSteps.reduce((s, r) => s + (r.costUsd ?? 0), 0);
      const modelsCalled = [...new Set(card.runSteps.filter(r => r.model).map(r => r.model!))];
      const toolsCalled = [...new Set(card.runSteps.filter(r => r.tool).map(r => r.tool!))];

      await db.insert(decisionRunsTable).values({
        cardId: card.cardId,
        workspaceId: DEMO_WORKSPACE,
        runId: `run-${card.cardId}`,
        steps: card.runSteps as unknown as Record<string, unknown>[],
        totalLatencyMs: totalLatency,
        totalInputTokens,
        totalOutputTokens,
        estimatedCostUsd: estimatedCost,
        modelsCalled: modelsCalled as unknown as Record<string, unknown>[],
        toolsCalled: toolsCalled as unknown as Record<string, unknown>[],
        handoffs: [] as unknown as Record<string, unknown>[],
        status: "completed",
        startedAt: new Date(Date.now() - totalLatency),
        completedAt: new Date(),
      });

      // Insert creation audit event
      await db.insert(decisionAuditEventsTable).values({
        eventId: auditEventId,
        cardId: card.cardId,
        workspaceId: DEMO_WORKSPACE,
        eventType: "card.created",
        actorId: "system:decision-seed-v1",
        actorType: "system",
        actorDisplay: "Decision Seed (v1)",
        reason: "Demo seed data initialization",
        previousStatus: null,
        newStatus: card.status,
        occurredAt: new Date(),
      });
    }

    logger.info(`Seeded ${SEED_CARDS.length} decision cards across Lyte, Aegis, and Vessels domains`);
  } catch (err) {
    logger.error({ err }, "Failed to seed decision cards");
  }
}
