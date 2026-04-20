/**
 * AEF Ingestion Orchestrator — rotate_profile_version workflow
 *
 * Pipeline:
 *   register new profile version → shadow-run → promote (approval-gated)
 *
 * Steps:
 *   1. IngestionPlanner   — register new profile version (validate schema)
 *   2. RetrievalEvaluator — shadow-run: evaluate new version against current
 *   3. HumanApprovalGate  — approval-gated promotion
 *   4. IndexVerifier      — verify promoted version is healthy
 */

import type { WorkflowDefinition } from "../types.js";

export interface RotateProfileVersionInput {
  tenantId: string;
  currentProfileId: string;
  newProfileId: string;
  newProfileVersion: string;
  shadowDatasetId?: string;
  shadowQueries?: Array<{ queryId: string; query: string; relevantChunkIds: string[] }>;
}

export function buildRotateProfileVersionWorkflow(input: RotateProfileVersionInput): WorkflowDefinition {
  return {
    workflowId: "rotate_profile_version",
    name: "Rotate Profile Version",
    description: "Register new profile version → shadow-run → promote (approval-gated)",
    retryPolicy: { maxAttempts: 2, backoffMs: 150 },
    steps: [
      {
        stepId: "register-new-version",
        name: "IngestionPlanner: Register & Validate New Profile Version",
        actor: "IngestionPlanner",
        input: {
          sourceId: `profile-version-${input.newProfileId}-${input.newProfileVersion}`,
          content: JSON.stringify({
            action: "register-profile-version",
            newProfileId: input.newProfileId,
            newProfileVersion: input.newProfileVersion,
            tenantId: input.tenantId,
          }),
          contentType: "text/plain",
          metadata: {
            action: "register-profile-version",
            newProfileId: input.newProfileId,
            newProfileVersion: input.newProfileVersion,
          },
        },
      },
      {
        stepId: "shadow-eval",
        name: "RetrievalEvaluator: Shadow-Run New Profile",
        actor: "RetrievalEvaluator",
        input: {
          tenantId: input.tenantId,
          profileId: input.newProfileId,
          datasetId: input.shadowDatasetId ?? `shadow-${input.newProfileId}`,
          queries: input.shadowQueries ?? [
            {
              queryId: "shadow-q1",
              query: "sample query for shadow evaluation",
              relevantChunkIds: [],
            },
          ],
          topK: 10,
          metrics: ["recall", "ndcg"],
        },
      },
      {
        stepId: "approval-gate-promote",
        name: "HumanApprovalGate: Approve Profile Promotion",
        actor: "HumanApprovalGate",
        requiresApproval: true,
        approvalPattern: "aef-profile-rotation",
        input: {
          runId: "__from_run__",
          stepId: "approval-gate-promote",
          action: `promote profile version ${input.newProfileVersion} to active`,
          justification: `Shadow evaluation completed for profile ${input.newProfileId} v${input.newProfileVersion}. Promotion will redirect all new retrieval requests to the new profile version.`,
          projectedImpact: "All retrieval for this tenant will use the new profile after promotion.",
          projectedRisk: "If the new profile version has degraded retrieval quality, results will worsen until rollback.",
          pattern: "aef-profile-rotation",
        },
      },
      {
        stepId: "post-promote-verify",
        name: "IndexVerifier: Verify Promoted Profile",
        actor: "IndexVerifier",
        input: {
          tenantId: input.tenantId,
          profileId: input.newProfileId,
          sampleSize: 10,
        },
      },
    ],
  };
}
