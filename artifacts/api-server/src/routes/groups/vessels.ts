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

  // ORDER MATTERS: modules exposing literal `/vessels/<word>` routes must be
  // mounted BEFORE `../vessels`, whose `GET /vessels/:id` handler captures any
  // single-segment path and rejects non-numeric values with HTTP 400 instead of
  // falling through. Mounting vessels-extended (dashboard/roster/voyage-economics/
  // fleet-summary/exceptions/maintenance/readiness/sanctions/map-payload/ports)
  // and sibling literal-prefix modules first lets those literals resolve cleanly,
  // while real numeric IDs (e.g. /vessels/123) still fall through to vessels.ts.
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
  // A11oy primitive backend (Task #5318): fleet/positions/risk/route-plan/
  // coexistence. Literal-path-only routers, mounted BEFORE the catch-all
  // ../vessels module whose `/vessels/:id` handler would otherwise swallow
  // `/vessels/risk` and `/vessels/fleet` with HTTP 400.
  router.use(lazyMatch('/vessels', () => import('../vessels-fleet'), 'vessels-fleet'));
  router.use(lazyMatch('/vessels', () => import('../vessels-positions'), 'vessels-positions'));
  router.use(lazyMatch('/vessels', () => import('../vessels-risk'), 'vessels-risk'));
  router.use(lazyMatch('/vessels', () => import('../vessels-route-plan'), 'vessels-route-plan'));
  router.use(lazyMatch('/vessels', () => import('../vessels-coexistence'), 'vessels-coexistence'));
  // Mounted LAST so its `/vessels/:id` handler is the fall-through, not a trap.
  router.use(lazyMatch('/vessels', () => import('../vessels'), 'vessels'));

  // NOTE: vessels-ops-core is mounted at the TOP of this function (before
  // the tenantScope wall) so it can be polled anonymously by the
  // cross-app orchestration bridge. Do not re-mount it here.
}
