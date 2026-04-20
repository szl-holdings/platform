/**
 * Canonical auth types shared across all platform artifacts.
 *
 * These are the single source of truth for auth-related interfaces.
 * The API server's own types mirror these; any drift is a bug.
 */

// ── Role definitions ────────────────────────────────────────────────────────

/**
 * 14-role platform hierarchy.  Lower index = lower privilege.
 * `super_admin` supersedes all other roles on every access check.
 */
export const PLATFORM_ROLES = [
  'anonymous_visitor',
  'pilot_customer_user',
  'service_coordinator',
  'maritime_ops_user',
  'sales_delivery_user',
  'ops_manager',
  'executive_viewer',
  'analyst',
  'operator',
  'ops',
  'platform_admin',
  'admin',
  'founder_admin',
  'super_admin',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Roles that may not perform write operations. */
export const READ_ONLY_ROLES = new Set<PlatformRole>([
  'anonymous_visitor',
  'executive_viewer',
  'pilot_customer_user',
]);

/** Roles that bypass org-scoping checks (platform-wide access). */
export const ELEVATED_ROLES = new Set<PlatformRole>(['super_admin', 'admin']);

// ── Org membership ──────────────────────────────────────────────────────────

/** The four org-level membership tiers. */
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

/** A single org membership attached to a session user. */
export interface OrgMembership {
  orgId: number;
  orgSlug: string;
  orgName: string;
  role: OrgRole;
}

// ── Authenticated user ──────────────────────────────────────────────────────

/**
 * The canonical shape of a fully authenticated platform user.
 * This is what every auth middleware must produce and every downstream
 * handler can rely on via `req.user`.
 */
export interface AuthenticatedUser {
  id: number;
  displayName: string;
  email: string | null;
  /** Platform-level roles (from `user_roles` + `platform_role`). */
  roles: PlatformRole[];
  /** Org memberships, hydrated on demand by `tenantScope` middleware. */
  orgs: OrgMembership[];
}

// ── Session ─────────────────────────────────────────────────────────────────

/** Opaque 64-char hex session token stored in the `sid` cookie. */
export type SessionToken = string & { __brand: 'SessionToken' };

/** Session metadata returned from a validated token look-up. */
export interface SessionRecord {
  id: number;
  token: SessionToken;
  userId: number;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  sessionVersion: number;
}

// ── CSRF ────────────────────────────────────────────────────────────────────

export const CSRF_COOKIE_NAME = 'csrf_token' as const;
export const CSRF_HEADER_NAME = 'x-csrf-token' as const;

/** Result of a CSRF token fetch from `GET /api/csrf-token`. */
export interface CsrfTokenResponse {
  csrfToken: string;
}

// ── Tenant context ──────────────────────────────────────────────────────────

/**
 * Tenant context attached to `req.tenantOrgId` by the `tenantScope`
 * middleware.  Present on every org-scoped request after the middleware runs.
 */
export interface TenantContext {
  orgId: number;
  orgSlug: string;
}

// ── Internal agent tokens ───────────────────────────────────────────────────

/** Describes a service-to-service internal agent token. */
export interface InternalAgentContext {
  name: string;
  scopes: string[];
  /** True for the legacy single ALLOY_INTERNAL_TOKEN env var. */
  legacy: boolean;
}

// ── Role helpers (pure, no I/O) ─────────────────────────────────────────────

/** Returns true if the user holds at least one of the given roles. */
export function hasRole(user: { roles: PlatformRole[] }, ...roles: PlatformRole[]): boolean {
  return roles.some((r) => user.roles.includes(r));
}

/** Returns true if the user is an elevated platform-wide admin. */
export function isElevated(user: { roles: PlatformRole[] }): boolean {
  return user.roles.some((r) => ELEVATED_ROLES.has(r));
}

/** Returns true if the user is restricted to read-only operations. */
export function isReadOnly(user: { roles: PlatformRole[] }): boolean {
  return user.roles.some((r) => READ_ONLY_ROLES.has(r)) && !isElevated(user);
}

/** Returns true if the user is a member of the given org. */
export function isMemberOf(user: { orgs: OrgMembership[] }, orgId: number): boolean {
  return user.orgs.some((o) => o.orgId === orgId);
}

/** Returns the user's membership record for a given org, or undefined. */
export function orgMembership(
  user: { orgs: OrgMembership[] },
  orgId: number,
): OrgMembership | undefined {
  return user.orgs.find((o) => o.orgId === orgId);
}

/** Returns the first org the user belongs to, or undefined. */
export function primaryOrg(user: { orgs: OrgMembership[] }): OrgMembership | undefined {
  return user.orgs[0];
}
