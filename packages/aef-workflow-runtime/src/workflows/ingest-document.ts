import {
  ApprovalGateActor,
  ChunkPlannerActor,
  IndexVerifierActor,
  IngestionPlannerActor,
  loadDefaultChunkTokenizer,
  PolicyGuardActor,
  SourceNormalizerActor,
  VectorDispatchActor,
} from '../actors.js';
import type { WorkflowContext, WorkflowDefinition, WorkflowStepResult } from '../types.js';

const planner = new IngestionPlannerActor();
const normalizer = new SourceNormalizerActor();
const policyGuard = new PolicyGuardActor();
const vectorDispatch = new VectorDispatchActor();
const indexVerifier = new IndexVerifierActor();
const approvalGate = new ApprovalGateActor();

/**
 * Build the ingestion workflow around an explicit chunk planner. Tests and
 * alternate embedding backends can inject a deterministic tokenizer while the
 * production definition keeps the lazy model-tokenizer loader.
 */
export function createIngestDocumentWorkflow(
  chunkPlanner = new ChunkPlannerActor({
    tokenizerLoader: () => loadDefaultChunkTokenizer(),
  }),
): WorkflowDefinition {
  return {
    kind: 'ingest_document',
    displayName: 'Ingest Document',
    steps: [
      {
        stepId: 'policy-check',
        actor: 'PolicyGuard',
        description: 'Enforce tenant boundary and policy rules before ingestion begins.',
        async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
          return policyGuard.execute(ctx, { operation: 'ingest_document', ...ctx.input });
        },
      },
      {
        stepId: 'plan-ingestion',
        actor: 'IngestionPlanner',
        description: 'Analyze source document and produce an ingestion plan.',
        async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
          return planner.execute(ctx, ctx.input);
        },
      },
      {
        stepId: 'normalize-source',
        actor: 'SourceNormalizer',
        description: 'Normalize encoding, whitespace, and content type.',
        async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
          return normalizer.execute(ctx, ctx.input);
        },
      },
      {
        stepId: 'plan-chunks',
        actor: 'ChunkPlanner',
        description:
          'Partition normalized document into chunks according to profile configuration.',
        async execute(ctx: WorkflowContext, _prior: WorkflowStepResult[]) {
          return chunkPlanner.execute(ctx, ctx.input);
        },
      },
      {
        stepId: 'approval-gate',
        actor: 'ApprovalGate',
        description: 'Optional human approval gate before vector dispatch.',
        requiresApproval: false,
        async execute(ctx: WorkflowContext, prior: WorkflowStepResult[]) {
          const chunkStep = prior.find((s) => s.stepId === 'plan-chunks');
          const totalChunks = Number(chunkStep?.output?.totalChunks ?? 0);
          return approvalGate.execute(ctx, {
            requiresApproval: ctx.approvalRequired && totalChunks > 1000,
          });
        },
      },
      {
        stepId: 'vector-dispatch',
        actor: 'VectorDispatch',
        description:
          'Dispatch chunks to the embedding worker for vector generation and index write.',
        async execute(ctx: WorkflowContext, prior: WorkflowStepResult[]) {
          const chunkStep = prior.find((s) => s.stepId === 'plan-chunks');
          const totalChunks = Number(chunkStep?.output?.totalChunks ?? 0);
          return vectorDispatch.execute(ctx, { totalChunks, ...ctx.input });
        },
      },
      {
        stepId: 'verify-index',
        actor: 'IndexVerifier',
        description: 'Verify that all dispatched chunks were successfully indexed.',
        async execute(ctx: WorkflowContext, prior: WorkflowStepResult[]) {
          const chunkStep = prior.find((s) => s.stepId === 'plan-chunks');
          const dispatchStep = prior.find((s) => s.stepId === 'vector-dispatch');
          const expected = Number(chunkStep?.output?.totalChunks ?? 0);
          const dispatched = Number(dispatchStep?.output?.dispatchedChunks ?? expected);
          return indexVerifier.execute(ctx, {
            expectedChunks: expected,
            indexedChunks: dispatched,
          });
        },
      },
    ],
  };
}

export const ingestDocumentWorkflow = createIngestDocumentWorkflow();
