import type { JSX } from "react";
import { useState } from "react";
import {
  Radio, Brain, Activity, Scale, CheckSquare, Play, Shield, Target,
  ChevronRight, ChevronLeft, ArrowRight, Zap, Clock, AlertTriangle,
  CheckCircle, FileText, Cpu, Eye, BarChart3, FlaskConical, BookOpen
} from "lucide-react";
import { ProofProvenancePanel, type ProofEntry } from "../components/governed-decision/proof-provenance-panel";
import { MonteCarloSimPanel, type SimulationScenario, type SensitivityDriver } from "../components/governed-decision/monte-carlo-panel";
import { PolicyGatePanel, type PolicyEvaluation, type ApprovalStep as PolicyApprovalStep, type AuditEntry } from "../components/governed-decision/policy-gate-panel";
import { OutcomePanel, type OutcomeRecord } from "../components/governed-decision/outcome-panel";
import { useDemoMode, DEMO_SCENARIOS, type DemoScenarioKey } from "../lib/demo-mode";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e", panel: "#0e1219" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ACCENT = "#d4a054";

interface LoopStep {
  id: string;
  label: string;
  icon: typeof Radio;
  color: string;
  description: string;
}

const LOOP_STEPS: LoopStep[] = [
  { id: "signal", label: "Signal", icon: Radio, color: "#c45a4a", description: "Inbound event detected across domain pack telemetry" },
  { id: "context", label: "Context", icon: Brain, color: "#ec4899", description: "Signal enriched with cross-domain intelligence and historical patterns" },
  { id: "recommendation", label: "Recommendation", icon: Zap, color: "#8b7ac8", description: "AI-generated action recommendation with confidence scoring" },
  { id: "simulation", label: "Simulation", icon: Activity, color: "#0ea5e9", description: "Monte Carlo scenario modeling — best / base / worst case analysis" },
  { id: "policy", label: "Policy Gate", icon: Scale, color: ACCENT, description: "Covenant Policy evaluation — automated compliance and risk assessment" },
  { id: "approval", label: "Approval", icon: CheckSquare, color: "#22c55e", description: "Human-in-the-loop approval chain with role-based gates" },
  { id: "execution", label: "Execution", icon: Play, color: "#6366f1", description: "Governed action execution via workflow engine" },
  { id: "proof", label: "Proof Chain", icon: Shield, color: "#d4a054", description: "Immutable provenance record — source, model, confidence, lineage" },
  { id: "outcome", label: "Outcome", icon: Target, color: "#6b8f71", description: "Result captured, prediction accuracy measured, feedback loop closed" },
];

interface SignalData {
  id: string;
  title: string;
  pack: string;
  packColor: string;
  severity: "critical" | "high" | "medium";
  detectedAt: string;
  source: string;
  entities: string[];
  entityLabel: string;
  evidence: { type: string; label: string }[];
  riskEstimate: string;
}

interface ContextData {
  crossDomainSignals: { pack: string; color: string; signal: string }[];
  historicalMatches: number;
  patternConfidence: number;
  enrichmentSources: string[];
}

interface RecommendationData {
  id: string;
  text: string;
  alternativeAction: string;
  confidence: number;
  modelId: string;
  modelProvider: string;
  reasoning: string[];
}

interface SimulationData {
  scenarios: SimulationScenario[];
  drivers: SensitivityDriver[];
}

interface PolicyData {
  evaluations: PolicyEvaluation[];
  approvalChain: PolicyApprovalStep[];
  auditTrail: AuditEntry[];
}

interface ExecutionStepRow { step: string; status: string; time: string; detail: string }

interface ScenarioPanelData {
  domainLabel: string;
  signal: SignalData;
  context: ContextData;
  recommendation: RecommendationData;
  simulation: SimulationData;
  policy: PolicyData;
  execution: { steps: ExecutionStepRow[]; durationLabel: string; stepsCompleted: string };
  proof: ProofEntry[];
  outcome: OutcomeRecord;
}

