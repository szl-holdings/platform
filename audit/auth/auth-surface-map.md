# Auth Surface Map — Series-A Reset (Phase 9)

**Date:** 2026-04-20
**Scope:** All artifacts and services in the monorepo that expose authenticated surfaces
**Reviewer:** Series A Hardening — Phase 9 Security Hardening & Sign-On Consolidation
**Methodology:** Static review of route files, middleware chains, auth context implementations, and mobile token handling across all registered artifacts.

---

## 1. Auth Architecture Overview

The platform uses a **unified, shared-package auth model**:

- **`packages/auth-shared`** — canonical types, session helpers, CSRF helpers, RBAC predicates, mobile PKCE helpers. No DB I/O; framework-agnostic.
- **`artifacts/api-server`** — the single authoritative auth enforcement point. All session validation, token issuance, and cookie management flows through here.
- **`lib/auth`** — thin `AuthService` / `AuthProvider` abstraction layer used by the API server to resolve identities from different credential formats.
- **`apps/alloy-embedding-api`** and **`apps/alloy-runtime-api`** — machine-to-machine APIs with their own lightweight bearer-token auth (not user-session auth).
- **`artifacts/szl-holdings-mobile`** — Expo app using PKCE-based OIDC flow via `expo-auth-session`; tokens stored in `expo-secure-store`.

---

## 2. Web Artifact Auth Surface

### 2.1 API Server (`artifacts/api-server`)

The API server is the auth surface for all web frontend artifacts. It provides:

| Endpoint | Auth Flow | Source file |
|----------|-----------|-------------|
| `POST /api/auth/login` | Username/password → PBKDF2-SHA512 verify → opaque session token issued, `__Host-sid` cookie set | `routes/auth.ts:202` |
| `POST /api/auth/login-password` | Alias for the password login path (legacy compatibility) | `routes/auth.ts:651` |
| `POST /api/auth/mfa/challenge` | TOTP/MFA second factor challenge | `routes/auth.ts:833` |
| `POST /api/auth/mfa/setup` | TOTP device enrollment | `routes/auth.ts:732` |
| `POST /api/auth/mfa/enable` | TOTP enable/confirm | `routes/auth.ts:779` |
| `POST /api/auth/mfa/setup-required` | MFA enrollment (forced flow) | `routes/auth.ts:957` |
| `POST /api/auth/mfa/enable-required` | MFA enforcement (forced flow) | `routes/auth.ts:1013` |
| `DELETE /api/auth/sessions/current` | Session token deleted from DB, `__Host-sid` cookie cleared (logout) | `routes/auth.ts:378` |
| `DELETE /api/auth/sessions/:id` | Delete a specific session by ID (admin or owner) | `routes/auth.ts:414` |
| `POST /api/auth/sessions` | Create a new session (alternate creation path) | `routes/auth.ts:317` |
| `POST /api/auth/refresh` | Refresh token rotation; replay detection triggers full session revocation | `routes/auth.ts:349` |
| `POST /api/auth/register` | New user registration | `routes/auth.ts:546` |
| `GET /api/auth/me` | Returns current authenticated user profile | `routes/auth.ts:285` |
| `GET /api/auth/my-roles` | Returns current user's roles | `routes/auth.ts:456` |
| `GET /api/auth/verify-email` | Email verification (token link) | `routes/auth.ts:591` |
| `POST /api/auth/ws-ticket` | Issues a WebSocket auth ticket | `routes/auth.ts:486` |
| `POST /api/user/password-reset` | Sends password reset token to email | `routes/org-settings.ts:826` |
| `POST /api/user/password-reset/confirm` | Validates and consumes reset token, writes new hash | `routes/org-settings.ts:909` |
| `GET /api/csrf-token` | Issues CSRF double-submit cookie (`csrf_token`); returns token in JSON | `app.ts:639` |
| `GET /api/auth/providers` | Lists available auth providers | `routes/auth.ts:281` |
| OIDC routes | OIDC redirect flow (optional, via `ISSUER_URL`) | `routes/oidc-auth.ts` |
| `GET /api/health` | Public; no auth required | `routes/health.ts` |

**Middleware chain (per request):**
1. CORS enforcement (origin allowlist from `CORS_ORIGINS`)
2. `authMiddleware()` — resolves session token from `__Host-sid` cookie or `Authorization: Bearer` header; populates `req.user`
3. `csrfMiddleware()` — validates double-submit cookie pair for mutating requests; bypassed for Bearer-authenticated and internal-agent requests
4. `tenantScope()` — resolves `req.tenantOrgId` from route params + `req.user.orgs`
5. Route-level `requireRole(...)` or `requireInternalScope(...)` guards

