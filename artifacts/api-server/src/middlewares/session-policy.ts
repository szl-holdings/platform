/**
 * Session Policy Middleware
 *
 * Implements:
 *   - Session sliding window refresh (auto-extend TTL on active use)
 *   - Session timeout enforcement (absolute max age)
 *   - Admin impersonation session management with audit trail
 *
 * Constants:
 *   SESSION_TTL            = 7 days (hard expiry from creation)
 *   SESSION_REFRESH_WINDOW = 1 day  (refresh if < 1 day remaining)
 *   IMPERSONATION_TTL      = 1 hour
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { db, sessionsTable, usersTable, auditEventsTable, userRolesTable, rolesTable } from "@workspace/db";
import { eq, and, gt, desc } from "drizzle-orm";
import { SESSION_COOKIE, SESSION_TTL, setSessionCookie } from "../lib/auth";
import { logger } from "../lib/logger";
import type { RoleName } from "@workspace/db";
import type { AuthenticatedUser } from "./auth";

export const SESSION_REFRESH_WINDOW = 24 * 60 * 60 * 1000;
export const IMPERSONATION_TTL = 60 * 60 * 1000;
export const IMPERSONATION_HEADER = "x-impersonation-session";

declare global {
  namespace Express {
    interface Request {
      isImpersonation?: boolean;
      impersonatingUserId?: number;
    }
  }
}

/**
 * Sliding window session refresh middleware.
 *
 * Policy:
 * - Absolute max age = SESSION_TTL from session creation (createdAt). Sessions
 *   are never extended past createdAt + SESSION_TTL, preventing indefinite sliding.
 * - Sliding refresh: if the session has fewer than SESSION_REFRESH_WINDOW ms
 *   remaining AND the absolute max age has not been reached, extend expiry up to
 *   the absolute ceiling.
 * - When DB expiry is updated, the response cookie is also refreshed to match so
 *   the client-side cookie does not expire before the DB session.
 *
 * Must be placed AFTER authMiddleware().
 */
export function sessionRefreshPolicy() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.isInternalAgent) {
        next();
        return;
      }

      const token = req.cookies?.[SESSION_COOKIE] ?? extractBearerToken(req);
      if (!token) {
        next();
        return;
      }

      // Impersonation tokens must not be extended — they have a hard 1-hour TTL
      // enforced at creation and must not be prolonged by the sliding refresh policy.
      if (token.startsWith("imp_")) {
        next();
        return;
      }

      const [session] = await db
        .select({ id: sessionsTable.id, expiresAt: sessionsTable.expiresAt, createdAt: sessionsTable.createdAt })
        .from(sessionsTable)
        .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, new Date())))
        .limit(1);

      if (!session) {
        next();
        return;
      }

      const absoluteCeiling = new Date(session.createdAt.getTime() + SESSION_TTL);
      const now = Date.now();

      if (now >= absoluteCeiling.getTime()) {
        next();
        return;
      }

      const remaining = session.expiresAt.getTime() - now;
      if (remaining < SESSION_REFRESH_WINDOW) {
        const newExpiry = new Date(Math.min(now + SESSION_TTL, absoluteCeiling.getTime()));
        await db
          .update(sessionsTable)
          .set({ expiresAt: newExpiry })
          .where(eq(sessionsTable.id, session.id));

        if (req.cookies?.[SESSION_COOKIE]) {
          setSessionCookie(res, token);
        }
      }

      next();
    } catch (err) {
      logger.warn({ err }, "Session refresh policy error — non-fatal");
      next();
    }
  };
}

function extractBearerToken(req: Request): string | undefined {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return undefined;
}

/**
 * Write an audit event for an auth/access action.
 */
type AuditInsert = typeof auditEventsTable.$inferInsert;

async function writeAuditEvent(params: {
  userId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  newValues?: Record<string, unknown>;
}) {
  try {
    const row: AuditInsert = {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      newValues: params.newValues ?? null,
    };
    await db.insert(auditEventsTable).values(row);
  } catch (err) {
    logger.error({ err }, "Failed to write audit event");
  }
}

/**
 * Start an impersonation session.
 * Caller must already be authenticated as super_admin or admin.
 * Returns a short-lived impersonation token.
 */
