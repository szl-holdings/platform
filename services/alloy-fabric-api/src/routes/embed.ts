import type { Router, Request, Response } from "express";
import { EmbedRequestSchema } from "@workspace/aef-contracts";
import { LocalCpuBackend, createDefaultBackend } from "@workspace/alloy-vector-worker";
import type { EmbedInput } from "@workspace/alloy-vector-worker";
import { getRequestId } from "../middleware/request-id.js";
import { getTenantId } from "../middleware/tenant.js";
import { storageBundle, tenantEnforcer, policyEngine, defaultLedgerStore } from "../context.js";
import { logger } from "../logger.js";
import type { PolicyContext } from "@workspace/aef-policy-guard";
import { randomUUID } from "node:crypto";

// Select backend based on environment — defaults to LocalCpuBackend on Replit
const embeddingBackend = createDefaultBackend();

export function registerEmbedRoute(router: Router): void {
  router.post("/v1/embed", async (req: Request, res: Response) => {
    const parsed = EmbedRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", issues: parsed.error.issues });
      return;
    }

    const { requestId, texts, model, profileId } = parsed.data;
    const tenantId = getTenantId(res);
    const startMs = Date.now();
    const reqId = requestId || getRequestId(req);
    const requestedAt = new Date().toISOString();

    // Tenant boundary + policy enforcement — uniform across all /v1/* routes
    const policyCtx: PolicyContext = {
      requestId: reqId,
      tenantId,
      hasProvenance: true,
      ...(profileId !== undefined ? { profileId } : {}),
    };
    const tenantDecision = tenantEnforcer.enforce(policyCtx);
    if (tenantDecision !== null && !tenantDecision.allow) {
      res.status(403).json({ error: "tenant_not_registered", reasons: tenantDecision.reasons, appliedRuleIds: tenantDecision.appliedRuleIds });
      return;
    }
    const policyDecision = policyEngine.evaluate(policyCtx);
    if (!policyDecision.allow) {
      res.status(403).json({ error: "policy_denied", reasons: policyDecision.reasons, appliedRuleIds: policyDecision.appliedRuleIds });
      return;
    }

    // Check backend availability; fall back to LocalCpuBackend if needed
    const isAvailable = await embeddingBackend.isAvailable();
    const backend = isAvailable ? embeddingBackend : new LocalCpuBackend();
    const resolvedModel = model ?? backend.modelRef;

    const inputs: EmbedInput[] = texts.map((text: string, index: number) => ({
      chunkId: `embed-${reqId}-${index}`,
      text,
      modelRef: resolvedModel,
      profileId: profileId ?? "default",
      inputType: "passage" as const,
    }));

    const outputs = await backend.embed(inputs);

    const completedAt = new Date().toISOString();

    // Ledger write — every embed operation is governed and auditable
    let ledgerFailures = 0;
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i]!;
      try {
        defaultLedgerStore.append({
          entryId: randomUUID(),
          requestId: reqId,
          tenantId,
          ...(profileId !== undefined ? { profileId } : {}),
          chunkId: output.chunkId,
          sourceId: `embed:${reqId}`,
          fusedScore: 0,
          boostApplied: false,
          finalScore: 0,
          policyAllow: policyDecision.allow,
          policyReasons: policyDecision.reasons,
          redactedFields: policyDecision.redactions,
          requestedAt,
          completedAt,
          backendId: `${backend.kind}:${resolvedModel}`,
          stageTimings: { embed: output.latencyMs ?? 0 },
          scoreBreakdown: { tokenCount: output.tokenCount ?? 0 },
        });
      } catch (err) {
        ledgerFailures++;
        logger.error("embed ledger write failed", { chunkId: output.chunkId, reqId, err: String(err) });
      }
    }

    logger.info("embed completed", { reqId, tenantId, count: outputs.length, backend: backend.kind, processingMs: Date.now() - startMs });

    res.json({
      requestId: reqId,
      tenantId,
      traceId: randomUUID(),
      model: resolvedModel,
      backend: backend.kind,
      dimensions: backend.dimensions,
      vectors: outputs.map((o, index) => ({
        index,
        text: texts[index],
        vector: o.vector,
        tokenCount: o.tokenCount,
        latencyMs: o.latencyMs,
      })),
      ...(ledgerFailures > 0 ? { ledgerFailures } : {}),
      processingMs: Date.now() - startMs,
    });
  });
}
