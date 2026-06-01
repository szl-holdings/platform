# Incident Triage Model

Phase C · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

A consistent way to classify, route, and resolve operational incidents.
At founder-stage, fast classification matters more than process
sophistication.

## Severity Matrix

| Severity | Definition | Response | Founder Page? |
|----------|-----------|----------|---------------|
| **P0** | Customer-impacting outage; data loss; auth broken; security incident | <15 min ack, all-hands | Yes, immediately, 24×7 |
| **P1** | Major degradation; one workspace down; one critical workflow broken | <1 hour ack, founder + on-call | Yes, business hours; SMS after hours |
| **P2** | Single-feature regression; recoverable error rate elevated | Same business day | No — Slack notification |
| **P3** | Minor bug; cosmetic; non-blocking | Next business day | No |
| **P4** | Backlog item; no operational impact | Triaged weekly | No |

## Classification Rules

If any one applies, escalate to the higher severity:

- Affects more than one tenant → +1 severity
- Touches Restricted-class data → minimum P1
- Auth, billing, or proof chain involved → minimum P1
- Production deploy occurred in last 30 min → start at P1, downgrade only after isolation
- External dependency (AI provider, Stripe, Clerk) is the root cause →
  reclassify as P2 once a workaround or graceful degradation is shipped

## Sources of Incident Signal

| Source | Tier-1? | Notes |
|--------|---------|-------|
| Founder phone (customer call) | Yes | Always P1 minimum until classified |
| Pager from Tier-1 telemetry alert | Yes | See `telemetry-priority-matrix.md` |
| Slack Connect channel from a partner | Yes | Same business hour ack |
| `support@szlholdings.com` inbox | No | Same business day |
| GitHub issue from internal team | No | Triaged in `release-train-model.md` cadence |
| Smoke test failure on Staging | No | Blocks deploy — handled in deploy runbook |
| Security scanner alert | Yes | Auto-classified per `ops/security/` scanners |

## Roles During an Incident

Founder-stage uses three named roles. The same person may hold all three
on a small incident; for a P0 they must be different people if possible.

- **Incident Commander (IC)**: makes calls, owns the timeline. Default: founder.
- **Comms Lead**: writes status updates to customers and the team. Default: founder.
- **Operator**: executes commands. Default: on-call engineer.

## Response Procedure (per severity)

### P0

1. IC declares P0 in the incident channel (Slack)
2. IC opens a status doc — timestamp every action
3. Comms posts initial customer-facing message (within 15 min)
4. Operator runs the deploy-and-rollback procedure if release-related,
   or escalates to Replit support if infra-related
5. Comms posts updates every 30 min until resolved
6. Post-incident: 48-hour written postmortem (template below)
7. Add to `risk-register.md` and to `what-changed.md`

### P1

1. IC opens a P1 channel thread
2. Operator reproduces and isolates within 1 hour
3. Comms updates the affected partner directly
4. Fix or workaround within the same business day
5. Post-incident: 1-week written postmortem if customer was impacted

### P2 / P3 / P4

1. Filed as GitHub issue with severity label
2. Routed to next release train per `release-train-model.md`
3. No special channels, no paging

## Postmortem Template

```
Incident: <one-line title>
Severity: <P0|P1|P2>
Detected: <timestamp + source>
Resolved: <timestamp>
Total impact: <minutes/hours>
Tenants affected: <count + names if customer was named>
Root cause: <one paragraph>
Timeline: <bulleted, timestamped>
What worked: <bullets>
What didn't: <bullets>
Action items: <named owner, due date> — also added to risk-register.md
```

## Replit Infra Incidents

For incidents traced to Replit-managed infrastructure (database, deploy
runtime, network):

1. File support ticket with Replit (founder email)
2. Capture incident ID
3. Classify customer-facing impact at our severity scale
4. Document in postmortem as `external-dependency` with the Replit
   incident ID

This boundary is real: we do not own Replit infra; we own the customer
experience over it. The `risk-register.md` lists this as a top-tier
dependency.

## Anti-Patterns

- Skipping the channel because the founder is debugging — every P0/P1
  has a channel even if the channel has one person in it; the timeline
  is the whole point
- Skipping the postmortem because the cause was "obvious" — the postmortem
  exists to prevent the next incident, not to find the cause of this one
- Letting a P1 stretch past one day without escalation
