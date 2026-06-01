# Pilot vs. Production Commercial Model — SZL Holdings

**Phase:** F · **Audience:** Founder, internal · **Last reviewed:** 2026-04-16

---

## Purpose

The commercial structure of a pilot is materially different from the commercial structure of a production engagement. Conflating them is one of the most common early-stage mistakes — pricing the pilot like a product (kills design partner momentum) or pricing the production engagement like a pilot (destroys revenue and signals weakness).

This document defines both structures and the explicit transition from one to the other.

---

## The Two Models, Side by Side

| Dimension | Pilot | Production |
|-----------|-------|-----------|
| **Goal (SZL side)** | Generate proof, learn the buyer, refine the playbook | Generate revenue, retain, expand |
| **Goal (buyer side)** | De-risk the platform, validate fit before committing | Run the operation; depend on the platform |
| **Term** | 90 days | Annual or multi-year |
| **Pricing form** | Free / nominal fee | Base + variable (seat or usage) |
| **Scope** | 1-3 use cases, narrow | Unlimited within domain pack |
| **Integrations** | Read-only or minimal | Full bidirectional |
| **SLA** | Best-effort, founder-led | Contractual, defined uptime |
| **Support model** | Founder direct | CS team + escalation |
| **Operator count** | Up to 5 | 5-50+ |
| **Renewal mechanic** | Convert to production OR exit | Annual renewal with expansion |
| **Commercial documents** | 5-page design partner agreement | MSA + DPA + SOW + pricing exhibit |
| **Buyer commitment** | Time + feedback + baseline data | Money + adoption + reference |

---

## The Pilot Commercial Structure

### What the buyer commits to
1. **Time.** Weekly partner review attendance, 1-2 hours per week of operator engagement
2. **Baseline data.** Day 0 metrics worksheet completed honestly
3. **Feedback.** Honest weekly feedback on what works, what doesn't
4. **Decision authority.** The economic decision-maker is reachable for the Day 90 conversion conversation
5. **Reference willingness.** If outcomes are good, willingness to be a Tier 1+ reference (anonymized minimum)

### What SZL commits to
1. **Founder access.** 24h response on weekdays, direct line for critical issues
2. **Hosted instance.** Standalone tenant for the pilot duration
3. **No commercial bait-and-switch.** The Day 90 conversion price is a reasonable, pre-disclosed range
4. **Honest assessment.** If the pilot isn't working, founder says so before Day 90
5. **Lessons memo at Day 90.** Whether the pilot continues or not, buyer gets a written summary

### What is explicitly NOT in the pilot
- SLA-backed uptime
- 24/7 support
- Custom integrations beyond the agreed scope
- Multi-org config
- Compliance attestations
- Production data residency commitments

### Pilot pricing forms (in priority order)

1. **Free (anchor design partners only — first 5 per domain pack)**
   - In exchange for: case study rights, reference willingness, deep weekly engagement
   - Limited to 5 per pack; after that, the pilot is no longer "design partner" — it's a paid eval
2. **Nominal pilot fee ($5K-$15K, design partner cohort 6-15)**
   - Signals buyer seriousness without commercial pressure
   - Often credited toward production conversion
3. **Paid evaluation ($25K-$50K, post design partner phase)**
   - Real money, no longer "free pilot"
   - 90 days, scoped, may convert to production at standard pricing
   - Pilot fee is non-credited (separate from production contract)

### Pilot agreement (the document)

