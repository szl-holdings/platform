import { GuardianDecisionEngine } from '@workspace/guardian/decision-engine';
import type { PlanGraph, PlanStep } from '@workspace/planner';
import { randomUUID } from 'node:crypto';
import { extractApprovalInterrupt } from '../approval-interrupt.js';
import { type CheckpointStore, saveCheckpoint } from '../checkpoint.js';
import type {
  CognitiveLoopRun,
  ExecuteStepResult,
  PhaseResult,
  ResolvedCognitiveContext,
} from '../types.js';

export type StepExecutorFn = (
  step: PlanStep,
  context: { traceId: string; planId: string; agentId: string; dryRun: boolean },
) => Promise<unknown>;

export interface ExecutePhaseOptions {
  ctx: ResolvedCognitiveContext;
  guardian?: GuardianDecisionEngine;
  stepExecutor?: StepExecutorFn;
  checkpointStore?: CheckpointStore;
  run: CognitiveLoopRun;
  resumeFromStepIndex?: number;
}

export interface ExecutePhaseOutput {
  stepResults: ExecuteStepResult[];
  completedSteps: number;
  failedSteps: number;
  blockedSteps: number;
  totalDurationMs: number;
  summary: string;
  output: unknown;
}

const defaultGuardian = new GuardianDecisionEngine();

const defaultStepExecutor: StepExecutorFn = async (step, context) => {
  if (context.dryRun) {
    return {
      dryRun: true,
      stepId: step.stepId,
      stepTitle: step.title,
      message: `Dry-run: step '${step.title}' acknowledged without side-effects.`,
    };
  }

  return {
    stepId: step.stepId,
    stepTitle: step.title,
    routeClass: step.route.routeClass,
    toolId: step.route.toolId,
    model: step.route.model,
    result: `Step '${step.title}' executed via ${step.route.toolId ?? step.route.model ?? 'default handler'}.`,
    completedAt: new Date().toISOString(),
  };
};

