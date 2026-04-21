# SZL Holdings — Auth, RBAC & Tenant Security Audit

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** Authentication system, RBAC model, tenant isolation, session management, internal token security

---

## Executive Summary

The SZL Holdings platform implements a defense-in-depth authentication and authorization model with multiple complementary layers. All P0 and P1 auth gaps from the April 2026 hardening sprint are resolved.

| Category | Status | Notes |
|---|---|---|
| Global auth enforcement | ✅ Solid | Deny-by-default on all /api/* routes |
| RBAC model | ✅ Solid | 11-role hierarchy with deny-by-default |
| Tenant isolation | ✅ Solid | All P0 cross-tenant gaps resolved |
| Session management | ✅ Solid | Sliding window expiry; refresh policy |
| Internal token security | ✅ Solid | Timing-safe comparison; scope catalog |
| CSRF protection | ✅ Solid | Double-submit cookie pattern |
| MFA support | ✅ Present | `mfa_secrets` table; routes exist |
| SCIM provisioning | ✅ Present | RFC 7643/7644; bearer token auth |

---

## Authentication Architecture

### Layer 1: Session Hydration (authMiddleware.ts)
- Runs on **every request**
- Populates `req.user` and `req.oidcUser` from session cookie or Bearer token
- Non-enforcing — provides user context without mandating authentication
- Session tokens stored in `sessions` DB table; validated against expiry and rotation

### Layer 2: Global Auth Enforcer (global-auth-enforcer.ts)
- Runs **after** session hydration
- **Deny-by-default** for all `/api/*` routes
- Returns 401 for unauthenticated requests unless path is in explicit public allowlist
- Public allowlist is documented inline and audited

**Public allowlist (documented routes only):**
- `/api/health*` — health endpoints
- `/api/auth/*` — auth/login/register
- `/api/oidc/*` — OIDC callbacks
- `/api/contact` — contact form
- `/api/demo-requests` — demo request form
- `/api/public/*` — public status endpoints
- `/api/webhooks/*` — HMAC-authenticated webhooks
- `/api/scim/*` — SCIM provisioning (bearer token auth within router)
- `/api/stream/*` — streaming endpoints (own token auth)
- `/api/federation/agents*`, `/api/federation/health` — A2A federation
- `/api/v1/*` — DOS public API (API key auth)
- `/api/docs*`, `/api/docs.json` — API documentation
- `/api/csrf-token` — CSRF token endpoint
- `/api/mobile-auth/token-exchange` — mobile OIDC token exchange

### Layer 3: Route-Level Authorization (auth.ts `authMiddleware()`)
- `authMiddleware({ required: true })` — enforces auth at route level
- Role checks via `requireRole()` and `requireMinRole()`
- `denyIfReadOnly()` — blocks mutations for viewer roles
- `requireInternalScope()` — enforces scoped internal service access

### Layer 4: Tenant Scope (tenant-scope.ts)
- Resolves `req.tenantOrgId` from user's org membership
- Validates user belongs to requested org
- Returns 403 on cross-org access attempts
- Logs tenant isolation violations to telemetry

---

## RBAC Model

### Roles (11-role hierarchy from `@szl-holdings/auth-shared`)

| Role | Level | Description |
|---|---|---|
| `super_admin` | 10 | Platform-wide; all orgs |
| `admin` | 9 | Org-level administrator |
| `ops` | 8 | Operations; most write access |
| `analyst` | 7 | Analysis + read + limited write |
| `operator` | 6 | Execute governed actions |
| `auditor` | 5 | Read-only + audit trail access |
| `viewer` | 4 | Read-only |
| `executive_viewer` | 3 | Read-only; filtered executive view |
| `anonymous_visitor` | 2 | Public-only access |
| `service_account` | 1 | Internal service accounts |
| `readonly` | 0 | Strict read-only |

### Role Enforcement
- `ROLE_HIERARCHY` constant enforces minimum role checks
- `isReadOnlyRole()` correctly identifies non-mutating roles
- Internal service tokens map to `ops` role only (not `super_admin`) — prevents privilege escalation on token leak
- `toCanonicalRole()` normalizes role strings

---

## Internal Service Token Security

**Previous vulnerability (resolved):** Internal tokens were compared with `===` (timing-unsafe).  
**Resolution:** All comparisons use `crypto.timingSafeEqual()`.

**Token architecture:**
- Legacy `ALLOY_INTERNAL_TOKEN` — maps to `ops` role only (downgraded from `super_admin`)
- New `INTERNAL_SERVICE_TOKENS` — scoped tokens with declared scope catalog
- `verifyInternalHeader()` validates token + path scope
- `requireInternalScope()` enforces declared scopes at route level
- GAP-016: Production refuses to boot if only legacy token is configured (security policy enforced at startup)

---

## Session Management

- Session tokens stored in `sessions` DB table with expiry timestamps
- Sliding window session refresh via `sessionRefreshPolicy` middleware
- `getSessionMinCreatedAt()` enforces minimum session age for sensitive operations
- Cookie flags: `Secure`, `HttpOnly`, `SameSite=Strict` in production
- Token rotation on privilege changes

---

## Tenant Isolation Verification

All P0 cross-tenant gaps are resolved:

| Gap | Resolution |
|---|---|
| KG001: RAG retrieval singleton no tenant partitioning | `tenantId` field added to `RetrievalChunk`; all methods enforce tenant scope |
| KG015: `rag_knowledge_chunks` no `tenant_id` column | Column + index added; strict SQL predicates enforced |
| KG014: `graph-rag.ts` not propagating tenant ID | Fixed; tenantId propagated through entire retrieval chain |
| T7: Cross-tenant corpus size leaked | Fixed; `totalIndexed` now returns per-tenant count only |
| Tenant scope middleware | Self-hydrates org memberships; violation events logged to telemetry |

---

## CSRF Protection

- Double-submit cookie pattern via `csrf.ts` middleware
- `/api/csrf-token` endpoint issues CSRF token (public, no auth required)
- All state-mutating routes (POST/PUT/PATCH/DELETE) require valid CSRF token
- SSE and GET endpoints exempt (no state mutation)

---

## MFA Implementation

- `mfa_secrets` table exists in schema
- MFA routes present in auth router
- Status: Implementation exists; coverage of MFA requirement on sensitive operations not fully documented

**Recommendation:** Audit which high-privilege operations require MFA confirmation and document enforcement points.

---

## Open Auth Gaps

| Gap ID | Description | Severity | Status |
|---|---|---|---|
| KG025 | WCAG accessibility not systematically audited | P2 | Open |
| KG018 | 80+ env vars with no formal schema documentation | P2 | Open — `@szl-holdings/env` Zod schema partially documents |
| — | MFA enforcement not documented on sensitive ops | P2 | Open |

---

*For tenant isolation detail: `audit/db/tenant-isolation-audit.md`*
