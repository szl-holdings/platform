/**
 * Ingestion sync workflow — durable long-running data sync for Alloy ingestion,
 * data connectors, and domain feeds.
 *
 * Uses continue-as-new to prevent history bloat; activities heartbeat for progress.
 */

import {
  proxyActivities,
  continueAsNew,
  workflowInfo,
  sleep,
} from "@temporalio/workflow";
import type * as approvalActivities from "../activities/approval-activities.js";
import type * as ingestionActivities from "../activities/ingestion-activities.js";
import type {
  IngestionSyncWorkflowInput,
  IngestionSyncWorkflowResult,
} from "../types/workflow-types.js";

const {
  recordEvidenceActivity,
  emitLyteVisibilityActivity,
} = proxyActivities<typeof approvalActivities>({
  startToCloseTimeout: "30m",
  heartbeatTimeout: "5m",
  retry: {
    maximumAttempts: 5,
    initialInterval: "10s",
    backoffCoefficient: 2,
    maximumInterval: "5m",
  },
});

const {
  fetchIngestBatchActivity,
} = proxyActivities<typeof ingestionActivities>({
  startToCloseTimeout: "30m",
  heartbeatTimeout: "5m",
  retry: {
    maximumAttempts: 5,
    initialInterval: "10s",
    backoffCoefficient: 2,
    maximumInterval: "5m",
  },
});

// Maximum history events before continue-as-new prevents Temporal history OOM
const MAX_ITERATIONS_BEFORE_CONTINUE = 100;

export async function ingestionSyncWorkflow(
  input: IngestionSyncWorkflowInput
): Promise<IngestionSyncWorkflowResult> {
  const { workflowId, runId } = workflowInfo();
  let totalIngested = 0;
  let totalFailed = 0;
  let iterationCount = 0;
  let currentToken = input.continuationToken;

  while (true) {
    iterationCount++;

    // Fetch, validate, and ingest a batch via activity (no fetch() in workflow body)
    let batchResult: { recordsIngested: number; recordsFailed: number; continuationToken: string | null; hasMore: boolean };

    try {
      batchResult = await fetchIngestBatchActivity({
        connectorId: input.connectorId,
        sourceType: input.sourceType,
        targetDomain: input.targetDomain,
        batchSize: input.batchSize,
        continuationToken: currentToken,
        tenantId: input.tenantId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Record failure and stop this run; Temporal will retry via workflow retry policy
      await recordEvidenceActivity({
        category: "proof-chain",
        actorId: "temporal-ingestion-workflow",
        actorType: "temporal-workflow",
        action: "ingestion-batch-failed",
        outcome: "failure",
        service: input.connectorId,
        environment: "production",
        details: { workflowId, error: message, continuationToken: currentToken },
      });
      throw err;
    }

    totalIngested += batchResult.recordsIngested;
    totalFailed += batchResult.recordsFailed;
    currentToken = batchResult.continuationToken;

    // Emit progress to Lyte via activity
    await emitLyteVisibilityActivity({
      event: {
        eventType: "ingestion-sync-workflow.batch-complete",
        workflowType: "ingestion-sync-workflow",
        workflowId, runId,
        timestamp: new Date().toISOString(),
        payload: {
          connectorId: input.connectorId,
          iterationCount,
          totalIngested,
          totalFailed,
          hasMore: batchResult.hasMore,
        },
      },
    });

    // Stop if no more records or per-run record cap reached
    const maxReached = totalIngested + totalFailed >= input.maxRecordsPerRun;
    if (!batchResult.hasMore || maxReached) {
      const evidenceResult = await recordEvidenceActivity({
        category: "proof-chain",
        actorId: "temporal-ingestion-workflow",
        actorType: "temporal-workflow",
        action: "ingestion-sync-completed",
        outcome: "success",
        service: input.connectorId,
        environment: "production",
        details: { workflowId, totalIngested, totalFailed, hasMore: batchResult.hasMore },
      });

      return {
        connectorId: input.connectorId,
        recordsIngested: totalIngested,
        recordsFailed: totalFailed,
        continuationToken: batchResult.continuationToken,
        hasMore: batchResult.hasMore,
        completedAt: new Date().toISOString(),
        nextScheduledAt: batchResult.hasMore ? new Date(Date.now() + 60_000).toISOString() : null,
      };
    }

    // Continue-as-new to prevent Temporal history bloat on long-running syncs
    if (iterationCount >= MAX_ITERATIONS_BEFORE_CONTINUE) {
      await continueAsNew<typeof ingestionSyncWorkflow>({
        ...input,
        continuationToken: currentToken,
      });
    }

    // Rate-limit between batches (deterministic sleep — not setTimeout)
    await sleep("1s");
  }
}
