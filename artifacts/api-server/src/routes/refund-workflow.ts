/**
 * Refund Workflow — REST API
 *
 * Exposes the multi-step refund approval workflow engine over HTTP.
 *
 * Routes (all under /billing/refund-workflow, protected by tenantScope + authMiddleware):
 *
 *   POST   /billing/refund-workflow/requests              — submit a new refund request
 *   GET    /billing/refund-workflow/requests              — list refund requests (paginated, org-scoped)
 *   GET    /billing/refund-workflow/requests/:id          — get a single request with full audit timeline
 *   POST   /billing/refund-workflow/requests/:id/approve  — record an approval vote
 *   POST   /billing/refund-workflow/requests/:id/deny     — record a denial vote
 *   POST   /billing/refund-workflow/requests/:id/execute  — execute an approved refund
 *   POST   /billing/refund-workflow/requests/:id/cancel   — cancel a pending request
 *   POST   /billing/refund-workflow/requests/:id/retry    — retry a failed refund execution
 *   GET    /billing/refund-workflow/reports/reason-mix    — reason code breakdown
 *   GET    /billing/refund-workflow/reports/refund-rate   — refund rate vs invoices
 *   GET    /billing/refund-workflow/demo                  — demo fixture queue (demo mode only)
 *
 * Security: all mutation endpoints (approve/deny/execute/cancel/retry) verify org
 * ownership before acting on a requestId to prevent cross-tenant IDOR.
 */

import { billingAuditLogTable, billingRefundRequestsTable, db } from '@szl-holdings/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { actorFromReq } from '../lib/billing-audit';
import {
  buildDemoRefundQueue,
  createRefundRequest,
  executeRefund,
  getRefundRate,
  getRefundReasonMix,
  getSubscriptionCreditBalance,
  recordApprovalDecision,
  retryRefund,
  transitionState,
} from '../lib/refund-workflow-engine';
import { isFlagEnabled } from '../lib/platform-flags';
import { logger } from '../lib/logger';
import { parsePagination, validateBody, validateQuery, listQuerySchema } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router: IRouter = Router();

// ─── Role helpers ──────────────────────────────────────────────────────────────
// The user object exposes roles: RoleName[] (array, no single .role property).
// For approval recording we need a single representative role — pick the most
// authoritative approval-policy role the actor holds so policy satisfaction is
// correctly evaluated (e.g. a user with roles ['admin','finance'] evaluates as
// 'finance' which satisfies the dual-approval finance requirement).
const APPROVAL_ROLE_PRIORITY = ['executive', 'finance', 'manager', 'admin', 'super_admin', 'ops'] as const;

