# Founder Control Room

**Owner:** Founder
**Last updated:** April 2026
**Version:** 1.0

---

## Purpose

This document specifies the Founder Control Room — a single-pane-of-glass view for answering five operational questions at any moment:

1. **What is live?** — What is deployed, where, and at what version?
2. **What changed?** — What was released recently and what did it contain?
3. **What is healthy?** — Which systems are operating within SLO?
4. **What is broken?** — Which systems are degraded or failing?
5. **What needs action now?** — What requires immediate founder attention?

This spec covers: what data is shown, where it comes from, how it is displayed, and how to use it during normal operations and incidents.

---

## Control Room Layout

The control room is organized as five panels, one per question. It is designed to be readable in under 60 seconds.

```
┌─────────────────────────────────────────────────────────────────┐
│  SZL HOLDINGS — OPERATIONS CONTROL ROOM          [refresh time] │
├──────────────────────┬──────────────────────────────────────────┤
│  [1] WHAT IS LIVE    │  [2] WHAT CHANGED                        │
│  Deployment status   │  Recent releases and changes             │
├──────────────────────┼──────────────────────────────────────────┤
│  [3] WHAT IS HEALTHY │  [4] WHAT IS BROKEN                      │
│  System health grid  │  Active alerts and degraded services     │
├──────────────────────┴──────────────────────────────────────────┤
│  [5] WHAT NEEDS ACTION NOW                                       │
│  Actionable items requiring founder decision in the next 24h    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Panel 1: What Is Live

**Purpose:** Confirm exactly what is deployed to production at this moment. Prevents confusion about which version customers are using.

### Data Shown

| Field | Source | Refresh |
|-------|--------|---------|
| Service name | Static config | N/A |
| Deployment type (Autoscale / Reserved VM / EAS) | `deployment-decision.md` | Manual on change |
| Current version / build SHA | `GET /api/health` → `.version` | Real-time |
| Deployment timestamp | Replit deployment dashboard | On deploy |
| Deployment status | Replit deployment dashboard | Real-time |
| Domain / URL | Static config | Manual on change |

### Layout

```
SERVICE              TYPE          VERSION          DEPLOYED         STATUS
─────────────────────────────────────────────────────────────────────────────
api-server           Reserved VM   v1.4.2 (abc1234) Apr 15 14:32 UTC  LIVE ●
szl-holdings (web)   Autoscale     v1.4.2 (abc1234) Apr 15 14:35 UTC  LIVE ●
aegis                Autoscale     v1.4.2 (abc1234) Apr 15 14:35 UTC  LIVE ●
terra                Autoscale     v1.4.2 (abc1234) Apr 15 14:35 UTC  LIVE ●
vessels              Autoscale     v1.4.2 (abc1234) Apr 15 14:35 UTC  LIVE ●
carlota-jo           Autoscale     v1.4.2 (abc1234) Apr 15 14:35 UTC  LIVE ●
command              Autoscale     v1.4.2 (abc1234) Apr 15 14:35 UTC  LIVE ●
CORTEX mobile        EAS Build     v0.9.1 (build 44) Apr 12 16:00 UTC DISTRIBUTED
```

**Status indicators:**
- `LIVE ●` (green) — Deployed and health check passing
- `DEGRADED ●` (yellow) — Deployed but health check failing or elevated errors
- `DOWN ●` (red) — Not responding or health check returning non-200
- `DEPLOYING ●` (blue) — Deployment in progress
- `DISTRIBUTED` — Mobile app distributed via app store, no server health check

### How to Use

- Check this panel before any customer demo to confirm the correct version is live.
- Check this panel immediately after a deployment to confirm all services updated.
- If version numbers are inconsistent across services: a partial deployment occurred — check for errors in the staging artifact that failed to deploy.

---

## Panel 2: What Changed

**Purpose:** Know what was released recently, what it contained, and whether any known issues were introduced.

### Data Shown

**Last 5 releases (rolling):**

| Field | Source |
|-------|--------|
| Release tag / version | Git tag + Replit deployment |
| Date and time | Deployment timestamp |
| Author | Git commit author |
| Summary | Pull request title or release notes |
| Affected services | Derived from changed artifact paths |
| Known issues | Manual entry by founder/engineer |
| Smoke test result | Post-deploy verification log |

### Layout

```
RELEASE HISTORY (last 5)
─────────────────────────────────────────────────────────────────────────────
v1.4.2  |  Apr 15 14:32 UTC  |  Stephen  |  Add Vessels freight modules
        |  Services: vessels, api-server
        |  Smoke tests: PASS  |  Known issues: none