const VESSELS_DATA: ScenarioPanelData = {
  domainLabel: "Vessels — Maritime Fleet Command",
  signal: {
    id: "SIG-4821",
    title: "Fleet ETA compliance gap — 3 vessels outside SLA",
    pack: "Vessels",
    packColor: "#38bdf8",
    severity: "critical",
    detectedAt: "Apr 16, 2026 · 09:11 UTC",
    source: "Vessel Telemetry · AIS Feed",
    entities: ["M/V Meridian", "M/V Catalyst", "M/V Horizon"],
    entityLabel: "Affected Vessel",
    evidence: [
      { type: "signal", label: "AIS position deviation > 4hr threshold" },
      { type: "pattern", label: "Weather delay correlation — Bay of Bengal" },
      { type: "historical", label: "Similar pattern caused $1.8M SLA breach in Q3 2025" },
    ],
    riskEstimate: "$2.1M",
  },
  context: {
    crossDomainSignals: [
      { pack: "Aegis", color: "#4f6ef7", signal: "Maritime threat advisory — Bay of Bengal piracy risk elevated to Level 3" },
      { pack: "Terra", color: "#a07848", signal: "Port congestion at Singapore — average wait 18hr (normally 6hr)" },
      { pack: "PRISM", color: "#d4a054", signal: "Client SLA contract T-2241 — penalty clause triggers at 96hr delay" },
    ],
    historicalMatches: 14,
    patternConfidence: 87,
    enrichmentSources: ["AIS Live Feed", "Weather API", "Port Authority Database", "Contract Management System"],
  },
  recommendation: {
    id: "REC-0421",
    text: "Authorize fuel surcharge pass-through and reroute M/V Meridian via Strait of Malacca to recover 14hr ETA gap",
    alternativeAction: "Maintain current route and negotiate SLA extension with client",
    confidence: 82,
    modelId: "szl-ops-advisor-v3",
    modelProvider: "SZL Internal",
    reasoning: [
      "Rerouting adds $45K fuel cost but avoids $2.1M SLA penalty",
      "Weather window closing — delay of 12hr reduces reroute effectiveness to <40%",
      "Historical success rate for this reroute pattern: 91% (14 cases)",
      "Client contract permits surcharge pass-through under force majeure clause 7.2",
    ],
  },
  simulation: {
    scenarios: [
      { id: "reroute", label: "Reroute (Recommended)", color: "#6b8f71", outputMetric: "Net Savings", outputUnit: "$", p5: 850000, p25: 1400000, p50: 1820000, p75: 2050000, p95: 2300000, mean: 1780000, stdDev: 340000, confidence: 84 },
      { id: "maintain", label: "Maintain Route", color: "#c45a4a", outputMetric: "Net Savings", outputUnit: "$", p5: -2100000, p25: -1600000, p50: -800000, p75: -200000, p95: 400000, mean: -850000, stdDev: 620000, confidence: 41 },
      { id: "negotiate", label: "Negotiate SLA", color: "#c8953c", outputMetric: "Net Savings", outputUnit: "$", p5: -500000, p25: 200000, p50: 600000, p75: 900000, p95: 1400000, mean: 580000, stdDev: 450000, confidence: 62 },
    ],
    drivers: [
      { input: "Weather Delay", lowValue: 0, highValue: 4, baseOutput: 1820000, lowOutput: 2100000, highOutput: 1200000, unit: "$" },
      { input: "Fuel Price", lowValue: 540, highValue: 720, baseOutput: 1820000, lowOutput: 1950000, highOutput: 1680000, unit: "$" },
      { input: "Port Wait Time", lowValue: 4, highValue: 24, baseOutput: 1820000, lowOutput: 1900000, highOutput: 1500000, unit: "$" },
      { input: "Piracy Premium", lowValue: 0, highValue: 0.08, baseOutput: 1820000, lowOutput: 1850000, highOutput: 1720000, unit: "$" },
      { input: "Client Penalty Rate", lowValue: 0.01, highValue: 0.05, baseOutput: 1820000, lowOutput: 1400000, highOutput: 2100000, unit: "$" },
    ],
  },
  policy: {
    evaluations: [
      { policyId: "cov-001", policyName: "High-severity actions → Human approval required", outcome: "approved", reason: "Severity = CRITICAL, routed to human approval gate", evaluatedAt: "09:12:04", durationMs: 3 },
      { policyId: "cov-002", policyName: "Financial actions > $50K → Finance review", outcome: "approved", reason: "Fuel surcharge $45K within threshold; reroute cost accepted under operational mandate", evaluatedAt: "09:12:04", durationMs: 2 },
      { policyId: "cov-003", policyName: "Compliance events → Immutable audit log", outcome: "approved", reason: "SLA-related action logged to immutable audit trail", evaluatedAt: "09:12:04", durationMs: 1 },
      { policyId: "cov-005", policyName: "Cross-domain impact → Domain lead sign-off", outcome: "approved", reason: "Vessels + PRISM domains affected; both domain leads notified", evaluatedAt: "09:12:05", durationMs: 4 },
    ],
    approvalChain: [
      { role: "Fleet Operations Lead", approver: "Marcus Chen", status: "approved", timestamp: "09:18", comment: "Confirmed weather window. Reroute is the right call." },
      { role: "Finance Controller", approver: "Aisha Kamara", status: "approved", timestamp: "09:25", comment: "Fuel surcharge within Q2 contingency budget." },
      { role: "CEO", approver: "Stephen Lutar", status: "approved", timestamp: "09:45", comment: "Approved. Protect the SLA — client relationship is strategic." },
    ],
    auditTrail: [
      { timestamp: "09:11:58", action: "Signal SIG-4821 ingested", actor: "System" },
      { timestamp: "09:12:01", action: "Context enrichment completed (4 sources)", actor: "System" },
      { timestamp: "09:12:03", action: "Recommendation REC-0421 generated (82% confidence)", actor: "szl-ops-advisor-v3" },
      { timestamp: "09:12:04", action: "Covenant Policy evaluation — 4 policies checked, all passed", actor: "Covenant Engine" },
      { timestamp: "09:12:06", action: "Monte Carlo simulation completed (10,000 iterations)", actor: "System" },
      { timestamp: "09:12:10", action: "Approval request created — routed to 3-step chain", actor: "System" },
      { timestamp: "09:18:00", action: "Fleet Ops Lead approved", actor: "Marcus Chen" },
      { timestamp: "09:25:00", action: "Finance Controller approved", actor: "Aisha Kamara" },
      { timestamp: "09:45:00", action: "CEO approved — action authorized", actor: "Stephen Lutar" },
      { timestamp: "09:45:02", action: "Execution initiated — reroute order dispatched to vessel", actor: "Workflow Engine" },
      { timestamp: "09:45:05", action: "Proof chain record created — immutable receipt generated", actor: "Proof Chain" },
      { timestamp: "Apr 17, 14:30", action: "Outcome recorded — SLA breach avoided, $2.1M protected", actor: "System" },
    ],
  },
  execution: {
    steps: [
      { step: "Authorization verified", status: "complete", time: "09:45:01", detail: "3/3 approvals confirmed" },
      { step: "Reroute order dispatched", status: "complete", time: "09:45:02", detail: "M/V Meridian — Captain notified via VSAT" },
      { step: "Fuel surcharge entry created", status: "complete", time: "09:45:03", detail: "$45K logged against contingency budget" },
      { step: "Client notification sent", status: "complete", time: "09:45:04", detail: "Revised ETA communicated — Contract T-2241" },
      { step: "Audit trail sealed", status: "complete", time: "09:45:05", detail: "Immutable proof chain record generated" },
    ],
    durationLabel: "4.2s",
    stepsCompleted: "5/5",
  },
  proof: [
    { id: "PF-9041", sourceClass: "llm_generated", contentType: "Operational Recommendation", modelId: "szl-ops-advisor-v3", modelProvider: "SZL Internal", confidenceScore: 0.82, reviewState: "approved", exportSafety: "safe", generatedAt: "Apr 16, 09:12:03", reviewedBy: "Marcus Chen", reviewedAt: "Apr 16, 09:18", reviewNote: "Recommendation aligns with operational best practice", inputSources: [{ type: "telemetry", label: "AIS Position Feed" }, { type: "api", label: "Weather API — Bay of Bengal" }, { type: "database", label: "Contract T-2241 SLA terms" }, { type: "historical", label: "14 prior reroute decisions" }] },
    { id: "PF-9042", sourceClass: "system_computed", contentType: "Monte Carlo Simulation Result", confidenceScore: 0.84, reviewState: "approved", exportSafety: "safe", generatedAt: "Apr 16, 09:12:06", reviewedBy: "Aisha Kamara", reviewedAt: "Apr 16, 09:25", inputSources: [{ type: "model", label: "Voyage Cost Model v2.1" }, { type: "market", label: "Bunker Fuel Index" }, { type: "historical", label: "Port delay distributions" }], parentProofId: "PF-9041" },
  ],
  outcome: {
    id: "OUT-2104",
    result: "achieved",
    executedAction: "Fuel surcharge authorized; M/V Meridian rerouted via Strait of Malacca",
    executedAt: "Apr 16, 09:45",
    executedBy: "Stephen Lutar",
    executedByRole: "CEO",
    outcomeRecordedAt: "Apr 17, 14:30",
    predictedImpact: "$2.1M SLA penalty avoided",
    actualImpact: "$2.1M protected — SLA compliance restored, vessel arrived 6hr ahead of revised ETA",
    accuracy: 97,
    feedbackNote: "Reroute executed cleanly. Weather window was correctly predicted. Recommend pre-authorizing surcharge for similar patterns going forward.",
    laterImpact: "Client relationship strengthened — contract renewal probability increased from 72% to 89%",
    timeToOutcome: "29h 18m",
  },
};

