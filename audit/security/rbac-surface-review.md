# RBAC Surface Review

**Date:** 2026-04-26  
**Scope:** Every admin, internal, and high-privilege route in `artifacts/api-server/src/routes/`, mapped to its guard middleware. Mismatches and gaps are flagged.  
**Basis:** Static review of `routes/admin/index.ts`, `middlewares/global-auth-enforcer.ts`, `middlewares/auth.ts`, `routes/*.ts`, and `threat_model.md` gap register.

---

## 1. Guard Middleware Reference

| Middleware | Function |
|-----------|---------|
| `authMiddleware()` | Verifies active session or Bearer token. Sets `req.user`. Returns 401 if not authenticated. |
| `requireRole(role)` | Asserts `req.user.platformRole` meets or exceeds the required role in the 11-role hierarchy. Returns 403 if insufficient. |
| `checkInternalToken()` | Verifies `x-internal-token` header matches `ALLOY_INTERNAL_TOKEN` using timing-safe comparison. |
| `globalAuthEnforcer` | Deny-by-default middleware applied to all `/api/*` routes. Passes through only public allowlist entries. |
| `tenantScope()` | Validates that `req.user.orgId` matches the requested tenant context. |
| `scimBearerAuth` | SCIM 2.0 bearer token verification for SCIM endpoints. |

---

## 2. Admin Routes — `/api/admin/*`

**Guard:** `authMiddleware()` + `requireRole('admin')` applied at the `adminRouter` level in `routes/admin/index.ts`.  
**Assessment:** ✅ PASS — all admin sub-routes inherit the router-level guard. No sub-route can be reached without admin role.

| Sub-route file | Registered | Guard Level |
|----------------|-----------|------------|
| `admin/apps-registry.ts` | `registerAppsRegistry(adminRouter)` | Router-level: admin |
| `admin/email.ts` | `registerEmail(adminRouter)` | Router-level: admin |
| `admin/flags.ts` | `registerFlags(adminRouter)` | Router-level: admin |
| `admin/funnel.ts` | `registerFunnel(adminRouter)` | Router-level: admin |
| `admin/growth.ts` | `registerGrowth(adminRouter)` | Router-level: admin |
| `admin/integrations.ts` | `registerIntegrations(adminRouter)` | Router-level: admin |
| `admin/observability.ts` | `registerObservability(adminRouter)` | Router-level: admin |
| `admin/onboarding.ts` | `registerOnboarding(adminRouter)` | Router-level: admin |
| `admin/pipeline-deals.ts` | `registerPipelineDeals(adminRouter)` | Router-level: admin |
| `admin/privacy.ts` | `registerPrivacy(adminRouter)` | Router-level: admin |
| `admin/seed.ts` | `registerSeed(adminRouter)` | Router-level: admin |
| `admin/support.ts` | `registerSupport(adminRouter)` | Router-level: admin |
| `admin/system.ts` | `registerSystem(adminRouter)` | Router-level: admin |
| `admin/usage.ts` | `registerUsage(adminRouter)` | Router-level: admin |
| `admin/users.ts` | `registerUsers(adminRouter)` | Router-level: admin |

---

## 3. Internal Service Endpoints — `checkInternalToken`

These routes are intended for service-to-service calls only and are protected by `ALLOY_INTERNAL_TOKEN`.

| Route | Guard | Assessment |
|-------|-------|-----------|
| `/api/enterprise-mcp/audit` | Listed in `PUBLIC_EXACT_PATHS` + `checkInternalToken` inside handler | ⚠️ Listed as public in enforcer; relies on handler-level token check. Prefer removing from public allowlist or adding enforcer-level check. |
| `/api/enterprise-mcp/link-user` | Same pattern | ⚠️ Same as above |
| `/api/enterprise-mcp/internal-revoke` | Same pattern | ⚠️ Same as above |
| `/api/enterprise-mcp/revoked-subjects` | Same pattern | ⚠️ Same as above |
| `/api/enterprise-mcp/idp-configs` | Same pattern | ⚠️ Same as above |
| Alloy internal endpoints | `checkInternalToken` header verification | ✅ Documented in `auth.ts` |

**Finding:** Enterprise MCP internal endpoints are listed in `PUBLIC_EXACT_PATHS` with the note that handler-level `checkInternalToken` enforces auth. This is a layered defence that works in practice but creates a discoverability gap — the enforcer's public allowlist implies these endpoints require no auth, while the actual auth is invisible at that layer. **Recommendation:** Remove these from `PUBLIC_EXACT_PATHS` and apply a dedicated middleware group (e.g., `internalTokenRequired`) at the router level so the auth is visible at the mounting point.

---

## 4. SCIM 2.0 — `/api/scim/*`

