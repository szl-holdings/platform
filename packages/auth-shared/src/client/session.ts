/**
 * Client-side session helpers — pure utilities for React / browser apps.
 *
 * These helpers inspect session state from the SPA perspective: they
 * parse session info from API responses or local storage without making
 * any privileged DB calls.
 */

import type { AuthenticatedUser, OrgMembership } from '../types.js';

// ── Session state ────────────────────────────────────────────────────────────

/** Minimal session shape returned by `GET /api/auth/me`. */
export interface ClientSession {
  user: AuthenticatedUser;
  expiresAt: string;
}

/** Returns true when the session is still within its expiry window. */
export function isSessionValid(session: ClientSession | null | undefined): boolean {
  if (!session) return false;
  const expiresAt = new Date(session.expiresAt);
  return expiresAt > new Date();
}

/** Returns the time in ms until the session expires, or 0 if already expired. */
export function sessionTtlMs(session: ClientSession): number {
  const expiresAt = new Date(session.expiresAt).getTime();
  return Math.max(0, expiresAt - Date.now());
}

// ── Role inspection helpers ──────────────────────────────────────────────────

/** Returns true if the session user holds at least one of the given roles. */
export function sessionHasRole(
  session: ClientSession | null | undefined,
  ...roles: string[]
): boolean {
  if (!session) return false;
  return roles.some((r) => session.user.roles.includes(r as never));
}

/** Returns true if the session user is an org member. */
export function sessionInOrg(session: ClientSession | null | undefined, orgId: number): boolean {
  if (!session) return false;
  return session.user.orgs.some((o) => o.orgId === orgId);
}

/** Returns the user's primary org (first in list), or undefined. */
export function sessionPrimaryOrg(
  session: ClientSession | null | undefined,
): OrgMembership | undefined {
  return session?.user.orgs[0];
}
