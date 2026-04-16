# SZL Holdings — Launch Blockers

**Date:** 2026-04-16  
**Owner:** Engineering / Founder  
**Audience:** Engineering leads, Stephen Lutar, launch decision-makers  
**Status:** Authoritative pre-launch gate document

This document lists only items that could **reasonably block public launch** of the SZL Holdings platform. "Public launch" means exposing any product surface to real external users or enterprise evaluators who are not internal team members or explicitly on-boarded design partners.

Items that are risks, tech debt, or roadmap work — but do not block launch — belong in KNOWN-GAPS.md, not here.

---

## HARD BLOCKERS — Launch Cannot Proceed Until Resolved

These items must be resolved or formally accepted in writing by the Founder before any public launch.

### LB-001 · Firebase & Google Credentials — Manual Rotation Required
**Severity:** Critical  
**Gap reference:** GAP-001 in KNOWN-GAPS.md  
**Status:** ⛔ Open  
**Description:** Firebase API keys, Google service account credentials, and related credential files require manual rotation. The April 2026 audit confirmed that committed files are placeholder templates with no live key material, but the original real values may have existed in git history. Until rotation is confirmed against the production Firebase and Google Cloud projects, launch cannot be certified secure.  
**What is needed:**
- Confirm current git history contains no live key material (run `git log --all -- **/google-services.json` and `**/GoogleService-Info.plist`)
- Rotate Firebase API key in Firebase Console
- Rotate any Google Cloud service account keys referenced by the project
- Document rotation completion date and confirm in this file
**Owner:** Stephen Lutar / Security Lead  
**Estimated effort:** 2–4 hours

---

### LB-002 · No External Uptime Monitoring Before First Production Traffic
**Severity:** High  
**Gap reference:** KG027 in KNOWN-GAPS.md  
**Status:** ⛔ Open  
**Description:** There is no external uptime monitoring configured. If the production environment goes down after launch, the team will only know when a user reports it. This is a direct SLA and trust risk — especially material for enterprise evaluators who may test the platform immediately after first contact.  
**What is needed:**
- Configure an external uptime monitor (e.g., UptimeRobot, Better Uptime, or Azure Monitor) against `GET /api/health` on the production URL
- Set alert contacts (email, Slack) for the on-call owner
- Confirm monitor is live before any public traffic
**Owner:** Platform / DevOps  
**Estimated effort:** 2–4 hours

---

### LB-003 · No Production Error Tracking (Sentry or Equivalent)
**Severity:** High  
**Gap reference:** KG028 in KNOWN-GAPS.md  
**Status:** ⛔ Open  
**Description:** No error tracking is configured for the production environment. Unhandled exceptions and runtime errors in production will be silent — visible only in raw logs. Without this, diagnosing user-facing issues after launch requires log forensics, which is operationally unacceptable for a public product.  
**What is needed:**
- Configure Sentry (or Azure Application Insights exceptions) on the API server and all web frontends
- Set `SENTRY_DSN` in production environment variables
- Verify error capture in staging before going live
**Owner:** Platform / Engineering  
**Estimated effort:** 4–8 hours

---

### LB-004 · Production Database Separate from Development
**Severity:** High  
**Status:** ⛔ Confirm Before Launch  
**Description:** The current environment uses Replit-managed PostgreSQL, which is shared across the workspace. A public launch using the same database as active development is not acceptable — a bad migration or dev seeding run could corrupt production data or expose demo/seed data to real users.  
**What is needed:**
- Confirm that the production deployment uses a separate database instance (separate `DATABASE_URL`)
- Verify demo/seed data is **not** present in the production database before launch
- Verify production migrations have been run cleanly against the isolated prod database
**Owner:** Engineering / DevOps  
**Estimated effort:** 2–4 hours (confirmation); longer if a new DB needs provisioning

---

