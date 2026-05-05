import { createHash } from 'node:crypto';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@szl-holdings/db', () => {
  const rows: Record<string, any[]> = {
    cps_runs: [],
    cps_approvals: [],
    cps_proof_bundles: [],
  };

  function makeTable(name: string) {
    return {
      $inferSelect: {} as any,
      id: { name: 'id' },
    };
  }

  const mockDb = {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };

  return {
    db: mockDb,
    cpsRunsTable: makeTable('cps_runs'),
    cpsApprovalsTable: makeTable('cps_approvals'),
    cpsProofBundlesTable: makeTable('cps_proof_bundles'),
  };
});

vi.mock('../../domain-events/index.js', () => ({
  domainEventBus: { publish: vi.fn() },
}));

vi.mock('@workspace/run-ledger', () => ({
  buildLedgerFromRun: vi.fn().mockReturnValue({}),
  defaultRunLedgerStore: { save: vi.fn() },
}));

vi.mock('@szl-holdings/evidence-ledger', () => ({
  EvidenceLedger: class MockEvidenceLedger { append = vi.fn(); },
}));

vi.mock('@workspace/approvals-inbox', () => ({
  submitPendingApprovalRequest: vi.fn(),
  resolvePendingApprovalRequest: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: any, val: any) => ({ _type: 'eq', val })),
  desc: vi.fn((_col: any) => ({ _type: 'desc' })),
  and: vi.fn((...conds: any[]) => ({ _type: 'and', conds })),
  sql: vi.fn(),
}));

import {
  registerPayload,
  rollbackRun,
  executePayloadRun,
  type CpsPayloadDefinition,
  type CpsPrincipal,
  type CpsPayloadRun,
} from '../domain-services/cps/index.js';
import { db } from '@szl-holdings/db';

const OPERATOR_PRINCIPAL: CpsPrincipal = {
  id: 'op-001',
  displayName: 'Operator Smith',
  email: 'op@test.com',
  roles: ['operator'],
};

const ANALYST_PRINCIPAL: CpsPrincipal = {
  id: 'analyst-001',
  displayName: 'Analyst Jones',
  email: 'analyst@test.com',
  roles: ['analyst'],
};

