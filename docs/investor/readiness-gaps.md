# SZL Holdings — Readiness Gaps (Honest Assessment)

**Date:** Q1 2026  
**Purpose:** Transparent disclosure of current platform gaps for qualified evaluators

---

## Philosophy

SZL Holdings does not inflate its current state to improve how it presents to investors. Investors who commit based on inaccurate information are the wrong investors. This document is an honest accounting of what is and isn't production-ready, and what the path to closing each gap looks like.

---

## Gap Inventory

### 1. No Paying Customers

**Gap:** Zero commercial deployments. No revenue. No validated product-market fit beyond the architecture.

**Context:** The platform is pre-revenue by design — the current phase is building the technology to a level of credibility that justifies first customers. The architecture is validated; commercial fit requires the sales motion.

**Path to close:** First design partner program for Lyte. 3 design partners before billing activation.

**Risk level:** Medium — the largest single gap, but not a technical gap. It is a sales motion gap.

---

### 2. Demo / Seeded Data (Not Live Production Data)

**Gap:** Most platform dashboards display seeded or simulated data. Every dashboard is labeled accordingly (Demo / Pilot / Live badges), but the data is not from live production sources.

**Exceptions:** Terra has a live NYC Open Data pipeline. Authentication is real OIDC sessions.

**Path to close:**
- Lyte: connector activation requires live API keys from customer systems
- Vessels: requires live AIS data feed subscription
- Aegis: requires live SIEM connector for real threat data
- Terra: already has live data; expanding coverage is the work

**Risk level:** Low — the infrastructure handles real data. This is a configuration + subscription gap.

---

### 3. Billing Not Activated

**Gap:** Stripe billing infrastructure is fully implemented but not activated. No payments can be processed.

**Path to close:** Configure Stripe API key + price IDs + webhook secrets. This is a 1-day configuration task, not an engineering task.

**Risk level:** Very Low — it's turned off by configuration.

---

### 4. No SOC 2 Certification

**Gap:** SZL Holdings has no formal compliance certifications. SOC 2, StateRAMP, ISO 27001 — none of these are in place.

**Context:** SOC 2 Type I is typically achieved 6–9 months into a structured audit process. It requires documented controls, evidence collection, and a third-party auditor engagement. None of that is possible pre-revenue.

**Path to close:** Post-funding, begin SOC 2 Type I preparation. Budget: $15–30K for auditor. Timeline: 6–9 months.

**Risk level:** Medium for enterprise sales in regulated verticals (financial services, healthcare, government). Low for initial commercial customers.

---

### 5. Production Session Store (Redis)

**Gap:** Session management currently uses in-memory store. In production at scale, this requires Redis for persistence across server restarts and horizontal scaling.

**Path to close:** Azure Cache for Redis (already in IaC templates). 1 day of engineering to wire up.

**Risk level:** Very Low — architectural slot is already designed for it.

---

### 6. Live AIS Data (Vessels)

**Gap:** Vessels fleet data is simulated. Labeled Demo in the UI.

**Path to close:** Subscribe to an AIS data provider (MarineTraffic, AISHub, Spire Maritime). Annual cost: $15–40K depending on coverage and update frequency.

**Risk level:** Low — the data integration layer is built. This is a subscription + API key gap.

---

### 7. CORS Configuration for Production Domains

**Gap:** CORS is not configured for production custom domains. Currently set to allow all origins in development.

**Path to close:** Set `CORS_ORIGINS` environment variable to the specific production domain list before first external deployment.

**Risk level:** Very Low — a configuration change.

---

### 8. Frontend Error Tracking (Sentry)

**Gap:** No production error tracking service configured for frontend JavaScript errors.

**Path to close:** Add Sentry SDK to frontend artifacts. Configure DSN in environment variables.

**Risk level:** Very Low — monitoring gap, not functionality gap.

---

### 9. Auth Enforcement Coverage (Technical Debt) — CLOSED

**Gap (historical):** The API server used a global session hydrator that populated user context on every request but did not enforce authentication. Route-level auth enforcement was applied per-router, meaning future routes could be accidentally created without auth.

**Current state (closed — April 2026):**
- `src/middlewares/global-auth-enforcer.ts` implements a **deny-by-default** guard that runs on every `/api/*` request after session hydration. Unauthenticated requests receive `401 Unauthorized` unless the route path is in the explicit public allowlist.
- All 15 previously unprotected routes have been audited: intentionally public routes (health probes, auth/OIDC flows, webhooks, contact forms, Carlota Jo demo, LP portal, page-view tracking, newsletter, DOS public API) are explicitly registered in `PUBLIC_EXACT_PATHS` / `PUBLIC_PREFIXES` in the enforcer. Every other route is protected by default.
- An on-demand **route security matrix script** (`src/scripts/route-security-matrix.ts`) scans all route files and classifies each as `PROTECTED`, `PUBLIC`, or `UNCLASSIFIED`. Running with `--strict` exits non-zero if any unclassified routes exist, enabling CI enforcement.
- Regression tests in `src/__tests__/security-hardening.test.ts` verify the enforcer blocks unauthenticated requests and allows public paths and valid sessions.

