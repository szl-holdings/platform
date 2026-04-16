/**
 * ATLAS Execution Engine — Shared Domain Execution Pattern
 *
 * Provides domain-specific workflow definitions, step handlers, policy
 * registrations, and in-memory signal/evidence/outcome stores for all
 * six SZL domain packs:
 *
 *   Aegis (Firestorm)  — security incident response
 *   Vessels            — maritime operations
 *   Terra              — real estate intelligence
 *   PRISM Counsel      — legal matter management
 *   Carlota Jo         — concierge service operations
 *   IMPERIUM           — infrastructure governance
 *
 * Each domain follows the canonical ATLAS execution flow:
 *   Signal → Enrichment → Recommendation → Approval → Execution
 *   → Evidence → Outcome
 */

import { randomUUID } from "crypto";
import {
  rankSignalGroups,
  type Signal,
  type SignalGroup,
  type Recommendation,
} from "@szl-holdings/decision-engine";
import {
  registerPolicy,
  checkAction,
  type Policy,
  type EvaluationRequest,
  type PolicyEvaluationResult,
} from "@szl-holdings/policy-engine";
import {
  executeWorkflow,
  recordRun,
  listRuns,
  getRunById,
  registerStepHandler,
  type WorkflowDefinition,
  type WorkflowRun,
  type ActionEngineResult,
} from "@szl-holdings/action-engine";
import { logger } from "./logger.js";

// ─── In-Memory Signal Store (per-domain ring buffer) ─────────────────────────

const MAX_SIGNALS = 500;
const domainSignalStore: Map<string, AtlasSignalRecord[]> = new Map();

export interface AtlasSignalRecord {
  id: string;
  domain: string;
  signalType: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  confidence: number;
  source: string;
  payload: Record<string, unknown>;
  status: "raw" | "normalized" | "processed" | "acknowledged" | "resolved";
  tenantId: string;
  workflowId?: string;
  createdAt: string;
  updatedAt: string;
}

export function ingestSignal(record: Omit<AtlasSignalRecord, "id" | "createdAt" | "updatedAt">): AtlasSignalRecord {
  const now = new Date().toISOString();
  const signal: AtlasSignalRecord = { ...record, id: randomUUID(), createdAt: now, updatedAt: now };
  const bucket = domainSignalStore.get(record.domain) ?? [];
  bucket.push(signal);
  if (bucket.length > MAX_SIGNALS) bucket.shift();
  domainSignalStore.set(record.domain, bucket);
  logger.info({ domain: record.domain, signalId: signal.id, signalType: record.signalType }, "atlas:signal ingested");
  return signal;
}

export function getSignals(domain: string, limit = 50): AtlasSignalRecord[] {
  const bucket = domainSignalStore.get(domain) ?? [];
  return bucket.slice(-limit).reverse();
}

export function updateSignalStatus(domain: string, signalId: string, status: AtlasSignalRecord["status"]): boolean {
  const bucket = domainSignalStore.get(domain) ?? [];
  const signal = bucket.find(s => s.id === signalId);
  if (!signal) return false;
  signal.status = status;
  signal.updatedAt = new Date().toISOString();
  return true;
}

// ─── In-Memory Evidence Store ─────────────────────────────────────────────────

export interface AtlasEvidenceRecord {
  id: string;
  domain: string;
  workflowId: string;
  label: string;
  value: string;
  source: string;
  capturedBy: string;
  capturedAt: string;
  immutable: boolean;
}

const evidenceStore: AtlasEvidenceRecord[] = [];

export function captureEvidence(record: Omit<AtlasEvidenceRecord, "id" | "capturedAt">): AtlasEvidenceRecord {
  const ev: AtlasEvidenceRecord = { ...record, id: randomUUID(), capturedAt: new Date().toISOString() };
  evidenceStore.push(ev);
  logger.info({ domain: record.domain, workflowId: record.workflowId, evidenceId: ev.id }, "atlas:evidence captured");
  return ev;
}

export function getEvidence(domain: string, workflowId?: string): AtlasEvidenceRecord[] {
  return evidenceStore.filter(e => e.domain === domain && (!workflowId || e.workflowId === workflowId));
}

// ─── In-Memory Outcome Store ──────────────────────────────────────────────────

