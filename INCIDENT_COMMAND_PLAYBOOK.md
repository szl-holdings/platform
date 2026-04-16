# Incident Command Playbook — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Incident Commander, engineering, on-call responders
**Companion docs:** [SEVERITY_MODEL.md](SEVERITY_MODEL.md) · [SUPPORT_OPERATIONS.md](SUPPORT_OPERATIONS.md) · [RUNBOOK_COMMON_FAILURES.md](RUNBOOK_COMMON_FAILURES.md) · [STATUSPAGE_PLAN.md](STATUSPAGE_PLAN.md)

---

## Purpose

This playbook defines how the SZL Holdings team detects, declares, commands, communicates, resolves, and reviews incidents. It applies to all P0 and P1 incidents. P2 incidents follow a lighter version of this process.

The goal is consistent, fast, confident response — not heroics and not improvisation.

---

## Incident Commander Role

The Incident Commander (IC) is the single owner of the incident response. The IC coordinates without doing the hands-on technical work. One person is IC at any time.

**IC responsibilities:**
- Declare the incident and assign initial severity per [SEVERITY_MODEL.md](SEVERITY_MODEL.md)
- Coordinate technical responders without executing fixes personally
- Own all communications: status page, customer notifications, internal updates
- Make the rollback-vs-fix-forward call
- Decide when the incident is resolved
- Schedule the post-incident review
- File the incident report

**Who is IC:**
- P0: Stephen Lutar by default; most senior engineer present if Stephen is unavailable
- P1: Most senior engineer available; notify Stephen within 1 hour
- P2: Lead engineer handling the issue; no formal IC role required

**IC transfer:** IC responsibilities can be transferred. When transferred, log the handover time, incoming IC name, and current incident state in the incident record. See [SUPPORT_HANDOFF_GUIDE.md](SUPPORT_HANDOFF_GUIDE.md).

---

## Phase 1: Detection and Declaration (0–15 minutes)

### Detection Sources

| Source | How to Act |
|--------|-----------|
| Monitoring alert (Azure Application Insights) | Verify alert is real → classify → declare |
| User report (support email, Slack) | Reproduce → classify → declare |
| Manual observation (routine check, deploy verification) | Confirm → classify → declare |
| Automated uptime monitor | Verify → classify → declare |

### Declaration Steps

1. **Confirm the issue is real.** Do not declare for a single transient error. Do declare immediately for anything matching P0/P1 criteria.
2. **Assign initial severity** per [SEVERITY_MODEL.md](SEVERITY_MODEL.md). Use the decision tree. When in doubt, classify higher.
3. **Announce the incident** internally (Slack or direct message): "I am declaring a P[X] incident. Issue: [brief description]. I am IC. We are investigating."
4. **Open the incident record** (see template at end of this document).
5. **For P0:** Post initial status page update immediately (see [STATUSPAGE_PLAN.md](STATUSPAGE_PLAN.md)).

---

## Phase 2: Investigation and Containment (15 min – 2 hours)

### Initial Triage Questions

Answer these as fast as possible:

1. When did this start? (Check logs, deploy history)
2. What changed recently? (Deployments, config changes, dependency updates)
3. What is the blast radius? (All users? All orgs? One specific org? One route?)
4. Is customer data at risk? (Potential breach → engage legal immediately)
5. Is rollback an option? (When was the last known-good deploy?)

### Rollback Decision

Make this call early. Rollback is almost always the right first move for P0:

| Condition | Decision |
|-----------|---------|
| Deployment within last 2 hours | Rollback first, investigate second |
| Data integrity at risk | Rollback immediately |
| Root cause identified and fix is < 30 minutes | Fix forward |
| Fix path unclear or > 30 minutes | Rollback and fix on next cycle |

Rollback procedure: See `RUNBOOK_COMMON_FAILURES.md → Scenario: Rollback`.

### Containment Actions

- Stop ongoing data writes if integrity is at risk
- Block a specific route if it is the source of the issue
- Suspend a specific org if the issue is tenant-specific and spreading
- Take the application offline (last resort for P0 data scenarios)

### Evidence Preservation

**Before making changes, capture:**
- Current error logs (tail relevant service logs)
- Database query errors (check PostgreSQL logs)
- Relevant audit trail entries
- Any anomalous patterns in the Proof Chain

Do not delete or overwrite anything until the incident is resolved.

---

## Phase 3: Resolution

1. **Apply the fix** (hotfix, rollback, config change, or patch)
2. **Verify the fix** — reproduce the original issue and confirm it is gone
3. **Smoke test core paths:** authentication, home dashboard, at least one key domain route (Vessels fleet view, Aegis dashboard, etc.)
4. **Monitor for 30 minutes** after fix deployment before declaring resolved
5. **Confirm no regression** in adjacent functionality

### Fix Deployment Checklist

