import assert from 'node:assert/strict';
import { test } from 'node:test';
import type {
  BusinessSignal,
  ProofCarryingExecutionContract,
  ProofPacket,
  Workcell,
} from '@workspace/a11oy-fabric';
import { evaluateWorkcellProofCoverage } from '../src/lib/workcell-proof-coverage.ts';

const timestamp = '2026-04-26T12:00:00.000Z';
const seedSignal: BusinessSignal = {
  id: 'sig-lyte-002',
  vertical: 'lyte-revenue',
  entity: 'account',
  title: 'Fixture signal',
  description: 'Deterministic test signal.',
  severity: 'high',
  status: 'active',
  businessImpact: 'Fixture only',
  evidenceRefs: [],
  owner: 'fixture-owner',
  detectedAt: timestamp,
  updatedAt: timestamp,
  tags: [],
  metadata: {},
};
const seedWorkcell: Workcell = {
  id: 'wc-001',
  name: 'Revenue Friction Remediation',
  vertical: 'lyte-revenue',
  status: 'running',
  operationalAvailability: 'DEMO',
  operationalEvidence: 'Deterministic fixture.',
  objective: 'Test proof coverage.',
  signals: [seedSignal.id],
  contextPack: {},
  agentSequence: [],
  actionBrief: {
    id: 'act-001',
    title: 'Fixture action',
    description: 'Deterministic test action.',
    vertical: 'lyte-revenue',
    status: 'pending_approval',
    recommendedBy: 'fixture-agent',
    priority: 'high',
    estimatedImpact: 'Fixture only',
    requiresApproval: true,
    approvalTier: 'executive',
    linkedSignalIds: [seedSignal.id],
    linkedOutcomeIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  mirrorEvalResult: {
    id: 'eval-001',
    targetId: 'act-001',
    targetType: 'action',
    verdict: 'pass',
    score: 1,
    dimensions: [],
    flags: [],
    evaluatorModel: 'fixture-evaluator',
    evaluatedAt: timestamp,
  },
  pceContractId: 'pce-001',
  requiresApproval: true,
  mockExecutionResult: {},
  verificationResult: { status: 'passed', checksum: 'fixture-checksum' },
  proofPacketId: 'proof-001',
  executionTraceId: 'trace-001',
  createdAt: timestamp,
  updatedAt: timestamp,
};
const seedContract: ProofCarryingExecutionContract = {
  id: seedWorkcell.pceContractId,
  actionId: seedWorkcell.actionBrief.id,
  originSignalId: seedSignal.id,
  causalChainIds: [seedSignal.id],
  policyEvaluationId: 'pe-001',
  approvalRecordId: 'ar-001',
  executionTraceId: seedWorkcell.executionTraceId,
  proofPacketId: seedWorkcell.proofPacketId,
  mode: 'governed',
  isVerified: true,
  verifiedAt: timestamp,
  createdAt: timestamp,
};

const completePacket: ProofPacket = {
  id: seedWorkcell.proofPacketId,
  kind: 'action_execution',
  entityId: seedWorkcell.id,
  entityType: 'workcell',
  hash: 'fixture-hash-present',
  payload: {},
  policyEvaluationId: seedContract.policyEvaluationId,
  approvalRecordId: seedContract.approvalRecordId,
  witnessedBy: [],
  issuedAt: timestamp,
  vertical: seedWorkcell.vertical,
};
const seedSignalPacket: ProofPacket = {
  ...completePacket,
  kind: 'signal_ingestion',
  entityId: seedSignal.id,
  entityType: 'signal',
};

test('marks coverage complete only when every declared reference resolves and agrees', () => {
  const coverage = evaluateWorkcellProofCoverage({
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
  });

  assert.equal(coverage.state, 'COMPLETE');
  assert.equal(coverage.satisfied, coverage.total);
  assert.deepEqual(
    new Set(coverage.obligations.map((item) => item.status)),
    new Set(['SATISFIED']),
  );
});

test('reports the represented seed gaps without treating a hash string as full execution proof', () => {
  const coverage = evaluateWorkcellProofCoverage({
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [seedSignalPacket],
  });

  assert.equal(coverage.state, 'INCOMPLETE');
  assert.equal(
    coverage.obligations.find((item) => item.id === 'policy-evaluation')?.status,
    'UNAVAILABLE',
  );
  assert.equal(
    coverage.obligations.find((item) => item.id === 'approval-binding')?.status,
    'UNAVAILABLE',
  );
  assert.equal(
    coverage.obligations.find((item) => item.id === 'proof-subject')?.status,
    'MISMATCH',
  );
  assert.match(
    coverage.obligations.find((item) => item.id === 'terminal-state')?.detail ?? '',
    /not signature verification/i,
  );
});

test('fails closed when a challenge substitutes the contract action', () => {
  const coverage = evaluateWorkcellProofCoverage({
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
    challenges: { substituteActionId: true },
  });

  assert.equal(coverage.state, 'INCOMPLETE');
  assert.equal(
    coverage.obligations.find((item) => item.id === 'action-binding')?.status,
    'MISMATCH',
  );
});

test('fails closed when a proof or approval reference is omitted', () => {
  const proofRemoved = evaluateWorkcellProofCoverage({
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
    challenges: { removeProofReference: true },
  });
  const approvalRemoved = evaluateWorkcellProofCoverage({
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
    challenges: { removeApprovalReference: true },
  });

  assert.equal(
    proofRemoved.obligations.find((item) => item.id === 'proof-reference')?.status,
    'UNAVAILABLE',
  );
  assert.equal(
    approvalRemoved.obligations.find((item) => item.id === 'approval-binding')?.status,
    'UNAVAILABLE',
  );
});

test('keeps contradictory packet context and contract references incomplete', () => {
  const cases: Array<{
    id: 'proof-context' | 'proof-policy-binding' | 'proof-approval-binding';
    packet: ProofPacket;
  }> = [
    {
      id: 'proof-context',
      packet: { ...completePacket, kind: 'signal_ingestion' },
    },
    {
      id: 'proof-policy-binding',
      packet: { ...completePacket, policyEvaluationId: 'pe-wrong' },
    },
    {
      id: 'proof-approval-binding',
      packet: { ...completePacket, approvalRecordId: 'ar-wrong' },
    },
  ];

  for (const fixture of cases) {
    const coverage = evaluateWorkcellProofCoverage({
      workcell: seedWorkcell,
      signals: [seedSignal],
      pceContracts: [seedContract],
      proofPackets: [fixture.packet],
      policyEvaluationIds: [seedContract.policyEvaluationId],
      approvalRecordIds: [seedContract.approvalRecordId as string],
    });

    assert.equal(coverage.state, 'INCOMPLETE', fixture.id);
    assert.equal(
      coverage.obligations.find((item) => item.id === fixture.id)?.status,
      'MISMATCH',
      fixture.id,
    );
  }
});

test('rejects approval references and configuration disagreement when approval is not required', () => {
  const noApprovalWorkcell: Workcell = {
    ...seedWorkcell,
    requiresApproval: false,
    actionBrief: { ...seedWorkcell.actionBrief, requiresApproval: false },
  };
  const declaredApprovalContract: ProofCarryingExecutionContract = {
    ...seedContract,
    approvalRecordId: 'ar-contract',
  };
  const contradictoryPacket: ProofPacket = {
    ...completePacket,
    approvalRecordId: 'ar-packet',
  };
  const declaredCoverage = evaluateWorkcellProofCoverage({
    workcell: noApprovalWorkcell,
    signals: [seedSignal],
    pceContracts: [declaredApprovalContract],
    proofPackets: [contradictoryPacket],
  });

  assert.equal(declaredCoverage.state, 'INCOMPLETE');
  assert.equal(
    declaredCoverage.obligations.find((item) => item.id === 'approval-binding')?.status,
    'MISMATCH',
  );
  assert.equal(
    declaredCoverage.obligations.find((item) => item.id === 'proof-approval-binding')?.status,
    'MISMATCH',
  );

  const inconsistentWorkcell: Workcell = {
    ...noApprovalWorkcell,
    actionBrief: { ...noApprovalWorkcell.actionBrief, requiresApproval: true },
  };
  const inconsistentCoverage = evaluateWorkcellProofCoverage({
    workcell: inconsistentWorkcell,
    signals: [seedSignal],
    pceContracts: [{ ...seedContract, approvalRecordId: undefined }],
    proofPackets: [{ ...completePacket, approvalRecordId: undefined }],
    policyEvaluationIds: [seedContract.policyEvaluationId],
  });

  assert.equal(inconsistentCoverage.state, 'INCOMPLETE');
  assert.equal(
    inconsistentCoverage.obligations.find((item) => item.id === 'approval-binding')?.status,
    'MISMATCH',
  );
  assert.equal(
    inconsistentCoverage.obligations.find((item) => item.id === 'proof-approval-binding')?.status,
    'MISMATCH',
  );
});

test('marks contract-dependent obligations unavailable when the PCE contract is absent', () => {
  const coverage = evaluateWorkcellProofCoverage({
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [],
    proofPackets: [seedSignalPacket],
  });

  assert.equal(coverage.state, 'INCOMPLETE');
  for (const item of coverage.obligations.filter((entry) => entry.id !== 'signal-records')) {
    assert.equal(item.status, 'UNAVAILABLE', item.id);
  }
});
