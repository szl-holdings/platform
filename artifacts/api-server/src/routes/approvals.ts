import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validateBody, approvalCreateSchema, approvalReviewSchema, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";
import {
  POLICY_TIER_DESCRIPTIONS,
  TIER_RISK_LEVEL,
  TIER_NUMBER,
  TIER_CONTROLS,
  PolicyTierSchema,
  type GuardianRule,
  type PolicyTier,
} from "@workspace/guardian";
import { getGuardianEngine, syncGuardianPolicies } from "../lib/guardian-engine";

const router: IRouter = Router();

interface MatchedRuleDetails {
  id: string;
  name: string;
  description?: string;
  tier: string;
  action: string;
  conditions: GuardianRule["conditions"];
  priority: number;
  enabled: boolean;
  owner?: string;
  tags: string[];
  source: "guardian-engine" | "unknown";
}

interface TierDetails {
  tier: PolicyTier;
  tierNumber: number;
  description: string;
  riskLevel: number;
  approvalGate: "none" | "single" | "dual";
  requiresRollback: boolean;
  redactPII: boolean;
  allowExternalComms: boolean;
}

function lookupTierDetails(tier: unknown): TierDetails | null {
  if (typeof tier !== "string") return null;
  const parsed = PolicyTierSchema.safeParse(tier);
  if (!parsed.success) return null;
  const t = parsed.data;
  const controls = TIER_CONTROLS[t];
  return {
    tier: t,
    tierNumber: TIER_NUMBER[t],
    description: POLICY_TIER_DESCRIPTIONS[t],
    riskLevel: TIER_RISK_LEVEL[t],
    approvalGate: controls.approvalGate,
    requiresRollback: controls.requiresRollback,
    redactPII: controls.redactPII,
    allowExternalComms: controls.allowExternalComms,
  };
}

function lookupMatchedRule(matchedRuleId: unknown): MatchedRuleDetails | null {
  if (typeof matchedRuleId !== "string" || matchedRuleId.length === 0) return null;
  const rule = getGuardianEngine().getRules().find((r: GuardianRule) => r.id === matchedRuleId);
  if (!rule) return null;
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    tier: rule.tier,
    action: rule.action,
    conditions: rule.conditions ?? [],
    priority: rule.priority,
    enabled: rule.enabled,
    owner: rule.owner,
    tags: rule.tags ?? [],
    source: "guardian-engine",
  };
}

interface ApprovalLike {
  payload?: Record<string, unknown> | null;
  [k: string]: unknown;
}

/**
 * Hydrate an approval row with the live Guardian rule + tier metadata so
 * operators can see the full policy context inline. The hydrated values
 * always reflect the current rule registry — they are never persisted onto
 * the approval row, so policy edits are picked up immediately.
 */
function hydrateApproval<T extends ApprovalLike>(approval: T): T {
  const payload = (approval.payload ?? {}) as Record<string, unknown>;
  const matchedRuleDetails = lookupMatchedRule(payload["matchedRuleId"]);
  const tierDetails =
    lookupTierDetails(payload["tier"]) ??
    (matchedRuleDetails ? lookupTierDetails(matchedRuleDetails.tier) : null);

  if (!matchedRuleDetails && !tierDetails) return approval;

  return {
    ...approval,
    payload: {
      ...payload,
      ...(matchedRuleDetails ? { matchedRuleDetails } : {}),
      ...(tierDetails ? { tierDetails } : {}),
    },
  };
}

async function hydrateApprovals<T extends ApprovalLike>(rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;
  // Refresh the engine if any approval references a rule we don't recognise.
  const engine = getGuardianEngine();
  const knownIds = new Set(engine.getRules().map((r: GuardianRule) => r.id));
  const needsSync = rows.some((row) => {
    const id = (row.payload as Record<string, unknown> | null)?.["matchedRuleId"];
    return typeof id === "string" && id.length > 0 && !knownIds.has(id);
  });
  if (needsSync) {
    try {
      await syncGuardianPolicies(false);
    } catch (err) {
      logger.debug({ err }, "approvals.hydrate.sync-skipped");
    }
  }
  return rows.map((row) => hydrateApproval(row));
}

