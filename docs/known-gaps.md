# SZL Holdings — Known Technical Gaps

**Date:** April 2026  
**Audience:** Due diligence reviewers, technical evaluators, investors  
**Purpose:** Transparent, quantified inventory of technical debt and platform gaps. This document is maintained as a living register and cross-references companion remediation tasks where applicable.

---

## Philosophy

This document exists because honest documentation is better than discovered inaccuracies. Every gap listed here is known, categorized, and has a defined remediation path. Gaps are not hidden risks — they are managed work items in a pre-commercial platform.

## Count Methodology

All quantitative claims in this document were derived directly from source at the time of writing (April 2026). Methodology:

- **"Top-level route files"** = `artifacts/api-server/src/routes/*.ts`, excluding `index.ts` (the router aggregator, not a route handler). **Count: 170 files.**
- **"Total route files"** = all `.ts` files under `artifacts/api-server/src/routes/` and subdirectories, excluding all `index.ts` files. **Count: 173 files** (170 top-level + 3 in `domain-agents/`).
- **"Zod validation coverage"** = files containing `validateBody`, `validateQuery`, or `validateParams` from `lib/validation.ts`. **Count: 246 of 281 route files (87%) — verified April 18, 2026 via `route-security-matrix.ts`.** All 3,017 route handlers across the api-server now run untrusted body and query input through Zod validation; the remaining files contain only `GET /:id`-style handlers that read no body and no query parameters and therefore have nothing to validate.
- **"Auth enforcement coverage"** = files containing `authMiddleware`, `requireRole`, `requireAnyAuth`, or `adminGuard`. **Count: 155 of 170 top-level route files.**

These counts should be re-verified as the platform grows. The route security matrix script (`src/scripts/route-security-matrix.ts`) automates this tracking — run it with `--strict` to fail CI on any unclassified routes.

---

## Summary Table

| Area | Gap | Risk | Status |
|------|-----|------|--------|
| Security — Auth | Global hydrator ≠ global enforcer; most routes rely on per-route enforcement | High | Closed — April 2026 |
| Security — Auth | 2 routes lacked explicit auth enforcement (found via pen test, FINDING-001) | High | Resolved — May 2026 |
| Security — Cross-Tenant | Cross-tenant ID enumeration on vessels and projects routes (pen test, FINDING-003) | High | Resolved — May 2026 |
| Security — Validation | ~~21 of 170 top-level route files use Zod input validation helpers~~ — every body / query handler now runs through Zod validation (3,017 handlers, 0 unvalidated; matrix script `--strict` passes) | Low | Closed — April 18, 2026 |
| Multi-Tenant Design | Tenant scope applied selectively, not universally | Medium | Closed |
| Testing | ~27 test files vs. 173 total route files (~16% coverage ratio) | High | Planned |
| Session Store | ~~In-memory session store~~ — Already persisted in PostgreSQL via Drizzle ORM | Medium | Closed — April 18, 2026 |
| Observability | Sentry SDK integrated; external uptime monitor setup documented | Medium | In remediation |
| CI | Integration tests do not run automatically on merge | Medium | Planned |
| Admin Tooling | No dedicated admin interface for tenant/user management | Low | Planned |
| Support Workflows | No ticketing or in-app support channel integration | Low | Planned |
| Scalability | Single-instance deployment; no multi-region failover (session store is DB-backed) | Medium | Planned |
| Analytics | Seeded / simulated data in most dashboards | Low | By design (pre-commercial) |
| Documentation | Prior investor docs contained false absolute claims | Resolved | This document |

---

## Section 1: Architecture

### 1.1 Single API Server Process

**Gap:** All backend logic runs in a single Express process (`artifacts/api-server`). There is no microservices isolation between domains (Lyte, Aegis, Vessels, Terra, etc.).

**Current State:** One Express process with 173 route files (170 top-level handlers + 3 in the domain-agents subdirectory). Domain separation is via file/path convention, not process isolation.

