import type { Request, Response, NextFunction } from "express";
import { db, usersTable, sessionsTable, userRolesTable, rolesTable, orgMembersTable, organizationsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import type { RoleName } from "@workspace/db";
import { ROLE_HIERARCHY, isReadOnlyRole, toCanonicalRole } from "@workspace/db";
import { serverTelemetry } from "@workspace/observability";
import { logger } from "../lib/logger";

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
    }
  }
}

const INTERNAL_AGENT_USER: AuthenticatedUser = {
  id: 0,
  displayName: "Internal Agent",
  email: null,
  roles: ["super_admin"],
  orgs: [],
};

function checkInternalToken(req: Request): boolean {
  const internalToken = process.env["ALLOY_INTERNAL_TOKEN"];
  if (!internalToken) return false;
  const header = req.headers["x-internal-token"] as string | undefined;
  return header === internalToken;
}

async function resolveUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.token, token),
        gt(sessionsTable.expiresAt, new Date())
      )
    );

  if (!session) return null;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user || !user.isActive) return null;

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
  };
}

export function authMiddleware(options: { required?: boolean } = {}) {
  const { required = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (checkInternalToken(req)) {
        req.user = INTERNAL_AGENT_USER;
        req.isInternalAgent = true;
        next();
        return;
      }

      let user: AuthenticatedUser | null = null;

      const SESSION_COOKIE = "sid";
      let token: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      } else if (req.cookies?.[SESSION_COOKIE]) {
        token = req.cookies[SESSION_COOKIE] as string;
      }
      if (token) {
        user = await resolveUserFromToken(token);
      }

      if (!user && required) {
        serverTelemetry.recordAuthFailure();
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      req.user = user ?? undefined;
      next();
    } catch (err) {
      logger.error({ err }, "Auth middleware error");
      res.status(500).json({ error: "Authentication error" });
    }
  };
}

export function requireRole(...allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
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
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export function requireAnyAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
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
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (isReadOnlyRole(req.user.roles)) {
      const canonical = toCanonicalRole(req.user.roles);
      res.status(403).json({
        error: "Read-only access — write operations are not permitted for your role",
        canonicalRole: canonical,
      });
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
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (req.user.roles.includes("super_admin") || req.user.roles.includes("admin")) {
      next();
      return;
    }

    const membership = req.user.orgs.find((o) => o.orgSlug === orgSlug);
    if (!membership) {
      res.status(403).json({ error: "Not a member of this organization" });
      return;
    }

    if ((roleHierarchy[membership.role] ?? 0) < (roleHierarchy[minRole] ?? 0)) {
      res.status(403).json({ error: "Insufficient organization role" });
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
