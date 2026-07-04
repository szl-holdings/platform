import { Router, type IRouter, type RequestHandler, type Request, type Response } from 'express';
import { HybridSearchRequestSchema } from "@workspace/aef-contracts";
import { defaultLedgerStore } from "@workspace/aef-evidence-ledger";
import { PolicyEngine } from "@workspace/aef-policy-guard";
import { reciprocalRankFusion, applyExactMatchBoosts, normalizeScores, assembleCitations } from "@workspace/aef-retrieval-core";
import { embedTexts } from "@workspace/alloy-embed-worker";
import { rerankCandidates } from "@workspace/alloy-rerank-worker";
import { randomUUID } from "node:crypto";
import { logger } from "../middleware/logger.js";
import { getProfile } from "../profiles/default.js";
import { errorBudgetCounter } from "../middleware/prometheus.js";
import { getRetrievalStore, getEmbedderSelection } from "../retrieval-store.js";

export const hybridSearchRouter: IRouter = Router();
const policyEngine = new PolicyEngine();

hybridSearchRouter.post("/v1/hybrid-search", (async (req: Request, res: Response) => {
  const parseResult = HybridSearchRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
  const tenantId: string = body.tenantId;
  const traceId = req.traceId;
  const requestedAt = new Date().toISOString();

  let profile;
  try {
    profile = getProfile(body.profileId ?? req.profileId ?? "default");
  } catch (err) {
    res.status(400).json({ error: "Profile not found", detail: String(err) });
    return;
  }

  const policyDecision = policyEngine.evaluate({
    requestId: body.requestId,
    tenantId: tenantId,
    profileId: profile.profileId,
    hasProvenance: body.includeProvenance,
    metadata: body.metadata,
  });

  if (!policyDecision.allow) {
    errorBudgetCounter.inc({ kind: "policy_denied", tenant_id: tenantId });
    res.status(403).json({ error: "Request blocked by policy", reasons: policyDecision.reasons, traceId });
    return;
  }

  const start = Date.now();

  // ── Embedder: real model backend (bge-m3, 1024-dim) when SUBSTRATE_EMBED_URL
  //    is configured; dev-hash fallback only when no real endpoint exists.
  const embedder = getEmbedderSelection();

  let queryVector: number[];
  try {
    const [vec] = await embedTexts([body.query], {
      backendId: embedder.backendId,
      model: embedder.model,
      pooling: "mean",
      normalize: true,
    });
    queryVector = vec;
  } catch (err) {
    errorBudgetCounter.inc({ kind: "embed_error", tenant_id: tenantId });
    res.status(502).json({ error: "Query embedding failed", detail: String(err), traceId });
    return;
  }

  const topK = body.topK;
  const candidatePool = body.candidatePool;

  // ── Retrieval: query the real store (pgvector cosine ANN + Postgres FTS when
  //    DATABASE_URL is set; in-memory for local dev). No synthetic fabrication.
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
        topK: candidatePool,
        tenantId,
        ...(body.profileId ? { profileId: body.profileId } : {}),
        ...(body.metadataFilter ? { metadataFilter: body.metadataFilter } : {}),
      }),
      bundle.metadataIndex.keywordSearch({
        terms: body.query,
        topK: candidatePool,
        tenantId,
        ...(body.metadataFilter ? { metadataFilter: body.metadataFilter } : {}),
      }),
    ]);
  } catch (err) {
    errorBudgetCounter.inc({ kind: "retrieval_error", tenant_id: tenantId });
    res.status(502).json({ error: "Retrieval failed", detail: String(err), traceId });
    return;
  }

  const fused = reciprocalRankFusion(denseHits, keywordHits, {
    denseWeight: body.denseWeight,
    keywordWeight: body.keywordWeight,
  });

  const boosted = applyExactMatchBoosts(fused, body.query);
  const normalized = normalizeScores(boosted);
  const citations = assembleCitations(normalized);

  let finalCitations = citations.slice(0, topK);
  let rerankModel: string | undefined;

  if (body.rerankEnabled || profile.rerankEnabled) {
    try {
      const rerankResult = await rerankCandidates(
        {
          query: body.query,
          candidates: finalCitations.map((c) => ({
            id: c.chunkId,
            text: String(c.metadata.text ?? ""),
            score: c.score,
          })),
          topK,
          model: "aef-dev-rerank",
        },
        { useFallback: false },
      );

      rerankModel = rerankResult.model;
      const rerankScoreById = new Map(rerankResult.results.map((r) => [r.id, r.score]));
      finalCitations = finalCitations
        .map((c) => ({ ...c, rerankerScore: rerankScoreById.get(c.chunkId) }))
        .sort((a, b) => (b.rerankerScore ?? b.score) - (a.rerankerScore ?? a.score));
    } catch (err) {
      logger.warn({ traceId, error: String(err) }, "Rerank failed during hybrid-search, using fusion order");
    }
  }

  const completedAt = new Date().toISOString();

  const evidenceEntries = finalCitations.map((c, i) => {
    const entry = {
      entryId: randomUUID(),
      requestId: body.requestId,
      tenantId: tenantId,
      profileId: profile.profileId,
      profileVersion: profile.version,
      chunkId: c.chunkId,
      sourceId: c.sourceId,
      sourceUri: c.sourceUri,
      title: c.title,
      page: c.page,
      section: c.section,
      denseScore: c.denseScore,
      keywordScore: c.keywordScore,
      fusedScore: c.fusedScore,
      boostApplied: c.boostApplied,
      rerankerScore: c.rerankerScore,
      finalScore: c.rerankerScore ?? c.score,
      policyAllow: true,
      policyReasons: policyDecision.reasons,
      redactedFields: policyDecision.redactions,
      // Backend attribution: which embedder + store produced this hit.
      // `backendId` uses the canonical EvidenceEntry field; embed model + store
      // are recorded in scoreBreakdown-adjacent metadata via the response too.
      backendId: `${embedder.backendId}+${storeBackend}`,
      requestedAt,
      completedAt,
    };
    defaultLedgerStore.append(entry);
    return { ...entry, rank: i + 1 };
  });

  const hits = finalCitations.map((c, i) => {
    const evidence = evidenceEntries[i];
    const textVal = c.metadata.text;
    return {
      chunkId: c.chunkId,
      sourceId: c.sourceId,
      sourceUri: c.sourceUri,
      title: c.title,
      page: c.page,
      section: c.section,
      text: typeof textVal === "string" ? textVal : "",
      denseScore: c.denseScore,
      keywordScore: c.keywordScore,
      fusedScore: c.fusedScore,
      rerankerScore: c.rerankerScore,
      finalScore: c.rerankerScore ?? c.score,
      boostApplied: c.boostApplied,
      selectedRationale: c.boostApplied
        ? "Exact-match boost applied"
        : body.rerankEnabled
          ? "Selected by reranker"
          : "Selected by reciprocal rank fusion",
      evidenceId: evidence.entryId,
      evidence: body.includeProvenance ? evidence : undefined,
      metadata: c.metadata,
    };
  });

  const processingMs = Date.now() - start;

  res.status(200).json({
    requestId: body.requestId,
    tenantId: body.tenantId,
    profileId: profile.profileId,
    query: body.query,
    hits,
    totalCandidates: candidatePool,
    rerankModel,
    processingMs,
    traceId,
    policyReasons: policyDecision.reasons,
    // Backend transparency: which embedder + store actually served this request.
    backends: {
      embedModel: embedder.model,
      embedBackend: embedder.backendId,
      embedReal: embedder.isReal,
      retrievalBackend: storeBackend,
    },
  });

  logger.info(
    {
      traceId,
      requestId: body.requestId,
      hitCount: hits.length,
      processingMs,
      embedBackend: embedder.backendId,
      retrievalBackend: storeBackend,
    },
    "hybrid-search completed",
  );
}) as unknown as RequestHandler);