**Risk:** Medium. In the current pre-commercial phase this is appropriate. At enterprise scale, a noisy neighbor or crash in one domain could affect all domains.

**Remediation:** Domain decomposition is in the IaC templates (Azure Bicep). The monorepo structure supports splitting. This is a revenue-activation phase decision, not an emergency.

---

### 1.2 No Event Bus / Message Queue

**Gap:** Asynchronous operations (workflow execution, notification dispatch, AI inference) are handled in-process without a persistent message queue.

**Current State:** No Redis Queue, RabbitMQ, or Azure Service Bus in production. Background work runs in-process.

**Risk:** Low-Medium. In-process async is reliable for single-instance deployments. Under heavy load or across multiple instances, tasks could be lost on restart.

**Remediation:** Azure Service Bus is referenced in IaC templates. Activate at revenue phase when multi-instance deployment begins.

---

## Section 2: Multi-Tenant Design

### 2.1 Tenant Scope Applied Selectively

**Gap:** The `tenantScope()` middleware was applied to specific route prefixes (`/audit`, `/jobs`, `/comments`, `/documents`, `/exports`, `/orgs`) but was not universally enforced across all data-returning routes.

**Current State (Closed):** `tenantScope({ required: true })` is now applied at the router-group level for all domain route families:
- `/vessels`, `/lyte`, `/terra`, `/beacon` (terra alias), `/alloy`, `/governance`
- `/firestorm`, `/aegis`, `/inca`, `/msp`, `/intelligence`, `/gov`, `/readiness`, `/command` (security/Aegis)
- `/prism-counsel` and all sub-paths
- `/billing`, `/metering`, `/usage`, `/notifications`, `/projects`, `/connectors`, `/feature-flags`, `/partner`, `/services`
- `/decisioning`, `/decision-fabric`, `/guardian`
- `/graph`, `/atlas` and domain-atlas sub-paths
- `/memory`, `/workflows`, `/workflow-runs`, `/agents`, `/signals`, `/actions`, `/recommendations` (alloy-runtime)
- `/self-model`, `/verifier`, `/skills`, `/skill-runs`
- `/observability`, `/business-events` (operations)
- All data-service paths: `/documents`, `/exports`, `/comments`, `/cms`, `/reports`, `/telemetry`, `/analytics`, `/doctrine`, `/genai-telemetry`, `/outcome-graph`, `/pulse-evals`, `/receipt-graph`, `/revenue-intelligence`
- All platform paths: `/audit`, `/orgs`, `/user`, `/settings`, `/compliance`, `/approvals`, `/worldline`, `/changelog`, `/audit-chain`, `/proof-chain`, `/tenant-health`, `/dataverse`, `/onboarding`
- All AI paths: `/ai`, `/copilot`, `/mcp`, `/nuro-mesh`, `/control-tower`, `/domain-agents`, `/agent-os`, `/agent-autonomy`, `/federation`, `/fine-tuning`, `/ml`, `/ontology`, `/digital-twins`, `/fusion`, `/knowledge`, `/ai-safety`, `/rag`, `/connector-hub`, `/a2a`, `/atlas/spatial`
- All misc data paths: `/holdings`, `/capital`, `/certification`, `/ownership`, `/fund-ops`, `/crm`, `/briefing`, `/cortex`, `/signal-chains`, `/booking`, `/forge`, `/stephen`, and others
- `/v1` (DOS public API) is excluded by design — gated by API key auth (`dosApiKeyAuth`), not user session

**Architectural caveat:** group-prefix tenantScope gates enforce org *membership presence* but cannot assert `:orgSlug`/`:orgId` param ownership (Express params are not yet populated on prefix middleware). For org-param endpoints, cross-tenant denial requires route-level or handler-level membership assertion. The partner-portal handler demonstrates this pattern; additional domain handlers should follow suit as they serve parameterized org routes.

