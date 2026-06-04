# Expansion Motion — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** CSM, sales lead, founder
**Companion docs:** [LAND_AND_EXPAND.md](land-and-expand.md) · [PRODUCT_PACKAGING.md](../product/packaging.md) · [REVENUE_MODEL.md](../investor/revenue-model.md) · [DESIGN_PARTNER_SCORECARD.md](../product/design-partner-scorecard.md)

---

## Why Expansion Is the Whole Game

Net new logos compound slowly. Net new revenue from existing customers compounds quickly when the platform is right. Our expansion motion is the difference between $5M ARR and $25M ARR by end of 2028.

Expansion is not "selling more seats." It is the systematic conversion of usage signals into commercial conversations.

---

## The Three Expansion Vectors

| Vector | Trigger | Average uplift |
|--------|---------|----------------|
| Pack expansion | Operator requests a new domain pack | +$24K to +$60K ARR |
| Seat expansion | Existing tenant exceeds seat threshold | +$9K to +$36K ARR per increment |
| Edition upgrade | Customer needs multi-tenancy / SCIM / custom residency | +$120K to +$300K ARR |

A single customer often produces all three over their lifecycle.

---

## Vector 1: Pack Expansion

### Triggers (in priority order)

1. The customer's operator names a domain we are not yet entitled in
2. The customer's regulator pushes them into a new domain (e.g., sanctions screening newly required)
3. The customer adopts a workflow that crosses into a new pack
4. We publish a new pack and a customer's profile fits

### Detection

| Signal | Source |
|--------|--------|
| New action class request in support thread | CSM |
| Cross-domain query in Lyte action queue | Product analytics |
| Sponsor mentions a new domain in QBR | CSM notes |
| Industry change | Marketing scan |

### Motion

| Step | Action | Owner |
|------|--------|-------|
| 1 | CSM logs the trigger | CSM |
| 2 | CSM proposes a 30-day pack pilot at 50% off list | CSM |
| 3 | Pack tenant configured; champion in the new domain identified | DevOps + CSM |
| 4 | Operator demo of the new pack | CSM |
| 5 | Pilot run for 30 days | CSM |
| 6 | Conversion to standard pack pricing if value confirmed | Founder + customer sponsor |

### Pricing

Pack pilots are capped at 30 days at 50% of pro-rated annual list. Conversion is to full annual list (or design partner pricing if applicable).

---

## Vector 2: Seat Expansion

### Triggers

1. Edition seat cap approached (Starter at 20, Pro at 80)
2. Active user count consistently > 80% of seat cap for 30 days
3. Customer adds a new team or division
4. Customer wants to roll out CORTEX more broadly

### Detection

| Signal | Source |
|--------|--------|
| Seat utilization > 80% for 30 days | Lyte usage data |
| Failed user provisioning due to seat cap | Admin console alerts |
| QBR conversation about new team adoption | CSM notes |

### Motion

| Step | Action | Owner |
|------|--------|-------|
| 1 | CSM surfaces seat utilization in next QBR | CSM |
| 2 | Pre-quote seat increment pricing | CSM |
| 3 | Customer signs amendment | Customer + CSM |
| 4 | Seats provisioned same day | Admin console |

### Pricing

Per [PRICING_PACKAGING.md](../investor/pricing-packaging.md). Seat increments are sold in chunks of 25 (Starter) or 50 (Pro). Enterprise is unlimited; expansion at Enterprise is via edition mechanics, not seat add-ons.

---

## Vector 3: Edition Upgrade

### Triggers

1. Customer needs multi-tenant operations (Pro → Enterprise)
2. Customer needs SCIM / Azure AD SSO included (Pro → Enterprise)
3. Customer needs custom data residency
4. Customer needs 24×7 pager support
5. Customer needs longer audit retention
6. Seat count exceeds 100 (Pro → Enterprise)

### Detection

| Signal | Source |
|--------|--------|
| Customer adds a sub-organization | Admin requests |
| Customer's compliance team asks for residency | CSM email |
| Pager support requested | Support tickets |
| Retention extension requested | CSM email |

### Motion

| Step | Action | Owner |
|------|--------|-------|
| 1 | CSM flags the trigger to founder | CSM |
| 2 | Founder + CSM scope the Enterprise commercial proposal | Founder + CSM |
| 3 | Technical buyer brought in for new requirements (residency, SCIM) | Founder |
| 4 | New MSA or amendment drafted | Founder + counsel |
| 5 | Migration runbook scheduled for cut-over | DevOps |
| 6 | Customer cuts over within 1 hour scheduled window | DevOps |

### Pricing

