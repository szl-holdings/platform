import type { PolicyEvaluation } from '@szl-holdings/policy-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { executeWorkflow, registerRollbackHandler, registerStepHandler } from './executor.js';
import type { WorkflowDefinition } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDefinition(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    id: 'wf-test-001',
    name: 'Test Workflow',
    domain: 'test',
    steps: [
      {
        id: 'step-1',
        name: 'Step One',
        handler: 'noop-handler',
        executionMode: 'manual',
        requiresApproval: false,
        retryCount: 0,
      },
    ],
    executionMode: 'manual',
    isDryRunCapable: true,
    isSimulationCapable: true,
    requiresExplicitApproval: false,
    rollbackPolicy: 'step',
    ...overrides,
  };
}

function makeMinimalPolicyEvaluation(): PolicyEvaluation {
  return {
    evaluationId: 'eval-test-001',
    mode: 'auto-within-guardrails',
    action: 'test-action',
    subjectRoles: ['operator'],
    entitySensitivity: 'internal',
    confidence: 0.9,
    freshnessScore: 0.95,
    environment: 'production',
    windowValid: true,
    projectedImpact: 'Test action will proceed as planned.',
    projectedRisk: 'Low — test action with no side-effects.',
    evidenceChain: [{ source: 'db', summary: 'Test evidence', confidence: 0.9, freshness: 0.95 }],
    policyResult: {
      effect: 'allow',
      allowed: true,
      requiresApproval: false,
      matchedPolicies: [],
      violations: [],
      reasoning: 'Test reasoning',
      evaluatedAt: Date.now(),
    },
    evaluatedAt: Date.now(),
  };
}

beforeEach(() => {
  registerStepHandler('noop-handler', async (_params, _ctx) => ({ ok: true }));
  registerStepHandler('echo-handler', async (params, _ctx) => ({ ...params }));
  registerStepHandler('fail-handler', async (_params, _ctx) => {
    throw new Error('Step handler intentional failure');
  });
});

// ---------------------------------------------------------------------------
// 1. Policy-evaluation enforcement — the contract
// ---------------------------------------------------------------------------

