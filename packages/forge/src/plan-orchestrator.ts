import { defaultPlanStore, type PlanStore } from '@workspace/planner/store';
import { type PlanGraph, type PlanStep, type PlanStepStatus, PlanNotFoundError } from '@workspace/planner/types';
import { randomUUID } from 'node:crypto';
import { InMemoryActionLedger, makeLedgerEntry } from './ledger.js';
import type { ActionLedgerWriter } from './types.js';

export interface PlanStepExecutorContext {
  planId: string;
  runId: string;
  stepIndex: number;
  previousResults: Array<{ stepId: string; output?: unknown }>;
}

export interface PlanStepExecutorResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export type PlanStepExecutor = (
  step: PlanStep,
  context: PlanStepExecutorContext,
) => Promise<PlanStepExecutorResult>;

export interface PlanOrchestratorOptions {
  store?: PlanStore;
  stepExecutor?: PlanStepExecutor;
  ledger?: ActionLedgerWriter;
  /**
   * Step ids that have been pre-approved by an operator. If a step's
   * persisted status is `ready`, that also satisfies the gate.
   */
  approvedStepIds?: Iterable<string>;
  /**
   * Maximum fallback depth. After this many failovers, the orchestrator
   * stops descending. Default 3.
   */
  maxFallbackDepth?: number;
  /** Stable run id (defaults to a generated uuid). */
  runId?: string;
}

export interface PlanRunStepRecord {
  stepId: string;
  status: PlanStepStatus;
  output?: unknown;
  error?: string;
  durationMs: number;
}

export type PlanRunStatus = 'completed' | 'failed' | 'awaiting-approval';

export interface PlanRunResult {
  runId: string;
  /** The plan that produced the final result (may be a fallback). */
  planId: string;
  /** The plan id originally requested by the caller. */
  rootPlanId: string;
  status: PlanRunStatus;
  executedSteps: PlanRunStepRecord[];
  awaitingApproval?: { planId: string; stepId: string; reason?: string };
  /** Fallback plan ids used in priority order, root first. */
  fallbacksUsed: string[];
  error?: string;
}

const defaultExecutor: PlanStepExecutor = async (step) => ({
  success: true,
  output: {
    stepId: step.stepId,
    title: step.title,
    routeClass: step.route.routeClass,
    model: step.route.model,
    toolId: step.route.toolId,
    note: 'default executor — no side-effects',
  },
});

/**
 * Execute an approved plan: walk its `executionOrder`, invoke the routed
 * model/tool per step via the supplied executor, honor approval gates on
 * `requiredApproval` steps, and on step failure fail over to the highest-rank
 * fallback plan. Step status + outputs are persisted back to the
 * {@link PlanStore} as the run progresses, so callers polling the store see
 * live state.
 *
 * Resume is supported: invoking `executePlan` again with the same `planId`
 * after an `awaiting-approval` return (with the gated step's `status` flipped
 * to `ready` via {@link approvePlanStep}, or its id passed in
 * `approvedStepIds`) skips already-completed steps and continues from the
 * gated one.
 */
export async function executePlan(
  planId: string,
  options: PlanOrchestratorOptions = {},
): Promise<PlanRunResult> {
  const store = options.store ?? defaultPlanStore;
  const executor = options.stepExecutor ?? defaultExecutor;
  const ledger = options.ledger ?? new InMemoryActionLedger();
  const runId = options.runId ?? randomUUID();
  const approvedStepIds = new Set(options.approvedStepIds ?? []);
  const maxDepth = options.maxFallbackDepth ?? 3;

  return runPlan({
    planId,
    rootPlanId: planId,
    store,
    executor,
    ledger,
    runId,
    approvedStepIds,
    maxDepth,
    depth: 0,
    fallbacksUsed: [],
  });
}

/**
 * Mark a step as approved (status `ready`) so the orchestrator will pass it
 * through the approval gate on the next `executePlan` call. This is the
 * persistence-side counterpart to passing `approvedStepIds` at call time.
 */
export async function approvePlanStep(
  planId: string,
  stepId: string,
  options: { store?: PlanStore } = {},
): Promise<PlanGraph> {
  const store = options.store ?? defaultPlanStore;
  const plan = await store.get(planId);
  if (!plan) throw new PlanNotFoundError(planId);
  const steps = plan.steps.map((s) =>
    s.stepId === stepId ? { ...s, status: 'ready' as PlanStepStatus } : s,
  );
  if (!steps.some((s) => s.stepId === stepId)) {
    throw new Error(`Step not found: ${stepId} in plan ${planId}`);
  }
  const updated: PlanGraph = { ...plan, steps, updatedAt: Date.now() };
  await store.put(updated);
  return updated;
}

interface RunPlanArgs {
  planId: string;
  rootPlanId: string;
  store: PlanStore;
  executor: PlanStepExecutor;
  ledger: ActionLedgerWriter;
  runId: string;
  approvedStepIds: Set<string>;
  maxDepth: number;
  depth: number;
  fallbacksUsed: string[];
}