| Route prefix | Guard | Assessment |
|-------------|-------|-----------|
| `/api/scim/` | Listed in `PUBLIC_PREFIXES` + `scimBearerAuth` inside SCIM router | ✅ PASS — same layered pattern as SCIM RFC 7643/7644 requires. Bearer token auth is enforced in the SCIM router before any SCIM handler executes. |

---

## 5. Backup Export — `/api/backup/*`

| Route | Guard | Assessment |
|-------|-------|-----------|
| Backup export endpoint | `authMiddleware()` + admin role + org ownership check | ✅ PASS — AF-004 resolved (verified 2026-04-25). Handler checks that the requesting admin has authority over the requested `orgId`. |

---

## 6. Debug Endpoints — `/api/debug/*`

| Route | Guard | Assessment |
|-------|-------|-----------|
| `/api/debug/sentry-test` | `authMiddleware()` + `requireRole('admin')` + runtime 403 if `NODE_ENV === 'production'` | ✅ PASS — admin role required; prod-blocked |
| `/api/debug/integrations` | `authMiddleware()` + `requireRole('admin')` + runtime 403 if `NODE_ENV === 'production'` | ✅ PASS — admin role required; prod-blocked |

---

## 7. High-Risk Routes — Open Gaps

The following routes have identified RBAC mismatches or insufficient guards. These are tracked in `threat_model.md`.

### 7a. GraphQL HTTP Endpoint — `/api/graphql`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` (basic session auth) |
| Role directive enforcement | ❌ SDL annotations only — not runtime-enforced (AF-015) |
| Assessment | **FAIL** — GraphQL schema declares role directives but resolvers do not enforce them at runtime. Any authenticated user can call any resolver. |
| Gap ID | AF-015 (P1 Open) |

### 7b. GraphQL WebSocket Subscriptions — `/api/graphql/ws`

| Property | Value |
|----------|-------|
| Guard | None — operates outside Express middleware chain |
| Assessment | **FAIL** — Anonymous clients can connect and subscribe. Session validation and tenant scoping are not applied before the WebSocket upgrade completes. |
| Gap ID | AF-016 (P1 Open) |

### 7c. NEXUS Control Plane — `/api/nexus/*`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` (basic session) |
| Tenant/owner scoping | ❌ Not enforced — memory, skills, tools, orchestrations are platform-global |
| Assessment | **FAIL** — Shared control-plane stores readable and writable by any authenticated user. Cross-tenant data leakage risk. |
| Gap IDs | AF-020 (P1), AF-021 (P1) |

### 7d. MCP Gateway — `/api/mcp-gateway/*` and `/mcp/*`

| Property | Value |
|----------|-------|
| `/api/mcp-gateway/*` guard | `authMiddleware()` only — no operator-level role check |
| `/mcp/*` guard | Sidecar proxy — mounted before API auth chain |
| Assessment | **FAIL** — MCP governance routes reachable to any authenticated user. Sidecar GET bypass exposes SSE and discovery endpoints without auth. |
| Gap IDs | AF-022 (P1), AF-023 (P2), AF-026 (P1) |

### 7e. Alloy Chat — `/api/alloy-chat/*`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` (basic session) |
| Tenant scoping | ❌ `conversations` table lacks `org_id` — data is tenantless |
| Assessment | **FAIL** — Authenticated users can read/write conversation data across tenant boundaries. |
| Gap ID | AF-008 (P1 Open) |

### 7f. Fund Inbound Deals — `/api/fund/inbound-deals/*`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` (basic session) |
| Scoping | ❌ Internal pipeline records readable/writable by any authenticated user |
| Assessment | **FAIL** — No operator/admin role check on deal records and attachments. |
| Gap ID | AF-017 (P1 Open) |

### 7g. Billing Routes — `/api/billing/*`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` (basic session) |
| Stripe object ownership | ❌ Accepts arbitrary `customerId`, `sessionId`, email without binding to caller's org |
| Assessment | **FAIL** — Stripe objects not validated against org ownership before disclosure or mutation. |
| Gap ID | AF-018 (P1 Open) |

### 7h. Alloy Governance — `/api/alloy-governance/*`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` + `requireRole('operator')` (from route review) |
| Assessment | ✅ PASS — Policy mutation gates require at least operator role. |

### 7i. Webhook / Streaming Ingestion — `/api/webhooks/*`, `/api/stream/webhook/*`

| Property | Value |
|----------|-------|
| Guard | Listed in `PUBLIC_PREFIXES` — no auth gate from enforcer |
| Handler-level HMAC verification | ⚠️ Not universally applied in all handlers |
| Assessment | **FAIL** — Public ingestion routes accept forged or unauthenticated events if individual handlers do not verify provider signatures. |
| Gap ID | AF-025 (P1 Open) |

