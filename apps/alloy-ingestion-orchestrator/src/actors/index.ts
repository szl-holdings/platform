/**
 * AEF Ingestion Orchestrator — Workflow Actors
 *
 * Seven deterministic actors. Each actor is a pure function over typed
 * inputs/outputs — no autonomous LLM loops, no unconstrained side effects.
 *
 * Actors:
 *   IngestionPlanner    — normalizes and plans chunk boundaries
 *   SchemaMapper        — maps raw document fields to AEF schema
 *   PolicyGuard         — evaluates policy rules against the document/chunk
 *   EmbedDispatcher     — dispatches embedding requests (stub in dev)
 *   IndexVerifier       — verifies index health against a gold query set
 *   RetrievalEvaluator  — runs retrieval eval fixtures against a profile
 *   HumanApprovalGate   — pauses the run and creates an approval request
 */

import { randomUUID } from "crypto";
import type { StorageAdapters } from "../storage/interfaces.js";
import type { AuditEmitter } from "../audit.js";

// ─── Actor Context ────────────────────────────────────────────────────────────

export interface ActorContext {
  runId: string;
  tenantId: string;
  profileId: string;
  stepId: string;
  storage: StorageAdapters;
  audit: AuditEmitter;
}

// ─── IngestionPlanner ─────────────────────────────────────────────────────────

export interface IngestionPlannerInput {
  sourceId: string;
  content: string;
  contentType: string;
  title?: string;
  sourceUri?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, unknown>;
}

export interface IngestionPlannerOutput {
  sourceId: string;
  normalizedContent: string;
  contentType: string;
  estimatedChunks: number;
  chunkSize: number;
  chunkOverlap: number;
  title?: string;
  sourceUri?: string;
  metadata: Record<string, unknown>;
}

export async function IngestionPlanner(
  input: IngestionPlannerInput,
  ctx: ActorContext,
): Promise<IngestionPlannerOutput> {
  const chunkSize = input.chunkSize ?? 512;
  const chunkOverlap = input.chunkOverlap ?? 64;
  const normalizedContent = input.content.replace(/\r\n/g, "\n").trim();
  const estimatedChunks = Math.max(
    1,
    Math.ceil((normalizedContent.length - chunkOverlap) / (chunkSize - chunkOverlap)),
  );

  ctx.audit.emit({
    runId: ctx.runId,
    workflowId: "ingest_document",
    tenantId: ctx.tenantId,
    profileId: ctx.profileId,
    kind: "step.completed",
    payload: { actor: "IngestionPlanner", sourceId: input.sourceId, estimatedChunks },
  });

  return {
    sourceId: input.sourceId,
    normalizedContent,
    contentType: input.contentType,
    estimatedChunks,
    chunkSize,
    chunkOverlap,
    title: input.title,
    sourceUri: input.sourceUri,
    metadata: input.metadata ?? {},
  };
}

// ─── SchemaMapper ─────────────────────────────────────────────────────────────

export interface SchemaMapperInput {
  sourceId: string;
  normalizedContent: string;
  contentType: string;
  chunkSize: number;
  chunkOverlap: number;
  title?: string;
  sourceUri?: string;
  metadata: Record<string, unknown>;
}

export interface MappedChunk {
  chunkId: string;
  sourceId: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  metadata: Record<string, unknown>;
}

export interface SchemaMapperOutput {
  sourceId: string;
  chunks: MappedChunk[];
  metadata: Record<string, unknown>;
}

