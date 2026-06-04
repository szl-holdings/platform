import type { IRouter, Request, Response } from 'express';

const startedAt = new Date().toISOString();

export function registerHealthRoute(router: IRouter): void {
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'alloy-fabric-api',
      version: process.env.npm_package_version ?? '0.0.0',
      startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  router.get('/ready', (_req: Request, res: Response) => {
    res.json({ ready: true });
  });

  // Standard Kubernetes probe aliases
  router.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  router.get('/readyz', (_req: Request, res: Response) => {
    res.status(200).json({ ready: true });
  });
}
