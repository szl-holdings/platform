import type { PCEContract, ApprovalRecord, PolicyEvaluation, ProofPacketRecord } from '../types.js';
import type { MirrorEvalResult } from '../types.js';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { runMirrorEval, storeEval } from '../evals/mirror-eval.js';
import { buildContextPack, checkEvidenceRequirement, computeCoverage } from '../context/deep-context.js';

export type RiskClass =
  | 'financial'
  | 'legal'
  | 'customer_facing'
  | 'security'
  | 'data_destructive'
  | 'reputational'
  | 'regulatory'
  | 'operational'
  | 'strategic'
  | 'third_party_disclosure';

const APPROVAL_MATRIX: Record<RiskClass, string> = {
  financial: 'executive',
  legal: 'executive',
  customer_facing: 'executive',
  security: 'executive',
  data_destructive: 'board',
  reputational: 'board',
  regulatory: 'executive',
  operational: 'operator',
  strategic: 'board',
  third_party_disclosure: 'executive',
};

const pceContracts = new Map<string, PCEContract>();
const approvalRecords = new Map<string, ApprovalRecord>();
const proofPackets = new Map<string, ProofPacketRecord>();
const policyEvaluations = new Map<string, PolicyEvaluation>();

function isDemoMode(): boolean {
  return process.env.A11OY_DEMO_MODE !== 'false';
}

async function persistPolicyEvaluation(result: PolicyEvaluation): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyPolicyEvaluationsTable } = await import('@szl-holdings/db/schema');
    await db.insert(a11oyPolicyEvaluationsTable).values({
      evalId: result.evalId,
      policyIds: result.policyIds,
      actionId: result.actionId,
      riskClass: result.riskClass,
      passed: result.passed,
      requiresApproval: result.requiresApproval,
      approvalTier: result.approvalTier ?? null,
      violations: result.violations,
      evaluatedAt: new Date(result.evaluatedAt),
    }).onConflictDoUpdate({
      target: a11oyPolicyEvaluationsTable.evalId,
      set: {
        passed: result.passed,
        requiresApproval: result.requiresApproval,
        approvalTier: result.approvalTier ?? null,
        violations: result.violations,
      },
    });
  } catch { /* non-fatal */ }
}

async function persistApprovalRecord(record: ApprovalRecord): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyApprovalRecordsTable } = await import('@szl-holdings/db/schema');
    await db.insert(a11oyApprovalRecordsTable).values({
      approvalId: record.approvalId,
      actionId: record.actionId,
      tier: record.tier as 'auto' | 'operator' | 'executive' | 'board',
      status: record.status,
      approvedBy: record.approvedBy ?? null,
      approvedAt: record.approvedAt ? new Date(record.approvedAt) : null,
      rejectedReason: record.rejectedReason ?? null,
      createdAt: new Date(record.createdAt),
    }).onConflictDoUpdate({
      target: a11oyApprovalRecordsTable.approvalId,
      set: {
        status: record.status,
        approvedBy: record.approvedBy ?? null,
        approvedAt: record.approvedAt ? new Date(record.approvedAt) : null,
        rejectedReason: record.rejectedReason ?? null,
      },
    });
  } catch { /* non-fatal */ }
}