function pickApproverRole(userRoles: string[] | undefined): string {
  for (const r of APPROVAL_ROLE_PRIORITY) {
    if (userRoles?.includes(r)) return r;
  }
  return userRoles?.[0] ?? 'ops';
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createRequestSchema = z.object({
  orgId: z.number().int().positive().optional(),
  chargeId: z.string().optional().nullable(),
  paymentIntentId: z.string().optional().nullable(),
  invoiceId: z.number().int().positive().optional().nullable(),
  net30InvoiceId: z.number().int().positive().optional().nullable(),
  amount: z.number().positive().optional().nullable(),
  currency: z.string().length(3).default('usd'),
  reasonCode: z.enum([
    'duplicate',
    'fraudulent',
    'requested_by_customer',
    'service_failure',
    'goodwill',
    'other',
  ]),
  customerFacingNote: z.string().max(2000).optional().nullable(),
  internalNote: z.string().max(5000).optional().nullable(),
  suppressCustomerEmail: z.boolean().default(false),
  customerEmail: z.string().email().optional().nullable(),
  railType: z.enum(['card', 'ach', 'crypto']).optional().nullable(),
  productId: z.string().max(255).optional().nullable(),
}).refine(
  (data) => !!(data.chargeId || data.paymentIntentId || data.invoiceId || data.net30InvoiceId),
  {
    message:
      'At least one payment linkage field is required: chargeId, paymentIntentId, invoiceId, or net30InvoiceId',
    path: ['chargeId'],
  },
);

const approvalDecisionSchema = z.object({
  note: z.string().max(2000).optional(),
});

const reportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  orgId: z.coerce.number().int().positive().optional(),
  productId: z.string().max(255).optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Verify the authenticated user has access to the given orgId. */
function hasOrgAccess(req: Request, orgId: number): boolean {
  const orgIds = getUserOrgIds(req.user!);
  return !orgIds || orgIds.has(orgId);
}

/**
 * Resolve the target orgId for reporting endpoints.
 *
 * Returns:
 *  - null (unrestricted) if the caller is a super-admin (orgIds === null)
 *  - the explicit queryOrgId if supplied and the caller has access
 *  - the caller's single org if they belong to exactly one org
 *  - throws a 400-level error if a multi-org tenant-bound user omits orgId
 *    (returning unscoped data would be a cross-tenant data leak)
 */
function resolveReportOrgId(
  req: Request,
  res: Response,
  queryOrgId: number | undefined,
): { orgId: number | null; abort: boolean } {
  const orgIds = getUserOrgIds(req.user!);

  // Super-admin: orgIds is null, allow global queries
  if (orgIds === null) {
    return { orgId: queryOrgId ?? null, abort: false };
  }

  // Explicit orgId provided — verify access
  if (queryOrgId !== undefined) {
    if (!orgIds.has(queryOrgId)) {
      sendForbidden(res, 'Access denied');
      return { orgId: null, abort: true };
    }
    return { orgId: queryOrgId, abort: false };
  }

  // No explicit orgId: auto-fill for single-org users
  if (orgIds.size === 1) {
    return { orgId: [...orgIds][0] ?? null, abort: false };
  }

  // Multi-org tenant-bound user without orgId — require explicit scope
  sendBadRequest(res, 'orgId query parameter is required for users belonging to multiple organizations');
  return { orgId: null, abort: true };
}

/**
 * fetchAndAuthorize — fetch a refund request by ID and verify that the
 * authenticated user's org owns it. Returns the request row or null if the
 * request is not found. Calls sendNotFound / sendForbidden and returns null
 * when authorization fails, so callers can `return` immediately.
 */
async function fetchAndAuthorize(
  req: Request,
  res: Response,
  id: number,
): Promise<(typeof billingRefundRequestsTable.$inferSelect) | null> {
  const [row] = await db
    .select()
    .from(billingRefundRequestsTable)
    .where(eq(billingRefundRequestsTable.id, id));

  if (!row) {
    sendNotFound(res, 'Refund request not found');
    return null;
  }

  if (!hasOrgAccess(req, row.orgId)) {
    sendForbidden(res, 'Access denied');
    return null;
  }

  return row;
}

function parseRequestId(raw: string | undefined): number | null {
  const id = parseInt(raw ?? '', 10);
  return isNaN(id) ? null : id;
}

/**
 * Resolve the target orgId for the refund-request CREATE endpoint.
 *
 * Unlike reporting (where null = unrestricted), creating a request always
 * needs a concrete orgId. Rules:
 *  - super_admin (orgIds === null): body.orgId required
 *  - multi-org tenant-bound user: body.orgId required and must be in their set
 *  - single-org tenant-bound user: auto-fills from their lone org;
 *    if they also pass body.orgId it must match (prevent silent mismatch)
 */
function resolveCreateOrgId(
  req: Request,
  res: Response,
  bodyOrgId: number | undefined,
): { orgId: number; abort: boolean } {
  const orgIds = getUserOrgIds(req.user!);

  // Super-admin: orgIds is null — must provide explicit body.orgId
  if (orgIds === null) {
    if (!bodyOrgId) {
      sendBadRequest(res, 'orgId is required in the request body for super_admin users');
      return { orgId: 0, abort: true };
    }
    return { orgId: bodyOrgId, abort: false };
  }

  // Explicit body.orgId provided — verify the caller has access
  if (bodyOrgId !== undefined) {
    if (!orgIds.has(bodyOrgId)) {
      sendForbidden(res, 'Access denied to the specified organization');
      return { orgId: 0, abort: true };
    }
    return { orgId: bodyOrgId, abort: false };
  }

  // No explicit orgId: auto-fill for single-org users
  if (orgIds.size === 1) {
    const autoOrg = [...orgIds][0]!;
    return { orgId: autoOrg, abort: false };
  }

  // Multi-org tenant-bound user without orgId — require explicit scope
  sendBadRequest(res, 'orgId is required in the request body for users belonging to multiple organizations');
  return { orgId: 0, abort: true };
}

// ─── POST /billing/refund-workflow/requests ────────────────────────────────────

router.post(
  '/billing/refund-workflow/requests',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops', 'manager', 'finance'),
  validateBody(createRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const actor = actorFromReq(req);
      const body = req.body as z.infer<typeof createRequestSchema>;

      const { orgId, abort } = resolveCreateOrgId(req, res, body.orgId);
      if (abort) return;

      const idempotencyKey =
        (req.headers['idempotency-key'] as string | undefined) ?? `rf-req-${randomUUID()}`;

      const request = await createRefundRequest({
        orgId,
        actorId: actor.actorId ?? 0,
        actorEmail: actor.actorEmail,
        chargeId: body.chargeId ?? null,
        paymentIntentId: body.paymentIntentId ?? null,
        invoiceId: body.invoiceId ?? null,
        net30InvoiceId: body.net30InvoiceId ?? null,
        amount: body.amount ?? null,
        currency: body.currency,
        reasonCode: body.reasonCode,
        customerFacingNote: body.customerFacingNote ?? null,
        internalNote: body.internalNote ?? null,
        suppressCustomerEmail: body.suppressCustomerEmail,
        customerEmail: body.customerEmail ?? null,
        railType: body.railType ?? null,
        productId: body.productId ?? null,
        idempotencyKey,
      });

      logger.info(
        { requestId: request.id, orgId, amount: body.amount },
        '[refund-workflow] Refund request created',
      );

      sendCreated(res, request);
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to create refund request');
    }
  },
);

