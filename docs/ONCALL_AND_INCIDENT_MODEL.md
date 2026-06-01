# SZL Holdings — On-Call and Incident Model

**Purpose:** Define the on-call rotation model, incident severity classification, escalation paths, and incident management procedures.

**As of:** April 2026

---

## On-Call Rotation

### Rotation Structure

During pre-revenue / Series A phase, on-call is a single-engineer primary rotation. As headcount grows, the model evolves to a tiered structure.

**Current (Series A phase):**
- Primary on-call: Founder / Engineering lead (24/7 for P0; business hours for P1–P2)
- Escalation: External advisor or contractor for domain expertise as needed

**Target (Post Series A / First Customers):**

| Tier | Responsibility | Rotation Cadence |
|---|---|---|
| Primary | First responder for all alerts | 1-week rotations |
| Secondary | Backup if primary unresponsive within 15 minutes | 1-week rotations (offset) |
| Domain Expert | Called in for domain-specific incidents (maritime, security, real estate) | On-demand |
| Executive | P0 escalation and customer communication | On-demand |

### On-Call Handoff Checklist

At the start of each rotation, the incoming on-call engineer should:
1. Review any open P0/P1 incidents from the previous rotation
2. Review pending approval latency breaches
3. Verify API health endpoint is returning healthy
4. Confirm alert channels are active and routing correctly
5. Confirm personal pager/phone is receiving test alerts

---

## Incident Severity Classification

| Severity | Definition | Examples | Response Target |
|---|---|---|---|
| **P0 — Critical** | Platform is down or data is at risk | API unavailable, database connection lost, authentication broken | Immediate (< 5 min to acknowledge) |
| **P1 — High** | Core functionality degraded for all users | Workflow engine not processing, AI inference failing, significant latency spike | 15 minutes to acknowledge |
| **P2 — Medium** | Some users affected or non-critical feature broken | Signal ingestion delay, one domain pack unavailable, email not delivering | 1 hour to acknowledge |
| **P3 — Low** | Minor issue; no user impact | Non-critical background job failure, warning log spike | Next business day |

---

## Incident Response Procedure

### P0 — Critical

**Timeline:**
- T+0: Alert fires → Primary on-call paged via PagerDuty (call)
- T+5: Acknowledge or escalate to secondary
- T+15: Assessment complete; communication issued if customer-facing
- T+30: Mitigation in place or workaround active
- T+60: Resolution or escalation to extended team
- T+2h: Customer communication with status update
- Post-incident: Post-mortem required within 48 hours

**Communication:**
- Internal: Slack `#incidents-p0` channel with real-time updates
- Customer: Email notification if incident affects customer-facing services > 30 minutes
- Investor: No proactive communication unless incident involves data breach

**Steps:**
1. Acknowledge the alert in PagerDuty
2. Open a Slack thread in `#incidents-p0` with incident description
3. Assess scope: What is down? Who is affected? Is data at risk?
4. Implement mitigation (restart service, rollback, hotfix)
5. Verify resolution (health check + smoke test)
6. Update Slack thread with resolution summary
7. Open post-mortem document within 48 hours

---

### P1 — High

**Timeline:**
- T+0: Alert fires → Primary on-call paged via PagerDuty (SMS)
- T+15: Acknowledge
- T+60: Mitigation in place
- T+4h: Resolution or escalation

**Steps:**
1. Acknowledge the alert
2. Open a thread in Slack `#incidents`
3. Diagnose and mitigate
4. Verify resolution
5. Document findings in thread

---

### P2 and P3 — Lower Severity

- P2: Triaged during business hours; tracked in incident register
- P3: Logged in Slack `#platform-health`; addressed in next sprint

---

## Post-Mortem Process

All P0 incidents require a post-mortem within 48 hours of resolution.

### Post-Mortem Template

```markdown
## Incident: [Title]
**Date:** 
**Severity:** P0
**Duration:** [Start time] → [End time] ([N] minutes)
**Affected services:**
**Customer impact:**

## Timeline
- HH:MM — Alert fired
- HH:MM — Acknowledged
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — Resolution confirmed

## Root Cause
[Technical description of what failed and why]

## Contributing Factors
[What conditions made this incident possible or worse]

## What Went Well
[What the response team did well]

## What Could Be Improved
[Process, tooling, or monitoring gaps that should be addressed]

## Action Items
| Action | Owner | Due Date | Status |
|---|---|---|---|
| | | | |
```

### Post-Mortem Principles

- **Blameless:** Focus on systems and processes, not individuals
- **Specific:** Every contributing factor must be specific enough to address
- **Action-oriented:** Every post-mortem must produce at least one concrete action item
- **Published:** Post-mortems are shared with the full team

---

## Runbook Library

The following runbooks must be maintained and accessible to on-call engineers:

| Runbook | Trigger | Location |
|---|---|---|
| API server not responding | P0 alert | `docs/ops-runbook.md#api-restart` |
| Database connection failure | P0 alert | `docs/ops-runbook.md#db-recovery` |
| Workflow engine crash | P0 alert | `docs/ops-runbook.md#alloy-restart` |
| Signal ingestion delay | P2 alert | `docs/ops-runbook.md#signal-backlog` |
| Approval latency breach | Business P1 | `docs/ops-runbook.md#approval-escalation` |
| Database migration failure | Deploy | `docs/ops-runbook.md#migration-rollback` |
| AI inference failure | P1 alert | `docs/ops-runbook.md#ai-fallback` |

---

## Alert Channel Configuration

| Channel | Tool | Who Receives |
|---|---|---|
| P0 | PagerDuty (phone call) | Primary on-call → Secondary (5 min no answer) → Executive (15 min no answer) |
| P1 | PagerDuty (SMS + app) | Primary on-call |
| P2 | Slack `#incidents` + email | Engineering team |
| P3 | Slack `#platform-health` | Engineering team |
| Business SLO breach | Slack `#business-ops` | Product + operations |
| Security incident | Slack `#security-incidents` | Security team + executive |

---

*This model should be reviewed and updated at each headcount milestone and after every P0 incident.*
