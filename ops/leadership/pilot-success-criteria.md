# Pilot Success Criteria — SZL Holdings

**Phase:** G · **Audience:** Founder, design partner ops · **Last reviewed:** 2026-04-16

---

## Purpose

Every pilot must have explicit, measurable, mutually-agreed success criteria captured at Day 0 and reviewed at Day 90. This document defines the success criteria framework and the standard criteria templates per domain pack.

A pilot without success criteria is a 90-day demo with no decision at the end. A pilot with success criteria is a structured experiment with a verdict.

---

## The Three Layers of Success Criteria

Every pilot must define success at three layers:

```
Platform success — did the platform work as designed?
Operational success — did the buyer's operation improve?
Commercial success — did this pilot warrant continuing?
```

All three must be measurable. All three must have explicit Day 0 baselines and Day 90 thresholds.

---

## Layer 1 — Platform Success

**Question:** Did the platform reliably execute the canonical loop — Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning — across the agreed scope?

### Standard platform success metrics

| Metric | Threshold | How measured |
|--------|-----------|--------------|
| Loop completion rate | >90% of triggered signals complete the loop | Platform telemetry |
| Decision recommendation latency | <agreed SLA per domain pack | Platform telemetry |
| Audit trail completeness | 100% of consequential actions audit-logged | Audit log review |
| Override capture | 100% of operator overrides captured with reason | Platform telemetry |
| Uptime | >99% during pilot | Platform monitoring |
| Critical bugs | <2 critical bugs filed during pilot | Bug tracker |

### Platform success failure modes
- Signals enter but recommendations never generated → context layer broken
- Recommendations generated but operators ignore them → recommendation quality issue
- Operators override frequently with the same reason → known platform gap, fixable
- Audit trail missing entries → critical compliance issue, must fix before continuing

---

## Layer 2 — Operational Success

**Question:** Did the buyer's operation measurably improve on the metrics agreed at Day 0?

### Operational success template (customized per pilot)

Captured at Day 0; re-measured at Day 30, 60, and 90.

| Metric (example) | Day 0 baseline | Day 90 threshold | Day 90 actual |
|------------------|---------------|-----------------|---------------|
| Time-to-decision (hours) | TBD | -50% | TBD |
| Approval cycle time (hours) | TBD | -30% | TBD |
| Missed signals / month | TBD | -50% | TBD |
| Audit prep time (hours / quarter) | TBD | -50% | TBD |
| Operator satisfaction (1-10) | TBD | +2 | TBD |

### Domain-pack-specific examples

#### Lyte (operations / business observability)
- Approval cycle time
- Signals reviewed within SLA
- Cross-team escalation latency
- Operator time spent on manual signal correlation
- Executive briefing prep time

#### Aegis (security)
- Mean time to triage (MTTT)
- Mean time to respond (MTTR)
- False positive rate
- Audit trail completeness for material incidents
- SOC analyst time spent on alert correlation

#### Vessels (maritime)
- Voyage decision lead time
- Sanctions screening latency
- Dark vessel detection rate
- Charter decision economic accuracy (forecast vs. actual)
- Compliance documentation time per voyage

#### Terra (real estate)
- Time from distress signal to deal review
- Pipeline freshness (signals reviewed within X days)
- Ownership chain unwind time
- Deals identified before broker market

#### Carlota Jo (advisory)
- Strategic decision time
- Board briefing preparation time
- Operator-to-executive signal latency

---

## Layer 3 — Commercial Success

**Question:** Did this pilot demonstrate enough value to justify production commercial engagement?

### Commercial success criteria (must achieve all)

1. **Quantified delta:** At least one operational metric improved by >20% vs. baseline
2. **Operator advocacy:** At least one operator at the buyer would advocate for continuing
3. **Decision-maker buy-in:** Economic decision-maker is willing to discuss production pricing
4. **Reference willingness:** Buyer is willing to be at least Tier 1 (anonymized) reference (per `referenceability-model.md`)
5. **Renewal economics:** The production price the buyer would pay is justified by the value delivered

