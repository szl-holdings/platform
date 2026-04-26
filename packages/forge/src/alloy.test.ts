import { beforeEach, describe, expect, it } from 'vitest';
import { createCheckpoint, InMemoryCheckpointStore } from './checkpoint.js';
import { InMemoryActionLedger, makeLedgerEntry } from './ledger.js';
import { DefaultModelRouter } from './model-router.js';
import { RunManager } from './run-manager.js';
import { type StepContext, type WorkflowStep, RunConfigSchema, RunStateSchema } from './types.js';
import { ECHO_STEP, runReferenceWorkflow, VALIDATE_STEP } from './workflow.js';

function makeConfig(overrides: Partial<Parameters<typeof RunConfigSchema.parse>[0]> = {}) {
  return RunConfigSchema.parse({
    runId: `run-${Date.now()}`,
    workflowId: 'test-wf',
    checkpointEnabled: false,
    ...overrides,
  });
}

describe('RunConfigSchema', () => {
  it('parses config with defaults', () => {
    const config = makeConfig();
    expect(config.maxSteps).toBe(50);
    expect(config.checkpointEnabled).toBe(false);
  });
});

describe('RunStateSchema', () => {
  it('parses state with defaults', () => {
    const now = new Date().toISOString();
    const state = RunStateSchema.parse({
      runId: 'r1',
      workflowId: 'wf1',
      startedAt: now,
      updatedAt: now,
    });
    expect(state.status).toBe('pending');
    expect(state.currentStep).toBe(0);
  });
});

describe('InMemoryCheckpointStore', () => {
  it('saves and retrieves checkpoints', () => {
    const store = new InMemoryCheckpointStore();
    const now = new Date().toISOString();
    const state = RunStateSchema.parse({
      runId: 'r1',
      workflowId: 'wf1',
      startedAt: now,
      updatedAt: now,
    });
    const cp = createCheckpoint(state, 1);
    store.save(cp);
    expect(store.get(cp.checkpointId)).toBeDefined();
    expect(store.latest('r1')).toBeDefined();
  });

  it('lists and returns latest checkpoint', () => {
    const store = new InMemoryCheckpointStore();
    const now = new Date().toISOString();
    const state = RunStateSchema.parse({
      runId: 'r1',
      workflowId: 'wf1',
      startedAt: now,
      updatedAt: now,
    });
    store.save(createCheckpoint(state, 1));
    store.save(createCheckpoint(state, 2));
    expect(store.listByRun('r1')).toHaveLength(2);
    expect(store.latest('r1')?.stepIndex).toBe(2);
  });
});

describe('DefaultModelRouter', () => {
  const router = new DefaultModelRouter();

  it('returns preferred model when specified', () => {
    expect(router.selectModel({ preferredModel: 'claude-3-haiku' })).toBe('claude-3-haiku');
  });

  it('selects a model within latency budget', () => {
    const model = router.selectModel({ latencyBudgetMs: 400 });
    expect(['gpt-4o-mini', 'claude-3-haiku', 'gemini-3-flash-preview']).toContain(model);
  });

  it('always returns a model even with impossible constraints', () => {
    const model = router.selectModel({ latencyBudgetMs: 1, maxCostUsd: 0.000000001 });
    expect(typeof model).toBe('string');
  });
});

describe('InMemoryActionLedger', () => {
  it('records and retrieves entries by runId', () => {
    const ledger = new InMemoryActionLedger();
    ledger.record(makeLedgerEntry('r1', 'workflow-start', 'Started'));
    ledger.record(makeLedgerEntry('r1', 'checkpoint', 'Checkpoint saved'));
    ledger.record(makeLedgerEntry('r2', 'workflow-start', 'Other run'));
    expect(ledger.getEntries('r1')).toHaveLength(2);
    expect(ledger.getEntries('r2')).toHaveLength(1);
  });
});

