import type { IRouter } from 'express';
import { lazyMatch, lazyMount } from '../../lib/lazy-router';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use('/prism-counsel', tenantScope({ required: true }));

  router.use('/prism-counsel', _readLimiter);
  router.use('/prism-counsel', _writeLimiter);
  router.use(
    lazyMatch('/prism-counsel', () => import('../prism-counsel-core'), 'prism-counsel-core'),
  );
  router.use(
    '/prism-counsel',
    lazyMount(() => import('../prism-counsel-ops'), 'prism-counsel-ops'),
  );
  router.use(
    '/prism-counsel/s31',
    lazyMount(() => import('../prism-counsel-s31'), 'prism-counsel-s31'),
  );
  router.use(
    '/prism-counsel/pilot',
    lazyMount(
      () => import('../prism-counsel-pilot').then((m) => ({ default: m.prismCounselPilotRouter })),
      'prism-counsel-pilot',
    ),
  );
  router.use(
    '/prism-counsel/pilot-one',
    lazyMount(
      () =>
        import('../prism-counsel-pilot-one').then((m) => ({
          default: m.prismCounselPilotOneRouter,
        })),
      'prism-counsel-pilot-one',
    ),
  );
  router.use(
    '/prism-counsel',
    lazyMount(() => import('../prism-counsel-review'), 'prism-counsel-review'),
  );
  router.use(
    '/prism-counsel',
    lazyMount(() => import('../prism-counsel-purview'), 'prism-counsel-purview'),
  );
  router.use(
    '/prism-counsel',
    lazyMount(() => import('../prism-counsel-court'), 'prism-counsel-court'),
  );
  router.use(lazyMatch('/prism-counsel', () => import('../prism-counsel-ny'), 'prism-counsel-ny'));
}
