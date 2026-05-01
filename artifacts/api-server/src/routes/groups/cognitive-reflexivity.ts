/**
 * Route group: /cognitive-reflexivity
 * Auth: none required for read endpoints (public observability), but write
 *       endpoints (approve/reject/observations) are tenant-scoped.
 */
import type { IRouter } from 'express';
import { lazyMatch } from '../../lib/lazy-router';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';

export function register(router: IRouter): void {
  router.use('/cognitive-reflexivity', perUserApiSlidingLimiter);
  router.use('/cognitive-reflexivity/strategies/:id/approve', perUserWriteSlidingLimiter);
  router.use('/cognitive-reflexivity/strategies/:id/reject', perUserWriteSlidingLimiter);
  router.use('/cognitive-reflexivity/observations', perUserWriteSlidingLimiter);
  router.use(
    lazyMatch('/cognitive-reflexivity', () => import('../cognitive-reflexivity'), 'cognitive-reflexivity'),
  );
}
