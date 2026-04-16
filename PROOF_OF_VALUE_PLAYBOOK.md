# Proof of Value Playbook — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Founder, sales, CSM, prospective customers entering a paid pilot
**Companion docs:** [DESIGN_PARTNER_PROGRAM.md](DESIGN_PARTNER_PROGRAM.md) · [PILOT_PLAYBOOK.md](PILOT_PLAYBOOK.md) · [ROI_MODEL.md](ROI_MODEL.md)

---

## What a Proof of Value Is — and Is Not

A Proof of Value (PoV) is a **time-boxed, paid, success-metric-defined deployment** of the SZL platform on a customer's real data, designed to answer one question: *does the loop produce measurable value for this organization?*

| It is | It is not |
|-------|-----------|
| Paid (discounted, but not free) | A free trial |
| 60–90 days | A 6-month evaluation |
| One success metric, agreed in writing | "Let us play with it and see" |
| Real production data | Synthetic / sandbox |
| Run by their operator with our CSM | Run by our team for them |
| Bound by an MSA | Bound by an NDA only |
| Convertible to commercial | A separate purchase decision |

Free trials produce optionality without commitment. A PoV produces a clean yes/no decision.

---

## Pre-Conditions

Before scoping a PoV, the customer must have:

| Pre-condition | How we verify |
|---------------|---------------|
| An identified operator champion | Named by name on the kickoff call |
| Executive sponsor | Named by name; commits to be in the kickoff |
| One concrete decision type to govern | E.g., "incident triage", "sanctions screening", "deal pursue/walk" |
| Source data accessible | Either feed already exists or can be connected within 2 weeks |
| Auth path | OIDC tenant, Azure AD, or password fallback in writing |
| Budget authority | Person who can sign the conversion order at end of PoV |

If any of these are missing, the customer is not ready for PoV — they are ready for a deeper conversation. That is not a failure; it is a step.

---

## Scoping the PoV

The scoping conversation produces a one-page PoV agreement.

### The PoV one-pager template

```
PROOF OF VALUE — [CUSTOMER NAME]

Period:                  [start date] to [end date], 60–90 days
Edition:                 [Starter / Pro], pilot tier
Domain pack(s):          [pack(s)]
Tenant:                  [tenant name]

Executive sponsor:       [name, title]
Operator champion:       [name, title]
SZL CSM:                 [name]
SZL founder:             [name]

Success metric (one):    [e.g., "Reduce time-from-signal to documented decision
                         on Aegis incidents by 50%"]
Baseline:                [current state in numbers]
Target:                  [target state in numbers]
Measurement method:      [how we measure, with which data, on what cadence]

Source data:             [list of feeds]
Action vocabulary:       [list of actions to be governed]

Pricing:                 [PoV fee]
Conversion path:         [post-PoV pricing if successful]

Exit clause:             "Either party may exit at end of period.
                         Customer retains audit data for 90 days."

Signed:                  [customer signatory], [SZL signatory], [date]
```

This document is the contract. Everything else is operational.

---

## Standard PoV Templates

We do not invent every PoV from scratch. Three templates cover most cases.

### Template A: Aegis — Incident Triage Acceleration

| Element | Value |
|---------|-------|
| Period | 90 days |
| Success metric | Median time-from-signal-to-documented-decision on classified incidents |
| Baseline | Customer's current SOC tooling time, measured for 1 month before kickoff |
| Target | 50% reduction |
| Source data | STIX/TAXII feed + SIEM bridge |
| Surfaces used | `/aegis`, Lyte action queue, CORTEX |
| Roles in scope | analyst, security_analyst, operator |

### Template B: Vessels — Sanctions Screening Throughput

| Element | Value |
|---------|-------|
| Period | 90 days |
| Success metric | Vessels screened against sanctions lists per operator-day |
| Baseline | Current manual or partial-automation throughput |
| Target | 3× throughput, with audit-grade evidence on every screen |
| Source data | AIS feed + sanctions list feed |
| Surfaces used | `/vessels`, exception center, CORTEX maritime view |
| Roles in scope | maritime_ops_user, analyst, operator |

### Template C: Terra — Deal Pipeline Velocity

| Element | Value |
|---------|-------|
| Period | 60 days |
| Success metric | Deals advanced from "qualified" to "pursue/walk" decision per week |
| Baseline | Current weekly cadence |
| Target | 2× decision velocity with documented rationale on each deal |
| Source data | Property + ownership feed; customer's deal pipeline |
| Surfaces used | `/terra`, Lyte action queue, CORTEX deal view |
| Roles in scope | analyst, operator, sales_delivery_user |