**Session configuration:**
- Token: `randomBytes(32)` → 64-char hex opaque token
- Cookie name: `__Host-sid` (RFC 6265bis `__Host-` prefix enforces `Secure`, `Path=/`, no `Domain`)
- Flags: `httpOnly: true`, `secure: true` (prod), `sameSite: 'lax'`
- TTL: 7-day default, 30-day absolute max with sliding refresh
- Storage: PostgreSQL `sessions` table

**CSRF configuration:**
- Pattern: Double-submit cookie (`csrf_token` cookie + `X-CSRF-Token` header)
- Token: `randomBytes(32)` → 64-char hex
- Cookie: `httpOnly: false` (SPA-readable), `secure` (prod), `sameSite: 'strict'`
- Bypassed for: Bearer tokens, `x-internal-token`, `OPTIONS`, safe methods

**Rate limiting (applied to auth endpoints):**
- `loginLimiter`: 10 attempts / 15 min per IP, `skipSuccessfulRequests: true`, returns `429 RATE_LIMITED` + `Retry-After`
- `writeLimiter`: applied to password-reset confirm

### 2.2 Web Frontend Artifacts

All web frontend artifacts (React + Vite) are statically served via the API server's asset middleware or as separate Vite dev servers. They do not implement their own auth — all auth state comes from API calls to `artifacts/api-server`.

| Artifact | Auth Dependency | Client-side Guard |
|----------|----------------|-------------------|
| `szl-holdings` (Dashboard) | API server session | Route guard via `useAuth()` hook; redirects to `/login` |
| `terra` | API server session | Route guard via `useAuth()` hook |
| `vessels` | API server session | Route guard via `useAuth()` hook |
| `counsel` | API server session | Route guard via `useAuth()` hook |
| `sentra` | API server session | Route guard via `useAuth()` hook |
| `lyte-command-center` | API server session | Route guard via `useAuth()` hook |
| `pulse` | API server session | Route guard via `useAuth()` hook |
| `command` | API server session | Route guard via `useAuth()` hook |
| `aegis` | API server session | Route guard via `useAuth()` hook |
| `carlota-jo` | API server session | Route guard via `useAuth()` hook |

**Client-side auth pattern (common across all web artifacts):**
- `useAuth()` React hook calls `GET /api/auth/me` on mount; `null` user redirects to the login page.
- CSRF tokens fetched from `GET /api/csrf-token` before any mutating request.
- Token stored in the `__Host-sid` cookie only — no `localStorage` or `sessionStorage`.

### 2.3 Machine-to-Machine APIs

| Service | Auth Mechanism | Notes |
|---------|---------------|-------|
| `apps/alloy-embedding-api` | `AEF_API_KEY` bearer token | `bearerAuth` middleware; `conditionalAuth` bypasses health checks |
| `apps/alloy-runtime-api` | `X-Api-Key` + `X-Tenant-Id` headers | Machine-to-machine; no user session |
| Internal service calls | `x-internal-token` header → `ALLOY_INTERNAL_TOKEN` or `INTERNAL_SERVICE_TOKENS` | Resolves to `ops` role only (GAP-016 fixed) |

---

## 3. Mobile Artifact Auth Surface

### `artifacts/szl-holdings-mobile` (Expo / CORTEX)

| Item | Implementation |
|------|---------------|
| Auth flow | PKCE-based OIDC via `expo-auth-session` |
| Issuer | `EXPO_PUBLIC_ISSUER_URL` (defaults to Replit OIDC issuer) |
| Token storage | `expo-secure-store` → iOS Keychain / Android Keystore; `localStorage` fallback on Expo web only |
| Token keys | `cortex_auth_token`, `cortex_refresh_token`, `cortex_token_expires_at`, `cortex_refresh_token_expires_at` |
| Token refresh | Proactive refresh 5 minutes before expiry; triggered on `AppState` foreground transition |
| Session revocation | `SESSION_REVOKED` and `REFRESH_TOKEN_REPLAY` codes from API trigger local sign-out and display a friendly explanation screen |
| Revocation listeners | Shared `REVOCATION_LISTENERS` set in `AuthContext.tsx`; all screens can register |
| Analytics/Sentry | `identifyUser` / `setSentryUser` on login; `resetUser` / `clearSentryUser` on logout |
| CSRF | N/A — mobile clients send Bearer tokens, which are not auto-attached by browsers; CSRF middleware bypasses Bearer requests |

---

## 4. Auth Shared Package Coverage

`packages/auth-shared` provides the following to all consuming packages and artifacts:

