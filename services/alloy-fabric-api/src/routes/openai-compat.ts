import { randomUUID } from 'node:crypto';
import { OpenAIEmbedRequestSchema } from '@workspace/aef-contracts';
import type { PolicyContext } from '@workspace/aef-policy-guard';
import type { Request, Response, Router } from 'express';
import { defaultLedgerStore, policyEngine, tenantEnforcer } from '../context.js';
import { logger } from '../logger.js';
import { getRequestId } from '../middleware/request-id.js';
import { getTenantId } from '../middleware/tenant.js';

function stubEmbedVector(text: string, dims = 1536): number[] {
  const v = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    v[i % dims] = v[i % dims]! + text.charCodeAt(i) / 255;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export function registerOpenAICompatRoute(router: Router): void {
  router.post('/v1/openai/embeddings', (req: Request, res: Response) => {
    const parsed = OpenAIEmbedRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          message: 'Invalid request',
          type: 'invalid_request_error',
          code: 'validation_error',
        },
      });
      return;
    }

    const { input, model, dimensions } = parsed.data;
    const tenantId = getTenantId(res);
    const reqId = getRequestId(req);
    const requestedAt = new Date().toISOString();
    const startMs = Date.now();

    // Tenant boundary + policy enforcement — uniform across all /v1/* routes
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

    const texts = Array.isArray(input) ? input : [input];
    const dims = dimensions ?? 1536;
    const resolvedModel = model ?? 'aef-embed-cpu-v1';

    const data = texts.map((text, index) => ({
      object: 'embedding' as const,
      embedding: stubEmbedVector(text, dims),
      index,
    }));

    const totalTokens = texts.reduce((s, t) => s + Math.ceil(t.split(/\s+/).length * 1.3), 0);
    const completedAt = new Date().toISOString();

    // Ledger write — OpenAI-compat embed path is governed and auditable
    let ledgerFailures = 0;
    for (let i = 0; i < texts.length; i++) {
      const chunkId = `openai-embed:${reqId}:${i}`;
      try {
        defaultLedgerStore.append({
          entryId: randomUUID(),
          requestId: reqId,
          tenantId,
          chunkId,
          sourceId: `openai-embed:${reqId}`,
          fusedScore: 0,
          boostApplied: false,
          finalScore: 0,
          policyAllow: policyDecision.allow,
          policyReasons: policyDecision.reasons,
          redactedFields: policyDecision.redactions,
          requestedAt,
          completedAt,
          backendId: `openai-compat:${resolvedModel}`,
        });
      } catch (err) {
        ledgerFailures++;
        logger.error('openai-embed ledger write failed', { chunkId, reqId, err: String(err) });
      }
    }

    logger.info('openai-embed completed', {
      reqId,
      tenantId,
      count: texts.length,
      processingMs: Date.now() - startMs,
    });

    res.json({
      object: 'list' as const,
      data,
      model: resolvedModel,
      usage: { prompt_tokens: totalTokens, total_tokens: totalTokens },
      ...(ledgerFailures > 0 ? { ledgerFailures } : {}),
    });
  });
}
