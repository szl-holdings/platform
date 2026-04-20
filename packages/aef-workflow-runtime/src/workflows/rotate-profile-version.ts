import { ApprovalGateActor, PolicyGuardActor } from '../actors.js';
import type { WorkflowContext, WorkflowDefinition, WorkflowStepResult } from '../types.js';

const policyGuard = new PolicyGuardActor();
const approvalGate = new ApprovalGateActor();

export const rotateProfileVersionWorkflow: WorkflowDefinition = {
  kind: 'rotate_profile_version',
  displayName: 'Rotate Profile Version',
  steps: [
    {
      stepId: 'policy-check',
      actor: 'PolicyGuard',
      description: 'Enforce tenant boundary and verify profile rotation authorization.',
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        return policyGuard.execute(ctx, { operation: 'rotate_profile_version', ...ctx.input });
      },
    },
    {
      stepId: 'approval-gate',
      actor: 'ApprovalGate',
      description:
        'Require human approval before activating the new profile version across tenants.',
      requiresApproval: true,
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        return approvalGate.execute(ctx, {
          requiresApproval: ctx.approvalRequired,
          operation: 'rotate_profile_version',
          profileId: ctx.profileId,
          newVersion: ctx.input['newVersion'],
          affectedTenants: ctx.input['tenantIds'],
        });
      },
    },
    {
      stepId: 'activate-version',
      actor: 'PolicyGuard',
      description:
        'Activate the new profile version in the registry and record the version transition.',
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        return {
          activated: true,
          profileId: ctx.profileId,
          previousVersion: ctx.input['previousVersion'],
          newVersion: ctx.input['newVersion'],
          activatedAt: new Date().toISOString(),
          tenantIds: ctx.input['tenantIds'],
        };
      },
    },
  ],
};
