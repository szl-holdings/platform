# Auth Architecture — SZL Holdings Platform

**Last updated:** 2026-04-20  
**Status:** Phase B — Unified auth package shipped; tenancy isolation tests active.

---

## Overview

All platform artifacts share a single centralized authentication and authorization
layer.  There is **one** auth server (the API server at `artifacts/api-server`), **one**
session store (PostgreSQL), and **one** canonical set of auth primitives in
`packages/auth-shared`.

```
┌───────────────────────────────────────────────────────────────────┐
│  @szl-holdings/auth-shared  (packages/auth-shared)                │
│  ─────────────────────────────────────────────────────────────── │
│  types.ts        — AuthenticatedUser, OrgMembership, PLATFORM_ROLES│
│  server/csrf.ts  — generateCsrfToken, validateCsrfPair, helpers   │
│  server/rbac.ts  — checkRole, checkNotReadOnly, checkOrgMembership│
│  server/session.ts — generateSessionToken, cookie options         │
│  server/tenant.ts — resolveTenantContext, canAccessOrgRecord,     │
│                      stampOrgId                                   │
│  client/         — SPA session/CSRF/guard helpers (browser)       │
│  mobile/         — MobileTokenStore contract, PKCE helpers        │
└─────────────────────────────┬─────────────────────────────────────┘
                              │ imports
              ┌───────────────▼───────────────┐
              │  artifacts/api-server          │
              │  middlewares/auth.ts           │
              │  middlewares/csrf.ts           │
              │  middlewares/tenant-scope.ts   │
              └───────────────────────────────┘
```

---

## 1. Shared Auth Package (`packages/auth-shared`)

### Purpose

`@szl-holdings/auth-shared` is the **canonical source of truth** for all
auth-related types, guards, CSRF utilities, RBAC helpers, and tenant-scoping
contracts across the monorepo.

### Sub-path imports

| Import path | Contents | For use in |
|-------------|----------|-----------|
| `@szl-holdings/auth-shared` | Types + pure role helpers | Anywhere |
| `@szl-holdings/auth-shared/server` | Node.js/Express helpers | API server |
| `@szl-holdings/auth-shared/client` | Browser/React helpers | SPA artifacts |
| `@szl-holdings/auth-shared/mobile` | Expo/React Native adapter | Mobile artifact |

### Key exports

#### `types.ts`
- `PLATFORM_ROLES` — ordered 11-role hierarchy
- `AuthenticatedUser` — shape every auth middleware must produce
- `OrgMembership` — single org membership record
- `CSRF_COOKIE_NAME`, `CSRF_HEADER_NAME` — canonical constant names
- `hasRole`, `isElevated`, `isReadOnly`, `isMemberOf`, `primaryOrg` — pure predicates

#### `server/tenant.ts`
- `resolveTenantContext(user, requestedOrgId?)` — resolves or denies tenant for request
- `canAccessOrgRecord(user, recordOrgId)` — authoritative cross-tenant read guard
- `stampOrgId(user, requestedOrgId?)` — overwrites caller-supplied orgId with actual membership

#### `server/rbac.ts`
- `checkRole(user, ...roles)` → `RbacVerdict`
- `checkNotReadOnly(user)` → `RbacVerdict`
- `checkOrgMembership(user, orgId)` → `RbacVerdict`
- `allowAllOrgsBypass(user, param)` — elevated-only `?allOrgs=true` gate

#### `server/csrf.ts`
- `generateCsrfToken()` — 64-char hex random token
- `validateCsrfPair(cookieTok, headerTok)` → `CsrfValidationResult`
- `csrfCookieOptions(opts)` — Express cookie options factory

#### `server/session.ts`
- `generateSessionToken()` — 64-char hex opaque token
- `SESSION_COOKIE_NAME` — `"sid"`
- `sessionCookieOptions(opts)` — Express cookie options factory
- `sessionClearCookieOptions(opts)` — logout cookie options