v1.4.1  |  Apr 14 09:15 UTC  |  Stephen  |  Fix auth session expiry bug
        |  Services: api-server
        |  Smoke tests: PASS  |  Known issues: none

v1.4.0  |  Apr 12 16:00 UTC  |  Stephen  |  CORTEX mobile build 44, Aegis security modules
        |  Services: aegis, api-server, cortex-mobile
        |  Smoke tests: PASS  |  Known issues: none

v1.3.9  |  Apr 10 11:22 UTC  |  Stephen  |  Terra distress map improvements
        |  Services: terra, api-server
        |  Smoke tests: PASS  |  Known issues: none

v1.3.8  |  Apr 08 09:00 UTC  |  Stephen  |  Legal module security hardening
        |  Services: api-server
        |  Smoke tests: PASS  |  Known issues: none
```

**Pending / in-progress:**
```
PENDING PROMOTION
─────────────────────────────────────────────────────────────────────────────
[none]  |  No staged builds awaiting production promotion
```

### How to Use

- When an incident occurs: check what changed in the last release first.
- Before a stakeholder demo: confirm no known issues in the current release.
- When a partner asks "what changed?": this panel is the answer.
- Rollback SHA is available here for every release.

### Data Location

Release history is maintained in `ops/cto/release-log.md` (to be created once release cadence begins). Until then, source from:
- Replit deployment dashboard (deployment history)
- GitHub commit history / release tags

---

## Panel 3: What Is Healthy

**Purpose:** Confirm all systems are operating within SLO. This is the green light panel — if everything here is green, production is healthy.

### Data Shown

**System health grid (updated every 5 minutes via `/api/health/detailed`):**

| System | Metric | SLO Target | Current | Status |
|--------|--------|------------|---------|--------|
| API availability | `/health/live` uptime | 99.9% | — | ● |
| API latency (p95) | Response time | < 500ms | — | ● |
| API error rate | 5xx / total | < 1% | — | ● |
| Database | Connection + latency | < 100ms | — | ● |
| Database connection pool | Connections used | < 80% | — | ● |
| Auth flow | Login success rate | > 95% | — | ● |
| AI provider (primary) | Request success rate | > 99% | — | ● |
| AI provider (fallback) | Reachability | Reachable | — | ● |
| Job queue | Pending depth | < 50 | — | ● |
| WebSocket server | Active connections healthy | True | — | ● |
| Web apps | All paths returning 200 | 100% | — | ● |

**SLO compliance summary:**
```
API SERVER:      99.97% uptime (30d)  |  p95: 210ms  |  errors: 0.3%
DATABASE:        99.99% uptime (30d)  |  avg query: 45ms
AI FEATURES:     99.1% availability   |  avg response: 4.2s
WEB APPS:        100% availability    |  avg LCP: 1.8s
```

Full SLO catalog: `ops/observability/slo-catalog.md`

### Status Indicators

- `●` Green — Within SLO, no action needed
- `●` Yellow — Approaching threshold, monitor closely
- `●` Red — SLO breached, investigate immediately

### How to Use

- Daily check: scan for any non-green indicators.
- Before a deployment: baseline all metrics so you have a comparison point post-deploy.
- When sharing platform health with investors: this panel provides the summary.

### Data Source

All data sourced from `GET /api/health/detailed` using the `ALLOY_INTERNAL_TOKEN`:

```bash
curl -sf -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://szlholdings.com/api/health/detailed | jq '.'
```

---

## Panel 4: What Is Broken

**Purpose:** See all active alerts and degraded conditions in one place. If Panel 3 is the green light, Panel 4 is everything that is not green.

### Data Shown

**Active incidents:**
```
ACTIVE INCIDENTS
─────────────────────────────────────────────────────────────────────────────
[none]  |  No active incidents
```

**Active alerts (from alert matrix — `ops/observability/alert-matrix.md`):**
```
ACTIVE ALERTS
─────────────────────────────────────────────────────────────────────────────
[none]  |  No active alerts
```

**Degraded services:**
```
DEGRADED SERVICES
─────────────────────────────────────────────────────────────────────────────
[none]  |  All services within SLO
```

**Recent resolved incidents (last 7 days):**
```
RECENTLY RESOLVED
─────────────────────────────────────────────────────────────────────────────
Apr 14 09:05 UTC  |  Auth session expiry causing unexpected logouts  |  Resolved in 22min  |  SEV-2
```

### Alert Priority View

When alerts are present, they are shown by priority:

```
P0 — CRITICAL (page now)
───────────────────────────────────────────
[timestamp]  API DOWN — /health/live returned non-200 for 3 minutes
             → Action: Check Replit deployment dashboard, initiate rollback if recent deploy
             → Playbook: ops/cto/incident-and-support-playbook.md#scenario-1

