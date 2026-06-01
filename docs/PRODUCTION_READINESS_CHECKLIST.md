# SZL Holdings — Production Readiness Checklist

**Purpose:** Step-by-step checklist for promoting the SZL platform from Beta to production deployment.

**As of:** April 2026
**Reference:** `docs/production-readiness.md` for environment and credential detail

---

## How to Use This Checklist

Work through each section in order. Every item must be checked before moving to the next section. Items marked `[BLOCKING]` must be complete before any customer traffic is served. Items marked `[RECOMMENDED]` are best practice but not strictly blocking for initial launch.

---

## Section 1: Environment and Credentials

- [ ] `[BLOCKING]` Production `DATABASE_URL` configured and points to production PostgreSQL instance (separate from dev)
- [ ] `[BLOCKING]` `CORS_ORIGINS` set to all production domains (e.g., `szlholdings.com,vessels.szlholdings.com,aegis.szlholdings.com`)
- [ ] `[BLOCKING]` `SESSION_SECRET` is a cryptographically strong random value (≥ 32 bytes) set in production secrets
- [ ] `[BLOCKING]` `NODE_ENV=production` set in all production workflows
- [ ] `[BLOCKING]` `ALLOY_INTERNAL_TOKEN` set to a production-specific value (not the dev value)
- [ ] `[RECOMMENDED]` `STRIPE_SECRET_KEY` (live mode) configured for billing activation
- [ ] `[RECOMMENDED]` `STRIPE_WEBHOOK_SECRET` configured and verified
- [ ] `[RECOMMENDED]` `RESEND_API_KEY` configured for transactional email
- [ ] `[RECOMMENDED]` `OBJECT_STORAGE_BUCKET_ID` configured for file uploads

---

## Section 2: Database

- [ ] `[BLOCKING]` `pnpm db:push` run successfully against production database
- [ ] `[BLOCKING]` Database schema matches application code (no drift)
- [ ] `[BLOCKING]` Seed data runs without fatal errors (`pnpm db:seed`)
- [ ] `[BLOCKING]` Database backup is configured and verified (Replit PostgreSQL snapshots)
- [ ] `[RECOMMENDED]` Verify no sensitive PII in seed data that was intended for dev only
- [ ] `[RECOMMENDED]` Confirm `onConflictDoNothing()` behavior tested in production context

---

## Section 3: API Server

- [ ] `[BLOCKING]` API server starts without errors
- [ ] `[BLOCKING]` `GET /api/health` returns HTTP 200 with `status: healthy`
- [ ] `[BLOCKING]` All RBAC middleware verified: admin routes require `admin` role, operator routes require `operator` role
- [ ] `[BLOCKING]` Rate limiting active on authentication endpoints
- [ ] `[BLOCKING]` CSRF middleware active on all state-mutating routes
- [ ] `[BLOCKING]` Helmet.js CSP headers active with production policy
- [ ] `[RECOMMENDED]` Rate limiting on public marketing page routes
- [ ] `[RECOMMENDED]` Request ID header (`X-Request-ID`) propagated in all responses
- [ ] `[RECOMMENDED]` OpenAPI documentation accessible at `/api/docs`

---

## Section 4: Authentication

- [ ] `[BLOCKING]` OIDC authentication flow tested end-to-end in production environment
- [ ] `[BLOCKING]` Session cookie secure flag enabled (`Secure; HttpOnly; SameSite=Strict`)
- [ ] `[BLOCKING]` Session TTL configured appropriately for production
- [ ] `[BLOCKING]` Organization-scoped RBAC tested: users cannot access other tenants' data
- [ ] `[RECOMMENDED]` WebSocket HMAC ticket verification tested in production
- [ ] `[RECOMMENDED]` Session invalidation tested (logout clears all sessions)

---

## Section 5: Frontend Applications

- [ ] `[BLOCKING]` All platform surfaces build without TypeScript errors
- [ ] `[BLOCKING]` All platform surfaces load in production without console errors
- [ ] `[BLOCKING]` Status badges (Beta/Internal) visible on appropriate surfaces
- [ ] `[BLOCKING]` Demo data banners visible where data is seeded
- [ ] `[BLOCKING]` No internal routes or tools exposed in production navigation
- [ ] `[RECOMMENDED]` All surfaces tested on mobile viewport (responsive)
- [ ] `[RECOMMENDED]` All surfaces tested in Safari, Chrome, and Firefox

---

## Section 6: Quality Audits

Run all quality scripts against production:

- [ ] `[BLOCKING]` `pnpm audit:mocks` — PASS (no blocking mock patterns in production paths)
- [ ] `[BLOCKING]` `pnpm audit:routes` — PASS (all registered routes exist as files)
- [ ] `[BLOCKING]` `pnpm audit:copy` — PASS (no lorem ipsum or placeholder text)
- [ ] `[RECOMMENDED]` `pnpm audit:deps` — ADVISORY (no blocking conflicts)
- [ ] `[RECOMMENDED]` `pnpm audit:design-system` — PASS (no design token violations)
- [ ] `[RECOMMENDED]` `pnpm audit:broken-links` — PASS (all lazy imports resolve)
- [ ] `[RECOMMENDED]` `pnpm health:check` — PASS (all health endpoints responding)

---

## Section 7: Monitoring and Alerting

- [ ] `[BLOCKING]` Log aggregation configured (Logtail, Datadog, or equivalent)
- [ ] `[BLOCKING]` P0 alerts configured for API unavailability and database connection failure
- [ ] `[RECOMMENDED]` Sentry DSN configured for frontend and backend error tracking
- [ ] `[RECOMMENDED]` P1 alerts configured for error rate and latency degradation
- [ ] `[RECOMMENDED]` SLO dashboard accessible to engineering team
- [ ] `[RECOMMENDED]` On-call rotation configured (see `docs/ONCALL_AND_INCIDENT_MODEL.md`)

---

## Section 8: DNS and Domains

- [ ] `[BLOCKING]` Primary domain (`szlholdings.com`) DNS pointed to production deployment
- [ ] `[RECOMMENDED]` Per-platform subdomains configured (`vessels.szlholdings.com`, `aegis.szlholdings.com`, etc.)
- [ ] `[RECOMMENDED]` SSL/TLS verified for all custom domains (Replit handles automatically)
- [ ] `[RECOMMENDED]` SPF/DKIM records configured for `@szlholdings.com` sender domain
- [ ] `[RECOMMENDED]` WWW redirect configured (`www.szlholdings.com` → `szlholdings.com`)

---

## Section 9: Enterprise Features (Before First Enterprise Tenant)

- [ ] Terms of Service published and linked from all platform entry points
- [ ] Privacy Policy published and linked
- [ ] Data Processing Agreement (DPA) template available
- [ ] SCIM provisioning endpoint documented for IdP administrators
- [ ] Azure AD admin consent flow documented
- [ ] Power BI embed configuration guide available

---

## Section 10: Go-Live Verification

- [ ] Smoke test all primary user journeys end-to-end in production
- [ ] Verify audit log capturing events in production database
- [ ] Verify proof chain entries appearing for governed actions
- [ ] Verify email delivery (send test inquiry from Carlota Jo)
- [ ] Verify Alloy workflow execution (run one workflow end-to-end)
- [ ] Verify signal-to-action flow on at least one domain pack
- [ ] Confirm rollback plan is documented and the team has practiced the procedure

---

## Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| Engineering Lead | | | |
| Security Review | | | |
| Product Owner | | | |

---

*All blocking items must be checked and signed off before serving production customer traffic. This checklist should be completed and archived with each major release.*
