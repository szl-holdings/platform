/**
 * AEF Ingestion Orchestrator — rebuild_index workflow
 *
 * Pipeline:
 *   snapshot → re-embed batches → swap pointer → verify (approval-gated swap)
 *
 * Steps:
 *   1. IndexVerifier    — pre-rebuild health snapshot
 *   2. EmbedDispatcher  — re-embed all existing chunks
 *   3. HumanApprovalGate — approval-gated before pointer swap (destructive)
 *   4. IndexVerifier    — post-swap health verification
 */

import type { WorkflowDefinition } from '../types.js';

export interface RebuildIndexInput {
  tenantId: string;
  profileId: string;
  fullRebuild?: boolean;
  sourceIds?: string[];
}

export function buildRebuildIndexWorkflow(input: RebuildIndexInput): WorkflowDefinition {
  return {
    workflowId: 'rebuild_index',
    name: 'Rebuild Index',
    description: 'Snapshot → re-embed batches → swap pointer → verify (approval-gated swap)',
    retryPolicy: { maxAttempts: 2, backoffMs: 200 },
    steps: [
      {
        stepId: 'pre-rebuild-snapshot',
        name: 'IndexVerifier: Pre-Rebuild Health Snapshot',
        actor: 'IndexVerifier',
        input: {
          tenantId: input.tenantId,
          profileId: input.profileId,
          sampleSize: 20,
        },
      },
      {
        stepId: 're-embed-batches',
        name: 'EmbedDispatcher: Re-embed Existing Chunks',
        actor: 'EmbedDispatcher',
        input: {
          sourceId: `rebuild-${input.tenantId}-${input.profileId}`,
          chunks: [],
          tenantId: input.tenantId,
          profileId: input.profileId,
        },
      },
      {
        stepId: 'approval-gate-swap',
        name: 'HumanApprovalGate: Approve Index Pointer Swap',
        actor: 'HumanApprovalGate',
        requiresApproval: true,
        approvalPattern: 'aef-index-rebuild',
        input: {
          runId: '__from_run__',
          stepId: 'approval-gate-swap',
          action: 'swap index pointer to new version',
          justification: `Index rebuild complete for tenant=${input.tenantId} profile=${input.profileId}. Pointer swap will cut traffic to the new index version.`,
          projectedImpact:
            'All retrieval requests will be served from the new index version after swap.',
          projectedRisk:
            'If the new index is corrupted, retrieval quality will degrade until rolled back.',
          pattern: 'aef-index-rebuild',
        },
      },
      {
        stepId: 'post-swap-verify',
        name: 'IndexVerifier: Post-Swap Verification',
        actor: 'IndexVerifier',
        input: {
          tenantId: input.tenantId,
          profileId: input.profileId,
          sampleSize: 20,
        },
      },
    ],
  };
}
