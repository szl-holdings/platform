import { Router, type IRouter, type RequestHandler } from "express";
import type { Request, Response } from "express";
import { RerankRequestSchema } from "@workspace/aef-contracts";
import { defaultLedgerStore } from "@workspace/aef-evidence-ledger";
import { PolicyEngine } from "@workspace/aef-policy-guard";
import { rerankCandidates } from "@workspace/alloy-rerank-worker";
import { randomUUID } from "crypto";
import { logger } from "../middleware/logger.js";
import { getProfile } from "../profiles/default.js";
import { errorBudgetCounter } from "../middleware/prometheus.js";

export const rerankRouter: IRouter = Router();
const policyEngine = new PolicyEngine();

rerankRouter.post("/v1/rerank", (async (req: Request, res: Response) => {
  const parseResult = RerankRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Validation failed", detail: parseResult.error.issues });
    return;
  }

  const body = parseResult.data;
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
    tenantId: body.tenantId as string,
    profileId: profile.profileId,
    hasProvenance: false,
    metadata: body.metadata,
  });

  if (!policyDecision.allow) {
    errorBudgetCounter.inc({ kind: "policy_denied", tenant_id: body.tenantId as string });
    res.status(403).json({ error: "Request blocked by policy", reasons: policyDecision.reasons, traceId });
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
        model: body.model ?? "aef-dev-rerank",
      },
      { useFallback: false },
    );
  } catch (err) {
    errorBudgetCounter.inc({ kind: "rerank_error", tenant_id: body.tenantId as string });
    logger.error({ traceId, error: String(err) }, "Rerank request failed");
    res.status(502).json({ error: "Rerank backend error", detail: String(err), traceId });
    return;
  }

  const processingMs = Date.now() - rerankStart;
  const completedAt = new Date().toISOString();

  const evidenceEntries = rerankResult.results.map((r) => {
    const entry = {
      entryId: randomUUID(),
      requestId: body.requestId,
      tenantId: body.tenantId as string,
      profileId: profile.profileId,
      profileVersion: profile.version,
      chunkId: r.id,
      sourceId: "rerank-request",
      boostApplied: false,
      rerankerScore: r.score,
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
    results: rerankResult.results.map((r) => {
      const orig = candidateMap.get(r.id);
      return {
        id: r.id,
        score: r.score,
        rank: r.rank,
        text: orig?.text ?? "",
        metadata: orig?.metadata ?? {},
      };
    }),
    processingMs,
    traceId,
    evidenceIds: evidenceEntries.map((e) => e.entryId),
  });

  logger.info({ traceId, requestId: body.requestId, resultCount: rerankResult.results.length, processingMs }, "rerank completed");
}) as unknown as RequestHandler);
