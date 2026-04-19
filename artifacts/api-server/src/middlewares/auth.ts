import type { Request, Response, NextFunction } from "express";
import { sendUnauthorized, sendForbidden, sendError } from "../lib/api-response";
import { db, usersTable, sessionsTable, userRolesTable, rolesTable, orgMembersTable, organizationsTable } from "@szl-holdings/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import type { RoleName } from "@szl-holdings/db";
import { ROLE_HIERARCHY, isReadOnlyRole, toCanonicalRole } from "@szl-holdings/db";
import { serverTelemetry } from "@szl-holdings/observability";
import { logger } from "../lib/logger";
import { getSessionMinCreatedAt } from "./session-policy";
import {
  verifyInternalHeader,
  type InternalAgentContext,
  type InternalScope,
  tokenHasScope,
} from "../lib/internal-tokens";

export interface OrgMembership {
  orgId: number;
  orgSlug: string;
  orgName: string;
  role: "owner" | "admin" | "member" | "viewer";
}

export interface AuthenticatedUser {
  id: number;
  displayName: string;
  email: string | null;
  roles: RoleName[];
  orgs: OrgMembership[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      isInternalAgent?: boolean;
      internalAgent?: InternalAgentContext;
    }
  }
}

/**
 * Build the synthesized request user for an authenticated internal-service
 * call.
 *
 * GAP-016: BOTH legacy ALLOY_INTERNAL_TOKEN and new INTERNAL_SERVICE_TOKENS
 * entries are mapped to "ops" only — never `super_admin`. The previous
 * behavior (legacy → super_admin) created a privilege-escalation blast
 * radius if the token leaked: any holder could perform admin-only
 * operations across every domain. Now legacy callers are bounded to the
 * same scope catalog as scoped tokens, and downstream routes that need
 * fine-grained authorization must additionally gate on declared scopes
 * via `requireInternalScope(...)`. This is the hardening the first
 * external-user launch requires.
 */
function buildInternalAgentUser(ctx: InternalAgentContext): AuthenticatedUser {
  const roles: RoleName[] = ["ops"];
  return {
    id: 0,
    displayName: `Internal Agent (${ctx.name})`,
    email: null,
    roles,
    orgs: [],
  };
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function checkInternalToken(req: Request): InternalAgentContext | null {
  const header = req.headers["x-internal-token"] as string | undefined;
  if (!header) return null;
  const match = verifyInternalHeader(header, req.originalUrl || req.url);
  if (!match) {
    // We can't tell from the registry alone whether the header value matched
    // *some* token but failed the path check vs. didn't match at all; the
    // registry helper logs neither case. Emit a single low-noise debug-level
    // notice for visibility without alerting on every probe.
    logger.debug({ method: req.method, path: req.path, ip: req.ip }, "[auth] Internal token header rejected");
    return null;
  }
  logger.info(
    { method: req.method, path: req.path, ip: req.ip, tokenName: match.context.name, legacy: match.context.legacy },
    "[auth] Internal agent token accepted"
  );
  return match.context;
}

type SessionResolution =
  | { kind: "ok"; user: AuthenticatedUser }
  | {
      kind: "revoked";
      reason:
        | "session_version_mismatch"
        | "session_revoked"
        | "session_pre_secret_rotation";
    }
  | { kind: "missing" };

async function resolveUserFromToken(token: string): Promise<SessionResolution> {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.token, token),
        gt(sessionsTable.expiresAt, new Date()),
        isNull(sessionsTable.revokedAt),
      )
    );

  if (!session) {
    // Disambiguate: if a row exists but is revoked, surface SESSION_REVOKED
    // instead of a generic 401 so the client knows to drop the session.
    const [revoked] = await db
      .select({ id: sessionsTable.id })
      .from(sessionsTable)
      .where(eq(sessionsTable.token, token))
      .limit(1);
    if (revoked) {
      return { kind: "revoked", reason: "session_revoked" };
    }
    return { kind: "missing" };
  }

  // Global SESSION_SECRET-rotation cutoff (AF-012). Any session created before
  // SESSION_MIN_CREATED_AT is treated as revoked. Operators set this env when
  // rotating SESSION_SECRET (or any other "force-logout-everyone" event) so
  // that long-lived opaque tokens issued before the rotation can no longer be
  // exchanged for an authenticated request.
  const cutoff = getSessionMinCreatedAt();
  if (cutoff && session.createdAt < cutoff) {
    return { kind: "revoked", reason: "session_pre_secret_rotation" };
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user || !user.isActive) return { kind: "missing" };

  // Session-version check — bumped on role/org-membership change.
  if (typeof user.sessionVersion === "number" && session.sessionVersion !== user.sessionVersion) {
    return { kind: "revoked", reason: "session_version_mismatch" };
  }

  const [userRoles, orgMemberships] = await Promise.all([
    db
      .select({ roleName: rolesTable.name })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, user.id)),
    db
      .select({
        orgId: orgMembersTable.orgId,
        orgSlug: organizationsTable.slug,
        orgName: organizationsTable.name,
        role: orgMembersTable.role,
      })
      .from(orgMembersTable)
      .innerJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
      .where(eq(orgMembersTable.userId, user.id)),
  ]);

  return {
    kind: "ok",
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      roles: userRoles.map((r) => r.roleName) as RoleName[],
      orgs: orgMemberships.map((m) => ({
        orgId: m.orgId,
        orgSlug: m.orgSlug,
        orgName: m.orgName,
        role: m.role,
      })),
    },
  };
}

