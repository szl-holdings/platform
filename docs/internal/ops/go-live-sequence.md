# Go-Live Sequence & Acceptance Criteria

**Owner:** Founder  
**Last updated:** April 2026  
**Version:** 1.0

---

## Purpose

This document defines the ordered sequence for production launch of the SZL Holdings platform. Each phase has a clear entry condition, required actions, and acceptance criteria. No phase begins until the prior phase is verified.

---

## Phase 0 — Pre-Launch Readiness Gate

**Condition to start:** All development work is complete and no open SEV-1 or SEV-2 bugs exist.

### Actions

- [ ] All CI gates passing: typecheck, lint, build, dependency audit, secret scan
- [ ] All smoke tests passing in preview environment
- [ ] All environment secrets loaded and validated in production environment
- [ ] Database migrations applied and verified in production
- [ ] `CORS_ORIGINS` set to production domain list
- [ ] `NODE_ENV=production` confirmed
- [ ] Helmet CSP and HSTS enabled
- [ ] Rate limiting validated on auth endpoints
- [ ] CSRF token endpoint reachable
- [ ] WebSocket connection tested end-to-end in production

**Acceptance criteria:** All checkboxes above are checked. `/api/health/detailed` returns `"status": "healthy"` with all checks passing.

---

## Phase 1 — Production Infrastructure Validation

**Condition to start:** Phase 0 complete.

### Actions

- [ ] API server deployed and running in production environment
- [ ] `/api/health/live` → 200 `{"status":"ok"}`
- [ ] `/api/health/ready` → 200 `{"status":"ready"}` (DB connected)
- [ ] Database connection verified (pool stats visible in detailed health)
- [ ] Job queue healthy: no backpressure at startup
- [ ] OpenTelemetry instrumentation active (check logs for OTel startup)
- [ ] Self-monitor started (check for `[self-monitor]` logs)
- [ ] Provider health probes active (check for `[provider-health]` logs)
- [ ] Slack webhook connected (send a test notification)
- [ ] All web artifacts deployed and loading without errors

**Acceptance criteria:** All health checks green. At least one Slack alert received. All web artifacts accessible at production URLs.

---

## Phase 2 — Authentication & Access Control Validation

**Condition to start:** Phase 1 complete.

### Actions

- [ ] OIDC login flow completes successfully with a test account
- [ ] Session cookie set with correct flags: `HttpOnly`, `SameSite=Strict`, `Secure`
- [ ] Authenticated API call returns correct data for the user's role
- [ ] Unauthorized API call returns 401 (not 500 or data)
- [ ] Admin-only routes return 403 for non-admin users
- [ ] WebSocket connection authenticates correctly with HMAC ticket
- [ ] CSRF token flow works: fetch token → use in state-changing request
- [ ] Session expiry or logout invalidates the session correctly

**Acceptance criteria:** All auth scenarios above verified with at least 2 test accounts (admin and viewer roles).

---

## Phase 3 — Domain Functionality Smoke Test

**Condition to start:** Phase 2 complete.

### Actions

- [ ] **Lyte:** Dashboard loads, at least one signal visible, alert center functional
- [ ] **Aegis:** Threat board loads, incidents table visible, SOC feed rendering
- [ ] **Terra:** Property signals loading, distress map rendering
- [ ] **Vessels:** Fleet positions loading, vessel detail page accessible
- [ ] **Carlota Jo:** Client portal accessible, booking request form submittable
- [ ] **Alloy:** Action queue renders, at least one action approvable end-to-end
- [ ] **Admin panel:** Diagnostics page loads, user list visible, audit log accessible
- [ ] Mobile apps: At least one Expo app (Lyte Mobile) connects to production API successfully

**Acceptance criteria:** All domain surfaces load data without errors. Alloy approval flow completes end-to-end.

---

## Phase 4 — Analytics & Observability Validation

**Condition to start:** Phase 3 complete.

### Actions

