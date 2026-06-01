# Inbound Routing and Response SLA

Phase D · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

What happens between an inbound message arriving and a founder reply.
At founder-stage, response latency is the single biggest controllable
lever on conversion.

## SLA Targets

| Channel | Target First-Response | Target Resolution to Discovery |
|---------|----------------------|-------------------------------|
| Flagship contact form | ≤1 business hour | ≤1 business day |
| Direct founder email | ≤4 business hours | ≤2 business days |
| LinkedIn message (founder) | Same business day | ≤3 business days |
| Investor introduction email | ≤30 minutes | Discovery call within 5 business days |
| Partner referral | ≤1 business hour | Discovery call within 3 business days |
| Slack Connect (existing partner) | ≤1 business hour | Same business day |
| `support@szlholdings.com` | ≤1 business day | Per `support-troubleshooting-guide.md` |

Business hours: 09:00–18:00 founder local time, Monday–Friday.

## Routing Rules

### Flagship contact form

1. Form submit fires server-side ATLAS event `pipeline.lead.created`
2. Lead is auto-created in pipeline doc with source=`Direct` or
   campaign source if `?utm_source` present
3. Notification: email to founder + Slack DM
4. Auto-reply to submitter: a short, founder-voice acknowledgement
   stating the SLA above and a calendar booking link
5. SLA clock starts at form submission timestamp

### Direct founder email

1. Founder triages within 4 business hours
2. If qualifying questions answered (workload, role, domain), schedule
   discovery call directly
3. If not, send the standard qualifier (3 questions, ≤80 words)
4. Add to pipeline as lead with source=`Direct`

### Investor introduction

1. Treated as highest-priority inbound — investor warmth has a half-life
2. Founder replies within 30 minutes acknowledging
3. Discovery call booked within 5 business days
4. Investor receives a closing-the-loop reply within 7 days regardless
   of outcome
5. Add to pipeline with source=`Investor`

### Partner referral

1. Founder thanks the referring partner first
2. Reaches out to the referred contact within 1 business hour
3. References the introducing partner in the first message
4. Add to pipeline with source=`Referral` and link to the referring
   partner record

### Existing partner support inquiries

1. Routed via Slack Connect channel for that partner
2. SLA per `support-troubleshooting-guide.md`
3. Anything classifiable as P0/P1 escalates per `incident-triage-model.md`

## What Auto-Reply Looks Like

The founder voice is preserved even in automation. Auto-reply template:

```
Thanks for reaching out — saw your note come in.

You'll get a real reply from me within [SLA window]. If it's urgent,
my calendar is here: [link].

— Stephen
```

No marketing copy. No "we'll get back to you soon." Specific window,
direct calendar.

## Escalation Triggers

Any of the following triggers an SLA breach review at the founder's
weekly cadence (per `founder-operating-rhythm.md`):

- More than 2 inbound items missed SLA in a rolling 7-day window
- Any investor introduction missed the 30-minute reply
- Any partner referral missed the 1-hour reply
- Any P0/P1 from an existing partner missed the ack window

## Tooling

Currently:

- Email goes through founder's inbox (no shared inbox yet)
- Slack handles partner channels and team notifications
- The pipeline doc holds lead state until the page in
  `founder-pipeline-dashboard-spec.md` ships
- No autoresponder system; the auto-replies above are sent by founder
  templates until form-driven ones are wired up

When monthly inbound exceeds 30 items, formalize:

- A shared inbox with rotation
- An autoresponder hooked to the contact form
- An SLA tracker on the pipeline page

Until then, this is a founder discipline issue, not a tooling issue.

## Anti-Patterns

- Long, formal first replies — kills conversion vs short, direct ones
- Triaging inbound at the end of the day — a same-day reply at 4pm
  reads worse than one at 9am
- Sending investor intro replies CC'ing the introducer "for visibility"
  on the first reply — reply to the prospect first, loop the
  introducer in the next message
- Using a corporate marketing voice for a founder-stage business
