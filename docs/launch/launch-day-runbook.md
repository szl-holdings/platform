# Launch Day Runbook — SZL Holdings Platform

**Version:** 1.0 | **Date:** April 2026 | **Audience:** Launch team, engineering, product, founder

**Related:** [ROLLBACK_PLAYBOOK.md](../operations/rollback-playbook.md) · [ENVIRONMENT_VALIDATION.md](../operations/environment-validation.md) · [RELEASE_INTELLIGENCE.md](../operations/release-intelligence.md) · [LAUNCH_ANALYTICS_PLAN.md](launch-analytics-plan.md)

---

## Pre-Launch Checklist (T-48 hours)

Complete 48 hours before launch window opens.

### Technical

- [ ] All hard blockers in [LAUNCH_BLOCKERS.md](launch-blockers.md) resolved and signed off
- [ ] Production environment fully validated per [ENVIRONMENT_VALIDATION.md](../operations/environment-validation.md) Stage 2
- [ ] External uptime monitoring active and alerting on `/api/health`
- [ ] Sentry error tracking live in production — test event confirmed received
- [ ] Azure Application Insights configured and receiving traces
- [ ] Production database backup confirmed (within last 24 hours)
- [ ] Deployment slot (blue/green) staging slot contains known-good baseline
- [ ] All feature flags set to Stage 0 (internal only — 5%)
- [ ] Kill switches defined and tested for all major features
- [ ] On-call engineer confirmed and available for 48-hour window
- [ ] Rollback procedure tested in staging ([ROLLBACK_PLAYBOOK.md](../operations/rollback-playbook.md))

### Product & Content

- [ ] All public-facing copy reviewed and approved
- [ ] No placeholder text on any public route
- [ ] Legal pages live: `/legal/privacy` · `/legal/terms`
- [ ] Trust Center accessible and accurate
- [ ] Contact and demo request forms tested (submissions confirmed received)
- [ ] All external links tested and functional
- [ ] Design partner orgs provisioned in production with access
- [ ] Demo environment seeded and functional

### Analytics

- [ ] Analytics events firing in production — verified in GA4/PostHog
- [ ] No PII in any analytics events (audit run)
- [ ] Day 0 dashboard configured per [LAUNCH_ANALYTICS_PLAN.md](launch-analytics-plan.md)
- [ ] Launch baseline metrics captured (pre-launch state documented)

### Communications

- [ ] Customer communication prepared (email, in-app, or direct)
- [ ] Support model activated — response procedures in place
- [ ] Internal team briefed on launch sequence
- [ ] Escalation contacts confirmed (see Decision Owners below)
- [ ] Status page prepared if applicable

---

## Pre-Launch Checklist (T-2 hours)

Complete 2 hours before launch window opens.

- [ ] Production health check: `GET /api/health` returns 200
- [ ] Detailed health check: all subsystems green
- [ ] Database accessible and query latency normal
- [ ] AI provider health: OpenAI, Anthropic, Gemini all reachable
- [ ] Error rate baseline: < 0.1% in last 30 minutes
- [ ] On-call engineer at keyboard and monitoring
- [ ] All team leads reachable (phone/Slack)
- [ ] Rollback decision criteria agreed and printed/shared
- [ ] Launch analytics baseline snapshot taken

---

## Launch Sequence

### T-0: Flip to Public

| Time | Action | Owner | Verify |
|------|--------|-------|--------|
| T+0:00 | Set feature flags to Stage 1 (design partners / beta, 10%) | Engineering lead | Confirm flag propagation < 60s |
| T+0:05 | Verify design partner access and onboarding flow | Product | Design partner org logs in successfully |
| T+0:10 | Publish announcement / communications (if applicable) | Founder | Links resolve; tracking fires |
| T+0:15 | Monitor error rate — 15-minute clean window required | On-call | Error rate < 0.5% |
| T+0:30 | First analytics snapshot — active sessions, events firing | Product | Events visible in PostHog/GA4 |
| T+1:00 | Decision gate: proceed to Stage 2 (25%) or hold | Engineering + Product | Stage 1 criteria met |

### T+1 to T+4 hours: Gradual Expansion

| Time | Action | Owner | Verify |
|------|--------|-------|--------|
| T+1:00 | If Stage 1 criteria met: set flags to Stage 2 (25%) | Engineering lead | Monitor 30 minutes |
| T+2:00 | Metrics check: error rate, latency, support tickets | On-call | All within thresholds |
| T+3:00 | Decision gate: proceed to Stage 3 (50%) or hold | Engineering + Product | Stage 2 criteria met |
| T+3:00 | If Stage 3: set flags to 50% | Engineering lead | Monitor 30 minutes |
| T+4:00 | End-of-day metrics review | Founder + Product | Launch KPI snapshot #1 |

---

## Monitoring Sequence

### First Hour Monitoring (check every 5 minutes)