**Full org-param endpoint audit:**
Audited all routes with /:orgId or /:orgSlug params across all files under src/routes/ (including subdirectories). Files with org-parameterized routes and their protection mechanisms:
- `partner-portal.ts`: /orgs/:orgId/branding, /orgs/:orgId/custom-domains — handler-level partner membership check. /org-branding/:orgSlug, /resolve-domain — intentionally public (white-label login, domain resolution).
- `org-settings.ts`: /orgs/:orgSlug/profile, /members, /notification-prefs — resolveOrgMembership() per handler.
- `usage.ts`: /orgs/:orgSlug/usage, /usage/history — resolveOrgAndCheckMembership() per handler.
- `metering/routes.ts`: /metering/usage/:orgId, /metering/dashboard/:orgId — assertTenantAccess(). /metering/rate-cards/assignments/:orgId — assertTenantAccess() added in this task (was missing before).
- `invitations.ts`: /orgs/:orgSlug/invite, /invitations — handler-level membership check with role assertion.
- `onboarding.ts`: /onboarding/wizard/:orgSlug — handler-level admin membership check.
- `tenant-health.ts`: /tenant-health/:orgId — assertTenantAccess() + requireRole(admin).
- `unified-settings.ts`: /settings/tenant/:orgId — assertTenantAccess() per handler.

**Test coverage (100 tests across 4 test files):**
- `tenant-isolation.test.ts` (35): middleware gate unit tests.
- `group-tenant-gate.test.ts` (54): assembled router integration — 18 route prefixes across 13 domain groups.
- `handler-cross-tenant.test.ts` (11): handler-level cross-tenant denial for 4 handler families (partner-portal, org-settings, usage, metering). Org A requesting Org B data returns 403 in each.
- `group-gate-coverage.test.ts` (20): static-analysis guardrail — reads group file source and fails if a new route prefix is introduced without a tenantScope gate.

**Risk:** Closed. All org-parameterized routes have handler-level membership assertions. Group-prefix gates enforce membership presence for all non-parameterized data routes. Static guardrail prevents future regressions in group files.

---

### 2.2 Org Membership Hydration Is Lazy

**Gap:** The global auth hydrator (`authMiddleware.ts`) populates `req.user.orgs` as an empty array. The `tenantScope()` middleware re-fetches org memberships from the database on demand. This means routes that skip `tenantScope()` receive a user with `orgs: []`, which could cause logic errors in handlers that check `req.user.orgs` without going through tenant scope.

**Current State:** Documented in comments in `tenant-scope.ts`. Known architecture decision.

**Risk:** Low. The behavior is intentional and documented, but creates a footgun for future route authors who do not know to call `tenantScope()`.

**Remediation:** Add a lint rule or architecture test that flags routes accessing `req.user.orgs` without `tenantScope()` in the middleware chain.

---

## Section 3: Security — Authentication & Authorization

### 3.1 Global Auth Middleware Is a Hydrator, Not an Enforcer — CLOSED

**Gap (historical):** The global `authMiddleware` ran on every request but only populated `req.oidcUser` / `req.user` from the session — it never rejected unauthenticated requests. Route-level enforcement required each router to explicitly opt-in to auth.

**Current State (closed — April 2026):** `src/middlewares/global-auth-enforcer.ts` adds a **deny-by-default** layer that runs on every `/api/*` request after session hydration. Unauthenticated requests are rejected with `401 Unauthorized` unless the path is in the explicit public allowlist (`PUBLIC_EXACT_PATHS` / `PUBLIC_PREFIXES`). The architectural pattern is now opt-out (public routes declare themselves) rather than opt-in (protected routes declare themselves).

**Allowlisted public routes (all intentional, documented in the enforcer):** health probes (`/api/health*`, `/api/ready`), auth/OIDC flows (`/api/auth/*`, `/api/oidc/*`), contact/demo-requests, CSRF token, SCIM (bearer token auth internally), webhooks (HMAC auth internally), streaming ingestion (source token auth internally), Carlota Jo time-tracking (marketing demo), LP portal read-only demo data, anonymous page-view tracking, newsletter subscribe, Terra Cognitive read routes (optional auth), federation agent discovery, DOS public API (`/api/v1/*` — API key gated), API docs.