async function persistPceContract(contract: PCEContract): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyPceContractsTable } = await import('@szl-holdings/db/schema');
    await db.insert(a11oyPceContractsTable).values({
      contractId: contract.contractId,
      actionId: contract.actionId,
      workcellId: contract.workcellId ?? null,
      originSignalIds: contract.originSignalIds,
      causalChainIds: contract.causalChainIds ?? [],
      policyEvaluationId: contract.policyEvaluationId ?? null,
      approvalRecordId: contract.approvalRecordId ?? null,
      mirrorEvalId: contract.mirrorEvalId ?? null,
      executionTraceId: contract.executionTraceId ?? null,
      proofPacketId: contract.proofPacketId ?? null,
      mode: contract.mode,
      isVerified: contract.isVerified,
      evidenceCoverage: String(contract.evidenceCoverage ?? 0),
      createdAt: new Date(contract.createdAt),
      verifiedAt: contract.verifiedAt ? new Date(contract.verifiedAt) : null,
    }).onConflictDoUpdate({
      target: a11oyPceContractsTable.contractId,
      set: {
        executionTraceId: contract.executionTraceId ?? null,
        proofPacketId: contract.proofPacketId ?? null,
        isVerified: contract.isVerified,
        verifiedAt: contract.verifiedAt ? new Date(contract.verifiedAt) : null,
      },
    });
  } catch { /* non-fatal */ }
}

async function persistProofPacket(packet: ProofPacketRecord): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyProofPacketsTable } = await import('@szl-holdings/db/schema');
    await db.insert(a11oyProofPacketsTable).values({
      packetId: packet.packetId,
      contractId: packet.contractId,
      actionId: packet.actionId,
      entityId: packet.entityId,
      hash: packet.hash,
      previousHash: packet.previousHash ?? null,
      payload: packet.payload as Record<string, unknown>,
      witnessedBy: packet.witnessedBy,
      issuedAt: new Date(packet.issuedAt),
    }).onConflictDoNothing();
  } catch { /* non-fatal */ }
}

const DISCLOSURE_VERTICALS = new Set([
  'disclosure',
  'third-party-disclosure',
  'data-sharing',
  'legal-disclosure',
  'privacy',
  'gdpr',
  'dpa',
  'subprocessor',
  'data-transfer',
]);

const DISCLOSURE_ACTION_KEYWORDS = [
  'disclos',
  'subprocessor',
  'dpa',
  'data sharing',
  'data transfer',
  'third-party',
  'third_party',
  'recipient',
  'legal_agreement',
  'legal-agreement',
  'msa',
  ' nda ',
  'countersign',
  'data_sharing',
];

export function classifyRisk(opts: {
  riskLevel: string;
  isDestructive: boolean;
  vertical: string;
  action?: string;
}): RiskClass[] {
  const classes: RiskClass[] = [];
  if (['financial', 'revenue'].includes(opts.vertical)) classes.push('financial');
  if (['prism-counsel', 'legal'].includes(opts.vertical)) classes.push('legal');
  if (['aegis-defense', 'security'].includes(opts.vertical)) classes.push('security');
  if (opts.isDestructive) classes.push('data_destructive');
  if (['vessels-maritime', 'maritime'].includes(opts.vertical)) classes.push('operational');
  if (['lyte-revenue'].includes(opts.vertical)) classes.push('customer_facing');
  if (opts.riskLevel === 'critical') classes.push('strategic');

  const verticalLower = opts.vertical.toLowerCase();
  const actionLower = (opts.action ?? '').toLowerCase();
  const isDisclosureByVertical = DISCLOSURE_VERTICALS.has(verticalLower);
  const isDisclosureByAction = DISCLOSURE_ACTION_KEYWORDS.some(
    (kw) => actionLower.includes(kw) || verticalLower.includes(kw.trim()),
  );
  if (isDisclosureByVertical || isDisclosureByAction) classes.push('third_party_disclosure');

  if (classes.length === 0) classes.push('operational');
  return classes;
}

