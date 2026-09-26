import { randomUUID } from 'node:crypto';
import { Router, type IRouter, type RequestHandler, type Request, type Response } from 'express';
import { MultimodalEmbedRequestSchema } from '@workspace/aef-contracts';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import { PolicyEngine } from '@workspace/aef-policy-guard';
import {
  MultimodalHttpEmbeddingClient,
  OVIS_OMNI_ARTIFACT_SET_DIGEST,
  OVIS_OMNI_MODEL_ID,
  OVIS_OMNI_REVISION,
} from '@workspace/alloy-embed-worker';
import { logger } from '../middleware/logger.js';
import { errorBudgetCounter } from '../middleware/prometheus.js';
import { getProfile } from '../profiles/default.js';

export const multimodalEmbedRouter: IRouter = Router();
const policyEngine = new PolicyEngine();
const OVIS_NATIVE_DIMENSIONS = 2048;

function buildClient(): MultimodalHttpEmbeddingClient | null {
  const baseUrl =
    process.env.SUBSTRATE_MULTIMODAL_EMBED_URL ?? process.env.OVIS_OMNI_URL;
  if (!baseUrl) return null;
  return new MultimodalHttpEmbeddingClient({
    baseUrl,
    embedPath: process.env.OVIS_EMBED_PATH ?? '/aef/ovis/embed',
    healthPath: process.env.OVIS_HEALTH_PATH ?? '/aef/ovis/health',
    expectedModelId: OVIS_OMNI_MODEL_ID,
    expectedModelRevision: OVIS_OMNI_REVISION,
    expectedArtifactSetDigest: OVIS_OMNI_ARTIFACT_SET_DIGEST,
    expectedDimensions: OVIS_NATIVE_DIMENSIONS,
    timeoutMs: Number(process.env.AEF_MULTIMODAL_TIMEOUT_MS ?? 300_000),
    maxResponseBytes: Number(
      process.env.AEF_MULTIMODAL_MAX_RESPONSE_BYTES ?? 64 * 1024 * 1024,
    ),
    ...(process.env.SUBSTRATE_MULTIMODAL_API_KEY
      ? { apiKey: process.env.SUBSTRATE_MULTIMODAL_API_KEY }
      : {}),
  });
}

multimodalEmbedRouter.get('/v1/multimodal/health', (async (_req: Request, res: Response) => {
  const client = buildClient();
  if (!client) {
    res.status(503).json({
      status: 'not_configured',
      modelId: OVIS_OMNI_MODEL_ID,
      modelRevision: OVIS_OMNI_REVISION,
      promotionState: 'EVALUATION_HOLD',
    });
    return;
  }
  const health = await client.health();
  res.status(health.healthy ? 200 : 503).json({
    status: health.healthy ? 'ok' : 'unavailable',
    modelId: OVIS_OMNI_MODEL_ID,
    modelRevision: OVIS_OMNI_REVISION,
    artifactSetDigest: OVIS_OMNI_ARTIFACT_SET_DIGEST,
    promotionState: 'EVALUATION_HOLD',
    ...health,
  });
}) as unknown as RequestHandler);