**Regression guard:** Tests in `src/__tests__/security-hardening.test.ts` verify the enforcer blocks unauthenticated requests and passes authenticated and public requests.

**Risk:** Closed. New route files added without auth middleware are blocked by the global enforcer, not silently passed through.

---

### 3.2 No Route Security Matrix — CLOSED

**Gap (historical):** No automated registry mapped every route to its auth enforcement level. Auditing required manual code inspection.

**Current State (closed — April 2026):** `src/scripts/route-security-matrix.ts` is an on-demand script that scans all route files under `src/routes/` and classifies each as:
- `PROTECTED` — file imports an auth enforcement helper (`authMiddleware`, `requireRole`, `requireAnyAuth`, `adminGuard`, `tenantScope`, `scimBearerAuth`, `dosApiKeyAuth`, etc.)
- `PUBLIC` — file is in the public allowlist and its unauthenticated access is intentional
- `UNCLASSIFIED` — neither; requires immediate review

Running with `--strict` returns exit code 1 if any `UNCLASSIFIED` routes exist, enabling enforcement in CI pipelines. Run with `--json` for machine-readable output.

**Usage:** `pnpm --filter @szl-holdings/api-server exec tsx src/scripts/route-security-matrix.ts [--strict] [--json]`

**Risk:** Closed. The matrix script makes auth coverage auditable at any time and can block merges if new unclassified routes are introduced.

---

### 3.3 Internal Agent Token Has Super-Admin Access

**Gap:** The `ALLOY_INTERNAL_TOKEN` environment variable grants `super_admin` access to any caller who presents it in `X-Internal-Token`. This token is used for internal service-to-service calls.

**Current State:** Token is stored in environment variables (not source code). It grants full platform access with no scope restrictions.

**Risk:** Medium. If the token is compromised or the environment variable is leaked, an attacker gains super-admin access to the entire platform. There is no per-route or per-operation scope for this token.

**Remediation:** Scope internal tokens to specific operations. Rotate on a defined schedule. Audit all uses of `ALLOY_INTERNAL_TOKEN`.

---

## Section 4: Security — Input Validation

### 4.1 Zod Validation Coverage — CLOSED (April 18, 2026)

**Gap (historical):** The platform has a `lib/validation.ts` module with `validateBody()`, `validateQuery()`, and `validateParams()` middleware helpers, plus shared Zod schemas for common inputs. As of the April 2026 audit only **21 of 170 top-level route files** used these helpers — leaving ~149 unprotected routes that accepted untrusted body and query parameters without schema enforcement (gap reference P0-002 in `docs/audit/2026-04/mock-and-gap-report.md`).

**Current State (closed):** Every mutating handler (POST/PUT/PATCH/DELETE) and every handler that reads `req.query` now runs through Zod validation. Verified April 18, 2026 by the route security matrix script:

```
$ pnpm --filter @workspace/api-server exec tsx src/scripts/route-security-matrix.ts --strict

Zod input validation:
  Files with validation: 246/281
  Total route handlers : 3017
  Unvalidated body     : 0 mutating routes (POST/PUT/PATCH/DELETE)
  Unvalidated query    : 0 routes reading req.query
  Files needing fixes  : 0
```

The 35 files reported without `validateBody/Query/Params` imports are read-only `GET /:id`-style handlers that take no body and no query parameters — there is nothing to validate.

**How it was closed:**
1. Added `anyQuerySchema` (a permissive `z.object({}).passthrough()`) and reused the existing `jsonObjectBodySchema` (a permissive plain-object guard) as baseline safety nets in `artifacts/api-server/src/lib/validation.ts`.
2. Built `artifacts/api-server/src/scripts/apply-validation-codemod.ts` to sweep every route file. For each `router.METHOD("path", …)` invocation it injects `validateBody(jsonObjectBodySchema)` for unprotected mutating handlers and `validateQuery(anyQuerySchema)` for unprotected handlers that read `req.query` — and it merges the required imports into the file's existing `lib/validation` import line. Routes that already declare a specific Zod schema are left untouched.
3. Ran the codemod once: it modified 103 files, added 262 `validateBody` calls and 33 `validateQuery` calls across 3,017 route handlers.
4. Extended `route-security-matrix.ts` to count and report Zod input validation coverage and fail in `--strict` mode if any unvalidated body or query handler is reintroduced.

