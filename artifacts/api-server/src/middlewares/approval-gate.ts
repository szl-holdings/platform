/**
 * Approval Gate Middleware
 *
 * Enforces that material mutations — exports, external sends, write-backs,
 * and consequential AI actions — require an explicit approval record before
 * execution. Integrates with the @szl-holdings/covenant-policy primitive.
 *
 * Usage:
 *   router.post("/risky-action", authMiddleware(), requireApproval({ actionClass: "ai_action" }), handler)
 */

import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "./auth";
import { logger } from "../lib/logger";

export type ApprovalGateMode =
  | "enforce"      // Hard block — must have pre-issued approvalId in request
  | "propose"      // Propose only — create approval request, return 202
  | "audit_only";  // Log but do not block

export interface ApprovalGateOptions {
  actionClass: string;
  mode?: ApprovalGateMode;
  requiredApproverRole?: string;
  bypassRoles?: string[];
  bypassInDev?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      approvalId?: number;
      approvalContext?: {
        actionClass: string;
        requestedBy?: number;
        requiredApproverRole?: string;
        mode: ApprovalGateMode;
      };
    }
  }
}

function hasRole(user: AuthenticatedUser | undefined, roles: string[]): boolean {
  if (!user) return false;
  return user.roles.some(r => roles.includes(r));
}

export function requireApproval(options: ApprovalGateOptions) {
  const {
    actionClass,
    mode = "enforce",
    requiredApproverRole,
    bypassRoles = ["super_admin"],
    bypassInDev = true,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const isDev = process.env["NODE_ENV"] === "development" || process.env["NODE_ENV"] === "test";

    if (bypassInDev && isDev) {
      logger.info({
        msg: "Approval gate bypassed (dev mode)",
        actionClass,
        path: req.path,
      });
      req.approvalContext = { actionClass, requestedBy: req.user?.id, requiredApproverRole, mode };
      next();
      return;
    }

    if (hasRole(req.user, bypassRoles)) {
      logger.info({
        msg: "Approval gate bypassed (role bypass)",
        actionClass,
        userId: req.user?.id,
        roles: req.user?.roles,
        path: req.path,
      });
      req.approvalContext = { actionClass, requestedBy: req.user?.id, requiredApproverRole, mode };
      next();
      return;
    }

    if (mode === "audit_only") {
      req.approvalContext = { actionClass, requestedBy: req.user?.id, requiredApproverRole, mode };
      next();
      return;
    }

    if (mode === "propose") {
      logger.info({
        msg: "Approval gate in propose mode — returning 202",
        actionClass,
        userId: req.user?.id,
        path: req.path,
      });
      req.approvalContext = { actionClass, requestedBy: req.user?.id, requiredApproverRole, mode };
      res.status(202).json({
        success: false,
        code: "APPROVAL_REQUIRED",
        message: `Action '${actionClass}' requires explicit approval. Submit an approval request and retry with the approvalId.`,
        actionClass,
        requiredApproverRole: requiredApproverRole ?? "admin",
        mode: "propose",
      });
      return;
    }

    const rawApprovalId = req.headers["x-approval-id"] ?? req.body?.approvalId ?? req.query?.["approvalId"];
    const approvalId = rawApprovalId ? parseInt(String(rawApprovalId), 10) : undefined;

    if (!approvalId || isNaN(approvalId)) {
      logger.warn({
        msg: "Approval gate: no approvalId provided",
        actionClass,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
      });
      res.status(403).json({
        success: false,
        code: "APPROVAL_REQUIRED",
        message: `Action '${actionClass}' requires an approved approval request. Provide the approvalId via X-Approval-ID header or request body.`,
        actionClass,
        requiredApproverRole: requiredApproverRole ?? "admin",
      });
      return;
    }

    req.approvalId = approvalId;
    req.approvalContext = { actionClass, requestedBy: req.user?.id, requiredApproverRole, mode };

    logger.info({
      msg: "Approval gate: approvalId present, proceeding",
      approvalId,
      actionClass,
      userId: req.user?.id,
      path: req.path,
    });

    next();
  };
}

export function validateApprovalStatus() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const approvalId = req.approvalId;
    if (!approvalId) {
      next();
      return;
    }

    try {
      const { getApprovalById } = await import("@szl-holdings/covenant-policy");
      const approval = await getApprovalById(approvalId);

      if (!approval) {
        res.status(403).json({
          success: false,
          code: "APPROVAL_NOT_FOUND",
          message: `Approval request ${approvalId} not found.`,
        });
        return;
      }

      if (approval.status !== "approved") {
        res.status(403).json({
          success: false,
          code: "APPROVAL_NOT_APPROVED",
          message: `Approval request ${approvalId} is in status '${approval.status}' — must be 'approved' to proceed.`,
          approvalStatus: approval.status,
        });
        return;
      }

      if (approval.expiresAt && approval.expiresAt < new Date()) {
        res.status(403).json({
          success: false,
          code: "APPROVAL_EXPIRED",
          message: `Approval request ${approvalId} has expired.`,
        });
        return;
      }

      logger.info({
        msg: "Approval validated",
        approvalId,
        resourceType: approval.resourceType,
        resourceId: approval.resourceId,
        userId: req.user?.id,
      });

      next();
    } catch (err) {
      logger.error({ err, approvalId }, "Failed to validate approval");
      res.status(500).json({ success: false, error: "Failed to validate approval" });
    }
  };
}
