import { createHash, randomUUID } from 'node:crypto';
import { domainEventBus } from '../../domain-events/index.js';
import { buildLedgerFromRun, defaultRunLedgerStore } from '@workspace/run-ledger';
import { EvidenceLedger } from '@szl-holdings/evidence-ledger';
import {
  submitPendingApprovalRequest,
  resolvePendingApprovalRequest,
} from '@workspace/approvals-inbox';
import {
  db,
  cpsRunsTable,
  cpsApprovalsTable,
  cpsProofBundlesTable,
} from '@szl-holdings/db';
import { eq, desc, and, sql } from 'drizzle-orm';

const cpsEvidenceLedger = new EvidenceLedger();

const tenantMaturityOverrides = new Map<string, Map<string, CpsMaturityMode>>();

function getTenantMaturity(tenantId: string, payloadId: string): CpsMaturityMode | undefined {
  return tenantMaturityOverrides.get(tenantId)?.get(payloadId);
}

function setTenantMaturity(tenantId: string, payloadId: string, mode: CpsMaturityMode): void {
  let tenantMap = tenantMaturityOverrides.get(tenantId);
  if (!tenantMap) {
    tenantMap = new Map();
    tenantMaturityOverrides.set(tenantId, tenantMap);
  }
  tenantMap.set(payloadId, mode);
}

export const CPS_VERSION = '1.0.0' as const;

export type CpsMaturityMode = 'shadow' | 'supervised-auto' | 'autonomous';

export type CpsApprovalTier = 'auto' | 'operator' | 'supervisor' | 'executive' | 'dual-executive';

export type CpsRunStatus =
  | 'pending'
  | 'detecting'
  | 'deciding'
  | 'awaiting-approval'
  | 'acting'
  | 'recovering'
  | 'completed'
  | 'rolled-back'
  | 'failed'
  | 'blocked';

export interface CpsPrincipal {
  id: string;
  displayName: string;
  email: string | null;
  roles: string[];
}

export interface CpsDetectResult {
  triggered: boolean;
  signals: CpsSignal[];
  confidence: number;
  timestamp: string;
}

export interface CpsSignal {
  id: string;
  type: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: Record<string, unknown>;
  timestamp: string;
}

export interface CpsDecision {
  action: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredApprovalTier: CpsApprovalTier;
  reversible: boolean;
  rollbackSteps: string[];
  businessImpact: string;
  reasoning: string;
  constrainedActions: CpsConstrainedAction[];
  timestamp: string;
}

export interface CpsConstrainedAction {
  id: string;
  type: string;
  target: string;
  parameters: Record<string, unknown>;
  reversible: boolean;
  rollbackProcedure: string;
  impactScope: string;
}

export interface CpsApprovalRecord {
  id: string;
  runId: string;
  tier: CpsApprovalTier;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: string;
  respondedAt?: string;
  approver?: string;
  approverRole?: string;
  approverId?: string;
  reason?: string;
  deadlineAt: string;
  dualApprovals?: Array<{
    approverId: string;
    approver: string;
    approverRole: string;
    approvedAt: string;
    reason?: string;
  }>;
  requiredDualCount?: number;
}

export interface CpsActionResult {
  actionId: string;
  status: 'executed' | 'skipped' | 'failed' | 'rolled-back';
  executedAt: string;
  result: Record<string, unknown>;
  rollbackAvailable: boolean;
}

export interface CpsRecoverResult {
  residualRisk: string;
  verificationStatus: 'verified' | 'partial' | 'pending';
  recoveryActions: string[];
  completedAt: string;
}

export interface CpsProofBundle {
  id: string;
  runId: string;
  payloadId: string;
  payloadVersion: string;
  signature: string;
  generatedAt: string;
  sections: {
    detect: CpsDetectResult;
    decide: CpsDecision;
    approve: CpsApprovalRecord[];
    act: CpsActionResult[];
    recover: CpsRecoverResult;
  };
  governanceChecks: CpsGovernanceCheck[];
  residualRisk: string;
  classification: string;
}

export interface CpsGovernanceCheck {
  rule: string;
  passed: boolean;
  detail: string;
  checkedAt: string;
}

export interface CpsPayloadDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  mitreTactics: string[];
  mitretechniques: string[];
  defaultMaturityMode: CpsMaturityMode;
  defaultApprovalTier: CpsApprovalTier;
  detectionLogic: CpsDetectionRule[];
  decisionPolicy: CpsDecisionPolicy;
  constrainedActions: CpsActionTemplate[];
  rollbackContract: CpsRollbackContract;
  tags: string[];
  signatureHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CpsDetectionRule {
  id: string;
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
}

export interface CpsDecisionPolicy {
  riskThresholds: Record<string, number>;
  autoActionConditions: string[];
  escalationCriteria: string[];
  approvalOverrides: Array<{ condition: string; tier: CpsApprovalTier }>;
}

export interface CpsActionTemplate {
  id: string;
  type: string;
  description: string;
  reversible: boolean;
  requiresApproval: boolean;
  approvalTier: CpsApprovalTier;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  rollbackProcedure: string;
}

export interface CpsRollbackContract {
  tested: boolean;
  lastTestedAt: string;
  steps: CpsRollbackStep[];
  verificationChecks: string[];
  maxRollbackWindowMs: number;
}

export interface CpsRollbackStep {
  order: number;
  action: string;
  target: string;
  verifyCommand: string;
  timeout: number;
}

export interface CpsPayloadRun {
  id: string;
  tenantId: string;
  payloadId: string;
  payloadVersion: string;
  status: CpsRunStatus;
  maturityMode: CpsMaturityMode;
  detect: CpsDetectResult | null;
  decide: CpsDecision | null;
  approvals: CpsApprovalRecord[];
  actions: CpsActionResult[];
  recover: CpsRecoverResult | null;
  proofBundle: CpsProofBundle | null;
  governanceChecks: CpsGovernanceCheck[];
  triggeredBy: CpsPrincipal;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  linkedCaseId: string | null;
}