export function evaluatePolicies(opts: {
  actionId: string;
  riskClasses: RiskClass[];
  vertical: string;
  riskLevel: string;
}): PolicyEvaluation {
  const evalId = `pe-${randomUUID().slice(0, 8)}`;
  const approvalTier = opts.riskClasses
    .map((rc) => APPROVAL_MATRIX[rc])
    .reduce((highest, tier) => {
      const order = ['auto', 'operator', 'executive', 'board'];
      return order.indexOf(tier) > order.indexOf(highest) ? tier : highest;
    }, 'auto') as 'auto' | 'operator' | 'executive' | 'board';

  const requiresApproval = approvalTier !== 'auto';
  const violations: string[] = [];

  if (opts.riskLevel === 'critical' && approvalTier === 'operator') {
    violations.push('critical_risk_requires_executive_approval');
  }

  const result: PolicyEvaluation = {
    evalId,
    policyIds: opts.riskClasses.map((rc) => `policy:${rc}`),
    actionId: opts.actionId,
    riskClass: opts.riskClasses[0] ?? 'operational',
    passed: violations.length === 0,
    requiresApproval,
    approvalTier: requiresApproval ? approvalTier : undefined,
    violations,
    evaluatedAt: new Date().toISOString(),
  };

  policyEvaluations.set(evalId, result);
  void persistPolicyEvaluation(result);
  return result;
}

