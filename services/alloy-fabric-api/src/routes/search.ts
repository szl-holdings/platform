import { randomUUID } from 'node:crypto';
import { type MetadataFilter, HybridSearchRequestSchema, SearchHitSchema } from '@workspace/aef-contracts';
import type { PolicyContext } from '@workspace/aef-policy-guard';
import { type DenseHit, type KeywordHit, applyMetadataFilter, applyPreFusionBoosts, applyProfilePromptTransform, assembleCitations, normalizeQuery, normalizeScores, reciprocalRankFusion, rerankHits, wrapAsBoosted } from '@workspace/aef-retrieval-core';
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
import { recordBackendRequest } from './metrics.js';

// Deterministic unit-length embedding vector — CPU fallback, swapped for GPU/external in production.
function cpuEmbedVector(text: string, dims: number): number[] {
  const v = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length && i < dims; i++) {
    v[i % dims] = (v[i % dims]! + text.charCodeAt(i)) / 255;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export function registerSearchRoute(router: Router): void {
  router.post('/v1/hybrid-search', async (req: Request, res: Response) => {
    const parsed = HybridSearchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
      return;
    }

    const {
      requestId,
      profileId,
      query,
      topK,
      candidatePool,
      denseWeight,
      keywordWeight,
      metadataFilter: rawFilter,
      rerankEnabled,
    } = parsed.data;
    const tenantId = getTenantId(res);
    const startMs = Date.now();
    const reqId = requestId || getRequestId(req);
    const traceId = randomUUID();
    const requestedAt = new Date().toISOString();
    const stageMs: Record<string, number> = {};
    let stageStart = startMs;

    // 1. normalize_query
    const normalizedQuery = normalizeQuery(query);
    const transformedQuery = profileId
      ? applyProfilePromptTransform(normalizedQuery, profileId)
      : normalizedQuery;
    stageMs.normalize_query = Date.now() - stageStart;
    stageStart = Date.now();

    // 2. load_profile — resolve active version; reject unknown profileId to enforce governance
    let profileVersion: string | undefined;
    if (profileId !== undefined) {
      try {
        profileVersion = profileRegistry.resolve(profileId).version;
      } catch {
        res.status(400).json({
          error: 'unknown_profile',
          profileId,
          message:
            'Profile not found; register the profile or omit profileId to use the tenant default.',
        });
        return;
      }
    }
    stageMs.load_profile = Date.now() - stageStart;
    stageStart = Date.now();

    // 3. policy_check — tenant boundary + rule evaluation; hard stops
    const policyCtx: PolicyContext = {
      requestId: reqId,
      tenantId,
      hasProvenance: true,
      ...(profileId !== undefined ? { profileId } : {}),
    };
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
    stageMs.policy_check = Date.now() - stageStart;
    stageStart = Date.now();

    // 4. query_shaping — ANN seed vector (CPU; production delegates to alloy-vector-worker)
    const queryVector = cpuEmbedVector(transformedQuery, 768);
    stageMs.query_shaping = Date.now() - stageStart;
    stageStart = Date.now();

    // 5. dense_ann — tenant-scoped ANN similarity search
    const denseRaw = await storageBundle.vectors.similaritySearch({
      vector: queryVector,
      topK: candidatePool,
      tenantId,
      ...(profileId !== undefined ? { profileId } : {}),
    });
    const denseHits: DenseHit[] = denseRaw.map((h) => ({
      chunkId: h.chunkId,
      sourceId: h.sourceId,
      score: h.score,
      metadata: h.metadata,
    }));
    stageMs.dense_ann = Date.now() - stageStart;
    stageStart = Date.now();

    // 6. keyword_bm25 — tenant-scoped term match
    const keywordRaw = await storageBundle.metadataIndex.keywordSearch({
      terms: transformedQuery,
      topK: candidatePool,
      tenantId,
    });
    const keywordHits: KeywordHit[] = keywordRaw.map((h) => ({
      chunkId: h.chunkId,
      sourceId: h.sourceId,
      score: h.score,
      highlights: h.highlights,
      metadata: h.metadata,
    }));
    stageMs.keyword_bm25 = Date.now() - stageStart;
    stageStart = Date.now();

    // 7. exact_match_boost — boost dense hits before fusion so exact-match signals influence RRF rank positions
    const preBoostedDenseHits = applyPreFusionBoosts(denseHits, transformedQuery);
    stageMs.exact_match_boost = Date.now() - stageStart;
    stageStart = Date.now();

    // 8. rrf_fusion — merge pre-boosted dense + keyword via RRF.
    // wrapAsBoosted converts FusedHit[] → BoostedHit[] without re-applying boost rules;
    // the pre-fusion boost signal is already reflected in the dense scores fed into RRF.
    const fusedHits = reciprocalRankFusion(preBoostedDenseHits, keywordHits, {
      denseWeight,
      keywordWeight,
    }).slice(0, candidatePool);
    const boostedHits = wrapAsBoosted(fusedHits);
    stageMs.rrf_fusion = Date.now() - stageStart;
    stageStart = Date.now();

    // 9. metadata_filter — apply caller-supplied scoping predicate
    const filteredHits = rawFilter
      ? applyMetadataFilter(boostedHits, rawFilter as MetadataFilter)
      : boostedHits;
    stageMs.metadata_filter = Date.now() - stageStart;
    stageStart = Date.now();

    // 10. rerank — normalizes scores to [0,1] then runs CPU cross-encoder second pass when enabled.
    // Score normalization is bundled into this stage per the 13-stage canonical pipeline contract.
    const normalizedHits = normalizeScores(filteredHits);
    const rerankedHits = rerankEnabled
      ? rerankHits(normalizedHits, transformedQuery, topK)
      : normalizedHits.slice(0, topK);
    stageMs.rerank = Date.now() - stageStart;
    stageStart = Date.now();

    // Record backend attribution (local-cpu always warm for the CPU fallback embed path)
    recordBackendRequest('local-cpu', 'aef-embed-cpu-v1', true);

    // 12. evidence_assemble — build citation objects with provenance fields
    const citations = assembleCitations(rerankedHits);
    stageMs.evidence_assemble = Date.now() - stageStart;
    stageStart = Date.now();

    // 13. ledger_write — governance record; UNCONDITIONAL; failure is surfaced loud
    let ledgerFailures = 0;
    const completedAt = new Date().toISOString();
    for (const citation of citations) {
      const scoreBreakdown: Record<string, number> = {
        fusedScore: citation.fusedScore,
        finalScore: citation.score,
      };
      if (citation.denseScore !== undefined) scoreBreakdown.denseScore = citation.denseScore;
      if (citation.keywordScore !== undefined)
        scoreBreakdown.keywordScore = citation.keywordScore;
      if (citation.rerankerScore !== undefined)
        scoreBreakdown.rerankerScore = citation.rerankerScore;

      try {
        defaultLedgerStore.append({
          entryId: randomUUID(),
          requestId: reqId,
          tenantId,
          ...(profileId !== undefined ? { profileId } : {}),
          chunkId: citation.chunkId,
          sourceId: citation.sourceId,
          ...(citation.denseScore !== undefined ? { denseScore: citation.denseScore } : {}),
          ...(citation.keywordScore !== undefined ? { keywordScore: citation.keywordScore } : {}),
          fusedScore: citation.fusedScore,
          boostApplied: citation.boostApplied,
          ...(citation.rerankerScore !== undefined
            ? { rerankerScore: citation.rerankerScore }
            : {}),
          finalScore: citation.score,
          policyAllow: policyDecision.allow,
          policyReasons: policyDecision.reasons,
          redactedFields: policyDecision.redactions,
          requestedAt,
          completedAt,
          stageTimings: stageMs,
          backendId: 'local-cpu:aef-embed-cpu-v1',
          scoreBreakdown,
        });
      } catch (err) {
        ledgerFailures++;
        logger.error('CRITICAL ledger write failed', {
          chunkId: citation.chunkId,
          reqId,
          traceId,
          err: String(err),
        });
      }
    }
    stageMs.ledger_write = Date.now() - stageStart;
    stageStart = Date.now();

    // 14. response_normalization — build evidence-enriched hits with per-hit traceability fields
    // (per spec: last stage before JSON serialization)
    if (ledgerFailures > 0) {
      res.setHeader('X-AEF-Ledger-Failures', String(ledgerFailures));
    }

    // Evidence enrichment — per-hit governance metadata aligned to the documented native shape.
    // text is required by SearchHitSchema — pulled from chunk metadata (populated during ingest).
    const enrichedHits = citations.map((c) => {
      const textVal = typeof c.metadata?.text === 'string' ? c.metadata.text : '';
      const hitShape = {
        chunkId: c.chunkId,
        sourceId: c.sourceId,
        sourceUri:
          typeof c.metadata?.sourceUri === 'string' ? c.metadata.sourceUri : undefined,
        title: typeof c.metadata?.title === 'string' ? c.metadata.title : undefined,
        page: typeof c.metadata?.page === 'number' ? c.metadata.page : undefined,
        section: typeof c.metadata?.section === 'string' ? c.metadata.section : undefined,
        text: textVal,
        denseScore: c.denseScore,
        keywordScore: c.keywordScore,
        fusedScore: c.fusedScore,
        rerankerScore: c.rerankerScore,
        finalScore: c.score,
        boostApplied: c.boostApplied,
        metadata: c.metadata ?? {},
      };

      // Validate core SearchHit contract — log a warning if required fields are missing
      const validation = SearchHitSchema.passthrough().safeParse(hitShape);
      if (!validation.success) {
        logger.warn('SearchHit contract violation', {
          chunkId: c.chunkId,
          issues: validation.error.issues,
        });
      }

      return {
        ...hitShape,
        // Governance extension fields (beyond SearchHitSchema; preserved for evidence consumers)
        fusionScore: c.fusedScore,
        rerankScore: c.rerankerScore,
        sourceType:
          (c.metadata?.contentType as string | undefined) ??
          (c.metadata?.sourceType as string | undefined) ??
          'document',
        documentTitle:
          (c.metadata?.title as string | undefined) ??
          (c.metadata?.documentTitle as string | undefined) ??
          c.chunkId,
        ...(profileVersion !== undefined ? { profileVersion } : {}),
        exactMatchBoosts: c.boostApplied
          ? c.metadata?.boostRuleId
            ? [String(c.metadata.boostRuleId)]
            : ['exact_match']
          : [],
        rationale:
          policyDecision.reasons.length > 0 ? policyDecision.reasons.join('; ') : 'policy_allow',
        selectedRationale:
          policyDecision.reasons.length > 0 ? policyDecision.reasons.join('; ') : 'policy_allow',
        evidenceId: `${traceId}-${c.chunkId}`,
        // Per-hit evidence traceability — evidence-first contract; 13-stage canonical pipeline
        traceId,
        retrievalPath: [
          'normalize_query',
          'load_profile',
          'policy_check',
          'query_shaping',
          'dense_ann',
          'keyword_bm25',
          'exact_match_boost',
          'rrf_fusion',
          'metadata_filter',
          'rerank',
          'evidence_assemble',
          'ledger_write',
          'response_normalization',
        ],
      };
    });

    logger.info('hybrid-search completed', {
      reqId,
      traceId,
      tenantId,
      profileId,
      hits: enrichedHits.length,
      processingMs: Date.now() - startMs,
    });

    stageMs.response_normalization = Date.now() - stageStart;

    res.json({
      requestId: reqId,
      tenantId,
      ...(profileId !== undefined ? { profileId } : {}),
      ...(profileVersion !== undefined ? { profileVersion } : {}),
      traceId,
      retrievalPath: [
        'normalize_query',
        'load_profile',
        'policy_check',
        'query_shaping',
        'dense_ann',
        'keyword_bm25',
        'exact_match_boost',
        'rrf_fusion',
        'metadata_filter',
        'rerank',
        'evidence_assemble',
        'ledger_write',
        'response_normalization',
      ],
      stageTimings: stageMs,
      policyDecision: {
        allow: policyDecision.allow,
        redactions: policyDecision.redactions,
        appliedRuleIds: policyDecision.appliedRuleIds,
      },
      hits: enrichedHits,
      totalCandidates: denseHits.length + keywordHits.length,
      ...(ledgerFailures > 0 ? { ledgerFailures } : {}),
      processingMs: Date.now() - startMs,
    });
  });
}
