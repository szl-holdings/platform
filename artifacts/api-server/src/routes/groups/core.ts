import type { IRouter } from 'express';
import { lazyMatch, lazyMount } from '../../lib/lazy-router';
import {
  optionalIdempotencyMiddleware,
} from '../../middlewares/idempotency';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
  strictAuthSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';

const _authLimiter = strictAuthSlidingLimiter;
const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use('/auth', _authLimiter);

  router.use('/storage/uploads', _writeLimiter);
  router.use('/storage', _readLimiter);
  router.use(lazyMatch('/storage', () => import('../storage'), 'storage'));

  router.use('/files', _writeLimiter);

  router.use(lazyMatch(['/healthz', '/health'], () => import('../health'), 'health'));
  router.use(
    lazyMatch(
      ['/health', '/integrations'],
      () => import('../health-integrations'),
      'health-integrations',
    ),
  );

  router.use('/webhooks', _writeLimiter);
  router.use('/webhooks', optionalIdempotencyMiddleware);
  router.use(lazyMatch('/webhooks', () => import('../webhooks'), 'webhooks'));

  router.use(
    lazyMatch(
      ['/integrations', '/webhooks'],
      () => import('../external-integrations'),
      'external-integrations',
    ),
  );
  router.use(lazyMatch('/auth', () => import('../auth'), 'auth'));
  router.use(
    lazyMatch(
      ['/auth', '/login', '/callback', '/logout', '/mobile-auth', '/azure-ad'],
      () => import('../oidc-auth'),
      'oidc-auth',
    ),
  );
  router.use(lazyMatch(['/files', '/assets'], () => import('../files'), 'files'));

  router.use('/contact', _writeLimiter);
  router.use(lazyMatch('/contact', () => import('../contact'), 'contact'));

  router.use('/demo-requests', _writeLimiter);
  router.use(lazyMatch('/demo-requests', () => import('../demo-requests'), 'demo-requests'));

  router.use('/feedback', _writeLimiter);
  router.use(
    lazyMatch(
      ['/feedback', '/admin'],
      () => import('../feedback').then((m) => ({ default: m.feedbackRouter })),
      'feedback',
    ),
  );

  router.use(lazyMatch('/config', () => import('../config'), 'config'));
  router.use(lazyMatch('/apm', () => import('../apm'), 'apm'));

  router.use(
    '/public',
    lazyMount(() => import('../public-status'), 'public-status'),
  );
  router.use('/admin/status', _writeLimiter);
  router.use(
    '/admin/status',
    lazyMount(() => import('../public-status'), 'public-status'),
  );

  router.use('/core', _readLimiter);
  router.use(lazyMatch('/core', () => import('../core'), 'core'));

  router.use('/admin/backup', _writeLimiter);
  router.use(lazyMatch('/admin', () => import('../backup'), 'backup'));
}
