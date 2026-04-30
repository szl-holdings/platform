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
  router.use('/alloy', tenantScope({ required: true }));
  router.use('/alloy-chat', tenantScope({ required: true }));
  router.use('/governance', tenantScope({ required: true }));

  router.use('/alloy', _readLimiter);
  router.use('/alloy/ingest', optionalIdempotencyMiddleware);
  router.use('/alloy/workflows', _writeLimiter);
  router.use('/alloy/workflows', optionalIdempotencyMiddleware);
  router.use(lazyMatch(['/alloy', '/decisions', '/skills'], () => import('../alloy'), 'alloy'));

  router.use(lazyMatch('/alloy-chat', () => import('../alloy-chat'), 'alloy-chat'));

  router.use('/alloy/channels', _writeLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-channels'), 'alloy-channels'));

  router.use('/alloy/email', _writeLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-email'), 'alloy-email'));

  router.use('/alloy/meetings', _writeLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-meetings'), 'alloy-meetings'));

  router.use('/alloy/digest', _readLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-digest'), 'alloy-digest'));

  router.use('/alloy/integrations', _writeLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-integrations'), 'alloy-integrations'));

  router.use('/alloy/voice', _writeLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-voice'), 'alloy-voice'));

  router.use('/alloy/cognitive', _readLimiter);
  router.use('/alloy/cognitive', _writeLimiter);
  router.use(
    lazyMatch('/alloy', () => import('../alloy-cognitive-learning'), 'alloy-cognitive-learning'),
  );

  router.use('/governance', _writeLimiter);
  router.use(
    '/governance',
    lazyMount(() => import('../governance'), 'governance'),
  );

  router.use('/alloy/policies', _writeLimiter);
  router.use('/alloy/governance', _writeLimiter);
  router.use('/alloy/usage', _writeLimiter);
  router.use('/alloy/admin', _readLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-governance'), 'alloy-governance'));

  // Policy Authoring Studio — LLM-assisted ambiguity resolution.
  router.use(lazyMatch('/alloy/policies', () => import('../alloy-policy-llm'), 'alloy-policy-llm'));

  router.use('/alloy/skills', _readLimiter);
  router.use('/alloy/agents', _readLimiter);
  router.use('/alloy/performance', _readLimiter);
  router.use('/alloy/self-improvement', _readLimiter);
  router.use('/alloy/self-improvement', _writeLimiter);
  router.use('/alloy/decisions', _writeLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-skills'), 'alloy-skills'));

  router.use('/alloy/research', _writeLimiter);
  router.use('/alloy/browser', _writeLimiter);
  router.use(
    lazyMatch(
      '/alloy',
      () => import('../alloy-research').then((m) => ({ default: m.alloyResearchRouter })),
      'alloy-research',
    ),
  );

  // WorkGraph — Governed Workspace Intelligence Layer (Phase 5)
  router.use('/alloy/workgraph', _readLimiter);
  router.use('/alloy/workgraph/skill-runs', _writeLimiter);
  router.use('/alloy/workgraph/answer', _writeLimiter);
  router.use('/alloy/workgraph/search', _writeLimiter);
  router.use('/alloy/workgraph/seed', _writeLimiter);
  router.use(lazyMatch('/alloy', () => import('../alloy-workgraph'), 'alloy-workgraph'));
}