// ─── GET /billing/refund-workflow/requests ─────────────────────────────────────

router.get(
  '/billing/refund-workflow/requests',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops', 'manager', 'finance', 'executive'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const orgIds = getUserOrgIds(req.user!);

      // Defensive scoping: null = super-admin (unrestricted), empty set = no org access
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, []);
        return;
      }

      const rows = await db
        .select()
        .from(billingRefundRequestsTable)
        .where(
          orgIds !== null
            ? inArray(billingRefundRequestsTable.orgId, [...orgIds])
            : undefined,
        )
        .orderBy(desc(billingRefundRequestsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to list refund requests');
    }
  },
);

// ─── GET /billing/refund-workflow/requests/:id ─────────────────────────────────
// Returns the request row AND its full billing audit trail.

router.get(
  '/billing/refund-workflow/requests/:id',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops', 'manager', 'finance', 'executive'),
  async (req: Request, res: Response) => {
    try {
      const id = parseRequestId(req.params.id);
      if (id === null) {
        sendBadRequest(res, 'Invalid request ID');
        return;
      }

      const row = await fetchAndAuthorize(req, res, id);
      if (!row) return;

      // Fetch the audit trail for this request from the billing_audit_log
      let auditTrail: Array<Record<string, unknown>> = [];
      try {
        auditTrail = await db
          .select()
          .from(billingAuditLogTable)
          .where(
            and(
              eq(billingAuditLogTable.resource, 'refund_request'),
              eq(billingAuditLogTable.resourceId, String(id)),
            ),
          )
          .orderBy(billingAuditLogTable.createdAt);
      } catch {
        // Audit log is non-fatal — return request without timeline if unavailable
        auditTrail = [];
      }

      sendSuccess(res, { request: row, auditTrail });
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to fetch refund request');
    }
  },
);

