import type { Request, Response, NextFunction } from "express";
import { db, usersTable, sessionsTable, userRolesTable, rolesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import type { RoleName } from "@workspace/db";
import { ROLE_HIERARCHY, isReadOnlyRole, toCanonicalRole } from "@workspace/db";

export interface AuthenticatedUser {
  id: number;
  displayName: string;
  email: string | null;
  roles: RoleName[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
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

  const userRoles = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, user.id));

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    roles: userRoles.map((r) => r.roleName) as RoleName[],
  };
}

export function authMiddleware(options: { required?: boolean } = {}) {
  const { required = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let user: AuthenticatedUser | null = null;

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        user = await resolveUserFromToken(token);
      }

      if (!user && required) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      req.user = user ?? undefined;
      next();
    } catch (err) {
      req.log?.error({ err }, "Auth middleware error");
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
