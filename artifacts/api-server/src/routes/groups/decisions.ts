import type { IRouter } from 'express';
import { lazyMatch, } from '../../lib/lazy-router';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

export function register(router: IRouter): void {
  // NOTE: decisionsRuntimeRouter is mounted early in routes/index.ts BEFORE
  // ai.register(), because copilotRouter is mounted globally in ai.register()
  // with tenantScope({ required: true }) which would otherwise block anonymous
  // requests. The early mount in index.ts handles all /decision-runtime/* routes.

  // Existing decisioning routes — require tenant scope
  router.use('/decisioning', tenantScope({ required: true }));
  router.use('/decision-fabric', tenantScope({ required: true }));

  router.use('/decisioning', perUserApiSlidingLimiter);
  router.use(lazyMatch('/decisioning', () => import('../decisioning'), 'decisioning'));
  router.use('/decision-fabric', perUserApiSlidingLimiter);
  router.use(lazyMatch('/decision-fabric', () => import('../decision-fabric'), 'decision-fabric'));

  // Decision Receipts — require tenant scope
  router.use('/decisions', tenantScope({ required: true }));
  router.use('/decisions', perUserWriteSlidingLimiter);
  router.use(lazyMatch('/decisions', () => import('../decisions-receipts'), 'decisions-receipts'));
}
