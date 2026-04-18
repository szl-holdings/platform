# Incident & Support Playbook

**Owner:** CTO / Founder
**Last updated:** April 2026
**Version:** 1.0

---

## Purpose

This playbook covers the five highest-impact failure scenarios for the SZL Holdings platform. Each scenario includes: how to detect it, immediate containment actions, resolution steps, customer communication guidance, and post-incident requirements.

For the general severity model and escalation contacts, see `docs/internal/ops/incident-response-runbook.md`. This document provides scenario-specific step-by-step guidance.

---

## Quick Reference — Scenario Index

| # | Scenario | Severity | Typical Resolution |
|---|----------|----------|--------------------|
| 1 | Site Down | SEV-1 | 15–30 min (rollback) |
| 2 | API Degraded | SEV-1/2 | 30–120 min |
| 3 | Auth Broken | SEV-1 | 15–60 min |
| 4 | Operator Data Stale | SEV-2/3 | 1–4 hours |
| 5 | Recommendation Workflow Degraded | SEV-2 | 1–8 hours |

---

## Scenario 1: Site Down

### Detection

Any of the following:
- `GET /api/health/live` returns non-200 for > 2 minutes
- All web app paths (/, /aegis/, /terra/, /vessels/) return non-200
- Uptime monitor fires (if configured)
- User or partner reports the site is unreachable

### Immediate Actions (first 5 minutes)

1. **Confirm the scope.** Run from a separate network:
   ```bash
   curl -sf -o /dev/null -w "%{http_code}" https://szlholdings.com/
   curl -sf -o /dev/null -w "%{http_code}" https://szlholdings.com/api/health/live
   ```
2. **Check if it's a deployment issue.** Log into Replit deployment dashboard — note last deployment time.
3. **Check Replit platform status** at `https://status.replit.com` — rule out a platform-wide outage.
4. **Check DNS/CDN** — confirm domain resolves to the correct IP.

### Containment

**If recent deployment caused it:**
```
Replit Dashboard → Deployments → select previous version → Redeploy
Expected recovery: 2–5 minutes
```

**If platform issue (Replit outage):**
```
- No action possible beyond monitoring status.replit.com
- Post status update to customers if outage exceeds 15 minutes
- Update @szlholdings Slack/status page
```

**If process crashed (not a deployment issue):**
```
Replit Dashboard → Workflows → restart affected workflow
Check logs for panic/OOM error before restarting
```

### Resolution Steps

1. Verify health endpoints return 200 after rollback/restart.
2. Run smoke test suite: `ops/cto/post-deploy-verification.md`.
3. Confirm web apps all return 200 from external check.
4. Confirm at least one authenticated request succeeds.

### Customer Communication

**Template (if > 15 minutes of downtime affecting users):**
> "We are aware that SZL Holdings is currently unavailable. Our team has identified the issue and is actively working to restore service. We will provide an update by [time +30min]."

**Resolution notice:**
> "Service has been restored as of [time]. We apologize for the disruption. A post-incident review will follow."

### Post-Incident Requirements

- SEV-1 requires a written post-incident review within 5 business days.
- Root cause must be documented with a "5 Whys" analysis.
- Any deployment that caused the outage must add a pre-deploy check to `ops/cto/post-deploy-verification.md`.

---

## Scenario 2: API Degraded

### What "Degraded" Means

API is reachable (`/api/health/live` returns 200) but one or more of:
- p95 response time > 2 seconds for > 5 minutes
- Error rate (5xx) > 3% for > 5 minutes
- Specific API routes returning 500 while others work
- Database queries timing out intermittently
- AI provider responses failing or timing out

### Detection

```bash
# Check error rate via health endpoint
curl -sf https://szlholdings.com/api/health | jq '{
  status: .status,
  error_rate: .metrics.errorRate,
  p95_latency: .metrics.p95LatencyMs,
  db_latency: .db.latencyMs
}'

# Check if specific routes are affected
curl -sf -o /dev/null -w "%{http_code}" https://szlholdings.com/api/alloy/actions
curl -sf -o /dev/null -w "%{http_code}" https://szlholdings.com/api/signals
```