const ADMIN_ROLES = new Set(["super_admin", "admin"]);

/**
 * Tenant access guard for /approvals/:id/* routes. Returns the loaded approval
 * if the actor may access it, or sends the appropriate error response and
 * returns null. Admins bypass org scoping.
 */
async function loadAccessibleApproval(
  req: Request,
  res: Response,
  approvalId: number,
): Promise<{ orgId: number | null; status: string } | null> {
  const { getApprovalById } = await import("@szl-holdings/covenant-policy");
  const approval = await getApprovalById(approvalId);
  if (!approval) {
    sendNotFound(res, "Approval");
    return null;
  }
  const user = req.user;
  const isAdmin = user?.roles?.some((r) => ADMIN_ROLES.has(r)) ?? false;
  if (!isAdmin) {
    const userOrgId = user?.orgs?.[0]?.orgId ?? null;
    if (approval.orgId != null && approval.orgId !== userOrgId) {
      sendForbidden(res, "Approval is outside your organization");
      return null;
    }
  }
  return { orgId: approval.orgId, status: approval.status };
}

function callerOrgIdForGuard(req: Request): number | null {
  const user = req.user;
  const isAdmin = user?.roles?.some((r) => ADMIN_ROLES.has(r)) ?? false;
  if (isAdmin) return null;
  return user?.orgs?.[0]?.orgId ?? null;
}

router.post("/approvals", authMiddleware(), validateBody(approvalCreateSchema), async (req: Request, res: Response) => {
  try {
    const {
      resourceType,
      resourceId,
      title,
      description,
      actionClass,
      priority,
      requiredApproverRole,
      expiresInHours,
      payload,
    } = req.body as {
      resourceType?: string;
      resourceId?: string;
      title?: string;
      description?: string;
      actionClass?: string;
      priority?: string;
      requiredApproverRole?: string;
      expiresInHours?: number;
      payload?: Record<string, unknown>;
    };

    if (!resourceType || !resourceId || !title) {
      sendBadRequest(res, "resourceType, resourceId, and title are required");
      return;
    }

    const { createApprovalRequest } = await import("@szl-holdings/covenant-policy");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? null;

    const approval = await createApprovalRequest({
      orgId,
      resourceType,
      resourceId,
      title,
      description,
      actionClass: actionClass ?? "general",
      priority: (priority as "low" | "medium" | "high" | "critical") ?? "medium",
      requestedById: user?.id ?? null,
      requestedByRole: user?.roles?.[0] ?? undefined,
      requiredApproverRole,
      expiresAt: expiresInHours
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        : undefined,
      correlationId: (req as unknown as { correlationId?: string }).correlationId,
      serviceAttribution: "api-server",
      payload,
    });

    sendCreated(res, approval);
  } catch (err) {
    handleRouteError(res, err, "Failed to create approval request");
  }
});

router.get("/approvals", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance", "analyst"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const user = req.user;
    const isAdmin = user?.roles?.some(r => ["super_admin", "admin"].includes(r)) ?? false;
    const orgId = isAdmin ? undefined : (user?.orgs?.[0]?.orgId ?? undefined);

    const { listPendingApprovals, listApprovals } = await import("@szl-holdings/covenant-policy");
    const results =
      status === "all"
        ? await listApprovals({ orgId, limit })
        : status && status !== "pending" && status !== "escalated"
          ? await listApprovals({
              orgId,
              limit,
              statuses: [status as "approved" | "rejected" | "revised" | "expired" | "withdrawn"],
            })
          : await listPendingApprovals({ orgId, limit });

    const hydrated = await hydrateApprovals(results);
    sendSuccess(res, hydrated, 200, { page, limit, total: hydrated.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list approvals");
  }
});

