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
- **"Zod validation coverage"** = files containing `validateBody`, `validateQuery`, or `validateParams` from `lib/validation.ts`. **Count: 21 of 170 top-level route files.**
- **"Auth enforcement coverage"** = files containing `authMiddleware`, `requireRole`, `requireAnyAuth`, or `adminGuard`. **Count: 155 of 170 top-level route files.**

These counts should be re-verified as the platform grows. The route security matrix task will automate this tracking.

---

## Summary Table

| Area | Gap | Risk | Status |
|------|-----|------|--------|
| Security — Auth | Global hydrator ≠ global enforcer; most routes rely on per-route enforcement | High | In remediation |
| Security — Auth | 2 routes lacked explicit auth enforcement (found via pen test, FINDING-001) | High | Resolved — May 2026 |
| Security — Cross-Tenant | Cross-tenant ID enumeration on vessels and projects routes (pen test, FINDING-003) | High | Resolved — May 2026 |
| Security — Validation | 21 of 170 top-level route files use Zod input validation helpers | High | In remediation |
| Multi-Tenant Design | Tenant scope applied selectively, not universally | Medium | In remediation |
| Testing | ~27 test files vs. 173 total route files (~16% coverage ratio) | High | Planned |
| Session Store | In-memory session store; no Redis in production | Medium | Planned |
| Observability | Sentry SDK integrated; external uptime monitor setup documented | Medium | In remediation |
| CI | Integration tests do not run automatically on merge | Medium | Planned |
| Admin Tooling | No dedicated admin interface for tenant/user management | Low | Planned |
| Support Workflows | No ticketing or in-app support channel integration | Low | Planned |
| Scalability | Single-instance session store; no multi-region failover | Medium | Planned |
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

**Gap:** The `tenantScope()` middleware is applied to specific route prefixes (`/audit`, `/jobs`, `/comments`, `/documents`, `/exports`, `/orgs`) but is not universally enforced across all data-returning routes.

**Current State:** Domain routers (e.g., `/lyte`, `/vessels`, `/aegis`, `/terra`) do not all apply `tenantScope()`. Cross-tenant data isolation relies on application logic within route handlers rather than a universal middleware gate.

**Risk:** Medium. Routes that do not apply `tenantScope()` depend on handler-level filtering. A missing filter in a handler could leak cross-tenant data. This is not an active exploit in a single-tenant demo environment, but it is a structural gap for multi-tenant production deployment.

**Remediation:** Apply `tenantScope({ required: true })` globally at the router level for all data-returning routes, and audit each handler for org-scoped query filters. Companion task in progress.

---

### 2.2 Org Membership Hydration Is Lazy

**Gap:** The global auth hydrator (`authMiddleware.ts`) populates `req.user.orgs` as an empty array. The `tenantScope()` middleware re-fetches org memberships from the database on demand. This means routes that skip `tenantScope()` receive a user with `orgs: []`, which could cause logic errors in handlers that check `req.user.orgs` without going through tenant scope.

**Current State:** Documented in comments in `tenant-scope.ts`. Known architecture decision.

**Risk:** Low. The behavior is intentional and documented, but creates a footgun for future route authors who do not know to call `tenantScope()`.

**Remediation:** Add a lint rule or architecture test that flags routes accessing `req.user.orgs` without `tenantScope()` in the middleware chain.

---

## Section 3: Security — Authentication & Authorization

### 3.1 Global Auth Middleware Is a Hydrator, Not an Enforcer

**Gap:** The global `authMiddleware` (`src/middlewares/authMiddleware.ts`) runs on every request but only populates `req.oidcUser` / `req.user` from the session. It does **not** reject unauthenticated requests. Route-level enforcement requires each router to explicitly call `authMiddleware()` from `src/middlewares/auth.ts` with `required: true`.

**Current State:** 155 of 170 top-level route files import auth-related middleware. The remaining 15 route files (health checks, public status, webhooks, contact forms, demo requests) are intentionally or incidentally public. The global hydrator never returns a 401 — it always calls `next()`.