#### `client/csrf.ts`
- `readCsrfTokenFromCookie()` — reads `csrf_token` cookie in browser
- `csrfHeaders()` — returns `{ "x-csrf-token": token }` for fetch calls
- `fetchAndStoreCsrfToken(baseUrl?, fetchFn?)` — prime the token before first mutation

#### `mobile/token-store.ts`
- `MobileTokenStore` — interface requiring `expo-secure-store` implementation
- `InMemoryTokenStore` — test-only mock
- `TOKEN_STORE_KEYS` — `{ SESSION, REFRESH }` keystore key constants

#### `mobile/pkce.ts`
- `generatePkceChallenge()` — S256 verifier + challenge pair (RFC 7636)

---

## 2. Login Flow

**Endpoints:** `POST /api/auth/login-password` (email + password), `/api/auth/callback` (OIDC)

1. Client submits credentials or is redirected from OIDC provider.
2. API server verifies (PBKDF2-SHA512 for passwords, ID token for OIDC).
3. On success, `createOidcSession()` generates a 32-byte random session token.
4. Token is stored in `sessions` table (PostgreSQL) with 7-day TTL.
5. Token is set as `httpOnly, secure, sameSite=lax` cookie named `sid`.
6. CSRF token cookie is already pre-set from the initial GET.

### Mobile flow
1. Mobile app initiates PKCE challenge via `generatePkceChallenge()`.
2. Auth code exchange at `POST /api/mobile-auth/token-exchange`.
3. Response contains `sessionToken` and `refreshToken`.
4. Mobile app persists both via `expo-secure-store` (see Finding F-07 remediation).

---

## 3. Session Management

| Property | Value |
|----------|-------|
| Storage | PostgreSQL `sessions` table |
| Token format | 64-char hex (32 random bytes) |
| TTL | 7 days from creation |
| Sliding window | Extends on activity, absolute max 30 days |
| Cookie name | `sid` |
| Cookie flags | `httpOnly`, `secure` (prod), `sameSite=lax` |
| Version column | `session_version` — incremented on password change / forced logout |
| Refresh token | Single-use; replay detection revokes ALL sessions |

---

## 4. CSRF Protection

The platform uses the **double-submit cookie** pattern:

1. Any GET request to the API sets a `csrf_token` cookie (readable by JS, `sameSite=strict`).
2. All state-changing requests (`POST/PUT/PATCH/DELETE`) must echo the token in the `X-CSRF-Token` header.
3. The middleware (`artifacts/api-server/src/middlewares/csrf.ts`) compares cookie and header using `timingSafeEqual`.
4. Mismatches → `403 CSRF_TOKEN_MISMATCH`.
5. **Bypass rules** (no CSRF check):
   - `GET/HEAD/OPTIONS` (safe methods)
   - Routes in `EXEMPT_PATHS` (auth endpoints, webhooks, health, mobile auth)
   - `Authorization: Bearer ...` requests (API clients — CSRF attacks cannot forge Bearer tokens)
   - Requests with a valid `x-internal-token` (service-to-service)
6. GraphQL uses `Content-Type: application/json` + a custom header (`X-CSRF-Token`, `X-Requested-With`, or `X-Apollo-Operation-Name`).

### CSRF test coverage

CSRF round-trip tests are in `tests/api/csrf-roundtrip.test.ts` and cover:
- Vessels, Terra, PRISM Counsel, Firestorm, Lyte, Alloy, Aegis, SZL Holdings, Agents, Verifier, Audit, Approvals, Signals
- `POST`, `PATCH`, and `DELETE` verbs
- Valid token → pass; missing token → 403; mismatched token → 403; Bearer bypass → pass

---

## 5. RBAC

### Role hierarchy (11 roles, ascending privilege)

```
anonymous_visitor < pilot_customer_user < service_coordinator < maritime_ops_user
< sales_delivery_user < ops_manager < executive_viewer < analyst < operator
< ops < platform_admin < admin < founder_admin < super_admin
```

### Middleware chain (per route)

```
authMiddleware()           → populates req.user
  └─► requireRole(...)    → checks role (admin/super_admin bypass all)
  └─► denyIfReadOnly()    → blocks executive_viewer / anonymous_visitor writes
  └─► tenantScope()       → resolves + enforces org_id
  └─► route handler
```

