import { randomUUID } from 'node:crypto';
import {
  isDevelopmentOrTestRuntime,
  RERANK_IMPLEMENTATION_ID,
  RerankRequestSchema,
} from '@workspace/aef-contracts';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import { PolicyEngine } from '@workspace/aef-policy-guard';
import { rerankCandidates } from '@workspace/alloy-rerank-worker';
import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import { evidenceLedgerRuntimeAdmission } from '../evidence-ledger-runtime.js';
import { logger } from '../middleware/logger.js';
import { errorBudgetCounter } from '../middleware/prometheus.js';
import { enforceTenantRequestConsistency } from '../middleware/tenant.js';
import { getProfile } from '../profiles/default.js';
import { resolveRerankerConfiguration } from '../rerank-runtime.js';

export const rerankRouter: IRouter = Router();
const policyEngine = new PolicyEngine();
rerankRouter.use(enforceTenantRequestConsistency as RequestHandler);
rerankRouter.use(evidenceLedgerRuntimeAdmission as RequestHandler);

rerankRouter.post('/v1/rerank', (async (req: Request, res: Response) => {
  const parseResult = RerankRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const tenantId: string = body.tenantId;
  const traceId = req.traceId;
  const requestedAt = new Date().toISOString();

  let rerankerConfiguration: ReturnType<typeof resolveRerankerConfiguration>;
  try {
    rerankerConfiguration = resolveRerankerConfiguration();
  } catch {
    res.status(503).json({
      error: 'Reranker configuration is invalid',
      code: 'RERANKER_CONFIGURATION_INVALID',
      traceId,
    });
    return;
  }
  if (!rerankerConfiguration.enabled) {
    res.status(503).json({
      error: 'Reranking is explicitly disabled',
      code: 'RERANKER_DISABLED',
      traceId,
    });
    return;
  }

  let profile: ReturnType<typeof getProfile>;
  try {
    profile = getProfile(body.profileId ?? req.profileId ?? 'default');
  } catch (err) {
    res.status(400).json({ error: 'Profile not found', detail: String(err) });
    return;
  }

  const policyDecision = policyEngine.evaluate({
    requestId: body.requestId,
    tenantId: tenantId,
    profileId: profile.profileId,
    hasProvenance: false,
    metadata: body.metadata,
  });

  if (!policyDecision.allow) {
    errorBudgetCounter.inc({ kind: 'policy_denied', tenant_id: tenantId });
    res
      .status(403)
      .json({ error: 'Request blocked by policy', reasons: policyDecision.reasons, traceId });
    return;
  }

  const rerankStart = Date.now();
  let rerankResult: Awaited<ReturnType<typeof rerankCandidates>>;

  try {
    rerankResult = await rerankCandidates(
      {
        query: body.query,
        candidates: body.candidates.map((c) => ({
          id: c.id,
          text: c.text,
          score: c.score,
        })),
        topK: body.topK,
        model: body.model ?? RERANK_IMPLEMENTATION_ID,
      },
      {
        fallbackPolicy: isDevelopmentOrTestRuntime(process.env, ['AEF_ENV'])
          ? 'development-only'
          : 'never',
      },
    );
  } catch (err) {
    errorBudgetCounter.inc({ kind: 'rerank_error', tenant_id: tenantId });
    logger.error({ traceId, error: String(err) }, 'Rerank request failed');
    res.status(502).json({
      error: 'Rerank backend unavailable',
      code: 'RERANKER_BACKEND_UNAVAILABLE',
      traceId,
    });
    return;
  }

  const processingMs = Date.now() - rerankStart;
  const completedAt = new Date().toISOString();

  const evidenceEntries = rerankResult.results.map((r) => {
    const entry = {
      entryId: randomUUID(),
      requestId: body.requestId,
      tenantId: tenantId,
      profileId: profile.profileId,
      profileVersion: profile.version,
      chunkId: r.id,
      sourceId: 'rerank-request',
      boostApplied: false,
      rerankerScore: r.score,
      rerankerBackendId: rerankResult.execution.backendId,
      rerankerModelId: rerankResult.execution.modelId,
      rerankerModelRevision: rerankResult.execution.modelRevision,
      rerankerArtifactSetDigest: rerankResult.execution.artifactSetDigest,
      rerankerPromotionState: rerankResult.execution.promotionState,
      rerankerFallback: rerankResult.execution.fallback,
      finalScore: r.score,
      policyAllow: true,
      policyReasons: policyDecision.reasons,
      redactedFields: policyDecision.redactions,
      requestedAt,
      completedAt,
    };
    defaultLedgerStore.append(entry);
    return entry;
  });

  const candidateMap = new Map(body.candidates.map((c) => [c.id, c]));

  res.status(200).json({
    requestId: body.requestId,
    tenantId: body.tenantId,
    model: rerankResult.model,
    execution: rerankResult.execution,
    results: rerankResult.results.map((r) => {
      const orig = candidateMap.get(r.id);
      return {
        id: r.id,
        score: r.score,
        rank: r.rank,
        text: orig?.text ?? '',
        metadata: orig?.metadata ?? {},
      };
    }),
    processingMs,
    traceId,
    evidenceIds: evidenceEntries.map((e) => e.entryId),
  });

  logger.info(
    { traceId, requestId: body.requestId, resultCount: rerankResult.results.length, processingMs },
    'rerank completed',
  );
}) as unknown as RequestHandler);
