import { bodyShape } from '@szl-holdings/contracts/common';
import { executePlan } from '@workspace/alloy/plan-orchestrator';
import {
  createPlan,
  defaultPlanStore,
  getPlanFallbacks,
  PlanContextSchema,
  PlanNotFoundError,
  type PlanStoreQuery,
  replayPlan,
} from '@workspace/planner';
import type { Request } from 'express';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, isElevatedUser } from '../middlewares/auth';

const router: IRouter = Router();

const ALLOWED_STATUSES = new Set([
  'draft',
  'ready',
  'executing',
  'completed',
  'failed',
  'cancelled',
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

router.get('/plans', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const user = requireUser(req);
    if (!user) {
      sendForbidden(res, 'authentication required');
      return;
    }

    const query: PlanStoreQuery = {};
    if (req.query.status) {
      const status = req.query.status as string;
      if (!ALLOWED_STATUSES.has(status)) {
        sendBadRequest(res, `Invalid status: ${status}`);
        return;
      }
      query.status = status as PlanStoreQuery['status'];
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

    const rawLimit = parseInt((req.query.limit as string) ?? '50', 10);
    const rawOffset = parseInt((req.query.offset as string) ?? '0', 10);
    if (isNaN(rawLimit) || rawLimit < 1 || rawLimit > 500) {
      sendBadRequest(res, 'limit must be between 1 and 500');
      return;
    }
    if (isNaN(rawOffset) || rawOffset < 0) {
      sendBadRequest(res, 'offset must be >= 0');
      return;
    }
    query.limit = rawLimit;
    query.offset = rawOffset;

    const { items, total } = await defaultPlanStore.list(query);
    sendSuccess(res, { items, total, limit: rawLimit, offset: rawOffset });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list plans');
  }
});

/** Returns true when the caller may access the given plan. */
function callerOwnsPlan(
  user: AuthenticatedUser,
  plan: { context: Record<string, unknown> },
): boolean {
  if (isElevatedUser(user)) return true;
  const planOrg = plan.context['orgId'];
  if (typeof planOrg !== 'string') {
    // Plans without an orgId are treated as un-scoped and are not exposed
    // cross-tenant; only elevated users (handled above) may read them.
    return false;
  }
  return user.orgs.some((m) => String(m.orgId) === planOrg);
}

router.get('/plans/:id', authMiddleware(), async (req, res) => {
  try {
    const user = requireUser(req);
    if (!user) {
      sendForbidden(res, 'authentication required');
      return;
    }
    const plan = await defaultPlanStore.get(req.params.id as string);
    if (!plan) {
      sendNotFound(res, 'Plan not found');
      return;
    }
    if (!callerOwnsPlan(user, plan)) {
      // Return 404 (not 403) to avoid leaking plan existence cross-tenant.
      sendNotFound(res, 'Plan not found');
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get plan');
  }
});

router.post(
  '/plans',
  authMiddleware(),
  validateBody(
    bodyShape({
      context: z.unknown().optional(),
      objective: z.unknown().optional(),
      orgId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const user = requireUser(req);
      if (!user) {
        sendForbidden(res, 'authentication required');
        return;
      }
      const { objective, context } = req.body as {
        objective?: string;
        context?: unknown;
      };
      if (!objective || typeof objective !== 'string' || !objective.trim()) {
        sendBadRequest(res, 'objective is required');
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
          sendForbidden(res, 'user has no org membership; cannot create plans');
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
      handleRouteError(res, err, 'Failed to create plan');
    }
  },
);

router.get('/plans/:id/fallbacks', authMiddleware(), async (req, res) => {
  try {
    const user = requireUser(req);
    if (!user) {
      sendForbidden(res, 'authentication required');
      return;
    }
    const plan = await defaultPlanStore.get(req.params.id as string);
    if (!plan) {
      sendNotFound(res, 'Plan not found');
      return;
    }
    if (!callerOwnsPlan(user, plan)) {
      sendNotFound(res, 'Plan not found');
      return;
    }
    const fallbacks = await getPlanFallbacks(plan);
    sendSuccess(res, { items: fallbacks, total: fallbacks.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list fallbacks');
  }
});

/**
 * Approve or deny a gated step on a plan. Approve clears the requiredApproval
 * flag and marks the step ready; deny marks the step skipped with the reason
 * recorded in step metadata. Approval decisions are recorded in plan metadata
 * as an audit trail keyed by step id.
 */
async function decideStep(
  req: Request,
  res: import('express').Response,
  decision: 'approved' | 'denied',
): Promise<void> {
  const user = requireUser(req);
  if (!user) {
    sendForbidden(res, 'authentication required');
    return;
  }
  const planId = req.params.id as string;
  const stepId = req.params.stepId as string;
  const plan = await defaultPlanStore.get(planId);
  if (!plan) {
    sendNotFound(res, 'Plan not found');
    return;
  }
  if (!callerOwnsPlan(user, plan)) {
    sendNotFound(res, 'Plan not found');
    return;
  }
  const step = plan.steps.find((s) => s.stepId === stepId);
  if (!step) {
    sendNotFound(res, 'Step not found');
    return;
  }
  if (!step.requiredApproval) {
    sendBadRequest(res, 'Step does not require approval');
    return;
  }
  const note =
    typeof (req.body as { note?: unknown })?.note === 'string'
      ? ((req.body as { note?: string }).note ?? '').slice(0, 500)
      : '';
  const decidedAt = Date.now();
  const decisions = (plan.metadata['stepDecisions'] as Record<string, unknown> | undefined) ?? {};
  const audit = {
    decision,
    actorId: user.id ?? null,
    actorRole: user.roles?.[0] ?? null,
    note: note || undefined,
    at: decidedAt,
  };
  const nextMetadata = {
    ...plan.metadata,
    stepDecisions: { ...decisions, [stepId]: audit },
  };
  if (decision === 'approved') {
    step.requiredApproval = false;
    step.status = 'ready';
  } else {
    step.status = 'skipped';
  }
  step.metadata = {
    ...step.metadata,
    approvalDecision: audit,
  };
  await defaultPlanStore.put({
    ...plan,
    metadata: nextMetadata,
    updatedAt: decidedAt,
  });
  const updated = await defaultPlanStore.get(planId);
  sendSuccess(res, updated ?? plan);
}

router.post(
  '/plans/:id/steps/:stepId/approve',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      await decideStep(req, res, 'approved');
    } catch (err) {
      handleRouteError(res, err, 'Failed to approve step');
    }
  },
);

router.post(
  '/plans/:id/steps/:stepId/deny',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      await decideStep(req, res, 'denied');
    } catch (err) {
      handleRouteError(res, err, 'Failed to deny step');
    }
  },
);

// Alias: /reject mirrors /deny. The Planner Studio UI uses /reject to match
// the operator-facing terminology; /deny is kept for backward compatibility.
router.post(
  '/plans/:id/steps/:stepId/reject',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      await decideStep(req, res, 'denied');
    } catch (err) {
      handleRouteError(res, err, 'Failed to reject step');
    }
  },
);

