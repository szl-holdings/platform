import assert from 'node:assert/strict';
import { test } from 'node:test';
import type {
  BusinessSignal,
  ExecutionTrace,
  ProofCarryingExecutionContract,
  ProofPacket,
  Workcell,
} from '@workspace/a11oy-fabric';
import { evaluateWorkcellProofCoverage } from '../src/lib/workcell-proof-coverage.ts';

const timestamp = '2026-04-26T12:00:00.000Z';
const checksum = (character: string) => `sha256:${character.repeat(64)}`;
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
  verificationResult: { status: 'passed', checksum: checksum('c') },
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
  hash: checksum('a'),
  payload: { actionId: seedWorkcell.actionBrief.id },
  policyEvaluationId: seedContract.policyEvaluationId,
  approvalRecordId: seedContract.approvalRecordId,
  witnessedBy: ['fixture-witness'],
  issuedAt: timestamp,
  vertical: seedWorkcell.vertical,
};
const completeTrace: ExecutionTrace = {
  id: seedWorkcell.executionTraceId,
  workcellId: seedWorkcell.id,
  runId: 'run-001',
  steps: [
    {
      stepId: 'step-001',
      name: 'Fixture execution',
      tool: 'fixture-tool',
      input: {},
      output: {},
      durationMs: 25,
      status: 'ok',
      timestamp,
    },
  ],
  finalStatus: 'completed',
  durationMs: 25,
  proofPacketId: seedWorkcell.proofPacketId,
  startedAt: timestamp,
  completedAt: '2026-04-26T12:00:00.025Z',
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
    executionTraces: [completeTrace],
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
    executionTraces: [completeTrace],
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
    executionTraces: [completeTrace],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
    challenges: { removeProofReference: true },
  });
  const approvalRemoved = evaluateWorkcellProofCoverage({
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    executionTraces: [completeTrace],
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
      executionTraces: [completeTrace],
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
    executionTraces: [completeTrace],
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
    executionTraces: [completeTrace],
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
  for (const id of [
    'contract-record',
    'contract-integrity',
    'origin-signal',
    'action-binding',
    'trace-binding',
    'policy-evaluation',
    'approval-binding',
    'proof-reference',
    'proof-subject',
    'proof-context',
    'proof-policy-binding',
    'proof-approval-binding',
    'proof-integrity',
    'terminal-state',
  ] as const) {
    assert.equal(coverage.obligations.find((item) => item.id === id)?.status, 'UNAVAILABLE', id);
  }
  assert.equal(
    coverage.obligations.find((item) => item.id === 'action-context')?.status,
    'SATISFIED',
  );
  assert.equal(
    coverage.obligations.find((item) => item.id === 'evaluation-lineage')?.status,
    'SATISFIED',
  );
});

test('requires exactly one resolved ExecutionTrace record before coverage can be complete', () => {
  const base = {
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
  };
  const missing = evaluateWorkcellProofCoverage(base);
  const duplicate = evaluateWorkcellProofCoverage({
    ...base,
    executionTraces: [completeTrace, structuredClone(completeTrace)],
  });
  const contradictory = evaluateWorkcellProofCoverage({
    ...base,
    executionTraces: [{ ...completeTrace, workcellId: 'wc-other' }],
  });

  assert.equal(missing.state, 'INCOMPLETE');
  assert.equal(
    missing.obligations.find((item) => item.id === 'trace-binding')?.status,
    'UNAVAILABLE',
  );
  for (const coverage of [duplicate, contradictory]) {
    assert.equal(coverage.state, 'INCOMPLETE');
    assert.equal(
      coverage.obligations.find((item) => item.id === 'trace-binding')?.status,
      'MISMATCH',
    );
  }
});

test('rejects duplicate contract, packet, signal, policy, and approval identities', () => {
  const base = {
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    executionTraces: [completeTrace],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
  };
  const cases = [
    {
      id: 'contract-record',
      coverage: evaluateWorkcellProofCoverage({
        ...base,
        pceContracts: [seedContract, structuredClone(seedContract)],
      }),
    },
    {
      id: 'proof-reference',
      coverage: evaluateWorkcellProofCoverage({
        ...base,
        proofPackets: [completePacket, structuredClone(completePacket)],
      }),
    },
    {
      id: 'signal-records',
      coverage: evaluateWorkcellProofCoverage({
        ...base,
        signals: [seedSignal, structuredClone(seedSignal)],
      }),
    },
    {
      id: 'policy-evaluation',
      coverage: evaluateWorkcellProofCoverage({
        ...base,
        policyEvaluationIds: [seedContract.policyEvaluationId, seedContract.policyEvaluationId],
      }),
    },
    {
      id: 'approval-binding',
      coverage: evaluateWorkcellProofCoverage({
        ...base,
        approvalRecordIds: [
          seedContract.approvalRecordId as string,
          seedContract.approvalRecordId as string,
        ],
      }),
    },
  ] as const;

  for (const { id, coverage } of cases) {
    assert.equal(coverage.state, 'INCOMPLETE', id);
    assert.equal(coverage.obligations.find((item) => item.id === id)?.status, 'MISMATCH', id);
  }
});

test('rejects unverified contracts and malformed causal-chain metadata', () => {
  const coverage = evaluateWorkcellProofCoverage({
    workcell: seedWorkcell,
    signals: [seedSignal],
    pceContracts: [
      {
        ...seedContract,
        causalChainIds: [],
        isVerified: false,
        verifiedAt: undefined,
      },
    ],
    proofPackets: [completePacket],
    executionTraces: [completeTrace],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
  });

  assert.equal(coverage.state, 'INCOMPLETE');
  assert.equal(
    coverage.obligations.find((item) => item.id === 'contract-integrity')?.status,
    'MISMATCH',
  );
  assert.match(
    coverage.obligations.find((item) => item.id === 'contract-integrity')?.detail ?? '',
    /causal chain.*origin signal.*contract is not verified.*verifiedAt/is,
  );
});