### Triage Decision Tree

```
High error rate?
├── YES → Check recent deployments (last 4 hours)
│         ├── Recent deploy? → Rollback
│         └── No deploy? → Check DB connection pool → Check AI provider status
└── NO → High latency only?
          ├── YES → Check DB slow query log, check AI provider latency
          └── NO → Specific routes only? → Check route-specific logs for error context
```

### Immediate Actions

**Step 1: Check recent deployments**
- Log into Replit deployment dashboard — any deploy in the last 4 hours?
- If yes: initiate rollback immediately, verify within 5 minutes.

**Step 2: Check database**
```bash
# DB connectivity via health endpoint
curl -sf https://szlholdings.com/api/health | jq '.db'

# If DB latency > 500ms, check connection pool
curl -sf -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://szlholdings.com/api/health/detailed | jq '.db.pool'
```

If connection pool is exhausted:
- Restart the API server process via Replit Workflows.
- If persistent: check for long-running queries or connection leaks in logs.

**Step 3: Check AI providers**
```bash
# AI provider health (if endpoint exists)
curl -sf -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://szlholdings.com/api/health/detailed | jq '.providers'

# Check provider status pages
# OpenAI: https://status.openai.com
# Anthropic: https://status.anthropic.com
```

If AI provider is down:
- Check if fallback model is configured in `lib/provider-health.ts`.
- If not: disable AI-dependent features via feature flag:
  ```bash
  curl -X POST https://szlholdings.com/api/admin/feature-flags \
    -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
    -d '{"flag":"ai_features","enabled":false}'
  ```

**Step 4: Check job queue**
```bash
curl -sf -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://szlholdings.com/api/health/detailed | jq '.queue'
```

If queue is backing up (> 100 pending):
- Throttle ingestion if possible.
- Drain queue manually if jobs are failing repeatedly.

### Resolution Steps

1. Identify root cause from logs and health data.
2. Apply fix (rollback, restart, disable failing feature).
3. Verify error rate drops below 1% over 5-minute window.
4. Run smoke test suite to confirm all critical paths are healthy.
5. Re-enable any disabled features once root cause is resolved.

### Customer Communication

**If affecting specific features (SEV-2):**
> "Some features on SZL Holdings are currently experiencing intermittent issues. Our team is investigating. Core platform functionality remains available."

---

## Scenario 3: Auth Broken

### What "Broken" Means

- Login attempts return 500 or fail silently (no session created)
- Sessions expire unexpectedly or do not persist
- OIDC/SSO redirect loop or callback errors
- CSRF validation failing on authenticated routes
- WebSocket authentication rejecting valid users

### Detection

```bash
# Test login flow returns something useful
curl -sf -X POST https://szlholdings.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg e "$SMOKE_TEST_EMAIL" --arg p "$SMOKE_TEST_PASSWORD" '{email:$e,password:$p}')" \
  | jq '{status: .status, error: .error}'

# Check auth error rate
curl -sf https://szlholdings.com/api/health | jq '.auth'

# Check if session store is reachable
curl -sf -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://szlholdings.com/api/health/detailed | jq '.session'
```

### Triage

**500 on login:**
- Check API logs for the specific error (database write failure, session store issue, config error).
- Check if `SESSION_SECRET` environment variable is set in production deployment.
- Check if database is reachable (auth sessions stored in DB).

**Login returns 200 but no session:**
- Check if `SESSION_SECRET` value changed (rotation gone wrong).
- Check cookie flags — `Secure` flag requires HTTPS; if testing via HTTP, sessions won't persist.
- Check `CORS_ORIGINS` — incorrect CORS config blocks cookie from being set.

**OIDC redirect loop:**
- Check OIDC provider is reachable.
- Check that callback URL in OIDC configuration matches the current deployment domain exactly.
- Verify `NODE_ENV=production` is set (affects secure cookie behavior).

