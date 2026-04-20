import type { IRouter } from 'express';
import { lazyMatch, lazyMount, lazyRegister, lazyRegisterMatch } from '../../lib/lazy-router';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use('/documents', tenantScope({ required: true }));
  router.use('/exports', tenantScope({ required: true }));
  router.use('/comments', tenantScope({ required: true }));
  router.use('/cms', tenantScope({ required: true }));
  router.use('/reports', tenantScope({ required: true }));
  router.use('/atlas', tenantScope({ required: true }));
  router.use('/telemetry', tenantScope({ required: true }));
  router.use('/doctrine', tenantScope({ required: true }));
  router.use('/analytics', tenantScope({ required: true }));
  router.use('/analytics-engine', tenantScope({ required: true }));
  router.use('/genai-telemetry', tenantScope({ required: true }));
  router.use('/outcome-graph', tenantScope({ required: true }));
  router.use('/pulse-evals', tenantScope({ required: true }));
  router.use('/receipt-graph', tenantScope({ required: true }));
  router.use('/revenue-intelligence', tenantScope({ required: true }));

  router.use('/documents', _writeLimiter);
  router.use(lazyRegisterMatch('/documents', () => import('../documents'), 'documents'));

  router.use('/cms', _readLimiter);
  router.use(lazyMatch('/cms', () => import('../cms'), 'cms'));

  router.use('/exports', _writeLimiter);
  router.use(lazyMatch('/exports', () => import('../exports'), 'exports'));

  router.use('/reports', _readLimiter);
  router.use(lazyMatch('/reports', () => import('../reports'), 'reports'));

  router.use('/comments', _writeLimiter);
  router.use(lazyMatch('/comments', () => import('../comments'), 'comments'));

  router.use('/atlas', _writeLimiter);
  router.use(lazyMatch('/atlas', () => import('../atlas-artifacts'), 'atlas-artifacts'));

  router.use('/telemetry', _writeLimiter);
  router.use(lazyMatch('/telemetry', () => import('../telemetry'), 'telemetry'));

  router.use('/doctrine', _readLimiter);
  router.use(lazyMatch('/doctrine', () => import('../doctrine'), 'doctrine'));

  router.use('/analytics', _writeLimiter);
  router.use(lazyMatch('/analytics', () => import('../analytics'), 'analytics'));

  router.use('/analytics-engine', _readLimiter);
  router.use('/analytics-engine', _writeLimiter);
  router.use(
    lazyMatch('/analytics-engine', () => import('../analytics-engine'), 'analytics-engine'),
  );

  router.use('/genai-telemetry', _readLimiter);
  router.use('/genai-telemetry', _writeLimiter);
  router.use(lazyMatch('/genai-telemetry', () => import('../genai-telemetry'), 'genai-telemetry'));

  router.use('/outcome-graph', _writeLimiter);
  router.use(lazyMatch('/outcome-graph', () => import('../outcome-graph'), 'outcome-graph'));

  router.use('/pulse-evals', _readLimiter);
  router.use('/pulse-evals', _writeLimiter);
  router.use(lazyMatch('/pulse-evals', () => import('../pulse-evals'), 'pulse-evals'));

  router.use('/receipt-graph', _readLimiter);
  router.use('/receipt-graph', _writeLimiter);
  router.use(lazyMatch('/receipt-graph', () => import('../receipt-graph'), 'receipt-graph'));

  router.use('/revenue-intelligence', _readLimiter);
  router.use(
    lazyMatch(
      '/revenue-intelligence',
      () => import('../revenue-intelligence'),
      'revenue-intelligence',
    ),
  );
}