### Dual role system (Finding F-04 status)

The `users.platform_role` column (single legacy enum) and the `user_roles` join table coexist.
`user_roles` is authoritative for RBAC decisions.  The legacy `platform_role` field is kept for
backward compatibility and is planned for removal in Phase C.

---

## 6. Tenant Isolation

### Enforcement

Every API route that touches org-scoped data must use the `tenantScope()` middleware or
manually call `canAccessOrgRecord(req.user, record.orgId)` before returning data.

### Rules

| Scenario | Result |
|----------|--------|
| User requests own org data | 200 OK |
| User requests another org's record | 404 (existence leak prevention) |
| User supplies forged `orgId` in body | Corrected to actual org (`stampOrgId`) |
| `?allOrgs=true` without admin | Query param ignored |
| `?allOrgs=true` with admin | Cross-org access granted |

### Test coverage

`tests/tenancy/tenancy-isolation.test.ts` covers:
- `resolveTenantContext` — own org, cross-tenant denial, no-org denial, elevated bypass
- `canAccessOrgRecord` — read guard matrix for all org combos
- `stampOrgId` — forged orgId overwrite, no-org null, elevated override
- `checkRole`, `checkNotReadOnly`, `checkOrgMembership` — RBAC guard coverage
- `allowAllOrgsBypass` — admin-only gate
- Compound attack scenarios (forged orgId + allOrgs, role escalation, multi-org)

`tests/tenancy/tenant-helpers.test.ts` covers:
- Pure helper functions: `hasRole`, `isElevated`, `isReadOnly`, `primaryOrg`, etc.

`tests/api/verifier-org-scoping.test.ts` covers:
- HTTP-layer org-scoping for the Verifier domain

`artifacts/api-server/src/routes/__tests__/group-tenant-gate.test.ts` covers:
- `tenantScope` middleware contract across route groups

---

## 7. Mobile Token Handling (Finding F-07 Remediation)

**Requirement:** Mobile apps MUST store tokens in `expo-secure-store` (iOS Keychain / Android Keystore).
`AsyncStorage` is NOT acceptable — it stores data unencrypted.

Implementation contract is defined in `packages/auth-shared/src/mobile/token-store.ts`:

```typescript
import { TOKEN_STORE_KEYS } from "@szl-holdings/auth-shared/mobile";
import * as SecureStore from "expo-secure-store";

// Store session token securely
await SecureStore.setItemAsync(TOKEN_STORE_KEYS.SESSION, sessionToken);

// Retrieve
const token = await SecureStore.getItemAsync(TOKEN_STORE_KEYS.SESSION);

// Clear on logout
await SecureStore.deleteItemAsync(TOKEN_STORE_KEYS.SESSION);
await SecureStore.deleteItemAsync(TOKEN_STORE_KEYS.REFRESH);
```

---

## 8. Future Artifact Integration Pattern

Every new artifact MUST:

1. **Web artifact (SPA):** Import CSRF helpers from `@szl-holdings/auth-shared/client` and
   include `csrfHeaders()` in every mutating fetch call.
2. **API server route:** Apply `authMiddleware()`, then `requireRole(...)`, then `tenantScope()`.
3. **Mobile artifact:** Implement `MobileTokenStore` backed by `expo-secure-store`.
4. **No copy-pasting** auth code — extend `packages/auth-shared` if a new primitive is needed.

---

## 9. Residual Gaps (for Phase C)

| ID | Description | Priority |
|----|-------------|----------|
| F-01 | No rate limiting on `/api/auth/login-password` | High |
| F-02 | `MFA_SECRET_ENCRYPTION_KEY` must be set in production | High — ops action |
| F-03 | Cookie `secure` flag verified in dev (false); confirm true in production | Medium |
| F-04 | Dual role system (`platform_role` + `user_roles`) pending consolidation | Medium |
| F-06 | Password reset token single-use consumption needs explicit test | Medium |
