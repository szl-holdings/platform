import type { Request, Response, NextFunction } from "express";
import { getSessionToken, getSessionUser } from "../lib/auth";
import { sendUnauthorized, sendForbidden, sendError } from "../lib/api-response";
import type { RoleName } from "@szl-holdings/db";
import { logger } from "../lib/logger";
import { verifyInternalHeader, tokenHasScope } from "../lib/internal-tokens";

const ADMIN_ROLES: RoleName[] = ["super_admin", "ops", "exec"];

/**
 * Check whether the request carries an authorized internal service token for
 * an admin route. Tokens come from the scoped registry (see internal-tokens.ts
 * and docs/SECRETS_POLICY.md). Admin routes require `internal:write` scope.
 *
 * Note: the legacy ALLOY_INTERNAL_TOKEN intentionally does NOT carry
 * `internal:write` (and is not on this route's path allowlist), so a legacy
 * token cannot bypass admin-guard. Only scoped tokens that explicitly declare
 * `internal:write` and include the admin route in their `pathPrefixes` pass
 * here. This is the GAP-016 closure criterion for admin/global bypass
 * containment.
 */
function hasInternalServiceToken(req: Request): boolean {
  const header = req.headers["x-internal-token"] as string | undefined;
  // Use originalUrl so path-prefix scoping is checked against the externally-
  // visible path, not the router-relative path (req.path strips the mount).
  const match = verifyInternalHeader(header, req.originalUrl || req.url);
  if (!match) return false;
  if (!tokenHasScope(match.context, "internal:write")) {
    logger.warn(
      { tokenName: match.context.name, path: req.path, scopes: Array.from(match.context.scopes) },
      "[admin-guard] Internal token rejected — missing internal:write scope"
    );
    return false;
  }
  return true;
}

export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  if (hasInternalServiceToken(req)) {
    next();
    return;
  }

  const token = getSessionToken(req);
  if (!token) {
    sendUnauthorized(res, "Admin access requires authentication");
    return;
  }

  getSessionUser(token).then(user => {
    if (!user) {
      sendUnauthorized(res, "Invalid or expired session");
      return;
    }

    const hasAdminRole = user.roles.some(r => ADMIN_ROLES.includes(r as RoleName));
    if (!hasAdminRole) {
      logger.warn({ userId: user.id, roles: user.roles }, "Admin route access denied — insufficient role");
      sendForbidden(res, "Admin access requires elevated role");
      return;
    }

    next();
  }).catch(err => {
    logger.error({ err }, "Admin guard error");
    sendError(res, "Authentication error", 500, "INTERNAL_ERROR");
  });
}
