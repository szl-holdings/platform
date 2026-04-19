# First Meeting Kit — Discovery Through Demo

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Founder, sales execution
**Companion docs:** [SALES_HANDOFF_GUIDE.md](SALES_HANDOFF_GUIDE.md) · [DEMO_STRATEGY.md](DEMO_STRATEGY.md) · [DESIGN_PARTNER_AGREEMENT.md](DESIGN_PARTNER_AGREEMENT.md)

---

## The Three Conversations

| # | Length | Goal | Output |
|---|---|---|---|
| 1. Discovery | 25 min | Confirm the accountability gap | Demo booked, or honest no-fit |
| 2. Demo | 35 min | Show the loop on their decision | DPA conversation booked, or honest no-fit |
| 3. DPA Walkthrough | 30 min | Land terms; identify legal/procurement gates | Signature path agreed |

Anything more than three conversations to a signature is a sign the deal is not real. Honor that signal.

---

## 1 · Discovery Call (25 min)

**Frame, in your own words, before the questions:**

> I'd like to spend 20 minutes understanding how decisions get made and recorded today. Then 5 minutes on whether what we built fits. If it doesn't fit, I'll tell you straight — that's worth more to both of us than a second meeting.

### The Six Questions (in order)

1. How do you currently track which decisions were made, who made them, and based on what information?
2. When a regulatory body or legal team asks to reconstruct a decision chain, how do you respond?
3. How do you govern AI recommendations before they become actions?
4. Who in your organization is accountable when an AI-assisted action goes wrong?
5. What does your compliance posture look like for high-consequence operational decisions?
6. What does your team spend on managing decision fallout — audits, investigations, remediation?

**Listen.** Resist the urge to teach. The accountability gap surfaces in their words or it doesn't.

### Mirror

In the last 2 minutes:

> Let me play back what I heard. You're saying [their words about the gap]. The cost of that gap is [their words about cost]. The current workaround is [their words about workaround]. Did I get that right?

### Next Step

If the gap is real and they have authority or champion access:

> Based on this, the right next step is a 35-minute walkthrough where I show you the decision trail on a [their-shaped] scenario, with your context. Would [date] work?

If the gap is not real, or they're not the buyer or champion:

> Based on what you described, I don't think this is the right time for us. I'd rather tell you that than schedule another meeting. If [signal of change] happens, please reach back out — we'd be glad to talk then.

---

## 2 · Demo (35 min)

Use [DEMO_STRATEGY.md](DEMO_STRATEGY.md) for the canonical script. Always show:

- The Decision Theater (universal — any audience)
- The Proof Chain (lead with accountability — most resonant)
- Covenant Policy in action (governance, not just workflow)

**Personalize**: walk through the loop with one of *their* shaped decisions (they described it in discovery). Generic demos lose deals. Specific demos land them.

### Closing the demo

> Three things to react to:
>
> 1. Does this feel like it would close the gap you described?
> 2. If yes, who else needs to see it before we talk DPA?
> 3. What would you need to say yes to a Day-90 design partner pilot?

Listen for: SOC 2, references, security review, procurement path, budget cycle. Capture every blocker. Address each with the right artifact (Security Pack, References, DPA template).

---

## 3 · DPA Walkthrough (30 min)

Send [DESIGN_PARTNER_AGREEMENT.md](DESIGN_PARTNER_AGREEMENT.md) **48 hours before** the meeting, with these sections highlighted:

- §3 Scope (which packs, how many users)
- §4 Fees (50% off Year 1)
- §5 Success Metric (the 14-day commitment to define)
- §6 Partner commitments (especially reference + case study)
- §11 Termination (90-day exit window, no claw-back)

### Agenda

| Min | Topic |
|---|---|
| 0–5 | Confirm scope (which pack, which users, kickoff date) |
| 5–15 | Walk Sections 5–7 (Success Metric + commitments both ways) |
| 15–25 | Their legal/procurement questions; flag anything that needs counsel |
| 25–30 | Signature path: who signs on each side, by when |

### After the meeting (within 24 hours)

- Send a written recap with the agreed signature path and dates.
- Send the DPA in a redlinable form to their counsel (Word with track-changes recommended).
- Schedule the Kickoff (Section 3) for **within 30 days of expected signature**.
- Update `/admin/pipeline-command`: stage → **DPA Sent**.

---

## Follow-Up Library

### After Discovery (positive)

```
[First name] — thanks for the time today. Quick recap:

  - The accountability gap you described: [their words]
  - The cost: [their words]
  - Current workaround: [their words]

Booking the 35-min walkthrough on [date]. I'll send a calendar invite and a one-page
pre-read tomorrow.

Two questions before then:
  1. Is there a recent decision (last 30 days) you'd like me to walk the loop on?
  2. Anyone else on your side I should include?

[Your name]
```

### After Discovery (no-fit)

```
[First name] — thanks for the time today. Based on what you described, I don't think
this is the right moment for SZL Holdings to be useful to you, and I'd rather tell
you that than schedule another meeting.

If [specific signal of change], please reach back out. I'll keep your context on file
and re-surface in [period] if that's useful.

Best,
[Your name]
```

### After Demo (positive)

```
[First name] — thanks again for the time. As promised:

  - The DPA template: [link or attachment]
  - The Security Questionnaire Pack: [link]
  - Two reference contacts: [if available]

Per your three blockers ([X], [Y], [Z]), I've addressed each below:

  - X: [specific answer or artifact]
  - Y: [specific answer or artifact]
  - Z: [specific answer or artifact]

Proposing the DPA walkthrough for [date]. Who from your side (legal, security, exec
sponsor) should join?
```

### After Demo (objection-rich, hesitant)

```
[First name] — thanks for the time. You raised three things I want to make sure I
heard:

  1. [Objection 1 — restated]
  2. [Objection 2 — restated]
  3. [Objection 3 — restated]

Before we burn another meeting, I want to make sure I can address each at the level
of detail you'd need to be a yes. Reply with which of these are real blockers vs.
nice-to-haves, and I'll come back with specific artifacts for the real ones.

If any of these are a hard no on your side, telling me now is a gift.
```

---

## Honest No-Fit Triggers

End the conversation, gracefully, when **any** of these is true:

- They want fully autonomous AI with no human approval gates.
- They're shopping for a SIEM, dashboard, or workflow tool with no accountability need.
- They have no compliance or audit trail requirement.
- They refuse to share any decision workflow during discovery.
- The buyer is procurement-led with no operator champion.
- They're 1000+ people with multi-quarter procurement cycles. (Re-engage when SZL has Enterprise sales motion stood up — not now.)

A clean no closes a real loop. A messy maybe burns months.
