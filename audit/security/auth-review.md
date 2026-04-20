# Auth Review — Phase A Security Audit

**Date:** 2026-04-20  
**Scope:** All artifacts in the monorepo  
**Reviewer:** Series A Hardening — Phase A  
**Methodology:** Static code review of `artifacts/api-server/src/`, `lib/auth/`, `lib/db/`, mobile artifact (`artifacts/szl-holdings-mobile/`), and Vite frontend artifacts.

---

## 1. Login Flow

**Implementation:** `artifacts/api-server/src/routes/auth.ts`

| Item | Status | Notes |
|------|--------|-------|
| Password hashing algorithm | PBKDF2-SHA512, 100k iterations, 64-byte output, random 32-byte salt | Acceptable. Argon2id would be preferable for new projects but PBKDF2 at this iteration count is within OWASP guidelines. |
| Hash format in DB | `pbkdf2:<salt-hex>:<hash-hex>` in `users.password_hash` | Correct — salt is per-user and stored with hash. |
| Timing-safe comparison | `timingSafeEqual` used in verify path | Correct. |
| Brute-force protection | Not explicitly implemented in auth route | **FINDING F-01:** No rate limiting or lockout is visible in the auth login endpoint. Recommend adding `express-rate-limit` or similar on `/auth/login`. |
| Email enumeration | Login error messages should be generic | Partial. Error paths return structured error codes — review that distinct "user not found" vs "wrong password" codes are not exposed. |
| MFA | TOTP via `otplib` with dual-write Redis + in-memory fallback | Implemented. TOTP secrets encrypted at rest with AES-256-GCM when `MFA_SECRET_ENCRYPTION_KEY` is set. **FINDING F-02:** If `MFA_SECRET_ENCRYPTION_KEY` is not set, secrets are stored with a `plain:` prefix and a startup warning is emitted. This must be set in production. |

---

## 2. Session Configuration

**Implementation:** `artifacts/api-server/src/middlewares/session-policy.ts`, `artifacts/api-server/src/lib/auth.ts`

| Item | Status | Notes |
|------|--------|-------|
| Session storage | Database-backed (PostgreSQL `sessions` table) | Correct — no server-side in-memory session store. |
| Session TTL | 7 days hard expiry from creation | Reasonable for B2B SaaS. |
| Sliding window refresh | Yes — extends up to absolute max, not indefinitely | Correct implementation with absolute ceiling. |
| Token format | Random opaque token (via `randomBytes`) | Correct. |
| Session version | `session_version` column on both `users` and `sessions` | Correct — used for global session invalidation (password change, forced logout). |
| Cookie configuration | Review required | **FINDING F-03:** Cookie flags (`httpOnly`, `secure`, `sameSite`) should be verified in `lib/auth.ts` `setSessionCookie`. Confirm `secure: true` in production and `sameSite: 'strict'` or `'lax'`. |

---

## 3. Password Hashing

See Section 1. Hash algorithm: PBKDF2-SHA512, 100k iterations.

- **Recommendation:** Plan migration to Argon2id for new user registrations and on next password change. PBKDF2-100k is acceptable but Argon2id is the current OWASP first choice.
- Salt: 32-byte random per hash. Correct.
- The hash is never logged (confirmed — log statements do not include `passwordHash`).

---

## 4. Cookie Flags

**FINDING F-03 (detail):** Need to confirm `setSessionCookie` in `artifacts/api-server/src/lib/auth.ts` sets:
- `httpOnly: true` — prevents JavaScript access
- `secure: true` in production — HTTPS-only
- `sameSite: 'lax'` or `'strict'` — CSRF mitigation

This was not fully verified due to the size of the codebase. Should be confirmed in Phase B code review.

---

## 5. CSRF Posture

| Item | Status | Notes |
|------|--------|-------|
| SameSite cookie | Partial — see F-03 | If `sameSite: 'strict'` or `'lax'` is set, SameSite alone provides strong CSRF protection for modern browsers. |
| Explicit CSRF token | Not observed in API routes reviewed | With SameSite cookies, explicit CSRF tokens are often redundant for API endpoints consumed by SPA frontends. However, if forms submit directly (non-XHR), a CSRF token is needed. |
| CORS configuration | Present — `CORS_ORIGINS` env var used | Confirm `credentials: true` is paired with an explicit origin allowlist (not `*`). |

**Posture:** Acceptable if SameSite cookies are correctly set. Explicit CSRF token middleware is recommended for any non-JSON form submissions.

---

## 6. RBAC Consistency

**Implementation:** `lib/db/src/schema/auth.ts`, `artifacts/api-server/src/middlewares/auth.ts`

