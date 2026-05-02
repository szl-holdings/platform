/**
 * SZL Holdings — Ingestion Sync Activities
 * Phase 10 (Operability & Governance)
 *
 * Activities that perform external I/O for the ingestion sync workflow.
 * All fetch() and process.env access is scoped to activities (never workflows).
 *
 * Worker registration: register alongside approval-activities in the Temporal worker.
 */

export interface FetchIngestBatchInput {
  connectorId: string;
  sourceType: string;
  targetDomain: string;
  batchSize: number;
  continuationToken: string | null;
  tenantId: string;
}

export interface FetchIngestBatchResult {
  recordsIngested: number;
  recordsFailed: number;
  continuationToken: string | null;
  hasMore: boolean;
}

/**
 * fetchIngestBatchActivity
 *
 * Calls the api-server ingestion endpoint to fetch, validate, and ingest
 * a single batch of records from a connector source.
 *
 * External I/O: HTTP POST to API_SERVER_URL (ingestion batch endpoint).
 * Must NOT be called from workflow code directly — proxy via proxyActivities.
 *
 * Heartbeating: For large batches, the api-server side should stream progress.
 * The Temporal heartbeatTimeout is configured at 5m in the workflow proxy.
 */
export async function fetchIngestBatchActivity(
  input: FetchIngestBatchInput
): Promise<FetchIngestBatchResult> {
  const apiUrl = process.env.API_SERVER_URL ?? "http://localhost:5000";
  const token = process.env.INTERNAL_SERVICE_TOKEN ?? "";

  const response = await fetch(`${apiUrl}/api/internal/ingestion/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": token,
    },
    body: JSON.stringify({
      connectorId: input.connectorId,
      sourceType: input.sourceType,
      targetDomain: input.targetDomain,
      batchSize: input.batchSize,
      continuationToken: input.continuationToken,
      tenantId: input.tenantId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Batch fetch failed: HTTP ${response.status} for connector ${input.connectorId}`);
  }

  return (await response.json()) as FetchIngestBatchResult;
}
