import type { IRouter } from 'express';
import { lazyMatch, lazyRegisterMatch } from '../../lib/lazy-router';
import {
  idempotencyMiddleware,
  optionalIdempotencyMiddleware,
} from '../../middlewares/idempotency';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use('/billing', tenantScope({ required: true }));
  router.use('/metering', tenantScope({ required: true }));
  router.use('/usage', tenantScope({ required: true }));
  router.use('/notifications', tenantScope({ required: true }));
  router.use('/projects', tenantScope({ required: true }));
  router.use('/connectors', tenantScope({ required: true }));
  router.use('/feature-flags', tenantScope({ required: true }));
  router.use('/partner', tenantScope({ required: true }));
  router.use('/services', tenantScope({ required: true }));

  router.use('/billing', _writeLimiter);
  router.use('/billing', optionalIdempotencyMiddleware);
  router.use('/billing/checkout', idempotencyMiddleware);
  router.use('/billing/terra/subscribe', idempotencyMiddleware);
  router.use('/billing/cancel-subscription', idempotencyMiddleware);
  router.use('/billing/update-subscription', idempotencyMiddleware);
  router.use(lazyMatch(['/billing', '/stripe'], () => import('../billing'), 'billing'));
  router.use(lazyMatch('/billing/tax', () => import('../billing-tax'), 'billing-tax'));

  router.use('/metering', _readLimiter);
  router.use('/metering', _writeLimiter);
  router.use(lazyRegisterMatch('/metering', () => import('../metering'), 'metering'));

  router.use(lazyMatch('/orgs', () => import('../usage'), 'usage'));

  router.use('/partner', _writeLimiter);
  router.use('/partner', _readLimiter);
  router.use('/org-branding', _readLimiter);
  router.use('/orgs/:orgId/branding', _writeLimiter);
  router.use('/orgs/:orgId/custom-domains', _writeLimiter);
  router.use('/resolve-domain', _readLimiter);
  router.use(
    lazyMatch(
      ['/partner', '/org-branding', '/orgs', '/resolve-domain'],
      () => import('../partner-portal'),
      'partner-portal',
    ),
  );

  router.use('/feature-flags', _writeLimiter);
  router.use(lazyMatch('/feature-flags', () => import('../feature-flags'), 'feature-flags'));

  router.use('/notifications', _writeLimiter);
  router.use(lazyMatch('/notifications', () => import('../notifications'), 'notifications'));

  router.use('/projects', _writeLimiter);
  router.use(lazyMatch('/projects', () => import('../projects'), 'projects'));

  router.use(lazyMatch('/services', () => import('../services'), 'services'));

  router.use('/connectors', _writeLimiter);
  router.use(lazyMatch('/connectors', () => import('../connectors'), 'connectors'));

  router.use('/billing/intl', _writeLimiter);
  router.use('/billing/intl', optionalIdempotencyMiddleware);
  router.use(
    lazyMatch(
      ['/billing/intl', '/billing/disputes'],
      () => import('../international-payment-rails'),
      'international-payment-rails',
    ),
  );

  router.use('/billing/disputes', _writeLimiter);
  router.use(
    lazyMatch(
      '/billing/disputes',
      () => import('../billing-disputes'),
      'billing-disputes',
    ),
  );

  router.use('/billing/net30', _readLimiter);
  router.use('/billing/net30', _writeLimiter);
  router.use(
    lazyMatch(
      '/billing/net30',
      () => import('../billing-net30'),
      'billing-net30',
    ),
  );

  router.use('/billing/ach', _writeLimiter);
  router.use('/billing/ach', optionalIdempotencyMiddleware);
  router.use('/billing/crypto', _writeLimiter);
  router.use('/billing/crypto', optionalIdempotencyMiddleware);
  router.use('/billing/rails', _readLimiter);
  router.use('/billing/rails', _writeLimiter);
  router.use(
    lazyMatch(
      ['/billing/ach', '/billing/crypto', '/billing/rails'],
      () => import('../billing-rails'),
      'billing-rails',
    ),
  );

  // Webhook routes must NOT be under /billing (which has tenantScope({ required: true })).
  // External providers (Plaid, Coinbase Commerce) send unauthenticated HTTP POST requests;
  // they cannot provide a tenant auth token. Signature verification in the handler provides
  // the necessary security. A per-IP rate limiter is used instead of per-user.
  router.use('/webhooks/plaid', _readLimiter);
  router.use('/webhooks/coinbase', _readLimiter);
  router.use(
    lazyMatch(
      ['/webhooks/plaid', '/webhooks/coinbase'],
      () => import('../billing-rails'),
      'billing-rails-webhooks',
    ),
  );

  router.use('/treasury', tenantScope({ required: true }));
  router.use('/treasury', _readLimiter);
  router.use('/treasury', _writeLimiter);
  router.use(lazyMatch('/treasury', () => import('../treasury'), 'treasury'));

  router.use('/plugins', tenantScope({ required: true }));
  router.use('/plugins', _readLimiter);
  router.use('/plugins', _writeLimiter);
  router.use(lazyMatch('/plugins', () => import('../plugin-registry'), 'plugin-registry'));
}
