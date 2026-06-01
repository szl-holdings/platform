# ROI Model — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Sales, founder, customers building internal business cases, design partners
**Companion docs:** [PROOF_OF_VALUE_PLAYBOOK.md](proof-of-value.md) · [PRICING_PACKAGING.md](../investor/pricing-packaging.md) · [REVENUE_MODEL.md](../investor/revenue-model.md)

---

## Purpose

A buyer evaluating SZL needs an honest model for what they get back. This document is that model — the framework, the inputs, the assumption ranges, and the worked examples by domain.

We do not promise ROI. We provide the model the buyer can populate with their own numbers. The buyer's CFO populates inputs; the buyer's operator confirms the ranges; we provide structure.

---

## The Three Value Levers

The platform creates value in three categories. A real ROI calculation considers all three.

### 1. Decision Velocity

Faster time-from-signal-to-action when the action is the right one.

| Domain example | Metric |
|---------------|--------|
| Aegis | Mean time-to-decision on classified incidents |
| Vessels | Vessels screened per operator-day |
| Terra | Deals advanced per week |
| PRISM Counsel | Matters intake-to-disposition time |

Value formula: `(time saved per decision) × (decisions per period) × (loaded operator hourly cost)`

### 2. Decision Quality

Better decisions, measured by avoided loss or captured upside.

| Domain example | Metric |
|---------------|--------|
| Aegis | Avoided incident loss (probability × impact) |
| Vessels | Avoided sanctions exposure cost |
| Terra | Increased deal IRR through better selection |
| PRISM Counsel | Improved settlement positioning |

Value formula: `(probability of error reduced) × (cost of error) × (decisions per period)`

### 3. Audit & Governance

Reduced cost of compliance, reduced cost of an investigation, reduced cost of an audit cycle.

| Domain example | Metric |
|---------------|--------|
| All | Audit hours per year saved |
| All | Investigation hours per incident saved |
| Regulated | Regulator response time reduced |

Value formula: `(audit/investigation hours saved per year) × (loaded compliance hourly cost)`

---

## Input Ranges (Honest)

We use ranges, not point estimates. Customers populate the high/mid/low for their own organization.

### Decision Velocity Inputs

| Input | Low | Mid | High | Notes |
|-------|----:|----:|-----:|-------|
| Time saved per decision (minutes) | 5 | 15 | 30 | Depends on decision complexity |
| Decisions per operator-day | 5 | 15 | 30 | Depends on signal volume |
| Operator-days per year | 220 | 240 | 250 | After PTO and admin |
| Loaded operator cost ($/hr) | 75 | 120 | 200 | Domain and seniority dependent |

### Decision Quality Inputs

| Input | Low | Mid | High |
|-------|----:|----:|-----:|
| Error reduction (decisions affected, %) | 2% | 5% | 10% |
| Cost per error ($) | 5,000 | 50,000 | 500,000+ |

Cost per error is the most domain-dependent input. Sanctions errors carry regulatory exposure; incident errors carry breach cost; deal errors carry IRR loss.

### Audit & Governance Inputs

| Input | Low | Mid | High |
|-------|----:|----:|-----:|
| Audit hours saved per year | 80 | 240 | 800 |
| Investigation hours saved per incident | 4 | 16 | 60 |
| Loaded compliance cost ($/hr) | 90 | 150 | 250 |

---

## Worked Examples

These are illustrative, not promises. Customers populate inputs from their own data.

### Example 1: Aegis — 50-person SOC

**Inputs (mid-case):**

- 8 analysts × 240 days × 15 decisions × 15 minutes saved = 7,200 hours / year
- 7,200 hr × $120 = **$864,000 / year** (decision velocity)
- 5% of 28,800 decisions/year reduced in error × $50,000 cost per error = **$72,000,000 (gross)** — but most errors are "no incident" so **realized impact** is captured at 1–3% of gross, say **$720,000–$2,160,000 / year** (decision quality)
- 240 audit hours saved × $150 = **$36,000 / year** (audit)
- Total realized value range: **$1.6M – $3.0M / year**

