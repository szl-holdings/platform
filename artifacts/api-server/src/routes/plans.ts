import { Router, type IRouter } from "express";
import type { Request } from "express";
import {
  createPlan,
  getPlanFallbacks,
  replayPlan,
  defaultPlanStore,
  PlanContextSchema,
  PlanNotFoundError,
  type PlanStoreQuery,
} from "@workspace/planner";
import { authMiddleware, isElevatedUser, type AuthenticatedUser } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  handleRouteError,
  sendNotFound,
  sendBadRequest,
  sendForbidden,
} from "../lib/api-response";

const router: IRouter = Router();

const ALLOWED_STATUSES = new Set([
  "draft",
  "ready",
  "executing",
  "completed",
  "failed",
  "cancelled",
]);

/**
 * Resolve the calling user's primary org id (as a string, since planner
 * contexts use string orgIds). Elevated users (super_admin) skip scoping.
 */
function resolveOrgScope(user: AuthenticatedUser): { orgId?: string; elevated: boolean } {
  if (isElevatedUser(user)) return { elevated: true };
  const primary = user.orgs[0];
  return { elevated: false, orgId: primary ? String(primary.orgId) : undefined };
}

function requireUser(req: Request): AuthenticatedUser | null {
  return req.user ?? null;
}

router.get("/plans", authMiddleware(), async (req, res) => {
  try {
    const user = requireUser(req);
    if (!user) {
      sendForbidden(res, "authentication required");
      return;
    }

    const query: PlanStoreQuery = {};
    if (req.query.status) {
      const status = req.query.status as string;
      if (!ALLOWED_STATUSES.has(status)) {
        sendBadRequest(res, `Invalid status: ${status}`);
        return;
      }
      query.status = status as PlanStoreQuery["status"];
    }
    if (req.query.agentId) query.agentId = req.query.agentId as string;
    if (req.query.sessionId) query.sessionId = req.query.sessionId as string;
    if (req.query.workflowId) query.workflowId = req.query.workflowId as string;
    if (req.query.parentPlanId) query.parentPlanId = req.query.parentPlanId as string;

    const scope = resolveOrgScope(user);
    if (!scope.elevated) {
      if (!scope.orgId) {
        // Non-elevated user with no org membership cannot see any plans.
        sendSuccess(res, { items: [], total: 0, limit: 0, offset: 0 });
        return;
      }
      query.orgId = scope.orgId;
    }

    const rawLimit = parseInt((req.query.limit as string) ?? "50", 10);
    const rawOffset = parseInt((req.query.offset as string) ?? "0", 10);
    if (isNaN(rawLimit) || rawLimit < 1 || rawLimit > 500) {
      sendBadRequest(res, "limit must be between 1 and 500");
      return;
    }
    if (isNaN(rawOffset) || rawOffset < 0) {
      sendBadRequest(res, "offset must be >= 0");
      return;
    }
    query.limit = rawLimit;
    query.offset = rawOffset;

    const { items, total } = await defaultPlanStore.list(query);
    sendSuccess(res, { items, total, limit: rawLimit, offset: rawOffset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list plans");
  }
});

/** Returns true when the caller may access the given plan. */
function callerOwnsPlan(user: AuthenticatedUser, plan: { context: Record<string, unknown> }): boolean {
  if (isElevatedUser(user)) return true;
  const planOrg = plan.context["orgId"];
  if (typeof planOrg !== "string") {
    // Plans without an orgId are treated as un-scoped and are not exposed
    // cross-tenant; only elevated users (handled above) may read them.
    return false;
  }
  return user.orgs.some((m) => String(m.orgId) === planOrg);
}

router.get("/plans/:id", authMiddleware(), async (req, res) => {
  try {
    const user = requireUser(req);
    if (!user) {
      sendForbidden(res, "authentication required");
      return;
    }
    const plan = await defaultPlanStore.get(req.params.id);
    if (!plan) {
      sendNotFound(res, "Plan not found");
      return;
    }
    if (!callerOwnsPlan(user, plan)) {
      // Return 404 (not 403) to avoid leaking plan existence cross-tenant.
      sendNotFound(res, "Plan not found");
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    handleRouteError(res, err, "Failed to get plan");
  }
});

router.post("/plans", authMiddleware(), async (req, res) => {
  try {
    const user = requireUser(req);
    if (!user) {
      sendForbidden(res, "authentication required");
      return;
    }
    const { objective, context } = req.body as {
      objective?: string;
      context?: unknown;
    };
    if (!objective || typeof objective !== "string" || !objective.trim()) {
      sendBadRequest(res, "objective is required");
      return;
    }
    const ctxParse = PlanContextSchema.safeParse(context ?? {});
    if (!ctxParse.success) {
      sendBadRequest(res, `Invalid context: ${ctxParse.error.message}`);
      return;
    }

    // Tenant scoping: force orgId to caller's primary org. Elevated users
    // (super_admin) may pass a different orgId explicitly.
    const scope = resolveOrgScope(user);
    if (!scope.elevated) {
      if (!scope.orgId) {
        sendForbidden(res, "user has no org membership; cannot create plans");
        return;
      }
      ctxParse.data.orgId = scope.orgId;
    } else if (!ctxParse.data.orgId && user.orgs[0]) {
      ctxParse.data.orgId = String(user.orgs[0].orgId);
    }

    const plan = await createPlan(objective, ctxParse.data);
    const fallbacks = await getPlanFallbacks(plan);
    sendCreated(res, { plan, fallbacks });
  } catch (err) {
    handleRouteError(res, err, "Failed to create plan");
  }
});

router.post("/plans/:id/replay", authMiddleware(), async (req, res) => {
  try {
    const user = requireUser(req);
    if (!user) {
      sendForbidden(res, "authentication required");
      return;
    }
    const plan = await defaultPlanStore.get(req.params.id);
    if (!plan) {
      sendNotFound(res, "Plan not found");
      return;
    }
    if (!callerOwnsPlan(user, plan)) {
      sendNotFound(res, "Plan not found");
      return;
    }
    const result = await replayPlan(req.params.id);
    sendSuccess(res, result);
  } catch (err) {
    if (err instanceof PlanNotFoundError) {
      sendNotFound(res, err.message);
      return;
    }
    handleRouteError(res, err, "Failed to replay plan");
  }
});

export default router;
