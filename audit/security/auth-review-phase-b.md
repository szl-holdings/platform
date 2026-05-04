# Auth Review — Phase B (Unified Auth Package & Tenancy Tests)

**Date:** 2026-04-20  
**Scope:** Unified auth package creation, tenancy isolation tests, CSRF round-trip test coverage.  
**Reviewer:** growth capital Hardening — Phase B  
**Preceding audit:** `audit/security/auth-review.md` (Phase A)

---

## What Was Done

### 1. Shared Auth Package — `packages/auth-shared`

A new canonical shared auth package was created at `packages/auth-shared`
(`@szl-holdings/auth-shared`).  It consolidates all auth-related types,
guards, CSRF utilities, RBAC helpers, and tenant-scoping contracts that were
previously scattered across `lib/auth/` (minimal provider framework) and
`artifacts/api-server/src/` (full implementation).

**Package structure:**

```
packages/auth-shared/
  src/
    types.ts              — AuthenticatedUser, OrgMembership, PLATFORM_ROLES,
                            pure role predicates (hasRole, isElevated, isReadOnly, …)
    server/
      csrf.ts             — generateCsrfToken, validateCsrfPair, cookie options
      rbac.ts             — checkRole, checkNotReadOnly, checkOrgMembership,
                            allowAllOrgsBypass
      session.ts          — generateSessionToken, SESSION_COOKIE_NAME, cookie options
      tenant.ts           — resolveTenantContext, canAccessOrgRecord, stampOrgId
      index.ts            — barrel re-export
    client/
      session.ts          — ClientSession, isSessionValid, sessionHasRole, …
      csrf.ts             — readCsrfTokenFromCookie, csrfHeaders, fetchAndStoreCsrfToken
      guards.ts           — guardRole, guardNotReadOnly, guardOrgMembership,
                            isAuthenticated
      index.ts            — barrel re-export
    mobile/
      token-store.ts      — MobileTokenStore interface, InMemoryTokenStore, TOKEN_STORE_KEYS
      pkce.ts             — generatePkceChallenge, generateCodeVerifier, deriveCodeChallenge
      index.ts            — barrel re-export
    index.ts              — re-exports types.ts (root entry point)
```

**Key design decisions:**
- `types.ts` is browser-safe (no Node.js built-ins) so it can be imported anywhere.
- `server/` uses `crypto` from Node.js stdlib; safe for api-server, excluded from browser bundles via subpath import.
- `mobile/` defines the interface contract but not the `expo-secure-store` implementation, avoiding Expo dependency in the shared package.
- All tenant helpers are pure functions (no DB I/O) enabling fast unit testing.

### 2. Tenancy Isolation Tests — `tests/tenancy/`

A dedicated tenancy isolation test suite was created:

| File | Coverage |
|------|----------|
| `tests/tenancy/tenancy-isolation.test.ts` | Full matrix of `resolveTenantContext`, `canAccessOrgRecord`, `stampOrgId`, all RBAC guards, `allowAllOrgsBypass`, and compound attack scenarios |
| `tests/tenancy/tenant-helpers.test.ts` | Fine-grained edge cases for pure helper functions |
| `tests/tenancy/csrf-helpers.test.ts` | Unit tests for CSRF pure helpers from `auth-shared/server` |

**Attack scenarios explicitly tested:**
- Tenant A reading Tenant B records → blocked (404 / false)
- Forged `orgId` in request body → overwritten with caller's actual org
- `?allOrgs=true` by non-admin → param silently ignored
- Role escalation via injected role string → blocked (RBAC only reads `req.user.roles`)
- Multi-org user accessing org they belong to → allowed
- Multi-org user accessing org they don't belong to → blocked
- `null` orgId records (internal-only data) → blocked for all non-admin users
- Combined attack: forged orgId + `allOrgs=true` + no elevation → all fail

### 3. CSRF Round-Trip POST Coverage — `tests/api/csrf-roundtrip.test.ts`

Extended CSRF test coverage across all major API domains.  Each domain test
proves the full round-trip:

