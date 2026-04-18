import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { getSessionToken, getSessionUser } from "../lib/auth";
import { sendUnauthorized, sendForbidden, sendError } from "../lib/api-response";
import type { RoleName } from "@szl-holdings/db";
import { logger } from "../lib/logger";

const ADMIN_ROLES: RoleName[] = ["super_admin", "ops", "exec"];

/**
 * Fixed-size HMAC digest of a string value.
 * By hashing both the secret and the header with the same key, both outputs
 * are always 32 bytes regardless of input length.  This eliminates the
 * length side-channel that would leak whether the header length matches the
 * configured secret length before the constant-time comparison runs.
 */
const TOKEN_HMAC_KEY = Buffer.from("szl-internal-token-comparison-key", "utf8");
function tokenDigest(val: string): Buffer {
  return createHmac("sha256", TOKEN_HMAC_KEY).update(Buffer.from(val, "utf8")).digest();
}

/**
 * Check whether the request carries the platform-internal service token.
 * Server-to-server calls (e.g., AlloyChat → admin endpoints) must include
 * `x-internal-token: <ALLOY_INTERNAL_TOKEN>` in the request headers.
 * This is the only non-user bypass path — requires explicit configuration.
 *
 * Comparison uses HMAC digests via timingSafeEqual to prevent both timing
 * and length side-channel attacks.
 */
function hasInternalServiceToken(req: Request): boolean {
  const internalSecret = process.env.ALLOY_INTERNAL_TOKEN;
  if (!internalSecret) return false;

  const header = req.headers["x-internal-token"] as string | undefined;
  if (!header) return false;

  try {
    return timingSafeEqual(tokenDigest(internalSecret), tokenDigest(header));
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