router.post(
  '/plans/:id/execute',
  authMiddleware(),
  validateBody(
    bodyShape({
      approvedStepIds: z.unknown().optional(),
      runId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const user = requireUser(req);
      if (!user) {
        sendForbidden(res, 'authentication required');
        return;
      }
      const planId = req.params.id as string;
      const plan = await defaultPlanStore.get(planId);
      if (!plan) {
        sendNotFound(res, 'Plan not found');
        return;
      }
      if (!callerOwnsPlan(user, plan)) {
        sendNotFound(res, 'Plan not found');
        return;
      }

      const body = (req.body ?? {}) as {
        approvedStepIds?: unknown;
        runId?: unknown;
      };
      const approvedStepIds = Array.isArray(body.approvedStepIds)
        ? body.approvedStepIds.filter((s): s is string => typeof s === 'string')
        : undefined;
      const runId = typeof body.runId === 'string' ? body.runId : undefined;

      const result = await executePlan(planId, {
        store: defaultPlanStore,
        approvedStepIds,
        runId,
      });

      // Re-fetch so the response includes the persisted live step state.
      const updated = (await defaultPlanStore.get(planId)) ?? plan;
      sendSuccess(res, { run: result, plan: updated });
    } catch (err) {
      if (err instanceof PlanNotFoundError) {
        sendNotFound(res, err.message);
        return;
      }
      handleRouteError(res, err, 'Failed to execute plan');
    }
  },
);

router.post(
  '/plans/:id/replay',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const user = requireUser(req);
      if (!user) {
        sendForbidden(res, 'authentication required');
        return;
      }
      const plan = await defaultPlanStore.get(req.params.id as string);
      if (!plan) {
        sendNotFound(res, 'Plan not found');
        return;
      }
      if (!callerOwnsPlan(user, plan)) {
        sendNotFound(res, 'Plan not found');
        return;
      }
      const result = await replayPlan(req.params.id as string);
      sendSuccess(res, result);
    } catch (err) {
      if (err instanceof PlanNotFoundError) {
        sendNotFound(res, err.message);
        return;
      }
      handleRouteError(res, err, 'Failed to replay plan');
    }
  },
);

export default router;
