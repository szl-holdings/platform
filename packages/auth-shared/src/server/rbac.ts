/**
 * RBAC guard factories.
 *
 * These are pure functions that return predicates / result objects; they do
 * NOT import Express so they stay framework-agnostic and testable without
 * an HTTP context.
 *
 * Framework-specific adapters (Express middleware) live in
 * `artifacts/api-server/src/middlewares/auth.ts` and call into these
 * helpers.
 */

import {
  type AuthenticatedUser,
  ELEVATED_ROLES,
  isElevated,
  isMemberOf,
  isReadOnly,
  type OrgMembership,
  type PlatformRole,
  READ_ONLY_ROLES,
} from '../types.js';

export type RbacVerdict =
  | { allowed: true }
  | {
      allowed: false;
      reason: 'unauthenticated' | 'insufficient_role' | 'read_only' | 'not_org_member';
    };

// ── Role checks ──────────────────────────────────────────────────────────────

/**
 * Returns `{ allowed: true }` when the user holds at least one of the
 * required roles (or is elevated/admin).
 */
export function checkRole(
  user: AuthenticatedUser | null | undefined,
  ...required: PlatformRole[]
): RbacVerdict {
  if (!user) return { allowed: false, reason: 'unauthenticated' };
  if (isElevated(user)) return { allowed: true };
  const ok = required.some((r) => user.roles.includes(r));
  if (!ok) return { allowed: false, reason: 'insufficient_role' };
  return { allowed: true };
}

/**
 * Returns `{ allowed: false, reason: "read_only" }` when the user holds only
 * read-only roles.  Elevated users always pass.
 */
export function checkNotReadOnly(user: AuthenticatedUser | null | undefined): RbacVerdict {
  if (!user) return { allowed: false, reason: 'unauthenticated' };
  if (isElevated(user)) return { allowed: true };
  if (isReadOnly(user)) return { allowed: false, reason: 'read_only' };
  return { allowed: true };
}

// ── Org membership check ─────────────────────────────────────────────────────

/**
 * Returns `{ allowed: true }` when the user is a member of the target org.
 * Elevated users bypass this check.
 */
export function checkOrgMembership(
  user: AuthenticatedUser | null | undefined,
  orgId: number,
): RbacVerdict {
  if (!user) return { allowed: false, reason: 'unauthenticated' };
  if (isElevated(user)) return { allowed: true };
  if (!isMemberOf(user, orgId)) return { allowed: false, reason: 'not_org_member' };
  return { allowed: true };
}

// ── Tenant scoping helpers ───────────────────────────────────────────────────

/**
 * Resolves the effective tenant org for a request.
 *
 * Priority order:
 *  1. `orgId` from route params (already validated by the caller)
 *  2. `orgSlug` from route params (resolved by caller before calling here)
 *  3. The first org in user.orgs (primary org)
 *
 * Returns `undefined` if no org can be resolved.
 */
export function resolveTenantOrg(
  user: AuthenticatedUser,
  paramOrgId?: number,
): OrgMembership | undefined {
  if (paramOrgId !== undefined) {
    return user.orgs.find((o) => o.orgId === paramOrgId);
  }
  return user.orgs[0];
}

/**
 * Returns true when an `allOrgs=true` query param should be honoured.
 * Only elevated users may use this bypass; for everyone else it is a no-op.
 */
export function allowAllOrgsBypass(
  user: AuthenticatedUser | null | undefined,
  allOrgsParam: string | undefined,
): boolean {
  if (!user) return false;
  if (!isElevated(user)) return false;
  return allOrgsParam === 'true' || allOrgsParam === '1';
}

// ── Re-exports for convenience ───────────────────────────────────────────────

export { ELEVATED_ROLES, isElevated, isMemberOf, isReadOnly, READ_ONLY_ROLES };