P1 — HIGH (respond within 1 hour)
───────────────────────────────────────────
[timestamp]  HIGH LATENCY — p95 > 1000ms for 6 minutes
             → Action: Check DB connection pool, review slow query log
             → Playbook: ops/cto/incident-and-support-playbook.md#scenario-2

P2 — MEDIUM (review today)
───────────────────────────────────────────
[timestamp]  TLS CERT EXPIRES in 12 days — szlholdings.com
             → Action: Renew certificate via Replit/CDN settings
```

### How to Use

- Check this panel first when you receive an alert.
- Each alert entry links to the relevant playbook section.
- If a P0 alert is present: immediately switch to the incident playbook. Do not attempt diagnosis from this panel alone.
- Resolved incidents provide pattern data — review weekly for systemic issues.

---

## Panel 5: What Needs Action Now

**Purpose:** A curated, prioritized list of items that require founder attention in the next 24 hours. Distinguishes urgent-and-important from noise.

### Data Categories

**🔴 Critical — Act Immediately (< 1 hour)**
Active incidents, P0 alerts, security events, auth failures.

**🟡 Important — Act Today (< 24 hours)**
Pending release promotions awaiting sign-off, SLO breaches approaching, cert expiry within 7 days, failed smoke tests blocking a deploy.

**🔵 Informational — Review This Week**
Upcoming secret rotation reminders, dependency audit findings, slow queries exceeding thresholds, operator data freshness warnings.

### Example View

```
WHAT NEEDS ACTION NOW
─────────────────────────────────────────────────────────────────────────────

🔴 CRITICAL
   [none]

🟡 IMPORTANT
   → v1.4.3 staged and awaiting production promotion sign-off
     Staged: Apr 16 09:00 UTC  |  Smoke tests: PASS
     Action: Review release notes and promote via Replit dashboard
     Reference: ops/cto/release-and-operations-control.md#stage-3

   → FIELD_ENCRYPTION_KEY rotation due in 8 days (quarterly)
     Last rotated: Jan 15 2026
     Action: Generate new key, update production secret, restart api-server
     Reference: ops/replit/production-secret-checklist.md

🔵 INFORMATIONAL
   → DB slow query detected: /api/alloy/signals query avg 420ms (threshold: 100ms)
     Observed: Apr 16 07:15 UTC  |  Frequency: 3 occurrences
     Action: Review query plan, consider index optimization (not urgent)

   → Stripe webhook replay queue: 2 events pending retry
     Action: Check Stripe dashboard, replay if needed
