import { GuardianDecisionEngine } from '@workspace/guardian/decision-engine';
import type { PlanGraph, PlanStep } from '@workspace/planner';
import type { CodeSandbox } from '@workspace/tool-mesh';
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

export type CodeModeExecutorFn = (
  step: PlanStep,
  script: string,
  context: { traceId: string; planId: string; agentId: string; dryRun: boolean },
) => Promise<{ output: string; returnValue: unknown; toolCallsMade: string[]; durationMs: number }>;

/**
 * Called when a step has `executionMode: 'code'` but no pre-written
 * `codeScript` in its metadata. Receives the step and the list of tool IDs
 * discovered for it, and must return a JavaScript string ready for sandbox
 * execution or `null` to fall through to the standard fail-fast path.
 *
 * Callers that integrate an LLM-based code generation step should supply
 * this function to `ExecutePhaseOptions.codeScriptGenerator`.
 */
export type CodeScriptGeneratorFn = (
  step: PlanStep,
  discoveredToolIds: string[],
  context: { traceId: string; planId: string; agentId: string; dryRun: boolean },
) => Promise<string | null>;

export interface ExecutePhaseOptions {
  ctx: ResolvedCognitiveContext;
  guardian?: GuardianDecisionEngine;
  stepExecutor?: StepExecutorFn;
  /**
   * Optional CodeSandbox instance. When provided and no explicit stepExecutor is
   * set, the runtime automatically routes steps with routeClass === 'code' through
   * this sandbox. Callers no longer need to manually wrap with createCodeStepExecutor.
   */
  codeSandbox?: CodeSandbox;
  /** Flexible code-mode executor for steps whose metadata.executionMode === 'code'. */
  codeModeExecutor?: CodeModeExecutorFn;
  /**
   * Optional script generator for code-mode steps. When `executionMode` is
   * 'code' but the planner has not yet attached a `codeScript` to the step,
   * this function is called to produce one. Returning `null` causes the step
   * to fail with a descriptive error, which is the same behaviour as if no
   * generator were supplied.
   */
  codeScriptGenerator?: CodeScriptGeneratorFn;
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
  executor: StepExecutorFn,
): Promise<ExecuteStepResult> {
  const { ctx, run } = opts;
  const guardian = opts.guardian ?? defaultGuardian;

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

  const isCodeMode =
    step.metadata?.executionMode === 'code' && opts.codeModeExecutor !== undefined;

  if (isCodeMode && opts.codeModeExecutor) {
    let script: string | null =
      typeof step.metadata?.codeScript === 'string' && step.metadata.codeScript.trim() !== ''
        ? step.metadata.codeScript
        : null;

    // When no pre-written script is attached, attempt to generate one via the
    // injected code-script generator (e.g. an LLM-based code-generation step).
    // This is the entry point for end-to-end code-mode: callers supply a
    // generator that takes the step + discovered tools and returns a JS string.
    if (script === null && opts.codeScriptGenerator) {
      const discoveredToolIds: string[] = Array.isArray(step.metadata?.discoveredToolIds)
        ? (step.metadata.discoveredToolIds as string[])
        : [];
      const execCtx = { traceId, planId: run.planId ?? '', agentId: ctx.agentId, dryRun: ctx.dryRun };
      script = await opts.codeScriptGenerator(step, discoveredToolIds, execCtx);
    }

    // No script available — fail explicitly so the planning gap is surfaced.
    // Silently running a no-op would produce a spurious "completed" result.
    if (script === null) {
      return {
        stepId: step.stepId,
        stepTitle: step.title,
        status: 'failed',
        error:
          `Code-mode step '${step.title}' (${step.stepId}) has no script. ` +
          'Provide step.metadata.codeScript in the plan or attach a codeScriptGenerator ' +
          'to ExecutePhaseOptions to generate scripts at runtime.',
        retries: 0,
        toolId: step.route.toolId,
        durationMs: 0,
      };
    }
    try {
      const codeResult = await opts.codeModeExecutor(step, script, {
        traceId,
        planId: run.planId ?? '',
        agentId: ctx.agentId,
        dryRun: ctx.dryRun,
      });
      return {
        stepId: step.stepId,
        stepTitle: step.title,
        status: 'completed',
        output: {
          sandboxOutput: codeResult.output,
          returnValue: codeResult.returnValue,
          toolCallsMade: codeResult.toolCallsMade,
          durationMs: codeResult.durationMs,
          executionMode: 'code',
        },
        retries: 0,
        toolId: step.route.toolId,
        durationMs: codeResult.durationMs,
      };
    } catch (err) {
      return {
        stepId: step.stepId,
        stepTitle: step.title,
        status: 'failed',
        error: `Code mode execution failed: ${err instanceof Error ? err.message : String(err)}`,
        retries: 0,
        toolId: step.route.toolId,
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

  // Derive the effective step executor. If the caller provided an explicit
  // stepExecutor it takes precedence. Otherwise, wire the codeSandbox (if any)
  // so that steps with routeClass === 'code' are dispatched automatically.
  const effectiveExecutor: StepExecutorFn =
    opts.stepExecutor ??
    (opts.codeSandbox
      ? createCodeStepExecutor(opts.codeSandbox)
      : defaultStepExecutor);

  const stepResults: ExecuteStepResult[] = [];
  let blockedByGuardian = false;
  let pendingApproval = false;

  for (let i = resumeFromIdx; i < orderedSteps.length; i++) {
    const step = orderedSteps[i];
    if (!step) continue;

    const result = await executeStep(step, opts, traceId, effectiveExecutor);
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

/**
 * Creates a StepExecutorFn that routes steps with routeClass === 'code' to the
 * provided CodeSandbox instance. Steps with other route classes are delegated to
 * the provided fallback executor (or the defaultStepExecutor if omitted).
 *
 * The step must carry the TypeScript source in `step.inputs.sourceCode` (string)
 * and optionally a ForgeSandboxPolicy in `step.inputs.policy`. This is the
 * recommended extension point for wiring code-mode execution into a live loop.
 */
export function createCodeStepExecutor(
  codeSandbox: CodeSandbox,
  fallback: StepExecutorFn = defaultStepExecutor,
): StepExecutorFn {
  return async (step, context) => {
    if (step.route.routeClass !== 'code') {
      return fallback(step, context);
    }

    if (context.dryRun) {
      return {
        dryRun: true,
        stepId: step.stepId,
        stepTitle: step.title,
        message: `Dry-run: code step '${step.title}' acknowledged without side-effects.`,
      };
    }

    const sourceCode = step.inputs?.sourceCode;
    if (typeof sourceCode !== 'string') {
      throw new Error(
        `Code step '${step.title}' (${step.stepId}) is missing required input 'sourceCode' (string).`,
      );
    }

    const rawPolicy = step.inputs?.policy as Record<string, unknown> | undefined;
    const policy = {
      domain: (step.inputs?.domain ?? 'custom') as string,
      approvalClass: (rawPolicy?.approvalClass ?? 'propose_only') as 'propose_only' | 'observe_only' | 'approval_required' | 'approved_execute',
      allowedHosts: (rawPolicy?.allowedHosts ?? []) as string[],
      allowedTools: (rawPolicy?.allowedTools ?? []) as string[],
      allowedDomains: (rawPolicy?.allowedDomains ?? ['global']) as string[],
      maxDurationMs: typeof rawPolicy?.maxDurationMs === 'number' ? rawPolicy.maxDurationMs : 30_000,
      maxCostUsd: typeof rawPolicy?.maxCostUsd === 'number' ? rawPolicy.maxCostUsd : 1.0,
      isDryRunDefault: false,
      requiresEvidenceCapture: true,
    };

    const record = await codeSandbox.execute(
      sourceCode,
      policy as Parameters<typeof codeSandbox.execute>[1],
      { agentId: context.agentId, workflowId: context.planId },
    );

    // Propagate sandbox failure as a thrown error so execute-phase retry and
    // failure-counting semantics work correctly (a silent return would cause
    // the step to appear 'completed' even when execution failed).
    if (!record.success) {
      throw new Error(
        record.errors[0] ?? `Code sandbox execution failed for step '${step.title}'`,
      );
    }

    return record;
  };
}
