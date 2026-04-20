/**
 * Auth-shared tenant helper unit tests — fine-grained coverage of
 * `stampOrgId`, `canAccessOrgRecord`, and `resolveTenantContext` edge cases
 * that are not covered by the main isolation suite.
 */

import { describe, it, expect } from "vitest";
import {
  resolveTenantContext,
  canAccessOrgRecord,
  stampOrgId,
} from "../../packages/auth-shared/src/server/tenant.js";
import {
  hasRole,
  isElevated,
  isReadOnly,
  primaryOrg,
  isMemberOf,
  orgMembership,
} from "../../packages/auth-shared/src/types.js";
import type { AuthenticatedUser } from "../../packages/auth-shared/src/types.js";

function org(id: number, slug = `org-${id}`) {
  return { orgId: id, orgSlug: slug, orgName: slug, role: "member" as const };
}

const base: AuthenticatedUser = {
  id: 1,
  displayName: "U",
  email: "u@x.test",
  roles: ["operator"],
  orgs: [org(10)],
};

// ── hasRole ──────────────────────────────────────────────────────────────────

describe("hasRole", () => {
  it("returns true when role is present", () => {
    expect(hasRole(base, "operator")).toBe(true);
  });

  it("returns false when role is absent", () => {
    expect(hasRole(base, "admin")).toBe(false);
  });

  it("returns true for any matching role in the list", () => {
    expect(hasRole(base, "super_admin", "operator")).toBe(true);
  });
});

// ── isElevated ───────────────────────────────────────────────────────────────

describe("isElevated", () => {
  it("returns false for operator", () => {
    expect(isElevated(base)).toBe(false);
  });

  it("returns true for admin", () => {
    expect(isElevated({ ...base, roles: ["admin"] })).toBe(true);
  });

  it("returns true for super_admin", () => {
    expect(isElevated({ ...base, roles: ["super_admin"] })).toBe(true);
  });
});

// ── isReadOnly ───────────────────────────────────────────────────────────────

describe("isReadOnly", () => {
  it("returns false for operator", () => {
    expect(isReadOnly(base)).toBe(false);
  });

  it("returns true for executive_viewer", () => {
    expect(isReadOnly({ ...base, roles: ["executive_viewer"] })).toBe(true);
  });

  it("returns false for super_admin even with executive_viewer tag", () => {
    expect(isReadOnly({ ...base, roles: ["super_admin", "executive_viewer"] })).toBe(false);
  });
});

// ── isMemberOf ───────────────────────────────────────────────────────────────

describe("isMemberOf", () => {
  it("returns true when user is in org", () => {
    expect(isMemberOf(base, 10)).toBe(true);
  });

  it("returns false when user is not in org", () => {
    expect(isMemberOf(base, 99)).toBe(false);
  });
});

// ── primaryOrg ───────────────────────────────────────────────────────────────

describe("primaryOrg", () => {
  it("returns first org", () => {
    const user = { ...base, orgs: [org(5), org(6)] };
    expect(primaryOrg(user)?.orgId).toBe(5);
  });

  it("returns undefined when no orgs", () => {
    expect(primaryOrg({ ...base, orgs: [] })).toBeUndefined();
  });
});

// ── orgMembership ─────────────────────────────────────────────────────────────

describe("orgMembership", () => {
  it("finds membership for known org", () => {
    expect(orgMembership(base, 10)).toMatchObject({ orgId: 10 });
  });

  it("returns undefined for unknown org", () => {
    expect(orgMembership(base, 11)).toBeUndefined();
  });
});

// ── stampOrgId edge cases ────────────────────────────────────────────────────

describe("stampOrgId edge cases", () => {
  it("returns null when user has no orgs and no param given", () => {
    const noOrg: AuthenticatedUser = { ...base, orgs: [] };
    expect(stampOrgId(noOrg)).toBeNull();
  });

  it("returns null when user has no orgs even if orgId param is given", () => {
    const noOrg: AuthenticatedUser = { ...base, orgs: [] };
    expect(stampOrgId(noOrg, 5)).toBeNull();
  });

  it("accepts null as a no-op (uses primary org)", () => {
    expect(stampOrgId(base, null)).toBe(10);
  });
});

// ── canAccessOrgRecord edge cases ────────────────────────────────────────────

describe("canAccessOrgRecord edge cases", () => {
  it("is symmetric: blocking is bidirectional", () => {
    const a = { ...base, orgs: [org(1)] };
    const b = { ...base, orgs: [org(2)] };
    expect(canAccessOrgRecord(a, 2)).toBe(false);
    expect(canAccessOrgRecord(b, 1)).toBe(false);
  });

  it("handles very large orgId values", () => {
    const user = { ...base, orgs: [org(Number.MAX_SAFE_INTEGER)] };
    expect(canAccessOrgRecord(user, Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(canAccessOrgRecord(user, 1)).toBe(false);
  });
});

// ── resolveTenantContext edge cases ──────────────────────────────────────────

describe("resolveTenantContext edge cases", () => {
  it("handles orgId = 0 (should not match any real org)", () => {
    const result = resolveTenantContext(base, 0);
    expect(result.resolved).toBe(false);
  });

  it("elevated user requesting orgId = 0 succeeds (platform admin use case)", () => {
    const admin: AuthenticatedUser = { ...base, roles: ["super_admin"] };
    const result = resolveTenantContext(admin, 0);
    expect(result.resolved).toBe(true);
  });
});
