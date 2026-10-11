import type { IRouter, Request, Response } from 'express';
import { getEmbeddingBackend, verifyEmbeddingBackendReadiness } from '../embedding-backend.js';
import { createGlobalRateLimit } from '../middleware/rate-limit.js';
import { buildFabricProductionHold, isFabricProduction } from '../production-readiness.js';

const startedAt = new Date().toISOString();

export function registerHealthRoute(router: IRouter): void {
  const probeRateLimit = createGlobalRateLimit();
  router.get('/health', probeRateLimit, (_req: Request, res: Response) => {
    res.json({
      status: 'alive',
      service: 'alloy-fabric-api',
      productionReady: !isFabricProduction(),
      version: process.env.npm_package_version ?? '0.0.0',
      startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  const readinessHandler = async (_req: Request, res: Response) => {
    if (isFabricProduction()) {
      res.setHeader('X-Evidence-State', 'UNAVAILABLE');
      res.status(503).json(buildFabricProductionHold());
      return;
    }
    const backend = getEmbeddingBackend();
    const ready = await verifyEmbeddingBackendReadiness();
    res.status(ready ? 200 : 503).json({
      ready,
      backend: backend.kind,
      modelRef: backend.modelRef,
    });
  };

  router.get('/ready', probeRateLimit, readinessHandler);

  // Standard Kubernetes probe aliases
  router.get('/healthz', probeRateLimit, (_req: Request, res: Response) => {
    res.status(200).json({ status: 'alive', productionReady: !isFabricProduction() });
  });

  router.get('/readyz', probeRateLimit, readinessHandler);
}