If any of these fail, the pilot is "platform validated, commercial not validated" — useful learning, but not a conversion.

---

## Success Criteria Capture Process

### Day 0 — Joint diagnosis

In the joint diagnosis session (see `buyer-close-system.md` Step 3), capture:

- The 3-5 operational metrics that matter most to the buyer
- The Day 0 baseline value for each (collected from buyer's existing reporting)
- The Day 90 threshold that would make the pilot a success in the buyer's eyes
- The specific use cases the pilot will cover (narrow, not broad)

Document this in a one-page success criteria sheet. Both sides sign.

### Day 30 — First check-in

In the Day 30 weekly partner review:
- Re-measure the operational metrics
- Discuss whether the trajectory will hit the Day 90 threshold
- Adjust scope if needed (with mutual agreement, captured in writing)

### Day 60 — Mid-pilot adjustment

If trajectory is off, this is the moment to:
- Add a use case (with buyer agreement) that would close the gap
- Remove a use case that isn't producing
- Surface a known platform gap that needs founder/product attention

### Day 75 — Conversion conversation prep

Founder reviews:
- Platform success metrics: are we passing on Layer 1?
- Operational success metrics: are we passing on Layer 2?
- Commercial success criteria: what is the verdict on Layer 3?

The conversion conversation (Day 75-90) is grounded in these answers, not in vibes.

### Day 90 — Final assessment

Founder writes a 1-2 page pilot assessment covering:
- Each Layer 1 metric: pass / fail
- Each Layer 2 metric: baseline → outcome → delta
- Layer 3 commercial verdict: convert / extend / exit

This becomes:
- The case study draft (if outcomes met)
- The lessons memo (always, regardless of outcome)
- The conversion proposal (if commercial criteria met)

---

## What Counts as a "Successful Pilot"

A pilot is successful if and only if:

1. **All Layer 1 metrics pass** (platform worked)
2. **At least 50% of Layer 2 metrics pass at threshold** (operation improved)
3. **All 5 Layer 3 commercial criteria pass** (warrants continuing)

This is a high bar. It is the right bar. Defining success loosely produces conversions that don't last; defining it tightly produces conversions that compound.

---

## What to Do With "Unsuccessful" Pilots

A pilot that fails Layer 1, 2, or 3 is not a failure of the company — it is data. Specifically:

| Failure pattern | What it means | Action |
|-----------------|---------------|--------|
| Layer 1 fail | Platform gap | Fix in product; re-pilot when fixed |
| Layer 2 fail (some metrics) | Buyer expectation misalignment OR scope mismatch | Adjust scope; re-pilot with refined criteria |
| Layer 2 fail (all metrics) | Platform doesn't deliver value to this buyer | Capture lessons; do not re-pilot |
| Layer 3 commercial fail | Value delivered but not enough to warrant cost | Re-evaluate pricing OR walk away |
| Layer 1 + 2 + 3 fail | Wrong buyer profile entirely | Capture lessons; refine ICP; do not pursue |

**Always capture:**
- What the founder learned about the buyer
- What the founder learned about the platform
- What the founder learned about the playbook

This is the input to refining the next pilot.

---

## Anti-Patterns

- **Vague success criteria.** "We'll know it when we see it" → 90 days later, neither side knows.
- **Too many metrics.** 15 metrics → none of them tracked well. Pick 3-5.
- **No baseline.** Cannot prove improvement without baseline.
- **Threshold creep mid-pilot.** Quietly raising the bar destroys trust.
- **Ignoring Layer 3.** A platform-success-only pilot doesn't convert.

---

*Success criteria are the spine of every pilot. Without them, pilots drift. With them, pilots produce verdicts. Every pilot needs all three layers, captured at Day 0, reviewed at Day 90.*