export function authMiddleware(options: { required?: boolean } = {}) {
  const { required = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const internalCtx = checkInternalToken(req);
      if (internalCtx) {
        req.user = buildInternalAgentUser(internalCtx);
        req.isInternalAgent = true;
        req.internalAgent = internalCtx;
        next();
        return;
      }

      let user: AuthenticatedUser | null = null;
      let revokedReason:
        | "session_version_mismatch"
        | "session_revoked"
        | "session_pre_secret_rotation"
        | null = null;

      const SESSION_COOKIE = "sid";
      let token: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      } else if (req.cookies?.[SESSION_COOKIE]) {
        token = req.cookies[SESSION_COOKIE] as string;
      }
      if (token) {
        const resolved = await resolveUserFromToken(token);
        if (resolved.kind === "ok") {
          user = resolved.user;
        } else if (resolved.kind === "revoked") {
          revokedReason = resolved.reason;
        }
      }

      if (!user && required) {
        serverTelemetry.recordAuthFailure();
        if (revokedReason) {
          sendError(
            res,
            "Session has been revoked. Please sign in again.",
            401,
            "SESSION_REVOKED",
          );
          return;
        }
        sendUnauthorized(res);
        return;
      }

      req.user = user ?? undefined;
      next();
    } catch (err) {
      logger.error({ err }, "Auth middleware error");
      sendError(res, "Authentication error", 500, "INTERNAL_ERROR");
    }
  };
}

export function requireRole(...allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (req.user.roles.includes("super_admin") || req.user.roles.includes("admin")) {
      next();
      return;
    }

    const userGrantedRoles = new Set<RoleName>();
    for (const userRole of req.user.roles) {
      const implied = ROLE_HIERARCHY[userRole];
      if (implied) implied.forEach((r: RoleName) => userGrantedRoles.add(r));
    }

    const hasRole = allowedRoles.some((role) => userGrantedRoles.has(role));
    if (!hasRole) {
      sendForbidden(res, "Insufficient permissions");
      return;
    }

    next();
  };
}

export function requireAnyAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    next();
  };
}

/**
 * Middleware that blocks write operations for read-only canonical roles
 * (executive_viewer, anonymous_visitor). Must be used after authMiddleware().
 *
 * Usage: router.post("/resource", authMiddleware(), denyIfReadOnly(), handler)
 */
export function denyIfReadOnly() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (isReadOnlyRole(req.user.roles)) {
      const canonical = toCanonicalRole(req.user.roles);
      sendForbidden(res, `Read-only access — write operations are not permitted for role: ${canonical ?? "unknown"}`);
      return;
    }
    next();
  };
}

export class InvalidIdError extends Error {
  constructor() {
    super("Invalid ID parameter");
    this.name = "InvalidIdError";
  }
}

export function parseIdParam(raw: string | string[]): number {
  const str = Array.isArray(raw) ? raw[0] : raw;
  const id = parseInt(str, 10);
  if (isNaN(id) || id < 1) throw new InvalidIdError();
  return id;
}

export function requireOrgMembership(orgSlug: string, minRole: "owner" | "admin" | "member" | "viewer" = "viewer") {
  const roleHierarchy: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (req.user.roles.includes("super_admin") || req.user.roles.includes("admin")) {
      next();
      return;
    }

    const membership = req.user.orgs.find((o) => o.orgSlug === orgSlug);
    if (!membership) {
      sendForbidden(res, "Not a member of this organization");
      return;
    }

    if ((roleHierarchy[membership.role] ?? 0) < (roleHierarchy[minRole] ?? 0)) {
      sendForbidden(res, "Insufficient organization role");
      return;
    }

    next();
  };
}

export function canAccessOrgRecord(user: AuthenticatedUser, recordOrgId: number | null | undefined): boolean {
  if (user.roles.includes("super_admin") || user.roles.includes("admin") || user.roles.includes("exec") || user.roles.includes("ops")) {
    return true;
  }
  if (recordOrgId == null) return false;
  return user.orgs.some((o) => o.orgId === recordOrgId);
}

export function isElevatedUser(user: AuthenticatedUser): boolean {
  const elevated = new Set(["super_admin", "admin", "exec", "ops", "compliance"]);
  return user.roles.some((r) => elevated.has(r));
}

/**
 * Gate a route on a specific internal-token scope. Sessioned (human) users
 * always pass through to the next handler — combine this with `authMiddleware`
 * + role checks to constrain the human path. The scope check ONLY applies to
 * internal service callers (those authenticated via `x-internal-token`).
 */
export function requireInternalScope(required: InternalScope) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isInternalAgent) {
      next();
      return;
    }
    if (tokenHasScope(req.internalAgent, required)) {
      next();
      return;
    }
    logger.warn(
      { tokenName: req.internalAgent?.name, required, scopes: Array.from(req.internalAgent?.scopes ?? []), path: req.path },
      "[auth] Internal token lacks required scope"
    );
    res.status(403).json({
      error: "Forbidden",
      message: `Internal token missing required scope: ${required}`,
      code: "INTERNAL_SCOPE_MISSING",
    });
  };
}
