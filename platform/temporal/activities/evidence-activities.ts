/**
 * SZL Holdings — Evidence Collection Activities
 * Phase 10 (Operability & Governance)
 *
 * Activities that perform the external I/O for evidence collection workflows.
 * All fetch() and process.env access is scoped to activities (never workflows).
 *
 * Worker registration: register alongside approval-activities in the Temporal worker.
 */

import type { EvidenceItem, EvidenceType } from "../types/workflow-types.js";

export interface CollectEvidenceItemInput {
  evidenceType: EvidenceType;
  service: string;
  environment: string;
  fromTimestamp: string;
  toTimestamp: string;
  workflowId: string;
}

/**
 * collectEvidenceItemActivity
 *
 * Calls the api-server evidence collection endpoint to gather a single
 * evidence item (logs, traces, metrics, policy-eval records, etc.).
 *
 * External I/O: HTTP POST to API_SERVER_URL (evidence ledger endpoint).
 * Must NOT be called from workflow code directly — proxy via proxyActivities.
 */
export async function collectEvidenceItemActivity(
  input: CollectEvidenceItemInput
): Promise<EvidenceItem> {
  const apiUrl = process.env.API_SERVER_URL ?? "http://localhost:5000";
  const token = process.env.INTERNAL_SERVICE_TOKEN ?? "";

  const response = await fetch(`${apiUrl}/api/internal/evidence/collect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": token,
    },
    body: JSON.stringify({
      evidenceType: input.evidenceType,
      service: input.service,
      environment: input.environment,
      fromTimestamp: input.fromTimestamp,
      toTimestamp: input.toTimestamp,
      workflowId: input.workflowId,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Evidence collection failed for ${input.evidenceType}:${input.service}: HTTP ${response.status}`
    );
  }

  const body = (await response.json()) as {
    itemCount: number;
    storageRef: string;
    checksum: string;
  };

  return {
    evidenceType: input.evidenceType,
    service: input.service,
    collectedAt: new Date().toISOString(),
    itemCount: body.itemCount,
    storageRef: body.storageRef,
    checksum: body.checksum,
  };
}
