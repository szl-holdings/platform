# Incident Runbook
**Phase:** 5 + 9  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Incident Severity Levels

| Level | Definition | Response SLA | Escalation |
|---|---|---|---|
| P0 — Critical | Auth broken, data exposed, DB corrupted | 5 min response; 15 min resolution target | Founder + on-call immediately |
| P1 — High | Core features down for > 10% of users | 15 min response | Engineering lead |
| P2 — Medium | Non-critical feature degraded | 1h response | Engineering on-call |
| P3 — Low | Minor UX issue; informational | Next business day | Ticket |

---

## P0 Incident Response Script

### Step 1 — Triage (< 5 minutes)
```bash
# Check health
curl $BASE_URL/api/health
curl $BASE_URL/api/health/detailed

# Check logs (if OTEL configured)
# → Grafana / New Relic dashboard

# Check Sentry (if configured)
# → Sentry project dashboard → Issues
```

### Step 2 — Contain
- If auth is broken → immediately notify all active users via Slack
- If data exposure suspected → disable affected routes immediately (feature flag or code rollback)
- If DB corrupted → stop all API instances; initiate backup restore

### Step 3 — Rollback (if needed)
See `rollback_runbook.md` — expected time < 15 minutes via Replit checkpoint

### Step 4 — Notify
```
Stakeholder notification format:
Subject: [INCIDENT P0] Platform {issue summary} — {time}
Body:
- What happened: {brief description}
- Impact: {who is affected, what is broken}
- Status: Investigating / Contained / Resolved
- Next update: {time}
- On-call: {name}
```

### Step 5 — Resolve and Document
- Confirm health endpoints green
- Run post-deploy smoke suite
- Write incident report within 24h (see template below)

---

## Incident Report Template

```markdown
# Incident Report — {ID}: {Brief Title}

**Date:** {YYYY-MM-DD}
**Duration:** {start time} → {resolution time} ({total duration})
**Severity:** P{0-3}
**On-call:** {name}

## Summary
{One paragraph: what broke, what was the impact, how it was resolved}

## Timeline
- {time}: First alert / detection
- {time}: Triage started
- {time}: Root cause identified
- {time}: Fix deployed / rollback initiated
- {time}: Resolution confirmed

## Root Cause
{Technical description}

## Impact
- Users affected: {count or percentage}
- Data affected: {yes/no, what}
- Revenue impact: {estimate}

## Resolution
{What was done to fix}

## Action Items
| Action | Owner | Due |
|---|---|---|
| {preventive measure} | {name} | {date} |

## Lessons Learned
{What would have caught this earlier}
```

---

## Common Failure Patterns and Fixes

| Symptom | Likely Cause | Fix |
|---|---|---|
| All routes return 503 | API server down | Restart `artifacts/api-server: api` workflow |
| Auth redirect loop | `ISSUER_URL` misconfigured | Check env var; must match Replit app URL |
| DB connection errors | `DATABASE_URL` invalid or DB down | Check Replit DB status; verify `DATABASE_URL` |
| Frontend blank (white screen) | Vite build error or wrong port | Check artifact workflow; verify `PORT` env var |
| "correlationId undefined" in logs | Middleware ordering issue | Check `app.ts` middleware order |
| AI calls returning 502 | AI provider proxy issue | Check Replit AI integration status; switch provider |
| High error rate on `/api/approvals` | Pending DB migration | Run `pnpm db:migrate` |
| Demo reset failing | Demo seed script error | Check `pnpm seed:demo` output; check DB connectivity |
