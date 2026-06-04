# Pilot to Production Commercial Path

**Last updated:** April 2026  
**Purpose:** Defines the commercial conversion structure — how design partner pilots convert to production agreements.

---

## Overview

The design partner pilot is a time-bounded commitment with a defined exit gate. At the 90-day mark, the relationship either converts to a production agreement or closes with documented lessons. There is no "perpetual pilot" state.

This document defines what a production agreement looks like, how to get from pilot to production, and what gates must clear before production activation.

---

## Production Readiness Gates

Before any pilot converts to production, both SZL Holdings and the partner must clear these gates:

### SZL Holdings Gates

- [ ] The domain pack in use has been validated in the partner's real workflow (not just demo data)
- [ ] Any critical product gaps identified during the pilot have been addressed or have a committed timeline
- [ ] Billing infrastructure is activated (Stripe price IDs configured for the relevant tier)
- [ ] Production environment is stable (smoke tests passing, no unresolved P0 incidents)
- [ ] DPA and MSA are ready for signature

### Partner Gates

- [ ] Executive sponsor confirms commercial intent
- [ ] Budget is confirmed and approved
- [ ] Technical integration (if applicable) is stable and documented
- [ ] User onboarding plan for production rollout is defined (who, what role, when)
- [ ] Success metrics for production have been defined (not just pilot metrics)

If any gate is open, do not force conversion. Identify the blocker, assign ownership, and set a date to recheck.

---

## Commercial Agreement Structure

A production agreement for a SZL Holdings customer includes:

### 1. Master Services Agreement (MSA)

Covers:
- Service terms and acceptable use
- Data ownership and processing
- Liability and indemnification
- Termination and data return/deletion
- Governing law

**Status:** Standard template should exist before first production conversion. Draft MSA is required before pilot completion to avoid delay.

### 2. Order Form

Specifies:
- Domain pack(s) included
- Seat count and seat types
- Contract term (12 or 24 months standard)
- Annual contract value (ACV)
- Payment terms (annual upfront or quarterly)
- Design partner pricing lock (if applicable)
- Expansion terms

### 3. Data Processing Agreement (DPA)

Required if:
- Partner is in the EU or processes EU personal data
- Partner's procurement requires it (most enterprise procurement will)

**Status:** Standard DPA template should be prepared before first enterprise pilot. Available on request.

### 4. SLA Addendum (Enterprise Support Only)

Specifies:
- Response time commitments by incident priority
- Uptime commitment and measurement
- Escalation path
- Remedies for SLA breach

---

## Transition Timeline (Pilot → Production)

| Week | Activity |
|---|---|
| Week 10 (pilot) | Begin commercial conversation at 60-day checkpoint |
| Week 11 | Share draft MSA and Order Form |
| Week 12 | 90-day review meeting — confirm commercial intent |
| Week 13 | Legal review by partner (typical: 1–2 weeks) |
| Week 14 | Negotiate and redline |
| Week 15 | Final sign-off |
| Week 16 | Billing activation, production agreement live |

This timeline assumes smooth legal review. Enterprise legal review can take 4–8 weeks for complex agreements — factor this into timeline expectations for larger organizations.

---

## Billing Activation

Production billing runs through Stripe. Activation steps:

1. Configure price ID for the agreement's domain packs and seat count
2. Create Stripe customer record for the organization
3. Create subscription with the agreed billing terms
4. Send first invoice (or set up auto-billing for annual upfront)
5. Confirm payment method on file

**Current status:** Stripe billing infrastructure is built. Activation requires price ID setup and Stripe API key configuration. This is a configuration task, not an engineering task.

---

## Commercial Expansion After Production

Production agreements expand through two mechanisms:

**Seat expansion:**
- Partner adds users as adoption grows internally
- Marginal seat pricing applies (below base per-seat rate)
- No new MSA required — expansion via Order Form amendment

**Domain expansion:**
- Partner adds domain packs as they validate new use cases
- Standard domain pack pricing applies (design partner lock if within lock period)
- No new MSA required — expansion via Order Form amendment

**Renewal:**
- 90-day notice before contract renewal
- Renewal pricing: CPI-linked increase (3–5%) for standard contracts; design partner lock pricing honored for lock period
- Renewal is an opportunity to upgrade support tier or expand domain scope

---

## Conversion Metrics to Track

For each pilot:

| Metric | Target |
|---|---|
| Pilot-to-production conversion rate | >60% of completed pilots |
| Time from 90-day review to signed agreement | <4 weeks |
| ACV of first production agreements | Track and compare to design partner pricing |
| Expansion within first 6 months | Track seat additions and domain additions |

These metrics should be tracked from the first completed pilot, even if the sample size is small. They anchor future commercial model refinement.

---

## Structured Exit (Non-Conversion)

If a pilot does not convert:

1. Close the pilot formally — do not let it drift
2. Capture written feedback on the reason (product gap / commercial gap / timing / wrong fit)
3. Provide the lessons document to the partner — even in non-conversion, this is a service and a relationship signal
4. Classify and route feedback:
   - Product gap → add to engineering backlog
   - Commercial gap → revisit pricing model
   - Timing → add to pipeline with re-engagement trigger
   - Wrong fit → close permanently or note domain exclusion

Non-converting partners are not failures. They are calibration data.

---

*See also: `packaging-model-final.md` (pricing structure), `design-partner-offer.md` (pilot terms)*
