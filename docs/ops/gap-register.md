# SZL Holdings Platform — Gap Register

**Date:** April 19, 2026  
**Derived from:** `artifacts/audit/platform-capability-manifest.json`  
**Owner:** Platform Engineering  
**Audience:** Founder, Engineering Leads, Series A investors conducting technical diligence

> **Consistency rule:** Any capability marked `live` in the manifest does not appear here. Every non-live capability that carries P0–P2 severity is listed below. P3 and informational items appear in the final section.

---

## How to Read This Document

| Priority | Definition |
|---|---|
| **P0 — Launch Blocker** | Active security risk or data exposure — must fix before any investor or press access to the live platform |
| **P1 — Pre-Revenue Blocker** | Must resolve before the first paying tenant is onboarded or the platform goes to a custom domain |
| **P2 — Commercial Readiness** | Should resolve before broad go-to-market; known and managed with compensating controls |
| **P3 — Polish** | Quality improvements; no blocking impact |

---

## P0 — Launch Blockers (2 gaps)

### P0-001 — Firebase / Google Credential Rotation Required
**Manifest ID:** CAP-017  
**Product:** SZL Holdings Mobile (affects all products sharing Firebase project)  
**Status in Manifest:** `broken`  
**Risk:** Mobile credential files (`google-services.json`, `GoogleService-Info.plist`) contain placeholder values, but real credential values may exist in git history. If real credentials were committed at any point, they are compromised and must be rotated immediately.  
**Revenue Impact:** Blocks mobile app deployment to app stores. If compromised credentials are not rotated, a malicious actor could impersonate Firebase services.  
**Current Compensating Control:** Placeholder files confirmed safe in current workspace; .gitignore now hardened.  
**Tracking:** SEC-002, GAP-001, AUDIT_FINDINGS_REGISTER.md  
**Owner:** Founder / DevOps  
**Acceptance Test:** Firebase project credentials rotated, new credential files committed, mobile build completes successfully with new credentials, no historical real values present in git history.

---

### P0-002 — Route Authentication Matrix Not Enforced by CI
**Tracking:** GAP-002 (Security Audit), Series A gap register  
**Product:** API Server  
**Status: ✅ CLOSED** — `route-security-matrix` CI job confirmed present in `.github/workflows/ci.yml` blocking the `ci-gate` job. Runs `--strict-auth` on every PR; fails if any route file is missing auth classification.  
**Note:** This is a CI process gap, not a capability gap. The RBAC capability (CAP-003) is `live`; the gap is that the `route-security-matrix.ts --strict` script exists but is not yet wired into the CI pipeline, meaning new unauthenticated routes can be merged without detection.  
**Risk:** 15/170 top-level route files lack explicit auth middleware. Two routes found without auth enforcement during pen test (FINDING-001, resolved). No CI step automatically detects new routes added without auth. New routes can slip through without enforcement.  
**Revenue Impact:** Auth regression could expose internal APIs to unauthenticated callers as the platform grows.  
**Current Compensating Control:** Manual audit completed; high-risk routes reviewed; `route-security-matrix.ts` script available for on-demand checks.  
**Owner:** Platform Engineering  
**Acceptance Test:** CI script (`src/scripts/route-security-matrix.ts --strict`) runs on every PR and fails if any route file is missing auth classification.

---

## P1 — Pre-Revenue Blockers (9 gaps)

### P1-001 — Stripe Live Key Not Activated; No Paid Tenant Onboarded
**Manifest ID:** CAP-008  
**Product:** API Server / All billing-capable products  
**Status in Manifest:** `partial`  
**Feature Flag:** `live_stripe_billing_enabled` (default OFF) — registered in `platform-flags.ts`. Enable this flag AND configure the secret to activate live billing without any code change.  
**Risk:** Revenue infrastructure is built (Checkout, Subscriptions, Invoicing, Customer Portal) but STRIPE_SECRET_KEY is test-mode only. No real transaction can be processed.  
**Revenue Impact:** Directly blocks any monetization. Critical path to first dollar of ARR.  
**Blocking Dependencies:** STRIPE_SECRET_KEY (live sk_live_...), STRIPE_WEBHOOK_SECRET, Stripe product/price IDs per tier configured.  
**Owner:** Founder / Platform Engineering  
**Acceptance Test:** A test purchase of a Lyte workspace subscription completes end-to-end using a real payment method; webhook fires and subscription record is created.