describe('executeWorkflow — PolicyEvaluation enforcement', () => {
  it('throws immediately when policyEvaluation is absent (live execution path)', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    await expect(executeWorkflow({ definition: def })).rejects.toThrow(
      /policyEvaluation is required/i,
    );
  });

  it('does NOT throw when policyEvaluationOverride=true (test/demo bypass)', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    await expect(
      executeWorkflow({ definition: def, policyEvaluationOverride: true }),
    ).resolves.toBeDefined();
  });

  it('does NOT throw when isDryRun=true (dry-run bypass)', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    await expect(executeWorkflow({ definition: def, isDryRun: true })).resolves.toBeDefined();
  });

  it('does NOT throw when isSimulation=true (simulation bypass)', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    await expect(executeWorkflow({ definition: def, isSimulation: true })).resolves.toBeDefined();
  });

  it('does NOT throw when valid policyEvaluation is supplied', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    await expect(
      executeWorkflow({ definition: def, policyEvaluation: makeMinimalPolicyEvaluation() }),
    ).resolves.toBeDefined();
  });

  it('policyEvaluation is stored on the run record', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    const pe = makeMinimalPolicyEvaluation();
    const { run } = await executeWorkflow({ definition: def, policyEvaluation: pe });
    expect(run.policyEvaluation).toBeDefined();
    expect(run.policyEvaluation?.evaluationId).toBe(pe.evaluationId);
  });

  it('rejects an empty object passed as policyEvaluation — shape must match PolicyEvaluationSchema', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    await expect(
      executeWorkflow({ definition: def, policyEvaluation: {} as unknown as PolicyEvaluation }),
    ).rejects.toThrow(/policyEvaluation.*failed schema validation/i);
  });

  it('rejects a partial policyEvaluation missing required evaluationId — no silent fallback', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    const partial = {
      mode: 'approval-required',
      action: 'test.action',
    } as unknown as PolicyEvaluation;
    await expect(executeWorkflow({ definition: def, policyEvaluation: partial })).rejects.toThrow(
      /policyEvaluation.*failed schema validation/i,
    );
  });

  it('accepts malformed policyEvaluation when isDryRun=true (schema validation bypassed for dry runs)', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    await expect(
      executeWorkflow({
        definition: def,
        policyEvaluation: {} as unknown as PolicyEvaluation,
        isDryRun: true,
      }),
    ).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 2. Blocked run — blockedReason in PolicyEvaluation
// ---------------------------------------------------------------------------

describe('executeWorkflow — blocked run path', () => {
  it('returns status=cancelled and does not execute steps when blockedReason is set', async () => {
    const pe: PolicyEvaluation = {
      ...makeMinimalPolicyEvaluation(),
      blockedReason: 'Observe mode — action logged but not executed.',
    };
    const def = makeDefinition({ requiresExplicitApproval: false });
    const { run } = await executeWorkflow({ definition: def, policyEvaluation: pe });
    expect(run.status).toBe('cancelled');
    expect(run.steps.every((s) => s.status === 'pending')).toBe(true);
  });

  it('blocked run audit trail contains workflow.policy_blocked entry', async () => {
    const pe: PolicyEvaluation = {
      ...makeMinimalPolicyEvaluation(),
      blockedReason: 'Blocked by compliance policy.',
    };
    const def = makeDefinition({ requiresExplicitApproval: false });
    const { run } = await executeWorkflow({ definition: def, policyEvaluation: pe });
    const blockEntry = run.auditTrail.find((e) => e.action === 'workflow.policy_blocked');
    expect(blockEntry).toBeDefined();
    expect(blockEntry!.detail).toContain('Blocked by compliance policy');
  });
});

// ---------------------------------------------------------------------------
// 3. Approval-required path
// ---------------------------------------------------------------------------

describe('executeWorkflow — approval-required', () => {
  it('returns requiresApproval=true and status=pending_approval when requiresExplicitApproval=true', async () => {
    const def = makeDefinition({ requiresExplicitApproval: true });
    const { run, requiresApproval } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
    });
    expect(requiresApproval).toBe(true);
    expect(run.status).toBe('pending_approval');
    expect(run.approvalState).toBe('pending');
  });

  it('includes approvalRequest with approverRole', async () => {
    const def = makeDefinition({
      requiresExplicitApproval: true,
      steps: [
        {
          id: 's1',
          name: 'Guarded Step',
          handler: 'noop-handler',
          executionMode: 'manual',
          requiresApproval: true,
          approverRole: 'compliance',
          retryCount: 0,
        },
      ],
    });
    const { approvalRequest } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
    });
    expect(approvalRequest).toBeDefined();
    expect(approvalRequest!.approverRole).toBe('compliance');
  });

  it('executes when approvedBy is supplied', async () => {
    const def = makeDefinition({ requiresExplicitApproval: true });
    const { run } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
      approvedBy: 'compliance-officer@szl.io',
    });
    expect(run.status).toBe('completed');
    expect(run.approvedBy).toBe('compliance-officer@szl.io');
  });
});

// ---------------------------------------------------------------------------
// 4. Dry-run path
// ---------------------------------------------------------------------------