**Risk:** High. The architecture is correct as designed, but it creates a risk surface where a new route file added without explicit auth enforcement is publicly accessible by default. There is no deny-by-default enforcement at the framework level.

**Remediation:** Add a global deny-by-default guard that requires routes to opt-out of authentication (rather than opt-in). Companion tasks in progress: "Build an automated route security matrix to prevent future regressions" and "Connect the new security modules to live API data and case management workflows."

---

### 3.2 No Route Security Matrix

**Gap:** There is no automated registry mapping every route to its auth enforcement level. It is not possible to audit at a glance which routes are public, which require any auth, and which require specific roles.

**Current State:** Auth enforcement is verified by code inspection only. No tooling generates a route→auth matrix.

**Risk:** Medium. As the route count grows (currently 173 total route files), manual auditing becomes impractical.

**Remediation:** Companion task in the backlog: "Build an automated route security matrix to prevent future regressions."

---

### 3.3 Internal Agent Token Has Super-Admin Access

**Gap:** The `ALLOY_INTERNAL_TOKEN` environment variable grants `super_admin` access to any caller who presents it in `X-Internal-Token`. This token is used for internal service-to-service calls.

**Current State:** Token is stored in environment variables (not source code). It grants full platform access with no scope restrictions.

**Risk:** Medium. If the token is compromised or the environment variable is leaked, an attacker gains super-admin access to the entire platform. There is no per-route or per-operation scope for this token.

**Remediation:** Scope internal tokens to specific operations. Rotate on a defined schedule. Audit all uses of `ALLOY_INTERNAL_TOKEN`.

---

## Section 4: Security — Input Validation

### 4.1 Zod Validation Coverage Is Low

**Gap:** The platform has a `lib/validation.ts` module with `validateBody()`, `validateQuery()`, and `validateParams()` middleware helpers, plus shared Zod schemas for common inputs. However, only **21 of 170 top-level route files** use these helpers — and several of those are AI/ML research routes or Prism Counsel modules with limited production traffic.

**Current State:**
- Routes with Zod validation (21): `auth.ts`, `comments.ts`, `contact.ts`, `demo-requests.ts`, `feedback.ts`, `gdpr.ts`, `invitations.ts`, `partner-portal.ts`, `agent-federation.ts`, `agent-training.ts`, `copilot.ts`, `digital-twins.ts`, `fine-tuning.ts`, `ml-pipeline.ts`, `monte-carlo.ts`, `streaming-ingestion.ts`, `prism-counsel-core.ts`, `prism-counsel-court.ts`, `prism-counsel-ny.ts`, `prism-counsel-ops.ts`, `prism-counsel-purview.ts`
- Routes without formal input validation: ~149 files. These routes may do ad-hoc parsing (`req.body.field`) or pass unvalidated inputs directly to the ORM.
- Core high-traffic domain routes lacking Zod: `lyte.ts`, `vessels.ts`, `firestorm.ts`, `terra.ts`, `alloy.ts`, `billing.ts`, `notifications.ts`, `projects.ts`, and the majority of sub-domain routes.

**Risk:** High. Unvalidated inputs can produce unexpected database behavior, malformed records, or — in edge cases — injection vectors. Drizzle ORM parameterized queries prevent SQL injection, but type coercion issues, missing fields, and malformed data can still cause application errors or data corruption.

**Remediation:** Systematic Zod expansion across high-traffic POST/PUT/PATCH routes. Companion task: "Add Zod validation to the remaining high-traffic API routes outside Prism Counsel."

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

### 9.1 In-Memory Session Store

**Gap:** Session management uses an in-memory store. Sessions are lost on server restart. Horizontal scaling across multiple server instances is not possible without a shared session store.

**Current State:** In-memory store. Single-instance deployment.

**Risk:** Medium for commercial deployment. Currently Very Low for demonstration environment.

**Remediation:** Azure Cache for Redis is included in IaC templates. 1 day of engineering to wire up. Activate at revenue phase.

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
