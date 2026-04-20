import type { IRouter } from 'express';
import { lazyMatch, lazyMount } from '../../lib/lazy-router';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

// Canonical Lyte API surface (post task #2330 consolidation):
//   - /lyte/<resource>            CRUD over Lyte-domain tables (lyte.ts)
//   - /lyte/live/<feed>           Live external/computed feeds (lyte-live.ts + lyte.ts)
//   - /lyte/billing/*             Billing surface (lyte-billing.ts)
//   - /lyte/observability/*       Observability surface (lyte-observability.ts)
//   - /lyte/cognitive/*           Cognitive surface (lyte-cognitive.ts)
export function register(router: IRouter): void {
  router.use('/lyte', tenantScope({ required: true }));

  router.use('/lyte', _readLimiter);
  router.use('/lyte/billing', _writeLimiter);
  router.use(lazyMatch('/lyte', () => import('../lyte-billing'), 'lyte-billing'));

  router.use(
    '/lyte',
    lazyMount(() => import('../lyte-extended'), 'lyte-extended'),
  );
  router.use(lazyMatch('/lyte', () => import('../lyte-observability'), 'lyte-observability'));

  router.use(lazyMatch('/lyte', () => import('../lyte'), 'lyte'));

  router.use('/lyte', _readLimiter);
  router.use(lazyMatch('/lyte', () => import('../lyte-live'), 'lyte-live'));

  router.use('/lyte/cognitive', _readLimiter);
  router.use(lazyMatch('/lyte', () => import('../lyte-cognitive'), 'lyte-cognitive'));
}
