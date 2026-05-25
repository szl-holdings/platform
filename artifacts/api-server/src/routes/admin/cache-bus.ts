import type { IRouter } from 'express';
import { getCacheBusStatus } from '../../lib/cache-invalidation-bus.js';

export function register(router: IRouter): void {
  router.get('/admin/cache-bus', (_req, res) => {
    const status = getCacheBusStatus();
    res.json({
      timestamp: new Date().toISOString(),
      ...status,
    });
  });
}
