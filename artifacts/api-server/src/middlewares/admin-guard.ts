import type { Request, Response, NextFunction } from "express";
import { getSessionToken, getSessionUser } from "../lib/auth";
import type { RoleName } from "@szl-holdings/db";
import { logger } from "../lib/logger";

const ADMIN_ROLES: RoleName[] = ["super_admin", "ops", "exec"];

/**
 * Check whether the request carries the platform-internal service token.
 * Server-to-server calls (e.g., AlloyChat → admin endpoints) must include
 * `x-internal-token: <ALLOY_INTERNAL_TOKEN>` in the request headers.
 * This is the only non-user bypass path — requires explicit configuration.
 */
function hasInternalServiceToken(req: Request): boolean {
  const internalSecret = process.env.ALLOY_INTERNAL_TOKEN;
  if (!internalSecret) return false;

  const header = req.headers["x-internal-token"] as string | undefined;
  if (!header) return false;

  try {
    return header.length === internalSecret.length &&
      Buffer.from(header).equals(Buffer.from(internalSecret));
  } catch {
    return false;
  }
}

export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  if (hasInternalServiceToken(req)) {
    next();
    return;
  }

  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: "Admin access requires authentication" });
    return;
  }

  getSessionUser(token).then(user => {
    if (!user) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    const hasAdminRole = user.roles.some(r => ADMIN_ROLES.includes(r as RoleName));
    if (!hasAdminRole) {
      logger.warn({ userId: user.id, roles: user.roles }, "Admin route access denied — insufficient role");
      res.status(403).json({ error: "Admin access requires elevated role" });
      return;
    }

    next();
  }).catch(err => {
    logger.error({ err }, "Admin guard error");
    res.status(500).json({ error: "Authentication error" });
  });
}