export interface AtlasOutcomeRecord {
  id: string;
  domain: string;
  workflowId: string;
  signalId?: string;
  recommendationId?: string;
  title: string;
  summary: string;
  status: "success" | "partial" | "failed" | "rolled_back";
  businessImpact?: {
    financialImpactUsd?: number;
    operationalSeverity?: string;
    entitiesAffected?: number;
  };
  recordedBy: string;
  recordedAt: string;
  evidence: string[];
  metadata?: Record<string, unknown>;
}

const outcomeStore: AtlasOutcomeRecord[] = [];

export function recordOutcome(record: Omit<AtlasOutcomeRecord, "id" | "recordedAt">): AtlasOutcomeRecord {
  const outcome: AtlasOutcomeRecord = { ...record, id: randomUUID(), recordedAt: new Date().toISOString() };
  outcomeStore.push(outcome);
  logger.info({ domain: record.domain, workflowId: record.workflowId, outcomeId: outcome.id, status: record.status }, "atlas:outcome recorded");
  return outcome;
}

export function getOutcomes(domain: string, limit = 50): AtlasOutcomeRecord[] {
  return outcomeStore.filter(o => o.domain === domain).slice(-limit).reverse();
}

// ─── Evaluation Hook Store ────────────────────────────────────────────────────

export interface EvaluationHookRecord {
  id: string;
  domain: string;
  workflowId: string;
  workflowName: string;
  triggerSignalId?: string;
  replayable: boolean;
  snapshotAt: string;
  signalSnapshot: AtlasSignalRecord[];
  runSnapshot: WorkflowRun;
  benchmarkMetrics?: {
    latencyMs?: number;
    stepsCompleted?: number;
    stepsFailed?: number;
    policyChecks?: number;
    policiesBlocked?: number;
    evidenceCount?: number;
  };
}

const evaluationHookStore: EvaluationHookRecord[] = [];

export function registerEvaluationHook(hook: Omit<EvaluationHookRecord, "id" | "snapshotAt">): EvaluationHookRecord {
  const record: EvaluationHookRecord = { ...hook, id: randomUUID(), snapshotAt: new Date().toISOString() };
  evaluationHookStore.push(record);
  logger.info({ domain: hook.domain, hookId: record.id, workflowId: hook.workflowId }, "atlas:evaluation-hook registered");
  return record;
}

export function getEvaluationHooks(domain: string): EvaluationHookRecord[] {
  return evaluationHookStore.filter(h => h.domain === domain);
}

export function getEvaluationHookById(hookId: string): EvaluationHookRecord | undefined {
  return evaluationHookStore.find(h => h.id === hookId);
}

// ─── Domain Signal → Decision Engine Bridge ───────────────────────────────────

export function buildSignalForDecisionEngine(record: AtlasSignalRecord): Signal {
  const SEVERITY_CONFIDENCE: Record<string, number> = {
    critical: 1.0, high: 0.85, medium: 0.65, low: 0.45, info: 0.25,
  };
  return {
    id: record.id,
    domain: record.domain,
    type: record.signalType,
    value: record.payload,
    source: record.source,
    sourceId: record.id,
    timestamp: Date.now(),
    metadata: {
      severity: record.severity,
      title: record.title,
      description: record.description,
      confidence: record.confidence || SEVERITY_CONFIDENCE[record.severity] || 0.5,
      slaDeadlineMs: record.payload.slaDeadlineMs as number | undefined,
      slaTotalMs: record.payload.slaTotalMs as number | undefined,
    },
  };
}

