# Security Checklist — SZL Platform

Canonical checklist of security controls in place across the platform.
Validated by `scripts/docs/check-docs-claims.js` (checks 6, 7).

---

## A — Authentication & Session Controls

### A1 — Session-based authentication

| Control | Evidence |
|---------|----------|
| Cookie-based OIDC and credential-based login flows | `artifacts/api-server/src/middlewares/auth.ts` |
| Session token storage with expiry, revocation, and version tracking | `lib/db/src/schema/auth.ts` — `sessions` table |
| Bearer token auth for mobile and API clients | `artifacts/api-server/src/middlewares/auth.ts` — `resolveApiKeyBearer()`, `resolveOAuthJwtBearer()` |
| Internal service-to-service auth via scoped tokens | `artifacts/api-server/src/middlewares/auth.ts` — `checkInternalToken()` |

### A2 — CSRF protection

| Control | Evidence |
|---------|----------|
| Double-submit cookie pattern on all state-changing requests | `artifacts/api-server/src/middlewares/csrf.ts` |
| Timing-safe token comparison | `artifacts/api-server/src/middlewares/csrf.ts` — `timingSafeEqual()` |
| Exempt paths for server-to-server and public endpoints | `artifacts/api-server/src/middlewares/csrf.ts` — `EXEMPT_PATHS`, `isExempt()` |
| GraphQL custom-header requirement | `artifacts/api-server/src/middlewares/csrf.ts` — `isGraphQLPath()` |

### A3 — Startup validation

| Control | Evidence |
|---------|----------|
| Environment variable validation at boot time | `artifacts/api-server/src/lib/startup-validation.ts` |
| Sensitive secret masking in logs | `artifacts/api-server/src/lib/startup-validation.ts` — `ENV_SPECS[].sensitive` |
| Production-mode enforcement of required secrets | `artifacts/api-server/src/lib/startup-validation.ts` |

---

## B — Authorization & Access Control

### B1 — Role-based access control

| Control | Evidence |
|---------|----------|
| `requireRole()` middleware with hierarchy expansion | `artifacts/api-server/src/middlewares/auth.ts` |
| Platform role enum on `users` table | `lib/db/src/schema/auth.ts` — `platform_role` column |
| Legacy-to-canonical role mapping | `lib/db/src/schema/auth.ts` — `LEGACY_TO_CANONICAL` |
| Read-only role enforcement | `artifacts/api-server/src/middlewares/auth.ts` — `denyIfReadOnly()` |

### B2 — Admin guard

| Control | Evidence |
|---------|----------|
| Admin route protection requiring elevated roles | `artifacts/api-server/src/middlewares/admin-guard.ts` |
| Internal service token scope check (`internal:write`) | `artifacts/api-server/src/middlewares/admin-guard.ts` — `hasInternalServiceToken()` |
| Admin route entry point | `artifacts/api-server/src/routes/admin/index.ts` |

---

## C — Domain Security

### C1 — Governance and compliance

| Control | Evidence |
|---------|----------|
| Alloy governance approval gates | `artifacts/api-server/src/routes/alloy-governance.ts` |
| AI engine safety controls | `artifacts/api-server/src/routes/ai-engine.ts` |

### C2 — Integration security

| Control | Evidence |
|---------|----------|
| MCP (Model Context Protocol) access controls | `artifacts/api-server/src/routes/mcp.ts` |

---

## T — Tenant Isolation

### T6 — Knowledge base isolation

| Control | Evidence |
|---------|----------|
| RAG knowledge chunks scoped per tenant | `lib/db/src/schema/rag_knowledge.ts` — `rag_knowledge_chunks` table |
| User identity tied to all data queries | `lib/db/src/schema/auth.ts` — `users` table |