**Cost (Pro edition + Aegis pack):**

- Platform Pro: $120,000
- Aegis pack: $48,000
- Implementation amortized over 3 years: ~$15,000/yr
- **Total: ~$183,000 / year**

**Net ROI: 8x – 16x annual platform cost.**

### Example 2: Vessels — 12-person maritime ops

**Inputs (mid-case):**

- 12 ops × 240 days × 20 vessels screened × 10 minutes saved = 9,600 hours / year
- 9,600 hr × $120 = **$1,152,000 / year** (decision velocity)
- 1 sanctions error avoided per year × $1M+ exposure (regulatory + commercial) = **$1,000,000** (decision quality, per avoided event)
- 160 audit hours saved × $150 = **$24,000 / year** (audit)
- Total realized value range: **$2.0M – $3.5M / year** (assuming 1 avoided event per 1–2 years)

**Cost (Pro edition + Vessels pack):**

- Platform Pro: $120,000
- Vessels pack: $60,000
- **Total: ~$195,000 / year**

**Net ROI: 10x – 18x annual platform cost.**

### Example 3: Terra — 6-person distressed deal team

**Inputs (mid-case):**

- 6 operators × 240 days × 8 deals advanced × 30 minutes saved = 5,760 hours / year
- 5,760 hr × $200 (analyst-level) = **$1,152,000 / year** (decision velocity)
- 5% of deals (out of ~1,500/year reviewed) better selected × ~$200K NPV improvement per deal = **$1,500,000+ / year** (decision quality)
- 80 audit hours saved × $150 = **$12,000 / year** (audit)
- Total realized value range: **$2.5M – $3.5M / year**

**Cost (Pro edition + Terra pack):**

- Platform Pro: $120,000
- Terra pack: $48,000
- **Total: ~$180,000 / year**

**Net ROI: 13x – 19x annual platform cost.**

---

## How to Use This Model in a PoV

| Step | Action | Owner |
|------|--------|-------|
| 1 | Customer populates inputs from their own baselines | Customer |
| 2 | We provide the spreadsheet template (one tab per lever) | CSM |
| 3 | Both parties agree on the conservative case | Sponsor + CSM |
| 4 | The conservative case becomes part of the PoV one-pager | Founder + sponsor |
| 5 | We measure actuals during pilot | CSM |
| 6 | At end of pilot, we re-run the model with measured inputs | CSM |
| 7 | Final review presents measured ROI vs. projected | Founder + sponsor |

---

## What We Do Not Claim

- We do not claim ROI we have not measured for that customer
- We do not claim multipliers without showing the input math
- We do not claim "intangible benefits" as primary justification (they are footnotes, not headlines)
- We do not claim ROI inputs that the customer's CFO will not stand behind

We claim:
- A defensible model
- Honest input ranges
- Worked examples that show the structure
- A measurement method during the PoV

---

## Sensitivity to Key Assumptions

| Variable | Sensitivity |
|----------|------------|
| Loaded operator cost | High — varies 2–3× across customers |
| Time saved per decision | Medium — varies 2× across decision types |
| Error rate reduction | Medium — varies by domain and current baseline |
| Cost per error | High — varies 100× across error types |
| Audit hours saved | Low — relatively stable across customers in same regulated industry |

The honest answer to "what is the ROI?" is: "Here is the model. Here are the inputs. Here are the levers. Let's run yours."

---

## Related Documents

| Document | Path |
|----------|------|
| Proof of value playbook | [PROOF_OF_VALUE_PLAYBOOK.md](proof-of-value.md) |
| Pricing | [PRICING_PACKAGING.md](../investor/pricing-packaging.md) |
| Revenue model | [REVENUE_MODEL.md](../investor/revenue-model.md) |
| Buyer personas | [BUYER_PERSONAS.md](buyer-personas.md) |
| Sales narrative | [SALES_NARRATIVE.md](sales-narrative.md) |
| Case study template | [CASE_STUDY_TEMPLATE.md](case-study-template.md) |
| Land & expand | [LAND_AND_EXPAND.md](land-and-expand.md) |
