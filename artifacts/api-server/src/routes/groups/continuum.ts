import type { IRouter } from 'express';
import { lazyMatch, lazyMount } from '../../lib/lazy-router';
import { optionalIdempotencyMiddleware } from '../../middlewares/idempotency';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use('/continuum', tenantScope({ required: true }));
  router.use('/continuum-chat', tenantScope({ required: true }));
  router.use('/governance', tenantScope({ required: true }));

  router.use('/continuum', _readLimiter);
  router.use('/continuum/ingest', optionalIdempotencyMiddleware);
  router.use('/continuum/workflows', _writeLimiter);
  router.use('/continuum/workflows', optionalIdempotencyMiddleware);
  router.use(lazyMatch(['/continuum', '/decisions', '/skills'], () => import('../continuum'), 'continuum'));

  router.use(lazyMatch('/continuum-chat', () => import('../continuum-chat'), 'continuum-chat'));

  router.use('/continuum/channels', _writeLimiter);
  router.use(lazyMatch('/continuum', () => import('../continuum-channels'), 'continuum-channels'));

  router.use('/continuum/email', _writeLimiter);
  router.use(lazyMatch('/continuum', () => import('../continuum-email'), 'continuum-email'));

  router.use('/continuum/meetings', _writeLimiter);
  router.use(lazyMatch('/continuum', () => import('../continuum-meetings'), 'continuum-meetings'));

  router.use('/continuum/digest', _readLimiter);
  router.use(lazyMatch('/continuum', () => import('../continuum-digest'), 'continuum-digest'));

  router.use('/continuum/integrations', _writeLimiter);
  router.use(lazyMatch('/continuum', () => import('../continuum-integrations'), 'continuum-integrations'));

  router.use('/continuum/voice', _writeLimiter);
  router.use(lazyMatch('/continuum', () => import('../continuum-voice'), 'continuum-voice'));

  router.use('/continuum/cognitive', _readLimiter);
  router.use('/continuum/cognitive', _writeLimiter);
  router.use(
    lazyMatch('/continuum', () => import('../continuum-cognitive-learning'), 'continuum-cognitive-learning'),
  );

  router.use('/governance', _writeLimiter);
  router.use(
    '/governance',
    lazyMount(() => import('../governance'), 'governance'),
  );

  router.use('/continuum/policies', _writeLimiter);
  router.use('/continuum/governance', _writeLimiter);
  router.use('/continuum/usage', _writeLimiter);
  router.use('/continuum/admin', _readLimiter);
  router.use(lazyMatch('/continuum', () => import('../continuum-governance'), 'continuum-governance'));

  // Policy Authoring Studio — LLM-assisted ambiguity resolution.
  router.use(lazyMatch('/continuum/policies', () => import('../continuum-policy-llm'), 'continuum-policy-llm'));

  router.use('/continuum/skills', _readLimiter);
  router.use('/continuum/agents', _readLimiter);
  router.use('/continuum/performance', _readLimiter);
  router.use('/continuum/self-improvement', _readLimiter);
  router.use('/continuum/self-improvement', _writeLimiter);
  router.use('/continuum/decisions', _writeLimiter);
  router.use(lazyMatch('/continuum', () => import('../continuum-skills'), 'continuum-skills'));

  router.use('/continuum/research', _writeLimiter);
  router.use('/continuum/browser', _writeLimiter);
  router.use(
    lazyMatch(
      '/continuum',
      () => import('../continuum-research').then((m) => ({ default: m.alloyResearchRouter })),
      'continuum-research',
    ),
  );
}