async function executeStep(
  step: PlanStep,
  opts: ExecutePhaseOptions,
  traceId: string,
): Promise<ExecuteStepResult> {
  const { ctx, run } = opts;
  const guardian = opts.guardian ?? defaultGuardian;
  const executor = opts.stepExecutor ?? defaultStepExecutor;

  const stepStartedAt = Date.now();
  let retries = 0;
  const maxRetries = ctx.maxRetries;

  if (ctx.guardianEnabled) {
    const decision = guardian.evaluate({
      requestId: randomUUID(),
      agentId: ctx.agentId,
      sessionId: ctx.sessionId,
      action: step.title,
      domain: ctx.domain,
      tier:
        step.riskLevel === 'critical'
          ? 'dual-approved'
          : step.riskLevel === 'high'
            ? 'operator-approved'
            : 'supervised',
      toolId: step.route.toolId,
      model: step.route.model,
      requestedAt: new Date().toISOString(),
      context: {
        planId: run.planId,
        riskLevel: step.riskLevel,
        estimatedRisk: step.estimatedRisk,
      },
    });

    if (decision.outcome === 'block') {
      return {
        stepId: step.stepId,
        stepTitle: step.title,
        status: 'blocked',
        guardianOutcome: decision.outcome,
        error: decision.reason,
        retries: 0,
        durationMs: Date.now() - stepStartedAt,
      };
    }

    if (decision.outcome === 'require-approval' || decision.outcome === 'require-dual-approval') {
      return {
        stepId: step.stepId,
        stepTitle: step.title,
        status: 'pending_approval',
        guardianOutcome: decision.outcome,
        error: `Step requires ${decision.outcome.replace('-', ' ')}: ${decision.reason}`,
        retries: 0,
        durationMs: Date.now() - stepStartedAt,
      };
    }
  }

  while (retries <= maxRetries) {
    try {
      const output = await executor(step, {
        traceId,
        planId: run.planId ?? '',
        agentId: ctx.agentId,
        dryRun: ctx.dryRun,
      });

      return {
        stepId: step.stepId,
        stepTitle: step.title,
        status: 'completed',
        output,
        retries,
        toolId: step.route.toolId,
        durationMs: Date.now() - stepStartedAt,
      };
    } catch (err) {
      retries++;
      if (retries > maxRetries) {
        return {
          stepId: step.stepId,
          stepTitle: step.title,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
          retries,
          toolId: step.route.toolId,
          durationMs: Date.now() - stepStartedAt,
        };
      }
      await sleep(Math.min(100 * 2 ** retries, 2000));
    }
  }

  return {
    stepId: step.stepId,
    stepTitle: step.title,
    status: 'failed',
    error: 'Exceeded retry limit',
    retries,
    durationMs: Date.now() - stepStartedAt,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executePhase(
  plan: PlanGraph,
  opts: ExecutePhaseOptions,
): Promise<PhaseResult & { output: ExecutePhaseOutput }> {
  const startedAt = Date.now();
  const { ctx, run } = opts;
  const traceId = ctx.traceId ?? run.traceId ?? randomUUID();
  const resumeFromIdx = opts.resumeFromStepIndex ?? 0;

  const orderedStepIds = plan.executionOrder;
  const stepMap = new Map(plan.steps.map((s) => [s.stepId, s]));
  const orderedSteps = orderedStepIds
    .map((id) => stepMap.get(id))
    .filter((s): s is PlanStep => s !== undefined);

  const stepResults: ExecuteStepResult[] = [];
  let blockedByGuardian = false;
  let pendingApproval = false;

  for (let i = resumeFromIdx; i < orderedSteps.length; i++) {
    const step = orderedSteps[i];
    if (!step) continue;

    const result = await executeStep(step, opts, traceId);
    stepResults.push(result);

    if (result.status === 'blocked') {
      blockedByGuardian = true;
      break;
    }

    // pending_approval is a hard gate — execution must not continue
    // until a human approver grants access (like a block but resumable)
    if (result.status === 'pending_approval') {
      pendingApproval = true;
      break;
    }

    // ─── GOVERNED APPROVAL INTERRUPT ──────────────────────────────────────────
    // Detect __approvalInterrupt in a completed step's output and short-circuit
    // execution immediately — exactly as pending_approval does. This guarantees
    // that no subsequent steps run after a governed interrupt node, preventing
    // side effects past the interrupt point.
    if (result.status === 'completed' && extractApprovalInterrupt(result.output)) {
      pendingApproval = true;
      break;
    }

    if (result.status === 'failed') {
      break;
    }

    if (i % ctx.checkpointEveryNSteps === 0 && opts.checkpointStore) {
      const ref = saveCheckpoint(
        { ...run, stepResults: [...(run.stepResults ?? []), ...stepResults] },
        i,
        opts.checkpointStore,
      );
      result.checkpointRef = ref;
    }
  }

  const completedSteps = stepResults.filter((r) => r.status === 'completed').length;
  const failedSteps = stepResults.filter((r) => r.status === 'failed').length;
  const blockedSteps = stepResults.filter(
    (r) => r.status === 'blocked' || r.status === 'pending_approval',
  ).length;

  const lastOutput = stepResults.filter((r) => r.status === 'completed').at(-1)?.output;

  const output: ExecutePhaseOutput = {
    stepResults,
    completedSteps,
    failedSteps,
    blockedSteps,
    totalDurationMs: Date.now() - startedAt,
    summary:
      `Executed ${stepResults.length} of ${orderedSteps.length} step(s): ` +
      `${completedSteps} completed, ${failedSteps} failed, ${blockedSteps} blocked/pending.`,
    output: lastOutput,
  };

  const status = blockedByGuardian
    ? 'blocked'
    : pendingApproval
      ? 'blocked'
      : failedSteps > 0
        ? 'error'
        : 'ok';

  const pendingStep = stepResults.find((r) => r.status === 'pending_approval');
  const blockedStep = stepResults.find((r) => r.status === 'blocked');

  const completedAt = Date.now();
  return {
    phase: 'execute',
    status,
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    output,
    retryCount: 0,
    metadata: {
      completedSteps,
      failedSteps,
      blockedSteps,
      pendingApproval,
    },
    error: blockedByGuardian
      ? `Guardian blocked step: ${blockedStep?.error ?? 'unknown reason'}`
      : pendingApproval
        ? `Step requires approval before execution can continue: ${pendingStep?.error ?? 'pending_approval'}`
        : failedSteps > 0
          ? `${failedSteps} step(s) failed`
          : undefined,
  };
}

export { GuardianDecisionEngine };
