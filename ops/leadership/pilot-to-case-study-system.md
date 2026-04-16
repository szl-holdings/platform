# Pilot-to-Case-Study System — SZL Holdings

**Phase:** B · **Audience:** Founder, design partner ops · **Last reviewed:** 2026-04-16

---

## Purpose

The pilot-to-case-study system converts pilot artifacts (decision logs, outcome metrics, operator quotes) into externalizable assets (case studies, reference accounts, before/after deltas). This document defines the capture, internal review, reference progression, and delta structures.

---

## The Conversion Pipeline

```
Pilot artifacts → Capture → Internal review → Buyer review → Anonymized case study → Named case study → Reference account
```

Each stage has a gate. No artifact moves forward without the gate being met.

---

## Stage 1 — Capture (Day 0 → Day 90)

**Artifacts captured during the pilot (see `proof-engine.md`):**
- Baseline metrics worksheet
- Decision log
- Override events
- Approval cycle time
- Outcome attribution
- Operator quotes (captured in weekly partner reviews)

**Capture discipline:**
- Founder writes 3-5 sentence weekly note after each partner review
- Operator quotes captured verbatim with attribution (with permission)
- Quantified metrics pulled from platform telemetry weekly
- Buyer-side qualitative observations captured in writing, not just verbal

**Capture gate:** All baseline metrics, at least 6 weekly notes, at least 3 attributable operator quotes, all decision/outcome telemetry through Day 90.

---

## Stage 2 — Internal Review (Day 90 → Day 100)

**What happens:**
- Founder drafts a one-page case study using the template below
- Internal review: founder validates that every claim in the draft has a captured artifact behind it
- Quantified delta is double-checked against platform telemetry
- Anonymization decisions made (industry, size, region — not name)

**Internal review gate:** Every claim has a verifiable artifact. No claim of attribution exceeds what the data supports.

### One-Page Case Study Template

```
[INDUSTRY] / [REGION] — [DOMAIN PACK USED]

The Operation
- 2-3 sentences on the buyer's operation, scale, and pain.

The Pain
- One concrete failure mode that pre-dated SZL.
- Quantified: $X cost, Y hours, Z missed signals.

The Pilot
- Domain pack deployed.
- Pilot duration: 90 days.
- Operators in the loop: N.

The Outcome
- Metric 1: baseline → outcome (% delta).
- Metric 2: baseline → outcome (% delta).
- One operator quote (attributed or anonymized).

The Loop in Action
- One specific decision: signal → recommendation → simulation → policy gate → execution → outcome.
- 2-3 sentences. Make it visceral.

What This Means
- One sentence: why this outcome would not have happened with the buyer's pre-SZL stack.
```

---

## Stage 3 — Buyer Review (Day 100 → Day 120)

**What happens:**
- Anonymized draft sent to the buyer for review
- Buyer can: (a) approve as anonymized, (b) approve named version, (c) request edits, (d) decline externalization
- If named version is requested, founder negotiates: which logos, which metrics, which quote attribution

**Buyer review gate:** Buyer signs off in writing on the version that will be externalized. No surprises.

### Buyer Approval Tiers

| Tier | What buyer permits | What founder can use it for |
|------|---------------------|---------------------------|
| Tier 0 — No external use | Internal lessons only | Internal talk tracks; no external mention |
| Tier 1 — Anonymized only | Industry / region only, no name | Public case study without logo |
| Tier 2 — Named, no quotes | Logo, metrics, no attributed quotes | Public case study with logo |
| Tier 3 — Named, with quotes | Logo, metrics, attributed operator quotes | Full case study, press, marketing |
| Tier 4 — Reference account | All of Tier 3 + willingness to take reference calls | Reference for prospects |
| Tier 5 — Co-authored content | Tier 4 + buyer co-authors a podcast / panel / post | Public co-marketing |

Always ask for the highest tier the buyer is comfortable with. Always honor what they grant.

---

## Stage 4 — External Asset Production

**Anonymized case study (Tier 1):**
- One-page PDF on szlholdings.com / case-studies
- Linked from sales conversations and investor materials
- Anonymized but verifiable (founder can vouch in private conversations)

**Named case study (Tier 2-3):**
- One-page PDF + dedicated landing page (`/case-studies/[buyer-name]`)
- Logo on customer wall (with permission)
- Quote in pitch deck (Tier 3)
- Linked from press kit

**Reference account (Tier 4):**
- Founder maintains a reference account list
- Operator at the buyer agrees to take 1-2 reference calls per quarter
- Reference talking points memo (what they will / will not speak to)

**Co-authored content (Tier 5):**
- Joint podcast appearance, conference panel, blog post, or white paper
- Buyer typically gets thought leadership credit; SZL gets distribution

---

## Stage 5 — Reference Account Progression

A reference account is not a permanent asset. It is a relationship that requires maintenance.

| Activity | Cadence | Owner |
|----------|---------|-------|
| Reference call with prospect | As needed (cap at 4 / quarter to avoid burning the relationship) | Founder coordinates |
| Quarterly check-in with buyer | Quarterly | Founder |
| Refresh the reference talking points | Annually | Founder + buyer |
| Co-marketing content | Opportunistic | Founder + buyer marketing |
| Renewal / expansion conversation | At pilot end and annually | Founder |

If a reference account goes cold (operator leaves, sentiment shifts, product gap surfaces), demote the tier and stop using them as reference until the relationship is repaired.

---

## Before/After Delta Structure

A standalone single-page visual asset, used in sales conversations, decks, and the website.

### Template

```
BEFORE                                      AFTER
[Buyer industry / region]                   [Buyer industry / region, same line]

Decision time:    [X hours]    →    [Y hours]    ([Z%] reduction)
Approval cycle:   [X hours]    →    [Y hours]    ([Z%] reduction)
Missed signals:   [X / month]  →    [Y / month]  ([Z%] reduction)
Audit prep time:  [X hours]    →    [Y hours]    ([Z%] reduction)

[One operator quote, 1-2 sentences]
— [Title], [Company or Industry]

[1-line outcome attribution: what specifically the platform did]
```

Use this on:
- Sales decks (one slide per case study)
- Pricing page (proof points under tier descriptions)
- Investor narrative (specific outcomes section)
- Trust center (proof of governance in production)

---

## Cadence

| Activity | Cadence |
|----------|---------|
| Pilot artifact capture | Continuous |
| Weekly note from founder | Weekly during pilot |
| Internal case study review | Day 90-100 of every pilot |
| Buyer review cycle | Day 100-120 |
| External asset production | Day 120-130 |
| Reference account quarterly check-in | Quarterly per reference |

---

## Anti-Patterns

- **Skip the buyer review stage.** Externalizing without explicit buyer sign-off destroys the relationship and leaks legal exposure.
- **Inflate metrics.** If approval time went 8h → 6h, do not round to 50% reduction. Say 25%. Buyers spot inflation.
- **Force Tier 3 when buyer is at Tier 1.** Take what they grant. Push for higher tier later as the relationship deepens.
- **Treat reference accounts as set-and-forget.** They go cold without maintenance.

---

*Every pilot is one rep of this system. After three reps, the system runs without the founder having to think about each step. Until then, every pilot needs founder discipline at every gate.*
