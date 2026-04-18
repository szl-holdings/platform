# Uptime Monitoring Setup Guide

**Owner:** Founder  
**Last updated:** April 2026  
**Status:** GitHub Actions monitor deployed — requires `SLACK_WEBHOOK_URL` GitHub Secret for phone alerts

---

## How Monitoring Works (Active Implementation)

A GitHub Actions workflow (`.github/workflows/uptime-monitor.yml`) runs on GitHub's infrastructure — external to Replit — and checks `https://szlholdings.com/api/health/live` every **minute** (cron: `* * * * *`).

**What it does automatically:**
- Probes the health endpoint every minute with retry logic (1 retry, 5-second delay, 10-second timeout)
- On downtime: creates a GitHub issue tagged `uptime-incident` + `P0`, and posts a Slack alert
- On recovery: sends a Slack recovery alert, then closes the open incident issue

**Alert channel that delivers to founder's phone:**  
Slack mobile push notifications. When the Slack webhook posts to `#ops-alerts`, the founder's phone receives the push notification within seconds — this is functionally equivalent to SMS if the Slack app is installed and notifications are enabled.

**Worst-case alert timing (GitHub Actions, 1-minute cron):**

| Event | Time |
|-------|------|
| API goes down | T+0 |
| Next cron fires | T+0 to T+60s (depends on cycle position) |
| Probe runs + retries | T+60s to T+75s |
| Slack alert posts + phone push | T+75s to T+85s |
| **Worst-case: founder notified** | **~2 minutes** |

> Note: GitHub Actions schedules at `* * * * *` (every minute) are honored on paid GitHub plans. Free plans may throttle to every 5 minutes during high-load periods. For guaranteed sub-2-minute alerting on free plans, use BetterStack as documented below.

---

## Required Setup: Add Slack Webhook Secret

**This is the only step needed to activate phone alerts.** Without this, the monitor still creates GitHub issues (which send email), but no Slack/phone push will fire.

### Step 1 — Create a Slack incoming webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create new app** → **From scratch**
2. Name it `Platform Monitor`, choose your Slack workspace
3. Go to **Incoming Webhooks** → toggle on → **Add New Webhook to Workspace**
4. Select `#ops-alerts` as the channel → **Allow**
5. Copy the webhook URL (starts with `https://hooks.slack.com/services/...`)

### Step 2 — Add the webhook as a GitHub Actions Secret

1. Open your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Set **Name:** `SLACK_WEBHOOK_URL`
4. Paste the webhook URL from Step 1
5. Click **Add secret**

### Step 3 — Enable Slack mobile push notifications (the "phone alert")

1. Install the Slack app on your phone if not already installed
2. Open Slack → Settings → Notifications
3. Ensure notifications are enabled for `#ops-alerts` and for direct mentions
4. Test: send a message to `#ops-alerts` and confirm your phone buzzes

### Step 4 — Create required GitHub labels

The workflow creates issues with labels `uptime-incident` and `P0`. Create these if they don't exist:

1. Go to your GitHub repo → **Issues** → **Labels**
2. Click **New label** → Name: `uptime-incident`, Color: `#d93f0b`
3. Click **New label** → Name: `P0`, Color: `#e11d48`

### Step 5 — Verify the monitor is running

1. Go to your GitHub repo → **Actions** → **Uptime Monitor**
2. You should see runs appearing every minute once the workflow is deployed
3. Click **Run workflow** to trigger a manual test and confirm a green run
4. If `SLACK_WEBHOOK_URL` is set, confirm a Slack message appears in `#ops-alerts` on the first downtime event

---

## How the GitHub Email Fallback Works (No Slack Setup Required)

Even without `SLACK_WEBHOOK_URL`, the workflow creates a GitHub issue for every downtime event. GitHub sends an email notification to everyone watching the repository. To ensure you receive these:

1. Go to [github.com/settings/notifications](https://github.com/settings/notifications)
2. Set repository notification level to **Watching**
3. Confirm email notifications are enabled for **Issues**

This provides email-based alerting as a baseline, with Slack push as the primary phone channel.

---

## Upgrade Path: BetterStack for Guaranteed Sub-2-Minute SMS

If the business requires guaranteed sub-2-minute SMS alerting independent of GitHub plan throttling, add BetterStack alongside the GitHub Actions monitor.

**Plan required:** BetterStack Starter at $25/month. Free tier checks every 3 minutes minimum; 60-second checks require the paid plan.

### BetterStack Setup Steps

1. Go to [betterstack.com/uptime](https://betterstack.com/uptime) and sign up
2. Click **New Monitor** → type: `HTTPS`, URL: `https://szlholdings.com/api/health/live`, frequency: `60 seconds`
3. Set **Regions:** at least 2 geographic regions to avoid regional false positives
4. Set **Confirmation:** 2 consecutive failures before alerting
5. Under **On-call** → **Team**, add your phone number and verify via SMS
6. Create an escalation policy: immediate SMS → 5-minute backup phone call
7. Attach the policy to your monitor
8. Run a test alert to confirm SMS delivery

**Alert timing with BetterStack (60-second check, 2 consecutive failures):**

| Event | Worst-case time |
|-------|----------------|
| API goes down | T+0 |
| First failed check | up to T+60s |
| Second failed check (alert triggers) | up to T+120s |
| SMS delivered | T+120s to T+135s |

**Worst-case: ~2 minutes 15 seconds.** To guarantee under 2 minutes, set confirmation to 1 failure (faster alert, higher false-positive rate).

### BetterStack Status Badge

Once configured, paste your status badge here:

```
[ STATUS BADGE — paste markdown badge from BetterStack after setup ]
```

Example:
```markdown
[![Platform Uptime](https://uptime.betterstack.com/status-badges/v1/monitor/REPLACE_WITH_YOUR_ID.svg)](https://szlholdings.betteruptime.com)
```

---

## Maintenance Windows

To suppress alerts during planned deployments:

**GitHub Actions:** Temporarily disable the workflow in the GitHub Actions UI: Actions → Uptime Monitor → ⋯ → Disable workflow. Re-enable after the deploy.

**BetterStack (if configured):** Open the monitor → **Maintenance windows** → **Add window**.

---

## Troubleshooting

**Workflow not running:**  
Check GitHub Actions → Uptime Monitor. If you see "This workflow is disabled", re-enable it. On free GitHub plans, 1-minute cron may be throttled to 5–10-minute intervals during peak times.

**Slack message not arriving:**  
1. Confirm `SLACK_WEBHOOK_URL` is in GitHub Secrets (Settings → Secrets → Actions)
2. Test the webhook: `curl -X POST "$SLACK_WEBHOOK_URL" -d '{"text":"uptime test"}'`
3. Confirm the Slack app has permission to post to `#ops-alerts`

**False-positive alerts (API is up but monitor fires):**  
The workflow includes 1 retry before declaring the API down. If false positives persist, check for TLS or DNS intermittency from GitHub's runner network.

**API is down but no GitHub issue created:**  
The `issues: write` permission is required. Confirm it's in the workflow permissions block (it is, by default in this workflow).

---

## Ongoing Maintenance

| Task | Frequency | Owner |
|------|-----------|-------|
| Verify Slack alerts route to correct channel | Monthly | Founder |
| Review GitHub issue history for downtime patterns | Monthly | Founder |
| Update `HEALTH_CHECK_URL` env var in workflow if domain changes | On domain change | Dev |
| Rotate `SLACK_WEBHOOK_URL` secret if Slack workspace changes | On change | Founder |
