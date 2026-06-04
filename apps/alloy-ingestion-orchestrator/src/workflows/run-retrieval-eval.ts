/**
 * AEF Ingestion Orchestrator — run_retrieval_eval workflow
 *
 * Pipeline:
 *   execute eval fixtures against current profile → write results
 *
 * Steps:
 *   1. RetrievalEvaluator — run eval dataset against profile, compute metrics
 */

import type { WorkflowDefinition } from '../types.js';

export interface RunRetrievalEvalInput {
  tenantId: string;
  profileId: string;
  datasetId: string;
  queries: Array<{ queryId: string; query: string; relevantChunkIds: string[] }>;
  topK?: number;
  metrics?: Array<'ndcg' | 'recall' | 'precision' | 'mrr'>;
}

export function buildRunRetrievalEvalWorkflow(input: RunRetrievalEvalInput): WorkflowDefinition {
  return {
    workflowId: 'run_retrieval_eval',
    name: 'Run Retrieval Eval',
    description: 'Execute eval fixtures against current profile → write results',
    retryPolicy: { maxAttempts: 2, backoffMs: 100 },
    steps: [
      {
        stepId: 'retrieval-eval',
        name: 'RetrievalEvaluator: Execute Eval Fixtures',
        actor: 'RetrievalEvaluator',
        input: {
          tenantId: input.tenantId,
          profileId: input.profileId,
          datasetId: input.datasetId,
          queries: input.queries,
          topK: input.topK ?? 10,
          metrics: input.metrics ?? ['ndcg', 'recall'],
        },
      },
    ],
  };
}