**CSRF validation failing:**
- Verify CSRF token endpoint `/api/auth/csrf` is reachable.
- Check that the frontend is fetching a fresh CSRF token before each state-changing request.

### Immediate Actions

1. **If `SESSION_SECRET` changed:** Roll back the secret to the previous value in deployment settings. Restart the API process.
2. **If OIDC provider is down:** Check provider status. Auth is unavailable until provider recovers — no workaround.
3. **If recent deployment caused it:** Rollback immediately.
4. **If config mismatch (CORS, callback URLs):** Fix the configuration in deployment settings → redeploy.

### Containment for Active Users

If users are mid-session when auth breaks:
- Sessions already in flight may continue to work until they expire.
- New logins are blocked until fix is applied.
- If users are actively locked out: prioritize rollback over investigation.

### Resolution Steps

1. Identify the root cause from logs.
2. Apply fix (config correction, rollback, secret restore).
3. Run auth smoke tests from `ops/cto/post-deploy-verification.md` (Section 4).
4. Verify session lifecycle: login → authenticated request → logout → session invalidated.
5. Verify WebSocket auth works for active users.

### Customer Communication

**Template (if users are locked out):**
> "We are aware that some users are unable to log in to SZL Holdings. Our team is actively working to restore authentication. We apologize for the inconvenience and expect to resolve this within [estimated time]."

---

## Scenario 4: Operator Data Stale

### What "Stale" Means

- Operator dashboard shows data that is hours or days behind expected freshness
- Signals, alerts, or portfolio data not updating
- Alloy action queue not receiving new items
- Scheduled data refresh jobs not running
- Real-time feed disconnected (WebSocket stale)

### Detection

```bash
# Check job queue health
curl -sf -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://szlholdings.com/api/health/detailed | jq '.queue'

# Check when data was last refreshed (domain-specific endpoint)
curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://szlholdings.com/api/admin/data-freshness | jq '.'

# Check WebSocket health
curl -sf -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://szlholdings.com/api/health/detailed | jq '.websocket'
```

Symptoms to watch for:
- Operator reports signals last updated > 2 hours ago
- Alloy action queue has no new items despite expected activity
- WebSocket connection shows `stale` or `disconnected` state

### Triage

**If job queue is backed up:**
- Background jobs are failing or not running.
- Check job queue stats for failed job count and error messages.
- Restart the job queue processor if it has stalled.

**If WebSocket is stale:**
- Check if the WS server is running (api-server Reserved VM must be healthy).
- Clients may need to reconnect — send a push notification or prompt reconnect from admin.

**If specific data source is failing:**
- Identify which integration or data pipeline is failing.
- Check provider health for the affected data source.
- Check for rate limit errors in logs.

### Immediate Actions

1. **Restart stalled job processor:**
   ```bash
   # Via admin API (if available)
   curl -X POST https://szlholdings.com/api/admin/jobs/restart \
     -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN"
   ```

2. **Force a manual data refresh** (if available):
   ```bash
   curl -X POST https://szlholdings.com/api/admin/data-refresh \
     -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
     -d '{"domain":"all"}'
   ```

3. **Notify affected operators** if staleness exceeds SLA (typically > 4 hours for intelligence data):
   > "We are aware of a delay in data refresh for [affected domain]. Our team is working to restore real-time data. Historical data remains available. We expect resolution by [time]."

### Resolution Steps

1. Identify why jobs stopped running (error in job logic, resource exhaustion, config issue).
2. Fix root cause.
3. Trigger manual data refresh to backfill the gap.
4. Verify data freshness timestamps return to expected values.
5. Monitor job queue health for 30 minutes post-fix.

---

## Scenario 5: Recommendation Workflow Degraded

### What "Degraded" Means

- AI-powered recommendations (Alloy suggestions, signal prioritization, deal scoring) are not generating or are generating incorrect output
- Recommendation requests time out
- AI provider returning errors
- Recommendation scores stuck on cached/stale values

### Detection

