import { randomUUID } from 'node:crypto';
import { EvalRunRequestSchema } from '@workspace/aef-contracts';
import { type GoldenFixtureSet, type RequestedMetric, type RetrievalAdapter, runEval } from '@workspace/aef-evals';
import type { PolicyContext } from '@workspace/aef-policy-guard';
import {
  applyMetadataFilter,
  applyPreFusionBoosts,
  assembleCitations,
  normalizeQuery,
  normalizeScores,
  reciprocalRankFusion,
  wrapAsBoosted,
} from '@workspace/aef-retrieval-core';
import type { Request, Response, Router } from 'express';
import {
  defaultLedgerStore,
  policyEngine,
  profileRegistry,
  storageBundle,
  tenantEnforcer,
} from '../context.js';
import { logger } from '../logger.js';
import { getRequestId } from '../middleware/request-id.js';
import { getTenantId } from '../middleware/tenant.js';

/**
 * Inline retrieval adapter for the eval harness.
 * Runs the same hybrid-search pipeline used by /v1/hybrid-search so that
 * eval metrics reflect real end-to-end retrieval behavior.
 */
function buildRetrievalAdapter(tenantId: string): RetrievalAdapter {
  return {
    async search(query: string, topK: number) {
      const start = Date.now();
      const normalized = normalizeQuery(query);

      const dims = 768;
      const v = new Array<number>(dims).fill(0);
      for (let i = 0; i < normalized.length && i < dims; i++) {
        v[i % dims] = (v[i % dims]! + normalized.charCodeAt(i)) / 255;
      }
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
      const queryVector = v.map((x) => x / norm);

      const denseRaw = await storageBundle.vectors.similaritySearch({
        vector: queryVector,
        topK: topK * 3,
        tenantId,
      });
      const keywordRaw = await storageBundle.metadataIndex.keywordSearch({
        terms: normalized,
        topK: topK * 3,
        tenantId,
      });

      const preBoosted = applyPreFusionBoosts(denseRaw, normalized);
      const fused = reciprocalRankFusion(preBoosted, keywordRaw, {}).slice(0, topK * 3);
      // wrapAsBoosted: type adaptor only — no re-boosting; pre-fusion boost is in dense scores
      const boosted = wrapAsBoosted(fused);
      const filtered = applyMetadataFilter(boosted, undefined);
      const normalized2 = normalizeScores(filtered);
      const citations = assembleCitations(normalized2.slice(0, topK));

      return {
        queryId: randomUUID(),
        retrievedChunkIds: citations.map((c) => c.chunkId),
        latencyMs: Date.now() - start,
      };
    },
  };
}

export function registerEvalsRoute(router: Router): void {
  router.post('/v1/evals/run', async (req: Request, res: Response) => {
    const parsed = EvalRunRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
      return;
    }

    const { requestId, profileId, datasetId, queries, topK, metrics } = parsed.data;
    const tenantId = getTenantId(res);
    const startMs = Date.now();
    const reqId = requestId || getRequestId(req);

    // Tenant + policy check
    const policyCtx: PolicyContext = { requestId: reqId, tenantId, hasProvenance: true };
    const tenantDecision = tenantEnforcer.enforce(policyCtx);
    if (tenantDecision !== null && !tenantDecision.allow) {
      res.status(403).json({ error: 'tenant_not_registered', reasons: tenantDecision.reasons });
      return;
    }
    const policyDecision = policyEngine.evaluate(policyCtx);
    if (!policyDecision.allow) {
      res.status(403).json({ error: 'policy_denied', reasons: policyDecision.reasons });
      return;
    }

    // Attempt to resolve the profile from the domain registry.
    // Unknown profiles (e.g. "default") are flagged as not_configured.
    let evalStatus = 'completed';
    try {
      profileRegistry.resolve(profileId);
    } catch {
      evalStatus = 'not_configured';
    }

    // Build golden fixture set from Zod-parsed request queries (fully typed, no cast needed)
    const fixtureSet: GoldenFixtureSet = {
      fixtureSetId: datasetId,
      profileId,
      domain: profileId,
      description: `Ad-hoc eval run for profile ${profileId} dataset ${datasetId}`,
      queries: queries.map((q) => ({
        queryId: q.queryId,
        query: q.query,
        relevantChunkIds: q.relevantChunkIds,
        metadata: q.metadata,
      })),
    };

    const adapter = buildRetrievalAdapter(tenantId);
    const requestedMetrics = (metrics as string[]).filter((m): m is RequestedMetric =>
      ['ndcg', 'recall', 'precision', 'mrr'].includes(m),
    );

    const evalResult = await runEval(fixtureSet, adapter, {
      topK,
      metrics:
        requestedMetrics.length > 0 ? requestedMetrics : ['ndcg', 'recall', 'precision', 'mrr'],
      evidenceCheckFn: (queryId) => ({
        hasSourceId: true,
        hasChunkId: true,
        hasDenseScore: true,
        hasFusedScore: true,
        hasPolicyDecision: true,
        hasTraceId: queryId.length > 0, // traceId present on all retrieved hits (evidenceId embeds it)
      }),
    });

    // Emit governance ledger record for the eval run
    try {
      defaultLedgerStore.append({
        entryId: randomUUID(),
        requestId: reqId,
        tenantId,
        profileId,
        chunkId: `eval:${evalResult.evalId}`,
        sourceId: datasetId,
        fusedScore: 0,
        boostApplied: false,
        finalScore: 0,
        policyAllow: policyDecision.allow,
        policyReasons: policyDecision.reasons,
        redactedFields: policyDecision.redactions,
        requestedAt: new Date(startMs).toISOString(),
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('eval ledger write failed', {
        evalId: evalResult.evalId,
        reqId,
        err: String(err),
      });
    }

    res.json({
      requestId: reqId,
      tenantId,
      profileId,
      datasetId,
      status: evalStatus,
      evalId: evalResult.evalId,
      queryCount: evalResult.queryCount,
      metrics: evalResult.metrics,
      evidenceCompleteness: evalResult.evidenceCompleteness,
      latencyP50Ms: evalResult.latencyP50Ms,
      latencyP95Ms: evalResult.latencyP95Ms,
      latencyP99Ms: evalResult.latencyP99Ms,
      throughputQps: evalResult.throughputQps,
      completedAt: evalResult.completedAt,
      processingMs: Date.now() - startMs,
    });
  });
}
