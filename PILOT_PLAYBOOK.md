# Pilot Playbook — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** CSM, founder, customer sponsor, customer operator champion
**Companion docs:** [PROOF_OF_VALUE_PLAYBOOK.md](PROOF_OF_VALUE_PLAYBOOK.md) · [DESIGN_PARTNER_PROGRAM.md](DESIGN_PARTNER_PROGRAM.md) · [DESIGN_PARTNER_SCORECARD.md](DESIGN_PARTNER_SCORECARD.md)

---

## Purpose

The Pilot Playbook is the day-to-day operating guide for an active pilot — design partner, paid PoV, or Pro pilot tier. It tells everyone (CSM, founder, customer) what happens in each week, who owns what, and what good looks like at every checkpoint.

The Proof of Value Playbook scopes the pilot. This document runs it.

---

## Roles

| Role | Owner | Time commitment |
|------|-------|----------------|
| Customer sponsor | Customer executive (CEO, COO, head of ops) | 30 min / month |
| Customer champion | Operator user | 2–3 hours / week during pilot |
| SZL CSM | One named SZL person | 4–6 hours / week per pilot |
| SZL founder | Founder | 1 hour / month per pilot, escalations as needed |
| SZL DevOps | One named SZL person | On-call for environment issues |
| SZL integration support | One named SZL person | First 2 weeks heavy, then on-demand |

Anyone unnamed at kickoff is a problem. We do not start pilots with TBD names.

---

## Pilot Phases

```
Pre-flight (Week –2)  →  Kickoff (Week 0)  →  Land (Weeks 1–4)
                                                    ↓
        Decision (Week 12)  ←  Decide (Week 10)  ←  Run (Weeks 5–9)
```

---

## Pre-Flight (Week –2 to Week 0)

| Day | Activity | Owner | Done? |
|-----|----------|-------|-------|
| T–14 | One-pager signed; kickoff date locked | Founder + customer sponsor | ☐ |
| T–14 | Tenant provisioned in pilot tier | DevOps | ☐ |
| T–13 | OIDC / Azure AD integration tested with customer IT | DevOps + customer IT | ☐ |
| T–10 | First signal connector deployed and verified | Integration support | ☐ |
| T–9 | Domain pack configured for customer's vocabulary | CSM + customer champion | ☐ |
| T–7 | Operator training session 1 (introduction, 2 hr) | CSM | ☐ |
| T–5 | Operator training session 2 (action queue + Proof Chain, 2 hr) | CSM | ☐ |
| T–3 | Operator training session 3 (mobile, approvals, 1 hr) | CSM | ☐ |
| T–2 | Baseline metric captured (1 month of historical or current data) | CSM + customer champion | ☐ |
| T–1 | Kickoff agenda + slide deck shared with sponsor | CSM | ☐ |
| T–0 | Kickoff call (sponsor + champion + founder + CSM) | Founder | ☐ |

If any item is incomplete at T–0, kickoff slips. We do not run kickoffs on hope.

---

## Kickoff Call (Week 0)

**Attendees:** Customer sponsor, customer champion, SZL founder, SZL CSM.

**Duration:** 60 minutes.

**Agenda:**

1. (10 min) Welcome and confirmation of named roles
2. (10 min) Confirmation of success metric, baseline, target, and measurement method
3. (10 min) Walk-through of the pilot operating cadence (this document)
4. (15 min) Walk-through of the live tenant: data, agents, action queue, proof chain
5. (10 min) Customer sponsor commits to attendance at midpoint and final reviews
6. (5 min) Open questions and risk callouts

**Outputs:**

- Signed kickoff acknowledgment (one-pager + agreed cadence)
- Calendar invites for every weekly / biweekly / midpoint / final session sent
- Slack channel created (if applicable)
- First weekly check-in scheduled for Week 1

---

## Land Phase (Weeks 1–4)

Goal: the customer's operator champion is using the platform daily by end of Week 4.

| Cadence | Activity | Owner |
|---------|----------|-------|
| Weekly | 30-min cadence call (champion + CSM) | CSM |
| Weekly | Health snapshot updated in CRM | CSM |
| Week 1 | First decision recorded in Proof Chain | Champion |
| Week 1 | First override or denial recorded (if applicable) | Champion |
| Week 2 | Mobile session — champion approves at least one action via CORTEX | Champion |
| Week 3 | First weekly metric snapshot vs. baseline | CSM |
| Week 4 | Week-4 review with champion (informal) | CSM |

**Land phase exit criteria:**

| Criterion | Required |
|-----------|---------|
| Champion has approved or denied at least 10 actions | ✅ |
| Proof Chain shows ≥ 3 decisions per active day | ✅ |
| Mobile usage by champion at least once per week | ✅ |
| Week-4 metric snapshot at least 25% of the way to target | ✅ |
| No open SEV1 / SEV2 incidents | ✅ |
| Champion engagement: rating ≥ 7/10 | ✅ |

If any criterion fails, we trigger a course-correction conversation with the sponsor before Week 5.

---

## Run Phase (Weeks 5–9)

Goal: the platform is part of the operator's working rhythm; metric trajectory points to target.