multimodalEmbedRouter.post('/v1/multimodal/embed', (async (req: Request, res: Response) => {
  const parseResult = MultimodalEmbedRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;
  const requestedAt = new Date().toISOString();

  if (body.modelId !== OVIS_OMNI_MODEL_ID || body.modelRevision !== OVIS_OMNI_REVISION) {
    res.status(409).json({
      error: 'Requested multimodal model identity is not admitted',
      code: 'MODEL_IDENTITY_NOT_ADMITTED',
      admittedModelId: OVIS_OMNI_MODEL_ID,
      admittedModelRevision: OVIS_OMNI_REVISION,
      traceId,
    });
    return;
  }
  if (body.dimensions !== OVIS_NATIVE_DIMENSIONS) {
    res.status(409).json({
      error: 'Requested projection has no admitted SZL projection artifact',
      code: 'PROJECTION_ASSET_NOT_ADMITTED',
      admittedDimensions: OVIS_NATIVE_DIMENSIONS,
      traceId,
    });
    return;
  }

  let profile;
  try {
    profile = getProfile(body.profileId ?? req.profileId ?? 'default');
  } catch (error) {
    res.status(400).json({ error: 'Profile not found', detail: String(error) });
    return;
  }

  const policyDecision = policyEngine.evaluate({
    requestId: body.requestId,
    tenantId: body.tenantId,
    profileId: profile.profileId,
    hasProvenance: true,
    metadata: body.metadata,
  });
  if (!policyDecision.allow) {
    errorBudgetCounter.inc({ kind: 'policy_denied', tenant_id: body.tenantId });
    res.status(403).json({
      error: 'Request blocked by policy',
      reasons: policyDecision.reasons,
      traceId,
    });
    return;
  }

  const client = buildClient();
  if (!client) {
    res.status(503).json({
      error: 'Multimodal embedding runtime is not configured',
      code: 'MULTIMODAL_RUNTIME_NOT_CONFIGURED',
      traceId,
    });
    return;
  }

  const start = Date.now();
  let result;
  try {
    result = await client.embed(body);
  } catch (error) {
    errorBudgetCounter.inc({ kind: 'embed_error', tenant_id: body.tenantId });
    logger.error(
      {
        traceId,
        requestId: body.requestId,
        error: String(error),
        modelRevision: OVIS_OMNI_REVISION,
      },
      'Multimodal embedding failed',
    );
    res.status(502).json({
      error: 'Multimodal embedding runtime unavailable',
      code: 'MULTIMODAL_EMBEDDING_FAILED',
      traceId,
    });
    return;
  }

  if (process.env.NODE_ENV === 'production' && result.execution.promotionState !== 'QUALIFIED') {
    logger.error(
      { traceId, promotionState: result.execution.promotionState },
      'Unqualified multimodal runtime attempted production response',
    );
    res.status(503).json({
      error: 'Multimodal model is not qualified for production',
      code: 'MODEL_NOT_QUALIFIED',
      traceId,
    });
    return;
  }

  const completedAt = new Date().toISOString();
  const evidenceEntries = result.vectors.map((vector, index) => {
    const entry = {
      entryId: randomUUID(),
      requestId: body.requestId,
      tenantId: body.tenantId,
      profileId: profile.profileId,
      profileVersion: profile.version,
      chunkId: `multimodal-embed-${body.requestId}-${vector.itemId}`,
      sourceId: 'multimodal-embed-request',
      boostApplied: false,
      finalScore: 1,
      policyAllow: true,
      policyReasons: policyDecision.reasons,
      redactedFields: policyDecision.redactions,
      backendId: result.execution.backendId,
      modelId: result.execution.modelId,
      modelRevision: result.execution.modelRevision,
      artifactSetDigest: result.execution.artifactSetDigest,
      processorRevision: result.execution.processorRevision,
      runtimeId: result.execution.runtimeId,
      runtimeVersion: result.execution.runtimeVersion,
      dimensions: result.execution.dimensions,
      normalized: result.execution.normalized,
      inputDigest: vector.inputDigest,
      promotionState: result.execution.promotionState,
      requestedAt,
      completedAt,
      scoreBreakdown: { itemIndex: index },
    };
    defaultLedgerStore.append(entry);
    return entry;
  });

  const processingMs = Date.now() - start;
  res.status(200).json({
    ...result,
    processingMs,
    traceId,
    evidenceIds: evidenceEntries.map((entry) => entry.entryId),
    policyReasons: policyDecision.reasons,
  });

  logger.info(
    {
      traceId,
      requestId: body.requestId,
      itemCount: body.items.length,
      processingMs,
      modelRevision: result.execution.modelRevision,
      artifactSetDigest: result.execution.artifactSetDigest,
      promotionState: result.execution.promotionState,
    },
    'multimodal embed completed',
  );
}) as unknown as RequestHandler);