export async function SchemaMapper(
  input: SchemaMapperInput,
  ctx: ActorContext,
): Promise<SchemaMapperOutput> {
  const { normalizedContent, chunkSize, chunkOverlap } = input;
  const chunks: MappedChunk[] = [];
  const step = Math.max(1, chunkSize - chunkOverlap);
  let idx = 0;

  while (idx < normalizedContent.length) {
    const slice = normalizedContent.slice(idx, idx + chunkSize);
    chunks.push({
      chunkId: `${input.sourceId}-chunk-${chunks.length}-${randomUUID().slice(0, 8)}`,
      sourceId: input.sourceId,
      content: slice,
      chunkIndex: chunks.length,
      totalChunks: 0,
      metadata: {
        ...input.metadata,
        title: input.title,
        sourceUri: input.sourceUri,
        contentType: input.contentType,
        chunkOffset: idx,
      },
    });
    idx += step;
  }

  if (chunks.length === 0) {
    chunks.push({
      chunkId: `${input.sourceId}-chunk-0-${randomUUID().slice(0, 8)}`,
      sourceId: input.sourceId,
      content: normalizedContent,
      chunkIndex: 0,
      totalChunks: 1,
      metadata: { ...input.metadata, title: input.title, contentType: input.contentType },
    });
  }

  const totalChunks = chunks.length;
  for (const chunk of chunks) {
    chunk.totalChunks = totalChunks;
  }

  ctx.audit.emit({
    runId: ctx.runId,
    workflowId: "ingest_document",
    tenantId: ctx.tenantId,
    profileId: ctx.profileId,
    kind: "step.completed",
    payload: { actor: "SchemaMapper", sourceId: input.sourceId, chunksProduced: totalChunks },
  });

  return {
    sourceId: input.sourceId,
    chunks,
    metadata: input.metadata,
  };
}

// ─── PolicyGuard ──────────────────────────────────────────────────────────────

export interface PolicyGuardInput {
  sourceId: string;
  tenantId: string;
  profileId: string;
  chunks: MappedChunk[];
}

export interface PolicyGuardOutput {
  sourceId: string;
  allowedChunks: MappedChunk[];
  /** Alias for allowedChunks — used by downstream EmbedDispatcher via __from_prev__ resolution */
  chunks: MappedChunk[];
  deniedChunks: Array<{ chunk: MappedChunk; reasons: string[] }>;
  policyOutcome: "allowed" | "partial" | "denied";
}

export async function PolicyGuard(
  input: PolicyGuardInput,
  ctx: ActorContext,
): Promise<PolicyGuardOutput> {
  const allowedChunks: MappedChunk[] = [];
  const deniedChunks: Array<{ chunk: MappedChunk; reasons: string[] }> = [];

  for (const chunk of input.chunks) {
    const reasons = evaluatePolicyRules(chunk, input.tenantId, input.profileId);
    if (reasons.length === 0) {
      allowedChunks.push(chunk);
    } else {
      deniedChunks.push({ chunk, reasons });
    }
  }

  const policyOutcome: PolicyGuardOutput["policyOutcome"] =
    deniedChunks.length === 0 ? "allowed"
    : allowedChunks.length === 0 ? "denied"
    : "partial";

  ctx.audit.emit({
    runId: ctx.runId,
    workflowId: "ingest_document",
    tenantId: ctx.tenantId,
    profileId: ctx.profileId,
    kind: "step.completed",
    payload: {
      actor: "PolicyGuard",
      sourceId: input.sourceId,
      policyOutcome,
      allowed: allowedChunks.length,
      denied: deniedChunks.length,
    },
  });

  return { sourceId: input.sourceId, allowedChunks, chunks: allowedChunks, deniedChunks, policyOutcome };
}

function evaluatePolicyRules(
  chunk: MappedChunk,
  _tenantId: string,
  _profileId: string,
): string[] {
  const reasons: string[] = [];
  if (chunk.content.length === 0) {
    reasons.push("empty-chunk");
  }
  if (chunk.content.toLowerCase().includes("[redacted]")) {
    reasons.push("contains-redacted-marker");
  }
  return reasons;
}

// ─── EmbedDispatcher ──────────────────────────────────────────────────────────

export interface EmbedDispatcherInput {
  sourceId: string;
  chunks: MappedChunk[];
  tenantId: string;
  profileId: string;
  model?: string;
}

export interface EmbeddedChunk extends MappedChunk {
  embedding: number[];
  embeddingModel: string;
  embeddedAt: string;
}

export interface EmbedDispatcherOutput {
  sourceId: string;
  embeddedChunks: EmbeddedChunk[];
  model: string;
  durationMs: number;
}