- [ ] `user_logged_in` event fires and appears in server telemetry on login
- [ ] `dashboard_viewed` event fires on Lyte dashboard load
- [ ] `signal_viewed` event fires when opening a signal
- [ ] `action_approved` event fires when approving an action in Alloy
- [ ] `contact_form_submitted` event fires on contact form submission
- [ ] OpenTelemetry traces visible (if OTLP endpoint configured)
- [ ] Error rate baseline established (should be <1% at idle)
- [ ] P95 latency baseline established (should be <500ms at idle for basic reads)
- [ ] Self-monitor running without false positive alerts

**Acceptance criteria:** All 5 core analytics events firing. Baseline metrics established and documented.

---

## Phase 5 — Security Hardening Verification

**Condition to start:** Phase 4 complete.

### Actions

- [ ] Dependency audit: `pnpm audit --audit-level high` — zero high/critical vulnerabilities
- [ ] Secret scan: no secrets in committed code
- [ ] Security headers verified: `Strict-Transport-Security`, `X-Frame-Options`, `Content-Security-Policy` present in production responses
- [ ] `SECURITY.md` is up to date and linked from public repo
- [ ] Security contact (security@szlholdings.com) is active and monitored
- [ ] Known-gap register reviewed and current (`docs/internal/security/backup-restore.md`)
- [ ] Trust center and security posture documents reflect current production state

**Acceptance criteria:** Zero high/critical dependency vulnerabilities. All security headers present. Known-gap register verified.

---

## Phase 6 — Operational Readiness

**Condition to start:** Phase 5 complete.

### Actions

- [ ] On-call contact confirmed and tested (founder phone reachable)
- [ ] Slack alert channel connected and receiving alerts
- [ ] Incident response runbook reviewed by founder
- [ ] Support inbox (inquiries@szlholdings.com) monitored and routing correctly
- [ ] Rollback procedure tested: confirmed ability to redeploy previous version
- [ ] Database backup confirmed: backup accessible and restore procedure documented
- [ ] `/api/health/detailed` bookmarked for quick access during incidents
- [ ] Admin diagnostics page accessible with internal token

**Acceptance criteria:** On-call loop verified. Backup confirmed. Rollback tested.

---

## Phase 7 — Investor / Buyer Readiness

**Condition to start:** Phases 1–6 complete.

### Actions

- [ ] Investor overview (`docs/investor/investor-overview.md`) current and accurate
- [ ] Buyer executive overview (`docs/buyer/executive-overview.md`) current and accurate
- [ ] Product readiness (`docs/investor/product-readiness.md`) accurately reflects what is live
- [ ] Trust center and security posture documents externally shareable
- [ ] Data room index current (`docs/investor/data-room-index.md`)
- [ ] Demo environment stable and prepared for stakeholder walkthroughs
- [ ] All demo seed data loaded and verified

**Acceptance criteria:** All investor/buyer documents reviewed by founder. Demo environment verified with a full walkthrough.

---

## Phase 8 — Launch

**Condition to start:** All prior phases accepted by founder.

### Actions

- [ ] Announce launch to initial stakeholder list
- [ ] Begin intake of demo requests
- [ ] Monitor production health for 48 hours post-launch
- [ ] Review analytics events for first-user patterns
- [ ] Document any issues discovered in post-launch review

**Acceptance criteria:** 48-hour stability window passes with no SEV-1 or SEV-2 incidents.

---

## Go/No-Go Sign-Off

| Phase | Owner | Sign-Off Date | Notes |
|-------|-------|--------------|-------|
| Phase 0 — Pre-launch readiness | Founder | | |
| Phase 1 — Infrastructure | Founder | | |
| Phase 2 — Auth & access | Founder | | |
| Phase 3 — Domain smoke tests | Founder | | |
| Phase 4 — Analytics & observability | Founder | | |
| Phase 5 — Security hardening | Founder | | |
| Phase 6 — Operational readiness | Founder | | |
| Phase 7 — Investor/buyer readiness | Founder | | |
| Phase 8 — Launch | Founder | | |

---

*See also: [Release Governance](../releases/release-governance.md) · [Deployment Matrix](../releases/deployment-matrix.md) · [Incident Response](incident-response-runbook.md)*
