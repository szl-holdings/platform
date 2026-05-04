import { createHash } from 'node:crypto';
import { newId } from './types.js';
import type { ProofChainRecord, CognitivePhase, PhaseResult, ProofApprovalStatus } from './types.js';

// In-memory proof chain store — keyed by proofChainId, tenant-scoped on read
const PROOF_STORE = new Map<string, ProofChainRecord>();
const MAX_PROOF_RECORDS = 2000;

function computeAuditHash(lineage: unknown[]): string {
  const canonical = JSON.stringify(lineage, null, 0);
  return createHash('sha256').update(canonical).digest('hex');
}

export function createProofChain(opts: {
  requestId: string;
  tenantId: string;
  orgId?: number;
  routeDecisionId?: string;
  workerId?: string;
  model?: string;
  provider?: string;
  approvalStatus?: ProofApprovalStatus;
  confidenceScore?: number;
  riskScore?: number;
  latencyMs?: number;
  costEstimateUsd?: number;
  sourceCount?: number;
  memoryHitCount?: number;
  phases?: PhaseResult[];
  executionSucceeded?: boolean;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}): ProofChainRecord {
  const {
    requestId,
    tenantId,
    routeDecisionId,
    workerId,
    model,
    provider,
    approvalStatus = 'not_required',
    confidenceScore,
    riskScore,
    latencyMs,
    costEstimateUsd,
    sourceCount = 0,
    memoryHitCount = 0,
    phases = [],
    executionSucceeded = true,
    failureReason,
    metadata = {},
  } = opts;

  const proofChainId = newId('pch');
  const now = new Date().toISOString();

  const completedPhases = phases
    .filter((p) => p.status === 'completed')
    .map((p) => p.phase as string);

  const lineage: unknown[] = [
    { step: 'request_received', requestId, tenantId, at: now },
    ...(routeDecisionId ? [{ step: 'route_decided', routeDecisionId, model, provider, workerId }] : []),
    ...phases.map((p) => ({
      step: `phase_${p.phase.toLowerCase()}`,
      phaseRunId: p.phaseRunId,
      status: p.status,
      latencyMs: p.latencyMs,
      failureClass: p.failureClass,
    })),
    {
      step: 'execution_complete',
      succeeded: executionSucceeded,
      failureReason: failureReason ?? null,
      approvalStatus,
      confidenceScore: confidenceScore ?? null,
      riskScore: riskScore ?? null,
    },
    { step: 'proof_sealed', proofChainId, at: now },
  ];

  const auditHash = computeAuditHash(lineage);

  const record: ProofChainRecord = {
    proofChainId,
    requestId,
    tenantId,
    routeDecisionId,
    workerId,
    model,
    provider,
    approvalStatus,
    confidenceScore,
    riskScore,
    latencyMs,
    costEstimateUsd,
    sourceCount,
    memoryHitCount,
    phaseCount: phases.length,
    completedPhases,
    auditHash,
    lineage,
    executionSucceeded,
    failureReason,
    sealedAt: now,
    createdAt: now,
    metadata,
  };

  // Persist to in-memory store
  if (PROOF_STORE.size >= MAX_PROOF_RECORDS) {
    const oldest = Array.from(PROOF_STORE.entries())
      .sort(([, a], [, b]) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, Math.floor(MAX_PROOF_RECORDS * 0.1));
    for (const [k] of oldest) PROOF_STORE.delete(k);
  }
  PROOF_STORE.set(proofChainId, record);

  return record;
}

export function getProofChain(proofChainId: string, tenantId: string): ProofChainRecord | undefined {
  const record = PROOF_STORE.get(proofChainId);
  if (!record || record.tenantId !== tenantId) return undefined;
  return record;
}

export function listProofChains(
  tenantId: string,
  opts: { limit?: number; offset?: number; requestId?: string } = {},
): { records: ProofChainRecord[]; total: number } {
  const { limit = 50, offset = 0, requestId } = opts;

  let records = Array.from(PROOF_STORE.values())
    .filter((r) => {
      if (r.tenantId !== tenantId) return false;
      if (requestId && r.requestId !== requestId) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = records.length;
  records = records.slice(offset, offset + limit);
  return { records, total };
}

export function verifyProofChainIntegrity(record: ProofChainRecord): {
  valid: boolean;
  expectedHash: string;
  actualHash: string;
} {
  const expectedHash = computeAuditHash(record.lineage);
  return {
    valid: expectedHash === record.auditHash,
    expectedHash,
    actualHash: record.auditHash,
  };
}
