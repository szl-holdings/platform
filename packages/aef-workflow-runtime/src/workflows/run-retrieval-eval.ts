import { PolicyGuardActor, RetrievalEvaluatorActor } from '../actors.js';
import type { WorkflowContext, WorkflowDefinition, WorkflowStepResult } from '../types.js';

const policyGuard = new PolicyGuardActor();
const evaluator = new RetrievalEvaluatorActor();

export const runRetrievalEvalWorkflow: WorkflowDefinition = {
  kind: 'run_retrieval_eval',
  displayName: 'Run Retrieval Evaluation',
  steps: [
    {
      stepId: 'policy-check',
      actor: 'PolicyGuard',
      description: 'Enforce tenant boundary and verify eval authorization.',
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        return policyGuard.execute(ctx, { operation: 'run_retrieval_eval', ...ctx.input });
      },
    },
    {
      stepId: 'run-evaluation',
      actor: 'RetrievalEvaluator',
      description:
        'Execute the retrieval evaluation against golden fixtures, compute nDCG, recall, precision, MRR, and evidence-completeness metrics.',
      async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
        const queries = ctx.input['queries'];
        const queryCount = Array.isArray(queries)
          ? queries.length
          : Number(ctx.input['queryCount'] ?? 0);
        return evaluator.execute(ctx, { queryCount, ...ctx.input });
      },
    },
  ],
};