export function createApprovalRecord(opts: {
  actionId: string;
  tier: string;
}): ApprovalRecord {
  const record: ApprovalRecord = {
    approvalId: `apr-${randomUUID().slice(0, 8)}`,
    actionId: opts.actionId,
    tier: opts.tier as ApprovalRecord['tier'],
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  approvalRecords.set(record.approvalId, record);
  void persistApprovalRecord(record);
  return record;
}

export function approveAction(approvalId: string, approvedBy: string): ApprovalRecord | undefined {
  const record = approvalRecords.get(approvalId);
  if (!record) return undefined;
  record.status = 'approved';
  record.approvedBy = approvedBy;
  record.approvedAt = new Date().toISOString();
  void persistApprovalRecord(record);
  return record;
}

export function rejectAction(approvalId: string, reason: string): ApprovalRecord | undefined {
  const record = approvalRecords.get(approvalId);
  if (!record) return undefined;
  record.status = 'rejected';
  record.rejectedReason = reason;
  void persistApprovalRecord(record);
  return record;
}

export function getApprovalRecord(approvalId: string): ApprovalRecord | undefined {
  return approvalRecords.get(approvalId);
}

export function findApprovalByAction(actionId: string): ApprovalRecord | undefined {
  return [...approvalRecords.values()].find((r) => r.actionId === actionId);
}

export interface PCEGateInput {
  actionId: string;
  workcellId?: string;
  originSignalIds: string[];
  vertical: string;
  riskLevel: string;
  isDestructive: boolean;
  policyViolations?: string[];
  approvalRecordId?: string;
  mirrorEvalResult?: MirrorEvalResult;
  signals?: Record<string, unknown>[];
  actionDescription?: string;
  causalChainIds?: string[];
  /** Optional: when the action involves a known third-party disclosure, supply these
   * so runPCEGate can resolve the DisclosureContext from the DB for MirrorEval scoring. */
  disclosureRecipientId?: string;
  disclosureAgreementId?: string;
  disclosureOrgId?: number;
}

export interface PCEGateResult {
  allowed: boolean;
  contract?: PCEContract;
  blockedReason?: string;
  errorType?: string;
  requiresApproval?: boolean;
  approvalTier?: string;
}

export async function runPCEGate(input: PCEGateInput): Promise<PCEGateResult> {
  const demo = isDemoMode();

  if (demo && input.isDestructive) {
    return {
      allowed: false,
      blockedReason: 'Data-destructive actions are blocked in demo mode.',
      errorType: 'safety',
    };
  }

  const contextPack = buildContextPack({
    signalIds: input.originSignalIds,
    vertical: input.vertical,
    signals: input.signals ?? input.originSignalIds.map((id) => ({ id, type: 'signal', source: 'runtime', freshness: 1 })),
  });

  const evidenceCheck = checkEvidenceRequirement(contextPack);
  if (!evidenceCheck.sufficient) {
    return {
      allowed: false,
      blockedReason: evidenceCheck.reason ?? 'Insufficient evidence coverage for PCE.',
      errorType: 'safety',
    };
  }

  const coverage = computeCoverage(contextPack);

  // Resolve disclosure context from the DB when the action involves a known recipient.
  // This grounds the MirrorEval disclosure_safety dimension in persisted registry data.
  let disclosureContext: import('../evals/mirror-eval.js').DisclosureContext | undefined;
  if (input.disclosureRecipientId && input.disclosureOrgId) {
    try {
      const { resolveDisclosureContext } = await import('../../lib/disclosure-eval.js');
      disclosureContext = await resolveDisclosureContext(
        input.disclosureRecipientId,
        input.disclosureOrgId,
        input.disclosureAgreementId,
      );
    } catch { /* non-fatal — eval continues without DB context */ }
  }

  const mirrorEval = input.mirrorEvalResult ?? runMirrorEval({
    targetId: input.actionId,
    targetType: 'pce',
    evidenceRefs: input.originSignalIds,
    sourceCoverage: coverage,
    hasPriorApproval: !!input.approvalRecordId,
    isDestructive: input.isDestructive,
    isDemoMode: demo,
    policyViolations: input.policyViolations,
    contextFreshness: 0.9,
    approvalTier: input.riskLevel === 'critical' ? 'executive' : 'operator',
    riskLevel: input.riskLevel,
    actionDescription: input.actionDescription,
    disclosureContext,
  });

  storeEval(mirrorEval);

  if (mirrorEval.disposition === 'blocked') {
    return {
      allowed: false,
      blockedReason: `MirrorEval blocked execution: ${mirrorEval.flags.join(', ')}`,
      errorType: 'safety',
    };
  }

  const riskClasses = classifyRisk({
    riskLevel: input.riskLevel,
    isDestructive: input.isDestructive,
    vertical: input.vertical,
    action: input.actionDescription,
  });

  const policyEval = evaluatePolicies({
    actionId: input.actionId,
    riskClasses,
    vertical: input.vertical,
    riskLevel: input.riskLevel,
  });

  if (policyEval.requiresApproval && !input.approvalRecordId) {
    const approval = createApprovalRecord({
      actionId: input.actionId,
      tier: policyEval.approvalTier ?? 'operator',
    });
    import('../../../lib/pubsub-bridge.js').then(({ pubsub, ALLOY_EVENTS }) => {
      void pubsub.publish(ALLOY_EVENTS.APPROVAL_REQUIRED, {
        alloyApprovalRequired: {
          id: approval.approvalId,
          workflowId: input.actionId,
          status: 'pending',
          reviewerUserId: null,
          reason: `PCE gate: approval required (tier: ${policyEval.approvalTier ?? 'operator'})`,
          requiredRoles: [policyEval.approvalTier ?? 'operator'],
          createdAt: approval.createdAt,
        },
      });
    }).catch(() => {/* ignore publish errors — gate decision is independent */});
    return {
      allowed: false,
      blockedReason: `Approval required (tier: ${policyEval.approvalTier ?? 'operator'})`,
      errorType: 'approval_required',
      requiresApproval: true,
      approvalTier: policyEval.approvalTier,
    };
  }

  if (input.approvalRecordId) {
    const approval = approvalRecords.get(input.approvalRecordId);
    if (!approval || approval.status !== 'approved') {
      return {
        allowed: false,
        blockedReason: 'Referenced approval record is not in "approved" status.',
        errorType: 'approval_required',
      };
    }
  }

  const contract: PCEContract = {
    contractId: `pce-${randomUUID().slice(0, 8)}`,
    actionId: input.actionId,
    workcellId: input.workcellId,
    originSignalIds: input.originSignalIds,
    causalChainIds: input.causalChainIds ?? input.originSignalIds,
    policyEvaluationId: policyEval.evalId,
    approvalRecordId: input.approvalRecordId,
    mirrorEvalId: mirrorEval.evalId,
    mode: demo ? 'demo' : 'governed',
    isVerified: false,
    evidenceCoverage: coverage,
    createdAt: new Date().toISOString(),
  };

  pceContracts.set(contract.contractId, contract);
  void persistPceContract(contract);

  return { allowed: true, contract };
}

export async function verifyPCEContract(contractId: string): Promise<{ verified: boolean; reason?: string }> {
  const contract = pceContracts.get(contractId);
  if (!contract) return { verified: false, reason: 'Contract not found.' };

  if (!contract.executionTraceId) {
    return { verified: false, reason: 'No execution trace attached to contract.' };
  }

  contract.isVerified = true;
  contract.verifiedAt = new Date().toISOString();

  const proofPacket = generateProofPacket(contract);
  contract.proofPacketId = proofPacket.packetId;

  void persistPceContract(contract);

  return { verified: true };
}

export function generateProofPacket(contract: PCEContract): ProofPacketRecord {
  const payload = {
    contractId: contract.contractId,
    actionId: contract.actionId,
    originSignalIds: contract.originSignalIds,
    mirrorEvalId: contract.mirrorEvalId,
    approvalRecordId: contract.approvalRecordId,
    executionTraceId: contract.executionTraceId,
    mode: contract.mode,
    issuedAt: new Date().toISOString(),
  };

  const previousPacket = [...proofPackets.values()].pop();
  const previousHash = previousPacket?.hash;

  const hash = createHash('sha256')
    .update(JSON.stringify(payload))
    .update(previousHash ?? 'genesis')
    .digest('hex');

  const packet: ProofPacketRecord = {
    packetId: `pp-${randomUUID().slice(0, 8)}`,
    contractId: contract.contractId,
    actionId: contract.actionId,
    entityId: contract.actionId,
    hash: `sha256:${hash}`,
    previousHash: previousHash ? `sha256:${previousHash.replace('sha256:', '')}` : undefined,
    payload,
    witnessedBy: ['a11oy-runtime', 'pce-gate', 'covenant-guard'],
    issuedAt: new Date().toISOString(),
  };

  proofPackets.set(packet.packetId, packet);
  void persistProofPacket(packet);
  return packet;
}

export function getPCEContract(contractId: string): PCEContract | undefined {
  return pceContracts.get(contractId);
}

export function listPCEContracts(limit = 50): PCEContract[] {
  return [...pceContracts.values()].slice(-limit).reverse();
}

export function attachTraceToContract(contractId: string, traceId: string): void {
  const contract = pceContracts.get(contractId);
  if (contract) {
    contract.executionTraceId = traceId;
    void persistPceContract(contract);
  }
}

export function getProofPacket(packetId: string): ProofPacketRecord | undefined {
  return proofPackets.get(packetId);
}

export function listProofPackets(limit = 50): ProofPacketRecord[] {
  return [...proofPackets.values()].slice(-limit).reverse();
}

export function listApprovalRecords(limit = 50): ApprovalRecord[] {
  return [...approvalRecords.values()].slice(-limit).reverse();
}

export function getPolicyEvaluation(evalId: string): PolicyEvaluation | undefined {
  return policyEvaluations.get(evalId);
}

export function hydratePceGateStores(opts: {
  contracts?: PCEContract[];
  approvals?: ApprovalRecord[];
  packets?: ProofPacketRecord[];
  policyEvals?: PolicyEvaluation[];
}): void {
  for (const c of opts.contracts ?? []) {
    if (!pceContracts.has(c.contractId)) pceContracts.set(c.contractId, c);
  }
  for (const a of opts.approvals ?? []) {
    if (!approvalRecords.has(a.approvalId)) approvalRecords.set(a.approvalId, a);
  }
  for (const p of opts.packets ?? []) {
    if (!proofPackets.has(p.packetId)) proofPackets.set(p.packetId, p);
  }
  for (const e of opts.policyEvals ?? []) {
    if (!policyEvaluations.has(e.evalId)) policyEvaluations.set(e.evalId, e);
  }
}
