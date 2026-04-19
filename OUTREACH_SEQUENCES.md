# Outreach Sequences — Design Partner Cohort 1

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Founder, sales execution
**Companion docs:** [TARGET_ACCOUNTS.md](TARGET_ACCOUNTS.md) · [SALES_HANDOFF_GUIDE.md](SALES_HANDOFF_GUIDE.md) · [FIRST_MEETING_KIT.md](FIRST_MEETING_KIT.md)

---

## Cadence (per account)

| Day | Channel | Purpose |
|---|---|---|
| T+0 | Email #1 (vertical-specific) | Cold outreach with a specific hook |
| T+2 | LinkedIn DM | Soft warm-up referencing email |
| T+5 | Email #2 (follow-up) | Permission to bow out |
| T+8 | LinkedIn Connect | Connection request, no pitch |
| T+12 | Email #3 (break-up) | Re-surface request |

If no response after T+12: archive and re-surface in 90 days. Do not chase.

---

## Email #1 — Security (Aegis)

**Subject:** Proof chain for [Company]'s SOC decisions — design partner slot

```
[First name],

Most security tools today add recommendation volume. Almost none give your SOC a
defensible record of *why* a given action was taken — what signal, what policy, who
approved.

When the regulator, the customer, or the board asks "show me the decision trail for
incident X," your team reconstructs it from logs, Slack, and memory. That gap is the
accountability gap, and it's getting more expensive every quarter.

We built Aegis to close it: every SOC decision is signal → context → recommendation
→ simulation → policy → execution → proof. Exportable, immutable, audit-grade.

We're opening 6 design partner slots in Q2 (50% off Year 1, founder access, roadmap
input). [Company] looks like a strong fit because [specific reason].

20 minutes next week to walk you through the proof chain on a [Company]-shaped
decision?

[Your name]
SZL Holdings
```

---

## Email #1 — Maritime (Vessels)

**Subject:** Sanctions decision trail for [Company]'s charters — design partner slot

```
[First name],

Every charter and pool decision your team makes carries OFAC, EU, and IMO exposure.
When a regulator or auditor asks "walk me through how this charter cleared sanctions
on [date]," the answer today is usually email threads, Excel, and the analyst's memory.

We built Vessels to make that decision exportable: signal (sanctions hit, vessel
history, beneficial owner) → context → recommendation → policy gate → approver →
proof. One click for any audit window.

We're opening 6 design partner slots in Q2 (50% off Year 1, direct founder access).
[Company] is a strong fit because [specific reason].

20 minutes next week to walk through it on a [Company]-shaped charter?

[Your name]
SZL Holdings
```

---

## Email #1 — Real Estate (Terra)

**Subject:** IC decision trail for [Company] — design partner slot

```
[First name],

Your investment committee makes high-consequence decisions weekly. When an LP, an
auditor, or your own future IC asks "what did we know when we approved deal X, and
who approved it under what assumptions," the answer today is a deck, an email chain,
and someone's memory.

Terra is the IC's defensible memory: signal (deal, market, comp) → context →
recommendation → simulation → policy gate (LP covenants, mandate constraints) →
approver → proof. Exportable for LP reports, audits, and post-mortems.

We're opening 6 design partner slots in Q2 (50% off Year 1, founder access, roadmap
input). [Company] looks like a fit because [specific reason].

20 minutes next week to walk through it on a [Company]-shaped acquisition?

[Your name]
SZL Holdings
```

---

## Email #1 — Legal (PRISM Counsel)

**Subject:** Matter-decision proof for [Company] — design partner slot

```
[First name],

Your matter teams make high-consequence calls every day — staffing, strategy,
settlement, advice. The trail of *why* a particular call was made lives in email,
in matter notes, and in the lawyer's head. When a regulator, the client, or your
own QA team asks for that trail, reconstructing it is hours of work.

PRISM Counsel makes the matter-decision trail first-class: signal (matter event,
deadline, conflict) → context → recommendation → policy gate (ethical walls,
conflicts) → approver → proof.

We're opening 6 design partner slots in Q2 (50% off Year 1, founder access).
[Company] is a fit because [specific reason].

20 minutes next week?

[Your name]
SZL Holdings
```

---

## LinkedIn DM (universal)

```
Hi [First name] — running a small design-partner cohort for SZL Holdings (governed
decision infrastructure for [their domain]). Six slots, 50% off Year 1, founder
access, roadmap input. [Company] looks like a strong fit because [specific reason].
Worth 20 minutes next week to show you the decision trail on a [Company]-shaped
scenario?
```

---

## Email #2 — Follow-up (T+5)

**Subject:** Re: [Email #1 subject]

```
[First name] — circling back on this. No pressure if the timing is wrong.

The reason I'm reaching out specifically is [one-sentence specific reason].

If it's a no, a one-line "not now" is a gift. If you'd like me to send the design
partner program one-pager instead of a meeting, happy to.
```

---

## Email #3 — Break-up (T+12)

**Subject:** Re: [Email #1 subject]

```
[First name] — last note from me on this. Closing out my outreach pass.

If the accountability/audit gap I described isn't a 2026 priority, totally fine —
I'd rather hear that than chase. If it *is* a priority and the timing just isn't
right, send me a date in Q3 and I'll re-surface then.
```

---

## Personalization Checklist

Before sending **any** email, fill in **at minimum**:

- [ ] First name (correctly spelled)
- [ ] Company (current company, not previous)
- [ ] Title (current title)
- [ ] Specific reason hook (drawn from public news, recent post, recent earnings, recent regulatory action — not generic)
- [ ] One concrete scenario shaped to their business (not "your industry")

If you can't personalize the hook with a real reason, do not send. Save the cycles for accounts you have a real point of view on.

---

## Tracking

Every send goes into `/admin/pipeline-command` as a deal at stage **Outreach Sent**, with the date and channel logged in notes. No exceptions — un-tracked sends do not count.
