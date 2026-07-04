/**
 * AEF Ingestion Orchestrator — Workflow Engine
 *
 * Deterministic graph execution engine:
 *   - Walks workflow steps in order
 *   - Threads prior step outputs into subsequent step inputs
 *   - Checkpoints after each successful step
 *   - Retries failed steps according to retry policy
 *   - Pauses at HumanApprovalGate steps and returns pending-approval status
 *   - Supports resume from the latest checkpoint
 *   - Emits audit events for every state transition
 */

import { randomUUID } from 'node:crypto';
import { type ActorContext, EmbedDispatcher, HumanApprovalGate, IndexVerifier, IngestionPlanner, PolicyGuard, RetrievalEvaluator, SchemaMapper } from './actors/index.js';
import { type AuditEmitter, defaultAuditEmitter } from './audit.js';
import { type CheckpointStore, createCheckpoint, defaultCheckpointStore } from './checkpoint-store.js';
import { type RunStore, defaultRunStore } from './run-store.js';
import { devChunkStore, devIndexStore, devRawDocumentStore } from './storage/dev.js';
import type { StorageAdapters } from './storage/interfaces.js';
import { type StepResult, type WorkflowDefinition, type WorkflowRun, DEFAULT_RETRY_POLICY } from './types.js';

// ─── Default Storage ──────────────────────────────────────────────────────────

export const defaultStorageAdapters: StorageAdapters = {
  rawDocumentStore: devRawDocumentStore,
  chunkStore: devChunkStore,
  indexStore: devIndexStore,
};

// ─── Engine Options ───────────────────────────────────────────────────────────

export interface EngineOptions {
  runStore?: RunStore;
  checkpointStore?: CheckpointStore;
  audit?: AuditEmitter;
  storage?: StorageAdapters;
}

// ─── Step Input Resolution ────────────────────────────────────────────────────
//
// Step inputs may reference previous step outputs via the `__from_prev__`
// sentinel. The engine resolves these at execution time by walking the prior
// step results. This keeps workflow definitions simple and declarative while
// still supporting data-flow between steps.
//
// Resolution rules:
//   If the top-level value equals "__from_prev__", replace with prior output.
//   If a value within the input object equals "__from_prev__", replace with
//   the corresponding field from the prior step output.
//   If a value equals "__from_run__", replace with the run ID.

