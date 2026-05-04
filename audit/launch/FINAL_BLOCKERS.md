# Final Blockers
**SZL Holdings — growth capital Launch Readiness Program**  
**Date:** April 19, 2026  
**Program:** Task #2068 — Phase 12 Final Output

---

## Hard Blockers — Cannot Go Live Without Resolving

### LB-001 — Firebase & Google Credential Rotation

**Severity:** High  
**Owner:** Stephen Lutar (Founder)  
**Effort:** 30–60 minutes  
**Status:** Git history verified clean (no live secrets in committed code). Operator must rotate live Firebase Web API key in Firebase Console.

**What to do:**
1. Log into Firebase Console → Project Settings → General → Web API key → Regenerate
2. Update any Google Cloud service account keys in IAM → Service Accounts → Keys
3. Set new keys in Replit Secrets (never in git)
4. Record rotation date and initials in sign-off table in `LAUNCH_BLOCKERS.md`

---

### LB-002 — No External Uptime Monitoring

**Severity:** High  
**Owner:** Platform / DevOps  
**Effort:** 30–60 minutes  
**Status:** Health endpoint `GET /api/health` is live and working. Needs external monitoring service to be provisioned.

**What to do:**
1. Go to Betterstack (betterstack.com) or UptimeRobot (uptimerobot.com)
2. Create a monitor: HTTP(S) → `https://your-app.replit.app/api/health`
3. Set check interval: every 60 seconds
4. Configure alert contacts: email + Slack webhook
5. Set `UPTIME_MONITOR_ID` in production env
6. Confirm test alert fires successfully

---

### LB-003 — No Production Error Tracking (Sentry)

**Severity:** High  
**Owner:** Platform / Engineering  
**Effort:** 30–60 minutes  
**Status:** Sentry SDK fully implemented in `artifacts/api-server/src/lib/sentry.ts`. Just needs DSN.

**What to do:**
1. Create a Sentry account and project (Node.js) at sentry.io
2. Copy the DSN from Project Settings → Client Keys
3. Set `SENTRY_DSN=<your-dsn>` in Replit Secrets
4. Trigger a test error and verify it appears in Sentry dashboard

---

### LB-004 — Production Database Not Confirmed Separate

**Severity:** High  
**Owner:** Engineering / DevOps  
**Effort:** 2–4 hours  
**Status:** Current environment uses Replit-managed PostgreSQL. Must confirm prod DB is isolated from dev.

**What to do:**
1. Provision a separate PostgreSQL database for production (Replit managed or external)
2. Set `DATABASE_URL` in production Replit Secrets to point to the separate prod DB
3. Run `pnpm db:migrate` against prod DB
4. Verify no demo/seed data exists in prod DB with: `SELECT COUNT(*) FROM decisions WHERE tenant_id = 'org-demo-szl'` (should be 0 unless you seed it intentionally)
5. Run `pnpm seed:demo` only after confirming you want demo data in prod (design-partner phase only)

---

### LB-005 — Production Secrets Not Confirmed Independent

**Severity:** High  
**Owner:** Engineering / DevOps  
**Effort:** 1–2 hours  
**Status:** Development secrets may be shared with production. Each secret must be environment-specific.

**What to do:**
1. Generate a new `SESSION_SECRET` (≥32 random characters) for production
2. Generate a new `SECRET_ENCRYPTION_KEY` for production
3. Generate a new `ALLOY_INTERNAL_TOKEN` (≥64 char hex) for production
4. Generate a new `CONNECTOR_ENCRYPTION_KEY` for production
5. Generate a new `IP_HASH_SALT` for production
6. Generate a new `OAUTH_STATE_SECRET` for production
7. Set all of these in Replit Secrets for the production deployment
8. Confirm none of these match any development values

---

### LB-006 — OTEL Exporter Not Wired to Production

**Severity:** High  
**Owner:** Platform  
**Effort:** 1–2 hours  
**Status:** `initializeOpenTelemetry()` is called at server startup and supports OTLP, Azure Monitor, and New Relic. Just needs endpoint set.

**What to do:**
Option A — Grafana Cloud or hosted OTLP:
1. Create a Grafana Cloud account (free tier available)
2. Get OTLP endpoint from Grafana Cloud → Connections → OpenTelemetry
3. Set `OTEL_EXPORTER_OTLP_ENDPOINT=<endpoint>` in Replit Secrets
4. Set `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <token>` in Replit Secrets

Option B — Azure Monitor:
1. Create an Application Insights resource in Azure
2. Copy the connection string
3. Set `AZURE_APP_INSIGHTS_CONNECTION_STRING=<connection-string>` in Replit Secrets

---

## Conditional Blockers — Require Founder Sign-Off

| ID | Blocker | Recommended Decision |
|---|---|---|
| LC-001 | No CI/CD automated secret scanning | ✅ Accept for design-partner phase |
| LC-002 | CodeQL SAST workflow exists; full verification pending | ✅ Accept for design-partner phase |
| LC-003 | Dependency review workflow exists; full verification pending | ✅ Accept for design-partner phase |
| LC-004 | Webhook SSRF validation absent | ✅ Accept for design-partner phase; Sprint 3 |
| LC-005 | MFA single-factor only | ✅ Accept; plan for enterprise tier |
| LC-006 | SOC 2 Type II audit not engaged | Plan engagement post growth capital close |

**Founder sign-off table:**

| Blocker | Decision | Signed By | Date |
|---|---|---|---|
| LC-001 | ☐ Accept / ☐ Fix | | |
| LC-002 | ☐ Accept / ☐ Fix | | |
| LC-003 | ☐ Accept / ☐ Fix | | |
| LC-004 | ☐ Accept / ☐ Fix | | |
| LC-005 | ☐ Accept / ☐ Fix | | |
| LC-006 | ☐ Accept / ☐ Fix | | |

---

## Post-Launch Backlog (Not Blockers)

| Item | Priority | Sprint |
|---|---|---|
| Carlota Jo Stripe checkout | P1 | Sprint 3 |
| Email delivery (`RESEND_API_KEY`) | P1 | Sprint 3 |
| Live AIS (`MARINETRAFFIC_API_KEY`) | P2 | Sprint 3 |
| Pulse PDF export | P2 | Sprint 3 |
| SSRF webhook validation | P2 | Sprint 3 |
| Vessels commercial modules wiring | P2 | Sprint 3–4 |
| Aegis CISO KPI aggregation | P2 | Sprint 3 |
| Terra ETL health monitor UI | P2 | Sprint 3 |
| CISA KEV / NVD polling activation | P3 | Sprint 4 |
| SIEM connector reference implementation | P2 | Sprint 4 |
| OpenAPI portal at `/api/docs` | P3 | Sprint 4 |
| Redis cache configuration | P3 | Sprint 4 |
| Lighthouse CI performance guard | P2 | Sprint 4 |
| SOC 2 Type II audit engagement | P2 | Post growth capital |