```bash
# Check AI provider health
curl -sf -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://szlholdings.com/api/health/detailed | jq '.providers'

# Test a recommendation request
curl -sf -X POST https://szlholdings.com/api/alloy/recommend \
  -H "Authorization: Bearer $OPERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"signal","limit":3}' \
  | jq '{status: .status, source: .source, count: (.data | length)}'
```

Watch for:
- `source: "cache"` in recommendation responses (indicates live AI is not running)
- Response times > 15 seconds
- Empty recommendation arrays on surfaces that normally show data

### Triage

**If AI provider is down:**
1. Check OpenAI status: `https://status.openai.com`
2. Check Anthropic status: `https://status.anthropic.com`
3. If primary provider is down, check if fallback provider is configured.
4. Check `lib/provider-health.ts` for fallback routing logic.

**If AI requests are timing out:**
1. Check if the API server is under memory pressure.
2. Check if request queue to AI provider is backed up.
3. Consider increasing timeout threshold temporarily or enabling request batching.

**If AI returning garbage/incorrect output:**
1. Check recent changes to prompts or model configuration.
2. If a model version changed: revert to the previous model version.
3. Enable cache fallback temporarily to prevent bad recommendations from reaching users.

### Immediate Actions

**Disable live AI, serve cached recommendations:**
```bash
curl -X POST https://szlholdings.com/api/admin/feature-flags \
  -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  -d '{"flag":"live_recommendations","enabled":false}'
```

This causes the recommendation engine to serve the most recent cached outputs rather than generating new ones. Users see recommendations but they will not refresh until the flag is re-enabled.

**Switch to fallback AI provider:**
```bash
curl -X POST https://szlholdings.com/api/admin/ai-config \
  -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  -d '{"primaryProvider":"anthropic","fallbackProvider":"openai"}'
```

### Resolution Steps

1. Restore AI provider connectivity or switch to operational provider.
2. Re-enable live recommendations feature flag.
3. Trigger a fresh recommendation generation pass for all operators.
4. Verify recommendation freshness in operator dashboards.
5. Re-enable primary AI provider once operational.
6. Monitor for 30 minutes post-restoration.

### Communication

**If recommendations are visibly stale for > 2 hours:**
> "AI-powered recommendations are currently showing cached results. Our team is actively working to restore live recommendations. All other platform functionality is unaffected."

---

## Support Escalation Matrix

| Trigger | Action |
|---------|--------|
| User cannot log in | Auth flow check → Scenario 3 |
| User reports data is stale | Scenario 4 |
| User reports site is down | Scenario 1 |
| User reports AI not working | Scenario 5 |
| API integration throwing errors | Scenario 2 |
| Partner reports portal access issue | Auth check → RBAC audit |

### Support Contact Routing

| Contact | Used For |
|---------|----------|
| `engineering@szlholdings.com` | Technical issues, escalations |
| `security@szlholdings.com` | Data exposure, credential issues, suspected breach |
| `inquiries@szlholdings.com` | General customer/partner inquiries |

---

## Post-Incident Review Template

Required for all SEV-1 and SEV-2 incidents. File as `ops/incidents/YYYY-MM-DD-[slug].md`.

```markdown
# Incident: [Brief title]

**Date:** YYYY-MM-DD  
**Duration:** HH:MM (detection to resolution)  
**Severity:** SEV-1 / SEV-2  
**Scenario:** [Which playbook scenario applied]

## Timeline
- HH:MM — [Event]
- HH:MM — [Event]

## Root Cause
[5 Whys analysis]

## Impact
- Users affected: [number or estimate]
- Downtime: [duration]
- Data affected: [yes/no, describe if yes]

## What Went Well
- [Item]

## What Could Be Improved
- [Item]

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Item] | Founder | YYYY-MM-DD |
```

---

*See also: [Release & Operations Control](./release-and-operations-control.md) · [Post-Deploy Verification](./post-deploy-verification.md) · [Founder Control Room](./founder-control-room.md) · [Incident Response Runbook](../../docs/internal/ops/incident-response-runbook.md)*