function resolveStepInput(rawInput: unknown, priorOutput: unknown, runId: string): unknown {
  if (rawInput === '__from_prev__') return priorOutput;
  if (rawInput === '__from_run__') return runId;
  if (rawInput === null || typeof rawInput !== 'object') return rawInput;
  if (Array.isArray(rawInput)) {
    return rawInput.map((item) => resolveStepInput(item, priorOutput, runId));
  }

  const obj = rawInput as Record<string, unknown>;
  const priorObj =
    priorOutput !== null && typeof priorOutput === 'object' && !Array.isArray(priorOutput)
      ? (priorOutput as Record<string, unknown>)
      : {};

  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === '__from_prev__') {
      resolved[key] = priorObj[key] ?? priorOutput;
    } else if (value === '__from_run__') {
      resolved[key] = runId;
    } else {
      resolved[key] = resolveStepInput(value, priorOutput, runId);
    }
  }
  return resolved;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class OrchestratorEngine {
  private readonly runStore: RunStore;
  private readonly checkpointStore: CheckpointStore;
  private readonly audit: AuditEmitter;
  private readonly storage: StorageAdapters;

  constructor(opts: EngineOptions = {}) {
    this.runStore = opts.runStore ?? defaultRunStore;
    this.checkpointStore = opts.checkpointStore ?? defaultCheckpointStore;
    this.audit = opts.audit ?? defaultAuditEmitter;
    this.storage = opts.storage ?? defaultStorageAdapters;
  }

  // ─── Start a New Run ───────────────────────────────────────────────────────

  async start(
    definition: WorkflowDefinition,
    params: {
      tenantId: string;
      profileId: string;
      input: unknown;
      metadata?: Record<string, unknown>;
    },
  ): Promise<WorkflowRun> {
    const runId = randomUUID();
    const now = new Date().toISOString();

    const run: WorkflowRun = {
      runId,
      workflowId: definition.workflowId,
      workflowName: definition.name,
      tenantId: params.tenantId,
      profileId: params.profileId,
      status: 'queued',
      input: params.input,
      stepResults: [],
      currentStepIndex: 0,
      startedAt: now,
      updatedAt: now,
      metadata: params.metadata ?? {},
    };

    this.runStore.save(run);
    this.audit.emit({
      runId,
      workflowId: definition.workflowId,
      tenantId: params.tenantId,
      profileId: params.profileId,
      kind: 'run.started',
      payload: { workflowName: definition.name },
    });

    return this._execute(run, definition, 0, []);
  }

  // ─── Resume a Paused Run ───────────────────────────────────────────────────

  async resume(
    runId: string,
    definition: WorkflowDefinition,
    decision: 'approved' | 'rejected',
    actorId?: string,
    note?: string,
  ): Promise<WorkflowRun> {
    const run = this.runStore.get(runId);
    if (!run) throw new Error(`Run not found: ${runId}`);
    if (run.status !== 'pending-approval') {
      throw new Error(`Run ${runId} is not pending-approval (status=${run.status})`);
    }

    if (decision === 'rejected') {
      this.audit.emit({
        runId,
        workflowId: run.workflowId,
        tenantId: run.tenantId,
        profileId: run.profileId,
        kind: 'approval.rejected',
        payload: { actorId: actorId ?? null, note: note ?? null },
      });
      const updated: WorkflowRun = {
        ...run,
        status: 'failed',
        error: `Approval rejected by ${actorId ?? 'operator'}${note ? `: ${note}` : ''}`,
        updatedAt: new Date().toISOString(),
      };
      this.runStore.save(updated);
      return updated;
    }

    this.audit.emit({
      runId,
      workflowId: run.workflowId,
      tenantId: run.tenantId,
      profileId: run.profileId,
      kind: 'approval.granted',
      payload: { actorId: actorId ?? null, note: note ?? null },
    });

    const checkpoint = this.checkpointStore.latest(runId);
    const priorResults = checkpoint ? [...checkpoint.completedStepResults] : [...run.stepResults];
    const resumeIndex = run.currentStepIndex + 1;

    return this._execute(run, definition, resumeIndex, priorResults);
  }

  // ─── Cancel a Run ─────────────────────────────────────────────────────────

  cancel(runId: string): WorkflowRun {
    const run = this.runStore.get(runId);
    if (!run) throw new Error(`Run not found: ${runId}`);
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
      throw new Error(`Run ${runId} is already terminal (status=${run.status})`);
    }
    const updated: WorkflowRun = {
      ...run,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    this.runStore.save(updated);
    this.audit.emit({
      runId,
      workflowId: run.workflowId,
      tenantId: run.tenantId,
      profileId: run.profileId,
      kind: 'run.cancelled',
      payload: {},
    });
    return updated;
  }

  // ─── Graph Walk ────────────────────────────────────────────────────────────

  private async _execute(
    run: WorkflowRun,
    definition: WorkflowDefinition,
    startIndex: number,
    priorResults: StepResult[],
  ): Promise<WorkflowRun> {
    let currentRun: WorkflowRun = {
      ...run,
      status: 'running',
      stepResults: [...priorResults],
      updatedAt: new Date().toISOString(),
    };
    this.runStore.save(currentRun);

    const retryPolicy = definition.retryPolicy ?? DEFAULT_RETRY_POLICY;
    let lastOutput: unknown = currentRun.input;

    // Seed lastOutput from the last prior result
    if (priorResults.length > 0) {
      lastOutput = priorResults[priorResults.length - 1]?.output ?? currentRun.input;
    }

    for (let i = startIndex; i < definition.steps.length; i++) {
      const step = definition.steps[i];

      const resolvedInput = resolveStepInput(step.input, lastOutput, currentRun.runId);

      this.audit.emit({
        runId: currentRun.runId,
        workflowId: definition.workflowId,
        tenantId: currentRun.tenantId,
        profileId: currentRun.profileId,
        kind: 'step.started',
        payload: { stepId: step.stepId, actor: step.actor, stepIndex: i },
      });

      const actorCtx: ActorContext = {
        runId: currentRun.runId,
        tenantId: currentRun.tenantId,
        profileId: currentRun.profileId,
        stepId: step.stepId,
        storage: this.storage,
        audit: this.audit,
      };

      if (step.actor === 'HumanApprovalGate') {
        const gateInput = resolvedInput as Parameters<typeof HumanApprovalGate>[0];
        let gateOutput: Awaited<ReturnType<typeof HumanApprovalGate>>;
        try {
          gateOutput = await HumanApprovalGate(gateInput, actorCtx);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          const failedRun = this._failRun(currentRun, step.stepId, 'HumanApprovalGate', error, i);
          this.runStore.save(failedRun);
          return failedRun;
        }

        const gateResult: StepResult = {
          stepId: step.stepId,
          actor: 'HumanApprovalGate',
          status: 'pending-approval',
          output: gateOutput,
          startedAt: new Date().toISOString(),
          attempt: 1,
          approvalRequestId: gateOutput.approvalRequestId,
        };

        const checkpointResults = [...currentRun.stepResults];
        const checkpoint = createCheckpoint(currentRun.runId, i, checkpointResults);
        this.checkpointStore.save(checkpoint);

        currentRun = {
          ...currentRun,
          stepResults: [...currentRun.stepResults, gateResult],
          currentStepIndex: i,
          status: 'pending-approval',
          approvalRequestId: gateOutput.approvalRequestId,
          latestCheckpointId: checkpoint.checkpointId,
          updatedAt: new Date().toISOString(),
        };

        this.runStore.save(currentRun);
        this.audit.emit({
          runId: currentRun.runId,
          workflowId: definition.workflowId,
          tenantId: currentRun.tenantId,
          profileId: currentRun.profileId,
          kind: 'checkpoint.saved',
          payload: { checkpointId: checkpoint.checkpointId, stepIndex: i },
        });
        return currentRun;
      }

      const stepResult = await this._executeStepWithRetries(
        step.stepId,
        step.actor,
        resolvedInput,
        actorCtx,
        retryPolicy,
        i,
        currentRun.runId,
        definition.workflowId,
        currentRun.tenantId,
        currentRun.profileId,
      );

      currentRun = {
        ...currentRun,
        stepResults: [...currentRun.stepResults, stepResult],
        currentStepIndex: i,
        updatedAt: new Date().toISOString(),
      };

      if (stepResult.status === 'failed') {
        currentRun = {
          ...currentRun,
          status: 'failed',
          error: stepResult.error ?? `Step ${step.stepId} failed`,
          completedAt: new Date().toISOString(),
        };
        this.runStore.save(currentRun);
        this.audit.emit({
          runId: currentRun.runId,
          workflowId: definition.workflowId,
          tenantId: currentRun.tenantId,
          profileId: currentRun.profileId,
          kind: 'run.failed',
          payload: { stepId: step.stepId, error: currentRun.error },
        });
        return currentRun;
      }

      lastOutput = stepResult.output;

      const checkpoint = createCheckpoint(currentRun.runId, i, [...currentRun.stepResults]);
      this.checkpointStore.save(checkpoint);
      currentRun = { ...currentRun, latestCheckpointId: checkpoint.checkpointId };
      this.runStore.save(currentRun);

      this.audit.emit({
        runId: currentRun.runId,
        workflowId: definition.workflowId,
        tenantId: currentRun.tenantId,
        profileId: currentRun.profileId,
        kind: 'checkpoint.saved',
        payload: { checkpointId: checkpoint.checkpointId, stepIndex: i },
      });
    }

    const completedAt = new Date().toISOString();
    currentRun = {
      ...currentRun,
      status: 'completed',
      completedAt,
      updatedAt: completedAt,
    };
    this.runStore.save(currentRun);
    this.audit.emit({
      runId: currentRun.runId,
      workflowId: definition.workflowId,
      tenantId: currentRun.tenantId,
      profileId: currentRun.profileId,
      kind: 'run.completed',
      payload: { stepCount: definition.steps.length },
    });

    return currentRun;
  }

  private async _executeStepWithRetries(
    stepId: string,
    actor: string,
    input: unknown,
    ctx: ActorContext,
    retryPolicy: { maxAttempts: number; backoffMs: number },
    stepIndex: number,
    runId: string,
    workflowId: string,
    tenantId: string,
    profileId: string,
  ): Promise<StepResult> {
    const startedAt = new Date().toISOString();
    let lastError = '';
    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
      const t0 = Date.now();
      try {
        const output = await this._invokeActor(actor, input, ctx);
        const durationMs = Date.now() - t0;
        this.audit.emit({
          runId,
          workflowId,
          tenantId,
          profileId,
          kind: 'step.completed',
          payload: { stepId, actor, attempt, durationMs, stepIndex },
        });
        return {
          stepId,
          actor: actor as StepResult['actor'],
          status: 'completed',
          output,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs,
          attempt,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        this.audit.emit({
          runId,
          workflowId,
          tenantId,
          profileId,
          kind: attempt < retryPolicy.maxAttempts ? 'step.retrying' : 'step.failed',
          payload: { stepId, actor, attempt, error: lastError, stepIndex },
        });
        if (attempt < retryPolicy.maxAttempts) {
          await sleep(retryPolicy.backoffMs * attempt);
        }
      }
    }

    return {
      stepId,
      actor: actor as StepResult['actor'],
      status: 'failed',
      error: lastError,
      startedAt,
      completedAt: new Date().toISOString(),
      attempt: retryPolicy.maxAttempts,
    };
  }

  private async _invokeActor(actor: string, input: unknown, ctx: ActorContext): Promise<unknown> {
    switch (actor) {
      case 'IngestionPlanner':
        return IngestionPlanner(input as Parameters<typeof IngestionPlanner>[0], ctx);
      case 'SchemaMapper':
        return SchemaMapper(input as Parameters<typeof SchemaMapper>[0], ctx);
      case 'PolicyGuard':
        return PolicyGuard(input as Parameters<typeof PolicyGuard>[0], ctx);
      case 'EmbedDispatcher':
        return EmbedDispatcher(input as Parameters<typeof EmbedDispatcher>[0], ctx);
      case 'IndexVerifier':
        return IndexVerifier(input as Parameters<typeof IndexVerifier>[0], ctx);
      case 'RetrievalEvaluator':
        return RetrievalEvaluator(input as Parameters<typeof RetrievalEvaluator>[0], ctx);
      case 'HumanApprovalGate':
        return HumanApprovalGate(input as Parameters<typeof HumanApprovalGate>[0], ctx);
      default:
        throw new Error(`Unknown actor: ${actor}`);
    }
  }

  private _failRun(
    run: WorkflowRun,
    stepId: string,
    actor: StepResult['actor'],
    error: string,
    stepIndex: number,
  ): WorkflowRun {
    const failedResult: StepResult = {
      stepId,
      actor,
      status: 'failed',
      error,
      startedAt: new Date().toISOString(),
      attempt: 1,
    };
    this.audit.emit({
      runId: run.runId,
      workflowId: run.workflowId,
      tenantId: run.tenantId,
      profileId: run.profileId,
      kind: 'run.failed',
      payload: { stepId, error, stepIndex },
    });
    return {
      ...run,
      status: 'failed',
      stepResults: [...run.stepResults, failedResult],
      error,
      currentStepIndex: stepIndex,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  getRunStore(): RunStore {
    return this.runStore;
  }

  getCheckpointStore(): CheckpointStore {
    return this.checkpointStore;
  }

  getAuditEmitter(): AuditEmitter {
    return this.audit;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const defaultEngine = new OrchestratorEngine();