const AEGIS_DATA: ScenarioPanelData = {
  domainLabel: "Aegis — Defense & Security",
  signal: {
    id: "SIG-AEG-7714",
    title: "Credential sweep on 3 admin accounts — 847 failed auth attempts in 4 minutes",
    pack: "Aegis",
    packColor: "#c45a4a",
    severity: "critical",
    detectedAt: "Apr 16, 2026 · 02:14 UTC",
    source: "Aegis Threat Intelligence · Behavioral Analytics",
    entities: ["admin@szl-prod", "ops-root@szl-prod", "deploy-bot@szl-prod"],
    entityLabel: "Targeted Account",
    evidence: [
      { type: "signal", label: "847 failed auth attempts in 4 minutes (baseline < 5/hr)" },
      { type: "pattern", label: "3 rotating IP clusters — known threat infrastructure" },
      { type: "historical", label: "Pattern matches 2024 Lazarus-attributed credential-stuffing campaign" },
    ],
    riskEstimate: "$2.4M",
  },
  context: {
    crossDomainSignals: [
      { pack: "Vessels", color: "#38bdf8", signal: "No active vessel exposure — auth surface limited to ops-root" },
      { pack: "Terra", color: "#a07848", signal: "Property portal auth quiet — attack appears narrowly targeted" },
      { pack: "PRISM", color: "#d4a054", signal: "Compliance trigger — credential incident requires CISO notification within 1hr" },
    ],
    historicalMatches: 9,
    patternConfidence: 94,
    enrichmentSources: ["Aegis SIEM", "Threat Intel Feed (MISP)", "Identity Provider Logs", "Geo-IP Reputation DB"],
  },
  recommendation: {
    id: "REC-AEG-1184",
    text: "Force logout and suspend 3 admin accounts, rotate all credentials and API keys, block identified IP ranges at perimeter",
    alternativeAction: "Enable step-up MFA only and monitor — preserves session continuity at higher risk",
    confidence: 94,
    modelId: "szl-aegis-responder-v2",
    modelProvider: "SZL Internal",
    reasoning: [
      "Lateral movement signal indicates one service account may be partially compromised",
      "Containment within 8 minutes prevents estimated $2.4M data-breach exposure",
      "MFA was not challenged on 2 of 3 accounts — policy gap requires immediate closure",
      "Historical containment success rate for this playbook: 96% (24 cases)",
    ],
  },
  simulation: {
    scenarios: [
      { id: "contain", label: "Contain & Rotate (Recommended)", color: "#6b8f71", outputMetric: "Loss Avoided", outputUnit: "$", p5: 1400000, p25: 1900000, p50: 2400000, p75: 2700000, p95: 3100000, mean: 2380000, stdDev: 420000, confidence: 88 },
      { id: "monitor", label: "Monitor Only", color: "#c45a4a", outputMetric: "Loss Avoided", outputUnit: "$", p5: -3200000, p25: -2200000, p50: -1100000, p75: -200000, p95: 600000, mean: -1240000, stdDev: 980000, confidence: 38 },
      { id: "stepup", label: "Step-up MFA Only", color: "#c8953c", outputMetric: "Loss Avoided", outputUnit: "$", p5: -800000, p25: 400000, p50: 1100000, p75: 1700000, p95: 2200000, mean: 1080000, stdDev: 720000, confidence: 60 },
    ],
    drivers: [
      { input: "Time to Containment (min)", lowValue: 5, highValue: 60, baseOutput: 2400000, lowOutput: 2700000, highOutput: 1200000, unit: "$" },
      { input: "Compromised Accounts", lowValue: 1, highValue: 5, baseOutput: 2400000, lowOutput: 2600000, highOutput: 1400000, unit: "$" },
      { input: "Data Sensitivity", lowValue: 0.4, highValue: 1.0, baseOutput: 2400000, lowOutput: 1800000, highOutput: 2900000, unit: "$" },
      { input: "MFA Coverage", lowValue: 0.6, highValue: 1.0, baseOutput: 2400000, lowOutput: 1900000, highOutput: 2600000, unit: "$" },
      { input: "Regulatory Exposure", lowValue: 0, highValue: 0.15, baseOutput: 2400000, lowOutput: 2300000, highOutput: 3100000, unit: "$" },
    ],
  },
  policy: {
    evaluations: [
      { policyId: "cov-001", policyName: "High-severity actions → Human approval required", outcome: "approved", reason: "Severity = CRITICAL, routed to security approval gate", evaluatedAt: "02:14:08", durationMs: 2 },
      { policyId: "cov-004", policyName: "Credential rotation → CISO sign-off", outcome: "approved", reason: "Credential incident — CISO approval required and obtained", evaluatedAt: "02:14:09", durationMs: 3 },
      { policyId: "cov-003", policyName: "Compliance events → Immutable audit log", outcome: "approved", reason: "Security incident logged for SOC 2 evidence", evaluatedAt: "02:14:09", durationMs: 1 },
      { policyId: "cov-007", policyName: "Production credential changes → Two-person rule", outcome: "approved", reason: "Two-person approval satisfied (Sec Lead + CISO)", evaluatedAt: "02:14:10", durationMs: 2 },
    ],
    approvalChain: [
      { role: "Security Operations Lead", approver: "Priya Raman", status: "approved", timestamp: "02:16", comment: "Telemetry confirms credential stuffing. Contain immediately." },
      { role: "CISO", approver: "David Okafor", status: "approved", timestamp: "02:19", comment: "Approved containment + global MFA enforcement." },
      { role: "CEO", approver: "Stephen Lutar", status: "approved", timestamp: "02:22", comment: "Approved. Notify board after containment confirmed." },
    ],
    auditTrail: [
      { timestamp: "02:14:02", action: "Signal SIG-AEG-7714 ingested", actor: "System" },
      { timestamp: "02:14:05", action: "Context enrichment completed (4 sources)", actor: "System" },
      { timestamp: "02:14:07", action: "Recommendation REC-AEG-1184 generated (94% confidence)", actor: "szl-aegis-responder-v2" },
      { timestamp: "02:14:10", action: "Covenant Policy evaluation — 4 policies checked, all passed", actor: "Covenant Engine" },
      { timestamp: "02:14:12", action: "Monte Carlo simulation completed (10,000 iterations)", actor: "System" },
      { timestamp: "02:14:15", action: "Approval request created — routed to 3-step chain", actor: "System" },
      { timestamp: "02:16:00", action: "Sec Ops Lead approved", actor: "Priya Raman" },
      { timestamp: "02:19:00", action: "CISO approved", actor: "David Okafor" },
      { timestamp: "02:22:00", action: "CEO approved — containment authorized", actor: "Stephen Lutar" },
      { timestamp: "02:22:04", action: "Execution initiated — accounts suspended, IP block applied", actor: "Workflow Engine" },
      { timestamp: "02:22:09", action: "Proof chain record created — immutable receipt generated", actor: "Proof Chain" },
      { timestamp: "Apr 16, 09:00", action: "Outcome recorded — no breach, $2.4M exposure avoided", actor: "System" },
    ],
  },
  execution: {
    steps: [
      { step: "Authorization verified", status: "complete", time: "02:22:01", detail: "3/3 approvals confirmed (Sec Lead, CISO, CEO)" },
      { step: "Admin accounts suspended", status: "complete", time: "02:22:03", detail: "3 accounts force-logged out, sessions revoked" },
      { step: "Credentials & API keys rotated", status: "complete", time: "02:22:05", detail: "47 secrets rotated, dependent services notified" },
      { step: "Perimeter IP block applied", status: "complete", time: "02:22:07", detail: "3 IP ranges blacklisted at edge" },
      { step: "Audit trail sealed", status: "complete", time: "02:22:09", detail: "SOC 2 evidence chain generated" },
    ],
    durationLabel: "8.1s",
    stepsCompleted: "5/5",
  },
  proof: [
    { id: "PF-AEG-3301", sourceClass: "llm_generated", contentType: "Security Containment Recommendation", modelId: "szl-aegis-responder-v2", modelProvider: "SZL Internal", confidenceScore: 0.94, reviewState: "approved", exportSafety: "safe", generatedAt: "Apr 16, 02:14:07", reviewedBy: "Priya Raman", reviewedAt: "Apr 16, 02:16", reviewNote: "Aligns with documented IR-PB-04 playbook", inputSources: [{ type: "telemetry", label: "Aegis SIEM Auth Stream" }, { type: "api", label: "MISP Threat Intel Feed" }, { type: "database", label: "Identity Provider Audit Log" }, { type: "historical", label: "9 prior credential-stuffing incidents" }] },
    { id: "PF-AEG-3302", sourceClass: "system_computed", contentType: "Loss-Avoidance Simulation Result", confidenceScore: 0.88, reviewState: "approved", exportSafety: "safe", generatedAt: "Apr 16, 02:14:12", reviewedBy: "David Okafor", reviewedAt: "Apr 16, 02:19", inputSources: [{ type: "model", label: "Breach Loss Model v1.4" }, { type: "market", label: "IBM Cost-of-Breach Index" }, { type: "historical", label: "Industry IR benchmarks" }], parentProofId: "PF-AEG-3301" },
  ],
  outcome: {
    id: "OUT-AEG-0117",
    result: "achieved",
    executedAction: "Admin accounts suspended; credentials rotated; IP perimeter block applied; global MFA enforced",
    executedAt: "Apr 16, 02:22",
    executedBy: "Stephen Lutar",
    executedByRole: "CEO",
    outcomeRecordedAt: "Apr 16, 09:00",
    predictedImpact: "$2.4M breach exposure avoided",
    actualImpact: "$2.4M protected — no data exfiltration detected, attacker confirmed locked out, MFA gap closed",
    accuracy: 96,
    feedbackNote: "Containment fully effective. Recommend automating MFA enforcement across all admin tiers as standing policy.",
    laterImpact: "SOC 2 audit evidence updated — auditor cited containment time as exemplary",
    timeToOutcome: "6h 46m",
  },
};

