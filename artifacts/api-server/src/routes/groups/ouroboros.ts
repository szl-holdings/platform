/**
 * Route group: /ouroboros
 *
 * The Ouroboros HTTP surface that exposes the Egyptian-mathematics
 * primitives via integration adapters for A11oy (frustum reconciliation),
 * Amaru (seked + unit-fractions), and Sentra (doubling anchor).
 *
 * Auth: routes are public in demo mode (allowlisted in
 * `global-auth-enforcer.ts` and `csrf.ts`). The integrations are pure-
 * functional except for the in-memory Sentra accumulator (process-local),
 * and all input is Zod-validated. Writes are rate-limited by
 * perUserWriteSlidingLimiter.
 */
import type { IRouter } from 'express';
import { lazyMatch } from '../../lib/lazy-router';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';

export function register(router: IRouter): void {
  router.use('/ouroboros', perUserApiSlidingLimiter);
  router.use('/ouroboros/a11oy', perUserWriteSlidingLimiter);
  router.use('/ouroboros/amaru', perUserWriteSlidingLimiter);
  router.use('/ouroboros/sentra', perUserWriteSlidingLimiter);
  router.use(
    lazyMatch('/ouroboros', () => import('../ouroboros'), 'ouroboros'),
  );
}