describe('RunManager', () => {
  let manager: RunManager;

  beforeEach(() => {
    manager = new RunManager();
  });

  it('creates a run in pending status', () => {
    const config = makeConfig();
    const state = manager.createRun(config);
    expect(state.status).toBe('pending');
    expect(manager.getState(config.runId)).toBeDefined();
  });

  it('executes steps and returns completed state', async () => {
    const config = makeConfig({ metadata: { input: 'hello' } });
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [ECHO_STEP], config);
    expect(state.status).toBe('completed');
    expect(state.currentStep).toBe(1);
  });

  it('records ledger entries for workflow lifecycle', async () => {
    const config = makeConfig();
    manager.createRun(config);
    await manager.executeSteps(config.runId, [ECHO_STEP], config);
    const entries = manager.getLedgerEntries(config.runId);
    expect(entries.some((e) => e.type === 'workflow-start')).toBe(true);
    expect(entries.some((e) => e.type === 'workflow-end')).toBe(true);
  });

  it('handles step failures gracefully', async () => {
    const failingStep: WorkflowStep = {
      id: 'fail',
      name: 'Failing Step',
      async execute(
        _ctx: StepContext,
      ): Promise<{ stepId: string; success: boolean; error: string; latencyMs: number }> {
        return { stepId: 'fail', success: false, error: 'Intentional failure', latencyMs: 0 };
      },
    };
    const config = makeConfig();
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [failingStep], config);
    expect(state.status).toBe('failed');
    expect(state.error).toContain('Intentional failure');
  });

  it('saves checkpoints when enabled', async () => {
    const config = makeConfig({ checkpointEnabled: true });
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [ECHO_STEP], config);
    expect(state.checkpointId).toBeDefined();
  });
});

describe('Reference workflow (ECHO + VALIDATE)', () => {
  it('runs end-to-end and completes successfully', async () => {
    const result = await runReferenceWorkflow('test input');
    expect(result.status).toBe('completed');
    expect(result.output).toBeDefined();
    expect(result.ledgerEntries.length).toBeGreaterThan(0);
  });
});

describe('Approval gating', () => {
  it('Guardian approval gate pauses run with awaiting-approval status', async () => {
    const manager = new RunManager();
    const config = makeConfig({
      policyTier: 'operator-approved',
      agentId: 'test-agent',
    });
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [ECHO_STEP], config);
    expect(state.status).toBe('awaiting-approval');
    expect(state.error).toMatch(/guardian requires approval/i);
  });

  it('run proceeds normally with no policy tier set', async () => {
    const manager = new RunManager();
    const config = makeConfig({ agentId: 'test-agent' });
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [ECHO_STEP], config);
    expect(state.status).toBe('completed');
  });

  it('approved decision resumes parked run from the gated step', async () => {
    const ledger = new InMemoryActionLedger();
    const calls: string[] = [];
    const captured: { approvalId?: number | string } = {};
    const approvalGate = {
      async requestApproval(p: { stepId: string }) {
        captured.approvalId = `appr-${p.stepId}`;
        return { approvalId: captured.approvalId, status: 'pending' as const };
      },
    };
    const manager = new RunManager({ ledger, approvalGate });

    const stepA: WorkflowStep = {
      id: 'alpha',
      name: 'Alpha',
      async execute() {
        calls.push('alpha');
        return { stepId: 'alpha', success: true, output: 'a' };
      },
    };
    const stepB: WorkflowStep = {
      id: 'beta',
      name: 'Beta',
      async execute() {
        calls.push('beta');
        return { stepId: 'beta', success: true, output: 'b' };
      },
    };

    const config = makeConfig({ policyTier: 'operator-approved' });
    manager.createRun(config);
    const parked = await manager.executeSteps(config.runId, [stepA, stepB], config);

    expect(parked.status).toBe('awaiting-approval');
    expect(calls).toEqual([]);
    expect(captured.approvalId).toBeDefined();

    const result = await manager.recordApprovalDecision({
      approvalId: captured.approvalId!,
      decision: 'approved',
      actorRole: 'ops',
    });

    expect(result?.resumed).toBe(true);
    expect(result?.finalState?.status).toBe('awaiting-approval');
    expect(calls).toEqual(['alpha']);

    const approval2 = `appr-beta`;
    expect(captured.approvalId).toBe(approval2);
    const result2 = await manager.recordApprovalDecision({
      approvalId: approval2,
      decision: 'approved',
      actorRole: 'ops',
    });
    expect(result2?.finalState?.status).toBe('completed');
    expect(calls).toEqual(['alpha', 'beta']);
  });

  it('rejected decision finalizes parked run as failed', async () => {
    const captured: { approvalId?: number | string } = {};
    const approvalGate = {
      async requestApproval(p: { stepId: string }) {
        captured.approvalId = `r-${p.stepId}`;
        return { approvalId: captured.approvalId, status: 'pending' as const };
      },
    };
    const manager = new RunManager({ approvalGate });
    const config = makeConfig({ policyTier: 'operator-approved' });
    manager.createRun(config);
    await manager.executeSteps(config.runId, [ECHO_STEP], config);

    const result = await manager.recordApprovalDecision({
      approvalId: captured.approvalId!,
      decision: 'rejected',
      note: 'policy violation',
    });
    expect(result?.finalState?.status).toBe('failed');
    expect(result?.finalState?.error).toMatch(/rejected/i);
  });

  it('approval state is tracked via ledger', async () => {
    const ledger = new InMemoryActionLedger();
    const manager = new RunManager({ ledger });
    const config = makeConfig();
    manager.createRun(config);
    await manager.executeSteps(config.runId, [ECHO_STEP], config);
    const entries = ledger.getEntries(config.runId);
    const hasWorkflowStart = entries.some((e) => e.type === 'workflow-start');
    const hasWorkflowEnd = entries.some((e) => e.type === 'workflow-end');
    expect(hasWorkflowStart).toBe(true);
    expect(hasWorkflowEnd).toBe(true);
  });
});

