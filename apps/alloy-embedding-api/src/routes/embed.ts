import { Router, type IRouter, type RequestHandler, type Request, type Response } from 'express';
import { EmbedRequestSchema } from "@workspace/aef-contracts";
import { defaultLedgerStore } from "@workspace/aef-evidence-ledger";
import { PolicyEngine } from "@workspace/aef-policy-guard";
import { embedTexts } from "@workspace/alloy-embed-worker";
import { randomUUID } from "node:crypto";
import { logger } from "../middleware/logger.js";
import { getProfile } from "../profiles/default.js";
import { errorBudgetCounter } from "../middleware/prometheus.js";

export const embedRouter: IRouter = Router();
const policyEngine = new PolicyEngine();

embedRouter.post("/v1/embed", (async (req: Request, res: Response) => {
  const parseResult = EmbedRequestSchema.safeParse(req.body);
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
    hasProvenance: false,
    metadata: body.metadata,
  });

  if (!policyDecision.allow) {
    errorBudgetCounter.inc({ kind: "policy_denied", tenant_id: tenantId });
    res.status(403).json({
      error: "Request blocked by policy",
      reasons: policyDecision.reasons,
      traceId,
    });
    return;
  }

  let vectors: number[][];
  const embedStart = Date.now();

  const substrateUrl = process.env.SUBSTRATE_EMBED_URL;
  const useDevHash = !substrateUrl && process.env.NODE_ENV !== "production";
  const primaryBackend = useDevHash ? "dev-hash" : "cpu-local";

  try {
    vectors = await embedTexts(body.texts, {
      backendId: primaryBackend,
      model: body.model ?? "aef-dev-hash",
      pooling: "mean",
      normalize: body.normalize,
    });
  } catch (primaryErr) {
    if (!useDevHash && process.env.NODE_ENV !== "production") {
      logger.warn({ traceId, primaryBackend, error: String(primaryErr) }, "Primary embed backend failed; falling back to dev-hash");
      try {
        vectors = await embedTexts(body.texts, {
          backendId: "dev-hash",
          model: body.model ?? "aef-dev-hash",
          pooling: "mean",
          normalize: body.normalize,
        });
      } catch (fallbackErr) {
        errorBudgetCounter.inc({ kind: "embed_error", tenant_id: tenantId });
        logger.error({ traceId, error: String(fallbackErr), tenantId: body.tenantId }, "Embed fallback also failed");
        res.status(502).json({ error: "Embedding backend error", detail: String(fallbackErr), traceId });
        return;
      }
    } else {
      errorBudgetCounter.inc({ kind: "embed_error", tenant_id: tenantId });
      logger.error({ traceId, error: String(primaryErr), tenantId: body.tenantId }, "Embed request failed");
      res.status(502).json({ error: "Embedding backend error", detail: String(primaryErr), traceId });
      return;
    }
  }

  const processingMs = Date.now() - embedStart;
  const completedAt = new Date().toISOString();
  const dimensions = vectors[0]?.length ?? 0;

  const evidenceEntries = body.texts.map((_text, i) => {
    const entryId = randomUUID();
    const entry = {
      entryId,
      requestId: body.requestId,
      tenantId: tenantId,
      profileId: profile.profileId,
      profileVersion: profile.version,
      chunkId: `embed-${body.requestId}-${i}`,
      sourceId: "embed-request",
      boostApplied: false,
      finalScore: 1.0,
      policyAllow: true,
      policyReasons: policyDecision.reasons,
      redactedFields: policyDecision.redactions,
      requestedAt,
      completedAt,
    };

    defaultLedgerStore.append(entry);
    return entry;
  });

  const response = {
    requestId: body.requestId,
    tenantId: body.tenantId,
    model: body.model ?? "aef-dev-hash",
    dimensions,
    vectors: vectors.map((vector, i) => ({
      index: i,
      text: body.texts[i],
      vector,
    })),
    processingMs,
    traceId,
    evidenceIds: evidenceEntries.map((e) => e.entryId),
    policyReasons: policyDecision.reasons,
  };

  logger.info({ traceId, requestId: body.requestId, count: body.texts.length, processingMs }, "embed completed");
  res.status(200).json(response);
}) as unknown as RequestHandler);