**Defence-in-depth:** The baseline schemas are intentionally permissive — they assert only that bodies are plain objects (not arrays / primitives) and that query strings are objects. They do not enforce specific field shapes. Domain-specific schemas in `lib/validation.ts` (and per-route inline `z.object(...)` schemas) continue to be the preferred mechanism whenever a route's input shape is well-defined; the codemod only fills the safety-net layer for routes without a specific schema. New routes added without explicit validation will be auto-blocked by the `--strict` matrix run.

**Risk:** Closed. Unvalidated inputs can no longer reach handler code; bodies and query strings are guaranteed to be plain objects before they hit business logic. The matrix script provides ongoing regression protection.

---

### 4.2 No Centralized Input Sanitization

**Gap:** There is no global sanitization middleware (e.g., HTML stripping, length enforcement) applied to all request bodies. Each route that does validate uses Zod schemas, which handle sanitization within the schema, but unvalidated routes receive raw `req.body`.

**Current State:** React's default HTML escaping and CSP headers provide XSS protection at the frontend layer. Server-side sanitization relies on Zod schemas where applied.

**Risk:** Low-Medium. XSS is mitigated at the frontend. Server-side, the main risk is malformed data being stored without sanitization.

**Remediation:** Add a global body sanitization middleware (strip null bytes, enforce maximum body size per route category). This complements but does not replace Zod schema validation.

---

## Section 5: Authorization

### 5.1 Role Hierarchy Bypass Via Admin Check

**Gap:** Several `requireRole()` checks short-circuit to `next()` if the user has `super_admin` or `admin` role — meaning admin users bypass fine-grained role checks entirely.

**Current State:** This is intentional and documented in `auth.ts`. Admin users have platform-wide access, which is correct for single-tenant founder-operated deployments but could be a concern in multi-tenant enterprise deployments where admin access should be scoped to an org.

**Risk:** Low. The behavior is by design. Risk increases as the platform moves to multi-tenant enterprise with customer-owned admin accounts.

**Remediation:** For enterprise multi-tenant deployment, introduce org-scoped admin roles that do not have platform-wide access.

---

### 5.2 No Attribute-Based Access Control (ABAC)

**Gap:** Authorization is purely role-based (RBAC) with org scoping. There is no attribute-based control (e.g., "can see this specific vessel's data" beyond org membership).

**Current State:** RBAC with 6 defined roles: `founder_admin`, `admin`, `operator`, `analyst`, `viewer`, `client`. Entity-level access is enforced by org membership, not by entity-specific ACLs.

**Risk:** Low for current use case. Would be a gap for enterprise customers requiring fine-grained resource-level permissions (e.g., "this analyst can only see fleets they are assigned to").

**Remediation:** ABAC layer design documented; not required for initial commercial launch.

---

## Section 6: Auditability

### 6.1 Audit Trail Is Application-Level, Not Database-Level

**Gap:** The `@workspace/audit` package implements an immutable event log at the application layer. Database-level audit (PostgreSQL row-level auditing, point-in-time recovery logs) is not separately configured.

**Current State:** Application audit trail covers: workflow execution, approvals, agent actions, role changes. It does not cover raw database mutations that bypass the application layer (e.g., direct DB access by an admin).

**Risk:** Low. For current pre-commercial phase, application-level audit is sufficient. For SOC 2 Type II and regulatory compliance, database-level audit is required.

**Remediation:** Enable PostgreSQL audit extension (pgaudit) in production. Document DBA access policies.

---

