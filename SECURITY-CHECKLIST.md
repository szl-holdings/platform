# Security Checklist — SZL Platform

Canonical checklist of security controls in place across the platform.
Validated by `scripts/docs/check-docs-claims.js` (checks 6, 7).

> **Drift note (2026-05-28, fix/doc-drift):** The previous version of this
> document cited `artifacts/api-server/src/middlewares/{auth,csrf,admin-guard}.ts`,
> `artifacts/api-server/src/lib/startup-validation.ts`, and
> `artifacts/api-server/src/routes/{admin/index,alloy-governance,ai-engine,mcp}.ts`.
> Of those, only `global-auth-enforcer.ts` exists under `artifacts/api-server/`.
> The real `auth.ts` and `csrf.ts` implementations are in the locations listed
> below. Controls whose implementations could not be located are now marked
> **STATUS: NOT YET IMPLEMENTED** rather than citing fabricated files.

---

## A — Authentication & Session Controls

### A1 — Session-based authentication

| Control | Evidence | Status |
|---------|----------|--------|
| Cookie-based OIDC and credential-based login flows | `apps/alloy-runtime-api/src/middleware/auth.ts`, `apps/alloy-embedding-api/src/middleware/auth.ts` | implemented |
| Session token storage with expiry, revocation, and version tracking | `lib/db/src/schema/auth.ts` — `sessions` table | implemented |
| Bearer token auth for mobile and API clients | `apps/alloy-runtime-api/src/middleware/auth.ts` | implemented |
| Internal service-to-service auth via scoped tokens | `apps/alloy-runtime-api/src/middleware/auth.ts` | implemented |

### A2 — CSRF protection

| Control | Evidence | Status |
|---------|----------|--------|
| Double-submit cookie pattern on all state-changing requests | `packages/auth-shared/src/server/csrf.ts` (server), `packages/auth-shared/src/client/csrf.ts` (client) | implemented |
| Timing-safe token comparison | `packages/auth-shared/src/server/csrf.ts` | implemented |
| Exempt paths for server-to-server and public endpoints | `packages/auth-shared/src/server/csrf.ts` | implemented |
| GraphQL custom-header requirement | — | **NOT YET IMPLEMENTED** (was cited but no implementation exists on disk) |

### A3 — Startup validation

| Control | Evidence | Status |
|---------|----------|--------|
| Environment variable validation at boot time | — | **NOT YET IMPLEMENTED** (cited `artifacts/api-server/src/lib/startup-validation.ts` does not exist) |
| Sensitive secret masking in logs | — | **NOT YET IMPLEMENTED** |
| Production-mode enforcement of required secrets | — | **NOT YET IMPLEMENTED** |

---

## B — Authorization & Access Control

### B1 — Role-based access control

| Control | Evidence | Status |
|---------|----------|--------|
| `requireRole()` middleware with hierarchy expansion | `apps/alloy-runtime-api/src/middleware/auth.ts` | implemented |
| Platform role enum on `users` table | `lib/db/src/schema/auth.ts` — `platform_role` column | implemented |
| Legacy-to-canonical role mapping | `lib/db/src/schema/auth.ts` — `LEGACY_TO_CANONICAL` | implemented |
| Read-only role enforcement | `apps/alloy-runtime-api/src/middleware/auth.ts` | implemented |

### B2 — Admin guard

| Control | Evidence | Status |
|---------|----------|--------|
| Admin route protection requiring elevated roles | — | **NOT YET IMPLEMENTED** (no `admin-guard.ts` exists on disk) |
| Internal service token scope check (`internal:write`) | — | **NOT YET IMPLEMENTED** |
| Admin route entry point | — | **NOT YET IMPLEMENTED** (no `routes/admin/index.ts` exists on disk) |

---

## C — Domain Security

### C1 — Governance and compliance

| Control | Evidence | Status |
|---------|----------|--------|
| Alloy governance approval gates | — | **NOT YET IMPLEMENTED** (no `routes/alloy-governance.ts` exists; governance logic lives in `packages/a11oy-*` but is not wired as an HTTP route) |
| AI engine safety controls | `lib/ai-engine/` (package present) — HTTP route surface absent | **PARTIAL** (engine exists; no `routes/ai-engine.ts`) |

### C2 — Integration security

| Control | Evidence | Status |
|---------|----------|--------|
| MCP (Model Context Protocol) access controls | — | **NOT YET IMPLEMENTED** (no `routes/mcp.ts` exists) |

---

## T — Tenant Isolation

### T6 — Knowledge base isolation

| Control | Evidence | Status |
|---------|----------|--------|
| RAG knowledge chunks scoped per tenant | `lib/db/src/schema/rag_knowledge.ts` — `rag_knowledge_chunks` table | implemented |
| User identity tied to all data queries | `lib/db/src/schema/auth.ts` — `users` table | implemented |

---

## Global enforcement

| Control | Evidence | Status |
|---------|----------|--------|
| Global auth enforcer middleware (allow-list of public paths) | `artifacts/api-server/src/middlewares/global-auth-enforcer.ts` | implemented |
| Application router | `artifacts/api-server/src/routes/ouroboros.ts` | implemented |
