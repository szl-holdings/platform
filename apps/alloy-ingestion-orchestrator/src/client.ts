/**
 * AEF Ingestion Orchestrator — In-Process Client
 *
 * Provides a typed in-process interface to the orchestrator for use by
 * the API gateway. Avoids HTTP round-trips for gateway-to-orchestrator calls.
 */

import { defaultEngine } from "./engine.js";
import { defaultRunStore } from "./run-store.js";
import { defaultAuditEmitter } from "./audit.js";
import { buildIngestDocumentWorkflow } from "./workflows/ingest-document.js";
import { buildRebuildIndexWorkflow } from "./workflows/rebuild-index.js";
import { buildVerifyIndexHealthWorkflow } from "./workflows/verify-index-health.js";
import { buildRunRetrievalEvalWorkflow } from "./workflows/run-retrieval-eval.js";
import { buildRotateProfileVersionWorkflow } from "./workflows/rotate-profile-version.js";
import type { WorkflowRun } from "./types.js";

// ─── Ingest Document ──────────────────────────────────────────────────────────

export interface IngestDocumentParams {
  tenantId: string;
  profileId?: string;
  sourceId: string;
  content: string;
  contentType?: string;
  title?: string;
  sourceUri?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  model?: string;
  metadata?: Record<string, unknown>;
}

export async function submitIngestDocument(params: IngestDocumentParams): Promise<WorkflowRun> {
  const profileId = params.profileId ?? "default";
  const definition = buildIngestDocumentWorkflow(
    {
      sourceId: params.sourceId,
      content: params.content,
      contentType: params.contentType ?? "text/plain",
      title: params.title,
      sourceUri: params.sourceUri,
      chunkSize: params.chunkSize,
      chunkOverlap: params.chunkOverlap,
      model: params.model,
      metadata: params.metadata,
    },
    params.tenantId,
    profileId,
  );
  return defaultEngine.start(definition, {
    tenantId: params.tenantId,
    profileId,
    input: params,
  });
}

// ─── Rebuild Index ────────────────────────────────────────────────────────────

export interface RebuildIndexParams {
  tenantId: string;
  profileId?: string;
  fullRebuild?: boolean;
  sourceIds?: string[];
}

export async function submitRebuildIndex(params: RebuildIndexParams): Promise<WorkflowRun> {
  const profileId = params.profileId ?? "default";
  const definition = buildRebuildIndexWorkflow({
    tenantId: params.tenantId,
    profileId,
    fullRebuild: params.fullRebuild,
    sourceIds: params.sourceIds,
  });
  return defaultEngine.start(definition, {
    tenantId: params.tenantId,
    profileId,
    input: params,
  });
}

// ─── Verify Index Health ──────────────────────────────────────────────────────

export interface VerifyIndexHealthParams {
  tenantId: string;
  profileId?: string;
  goldQueries?: Array<{ query: string; expectedChunkIds: string[] }>;
  sampleSize?: number;
}

export async function submitVerifyIndexHealth(params: VerifyIndexHealthParams): Promise<WorkflowRun> {
  const profileId = params.profileId ?? "default";
  const definition = buildVerifyIndexHealthWorkflow({
    tenantId: params.tenantId,
    profileId,
    goldQueries: params.goldQueries,
    sampleSize: params.sampleSize,
  });
  return defaultEngine.start(definition, {
    tenantId: params.tenantId,
    profileId,
    input: params,
  });
}

// ─── Run Retrieval Eval ───────────────────────────────────────────────────────

export interface RunRetrievalEvalParams {
  tenantId: string;
  profileId?: string;
  datasetId: string;
  queries: Array<{ queryId: string; query: string; relevantChunkIds: string[] }>;
  topK?: number;
  metrics?: Array<"ndcg" | "recall" | "precision" | "mrr">;
}

export async function submitRetrievalEval(params: RunRetrievalEvalParams): Promise<WorkflowRun> {
  const profileId = params.profileId ?? "default";
  const definition = buildRunRetrievalEvalWorkflow({
    tenantId: params.tenantId,
    profileId,
    datasetId: params.datasetId,
    queries: params.queries,
    topK: params.topK,
    metrics: params.metrics,
  });
  return defaultEngine.start(definition, {
    tenantId: params.tenantId,
    profileId,
    input: params,
  });
}

// ─── Get Run Status ───────────────────────────────────────────────────────────

export function getRun(runId: string): WorkflowRun | undefined {
  return defaultRunStore.get(runId);
}

// ─── Get Audit Events ─────────────────────────────────────────────────────────

export function getAuditEvents(runId: string) {
  return defaultAuditEmitter.list(runId);
}
