# Session & Cookie Security Baseline

**Version:** 1.0
**Date:** April 27, 2026
**Authority:** Engineering Security
**Status:** Enforced

---

## Purpose

This document defines the canonical session and cookie security policy for the SZL Holdings platform. Every authenticated artifact (web, mobile, API) must conform. Deviations must be documented here with an explicit justification and owner.

---

## 1. Session Token Design

| Property | Requirement | Implementation |
|---|---|---|
| Format | Opaque, cryptographically random | 32 random bytes → 64-char hex string |
| Storage | Database (`sessions` table) | `artifacts/api-server/src/lib/auth.ts` |
| Transport (web) | `__Host-sid` cookie only | `setSessionCookie()` in `lib/auth.ts` |
| Transport (mobile) | `Authorization: Bearer <token>` | `expo-secure-store` (iOS Keychain / Android Keystore) |
| Session TTL | 7 days from creation | `SESSION_TTL` in `lib/auth.ts` (`SESSION_ABSOLUTE_MAX_MS` in `auth-shared`) |
| Absolute max | 7 days (sliding window ceiling = `createdAt + SESSION_TTL`) | `sessionRefreshPolicy` in `session-policy.ts` |
| Refresh token TTL | 30 days (separate from session lifetime) | `REFRESH_TOKEN_TTL` in `session-policy.ts`, `REFRESH_TOKEN_TTL_MS` in `auth-shared` |

---

## 2. Cookie Flags

All session cookies **must** be set with the following attributes:

| Flag | Value | Rationale |
|---|---|---|
| `HttpOnly` | `true` | Prevents JavaScript access (XSS mitigation) |
| `Secure` | `true` (always, not just in production) | The `__Host-` prefix mandates it; Replit proxy terminates TLS in all environments |
| `SameSite` | `Lax` | Allows top-level cross-site navigations from OIDC callbacks while blocking CSRF in subresource requests. `Strict` is not used because it would break the OIDC redirect back to the platform after login. |
| `Path` | `/` | Required by the `__Host-` prefix contract |
| `Domain` | **absent** | Required by the `__Host-` prefix contract; prevents subdomain cookie injection |

**Cookie name:** `__Host-sid`

The `__Host-` prefix (RFC 6265bis §4.1.3.2) provides browser-enforced protection: any response that sets `__Host-sid` without `Secure`, `Path=/`, and no `Domain` attribute will be silently rejected by compliant browsers. This removes the need to trust the application layer to set all three correctly.

### Legacy cookie migration

During the `sid` → `__Host-sid` rename rollout:
- All new responses set `__Host-sid` and clear `sid`.
- The server reads `__Host-sid` first, then falls back to `sid`.
- Once no active sessions carry `sid`, this fallback should be removed.

---

## 3. Refresh Token Rotation

- Refresh tokens are **single-use**. Presenting a refresh token atomically claims it and issues a new `(session_token, refresh_token)` pair.
- **Replay detection:** If a refresh token that was already consumed is presented again, all active sessions for that user are immediately revoked, the user's `session_version` is bumped, and a `session.refresh.replay` audit event is written. This follows standard rotating-refresh-token theft response.
- Refresh tokens are stored in **plaintext** in the `sessions.refresh_token` column. See the Deviations section for the accepted gap and remediation reference.
- Refresh tokens are returned to the client only once, at session creation or rotation.
- Refresh token TTL: 30 days. After expiry the user must re-authenticate via OIDC.

---

## 4. Server-Side Session Revocation

The platform maintains a server-side session record for every active session. Revocation is enforced on every authenticated request.

### Revocation triggers

| Trigger | Mechanism |
|---|---|
| User signs out | Session row deleted from DB; cookie cleared |
| Admin force-sign-out | Session `revokedAt` set + `revokedReason`; `session_version` bumped |
| Role/org change | `revokeUserSessionsOnRoleChange()` sets `revokedAt` on all active sessions; `session_version` bumped |
| Refresh token replay | All active sessions revoked; `session_version` bumped |
| Secret rotation / global force-logout | `SESSION_MIN_CREATED_AT` env var set; any session created before this timestamp is rejected |

### Enforcement

`resolveUserFromToken()` in `middlewares/auth.ts` is the authoritative session resolver used by all API routes. It enforces:
1. `expiresAt > now` — token is not expired.
2. `revokedAt IS NULL` — token is not explicitly revoked.
3. `session.sessionVersion === user.sessionVersion` — no in-band role change has occurred.
4. `session.createdAt >= SESSION_MIN_CREATED_AT` (when set) — passes the global rotation cutoff.

---

## 5. OIDC State Cookies

Temporary OIDC flow cookies (`code_verifier`, `nonce`, `state`, `return_to`, and their `aad_` prefixed counterparts) are:
- Set with `HttpOnly: true`, `Secure: true`, `SameSite: Lax`, `Path: /`, `maxAge: 10 minutes`.
- Cleared with the same set of flags immediately after the OIDC callback completes or fails.

---

## 6. Mobile Token Storage

Mobile clients (Expo/React Native) must store session and refresh tokens using `expo-secure-store` (iOS Keychain / Android Keystore). `AsyncStorage` is explicitly prohibited — it is unencrypted.

Token keys: `szl.session_token`, `szl.refresh_token`.

On logout, both tokens are cleared via `MobileTokenStore.clearAll()`.

---

## 7. Session Version (In-Band Revocation)

Every user record carries a `session_version` integer. Every session row records the `session_version` that was current at creation. If the user's `session_version` advances (e.g., due to a role change), any session with an older version is immediately treated as revoked, providing ≤30-second convergence without requiring a synchronous revocation broadcast.

---

## 8. Artifact Conformance Matrix

| Artifact | Auth mechanism | Cookie? | Refresh token? | Revocation enforced? | Notes |
|---|---|---|---|---|---|
| `api-server` (all web routes) | `authMiddleware()` / `resolveUserFromToken` | `__Host-sid` | Yes (via `/auth/refresh`) | Yes — `revokedAt + sessionVersion` | Canonical enforcer |
| `api-server` admin guard | `adminGuard()` / `getSessionUser` | `__Host-sid` | — | Yes — `revokedAt` checked | Uses `getSessionUser` (revokedAt filter added) |
| Web artifacts (OIDC login) | Redirect to `/api/login` → `__Host-sid` cookie | `__Host-sid` | Yes (OIDC callback → `createSessionWithRefresh`) | Via api-server | Cookies set server-side |
| Azure AD login | Redirect → `__Host-sid` cookie | `__Host-sid` | Yes (AAD callback → `createSessionWithRefresh`) | Via api-server | |
| Mobile (`szl-holdings-mobile`) | Bearer token in header | No (token in Keychain) | Yes (via `/api/auth/refresh`) | Via api-server | `expo-secure-store` mandatory |

---

## 9. Deviations

| # | Description | Risk | Owner | Remediation |
|---|---|---|---|---|
| D-001 | Refresh tokens are stored in plaintext in `sessions.refresh_token`. A DB read compromise exposes long-lived (30-day) tokens that could mint new access sessions. | Medium | Engineering Security | Encrypt at rest using AES-256-GCM (same pattern as TOTP secrets). See task #4410. |

---

## 10. Review Schedule

This document must be reviewed:
- After any change to session lifetime, cookie configuration, or auth provider.
- As part of any external security assessment.
- At least annually.
