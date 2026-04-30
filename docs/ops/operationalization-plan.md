# SZL Holdings Platform — Operationalization Plan

**Date:** April 19, 2026  
**Derived from:** `artifacts/audit/platform-capability-manifest.json`, `docs/ops/gap-register.md`  
**Owner:** Platform Engineering  
**Audience:** Engineering leads, incoming VP Engineering, DevOps  

> This document maps every gap from the gap register to the exact code modules, migrations, environment variables, external services, and acceptance tests required to close it. Items are ordered by priority. Do not begin commercial onboarding until all P0 and P1 items are closed.

---

## P0 — Close Immediately

### P0-001: Firebase / Google Credential Rotation

**Gap:** SEC-002 — real credential values may exist in git history; placeholder files in mobile artifact  
**Code Modules Affected:**
- `artifacts/szl-holdings-mobile/google-services.json` (Android)
- `artifacts/szl-holdings-mobile/GoogleService-Info.plist` (iOS)
- Any Firebase Admin SDK usage in `artifacts/api-server/src/`

**Migration Required:** None (no DB change)  
**Environment Variables:** Firebase project API key, App ID, messaging sender ID, storage bucket (replace placeholder values in Replit secrets and EAS secrets)

**External Services:** Firebase console (https://console.firebase.google.com) — rotate API keys and regenerate service account credentials

**Steps:**
1. Audit git history: `git log --all --full-history -- '*google-services.json' '*GoogleService-Info.plist'` — confirm no real values in history
2. If real values found in history: rotate all Firebase credentials in Firebase Console; generate new `google-services.json` and `GoogleService-Info.plist`
3. Store new credential files as Replit Secrets and EAS secrets (never commit)
4. Update `.gitignore` entries to block future commits of credential files
5. Rebuild mobile app with new credentials: `eas build --platform all`

**Acceptance Test:** 
- `git log --all -S "AIza"` returns no results (no Firebase API keys in history)
- Mobile app authenticates successfully using new credentials
- Firebase console shows no unauthorized API key usage

**Effort Estimate:** 2–4 hours (manual + build time)

---

### P0-002: Route Auth Matrix CI Enforcement

**Gap:** GAP-002 — no automated CI detection of routes missing auth  
**Code Modules Affected:**
- `artifacts/api-server/src/scripts/route-security-matrix.ts` (exists — needs CI integration)
- `.github/workflows/ci.yml`

**Migration Required:** None  
**Environment Variables:** None  
**External Services:** None

**Steps:**
1. Verify `route-security-matrix.ts --strict` script runs cleanly against current codebase
2. Add a `route-auth-matrix` job to `.github/workflows/ci.yml`:
   ```yaml
   route-auth-matrix:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: pnpm/action-setup@v4
       - run: pnpm --filter @workspace/api-server exec ts-node src/scripts/route-security-matrix.ts --strict
   ```
3. Confirm job fails if an unauthenticated route is added
4. Document auth classification requirements in `CONTRIBUTING.md`

**Acceptance Test:**
- Adding a new route file without auth middleware causes CI to fail with a clear error message
- All current routes pass the `--strict` check

**Effort Estimate:** 2 hours

---

## P1 — Close Before First Paying Tenant

### P1-001: Stripe Live Key Activation

**Gap:** Billing infrastructure built; test-mode only; no live transactions possible  
**Code Modules Affected:**
- `artifacts/api-server/src/routes/billing.ts`
- `artifacts/api-server/src/routes/metering/`
- All Stripe webhook handlers

**Migration Required:** None (schema exists; `stripe_subscriptions` table already in DB)  
**Environment Variables (production secrets):**
- `STRIPE_SECRET_KEY` → `sk_live_...` from Stripe Dashboard
- `STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- `STRIPE_WEBHOOK_SECRET` → from Stripe webhook endpoint registration
- Per-product Price IDs: `STRIPE_PRICE_LYTE_STARTER`, `STRIPE_PRICE_LYTE_ENTERPRISE`, `STRIPE_PRICE_AEGIS_ENTERPRISE`, `STRIPE_PRICE_VESSELS_ENTERPRISE`, `STRIPE_PRICE_TERRA_ENTERPRISE`

**External Services:**
- Stripe Dashboard: create Products and Prices per tier; register webhook endpoint pointing to `/api/billing/webhook`
- Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

**Steps:**
1. Create Stripe products and prices in live mode for each domain tier
2. Register webhook endpoint at `/api/billing/webhook` in Stripe Dashboard
3. Set all live Stripe secrets in Replit production secrets
4. Run end-to-end test: checkout → payment → subscription creation → portal access
5. Verify webhook handler creates subscription record in DB

**Acceptance Test:**
- A $1 test charge on a real card completes successfully
- Subscription record appears in `stripe_subscriptions` table with `status: active`
- Customer Portal accessible via `/billing/portal`

**Effort Estimate:** 4–6 hours

---

### P1-002: Email Delivery Live Configuration

**Gap:** RESEND_API_KEY not confirmed set; email workflows silent-fail  
**Code Modules Affected:**
- `artifacts/api-server/src/lib/email.ts`
- `artifacts/api-server/src/routes/alloy-email.ts`
- `artifacts/carlota-jo/src/` (inquiry form)
- `artifacts/api-server/src/routes/notifications.ts`

**Migration Required:** None  
**Environment Variables:**
- `RESEND_API_KEY` → from Resend dashboard (https://resend.com)
- `FROM_EMAIL` → verified sender address (e.g., platform@szlholdings.com)
- SPF/DKIM DNS records on sending domain

**External Services:**
- Resend: verify sending domain, generate API key
- DNS: add SPF/DKIM/DMARC records for email deliverability

**Steps:**
1. Create Replit secret: `RESEND_API_KEY`
2. Add DNS records for sending domain SPF/DKIM
3. Test inquiry form on Carlota Jo — confirm email arrives
4. Test Alloy digest email — confirm HTML template renders correctly
5. Test Stripe receipt email (post P1-001)

**Acceptance Test:**
- Carlota Jo inquiry form triggers email to submitter within 60 seconds
- Email HTML renders correctly in Gmail and Outlook (use Email on Acid or Litmus)
- SPF/DKIM/DMARC pass on email headers

**Effort Estimate:** 3 hours

---

### P1-003: Production Observability (OTEL + Sentry)

**Gap:** OBS-001, OBS-002 — blind to production errors and performance  
**Code Modules Affected:**
- `artifacts/api-server/src/lib/observability.ts` (exists — initializeOpenTelemetry())
- `artifacts/api-server/src/index.ts` (OTEL init already wired)

**Migration Required:** None  
**Environment Variables:**
- **Option A (recommended):** `OTEL_EXPORTER_OTLP_ENDPOINT` → New Relic, Grafana Cloud, or Honeycomb OTLP endpoint
- **Option B:** `AZURE_APP_INSIGHTS_CONNECTION_STRING` → Azure Monitor
- `SENTRY_DSN` → from Sentry project settings
- `LOG_LEVEL=info` for production

**External Services:**
- Sentry: create project at https://sentry.io, get DSN
- OTEL collector: sign up for Grafana Cloud (free tier available) or New Relic (free tier 100GB/month)

**Steps:**
1. Create Sentry project for `api-server` (type: Node.js)
2. Set `SENTRY_DSN` in Replit production secrets
3. Sign up for Grafana Cloud; get OTLP endpoint and API key
4. Set `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` in production secrets
5. Restart API server; verify startup log: "OpenTelemetry initialized"
6. Trigger a deliberate 500 error in staging; confirm it appears in Sentry

**Acceptance Test:**
- Sentry receives first error event within 2 minutes of deployment
- OTEL trace for `GET /api/health` visible in Grafana
- `validateProductionObservability()` startup check passes without warnings

**Effort Estimate:** 3 hours

---

### P1-004: Mapbox Token Configuration

**Gap:** Maps render blank in Terra and Mobile  
**Code Modules Affected:**
- `artifacts/terra/src/` (map component using VITE_MAPBOX_TOKEN)
- `artifacts/szl-holdings-mobile/app/(shell)/properties/` (map screens)

**Migration Required:** None  
**Environment Variables:**
- `VITE_MAPBOX_TOKEN` → from Mapbox account dashboard (https://account.mapbox.com)
- `MAPBOX_ACCESS_TOKEN` → same value for server-side use

**External Services:**
- Mapbox: create account, generate access token with `styles:read` and `tiles:read` scopes

**Steps:**
1. Create Mapbox account and generate access token
2. Set `VITE_MAPBOX_TOKEN` in Replit secrets (for all Terra/web builds)
3. Set `MAPBOX_ACCESS_TOKEN` for API server map-adjacent endpoints
4. Rebuild Terra artifact: `pnpm --filter @workspace/terra build`
5. Verify NYC distress map renders and plots markers

**Acceptance Test:**
- Terra distress map renders NYC borough tiles at zoom level 12
- At least one distress marker (lis pendens or tax lien) is visible on the map
- Mobile property map renders without error

**Effort Estimate:** 1 hour

---

### P1-005: AIS Live Vessel Positions

**Gap:** AIS positions simulated; no live feed  
**Code Modules Affected:**
- `artifacts/api-server/src/routes/vessels-live.ts`

**Migration Required:** None (seed data replaces with live data)  
**Environment Variables:**
- `AIS_API_KEY` → from chosen AIS provider

**External Services:**
- AIS Provider — options: MarineTraffic ($15K/yr), VesselFinder ($8K/yr), or exactEarth ($40K/yr for full coverage
- Choose tier based on fleet size and coverage requirements

**Steps:**
1. Select and contract with AIS data provider
2. Obtain API credentials and rate limits
3. Update `vessels-live.ts` to call real AIS REST/WebSocket API using `AIS_API_KEY`
4. Set AIS_API_KEY in Replit secrets
5. Implement graceful fallback to seed data if AIS API is unavailable
6. Add "Live" badge to fleet dashboard when real AIS feed is active

**Acceptance Test:**
- Fleet dashboard shows vessel position update within 5-minute polling interval
- "Live" badge appears on AIS positions
- If AIS API goes down, fleet dashboard gracefully falls back to last-known positions with "Delayed" label

**Effort Estimate:** 1–2 days (contract + integration)

---

### P1-006: SSRF Protection on Webhook URLs

**Gap:** KG020b — no host validation on webhook delivery  
**Code Modules Affected:**
- `artifacts/api-server/src/routes/webhooks.ts`

**Migration Required:** None  
**Environment Variables:** None  
**External Services:** None

**Steps:**
1. Add `validateWebhookUrl(url: string)` helper:
   ```typescript
   import { URL } from 'url';
   const BLOCKED_HOSTS = ['169.254.', '10.', '192.168.', '127.', 'localhost'];
   function validateWebhookUrl(url: string): boolean {
     const parsed = new URL(url);
     return parsed.protocol === 'https:' && 
       !BLOCKED_HOSTS.some(b => parsed.hostname.startsWith(b));
   }
   ```
2. Call `validateWebhookUrl` before saving or delivering to any webhook URL
3. Return `400 Bad Request` with message `"Webhook URL targets a disallowed host"` on failure
4. Add Zod refinement to webhook registration schema

**Acceptance Test:**
- `POST /api/webhooks { url: "http://169.254.169.254/meta-data/" }` returns 400
- `POST /api/webhooks { url: "https://example.com/hook" }` succeeds
- Internal RFC1918 addresses (10.x, 172.16.x, 192.168.x) are blocked

**Effort Estimate:** 2 hours

---

### P1-007: MFA Implementation

**Gap:** SEC-009 — single-factor auth; blocks enterprise sales  
**Code Modules Affected:**
- `artifacts/api-server/src/routes/auth.ts`
- `artifacts/api-server/src/db/schema.ts` (new `mfa_secrets` table)
- Frontend auth flow in `artifacts/szl-holdings/src/`

**Migration Required:**
```sql
CREATE TABLE mfa_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Environment Variables:** None  
**External Services:** None (TOTP is server-side; recommended library: `speakeasy`)

**Steps:**
1. Install `speakeasy` and `qrcode` packages in api-server
2. Add migration for `mfa_secrets` table
3. Add `POST /api/auth/mfa/setup` — generates TOTP secret, returns QR code URI
4. Add `POST /api/auth/mfa/verify` — validates 6-digit TOTP code, enables MFA for user
5. Add MFA challenge step after password auth: if user has MFA enabled, return `mfa_required: true` in login response and require TOTP verification before issuing session
6. Add MFA setup UI to user settings in szl-holdings frontend
7. Add admin ability to require MFA for all users in an organization

**Acceptance Test:**
- User with MFA enabled cannot obtain a session without entering correct TOTP
- QR code scans correctly in Google Authenticator or Authy
- Admin can enforce MFA org-wide; users without MFA set up are redirected to setup on login

**Effort Estimate:** 1–2 days

---

### P1-008: CORS_ORIGINS for Custom Domain

**Gap:** GAP-004 — CORS will break at DNS cutover  
**Code Modules Affected:**
- `.replit` (production userenv section)
- `artifacts/api-server/src/index.ts` or middleware that reads CORS_ORIGINS

**Migration Required:** None  
**Environment Variables:**
- `CORS_ORIGINS` → `https://szlholdings.com,https://www.szlholdings.com,https://*.szlholdings.com`

**External Services:** DNS provider for szlholdings.com

**Steps:**
1. Before DNS cutover: update `CORS_ORIGINS` in Replit production secrets to include custom domain
2. Verify CORS config reads the env var (not a hardcoded list)
3. Test: `curl -H "Origin: https://szlholdings.com" https://api.szlholdings.com/api/health -v` — confirm `Access-Control-Allow-Origin` in response

**Acceptance Test:**
- All API calls from `https://szlholdings.com` return correct CORS headers
- No CORS errors in Chrome DevTools console when accessing platform on custom domain

**Effort Estimate:** 30 minutes (configuration only)

---

### P1-009: GitHub Actions Deploy Automation

**Gap:** Deploy workflows defined but secrets not configured  
**Code Modules Affected:**
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

**Migration Required:** None  
**Environment Variables (GitHub Secrets, not Replit):**
- `REPLIT_DEPLOY_TOKEN` → from Replit Deployments settings
- `REPLIT_APP_ID` → from Replit app settings
- `REPLIT_STAGING_DEPLOY_TOKEN`
- `REPLIT_STAGING_APP_ID`

**External Services:** Replit Deployments API

**Steps:**
1. In Replit: enable autoscale deployment, copy deploy token from settings
2. In GitHub: `Settings → Secrets → Actions` — add all four secrets
3. Trigger staging deploy: push a commit to main, verify deploy-staging.yml completes
4. Trigger production deploy: publish a GitHub Release, verify deploy-production.yml completes with `confirm="deploy"`

**Acceptance Test:**
- Push to main → staging deploys within 5 minutes with no manual intervention
- Published release → production deploys within 5 minutes
- Rollback: revert commit to main → previous version auto-deploys

**Effort Estimate:** 2 hours

---

## P2 — Commercial Readiness (detailed remediation notes)

### Infrastructure

| Gap | Module | Steps | Env Vars | External Service | Acceptance Test |
|---|---|---|---|---|---|
| P2-001 SCIM | `routes/scim.ts` | Test SCIM endpoint with Azure AD enterprise test tenant; add `X-SCIM-Schema` headers per RFC 7644 | `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` | Azure AD enterprise tenant (Microsoft 365 E3/E5) | User provisioned via Azure AD SCIM appears in `users` table within 60s |
| P2-002 Env var schema | `ENVIRONMENT_VARIABLES.md` | Audit all 80+ vars; document type, required/optional, default, example; add `validateEnvVars()` check to API server startup | None | None | `pnpm --filter @workspace/api-server exec ts-node src/scripts/validate-env.ts` exits 0 |
| P2-003 SLI/SLO | `docs/ops/sli-slo.md` (create) | Define: API p99 latency <500ms, DB query <100ms, uptime >99.9%, auth success rate >99.95% | None | OTEL collector + alerting rules | Alert fires in Grafana when p99 exceeds threshold for 2 minutes |
| P2-004 Bundle size | All web artifacts | Add `rollup-plugin-visualizer`; implement React.lazy for routes; set up Lighthouse CI action | None | None | Lighthouse CI reports LCP <2.5s, bundle <500KB for main chunk |
| P2-005 Virus scan | `lib/virusScan.ts` | Integrate ClamAV via `clamscan` npm or cloud AV (e.g., Metadefender) | `CLAMAV_HOST` or cloud AV key | ClamAV (self-hosted) or Metadefender | Uploading EICAR test file to `/api/files` returns 400 |
| P2-006 PII encryption | `db/schema.ts` | Identify PII columns (name, email, phone, address in CRM/vessels/terra); apply AES-256-GCM at application layer before DB write | `DB_ENCRYPTION_KEY` | None | DB dump shows ciphertext for PII fields; decryption returns plaintext only via API |

### SZL Holdings / Lyte

| Gap | Module | Steps | Env Vars | External Service | Acceptance Test |
|---|---|---|---|---|---|
| P2-007 Autopilot stats | `artifacts/szl-holdings/src/` (header) | Wire to `/api/lyte/autopilot-stats` endpoint; aggregate from Alloy workflow data | None | None | Header stats update on page refresh with real approval queue counts |
| P2-008 Client scores | `artifacts/szl-holdings/src/` (Forge) | Integrate survey response API (Typeform or in-platform survey) | Survey provider API key | Typeform or similar | Satisfaction score derived from real survey responses |
| P2-009 Distribution OS | `artifacts/szl-holdings/src/pages/distribution-os/settings-page.tsx` | Implement OAuth flow for X, LinkedIn, Substack; store tokens per-user; replace mock mode flag | `X_API_KEY`, `LINKEDIN_CLIENT_ID`, `SUBSTACK_API_KEY` | X Developer, LinkedIn Developer, Substack | A post drafted in Distribution OS publishes to X with visible tweet URL |
| P2-010 Connectors | `routes/connectors.ts`, `alloy-integrations.ts` | Per-tenant OAuth token storage for each connector; test connection flows; remove API-003 stub | Per-connector OAuth credentials | Various (Slack, Jira, Salesforce, etc.) | Slack connector shows real channel list after OAuth |

### Aegis / Sentra

| Gap | Module | Steps | Env Vars | External Service | Acceptance Test |
|---|---|---|---|---|---|
| P2-011 8 Aegis modules | `routes/aegis-modules.ts`, `artifacts/aegis/src/pages/` | Write DB schema and seed for each module; wire API endpoints; connect to `/api/aegis/*` | None | Live SIEM for full activation | Each module page shows real DB-backed data |
| P2-012 CISO Dashboard | `artifacts/aegis/src/` | Aggregate KPIs from wired modules (P2-011 dependency); build summary route `/api/aegis/ciso-kpis` | None | None | CISO dashboard reflects counts from real module data |
| P2-013 Sentra metrics | `artifacts/sentra/src/`, API server | Create `/api/sentra/posture` endpoint; wire to Aegis signal data or SIEM | `SIEM_API_KEY` | SIEM (Splunk/Sentinel) | Sentra landing page shows real containment time derived from incident data |

### Vessels

| Gap | Module | Steps | Env Vars | External Service | Acceptance Test |
|---|---|---|---|---|---|
| P2-014 Commercial modules | `routes/vessels-platform.ts`, `vessels-trading.ts`, `artifacts/vessels/src/` | Write DB migrations for charter/freight tables; seed with realistic data; wire list/CRUD routes | None | Freight market data API for benchmarks | Charter management page shows DB-backed charter agreements |
| P2-015 Maritime insurance | `routes/vessels-insurance.ts` | Wire insurance premium calculation to underwriting API or rules engine | `MARINE_INSURANCE_API_KEY` | Marine insurance data provider | Insurance module shows real P&I club rates |
| P2-016 Geo/chokepoint feeds | `artifacts/vessels/src/` | Integrate geopolitical event API (GDELT or similar); wire to system health panel | `GDELT_API_KEY` (or free GDELT) | GDELT (free) or premium geo-risk provider | Chokepoint status shows "Live" in system health panel |

### Terra

| Gap | Module | Steps | Env Vars | External Service | Acceptance Test |
|---|---|---|---|---|---|
| P2-017 Property insights | `lib/domain-services/terra/index.ts` | Integrate property data enrichment API; remove dataMode: 'mock' gate; return real data for any address | `PROPERTY_DATA_API_KEY` | Attom Data or similar | Climate risk score returned for a non-seed property address |
| P2-018 CoStar | `routes/terra.ts` (market data section) | Implement CoStar API client; wire to market comps and listing data endpoints | `COSTAR_API_KEY` | CoStar Group (subscription) | Market comps page shows real CoStar listing data |

### Counsel

| Gap | Module | Steps | Env Vars | External Service | Acceptance Test |
|---|---|---|---|---|---|
| P2-019 Counsel seed | `scripts/seed-prism-counsel.ts` | Fix broken migration for recovery tables; run `pnpm db:push`; verify seed completes | `DATABASE_URL` | None | `node scripts/seed-prism-counsel.ts` exits 0; Counsel dashboard renders matter data |

### Command / CORTEX

| Gap | Module | Steps | Env Vars | External Service | Acceptance Test |
|---|---|---|---|---|---|
| P2-020 Badge counts | `artifacts/command/src/` | Implement `/api/command/badge-counts` aggregation endpoint; poll from all domains; wire to sidebar | None | None | Command sidebar badges update within 30s of a new incident in Aegis |
| P2-021 Push deep linking | `routes/push-notifications.ts`, `artifacts/command/src/` | Map push notification payload action fields to app routes; implement `handleNotificationResponse` in Command | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Web Push (VAPID) | Clicking a push notification for a new incident navigates directly to that incident in Command |

### Pulse

| Gap | Module | Steps | Env Vars | External Service | Acceptance Test |
|---|---|---|---|---|---|
| P2-022 Live briefings | `routes/briefings.ts`, `routes/executive-briefings.ts` | Wire `/api/briefing/today` to real AI completion call (OpenAI gpt-4o or Anthropic claude-3-5-sonnet); pass platform context as system prompt | `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit AI Integrations proxy | Today's brief returns AI-generated content with correct date and real signal references |
| P2-023 Pulse PDF | `artifacts/pulse/src/`, `routes/exports.ts` | Implement `GET /api/pulse/briefings/:id/pdf` using pdfkit with Pulse branded template; wire from Pulse UI download button | None | None | PDF download from Pulse reader produces a valid, branded PDF with full briefing content |
| P2-024 Email subscription | `routes/newsletter.ts`, scheduled jobs | Add Pulse subscription table; implement daily cron job that generates briefing and sends via Resend | `RESEND_API_KEY` | Resend, node-cron or pg-boss | Subscribed email receives daily briefing at 7:00 AM ET |

---

## Cross-Cutting Items

### Environment Variables Master Checklist

All secrets required for P0/P1 closure:

| Secret | Replit Secret | GitHub Secret | Priority |
|---|---|---|---|
| Firebase credential files | EAS secrets only | No | P0 |
| `STRIPE_SECRET_KEY` (live) | Yes | No | P1 |
| `STRIPE_WEBHOOK_SECRET` | Yes | No | P1 |
| `RESEND_API_KEY` | Yes | No | P1 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Yes | No | P1 |
| `SENTRY_DSN` | Yes | No | P1 |
| `VITE_MAPBOX_TOKEN` | Yes | No | P1 |
| `MAPBOX_ACCESS_TOKEN` | Yes | No | P1 |
| `CORS_ORIGINS` (custom domain) | Yes | No | P1 |
| `REPLIT_DEPLOY_TOKEN` | No | Yes | P1 |
| `REPLIT_APP_ID` | No | Yes | P1 |
| `AIS_API_KEY` | Yes | No | P1 (commercial) |

### Database Migrations Required

| Migration | Priority | File Location |
|---|---|---|
| `mfa_secrets` table for TOTP | P1 | Add to `artifacts/api-server/src/db/schema.ts` |
| Charter/freight tables for Vessels commercial modules | P2 | New migration in `artifacts/api-server/src/db/migrations/` |
| Sentra posture metrics table | P2 | New migration |
| PII column encryption flag | P2 | Schema update + data migration |

### Acceptance Test Suite Extensions

The E2E spec at `tests/e2e/governed-decision-loop.spec.ts` should be extended with:
1. Stripe checkout flow (P1-001)
2. Auth → MFA challenge → session (P1-007)
3. Webhook SSRF rejection (P1-006)
4. CORS preflight from custom domain (P1-008)
5. Terra map rendering (P1-004)

---

*Generated April 19, 2026. Update this plan as gaps are closed — mark each item Done with the closing commit SHA and update the manifest status to `live`.*
