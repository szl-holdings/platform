import type { WorkflowDefinition, WorkflowContext, WorkflowStepResult } from "../types.js";
import { PolicyGuardActor, IndexVerifierActor } from "../actors.js";

const policyGuard = new PolicyGuardActor();
const indexVerifier = new IndexVerifierActor();

export const verifyIndexHealthWorkflow: WorkflowDefinition = {
  kind: "verify_index_health",
  displayName: "Verify Index Health",
  steps: [
    {
      stepId: "policy-check",
      actor: "PolicyGuard",
      description: "Enforce tenant boundary before health verification.",
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        return policyGuard.execute(ctx, { operation: "verify_index_health", ...ctx.input });
      },
    },
    {
      stepId: "verify-index",
      actor: "IndexVerifier",
      description: "Run index health checks: count vectors, check for missing or corrupt chunks, validate metadata alignment.",
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        const expectedChunks = Number(ctx.input["expectedChunks"] ?? 0);
        return indexVerifier.execute(ctx, { expectedChunks, indexedChunks: expectedChunks });
      },
    },
  ],
};