- [ ] Fix applied and deployed
- [ ] `GET /api/health` returns 200
- [ ] Authentication flow tested (login, logout)
- [ ] Affected route/feature confirmed working
- [ ] No new errors appearing in logs
- [ ] Monitoring shows return to normal

---

## Phase 4: Communication

### Internal Communication

Update the incident Slack thread every 30 minutes during P0/P1:
```
[HH:MM UTC] Status update — P[X] incident
Current state: [investigating / contained / resolving / resolved]
What we know: [brief]
Next update: [HH:MM UTC]
IC: [Name]
```

### Status Page Communication

See [STATUSPAGE_PLAN.md](STATUSPAGE_PLAN.md) for the status page workflow and templates.

**P0/P1 update cadence:**
- P0: Every 15 minutes until resolved
- P1: Every 2 hours until resolved
- Always: post "Resolved" update when incident is closed

### Customer Communication

**When to contact customers directly:**
- P0 with confirmed data breach or data loss
- P0 outage lasting > 30 minutes
- P1 affecting a specific enterprise customer for > 2 hours
- Any incident requiring customer action (password reset, re-authentication, etc.)

**Customer contact template:**

```
Subject: Service Disruption — [Brief Description] — [Date]

We experienced a disruption to [service/feature] on [date] from [start time] UTC.

What happened: [Brief explanation — avoid technical jargon]

Impact: [What was affected. Be specific about scope.]

Resolution: [What we did to fix it.]

What you should do: [If action required. Otherwise: "No action is required on your part."]

We apologize for any inconvenience. If you have questions, contact support@szlholdings.com.

Stephen Lutar
Founder & CEO, SZL Holdings
```

---

## Phase 5: Post-Incident Review

### Requirements by Severity

| Severity | Post-Mortem | Filing Location | Deadline |
|----------|-------------|-----------------|---------|
| P0 | Required | `docs/internal/incidents/` | Within 24 hours |
| P1 | Required | `docs/internal/incidents/` | Within 48 hours |
| P2 | Recommended | `docs/internal/incidents/` | Within 1 week |
| P3 | Not required | Issue tracker comment | N/A |

### Post-Incident Review Format

File at: `docs/internal/incidents/YYYY-MM-DD-[brief-description].md`

```markdown
## Incident Summary

- Date/Time (UTC):
- Duration:
- Severity:
- Incident Commander:
- Affected services:
- User impact: (number of users, orgs, duration of impact)

## Timeline (all times UTC)

- HH:MM — [Event]
- HH:MM — [Detection]
- HH:MM — [Declaration]
- HH:MM — [Containment action]
- HH:MM — [Resolution]
- HH:MM — [Post-mortem scheduled]

## Root Cause

[Clear description of the root cause. Not the symptom — the underlying cause.]

## Contributing Factors

- [Factor 1]
- [Factor 2]

## What Went Well

- [e.g., Detection was fast]
- [e.g., Rollback was smooth]

## What Could Be Improved

- [e.g., Communication lag between detection and declaration]
- [e.g., No runbook for this scenario]

## Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| | | | |

## Customer Impact Statement

[What was communicated to customers, if anything. Or: "No customer communication required."]
```

---

## Security Incident Addendum

If the incident involves a potential security breach, unauthorized access, or data exposure, layer in:

1. **Immediately notify** stephen@szlholdings.com — do not wait for confirmation
2. **Engage legal counsel** before making any public statement
3. **Preserve all logs** — do not delete, rotate, or overwrite any logs until advised by legal
4. **Rotate credentials** if any exposure is confirmed (see `RUNBOOK_COMMON_FAILURES.md → Scenario: Credential Exposure`)
5. **GDPR/CCPA notification:** Begin tracking the 72-hour clock immediately upon confirmation
6. **Do not disclose details** of a security incident beyond the minimum necessary for immediate response

Security disclosures: security@szlholdings.com

---

## Contacts

| Role | Contact | When |
|------|---------|------|
| Founder / CEO | stephen@szlholdings.com | All P0; P1 within 1 hour |
| Security contact | security@szlholdings.com | All security incidents |
| Azure Support | Azure portal ticket | Infrastructure failures |
| Legal counsel | [designate before GA] | Confirmed breach or legal risk |

---

## Incident Record Template

Create a new record immediately when an incident is declared.

```
INCIDENT RECORD

Incident ID: INC-[YYYYMMDD-NNN]
Severity: P[0-3]
IC: [Name]
Declared: [YYYY-MM-DD HH:MM UTC]

Summary: [1-2 sentence description]

Status: [Investigating / Contained / Resolving / Resolved]

Timeline:
- [HH:MM] Declared P[X]
- [HH:MM] [Next update]

Responders:
- IC: [Name]
- Technical: [Names]

Last updated: [HH:MM UTC]
```

---

*Incident Command Playbook last reviewed: **2026-04-16** · Next review: **2026-07-01***
