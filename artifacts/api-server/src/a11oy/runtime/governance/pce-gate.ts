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
  | 'strategic';

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
};

const pceContracts = new Map<string, PCEContract>();
const approvalRecords = new Map<string, ApprovalRecord>();
const proofPackets = new Map<string, ProofPacketRecord>();
const policyEvaluations = new Map<string, PolicyEvaluation>();

function isDemoMode(): boolean {
  return process.env.A11OY_DEMO_MODE !== 'false';
}

export function classifyRisk(opts: {
  riskLevel: string;
  isDestructive: boolean;
  vertical: string;
}): RiskClass[] {
  const classes: RiskClass[] = [];
  if (['financial', 'revenue'].includes(opts.vertical)) classes.push('financial');
  if (['prism-counsel', 'legal'].includes(opts.vertical)) classes.push('legal');
  if (['aegis-defense', 'security'].includes(opts.vertical)) classes.push('security');
  if (opts.isDestructive) classes.push('data_destructive');
  if (['vessels-maritime', 'maritime'].includes(opts.vertical)) classes.push('operational');
  if (['lyte-revenue'].includes(opts.vertical)) classes.push('customer_facing');
  if (opts.riskLevel === 'critical') classes.push('strategic');
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
  return record;
}

export function approveAction(approvalId: string, approvedBy: string): ApprovalRecord | undefined {
  const record = approvalRecords.get(approvalId);
  if (!record) return undefined;
  record.status = 'approved';
  record.approvedBy = approvedBy;
  record.approvedAt = new Date().toISOString();
  return record;
}

export function rejectAction(approvalId: string, reason: string): ApprovalRecord | undefined {
  const record = approvalRecords.get(approvalId);
  if (!record) return undefined;
  record.status = 'rejected';
  record.rejectedReason = reason;
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
  if (contract) contract.executionTraceId = traceId;
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