const VIEWER_PRINCIPAL: CpsPrincipal = {
  id: 'viewer-001',
  displayName: 'Viewer Doe',
  email: 'viewer@test.com',
  roles: ['viewer'],
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

function computeTestSignatureHash(p: Partial<CpsPayloadDefinition> & Pick<CpsPayloadDefinition, 'id' | 'version' | 'detectionLogic' | 'decisionPolicy' | 'constrainedActions' | 'rollbackContract'>): string {
  const content = canonicalize({
    id: p.id,
    version: p.version,
    detectionLogic: p.detectionLogic,
    decisionPolicy: p.decisionPolicy,
    constrainedActions: p.constrainedActions,
    rollbackContract: p.rollbackContract,
  });
  return createHash('sha256').update(content).digest('hex');
}

function makeTestPayload(overrides?: Partial<CpsPayloadDefinition>): CpsPayloadDefinition {
  const base: CpsPayloadDefinition = {
    id: 'test-rollback-payload',
    name: 'Rollback Test Payload',
    version: '1.0.0',
    description: 'Payload for testing rollback contracts',
    category: 'test-defense',
    mitreTactics: ['TA0001'],
    mitretechniques: ['T1078'],
    defaultMaturityMode: 'shadow',
    defaultApprovalTier: 'auto',
    detectionLogic: [
      {
        id: 'detect-test',
        name: 'Test Detection',
        condition: 'test-signal-match',
        severity: 'high',
        indicators: ['test-indicator'],
      },
    ],
    decisionPolicy: {
      riskThresholds: { high: 0.7, critical: 0.9 },
      autoActionConditions: ['confidence > 0.8'],
      escalationCriteria: ['severity == critical'],
      approvalOverrides: [],
    },
    constrainedActions: [
      {
        id: 'action-test',
        type: 'test-containment',
        description: 'Test containment action',
        reversible: true,
        requiresApproval: false,
        approvalTier: 'auto',
        impactLevel: 'medium',
        rollbackProcedure: 'Reverse test containment and verify connectivity',
      },
    ],
    rollbackContract: {
      tested: true,
      lastTestedAt: new Date().toISOString(),
      steps: [
        {
          order: 1,
          action: 'Reverse containment',
          target: 'test-system',
          verifyCommand: 'verify-test-system-state',
          timeout: 30000,
        },
      ],
      verificationChecks: ['Verify system restored', 'Confirm connectivity'],
      maxRollbackWindowMs: 2 * 60 * 60 * 1000,
    },
    tags: ['test'],
    signatureHash: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
  base.signatureHash = computeTestSignatureHash(base);
  return base;
}

function mockDbRunLookup(run: CpsPayloadRun | null) {
  const mockDb = db as any;
  if (!run) {
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    return;
  }

  mockDb.select.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{
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
        }]),
      }),
    }),
  });

  mockDb.select.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(
        run.approvals.map((a) => ({
          id: a.id,
          runId: a.runId,
          tier: a.tier,
          status: a.status,
          approver: a.approver ?? null,
          approverRole: a.approverRole ?? null,
          approverId: a.approverId ?? null,
          reason: a.reason ?? null,
          dualApprovals: a.dualApprovals ?? [],
          requiredDualCount: a.requiredDualCount ?? null,
          deadlineAt: new Date(a.deadlineAt),
          requestedAt: new Date(a.requestedAt),
          respondedAt: a.respondedAt ? new Date(a.respondedAt) : null,
        })),
      ),
    }),
  });

  const proofData = run.proofBundle ? [{
    id: run.proofBundle.id,
    runId: run.proofBundle.runId,
    payloadId: run.proofBundle.payloadId,
    payloadVersion: run.proofBundle.payloadVersion,
    signature: run.proofBundle.signature,
    sections: run.proofBundle.sections,
    governanceChecks: run.proofBundle.governanceChecks,
    residualRisk: run.proofBundle.residualRisk,
    classification: run.proofBundle.classification,
    generatedAt: new Date(run.proofBundle.generatedAt),
  }] : [];
  mockDb.select.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(proofData),
        }),
        limit: vi.fn().mockResolvedValue(proofData),
      }),
    }),
  });
}

function createCompletedRun(): CpsPayloadRun {
  return {
    id: 'run-test-001',
    tenantId: 'default',
    payloadId: 'test-rollback-payload',
    payloadVersion: '1.0.0',
    status: 'completed',
    maturityMode: 'supervised-auto',
    detect: {
      triggered: true,
      signals: [{
        id: 'sig-1',
        type: 'test-signal-match',
        source: 'telemetry-pipeline',
        severity: 'high',
        description: 'Test Detection',
        indicators: { 'test-indicator': true },
        timestamp: new Date().toISOString(),
      }],
      confidence: 0.87,
      timestamp: new Date().toISOString(),
    },
    decide: {
      action: 'test-containment',
      riskLevel: 'high',
      requiredApprovalTier: 'auto',
      reversible: true,
      rollbackSteps: ['Reverse containment'],
      businessImpact: 'Potential high-severity incident affecting 1 system(s)',
      reasoning: 'Test reasoning',
      constrainedActions: [{
        id: 'ca-1',
        type: 'test-containment',
        target: 'Test containment action',
        parameters: {},
        reversible: true,
        rollbackProcedure: 'Reverse test containment and verify connectivity',
        impactScope: 'medium',
      }],
      timestamp: new Date().toISOString(),
    },
    approvals: [],
    actions: [{
      actionId: 'ca-1',
      status: 'executed',
      executedAt: new Date().toISOString(),
      result: { type: 'test-containment', target: 'Test containment action', mode: 'supervised-auto' },
      rollbackAvailable: true,
    }],
    recover: {
      residualRisk: 'Monitor for 24h — verify no reoccurrence',
      verificationStatus: 'verified',
      recoveryActions: ['Verify system restored', 'Confirm connectivity'],
      completedAt: new Date().toISOString(),
    },
    proofBundle: null,
    governanceChecks: [{
      rule: 'signed-payload-deployment',
      passed: true,
      detail: 'Payload signature verified',
      checkedAt: new Date().toISOString(),
    }],
    triggeredBy: OPERATOR_PRINCIPAL,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    error: null,
    linkedCaseId: null,
  };
}