### LB-005 · Production Secrets Set Independently (Not Reused from Dev)
**Severity:** High  
**Status:** ⛔ Confirm Before Launch  
**Description:** Production secrets — `SESSION_SECRET`, `SECRET_ENCRYPTION_KEY`, `ADMIN_PIN`, `CORS_ORIGINS`, Stripe live keys — must be environment-specific and not reused from the development workspace. Using dev secrets in production is a credential hygiene failure that invalidates the security posture of the platform.  
**What is needed:**
- Confirm `SESSION_SECRET` (≥32 chars), `SECRET_ENCRYPTION_KEY`, and `ADMIN_PIN` are fresh values generated for production only
- Confirm `CORS_ORIGINS` is set to production domain(s) only (not `*` or dev origins)
- Confirm Stripe is using **live keys** (`sk_live_...`), not test keys, in production
- Confirm no `.env` file exists in the deployed artifact directory
**Owner:** Engineering / Founder  
**Estimated effort:** 1–2 hours (confirmation and rotation)

---

### LB-006 · OTEL / Observability Exporter Not Wired for Production
**Severity:** High  
**Gap reference:** KG009 in KNOWN-GAPS.md  
**Status:** ⛔ Open  
**Description:** OpenTelemetry is configured in the codebase but the OTLP exporter endpoint is not set for production. Without production tracing, diagnosing latency spikes, slow queries, and AI provider failures post-launch requires guesswork. This is an operational readiness requirement, not an optional enhancement.  
**What is needed:**
- Set `OTEL_EXPORTER_OTLP_ENDPOINT` (or equivalent) pointing to Azure Application Insights or a hosted OTLP backend before first production traffic
- Confirm trace data is flowing by checking the observability dashboard for at least one complete request trace
**Owner:** Platform  
**Estimated effort:** 4–8 hours

---

### LB-007 · Legal Review of User-Facing Agreements Not Complete
**Severity:** High  
**Status:** ⛔ Requires External Action (legal counsel)  
**Description:** The Privacy Policy and Terms of Service present on the platform have not been reviewed by qualified legal counsel. No external user can be invited to accept these agreements before legal review is complete. Design-partner and pilot agreements similarly require counsel review before any commercial engagement.  
**What is needed:**
- Qualified legal counsel reviews and approves Privacy Policy at `/legal/privacy`
- Qualified legal counsel reviews and approves Terms of Service at `/legal/terms`
- Design-partner / pilot agreement template reviewed and approved by counsel
- If collecting analytics from EU visitors: GDPR-compliant cookie consent mechanism verified by counsel
**Owner:** Stephen Lutar (to engage counsel)  
**Note:** Engineering cannot sign off on this item. It requires a human legal review and is listed here so it is not omitted from the launch gate.

---

## CONDITIONAL BLOCKERS — Block Launch Unless Formally Accepted

These items should be resolved before launch. If they cannot be resolved in time, the Founder must formally accept each in writing, with the associated risk documented.

### LC-001 · No CI/CD Automated Secret Scanning
**Severity:** Medium  
**Gap reference:** GAP-002 in KNOWN-GAPS.md  
**Acceptance risk:** A future commit could accidentally expose a real credential without automated detection. Manual pre-commit checks are in place but not enforced as a CI gate.  
**Resolution path:** Add `gitleaks` or GitHub secret scanning to CI pipeline.

---

### LC-002 · No CodeQL SAST in CI
**Severity:** Medium  
**Gap reference:** KG011 in KNOWN-GAPS.md  
**Acceptance risk:** Static analysis regressions could reach production undetected. Current TypeScript type checking and lint provide partial coverage but not SAST.  
**Resolution path:** Add `.github/workflows/codeql.yml`.

---

### LC-003 · No Automated Dependency Vulnerability Scanning
**Severity:** Medium  
**Gap reference:** KG012 in KNOWN-GAPS.md  
**Acceptance risk:** A vulnerable dependency could be introduced without detection. `pnpm audit` is run manually but not enforced as a merge gate.  
**Resolution path:** Add `dependency-review-action` to PR checks.

