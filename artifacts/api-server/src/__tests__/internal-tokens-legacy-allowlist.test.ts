/**
 * GAP-016 reviewer-required regression: legacy ALLOY_INTERNAL_TOKEN must not
 * be accepted on routes outside its narrow historical surface, and must not
 * grant admin/global bypass anywhere.
 *
 * This locks in the closure criterion: a leaked legacy token cannot reach
 * `/api/admin/*`, `/api/orgs/*`, or any other surface beyond the configured
 * allowlist. It also asserts the production-startup policy (refuse to boot
 * with only the legacy token configured unless explicitly opted-in).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  verifyInternalHeader,
  matchInternalToken,
  resetInternalTokenRegistry,
  assertInternalTokenPolicy,
} from "../lib/internal-tokens";

const LEGACY = "legacy-token-32-bytes-minimum-aaaaa";

describe("ALLOY_INTERNAL_TOKEN — legacy allowlist + bypass containment", () => {
  let prevLegacy: string | undefined;
  let prevScoped: string | undefined;
  let prevAllow: string | undefined;

  beforeEach(() => {
    prevLegacy = process.env["ALLOY_INTERNAL_TOKEN"];
    prevScoped = process.env["INTERNAL_SERVICE_TOKENS"];
    prevAllow = process.env["INTERNAL_TOKENS_ALLOW_LEGACY_ONLY"];
    delete process.env["INTERNAL_SERVICE_TOKENS"];
    delete process.env["INTERNAL_TOKENS_ALLOW_LEGACY_ONLY"];
    process.env["ALLOY_INTERNAL_TOKEN"] = LEGACY;
    resetInternalTokenRegistry();
  });

  afterEach(() => {
    if (prevLegacy === undefined) delete process.env["ALLOY_INTERNAL_TOKEN"];
    else process.env["ALLOY_INTERNAL_TOKEN"] = prevLegacy;
    if (prevScoped === undefined) delete process.env["INTERNAL_SERVICE_TOKENS"];
    else process.env["INTERNAL_SERVICE_TOKENS"] = prevScoped;
    if (prevAllow === undefined) delete process.env["INTERNAL_TOKENS_ALLOW_LEGACY_ONLY"];
    else process.env["INTERNAL_TOKENS_ALLOW_LEGACY_ONLY"] = prevAllow;
    resetInternalTokenRegistry();
  });

  it("matches the secret (registry still recognises the token)", () => {
    expect(matchInternalToken(LEGACY)).not.toBeNull();
  });

  it("never carries super_admin scope or role", () => {
    const match = matchInternalToken(LEGACY)!;
    expect(match.context.legacy).toBe(true);
    // super_admin is not even a valid InternalScope — the token is mapped to
    // a constrained scope set. Read scopes only for non-alloy/agent surfaces.
    expect(match.context.scopes.has("alloy:write")).toBe(true);
    expect(match.context.scopes.has("agent:write")).toBe(true);
    expect(match.context.scopes.has("internal:read")).toBe(true);
    expect(match.context.scopes.has("health:read")).toBe(true);
    // Critically: no `internal:write` (admin-guard requires that), so the
    // legacy token can't pass admin-guard's scope check even if its path
    // were in scope.
    expect(match.context.scopes.has("internal:write" as never)).toBe(false);
  });

  it.each([
    "/api/internal/foo",
    "/api/internal/health/probe",
    "/api/alloy/agent/run",
    "/api/health/detailed",
    "/health/detailed",
    "/api/env-registry",
  ])("accepts legacy token on allowed prefix: %s", (path) => {
    expect(verifyInternalHeader(LEGACY, path)).not.toBeNull();
  });

  it.each([
    "/api/admin/users",
    "/api/admin/feature-flags",
    "/api/orgs/acme/secrets",
    "/api/orgs/acme/usage/events",
    "/api/auth/login",
    "/api/protected-resource",
    "/api/terra/cognitive/covenant-submit",
    "/api/billing/charges",
  ])("rejects legacy token outside allowlist: %s", (path) => {
    expect(verifyInternalHeader(LEGACY, path)).toBeNull();
  });

  it("refuses to start in production when only the legacy token is configured", () => {
    expect(() => assertInternalTokenPolicy({ isProduction: true })).toThrow(
      /Refusing to start.*INTERNAL_SERVICE_TOKENS/i,
    );
  });

  it("permits production start with explicit INTERNAL_TOKENS_ALLOW_LEGACY_ONLY=true override", () => {
    process.env["INTERNAL_TOKENS_ALLOW_LEGACY_ONLY"] = "true";
    expect(() => assertInternalTokenPolicy({ isProduction: true })).not.toThrow();
  });

  it("does not block startup in non-production environments", () => {
    expect(() => assertInternalTokenPolicy({ isProduction: false })).not.toThrow();
  });

  it("does not block startup when at least one scoped token is configured", () => {
    process.env["INTERNAL_SERVICE_TOKENS"] = JSON.stringify([
      { name: "ops-runner", token: "scoped-ok", scopes: ["internal:read"], pathPrefixes: ["/api/internal/"] },
    ]);
    resetInternalTokenRegistry();
    expect(() => assertInternalTokenPolicy({ isProduction: true })).not.toThrow();
  });
});
