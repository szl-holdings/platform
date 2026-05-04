# Sign-On Consolidation Plan — Series-A Reset (Phase 9)

**Date:** 2026-04-20
**Scope:** All authentication surfaces across the SZL Holdings monorepo
**Author:** growth capital Hardening — Phase 9 Security Hardening & Sign-On Consolidation
**Status:** COMPLETE — consolidation achieved in Phase B (Task 2686) and verified in Phase 9.

---

## 1. Consolidation Goal

Ensure that all artifacts and services share a single, consistent sign-on model — with uniform session handling, cookie configuration, CSRF posture, route guarding, mobile token handling, and audit logging — rather than each artifact implementing its own divergent auth layer.

---

## 2. Consolidation Target State (Achieved)

| Layer | Consolidated Implementation | Package / File |
|-------|-----------------------------|----------------|
| Session token generation | `generateSessionToken()` — `randomBytes(32)` → 64-char hex | `packages/auth-shared/src/server/session.ts` |
| Session cookie write | `writeSessionCookie()` / `clearSessionCookie()` | `packages/auth-shared/src/server/session.ts` |
| Cookie configuration | `__Host-sid`, `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `path: '/'` | `packages/auth-shared` + `artifacts/api-server/src/lib/auth.ts` |
| Session TTL constants | 7-day default, 30-day absolute max | `packages/auth-shared/src/server/session.ts` |
| Session regeneration | `POST /auth/refresh` with rotation + replay detection | `artifacts/api-server/src/routes/auth.ts` |
| Session revocation | `revokedAt`, `sessionVersion` + `SESSION_MIN_CREATED_AT` cutoff | `artifacts/api-server/src/middlewares/auth.ts` |
| CSRF — server | `validateCsrfPair()`, `generateCsrfToken()`, `csrfTimingSafeEqual()` | `packages/auth-shared/src/server/csrf.ts` |
| CSRF — client | `readCsrfToken()`, `csrfHeaders()` | `packages/auth-shared/src/client/csrf.ts` |
| CSRF — enforcement | `csrfMiddleware()` applied globally; bypassed for Bearer + internal | `artifacts/api-server/src/middlewares/csrf.ts` |
| RBAC predicates | `checkRole()`, `checkNotReadOnly()`, `checkOrgMembership()` | `packages/auth-shared/src/server/rbac.ts` |
| Role definitions | 14-role hierarchy as `const` array | `packages/auth-shared/src/types.ts` |
| Tenant scoping | `tenantScope()` middleware, `resolveTenantOrg()` | `packages/auth-shared/src/server/rbac.ts` + API server |
| Audit logging | Structured `audit_logs` table entries for all privileged events | `artifacts/api-server/src/routes/auth.ts` |
| Mobile token storage | `expo-secure-store` (Keychain/Keystore); `TokenStore` interface | `packages/auth-shared/src/mobile/token-store.ts` |
| Mobile PKCE | `generateCodeVerifier()`, `generateCodeChallenge()` | `packages/auth-shared/src/mobile/pkce.ts` |
| Mobile session revocation | `recordSessionRevocation()` + `REVOCATION_LISTENERS` | `artifacts/szl-holdings-mobile/context/AuthContext.tsx` |
| Route guards (server) | `requireRole(...)`, `requireInternalScope(...)` | `artifacts/api-server/src/middlewares/auth.ts` |
| Route guards (client) | `useAuth()` hook → redirect to `/login` | Per-artifact React router guard |
| Password hashing | PBKDF2-SHA512, 100k iterations, 32-byte random salt | `artifacts/api-server/src/routes/auth.ts` + `scripts/seed-bootstrap-admin.ts` |
| Rate limiting | `loginLimiter` (10/15min), `writeLimiter` on auth endpoints | `artifacts/api-server/src/middlewares/rate-limiters.ts` |
| MFA | TOTP via `otplib`; secrets encrypted with AES-256-GCM | `artifacts/api-server/src/routes/auth.ts` |
| Bootstrap admin | Env-driven, idempotent, no credential logging | `scripts/seed-bootstrap-admin.ts` |

---

## 3. Pre-Consolidation State (Historical Baseline)

Before Phase B (Task 2686), the following divergences existed:

| Finding | Artifact(s) | Resolution |
|---------|-------------|-----------|
| F-01: No login rate limiting | API server | Added `loginLimiter` in Phase B |
| F-02: MFA secrets unencrypted without `MFA_SECRET_ENCRYPTION_KEY` | API server | Startup validation added; key required in prod |
| F-03: Cookie flags not confirmed | API server | Verified: `__Host-sid` prefix enforces all required flags |
| F-04: Dual role systems diverging | API server | Documented authoritative sources; synced transactionally |
| F-05: Per-route org-scope validation inconsistent | API server routes | Tenant scope audit (Task 2635) completed; all 148 group-prefix surfaces enforce `tenantScope` |
| F-06: Password reset token single-use not confirmed | API server | Verified: token cleared atomically on consumption |
| F-07: Mobile token in `AsyncStorage` risk | Mobile artifact | Verified: `expo-secure-store` used for all auth tokens |

---

## 4. Active Consolidation Points

### 4.1 All Web Artifacts → Shared Cookie + Session Model

All web frontend artifacts (Terra, Vessels, Counsel, Sentra, Lyte, Pulse, Command, Aegis, SZL Holdings, Carlota Jo) authenticate exclusively through the `artifacts/api-server` API. None implement their own session storage or cookie issuance. The `__Host-sid` cookie is issued once by the API server and read by all artifact frontends on the same origin.

**Sign-in flow (unified):**
1. User submits credentials to `POST /api/auth/login` (or `/api/auth/login-password`).
2. API server validates, creates session in DB, sets `__Host-sid` cookie.
3. SPA reads auth state via `GET /api/auth/me`.
4. Protected routes client-side redirect to `/login` if `me` returns 401.
5. On sign-out, SPA calls `DELETE /api/auth/sessions/current` (`routes/auth.ts:378`); server deletes session from DB and clears cookie.

### 4.2 Mobile Artifact → PKCE + Bearer Token Model

The mobile artifact uses PKCE OIDC rather than cookie-based sessions (cookies are impractical in native mobile contexts). Tokens are issued by the same API server after PKCE code exchange.

**Sign-in flow (mobile, unified):**
1. `expo-auth-session` initiates PKCE authorization request to `EXPO_PUBLIC_ISSUER_URL`.
2. User authenticates in browser; auth code returned to app.
3. App exchanges code for access + refresh tokens via API server token endpoint.
4. Tokens stored in `expo-secure-store`.
5. All API calls include `Authorization: Bearer <access_token>`.
6. Token proactively refreshed 5 minutes before expiry; `SESSION_REVOKED` / `REFRESH_TOKEN_REPLAY` responses trigger local sign-out.

### 4.3 Machine-to-Machine → Scoped API Key Model

The AEF and Runtime APIs use purpose-specific bearer tokens (`AEF_API_KEY`, `X-Api-Key`) rather than user sessions. These are appropriate for server-to-server use cases.

Internal service calls use `ALLOY_INTERNAL_TOKEN` or scoped `INTERNAL_SERVICE_TOKENS`, both bounded to the `ops` role (GAP-016 remediation).

---

## 5. Bootstrap Admin Sign-In

The bootstrap admin (`stephenlutar` or as configured via `BOOTSTRAP_ADMIN_USERNAME`) can sign in via:

- **Web:** `POST /api/auth/login` with the credentials set in `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD`.
- **Mobile:** Same credentials via the PKCE flow (same API server token endpoint).
- **Admin routes:** The bootstrap admin is assigned `founder_admin` platform role + `super_admin` + `admin` RBAC roles, providing access to all protected admin surfaces.

See `docs/BOOTSTRAP_ADMIN.md` for provisioning instructions.

---

## 6. Logout Consistency

| Scenario | Behavior |
|----------|---------|
| Web sign-out | `DELETE /api/auth/sessions/current` (`routes/auth.ts:378`) → session deleted from DB → `__Host-sid` cookie cleared → SPA redirects to `/login` |
| Mobile sign-out | Local token deletion from `expo-secure-store` → session deletion via API → analytics user reset → Sentry user cleared |
| Admin-forced sign-out | `revokedAt` set in DB → next request returns `401 SESSION_REVOKED` → client redirects to login with revocation message |
| Password change | `session_version` incremented → all existing session tokens invalidated on next request |
| Refresh token replay | All sessions for the user revoked → `401 REFRESH_TOKEN_REPLAY` → client displays security message |

---

## 7. Settings / Account Screens

| Artifact | Settings Screen | Auth-Gated? | Session Actions Available |
|----------|----------------|-------------|--------------------------|
| Web (all artifacts) | `/settings` or `/account` | Yes (requireAuth) | Password change, active sessions list, sign out all |
| Mobile (CORTEX) | Profile / Settings tab | Yes | Sign out, token refresh visible |

---

## 8. Remaining Open Items

| ID | Priority | Description |
|----|----------|-------------|
| CONSOL-01 | Low | Confirm `GET /auth/oidc/*` routes in `oidc-auth.ts` are not accessible in deployments where `ISSUER_URL` is not configured. Add a guard that returns 404 if OIDC is not configured. |
| CONSOL-02 | Low | Document the cutover plan for activating Clerk (if intended) vs. continuing with the current native session model. The `CLERK_SECRET_KEY` placeholder in `.env.example` creates ambiguity. |
| CONSOL-03 | Informational | The `DevAuthProvider` in `lib/auth` should be explicitly disabled via startup validation in production, not just via runtime guard. Add to `failFastOnInvalidConfig()`. |
| CONSOL-04 | Informational | Mobile and web PKCE flows share the same issuer URL. Document that changing `EXPO_PUBLIC_ISSUER_URL` and `ISSUER_URL` in production requires coordinated rotation of any existing mobile sessions. |

---

## 9. Consolidation Verification Checklist

- [x] Single shared package (`packages/auth-shared`) provides all auth primitives
- [x] All web artifacts authenticate via `artifacts/api-server` — no per-artifact session stores
- [x] `__Host-sid` cookie with `httpOnly: true`, `secure: true` (prod), `sameSite: 'lax'`
- [x] CSRF double-submit pattern enforced on all mutating requests
- [x] Mobile uses `expo-secure-store` — no `AsyncStorage` for auth tokens
- [x] Refresh token rotation with replay detection
- [x] Bootstrap admin (`stephenlutar`) can sign in on web and mobile
- [x] Logout clears session from DB and cookie
- [x] Password change invalidates all existing sessions via `session_version`
- [x] Rate limiting on all auth endpoints
- [x] MFA (TOTP) with encrypted secrets
- [x] Audit logging for all privileged auth events
- [x] Internal service tokens bounded to `ops` role (no escalation to admin)
- [x] Route security matrix enforced in CI — no unclassified routes allowed
- [x] Tenant scoping on all org-gated routes