router.get("/approvals/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const guard = await loadAccessibleApproval(req, res, id);
    if (!guard) return;

    const { getApprovalById } = await import("@szl-holdings/covenant-policy");
    const approval = await getApprovalById(id);
    if (!approval) { sendNotFound(res, "Approval"); return; }

    const [hydrated] = await hydrateApprovals([approval as ApprovalLike]);
    sendSuccess(res, hydrated);
  } catch (err) {
    handleRouteError(res, err, "Failed to get approval");
  }
});

router.post("/approvals/:id/review", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance"), validateBody(approvalReviewSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const { decision, note } = req.body as { decision?: string; note?: string };
    if (!decision || !["approved", "rejected", "revised"].includes(decision)) {
      sendBadRequest(res, "decision must be one of: approved, rejected, revised");
      return;
    }

    const guard = await loadAccessibleApproval(req, res, id);
    if (!guard) return;

    const { reviewApproval, getApprovalById, ApprovalAccessDeniedError } = await import("@szl-holdings/covenant-policy");
    let updated;
    try {
      updated = await reviewApproval({
        approvalId: id,
        actorId: req.user?.id ?? null,
        actorRole: req.user?.roles?.[0],
        decision: decision as "approved" | "rejected" | "revised",
        note,
        correlationId: (req as unknown as { correlationId?: string }).correlationId,
        serviceAttribution: "api-server",
        expectedOrgId: callerOrgIdForGuard(req),
      });
    } catch (err) {
      if (err instanceof ApprovalAccessDeniedError) {
        sendForbidden(res, err.message);
        return;
      }
      throw err;
    }

    try {
      const full = await getApprovalById(id);
      const payload = (full?.payload ?? {}) as {
        runId?: string;
        stepId?: string;
        planId?: string;
      };
      const runId = payload.runId ?? full?.correlationId ?? undefined;
      if (runId) {
        const { getAlloyRunManager } = await import("../lib/alloy-run-manager-singleton");
        await getAlloyRunManager().recordApprovalDecision({
          runId,
          approvalId: id,
          decision: decision as "approved" | "rejected" | "revised",
          actorId: req.user?.id ?? null,
          actorRole: req.user?.roles?.[0],
          note,
          stepId: payload.stepId,
        });
      }

      // If the approval is for a plan step gate, flip the step's persisted
      // status so the next executePlan call resumes from the gated step.
      // We require the linked plan's tenant orgId (string) to match the
      // approval's tenant orgId (number). This prevents an approval payload
      // with an arbitrary planId from mutating a plan in a different tenant
      // (IDOR via approval payload).
      if (
        decision === "approved" &&
        typeof payload.planId === "string" &&
        typeof payload.stepId === "string"
      ) {
        try {
          const { defaultPlanStore } = await import("@workspace/planner");
          const linkedPlan = await defaultPlanStore.get(payload.planId);
          if (!linkedPlan) {
            logger.warn(
              { approvalId: id, planId: payload.planId },
              "approvals.plan-step-flip-skipped-plan-missing",
            );
          } else {
            const planOrg = linkedPlan.context["orgId"];
            const approvalOrg = guard.orgId;
            const planScopedOk =
              approvalOrg == null
                ? typeof planOrg !== "string"
                : typeof planOrg === "string" && planOrg === String(approvalOrg);
            if (!planScopedOk) {
              logger.warn(
                {
                  approvalId: id,
                  planId: payload.planId,
                  planOrg,
                  approvalOrg,
                },
                "approvals.plan-step-flip-denied-cross-tenant",
              );
            } else {
              const { approvePlanStep } = await import(
                "@workspace/alloy/plan-orchestrator"
              );
              await approvePlanStep(payload.planId, payload.stepId);
            }
          }
        } catch (err) {
          logger.warn(
            { err, approvalId: id, planId: payload.planId, stepId: payload.stepId },
            "approvals.plan-step-flip-failed",
          );
        }
      }
    } catch (err) {
      logger.warn({ err, approvalId: id }, "approvals.ledger-writeback-failed");
    }

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to review approval");
  }
});