```bash
# Health check
curl -s https://api.szlholdings.com/api/health | jq .status

# Detailed health (with token)
curl -s -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://api.szlholdings.com/api/health/detailed | jq .
```

**Dashboard to watch:**
1. Azure Application Insights — error rate, P95 latency, request volume
2. Sentry — any new error events
3. PostHog / GA4 — active sessions, event stream
4. Uptime monitor — external health check status

**Alert thresholds (immediate action required):**
- Error rate > 1% → investigate
- Error rate > 2% → rollback discussion
- P95 latency > 3s → investigate
- P95 latency > 5s → rollback discussion
- `/api/health` non-200 → immediate rollback

### Hours 2–24 Monitoring (check every 30 minutes)

| Signal | Check | Threshold | Action if breached |
|--------|-------|-----------|-------------------|
| Error rate | Sentry / App Insights | < 0.5% | Investigate; escalate if > 1% |
| Active sessions | PostHog | Trending up | Good signal |
| Support tickets | Support channel | < 2x baseline | Escalate if higher |
| AI recommendation quality | AI Ops dashboard | Pass rate ≥ baseline | Investigate drop |
| Tenant onboarding | DB: new orgs completing setup | Conversion > 50% | Investigate if low |

---

## Decision Owners

| Decision | Owner | Backup | Criteria |
|----------|-------|--------|---------|
| Launch go/no-go | Stephen Lutar (Founder) | Engineering lead | All pre-launch checks pass |
| Stage progression (1→2→3→4) | Engineering lead + Product | Founder | Stage criteria met (see RELEASE_INTELLIGENCE.md) |
| Rollback initiation | On-call engineer | Engineering lead | Any rollback criterion breached |
| Kill switch activation | Engineering lead | On-call engineer | Feature causing SEV1/2 |
| Customer communication | Founder | Product | SEV1 or data issue affecting tenants |
| Incident escalation | On-call engineer | Engineering lead | SEV1 or SEV2 incident |

---

## Escalation Triggers

Escalate to the next decision owner immediately when:

| Trigger | Who to escalate to | Within |
|---------|--------------------|--------|
| Error rate > 2% sustained | Engineering lead | 5 minutes |
| SEV1 incident | Engineering lead + Founder | Immediately |
| Data integrity issue suspected | Engineering lead + legal (if exposure) | Immediately |
| Rollback needed but uncertain | Engineering lead | 5 minutes |
| External attack or security event | Engineering lead + Founder | Immediately |
| More than 3 design partners cannot log in | Engineering lead + Product | 15 minutes |
| All AI providers unhealthy > 5 minutes | Engineering lead | 10 minutes |

---

## Rollback Criteria (Launch Day)

Trigger rollback immediately (before investigation) if:

- `GET /api/health` returns non-200 for > 2 consecutive minutes
- Error rate exceeds 2% in any 5-minute window
- P95 latency exceeds 5 seconds for > 5 minutes
- More than 20% of authenticated API calls are failing
- A data integrity issue is confirmed or suspected
- Any SEV1 incident is confirmed

**Rollback procedure:** [ROLLBACK_PLAYBOOK.md](../operations/rollback-playbook.md)

---

## Customer Communication Triggers

Proactively communicate to customers when:

| Situation | Communication | Channel | Within |
|-----------|--------------|---------|--------|
| SEV1 outage > 15 minutes | Service incident notice | Email + in-app | 15 minutes |
| Data issue affecting customer | Direct notification | Email + phone | Immediately |
| Rollback executed | Brief explanation of interruption | Email | 1 hour |
| Feature degraded for > 1 hour | Status update | Status page + email | 1 hour |
| Full resolution | Resolution notice + post-mortem summary | Email | 24 hours |

Customer communication drafts are prepared in advance. Contact the Founder for approval before sending any customer-facing communication about service issues.

---

## Post-Launch Review Schedule

| Checkpoint | Time | Owner | Focus |
|------------|------|-------|-------|
| Launch Day Debrief | Day 0, end of day | All launch team | What happened, what's green |
| Day 1 Metrics Review | Day 1, 9am | Founder + Product | Early activation, error trends |
| Week 1 Analytics Review | Day 7 | Founder + Product | Full launch analytics plan metrics |
| Day 30 Business Review | Day 30 | Founder + board | Business KPIs, conversion, NRR baseline |

See [LAUNCH_ANALYTICS_PLAN.md](launch-analytics-plan.md) for the full metrics framework.

---

## Emergency Contacts

| Role | Contact | When |
|------|---------|------|
| Founder | Stephen Lutar — stephen@szlholdings.com | SEV1, data issues, customer communication |
| Engineering lead | (Designated pre-launch) | Any technical escalation |
| On-call engineer | (Designated pre-launch) | First responder |
| Legal / counsel | (Designated pre-launch) | Data exposure, regulatory, contract |

---

*Last updated: 2026-04-16*
