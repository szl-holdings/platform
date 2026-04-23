# API Server: Demo Script (Technical Audience)

**Duration:** 5–8 minutes  
**Audience:** CTO, engineering lead, technical due diligence reviewer  
**Pre-requisite:** Signed into platform

---

## Pre-Demo Checklist

- [ ] `GET /api/health` returns `{"status":"healthy"}`
- [ ] `GET /api/health/detailed` returns service-level breakdown (all green)
- [ ] Auth session active
- [ ] At least one tenant organization exists in the database

---

## What to Show

### 1 — Health & Observability

```
GET /api/health
GET /api/health/detailed
GET /api/status
```

> "Every service — database, auth, AI layer, integrations — is probed on every request to `/health/detailed`. Not a static badge — active probe."

### 2 — Auth Architecture

> "Auth is Replit OIDC — OpenID Connect with PKCE. Sessions are persisted in PostgreSQL with a sliding-window refresh policy. No in-memory session store — sessions survive server restarts."

Show session policy in `src/middlewares/session-policy.ts` if drilling into code.

### 3 — Tenant Isolation

> "Every request to a tenant-scoped route goes through `tenantScope()`. The middleware resolves the requesting user's org membership from the database on every request — not from the JWT. Cross-tenant access returns 403 and creates an audit event."

Point to vessels route group mounting: `tenantScope({ required: true })` on the entire `/vessels` prefix.

### 4 — Input Validation

> "84% of route files have Zod input validation — enforced by CI. Every write-path route in the four priority domains (vessels, terra, command, aegis) has typed Zod schemas. The CI script fails the build if coverage drops below 80%."

### 5 — Seed Protection

> "Demo seed routes return 404 in `NODE_ENV=production`. The `seedProductionGuard` middleware is the enforcement mechanism. Idempotent seeds use `onConflictDoNothing()` and skip rows with a real `tenant_id`."

### 6 — SSRF Protection

> "Webhook delivery URLs are validated against an SSRF blocklist before storage. Private IP ranges, loopback, link-local, and localhost are blocked at the Zod schema level. DNS rebinding protection is available via async validation."

---

## Key Architecture Points

| Dimension | Implementation |
|-----------|---------------|
| Routing | Express with lazy-loaded route groups |
| Database | PostgreSQL via Drizzle ORM (120+ tables) |
| Auth | Replit OIDC + PostgreSQL sessions |
| Validation | Zod at 84% route coverage |
| Tenant isolation | `tenantScope` middleware + per-row `orgId` filters |
| Feature flags | DB-backed flags with per-user/org/role overrides |
| AI gateway | Anthropic via Replit AI proxy (no raw API keys) |
| OTEL | Wired; external export via `live_otel_export_enabled` flag |
| Seed protection | `seedProductionGuard` — 404 in production |
| SSRF protection | `validateExternalUrlSync` on webhook URLs |

---

## Avoidance Guide

- Do NOT demonstrate admin seed reset routes in front of investors — these are internal ops
- Do NOT call ALLOY_INTERNAL_TOKEN-gated routes without noting the scoping gap (GAP-016)
- OTEL export is off by default — if asked about telemetry, show the local trace logging

---

## Questions to Anticipate

**"What's the test coverage?"**  
> "Unit test coverage is approximately 16% by route count — the CI enforces 80% Zod validation coverage as a proxy for input security. E2E coverage is documented in `docs/audit/SMOKE_TEST_MATRIX.md`. Expanding unit coverage is a Q3 goal."

**"How do you handle multi-tenancy at scale?"**  
> "Every table with org-scoped data has an `org_id` column. The `tenantScope` middleware resolves the calling user's org on every request and applies it as a WHERE clause. Isolation is enforced at the query layer, not just the route layer."
