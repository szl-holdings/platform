import type { IRouter } from 'express';
import { lazyMatch, } from '../../lib/lazy-router';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

export function register(router: IRouter): void {
  router.use('/verifier', tenantScope({ required: true }));

  router.use('/verifier', perUserApiSlidingLimiter);
  router.post('/verifier', perUserWriteSlidingLimiter);
  router.use(lazyMatch('/verifier', () => import('../verifier'), 'verifier'));
}
