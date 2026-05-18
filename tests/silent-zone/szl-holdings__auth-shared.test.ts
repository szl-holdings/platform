// Deeper coverage for @szl-holdings/auth-shared — exercises the role helpers,
// CSRF token primitives, RBAC verdicts, tenant resolution, and session token
// validation. These are high-blast-radius pure functions used by every
// authenticated route in the platform.
import { describe, expect, it } from 'vitest';

import {
  ELEVATED_ROLES,
  PLATFORM_ROLES,
  READ_ONLY_ROLES,
  isElevated,
  isMemberOf,
  isReadOnly,
  orgMembership,
  primaryOrg,
  type AuthenticatedUser,
} from '../../packages/auth-shared/src/types.ts';
import {
  csrfTimingSafeEqual,
  generateCsrfToken,
  isSafeMethod,
  csrfCookieOptions,
  CSRF_TOKEN_BYTES,
} from '../../packages/auth-shared/src/server/csrf.ts';
import {
  checkRole,
  checkNotReadOnly,
  checkOrgMembership,
} from '../../packages/auth-shared/src/server/rbac.ts';
import { resolveTenantContext } from '../../packages/auth-shared/src/server/tenant.ts';
import {
  SESSION_TTL_MS,
  SESSION_ABSOLUTE_MAX_MS,
  REFRESH_TOKEN_TTL_MS,
  SESSION_COOKIE_NAME,
  generateSessionToken,
  isValidTokenFormat,
  sessionExpiresAt,
} from '../../packages/auth-shared/src/server/session.ts';

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    email: 'op@example.com',
    name: 'Op User',
    roles: ['operator'],
    orgs: [{ orgId: 10, orgSlug: 'acme', role: 'member' }],
    ...overrides,
  } as AuthenticatedUser;
}

describe('auth-shared / role taxonomy', () => {
  it('declares the canonical 14-role ladder', () => {
    expect(PLATFORM_ROLES.length).toBe(14);
    expect(PLATFORM_ROLES[0]).toBe('anonymous_visitor');
    expect(PLATFORM_ROLES[PLATFORM_ROLES.length - 1]).toBe('super_admin');
  });

  it('classifies elevated and read-only roles', () => {
    expect(ELEVATED_ROLES.has('super_admin')).toBe(true);
    expect(ELEVATED_ROLES.has('admin')).toBe(true);
    expect(ELEVATED_ROLES.has('analyst')).toBe(false);
    expect(READ_ONLY_ROLES.has('executive_viewer')).toBe(true);
    expect(READ_ONLY_ROLES.has('operator')).toBe(false);
  });

  it('isElevated / isReadOnly / isMemberOf', () => {
    expect(isElevated(user({ roles: ['admin'] }))).toBe(true);
    expect(isElevated(user({ roles: ['operator'] }))).toBe(false);
    expect(isReadOnly(user({ roles: ['executive_viewer'] }))).toBe(true);
    expect(isReadOnly(user({ roles: ['operator'] }))).toBe(false);
    expect(isMemberOf(user(), 10)).toBe(true);
    expect(isMemberOf(user(), 99)).toBe(false);
  });

  it('primaryOrg / orgMembership', () => {
    const u = user({
      orgs: [
        { orgId: 1, orgSlug: 'a', role: 'member' },
        { orgId: 2, orgSlug: 'b', role: 'owner' },
      ],
    });
    expect(primaryOrg(u)?.orgId).toBe(1);
    expect(orgMembership(u, 2)?.orgSlug).toBe('b');
    expect(orgMembership(u, 99)).toBeUndefined();
  });
});

