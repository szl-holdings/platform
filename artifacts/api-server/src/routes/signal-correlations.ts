/**
 * Signal Correlations API
 *
 * Returns cross-domain correlation entries produced by the correlator
 * whenever a signal is published to the Prism Bus.
 *
 * GET /signal-correlations               — list recent correlations (paginated)
 * GET /signal-correlations/:id           — fetch a single correlation
 * GET /signal-correlations/stats/summary — aggregated counts by domain pair
 * POST /signal-correlations/clear        — admin-only: clear the in-memory log
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import {
  handleRouteError,
  parsePagination,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { clearCorrelations, getCorrelations } from '../lib/cross-domain-correlator';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router: IRouter = Router();

router.get('/signal-correlations', authMiddleware(), (req: Request, res: Response) => {
  try {
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const { sourceDomain, impactedDomain, since } = req.query as {
      sourceDomain?: string;
      impactedDomain?: string;
      since?: string;
    };

    // Resolve the caller's orgId for tenant isolation.
    // getUserOrgIds returns null for elevated users (super_admin/admin) meaning
    // "all orgs". We must pass orgId=undefined to getCorrelations for elevated
    // callers — passing null would instead filter to null-org entries only.
    const orgIds = getUserOrgIds(req.user!);
    const callerOrgId: string | undefined =
      orgIds === null
        ? undefined // elevated → no org filter, see all correlations
        : ([...orgIds].map(String)[0] ?? undefined); // regular tenant: first org

    const all = getCorrelations({
      sourceDomain: sourceDomain || undefined,
      impactedDomain: impactedDomain || undefined,
      since: since ? Number(since) : undefined,
      limit: limit + offset,
      orgId: callerOrgId,
    });

    const paged = all.slice(offset, offset + limit);
    sendSuccess(res, { data: paged, total: all.length, limit, offset });
  } catch (err) {
    handleRouteError(res, err, 'signal-correlations:list');
  }
});

router.get(
  '/signal-correlations/stats/summary',
  authMiddleware(),
  (req: Request, res: Response) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      // elevated (null) → undefined (no filter); regular → first org string
      const callerOrgId: string | undefined =
        orgIds === null ? undefined : ([...orgIds].map(String)[0] ?? undefined);
      const all = getCorrelations({ limit: 500, orgId: callerOrgId });

      const bySourceDomain: Record<string, number> = {};
      const byImpactedDomain: Record<string, number> = {};
      const byStrength: Record<string, number> = {};
      const domainPairs: Record<string, number> = {};

      for (const c of all) {
        bySourceDomain[c.sourceDomain] = (bySourceDomain[c.sourceDomain] ?? 0) + 1;
        byImpactedDomain[c.impactedDomain] = (byImpactedDomain[c.impactedDomain] ?? 0) + 1;
        byStrength[c.strength] = (byStrength[c.strength] ?? 0) + 1;
        const pair = `${c.sourceDomain}→${c.impactedDomain}`;
        domainPairs[pair] = (domainPairs[pair] ?? 0) + 1;
      }

      sendSuccess(res, {
        total: all.length,
        bySourceDomain,
        byImpactedDomain,
        byStrength,
        topDomainPairs: Object.entries(domainPairs)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([pair, count]) => ({ pair, count })),
      });
    } catch (err) {
      handleRouteError(res, err, 'signal-correlations:stats');
    }
  },
);

router.get('/signal-correlations/:id', authMiddleware(), (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const orgIds = getUserOrgIds(req.user!);
    // elevated (null) → undefined (no filter); regular → first org string
    const callerOrgId: string | undefined =
      orgIds === null ? undefined : ([...orgIds].map(String)[0] ?? undefined);
    const all = getCorrelations({ limit: 500, orgId: callerOrgId });
    const found = all.find((c) => c.correlationId === id);
    if (!found) {
      sendNotFound(res, 'CorrelationEntry');
      return;
    }
    sendSuccess(res, found);
  } catch (err) {
    handleRouteError(res, err, 'signal-correlations:get');
  }
});

router.post(
  '/signal-correlations/clear',
  authMiddleware(),
  // Restricted to super_admin only — a tenant-level admin clearing this
  // endpoint would wipe the global in-memory store for all tenants (cross-tenant
  // integrity violation / DoS). Only platform super_admins may truncate globally.
  requireRole('super_admin'),
  (_req: Request, res: Response) => {
    try {
      clearCorrelations();
      sendSuccess(res, { cleared: true });
    } catch (err) {
      handleRouteError(res, err, 'signal-correlations:clear');
    }
  },
);

export default router;
