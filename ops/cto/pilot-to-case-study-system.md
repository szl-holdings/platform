# Pilot to Case Study System
**Phase C — CTO Pass**
*Completed: April 16, 2026*
*Owner: Founder*

---

## Purpose

This document defines the conversion path from a successful design partner pilot to a publishable case study or referenceable client. It covers: the eligibility criteria, the evidence assembly process, the review and approval workflow, and the publishing formats.

---

## Overview

A pilot that generates good evidence and a satisfied partner is an asset. This system ensures that asset is captured, approved, and deployed in the right form — whether as a named case study, an attributed quote, an anonymous reference, or an investor-grade data point.

The path has five stages:

```
PILOT COMPLETE  →  EVIDENCE REVIEW  →  PARTNER SIGN-OFF  →  CONTENT ASSEMBLY  →  PUBLISH
```

---

## Stage 1: Pilot Complete — Triggering the Conversion Process

A pilot is considered complete when:
- The engagement period has ended (typically 60–90 days from go-live)
- The `pilot-[client]-delta.md` document has been completed
- The lessons interview has been conducted

**Immediately after completion:**
1. Assess the pilot against the case study eligibility criteria (see `ops/cto/proof-engine-final.md`)
2. If eligible: schedule the partner referencability conversation within 2 weeks of close
3. If not eligible: log the pilot in the lessons archive and move on — it still informs the product

---

## Stage 2: Evidence Review

**Owner:** Founder
**Timing:** Within 2 weeks of pilot close

Pull the following from the pilot archive:

| Evidence Artifact | Location | Purpose |
|------------------|----------|---------|
| T0 baseline metrics | `pilot-[client]-baseline.md` | Before state |
| T1 delta metrics | `pilot-[client]-delta.md` | After state — the proof |
| Qualitative assessment | `pilot-[client]-lessons.md` | Voice of the customer |
| Trust receipt screenshot | `pilot-[client]-receipts/` | Visual proof of the loop |
| Approval chain screenshot | From demo artifacts | Visual proof of governance |
| Operating loop screenshot | From demo artifacts | Visual proof of visibility |

**Evidence quality check:**
- Is the delta real and attributable? (Not coincident with an unrelated business change)
- Does the qualitative assessment support the quantitative delta?
- Are the screenshots clean and presentable?
- Is there at least one specific, concrete outcome the partner can speak to?

If the evidence quality check passes: proceed to Stage 3.
If it fails: document why, file in lessons, and flag for the next pilot.

---

## Stage 3: Partner Sign-Off

**Owner:** Founder (personal conversation)
**Format:** 30-minute call or async written exchange

### Referencability Tiers

| Tier | What It Allows | Requires |
|------|---------------|---------|
| **Named, attributed case study** | Full publication with company name, logo, quotes, metrics | Written approval from partner (email or signed doc) |
| **Attributed quote only** | Name and company on a pull quote on the website | Written approval from partner |
| **Anonymous case study** | "A [industry] organization with [X employees]..." | Partner verbal consent, no written requirement |
| **Investor-only data room reference** | Internal use only — never published | No partner approval needed, but must not identify the partner externally |
| **No reference** | Evidence archived internally, never used externally | No action needed |

### The Referencability Conversation

Ask in this order:
1. *"Would you be willing to be referenced publicly as a customer?"* → If yes, proceed to 2.
2. *"Would you be comfortable with your company name and logo on our website?"* → Determines Named vs Anonymous.
3. *"Would you be willing to provide a quote we could use?"* → For attributed quotes.
4. *"Are there specific metrics from the pilot you'd be comfortable sharing publicly?"* → For the case study metrics table.
5. *"Is there anything you'd need us to run past your legal or comms team first?"* → Flag if yes.

**If the partner says no to all:** Thank them, keep the relationship warm, and ask if they'd be willing to revisit in 6 months. Never pressure. File the pilot as internal-only.

---

## Stage 4: Content Assembly

**Owner:** Founder
**Timeline:** Complete within 4 weeks of partner sign-off

### Case Study Structure (Named, Full)