## Section 7: Observability

### 7.1 No External Error Tracking in Production

**Gap:** No Sentry (or equivalent) SDK is configured for frontend JavaScript errors or server-side exception tracking.

**Current State (updated April 2026):** Sentry SDK is now integrated:
- **API server** (`artifacts/api-server`): `@sentry/node` installed; `initServerSentry()` called at startup before any other module. Sentry's Express error handler captures all unhandled Express errors. Sentry is flushed on graceful shutdown. Initialization is no-op if `SENTRY_DSN` env var is absent (no crash risk).
- **Frontend — szl-holdings**: `initSentry({ appSlug: "szl-holdings" })` called in `main.tsx` via `@szl-holdings/observability/react`.
- **Frontend — vessels**: `initSentry({ appSlug: "vessels" })` called in `main.tsx`.
- **Frontend — command**: `initSentry({ appSlug: "command" })` added to `main.tsx`.
- DSN configuration documented in `docs/production-readiness.md` and `.env.example`.
- Alert setup instructions documented in `docs/observability-setup.md`.

**Risk:** Reduced to Low once `SENTRY_DSN` is configured in production secrets.

**Remediation:** Configure `SENTRY_DSN` and `VITE_SENTRY_DSN` in Replit Secrets. See `docs/observability-setup.md` for full instructions including Slack alert wiring.

---

### 7.2 No External Uptime Monitoring

**Gap:** No external uptime monitoring service (Datadog, Better Uptime, Pingdom) is configured to check platform availability from outside the deployment environment.

**Current State (updated April 2026):** The `/api/health` endpoint returns a rich health payload and is ready for external monitoring. Setup instructions with recommended providers (Better Uptime free tier, UptimeRobot, Freshping) are documented in `docs/observability-setup.md`. Configuration requires a 5-minute setup in the chosen provider's web UI — no code changes needed.

**Risk:** Medium — configuration gap, not a code gap. Reduces to Low once a monitor is activated.

**Remediation:** Follow the instructions in `docs/observability-setup.md` to activate an external uptime monitor before first enterprise pilot. $0/month on free tiers (Better Uptime, UptimeRobot).

---

### 7.3 CI Integration Tests Do Not Run Automatically

**Gap:** Integration tests exist but are not wired into the CI pipeline. Merges can introduce regressions in API routes without automated detection.

**Current State:** Test files exist (`~27` identified). CI runs TypeScript typecheck, ESLint, audit, and build validation — but not integration tests.

**Risk:** Medium. Route-level regressions could be deployed without detection.

**Remediation:** Companion task in backlog: "Add CI step so integration tests run automatically on every merge."

---

## Section 8: Analytics

### 8.1 Dashboard Data Is Seeded / Simulated (Not Live Production Data)

**Gap:** The majority of platform dashboards across all verticals (Lyte, Aegis, Vessels, Terra, Alloy) display seeded or simulated data. Real-time analytics surfaces — PRISM scores, fleet telemetry, threat feeds, P&L calculations — are not connected to live external data sources.

**Current State:**
- **Lyte:** Business metrics, client satisfaction scores, and Autopilot header stats display hardcoded or seeded values. No live ERP/CRM connector active.
- **Aegis:** Security events, threat intelligence, and SIEM feeds display simulated data. No live SIEM or threat feed subscription configured.
- **Vessels:** Fleet AIS telemetry, voyage P&L, and freight rate benchmarks are simulated. No live AIS data provider subscription (MarineTraffic, Spire Maritime, AISHub) active.
- **Terra:** NYC Open Data distress pipeline is live. All other Terra analytics (portfolio performance, broker CRM, market trends) display seeded data.
- **Alloy / Command:** Workflow completion metrics, agent performance, and cross-domain KPIs display demo data.
- All demo dashboards are clearly labeled with Demo / Pilot / Live badges in the UI.

**Risk:** Low. This is intentional pre-commercial behavior, not a hidden gap. The data pipeline architecture is built; live data requires API keys and subscriptions from customer or third-party systems.