| Cadence | Activity | Owner |
|---------|----------|-------|
| Biweekly | 30-min cadence call (champion + CSM) | CSM |
| Weekly | Health snapshot updated in CRM | CSM |
| Week 6 | Midpoint review (sponsor + champion + founder + CSM, 60 min) | Founder |
| Week 7 | Roadmap input session (champion's product asks captured in writing) | CSM |
| Week 8 | Second weekly metric snapshot vs. baseline | CSM |
| Week 9 | Pre-decision review prep | CSM |

**Run phase exit criteria:**

| Criterion | Required |
|-----------|---------|
| Metric trajectory ≥ 75% of target | ✅ |
| Sponsor engagement: at least one written response in midpoint review thread | ✅ |
| Operator usage stable or growing | ✅ |
| Champion's product asks documented and dispositioned | ✅ |
| Conversion conversation surfaced informally | ✅ |

---

## Decide Phase (Weeks 10–12)

Goal: the customer makes a clean decision. Convert, extend, or exit.

| Day | Activity | Owner |
|-----|----------|-------|
| Week 10 | Final metric snapshot finalized | CSM |
| Week 10 | Final review deck prepared (with metric chart, qualitative observations, customer asks) | CSM |
| Week 10 | Final review meeting (sponsor + champion + founder + CSM, 60 min) | Founder |
| Week 11 | Conversion proposal sent (or extension proposal, or exit packet) | Founder + CSM |
| Week 12 | Customer decision communicated in writing | Customer sponsor |
| Week 12 | If converting: order form signed; standard commercial relationship begins | Founder |
| Week 12 | If exiting: data export initiated; exit interview scheduled | CSM |
| Week 13 | Internal lessons-learned note written and shared on SZL team | CSM + Founder |

---

## Decision Outcomes

| Outcome | Trigger | Action |
|---------|---------|--------|
| Convert | Target met; sponsor wants to commit | Standard commercial conversion at design partner pricing if applicable |
| Extend | Partial target met; clear path to full | 30-day extension with revised target; one extension max |
| Exit | Target not met or value unclear | Clean exit; 90-day data export window; exit interview within 30 days |
| Defer | Sponsor not ready to decide | 14-day decision window; if no decision by then, default to exit |

---

## Health Scoring

Pilot health is updated weekly. See [DESIGN_PARTNER_SCORECARD.md](DESIGN_PARTNER_SCORECARD.md) for the full scorecard. Headline:

| Indicator | Green | Amber | Red |
|-----------|:-----:|:-----:|:---:|
| Operator usage trend | Growing | Flat | Declining |
| Champion engagement | Active | Sporadic | Silent |
| Metric trajectory | On / ahead of target | Behind but tracking | Stalled |
| Sponsor engagement | Attends every checkpoint | Misses one | Misses two+ |
| Open issues | None blocking | One workable | One blocking |
| Product asks | Documented + dispositioned | Documented but pending | Undocumented |

Two amber → escalate to founder. One red → founder + sponsor conversation immediately.

---

## Common Failure Modes and Recoveries

| Failure | Recovery |
|---------|----------|
| Champion leaves customer | Pause pilot; re-confirm with sponsor within 7 days; appoint successor champion or end pilot |
| Sponsor disengaged after kickoff | Founder direct outreach; frame the cost of disengagement |
| Metric is harder to measure than expected | Pivot to a related, easier-to-measure leading indicator; document the change |
| Source data quality worse than expected | Acknowledge openly; demonstrate value on subset; revise target if needed |
| Customer wants to expand pack scope mid-pilot | Acknowledge; defer to commercial conversation post-pilot |
| Customer wants more capability than current product offers | Honest "not in this pilot"; capture as roadmap input |
| Internal customer politics block adoption | Founder + sponsor conversation; consider scoping reduction |

---

## What We Track Across All Pilots

| Metric | Cadence |
|--------|---------|
| Active pilots count | Weekly |
| Pilot conversion rate (rolling 12 months) | Monthly |
| Average time-to-decision after pilot end | Monthly |
| Average operator daily activity per pilot | Weekly |
| Pilot health distribution (green/amber/red) | Weekly |
| Roadmap items requested per pilot | Per pilot |
| NPS of converted customers (90 days post-conversion) | Quarterly |

---

## Related Documents

| Document | Path |
|----------|------|
| Proof of value playbook | [PROOF_OF_VALUE_PLAYBOOK.md](PROOF_OF_VALUE_PLAYBOOK.md) |
| Design partner program | [DESIGN_PARTNER_PROGRAM.md](DESIGN_PARTNER_PROGRAM.md) |
| Design partner scorecard | [DESIGN_PARTNER_SCORECARD.md](DESIGN_PARTNER_SCORECARD.md) |
| ROI model | [ROI_MODEL.md](ROI_MODEL.md) |
| Tenant tiers | [TENANT_TIERS.md](TENANT_TIERS.md) |
| Land & expand | [LAND_AND_EXPAND.md](LAND_AND_EXPAND.md) |
| Case study template | [CASE_STUDY_TEMPLATE.md](CASE_STUDY_TEMPLATE.md) |