### 7j. Environment Registry — `/api/env-registry/*`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` (basic session) |
| Role check | ❌ No operator/admin role check |
| Assessment | **WARN** — Operational environment registry exposed to any authenticated user. Reveals internal architecture posture. |
| Gap ID | AF-027 (P2 Open) |

### 7k. Control Tower — `/api/control-tower/*`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` + `requireRole` checks inside sub-routes |
| Assessment | ✅ PASS (from static review of `routes/control-tower/` — `requireRole('operator')` on mutating paths) |

### 7l. Tenant Provisioning — `/api/tenants/*`, `/api/scim/*`

| Property | Value |
|----------|-------|
| Guard | `authMiddleware()` + `requireRole('platform_admin')` for tenant operations |
| Assessment | ✅ PASS |

---

## 8. Public Surface Map

Routes intentionally public (no session required). Source: `global-auth-enforcer.ts` `PUBLIC_EXACT_PATHS` and `PUBLIC_PREFIXES`.

| Route | Rationale | Mutation Risk |
|-------|-----------|--------------|
| `/api/health*` | Health probes | None — read-only |
| `/api/auth/*`, `/api/oidc/*` | OIDC flow | Auth mutation — by design |
| `/api/csrf-token` | CSRF token fetch | None |
| `/api/contact`, `/api/demo-requests` | Marketing forms | Writes contact records — low risk |
| `/api/public/*` | Public data | Read-only |
| `/api/webhooks/*` | Inbound events | Mutation — **AF-025: no universal HMAC guard** |
| `/api/scim/*` | SCIM provisioning | Mutation — guarded by `scimBearerAuth` |
| `/api/stream/webhook/*`, `/api/stream/ais-nmea` | Streaming ingestion | Mutation — source token auth inside handlers |
| `/api/v1/*` | DOS Public API | Mixed — operators use API keys |
| `/api/federation/*` | A2A discovery + delegate | Mutation on delegate — bearer token inside handler |
| `/api/booking/*` (select) | Carlota Jo booking | Read-only time entries and services |
| `/api/terra/*` (select) | Terra demo surfaces | Read-only portfolio/property data |
| `/api/lyte/*` (select) | Lyte decision intelligence | Read-only intelligence feeds |
| `/api/action-store`, `/api/action-store/stream` | Business state sync | GET public; PATCH requires auth inside handler |
| `/api/demo/reset` | Demo launchpad reset | **Mutation — persistent DB state (AF-024)** |
| `/api/a11oy/*` | A11oy fabric Phase 1 | Mutating endpoints return 501 |
| `/api/agent-mesh/*` | Agent telemetry | Read — telemetry export |
| `/api/alloy/policy-compiler/state` | Policy studio state | Read-only |
| `/mcp/*` | Substrate MCP sidecar proxy | Sidecar auth — **GET bypass (AF-023)** |
| `/api/enterprise-mcp/*` (select) | Internal service calls | Mutation — `checkInternalToken` inside handler |

---

## 9. Routes Removed from Public Navigation

No routes were identified as requiring removal from public navigation as a result of this audit — the global-auth-enforcer correctly gates all non-listed routes. UI navigation guard enforcement is outside the scope of this review (frontend routing is not a security control).

---

## 10. Remediation Priority

| Priority | Finding | Recommended Fix |
|---------|---------|----------------|
| P1 | AF-015: GraphQL directives not runtime-enforced | Add `@requireRole` directive resolver wrapper or `graphql-shield` rules |
| P1 | AF-016: GraphQL WS accepts anonymous clients | Add session validation in WS connection handler |
| P1 | AF-017: Inbound deals unscoped | Add `requireRole('operator')` + deal ownership check |
| P1 | AF-018: Billing Stripe ownership | Bind Stripe customer/session to `req.user.orgId` before use |
| P1 | AF-020/AF-021: NEXUS unscoped | Add creator/tenant ownership columns + enforce on read/write |
| P1 | AF-022: MCP gateway any-auth | Add `requireRole('operator')` to MCP governance routes |
| P1 | AF-025: Webhook forgery | Enforce HMAC signature verification in all public webhook handlers |
| P2 | AF-013: Internal token duplicated | Unify to single `checkInternalToken()` middleware |
| P2 | AF-023: MCP sidecar GET bypass | Add auth layer in sidecar for SSE/discovery endpoints |
| P2 | AF-024: `/api/demo/reset` persistent mutation | Add production guard or move behind admin auth |
| P2 | AF-027: Env registry any-auth | Add `requireRole('operator')` to env-registry routes |
| Rec | Debug endpoints | Add `requireRole('admin')` to `/api/debug/*` |
| Rec | Enterprise MCP internal routes | Move from `PUBLIC_EXACT_PATHS` to a dedicated internal token middleware group |

---

*Reviewed: 2026-04-26. Next review: before any new route family is added or public allowlist is expanded.*
