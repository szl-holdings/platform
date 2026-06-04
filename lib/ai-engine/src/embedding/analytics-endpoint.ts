import type { Router as ExpressRouter, Request, Response } from 'express';
import { embeddingAnalytics } from './analytics.js';
import { type EmbeddingDomain, getAllDomainConfigs, getDomainModelConfig, inferDomain } from './domain-config.js';
import { embeddingPipeline } from './provider.js';

export async function createEmbeddingAnalyticsRouter(): Promise<ExpressRouter> {
  const { Router } = await import('express');
  const router = Router();

  router.get('/embedding/analytics', (_req: Request, res: Response) => {
    try {
      const report = embeddingAnalytics.getAnalyticsReport();
      const providerHealth = embeddingPipeline.getProviderHealth();
      const domainConfigs = getAllDomainConfigs().map((c) => ({
        domain: c.domain,
        model: c.model,
        hfModel: c.hfModel,
        dimensions: c.dimensions,
        preferredProvider: c.preferredProvider,
        description: c.description,
      }));

      res.json({
        ok: true,
        report: {
          ...report,
          providerHealth,
          domainConfigs,
        },
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  router.get('/embedding/health', (_req: Request, res: Response) => {
    try {
      const providerHealth = embeddingPipeline.getProviderHealth();
      const availableProviders = Object.entries(providerHealth)
        .filter(([, h]) => h.available)
        .map(([p]) => p);

      res.json({
        ok: true,
        status:
          availableProviders.length > 1
            ? 'healthy'
            : availableProviders.length === 1
              ? 'degraded'
              : 'unavailable',
        availableProviders,
        providerHealth,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  router.post('/embedding/batch', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        texts?: unknown;
        domain?: string;
        model?: string;
        concurrency?: number;
      };

      if (!Array.isArray(body.texts) || body.texts.length === 0) {
        res.status(400).json({ ok: false, error: 'texts must be a non-empty array' });
        return;
      }

      const texts = (body.texts as unknown[]).map((t, i) => {
        if (typeof t !== 'string') throw new Error(`texts[${i}] must be a string`);
        return t;
      });

      const domain = body.domain ? (inferDomain(body.domain) as EmbeddingDomain) : undefined;
      const domainConfig = domain ? getDomainModelConfig(domain) : undefined;

      const rawConcurrency = typeof body.concurrency === 'number' ? body.concurrency : 5;
      const concurrency = Math.max(
        1,
        Math.min(
          50,
          Number.isFinite(rawConcurrency) && rawConcurrency > 0 ? Math.floor(rawConcurrency) : 5,
        ),
      );

      const _batchModel = body.model || domainConfig?.model;
      const batchResult = await embeddingPipeline.embedBatch(texts, {
        ...(domain !== undefined ? { domain } : {}),
        ...(_batchModel !== undefined ? { model: _batchModel } : {}),
        concurrency,
      });

      res.json({
        ok: true,
        totalLatencyMs: batchResult.totalLatencyMs,
        successCount: batchResult.successCount,
        errorCount: batchResult.errorCount,
        provider: batchResult.provider,
        model: batchResult.model,
        results: batchResult.results.map((r) => ({
          index: r.index,
          dimensions: r.dimensions,
          model: r.model,
          provider: r.provider,
          latencyMs: r.latencyMs,
          cached: r.cached,
          error: r.error ?? null,
          embedding: r.error ? null : r.embedding,
        })),
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  router.post('/embedding/single', async (req: Request, res: Response) => {
    try {
      const body = req.body as { text?: unknown; domain?: string; model?: string };

      if (typeof body.text !== 'string' || !body.text.trim()) {
        res.status(400).json({ ok: false, error: 'text must be a non-empty string' });
        return;
      }

      const domain = body.domain ? (inferDomain(body.domain) as EmbeddingDomain) : undefined;
      const domainConfig = domain ? getDomainModelConfig(domain) : undefined;

      const _singleModel = body.model || domainConfig?.model;
      const result = await embeddingPipeline.embed(body.text, {
        ...(domain !== undefined ? { domain } : {}),
        ...(_singleModel !== undefined ? { model: _singleModel } : {}),
      });

      res.json({
        ok: true,
        dimensions: result.dimensions,
        model: result.model,
        provider: result.provider,
        latencyMs: result.latencyMs,
        cached: result.cached,
        embedding: result.embedding,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return router;
}

export async function getEmbeddingAnalytics() {
  const report = embeddingAnalytics.getAnalyticsReport();
  const providerHealth = embeddingPipeline.getProviderHealth();
  const domainConfigs = getAllDomainConfigs();

  return {
    ...report,
    providerHealth,
    domainConfigs,
  };
}
