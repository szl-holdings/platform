import { randomUUID } from 'node:crypto';
import { Router, type IRouter, type RequestHandler, type Request, type Response } from 'express';
import { HybridSearchRequestSchema, type EmbeddingExecutionReceipt } from '@workspace/aef-contracts';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import { PolicyEngine } from '@workspace/aef-policy-guard';
import {
  applyExactMatchBoosts,
  assembleCitations,
  normalizeScores,
  reciprocalRankFusion,
} from '@workspace/aef-retrieval-core';
import { embedTextsWithReceipt } from '@workspace/alloy-embed-worker';
import { rerankCandidates } from '@workspace/alloy-rerank-worker';
import { logger } from '../middleware/logger.js';
import { errorBudgetCounter } from '../middleware/prometheus.js';
import { getProfile } from '../profiles/default.js';
import {
  EmbedderConfigurationError,
  getEmbedderSelection,
  getRetrievalStore,
} from '../retrieval-store.js';

export const hybridSearchRouter: IRouter = Router();
const policyEngine = new PolicyEngine();

hybridSearchRouter.post('/v1/hybrid-search', (async (req: Request, res: Response) => {
  const parseResult = HybridSearchRequestSchema.safeParse(req.body);
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
    hasProvenance: body.includeProvenance,
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

  const start = Date.now();
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

  let embedResult;
  try {
    embedResult = await embedTextsWithReceipt([body.query], {
      backendId: embedder.backendId,
      model: embedder.model,
      pooling: 'mean',
      normalize: true,
    });
  } catch (error) {
    errorBudgetCounter.inc({ kind: 'embed_error', tenant_id: tenantId });
    logger.error({ traceId, error: String(error), backendId: embedder.backendId }, 'Query embedding failed');
    res.status(502).json({
      error: 'Query embedding failed',
      code: 'EMBEDDING_BACKEND_UNAVAILABLE',
      traceId,
    });
    return;
  }

  const queryVector = embedResult.vectors[0];
  if (!queryVector) {
    res.status(502).json({ error: 'Query embedding returned no vector', code: 'EMPTY_EMBEDDING', traceId });
    return;
  }

  const { bundle, backend: storeBackend } = getRetrievalStore();
  let denseHits: Array<{
    chunkId: string;
    sourceId: string;
    score: number;
    vector?: number[];
    metadata: Record<string, unknown>;
  }>;
  let keywordHits: Array<{
    chunkId: string;
    sourceId: string;
    score: number;
    highlights?: string[];
    metadata: Record<string, unknown>;
  }>;

  try {
    [denseHits, keywordHits] = await Promise.all([
      bundle.vectors.similaritySearch({
        vector: queryVector,
        topK: body.candidatePool,
        tenantId,
        ...(body.profileId ? { profileId: body.profileId } : {}),
        ...(body.metadataFilter ? { metadataFilter: body.metadataFilter } : {}),
      }),
      bundle.metadataIndex.keywordSearch({
        terms: body.query,
        topK: body.candidatePool,
        tenantId,
        ...(body.metadataFilter ? { metadataFilter: body.metadataFilter } : {}),
      }),
    ]);
  } catch (error) {
    errorBudgetCounter.inc({ kind: 'retrieval_error', tenant_id: tenantId });
    logger.error({ traceId, error: String(error), storeBackend }, 'Hybrid retrieval failed');
    res.status(502).json({ error: 'Retrieval backend unavailable', code: 'RETRIEVAL_FAILED', traceId });
    return;
  }

  const fused = reciprocalRankFusion(denseHits, keywordHits, {
    denseWeight: body.denseWeight,
    keywordWeight: body.keywordWeight,
  });
  const citations = assembleCitations(normalizeScores(applyExactMatchBoosts(fused, body.query)));

  let finalCitations = citations.slice(0, body.topK);
  let rerankModel: string | undefined;
  if (body.rerankEnabled || profile.rerankEnabled) {
    try {
      const rerankResult = await rerankCandidates(
        {
          query: body.query,
          candidates: finalCitations.map((citation) => ({
            id: citation.chunkId,
            text: String(citation.metadata.text ?? ''),
            score: citation.score,
          })),
          topK: body.topK,
          model: 'aef-dev-rerank',
        },
        { useFallback: false },
      );
      rerankModel = rerankResult.model;
      const scoreById = new Map(rerankResult.results.map((result) => [result.id, result.score]));
      finalCitations = finalCitations
        .map((citation) => ({ ...citation, rerankerScore: scoreById.get(citation.chunkId) }))
        .sort((left, right) =>
          (right.rerankerScore ?? right.score) - (left.rerankerScore ?? left.score),
        );
    } catch (error) {
      logger.warn({ traceId, error: String(error) }, 'Rerank failed; preserving fusion order');
    }
  }

  const execution: EmbeddingExecutionReceipt =
    embedResult.execution ?? {
      backendId: embedder.backendId,
      modelId: embedResult.model,
      ...(embedder.modelRevision ? { modelRevision: embedder.modelRevision } : {}),
      ...(embedder.artifactSetDigest ? { artifactSetDigest: embedder.artifactSetDigest } : {}),
      dimensions: embedResult.dimensions,
      normalized: true,
      promotionState: embedder.promotionState,
      supportedModalities: ['text'],
    };
  const completedAt = new Date().toISOString();

  const evidenceEntries = finalCitations.map((citation, index) => {
    const entry = {
      entryId: randomUUID(),
      requestId: body.requestId,
      tenantId,
      profileId: profile.profileId,
      profileVersion: profile.version,
      chunkId: citation.chunkId,
      sourceId: citation.sourceId,
      sourceUri: citation.sourceUri,
      title: citation.title,
      page: citation.page,
      section: citation.section,
      denseScore: citation.denseScore,
      keywordScore: citation.keywordScore,
      fusedScore: citation.fusedScore,
      boostApplied: citation.boostApplied,
      rerankerScore: citation.rerankerScore,
      finalScore: citation.rerankerScore ?? citation.score,
      policyAllow: true,
      policyReasons: policyDecision.reasons,
      redactedFields: policyDecision.redactions,
      backendId: `${execution.backendId}+${storeBackend}`,
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
    return { ...entry, rank: index + 1 };
  });

  const hits = finalCitations.map((citation, index) => {
    const evidence = evidenceEntries[index];
    const text = citation.metadata.text;
    return {
      chunkId: citation.chunkId,
      sourceId: citation.sourceId,
      sourceUri: citation.sourceUri,
      title: citation.title,
      page: citation.page,
      section: citation.section,
      text: typeof text === 'string' ? text : '',
      denseScore: citation.denseScore,
      keywordScore: citation.keywordScore,
      fusedScore: citation.fusedScore,
      rerankerScore: citation.rerankerScore,
      finalScore: citation.rerankerScore ?? citation.score,
      boostApplied: citation.boostApplied,
      selectedRationale: citation.boostApplied
        ? 'Exact-match boost applied'
        : body.rerankEnabled
          ? 'Selected by reranker'
          : 'Selected by reciprocal rank fusion',
      evidenceId: evidence.entryId,
      evidence: body.includeProvenance ? evidence : undefined,
      metadata: citation.metadata,
    };
  });

  const processingMs = Date.now() - start;
  res.status(200).json({
    requestId: body.requestId,
    tenantId,
    profileId: profile.profileId,
    query: body.query,
    hits,
    totalCandidates: body.candidatePool,
    rerankModel,
    processingMs,
    traceId,
    policyReasons: policyDecision.reasons,
    backends: {
      embedModel: execution.modelId,
      embedRevision: execution.modelRevision,
      artifactSetDigest: execution.artifactSetDigest,
      embedBackend: execution.backendId,
      embedReal: embedder.isReal,
      promotionState: execution.promotionState,
      retrievalBackend: storeBackend,
    },
  });

  logger.info(
    {
      traceId,
      requestId: body.requestId,
      hitCount: hits.length,
      processingMs,
      embedBackend: execution.backendId,
      retrievalBackend: storeBackend,
      modelRevision: execution.modelRevision,
    },
    'hybrid-search completed',
  );
}) as unknown as RequestHandler);