describe('Rollback and recovery', () => {
  it('run fails when a step returns success:false and captures error', async () => {
    const manager = new RunManager();
    const failStep: WorkflowStep = {
      id: 'rollback-test',
      name: 'Will Fail',
      async execute(
        _ctx: StepContext,
      ): Promise<{ stepId: string; success: boolean; error: string; latencyMs: number }> {
        return {
          stepId: 'rollback-test',
          success: false,
          error: 'Simulated failure for rollback',
          latencyMs: 0,
        };
      },
    };
    const config = makeConfig();
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [failStep], config);
    expect(state.status).toBe('failed');
    expect(state.error).toContain('Simulated failure for rollback');
  });

  it('steps after a failure are not executed', async () => {
    const executedSteps: string[] = [];
    const manager = new RunManager();

    const failStep: WorkflowStep = {
      id: 'step-fail',
      name: 'Failing Step',
      async execute(
        _ctx: StepContext,
      ): Promise<{ stepId: string; success: boolean; error: string; latencyMs: number }> {
        executedSteps.push('fail');
        return { stepId: 'step-fail', success: false, error: 'Rollback trigger', latencyMs: 0 };
      },
    };

    const neverStep: WorkflowStep = {
      id: 'step-never',
      name: 'Never Reached',
      async execute(
        _ctx: StepContext,
      ): Promise<{ stepId: string; success: boolean; latencyMs: number }> {
        executedSteps.push('never');
        return { stepId: 'step-never', success: true, latencyMs: 0 };
      },
    };

    const config = makeConfig();
    manager.createRun(config);
    await manager.executeSteps(config.runId, [failStep, neverStep], config);
    expect(executedSteps).toEqual(['fail']);
  });

  it('thrown error in step handler causes failed state with checkpoint saved before failure', async () => {
    const ledger = new InMemoryActionLedger();
    const checkpoints = new InMemoryCheckpointStore();
    const manager = new RunManager({ ledger, checkpointStore: checkpoints });

    const goodStep: WorkflowStep = {
      id: 'step-good',
      name: 'Good Step',
      async execute(
        _ctx: StepContext,
      ): Promise<{ stepId: string; success: boolean; output: string; latencyMs: number }> {
        return { stepId: 'step-good', success: true, output: 'ok', latencyMs: 0 };
      },
    };

    const throwStep: WorkflowStep = {
      id: 'step-throw',
      name: 'Throw Step',
      async execute(_ctx: StepContext): Promise<never> {
        throw new Error('Unexpected exception');
      },
    };

    const config = makeConfig({ checkpointEnabled: true });
    manager.createRun(config);
    const state = await manager.executeSteps(config.runId, [goodStep, throwStep], config);
    expect(state.status).toBe('failed');
    expect(state.error).toContain('Unexpected exception');
    const saved = checkpoints.listByRun(config.runId);
    expect(saved.length).toBeGreaterThan(0);
  });
});