5-10 pages, plain English. Includes:
- Scope (specific use cases, listed)
- Term (90 days, with optional 90-day extension at SZL's discretion)
- Success metrics (the baseline-to-outcome metrics agreed in joint diagnosis)
- Mutual NDA
- Each side's commitments (per above)
- Day 90 conversion conversation framework (what happens at end)
- Termination terms (either side may exit with 30 days notice)
- IP ownership (SZL retains platform IP; buyer retains their data)
- Data handling (buyer data stays in pilot tenant; deleted on termination at buyer's request)

---

## The Production Commercial Structure

### What the buyer commits to
1. **Money.** Annual contract, paid on agreed terms
2. **Adoption.** Operators using the platform as their primary decision surface
3. **Quarterly business review attendance.** Strategic alignment with SZL
4. **Reference (negotiated).** Willingness to take prospect calls per quarterly cap
5. **Renewal conversation.** 90-day renewal window with honest assessment

### What SZL commits to
1. **Production SLA.** Uptime, support response, incident review per contract
2. **Standard onboarding (4-6 weeks).** Run by CS, not founder (unless enterprise)
3. **Quarterly business review.** Joint review of usage, outcomes, expansion opportunity
4. **Roadmap transparency.** Buyer knows what's coming, what's not, and when
5. **Audit trail and reporting.** Standard reports plus contractual audit trail access

### What is in production but was NOT in pilot
- Contractual SLA
- Standard support tier (24h response, business hours)
- Multi-org config (if applicable)
- Compliance attestations as available
- Standard integration set
- Annual roadmap input rights

### Production pricing forms

See `packaging-model.md` and `founder-pricing-notes.md`. Tier 2 base + variable. Tier 3 custom.

### Production agreement (the document)

20-50 pages depending on enterprise procurement requirements. Includes:
- MSA (master service agreement)
- DPA (data processing agreement)
- SOW (statement of work, per-engagement)
- Pricing exhibit
- SLA exhibit
- Security exhibit (Tier 3)
- Optional: professional services SOW

---

## The Transition: Pilot → Production

### When the conversion conversation happens
**Day 75 of the pilot** (15 days before pilot end). This is the founder-driven scheduled conversion conversation. By Day 75:
- All baseline-to-outcome metrics should be visible
- At least 4-6 weekly partner reviews completed
- Operator quotes and decision examples captured
- Buyer's economic decision-maker is briefed

### The conversion conversation script

> *"We're 15 days from pilot end. Here is what we set out to prove [reference Day 0 success metrics]. Here is what the data shows [reference platform telemetry]. Here is what your team has told us [reference operator feedback]. Based on all of that, here is what continuing looks like commercially [reference Tier 2 anchor]. What do you need from me to make a decision in the next two weeks?"*

This frames the conversation as: evidence → decision, not pitch → close.

### Possible outcomes

| Outcome | Action |
|---------|--------|
| Buyer says yes to standard production | Send Tier 2 contract within 48h |
| Buyer says yes but wants modified scope | Re-scope, re-quote, send within 1 week |
| Buyer says yes but wants enterprise terms | Move to Tier 3 close pack |
| Buyer wants to extend pilot 90 more days | Allow only if there's a specific reason (e.g., new use case to prove); never as a stalling tactic |
| Buyer says no | Capture lessons, request reference rights for what was proven, exit gracefully |
| Buyer goes silent | Call (don't email); surface the silence; understand the blocker |

### Pricing protection at conversion

- The pilot fee (if any) is either credited toward Year 1 OR explicitly not credited (decided up front)
- The production price is per Tier 2 anchor — no "loyalty discount" off the top
- Volume / multi-year discount is acceptable; price-per-seat reduction is not

---

## Anti-Patterns

### Pilot anti-patterns
- **Charging full production price for pilot.** Kills design partner momentum.
- **Pilot scope creep.** "Can you also do X?" → re-scope formally; don't absorb silently.
- **Long pilots.** 90 days is the discipline. Longer = avoiding decision.
- **No baseline at Day 0.** No baseline = no proof = no conversion case.

### Production anti-patterns
- **Production at pilot pricing.** Once they're in production, they pay production price.
- **Standard CS for enterprise.** Tier 3 needs Tier 3 service. Don't cheap out on the relationship.
- **Lazy QBRs.** A QBR with no outcome data and no expansion conversation is wasted.
- **Renewal complacency.** The renewal conversation is the second sale. Treat it that way.

---

## Cadence Summary

| Pilot week | Activity |
|------------|----------|
| Week 0 | Sign agreement, kickoff, baseline capture |
| Week 1-12 | Weekly partner review, decision logging, outcome tracking |
| Week 11 (Day 75) | Conversion conversation |
| Week 12 (Day 90) | Pilot end; case study draft begins (if outcomes met) |
| Week 13-14 | Conversion contract signed OR exit |

| Production cycle | Activity |
|-----------------|----------|
| Month 1 | Standard onboarding |
| Month 2-3 | First QBR, expansion opportunities surfaced |
| Month 4-12 | Standard operation, monthly check-in, quarterly QBR |
| Month 10 | Renewal conversation begins |
| Month 12 | Renewal closed (with or without expansion) |

---

*Pilot is exploration. Production is operation. They have different goals, different commitments, different pricing. The transition is a deliberate moment, not a passive renewal. Treat each as the distinct phase it is.*
