/**
 * AEF Ingestion Orchestrator — ingest_document workflow
 *
 * Pipeline:
 *   normalize → chunk (per profile) → policy check → embed dispatch → index write → ledger entry
 *
 * Steps:
 *   1. IngestionPlanner — normalize and plan chunk boundaries
 *   2. SchemaMapper     — map to AEF schema and produce chunks
 *   3. PolicyGuard      — evaluate policy against chunks
 *   4. EmbedDispatcher  — embed and write to chunk store
 *   5. IndexVerifier    — verify a sample of the written chunks
 */

import type { WorkflowDefinition } from "../types.js";
import type { IngestionPlannerInput } from "../actors/index.js";

export interface IngestDocumentInput {
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

export function buildIngestDocumentWorkflow(input: IngestDocumentInput, tenantId: string, profileId: string): WorkflowDefinition {
  const plannerInput: IngestionPlannerInput = {
    sourceId: input.sourceId,
    content: input.content,
    contentType: input.contentType ?? "text/plain",
    title: input.title,
    sourceUri: input.sourceUri,
    chunkSize: input.chunkSize ?? 512,
    chunkOverlap: input.chunkOverlap ?? 64,
    metadata: input.metadata ?? {},
  };

  return {
    workflowId: "ingest_document",
    name: "Ingest Document",
    description: "Normalize → chunk (per profile) → policy check → embed dispatch → index write → ledger entry",
    retryPolicy: { maxAttempts: 3, backoffMs: 100 },
    steps: [
      {
        stepId: "ingest-plan",
        name: "IngestionPlanner: Normalize & Plan",
        actor: "IngestionPlanner",
        input: plannerInput,
      },
      {
        stepId: "schema-map",
        name: "SchemaMapper: Chunk & Map",
        actor: "SchemaMapper",
        input: {
          sourceId: input.sourceId,
          normalizedContent: "__from_prev__",
          contentType: input.contentType ?? "text/plain",
          chunkSize: input.chunkSize ?? 512,
          chunkOverlap: input.chunkOverlap ?? 64,
          title: input.title,
          sourceUri: input.sourceUri,
          metadata: input.metadata ?? {},
        },
      },
      {
        stepId: "policy-check",
        name: "PolicyGuard: Policy Check",
        actor: "PolicyGuard",
        input: {
          sourceId: input.sourceId,
          tenantId,
          profileId,
          chunks: "__from_prev__",
        },
      },
      {
        stepId: "embed-dispatch",
        name: "EmbedDispatcher: Embed & Write",
        actor: "EmbedDispatcher",
        input: {
          sourceId: input.sourceId,
          chunks: "__from_prev__",
          tenantId,
          profileId,
          model: input.model,
        },
      },
      {
        stepId: "index-verify",
        name: "IndexVerifier: Verify Written Chunks",
        actor: "IndexVerifier",
        input: {
          tenantId,
          profileId,
          sampleSize: 5,
        },
      },
    ],
  };
}
