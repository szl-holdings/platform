import { RunManager } from './run-manager.js';
import type { StepContext, StepResult, WorkflowStep } from './types.js';
import { RunConfigSchema } from './types.js';

export const ECHO_STEP: WorkflowStep = {
  id: 'echo',
  name: 'Echo Step',
  async execute(ctx: StepContext): Promise<StepResult> {
    const t0 = Date.now();
    const output = {
      echo: ctx.metadata['input'] ?? 'no input provided',
      stepIndex: ctx.stepIndex,
      runId: ctx.runId,
    };
    return {
      stepId: 'echo',
      success: true,
      output,
      latencyMs: Date.now() - t0,
    };
  },
};

export const VALIDATE_STEP: WorkflowStep = {
  id: 'validate',
  name: 'Validation Step',
  async execute(ctx: StepContext): Promise<StepResult> {
    const t0 = Date.now();
    const previousOutput = ctx.previousResults[ctx.previousResults.length - 1]?.output;
    const isValid = previousOutput !== null && previousOutput !== undefined;
    return {
      stepId: 'validate',
      success: isValid,
      output: { valid: isValid, validatedInput: previousOutput },
      ...(isValid ? {} : { error: 'Previous step produced no output' }),
      latencyMs: Date.now() - t0,
    };
  },
};

export async function runReferenceWorkflow(
  input: unknown,
  opts: { policyTier?: string; agentId?: string } = {},
): Promise<{ runId: string; output: unknown; status: string; ledgerEntries: unknown[] }> {
  const manager = new RunManager();
  const config = RunConfigSchema.parse({
    runId: `ref-wf-${Date.now()}`,
    workflowId: 'reference-workflow-v1',
    agentId: opts.agentId ?? 'alloy-agent',
    policyTier: opts.policyTier,
    checkpointEnabled: true,
    metadata: { input },
  });

  manager.createRun(config);
  const state = await manager.executeSteps(config.runId, [ECHO_STEP, VALIDATE_STEP], config);

  return {
    runId: config.runId,
    output: state.output,
    status: state.status,
    ledgerEntries: manager.getLedgerEntries(config.runId),
  };
}
