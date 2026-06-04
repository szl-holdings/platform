# Support Handoff Guide — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Support team, Incident Commanders, engineering on-call
**Companion docs:** [SUPPORT_OPERATIONS.md](support-operations.md) · [INCIDENT_COMMAND_PLAYBOOK.md](../operations/incident-command.md) · [CUSTOMER_ESCALATION_MATRIX.md](customer-escalation.md)

---

## Purpose

A handoff is a transfer of ownership of an active support issue or incident from one person to another. Poor handoffs cause issues to stall, customers to hear nothing, and context to be lost. This guide defines when, how, and what to hand off.

---

## When a Handoff Is Required

A handoff is required when:

- The current owner will be unavailable for more than 2 hours during business hours (or immediately during a P0/P1 incident)
- A support issue requires a different type of expertise (e.g., handing from support to engineering)
- An incident is transitioning from active response to monitoring phase with a different person watching
- End of day for an ongoing issue that needs overnight coverage
- The Incident Commander role is being transferred during a long incident

---

## Handoff Types

### Type 1: Incident Commander Transfer (During Active P0/P1)

Most critical. The IC cannot step away without explicitly transferring ownership.

**Protocol:**
1. Find a replacement IC who is available and briefed
2. Provide verbal (Slack voice/video or call) handoff — written alone is not sufficient for P0
3. Transfer the incident record with full context
4. Announce in the incident channel: "IC transfer: [Incoming IC] is now Incident Commander as of [HH:MM UTC]. [Outgoing IC] is stepping off."
5. Both ICs confirm the transfer in writing in the incident record

**Minimum handoff context:**
- Current incident state and severity
- Root cause hypothesis (or "unknown — investigating X, Y, Z")
- What has been tried already (and what was ruled out)
- Who is actively working on the technical fix
- Status page / customer communication status
- Next expected update time
- Any legal or security sensitivities

---

### Type 2: Support Ticket Handoff (Non-Incident)

**Protocol:**
1. Update the issue record with complete current state
2. Send a direct message (Slack or email) to the incoming owner with:
   - What the customer asked
   - What has been investigated
   - What the customer was last told and when
   - What the next action is
   - SLA deadline for next response
3. CC the customer on any internal note where appropriate — or do not involve the customer if internal handoff is seamless

**Written handoff template:**

```
SUPPORT HANDOFF

Issue: [Brief description]
Customer: [Name / org]
Opened: [Date/time]
Severity: [Critical / High / Medium / Low]

Current status: [1–2 sentences on where things stand]

What we know: [Findings so far]
What we've tried: [Actions taken and results]
Open questions: [What still needs investigation]

Last customer communication: [Date/time and what was said]
Customer is expecting: [Response by X date/time, or: "Has not been notified yet"]

Next action needed: [Specific action for the incoming owner]
SLA deadline: [When the next response must happen]

Outgoing owner: [Name]
Incoming owner: [Name]
Handoff time: [HH:MM UTC]
```

---

### Type 3: End-of-Day Handoff (Ongoing Issue)

Used when an active issue will not be resolved before end of business day and needs overnight visibility.

**Protocol:**
1. Assess severity — can this wait until next business day, or does it need overnight monitoring?
2. If it needs overnight monitoring and on-call coverage exists [GA]: page the on-call responder
3. If it can wait: mark the issue with "pending resume" status and document the planned next action
4. Notify the customer with a clear expectation: "We are continuing to investigate and will update you by [time] tomorrow."
5. Log the end-of-day state in the issue record

**End-of-day status template (in issue record):**

```
[DATE HH:MM UTC] — EOD STATUS

Current state: [What's happening]
Blocking factor: [Why not resolved yet]
Planned next action: [What will happen next]
Resuming: [HH:MM UTC] or [Name] monitoring overnight
Customer communication: [What they were told; next update scheduled for X]
```

---

## What Must Always Be in the Handoff Record

Regardless of handoff type, these items must always be documented:

| Item | Required |
|------|----------|
| Current status in one sentence | ✅ |
| What has been tried (and ruled out) | ✅ |
| Current hypothesis for root cause | ✅ |
| Last customer-facing communication | ✅ |
| Next action and owner | ✅ |
| SLA / next response deadline | ✅ |
| Any legal, security, or escalation flags | ✅ if applicable |
| Link to incident record or ticket | ✅ |

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem |
|-------------|---------|
| "I'll just send a quick Slack message" for P0 IC transfer | Context lost; incoming IC unprepared |
| Marking an issue as resolved without verifying | Customer calls back; loses trust |
| Handing off without telling the customer | Customer expects the old owner; gets confused |
| "I'll catch you up when I'm back" | If original owner is unavailable, issue stalls |
| Handoff to someone who is also about to go offline | Creates a chain of unowned issues |

---

## Customer Communication During Handoffs

Customers do not need to know about internal handoffs. What they care about:

- Is someone still working on my issue?
- When will I hear back?

If a handoff causes a delay in response: proactively communicate to the customer before the SLA expires:

```
Hi [Name],

Quick update — your issue is still being actively worked on. We are [brief status update]. 
You will hear from us by [time/date].

[Name]
SZL Holdings Support
```

---

## Incident Commander Handoff Checklist

Before stepping off as IC during a P0 or P1:

- [ ] Incoming IC identified and verbally briefed
- [ ] Incident record updated with current state
- [ ] Handoff announced in incident Slack thread
- [ ] Status page update cadence communicated to incoming IC
- [ ] Next scheduled customer update time communicated
- [ ] Any legal/security sensitivities explicitly called out
- [ ] Both ICs confirm the transfer in writing in the incident record

---

## Tooling Reference

Until a formal ticketing system is in place:

| Purpose | Tool |
|---------|------|
| Incident records | `docs/internal/incidents/` markdown files |
| Customer support tracking | Email thread + internal log in `docs/internal/support/` |
| Incident channel | Dedicated Slack channel per incident (e.g., `#incident-2026-04-16`) |
| Knowledge base | This documentation set |

---

*Support Handoff Guide last reviewed: **2026-04-16** · Next review: **2026-07-01***