export async function startImpersonation(params: {
  impersonatorId: number;
  targetUserId: number;
  ipAddress: string | null;
  userAgent: string | null;
  reason?: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const { impersonatorId, targetUserId, ipAddress, userAgent, reason } = params;

  const [target] = await db
    .select({ id: usersTable.id, isActive: usersTable.isActive })
    .from(usersTable)
    .where(eq(usersTable.id, targetUserId))
    .limit(1);

  if (!target || !target.isActive) {
    throw new Error("Target user not found or inactive");
  }

  const impersonatorRoleRows = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, impersonatorId));

  const impersonatorRoleNames = impersonatorRoleRows.map((r) => r.roleName as RoleName);

  const targetRoleRows = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, targetUserId));

  const targetRoleNames = targetRoleRows.map((r) => r.roleName as RoleName);

  const impersonatorIsSuperAdmin = impersonatorRoleNames.includes("super_admin");
  const targetIsElevated = targetRoleNames.includes("super_admin") || targetRoleNames.includes("admin");

  if (!impersonatorIsSuperAdmin && targetIsElevated) {
    throw new Error("Cannot impersonate a user with higher or equal privileges");
  }

  if (!impersonatorRoleNames.includes("super_admin") && !impersonatorRoleNames.includes("admin")) {
    throw new Error("Impersonation requires admin or super_admin role");
  }

  const token = `imp_${crypto.randomBytes(32).toString("hex")}`;
  const expiresAt = new Date(Date.now() + IMPERSONATION_TTL);

  const impersonationMeta = JSON.stringify({ impersonatorId, realUserAgent: userAgent });

  await db.insert(sessionsTable).values({
    userId: targetUserId,
    token,
    expiresAt,
    ipAddress,
    userAgent: impersonationMeta,
  });

  await writeAuditEvent({
    userId: impersonatorId,
    action: "impersonation_start",
    entityType: "user",
    entityId: String(targetUserId),
    ipAddress,
    userAgent,
    newValues: {
      impersonatorId,
      targetUserId,
      expiresAt: expiresAt.toISOString(),
      reason: reason ?? "not specified",
      tokenPrefix: token.slice(0, 8),
    },
  });

  logger.info(
    { impersonatorId, targetUserId },
    "Admin impersonation session started",
  );

  return { token, expiresAt };
}

/**
 * End an impersonation session.
 * Deletes the impersonation token and writes an audit event.
 *
 * Authorization:
 * - Ownership is determined by reading the impersonatorId stored in the session's
 *   userAgent field (encoded at session creation as JSON). This binds the
 *   authorization check to the exact token/session, not a general audit scan.
 * - super_admin may end any impersonation session.
 * - admin may only end sessions they personally started.
 */
export async function endImpersonation(params: {
  impersonatorId: number;
  impersonationToken: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<void> {
  const { impersonatorId, impersonationToken, ipAddress, userAgent } = params;

  if (!impersonationToken.startsWith("imp_")) {
    throw new Error("Invalid impersonation token format");
  }

  const [session] = await db
    .select({ id: sessionsTable.id, userId: sessionsTable.userId, userAgent: sessionsTable.userAgent })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, impersonationToken))
    .limit(1);

  if (!session) {
    throw new Error("Impersonation session not found");
  }

  let sessionImpersonatorId: number | null = null;
  try {
    if (session.userAgent) {
      const meta = JSON.parse(session.userAgent) as { impersonatorId?: number };
      sessionImpersonatorId = meta.impersonatorId ?? null;
    }
  } catch {
    // userAgent not structured JSON — legacy or non-impersonation session
  }

  const callerRoleRows = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, impersonatorId));

  const callerRoleNames = callerRoleRows.map((r) => r.roleName as RoleName);
  const callerIsSuperAdmin = callerRoleNames.includes("super_admin");

  if (!callerIsSuperAdmin) {
    if (sessionImpersonatorId !== impersonatorId) {
      throw new Error("Not authorized to end this impersonation session");
    }
  }

  await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));

  await writeAuditEvent({
    userId: impersonatorId,
    action: "impersonation_end",
    entityType: "user",
    entityId: String(session.userId),
    ipAddress,
    userAgent,
    newValues: {
      impersonatorId,
      targetUserId: session.userId,
    },
  });

  logger.info(
    { impersonatorId, targetUserId: session.userId },
    "Admin impersonation session ended",
  );
}

/**
 * Force-terminate all sessions for a specific user.
 * Used by admins to lock out a user immediately.
 */
export async function forceTerminateUserSessions(params: {
  adminUserId: number;
  targetUserId: number;
  ipAddress: string | null;
  userAgent: string | null;
  reason?: string;
}): Promise<{ deletedCount: number }> {
  const { adminUserId, targetUserId, ipAddress, userAgent, reason } = params;

  const sessions = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, targetUserId));

  for (const s of sessions) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, s.id));
  }

  await writeAuditEvent({
    userId: adminUserId,
    action: "admin_force_logout",
    entityType: "user",
    entityId: String(targetUserId),
    ipAddress,
    userAgent,
    newValues: {
      adminUserId,
      targetUserId,
      deletedSessionCount: sessions.length,
      reason: reason ?? "not specified",
    },
  });

  logger.info(
    { adminUserId, targetUserId, deletedCount: sessions.length },
    "Admin force-terminated user sessions",
  );

  return { deletedCount: sessions.length };
}
