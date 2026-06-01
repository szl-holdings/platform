import { CatalogSearch, CodeSandbox, defaultGateway } from '@workspace/tool-mesh';
import { describe, expect, it, vi } from 'vitest';
import { createCodeStepExecutor, type StepExecutorFn } from './phases/execute.js';
import type { PlanStep } from '@workspace/planner';

function makePlanStep(overrides: Partial<PlanStep> = {}): PlanStep {
  return {
    stepId: 'step-1',
    index: 0,
    title: 'Run code step',
    description: '',
    dependsOn: [],
    status: 'pending',
    route: {
      routeClass: 'code',
      estimatedCostUsd: 0,
      selectedBy: 'manual',
      fallbackChain: [],
    },
    estimatedValue: 0.5,
    estimatedRisk: 0.1,
    riskLevel: 'low',
    requiredEvidence: [],
    requiredApproval: false,
    rollbackPoints: [],
    inputs: {},
    metadata: {},
    ...overrides,
  };
}

const STEP_CONTEXT = {
  traceId: 'trace-001',
  planId: 'plan-001',
  agentId: 'test-agent',
  dryRun: false,
};

describe('createCodeStepExecutor — cognitive runtime code-mode dispatch', () => {
  it('returns a dry-run result when dryRun=true without executing code', async () => {
    const sandbox = new CodeSandbox(defaultGateway, new CatalogSearch());
    const executor = createCodeStepExecutor(sandbox);
    const step = makePlanStep({ inputs: { sourceCode: 'return 42;' } });

    const result = await executor(step, { ...STEP_CONTEXT, dryRun: true });
    const r = result as Record<string, unknown>;
    expect(r['dryRun']).toBe(true);
    expect(typeof r['message']).toBe('string');
  });

  it('delegates non-code steps to the fallback executor', async () => {
    const sandbox = new CodeSandbox(defaultGateway, new CatalogSearch());
    const fallback: StepExecutorFn = vi.fn().mockResolvedValue({ fallbackInvoked: true });
    const executor = createCodeStepExecutor(sandbox, fallback);

    const step = makePlanStep({
      route: { routeClass: 'generation', estimatedCostUsd: 0, selectedBy: 'manual', fallbackChain: [] },
      inputs: {},
    });

    const result = await executor(step, STEP_CONTEXT);
    expect(fallback).toHaveBeenCalledOnce();
    const r = result as Record<string, unknown>;
    expect(r['fallbackInvoked']).toBe(true);
  });

  it('throws when sourceCode is missing from inputs', async () => {
    const sandbox = new CodeSandbox(defaultGateway, new CatalogSearch());
    const executor = createCodeStepExecutor(sandbox);
    const step = makePlanStep({ inputs: {} });

    await expect(executor(step, STEP_CONTEXT)).rejects.toThrow(/sourceCode/);
  });

  it('executes code step and returns a CodeExecutionRecord', async () => {
    const sandbox = new CodeSandbox(defaultGateway, new CatalogSearch());
    const executor = createCodeStepExecutor(sandbox);
    const step = makePlanStep({
      inputs: { sourceCode: 'return JSON.stringify({ computed: 2 + 2 });' },
    });

    const result = await executor(step, STEP_CONTEXT);
    const record = result as Record<string, unknown>;

    expect(record['success']).toBe(true);
    expect(typeof record['id']).toBe('string');
    expect(typeof record['durationMs']).toBe('number');
    expect(record['sourceCode']).toBe('return JSON.stringify({ computed: 2 + 2 });');
  });

  it('throws when sandboxed code fails so execute-phase failure semantics apply', async () => {
    const sandbox = new CodeSandbox(defaultGateway, new CatalogSearch());
    const executor = createCodeStepExecutor(sandbox);
    const step = makePlanStep({
      inputs: { sourceCode: 'throw new Error("intentional failure");' },
    });

    // The executor should propagate sandbox failure as a thrown error so that
    // the execute phase can apply retry / failure-counting logic correctly.
    await expect(executor(step, STEP_CONTEXT)).rejects.toThrow('intentional failure');
  });
});
