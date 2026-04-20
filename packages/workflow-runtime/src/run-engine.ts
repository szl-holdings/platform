/**
 * AEEP Workflow Run Engine
 *
 * Manages the lifecycle of a workflow run:
 *  - Initializes run state from a WorkflowDescriptor
 *  - Steps through each step in sequence
 *  - Emits state transitions via the onStateChange callback
 *  - Halts at approval gates and waits for human decision
 *  - Tags every step output with a traceId from agent-core
 *
 * This is a reference implementation. Production deployments
 * should wire this to a durable execution engine (Temporal, etc.)
 */

import { createRunContext } from '@szl-holdings/agent-core';
import type {
  StepRunState,
  WorkflowDescriptor,
  WorkflowRunState,
} from '@szl-holdings/shared-contracts';

export interface StepRunRecord {
  stepId: string;
  name: string;
  state: StepRunState;
  traceId: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  requiresApproval: boolean;
  approvalId?: string;
}

export interface WorkflowRun {
  runId: string;
  workflowId: string;
  workflowName: string;
  state: WorkflowRunState;
  steps: StepRunRecord[];
  profileId?: string;
  startedAt: string;
  completedAt?: string;
  triggeredBy?: string;
}

export interface RunEngineOptions {
  onStateChange?: (run: WorkflowRun) => void;
  onApprovalRequired?: (run: WorkflowRun, step: StepRunRecord) => Promise<'approved' | 'rejected'>;
  stepExecutor?: (
    step: StepRunRecord,
    run: WorkflowRun,
  ) => Promise<{ success: boolean; error?: string }>;
}

function generateRunId(workflowId: string): string {
  return `run_${workflowId}_${Date.now()}`;
}

/**
 * Create an initial WorkflowRun from a descriptor.
 */
export function createWorkflowRun(
  descriptor: WorkflowDescriptor,
  options?: { profileId?: string; triggeredBy?: string },
): WorkflowRun {
  const runId = generateRunId(descriptor.id);
  const sessionId = `ses_${Date.now()}`;
  return {
    runId,
    workflowId: descriptor.id,
    workflowName: descriptor.name,
    state: 'queued',
    ...(options?.profileId !== undefined ? { profileId: options.profileId } : {}),
    ...(options?.triggeredBy !== undefined ? { triggeredBy: options.triggeredBy } : {}),
    startedAt: new Date().toISOString(),
    steps: descriptor.steps.map((step) => {
      const ctx = createRunContext({
        agentRole: step.agentRole,
        sessionId,
        workflowRunId: runId,
        stepId: step.stepId,
        ...(options?.profileId !== undefined ? { profileId: options.profileId } : {}),
      });
      return {
        stepId: step.stepId,
        name: step.name,
        state: 'pending' as StepRunState,
        traceId: ctx.traceId,
        requiresApproval: step.requiresApproval ?? false,
      };
    }),
  };
}

/**
 * Execute a workflow run step-by-step.
 * Yields to onStateChange after each state transition.
 */
export async function executeWorkflowRun(
  run: WorkflowRun,
  options: RunEngineOptions = {},
): Promise<WorkflowRun> {
  const { onStateChange, onApprovalRequired, stepExecutor } = options;

  const mutableRun: WorkflowRun = {
    ...run,
    state: 'running',
    steps: run.steps.map((s) => ({ ...s })),
  };
  onStateChange?.(mutableRun);

  for (const step of mutableRun.steps) {
    step.state = 'running';
    step.startedAt = new Date().toISOString();
    onStateChange?.({ ...mutableRun });

    if (step.requiresApproval) {
      step.state = 'approval-required';
      onStateChange?.({ ...mutableRun });

      if (!onApprovalRequired) {
        mutableRun.state = 'approval-required';
        mutableRun.completedAt = new Date().toISOString();
        onStateChange?.({ ...mutableRun });
        return mutableRun;
      }

      const decision = await onApprovalRequired({ ...mutableRun }, step);
      if (decision === 'rejected') {
        step.state = 'rejected';
        mutableRun.state = 'rejected';
        mutableRun.completedAt = new Date().toISOString();
        onStateChange?.({ ...mutableRun });
        return mutableRun;
      }
      step.state = 'approved';
      onStateChange?.({ ...mutableRun });
      step.state = 'running';
    }

    const start = Date.now();
    try {
      if (stepExecutor) {
        const result = await stepExecutor(step, { ...mutableRun });
        step.durationMs = Date.now() - start;
        step.completedAt = new Date().toISOString();
        if (result.success) {
          step.state = 'complete';
        } else {
          step.state = 'failed';
          step.error = result.error ?? 'Step execution failed';
          mutableRun.state = 'failed';
          mutableRun.completedAt = new Date().toISOString();
          onStateChange?.({ ...mutableRun });
          return mutableRun;
        }
      } else {
        await new Promise((r) => setTimeout(r, 100));
        step.durationMs = Date.now() - start;
        step.completedAt = new Date().toISOString();
        step.state = 'complete';
      }
    } catch (err) {
      step.durationMs = Date.now() - start;
      step.completedAt = new Date().toISOString();
      step.state = 'failed';
      step.error = err instanceof Error ? err.message : String(err);
      mutableRun.state = 'failed';
      mutableRun.completedAt = new Date().toISOString();
      onStateChange?.({ ...mutableRun });
      return mutableRun;
    }

    onStateChange?.({ ...mutableRun });
  }

  mutableRun.state = 'success';
  mutableRun.completedAt = new Date().toISOString();
  onStateChange?.({ ...mutableRun });
  return mutableRun;
}
