/**
 * GET  /v1/approvals           — list approval requests
 * GET  /v1/approvals/:id       — get a single approval request
 * POST /v1/approvals/:id/decide — record an operator decision
 *
 * Actor is bound to the authenticated principal (req.user). The request body
 * may also include a human-readable `reason`. The `actor` field in the body
 * is accepted only as a display-name override for API-key callers (internal
 * agents) — for web sessions the authenticated user identity takes precedence.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import {
  listApprovalRequests,
  getApprovalRequestById,
  decideApproval,
} from "@workspace/approvals-inbox";
import {
  approvalsListQuerySchema,
  approvalDecideBodySchema,
} from "@szl-holdings/contracts/governance";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  handleRouteError,
} from "../lib/api-response";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /v1/approvals
router.get("/", (req: Request, res: Response) => {
  try {
    const query = approvalsListQuerySchema.safeParse(req.query);
    if (!query.success) {
      return sendBadRequest(res, "Invalid query parameters", query.error.flatten().fieldErrors);
    }
    const { status, profileId, limit, offset } = query.data;

    // ─── Tenant isolation ─────────────────────────────────────────────────────
    // Callers may only read approval requests for their own organisation unless
    // they hold super_admin or admin privileges. The tenantId query parameter
    // is accepted as a sub-scope hint but cannot expand beyond the caller's
    // own tenant to prevent cross-tenant data leakage.
    const user = req.user as
      | { roles?: string[]; orgs?: Array<{ orgSlug: string; orgId: number }> }
      | undefined;
    const isPrivileged =
      user?.roles?.includes("super_admin") ||
      user?.roles?.includes("admin");

    let effectiveTenantId = query.data.tenantId;
    if (!isPrivileged) {
      const callerOrgSlug = user?.orgs?.[0]?.orgSlug;
      if (callerOrgSlug) {
        // If the caller supplied a tenantId that doesn't match their org,
        // silently scope to their own tenant only.
        if (!effectiveTenantId || !user?.orgs?.some((o) => o.orgSlug === effectiveTenantId)) {
          effectiveTenantId = callerOrgSlug;
        }
      }
    }

    const items = listApprovalRequests({ status, tenantId: effectiveTenantId, profileId, limit, offset });
    return sendSuccess(res, items, 200, { total: items.length, limit, offset });
  } catch (err) {
    return handleRouteError(res, err, "v1-approvals:list");
  }
});

// ─── Tenant ownership helper ──────────────────────────────────────────────────
// Returns true when the caller is authorised to access a specific approval
// request. Privileged roles may access any tenant's records; non-privileged
// callers are restricted to records whose tenantId matches one of their orgs.
function callerCanAccessApproval(
  req: Request,
  itemTenantId: string | undefined,
): boolean {
  const user = req.user as
    | { roles?: string[]; orgs?: Array<{ orgSlug: string }> }
    | undefined;
  if (!user) return false;
  if (user.roles?.includes("super_admin") || user.roles?.includes("admin")) return true;
  if (!itemTenantId) return true; // unscoped record — allow for internal flows
  return user.orgs?.some((o) => o.orgSlug === itemTenantId) ?? false;
}

// GET /v1/approvals/:id
router.get("/:id", (req: Request, res: Response) => {
  try {
    const item = getApprovalRequestById(req.params.id!);
    if (!item) return sendNotFound(res, "ApprovalRequest not found");
    if (!callerCanAccessApproval(req, item.tenantId)) {
      return sendForbidden(res, "Access denied: record belongs to a different tenant");
    }
    return sendSuccess(res, item);
  } catch (err) {
    return handleRouteError(res, err, "v1-approvals:get");
  }
});

// POST /v1/approvals/:id/decide
router.post("/:id/decide", (req: Request, res: Response) => {
  try {
    const body = approvalDecideBodySchema.safeParse(req.body);
    if (!body.success) {
      return sendBadRequest(res, "Invalid decision body", body.error.flatten().fieldErrors);
    }
    const { verdict, reason, decisionId } = body.data;

    // Bind actor to the authenticated principal — fall back to body.actor
    // only for API-key callers (internal agents) where req.user may be absent.
    const user = req.user as
      | { email?: string | null; displayName?: string; id?: number; roles?: string[]; orgs?: Array<{ orgSlug: string }> }
      | undefined;
    const actor =
      user?.email ??
      user?.displayName ??
      body.data.actor ??
      "unknown";

    // Tenant ownership: non-privileged callers may only decide on their own
    // tenant's approval requests.
    const existingReq = getApprovalRequestById(req.params.id!);
    if (!existingReq) return sendNotFound(res, "ApprovalRequest not found");
    if (!callerCanAccessApproval(req, existingReq.tenantId)) {
      return sendForbidden(res, "Access denied: record belongs to a different tenant");
    }

    const result = decideApproval({
      requestId: req.params.id!,
      verdict,
      actor,
      reason,
      ...(decisionId !== undefined && { decisionId }),
    });
    logger.info(
      { requestId: req.params.id, verdict, actor },
      "[v1-approvals] decision recorded",
    );
    return sendCreated(res, {
      decision: result.decision,
      request: result.updatedRequest,
      governanceMemory: result.governanceMemory ?? null,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      return sendNotFound(res, err.message);
    }
    return handleRouteError(res, err, "v1-approvals:decide");
  }
});

export default router;