// ─── POST /billing/refund-workflow/requests/:id/approve ───────────────────────

router.post(
  '/billing/refund-workflow/requests/:id/approve',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'manager', 'finance', 'executive', 'ops'),
  validateBody(approvalDecisionSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseRequestId(req.params.id);
      if (id === null) {
        sendBadRequest(res, 'Invalid request ID');
        return;
      }

      // Verify org ownership before acting (IDOR guard)
      const row = await fetchAndAuthorize(req, res, id);
      if (!row) return;

      const actor = actorFromReq(req);
      const body = req.body as z.infer<typeof approvalDecisionSchema>;

      const { request, satisfied } = await recordApprovalDecision(
        id,
        actor.actorId ?? 0,
        actor.actorEmail,
        pickApproverRole(req.user?.roles),
        'approved',
        body.note,
      );

      logger.info(
        { requestId: id, actorId: actor.actorId, satisfied },
        '[refund-workflow] Approval recorded',
      );

      sendSuccess(res, { request, satisfied });
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to record approval');
    }
  },
);

// ─── POST /billing/refund-workflow/requests/:id/deny ──────────────────────────

router.post(
  '/billing/refund-workflow/requests/:id/deny',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'manager', 'finance', 'executive'),
  validateBody(approvalDecisionSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseRequestId(req.params.id);
      if (id === null) {
        sendBadRequest(res, 'Invalid request ID');
        return;
      }

      // Verify org ownership before acting (IDOR guard)
      const row = await fetchAndAuthorize(req, res, id);
      if (!row) return;

      const actor = actorFromReq(req);
      const body = req.body as z.infer<typeof approvalDecisionSchema>;

      const { request, satisfied } = await recordApprovalDecision(
        id,
        actor.actorId ?? 0,
        actor.actorEmail,
        pickApproverRole(req.user?.roles),
        'denied',
        body.note,
      );

      logger.info(
        { requestId: id, actorId: actor.actorId },
        '[refund-workflow] Denial recorded',
      );

      sendSuccess(res, { request, satisfied });
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to record denial');
    }
  },
);

// ─── POST /billing/refund-workflow/requests/:id/execute ───────────────────────

router.post(
  '/billing/refund-workflow/requests/:id/execute',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops', 'finance'),
  async (req: Request, res: Response) => {
    try {
      const id = parseRequestId(req.params.id);
      if (id === null) {
        sendBadRequest(res, 'Invalid request ID');
        return;
      }

      // Verify org ownership before acting (IDOR guard)
      const row = await fetchAndAuthorize(req, res, id);
      if (!row) return;

      const actor = actorFromReq(req);

      const updated = await executeRefund(id, actor.actorId ?? 0, actor.actorEmail);

      logger.info(
        { requestId: id, actorId: actor.actorId },
        '[refund-workflow] Refund executed',
      );

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to execute refund');
    }
  },
);

// ─── POST /billing/refund-workflow/requests/:id/cancel ────────────────────────

router.post(
  '/billing/refund-workflow/requests/:id/cancel',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops', 'manager', 'finance', 'executive'),
  validateBody(z.object({ reason: z.string().max(1000).optional() })),
  async (req: Request, res: Response) => {
    try {
      const id = parseRequestId(req.params.id);
      if (id === null) {
        sendBadRequest(res, 'Invalid request ID');
        return;
      }

      // Verify org ownership before acting (IDOR guard)
      const row = await fetchAndAuthorize(req, res, id);
      if (!row) return;

      const actor = actorFromReq(req);
      const { reason } = req.body as { reason?: string };

      const updated = await transitionState(
        id,
        'cancelled',
        actor.actorId ?? 0,
        actor.actorEmail,
        reason,
      );

      logger.info({ requestId: id, actorId: actor.actorId }, '[refund-workflow] Request cancelled');

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to cancel refund request');
    }
  },
);

// ─── POST /billing/refund-workflow/requests/:id/retry ─────────────────────────
// Retry a failed refund execution. Transitions failed → under_review → approved
// and immediately attempts re-execution. Enforces MAX_REFUND_RETRIES cap.