---

### P1-002 — Email Delivery Not Confirmed Live in Production
**Manifest ID:** CAP-009  
**Product:** API Server / All email-dependent workflows  
**Status in Manifest:** `partial`  
**Feature Flag:** `live_email_delivery_enabled` (default OFF) — registered in `platform-flags.ts`. When this flag is OFF, outbound email is silently dropped with a log warning, preserving demo stability. Enable flag AND set RESEND_API_KEY to activate.  
**Risk:** RESEND_API_KEY not confirmed configured in production secrets. Carlota Jo booking confirmations, platform invite emails, Alloy digest, Pulse subscriptions, and Stripe receipts all fail silently.  
**Revenue Impact:** Breaks every user-facing email touchpoint; unacceptable for any paying tenant.  
**Blocking Dependencies:** RESEND_API_KEY or SENDGRID_API_KEY in Replit production secrets.  
**Owner:** DevOps  
**Acceptance Test:** Inquiry form on Carlota Jo triggers a real email to the submitter's address within 60 seconds.

---

### P1-003 — Production Observability Not Configured (OTEL, Sentry)
**Manifest IDs:** CAP-011, CAP-012  
**Product:** API Server  
**Status in Manifest:** `partial`  
**Feature Flag:** `live_otel_export_enabled` (default OFF) — registered in `platform-flags.ts`. Enable flag AND set OTEL_EXPORTER_OTLP_ENDPOINT to activate live telemetry export.  
**Risk:** OTEL_EXPORTER_OTLP_ENDPOINT and SENTRY_DSN not set in production. Platform is blind to performance regressions, silent errors, and P1 incidents in production.  
**Revenue Impact:** Cannot meet enterprise SLA commitments without production observability. Any outage during a sales cycle is undetected and unmitigated.  
**Blocking Dependencies:** OTEL collector endpoint (New Relic, Grafana Cloud, or Azure Monitor); SENTRY_DSN from a Sentry project.  
**Owner:** Platform Engineering / DevOps  
**Acceptance Test:** API server startup emits OTEL trace to configured collector; a deliberate 500 error in staging appears in Sentry within 30 seconds.

---

### P1-004 — Mapbox Token Not Configured; Maps Render Blank
**Manifest ID:** CAP-049  
**Product:** Terra (Real Estate Intelligence), SZL Holdings Mobile  
**Status in Manifest:** `partial`  
**Feature Flag:** `live_mapbox_tiles_enabled` (default OFF) — registered in `platform-flags.ts`. Enable flag AND set MAPBOX_ACCESS_TOKEN / VITE_MAPBOX_TOKEN to activate live map tiles.  
**Risk:** Mapbox integration code is complete but MAPBOX_ACCESS_TOKEN is not set. The distress property map — the live differentiator of Terra — renders blank. This is visible to any investor or customer opening the Terra dashboard.  
**Revenue Impact:** Terra's entire spatial intelligence thesis fails on first impression without a working map.  
**Blocking Dependencies:** MAPBOX_ACCESS_TOKEN / VITE_MAPBOX_TOKEN from a Mapbox account.  
**Owner:** DevOps  
**Acceptance Test:** Terra distress map renders NYC borough tiles and plots at least one distress marker.

---