describe('Run replay', () => {
  it('can re-execute the same workflow definition producing identical shape', async () => {
    const original = await runReferenceWorkflow('original run');
    const replay = await runReferenceWorkflow('replay run');
    expect(original.status).toBe(replay.status);
    expect(typeof replay.output).toBe(typeof original.output);
  });

  it('replay with same config produces different runId', async () => {
    const manager = new RunManager();
    const config1 = RunConfigSchema.parse({
      runId: `replay-${Math.random().toString(36).slice(2)}-a`,
      workflowId: 'test-wf',
      checkpointEnabled: false,
      metadata: { input: 'first' },
    });
    const config2 = RunConfigSchema.parse({
      runId: `replay-${Math.random().toString(36).slice(2)}-b`,
      workflowId: 'test-wf',
      checkpointEnabled: false,
      metadata: { input: 'first' },
    });
    manager.createRun(config1);
    manager.createRun(config2);
    const s1 = await manager.executeSteps(config1.runId, [ECHO_STEP], config1);
    const s2 = await manager.executeSteps(config2.runId, [ECHO_STEP], config2);
    expect(config1.runId).not.toBe(config2.runId);
    expect(s1.status).toBe('completed');
    expect(s2.status).toBe('completed');
  });

  it('checkpoint can be used to verify run state at each step', async () => {
    const checkpoints = new InMemoryCheckpointStore();
    const manager = new RunManager({ checkpointStore: checkpoints });
    const config = makeConfig({ checkpointEnabled: true });
    manager.createRun(config);
    await manager.executeSteps(config.runId, [ECHO_STEP, VALIDATE_STEP], config);
    const all = checkpoints.listByRun(config.runId);
    expect(all.length).toBe(2);
    expect(all[0]?.stepIndex).toBe(1);
    expect(all[1]?.stepIndex).toBe(2);
    const latest = checkpoints.latest(config.runId);
    expect(latest?.stepIndex).toBe(2);
  });
});

describe('Action ledger immutability', () => {
  it('returned entries array is a copy — external mutation does not affect stored entries', () => {
    const ledger = new InMemoryActionLedger();
    ledger.record(makeLedgerEntry('r1', 'workflow-start', 'started'));
    const entries = ledger.getEntries('r1');
    entries.push(makeLedgerEntry('r1', 'workflow-end', 'injected'));
    const entries2 = ledger.getEntries('r1');
    expect(entries2).toHaveLength(1);
  });

  it('retrieved entry object mutation does not affect the stored copy', () => {
    const ledger = new InMemoryActionLedger();
    const entry = makeLedgerEntry('r1', 'checkpoint', 'saved');
    ledger.record(entry);
    const retrieved = ledger.getEntries('r1')[0]!;
    (retrieved as { description: string }).description = 'mutated';
    const fresh = ledger.getEntries('r1')[0]!;
    expect(fresh.description).toBe('saved');
  });

  it('allEntries returns all runs flat and is also a copy', () => {
    const ledger = new InMemoryActionLedger();
    ledger.record(makeLedgerEntry('r1', 'workflow-start', 'r1 start'));
    ledger.record(makeLedgerEntry('r2', 'workflow-start', 'r2 start'));
    const all = ledger.allEntries();
    expect(all.length).toBe(2);
    all.splice(0, 2);
    expect(ledger.allEntries().length).toBe(2);
  });

  it('each ledger entry has a unique entryId', () => {
    const ledger = new InMemoryActionLedger();
    for (let i = 0; i < 5; i++) {
      ledger.record(makeLedgerEntry('r1', 'checkpoint', `entry ${i}`));
    }
    const entries = ledger.getEntries('r1');
    const ids = new Set(entries.map((e) => e.entryId));
    expect(ids.size).toBe(5);
  });
});
