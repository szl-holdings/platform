import type { IRouter } from 'express';
import { lazyMatch, } from '../../lib/lazy-router';
import { perUserApiSlidingLimiter } from '../../middlewares/sliding-window-limiter';

export function register(router: IRouter): void {
  router.use('/cross-platform', perUserApiSlidingLimiter);
  router.use(lazyMatch('/cross-platform', () => import('../cross-platform'), 'cross-platform'));
}
