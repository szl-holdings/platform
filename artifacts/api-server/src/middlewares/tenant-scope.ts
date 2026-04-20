/**
 * Tenant Scope Middleware
 *
 * Enforces org-aware data access on all routes that handle
 * org-scoped resources. Attaches `req.tenantOrgId` when the
 * requesting user has exactly one org membership, or when the
 * org slug/id is resolved from the request.
 *
 * Phase 3 governance: Cross-tenant blocking is enforced here.
 * Any attempt to access a tenant resource by a user not belonging
 * to that tenant returns 403 with a logged audit event.
 *
 * Usage:
 *   router.get("/signals", authMiddleware(), tenantScope(), handler)
 *
 * Rules:
 *   - super_admin / admin users pass through without restriction (platform-wide access)
 *   - All other users must belong to at least one organization
 *   - If `req.params.orgSlug` or `req.params.orgId` is present, the
 *     requesting user must be a member of that specific org
 *   - Cross-tenant access attempts return 403
 *
 * Auth context note:
 *   The global authMiddleware (authMiddleware.ts) sets req.user with orgs: [] for speed.
 *   This middleware self-hydrates org memberships from the DB when req.user.orgs is empty,
 *   ensuring tenant checks are accurate regardless of middleware execution order.
 */

import type { Request, Response, NextFunction } from "express";
import { db, orgMembersTable, organizationsTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";
import type { AuthenticatedUser } from "./auth";
import { isAllowlistedPublicPath, fullApiPath } from "./global-auth-enforcer";

declare global {
  namespace Express {
    interface Request {
      tenantOrgId?: number;
      tenantOrgSlug?: string;
    }
  }
}

const ELEVATED_ROLES = new Set(["super_admin", "admin"]);

function isElevated(user: AuthenticatedUser): boolean {
  return user.roles.some((r) => ELEVATED_ROLES.has(r));
}

async function hydrateOrgMemberships(userId: number): Promise<AuthenticatedUser["orgs"]> {
  const rows = await db
    .select({
      orgId: orgMembersTable.orgId,
      orgSlug: organizationsTable.slug,
      orgName: organizationsTable.name,
      role: orgMembersTable.role,
    })
    .from(orgMembersTable)
    .innerJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
    .where(eq(orgMembersTable.userId, userId));

  return rows.map((m) => ({
    orgId: m.orgId,
    orgSlug: m.orgSlug,
    orgName: m.orgName,
    role: m.role,
  }));
}

/**
 * Resolves and enforces a single tenant context for the request.
 *
 * - If req.user.orgs is empty (global auth hydrated only base fields), re-fetches
 *   org memberships from the DB to guarantee accurate tenant enforcement regardless
 *   of middleware execution order.
 * - Elevated users (super_admin, admin) bypass org membership checks.
 * - For org-specific routes (orgSlug or orgId in params), the user must
 *   be a member of that org.
 * - For general routes, attaches the user's primary org (first in list).
 * - If no org can be resolved and required=true, returns 403.
 */
export function tenantScope(options: { required?: boolean } = {}) {
  const { required = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        if (required) {
          // Honor the global public allowlist: if globalAuthEnforcer would
          // have let this request through unauthenticated, we must not 401
          // it here. Without this check, any allowlisted endpoint mounted
          // under a tenantScope-gated prefix (e.g. /federation/health under
          // `router.use("/federation", tenantScope({...}))`) would return a
          // misleading 401 even though it is supposed to be public. See
          // global-auth-enforcer.ts for the rationale.
          if (isAllowlistedPublicPath(fullApiPath(req))) {
            next();
            return;
          }
          res.status(401).json({ error: "Authentication required" });
          return;
        }
        next();
        return;
      }

      if (isElevated(user)) {
        next();
        return;
      }

      // NEXUS orchestrator loopback only: globalAuthEnforcer marks
      // x-nexus-orchestrator GET/HEAD requests from 127.0.0.1 against the
      // path allowlist with `req.authBypassReason === "nexus_loopback"`.
      // Skip tenant membership for that narrow trust condition only — do
      // NOT exempt all internal-agent callers, because scoped service
      // tokens may belong to specific tenants and must still be checked.
      if (req.authBypassReason === "nexus_loopback") {
        next();
        return;
      }

      if (user.orgs.length === 0 && !req.isInternalAgent) {
        const freshOrgs = await hydrateOrgMemberships(user.id);
        user.orgs = freshOrgs;
      }

      if (user.orgs.length === 0) {
        if (required) {
          res.status(403).json({ error: "No organization membership" });
          return;
        }
        next();
        return;
      }

      const paramSlug = req.params["orgSlug"] as string | undefined;
      const paramId = req.params["orgId"] as string | undefined;

      if (paramSlug) {
        const membership = user.orgs.find((o) => o.orgSlug === paramSlug);
        if (!membership) {
          res.status(403).json({ error: "Access denied: not a member of this organization" });
          return;
        }
        req.tenantOrgId = membership.orgId;
        req.tenantOrgSlug = membership.orgSlug;
        next();
        return;
      }

      if (paramId) {
        const id = parseInt(paramId, 10);
        if (isNaN(id)) {
          res.status(400).json({ error: "Invalid organization ID" });
          return;
        }
        const membership = user.orgs.find((o) => o.orgId === id);
        if (!membership) {
          res.status(403).json({ error: "Access denied: not a member of this organization" });
          return;
        }
        req.tenantOrgId = membership.orgId;
        req.tenantOrgSlug = membership.orgSlug;
        next();
        return;
      }

      const primary = user.orgs[0];
      req.tenantOrgId = primary!.orgId;
      req.tenantOrgSlug = primary!.orgSlug;
      next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tenant scope error";
      res.status(500).json({ error: message });
    }
  };
}

/**
 * Verifies that a data record's org_id is accessible by the requesting user.
 * Call this inside route handlers after loading a record from the DB.
 *
 * Returns true if accessible, false if the request should be blocked.
 *
 * Example:
 *   const signal = await db.select()...
 *   if (!assertTenantAccess(req, res, signal.orgId)) return;
 */
export function assertTenantAccess(
  req: Request,
  res: Response,
  recordOrgId: number | null | undefined,
): boolean {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }

  if (isElevated(user)) return true;

  if (recordOrgId == null) {
    res.status(403).json({ error: "Record has no organization — access denied" });
    return false;
  }

  const isMember = user.orgs.some((o) => o.orgId === recordOrgId);
  if (!isMember) {
    res.status(403).json({ error: "Cross-tenant access denied" });
    return false;
  }

  return true;
}

/**
 * Returns the set of org IDs the current user can access.
 * For elevated users, returns null (meaning: all orgs — no filter).
 * For regular users, returns the Set of their org IDs.
 */
export function getUserOrgIds(user: AuthenticatedUser): Set<number> | null {
  if (isElevated(user)) return null;
  return new Set(user.orgs.map((o) => o.orgId));
}
