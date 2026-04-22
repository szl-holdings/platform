import type { IRouter } from 'express';
import { lazyMatch, } from '../../lib/lazy-router';
import { perUserApiSlidingLimiter } from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

export function register(router: IRouter): void {
  router.use('/skills', tenantScope({ required: true }));
  router.use('/skill-runs', tenantScope({ required: true }));

  router.use('/skills', perUserApiSlidingLimiter);
  router.use('/skill-runs', perUserApiSlidingLimiter);
  router.use(lazyMatch(['/skills', '/skill-runs'], () => import('../skills'), 'skills'));
}