```markdown
# [Company Name] + SZL Holdings — [Outcome Headline]

## The Challenge
[2–3 sentences on what the partner was trying to solve. Written from their perspective.]

## What We Built Together
[2–3 sentences on the pilot scope — which domain, which workflow, how it was instrumented.]

## The Operating Loop in Action
[1–2 paragraphs walking through signal → evaluation → decision → approval → action → proof in their context.]

## The Results
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Approval latency | — | — | — |
| Open items > SLA | — | — | — |
| Audit coverage | — | — | — |

## What They Said
[Pull quote from partner ops lead or exec. Must be approved in writing.]

## What This Means
[1 paragraph on the broader implication — for their business and for the category SZL is building.]
```

### Quote Card (for website, one-liner)

```
"[Quote text]"
— [Name], [Title], [Company]
```

### Anonymous Case Study Structure

Same structure as named, but:
- Replace company name with: "A [industry] organization with [size descriptor]"
- Remove logo
- Keep all metrics — metrics do not identify the company
- Remove any details that could identify the partner (specific product names, geography, etc.)

### Investor Data Room Version

```markdown
## Pilot Results — Q[X] 2026

Design partner pilot completed [month] [year].
Domain: [Lyte / Terra / Vessels / Aegis / PRISM Counsel / Carlota Jo]
Engagement duration: [X] weeks

Key outcomes:
- Approval latency: [T0] → [T1] ([X]% reduction)
- Audit coverage: [T0] → [T1]
- [Additional metric]

Partner referencability: [Named / Anonymous / Internal only]
Case study status: [Published / In review / Internal only]
```

---

## Stage 5: Publish

### Publishing Channels

| Channel | Content Type | Who Approves |
|---------|-------------|-------------|
| `szlholdings.com/case-studies` | Named or anonymous case study | Founder + partner (if named) |
| `szlholdings.com` homepage | Pull quote + metric highlight | Founder + partner (if attributed) |
| Investor data room | Pilot results summary | Founder only |
| Design partner outreach | Anonymous case study as social proof | Founder |
| PR / earned media | Named case study (if newsworthy) | Founder + partner comms approval |

### Publishing Checklist

Before publishing any case study:

- [ ] Partner has provided written approval for the specific content being published
- [ ] All metrics have been verified against the `pilot-[client]-delta.md` source document
- [ ] No proprietary information, IP, or unintended identifiers are included
- [ ] Legal has reviewed (if partner requested it)
- [ ] Founder has final-read the published version against the approved draft

---

## Timeline Reference

| Milestone | Target Timing |
|-----------|--------------|
| Pilot close | Day 0 |
| Evidence review complete | Day 14 |
| Partner referencability conversation | Day 21 |
| Partner sign-off received | Day 35 |
| Case study draft complete | Day 49 |
| Partner review and edits | Day 56 |
| Published | Day 63 |

**Total elapsed time from pilot close to published case study: approximately 9 weeks.**

This is the target. Slippage is expected — the partner review step routinely takes longer. Build 2–3 weeks of buffer into any public commitment.

---

## Archive and Tracking

All pilot evidence and case study assets are tracked in:

```
docs/internal/pilots/
├── [client-slug]/
│   ├── pilot-[client]-baseline.md
│   ├── pilot-[client]-delta.md
│   ├── pilot-[client]-lessons.md
│   ├── pilot-[client]-referencability.md   (notes from the sign-off conversation)
│   └── pilot-[client]-receipts/
└── case-studies/
    ├── [client-slug]-named.md              (final approved, named version)
    ├── [client-slug]-anonymous.md          (anonymous version if needed)
    └── [client-slug]-investor-summary.md   (internal data room version)
```

A summary table of all pilots and their conversion status is maintained in `docs/internal/pilots/index.md`.

---

## Referenceability Without a Case Study

Not every pilot becomes a case study. But every successful pilot is a reference — even if only used internally. The following artifacts are always available for sales use, regardless of case study status:

- Operating loop screenshot (generic, not client-specific)
- Trust receipt screenshot (generic)
- Approval chain screenshot (generic)
- "Clients who've run pilots have seen [X]% reduction in approval latency" (aggregated, not attributed)

These generic assets live in `docs/internal/demo/assets/` and can be used freely in any sales or investor context.

---

*See also: [Proof Engine](./proof-engine-final.md) · [Enterprise Demo Script](./enterprise-demo-script.md) · [Demo Finalization](./demo-finalization.md)*
