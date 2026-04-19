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
**Status:** ⚠️ Git history verified clean (Apr-2026) — Firebase Console rotation still required
**Description:** Firebase API keys, Google service account credentials, and related credential files require manual rotation. The April 2026 audit confirmed that committed files are placeholder templates with no live key material, but the original real values may have existed in git history. Until rotation is confirmed against the production Firebase and Google Cloud projects, launch cannot be certified secure.  

**Engineering verification (Apr-2026, recorded by Task #1034):**
- `git log --all --full-history -- '**/google-services.json' '**/GoogleService-Info.plist'` → only two commits ever added these files (`90f3d13e5`, `715786b7f`, both Task #499 EAS prep, Apr 15 2026)
- File contents in those commits inspected via `git show`: every field is a literal `PLACEHOLDER_*` string (no real `api_key`, no real `project_id`, no real `mobilesdk_app_id`)
- `git log --all --full-history -- '**/.env' '**/.env.local' '**/.env.production' '**/.env.prod'` → 0 commits (no `.env*` runtime files in history; only `.env.example` templates are tracked)
- `git log --all -- '**/firebase-adminsdk*.json' '**/serviceAccountKey.json'` → 0 commits (no admin SDK service-account JSON ever committed)
- **Conclusion:** Git history contains no live Firebase or Google Cloud key material. The committed templates are safe to keep.

**Remaining operator action (cannot be performed by engineering):**
- Rotate Firebase Web API key in Firebase Console → Project Settings → General → Web API key (regenerate)
- Rotate any Google Cloud service-account keys referenced by the project (look at IAM → Service Accounts → Keys → "Add key / Disable old key")
- Set the new keys in production secrets (Replit Secrets / Azure Key Vault) — never check them into git
- Record the rotation date and the operator's initials in the sign-off table at the bottom of this file
**Owner:** Stephen Lutar / Security Lead  
**Estimated effort:** Engineering verification ✅ done. Operator rotation: 30–60 minutes.

---

### LB-002 · No External Uptime Monitoring Before First Production Traffic
**Severity:** High  
**Gap reference:** KG027 in KNOWN-GAPS.md  
**Status:** ✅ Code ready — operator setup required (Apr-2026)
**Description:** Health endpoint `GET /api/health` is live and returns structured JSON. Setup guide documented in OPERATIONS-RUNBOOK.md § 5.3. The remaining operator action is provisioning the external monitoring service and routing alerts.  
**What is needed (operator action only):**
- Follow OPERATIONS-RUNBOOK.md § 5.3 "External Uptime Monitoring" — provision Betterstack/UptimeRobot monitor against `GET /api/health`
- Set alert contacts (email, on-call pager) per the alert routing policy in § 5.3
- Set `UPTIME_MONITOR_ID` in production env once monitor is provisioned
- Confirm monitor is live and a test alert fires before any public traffic
**Owner:** Platform / DevOps  
**Estimated effort:** 30–60 minutes (code is done; provisioning only)

---

### LB-003 · No Production Error Tracking (Sentry or Equivalent)
**Severity:** High  
**Gap reference:** KG028 in KNOWN-GAPS.md  
**Status:** ✅ Code ready — DSN setup required (Apr-2026)
**Description:** Sentry Node.js SDK is fully implemented in `artifacts/api-server/src/lib/sentry.ts` with Express integration, PostgreSQL tracing, uncaught exception handling, and PII header scrubbing. `initServerSentry()` is called at server startup. Activates automatically when `SENTRY_DSN` is set.  
**What is needed (operator action only):**
- Create a Sentry project (Node.js) at https://sentry.io
- Set `SENTRY_DSN` in Azure Key Vault or Replit Secrets — see OPERATIONS-RUNBOOK.md § 5.3
- Optionally upload source maps using `sentry-cli` after each production build (instructions in OPERATIONS-RUNBOOK.md § 5.3)
- Verify an error event appears in Sentry dashboard before go-live
**Owner:** Platform / Engineering  
**Estimated effort:** 30–60 minutes (code is done; DSN provisioning and verification only)

---

### LB-004 · Production Database Separate from Development
**Severity:** High  
**Status:** ⛔ Confirm Before Launch (operator action — engineering cannot verify from dev workspace)  
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
**Status:** ⛔ Confirm Before Launch (operator action — engineering cannot inspect production secret store)  

**Engineering verification (Apr-2026, recorded by Task #1034):**
- `git ls-files | grep -E '\.env($|\.)'` returns only `.env.example` files across the monorepo. No `.env`, `.env.local`, or `.env.production` is tracked.
- `git log --all --full-history -- '**/.env' '**/.env.local' '**/.env.production' '**/.env.prod'` returns 0 commits — secrets have never been checked in.


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
**Status:** ✅ Code ready — endpoint setup required (Apr-2026)
**Description:** `initializeOpenTelemetry()` is wired in `index.ts` and supports OTLP, Azure Application Insights, and New Relic exporters. Canonical configuration module at `artifacts/api-server/src/lib/observability.ts`. `validateProductionObservability()` warns at startup if no exporter is configured.  
**What is needed (operator action only):**
- Set `OTEL_EXPORTER_OTLP_ENDPOINT` (Grafana Tempo, Jaeger, Honeycomb, Datadog) **or** `AZURE_APP_INSIGHTS_CONNECTION_STRING` (Azure deploys) in production secrets — see OPERATIONS-RUNBOOK.md § 5.3
- Restart API server and confirm startup log: `[otel] OpenTelemetry initialized: exporters=[otlp:...]`
- Check observability backend for at least one complete request trace before go-live
**Owner:** Platform  
**Estimated effort:** 30–60 minutes (code is done; endpoint setup and verification only)

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
**Note:** Engineering cannot sign off on this item. It requires a human legal review and is listed here so it is not omitted from the launch gate. Counsel review of the customer Data Processing Agreement template is also a SOC 2 Type II observation-window dependency tracked in [SOC2_AUDIT_ENGAGEMENT.md](SOC2_AUDIT_ENGAGEMENT.md) §2.

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
| LB-002 Uptime monitoring | Code wired Apr-2026 | Platform | Operator: provision Betterstack/UptimeRobot | |
| LB-003 Error tracking | Code wired Apr-2026 | Platform | Operator: set SENTRY_DSN | |
| LB-004 Production DB separation | | | | |
| LB-005 Production secrets | | | | |
| LB-006 OTEL exporter | Code wired Apr-2026 | Platform | Operator: set OTEL_EXPORTER_OTLP_ENDPOINT | |
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
