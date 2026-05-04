# Next Steps for Operator
**SZL Holdings — growth capital Launch Readiness Program**  
**Date:** April 19, 2026  
**Audience:** Stephen Lutar (Founder) and any technical operator executing the publish  
**Purpose:** Exact 10-step sequence to go live on Replit

---

## The 10 Steps to Publish

### Step 1 — Rotate Firebase & Google Credentials
**Time:** 30–60 minutes  
**Owner:** Stephen Lutar (LB-001)

1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Project Settings → General → Web API Key → **Regenerate**
2. Go to [Google Cloud Console](https://console.cloud.google.com) → IAM & Admin → Service Accounts → Find any keys used by this project → Add Key → Disable old key
3. **Do not commit the new keys.** Set them as Replit Secrets in Step 3.
4. Record: `Credentials rotated on [DATE] by [INITIALS]` — add to `LAUNCH_BLOCKERS.md` sign-off table.

---

### Step 2 — Generate Production Secrets
**Time:** 30 minutes  
**Owner:** Engineering

Generate unique values for each of the following. Use a password manager or `openssl rand -hex 32` in a terminal:

```bash
# Generate secrets (run locally, never commit these)
openssl rand -hex 32   # SESSION_SECRET (32+ chars)
openssl rand -hex 32   # SECRET_ENCRYPTION_KEY (32+ chars)
openssl rand -hex 64   # ALLOY_INTERNAL_TOKEN (64+ chars)
openssl rand -hex 32   # CONNECTOR_ENCRYPTION_KEY (32+ chars)
openssl rand -hex 32   # IP_HASH_SALT (32+ chars)
openssl rand -hex 32   # OAUTH_STATE_SECRET (32+ chars)
```

Record each value in your password manager. Proceed to Step 3.

---

### Step 3 — Set All Production Secrets in Replit
**Time:** 15 minutes  
**Owner:** Engineering / Founder

In the Replit Secrets panel, set:

| Secret | Value |
|---|---|
| `DATABASE_URL` | Production DB URL (from Step 4) |
| `SESSION_SECRET` | Generated in Step 2 |
| `SECRET_ENCRYPTION_KEY` | Generated in Step 2 |
| `ALLOY_INTERNAL_TOKEN` | Generated in Step 2 |
| `CONNECTOR_ENCRYPTION_KEY` | Generated in Step 2 |
| `IP_HASH_SALT` | Generated in Step 2 |
| `OAUTH_STATE_SECRET` | Generated in Step 2 |
| `ADMIN_PIN` | Your chosen admin PIN (hashed) |
| `ISSUER_URL` | `https://your-app.replit.app` |
| `PUBLIC_APP_URL` | `https://your-app.replit.app` |
| `CORS_ORIGINS` | `https://your-app.replit.app` |
| `NODE_ENV` | `production` |
| `SENTRY_DSN` | From Step 6 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | From Step 7 |
| Firebase Web API Key | Rotated in Step 1 |

---

### Step 4 — Confirm Production Database
**Time:** 2–4 hours  
**Owner:** Engineering (LB-004)

1. Provision a separate PostgreSQL database for production (Replit managed, or external like Supabase/Neon)
2. Get the `DATABASE_URL` connection string
3. Set it in Replit Secrets (Step 3)
4. Run migrations against it:
   ```bash
   pnpm db:migrate
   ```
5. Verify it's healthy: `curl $PROD_URL/api/health/detailed`
6. **Do NOT run `seed:demo` in production unless explicitly intended**

---

### Step 5 — Provision Uptime Monitoring
**Time:** 30 minutes  
**Owner:** Platform / DevOps (LB-002)

1. Go to [Betterstack](https://betterstack.com) or [UptimeRobot](https://uptimerobot.com)
2. Create new monitor: HTTP(S) → `https://your-app.replit.app/api/health`
3. Check interval: 60 seconds
4. Add alert contact: your email + Slack webhook
5. Click "Test alert" — confirm you receive it
6. Set `UPTIME_MONITOR_ID` in Replit Secrets

---

### Step 6 — Set Up Sentry Error Tracking
**Time:** 30 minutes  
**Owner:** Platform / Engineering (LB-003)

1. Create a [Sentry](https://sentry.io) account and Node.js project
2. Copy your DSN from Project Settings → Client Keys → DSN
3. Set `SENTRY_DSN=<your-dsn>` in Replit Secrets (Step 3)
4. After deploy, verify: trigger a test error → confirm it appears in Sentry

---

### Step 7 — Set Up Production Observability (OTEL)
**Time:** 1 hour  
**Owner:** Platform (LB-006)

Option A — [Grafana Cloud](https://grafana.com/products/cloud/) (free tier available):
1. Create account → Connections → OpenTelemetry → Get endpoint + token
2. Set `OTEL_EXPORTER_OTLP_ENDPOINT=<endpoint>` in Replit Secrets
3. Set `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-token>` in Replit Secrets

Option B — Azure Monitor:
1. Create Application Insights resource
2. Copy connection string
3. Set `AZURE_APP_INSIGHTS_CONNECTION_STRING=<string>` in Replit Secrets

---

### Step 8 — Click Publish in Replit
**Time:** 5 minutes

1. Confirm all secrets from Steps 2–7 are set
2. In Replit, click **Publish** (or use the deployment workflow)
3. Wait for all workflows to show RUNNING status
4. Open `https://your-app.replit.app/api/health` → confirm 200 response

---

### Step 9 — Run Post-Deploy Smoke Tests
**Time:** 20 minutes

```bash
# In your terminal or Replit shell
BASE_URL="https://your-app.replit.app"

# Health check
curl -f "$BASE_URL/api/health"

# Route smoke
node scripts/qa/smoke-routes.js

# Link check
node scripts/qa/check-links.js
```

Also manually verify:
- [ ] Sign in → dashboard loads
- [ ] Navigate to `/command/demo` → Demo Launchpad loads
- [ ] Click Reset Demo → completes in ~8 seconds
- [ ] Decision Twin at `/lyte/decision-twin` works
- [ ] Policy Compiler at `/command/operations/alloy/policy-compiler` works

---

### Step 10 — Sign Off and Invite First Design Partner
**Time:** 1–2 hours

1. Complete the sign-off table in `GO_NO_GO_CHECKLIST.md` (all mandatory items)
2. Complete the conditional blocker sign-off table in `FINAL_BLOCKERS.md`
3. Record all values in `LAUNCH_BLOCKERS.md` sign-off section
4. Send your first design partner a demo invite
5. Schedule your first investor demo

---

## Quick Reference Commands

```bash
# Verify environment before publish
pnpm typecheck && pnpm lint && pnpm test

# Run database migrations
pnpm db:migrate

# Seed demo org (design-partner environments only)
pnpm seed:demo

# Post-deploy smoke
node scripts/qa/smoke-routes.js && curl $BASE_URL/api/health

# Full audit check
pnpm audit:all

# Health check
node scripts/qa/health-check.js

# Release checklist
cat launch/release/release_checklist.md

# View this file again
cat launch/NEXT_STEPS_FOR_OPERATOR.md
```

---

## Emergency Contacts and Rollback

- **Fastest rollback:** Replit History → Restore checkpoint (2–5 minutes, includes DB snapshot)
- **Incident playbook:** `launch/release/incident_runbook.md`
- **Rollback runbook:** `launch/release/rollback_runbook.md`
- **Known gaps:** `KNOWN-GAPS.md`
- **Hard blockers:** `FINAL_BLOCKERS.md`

---

**You are ready. Go with confidence.**