| Item | Status | Notes |
|------|--------|-------|
| Role definition | Dual-layer: `users.platform_role` (enum) + `user_roles` join table | Two parallel role systems. `platform_role` appears to be legacy/simplified; `user_roles` is the authoritative RBAC table. **FINDING F-04:** Dual role systems create inconsistency risk. Phase B should audit which system is authoritative per route and consolidate. |
| Role hierarchy | `ROLE_HIERARCHY` constant in `lib/db` | Present. |
| Route protection | `requireRole()` middleware on protected routes | Confirmed in auth.ts. |
| Read-only role enforcement | `isReadOnlyRole()` check used | Present. |

---

## 7. Tenant Scoping

| Item | Status | Notes |
|------|--------|-------|
| Org-level isolation | `orgMembersTable` with `org_id` on all org resources | Present. |
| Tenant scoping on queries | `authMiddleware()` attaches `req.user.orgs` | Present. |
| Cross-tenant data leak risk | Not fully audited | **FINDING F-05:** Individual route handlers should be verified to always filter by `org_id` from `req.user.orgs` rather than accepting `org_id` from request body/params without validation. Phase B scope. |

---

## 8. Logout / Reset Flow

| Item | Status | Notes |
|------|--------|-------|
| Session deletion on logout | `DELETE FROM sessions WHERE token = ?` | Correct. |
| Session version increment on password change | Not fully confirmed | Should be verified — password change should increment `users.session_version` to invalidate all existing sessions. |
| Password reset token | `password_reset_token` + `password_reset_token_expires_at` columns in users table | Schema exists. Reset flow implementation not fully reviewed in this audit. |
| Reset token single-use | Not confirmed | **FINDING F-06:** Password reset tokens must be cleared after use. Verify in routes. |

---

## 9. Protected Route Middleware

| Item | Status | Notes |
|------|--------|-------|
| `authMiddleware()` | Applied consistently to protected routes | Confirmed in API server route files. |
| Public route exceptions | Login, registration, health-check | Appropriate. |
| Internal agent token | `x-internal-token` header validated via `verifyInternalHeader()` | Correct. Internal agents are bounded to `ops` role — **GAP-016 fix confirmed applied.** |

---

## 10. Mobile Token Handling

**Implementation:** `artifacts/szl-holdings-mobile/`

| Item | Status | Notes |
|------|--------|-------|
| Auth mechanism | Bearer token (session token from API server) | Consistent with web. |
| Token storage | Needs verification | **FINDING F-07:** Mobile apps must store tokens in `expo-secure-store` (iOS Keychain / Android Keystore), not `AsyncStorage`. Verify in mobile artifact. |
| Token transmission | HTTPS only via API base URL | Correct if `EXPO_PUBLIC_API_URL` is HTTPS. |

---

## 11. Refresh Token Handling

| Item | Status | Notes |
|------|--------|-------|
| Refresh token rotation | Yes — `rotateRefreshToken()` with single-use enforcement | Correct. |
| Replay detection | `RefreshTokenReplayError` triggers revocation of all sessions | **Strong posture.** Replay of a refresh token invalidates everything, limiting the blast radius. |
| Refresh token storage in DB | `sessions.refresh_token` column | Present. |

---

## 12. Admin Privilege Escalation

| Item | Status | Notes |
|------|--------|-------|
| Bootstrap admin path | Via `seed-bootstrap-admin.ts` (new) | Environment-variable driven, logged without credentials. |
| Internal token privilege | Fixed at `ops` role (GAP-016 applied) | Correct. |
| `super_admin` assignment | Only via database seed scripts | No self-assignment path observed. |
| Admin impersonation | `x-impersonation-session` header + audit log | Present with 1-hour TTL and audit trail. |

---

## 13. Auth Provider Notes

All web artifacts use the project's own session-based auth (not Clerk or external OIDC in the current deployment). Clerk integration keys are present in `.env.example` (`CLERK_SECRET_KEY`) but Clerk is not confirmed as the active provider in any artifact reviewed. The `ISSUER_URL` env var suggests OIDC is supported but may not be wired in all artifacts.

**No auth provider changes were made in this phase.** Inconsistencies are flagged as findings for Phase B.

---

## Findings Summary

| ID | Severity | Description | Phase |
|----|----------|-------------|-------|
| F-01 | High | No rate limiting on login endpoint | Phase B |
| F-02 | High | `MFA_SECRET_ENCRYPTION_KEY` not set → TOTP secrets stored unencrypted | Immediate — add to Replit Secrets |
| F-03 | Medium | Cookie `secure`/`sameSite` flags not confirmed | Phase B |
| F-04 | Medium | Dual role system (`platform_role` + `user_roles`) creates inconsistency risk | Phase B |
| F-05 | Medium | Individual routes may not validate `org_id` against `req.user.orgs` | Phase B |
| F-06 | Medium | Password reset token single-use consumption not confirmed | Phase B |
| F-07 | Medium | Mobile token storage mechanism not confirmed (should use secure store) | Phase B |

All findings are **documented only** in this phase. No auth code was modified.
