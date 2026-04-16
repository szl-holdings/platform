# Status Page Plan — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Engineering, support team, enterprise buyers
**Companion docs:** [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md) · [SEVERITY_MODEL.md](SEVERITY_MODEL.md) · [SUPPORT_OPERATIONS.md](SUPPORT_OPERATIONS.md)

> **Current state:** A public status page is not yet live. This document defines the target model, planned implementation, and the interim communication approach for the pre-GA phase.
>
> **Interim approach:** During design partner / alpha phase, status is communicated directly to affected parties via email and Slack.

---

## Purpose

A status page provides customers with real-time, transparent visibility into platform health. It reduces inbound support volume during incidents, demonstrates operational maturity to enterprise buyers, and creates a historical record of platform reliability.

---

## Target Implementation

### Platform

**Recommended:** Betteruptime, Statuspage.io (Atlassian), or self-hosted Upptime (GitHub Actions + GitHub Pages).

**Decision criteria:**
- Betteruptime: low cost, clean UI, built-in monitoring + alerting + status page, CNAME support — preferred for early GA
- Statuspage.io: Atlassian ecosystem integration, more complex, appropriate for large enterprise
- Upptime: open source, free, GitHub-native — viable fallback if cost is a constraint

**Target URL:** `status.szlholdings.com` (CNAME to provider)  
**Target launch:** Pre-GA (before first production customer)

---

## Components to Monitor

The status page will display the health of these components:

| Component | What It Covers | Check Method |
|-----------|---------------|-------------|
| Platform API | `GET /api/health` — overall API health | HTTP check |
| Authentication | `GET /api/auth/status` or login flow | HTTP check |
| SZL Holdings (main site) | Root page response | HTTP check |
| Aegis | Aegis app response | HTTP check |
| Vessels | Vessels app response | HTTP check |
| Terra | Terra app response | HTTP check |
| PRISM Counsel | PRISM app response | HTTP check |
| Command Portal | Command portal response | HTTP check |
| Database | Backend health check that probes DB | HTTP check on `/api/health/db` |
| AI Services | Backend health check for AI provider connectivity | HTTP check on `/api/health/ai` |

**Check interval:** Every 1–5 minutes (provider-dependent)

---

## Incident Lifecycle on the Status Page

### Step 1: Issue Detected

Monitoring alert fires → Incident Commander declares incident → First status page update posted.

**Time target:** P0: within 30 minutes. P1: within 1 hour.

### Step 2: Investigating

```
Title: Investigating [brief description]
Status: Investigating

We are investigating reports of [issue description]. Our team is actively looking into this.
Affected components: [List]
Next update: [Time]
```

### Step 3: Identified

```
Title: [Issue description] — Identified
Status: Identified

We have identified the cause of [issue description]: [brief cause]. We are working on a fix.
Affected components: [List]
Next update: [Time]
```

### Step 4: Monitoring

```
Title: [Issue description] — Monitoring
Status: Monitoring

A fix has been deployed. We are monitoring to confirm the issue is fully resolved.
Affected components: [List]
Next update: [Time — or "We will confirm resolution once monitoring is complete"]
```

### Step 5: Resolved

```
Title: [Issue description] — Resolved
Status: Resolved

This incident has been resolved. [Brief description of fix applied.]

Impact: [Duration from detection to resolution. What was affected.]

We will publish a post-mortem within [24/48] hours.
```

---

## Update Cadence

| Severity | Cadence |
|----------|---------|
| P0 | Every 15 minutes until resolved |
| P1 | Every 2 hours until resolved |
| P2 | Only if user-facing; end of day update |
| P3 | Not posted |

**Rule:** Never leave a status page incident in "Investigating" for more than 30 minutes without an update.

---

## Maintenance Windows

Planned maintenance is communicated on the status page in advance:

- **Notice:** At least 48 hours before (72 hours for major maintenance)
- **Format:** Scheduled maintenance component at planned time
- **Duration:** If maintenance runs long, post an update explaining the delay

**Maintenance window template:**

```
Title: Scheduled Maintenance — [Brief description]
Status: Scheduled

We will be performing scheduled maintenance on [component] on [date] from [start time] to [end time] UTC.

Expected impact: [What will be unavailable or degraded]
What we're doing: [Brief description]

We will post updates if the maintenance extends beyond the expected window.
```

---

## Subscriber Management

The status page will support email/SMS/webhook subscriptions:

- Users can subscribe to all incidents or specific components
- Enterprise customers can subscribe via webhook for automatic alerting into their monitoring systems
- SZL Holdings team subscribes to all components

---

## Historical Incident Records

All resolved incidents remain publicly visible on the status page. This serves as the SLA evidence record for enterprise customers. Historical incidents should never be deleted.

Post-mortems are linked from the status page update when published. Post-mortems that contain sensitive security information are summarized rather than fully disclosed.

---

## Interim Process (Pre-Status-Page Launch)

Until the status page is live, incidents are communicated:

1. **Design partners:** Direct Slack message or email within 30 minutes of P0/P1 declaration
2. **All customers:** Direct email per [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md) customer communication templates
3. **Website:** If the main `szlholdings.com` domain is affected, a notice is posted as soon as the site is restored

---

## Launch Checklist

Before the status page goes live:

- [ ] Provider account created and configured
- [ ] Custom domain `status.szlholdings.com` DNS configured
- [ ] All components added and uptime monitors configured
- [ ] Team members added with IC-level write access
- [ ] Email notification template tested
- [ ] Webhook for internal alerting configured
- [ ] Link added to `szlholdings.com` footer
- [ ] Link added to Trust Center
- [ ] Incident response team trained on posting procedures

---

*Status Page Plan last reviewed: **2026-04-16** · Target launch: **Pre-GA***
