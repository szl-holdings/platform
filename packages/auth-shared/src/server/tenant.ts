/**
 * Tenant-scoping contract types and pure helper functions.
 *
 * These are framework-agnostic.  The Express middleware adapter that
 * enforces the contract lives in
 * `artifacts/api-server/src/middlewares/tenant-scope.ts`.
 */

import type { AuthenticatedUser, OrgMembership, TenantContext } from "../types.js";
import { isElevated, isMemberOf, orgMembership, primaryOrg } from "../types.js";

export type TenantResolutionResult =
  | { resolved: true; context: TenantContext }
  | { resolved: false; reason: "no_org_membership" | "cross_tenant_denied" | "org_not_found" };

/**
 * Resolves a `TenantContext` from the authenticated user and an optional
 * requested org ID (from route params or query string).
 *
 * Rules (mirrors the api-server `tenant-scope.ts` middleware):
 *  - Elevated users (admin / super_admin) always resolve successfully.
 *  - If `requestedOrgId` is given, the user must be a member of that org.
 *  - Otherwise the user's primary org is used.
 *  - Users with zero org memberships get `no_org_membership`.
 */
export function resolveTenantContext(
  user: AuthenticatedUser,
  requestedOrgId?: number,
): TenantResolutionResult {
  if (isElevated(user)) {
    if (requestedOrgId !== undefined) {
      const membership = orgMembership(user, requestedOrgId);
      if (!membership) {
        return {
          resolved: true,
          context: { orgId: requestedOrgId, orgSlug: String(requestedOrgId) },
        };
      }
      return { resolved: true, context: { orgId: membership.orgId, orgSlug: membership.orgSlug } };
    }
    const primary = primaryOrg(user);
    if (!primary) {
      return { resolved: true, context: { orgId: 0, orgSlug: "platform" } };
    }
    return { resolved: true, context: { orgId: primary.orgId, orgSlug: primary.orgSlug } };
  }

  if (user.orgs.length === 0) {
    return { resolved: false, reason: "no_org_membership" };
  }

  if (requestedOrgId !== undefined) {
    if (!isMemberOf(user, requestedOrgId)) {
      return { resolved: false, reason: "cross_tenant_denied" };
    }
    const membership = orgMembership(user, requestedOrgId) as OrgMembership;
    return { resolved: true, context: { orgId: membership.orgId, orgSlug: membership.orgSlug } };
  }

  const primary = primaryOrg(user) as OrgMembership;
  return { resolved: true, context: { orgId: primary.orgId, orgSlug: primary.orgSlug } };
}

/**
 * Returns true when a record's `orgId` is accessible to the requesting user.
 *
 * Elevated users can see all records.  Regular users can only access records
 * belonging to one of their orgs.
 *
 * This is the authoritative cross-tenant read guard.  Route handlers MUST
 * call this (or use `tenantScope` middleware) before returning any org-scoped
 * record to a caller.
 */
export function canAccessOrgRecord(user: AuthenticatedUser, recordOrgId: number | null): boolean {
  if (recordOrgId === null) return isElevated(user);
  if (isElevated(user)) return true;
  return isMemberOf(user, recordOrgId);
}

/**
 * Stamps a caller's org onto a new record using `req.user.orgs[0]`.
 * If the caller supplied a preferred `orgId`, it is validated against their
 * membership list.  If they are not a member, the caller's primary org wins
 * (spoofing is silently corrected, never honoured).
 */
export function stampOrgId(user: AuthenticatedUser, requestedOrgId?: number | null): number | null {
  const primary = primaryOrg(user);
  if (!primary) return null;
  if (requestedOrgId === undefined || requestedOrgId === null) return primary.orgId;
  if (isElevated(user)) return requestedOrgId;
  if (isMemberOf(user, requestedOrgId)) return requestedOrgId;
  return primary.orgId;
}