Enterprise is built up modularly per [PLATFORM_EDITIONS.md](../product/platform-editions.md) and [PRICING_PACKAGING.md](../investor/pricing-packaging.md). Founder approval required.

---

## Expansion Cadence (Per Customer)

| Cadence | Activity | Owner |
|---------|----------|-------|
| Weekly | Health snapshot reviewed for expansion signals | CSM |
| Monthly | Lyte usage data reviewed for triggers | CSM |
| Quarterly | QBR with sponsor + champion; expansion conversation if any vector active | CSM + Founder |
| Annually | Renewal-and-expansion proposal (renewal + any expansion in same paper) | CSM |

---

## Renewal-and-Expansion Discipline

We package renewal and expansion together when possible:

- Renewal proposal sent 90 days before term end
- Expansion components surfaced in the same proposal
- Multi-year incentive: 5% off list for 3-year commitment with annual escalator
- Customer-side legal review usually batches the change anyway

---

## Net Revenue Retention Targets

| Cohort year | NRR target by Year 2 |
|-------------|---------------------|
| 2026 design partners | ≥ 120% |
| 2027 commercial | ≥ 130% |
| 2028 commercial | ≥ 140% |

Drivers:

- Pack expansion alone delivers 110–115% NRR
- Seat expansion delivers another 5–10%
- Edition upgrades deliver step-function jumps (one customer = +20% on the cohort)

---

## Expansion Tracking

Per-customer expansion ledger (in CRM):

| Field | Description |
|-------|-------------|
| Customer | Name |
| Initial ACV | What they signed at land |
| Current ACV | Total active recurring revenue |
| NRR (rolling 12) | Current ACV / Initial ACV |
| Active vectors | Pack / Seat / Edition / None |
| Next vector | Anticipated next move |
| Owner | CSM |
| Last vector activity | Date of most recent expansion action |

Reviewed weekly by CSM lead.

---

## Customer Health vs. Expansion Readiness

A customer is **expansion-ready** when:

| Indicator | Required |
|-----------|---------|
| Active usage | > 60% of seats active weekly |
| Champion engagement | Score ≥ 4 on [DESIGN_PARTNER_SCORECARD.md](../product/design-partner-scorecard.md) (or equivalent for non-DP customers) |
| No open SEV1 / SEV2 | True |
| Last QBR within 90 days | True |
| Outcome Graph shows successful decisions | Yes |

Pushing expansion on an unhealthy customer breaks trust. We restore health first.

---

## Expansion Anti-Patterns

| Anti-pattern | Why we avoid |
|--------------|--------------|
| Pushing expansion before customer is in the green | Breaks trust |
| Surprising the customer with expansion pricing | Erodes confidence in pricing discipline |
| Bundling expansion with renewal as a take-it-or-leave-it | Damages renewal |
| Selling pack expansion without an operator champion in the new pack | Pack will not adopt |
| Overpromising on a pack capability to win expansion | Backfires within 30 days |
| Edition upgrade without migration runbook tested | Breaks deployment |

---

## Founder Involvement

Founder is involved in expansion when:

- Edition upgrade above $200K incremental ACV
- Pack expansion for a strategic logo
- Customer pushback on expansion pricing
- Customer threatening churn at renewal
- Multi-year contract negotiation

Founder is not involved in routine seat or pack add-ons under that threshold.

---

## Forecasting Expansion

Expansion forecast is a separate line in the revenue forecast:

| Type | Forecast cadence | Confidence level |
|------|-----------------|------------------|
| Seat expansion | Monthly | High (data-driven) |
| Pack expansion | Quarterly | Medium (customer-driven) |
| Edition upgrade | Per-deal | Medium-low (long lead) |
| New logo upsell within first 90 days | Per-deal | Low |

See [REVENUE_MODEL.md](../investor/revenue-model.md) for how this rolls into total revenue forecasting.

---

## Related Documents

| Document | Path |
|----------|------|
| Land & expand (overview) | [LAND_AND_EXPAND.md](land-and-expand.md) |
| Product packaging | [PRODUCT_PACKAGING.md](../product/packaging.md) |
| Editions | [PLATFORM_EDITIONS.md](../product/platform-editions.md) |
| Pricing | [PRICING_PACKAGING.md](../investor/pricing-packaging.md) |
| Revenue model | [REVENUE_MODEL.md](../investor/revenue-model.md) |
| Enterprise deal design | [ENTERPRISE_DEAL_DESIGN.md](enterprise-deal-design.md) |
| Design partner scorecard | [DESIGN_PARTNER_SCORECARD.md](../product/design-partner-scorecard.md) |
| North star metrics | [NORTH_STAR_METRICS.md](north-star-metrics.md) |