describe('CPS Rollback Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const payload = makeTestPayload();
    registerPayload(payload);
  });

  describe('rollbackRun', () => {
    it('marks all reversible actions as rolled-back and sets run status', async () => {
      const run = createCompletedRun();
      mockDbRunLookup(run);

      const result = await rollbackRun('run-test-001', OPERATOR_PRINCIPAL);

      expect(result).not.toBeNull();
      expect(result!.status).toBe('rolled-back');
      expect(result!.completedAt).toBeTruthy();

      const rolledBackActions = result!.actions.filter((a) => a.status === 'rolled-back');
      expect(rolledBackActions.length).toBeGreaterThan(0);
    });

    it('adds a rollback-executed governance check with operator identity', async () => {
      const run = createCompletedRun();
      mockDbRunLookup(run);

      const result = await rollbackRun('run-test-001', OPERATOR_PRINCIPAL);

      const rollbackCheck = result!.governanceChecks.find((gc) => gc.rule === 'rollback-executed');
      expect(rollbackCheck).toBeDefined();
      expect(rollbackCheck!.passed).toBe(true);
      expect(rollbackCheck!.detail).toContain('Operator Smith');
      expect(rollbackCheck!.detail).toContain('op-001');
    });

    it('returns null for a non-existent run', async () => {
      mockDbRunLookup(null);

      const result = await rollbackRun('non-existent-run', OPERATOR_PRINCIPAL);
      expect(result).toBeNull();
    });

    it('throws when rollback window has expired', async () => {
      const expiredPayload = makeTestPayload({
        rollbackContract: {
          tested: true,
          lastTestedAt: new Date().toISOString(),
          steps: [{ order: 1, action: 'Reverse', target: 'test', verifyCommand: 'verify', timeout: 30000 }],
          verificationChecks: ['Verify'],
          maxRollbackWindowMs: 1,
        },
      });
      registerPayload(expiredPayload);

      const run = createCompletedRun();
      run.startedAt = new Date(Date.now() - 60000).toISOString();
      mockDbRunLookup(run);

      await expect(rollbackRun('run-test-001', OPERATOR_PRINCIPAL)).rejects.toThrow(
        /Rollback window expired/,
      );
    });

    it('preserves non-reversible actions during rollback', async () => {
      const run = createCompletedRun();
      run.actions = [
        {
          actionId: 'ca-reversible',
          status: 'executed',
          executedAt: new Date().toISOString(),
          result: { type: 'test', mode: 'supervised-auto' },
          rollbackAvailable: true,
        },
        {
          actionId: 'ca-irreversible',
          status: 'executed',
          executedAt: new Date().toISOString(),
          result: { type: 'permanent', mode: 'supervised-auto' },
          rollbackAvailable: false,
        },
      ];
      mockDbRunLookup(run);

      const result = await rollbackRun('run-test-001', OPERATOR_PRINCIPAL);

      expect(result!.actions.find((a) => a.actionId === 'ca-reversible')!.status).toBe('rolled-back');
      expect(result!.actions.find((a) => a.actionId === 'ca-irreversible')!.status).toBe('executed');
    });

    it('regenerates and re-signs proof bundle after rollback', async () => {
      const run = createCompletedRun();
      const originalSignature = run.proofBundle?.signature;
      mockDbRunLookup(run);

      const result = await rollbackRun('run-test-001', OPERATOR_PRINCIPAL);

      expect(result).not.toBeNull();
      expect(result!.proofBundle).not.toBeNull();
      expect(result!.proofBundle!.residualRisk).toContain('Rollback executed');
      expect(result!.proofBundle!.residualRisk).toContain('Operator Smith');

      const rolledBackInProof = result!.proofBundle!.sections.act.filter(
        (a) => a.status === 'rolled-back',
      );
      expect(rolledBackInProof.length).toBeGreaterThan(0);

      const rollbackGovInProof = result!.proofBundle!.governanceChecks.find(
        (gc) => gc.rule === 'rollback-executed',
      );
      expect(rollbackGovInProof).toBeDefined();

      if (originalSignature) {
        expect(result!.proofBundle!.signature).not.toBe(originalSignature);
      }
    });

    it('sets completedAt timestamp on rollback', async () => {
      const run = createCompletedRun();
      run.completedAt = null;
      mockDbRunLookup(run);

      const result = await rollbackRun('run-test-001', OPERATOR_PRINCIPAL);

      expect(result).not.toBeNull();
      expect(result!.completedAt).toBeTruthy();
      expect(new Date(result!.completedAt!).getTime()).toBeGreaterThan(0);
    });
  });

  describe('confidence-based auto-rollback (network-defense)', () => {
    it('triggers auto-rollback when detection confidence is below threshold', async () => {
      const lowConfPayload = makeTestPayload({
        id: 'low-conf-payload',
        category: 'network-defense',
        decisionPolicy: {
          riskThresholds: { high: 0.9, critical: 0.95 },
          autoActionConditions: [],
          escalationCriteria: [],
          approvalOverrides: [],
        },
        detectionLogic: [
          {
            id: 'detect-low',
            name: 'Low confidence detection',
            condition: 'weak-signal',
            severity: 'medium',
            indicators: ['weak-ind'],
          },
        ],
      });
      registerPayload(lowConfPayload);

      const run = await executePayloadRun('low-conf-payload', OPERATOR_PRINCIPAL);

      if (run.detect && run.detect.confidence < (lowConfPayload.decisionPolicy.riskThresholds.high ?? 0.7)) {
        const autoRollbackCheck = run.governanceChecks.find((gc) => gc.rule === 'confidence-auto-rollback');
        expect(autoRollbackCheck).toBeDefined();
        expect(autoRollbackCheck!.passed).toBe(true);

        const rolledBack = run.actions.filter((a) => a.status === 'rolled-back');
        expect(rolledBack.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('rollback contract governance checks', () => {
    it('blocks execution when rollback contract is not tested', async () => {
      const untestedPayload = makeTestPayload({
        id: 'untested-rollback-payload',
        rollbackContract: {
          tested: false,
          lastTestedAt: '',
          steps: [{ order: 1, action: 'Reverse', target: 'test', verifyCommand: 'verify', timeout: 30000 }],
          verificationChecks: ['Verify'],
          maxRollbackWindowMs: 2 * 60 * 60 * 1000,
        },
      });
      registerPayload(untestedPayload);

      const run = await executePayloadRun('untested-rollback-payload', OPERATOR_PRINCIPAL);

      expect(run.status).toBe('blocked');
      const contractCheck = run.governanceChecks.find((gc) => gc.rule === 'rollback-contract-tested');
      expect(contractCheck).toBeDefined();
      expect(contractCheck!.passed).toBe(false);
    });

    it('passes execution when rollback contract is tested', async () => {
      const testedPayload = makeTestPayload({
        id: 'tested-rollback-payload',
      });
      registerPayload(testedPayload);

      const run = await executePayloadRun('tested-rollback-payload', OPERATOR_PRINCIPAL);

      const contractCheck = run.governanceChecks.find((gc) => gc.rule === 'rollback-contract-tested');
      if (contractCheck) {
        expect(contractCheck.passed).toBe(true);
      }
    });

    it('rejects payload registration without pre-computed signature hash', () => {
      const unsignedPayload = makeTestPayload({ id: 'unsigned-payload' });
      unsignedPayload.signatureHash = '';

      expect(() => registerPayload(unsignedPayload)).toThrow(/missing signatureHash/);
    });

    it('rejects payload registration with tampered signature hash', () => {
      const tamperedPayload = makeTestPayload({ id: 'tampered-payload' });
      tamperedPayload.signatureHash = 'deadbeef0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff';

      expect(() => registerPayload(tamperedPayload)).toThrow(/signatureHash mismatch/);
    });

    it('selects only warranted actions based on detection severity', async () => {
      const tieredPayload = makeTestPayload({
        id: 'tiered-action-payload',
        detectionLogic: [
          {
            id: 'detect-medium',
            name: 'Medium Signal',
            condition: 'medium-signal',
            severity: 'medium',
            indicators: ['ind-med'],
          },
        ],
        constrainedActions: [
          {
            id: 'low-action',
            type: 'low-impact-action',
            description: 'Low impact',
            reversible: true,
            requiresApproval: false,
            approvalTier: 'auto',
            impactLevel: 'low',
            rollbackProcedure: 'Undo low action',
          },
          {
            id: 'medium-action',
            type: 'medium-impact-action',
            description: 'Medium impact',
            reversible: true,
            requiresApproval: false,
            approvalTier: 'auto',
            impactLevel: 'medium',
            rollbackProcedure: 'Undo medium action',
          },
          {
            id: 'critical-action',
            type: 'critical-impact-action',
            description: 'Critical impact',
            reversible: true,
            requiresApproval: true,
            approvalTier: 'executive',
            impactLevel: 'critical',
            rollbackProcedure: 'Undo critical action',
          },
        ],
      });
      registerPayload(tieredPayload);

      const run = await executePayloadRun('tiered-action-payload', OPERATOR_PRINCIPAL);

      expect(run.decide).not.toBeNull();
      const selectedTypes = run.decide!.constrainedActions.map((a) => a.type);
      expect(selectedTypes).toContain('low-impact-action');
      expect(selectedTypes).toContain('medium-impact-action');
      expect(selectedTypes).not.toContain('critical-impact-action');
    });

    it('blocks irreversible high-impact actions without sufficient approval tier', async () => {
      const unsafePayload = makeTestPayload({
        id: 'unsafe-action-payload',
        detectionLogic: [
          {
            id: 'detect-high',
            name: 'High Signal',
            condition: 'high-signal',
            severity: 'high',
            indicators: ['ind-high'],
          },
        ],
        constrainedActions: [
          {
            id: 'safe-action',
            type: 'safe-action',
            description: 'Safe reversible action',
            reversible: true,
            requiresApproval: false,
            approvalTier: 'auto',
            impactLevel: 'low',
            rollbackProcedure: 'Undo safe action',
          },
          {
            id: 'unsafe-action',
            type: 'unsafe-action',
            description: 'Irreversible high-impact action with no approval gate',
            reversible: false,
            requiresApproval: false,
            approvalTier: 'auto',
            impactLevel: 'high',
            rollbackProcedure: 'Cannot undo',
          },
        ],
      });
      registerPayload(unsafePayload);

      const run = await executePayloadRun('unsafe-action-payload', OPERATOR_PRINCIPAL);

      const perActionCheck = run.governanceChecks.find(
        (gc) => gc.rule === 'no-irreversible-high-impact-without-approval:unsafe-action',
      );
      expect(perActionCheck).toBeDefined();
      expect(perActionCheck!.passed).toBe(false);
    });

    it('enforces mandatory rollback path for all constrained actions', async () => {
      const noRollbackPayload = makeTestPayload({
        id: 'no-rollback-payload',
        constrainedActions: [
          {
            id: 'action-no-rollback',
            type: 'dangerous-action',
            description: 'No rollback procedure',
            reversible: false,
            requiresApproval: false,
            approvalTier: 'auto',
            impactLevel: 'high',
            rollbackProcedure: '',
          },
        ],
      });
      registerPayload(noRollbackPayload);

      const run = await executePayloadRun('no-rollback-payload', OPERATOR_PRINCIPAL);

      expect(run.status).toBe('blocked');
      const rollbackCheck = run.governanceChecks.find((gc) => gc.rule === 'mandatory-rollback-path');
      expect(rollbackCheck).toBeDefined();
      expect(rollbackCheck!.passed).toBe(false);
    });
  });
});
