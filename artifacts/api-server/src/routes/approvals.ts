import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/approvals", authMiddleware(), async (req: Request, res: Response) => {
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

router.get("/approvals", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance", "analyst"), async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query["status"] as string | undefined;
    const user = req.user;
    const isAdmin = user?.roles?.some(r => ["super_admin", "admin"].includes(r)) ?? false;
    const orgId = isAdmin ? undefined : (user?.orgs?.[0]?.orgId ?? undefined);

    const { listPendingApprovals } = await import("@szl-holdings/covenant-policy");
    const results = await listPendingApprovals({
      orgId,
      limit,
    });

    sendSuccess(res, results, 200, { page, limit, total: results.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list approvals");
  }
});

router.get("/approvals/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const { getApprovalById } = await import("@szl-holdings/covenant-policy");
    const approval = await getApprovalById(id);

    if (!approval) { sendNotFound(res, "Approval"); return; }

    sendSuccess(res, approval);
  } catch (err) {
    handleRouteError(res, err, "Failed to get approval");
  }
});

router.post("/approvals/:id/review", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const { decision, note } = req.body as { decision?: string; note?: string };
    if (!decision || !["approved", "rejected", "revised"].includes(decision)) {
      sendBadRequest(res, "decision must be one of: approved, rejected, revised");
      return;
    }

    const { reviewApproval } = await import("@szl-holdings/covenant-policy");
    const updated = await reviewApproval({
      approvalId: id,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.roles?.[0],
      decision: decision as "approved" | "rejected" | "revised",
      note,
      correlationId: (req as unknown as { correlationId?: string }).correlationId,
      serviceAttribution: "api-server",
    });

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to review approval");
  }
});

router.post("/approvals/:id/escalate", authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const { reason, escalatedToId } = req.body as { reason?: string; escalatedToId?: number };
    if (!reason) {
      sendBadRequest(res, "reason is required");
      return;
    }

    const { escalateApproval } = await import("@szl-holdings/covenant-policy");
    const updated = await escalateApproval({
      approvalId: id,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.roles?.[0],
      escalatedToId,
      reason,
      correlationId: (req as unknown as { correlationId?: string }).correlationId,
      serviceAttribution: "api-server",
    });

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate approval");
  }
});

router.post("/approvals/:id/comment", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid approval ID"); return; }

    const { body, isInternal } = req.body as { body?: string; isInternal?: boolean };
    if (!body) { sendBadRequest(res, "body is required"); return; }

    const { addApprovalComment, getApprovalById } = await import("@szl-holdings/covenant-policy");
    const approval = await getApprovalById(id);
    if (!approval) { sendNotFound(res, "Approval"); return; }

    await addApprovalComment({
      approvalId: id,
      orgId: approval.orgId,
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

    const { getApprovalAuditTrail, getApprovalById } = await import("@szl-holdings/covenant-policy");
    const approval = await getApprovalById(id);
    if (!approval) { sendNotFound(res, "Approval"); return; }

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
    sendSuccess(res, results);
  } catch (err) {
    handleRouteError(res, err, "Failed to list approvals for resource");
  }
});

router.post("/audit-log/policy-appeal", authMiddleware(), async (req: Request, res: Response) => {
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