### P1-005 — AIS Live Vessel Positions Not Active
**Manifest ID:** CAP-040  
**Product:** Vessels (Maritime Intelligence)  
**Status in Manifest:** `stub`  
**Feature Flag:** `live_ais_feed_enabled` (default OFF) — registered in `platform-flags.ts` and wired into `intelligence-feeds-init.ts`. The FeedScheduler only registers `AISFeedAdapter` when BOTH `AIS_FEED_ENABLED != false` AND this flag is ON. When OFF, vessel positions use seeded/simulated data (demo experience intact). Enable flag AND configure AIS_API_KEY to activate.  
**Risk:** All AIS vessel positions are seeded/simulated. AIS_API_KEY not configured. The demo explicitly acknowledges this to investors but it limits credibility for maritime enterprise prospects.  
**Revenue Impact:** Cannot close a maritime enterprise deal with simulated positions; a key Vessels competitive differentiator is absent.  
**Blocking Dependencies:** Paid AIS data provider contract ($15–40K/yr), AIS_API_KEY.  
**Owner:** Commercial / Founder  
**Acceptance Test:** Fleet dashboard shows real-time position update (lat/lon change) for at least one vessel within a 5-minute polling window.

---

### P1-006 — SSRF Vulnerability on Webhook Delivery URLs
**Manifest ID:** CAP-079  
**Product:** API Server  
**Status: ✅ CLOSED** — `validateExternalUrlSync` from `lib/ssrf-guard.ts` wired as a Zod `.refine()` on the `url` field in both `webhookEndpointSchema` (POST) and `webhookEndpointUpdateSchema` (PATCH). Blocks HTTP, private IPs (10.x, 172.16.x, 192.168.x), loopback (127.x), link-local (169.254.x), and localhost. Non-standard ports also blocked. DNS rebinding protection available via async `validateExternalUrl` in the guard.  
**Status in Manifest:** `partial`  
**Risk:** KG020b open — webhook delivery route does not validate destination URLs against SSRF host blocklist. A malicious tenant could register an internal metadata endpoint as a webhook target.  
**Revenue Impact:** Enterprise security reviews will flag this; blocks SOC 2 Type II audit engagement.  
**Blocking Dependencies:** Host allowlist / blocklist implementation in webhooks.ts.  
**Owner:** Security Engineering  
**Acceptance Test:** Attempt to register `http://169.254.169.254/latest/meta-data/` as a webhook URL returns 400 Bad Request.

---

### P1-007 — MFA Not Implemented
**Manifest ID:** CAP-082  
**Product:** API Server (Auth)  
**Status: ✅ CLOSED** — Full TOTP MFA implemented using `otplib`. New routes: `POST /auth/mfa/setup`, `POST /auth/mfa/enable`, `POST /auth/mfa/challenge`, `DELETE /auth/mfa`, `GET /auth/mfa/status`. Both login paths (`/auth/login` and `/auth/login-password`) check for enabled MFA and return `{mfa_required: true, mfa_challenge_token}` instead of issuing a session; the client then exchanges the challenge token + TOTP code via `/auth/mfa/challenge` to obtain a real session. `mfa_secrets` DB table added to schema; SQL migration `lib/db/drizzle/0072_mfa_secrets.sql` created. All MFA events written to audit trail. `otplib` installed in `@workspace/api-server`.  
**Challenge Token Storage:** MFA challenge tokens are stored in Redis (key `mfac:<token>`, 5-min PX TTL, single-use GET+DEL) when `REDIS_URL` or `AZURE_REDIS_CONNECTION_STRING` is set. Falls back to an in-process Map when Redis is unavailable (acceptable for single-instance Replit deploy; horizontal scaling requires Redis). See `artifacts/api-server/src/routes/auth.ts` — `createMfaChallengeToken` / `consumeMfaChallengeToken`.  
**Status in Manifest:** `stub`  
**Risk:** Single-factor authentication only. Enterprise buyers, CISOs, and regulated sector customers will require MFA as a table-stakes feature.  
**Revenue Impact:** Blocks enterprise sales cycles in financial services, legal, and security sectors.  
**Blocking Dependencies:** TOTP or SMS MFA integration (e.g., speakeasy for TOTP).  
**Owner:** Security Engineering  
**Acceptance Test:** An enterprise user with MFA enforced is prompted for a TOTP code after password authentication; session is not issued without correct code.