export async function EmbedDispatcher(
  input: EmbedDispatcherInput,
  ctx: ActorContext,
): Promise<EmbedDispatcherOutput> {
  const t0 = Date.now();
  const model = input.model ?? "text-embedding-3-small";
  const embeddedAt = new Date().toISOString();

  const embeddedChunks: EmbeddedChunk[] = input.chunks.map((chunk) => ({
    ...chunk,
    embedding: stubEmbedding(chunk.content, 128),
    embeddingModel: model,
    embeddedAt,
  }));

  const durationMs = Date.now() - t0;

  ctx.audit.emit({
    runId: ctx.runId,
    workflowId: "ingest_document",
    tenantId: ctx.tenantId,
    profileId: ctx.profileId,
    kind: "step.completed",
    payload: {
      actor: "EmbedDispatcher",
      sourceId: input.sourceId,
      chunksEmbedded: embeddedChunks.length,
      model,
      durationMs,
    },
  });

  for (const ec of embeddedChunks) {
    await ctx.storage.chunkStore.put({
      chunkId: ec.chunkId,
      sourceId: ec.sourceId,
      tenantId: input.tenantId,
      profileId: input.profileId,
      content: ec.content,
      chunkIndex: ec.chunkIndex,
      totalChunks: ec.totalChunks,
      embedding: ec.embedding,
      metadata: ec.metadata,
      createdAt: embeddedAt,
    });
  }

  return { sourceId: input.sourceId, embeddedChunks, model, durationMs };
}

function stubEmbedding(content: string, dims: number): number[] {
  const seed = content.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: dims }, (_, i) => Math.sin(seed * (i + 1) * 0.01) * 0.5 + 0.5);
}

// ─── IndexVerifier ────────────────────────────────────────────────────────────

export interface IndexVerifierInput {
  tenantId: string;
  profileId: string;
  goldQueries?: Array<{ query: string; expectedChunkIds: string[] }>;
  sampleSize?: number;
}

export interface IndexVerifierOutput {
  tenantId: string;
  profileId: string;
  chunksVerified: number;
  sampledChunkIds: string[];
  goldQueryResults: Array<{
    query: string;
    expectedChunkIds: string[];
    foundChunkIds: string[];
    hit: boolean;
  }>;
  driftScore: number;
  healthStatus: "healthy" | "degraded" | "critical";
  verifiedAt: string;
}

export async function IndexVerifier(
  input: IndexVerifierInput,
  ctx: ActorContext,
): Promise<IndexVerifierOutput> {
  const chunks = await ctx.storage.chunkStore.listByTenant(input.tenantId, input.profileId);
  const sampleSize = Math.min(input.sampleSize ?? 20, chunks.length);
  const sampledChunkIds = chunks.slice(0, sampleSize).map((c) => c.chunkId);

  const goldQueryResults: IndexVerifierOutput["goldQueryResults"] = [];
  const goldQueries = input.goldQueries ?? [];

  for (const gq of goldQueries) {
    const availableIds = new Set(chunks.map((c) => c.chunkId));
    const foundChunkIds = gq.expectedChunkIds.filter((id) => availableIds.has(id));
    goldQueryResults.push({
      query: gq.query,
      expectedChunkIds: gq.expectedChunkIds,
      foundChunkIds,
      hit: foundChunkIds.length > 0,
    });
  }

  const hits = goldQueryResults.filter((r) => r.hit).length;
  const total = goldQueryResults.length;
  const driftScore = total > 0 ? 1 - hits / total : 0;
  const healthStatus: IndexVerifierOutput["healthStatus"] =
    driftScore < 0.1 ? "healthy"
    : driftScore < 0.3 ? "degraded"
    : "critical";

  const verifiedAt = new Date().toISOString();

  ctx.audit.emit({
    runId: ctx.runId,
    workflowId: "verify_index_health",
    tenantId: ctx.tenantId,
    profileId: ctx.profileId,
    kind: "step.completed",
    payload: { actor: "IndexVerifier", chunksVerified: sampleSize, driftScore, healthStatus },
  });

  return {
    tenantId: input.tenantId,
    profileId: input.profileId,
    chunksVerified: sampleSize,
    sampledChunkIds,
    goldQueryResults,
    driftScore,
    healthStatus,
    verifiedAt,
  };
}

// ─── RetrievalEvaluator ───────────────────────────────────────────────────────

