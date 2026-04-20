/**
 * Client-side auth guards — pure predicates for route protection in SPAs.
 *
 * These functions express "can the current session access X?" without
 * any network I/O.  Use them in router `beforeEnter` hooks, React guards,
 * or conditional rendering.
 */

import type { AuthenticatedUser } from "../types.js";
import { isElevated, isReadOnly, isMemberOf } from "../types.js";

export type GuardResult =
  | { allowed: true }
  | { allowed: false; reason: "unauthenticated" | "insufficient_role" | "read_only" | "not_org_member" };

/**
 * Returns `{ allowed: true }` when the user is authenticated and holds at
 * least one of the required roles (or is an elevated admin).
 */
export function guardRole(
  user: AuthenticatedUser | null | undefined,
  ...roles: string[]
): GuardResult {
  if (!user) return { allowed: false, reason: "unauthenticated" };
  if (isElevated(user)) return { allowed: true };
  const ok = roles.some((r) => user.roles.includes(r as never));
  if (!ok) return { allowed: false, reason: "insufficient_role" };
  return { allowed: true };
}

/**
 * Returns `{ allowed: false, reason: "read_only" }` when the user cannot
 * perform write operations.
 */
export function guardNotReadOnly(user: AuthenticatedUser | null | undefined): GuardResult {
  if (!user) return { allowed: false, reason: "unauthenticated" };
  if (isElevated(user)) return { allowed: true };
  if (isReadOnly(user)) return { allowed: false, reason: "read_only" };
  return { allowed: true };
}

/**
 * Returns `{ allowed: true }` when the user is a member of the given org.
 */
export function guardOrgMembership(
  user: AuthenticatedUser | null | undefined,
  orgId: number,
): GuardResult {
  if (!user) return { allowed: false, reason: "unauthenticated" };
  if (isElevated(user)) return { allowed: true };
  if (!isMemberOf(user, orgId)) return { allowed: false, reason: "not_org_member" };
  return { allowed: true };
}

/**
 * Returns `true` when the user is authenticated (any role, any org).
 */
export function isAuthenticated(user: AuthenticatedUser | null | undefined): boolean {
  return !!user;
}