```

### Action Item Sources

| Source | How it appears in Panel 5 |
|--------|--------------------------|
| Active P0/P1 alert | → Critical item, immediate link to playbook |
| Staged build awaiting sign-off | → Important item with promotion instructions |
| Quarterly secret rotation reminder | → Important item 14 days before due date |
| SLO threshold at 80% of budget | → Important item with trend data |
| Dependency audit finding (high/critical) | → Important item with CVE reference |
| Slow query or resource warning | → Informational item |
| Stripe/webhook retry queue | → Informational item |

---

## Using the Control Room — Daily Routine

### Morning Check (2 minutes)

1. Open Panel 5 — **What Needs Action Now**. Deal with any Critical items first.
2. Scan Panel 4 — **What Is Broken**. Confirm no overnight incidents.
3. Scan Panel 3 — **What Is Healthy**. Confirm all systems green.

### Pre-Deployment Check (5 minutes)

1. Panel 1 — record current version as rollback reference.
2. Panel 3 — baseline all health metrics.
3. Panel 4 — confirm no active alerts before deploying.

### Post-Deployment Check (10 minutes)

1. Panel 1 — confirm new version is live across all services.
2. Panel 2 — verify release entry appears correctly.
3. Panel 3 — watch for any metrics moving from green to yellow.
4. Panel 4 — watch for any new alerts in the first 10 minutes.
5. Panel 5 — confirm no new action items generated by the deploy.

### Incident Response (use alongside playbooks)

1. Panel 4 — get alert details and playbook link.
2. Panel 1 — confirm which version is live.
3. Panel 2 — confirm what changed recently.
4. Open the specific scenario in `ops/cto/incident-and-support-playbook.md`.
5. After resolution: update Panel 4 (mark incident resolved) and Panel 5 (close action item).

### Investor or Partner Briefing Prep

1. Panel 1 — confirms production is live at current version.
2. Panel 3 — provides uptime and SLO compliance data.
3. Panel 4 — confirms no active incidents.
4. Export a snapshot of Panels 1 and 3 for the data room if needed.

---

## Implementation Notes

The control room is initially operated as a document + manual queries (see data sources in each panel). When operational tooling is in place, the data flows are:

| Panel | Near-term implementation | Future state |
|-------|--------------------------|--------------|
| Panel 1 (Live) | Replit dashboard + manual `ops/cto/release-log.md` | Dashboard widget from Replit API |
| Panel 2 (Changed) | `ops/cto/release-log.md` + Git history | Automated release notes from CI |
| Panel 3 (Healthy) | Manual `curl /api/health/detailed` | Grafana / Datadog dashboard |
| Panel 4 (Broken) | Alert email/Slack + manual review | Grafana alerts + PagerDuty |
| Panel 5 (Action) | Founder-maintained checklist | Ops dashboard with automated triggers |

The control room does not require a custom-built UI to be operational. The data is available today via the sources documented above. A purpose-built dashboard is a future enhancement.

---

## Bookmarks for Quick Access

Save these for incident response:

```
API Health (live)     : https://szlholdings.com/api/health/live
API Health (detailed) : https://szlholdings.com/api/health/detailed
                        Header: X-Internal-Token: $ALLOY_INTERNAL_TOKEN
Replit Dashboard      : https://replit.com/deployments
Stripe Dashboard      : https://dashboard.stripe.com
OpenAI Status         : https://status.openai.com
Anthropic Status      : https://status.anthropic.com
Replit Status         : https://status.replit.com
Slack Alerts Channel  : #szl-alerts
```

---

*See also: [Release & Operations Control](./release-and-operations-control.md) · [Post-Deploy Verification](./post-deploy-verification.md) · [Incident & Support Playbook](./incident-and-support-playbook.md) · [SLO Catalog](../observability/slo-catalog.md) · [Alert Matrix](../observability/alert-matrix.md)*