export async function evaluateSignalsForDomain(
  domain: string,
  signals: AtlasSignalRecord[],
  context?: Record<string, unknown>
): Promise<Recommendation[]> {
  const engineSignals = signals.map(buildSignalForDecisionEngine);

  const DOMAIN_IMPACT_DEFAULTS: Record<string, Partial<SignalGroup["businessImpact"]>> = {
    aegis: { reputationalRisk: "high", regulatoryExposure: true },
    vessels: { reputationalRisk: "medium", regulatoryExposure: true },
    terra: { reputationalRisk: "low" },
    "prism-counsel": { reputationalRisk: "high", regulatoryExposure: true },
    "carlota-jo": { reputationalRisk: "medium" },
    imperium: { reputationalRisk: "medium", regulatoryExposure: false },
  };

  const groups: SignalGroup[] = signals.map((record, idx) => ({
    domain,
    signals: [engineSignals[idx]],
    businessImpact: {
      ...DOMAIN_IMPACT_DEFAULTS[domain],
      financialExposureUsd: (record.payload.financialExposureUsd as number | undefined),
      affectedEntities: (record.payload.affectedEntities as number | undefined),
      crossDomainBlastRadius: (record.payload.crossDomainBlastRadius as string[] | undefined) ?? [],
    },
    confidence: record.confidence || 0.7,
    suggestedAction: (record.payload.suggestedAction as string | undefined) ?? `Investigate ${record.signalType} signal`,
    suggestedOwner: (record.payload.suggestedOwner as string | undefined) ?? "operator",
    estimatedCostUsd: record.payload.estimatedCostUsd as number | undefined,
    customTitle: record.title,
    customSummary: record.description,
    customReasoning: `Signal of type "${record.signalType}" detected with severity "${record.severity}". ${context?.reasoning ?? ""}`,
    evidence: [
      { label: "Signal ID", value: record.id, source: record.source },
      { label: "Signal Type", value: record.signalType, source: "atlas-execution-engine" },
      { label: "Severity", value: record.severity, source: "atlas-execution-engine" },
    ],
  }));

  return rankSignalGroups(groups);
}

// ─── Domain Policy Registration ───────────────────────────────────────────────