const TERRA_DATA: ScenarioPanelData = {
  domainLabel: "Terra — Real Estate Intelligence",
  signal: {
    id: "SIG-TER-2207",
    title: "Distressed acquisition window — 847 Commerce Blvd at 22% below market, 72hr exclusive",
    pack: "Terra",
    packColor: "#a07848",
    severity: "high",
    detectedAt: "Apr 16, 2026 · 07:32 EST",
    source: "Terra Market Intelligence · Proptech Feed",
    entities: ["847 Commerce Blvd", "Owner: Pacific Holdings LLC", "Broker: Meridian Brokerage"],
    entityLabel: "Property / Party",
    evidence: [
      { type: "signal", label: "Owner failed Q1 refinancing — voluntary sale filed" },
      { type: "pattern", label: "22% below comparable sales ($5.25M Q1 2026 avg)" },
      { type: "historical", label: "Cap rate 9.2% vs portfolio target 7.5% — IRR meets hurdle" },
    ],
    riskEstimate: "$1.25M upside",
  },
  context: {
    crossDomainSignals: [
      { pack: "PRISM", color: "#d4a054", signal: "Capital availability — $7.4M acquisition envelope unallocated this quarter" },
      { pack: "Aegis", color: "#4f6ef7", signal: "No counterparty risk flags on Pacific Holdings or Meridian Brokerage" },
      { pack: "Vessels", color: "#38bdf8", signal: "No exposure — purely Terra-domain decision" },
    ],
    historicalMatches: 7,
    patternConfidence: 81,
    enrichmentSources: ["Comp Sales Database", "Cap Rate Model", "Tenant Roll Database", "Title & Lien Search"],
  },
  recommendation: {
    id: "REC-TER-0903",
    text: "Submit LOI at $3.95M with 10-day due diligence window — secure exclusivity before April 19 09:00 EST",
    alternativeAction: "Pass and monitor — preserves capital for higher-conviction opportunities",
    confidence: 89,
    modelId: "szl-terra-acquirer-v2",
    modelProvider: "SZL Internal",
    reasoning: [
      "Risk-adjusted IRR of 18.4% at $3.95M exceeds 15% portfolio hurdle rate",
      "Lease-up from 71% to 85% adds $380K NOI annually within 14-month runway",
      "Competing buyer identified — first LOI captures 72hr exclusivity",
      "Owner motivation: failed refinance forces close by Q2 — buyer has price leverage",
    ],
  },
  simulation: {
    scenarios: [
      { id: "loi-395", label: "LOI at $3.95M (Recommended)", color: "#6b8f71", outputMetric: "3-Yr Equity Gain", outputUnit: "$", p5: 600000, p25: 950000, p50: 1250000, p75: 1500000, p95: 1800000, mean: 1230000, stdDev: 340000, confidence: 81 },
      { id: "loi-410", label: "LOI at $4.10M (Ask)", color: "#c8953c", outputMetric: "3-Yr Equity Gain", outputUnit: "$", p5: 400000, p25: 750000, p50: 1050000, p75: 1300000, p95: 1600000, mean: 1020000, stdDev: 320000, confidence: 78 },
      { id: "pass", label: "Pass on Deal", color: "#c45a4a", outputMetric: "3-Yr Equity Gain", outputUnit: "$", p5: 0, p25: 0, p50: 0, p75: 0, p95: 0, mean: 0, stdDev: 0, confidence: 50 },
    ],
    drivers: [
      { input: "Lease-up Pace (months)", lowValue: 8, highValue: 24, baseOutput: 1250000, lowOutput: 1450000, highOutput: 850000, unit: "$" },
      { input: "Exit Cap Rate", lowValue: 0.065, highValue: 0.085, baseOutput: 1250000, lowOutput: 1700000, highOutput: 800000, unit: "$" },
      { input: "Market Rent Growth", lowValue: 0.01, highValue: 0.05, baseOutput: 1250000, lowOutput: 950000, highOutput: 1600000, unit: "$" },
      { input: "CapEx Reserve", lowValue: 300000, highValue: 700000, baseOutput: 1250000, lowOutput: 1350000, highOutput: 1100000, unit: "$" },
      { input: "Interest Rate", lowValue: 0.055, highValue: 0.075, baseOutput: 1250000, lowOutput: 1400000, highOutput: 1050000, unit: "$" },
    ],
  },
  policy: {
    evaluations: [
      { policyId: "cov-002", policyName: "Financial actions > $50K → Finance review", outcome: "approved", reason: "Acquisition $3.95M — finance review completed", evaluatedAt: "08:01:14", durationMs: 3 },
      { policyId: "cov-008", policyName: "Real estate acquisitions → Investment Committee approval", outcome: "approved", reason: "IC convened and approved within 60 minutes", evaluatedAt: "08:01:15", durationMs: 4 },
      { policyId: "cov-003", policyName: "Compliance events → Immutable audit log", outcome: "approved", reason: "LOI authorization logged for audit", evaluatedAt: "08:01:15", durationMs: 1 },
      { policyId: "cov-009", policyName: "Capital deployment > $1M → Treasury sign-off", outcome: "approved", reason: "Treasury confirmed capital availability and reserved $4.5M envelope", evaluatedAt: "08:01:16", durationMs: 2 },
    ],
    approvalChain: [
      { role: "Acquisitions Lead", approver: "Lena Vasquez", status: "approved", timestamp: "08:18", comment: "Comp analysis confirms 22% discount. LOI at $3.95M is the right anchor." },
      { role: "CFO / Treasury", approver: "Aisha Kamara", status: "approved", timestamp: "08:34", comment: "Capital available. Reserve $450K CapEx as recommended." },
      { role: "CEO", approver: "Stephen Lutar", status: "approved", timestamp: "08:51", comment: "Approved. Move fast — exclusivity window is the entire edge." },
    ],
    auditTrail: [
      { timestamp: "07:32:11", action: "Signal SIG-TER-2207 ingested", actor: "System" },
      { timestamp: "07:33:02", action: "Context enrichment completed (4 sources)", actor: "System" },
      { timestamp: "07:34:18", action: "Recommendation REC-TER-0903 generated (89% confidence)", actor: "szl-terra-acquirer-v2" },
      { timestamp: "08:01:16", action: "Covenant Policy evaluation — 4 policies checked, all passed", actor: "Covenant Engine" },
      { timestamp: "08:02:04", action: "Monte Carlo simulation completed (10,000 iterations)", actor: "System" },
      { timestamp: "08:02:30", action: "Approval request created — routed to 3-step chain", actor: "System" },
      { timestamp: "08:18:00", action: "Acquisitions Lead approved", actor: "Lena Vasquez" },
      { timestamp: "08:34:00", action: "CFO/Treasury approved", actor: "Aisha Kamara" },
      { timestamp: "08:51:00", action: "CEO approved — LOI authorized", actor: "Stephen Lutar" },
      { timestamp: "08:51:09", action: "Execution initiated — LOI dispatched to broker", actor: "Workflow Engine" },
      { timestamp: "08:51:14", action: "Proof chain record created — immutable receipt generated", actor: "Proof Chain" },
      { timestamp: "Apr 28, 16:00", action: "Outcome recorded — LOI accepted, exclusivity locked", actor: "System" },
    ],
  },
  execution: {
    steps: [
      { step: "Authorization verified", status: "complete", time: "08:51:01", detail: "3/3 approvals confirmed (Acquisitions, CFO, CEO)" },
      { step: "LOI document generated", status: "complete", time: "08:51:04", detail: "Standard template + Terra terms — counter-signed by GC" },
      { step: "LOI dispatched to broker", status: "complete", time: "08:51:07", detail: "Sent to James Holt at Meridian Brokerage" },
      { step: "Capital reservation booked", status: "complete", time: "08:51:09", detail: "$4.5M reserved against Q2 acquisitions envelope" },
      { step: "Audit trail sealed", status: "complete", time: "08:51:14", detail: "Immutable proof chain record generated" },
    ],
    durationLabel: "13.3s",
    stepsCompleted: "5/5",
  },
  proof: [
    { id: "PF-TER-5511", sourceClass: "llm_generated", contentType: "Acquisition Recommendation", modelId: "szl-terra-acquirer-v2", modelProvider: "SZL Internal", confidenceScore: 0.89, reviewState: "approved", exportSafety: "safe", generatedAt: "Apr 16, 07:34:18", reviewedBy: "Lena Vasquez", reviewedAt: "Apr 16, 08:18", reviewNote: "Comp analysis verified independently — recommendation stands", inputSources: [{ type: "database", label: "Comp Sales DB (Q1 2026)" }, { type: "model", label: "Cap Rate Model v3.0" }, { type: "database", label: "Tenant Roll & Lease Schedule" }, { type: "historical", label: "7 prior distressed acquisitions" }] },
    { id: "PF-TER-5512", sourceClass: "system_computed", contentType: "Equity-Gain Simulation Result", confidenceScore: 0.81, reviewState: "approved", exportSafety: "safe", generatedAt: "Apr 16, 08:02:04", reviewedBy: "Aisha Kamara", reviewedAt: "Apr 16, 08:34", inputSources: [{ type: "model", label: "Acquisition IRR Model v2.2" }, { type: "market", label: "Local Submarket Rent Index" }, { type: "historical", label: "Lease-up absorption curves" }], parentProofId: "PF-TER-5511" },
  ],
  outcome: {
    id: "OUT-TER-0822",
    result: "achieved",
    executedAction: "LOI submitted at $3.95M; exclusivity secured; due diligence engaged",
    executedAt: "Apr 16, 08:51",
    executedBy: "Stephen Lutar",
    executedByRole: "CEO",
    outcomeRecordedAt: "Apr 28, 16:00",
    predictedImpact: "$1.25M projected equity gain on $3.95M basis",
    actualImpact: "LOI accepted at $3.95M — exclusivity locked, due diligence on track, projected IRR 18.4% confirmed",
    accuracy: 92,
    feedbackNote: "Speed-to-LOI was decisive. Recommend pre-authorizing acquisitions under $5M with IC standing approval.",
    laterImpact: "Pipeline strengthened — broker brought 2 additional off-market opportunities citing execution speed",
    timeToOutcome: "12d 7h 9m",
  },
};