router.post("/approvals/:id/escalate", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const { reason, escalatedToId } = req.body as { reason?: string; escalatedToId?: number };
    if (!reason) {
      sendBadRequest(res, "reason is required");
      return;
    }

    const guard = await loadAccessibleApproval(req, res, id);
    if (!guard) return;

    const { escalateApproval, ApprovalAccessDeniedError } = await import("@szl-holdings/covenant-policy");
    let updated;
    try {
      updated = await escalateApproval({
        approvalId: id,
        actorId: req.user?.id ?? null,
        actorRole: req.user?.roles?.[0],
        escalatedToId,
        reason,
        correlationId: (req as unknown as { correlationId?: string }).correlationId,
        serviceAttribution: "api-server",
        expectedOrgId: callerOrgIdForGuard(req),
      });
    } catch (err) {
      if (err instanceof ApprovalAccessDeniedError) {
        sendForbidden(res, err.message);
        return;
      }
      throw err;
    }

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate approval");
  }
});

router.post("/approvals/:id/comment", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const { body, isInternal } = req.body as { body?: string; isInternal?: boolean };
    if (!body) { sendBadRequest(res, "body is required"); return; }

    const guard = await loadAccessibleApproval(req, res, id);
    if (!guard) return;

    const { addApprovalComment } = await import("@szl-holdings/covenant-policy");
    await addApprovalComment({
      approvalId: id,
      orgId: guard.orgId,
      authorId: req.user?.id ?? null,
      authorRole: req.user?.roles?.[0],
      body,
      isInternal: isInternal ?? false,
    });

    sendSuccess(res, { message: "Comment added" });
  } catch (err) {
    handleRouteError(res, err, "Failed to add comment");
  }
});

router.get("/approvals/:id/audit-trail", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const guard = await loadAccessibleApproval(req, res, id);
    if (!guard) return;

    const { getApprovalAuditTrail } = await import("@szl-holdings/covenant-policy");
    const trail = await getApprovalAuditTrail(id);
    sendSuccess(res, trail);
  } catch (err) {
    handleRouteError(res, err, "Failed to get audit trail");
  }
});

router.get("/approvals/by-resource/:resourceType/:resourceId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId } = req.params as { resourceType: string; resourceId: string };

    const { listApprovalsByResource } = await import("@szl-holdings/covenant-policy");
    const results = await listApprovalsByResource(resourceType, resourceId);

    const user = req.user;
    const isAdmin = user?.roles?.some((r) => ADMIN_ROLES.has(r)) ?? false;
    const userOrgId = user?.orgs?.[0]?.orgId ?? null;
    const filtered = isAdmin
      ? results
      : results.filter((r) => r.orgId == null || r.orgId === userOrgId);

    sendSuccess(res, filtered);
  } catch (err) {
    handleRouteError(res, err, "Failed to list approvals for resource");
  }
});

router.post("/audit-log/policy-appeal", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { requestId, action, justification } = req.body as {
      requestId?: string;
      action?: string;
      justification?: string;
    };

    if (!requestId || !action) {
      sendBadRequest(res, "requestId and action are required");
      return;
    }

    if (!["escalate", "appeal"].includes(action)) {
      sendBadRequest(res, "action must be one of: escalate, appeal");
      return;
    }

    if (action === "appeal" && (!justification || justification.trim().length < 8)) {
      sendBadRequest(res, "justification is required for an appeal (min 8 chars)");
      return;
    }

    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? null;

    logger.info(
      {
        requestId,
        action,
        justificationLength: justification?.length ?? 0,
        actorId: user?.id ?? null,
        actorRole: user?.roles?.[0] ?? null,
        orgId,
        correlationId: (req as unknown as { correlationId?: string }).correlationId,
      },
      "policy.appeal.recorded",
    );

    sendCreated(res, {
      requestId,
      action,
      recordedAt: new Date().toISOString(),
      actorId: user?.id ?? null,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to record policy appeal");
  }
});

export default router;
