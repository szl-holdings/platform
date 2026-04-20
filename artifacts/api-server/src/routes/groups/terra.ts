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
  // Property intelligence module routes are public (demo-friendly, authOptional).
  // They MUST be registered before the tenantScope middleware on "/terra" so
  // unauthenticated visitors can access property-scoped intelligence data.
  router.use(lazyMatch('/terra', () => import('../terra-property-intel'), 'terra-property-intel'));
  router.use(
    lazyMatch('/terra', () => import('../terra-portfolio-intel'), 'terra-portfolio-intel'),
  );
  // Why This Property Now — public, demo-friendly, no auth required.
  router.use(
    lazyMatch('/terra', () => import('../terra-why-this-property'), 'terra-why-this-property'),
  );

  router.use('/terra', tenantScope({ required: true }));

  router.use('/terra', _readLimiter);
  router.use(lazyMatch('/terra', () => import('../terra'), 'terra'));

  router.use('/terra', _readLimiter);
  router.use(lazyMatch('/terra', () => import('../terra-distress'), 'terra-distress'));

  router.use('/terra', _readLimiter);
  router.use(lazyMatch('/terra', () => import('../terra-broker'), 'terra-broker'));

  router.use('/terra', _writeLimiter);
  router.use(lazyMatch('/terra-crm', () => import('../terra-crm'), 'terra-crm'));

  router.use('/terra', _readLimiter);
  router.use(lazyMatch('/terra', () => import('../terra-live'), 'terra-live'));

  router.use('/terra', _readLimiter);
  router.use(lazyMatch('/terra', () => import('../terra-cognitive'), 'terra-cognitive'));

  router.use('/terra', _writeLimiter);
  router.use(lazyMatch('/terra', () => import('../terra-modules'), 'terra-modules'));

  router.use('/terra', _readLimiter);
  router.use(lazyMatch('/terra', () => import('../terra-digital-twin'), 'terra-digital-twin'));
}