describe('executeWorkflow — dry-run', () => {
  it('returns status=completed without executing handlers', async () => {
    let handlerCalled = false;
    registerStepHandler('dry-run-tracker', async () => {
      handlerCalled = true;
      return {};
    });
    const def = makeDefinition({
      requiresExplicitApproval: false,
      steps: [
        {
          id: 's1',
          name: 'Tracked Step',
          handler: 'dry-run-tracker',
          executionMode: 'manual',
          requiresApproval: false,
          retryCount: 0,
        },
      ],
    });
    const { run } = await executeWorkflow({ definition: def, isDryRun: true });
    expect(run.status).toBe('completed');
    // In dry-run mode the executor does NOT invoke step handlers
    expect(handlerCalled).toBe(false);
  });

  it('provides dryRunSummary in result', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    const { dryRunSummary } = await executeWorkflow({ definition: def, isDryRun: true });
    expect(typeof dryRunSummary).toBe('string');
    expect(dryRunSummary!.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Simulation path
// ---------------------------------------------------------------------------

describe('executeWorkflow — simulation', () => {
  it('returns status=completed with simulationSummary', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    const { run, simulationSummary } = await executeWorkflow({
      definition: def,
      isSimulation: true,
    });
    expect(run.status).toBe('completed');
    expect(typeof simulationSummary).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 6. Live execution — happy path
// ---------------------------------------------------------------------------

describe('executeWorkflow — live execution', () => {
  it('completes all steps and returns status=completed', async () => {
    const def = makeDefinition({
      requiresExplicitApproval: false,
      steps: [
        {
          id: 's1',
          name: 'Step 1',
          handler: 'noop-handler',
          executionMode: 'manual',
          requiresApproval: false,
          retryCount: 0,
        },
        {
          id: 's2',
          name: 'Step 2',
          handler: 'echo-handler',
          executionMode: 'manual',
          requiresApproval: false,
          retryCount: 0,
          parameters: { value: 42 },
        },
      ],
    });
    const { run } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
      initiatedBy: 'test-user',
    });
    expect(run.status).toBe('completed');
    expect(run.steps.every((s) => s.status === 'completed')).toBe(true);
    expect(run.completedAt).toBeDefined();
  });

  it('audit trail contains workflow.initiated and workflow.completed', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    const { run } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
    });
    const actions = run.auditTrail.map((e) => e.action);
    expect(actions).toContain('workflow.initiated');
    expect(actions).toContain('workflow.completed');
  });

  it('all audit trail entries have immutable=true', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    const { run } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
    });
    expect(run.auditTrail.every((e) => e.immutable === true)).toBe(true);
  });

  it('step records capture startedAt and completedAt timestamps', async () => {
    const def = makeDefinition({ requiresExplicitApproval: false });
    const { run } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
    });
    const step = run.steps[0];
    expect(step.startedAt).toBeGreaterThan(0);
    expect(step.completedAt).toBeDefined();
    expect(step.completedAt).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Failure and rollback path
// ---------------------------------------------------------------------------

describe('executeWorkflow — failure and rollback', () => {
  it('marks run as failed when a step handler throws', async () => {
    const def = makeDefinition({
      requiresExplicitApproval: false,
      steps: [
        {
          id: 's1',
          name: 'Fail Step',
          handler: 'fail-handler',
          executionMode: 'manual',
          requiresApproval: false,
          retryCount: 0,
        },
      ],
      rollbackPolicy: 'none',
    });
    const { run } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
    });
    expect(run.status).toBe('failed');
    expect(run.steps[0].status).toBe('failed');
    expect(run.steps[0].error).toContain('intentional failure');
  });

  it('performs rollback when rollbackPolicy=step and rollback handler is registered', async () => {
    let rolledBack = false;
    registerStepHandler('success-then-fail-handler', async (_p, ctx) => {
      if (ctx.stepId === 's2') throw new Error('s2 failed');
      return { done: true };
    });
    registerRollbackHandler('s1-rollback', async () => {
      rolledBack = true;
    });

    const def: WorkflowDefinition = {
      id: 'wf-rollback-test',
      name: 'Rollback Test Workflow',
      domain: 'test',
      executionMode: 'manual',
      isDryRunCapable: false,
      isSimulationCapable: false,
      requiresExplicitApproval: false,
      rollbackPolicy: 'step',
      steps: [
        {
          id: 's1',
          name: 'Succeed Step',
          handler: 'success-then-fail-handler',
          rollbackHandler: 's1-rollback',
          executionMode: 'manual',
          requiresApproval: false,
          retryCount: 0,
        },
        {
          id: 's2',
          name: 'Fail Step',
          handler: 'success-then-fail-handler',
          executionMode: 'manual',
          requiresApproval: false,
          retryCount: 0,
        },
      ],
    };

    const { run } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
    });

    // After rollback the executor sets final status to "failed" (rollback is
    // reflected in the audit trail and individual step statuses, not the run status)
    expect(run.status).toBe('failed');
    expect(rolledBack).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Unregistered handler graceful fallback
// ---------------------------------------------------------------------------

describe('executeWorkflow — unregistered handler graceful fallback', () => {
  it('acknowledges unregistered handler without throwing', async () => {
    const def = makeDefinition({
      requiresExplicitApproval: false,
      steps: [
        {
          id: 's1',
          name: 'Mystery Step',
          handler: 'handler-that-does-not-exist',
          executionMode: 'manual',
          requiresApproval: false,
          retryCount: 0,
        },
      ],
    });
    const { run } = await executeWorkflow({
      definition: def,
      policyEvaluation: makeMinimalPolicyEvaluation(),
    });
    expect(run.status).toBe('completed');
    expect(run.steps[0].outputs).toBeDefined();
    expect(String(run.steps[0].outputs!['result'])).toContain('not registered');
  });
});