async function runPlan(args: RunPlanArgs): Promise<PlanRunResult> {
  const {
    planId,
    rootPlanId,
    store,
    executor,
    ledger,
    runId,
    approvedStepIds,
    maxDepth,
    depth,
    fallbacksUsed,
  } = args;

  const plan = await store.get(planId);
  if (!plan) throw new PlanNotFoundError(planId);

  const updatedSteps: PlanStep[] = plan.steps.map((s) => ({ ...s }));
  const indexById = new Map(updatedSteps.map((s, i) => [s.stepId, i]));
  const ordered = plan.executionOrder
    .map((id) => indexById.get(id))
    .filter((i): i is number => i !== undefined);

  const executed: PlanRunStepRecord[] = [];

  await persistPlan(store, plan, updatedSteps, 'executing');
  ledger.record(
    makeLedgerEntry(runId, 'workflow-start', `Run ${runId} executing plan ${planId}`, {
      metadata: { planId, rootPlanId, depth, fallbackOf: plan.fallbackOf ?? null },
    }),
  );

  for (let orderIdx = 0; orderIdx < ordered.length; orderIdx++) {
    const idx = ordered[orderIdx]!;
    const step = updatedSteps[idx]!;

    if (step.status === 'completed') {
      executed.push({
        stepId: step.stepId,
        status: 'completed',
        output: step.metadata.output,
        durationMs: 0,
      });
      continue;
    }
    if (step.status === 'skipped') {
      executed.push({ stepId: step.stepId, status: 'skipped', durationMs: 0 });
      continue;
    }

    // Approval gate.
    const preApproved = approvedStepIds.has(step.stepId) || step.status === 'ready';
    if (step.requiredApproval && !preApproved) {
      step.status = 'blocked';
      ledger.record(
        makeLedgerEntry(runId, 'approval', `Plan ${planId} step ${step.stepId} awaiting approval`, {
          stepId: step.stepId,
          metadata: {
            reason: step.approvalReason ?? 'approval required',
            planId,
          },
        }),
      );
      await persistPlan(store, plan, updatedSteps, 'executing');
      return {
        runId,
        planId,
        rootPlanId,
        status: 'awaiting-approval',
        executedSteps: executed,
        awaitingApproval: {
          planId,
          stepId: step.stepId,
          ...(step.approvalReason !== undefined ? { reason: step.approvalReason } : {}),
        },
        fallbacksUsed,
      };
    }

    step.status = 'running';
    await persistPlan(store, plan, updatedSteps, 'executing');
    ledger.record(
      makeLedgerEntry(runId, 'tool-call', `Step ${step.stepId} starting`, {
        stepId: step.stepId,
        metadata: {
          planId,
          model: step.route.model ?? null,
          toolId: step.route.toolId ?? null,
        },
      }),
    );

    const t0 = Date.now();
    let result: PlanStepExecutorResult;
    try {
      result = await executor(step, {
        planId,
        runId,
        stepIndex: orderIdx,
        previousResults: executed.map((r) => ({
          stepId: r.stepId,
          output: r.output,
        })),
      });
    } catch (err) {
      result = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
    const durationMs = Date.now() - t0;

    if (result.success) {
      step.status = 'completed';
      step.metadata = {
        ...step.metadata,
        output: result.output,
        lastRunMs: durationMs,
      };
      executed.push({
        stepId: step.stepId,
        status: 'completed',
        output: result.output,
        durationMs,
      });
      ledger.record(
        makeLedgerEntry(runId, 'tool-call', `Step ${step.stepId} completed`, {
          stepId: step.stepId,
          metadata: { planId, durationMs },
        }),
      );
      await persistPlan(store, plan, updatedSteps, 'executing');
      continue;
    }

    // Failure path.
    step.status = 'failed';
    step.metadata = {
      ...step.metadata,
      error: result.error,
      lastRunMs: durationMs,
    };
    executed.push({
      stepId: step.stepId,
      status: 'failed',
      ...(result.error !== undefined ? { error: result.error } : {}),
      durationMs,
    });
    ledger.record(
      makeLedgerEntry(
        runId,
        'tool-call',
        `Step ${step.stepId} failed: ${result.error ?? 'unknown error'}`,
        { stepId: step.stepId, metadata: { planId, durationMs } },
      ),
    );
    await persistPlan(store, plan, updatedSteps, 'failed');

    // Failover to the highest-rank fallback we haven't tried yet.
    if (depth < maxDepth && plan.fallbacks.length > 0) {
      for (const fbId of plan.fallbacks) {
        if (fallbacksUsed.includes(fbId)) continue;
        ledger.record(
          makeLedgerEntry(
            runId,
            'rollback',
            `Failover from plan ${planId} → fallback ${fbId} after step ${step.stepId} failed`,
            {
              stepId: step.stepId,
              metadata: {
                from: planId,
                to: fbId,
                rank: plan.fallbacks.indexOf(fbId) + 1,
              },
            },
          ),
        );
        const fbResult = await runPlan({
          ...args,
          planId: fbId,
          depth: depth + 1,
          fallbacksUsed: [...fallbacksUsed, fbId],
        });
        return {
          ...fbResult,
          executedSteps: [...executed, ...fbResult.executedSteps],
        };
      }
    }

    return {
      runId,
      planId,
      rootPlanId,
      status: 'failed',
      executedSteps: executed,
      error: result.error ?? `Step ${step.stepId} failed`,
      fallbacksUsed,
    };
  }

  await persistPlan(store, plan, updatedSteps, 'completed');
  ledger.record(
    makeLedgerEntry(runId, 'workflow-end', `Run ${runId} completed plan ${planId}`, {
      metadata: { planId, rootPlanId, depth },
    }),
  );

  return {
    runId,
    planId,
    rootPlanId,
    status: 'completed',
    executedSteps: executed,
    fallbacksUsed,
  };
}

async function persistPlan(
  store: PlanStore,
  plan: PlanGraph,
  steps: PlanStep[],
  status: PlanGraph['status'],
): Promise<void> {
  await store.put({ ...plan, steps, status, updatedAt: Date.now() });
}