**Risk level:** Closed. The structural gap is eliminated. A new route file added without auth enforcement will be blocked at the enforcer level, not silently passed through. See `docs/known-gaps.md §3`.

---

### 10. Input Validation Coverage (Technical Debt)

**Gap:** Zod schema validation via `validateBody()` / `validateQuery()` middleware helpers is applied to 21 of 170 top-level API route files. The remaining 149 routes rely on Drizzle ORM parameterized queries for SQL injection prevention but do not have structured input schema validation. Core high-traffic routes — `lyte.ts`, `vessels.ts`, `firestorm.ts`, `terra.ts`, `alloy.ts`, `billing.ts` — are not covered.

**Current state:** 21 route files use Zod helpers (including `auth.ts`, `comments.ts`, `contact.ts`, `demo-requests.ts`, `feedback.ts`, `gdpr.ts`, `invitations.ts`, `partner-portal.ts`, and 13 others). All other routes parse `req.body` fields directly. `lib/validation.ts` and `lib/api-zod/` exist — the infrastructure is built; systematic application is the gap.

**Path to close:** Systematic Zod expansion to high-traffic POST/PUT/PATCH routes. Active remediation task in progress: "Add Zod validation to the remaining high-traffic API routes outside Counsel." See `docs/known-gaps.md §4`.

**Risk level:** High (coverage gap). SQL injection is mitigated universally by the ORM. Risk is malformed data, type coercion errors, and missing field validation in business logic.

---

### 11. Test Coverage Ratio (Technical Debt)

**Gap:** The platform has approximately 27 test files against 173 total route files — a coverage ratio of approximately 16%. The majority of domain routes do not have companion integration tests.

**Current state:** Test infrastructure exists. CI runs TypeScript typecheck, ESLint, dependency audit, and build validation — but integration tests are not wired into the CI pipeline and do not run automatically on merge.

**Path to close:** Two active remediation tasks: "Extend integration tests to cover POST/mutation paths for Vessels and Firestorm" and "Add CI step so integration tests run automatically on every merge." See `docs/known-gaps.md §10`.

**Risk level:** High (coverage gap). Low test coverage means regressions in domain routes may not be caught before deployment.

---

### 12. Session Store (Redis Not Active)

**Gap:** Session management uses an in-memory store. Sessions are lost on server restart; horizontal scaling across multiple instances is not supported without a shared session store.

*(This gap is also listed as Gap 5 above from an infrastructure perspective. It is repeated here to make the technical debt inventory complete.)*

**Path to close:** Azure Cache for Redis is included in IaC templates. 1 day of engineering. Activate at revenue phase.

**Risk level:** Very Low (pre-commercial, single instance). Medium at commercial scale.

---

## Summary Table

| Gap | Category | Severity | Path |
|-----|---------|---------|------|
| No paying customers | Commercial | High | Design partner program |
| Demo data | Operational | Medium | Live data feed subscriptions |
| Billing inactive | Commercial | Low | Configuration (1 day) |
| No SOC 2 | Compliance | Medium (enterprise) | Post-funding audit track |
| Redis not live | Infrastructure | Very Low | 1 day engineering |
| AIS data | Operational | Low | Subscription ($15–40K/year) |
| CORS configuration | Security | Very Low | Environment variable |
| Sentry / error tracking | Operations | Very Low | 1 day engineering |
| Auth enforcement coverage | Technical — Security | ~~High~~ Closed | Deny-by-default guard + route matrix — closed April 2026 |
| Input validation coverage (21/170 routes) | Technical — Security | High | Zod expansion to remaining routes (active) |
| Test coverage ratio (~27 tests / 173 routes) | Technical — Quality | High | Integration test expansion + CI wiring (active) |
| In-memory session store | Technical — Infra | Very Low (now) / Medium (at scale) | Redis (revenue phase) |

---

## What Is Not a Gap

The following are often raised in due diligence and are **not** gaps in this platform:

- **Architecture design** — Production-grade, documented, validated
- **Security architecture foundation** — RBAC, OIDC, audit trail, HMAC WebSocket — all implemented correctly. Coverage gaps are documented above and in `docs/known-gaps.md`.
- **Scalability** — Monorepo + Azure Bicep IaC designed for enterprise scale
- **Mobile coverage** — All 7 platforms have Expo/React Native apps
- **AI governance** — Human-in-the-loop enforced at code level (Alloy), not just policy
- **API documentation** — OpenAPI 3.1 specification implemented
- **Deployment automation** — CI/CD workflows, post-merge automation, health checks — all in place
- **SQL injection protection** — Drizzle ORM parameterized queries applied universally, regardless of Zod coverage gaps

---

*Full technical gap register: [`docs/known-gaps.md`](../known-gaps.md)*
