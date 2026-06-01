# SZL Holdings — Auth Surface Map

**Generated:** 2026-04-21  
**Track:** Zero-Gap Track 1

---

## Auth Architecture Summary

The platform uses **Replit OIDC (PKCE)** as the primary authentication provider, with a 11-role RBAC model and deny-by-default global enforcement. All queries are org-scoped for multi-tenant isolation.

---

## Auth Providers

| Provider | Implementation | Used By |
|---------|---------------|---------|
| Replit OIDC / PKCE | `lib/auth/`, `lib/replit-auth-web/` | All registered web artifacts (primary) |
| Local `useAuth()` hook | Artifact-level implementation | `artifacts/pulse` (non-standard) |
| Session-based | Express sessions in `artifacts/api-server` | Backend API; all frontend artifacts via API |
| Biometric | Planned — Expo / React Native | Mobile (CORTEX / `szl-holdings-mobile`) |

---

## Per-Artifact Auth Posture

| Artifact | Auth Method | Gate | Status |
|---------|------------|------|--------|
| `szl-holdings` | Replit OIDC (redirect helper) | Yes | Active |
| `api-server` | Session + RBAC middleware | All routes require auth | Active |
| `command` | Replit OIDC | Yes | Active |
| `terra` | Replit OIDC | Yes | Active |
| `vessels` | Replit OIDC | Yes | Active |
| `carlota-jo` | `@szl-holdings/replit-auth-web` | Yes | Active |
| `pulse` | Local `useAuth()` hook | Yes (local gate) | Non-standard — inconsistent with platform pattern |
| `aegis` | Replit OIDC | Yes | Active |
| `sentra` | Replit OIDC | Yes | Active |
| `counsel` | Replit OIDC | Yes | Active |
| `lyte-command-center` | Replit OIDC | Yes | Active |
| `mockup-sandbox` (NEXUS) | `authMiddleware({ required: true })` | Yes (`InternalAuthGate` on 401) | Internal-only |
| `szl-holdings-mobile` | Planned biometric | Not yet active | Deferred |
| `szl-demo-video` | None (public video) | No | Expected |

---

## RBAC Model

| Attribute | Value |
|-----------|-------|
| Role count | 11 |
| Enforcement | Deny-by-default global enforcer |
| Scope | Org-scoped tenant isolation |
| Cross-org access | Returns 404 (prevents information leakage) |
| Implementation | `lib/auth/`, API server middleware |

**Roles (per README/trust docs):** 11 total — specific role names defined in `lib/auth/` and the RBAC matrix at `docs/security/access-control-matrix.md`.

---

## API Auth

| Mechanism | Applied To | Notes |
|-----------|-----------|-------|
| Session cookie | All API routes | Express sessions |
| HMAC-signed WS tickets | WebSocket connections | Per-channel ACL |
| Bearer token | AEF endpoints (`alloy-embedding-api`) | Per-tenant rate limiting |
| Substrate API key | `/control-tower/substrate/*` | `SUBSTRATE_GATEWAY_API_KEY` env var |
| Internal Alloy token | Internal service-to-service | `ALLOY_INTERNAL_TOKEN` (dev only) |

---

## Sign-In Paths

| Path | Artifact | Notes |
|------|---------|-------|
| Replit OIDC callback | `artifacts/api-server` | Primary OIDC callback handler |
| `/login` | Multiple artifacts | Redirect to OIDC flow |
| `/founder` | `artifacts/szl-holdings` | Founder profile (previously `stephen-site`) |

---

## Known Auth Gaps (Inherited from prior audit)

1. `artifacts/pulse` uses a local `useAuth()` hook instead of the shared `@szl-holdings/replit-auth-web`. Inconsistent with platform auth pattern — flagged in `docs/reconciliation-report.md`.
2. Mobile auth (biometric) is planned but not implemented. `szl-holdings-mobile` has a deferred implementation.
3. `prism-counsel-ci.yml` CI workflow exists for an archived artifact — leftover from Task #634.
