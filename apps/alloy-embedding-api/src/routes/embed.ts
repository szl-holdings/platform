import { randomUUID } from 'node:crypto';
import { Router, type IRouter, type RequestHandler, type Request, type Response } from 'express';
import { EmbedRequestSchema } from '@workspace/aef-contracts';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import { PolicyEngine } from '@workspace/aef-policy-guard';
import { embedTextsWithReceipt } from '@workspace/alloy-embed-worker';
import { logger } from '../middleware/logger.js';
import { errorBudgetCounter } from '../middleware/prometheus.js';
import { getProfile } from '../profiles/default.js';
import { EmbedderConfigurationError, getEmbedderSelection } from '../retrieval-store.js';

export const embedRouter: IRouter = Router();
const policyEngine = new PolicyEngine();

embedRouter.post('/v1/embed', (async (req: Request, res: Response) => {
  const parseResult = EmbedRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const tenantId = body.tenantId;
  const traceId = req.traceId;
  const requestedAt = new Date().toISOString();

  let profile;
  try {
    profile = getProfile(body.profileId ?? req.profileId ?? 'default');
  } catch (error) {
    res.status(400).json({ error: 'Profile not found', detail: String(error) });
    return;
  }

  const policyDecision = policyEngine.evaluate({
    requestId: body.requestId,
    tenantId,
    profileId: profile.profileId,
    hasProvenance: false,
    metadata: body.metadata,
  });
  if (!policyDecision.allow) {
    errorBudgetCounter.inc({ kind: 'policy_denied', tenant_id: tenantId });
    res.status(403).json({
      error: 'Request blocked by policy',
      reasons: policyDecision.reasons,
      traceId,
    });
    return;
  }

  let embedder;
  try {
    embedder = getEmbedderSelection();
  } catch (error) {
    if (error instanceof EmbedderConfigurationError) {
      res.status(503).json({ error: 'Embedding backend is not configured', code: error.code, traceId });
      return;
    }
    throw error;
  }

  if (body.model && body.model !== embedder.model) {
    res.status(409).json({
      error: 'Requested model is not the admitted model',
      code: 'MODEL_ID_NOT_ADMITTED',
      admittedModel: embedder.model,
      traceId,
    });
    return;
  }
  if (body.modelRevision && body.modelRevision !== embedder.modelRevision) {
    res.status(409).json({
      error: 'Requested model revision is not admitted',
      code: 'MODEL_REVISION_NOT_ADMITTED',
      admittedRevision: embedder.modelRevision,
      traceId,
    });
    return;
  }

  const embedStart = Date.now();
  let result;
  try {
    result = await embedTextsWithReceipt(body.texts, {
      backendId: embedder.backendId,
      model: embedder.model,
      pooling: 'mean',
      normalize: body.normalize,
    });
  } catch (error) {
    errorBudgetCounter.inc({ kind: 'embed_error', tenant_id: tenantId });
    logger.error(
      { traceId, error: String(error), tenantId, backendId: embedder.backendId },
      'Embed request failed',
    );
    res.status(502).json({
      error: 'Embedding backend unavailable',
      code: 'EMBEDDING_BACKEND_UNAVAILABLE',
      traceId,
    });
    return;
  }

  const processingMs = Date.now() - embedStart;
  const completedAt = new Date().toISOString();
  const dimensions = result.vectors[0]?.length ?? result.dimensions;
  const execution =
    result.execution ??
    ({
      backendId: embedder.backendId,
      modelId: result.model,
      ...(embedder.modelRevision ? { modelRevision: embedder.modelRevision } : {}),
      ...(embedder.artifactSetDigest ? { artifactSetDigest: embedder.artifactSetDigest } : {}),
      dimensions,
      normalized: body.normalize,
      promotionState: embedder.promotionState,
      supportedModalities: ['text'],
    } as const);

  const evidenceEntries = body.texts.map((_text, index) => {
    const entry = {
      entryId: randomUUID(),
      requestId: body.requestId,
      tenantId,
      profileId: profile.profileId,
      profileVersion: profile.version,
      chunkId: `embed-${body.requestId}-${index}`,
      sourceId: 'embed-request',
      boostApplied: false,
      finalScore: 1,
      policyAllow: true,
      policyReasons: policyDecision.reasons,
      redactedFields: policyDecision.redactions,
      backendId: execution.backendId,
      modelId: execution.modelId,
      modelRevision: execution.modelRevision,
      artifactSetDigest: execution.artifactSetDigest,
      processorRevision: execution.processorRevision,
      runtimeId: execution.runtimeId,
      runtimeVersion: execution.runtimeVersion,
      dimensions: execution.dimensions,
      normalized: execution.normalized,
      promotionState: execution.promotionState,
      requestedAt,
      completedAt,
    };
    defaultLedgerStore.append(entry);
    return entry;
  });

  res.status(200).json({
    requestId: body.requestId,
    tenantId,
    model: result.model,
    modelRevision: execution.modelRevision,
    dimensions,
    vectors: result.vectors.map((vector, index) => ({
      index,
      text: body.texts[index],
      vector,
      ...(result.tokenCounts?.[index] !== undefined
        ? { tokenCount: result.tokenCounts[index] }
        : {}),
    })),
    execution,
    processingMs,
    traceId,
    evidenceIds: evidenceEntries.map((entry) => entry.entryId),
    policyReasons: policyDecision.reasons,
  });

  logger.info(
    {
      traceId,
      requestId: body.requestId,
      count: body.texts.length,
      processingMs,
      backendId: execution.backendId,
      modelRevision: execution.modelRevision,
    },
    'embed completed',
  );
}) as unknown as RequestHandler);
