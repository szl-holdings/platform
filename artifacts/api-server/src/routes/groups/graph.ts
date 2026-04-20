import type { IRouter } from 'express';
import { lazyMatch } from '../../lib/lazy-router';
import { perUserApiSlidingLimiter } from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

export function register(router: IRouter): void {
  // /graph/stream is registered BEFORE the tenantScope middleware so the
  // CONSTELLATION World Model can render live entity/edge updates without
  // requiring tenant membership (e.g. demo / unauthenticated previews).
  // Once the SSE handler starts streaming it never calls next(), so the
  // tenant-scoped chain below is effectively bypassed for this path.
  router.use(lazyMatch('/graph/stream', () => import('../graph-stream'), 'graph-stream'));

  router.use('/graph', tenantScope({ required: true }));

  router.use('/graph', perUserApiSlidingLimiter);
  router.use(lazyMatch('/graph', () => import('../graph'), 'graph'));
}
