/**
 * ATLAS Execution Engine — Shared Domain Execution Pattern
 *
 * Provides domain-specific workflow definitions, step handlers, policy
 * registrations, and DB-backed signal/evidence/outcome stores for all
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
  type PolicyEvaluation,
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
import { db, atlasSignalsTable, atlasEvidenceTable, atlasOutcomesTable, atlasRunsTable } from "@szl-holdings/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "./logger.js";
import { dbRecordWorkflowRun } from "./decisioning-store.js";

// ─── Signal Store (DB-backed) ─────────────────────────────────────────────────

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

export async function ingestSignal(record: Omit<AtlasSignalRecord, "id" | "createdAt" | "updatedAt">): Promise<AtlasSignalRecord> {
  const now = new Date();
  const id = randomUUID();
  await db.insert(atlasSignalsTable).values({
    id,
    domain: record.domain,
    signalType: record.signalType,
    severity: record.severity,
    title: record.title,
    description: record.description,
    confidence: record.confidence,
    source: record.source,
    payload: record.payload,
    status: record.status,
    tenantId: record.tenantId,
    workflowId: record.workflowId ?? null,
    createdAt: now,
    updatedAt: now,
  });
  const signal: AtlasSignalRecord = { ...record, id, createdAt: now.toISOString(), updatedAt: now.toISOString() };
  logger.info({ domain: record.domain, signalId: signal.id, signalType: record.signalType }, "atlas:signal ingested");
  return signal;
}

export async function getSignals(domain: string, limit = 50, tenantId?: string): Promise<AtlasSignalRecord[]> {
  const where = tenantId
    ? and(eq(atlasSignalsTable.domain, domain), eq(atlasSignalsTable.tenantId, tenantId))
    : eq(atlasSignalsTable.domain, domain);
  const rows = await db
    .select()
    .from(atlasSignalsTable)
    .where(where)
    .orderBy(desc(atlasSignalsTable.createdAt))
    .limit(limit);
  return rows.map(rowToSignalRecord);
}

export async function updateSignalStatus(domain: string, signalId: string, status: AtlasSignalRecord["status"]): Promise<boolean> {
  const result = await db
    .update(atlasSignalsTable)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(atlasSignalsTable.id, signalId), eq(atlasSignalsTable.domain, domain)));
  return (result.rowCount ?? 0) > 0;
}

function rowToSignalRecord(row: typeof atlasSignalsTable.$inferSelect): AtlasSignalRecord {
  return {
    id: row.id,
    domain: row.domain,
    signalType: row.signalType,
    severity: row.severity,
    title: row.title,
    description: row.description,
    confidence: row.confidence,
    source: row.source,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    status: row.status,
    tenantId: row.tenantId,
    workflowId: row.workflowId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Evidence Store (DB-backed) ───────────────────────────────────────────────

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
  tenantId?: string;
}

export async function captureEvidence(record: Omit<AtlasEvidenceRecord, "id" | "capturedAt">): Promise<AtlasEvidenceRecord> {
  const now = new Date();
  const id = randomUUID();
  await db.insert(atlasEvidenceTable).values({
    id,
    domain: record.domain,
    workflowId: record.workflowId,
    label: record.label,
    value: record.value,
    source: record.source,
    capturedBy: record.capturedBy,
    immutable: record.immutable,
    tenantId: record.tenantId ?? null,
    capturedAt: now,
  });
  const ev: AtlasEvidenceRecord = { ...record, id, capturedAt: now.toISOString() };
  logger.info({ domain: record.domain, workflowId: record.workflowId, evidenceId: ev.id }, "atlas:evidence captured");
  return ev;
}

export async function getEvidence(domain: string, workflowId?: string, tenantId?: string): Promise<AtlasEvidenceRecord[]> {
  const filters = [eq(atlasEvidenceTable.domain, domain)];
  if (workflowId) filters.push(eq(atlasEvidenceTable.workflowId, workflowId));
  if (tenantId) filters.push(eq(atlasEvidenceTable.tenantId, tenantId));
  const rows = await db.select().from(atlasEvidenceTable).where(filters.length === 1 ? filters[0] : and(...filters));
  return rows.map(row => ({
    id: row.id,
    domain: row.domain,
    workflowId: row.workflowId,
    label: row.label,
    value: row.value,
    source: row.source,
    capturedBy: row.capturedBy,
    immutable: row.immutable,
    tenantId: row.tenantId ?? undefined,
    capturedAt: row.capturedAt.toISOString(),
  }));
}

// ─── Outcome Store (DB-backed) ────────────────────────────────────────────────

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
  tenantId?: string;
}

export async function recordOutcome(record: Omit<AtlasOutcomeRecord, "id" | "recordedAt">): Promise<AtlasOutcomeRecord> {
  const now = new Date();
  const id = randomUUID();
  await db.insert(atlasOutcomesTable).values({
    id,
    domain: record.domain,
    workflowId: record.workflowId,
    signalId: record.signalId ?? null,
    recommendationId: record.recommendationId ?? null,
    title: record.title,
    summary: record.summary,
    status: record.status,
    financialImpactUsd: record.businessImpact?.financialImpactUsd ?? null,
    operationalSeverity: record.businessImpact?.operationalSeverity ?? null,
    entitiesAffected: record.businessImpact?.entitiesAffected ?? null,
    recordedBy: record.recordedBy,
    evidence: record.evidence,
    metadata: record.metadata ?? {},
    tenantId: record.tenantId ?? null,
    recordedAt: now,
  });
  const outcome: AtlasOutcomeRecord = { ...record, id, recordedAt: now.toISOString() };
  logger.info({ domain: record.domain, workflowId: record.workflowId, outcomeId: outcome.id, status: record.status }, "atlas:outcome recorded");
  return outcome;
}

export async function getOutcomes(domain: string, limit = 50, tenantId?: string): Promise<AtlasOutcomeRecord[]> {
  const where = tenantId
    ? and(eq(atlasOutcomesTable.domain, domain), eq(atlasOutcomesTable.tenantId, tenantId))
    : eq(atlasOutcomesTable.domain, domain);
  const rows = await db
    .select()
    .from(atlasOutcomesTable)
    .where(where)
    .orderBy(desc(atlasOutcomesTable.recordedAt))
    .limit(limit);
  return rows.map(row => ({
    id: row.id,
    domain: row.domain,
    workflowId: row.workflowId,
    signalId: row.signalId ?? undefined,
    recommendationId: row.recommendationId ?? undefined,
    title: row.title,
    summary: row.summary,
    status: row.status,
    businessImpact: (row.financialImpactUsd != null || row.operationalSeverity != null || row.entitiesAffected != null)
      ? {
          financialImpactUsd: row.financialImpactUsd ?? undefined,
          operationalSeverity: row.operationalSeverity ?? undefined,
          entitiesAffected: row.entitiesAffected ?? undefined,
        }
      : undefined,
    recordedBy: row.recordedBy,
    recordedAt: row.recordedAt.toISOString(),
    evidence: (row.evidence ?? []) as string[],
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    tenantId: row.tenantId ?? undefined,
  }));
}

// ─── Evaluation Hook Store (DB-backed via atlas_runs) ─────────────────────────

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
  tenantId?: string;
}

export async function registerEvaluationHook(hook: Omit<EvaluationHookRecord, "id" | "snapshotAt">): Promise<EvaluationHookRecord> {
  const now = new Date();
  const rows = await db.insert(atlasRunsTable).values({
    id: randomUUID(),
    domain: hook.domain,
    workflowId: hook.workflowId,
    workflowName: hook.workflowName,
    triggerSignalId: hook.triggerSignalId ?? null,
    replayable: hook.replayable,
    signalSnapshot: hook.signalSnapshot as unknown as Record<string, unknown>[],
    runSnapshot: hook.runSnapshot as unknown as Record<string, unknown>,
    latencyMs: hook.benchmarkMetrics?.latencyMs ?? null,
    stepsCompleted: hook.benchmarkMetrics?.stepsCompleted ?? null,
    stepsFailed: hook.benchmarkMetrics?.stepsFailed ?? null,
    policyChecks: hook.benchmarkMetrics?.policyChecks ?? null,
    policiesBlocked: hook.benchmarkMetrics?.policiesBlocked ?? null,
    evidenceCount: hook.benchmarkMetrics?.evidenceCount ?? null,
    tenantId: hook.tenantId ?? null,
    snapshotAt: now,
  }).onConflictDoUpdate({
    target: atlasRunsTable.workflowId,
    set: {
      workflowName: hook.workflowName,
      triggerSignalId: hook.triggerSignalId ?? null,
      replayable: hook.replayable,
      signalSnapshot: hook.signalSnapshot as unknown as Record<string, unknown>[],
      runSnapshot: hook.runSnapshot as unknown as Record<string, unknown>,
      latencyMs: hook.benchmarkMetrics?.latencyMs ?? null,
      stepsCompleted: hook.benchmarkMetrics?.stepsCompleted ?? null,
      stepsFailed: hook.benchmarkMetrics?.stepsFailed ?? null,
      policyChecks: hook.benchmarkMetrics?.policyChecks ?? null,
      policiesBlocked: hook.benchmarkMetrics?.policiesBlocked ?? null,
      evidenceCount: hook.benchmarkMetrics?.evidenceCount ?? null,
      tenantId: hook.tenantId ?? null,
      snapshotAt: now,
    },
  }).returning({ id: atlasRunsTable.id, snapshotAt: atlasRunsTable.snapshotAt });
  const persisted = rows[0];
  const record: EvaluationHookRecord = {
    ...hook,
    id: persisted.id,
    snapshotAt: persisted.snapshotAt.toISOString(),
  };
  logger.info({ domain: hook.domain, hookId: record.id, workflowId: hook.workflowId }, "atlas:evaluation-hook registered");
  return record;
}

export async function getEvaluationHooks(domain: string, tenantId?: string): Promise<EvaluationHookRecord[]> {
  const where = tenantId
    ? and(eq(atlasRunsTable.domain, domain), eq(atlasRunsTable.tenantId, tenantId))
    : eq(atlasRunsTable.domain, domain);
  const rows = await db
    .select()
    .from(atlasRunsTable)
    .where(where)
    .orderBy(desc(atlasRunsTable.snapshotAt));
  return rows.map(rowToHookRecord);
}

export async function getEvaluationHookById(hookId: string, tenantId?: string): Promise<EvaluationHookRecord | undefined> {
  const where = tenantId
    ? and(eq(atlasRunsTable.id, hookId), eq(atlasRunsTable.tenantId, tenantId))
    : eq(atlasRunsTable.id, hookId);
  const rows = await db
    .select()
    .from(atlasRunsTable)
    .where(where)
    .limit(1);
  return rows[0] ? rowToHookRecord(rows[0]) : undefined;
}

function rowToHookRecord(row: typeof atlasRunsTable.$inferSelect): EvaluationHookRecord {
  return {
    id: row.id,
    domain: row.domain,
    workflowId: row.workflowId,
    workflowName: row.workflowName,
    triggerSignalId: row.triggerSignalId ?? undefined,
    replayable: row.replayable,
    snapshotAt: row.snapshotAt.toISOString(),
    signalSnapshot: (row.signalSnapshot ?? []) as unknown as AtlasSignalRecord[],
    runSnapshot: (row.runSnapshot ?? {}) as unknown as WorkflowRun,
    benchmarkMetrics: (row.latencyMs != null || row.stepsCompleted != null || row.stepsFailed != null)
      ? {
          latencyMs: row.latencyMs ?? undefined,
          stepsCompleted: row.stepsCompleted ?? undefined,
          stepsFailed: row.stepsFailed ?? undefined,
          policyChecks: row.policyChecks ?? undefined,
          policiesBlocked: row.policiesBlocked ?? undefined,
          evidenceCount: row.evidenceCount ?? undefined,
        }
      : undefined,
    tenantId: row.tenantId ?? undefined,
  };
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
      { id: "legal-review", name: "Legal Review Gate", handler: "terra.legal-review", executionMode: "manual", requiresApproval: true, approverRole: "admin", description: "Legal and compliance review of the deal thesis." },
      { id: "approve-deal", name: "Deal Approval Gate", handler: "terra.approve-deal", executionMode: "manual", requiresApproval: true, approverRole: "exec", description: "Executive approval of deal commitment." },
      { id: "execute-action", name: "Deal Action Execution", handler: "terra.execute-action", executionMode: "semi_auto", requiresApproval: false, rollbackHandler: "terra.rollback-action", description: "Execute approved deal action (offer, LOI, or close)." },
      { id: "evidence", name: "Deal Record Capture", handler: "terra.capture-evidence", executionMode: "semi_auto", requiresApproval: false, description: "Capture executed documents, title reports, and appraisals." },
      { id: "outcome", name: "Outcome Recording", handler: "terra.record-outcome", executionMode: "semi_auto", requiresApproval: false, description: "Record deal outcome, IRR, and capital deployment." },
    ],
    metadata: { domain: "terra", category: "deal-underwriting", atlasVersion: "1.0" },
  },

  "prism-matter-execution": {
    id: "prism-matter-execution",
    name: "PRISM Counsel Legal Matter Execution",
    description: "Legal matter signal → strategy recommendation → counsel review → client approval → filing → outcome.",
    domain: "prism-counsel",
    executionMode: "semi_auto",
    requiresExplicitApproval: true,
    isDryRunCapable: true,
    isSimulationCapable: true,
    rollbackPolicy: "step",
    steps: [
      { id: "ingest-event", name: "Matter Event Ingestion", handler: "prism.ingest-event", executionMode: "semi_auto", requiresApproval: false, description: "Normalize legal matter event (filing deadline, discovery, hearing)." },
      { id: "enrich", name: "Matter Context Enrichment", handler: "prism.enrich", executionMode: "semi_auto", requiresApproval: false, description: "Enrich with docket data, precedent search, and exposure analysis." },
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
    ["prism", ["ingest-event", "enrich", "generate-recommendation", "legal-review", "client-approval", "execute-filing", "capture-trail", "record-outcome"]],
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
  /**
   * Structured PolicyEvaluation produced by buildPolicyEvaluation() — required for live execution.
   * for live (non-dry-run, non-simulation) executions. The action-engine runtime
   * enforces this at the Zod layer; this field is threaded here so that the CI
   * static gate (check-proof-chain.js Gate 1) can verify the proof-chain is
   * attached at the call site rather than relying on a dynamic bypass expression.
   */
  policyEvaluation?: PolicyEvaluation;
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
    policyEvaluation: req.policyEvaluation,
    metadata: {
      signalIds: req.signalIds,
      atlasExecutionPattern: true,
      domain: req.domain,
      ...req.metadata,
    },
  });

  await recordRun(result.run);

  // Defensive direct persistence: even if the action-engine history adapter
  // has not been wired (e.g. during early bootstrap or in tests that don't
  // call initDurablePersistence), write the run row directly so the
  // /:domain/atlas/runs timeline survives a server restart.
  try {
    await dbRecordWorkflowRun(result.run);
  } catch (err) {
    logger.warn({ err, runId: result.run.runId, domain: req.domain }, "atlas:run direct persistence failed");
  }

  if (!req.isDryRun && !req.isSimulation) {
    const signals = req.signalIds
      ? (await getSignals(req.domain, 100)).filter(s => req.signalIds!.includes(s.id))
      : [];
    await registerEvaluationHook({
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
