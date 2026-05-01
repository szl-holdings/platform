# Founder Support Control Room

**Last updated:** April 2026  
**Purpose:** Founder operational visibility dashboard — what to watch, when to act, and how to maintain platform health and partner health simultaneously.

---

## Control Room Philosophy

At the design partner and early commercial stage, the founder is the entire operations team. The control room is not a monitoring dashboard (that comes later) — it is a structured habit for maintaining situational awareness across four domains:

1. **Platform health** — is the platform running correctly?
2. **Partner health** — are active pilots on track?
3. **Commercial pipeline** — what is moving, what is stuck?
4. **Product signal** — what is the platform telling us to build or fix?

---

## Daily Check (10 minutes)

**Platform health:**
- [ ] `/api/health` returns 200 and DB latency is under 500ms
- [ ] No error spikes in application logs (check Pino output or log aggregator if configured)
- [ ] No open incident reports from overnight

**Partner health:**
- [ ] Any unanswered partner messages from the past 24 hours? (respond before noon)
- [ ] Any partner who has not logged in for 3+ days? (send a check-in message)
- [ ] Any blockers flagged in the signal log that need founder action?

**Inbox:**
- [ ] Any new demo requests? (process same day)
- [ ] Any inbound security inquiries? (respond within 24 hours)
- [ ] Any press or investor inquiries? (respond within 24 hours)

---

## Weekly Review (30 minutes, same day each week)

### Platform Health Review

- [ ] Review Pino logs for any recurring error patterns
- [ ] Review rate limit violations if any (sign of integration issues or misuse)
- [ ] Check DB performance — any slow queries surfacing?
- [ ] Verify all web apps still load correctly (quick spot-check)
- [ ] Check GitHub Actions status — any failed CI runs?

### Partner Pulse Review

For each active pilot:

| Partner | Last Login | Last Log Entry | Check-In Due | Status |
|---|---|---|---|---|
| [Name] | [date] | [date] | [Y/N] | [On track / At risk] |

**On track:** Users logging in 3+ times/week, signal log updated, no unresolved blockers  
**At risk:** Users not logging in, log not updated, unresolved blockers >48h old

Action for at-risk pilots: direct phone call same day — do not let drift continue.

### Pipeline Review

| Organization | Stage | Last Contact | Next Action | Expected Decision |
|---|---|---|---|---|
| [Name] | [Stage] | [date] | [action] | [date] |

Move anything that has not progressed in 2 weeks — either advance it with a specific action or close it.

### Product Signal Review

Compile weekly feedback from:
- Partner signal logs and evaluation logs
- Blockers and feature requests from partner sync calls
- Error patterns from application logs

Route to:
- Engineering backlog (if code change needed)
- Ops docs (if runbook update needed)
- Commercial model (if pricing/packaging feedback)

---

## Monthly Review (60 minutes, first Monday of month)

### Platform Review

- [ ] Run full Tier 3 manual verification on at least one web app
- [ ] Review secret rotation schedule — any secrets due for rotation?
- [ ] Review rate limit configuration — are limits appropriate for current usage?
- [ ] Review SLO targets — are we meeting availability, latency, and error rate targets?

SLO targets:

| SLO | Target | Measurement |
|---|---|---|
| API availability | 99.9% | `/api/health/live` uptime |
| API p95 latency | <500ms | 95th percentile response time |
| Error rate | <1% | % of 5xx responses |
| DB query latency | <100ms | Average query time |

### Partner Review

- [ ] Pilot status for each active partner (on track / at risk / completed)
- [ ] Any pilots approaching 30/60/90-day checkpoints in the next 30 days?
- [ ] Any case study drafts in progress or pending approval?
- [ ] Conversion pipeline: any pilots expected to close commercially this month?

### Commercial Review

- [ ] Pipeline value: sum of expected ACV from all active evaluations
- [ ] Conversion rate: design partner pilots completed vs. commercial conversions
- [ ] Pipeline velocity: average time from inbound to pilot start
- [ ] Revenue (if any): MRR/ARR if billing is active

### Product Review

- [ ] Top 3 product gaps identified across all partner feedback this month
- [ ] Roadmap update: what changed based on pilot feedback?
- [ ] Any new domain pack requests or expansion opportunities?

---

## Incident Response Quick Reference

| Incident Type | Detection | First Action | Escalation |
|---|---|---|---|
| API health returning non-200 | Smoke test / monitoring | Check Pino logs, identify cause | Rollback if not resolved in 15 min |
| Auth broken | Partner report / spot-check | Immediate investigation | Rollback immediately |
| DB connection failure | Health endpoint | Check DATABASE_URL env var in Replit | Replit support if infrastructure issue |
| High error rate | Log review | Identify endpoint, check recent deploys | Rollback if deploy-related |
| Partner data issue | Partner report | Investigate with full correlation ID from logs | Direct partner call within 1 hour |
| Security incident | Any detection | Contain, then investigate | Notify affected partners within 4 hours |

Full incident response detail: `docs/internal/ops/incident-response-runbook.md`

---

## Support Contact Matrix

| Contact Type | Channel | Response SLA |
|---|---|---|
| Design partner technical issue | Direct Slack/email to founder | 4 hours during business hours |
| Design partner billing question | Direct email | 24 hours |
| Security disclosure | security@szlholdings.com | 24 hours |
| General enterprise inquiry | stephen@szlholdings.com | 24 hours |
| Investment inquiry | stephen@szlholdings.com | 48 hours |

---

## Escalation Triggers

Call the partner directly (not just message) if:

- A partner has not logged in for 5+ days during an active pilot
- A blocker has been unresolved for >48 hours
- A partner reports a data issue (any data integrity concern gets a phone call, same day)
- A security inquiry arrives from any source (respond same day)
- A P0 incident affects any active pilot

---

*See also: `post-deploy-verification-final.md` (smoke tests), `environment-and-release-final.md` (deployment process), `beta-support-flow.md` (support escalation detail)*