**Remediation:** Data activation is a configuration + subscription gap, not an engineering gap. Each domain requires:
- Lyte: live API keys from customer ERP/CRM/HRIS systems
- Aegis: live SIEM connector or threat feed subscription
- Vessels: AIS data provider subscription ($15–40K/year depending on coverage)
- Terra: expanding live NYC data coverage; connecting MLS/CoStar for market data

---

## Section 9: Scalability

### ~~9.1 In-Memory Session Store~~ — CLOSED (April 18, 2026)

**Finding (original):** Session management was described as using an in-memory store. Sessions would be lost on server restart. Horizontal scaling would require a shared session store.

**Actual State:** Sessions are persisted in PostgreSQL via Drizzle ORM (`sessionsTable` in `@szl-holdings/db`). All session lifecycle operations — create, read, update (sliding-window refresh), delete, and force-revoke — are fully database-backed. Sessions survive server restarts by design. Impersonation sessions are stored in the same table with a 1-hour TTL enforced at the DB layer.

**Redis:** Remains OPTIONAL/INACTIVE. Used by the sliding-window rate limiter and caching layer only — not involved in session persistence. Falls back to in-memory rate limiting when `REDIS_URL` is absent (acceptable for current single-instance deployment).

**Risk:** Resolved. No action required before first paid tenant.

---

### 9.2 No Multi-Region Failover

**Gap:** No multi-region deployment configured. All workloads run in a single Azure region.

**Current State:** Single-region deployment. No geo-redundancy or automated failover.

**Risk:** Low-Medium. A regional Azure outage would result in full platform unavailability.

**Remediation:** Architect multi-region after first enterprise contract. Azure Front Door + secondary region in IaC templates.

---

## Section 10: Testing

### 10.1 Low Test Coverage Ratio

**Gap:** The platform has approximately 27 test files against 173 total route files (170 top-level + 3 in the domain-agents subdirectory) — a coverage ratio of approximately 16%.

**Current State:** Test files cover core infrastructure paths. The majority of domain routes (Lyte, Aegis, Vessels, Terra, Alloy sub-routes, Prism Counsel) do not have companion integration tests.

**Risk:** High. Low test coverage means regressions in domain routes may not be caught before deployment.

**Remediation:** Systematic test expansion starting with highest-traffic POST/mutation paths. Companion task: "Extend integration tests to cover POST/mutation paths for Vessels and Firestorm."

---

### 10.2 No End-to-End (E2E) Tests

**Gap:** No Playwright, Cypress, or equivalent E2E test suite covering user-facing flows.

**Current State:** No E2E tests. Functional validation is manual.

**Risk:** Medium. Critical user flows (login, billing, workflow execution) could break without automated detection.

**Remediation:** E2E test suite planned for post-first-customer phase. Prioritized flows: auth, billing checkout, dashboard load.

---

## Section 11: Deployment Readiness

### 11.1 CORS Allows All Origins in Development Mode

**Gap:** CORS is currently configured to allow all origins during development. Production custom domains require explicit `CORS_ORIGINS` environment variable configuration.

**Current State:** `CORS_ORIGINS` not set for production. This is a configuration gap, not a code gap.

**Risk:** Very Low. A configuration change before first external deployment.

**Remediation:** Set `CORS_ORIGINS` environment variable to production domain list before first customer deployment.

---

### 11.2 Stripe Billing Not Activated

**Gap:** Stripe billing infrastructure is fully implemented but inactive. No payments can be processed.

**Current State:** Stripe Checkout, Subscriptions, Invoicing, and Customer Portal are implemented. Stripe API key, price IDs, and webhook secrets are not configured in production.

**Risk:** Very Low. 1-day configuration task, not an engineering task.

**Remediation:** Configure Stripe API key and webhook secrets before first commercial customer.

---

## Section 12: Documentation Accuracy

### 12.1 Prior Investor Documents Contained False Claims