---

### LC-004 · Webhook Delivery URL SSRF Validation Absent
**Severity:** Medium  
**Gap reference:** KG020b in KNOWN-GAPS.md  
**Acceptance risk:** An attacker with access to webhook configuration could submit internal URLs as delivery targets, causing server-side request forgery.  
**Resolution path:** Add host allowlist and URL validation to webhook delivery logic.

---

### LC-005 · MFA Not Implemented
**Severity:** Medium  
**Gap reference:** KG026 in KNOWN-GAPS.md  
**Acceptance risk:** User accounts protected only by OIDC session or email/password. Acceptable for early enterprise design-partner phase; not acceptable for general public availability without explicit risk acceptance.  
**Resolution path:** MFA planned for enterprise tier launch.

---

### LC-006 · Large Bundle Sizes (1–1.7 MB) on All Web Apps
**Severity:** Medium  
**Gap reference:** KG024 in KNOWN-GAPS.md  
**Acceptance risk:** First Contentful Paint will be slow on low-bandwidth connections, impacting demo and enterprise evaluation experience.  
**Resolution path:** Code-split heavy components and lazy-load below-fold routes.

---

## NON-BLOCKERS — Accepted Gaps at Launch

The following items are open but **do not block public launch**. They are tracked in KNOWN-GAPS.md with remediation owners and should be resolved in Sprint 3–4.

| Gap | Reason Not Blocking |
|-----|---------------------|
| No E2E test suite (KG010) | Integration smoke tests exist; regression risk accepted for alpha phase |
| No `CODEOWNERS` file (KG013) | Process gap, not a user-facing risk |
| No `security.txt` (VD1) | Disclosure policy documented in SECURITY.md; formal `security.txt` endpoint is hygiene, not a launch blocker |
| No virus scanning on uploads (KG020c) | File upload size limits + metadata validation in place; scanning is defense-in-depth |
| No field-level PII encryption (KG020d) | Database-level encryption in place; field-level encryption is a roadmap item |
| 80+ env vars without formal schema docs (KG018) | OPERATIONS-RUNBOOK.md documents critical vars; full schema is an operational improvement |
| No SLI/SLO definitions (KG023) | Required before enterprise SLA commitments, not for design-partner phase |
| WCAG accessibility not audited (KG025) | Semantic HTML used throughout; full audit is pre-GA requirement |
| SOC 2 Type II not initiated (RD-001) | Post-funding compliance roadmap item |
| No load testing (RD-002) | Replit autoscale handles current expected traffic; load testing is pre-enterprise-scale requirement |
| Android keystore not in EAS (GAP-003) | Mobile builds work; EAS managed keystore is operational improvement |

---

## Sign-Off Required Before Launch

| Blocker | Resolved Date | Resolver | Accepted-Without-Fix (if applicable) | Accepted By |
|---------|--------------|----------|---------------------------------------|------------|
| LB-001 Credential rotation | | | | |
| LB-002 Uptime monitoring | | | | |
| LB-003 Error tracking | | | | |
| LB-004 Production DB separation | | | | |
| LB-005 Production secrets | | | | |
| LB-006 OTEL exporter | | | | |
| LB-007 Legal review of agreements | | | | |
| LC-001 Secret scanning | | | | |
| LC-002 CodeQL SAST | | | | |
| LC-003 Dependency scanning | | | | |
| LC-004 Webhook SSRF | | | | |
| LC-005 MFA | | | | |
| LC-006 Bundle sizes | | | | |

**Final launch authorization:** _________________________ (Stephen Lutar) · Date: _____________

---

*Related: [KNOWN-GAPS.md](KNOWN-GAPS.md) · [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) · [GO_NO_GO_CHECKLIST.md](GO_NO_GO_CHECKLIST.md) · [OPERATIONAL_READINESS_SCORECARD.md](OPERATIONAL_READINESS_SCORECARD.md)*

*Last reviewed: 2026-04-16*