---

### P1-008 — CORS_ORIGINS Not Set for Custom Domain
**Manifest ID:** CAP-083  
**Product:** API Server / All web apps  
**Status: ⚠️ CODE READY — awaits DevOps secret update** — CORS middleware in `artifacts/api-server/src/app.ts` already reads from `CORS_ORIGINS` env var (comma-separated, supports `*.` wildcard patterns). At DNS cutover, DevOps must set `CORS_ORIGINS=https://szlholdings.com,https://www.szlholdings.com,https://*.szlholdings.com` in Replit production secrets. No code change needed.  
**Status in Manifest:** `partial`  
**Risk:** CORS_ORIGINS set to `*.replit.app,*.replit.dev,*.repl.co`. When `szlholdings.com` goes live, all cross-origin API calls from the custom domain will fail with CORS errors.  
**Revenue Impact:** The entire platform is broken for any user accessing the custom domain.  
**Blocking Dependencies:** Custom domain DNS cutover, CORS_ORIGINS update in production secrets.  
**Owner:** DevOps  
**Acceptance Test:** All API calls from szlholdings.com return correct `Access-Control-Allow-Origin` headers; no CORS errors in browser console.

---

### P1-009 — GitHub Actions Deploy Automation Not Wired
**Manifest ID:** CAP-085  
**Product:** Infrastructure  
**Status: ⚠️ CODE READY — awaits GitHub secrets** — `deploy-staging.yml` and `deploy-production.yml` both exist and handle missing secrets gracefully (skip with warning instead of fail). Staging deploys on push to main; production deploys on published GitHub Release or `workflow_dispatch` with `confirm=deploy`. DevOps must add `REPLIT_DEPLOY_TOKEN`, `REPLIT_APP_ID`, `REPLIT_STAGING_DEPLOY_TOKEN`, `REPLIT_STAGING_APP_ID` to GitHub → Settings → Environments → staging / production.  
**Status in Manifest:** `partial`  
**Risk:** Staging and production deploy workflows defined but REPLIT_DEPLOY_TOKEN and REPLIT_APP_ID secrets not configured — deployments skipped. No automated deployment path to production.  
**Revenue Impact:** Every production deployment requires manual intervention; introduces risk and slows release cadence.  
**Blocking Dependencies:** REPLIT_DEPLOY_TOKEN, REPLIT_APP_ID, REPLIT_STAGING_DEPLOY_TOKEN, REPLIT_STAGING_APP_ID in GitHub secrets.  
**Owner:** DevOps  
**Acceptance Test:** A merge to main triggers a successful staging deploy within 5 minutes; a published GitHub Release triggers a production deploy with no manual steps.

---

## P2 — Commercial Readiness Gaps (26 gaps)

### Domain: Platform / Infrastructure

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-001 | SCIM provisioning (enterprise SSO) | CAP-013 | partial | Azure AD enterprise tenant, AZURE_AD_TENANT_ID/CLIENT_ID |
| P2-002 | Env var schema documentation (80+ vars) | CAP-086 | partial | Complete ENVIRONMENT_VARIABLES.md; startup validation |
| P2-003 | SLI/SLO definitions | CAP-087 | stub | Definition document + alerting wired to OTEL/Sentry |
| P2-004 | Frontend bundle sizes (1–1.7 MB) | CAP-088 | partial | Code splitting, lazy loading, Lighthouse CI |
| P2-005 | Virus scanning on file uploads | CAP-080 | stub | ClamAV or cloud AV service |
| P2-006 | Field-level PII encryption | CAP-081 | partial | AES or pgp application-layer encryption on PII columns |