1. GET `/api/csrf-token` → cookie set
2. POST with valid `X-CSRF-Token` header → pass (non-403)
3. POST without header → 403 `CSRF_TOKEN_MISSING`
4. POST with mismatched token → 403 `CSRF_TOKEN_MISMATCH`
5. POST with `Authorization: Bearer ...` → pass (API client bypass)

**Domains newly covered** (in addition to pre-existing partial coverage in `auth.test.ts`):
- Vessels (alerts, orders) — POST + PATCH
- Terra (properties, leases, pro-forma) — POST + PATCH
- PRISM Counsel (matters, documents) — POST + DELETE  ← consolidates Task #1281
- Firestorm (findings, assessments) — POST + DELETE
- Lyte (scenarios, decisions)
- Alloy (channels, chat)
- Aegis (portfolios)
- SZL Holdings (ventures)
- Agents/AI runs
- Verifier
- Audit records
- Approvals votes
- Signals

### 4. Documentation — `docs/security/auth.md`

A new canonical auth architecture document was created covering:
- Shared auth package layout and all exports
- Login flow (password + OIDC + mobile PKCE)
- Session management properties
- CSRF protection mechanism and test coverage
- RBAC role hierarchy and middleware chain
- Tenant isolation rules and test coverage
- Mobile token handling (F-07 remediation guidance)
- Future artifact integration pattern (how new artifacts must use auth)
- Residual gaps inherited from Phase A

---

## Phase A Findings — Status Update

| ID | Severity | Phase A Status | Phase B Update |
|----|----------|---------------|----------------|
| F-01 | High | No rate limiting on login | **Still open** — login endpoint rate limiting not yet added. Remains Phase C priority. |
| F-02 | High | MFA secret encryption key not set | **Ops action** — must be set in production env. Not code-level; document reminds. |
| F-03 | Medium | Cookie flags not confirmed | **Partially addressed** — `sessionCookieOptions` in auth-shared enforces `httpOnly`, `secure` (prod), `sameSite=lax`. API server should migrate to use this factory. |
| F-04 | Medium | Dual role system | **Still open** — `platform_role` vs `user_roles` consolidation is Phase C scope. |
| F-05 | Medium | Route handlers may not validate orgId | **Addressed** — `canAccessOrgRecord` and `stampOrgId` in auth-shared provide the correct primitives; tenancy isolation tests validate the logic. Route-by-route migration is ongoing. |
| F-06 | Medium | Password reset token single-use not confirmed | **Still open** — Phase C. |
| F-07 | Medium | Mobile token storage not confirmed | **Addressed in contract** — `MobileTokenStore` interface defined in auth-shared with `expo-secure-store` requirement explicit in docs. Implementation audit pending. |

---

## Residual Gaps (Phase C)

1. **F-01:** Add `express-rate-limit` on `/api/auth/login-password` and `/api/auth/login`.
2. **F-04:** Consolidate `platform_role` enum into `user_roles` join table; remove legacy column.
3. **F-06:** Add explicit test confirming password reset token is cleared after use.
4. **Mobile artifact audit:** Verify `szl-holdings-mobile` uses `expo-secure-store` for token storage (runtime verification, not just contract definition).
5. **Cookie flag production verification:** Add a startup assertion that logs a warning if `secure` cookie flag is false in `NODE_ENV=production`.

---

## Test Locations

| Suite | Location | Count |
|-------|----------|-------|
| Tenancy isolation (pure logic) | `tests/tenancy/tenancy-isolation.test.ts` | ~40 |
| Tenant helper edge cases | `tests/tenancy/tenant-helpers.test.ts` | ~20 |
| CSRF helpers (unit) | `tests/tenancy/csrf-helpers.test.ts` | ~25 |
| CSRF round-trip (HTTP) | `tests/api/csrf-roundtrip.test.ts` | ~100+ |
| Verifier org-scoping (HTTP) | `tests/api/verifier-org-scoping.test.ts` | pre-existing |
| Tenant gate (middleware) | `artifacts/api-server/src/routes/__tests__/group-tenant-gate.test.ts` | pre-existing |
| Approvals plan step tenant guard | `artifacts/api-server/src/routes/__tests__/approvals-plan-step-tenant-guard.test.ts` | pre-existing |