const DOMAIN_POLICIES: Policy[] = [
  {
    id: "aegis-high-severity-approval",
    name: "Aegis: High-Severity Incident Approval Gate",
    description: "All critical or high severity security incidents require exec approval before response execution.",
    scope: "domain",
    domain: "aegis",
    actionTypes: ["incident-response", "threat-containment", "threat-eradication"],
    rules: [
      {
        id: "aegis-critical-block",
        name: "Block autonomous action on critical incidents",
        conditions: [{ field: "resource.attributes.severity", operator: "eq", value: "critical" }],
        effect: "require_approval",
        requiredApproverRole: "exec",
        reason: "Critical security incidents require executive approval before automated response.",
        priority: 1000,
      },
      {
        id: "aegis-high-approval",
        name: "Require approval for high severity",
        conditions: [{ field: "resource.attributes.severity", operator: "eq", value: "high" }],
        effect: "require_approval",
        requiredApproverRole: "admin",
        reason: "High severity incidents require admin approval.",
        priority: 900,
      },
    ],
    isActive: true,
    priority: 1000,
    complianceFramework: "NIST-CSF",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "vessels-sanctions-block",
    name: "Vessels: Sanctions Screening Hard Block",
    description: "Any voyage involving a sanctioned entity must be blocked pending legal review.",
    scope: "domain",
    domain: "vessels",
    actionTypes: ["voyage-approval", "cargo-loading", "port-clearance"],
    rules: [
      {
        id: "vessels-sanctions-hard-block",
        name: "Hard block on sanctions match",
        conditions: [{ field: "resource.attributes.sanctionsMatch", operator: "eq", value: true }],
        effect: "block",
        reason: "Sanctions match detected. Voyage blocked pending legal compliance review.",
        priority: 1000,
      },
      {
        id: "vessels-high-risk-approval",
        name: "High-risk voyage approval",
        conditions: [{ field: "resource.attributes.riskScore", operator: "gte", value: 80 }],
        effect: "require_approval",
        requiredApproverRole: "admin",
        reason: "High-risk voyage requires operator approval.",
        priority: 800,
      },
    ],
    isActive: true,
    priority: 1000,
    complianceFramework: "OFAC",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "terra-underwriting-gate",
    name: "Terra: Underwriting Approval Gate",
    description: "Deals above a financial threshold require underwriting review before commitment.",
    scope: "domain",
    domain: "terra",
    actionTypes: ["deal-commit", "offer-submit", "underwriting-approve"],
    rules: [
      {
        id: "terra-high-value-gate",
        name: "High-value deal underwriting review",
        conditions: [{ field: "resource.attributes.dealValueUsd", operator: "gte", value: 5000000 }],
        effect: "require_approval",
        requiredApproverRole: "admin",
        reason: "Deals ≥ $5M require underwriting review.",
        priority: 900,
      },
      {
        id: "terra-distress-legal-review",
        name: "Distressed asset legal review",
        conditions: [{ field: "resource.attributes.isDistressed", operator: "eq", value: true }],
        effect: "require_approval",
        requiredApproverRole: "admin",
        reason: "Distressed asset acquisitions require legal and compliance review.",
        priority: 800,
      },
    ],
    isActive: true,
    priority: 900,
    complianceFramework: "SEC-Reg-D",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "prism-legal-review-gate",
    name: "PRISM Counsel: Legal Review Gate",
    description: "All execution actions on active matters must pass through legal review.",
    scope: "domain",
    domain: "prism-counsel",
    actionTypes: ["filing-submit", "settlement-execute", "motion-file", "discovery-produce"],
    rules: [
      {
        id: "prism-filing-approval",
        name: "Court filing requires counsel review",
        conditions: [{ field: "resource.attributes.requiresCounselReview", operator: "eq", value: true }],
        effect: "require_approval",
        requiredApproverRole: "admin",
        reason: "Court filings and legal submissions require counsel review and sign-off.",
        priority: 1000,
      },
      {
        id: "prism-high-exposure-escalate",
        name: "High exposure matters escalate to partner",
        conditions: [{ field: "resource.attributes.exposureUsd", operator: "gte", value: 1000000 }],
        effect: "escalate",
        escalateTo: "partner",
        reason: "Matters with ≥ $1M exposure require partner escalation.",
        priority: 900,
      },
    ],
    isActive: true,
    priority: 1000,
    complianceFramework: "ABA-Model-Rules",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "carlota-vendor-approval",
    name: "Carlota Jo: Vendor Commitment Approval Gate",
    description: "Vendor commitments above threshold require principal approval.",
    scope: "domain",
    domain: "carlota-jo",
    actionTypes: ["vendor-commit", "booking-confirm", "service-authorize"],
    rules: [
      {
        id: "carlota-high-value-vendor",
        name: "High-value vendor commitment approval",
        conditions: [{ field: "resource.attributes.commitmentValueUsd", operator: "gte", value: 25000 }],
        effect: "require_approval",
        requiredApproverRole: "admin",
        reason: "Vendor commitments ≥ $25K require principal approval.",
        priority: 800,
      },
    ],
    isActive: true,
    priority: 800,
    complianceFramework: "internal",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "imperium-sovereignty-gate",
    name: "IMPERIUM: Sovereignty Change Approval Gate",
    description: "Any change to sovereign classification or cross-boundary data movement requires executive approval.",
    scope: "domain",
    domain: "imperium",
    actionTypes: ["sovereign-reclassify", "cross-boundary-transfer", "policy-override"],
    rules: [
      {
        id: "imperium-sovereign-block",
        name: "Block autonomous sovereignty changes",
        conditions: [{ field: "resource.attributes.affectsSovereignty", operator: "eq", value: true }],
        effect: "require_approval",
        requiredApproverRole: "exec",
        reason: "Sovereignty classification changes require executive approval.",
        priority: 1000,
      },
      {
        id: "imperium-cost-threshold",
        name: "Cost remediation threshold gate",
        conditions: [{ field: "resource.attributes.estimatedSavingsUsd", operator: "gte", value: 100000 }],
        effect: "require_approval",
        requiredApproverRole: "admin",
        reason: "Remediations affecting ≥ $100K in savings require admin approval.",
        priority: 700,
      },
    ],
    isActive: true,
    priority: 1000,
    complianceFramework: "FedRAMP",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function registerDomainPolicies(): void {
  for (const policy of DOMAIN_POLICIES) {
    registerPolicy(policy);
  }
  logger.info({ count: DOMAIN_POLICIES.length }, "atlas:domain policies registered");
}

export function checkDomainPolicy(request: EvaluationRequest): PolicyEvaluationResult {
  return checkAction(request);
}

// ─── Domain Workflow Definitions ──────────────────────────────────────────────

export const DOMAIN_WORKFLOWS: Record<string, WorkflowDefinition> = {
  "aegis-incident-response": {
    id: "aegis-incident-response",
    name: "Aegis Security Incident Response",
    description: "End-to-end security incident response: triage → containment → eradication → recovery → post-incident review.",
    domain: "aegis",
    executionMode: "semi_auto",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "step",
    steps: [
      { id: "triage", name: "Triage & Classification", handler: "aegis.triage", executionMode: "manual", requiresApproval: false, description: "Assess severity, scope, and impact of the security incident." },
      { id: "enrich", name: "Signal Enrichment", handler: "aegis.enrich", executionMode: "semi_auto", requiresApproval: false, description: "Correlate with threat intel feeds and MITRE ATT&CK mappings." },
      { id: "recommend", name: "Response Recommendation", handler: "aegis.recommend", executionMode: "semi_auto", requiresApproval: false, description: "Generate ranked response options with confidence scores." },
      { id: "approve", name: "Approval Gate", handler: "aegis.approve", executionMode: "manual", requiresApproval: true, approverRole: "admin", description: "Human approval gate before containment execution." },
      { id: "contain", name: "Containment", handler: "aegis.contain", executionMode: "semi_auto", requiresApproval: false, rollbackHandler: "aegis.rollback-contain", description: "Execute containment actions to isolate the threat." },
      { id: "eradicate", name: "Eradication", handler: "aegis.eradicate", executionMode: "semi_auto", requiresApproval: false, description: "Remove the threat from affected systems." },
      { id: "recover", name: "Recovery", handler: "aegis.recover", executionMode: "semi_auto", requiresApproval: false, description: "Restore affected systems to normal operations." },
      { id: "evidence", name: "Evidence Capture", handler: "aegis.capture-evidence", executionMode: "semi_auto", requiresApproval: false, description: "Collect forensic artifacts and audit chain entries." },
      { id: "outcome", name: "Outcome Recording", handler: "aegis.record-outcome", executionMode: "semi_auto", requiresApproval: false, description: "Record incident closure, MTTR, and business impact." },
    ],
    metadata: { domain: "aegis", category: "incident-response", atlasVersion: "1.0" },
  },

  "vessels-voyage-risk": {
    id: "vessels-voyage-risk",
    name: "Vessels Voyage Risk & Execution",
    description: "Voyage risk assessment through to execution: signal → risk estimate → operator plan → escalation → execution record.",
    domain: "vessels",
    executionMode: "semi_auto",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "step",
    steps: [
      { id: "signal-ingest", name: "Signal Ingestion", handler: "vessels.ingest-signal", executionMode: "semi_auto", requiresApproval: false, description: "Normalize voyage/sanctions/anomaly signal data." },
      { id: "risk-estimate", name: "Business Risk Estimation", handler: "vessels.estimate-risk", executionMode: "semi_auto", requiresApproval: false, description: "Compute financial and operational risk for the voyage." },
      { id: "sanctions-check", name: "Sanctions & Compliance Screening", handler: "vessels.sanctions-check", executionMode: "semi_auto", requiresApproval: false, description: "Screen vessel, cargo, and counterparties against sanctions lists." },
      { id: "operator-plan", name: "Operator Action Plan", handler: "vessels.build-action-plan", executionMode: "semi_auto", requiresApproval: false, description: "Generate operator-ready action plan with risk mitigations." },
      { id: "approve", name: "Approval Gate", handler: "vessels.approve", executionMode: "manual", requiresApproval: true, approverRole: "operator", description: "Operator approval of voyage execution plan." },
      { id: "execute-voyage", name: "Voyage Execution", handler: "vessels.execute-voyage", executionMode: "semi_auto", requiresApproval: false, rollbackHandler: "vessels.rollback-voyage", description: "Record voyage commencement and update AIS tracking." },
      { id: "evidence", name: "Execution Record", handler: "vessels.capture-evidence", executionMode: "semi_auto", requiresApproval: false, description: "Capture bill of lading, charter party, and cargo manifest." },
      { id: "outcome", name: "Outcome Recording", handler: "vessels.record-outcome", executionMode: "semi_auto", requiresApproval: false, description: "Record voyage P&L, compliance status, and incident log." },
    ],
    metadata: { domain: "vessels", category: "voyage-operations", atlasVersion: "1.0" },
  },

  "terra-deal-underwriting": {
    id: "terra-deal-underwriting",
    name: "Terra Deal Thesis & Underwriting",
    description: "Property signal → deal thesis → underwriting → legal review → action log.",
    domain: "terra",
    executionMode: "semi_auto",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "step",
    steps: [
      { id: "signal-ingest", name: "Signal Ingestion", handler: "terra.ingest-signal", executionMode: "semi_auto", requiresApproval: false, description: "Normalize property/ownership/distress signal." },
      { id: "deal-thesis", name: "Deal Thesis Generation", handler: "terra.generate-thesis", executionMode: "semi_auto", requiresApproval: false, description: "Generate investment thesis with pro forma and IRR projections." },
      { id: "underwriting", name: "Underwriting Workflow", handler: "terra.underwrite", executionMode: "semi_auto", requiresApproval: false, description: "Run automated underwriting checks and stress tests." },
      { id: "legal-review", name: "Legal & Compliance Review", handler: "terra.legal-review", executionMode: "manual", requiresApproval: true, approverRole: "admin", description: "Legal and compliance review gate for the deal." },
      { id: "approve", name: "Deal Approval", handler: "terra.approve-deal", executionMode: "manual", requiresApproval: true, approverRole: "exec", description: "Executive approval to proceed with the deal." },
      { id: "execute-action", name: "Action Execution", handler: "terra.execute-action", executionMode: "semi_auto", requiresApproval: false, rollbackHandler: "terra.rollback-action", description: "Execute the approved deal action (LOI, offer, acquisition)." },
      { id: "evidence", name: "Evidence Capture", handler: "terra.capture-evidence", executionMode: "semi_auto", requiresApproval: false, description: "Capture executed documents, title searches, and appraisals." },
      { id: "outcome", name: "Outcome Recording", handler: "terra.record-outcome", executionMode: "semi_auto", requiresApproval: false, description: "Record deal outcome, acquisition cost, and projected returns." },
    ],
    metadata: { domain: "terra", category: "deal-execution", atlasVersion: "1.0" },
  },

  "prism-matter-execution": {
    id: "prism-matter-execution",
    name: "PRISM Counsel Matter Execution",
    description: "Matter/filing/compliance event → recommendation → legal review → execution trail → outcome.",
    domain: "prism-counsel",
    executionMode: "manual",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: false,
    rollbackPolicy: "none",
    steps: [
      { id: "signal-ingest", name: "Matter Event Ingestion", handler: "prism.ingest-event", executionMode: "manual", requiresApproval: false, description: "Normalize matter filing or compliance event." },
      { id: "recommend", name: "Recommendation Generation", handler: "prism.generate-recommendation", executionMode: "semi_auto", requiresApproval: false, description: "Generate legal strategy recommendations with precedent analysis." },
      { id: "legal-review", name: "Legal Review Gate", handler: "prism.legal-review", executionMode: "manual", requiresApproval: true, approverRole: "admin", description: "Counsel reviews and approves recommended legal strategy." },
      { id: "client-approval", name: "Client Approval Gate", handler: "prism.client-approval", executionMode: "manual", requiresApproval: true, approverRole: "client", description: "Client approval of legal strategy before execution." },
      { id: "execute-filing", name: "Execution & Filing", handler: "prism.execute-filing", executionMode: "manual", requiresApproval: false, description: "Execute the approved legal action (filing, motion, settlement)." },
      { id: "evidence", name: "Execution Trail Capture", handler: "prism.capture-trail", executionMode: "manual", requiresApproval: false, description: "Capture filing confirmations, docket entries, and communications." },
      { id: "outcome", name: "Recovery/Risk Outcome", handler: "prism.record-outcome", executionMode: "manual", requiresApproval: false, description: "Record matter outcome, recovery amount, and risk disposition." },
    ],
    metadata: { domain: "prism-counsel", category: "legal-execution", atlasVersion: "1.0" },
  },

  "carlota-concierge-workflow": {
    id: "carlota-concierge-workflow",
    name: "Carlota Jo Concierge Workflow",
    description: "Client/property ops/vendor signal → concierge workflow → approval → service completion proof.",
    domain: "carlota-jo",
    executionMode: "semi_auto",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "step",
    steps: [
      { id: "signal-ingest", name: "Request Signal Ingestion", handler: "carlota.ingest-request", executionMode: "semi_auto", requiresApproval: false, description: "Capture and normalize client/property/vendor service request." },
      { id: "enrichment", name: "Request Enrichment", handler: "carlota.enrich-request", executionMode: "semi_auto", requiresApproval: false, description: "Enrich with client preferences, property context, and vendor data." },
      { id: "concierge-plan", name: "Concierge Workflow Planning", handler: "carlota.plan-workflow", executionMode: "semi_auto", requiresApproval: false, description: "Generate service execution plan with vendor options and timeline." },
      { id: "approve", name: "Approval Gate", handler: "carlota.approve", executionMode: "manual", requiresApproval: true, approverRole: "admin", description: "Principal approval for high-value or complex service requests." },
      { id: "vendor-commit", name: "Vendor Commitment", handler: "carlota.vendor-commit", executionMode: "semi_auto", requiresApproval: false, rollbackHandler: "carlota.rollback-vendor", description: "Commit vendor booking and generate service order." },
      { id: "service-execution", name: "Service Execution", handler: "carlota.execute-service", executionMode: "semi_auto", requiresApproval: false, description: "Coordinate and track service delivery." },
      { id: "evidence", name: "Service Completion Proof", handler: "carlota.capture-proof", executionMode: "semi_auto", requiresApproval: false, description: "Capture service completion confirmation, receipts, and photos." },
      { id: "outcome", name: "Outcome Recording", handler: "carlota.record-outcome", executionMode: "semi_auto", requiresApproval: false, description: "Record client satisfaction, service cost, and completion status." },
    ],
    metadata: { domain: "carlota-jo", category: "concierge-operations", atlasVersion: "1.0" },
  },

  "imperium-remediation": {
    id: "imperium-remediation",
    name: "IMPERIUM Infrastructure Remediation",
    description: "Infra/cost/policy/sovereignty signal → remediation plan → approval → evidence and savings log.",
    domain: "imperium",
    executionMode: "semi_auto",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "full",
    steps: [
      { id: "signal-ingest", name: "Infrastructure Signal Ingestion", handler: "imperium.ingest-signal", executionMode: "semi_auto", requiresApproval: false, description: "Normalize infra/cost/policy/sovereignty signal." },
      { id: "enrich", name: "Signal Enrichment", handler: "imperium.enrich", executionMode: "semi_auto", requiresApproval: false, description: "Correlate with cloud cost data, policy inventory, and sovereignty map." },
      { id: "remediation-plan", name: "Remediation Plan Generation", handler: "imperium.plan-remediation", executionMode: "semi_auto", requiresApproval: false, description: "Generate ranked remediation options with cost/savings projections." },
      { id: "approve", name: "Approval Gate", handler: "imperium.approve", executionMode: "manual", requiresApproval: true, approverRole: "admin", description: "Admin approval of remediation plan before automation." },
      { id: "automate", name: "Automated Remediation", handler: "imperium.automate", executionMode: "semi_auto", requiresApproval: false, rollbackHandler: "imperium.rollback", description: "Execute approved remediation via IaC or cloud API." },
      { id: "verify", name: "Verification & Validation", handler: "imperium.verify", executionMode: "semi_auto", requiresApproval: false, description: "Verify remediation effectiveness and policy compliance." },
      { id: "evidence", name: "Evidence & Savings Log", handler: "imperium.capture-evidence", executionMode: "semi_auto", requiresApproval: false, description: "Log before/after state, actual savings, and compliance attestation." },
      { id: "outcome", name: "Outcome Recording", handler: "imperium.record-outcome", executionMode: "semi_auto", requiresApproval: false, description: "Record remediation outcome, actual vs projected savings, and SLA impact." },
    ],
    metadata: { domain: "imperium", category: "infrastructure-governance", atlasVersion: "1.0" },
  },
};

// ─── Step Handler Registration ────────────────────────────────────────────────

function makePassthroughHandler(domain: string, step: string) {
  return async (
    parameters: Record<string, unknown>,
    context: { runId: string; stepId: string; isDryRun: boolean; isSimulation: boolean }
  ): Promise<Record<string, unknown>> => {
    logger.info({ domain, step, runId: context.runId, isDryRun: context.isDryRun, isSimulation: context.isSimulation }, `atlas:step:${domain}.${step}`);
    return {
      domain,
      step,
      runId: context.runId,
      executedAt: new Date().toISOString(),
      isDryRun: context.isDryRun,
      isSimulation: context.isSimulation,
      status: "completed",
      parameters,
    };
  };
}

export function registerDomainStepHandlers(): void {
  const domainSteps: Array<[string, string[]]> = [
    ["aegis", ["triage", "enrich", "recommend", "approve", "contain", "eradicate", "recover", "capture-evidence", "record-outcome", "rollback-contain"]],
    ["vessels", ["ingest-signal", "estimate-risk", "sanctions-check", "build-action-plan", "approve", "execute-voyage", "capture-evidence", "record-outcome", "rollback-voyage"]],
    ["terra", ["ingest-signal", "generate-thesis", "underwrite", "legal-review", "approve-deal", "execute-action", "capture-evidence", "record-outcome", "rollback-action"]],
    ["prism", ["ingest-event", "generate-recommendation", "legal-review", "client-approval", "execute-filing", "capture-trail", "record-outcome"]],
    ["carlota", ["ingest-request", "enrich-request", "plan-workflow", "approve", "vendor-commit", "execute-service", "capture-proof", "record-outcome", "rollback-vendor"]],
    ["imperium", ["ingest-signal", "enrich", "plan-remediation", "approve", "automate", "verify", "capture-evidence", "record-outcome", "rollback"]],
  ];

  for (const [domain, steps] of domainSteps) {
    for (const step of steps) {
      registerStepHandler(`${domain}.${step}`, makePassthroughHandler(domain, step));
    }
  }

  logger.info("atlas:step-handlers registered for all 6 domains");
}

// ─── Domain Execution Orchestration ──────────────────────────────────────────

export interface DomainExecutionRequest {
  domain: string;
  workflowKey: string;
  signalIds?: string[];
  recommendationId?: string;
  approvedBy?: string;
  isDryRun?: boolean;
  isSimulation?: boolean;
  tenantId?: string;
  initiatedBy?: string;
  metadata?: Record<string, unknown>;
}

export async function executedomainWorkflow(req: DomainExecutionRequest): Promise<ActionEngineResult> {
  const definition = DOMAIN_WORKFLOWS[req.workflowKey];
  if (!definition) throw new Error(`Unknown workflow: ${req.workflowKey}`);

  const result = await executeWorkflow({
    definition,
    initiatedBy: req.initiatedBy ?? "system",
    tenantId: req.tenantId,
    recommendationId: req.recommendationId,
    isDryRun: req.isDryRun ?? false,
    isSimulation: req.isSimulation ?? false,
    approvedBy: req.approvedBy,
    metadata: {
      signalIds: req.signalIds,
      atlasExecutionPattern: true,
      domain: req.domain,
      ...req.metadata,
    },
  });

  await recordRun(result.run);

  if (!req.isDryRun && !req.isSimulation) {
    const signals = req.signalIds ? getSignals(req.domain, 100).filter(s => req.signalIds!.includes(s.id)) : [];
    registerEvaluationHook({
      domain: req.domain,
      workflowId: result.run.runId,
      workflowName: definition.name,
      triggerSignalId: req.signalIds?.[0],
      replayable: true,
      signalSnapshot: signals,
      runSnapshot: result.run,
      benchmarkMetrics: {
        latencyMs: result.run.completedAt ? result.run.completedAt - result.run.startedAt : undefined,
        stepsCompleted: (result.run.steps as Array<{ status: string }>).filter(s => s.status === "completed").length,
        stepsFailed: (result.run.steps as Array<{ status: string }>).filter(s => s.status === "failed").length,
      },
    });
  }

  return result;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

let _initialized = false;
export function initializeAtlasExecutionEngine(): void {
  if (_initialized) return;
  registerDomainPolicies();
  registerDomainStepHandlers();
  _initialized = true;
  logger.info("atlas:execution-engine initialized for all 6 domains");
}
