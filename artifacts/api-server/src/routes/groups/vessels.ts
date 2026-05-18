import type { IRouter } from 'express';
import { lazyMatch, } from '../../lib/lazy-router';
import { perUserApiSlidingLimiter } from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

export function register(router: IRouter): void {
  router.use('/vessels', tenantScope({ required: true }));
  router.use('/vessels', perUserApiSlidingLimiter);

  router.use(lazyMatch('/vessels', () => import('../vessels'), 'vessels'));
  router.use(lazyMatch('/vessels', () => import('../vessels-extended'), 'vessels-extended'));
  router.use(lazyMatch('/vessels', () => import('../vessels-psc'), 'vessels-psc'));
  router.use(lazyMatch('/vessels', () => import('../vessels-platform'), 'vessels-platform'));
  router.use(lazyMatch('/vessels', () => import('../vessels-live'), 'vessels-live'));
  router.use(lazyMatch('/vessels', () => import('../vessels-trading'), 'vessels-trading'));
  router.use(lazyMatch('/vessels', () => import('../vessels-insurance'), 'vessels-insurance'));
  router.use(lazyMatch('/vessels', () => import('../vessels-cognitive'), 'vessels-cognitive'));
  router.use(
    lazyMatch('/vessels', () => import('../vessels-digital-twin'), 'vessels-digital-twin'),
  );
  router.use(lazyMatch('/vessels', () => import('../vessels-modules'), 'vessels-modules'));
  router.use(lazyMatch('/vessels', () => import('../vessels-voyage-risk'), 'vessels-voyage-risk'));
  router.use(lazyMatch('/vessels', () => import('../vessels-freight'), 'vessels-freight'));
  router.use(lazyMatch('/vessels', () => import('../vessels-sanctions-network'), 'vessels-sanctions-network'));
  router.use(lazyMatch('/vessels', () => import('../vessels-forecasts'), 'vessels-forecasts'));
  router.use(lazyMatch('/vessels', () => import('../vessels-formula-thesis'), 'vessels-formula-thesis'));

  // Vessels Operational Core — Series A executive aggregator over all
  // vessels-* sub-routers above. Surfaces live counts, module health,
  // inherited mechanisms, formula pillars, DOI proof bindings. Read-only.
  router.use(lazyMatch('/vessels', () => import('../vessels-ops-core'), 'vessels-ops-core'));
}