const SCENARIO_DATA: Record<DemoScenarioKey, ScenarioPanelData> = {
  vessels: VESSELS_DATA,
  aegis: AEGIS_DATA,
  terra: TERRA_DATA,
};

function StepIndicator({ steps, activeIndex, onStepClick }: { steps: LoopStep[]; activeIndex: number; onStepClick: (i: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center shrink-0">
            <button
              onClick={() => onStepClick(i)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: isActive ? `${step.color}15` : isPast ? "rgba(255,255,255,0.02)" : "transparent",
                border: `1px solid ${isActive ? `${step.color}40` : isPast ? BORDER.muted : "transparent"}`,
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{
                  background: isActive ? `${step.color}20` : isPast ? "rgba(107,143,113,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? `${step.color}40` : isPast ? "rgba(107,143,113,0.3)" : BORDER.muted}`,
                }}
              >
                {isPast ? (
                  <CheckCircle className="w-2.5 h-2.5" style={{ color: "#6b8f71" }} />
                ) : (
                  <Icon className="w-2.5 h-2.5" style={{ color: isActive ? step.color : TEXT.muted }} />
                )}
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: isActive ? step.color : isPast ? "#6b8f71" : TEXT.muted }}
              >
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <ArrowRight className="w-3 h-3 mx-0.5 shrink-0" style={{ color: isPast ? "rgba(107,143,113,0.4)" : TEXT.muted }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SignalStep({ data }: { data: ScenarioPanelData }) {
  const sig = data.signal;
  const sevColor = sig.severity === "critical" ? "#c45a4a" : sig.severity === "high" ? "#c8953c" : "#8b7ac8";
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${sevColor}1a`, border: `2px solid ${sevColor}4d` }}>
            <Radio className="w-5 h-5" style={{ color: sevColor }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: `${sevColor}20`, color: sevColor }}>{sig.severity}</span>
              <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{sig.id}</span>
              <span className="text-[9px] font-mono ml-auto" style={{ color: TEXT.muted }}>{sig.detectedAt}</span>
            </div>
            <div className="text-base font-bold mb-1" style={{ color: TEXT.primary }}>{sig.title}</div>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: TEXT.tertiary }}>
              <span className="px-1.5 py-0.5 rounded" style={{ background: `${sig.packColor}12`, border: `1px solid ${sig.packColor}30`, color: sig.packColor }}>{sig.pack}</span>
              <span>Source: {sig.source}</span>
              <span className="font-bold" style={{ color: sevColor }}>Risk: {sig.riskEstimate}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {sig.entities.map(e => (
            <div key={e} className="px-3 py-2 rounded-lg text-center" style={{ background: `${sig.packColor}0d`, border: `1px solid ${sig.packColor}1f` }}>
              <div className="text-[10px] font-semibold" style={{ color: sig.packColor }}>{e}</div>
              <div className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: TEXT.muted }}>{sig.entityLabel}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TEXT.muted }}>Evidence Rail</div>
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(212,160,84,0.06)", border: "1px solid rgba(212,160,84,0.14)", color: "rgba(212,160,84,0.5)" }}>
            synthetic
          </span>
        </div>
        <div className="space-y-1.5">
          {sig.evidence.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: TEXT.tertiary }}>{ev.type}</span>
              <span className="text-[10px]" style={{ color: TEXT.secondary }}>{ev.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContextStep({ data }: { data: ScenarioPanelData }) {
  const ctx = data.context;
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4" style={{ color: "#ec4899" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ec4899" }}>Cross-Domain Intelligence</span>
        </div>
        <div className="space-y-2">
          {ctx.crossDomainSignals.map((sig, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${sig.color}12`, border: `1px solid ${sig.color}30`, color: sig.color }}>{sig.pack}</span>
              <span className="text-[10px]" style={{ color: TEXT.secondary }}>{sig.signal}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
          <div className="text-2xl font-bold font-mono" style={{ color: "#ec4899" }}>{ctx.historicalMatches}</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: TEXT.muted }}>Historical Matches</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
          <div className="text-2xl font-bold font-mono" style={{ color: "#ec4899" }}>{ctx.patternConfidence}%</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: TEXT.muted }}>Pattern Confidence</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
          <div className="text-2xl font-bold font-mono" style={{ color: "#ec4899" }}>{ctx.enrichmentSources.length}</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: TEXT.muted }}>Data Sources</div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Enrichment Sources</div>
        <div className="flex flex-wrap gap-1.5">
          {ctx.enrichmentSources.map(src => (
            <span key={src} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.muted}`, color: TEXT.secondary }}>{src}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationStep({ data }: { data: ScenarioPanelData }) {
  const rec = data.recommendation;
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,122,200,0.1)", border: "2px solid rgba(139,122,200,0.3)" }}>
            <Zap className="w-5 h-5" style={{ color: "#8b7ac8" }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{rec.id}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Cpu className="w-3 h-3" style={{ color: TEXT.tertiary }} />
                <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{rec.modelId}</span>
              </div>
            </div>
            <div className="text-base font-bold mb-2" style={{ color: TEXT.primary }}>{rec.text}</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full" style={{ width: `${rec.confidence}%`, background: "#8b7ac8" }} />
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: "#8b7ac8" }}>{rec.confidence}%</span>
              </div>
              <span className="text-[9px]" style={{ color: TEXT.muted }}>confidence</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TEXT.muted }}>Reasoning Chain</div>
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(212,160,84,0.06)", border: "1px solid rgba(212,160,84,0.14)", color: "rgba(212,160,84,0.5)" }}>
            synthetic
          </span>
        </div>
        <div className="space-y-1.5">
          {rec.reasoning.map((r, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(139,122,200,0.03)", border: `1px solid rgba(139,122,200,0.08)` }}>
              <span className="text-[9px] font-bold font-mono shrink-0 mt-0.5" style={{ color: "#8b7ac8" }}>{i + 1}.</span>
              <span className="text-[10px]" style={{ color: TEXT.secondary }}>{r}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "rgba(200,149,60,0.03)", border: "1px solid rgba(200,149,60,0.1)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#c8953c" }}>Alternative Considered</div>
        <div className="text-[10px]" style={{ color: TEXT.secondary }}>{rec.alternativeAction}</div>
      </div>
    </div>
  );
}

function SimulationStep({ data }: { data: ScenarioPanelData }) {
  return (
    <MonteCarloSimPanel
      scenarios={data.simulation.scenarios}
      sensitivityDrivers={data.simulation.drivers}
      iterations={10000}
    />
  );
}

function PolicyStep({ data }: { data: ScenarioPanelData }) {
  return (
    <PolicyGatePanel
      finalOutcome="approved"
      evaluations={data.policy.evaluations}
      approvalChain={[]}
      auditTrail={data.policy.auditTrail.slice(0, 4)}
    />
  );
}

function ApprovalStep({ data }: { data: ScenarioPanelData }) {
  return (
    <PolicyGatePanel
      finalOutcome="approved"
      evaluations={[]}
      approvalChain={data.policy.approvalChain}
      auditTrail={data.policy.auditTrail.slice(4, 10)}
    />
  );
}

function ExecutionStep({ data }: { data: ScenarioPanelData }) {
  const ex = data.execution;
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <Play className="w-4 h-4" style={{ color: "#6366f1" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#6366f1" }}>Workflow Execution</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#6366f1" }}>
              Action Receipt
            </span>
          </div>
          <div className="text-[9px] font-mono mt-0.5" style={{ color: TEXT.muted }}>Governed execution log — every step authorized, timed, and recorded</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(212,160,84,0.06)", border: "1px solid rgba(212,160,84,0.12)", color: "rgba(212,160,84,0.5)" }}>synthetic</span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(107,143,113,0.12)", color: "#6b8f71" }}>COMPLETED</span>
        </div>
      </div>
      <div className="p-5">
        <div className="space-y-3">
          {ex.steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(107,143,113,0.12)", border: "1px solid rgba(107,143,113,0.3)" }}>
                <CheckCircle className="w-3 h-3" style={{ color: "#6b8f71" }} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>{s.step}</div>
                <div className="text-[9px]" style={{ color: TEXT.tertiary }}>{s.detail}</div>
              </div>
              <span className="text-[9px] font-mono shrink-0" style={{ color: TEXT.muted }}>{s.time}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: TEXT.muted }}>Total Duration</div>
              <span className="text-sm font-bold font-mono" style={{ color: "#6366f1" }}>{ex.durationLabel}</span>
            </div>
            <div>
              <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: TEXT.muted }}>Steps</div>
              <span className="text-sm font-bold font-mono" style={{ color: "#6366f1" }}>{ex.stepsCompleted}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: "#6b8f71" }}>
            <CheckCircle className="w-3 h-3" />
            <span className="font-bold">All steps executed successfully</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofStep({ data }: { data: ScenarioPanelData }) {
  return <ProofProvenancePanel entries={data.proof} />;
}

function OutcomeStep({ data }: { data: ScenarioPanelData }) {
  return <OutcomePanel outcome={data.outcome} />;
}

const DEMO_ROUTE_STEPS_5MIN = [
  { step: 1, label: "Signal", href: "#", time: "0:00" },
  { step: 5, label: "Policy Gate", href: "#", time: "1:30" },
  { step: 6, label: "Approval", href: "#", time: "2:15" },
  { step: 8, label: "Proof Chain", href: "#", time: "3:15" },
  { step: 9, label: "Outcome", href: "#", time: "4:00" },
];

function isDemoEnvironment(): boolean {
  const override = (import.meta.env.VITE_DEPLOY_ENV as string | undefined)?.toLowerCase();
  if (override) {
    return override === "demo" || override === "simulated";
  }
  return !import.meta.env.PROD;
}

function ScenarioSwitcher({
  current,
  onSelect,
}: {
  current: DemoScenarioKey;
  onSelect: (k: DemoScenarioKey) => void;
}) {
  return (
    <div
      className="rounded-xl p-3 mb-1"
      style={{ background: "rgba(212,160,84,0.04)", border: "1px solid rgba(212,160,84,0.18)" }}
      data-testid="governed-loop-scenario-switcher"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <FlaskConical className="w-3.5 h-3.5 shrink-0" style={{ color: "#d4a054" }} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: "#d4a054" }}>Demo Scenario</span>
          <span
            className="text-[8px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: "rgba(212,160,84,0.08)", border: "1px solid rgba(212,160,84,0.18)", color: "rgba(212,160,84,0.7)" }}
          >
            Synthetic data
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {DEMO_SCENARIOS.map((s) => {
            const isActive = s.key === current;
            return (
              <button
                key={s.key}
                onClick={() => onSelect(s.key)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: isActive ? `${s.color}20` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? `${s.color}55` : BORDER.muted}`,
                  color: isActive ? s.color : TEXT.secondary,
                }}
                aria-pressed={isActive}
                data-testid={`governed-loop-scenario-${s.key}`}
              >
                <span className="text-[12px] leading-none">{s.icon}</span>
                <span className="font-bold uppercase tracking-wider text-[9px]">{s.key}</span>
                <span className="hidden sm:inline text-[9px] font-normal opacity-80">{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DemoScenarioBar({
  data,
  activeStep,
  onStepClick,
}: {
  data: ScenarioPanelData;
  activeStep: number;
  onStepClick: (i: number) => void;
}) {
  const [showGuide, setShowGuide] = useState(false);
  return (
    <div
      className="rounded-xl p-3 mb-1"
      style={{ background: "rgba(212,160,84,0.04)", border: "1px solid rgba(212,160,84,0.12)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: "#d4a054" }} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: "#d4a054" }}>Active Domain</span>
          <span className="text-[9px] font-mono" style={{ color: "rgba(212,160,84,0.55)" }}>·</span>
          <span className="text-[9px] font-mono" style={{ color: "rgba(212,160,84,0.7)" }} data-testid="governed-loop-active-domain">{data.domainLabel}</span>
        </div>
        <button
          onClick={() => setShowGuide(v => !v)}
          className="flex items-center gap-1 text-[8px] font-mono hover:opacity-80 transition-opacity"
          style={{ color: "rgba(212,160,84,0.5)" }}
        >
          <BookOpen className="w-3 h-3" />
          {showGuide ? "Hide" : "5-min route"}
        </button>
      </div>

      {showGuide && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(212,160,84,0.1)" }}>
          <div className="text-[8px] font-mono uppercase tracking-widest mb-2" style={{ color: "rgba(212,160,84,0.5)" }}>
            5-Minute Demo Route — key beats
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {DEMO_ROUTE_STEPS_5MIN.map((r, i) => (
              <div key={r.step} className="flex items-center gap-1.5">
                <button
                  onClick={() => onStepClick(r.step - 1)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all hover:opacity-80"
                  style={{
                    background: activeStep === r.step - 1 ? "rgba(212,160,84,0.15)" : "rgba(212,160,84,0.05)",
                    border: `1px solid ${activeStep === r.step - 1 ? "rgba(212,160,84,0.35)" : "rgba(212,160,84,0.1)"}`,
                    color: activeStep === r.step - 1 ? "#d4a054" : "rgba(212,160,84,0.6)",
                  }}
                >
                  <span className="font-mono text-[8px]" style={{ color: "rgba(212,160,84,0.45)" }}>{r.time}</span>
                  {r.label}
                </button>
                {i < DEMO_ROUTE_STEPS_5MIN.length - 1 && (
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" style={{ color: "rgba(212,160,84,0.2)" }} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-[8px] font-mono" style={{ color: "rgba(212,160,84,0.35)" }}>
            Click any step to jump · Full 15-min route: ops/market/demo-route-final.md
          </div>
        </div>
      )}
    </div>
  );
}

const STEP_COMPONENTS: Record<string, (props: { data: ScenarioPanelData }) => JSX.Element> = {
  signal: SignalStep,
  context: ContextStep,
  recommendation: RecommendationStep,
  simulation: SimulationStep,
  policy: PolicyStep,
  approval: ApprovalStep,
  execution: ExecutionStep,
  proof: ProofStep,
  outcome: OutcomeStep,
};

export default function GovernedDecisionLoop() {
  const [activeStep, setActiveStep] = useState(0);
  const { state, selectScenario } = useDemoMode();
  const scenarioKey = state.currentScenario;
  const data = SCENARIO_DATA[scenarioKey] ?? VESSELS_DATA;
  const currentStep = LOOP_STEPS[activeStep];
  const StepComponent = STEP_COMPONENTS[currentStep.id];
  const showSwitcher = isDemoEnvironment();

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {showSwitcher && (
        <ScenarioSwitcher current={scenarioKey} onSelect={selectScenario} />
      )}
      <DemoScenarioBar data={data} activeStep={activeStep} onStepClick={setActiveStep} />

      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>Lyte · Governed Decision Loop</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: TEXT.primary }}>Governed Decision Loop</h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: TEXT.tertiary }}>
          The canonical loop that makes every decision explainable. Signal enters, context is enriched,
          AI recommends, simulation quantifies risk, policy gates enforce compliance, humans approve,
          the system executes, proof is sealed, and outcomes close the feedback loop.
        </p>
      </div>

      <StepIndicator steps={LOOP_STEPS} activeIndex={activeStep} onStepClick={setActiveStep} />

      <div className="rounded-xl p-4" style={{ background: `${currentStep.color}08`, border: `1px solid ${currentStep.color}20` }}>
        <div className="flex items-center gap-3">
          {(() => { const Icon = currentStep.icon; return <Icon className="w-5 h-5" style={{ color: currentStep.color }} />; })()}
          <div>
            <div className="text-sm font-bold" style={{ color: currentStep.color }}>Step {activeStep + 1}: {currentStep.label}</div>
            <div className="text-[10px]" style={{ color: TEXT.secondary }}>{currentStep.description}</div>
          </div>
        </div>
      </div>

      <StepComponent data={data} />

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.muted}`, color: TEXT.secondary }}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous
        </button>
        <div className="flex items-center gap-1">
          {LOOP_STEPS.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === activeStep ? LOOP_STEPS[i].color : i < activeStep ? "#6b8f71" : TEXT.muted }}
              aria-label={`Go to step ${i + 1}: ${step.label}`}
              aria-current={i === activeStep ? "step" : undefined}
            />
          ))}
        </div>
        <button
          onClick={() => setActiveStep(Math.min(LOOP_STEPS.length - 1, activeStep + 1))}
          disabled={activeStep === LOOP_STEPS.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
          style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
