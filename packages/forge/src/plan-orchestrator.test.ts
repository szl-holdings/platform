import { createPlan, InMemoryPlanStore } from '@workspace/planner';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryActionLedger } from './ledger.js';
import { approvePlanStep, executePlan, type PlanStepExecutor } from './plan-orchestrator.js';

describe('plan orchestrator', () => {
  let store: InMemoryPlanStore;

  beforeEach(() => {
    store = new InMemoryPlanStore();
  });

  it('walks executionOrder, persists step status, and completes when all steps succeed', async () => {
    const plan = await createPlan(
      'Triage exception',
      { fallbackCount: 0, approvalThreshold: 'critical' },
      { store },
    );
    const calls: string[] = [];
    const executor: PlanStepExecutor = async (step) => {
      calls.push(step.stepId);
      return { success: true, output: { value: step.title } };
    };

    const result = await executePlan(plan.planId, { store, stepExecutor: executor });

    expect(result.status).toBe('completed');
    expect(calls).toEqual(plan.executionOrder);
    expect(result.executedSteps.map((s) => s.stepId)).toEqual(plan.executionOrder);
    expect(result.executedSteps.every((s) => s.status === 'completed')).toBe(true);

    const persisted = await store.get(plan.planId);
    expect(persisted?.status).toBe('completed');
    for (const step of persisted?.steps) {
      expect(step.status).toBe('completed');
      expect((step.metadata as Record<string, unknown>).output).toBeDefined();
    }
  });

  it('parks the run on a high-risk step until it is approved, then resumes', async () => {
    const plan = await createPlan(
      'Reroute fleet',
      { fallbackCount: 0, approvalThreshold: 'high' },
      { store },
    );
    const calls: string[] = [];
    const executor: PlanStepExecutor = async (step) => {
      calls.push(step.stepId);
      return { success: true, output: step.title };
    };

    const first = await executePlan(plan.planId, { store, stepExecutor: executor });
    expect(first.status).toBe('awaiting-approval');
    expect(first.awaitingApproval).toBeDefined();
    const gatedStepId = first.awaitingApproval?.stepId;

    const persistedAfterGate = await store.get(plan.planId);
    const gatedStep = persistedAfterGate?.steps.find((s) => s.stepId === gatedStepId)!;
    expect(gatedStep.status).toBe('blocked');
    expect(gatedStep.requiredApproval).toBe(true);

    const callsBefore = [...calls];

    // Operator approves the gated step.
    await approvePlanStep(plan.planId, gatedStepId, { store });
    const resumed = await executePlan(plan.planId, { store, stepExecutor: executor });

    expect(resumed.status).toBe('completed');
    // The previously-completed steps should not have been re-executed.
    const newCalls = calls.slice(callsBefore.length);
    expect(newCalls[0]).toBe(gatedStepId);

    const persisted = await store.get(plan.planId);
    expect(persisted?.status).toBe('completed');
    expect(persisted?.steps.every((s) => s.status === 'completed')).toBe(true);
  });

  it('approvedStepIds passed at call time satisfies the gate without store mutation', async () => {
    const plan = await createPlan(
      'Reroute fleet',
      { fallbackCount: 0, approvalThreshold: 'high' },
      { store },
    );
    const executor: PlanStepExecutor = async () => ({ success: true });

    const gated = plan.steps.find((s) => s.requiredApproval);
    expect(gated).toBeDefined();

    const result = await executePlan(plan.planId, {
      store,
      stepExecutor: executor,
      approvedStepIds: [gated?.stepId],
    });

    expect(result.status).toBe('completed');
  });

  it('on step failure, fails over to the highest-rank fallback plan', async () => {
    const plan = await createPlan(
      'Investigate alert',
      { fallbackCount: 2, approvalThreshold: 'critical' },
      { store },
    );
    expect(plan.fallbacks.length).toBeGreaterThan(0);

    const visitedPlans: string[] = [];
    const executor: PlanStepExecutor = async (step, ctx) => {
      if (visitedPlans[visitedPlans.length - 1] !== ctx.planId) {
        visitedPlans.push(ctx.planId);
      }
      // Fail one step inside the primary plan only.
      if (ctx.planId === plan.planId && step.title === 'Act') {
        return { success: false, error: 'primary blew up' };
      }
      return { success: true, output: step.title };
    };

    const ledger = new InMemoryActionLedger();
    // Pre-approve any approval-gated steps across primary + fallbacks so this
    // test isolates the failover path from the approval path.
    const approvedStepIds: string[] = plan.steps
      .filter((s) => s.requiredApproval)
      .map((s) => s.stepId);
    for (const fbId of plan.fallbacks) {
      const fb = (await store.get(fbId))!;
      for (const s of fb.steps) if (s.requiredApproval) approvedStepIds.push(s.stepId);
    }
    const result = await executePlan(plan.planId, {
      store,
      stepExecutor: executor,
      ledger,
      approvedStepIds,
    });

    expect(result.status).toBe('completed');
    expect(result.rootPlanId).toBe(plan.planId);
    expect(result.planId).toBe(plan.fallbacks[0]);
    expect(result.fallbacksUsed).toEqual([plan.fallbacks[0]]);
    expect(visitedPlans).toEqual([plan.planId, plan.fallbacks[0]]);

    const primaryPersisted = await store.get(plan.planId);
    expect(primaryPersisted?.status).toBe('failed');
    const failedStep = primaryPersisted?.steps.find((s) => s.title === 'Act')!;
    expect(failedStep.status).toBe('failed');

    const fallbackPersisted = await store.get(plan.fallbacks[0]!);
    expect(fallbackPersisted?.status).toBe('completed');

    const runId = result.runId;
    const entries = ledger.getEntries(runId);
    expect(entries.some((e) => e.type === 'rollback')).toBe(true);
  });

  it('returns failed when no fallbacks remain', async () => {
    const plan = await createPlan(
      'Investigate alert',
      { fallbackCount: 0, approvalThreshold: 'critical' },
      { store },
    );
    const executor: PlanStepExecutor = async () => ({
      success: false,
      error: 'boom',
    });

    const result = await executePlan(plan.planId, { store, stepExecutor: executor });
    expect(result.status).toBe('failed');
    expect(result.error).toBe('boom');
    expect(result.fallbacksUsed).toEqual([]);

    const persisted = await store.get(plan.planId);
    expect(persisted?.status).toBe('failed');
  });

  it('treats thrown executor errors as step failure', async () => {
    const plan = await createPlan(
      'Run audit',
      { fallbackCount: 0, approvalThreshold: 'critical' },
      { store },
    );
    const executor: PlanStepExecutor = async () => {
      throw new Error('network down');
    };

    const result = await executePlan(plan.planId, { store, stepExecutor: executor });
    expect(result.status).toBe('failed');
    expect(result.error).toContain('network down');
  });

  it('throws PlanNotFoundError for unknown plan ids', async () => {
    await expect(executePlan('does-not-exist', { store })).rejects.toThrow(/Plan not found/);
  });
});