### Domain: SZL Holdings Corporate / Lyte

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-007 | Autopilot header stats — hardcoded | CAP-020 | stub | Live Lyte signal aggregation API wiring |
| P2-008 | Client satisfaction scores — hardcoded | CAP-089 | stub | Live survey/CRM data source |
| P2-009 | Distribution OS social publishing — mock mode | CAP-021 | partial | X API, Substack API, LinkedIn API credentials |
| P2-010 | Connector integrations (40+ icons, seeded) | CAP-027 | partial | Per-tenant third-party API credentials |

### Domain: Aegis / Sentra

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-011 | 8 Aegis security modules — UI only, not wired | CAP-031 | partial | Live SIEM connector, case management API |
| P2-012 | CISO Executive Dashboard — not aggregated | CAP-032 | partial | CAP-031 (module data wiring) |
| P2-013 | Sentra live cyber resilience metrics | CAP-037 | stub | Live data engine / SIEM integration |

### Domain: Vessels

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-014 | 3 commercial modules — not DB-connected | CAP-043 | partial | DB schema + seed, freight market data API |
| P2-015 | Maritime insurance module — not fully wired | CAP-044 | partial | Insurance data provider or broker API |
| P2-016 | Chokepoint, geopolitical, port congestion feeds | CAP-045 | stub | Geopolitical/chokepoint data API |

### Domain: Terra

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-017 | Advanced property insights — mock data mode | CAP-050 | partial | Property data enrichment API |
| P2-018 | CoStar MLS integration | CAP-051 | stub | COSTAR_API_KEY, CoStar data subscription |

### Domain: Counsel / PRISM Counsel

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-019 | PRISM Counsel seed script — broken | CAP-062 | broken | Fix seed script for PRISM recovery DB tables |

### Domain: Command / CORTEX

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-020 | CORTEX badge counts — not wired | CAP-057 | stub | Live aggregate count API from each domain |
| P2-021 | Push notification deep linking | CAP-059 | partial | Push notification provider + deep link routing |

### Domain: Pulse

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-022 | Pulse briefings — not connected to live AI | CAP-063 | partial | Live AI model (OpenAI/Anthropic) wired to briefing pipeline |
| P2-023 | Pulse PDF export — not implemented | CAP-064 | stub | Briefing-to-PDF route implementation |
| P2-024 | Pulse email subscription — not wired | CAP-065 | stub | RESEND_API_KEY + daily job |

### Domain: Fund / Corporate

| Gap ID | Capability | Manifest ID | Status | Blocking Dependencies |
|---|---|---|---|---|
| P2-025 | Fund/LP portal — local data only | CAP-023 | partial | Live fund data feed or LP data source |
| P2-026 | Responsible disclosure / security.txt | VD1 (KNOWN-GAPS) | stub | Policy document + .well-known/security.txt |

---

## P3 — Polish (3 gaps)

| Gap ID | Capability | Manifest ID | Status | Notes |
|---|---|---|---|---|
| P3-001 | Mobile custom splash screen and icon | CAP-071 | partial | Design asset + Expo config |
| P3-002 | atlassian-connect package — unscaffolded | CAP-077 | stub | Only needed if Atlassian integration is planned |
| P3-003 | CI pnpm/Node version inconsistency | CI-004 | partial | Integration tests run in different env than unit tests |

---

## Summary Dashboard

| Priority | Count | Shipped to manifest as `live` or `working_demo` |
|---|---|---|
| P0 | 2 | 0 |
| P1 | 9 | 0 |
| P2 | 26 | 0 |
| P3 | 3 | 0 |
| **Total gaps** | **40** | — |
| Capabilities live or working_demo | 50 | 100% consistent (live=28, working_demo=22) |

---

*Generated April 19, 2026 from `artifacts/audit/platform-capability-manifest.json`. Update this register and the manifest together whenever a gap is closed or a new capability is added.*