router.post(
  '/billing/refund-workflow/requests/:id/retry',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops', 'finance'),
  async (req: Request, res: Response) => {
    try {
      const id = parseRequestId(req.params.id);
      if (id === null) {
        sendBadRequest(res, 'Invalid request ID');
        return;
      }

      // Verify org ownership before acting (IDOR guard)
      const row = await fetchAndAuthorize(req, res, id);
      if (!row) return;

      const actor = actorFromReq(req);

      const updated = await retryRefund(id, actor.actorId ?? 0, actor.actorEmail);

      logger.info({ requestId: id, actorId: actor.actorId }, '[refund-workflow] Refund retried');

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to retry refund');
    }
  },
);

// ─── GET /billing/refund-workflow/reports/reason-mix ──────────────────────────

router.get(
  '/billing/refund-workflow/reports/reason-mix',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'finance', 'executive'),
  validateQuery(reportQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, orgId: queryOrgId, productId } = req.query as z.infer<typeof reportQuerySchema>;
      const { start, end } = parseDateRange(startDate, endDate);

      const { orgId: targetOrgId, abort } = resolveReportOrgId(req, res, queryOrgId);
      if (abort) return;

      const mix = await getRefundReasonMix(targetOrgId, start, end, productId ?? null);
      sendSuccess(res, { startDate: start, endDate: end, productId: productId ?? null, data: mix });
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to fetch reason mix report');
    }
  },
);

// ─── GET /billing/refund-workflow/reports/refund-rate ─────────────────────────

router.get(
  '/billing/refund-workflow/reports/refund-rate',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'finance', 'executive'),
  validateQuery(reportQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, orgId: queryOrgId, productId } = req.query as z.infer<typeof reportQuerySchema>;
      const { start, end } = parseDateRange(startDate, endDate);

      const { orgId: targetOrgId, abort } = resolveReportOrgId(req, res, queryOrgId);
      if (abort) return;

      const rate = await getRefundRate(targetOrgId, start, end, productId ?? null);
      sendSuccess(res, { startDate: start, endDate: end, productId: productId ?? null, ...rate });
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to fetch refund rate report');
    }
  },
);

// ─── GET /billing/refund-workflow/subscriptions/:subscriptionId/credits ──────
// Returns the explicit credit balance ledger for a subscription. Finance teams
// use this to view per-subscription credits issued by the refund workflow rather
// than scanning the audit log for aggregated balance.
//
// Query params:
//   orgId (optional) — required for multi-org users; super_admin may omit for
//                      unrestricted scope.

router.get(
  '/billing/refund-workflow/subscriptions/:subscriptionId/credits',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops', 'finance'),
  validateQuery(reportQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId, 10);
      if (isNaN(subscriptionId) || subscriptionId <= 0) {
        sendBadRequest(res, 'Invalid subscription ID');
        return;
      }

      const { orgId: queryOrgId } = req.query as z.infer<typeof reportQuerySchema>;
      const { orgId: targetOrgId, abort } = resolveReportOrgId(req, res, queryOrgId);
      if (abort) return;

      const balance = await getSubscriptionCreditBalance(subscriptionId, targetOrgId);
      sendSuccess(res, balance);
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to fetch subscription credit balance');
    }
  },
);

// ─── GET /billing/refund-workflow/demo ────────────────────────────────────────

router.get(
  '/billing/refund-workflow/demo',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'ops'),
  async (req: Request, res: Response) => {
    try {
      const isDemoMode = await isFlagEnabled('demo_mode', null);
      if (!isDemoMode) {
        sendForbidden(res, 'Demo mode is not enabled');
        return;
      }

      const queue = buildDemoRefundQueue();
      sendSuccess(res, { queue, count: queue.length });
    } catch (err) {
      handleRouteError(res, err, '[refund-workflow] Failed to fetch demo queue');
    }
  },
);

export default router;
