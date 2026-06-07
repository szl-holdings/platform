import { type ApprovalStore, createApprovalRequest, InMemoryApprovalStore } from './approval.js';
import { type CheckpointStore, InMemoryCheckpointStore } from './checkpoint.js';
import type {
  AuditEmitter,
  AuditEvent,
  WorkflowCheckpoint,
  WorkflowContext,
  WorkflowDefinition,
  WorkflowStepResult,
} from './types.js';

export interface WorkflowRunOptions {
  checkpointStore?: CheckpointStore;
  approvalStore?: ApprovalStore;
  auditEmitter?: AuditEmitter;
  resumeFrom?: string;
}

export interface WorkflowRunResult {
  workflowId: string;
  kind: string;
  status: WorkflowCheckpoint['status'];
  completedSteps: WorkflowStepResult[];
  approvalRequestId?: string;
  durationMs: number;
  finalOutput: Record<string, unknown>;
}

export class WorkflowStateMachine {
  private readonly definition: WorkflowDefinition;

  constructor(definition: WorkflowDefinition) {
    this.definition = definition;
  }

  async run(ctx: WorkflowContext, opts: WorkflowRunOptions = {}): Promise<WorkflowRunResult> {
    const {
      checkpointStore = new InMemoryCheckpointStore(),
      approvalStore = new InMemoryApprovalStore(),
      auditEmitter,
    } = opts;

    const startedAt = Date.now();

    let checkpoint = checkpointStore.load(ctx.workflowId);
    let startIndex = 0;
    let completedSteps: WorkflowStepResult[] = [];

    if (checkpoint) {
      startIndex = checkpoint.currentStepIndex;
      completedSteps = [...checkpoint.completedSteps];

      if (checkpoint.status === 'waiting_approval' && checkpoint.approvalRequestId) {
        const approval = approvalStore.get(checkpoint.approvalRequestId);
        if (!approval) {
          throw new Error(
            `Workflow ${ctx.workflowId} is waiting for approval ${checkpoint.approvalRequestId} but the approval record was not found.`,
          );
        }
        if (approval.decision === 'pending') {
          return {
            workflowId: ctx.workflowId,
            kind: this.definition.kind,
            status: 'waiting_approval',
            completedSteps,
            approvalRequestId: checkpoint.approvalRequestId,
            durationMs: Date.now() - startedAt,
            finalOutput: { awaiting: 'approval' },
          };
        }
        if (approval.decision === 'rejected') {
          this.saveCheckpoint(
            checkpointStore,
            ctx,
            'rejected',
            startIndex,
            completedSteps,
            checkpoint.context,
          );
          this.emitAudit(auditEmitter, {
            workflowId: ctx.workflowId,
            kind: this.definition.kind,
            tenantId: ctx.tenantId,
            profileId: ctx.profileId,
            outcome: 'rejected',
            details: { approvalId: checkpoint.approvalRequestId },
          });
          return {
            workflowId: ctx.workflowId,
            kind: this.definition.kind,
            status: 'rejected',
            completedSteps,
            approvalRequestId: checkpoint.approvalRequestId,
            durationMs: Date.now() - startedAt,
            finalOutput: { rejection: 'operator rejected' },
          };
        }
        // Approval was granted — resume from the step AFTER the approval gate
        startIndex = checkpoint.currentStepIndex + 1;
      }
    } else {
      checkpoint = this.buildInitialCheckpoint(ctx);
      checkpointStore.save(checkpoint);
    }

    let accumulatedOutput: Record<string, unknown> = { ...checkpoint.context };

    for (let i = startIndex; i < this.definition.steps.length; i++) {
      const stepDef = this.definition.steps[i];
      if (!stepDef) continue;

      const stepStartedAt = new Date().toISOString();

      this.saveCheckpoint(checkpointStore, ctx, 'running', i, completedSteps, accumulatedOutput);

      this.emitAudit(auditEmitter, {
        workflowId: ctx.workflowId,
        kind: this.definition.kind,
        stepId: stepDef.stepId,
        actor: stepDef.actor,
        tenantId: ctx.tenantId,
        profileId: ctx.profileId,
        outcome: 'success',
        details: { phase: 'step_start' },
      });

      let stepResult: WorkflowStepResult;

      try {
        const result = await stepDef.execute(
          { ...ctx, input: { ...ctx.input, ...accumulatedOutput } },
          completedSteps,
        );

        // Actors wrap their data in { output: {...}, requiresApproval?: bool }.
        // Extract the inner output for step storage and accumulation so downstream
        // steps can read fields directly from ctx.input without extra nesting.
        const flatOutput: Record<string, unknown> =
          result.output !== undefined &&
          typeof result.output === 'object' &&
          result.output !== null
            ? (result.output as Record<string, unknown>)
            : result;

        if (result.requiresApproval === true && ctx.approvalRequired) {
          const approvalReq = createApprovalRequest(
            ctx.workflowId,
            `${this.definition.kind}.${stepDef.stepId}`,
            (result.approvalContext as Record<string, unknown>) ?? {},
          );
          approvalStore.create(approvalReq);

          stepResult = {
            stepId: stepDef.stepId,
            actor: stepDef.actor,
            status: 'waiting',
            startedAt: stepStartedAt,
            completedAt: new Date().toISOString(),
            output: flatOutput,
          };

          completedSteps.push(stepResult);
          this.saveCheckpoint(
            checkpointStore,
            ctx,
            'waiting_approval',
            i,
            completedSteps,
            accumulatedOutput,
            approvalReq.approvalId,
          );

          this.emitAudit(auditEmitter, {
            workflowId: ctx.workflowId,
            kind: this.definition.kind,
            stepId: stepDef.stepId,
            actor: stepDef.actor,
            tenantId: ctx.tenantId,
            profileId: ctx.profileId,
            outcome: 'approval_requested',
            details: { approvalId: approvalReq.approvalId },
          });

          return {
            workflowId: ctx.workflowId,
            kind: this.definition.kind,
            status: 'waiting_approval',
            completedSteps,
            approvalRequestId: approvalReq.approvalId,
            durationMs: Date.now() - startedAt,
            finalOutput: { awaiting: 'approval', approvalId: approvalReq.approvalId },
          };
        }

        stepResult = {
          stepId: stepDef.stepId,
          actor: stepDef.actor,
          status: 'success',
          startedAt: stepStartedAt,
          completedAt: new Date().toISOString(),
          output: flatOutput,
        };

        accumulatedOutput = { ...accumulatedOutput, ...flatOutput };

        this.emitAudit(auditEmitter, {
          workflowId: ctx.workflowId,
          kind: this.definition.kind,
          stepId: stepDef.stepId,
          actor: stepDef.actor,
          tenantId: ctx.tenantId,
          profileId: ctx.profileId,
          outcome: 'success',
          details: { output: result },
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        stepResult = {
          stepId: stepDef.stepId,
          actor: stepDef.actor,
          status: 'failed',
          startedAt: stepStartedAt,
          completedAt: new Date().toISOString(),
          output: {},
          error: errorMsg,
        };

        completedSteps.push(stepResult);
        this.saveCheckpoint(checkpointStore, ctx, 'failed', i, completedSteps, accumulatedOutput);

        this.emitAudit(auditEmitter, {
          workflowId: ctx.workflowId,
          kind: this.definition.kind,
          stepId: stepDef.stepId,
          actor: stepDef.actor,
          tenantId: ctx.tenantId,
          profileId: ctx.profileId,
          outcome: 'failure',
          details: { error: errorMsg },
        });

        return {
          workflowId: ctx.workflowId,
          kind: this.definition.kind,
          status: 'failed',
          completedSteps,
          durationMs: Date.now() - startedAt,
          finalOutput: accumulatedOutput,
        };
      }

      completedSteps.push(stepResult);
    }

    this.saveCheckpoint(
      checkpointStore,
      ctx,
      'completed',
      this.definition.steps.length,
      completedSteps,
      accumulatedOutput,
    );
    checkpointStore.delete(ctx.workflowId);

    this.emitAudit(auditEmitter, {
      workflowId: ctx.workflowId,
      kind: this.definition.kind,
      tenantId: ctx.tenantId,
      profileId: ctx.profileId,
      outcome: 'success',
      details: { totalSteps: completedSteps.length, durationMs: Date.now() - startedAt },
    });

    return {
      workflowId: ctx.workflowId,
      kind: this.definition.kind,
      status: 'completed',
      completedSteps,
      durationMs: Date.now() - startedAt,
      finalOutput: accumulatedOutput,
    };
  }

  private buildInitialCheckpoint(ctx: WorkflowContext): WorkflowCheckpoint {
    const now = new Date().toISOString();
    return {
      workflowId: ctx.workflowId,
      kind: this.definition.kind,
      currentStepIndex: 0,
      totalSteps: this.definition.steps.length,
      status: 'pending',
      completedSteps: [],
      context: ctx.input,
      createdAt: now,
      updatedAt: now,
    };
  }

  private saveCheckpoint(
    store: CheckpointStore,
    ctx: WorkflowContext,
    status: WorkflowCheckpoint['status'],
    currentStepIndex: number,
    completedSteps: WorkflowStepResult[],
    context: Record<string, unknown>,
    approvalRequestId?: string,
  ): void {
    const cp = store.load(ctx.workflowId) ?? this.buildInitialCheckpoint(ctx);
    store.save({
      ...cp,
      status,
      currentStepIndex,
      completedSteps: [...completedSteps],
      context,
      updatedAt: new Date().toISOString(),
      ...(approvalRequestId !== undefined ? { approvalRequestId } : {}),
    });
  }

  private emitAudit(
    emitter: AuditEmitter | undefined,
    fields: {
      workflowId: string;
      kind: string;
      stepId?: string | undefined;
      actor?: string | undefined;
      tenantId: string;
      profileId?: string | undefined;
      outcome: AuditEvent['outcome'];
      details: Record<string, unknown>;
    },
  ): void {
    if (!emitter) return;
    const event: AuditEvent = {
      auditId: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      workflowId: fields.workflowId,
      kind: fields.kind,
      ...(fields.stepId !== undefined ? { stepId: fields.stepId } : {}),
      ...(fields.actor !== undefined ? { actor: fields.actor } : {}),
      tenantId: fields.tenantId,
      ...(fields.profileId !== undefined ? { profileId: fields.profileId } : {}),
      occurredAt: new Date().toISOString(),
      outcome: fields.outcome,
      details: fields.details,
    };
    emitter(event);
  }
}
