import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  semanticCache,
  priorityQueue,
  analyzeContext,
  initializeDomainCacheTtls,
  DOMAIN_CACHE_TTLS,
} from "../lib/ai-gateway-resilience";
import { gatewayInfer } from "../lib/ai-gateway";
import type { GatewayRequest } from "../lib/ai-gateway";
import type { RequestPriority } from "../lib/ai-gateway-resilience";

const router = Router();

router.use(authMiddleware());

initializeDomainCacheTtls();

function str(v: unknown): string { return String(v ?? ""); }
function optStr(v: unknown): string | undefined { return v != null ? String(v) : undefined; }

// ─── Cache Stats ──────────────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = semanticCache.getStats();
    const queueStats = priorityQueue.getStats();
    res.json({
      cache: {
        ...stats,
        hitRatePct: Math.round(stats.hitRate * 100),
      },
      queue: queueStats,
      domainTtls: DOMAIN_CACHE_TTLS,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cache Entries ────────────────────────────────────────────────────────────

router.get("/cache/entries", async (req: Request, res: Response): Promise<void> => {
  try {
    const domain = optStr(req.query["domain"]);
    const limit = Math.min(parseInt(String(req.query["limit"] ?? "20"), 10), 100);
    const entries = await semanticCache.listEntries(domain, limit);
    res.json({ entries, count: entries.length, domain: domain ?? "all" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cache Invalidation ───────────────────────────────────────────────────────

router.delete("/cache/domain/:domain", async (req: Request, res: Response): Promise<void> => {
  try {
    const domain = str(req.params["domain"]);
    if (!domain) { res.status(400).json({ error: "domain required" }); return; }
    const count = await semanticCache.invalidateDomain(domain);
    logger.info({ domain, count }, "Cache invalidated for domain");
    res.json({ success: true, domain, invalidatedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/cache/entry/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    if (!id) { res.status(400).json({ error: "id required" }); return; }
    const deleted = await semanticCache.invalidateById(id);
    res.json({ success: deleted, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Domain TTL Config ────────────────────────────────────────────────────────

router.post("/cache/ttl/:domain", async (req: Request, res: Response): Promise<void> => {
  try {
    const domain = str(req.params["domain"]);
    const { ttlMs } = req.body as { ttlMs?: number };
    if (!domain || !ttlMs || ttlMs < 60000) {
      res.status(400).json({ error: "domain required and ttlMs must be >= 60000ms" });
      return;
    }
    semanticCache.setDomainTtl(domain, ttlMs);
    res.json({ success: true, domain, ttlMs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Context Analysis ─────────────────────────────────────────────────────────

router.post("/context/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, model } = req.body as {
      messages?: Array<{ role: string; content: string }>;
      model?: string;
    };
    if (!messages?.length) { res.status(400).json({ error: "messages required" }); return; }
    const targetModel = model ?? "gpt-5.2";
    const analysis = analyzeContext(messages, targetModel);
    res.json({ model: targetModel, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Priority Queue Stats ─────────────────────────────────────────────────────

router.get("/queue/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = priorityQueue.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Priority Inference (cached + queued) ────────────────────────────────────

router.post("/infer", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, priority, model, domain, agentId, strategy, preferredProvider, maxTokens, timeoutMs, maxRetries, disableCache } = req.body as {
      messages?: Array<{ role: string; content: string }>;
      priority?: RequestPriority;
      model?: string;
      domain?: string;
      agentId?: string;
      strategy?: GatewayRequest["strategy"];
      preferredProvider?: GatewayRequest["preferredProvider"];
      maxTokens?: number;
      timeoutMs?: number;
      maxRetries?: number;
      disableCache?: boolean;
    };

    if (!messages?.length) { res.status(400).json({ error: "messages required" }); return; }

    const resolvedDomain = domain ?? "general";
    const resolvedPriority = priority ?? "normal";

    if (!disableCache) {
      const cached = await semanticCache.lookup(messages, resolvedDomain);
      if (cached) {
        return void res.json({
          content: cached.response,
          model: cached.model,
          provider: cached.provider,
          usage: cached.usage,
          estimatedCostUsd: 0,
          confidence: null,
          routing: {
            strategy: strategy ?? "fastest",
            selectedProvider: cached.provider,
            attemptedProviders: [cached.provider],
            retryCount: 0,
            totalLatencyMs: 0,
            cached: true,
          },
          telemetryId: `cache-${cached.id}`,
          priority: resolvedPriority,
        });
      }
    }

    const gatewayRequest: GatewayRequest = {
      messages,
      model,
      domain: resolvedDomain,
      agentId: agentId ?? "api",
      strategy,
      preferredProvider,
      maxTokens,
      timeoutMs,
      maxRetries,
    };

    const response = await new Promise<Awaited<ReturnType<typeof gatewayInfer>>>((resolve, reject) => {
      const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      priorityQueue.enqueue({
        id,
        priority: resolvedPriority,
        domain: resolvedDomain,
        agentId: agentId ?? "api",
        enqueuedAt: Date.now(),
        resolve,
        reject,
        execute: () => gatewayInfer(gatewayRequest),
      });
    });

    if (!disableCache) {
      await semanticCache.store(messages, resolvedDomain, response).catch(() => {});
    }

    res.json({ ...response, priority: resolvedPriority });
  } catch (err: any) {
    logger.error({ err }, "Priority inference failed");
    res.status(500).json({ error: err.message });
  }
});

// ─── Streaming Inference ──────────────────────────────────────────────────────

router.post("/infer/stream", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, domain, agentId, model, strategy, preferredProvider, maxTokens } = req.body as {
      messages?: Array<{ role: string; content: string }>;
      domain?: string;
      agentId?: string;
      model?: string;
      strategy?: GatewayRequest["strategy"];
      preferredProvider?: GatewayRequest["preferredProvider"];
      maxTokens?: number;
    };

    if (!messages?.length) { res.status(400).json({ error: "messages required" }); return; }

    const resolvedDomain = domain ?? "general";
    const startTime = Date.now();

    const cached = await semanticCache.lookup(messages, resolvedDomain);

    let content: string;
    let streamProvider: string;
    let streamModel: string;
    let fromCache = false;

    if (cached) {
      content = cached.response;
      streamProvider = cached.provider;
      streamModel = cached.model;
      fromCache = true;
    } else {
      const response = await gatewayInfer({ messages, model, domain: resolvedDomain, agentId, strategy, preferredProvider, maxTokens });
      await semanticCache.store(messages, resolvedDomain, response).catch(() => {});
      content = response.content;
      streamProvider = response.provider;
      streamModel = response.model;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const words = content.split(/(\s+)/);
    let firstTokenEmitted = false;

    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join("");
      if (!firstTokenEmitted && chunk.trim()) {
        const ttft = Date.now() - startTime;
        res.write(`data: ${JSON.stringify({ token: chunk, index: Math.floor(i / 3), done: false, timeToFirstTokenMs: ttft, provider: streamProvider, model: streamModel, cached: fromCache })}\n\n`);
        firstTokenEmitted = true;
      } else {
        res.write(`data: ${JSON.stringify({ token: chunk, index: Math.floor(i / 3), done: false })}\n\n`);
      }
      await new Promise(r => setTimeout(r, 15));
      if (res.writableEnded) break;
    }

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ token: "", done: true, totalLatencyMs: Date.now() - startTime, provider: streamProvider, model: streamModel, cached: fromCache })}\n\n`);
      res.end();
    }
  } catch (err: any) {
    logger.error({ err }, "Streaming inference failed");
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
      res.end();
    }
  }
});

export default router;