| Module | Exports |
|--------|---------|
| `types.ts` | `PlatformRole` (14-role hierarchy), `AuthenticatedUser`, `SessionToken`, `SessionRecord`, `OrgMembership`, `TenantContext`, `InternalAgentContext`, `CsrfTokenResponse`, role predicates (`hasRole`, `isElevated`, `isReadOnly`, `isMemberOf`) |
| `server/session.ts` | `generateSessionToken`, `sessionCookieOptions`, `clearSessionCookieOptions`, `writeSessionCookie`, `clearSessionCookie`, `requireSessionMiddleware`, `requireRoleMiddleware`, TTL constants |
| `server/csrf.ts` | `generateCsrfToken`, `csrfTimingSafeEqual`, `validateCsrfPair`, `csrfCookieOptions`, `isSafeMethod` |
| `server/rbac.ts` | `checkRole`, `checkNotReadOnly`, `checkOrgMembership`, `resolveTenantOrg`, `allowAllOrgsBypass` |
| `server/tenant.ts` | Tenant resolution helpers |
| `client/csrf.ts` | `readCsrfToken` (reads cookie), `csrfHeaders` (returns headers object) |
| `client/session.ts` | `parseUserFromCookie`, `clearClientSession` |
| `mobile/pkce.ts` | PKCE code verifier/challenge generation helpers |
| `mobile/token-store.ts` | `TokenStore` interface with `SecureStoreAdapter` and `LocalStorageAdapter` implementations |

---

## 5. Auth Surface by Domain

| Domain | Auth Surface | Protected Routes | Public Routes | Auth Package Used |
|--------|-------------|-----------------|---------------|------------------|
| Platform API | `artifacts/api-server` | All `/api/*` except allowlisted | `/healthz`, `/api/auth/login`, `/api/csrf-token`, webhooks | `auth-shared` + API-server middleware |
| Real Estate (Terra) | Via API server | All Terra API routes | Public property listings (if any) | `auth-shared` |
| Maritime (Vessels) | Via API server | All Vessels API routes | AIS public feed | `auth-shared` |
| Legal (Counsel) | Via API server | All Counsel API routes | None | `auth-shared` |
| Cyber (Sentra) | Via API server | All Sentra API routes | None | `auth-shared` |
| Decision (Lyte) | Via API server | All Lyte API routes | None | `auth-shared` |
| Portfolio (SZL Holdings) | Via API server | All SZL API routes | Demo request form | `auth-shared` |
| Alloy (AEF) | `apps/alloy-embedding-api` | All AEF endpoints | Health check | API-key bearer token |
| Alloy Runtime | `apps/alloy-runtime-api` | All runtime endpoints | Health check | API-key + Tenant-Id headers |
| Mobile (CORTEX) | `artifacts/szl-holdings-mobile` | All screens except onboarding | Onboarding/sign-in screens | `expo-auth-session` + `auth-shared/mobile` |

---

## 6. Admin / Privileged Access Surfaces

| Surface | Access Level Required | Notes |
|---------|----------------------|-------|
| Bootstrap admin creation | DB-level (script execution) | `scripts/seed-bootstrap-admin.ts` — env-driven, idempotent |
| Admin dashboard routes | `super_admin` or `admin` role | Protected by `requireRole(['super_admin', 'admin'])` |
| Impersonation | `super_admin` only | `x-impersonation-session` header, 1-hour TTL, audit logged |
| Session revocation | `super_admin` or `platform_admin` | Admin API endpoint |
| SCIM user management | `platform_admin` | Controlled by `platform-auth.ts` |
| Internal agent access | `ops` role only (GAP-016) | Bounded scope; cannot escalate to admin |

---

## 7. Audit Logging Coverage

| Event | Logged? | Location |
|-------|---------|----------|
| Login (success) | Yes | Auth route + `audit_logs` table |
| Login (failure) | Yes | Auth route |
| Logout | Yes | Auth route |
| Session revocation | Yes | Admin API + `audit_logs` table |
| Password change | Yes | Password route |
| Admin impersonation start | Yes | Impersonation middleware |
| Role change | Yes | `replaceUserRoles()` in `lib/db` |
| MFA enable/disable | Yes | MFA route |
| Bootstrap admin seed | Yes | `seed-bootstrap-admin.ts` JSON log (no credentials) |

---

## 8. Gaps and Open Items

| ID | Severity | Description |
|----|----------|-------------|
| AUTH-01 | Low | OIDC route (`oidc-auth.ts`) is present but `ISSUER_URL` is optional. In deployments without an external IdP, this route is unused. Confirm it is not accidentally accessible without configuration. |
| AUTH-02 | Low | Carlota Jo (`artifacts/carlota-jo`) is a marketing/consulting site. Confirm it does not have unprotected write surfaces or contact form endpoints without rate limiting. |
| AUTH-03 | Informational | Clerk integration keys are present in `.env.example` but Clerk is not the active auth provider. If Clerk is intended for a future migration, document the cutover plan before activating. |
| AUTH-04 | Informational | `lib/auth` `DevAuthProvider` is disabled in production (`NODE_ENV === 'production'` guard). Confirm this guard is enforced in the API server startup validation. |