(Templates D and E for PRISM Counsel and Carlota Jo follow the same pattern.)

---

## Operating Cadence

| Week | Activity | Owner |
|------|----------|-------|
| –2 | Tenant provisioning, auth setup, signal connector deployed | DevOps |
| –1 | Operator training (1 cohort, 2 hours) | CSM |
| 0 | Kickoff call: success metric confirmed, baseline captured | Founder + customer sponsor |
| 1 | First decision recorded; cadence call | CSM |
| 2 | Cadence call; first metric snapshot | CSM |
| 4 | First operator office hours; midpoint metric review | CSM + founder |
| 6 | Cadence call; second metric snapshot | CSM |
| 8 | Penultimate cadence call; preparation for exit decision | CSM |
| 10 | Final metric review | Founder + customer sponsor |
| 12 | Decision: convert / extend / exit | Both parties |

---

## What "Success" Looks Like

Three outcomes are possible at end of PoV.

| Outcome | Definition | Path forward |
|---------|------------|--------------|
| Success | Target met or exceeded; champion + sponsor want to convert | Conversion to standard commercial; pricing per [PRICING_PACKAGING.md](PRICING_PACKAGING.md) |
| Partial | Target not met but value is clear; specific gaps named | Extension by 30 days with revised target OR conversion at lower edition |
| Exit | Target not met; value is unclear; champion not advocating | Clean exit; data export; honest exit interview |

Whichever outcome, the customer keeps:

- Their audit data for 90 days (export available)
- Their decision rationale
- Their tenant configuration documentation

The customer does not keep:

- Continued platform access after the 90-day export window
- Discounted pricing if they re-engage > 6 months later

---

## Common Failure Modes

| Failure | Why it happens | Mitigation |
|---------|---------------|-----------|
| No baseline | We did not insist before kickoff | Hard-block kickoff until baseline is captured |
| Drifting success metric | Sponsor changes mid-PoV | Lock the metric in the one-pager; require both signatures to change |
| Operator never adopted the platform | Champion left or got pulled | Re-confirm champion at week 1; if gone, pause and re-scope |
| Source data not connected | Customer IT delays | Build into the –2 week schedule; if not done by week 0, push start by 2 weeks |
| Executive disengagement | No quarterly check-in | Require executive on the kickoff and the final review |
| Decision dragged past 14 days | Internal politics | Build the decision date into the one-pager; founder follows up at day 14 |

---

## Pricing the PoV

| Element | Value |
|---------|-------|
| Standard PoV fee | $25,000–$60,000 depending on domain pack and edition |
| Includes | Tenant provisioning, training, dedicated CSM, one signal connector, one domain pack, weekly cadence |
| Add-ons | Custom integration ($1,500/day, 10-day min), additional packs (per pack list × 25% for PoV term) |
| Conversion credit | 100% of the PoV fee credits toward Year 1 if converting to commercial |
| Payment terms | Net 30, full PoV fee invoiced at kickoff |

---

## Documentation We Produce

For every PoV, regardless of outcome:

| Artifact | Audience | When |
|----------|----------|------|
| Kickoff deck (signed one-pager) | Customer + SZL | Week 0 |
| Midpoint review deck | Customer sponsor + champion | Week 4 |
| Final review deck (with metric chart) | Customer sponsor + champion | Week 10 |
| Exit packet (audit export, configuration doc, transcripts) | Customer | Week 12 if exiting |
| Conversion proposal | Customer | Week 12 if converting |
| Internal lessons-learned note | SZL team | Week 13 |

---

## Related Documents

| Document | Path |
|----------|------|
| Design partner program | [DESIGN_PARTNER_PROGRAM.md](DESIGN_PARTNER_PROGRAM.md) |
| Pilot playbook | [PILOT_PLAYBOOK.md](PILOT_PLAYBOOK.md) |
| Design partner scorecard | [DESIGN_PARTNER_SCORECARD.md](DESIGN_PARTNER_SCORECARD.md) |
| ROI model | [ROI_MODEL.md](ROI_MODEL.md) |
| Pricing | [PRICING_PACKAGING.md](PRICING_PACKAGING.md) |
| Tenant tiers | [TENANT_TIERS.md](TENANT_TIERS.md) |
| Go-to-market motion | [GO_TO_MARKET_MOTION.md](GO_TO_MARKET_MOTION.md) |
| Case study template | [CASE_STUDY_TEMPLATE.md](CASE_STUDY_TEMPLATE.md) |