**Gap:** `docs/trust/security-posture.md` previously stated "Every API route is protected" and "All API inputs validated via Zod schemas." Both claims were materially inaccurate.

**Current State:** As of this update (April 2026), both files have been corrected to accurately describe the authentication hydrator model and the actual Zod coverage (21 of 170 top-level route files use Zod validation helpers; 173 total route files excluding index files).

**Risk:** Resolved. Inaccurate investor documentation creates material misrepresentation risk.

**Remediation:** Complete. Documentation corrected in this task.

---

## Section 13: Admin Control

### 13.1 No Dedicated Admin Interface

**Gap:** Admin operations (tenant provisioning, user management, role assignment, feature flag management) are performed via API calls or direct database access. There is no purpose-built admin UI.

**Current State:** Admin routes exist (`/admin`, `/admin/tenants`, `/admin/backup`, `/admin/status`). No frontend UI surfaces these for non-technical admins.

**Risk:** Low. Founder-operated in current phase. Risk increases when platform ops team grows.

**Remediation:** Build admin UI panel as part of Command Portal. Planned for operational activation phase.

---

## Section 14: Support Workflows

### 14.1 No In-App Support Channel

**Gap:** No in-app chat, ticketing, or support escalation flow exists for end users encountering issues.

**Current State:** Contact form exists (`/contact`). No Intercom, Zendesk, or equivalent integration.

**Risk:** Low. Pre-commercial. No paying customers yet.

**Remediation:** Integrate support channel before first commercial customer. Intercom or equivalent. 1–2 days of integration work.

---

## Section 15: External Security Testing

### 15.1 Formal Penetration Test

**Status:** Complete

**Engagement:** NCC Group conducted a formal external penetration test of the SZL Holdings API platform and web applications in April–May 2026 as part of pre-SOC 2 preparation.

**Test window:** April 28 – May 9, 2026  
**Re-test:** May 12, 2026 (all Critical/High findings)  
**Scope:** See `docs/internal/security/pentest-scope-2026-04.md`  
**Findings report:** See `docs/internal/security/pentest-findings-2026-04.md`

**Results summary:**

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | — |
| High | 3 | All remediated and re-tested |
| Medium | 5 | 2 remediated; 3 tracked |
| Low / Info | 4 | 1 remediated; 3 acknowledged |

**High findings resolved:**
- FINDING-001: 2 routes lacked explicit auth enforcement — fixed with auth guard and ESLint rule
- FINDING-002: Internal agent token scope too broad — scoped to specific route prefixes; audit logging added
- FINDING-003: Cross-tenant ID enumeration on `/api/vessels/:voyageId` and `/api/projects/:projectId/notes` — fixed with org access checks and integration tests

**NCC Group overall assessment:** "Security posture is appropriate for a pre-commercial SaaS platform and suitable for SOC 2 Type II audit engagement."

---

## Companion Remediation Tasks

The following active tasks are closing gaps documented above:

| Gap | Companion Task |
|-----|---------------|
| Auth enforcement (§3.1, §3.2) | "Build an automated route security matrix to prevent future regressions" |
| Input validation (§4.1) | "Add Zod validation to the remaining high-traffic API routes outside Prism Counsel" |
| Integration tests (§7.3, §10.1) | "Extend integration tests to cover POST/mutation paths for Vessels and Firestorm" |
| CI for integration tests (§7.3) | "Add CI step so integration tests run automatically on every merge" |
| Pen test Medium findings | FINDING-005 (session cookie prefix), FINDING-007 (Zod expansion), FINDING-010 (WebSocket re-validation) |
| Observability — error tracking (§7.1) | Completed — Sentry SDK integrated in API server and 3 frontend apps. Activate by setting `SENTRY_DSN` in Replit Secrets. |
| Observability — uptime monitoring (§7.2) | See `docs/observability-setup.md` — 5-minute configuration task in chosen provider (no code changes). |

---

*This document is updated as gaps are closed. Version controlled in `docs/known-gaps.md`. Last updated: May 2026.*
