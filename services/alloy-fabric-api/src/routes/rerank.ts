import { randomUUID } from 'node:crypto';
import {
  RERANK_IMPLEMENTATION_ID,
  type RerankExecutionReceipt,
  RerankRequestSchema,
} from '@workspace/aef-contracts';
import type { PolicyContext } from '@workspace/aef-policy-guard';
import { type RankCandidate, rankCandidates } from '@workspace/alloy-rank-worker';
import type { Request, Response, Router } from 'express';
import { defaultLedgerStore, policyEngine, tenantEnforcer } from '../context.js';
import { logger } from '../logger.js';
import { getRequestId } from '../middleware/request-id.js';
import { getTenantId } from '../middleware/tenant.js';

export function registerRerankRoute(router: Router): void {
  router.post('/v1/rerank', (req: Request, res: Response) => {
    const parsed = RerankRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
      return;
    }

    const { requestId, query, candidates, topK } = parsed.data;
    const tenantId = getTenantId(res);
    const startMs = Date.now();
    const reqId = requestId || getRequestId(req);
    const requestedAt = new Date().toISOString();

    // Tenant boundary + policy enforcement — uniform across all /v1/* routes
    const policyCtx: PolicyContext = { requestId: reqId, tenantId, hasProvenance: true };
    const tenantDecision = tenantEnforcer.enforce(policyCtx);
    if (tenantDecision !== null && !tenantDecision.allow) {
      res.status(403).json({
        error: 'tenant_not_registered',
        reasons: tenantDecision.reasons,
        appliedRuleIds: tenantDecision.appliedRuleIds,
      });
      return;
    }
    const policyDecision = policyEngine.evaluate(policyCtx);
    if (!policyDecision.allow) {
      res.status(403).json({
        error: 'policy_denied',
        reasons: policyDecision.reasons,
        appliedRuleIds: policyDecision.appliedRuleIds,
      });
      return;
    }

    // Wire through the alloy-rank-worker deterministic lexical-overlap scorer.
    const rankInputs: RankCandidate[] = (
      candidates as Array<{
        id: string;
        text: string;
        score?: number;
        metadata?: Record<string, unknown>;
      }>
    ).map((c) => ({
      id: c.id,
      text: c.text,
      ...(c.score !== undefined ? { score: c.score } : {}),
      metadata: c.metadata ?? {},
    }));

    const ranked = rankCandidates(query, rankInputs, topK, 'lexical-overlap');
    const completedAt = new Date().toISOString();
    const rerankMs = Date.now() - startMs;
    const execution: RerankExecutionReceipt = {
      backendId: `alloy-rank-worker:${RERANK_IMPLEMENTATION_ID}`,
      modelId: RERANK_IMPLEMENTATION_ID,
      promotionState: 'DEVELOPMENT',
      implementationKind: 'lexical-overlap',
      fallback: false,
    };

    // Ledger write — every rerank operation is governed and auditable
    let ledgerFailures = 0;
    for (const result of ranked) {
      try {
        defaultLedgerStore.append({
          entryId: randomUUID(),
          requestId: reqId,
          tenantId,
          chunkId: result.id,
          sourceId: `rerank:${reqId}`,
          fusedScore: result.score,
          boostApplied: false,
          rerankerScore: result.score,
          finalScore: result.score,
          policyAllow: policyDecision.allow,
          policyReasons: policyDecision.reasons,
          redactedFields: policyDecision.redactions,
          requestedAt,
          completedAt,
          backendId: `alloy-rank-worker:${RERANK_IMPLEMENTATION_ID}`,
          stageTimings: { rerank: rerankMs },
          scoreBreakdown: { rerankerScore: result.score, rank: result.rank },
        });
      } catch (err) {
        ledgerFailures++;
        logger.error('rerank ledger write failed', { chunkId: result.id, reqId, err: String(err) });
      }
    }

    logger.info('rerank completed', {
      reqId,
      tenantId,
      candidates: candidates.length,
      returned: ranked.length,
      processingMs: rerankMs,
    });

    res.json({
      requestId: reqId,
      tenantId,
      model: RERANK_IMPLEMENTATION_ID,
      backend: `alloy-rank-worker:${RERANK_IMPLEMENTATION_ID}`,
      results: ranked.map((r) => ({
        id: r.id,
        text: r.text,
        score: r.score,
        rank: r.rank,
        mode: r.mode,
        breakdown: r.breakdown,
        metadata: r.metadata,
      })),
      execution,
      ...(ledgerFailures > 0 ? { ledgerFailures } : {}),
      processingMs: Date.now() - startMs,
    });
  });
}