describe('auth-shared / RBAC verdicts', () => {
  it('refuses unauthenticated callers', () => {
    expect(checkRole(null, 'admin')).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    });
    expect(checkNotReadOnly(undefined)).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    });
    expect(checkOrgMembership(null, 1)).toEqual({
      allowed: false,
      reason: 'unauthenticated',
    });
  });

  it('admins bypass role + org + read-only checks', () => {
    const admin = user({ roles: ['admin'], orgs: [] });
    expect(checkRole(admin, 'operator').allowed).toBe(true);
    expect(checkNotReadOnly(admin).allowed).toBe(true);
    expect(checkOrgMembership(admin, 999).allowed).toBe(true);
  });

  it('refuses insufficient role', () => {
    const v = checkRole(user({ roles: ['analyst'] }), 'operator');
    expect(v).toEqual({ allowed: false, reason: 'insufficient_role' });
  });

  it('refuses read-only role on write checks', () => {
    const v = checkNotReadOnly(user({ roles: ['executive_viewer'] }));
    expect(v).toEqual({ allowed: false, reason: 'read_only' });
  });

  it('refuses cross-org access', () => {
    expect(checkOrgMembership(user(), 999)).toEqual({
      allowed: false,
      reason: 'not_org_member',
    });
    expect(checkOrgMembership(user(), 10).allowed).toBe(true);
  });
});

describe('auth-shared / tenant resolution', () => {
  it('resolves the primary org when no request org is given', () => {
    const r = resolveTenantContext(user());
    expect(r.resolved).toBe(true);
    if (r.resolved) expect(r.context.orgSlug).toBe('acme');
  });

  it('denies cross-tenant for non-elevated users', () => {
    const r = resolveTenantContext(user(), 999);
    expect(r).toEqual({ resolved: false, reason: 'cross_tenant_denied' });
  });

  it('fails when the user has no org memberships', () => {
    const r = resolveTenantContext(user({ orgs: [] }));
    expect(r).toEqual({ resolved: false, reason: 'no_org_membership' });
  });

  it('admins can request any org id, even ones they do not belong to', () => {
    const r = resolveTenantContext(user({ roles: ['admin'] }), 42);
    expect(r.resolved).toBe(true);
    if (r.resolved) expect(r.context.orgId).toBe(42);
  });
});

describe('auth-shared / CSRF helpers', () => {
  it('generates a hex token of the documented length', () => {
    const t = generateCsrfToken();
    expect(t).toMatch(/^[0-9a-f]+$/);
    expect(t.length).toBe(CSRF_TOKEN_BYTES * 2);
  });

  it('two tokens are never equal', () => {
    expect(generateCsrfToken()).not.toBe(generateCsrfToken());
  });

  it('csrfTimingSafeEqual matches semantics', () => {
    expect(csrfTimingSafeEqual('abc', 'abc')).toBe(true);
    expect(csrfTimingSafeEqual('abc', 'abd')).toBe(false);
    expect(csrfTimingSafeEqual('ab', 'abc')).toBe(false);
  });

  it('isSafeMethod classifies HTTP verbs', () => {
    for (const m of ['GET', 'HEAD', 'OPTIONS', 'get']) expect(isSafeMethod(m)).toBe(true);
    for (const m of ['POST', 'PUT', 'PATCH', 'DELETE']) expect(isSafeMethod(m)).toBe(false);
  });

  it('csrfCookieOptions flips secure on production', () => {
    expect(csrfCookieOptions({ isProduction: true }).secure).toBe(true);
    expect(csrfCookieOptions({ isProduction: false }).secure).toBe(false);
  });
});

describe('auth-shared / session token helpers', () => {
  it('generateSessionToken emits 64-char hex', () => {
    const t = generateSessionToken();
    expect(isValidTokenFormat(t)).toBe(true);
    expect(t.length).toBe(64);
  });

  it('isValidTokenFormat rejects malformed tokens', () => {
    expect(isValidTokenFormat('short')).toBe(false);
    expect(isValidTokenFormat('Z'.repeat(64))).toBe(false);
  });

  it('sessionExpiresAt is in the future and respects TTL', () => {
    const now = Date.now();
    const exp = sessionExpiresAt(60_000);
    expect(exp.getTime()).toBeGreaterThanOrEqual(now + 60_000 - 50);
    expect(exp.getTime()).toBeLessThanOrEqual(now + 60_000 + 200);
  });

  it('declares the Series-A session TTL constants', () => {
    expect(SESSION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(SESSION_ABSOLUTE_MAX_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(REFRESH_TOKEN_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(SESSION_COOKIE_NAME).toBe('__Host-sid');
  });
});
