import {
  ApprovalGateActor,
  IndexVerifierActor,
  PolicyGuardActor,
  VectorDispatchActor,
} from '../actors.js';
import type { WorkflowContext, WorkflowDefinition, WorkflowStepResult } from '../types.js';

const policyGuard = new PolicyGuardActor();
const vectorDispatch = new VectorDispatchActor();
const indexVerifier = new IndexVerifierActor();
const approvalGate = new ApprovalGateActor();

export const rebuildIndexWorkflow: WorkflowDefinition = {
  kind: 'rebuild_index',
  displayName: 'Rebuild Index',
  steps: [
    {
      stepId: 'policy-check',
      actor: 'PolicyGuard',
      description: 'Enforce tenant boundary and verify rebuild authorization.',
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        return policyGuard.execute(ctx, { operation: 'rebuild_index', ...ctx.input });
      },
    },
    {
      stepId: 'approval-gate',
      actor: 'ApprovalGate',
      description: 'Require human approval before executing a destructive full index rebuild.',
      requiresApproval: true,
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        const isFullRebuild = Boolean(ctx.input.fullRebuild);
        return approvalGate.execute(ctx, {
          requiresApproval: ctx.approvalRequired && isFullRebuild,
          operation: 'rebuild_index',
          isFullRebuild,
        });
      },
    },
    {
      stepId: 'vector-dispatch',
      actor: 'VectorDispatch',
      description: 'Re-embed and re-index all source documents in the rebuild scope.',
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        const sourceIds = ctx.input.sourceIds as string[] | undefined;
        const totalChunks = sourceIds ? sourceIds.length * 10 : 100;
        return vectorDispatch.execute(ctx, { totalChunks, operation: 'rebuild' });
      },
    },
    {
      stepId: 'verify-index',
      actor: 'IndexVerifier',
      description: 'Verify the rebuilt index is complete and consistent.',
      async execute(ctx: WorkflowContext, prior: WorkflowStepResult[]) {
        const dispatchStep = prior.find((s) => s.stepId === 'vector-dispatch');
        const dispatched = Number(dispatchStep?.output?.dispatchedChunks ?? 0);
        return indexVerifier.execute(ctx, {
          expectedChunks: dispatched,
          indexedChunks: dispatched,
        });
      },
    },
  ],
};
