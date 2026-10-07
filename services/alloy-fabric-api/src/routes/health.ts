import type { IRouter, Request, Response } from 'express';
import { getEmbeddingBackend, verifyEmbeddingBackendReadiness } from '../embedding-backend.js';
import { buildFabricProductionHold, isFabricProduction } from '../production-readiness.js';

const startedAt = new Date().toISOString();

export function registerHealthRoute(router: IRouter): void {
  router.get('/health', (_req: Request, res: Response) => {
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

  router.get('/ready', readinessHandler);

  // Standard Kubernetes probe aliases
  router.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'alive', productionReady: !isFabricProduction() });
  });

  router.get('/readyz', readinessHandler);
}
