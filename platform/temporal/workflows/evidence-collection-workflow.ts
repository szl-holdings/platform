/**
 * Evidence collection workflow — packages logs, traces, metrics, proof-chain
 * entries, deployment history, approval records, and policy evaluations for
 * incidents, audit events, and compliance reporting.
 */

import { proxyActivities, workflowInfo } from "@temporalio/workflow";
import type * as approvalActivities from "../activities/approval-activities.js";
import type * as evidenceActivities from "../activities/evidence-activities.js";
import type {
  EvidenceCollectionWorkflowInput,
  EvidenceCollectionWorkflowResult,
  EvidenceItem,
} from "../types/workflow-types.js";

const {
  recordEvidenceActivity,
  emitLyteVisibilityActivity,
} = proxyActivities<typeof approvalActivities>({
  startToCloseTimeout: "10m",
  retry: {
    maximumAttempts: 3,
    initialInterval: "10s",
    backoffCoefficient: 2,
    maximumInterval: "2m",
  },
});

const {
  collectEvidenceItemActivity,
} = proxyActivities<typeof evidenceActivities>({
  startToCloseTimeout: "10m",
  retry: {
    maximumAttempts: 3,
    initialInterval: "10s",
    backoffCoefficient: 2,
    maximumInterval: "2m",
  },
});

export async function evidenceCollectionWorkflow(
  input: EvidenceCollectionWorkflowInput
): Promise<EvidenceCollectionWorkflowResult> {
  const { workflowId, runId } = workflowInfo();
  const collectedItems: EvidenceItem[] = [];
  const failedCollections: string[] = [];

  // Step 1: Record initiation via activity (no direct I/O in workflow body)
  const initEvidence = await recordEvidenceActivity({
    category: "proof-chain",
    actorId: input.requestedBy,
    actorType: "user",
    action: "evidence-collection-started",
    outcome: "pending",
    service: input.collectionScope.services.join(","),
    environment: input.collectionScope.environment,
    details: {
      workflowId, runId,
      incidentId: input.incidentId,
      evidenceTypes: input.evidenceTypes,
      scope: input.collectionScope,
    },
  });

  // Step 2: Emit Lyte visibility via activity
  await emitLyteVisibilityActivity({
    event: {
      eventType: "evidence-collection-workflow.started",
      workflowType: "evidence-collection-workflow",
      workflowId, runId,
      timestamp: new Date().toISOString(),
      payload: {
        incidentId: input.incidentId,
        evidenceTypes: input.evidenceTypes,
        services: input.collectionScope.services,
      },
    },
  });

  // Step 3: Collect each evidence type via activity (fetch is inside the activity, not here)
  for (const evidenceType of input.evidenceTypes) {
    for (const service of input.collectionScope.services) {
      try {
        const item = await collectEvidenceItemActivity({
          evidenceType,
          service,
          environment: input.collectionScope.environment,
          fromTimestamp: input.collectionScope.fromTimestamp,
          toTimestamp: input.collectionScope.toTimestamp,
          workflowId,
        });
        collectedItems.push(item);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        failedCollections.push(`${evidenceType}:${service}: ${message}`);
      }
    }
  }

  // Step 4: Record completion via activity
  const evidenceLedgerId = initEvidence.evidenceId;

  const outcomeEvidence = await recordEvidenceActivity({
    category: "proof-chain",
    actorId: "temporal-evidence-workflow",
    actorType: "temporal-workflow",
    action: "evidence-collection-completed",
    outcome: failedCollections.length === 0 ? "success" : "failure",
    service: input.collectionScope.services.join(","),
    environment: input.collectionScope.environment,
    details: {
      workflowId,
      incidentId: input.incidentId,
      totalItems: collectedItems.length,
      failedCount: failedCollections.length,
      failedCollections,
    },
  });

  // Step 5: Emit final Lyte visibility via activity
  await emitLyteVisibilityActivity({
    event: {
      eventType: "evidence-collection-workflow.completed",
      workflowType: "evidence-collection-workflow",
      workflowId, runId,
      timestamp: new Date().toISOString(),
      payload: {
        incidentId: input.incidentId,
        evidenceLedgerId,
        totalItems: collectedItems.length,
        failedCollections,
      },
    },
  });

  return {
    evidenceLedgerId: outcomeEvidence.evidenceId,
    collectedAt: new Date().toISOString(),
    evidenceItems: collectedItems,
    totalItems: collectedItems.length,
    failedCollections,
  };
}