test('rejects contradictory ActionBrief and MirrorEval lineage', () => {
  const coverage = evaluateWorkcellProofCoverage({
    workcell: {
      ...seedWorkcell,
      actionBrief: {
        ...seedWorkcell.actionBrief,
        vertical: 'alloy-core',
        linkedSignalIds: ['sig-other'],
        approvalTier: 'auto',
      },
      mirrorEvalResult: {
        ...seedWorkcell.mirrorEvalResult,
        targetId: 'act-other',
      },
    },
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    executionTraces: [completeTrace],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
  });

  assert.equal(coverage.state, 'INCOMPLETE');
  assert.equal(
    coverage.obligations.find((item) => item.id === 'action-context')?.status,
    'MISMATCH',
  );
  assert.equal(
    coverage.obligations.find((item) => item.id === 'evaluation-lineage')?.status,
    'MISMATCH',
  );
});

test('requires structured packet integrity and a SHA-256-shaped terminal checksum', () => {
  const coverage = evaluateWorkcellProofCoverage({
    workcell: {
      ...seedWorkcell,
      verificationResult: { ...seedWorkcell.verificationResult, checksum: 'not-a-checksum' },
    },
    signals: [seedSignal],
    pceContracts: [seedContract],
    proofPackets: [
      {
        ...completePacket,
        hash: 'x',
        payload: {},
        witnessedBy: [],
        issuedAt: 'not-a-date',
      },
    ],
    executionTraces: [completeTrace],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
  });

  assert.equal(coverage.state, 'INCOMPLETE');
  assert.equal(
    coverage.obligations.find((item) => item.id === 'proof-integrity')?.status,
    'MISMATCH',
  );
  assert.equal(
    coverage.obligations.find((item) => item.id === 'terminal-state')?.status,
    'MISMATCH',
  );
  assert.match(
    coverage.obligations.find((item) => item.id === 'proof-integrity')?.detail ?? '',
    /not signature verification/i,
  );
});

test('requires the execution trace terminal outcome to agree with Workcell verification', () => {
  for (const finalStatus of ['completed', 'failed', 'cancelled'] as const) {
    for (const status of ['passed', 'failed'] as const) {
      const coverage = evaluateWorkcellProofCoverage({
        workcell: {
          ...seedWorkcell,
          verificationResult: { ...seedWorkcell.verificationResult, status },
        },
        signals: [seedSignal],
        pceContracts: [seedContract],
        proofPackets: [completePacket],
        executionTraces: [{ ...completeTrace, finalStatus }],
        policyEvaluationIds: [seedContract.policyEvaluationId],
        approvalRecordIds: [seedContract.approvalRecordId as string],
      });
      const coherent = finalStatus === 'completed' ? status === 'passed' : status === 'failed';
      assert.equal(
        coverage.state,
        coherent ? 'COMPLETE' : 'INCOMPLETE',
        `${finalStatus}/${status}`,
      );
      assert.equal(
        coverage.obligations.find((item) => item.id === 'terminal-state')?.status,
        coherent ? 'SATISFIED' : 'MISMATCH',
      );
    }
  }
});

test('requires contract origin lineage to be linked to the same ActionBrief', () => {
  const secondSignal = { ...seedSignal, id: 'sig-second' };
  const coverage = evaluateWorkcellProofCoverage({
    workcell: {
      ...seedWorkcell,
      signals: [seedSignal.id, secondSignal.id],
      actionBrief: { ...seedWorkcell.actionBrief, linkedSignalIds: [secondSignal.id] },
    },
    signals: [seedSignal, secondSignal],
    pceContracts: [seedContract],
    proofPackets: [completePacket],
    executionTraces: [completeTrace],
    policyEvaluationIds: [seedContract.policyEvaluationId],
    approvalRecordIds: [seedContract.approvalRecordId as string],
  });
  assert.equal(coverage.state, 'INCOMPLETE');
  assert.equal(
    coverage.obligations.find((item) => item.id === 'origin-signal')?.status,
    'MISMATCH',
  );
  assert.equal(
    coverage.obligations.find((item) => item.id === 'action-context')?.status,
    'SATISFIED',
  );
});

test('requires packet payload action identity even when the outer proof subject matches', () => {
  for (const entityType of ['workcell', 'action'] as const) {
    for (const payload of [
      { actionId: 'act-other' },
      { unrelated: true },
      { actionId: '' },
      { actionId: 123 },
    ]) {
      const coverage = evaluateWorkcellProofCoverage({
        workcell: seedWorkcell,
        signals: [seedSignal],
        pceContracts: [seedContract],
        proofPackets: [
          {
            ...completePacket,
            entityType,
            entityId: entityType === 'workcell' ? seedWorkcell.id : seedWorkcell.actionBrief.id,
            payload,
          },
        ],
        executionTraces: [completeTrace],
        policyEvaluationIds: [seedContract.policyEvaluationId],
        approvalRecordIds: [seedContract.approvalRecordId as string],
      });
      assert.equal(coverage.state, 'INCOMPLETE');
      assert.equal(
        coverage.obligations.find((item) => item.id === 'proof-subject')?.status,
        'SATISFIED',
      );
      assert.equal(
        coverage.obligations.find((item) => item.id === 'proof-context')?.status,
        'MISMATCH',
      );
    }
  }
});