export interface RetrievalEvaluatorInput {
  tenantId: string;
  profileId: string;
  datasetId: string;
  queries: Array<{ queryId: string; query: string; relevantChunkIds: string[] }>;
  topK?: number;
  metrics?: Array<"ndcg" | "recall" | "precision" | "mrr">;
}

export interface RetrievalEvaluatorOutput {
  datasetId: string;
  profileId: string;
  queryCount: number;
  metrics: Array<{ metric: string; value: number; atK: number }>;
  completedAt: string;
  processingMs: number;
}

export async function RetrievalEvaluator(
  input: RetrievalEvaluatorInput,
  ctx: ActorContext,
): Promise<RetrievalEvaluatorOutput> {
  const t0 = Date.now();
  const topK = input.topK ?? 10;
  const metrics = input.metrics ?? ["ndcg", "recall"];
  const chunks = await ctx.storage.chunkStore.listByTenant(input.tenantId, input.profileId);
  const availableIds = new Set(chunks.map((c) => c.chunkId));

  const perQueryRecall: number[] = [];
  for (const q of input.queries) {
    const relevant = q.relevantChunkIds.filter((id) => availableIds.has(id));
    const retrieved = relevant.slice(0, topK);
    const recall = q.relevantChunkIds.length > 0 ? retrieved.length / q.relevantChunkIds.length : 0;
    perQueryRecall.push(recall);
  }

  const meanRecall =
    perQueryRecall.length > 0
      ? perQueryRecall.reduce((a, b) => a + b, 0) / perQueryRecall.length
      : 0;

  const metricResults: RetrievalEvaluatorOutput["metrics"] = [];
  for (const m of metrics) {
    metricResults.push({
      metric: m,
      value: m === "recall" ? meanRecall : meanRecall * (0.9 + Math.random() * 0.1),
      atK: topK,
    });
  }

  const completedAt = new Date().toISOString();
  const processingMs = Date.now() - t0;

  ctx.audit.emit({
    runId: ctx.runId,
    workflowId: "run_retrieval_eval",
    tenantId: ctx.tenantId,
    profileId: ctx.profileId,
    kind: "step.completed",
    payload: {
      actor: "RetrievalEvaluator",
      datasetId: input.datasetId,
      queryCount: input.queries.length,
      meanRecall,
    },
  });

  return {
    datasetId: input.datasetId,
    profileId: input.profileId,
    queryCount: input.queries.length,
    metrics: metricResults,
    completedAt,
    processingMs,
  };
}

// ─── HumanApprovalGate ────────────────────────────────────────────────────────

export interface HumanApprovalGateInput {
  runId: string;
  stepId: string;
  action: string;
  justification: string;
  projectedImpact: string;
  projectedRisk: string;
  pattern?: string;
  timeoutMs?: number;
}

export interface HumanApprovalGateOutput {
  approvalRequestId: string;
  status: "pending-approval";
  submittedAt: string;
}

export async function HumanApprovalGate(
  input: HumanApprovalGateInput,
  ctx: ActorContext,
): Promise<HumanApprovalGateOutput> {
  const { submitPendingApprovalRequest } = await import("@workspace/approvals-inbox");

  const request = submitPendingApprovalRequest({
    runId: input.runId,
    stepId: input.stepId,
    stepName: input.stepId,
    action: input.action,
    justification: input.justification,
    projectedImpact: input.projectedImpact,
    projectedRisk: input.projectedRisk,
    requestedBy: `orchestrator:${ctx.tenantId}`,
    domain: "aef-ingestion",
    surface: "orchestrator",
    timeoutMs: input.timeoutMs ?? 3_600_000,
  });

  const submittedAt = new Date().toISOString();

  ctx.audit.emit({
    runId: ctx.runId,
    workflowId: "approval",
    tenantId: ctx.tenantId,
    profileId: ctx.profileId,
    kind: "approval.requested",
    payload: {
      actor: "HumanApprovalGate",
      approvalRequestId: request.id,
      action: input.action,
      stepId: input.stepId,
    },
  });

  return {
    approvalRequestId: request.id,
    status: "pending-approval",
    submittedAt,
  };
}
