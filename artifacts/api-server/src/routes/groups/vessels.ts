import type { IRouter } from 'express';
import { lazyMatch, } from '../../lib/lazy-router';
import { perUserApiSlidingLimiter } from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

export function register(router: IRouter): void {
  // Vessels Operational Core — mounted FIRST, before the group's
  // tenantScope({ required: true }) wall, so the cross-app orchestration
  // snapshot can be polled without a session. The route's own
  // authMiddleware({ required: false }) still hydrates org-scoped counters
  // when a session is present; anonymous callers receive `org_scoped: false`.
  // Listed in PUBLIC_PREFIXES ("/api/vessels/ops-core/") for defense in depth.
  router.use(lazyMatch('/vessels', () => import('../vessels-ops-core'), 'vessels-ops-core'));

  // Vessels is anonymous-readable for investors/consumers (see
  // global-auth-enforcer GET-public block for /api/vessels/*). tenantScope
  // runs in required:false mode so anonymous GETs pass through with their
  // tenant context hydrated to the `vessels-demo` org; authenticated
  // sessions still get full cross-tenant enforcement. Mutations (POST/PUT/
  // PATCH/DELETE) are 401'd by the global enforcer before reaching this.
  router.use('/vessels', tenantScope({ required: false }));
  router.use('/vessels', perUserApiSlidingLimiter);

  router.use(lazyMatch('/vessels', () => import('../vessels'), 'vessels'));
  router.use(lazyMatch('/vessels', () => import('../vessels-extended'), 'vessels-extended'));
  router.use(lazyMatch('/vessels', () => import('../vessels-psc'), 'vessels-psc'));
  router.use(lazyMatch('/vessels', () => import('../vessels-platform'), 'vessels-platform'));
  router.use(lazyMatch('/vessels', () => import('../vessels-live'), 'vessels-live'));
  router.use(lazyMatch('/vessels', () => import('../vessels-trading'), 'vessels-trading'));
  router.use(lazyMatch('/vessels', () => import('../vessels-insurance'), 'vessels-insurance'));
  router.use(lazyMatch('/vessels', () => import('../vessels-cognitive'), 'vessels-cognitive'));
  router.use(
    lazyMatch('/vessels', () => import('../vessels-digital-twin'), 'vessels-digital-twin'),
  );
  router.use(lazyMatch('/vessels', () => import('../vessels-modules'), 'vessels-modules'));
  router.use(lazyMatch('/vessels', () => import('../vessels-voyage-risk'), 'vessels-voyage-risk'));
  router.use(lazyMatch('/vessels', () => import('../vessels-freight'), 'vessels-freight'));
  router.use(lazyMatch('/vessels', () => import('../vessels-sanctions-network'), 'vessels-sanctions-network'));
  router.use(lazyMatch('/vessels', () => import('../vessels-forecasts'), 'vessels-forecasts'));
  router.use(lazyMatch('/vessels', () => import('../vessels-formula-thesis'), 'vessels-formula-thesis'));

  // NOTE: vessels-ops-core is mounted at the TOP of this function (before
  // the tenantScope wall) so it can be polled anonymously by the
  // cross-app orchestration bridge. Do not re-mount it here.
}
