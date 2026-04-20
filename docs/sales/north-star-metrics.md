# North Star Metrics — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Founder, leadership, board, all employees
**Companion docs:** [EXECUTIVE_SCORECARD.md](executive-scorecard.md) · [REVENUE_MODEL.md](../investor/revenue-model.md) · [DESIGN_PARTNER_SCORECARD.md](../product/design-partner-scorecard.md) · [SERIES_A_READINESS.md](../investor/series-a-readiness.md)

---

## The North Star

> **Governed decisions executed per active customer per week, with proof chain attribution.**

This is the one number that captures whether the platform is doing its job. It compounds with every customer added, every pack adopted, every operator onboarded. Every other metric supports it.

---

## Why This North Star

A different metric would mislead us:

| Alternative | Why we rejected |
|-------------|-----------------|
| Logos signed | Counts contracts, not platform usage |
| ARR | Lags by months; trails the actual product value |
| MAU | We are not a consumer product; usage breadth without depth misleads |
| AI calls per day | Volume of recommendations is not the value; *governed* decisions are |
| Approvals per day | A subset of decisions; misses the broader loop |
| Revenue per customer | A financial output, not a leading indicator |

Governed decisions per active customer per week is the leading indicator that:

1. The platform is being used
2. Decisions are flowing through the loop
3. The Proof Chain is recording attribution
4. The customer is on track to expand

---

## Definition (Precise)

A "governed decision" is any state-changing action that:

| Element | Required |
|---------|----------|
| Originated from a signal on the Event Fabric | ✅ |
| Recorded a recommendation in the Outcome Graph | ✅ |
| Was evaluated by Covenant Policy | ✅ |
| Was either approved by an authorized human OR auto-permitted under documented policy | ✅ |
| Created an entry in the Proof Chain with full attribution | ✅ |
| Has an outcome record (achieved, partial, not, or unknown) within the outcome window | ✅ (eventually) |

A demo decision (synthetic data, demo tenant) does **not** count. The North Star measures *production* governed decisions.

---

## How We Measure

### Calculation

```
North Star (week W) =
  SUM over active customers C of (
    governed_decisions_count(C, W)
  ) / count(active_customers(W))
```

Where `active_customers(W)` is the count of paying customers with at least one logged-in user during week W.

### Reporting cadence

| Frequency | Audience | Source |
|-----------|----------|--------|
| Weekly | Founder, leadership, all-hands | Outcome Graph aggregate query |
| Monthly | Board | North Star + cohort breakdown |
| Quarterly | Investors | North Star + trajectory + quarterly target |

---

## Targets (Year-Over-Year)

| Period | Target North Star (governed decisions / active customer / week) |
|--------|----------------------------------------------------------------:|
| End of 2026 | 25 |
| End of 2027 | 80 |
| End of 2028 | 200 |
| End of 2029 | 400 |

These targets reflect:

- 2026: design partner cohort ramping; champion is using daily, but team rollout is partial
- 2027: full team rollout per customer; multi-pack adoption begins
- 2028: cross-domain decisions become routine; CORTEX mobile drives off-desk decisions
- 2029: platform is part of operational fabric; multiple personas using daily

---

## Supporting Metrics (the next level down)

| Metric | What it tells us | Target trajectory |
|--------|-----------------|-------------------|
| Active customers | Adoption breadth | 6 (2026) → 30 (2027) → 110 (2028) |
| Active users per customer | Adoption depth | 5 (2026) → 12 (2027) → 25 (2028) |
| Proof Chain entries / week per customer | Audit trail density | 50 (2026) → 200 (2027) → 800 (2028) |
| Cross-domain decisions / week | Cross-pack value | < 1 (2026) → 5 (2027) → 25 (2028) |
| Mobile decisions / week per customer | CORTEX adoption | 5 (2026) → 20 (2027) → 50 (2028) |

These are tracked alongside the North Star — the relationship between them tells us why the North Star is moving.

---

## Health Indicators (must-stay-green)

If any of these go red, the North Star is at risk regardless of the headline number.

| Indicator | Green | Yellow | Red |
|-----------|:-----:|:-----:|:---:|
| Pilot health (avg score across active pilots) | ≥ 4.0 | 3.4–3.9 | < 3.4 |
| Customer NPS (last quarter) | ≥ 40 | 20–39 | < 20 |
| Open SEV1 / SEV2 incidents | 0 | 1 | 2+ |
| Audit trail integrity check | Passing weekly | Passing monthly | Failed |
| Tenant isolation review | Last review < 90 days | 90–180 days | > 180 days |
| Founder hours on operations vs. category | < 40% | 40–60% | > 60% |

---

## Anti-Goals (Things We Will Not Optimize)

To stay focused, we explicitly do not chase:

| Anti-goal | Why |
|-----------|-----|
| Daily active users | Not a useful metric for our motion; depth > breadth at this stage |
| AI call volume | Volume is not the value; governance is |
| Recommendation count | Recommendations without decisions are noise |
| Time-on-platform | Decisions per session is the right unit; time is irrelevant |
| Page views | Not relevant for an operator product |
| Marketing-qualified leads | We do not run a top-of-funnel motion in 2026 |

If the team finds itself optimizing one of these, we are off-strategy.

---

## How the North Star Influences Decisions

| Decision | How the North Star informs it |
|----------|------------------------------|
| Engineering prioritization | Features that increase governed decisions per customer ship before features that don't |
| Sales targets | New customer wins are weighted by their projected governed-decision contribution |
| CSM cadence | Customers with declining North Star contribution get founder + CSM intervention |
| Marketing | Content focuses on stories where the loop made decisions better, not on feature lists |
| Product launch criteria | A new pack ships when it can demonstrably contribute ≥ 5 decisions / customer / week within 30 days of launch |
| Hiring | Teams that contribute to the North Star expand first |

---

## Tracking and Display

| Surface | Display |
|---------|---------|
| Internal admin dashboard (`/admin/north-star`) | Live counter, weekly + 4-week rolling, per cohort |
| Founder Monday review | Number + delta + commentary |
| Monthly board update | Number + 12-week trend + breakdown |
| All-hands monthly | Number + recognition for team members who moved it |
| Investor quarterly update | Number + cohort breakdown + target progression |

---

## When to Adjust the North Star

The North Star itself is rare to change. We would adjust if:

- The category matured to where governed decisions per customer became too coarse a measure (likely 2029+)
- A different metric better captured cross-domain compound value
- An acquisition or pivot changed the core unit of value

We will not change the North Star to make a quarter look better. The number tells the truth.

---

## Related Documents

| Document | Path |
|----------|------|
| Executive scorecard | [EXECUTIVE_SCORECARD.md](executive-scorecard.md) |
| Revenue model | [REVENUE_MODEL.md](../investor/revenue-model.md) |
| Design partner scorecard | [DESIGN_PARTNER_SCORECARD.md](../product/design-partner-scorecard.md) |
| Series A readiness | [SERIES_A_READINESS.md](../investor/series-a-readiness.md) |
| Investor narrative | [INVESTOR_NARRATIVE.md](../investor/investor-narrative.md) |
| Land & expand | [LAND_AND_EXPAND.md](land-and-expand.md) |
| Pilot playbook | [PILOT_PLAYBOOK.md](pilot-playbook.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](../architecture/platform-primitives.md) |
