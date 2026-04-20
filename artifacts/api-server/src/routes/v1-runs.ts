/**
 * GET /v1/runs/:id/ledger  — get the Run Ledger entry for a specific run
 * GET /v1/runs             — list run ledger entries (filterable by traceId, gateStatus, etc.)
 *
 * Auth is enforced by the calling mount point.
 */

import { runsLedgerQuerySchema } from '@szl-holdings/contracts/governance';
import { defaultRunLedgerStore } from '@workspace/run-ledger';
import { type IRouter, type Request, type Response, Router } from 'express';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';

const router: IRouter = Router();

// GET /v1/runs
router.get('/', (req: Request, res: Response) => {
  try {
    const query = runsLedgerQuerySchema.safeParse(req.query);
    if (!query.success) {
      return sendBadRequest(res, 'Invalid query parameters', query.error.flatten().fieldErrors);
    }
    const { traceId, gateStatus, limit, offset } = query.data;

    // ─── Tenant isolation ─────────────────────────────────────────────────────
    // Non-privileged callers are scoped to their own organisation's ledger
    // entries. Super admin / admin may query across tenants.
    const user = req.user as
      | { roles?: string[]; orgs?: Array<{ orgSlug: string; orgId: number }> }
      | undefined;
    const isPrivileged = user?.roles?.includes('super_admin') || user?.roles?.includes('admin');

    let effectiveTenantId = query.data.tenantId;
    if (!isPrivileged) {
      const callerOrgSlug = user?.orgs?.[0]?.orgSlug;
      if (callerOrgSlug) {
        if (!effectiveTenantId || !user?.orgs?.some((o) => o.orgSlug === effectiveTenantId)) {
          effectiveTenantId = callerOrgSlug;
        }
      }
    }

    let items = traceId
      ? defaultRunLedgerStore.getByTraceId(traceId)
      : defaultRunLedgerStore.list({ tenantId: effectiveTenantId, gateStatus, limit, offset });

    if (traceId) {
      if (gateStatus) items = items.filter((e) => e.gateStatus === gateStatus);
      if (effectiveTenantId) items = items.filter((e) => e.tenantId === effectiveTenantId);
      const off = offset ?? 0;
      items = items.slice(off, off + (limit ?? 50));
    }

    return sendSuccess(res, items, 200, { total: items.length, limit, offset });
  } catch (err) {
    return handleRouteError(res, err, 'v1-runs:list');
  }
});

// GET /v1/runs/:id/ledger
router.get('/:id/ledger', (req: Request, res: Response) => {
  try {
    const entry = defaultRunLedgerStore.getByRunId(req.params.id!);
    if (!entry) return sendNotFound(res, 'Run Ledger entry not found');

    // ─── Tenant ownership ────────────────────────────────────────────────────
    // Non-privileged callers may only read ledger entries for their own tenant.
    const user = req.user as { roles?: string[]; orgs?: Array<{ orgSlug: string }> } | undefined;
    const isPrivileged = user?.roles?.includes('super_admin') || user?.roles?.includes('admin');
    if (!isPrivileged && entry.tenantId !== undefined) {
      const callerHasAccess = user?.orgs?.some((o) => o.orgSlug === entry.tenantId) ?? false;
      if (!callerHasAccess) {
        return sendForbidden(res, 'Access denied: record belongs to a different tenant');
      }
    }

    return sendSuccess(res, entry);
  } catch (err) {
    return handleRouteError(res, err, 'v1-runs:ledger');
  }
});

export default router;
