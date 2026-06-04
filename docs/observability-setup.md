# SZL Holdings — Observability Setup Guide

_Updated: April 2026_

This guide covers two required observability setups before the first enterprise pilot:

1. **Sentry error tracking** — captures server-side exceptions and frontend JavaScript errors
2. **External uptime monitoring** — detects infrastructure-level outages from outside the deployment

---

## 1. Sentry Error Tracking

### What is integrated

| Layer | Artifact | Status |
|-------|----------|--------|
| API server (Node.js) | `artifacts/api-server` | SDK installed, `initServerSentry()` called at startup |
| Frontend — SZL Holdings | `artifacts/szl-holdings` | `initSentry({ appSlug: "szl-holdings" })` in `main.tsx` |
| Frontend — Command | `artifacts/command` | `initSentry({ appSlug: "command" })` in `main.tsx` |
| Frontend — Vessels | `artifacts/vessels` | `initSentry({ appSlug: "vessels" })` in `main.tsx` |

All integrations are **graceful**: if the DSN is not set, they log a debug message and continue normally. There is no startup crash risk.

### Setup steps

#### Step 1: Create a Sentry account and project

1. Go to [sentry.io](https://sentry.io) and sign up (Developer plan is free — 5,000 errors/month included).
2. Create a new **Organization** (e.g., `szl-holdings`).
3. Create a **Project** for Node.js (for the API server). Click "Create Project" → select "Node.js" → name it `szl-api`.
4. Optionally create a second project for the frontend (JavaScript/React) named `szl-web`, or use the same project for both server and client.

#### Step 2: Copy the DSN

1. In Sentry, go to your project → **Settings → Client Keys (DSN)**.
2. Copy the DSN string. It looks like: `https://abc123def456@o123456.ingest.sentry.io/1234567`

#### Step 3: Set environment variables in Replit

Open Replit Secrets and add:

| Secret name | Value |
|-------------|-------|
| `SENTRY_DSN` | Your Sentry DSN (for the API server) |
| `VITE_SENTRY_DSN` | Your Sentry DSN (for frontend apps — can be the same DSN) |

> **Note:** `VITE_SENTRY_DSN` is injected at Vite build time. You must rebuild the frontend apps after setting it. For the API server, a restart is sufficient.

Optional tuning variables (Replit Secrets):

| Secret name | Default | Description |
|-------------|---------|-------------|
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | 10% of requests sampled for performance traces |
| `SENTRY_PROFILES_SAMPLE_RATE` | `0.1` | 10% of sampled traces include CPU profiles |

#### Step 4: Configure Slack alerts in Sentry

1. In Sentry, go to **Settings → Integrations → Slack** and connect your Slack workspace.
2. Go to your project → **Alerts → Create Alert Rule**.
3. Choose **Issues** (for new error types) or **Metric Alerts** (for error rate spikes).
4. Example metric alert configuration:
   - **Metric**: `count(errors)` over 1 minute window
   - **Threshold**: `> 10 errors` triggers a warning; `> 50 errors` triggers a critical alert
   - **Action**: Notify Slack channel `#ops-alerts`
5. Save the rule.

#### Step 5: Configure email alerts

1. In Sentry, go to your project → **Alerts → Create Alert Rule**.
2. Choose **Issues** → set conditions (e.g., "A new issue is created").
3. **Action**: Send email to `team@szlholdings.com` or your ops alias.

### What Sentry captures (API server)

- All unhandled Express middleware errors (via `Sentry.setupExpressErrorHandler`)
- Uncaught exceptions (`process.on('uncaughtException')` — via `onUncaughtExceptionIntegration`)
- Unhandled promise rejections — via `onUnhandledRejectionIntegration`
- HTTP request breadcrumbs — via `httpIntegration`
- PostgreSQL query spans — via `postgresIntegration`
- Sensitive headers (`authorization`, `cookie`, `x-internal-token`) are stripped via `beforeSend`

### What Sentry captures (frontends)

- JavaScript runtime errors — via global `window.addEventListener("error")`
- Unhandled promise rejections — via global `window.addEventListener("unhandledrejection")`
- Browser performance traces — via `browserTracingIntegration`
- Session replays on errors — via `replayIntegration` (masked text disabled for readability)

---

## 2. External Uptime Monitoring

### What to monitor

The primary monitoring target is the API health endpoint:

```
GET /api/health
```

This endpoint returns HTTP 200 with a JSON payload containing service statuses (database, job queue, storage, auth, AI). For a lightweight liveness check (no JSON parsing needed), use:

```
GET /api/health/live
```

This returns `{ "status": "ok" }` with HTTP 200 when the server is alive.

### Recommended providers (free tiers)

| Provider | Free tier | Check interval | Multi-region | Slack/email alerts |
|----------|-----------|---------------|--------------|-------------------|
| [Better Uptime](https://betteruptime.com) | 10 monitors, 3-min interval | 3 minutes | Yes | Yes (Slack, email, PagerDuty) |
| [UptimeRobot](https://uptimerobot.com) | 50 monitors, 5-min interval | 5 minutes | No | Yes (Slack, email, SMS) |
| [Freshping](https://freshping.io) | 50 checks, 1-min interval | 1 minute | Yes | Yes (Slack, email) |

**Recommendation for enterprise pilot:** Use **Freshping** (free, 1-minute interval, multi-region) or **Better Uptime** (3-minute interval, has status page feature).

### Setup: Better Uptime (recommended)

1. Go to [betteruptime.com](https://betteruptime.com) and sign up.
2. Click **New Monitor**.
3. Configure:
   - **URL**: `https://your-deployment-domain/api/health`
   - **Check interval**: 3 minutes (free tier minimum)
   - **Regions**: Select 2–3 regions (e.g., US East, EU West, Asia Pacific)
   - **HTTP method**: GET
   - **Expected status**: 200
   - **Keyword check** (optional): `"status":"healthy"` — alerts if the response body does not contain this string even when HTTP 200 is returned
4. Set up alerting:
   - **On-call escalation**: Add your email or phone number
   - **Slack integration**: Settings → Integrations → Slack → connect workspace → choose `#ops-alerts` channel
5. Optionally enable a **public status page** (e.g., `status.szlholdings.com`) for transparent enterprise communication.

### Setup: UptimeRobot (simplest option)

1. Go to [uptimerobot.com](https://uptimerobot.com) and sign up.
2. Click **Add New Monitor**.
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: SZL Holdings API
   - **URL**: `https://your-deployment-domain/api/health`
   - **Monitoring Interval**: 5 minutes
4. Set up alerts:
   - My Settings → Alert Contacts → Add Alert Contact → Slack or Email
   - Assign the alert contact to the monitor

### Setup: Freshping (1-minute intervals, free)

1. Go to [freshping.io](https://freshping.io) and sign up with a Freshworks account.
2. Create a new check:
   - **URL**: `https://your-deployment-domain/api/health`
   - **Check interval**: 1 minute
   - **Locations**: Select 2+ regions
3. Configure notification channels: Settings → Notification Channels → add Slack webhook or email.

### What your deployment domain is

Your production deployment URL is the Replit autoscale deployment domain. Find it in the Replit deployment settings after publishing. It follows the pattern:

```
https://<project-slug>.<username>.repl.co
```

Or if you have configured a custom domain:

```
https://szlholdings.com
```

### Testing your uptime monitor

After setup, verify the monitor is working:

```bash
curl -s https://your-deployment-domain/api/health | jq .status
# Should return: "healthy"

curl -s https://your-deployment-domain/api/health/live | jq .status
# Should return: "ok"
```

To trigger a test alert in Better Uptime or UptimeRobot, temporarily pause the monitor, then resume it — most providers will send a test notification.

---

## 3. Sentry + Uptime Monitoring — Incident Response Playbook

### Alert received: Sentry error spike

1. Open Sentry → Issues → filter by `last seen: last 1 hour`.
2. Look for patterns: is it one error type or many? Is it frontend or backend?
3. If backend: check API server logs in Replit (`pnpm health:check` to test the endpoint).
4. If database-related: check Replit PostgreSQL dashboard for connection pool exhaustion or disk usage.
5. Rollback if needed: Replit UI → Checkpoints → select the checkpoint before the deploy.

### Alert received: Uptime monitor reports downtime

1. Manually test: `curl https://your-deployment-domain/api/health`
2. If 503: the API server workflow may be crashed — restart it in Replit.
3. If no response (timeout): check Replit deployment status — the autoscale instance may be cold-starting.
4. If DNS error: check Replit deployment is published and domain is correctly configured.
5. Notify stakeholders via the status page (Better Uptime) or a manual update.

---

## 4. Cost Summary

| Service | Tier | Cost |
|---------|------|------|
| Sentry | Developer (free) | $0/month — 5,000 errors/month |
| Sentry | Team | $26/month — 50,000 errors/month, 1-year retention |
| Better Uptime | Free | $0/month — 10 monitors, 3-min interval |
| Better Uptime | Starter | $20/month — unlimited monitors, 1-min interval, status page |
| UptimeRobot | Free | $0/month — 50 monitors, 5-min interval |
| Freshping | Free | $0/month — 50 checks, 1-min interval |

**For the enterprise pilot:** Free tiers of both Sentry and Freshping or Better Uptime are sufficient. Upgrade to paid tiers when commercial SLAs are established.
