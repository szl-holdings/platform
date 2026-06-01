export * from './actors.js';
export * from './approval.js';
export * from './checkpoint.js';
export * from './state-machine.js';
export * from './types.js';

export { ingestDocumentWorkflow } from './workflows/ingest-document.js';
export { rebuildIndexWorkflow } from './workflows/rebuild-index.js';
export { rotateProfileVersionWorkflow } from './workflows/rotate-profile-version.js';
export { runRetrievalEvalWorkflow } from './workflows/run-retrieval-eval.js';
export { verifyIndexHealthWorkflow } from './workflows/verify-index-health.js';

import { WorkflowStateMachine } from './state-machine.js';
import type { WorkflowKind } from './types.js';
import { ingestDocumentWorkflow } from './workflows/ingest-document.js';
import { rebuildIndexWorkflow } from './workflows/rebuild-index.js';
import { rotateProfileVersionWorkflow } from './workflows/rotate-profile-version.js';
import { runRetrievalEvalWorkflow } from './workflows/run-retrieval-eval.js';
import { verifyIndexHealthWorkflow } from './workflows/verify-index-health.js';

const WORKFLOW_MAP = {
  ingest_document: ingestDocumentWorkflow,
  rebuild_index: rebuildIndexWorkflow,
  verify_index_health: verifyIndexHealthWorkflow,
  run_retrieval_eval: runRetrievalEvalWorkflow,
  rotate_profile_version: rotateProfileVersionWorkflow,
} as const;

export function createWorkflowMachine(kind: WorkflowKind): WorkflowStateMachine {
  const definition = WORKFLOW_MAP[kind];
  if (!definition) {
    throw new Error(`Unknown workflow kind: ${kind}`);
  }
  return new WorkflowStateMachine(definition);
}

export const AEF_WORKFLOW_RUNTIME_VERSION = '0.1.0' as const;