const TIER_REQUIRED_ROLES: Record<CpsApprovalTier, string[]> = {
  auto: [],
  operator: ['analyst', 'operator', 'ops', 'admin', 'super_admin'],
  supervisor: ['supervisor', 'manager', 'ops', 'admin', 'super_admin'],
  executive: ['executive', 'ciso', 'admin', 'super_admin'],
  'dual-executive': ['executive', 'ciso', 'super_admin'],
};

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return JSON.stringify(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const sorted = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`);
    return `{${sorted.join(',')}}`;
  }
  return JSON.stringify(value);
}

function generateSignature(data: Record<string, unknown>): string {
  const content = canonicalize(data);
  return `cps-sha256-${createHash('sha256').update(content).digest('hex')}`;
}

function computePayloadSignatureHash(payload: Omit<CpsPayloadDefinition, 'signatureHash' | 'createdAt' | 'updatedAt'>): string {
  const content = canonicalize({
    id: payload.id,
    version: payload.version,
    detectionLogic: payload.detectionLogic,
    decisionPolicy: payload.decisionPolicy,
    constrainedActions: payload.constrainedActions,
    rollbackContract: payload.rollbackContract,
  });
  return createHash('sha256').update(content).digest('hex');
}

const payloadStore = new Map<string, CpsPayloadDefinition>();

export function registerPayload(payload: CpsPayloadDefinition): void {
  if (!payload.signatureHash) {
    throw new Error(
      `Payload ${payload.id} rejected: missing signatureHash. ` +
      `Every payload must ship with a pre-computed signature hash from a signed deployment review.`,
    );
  }
  const expected = computePayloadSignatureHash(payload);
  if (payload.signatureHash !== expected) {
    throw new Error(
      `Payload ${payload.id} rejected: signatureHash mismatch. ` +
      `The payload definition has been modified since its signature was computed. ` +
      `Expected ${expected.slice(0, 16)}..., got ${payload.signatureHash.slice(0, 16)}...`,
    );
  }
  payloadStore.set(payload.id, payload);
}

export function getPayload(id: string): CpsPayloadDefinition | undefined {
  return payloadStore.get(id);
}

export function listPayloads(): CpsPayloadDefinition[] {
  return Array.from(payloadStore.values());
}

function dbRunToModel(row: typeof cpsRunsTable.$inferSelect, approvals: CpsApprovalRecord[], proofBundle: CpsProofBundle | null): CpsPayloadRun {
  return {
    id: row.id,
    tenantId: row.tenantId,
    payloadId: row.payloadId,
    payloadVersion: row.payloadVersion,
    status: row.status as CpsRunStatus,
    maturityMode: row.maturityMode as CpsMaturityMode,
    detect: (row.detect as CpsDetectResult | null) ?? null,
    decide: (row.decide as CpsDecision | null) ?? null,
    approvals,
    actions: (row.actions as CpsActionResult[]) ?? [],
    recover: (row.recover as CpsRecoverResult | null) ?? null,
    proofBundle,
    governanceChecks: (row.governanceChecks as CpsGovernanceCheck[]) ?? [],
    triggeredBy: row.triggeredBy,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    error: row.error,
    linkedCaseId: row.linkedCaseId,
  };
}

function dbApprovalToModel(row: typeof cpsApprovalsTable.$inferSelect): CpsApprovalRecord {
  return {
    id: row.id,
    runId: row.runId,
    tier: row.tier as CpsApprovalTier,
    status: row.status as CpsApprovalRecord['status'],
    requestedAt: row.requestedAt.toISOString(),
    respondedAt: row.respondedAt?.toISOString(),
    approver: row.approver ?? undefined,
    approverRole: row.approverRole ?? undefined,
    approverId: row.approverId ?? undefined,
    reason: row.reason ?? undefined,
    deadlineAt: row.deadlineAt.toISOString(),
    dualApprovals: (row.dualApprovals as CpsApprovalRecord['dualApprovals']) ?? undefined,
    requiredDualCount: row.requiredDualCount ?? undefined,
  };
}

function dbProofToModel(row: typeof cpsProofBundlesTable.$inferSelect): CpsProofBundle {
  return {
    id: row.id,
    runId: row.runId,
    payloadId: row.payloadId,
    payloadVersion: row.payloadVersion,
    signature: row.signature,
    generatedAt: row.generatedAt.toISOString(),
    sections: row.sections as CpsProofBundle['sections'],
    governanceChecks: row.governanceChecks as CpsGovernanceCheck[],
    residualRisk: row.residualRisk ?? 'Unknown',
    classification: row.classification,
  };
}

async function persistRun(run: CpsPayloadRun): Promise<void> {
  await db.insert(cpsRunsTable).values({
    id: run.id,
    tenantId: run.tenantId,
    payloadId: run.payloadId,
    payloadVersion: run.payloadVersion,
    status: run.status,
    maturityMode: run.maturityMode,
    detect: run.detect,
    decide: run.decide,
    actions: run.actions,
    recover: run.recover,
    governanceChecks: run.governanceChecks,
    triggeredBy: run.triggeredBy,
    linkedCaseId: run.linkedCaseId,
    error: run.error,
    startedAt: new Date(run.startedAt),
    completedAt: run.completedAt ? new Date(run.completedAt) : null,
  }).onConflictDoUpdate({
    target: cpsRunsTable.id,
    set: {
      status: run.status,
      detect: run.detect,
      decide: run.decide,
      actions: run.actions,
      recover: run.recover,
      proofBundle: run.proofBundle,
      governanceChecks: run.governanceChecks,
      linkedCaseId: run.linkedCaseId,
      error: run.error,
      completedAt: run.completedAt ? new Date(run.completedAt) : null,
    },
  });
}

async function persistApproval(approval: CpsApprovalRecord, tenantId: string = 'default'): Promise<void> {
  await db.insert(cpsApprovalsTable).values({
    id: approval.id,
    tenantId,
    runId: approval.runId,
    tier: approval.tier,
    status: approval.status,
    approver: approval.approver ?? null,
    approverRole: approval.approverRole ?? null,
    approverId: approval.approverId ?? null,
    reason: approval.reason ?? null,
    dualApprovals: approval.dualApprovals ?? [],
    requiredDualCount: approval.requiredDualCount ?? null,
    deadlineAt: new Date(approval.deadlineAt),
    requestedAt: new Date(approval.requestedAt),
    respondedAt: approval.respondedAt ? new Date(approval.respondedAt) : null,
  }).onConflictDoUpdate({
    target: cpsApprovalsTable.id,
    set: {
      status: approval.status,
      approver: approval.approver ?? null,
      approverRole: approval.approverRole ?? null,
      approverId: approval.approverId ?? null,
      reason: approval.reason ?? null,
      dualApprovals: approval.dualApprovals ?? [],
      respondedAt: approval.respondedAt ? new Date(approval.respondedAt) : null,
    },
  });
}

async function persistProofBundle(bundle: CpsProofBundle, tenantId: string = 'default'): Promise<void> {
  await db.insert(cpsProofBundlesTable).values({
    id: bundle.id,
    tenantId,
    runId: bundle.runId,
    payloadId: bundle.payloadId,
    payloadVersion: bundle.payloadVersion,
    signature: bundle.signature,
    sections: bundle.sections,
    governanceChecks: bundle.governanceChecks,
    residualRisk: bundle.residualRisk,
    classification: bundle.classification,
    generatedAt: new Date(bundle.generatedAt),
  }).onConflictDoUpdate({
    target: cpsProofBundlesTable.id,
    set: {
      signature: bundle.signature,
      sections: bundle.sections,
      governanceChecks: bundle.governanceChecks,
      residualRisk: bundle.residualRisk,
    },
  });
}

export async function getRun(id: string, tenantId?: string): Promise<CpsPayloadRun | undefined> {
  const conditions = [eq(cpsRunsTable.id, id)];
  if (tenantId) conditions.push(eq(cpsRunsTable.tenantId, tenantId));
  const rows = await db.select().from(cpsRunsTable).where(and(...conditions)).limit(1);
  if (rows.length === 0) return undefined;
  const row = rows[0]!;
  const approvalRows = await db.select().from(cpsApprovalsTable).where(eq(cpsApprovalsTable.runId, id));
  const proofRows = await db.select().from(cpsProofBundlesTable).where(eq(cpsProofBundlesTable.runId, id)).orderBy(desc(cpsProofBundlesTable.generatedAt)).limit(1);
  const approvals = approvalRows.map(dbApprovalToModel);
  const proof = proofRows.length > 0 ? dbProofToModel(proofRows[0]!) : null;
  return dbRunToModel(row, approvals, proof);
}

export async function listRuns(filter?: { payloadId?: string; status?: string; tenantId?: string }): Promise<CpsPayloadRun[]> {
  const conditions = [];
  if (filter?.tenantId) conditions.push(eq(cpsRunsTable.tenantId, filter.tenantId));
  if (filter?.payloadId) conditions.push(eq(cpsRunsTable.payloadId, filter.payloadId));
  if (filter?.status) conditions.push(eq(cpsRunsTable.status, filter.status as CpsRunStatus));

  const rows = await db.select().from(cpsRunsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(cpsRunsTable.startedAt))
    .limit(200);

  const runIds = rows.map((r) => r.id);
  if (runIds.length === 0) return [];

  const allApprovals = await db.select().from(cpsApprovalsTable)
    .where(sql`${cpsApprovalsTable.runId} = ANY(${runIds})`);
  const allProofs = await db.select().from(cpsProofBundlesTable)
    .where(sql`${cpsProofBundlesTable.runId} = ANY(${runIds})`)
    .orderBy(desc(cpsProofBundlesTable.generatedAt));

  const approvalsByRun = new Map<string, CpsApprovalRecord[]>();
  for (const a of allApprovals) {
    const list = approvalsByRun.get(a.runId) ?? [];
    list.push(dbApprovalToModel(a));
    approvalsByRun.set(a.runId, list);
  }
  const proofByRun = new Map<string, CpsProofBundle>();
  for (const p of allProofs) {
    if (!proofByRun.has(p.runId)) {
      proofByRun.set(p.runId, dbProofToModel(p));
    }
  }

  return rows.map((row) => dbRunToModel(
    row,
    approvalsByRun.get(row.id) ?? [],
    proofByRun.get(row.id) ?? null,
  ));
}

export async function listApprovals(filter?: { status?: string; runId?: string; tenantId?: string }): Promise<CpsApprovalRecord[]> {
  const conditions = [];
  if (filter?.tenantId) conditions.push(eq(cpsApprovalsTable.tenantId, filter.tenantId));
  if (filter?.status) conditions.push(eq(cpsApprovalsTable.status, filter.status as CpsApprovalRecord['status']));
  if (filter?.runId) conditions.push(eq(cpsApprovalsTable.runId, filter.runId));

  const rows = await db.select().from(cpsApprovalsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(cpsApprovalsTable.requestedAt));

  return rows.map(dbApprovalToModel);
}

function verifyPayloadSignature(payload: CpsPayloadDefinition): boolean {
  const expectedHash = computePayloadSignatureHash(payload);
  return payload.signatureHash === expectedHash;
}

function enforceGovernance(
  payload: CpsPayloadDefinition,
  decision: CpsDecision,
  maturityMode: CpsMaturityMode,
): CpsGovernanceCheck[] {
  const checks: CpsGovernanceCheck[] = [];
  const now = new Date().toISOString();

  const signatureValid = verifyPayloadSignature(payload);
  checks.push({
    rule: 'signed-payload-deployment',
    passed: signatureValid,
    detail: signatureValid
      ? `Payload signature verified (hash: ${payload.signatureHash.slice(0, 16)}...)`
      : 'Payload signature INVALID — definition has been tampered with since registration',
    checkedAt: now,
  });

  for (const action of decision.constrainedActions) {
    const actionImpact = action.impactScope ?? 'low';
    const isHighImpact = actionImpact === 'high' || actionImpact === 'critical';
    if (!action.reversible && isHighImpact) {
      const tmpl = payload.constrainedActions.find((t) => t.type === action.type);
      const actionTier = tmpl?.approvalTier ?? 'auto';
      const tierOrder: CpsApprovalTier[] = ['auto', 'operator', 'supervisor', 'executive', 'dual-executive'];
      const actionTierIdx = tierOrder.indexOf(actionTier);
      const needsApproval = actionTierIdx >= tierOrder.indexOf('operator');
      checks.push({
        rule: `no-irreversible-high-impact-without-approval:${action.type}`,
        passed: needsApproval,
        detail: needsApproval
          ? `Irreversible ${actionImpact}-impact action "${action.type}" gated at ${actionTier} approval`
          : `BLOCKED: Irreversible ${actionImpact}-impact action "${action.type}" has tier "${actionTier}" — requires at least operator approval`,
        checkedAt: now,
      });
    }
  }

  const hasAnyIrreversibleHighImpact = decision.constrainedActions.some(
    (a) => !a.reversible && (a.impactScope === 'high' || a.impactScope === 'critical'),
  );
  if (!hasAnyIrreversibleHighImpact) {
    checks.push({
      rule: 'no-irreversible-high-impact-without-approval',
      passed: true,
      detail: 'No irreversible high-impact actions in selected action set',
      checkedAt: now,
    });
  }

  const allHaveRollback = decision.constrainedActions.every(
    (a) => a.rollbackProcedure && a.rollbackProcedure.length > 0,
  );
  checks.push({
    rule: 'mandatory-rollback-path',
    passed: allHaveRollback,
    detail: allHaveRollback
      ? 'All actions have documented rollback procedures'
      : 'BLOCKED: One or more actions missing rollback procedure',
    checkedAt: now,
  });

  checks.push({
    rule: 'rollback-contract-tested',
    passed: payload.rollbackContract.tested,
    detail: payload.rollbackContract.tested
      ? `Rollback contract tested (last: ${payload.rollbackContract.lastTestedAt})`
      : 'BLOCKED: Rollback contract has not been tested — execution prohibited until tested',
    checkedAt: now,
  });

  if (maturityMode === 'autonomous') {
    const allReversible = decision.constrainedActions.every((a) => a.reversible);
    checks.push({
      rule: 'autonomous-requires-reversibility',
      passed: allReversible || decision.riskLevel === 'low',
      detail: allReversible
        ? 'All autonomous actions are reversible'
        : 'BLOCKED: Autonomous mode prohibited for irreversible actions — requires supervised mode',
      checkedAt: now,
    });
  }

  const effectiveTier = resolveApprovalTier(payload, decision, maturityMode);
  for (const tmpl of payload.constrainedActions) {
    if (tmpl.requiresApproval) {
      const actionInDecision = decision.constrainedActions.find((a) => a.type === tmpl.type);
      if (actionInDecision) {
        const tierOrder: CpsApprovalTier[] = ['auto', 'operator', 'supervisor', 'executive', 'dual-executive'];
        const effectiveIdx = tierOrder.indexOf(effectiveTier);
        const requiredIdx = tierOrder.indexOf(tmpl.approvalTier);
        const tierMet = (effectiveIdx >= requiredIdx) || maturityMode === 'shadow';
        checks.push({
          rule: `action-approval-gate:${tmpl.type}`,
          passed: tierMet,
          detail: tierMet
            ? `Action ${tmpl.type} approval gate satisfied (effective tier: ${effectiveTier} >= required: ${tmpl.approvalTier})`
            : `BLOCKED: Action ${tmpl.type} requires ${tmpl.approvalTier} approval but effective tier is ${effectiveTier}`,
          checkedAt: now,
        });
      }
    }
  }

  return checks;
}

function resolveApprovalTier(
  payload: CpsPayloadDefinition,
  decision: CpsDecision,
  maturityMode: CpsMaturityMode,
): CpsApprovalTier {
  if (maturityMode === 'shadow') return 'auto';

  const hasIrreversible = decision.constrainedActions.some((a) => !a.reversible);

  for (const override of payload.decisionPolicy.approvalOverrides) {
    const [, actionType] = override.condition.match(/action\s*=\s*(\S+)/) ?? [];
    if (actionType) {
      const actionPresent = decision.constrainedActions.some((a) => a.type === actionType);
      if (actionPresent) return override.tier;
    }
  }

  if (decision.riskLevel === 'critical' && hasIrreversible) return 'dual-executive';
  if (decision.riskLevel === 'critical') return 'executive';
  if (decision.riskLevel === 'high' && hasIrreversible) return 'supervisor';
  if (decision.riskLevel === 'high') return 'operator';

  const maxActionTier = payload.constrainedActions
    .filter((a) => a.requiresApproval)
    .reduce<CpsApprovalTier>((max, a) => {
      const tierOrder: CpsApprovalTier[] = ['auto', 'operator', 'supervisor', 'executive', 'dual-executive'];
      return tierOrder.indexOf(a.approvalTier) > tierOrder.indexOf(max) ? a.approvalTier : max;
    }, 'auto');

  if (maturityMode === 'autonomous' && maxActionTier === 'auto') return 'auto';
  if (maturityMode === 'supervised-auto') {
    const tierOrder: CpsApprovalTier[] = ['auto', 'operator', 'supervisor', 'executive', 'dual-executive'];
    return tierOrder.indexOf(maxActionTier) > tierOrder.indexOf('operator') ? maxActionTier : 'operator';
  }

  return maxActionTier !== 'auto' ? maxActionTier : decision.requiredApprovalTier;
}

export function canApproveAtTier(principal: CpsPrincipal, tier: CpsApprovalTier): boolean {
  if (tier === 'auto') return true;
  const requiredRoles = TIER_REQUIRED_ROLES[tier];
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return principal.roles.some((r) => requiredRoles.includes(r));
}

export async function executePayloadRun(
  payloadId: string,
  principal: CpsPrincipal,
  maturityModeOverride?: CpsMaturityMode,
  tenantId: string = 'default',
): Promise<CpsPayloadRun> {
  const payload = payloadStore.get(payloadId);
  if (!payload) throw new Error(`Payload ${payloadId} not found`);

  const runId = randomUUID();
  const maturityMode = maturityModeOverride ?? getTenantMaturity(tenantId, payloadId) ?? payload.defaultMaturityMode;
  const now = new Date().toISOString();

  const run: CpsPayloadRun = {
    id: runId,
    tenantId,
    payloadId: payload.id,
    payloadVersion: payload.version,
    status: 'detecting',
    maturityMode,
    detect: null,
    decide: null,
    approvals: [],
    actions: [],
    recover: null,
    proofBundle: null,
    governanceChecks: [],
    triggeredBy: principal,
    startedAt: now,
    completedAt: null,
    error: null,
    linkedCaseId: null,
  };

  await persistRun(run);

  try {
    const detectResult = evaluateDetectionRules(payload);
    run.detect = detectResult;
    run.status = 'deciding';

    if (!detectResult.triggered) {
      run.status = 'completed';
      run.completedAt = new Date().toISOString();
      await persistRun(run);
      return run;
    }

    const decision = evaluateDecision(payload, detectResult);
    run.decide = decision;

    const govChecks = enforceGovernance(payload, decision, maturityMode);
    run.governanceChecks = govChecks;

    const globalBlockRules = ['signed-payload-deployment', 'mandatory-rollback-path', 'rollback-contract-tested', 'autonomous-requires-reversibility'];
    const globalBlocked = govChecks.some((c) => !c.passed && globalBlockRules.some((r) => c.rule === r));
    if (globalBlocked) {
      run.status = 'blocked';
      run.error = govChecks.filter((c) => !c.passed && globalBlockRules.some((r) => c.rule === r)).map((c) => c.detail).join('; ');
      run.completedAt = new Date().toISOString();
      await persistRun(run);
      return run;
    }

    if (payload.category === 'identity-defense') {
      const caseId = `AEGIS-CPS-${runId.slice(0, 8).toUpperCase()}`;
      run.linkedCaseId = caseId;
      domainEventBus.publish('cps.case-opened', {
        caseId,
        runId,
        payloadId: payload.id,
        category: 'identity-defense',
        severity: decision.riskLevel,
        title: `Identity Kill-Chain: ${decision.constrainedActions.length} containment action(s) triggered`,
      });
    }

    const effectiveTier = resolveApprovalTier(payload, decision, maturityMode);
    if (effectiveTier !== 'auto') {
      const isDual = effectiveTier === 'dual-executive';
      const approval: CpsApprovalRecord = {
        id: randomUUID(),
        runId,
        tier: effectiveTier,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        deadlineAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        ...(isDual ? { dualApprovals: [], requiredDualCount: 2 } : {}),
      };
      run.approvals.push(approval);
      run.status = 'awaiting-approval';

      await persistApproval(approval, tenantId);
      await persistRun(run);

      submitPendingApprovalRequest({
        runId,
        stepId: approval.id,
        stepName: `CPS ${effectiveTier} approval`,
        action: `Approve ${payload.name} execution`,
        justification: decision.reasoning,
        projectedImpact: decision.businessImpact,
        projectedRisk: decision.riskLevel,
        requestedBy: principal.displayName,
        domain: 'cps',
        surface: 'sentra',
        timeoutMs: 4 * 60 * 60 * 1000,
      });

      if (maturityMode === 'shadow') {
        approval.status = 'approved';
        approval.respondedAt = new Date().toISOString();
        approval.approver = 'shadow-auto';
        approval.approverRole = 'system';
        approval.approverId = 'system';
        await persistApproval(approval, tenantId);
        resolvePendingApprovalRequest(runId, approval.id, 'approved', {
          actor: 'shadow-auto',
          note: 'Shadow mode auto-approval',
        });
      } else {
        domainEventBus.publish('cps.approval-requested', {
          runId,
          payloadId: payload.id,
          tier: effectiveTier,
          approvalId: approval.id,
        });
        return run;
      }
    }

    run.status = 'acting';
    const actionResults = executeWarrantedActions(decision, payload, maturityMode, govChecks);
    run.actions = actionResults;

    if (payload.category === 'network-defense') {
      evaluateConfidenceAutoRollback(run, payload);
    }

    run.status = 'recovering';
    const recoverResult = simulateRecovery(payload, actionResults);
    run.recover = recoverResult;

    const proofBundle = buildProofBundle(run, payload);
    run.proofBundle = proofBundle;
    run.status = 'completed';
    run.completedAt = new Date().toISOString();

    await persistRun(run);
    await persistProofBundle(proofBundle, tenantId);
    persistRunToLedgers(run, payload);

    domainEventBus.publish('cps.run-completed', {
      runId,
      payloadId: payload.id,
      status: 'completed',
      proofBundleId: proofBundle.id,
      linkedCaseId: run.linkedCaseId,
    });
  } catch (err) {
    run.status = 'failed';
    run.error = err instanceof Error ? err.message : String(err);
    run.completedAt = new Date().toISOString();
    await persistRun(run).catch(() => {});
  }

  return run;
}

export async function approveRun(
  approvalId: string,
  principal: CpsPrincipal,
  approved: boolean,
  reason?: string,
  tenantId?: string,
): Promise<CpsPayloadRun | null> {
  const approvalConditions = [eq(cpsApprovalsTable.id, approvalId)];
  if (tenantId) approvalConditions.push(eq(cpsApprovalsTable.tenantId, tenantId));
  const approvalRows = await db.select().from(cpsApprovalsTable).where(and(...approvalConditions)).limit(1);
  if (approvalRows.length === 0) return null;
  const approval = dbApprovalToModel(approvalRows[0]!);

  if (!canApproveAtTier(principal, approval.tier)) {
    throw new Error(
      `Principal ${principal.displayName} (roles: ${principal.roles.join(',')}) ` +
      `lacks required role for ${approval.tier} approval`,
    );
  }

  if (approval.status !== 'pending') {
    throw new Error(`Approval ${approvalId} already resolved (status: ${approval.status})`);
  }

  const deadline = new Date(approval.deadlineAt);
  if (Date.now() > deadline.getTime()) {
    const effectiveTenant = tenantId ?? approvalRows[0]!.tenantId;
    approval.status = 'expired';
    await persistApproval(approval, effectiveTenant);
    await db.update(cpsRunsTable).set({
      status: 'blocked',
      error: `Approval expired at ${approval.deadlineAt}`,
      completedAt: new Date(),
    }).where(eq(cpsRunsTable.id, approval.runId));
    throw new Error(`Approval ${approvalId} has expired (deadline: ${approval.deadlineAt})`);
  }

  const effectiveTenant = tenantId ?? approvalRows[0]!.tenantId;

  if (!approved) {
    approval.status = 'rejected';
    approval.respondedAt = new Date().toISOString();
    approval.approver = principal.displayName;
    approval.approverRole = principal.roles[0] ?? 'unknown';
    approval.approverId = principal.id;
    if (reason) approval.reason = reason;

    await persistApproval(approval, effectiveTenant);
    resolvePendingApprovalRequest(approval.runId, approval.id, 'rejected', {
      actor: principal.displayName,
      note: reason,
    });

    await db.update(cpsRunsTable).set({
      status: 'blocked',
      error: `Approval rejected by ${principal.displayName} (${principal.id}): ${reason ?? 'no reason'}`,
      completedAt: new Date(),
    }).where(eq(cpsRunsTable.id, approval.runId));

    return getRun(approval.runId) ?? null;
  }

  if (approval.tier === 'dual-executive') {
    if (!approval.dualApprovals) approval.dualApprovals = [];
    if (!approval.requiredDualCount) approval.requiredDualCount = 2;

    const alreadyApproved = approval.dualApprovals.some(
      (da) => da.approverId === principal.id,
    );
    if (alreadyApproved) {
      throw new Error(
        `Principal ${principal.displayName} (${principal.id}) has already provided ` +
        `a dual-executive approval for this request — a second distinct executive is required`,
      );
    }

    approval.dualApprovals.push({
      approverId: principal.id,
      approver: principal.displayName,
      approverRole: principal.roles[0] ?? 'unknown',
      approvedAt: new Date().toISOString(),
      reason,
    });

    if (approval.dualApprovals.length < approval.requiredDualCount) {
      await persistApproval(approval, effectiveTenant);
      return getRun(approval.runId) ?? null;
    }

    approval.status = 'approved';
    approval.respondedAt = new Date().toISOString();
    approval.approver = approval.dualApprovals.map((da) => da.approver).join(' + ');
    approval.approverRole = 'dual-executive';
    approval.approverId = approval.dualApprovals.map((da) => da.approverId).join('+');
  } else {
    approval.status = 'approved';
    approval.respondedAt = new Date().toISOString();
    approval.approver = principal.displayName;
    approval.approverRole = principal.roles[0] ?? 'unknown';
    approval.approverId = principal.id;
  }
  if (reason) approval.reason = reason;

  await persistApproval(approval, effectiveTenant);
  resolvePendingApprovalRequest(approval.runId, approval.id, 'approved', {
    actor: principal.displayName,
    note: reason,
  });

  const run = await getRun(approval.runId);
  if (!run || !run.decide) return run ?? null;

  const payload = payloadStore.get(run.payloadId);
  if (!payload) return run;

  run.status = 'acting';
  const actionResults = executeWarrantedActions(run.decide, payload, run.maturityMode, run.governanceChecks);
  run.actions = actionResults;

  if (payload.category === 'network-defense') {
    evaluateConfidenceAutoRollback(run, payload);
  }

  run.status = 'recovering';
  const recoverResult = simulateRecovery(payload, actionResults);
  run.recover = recoverResult;

  const proofBundle = buildProofBundle(run, payload);
  run.proofBundle = proofBundle;
  run.status = 'completed';
  run.completedAt = new Date().toISOString();

  await persistRun(run);
  await persistProofBundle(proofBundle, effectiveTenant);
  persistRunToLedgers(run, payload);

  domainEventBus.publish('cps.run-completed', {
    runId: run.id,
    payloadId: payload.id,
    status: 'completed',
    proofBundleId: proofBundle.id,
    linkedCaseId: run.linkedCaseId,
  });

  return run;
}

export async function rollbackRun(runId: string, principal: CpsPrincipal, tenantId?: string): Promise<CpsPayloadRun | null> {
  const run = await getRun(runId, tenantId);
  if (!run) return null;

  const payload = payloadStore.get(run.payloadId);
  if (payload) {
    const withinWindow = Date.now() - new Date(run.startedAt).getTime() < payload.rollbackContract.maxRollbackWindowMs;
    if (!withinWindow) {
      throw new Error(
        `Rollback window expired for run ${runId} ` +
        `(max: ${payload.rollbackContract.maxRollbackWindowMs}ms, ` +
        `elapsed: ${Date.now() - new Date(run.startedAt).getTime()}ms)`,
      );
    }
  }

  for (const action of run.actions) {
    if (action.rollbackAvailable) {
      action.status = 'rolled-back';
    }
  }

  run.status = 'rolled-back';
  run.completedAt = new Date().toISOString();

  const govCheck: CpsGovernanceCheck = {
    rule: 'rollback-executed',
    passed: true,
    detail: `Rollback executed by ${principal.displayName} (${principal.id})`,
    checkedAt: new Date().toISOString(),
  };
  run.governanceChecks.push(govCheck);

  if (payload && run.detect && run.decide) {
    const rollbackRecover: CpsRecoverResult = {
      residualRisk: `Rollback executed by ${principal.displayName} — verify system state`,
      verificationStatus: 'partial',
      recoveryActions: payload.rollbackContract.verificationChecks,
      completedAt: new Date().toISOString(),
    };
    run.recover = rollbackRecover;

    const newProofBundle = buildProofBundle(run, payload);
    run.proofBundle = newProofBundle;
    await persistProofBundle(newProofBundle, run.tenantId);
  } else if (run.proofBundle) {
    run.proofBundle.residualRisk = `Rollback executed by ${principal.displayName} — verify system state`;
    run.proofBundle.sections.act = run.actions;
    run.proofBundle.governanceChecks = run.governanceChecks;
    run.proofBundle.signature = generateSignature({
      runId: run.id,
      payloadId: run.payloadId,
      status: run.status,
      actions: run.actions,
      governanceChecks: run.governanceChecks,
      residualRisk: run.proofBundle.residualRisk,
    });
    await persistProofBundle(run.proofBundle, run.tenantId);
  }

  await persistRun(run);

  domainEventBus.publish('cps.run-rolled-back', {
    runId,
    payloadId: run.payloadId,
    operator: principal.displayName,
    operatorId: principal.id,
  });

  return run;
}

export function updatePayloadMaturity(
  payloadId: string,
  mode: CpsMaturityMode,
  tenantId: string = 'default',
): CpsPayloadDefinition | null {
  const payload = payloadStore.get(payloadId);
  if (!payload) return null;
  setTenantMaturity(tenantId, payloadId, mode);
  return { ...payload, defaultMaturityMode: mode, updatedAt: new Date().toISOString() };
}

function persistRunToLedgers(run: CpsPayloadRun, payload: CpsPayloadDefinition): void {
  try {
    const startMs = Date.parse(run.startedAt);
    const ledgerEntry = buildLedgerFromRun({
      runId: run.id,
      traceId: run.id,
      actor: run.triggeredBy.displayName,
      objective: `CPS ${payload.name} — ${run.maturityMode} mode`,
      planStepCount: run.actions.length,
      phases: [
        { phase: 'detect', startedAt: startMs, durationMs: 100 },
        { phase: 'decide', startedAt: startMs + 100, durationMs: 50 },
        { phase: 'act', startedAt: startMs + 150, durationMs: run.actions.length * 200 },
        { phase: 'recover', startedAt: startMs + 150 + run.actions.length * 200, durationMs: 50 },
      ],
      stepResults: run.actions.map((a) => ({
        stepId: a.actionId,
        toolId: 'cps-action',
        durationMs: 200,
        status: a.status === 'executed' ? 'completed' : a.status,
      })),
      approvalEvents: run.approvals.map((a) => ({
        requestId: a.runId,
        stepId: a.id,
        verdict: a.status === 'approved' ? 'approve' as const
          : a.status === 'rejected' ? 'deny' as const
          : a.status === 'expired' ? 'timed_out' as const
          : 'pending' as const,
        actor: a.approver,
        decidedAt: a.respondedAt ? Date.parse(a.respondedAt) : undefined,
      })),
      policyOutcomes: run.governanceChecks.map((gc) => ({
        policyId: gc.rule,
        result: gc.passed ? 'pass' as const : 'block' as const,
        reason: gc.detail,
      })),
    });
    defaultRunLedgerStore.save(ledgerEntry);
  } catch {
  }

  try {
    const now = new Date().toISOString();
    cpsEvidenceLedger.append({
      entityType: 'cps-run',
      entityId: run.id,
      action: `cps.${run.status}`,
      actor: run.triggeredBy.displayName,
      actorRole: run.triggeredBy.roles[0] ?? 'unknown',
      envelope: {
        traceId: run.id,
        sources: [{
          sourceId: payload.id,
          title: payload.name,
          retrievedAt: now,
        }],
        confidence: run.detect?.confidence
          ? (run.detect.confidence >= 0.85 ? 'high' : run.detect.confidence >= 0.6 ? 'medium' : 'low') as const
          : 'medium' as const,
        freshness: 'fresh' as const,
        toolCalls: run.actions.map((a) => ({
          toolId: `cps-${a.actionId}`,
          status: a.status === 'executed' ? 'success' as const : a.status === 'skipped' ? 'skipped' as const : 'error' as const,
          timestamp: a.executedAt,
        })),
        policyVerdict: run.governanceChecks.every((gc) => gc.passed) ? 'pass' : 'block',
        workflowRunId: run.id,
      },
    });
  } catch {
  }
}

function evaluateConfidenceAutoRollback(run: CpsPayloadRun, payload: CpsPayloadDefinition): void {
  if (!run.detect) return;
  const confidenceThreshold = payload.decisionPolicy.riskThresholds.high ?? 0.7;
  if (run.detect.confidence < confidenceThreshold) {
    for (const action of run.actions) {
      if (action.rollbackAvailable) {
        action.status = 'rolled-back';
      }
    }
    run.governanceChecks.push({
      rule: 'confidence-auto-rollback',
      passed: true,
      detail: `Auto-rollback triggered: confidence ${(run.detect.confidence * 100).toFixed(1)}% ` +
        `below threshold ${(confidenceThreshold * 100).toFixed(1)}% — false positive mitigation`,
      checkedAt: new Date().toISOString(),
    });
  }
}

function evaluateDetectionRules(payload: CpsPayloadDefinition): CpsDetectResult {
  const severityWeights: Record<string, number> = { critical: 0.95, high: 0.85, medium: 0.70, low: 0.55 };
  const thresholds = payload.decisionPolicy.riskThresholds;
  const signals: CpsSignal[] = [];

  for (const rule of payload.detectionLogic) {
    const ruleWeight = severityWeights[rule.severity] ?? 0.55;
    const threshold = rule.severity === 'critical'
      ? (thresholds.critical ?? 0.9)
      : rule.severity === 'high'
        ? (thresholds.high ?? 0.75)
        : (thresholds.medium ?? 0.5);

    if (ruleWeight >= threshold) {
      signals.push({
        id: randomUUID(),
        type: rule.condition,
        source: 'telemetry-pipeline',
        severity: rule.severity,
        description: rule.name,
        indicators: Object.fromEntries(rule.indicators.map((ind) => [ind, true])),
        timestamp: new Date().toISOString(),
      });
    }
  }

  const maxSeverity = signals.reduce((max, s) => {
    return (severityWeights[s.severity] ?? 0) > (severityWeights[max] ?? 0) ? s.severity : max;
  }, 'low');
  const baseConfidence = severityWeights[maxSeverity] ?? 0.55;

  return {
    triggered: signals.length > 0,
    signals,
    confidence: signals.length > 0 ? Math.min(0.99, baseConfidence + signals.length * 0.02) : 0,
    timestamp: new Date().toISOString(),
  };
}

const IMPACT_ORDER: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
const SEVERITY_TO_IMPACT: Record<string, string> = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };

function evaluateDecision(
  payload: CpsPayloadDefinition,
  detect: CpsDetectResult,
): CpsDecision {
  const hasCritical = detect.signals.some((s) => s.severity === 'critical');
  const hasHigh = detect.signals.some((s) => s.severity === 'high');
  const riskLevel = hasCritical ? 'critical' : hasHigh ? 'high' : 'medium';

  const maxDetectedImpact = detect.signals.reduce((max, s) => {
    const impact = SEVERITY_TO_IMPACT[s.severity] ?? 'low';
    return (IMPACT_ORDER[impact] ?? 0) > (IMPACT_ORDER[max] ?? 0) ? impact : max;
  }, 'low');
  const maxDetectedImpactOrder = IMPACT_ORDER[maxDetectedImpact] ?? 0;

  const selectedActions: CpsConstrainedAction[] = [];
  for (const tmpl of payload.constrainedActions) {
    const actionImpactOrder = IMPACT_ORDER[tmpl.impactLevel] ?? 0;

    if (actionImpactOrder <= maxDetectedImpactOrder) {
      selectedActions.push({
        id: randomUUID(),
        type: tmpl.type,
        target: tmpl.description,
        parameters: {},
        reversible: tmpl.reversible,
        rollbackProcedure: tmpl.rollbackProcedure,
        impactScope: tmpl.impactLevel,
      });
    }
  }

  if (selectedActions.length === 0 && payload.constrainedActions.length > 0) {
    const lowestImpact = payload.constrainedActions.reduce((min, tmpl) => {
      return (IMPACT_ORDER[tmpl.impactLevel] ?? 0) < (IMPACT_ORDER[min.impactLevel] ?? 0) ? tmpl : min;
    }, payload.constrainedActions[0]!);
    selectedActions.push({
      id: randomUUID(),
      type: lowestImpact.type,
      target: lowestImpact.description,
      parameters: {},
      reversible: lowestImpact.reversible,
      rollbackProcedure: lowestImpact.rollbackProcedure,
      impactScope: lowestImpact.impactLevel,
    });
  }

  return {
    action: selectedActions[0]?.type ?? 'containment',
    riskLevel,
    requiredApprovalTier: payload.defaultApprovalTier,
    reversible: selectedActions.every((a) => a.reversible),
    rollbackSteps: payload.rollbackContract.steps.map((s) => s.action),
    businessImpact: `Potential ${riskLevel}-severity incident affecting ${selectedActions.length} system(s)`,
    reasoning: `${detect.signals.length} signal(s) detected with ${(detect.confidence * 100).toFixed(0)}% confidence — ${riskLevel} risk assessment selects ${selectedActions.length}/${payload.constrainedActions.length} warranted action(s)`,
    constrainedActions: selectedActions,
    timestamp: new Date().toISOString(),
  };
}

function executeWarrantedActions(
  decision: CpsDecision,
  payload: CpsPayloadDefinition,
  maturityMode: CpsMaturityMode,
  govChecks: CpsGovernanceCheck[],
): CpsActionResult[] {
  return decision.constrainedActions.map((action) => {
    const actionBlocked = govChecks.some(
      (gc) => !gc.passed && gc.rule.startsWith(`no-irreversible-high-impact-without-approval:${action.type}`),
    );
    const actionGateBlocked = govChecks.some(
      (gc) => !gc.passed && gc.rule === `action-approval-gate:${action.type}`,
    );

    let status: 'executed' | 'skipped' | 'failed' = maturityMode === 'shadow' ? 'skipped' : 'executed';
    if (actionBlocked || actionGateBlocked) {
      status = 'skipped';
    }

    return {
      actionId: action.id,
      status,
      executedAt: new Date().toISOString(),
      result: {
        type: action.type,
        target: action.target,
        mode: maturityMode,
        shadowOnly: maturityMode === 'shadow',
        ...(actionBlocked ? { blockedReason: 'governance-check-failed' } : {}),
      },
      rollbackAvailable: action.reversible && status === 'executed',
    };
  });
}

function simulateRecovery(
  payload: CpsPayloadDefinition,
  actions: CpsActionResult[],
): CpsRecoverResult {
  const executed = actions.filter((a) => a.status === 'executed');
  const rolledBack = actions.filter((a) => a.status === 'rolled-back');
  return {
    residualRisk: rolledBack.length > 0
      ? `${rolledBack.length} action(s) rolled back — verify no partial state remains`
      : executed.length > 0
        ? 'Monitor for 24h — verify no reoccurrence'
        : 'Shadow mode — no residual risk from actions',
    verificationStatus: rolledBack.length > 0 ? 'partial' : 'verified',
    recoveryActions: payload.rollbackContract.verificationChecks,
    completedAt: new Date().toISOString(),
  };
}

function buildProofBundle(run: CpsPayloadRun, payload: CpsPayloadDefinition): CpsProofBundle {
  const bundleData = {
    runId: run.id,
    payloadId: payload.id,
    payloadVersion: payload.version,
    payloadSignatureHash: payload.signatureHash,
    triggeredBy: run.triggeredBy,
    detect: run.detect,
    decide: run.decide,
    approvals: run.approvals,
    actions: run.actions,
    recover: run.recover,
    governance: run.governanceChecks,
    linkedCaseId: run.linkedCaseId,
  };

  return {
    id: randomUUID(),
    runId: run.id,
    payloadId: payload.id,
    payloadVersion: payload.version,
    signature: generateSignature(bundleData as unknown as Record<string, unknown>),
    generatedAt: new Date().toISOString(),
    sections: {
      detect: run.detect!,
      decide: run.decide!,
      approve: run.approvals,
      act: run.actions,
      recover: run.recover!,
    },
    governanceChecks: run.governanceChecks,
    residualRisk: run.recover?.residualRisk ?? 'Unknown',
    classification: 'internal-confidential',
  };
}
