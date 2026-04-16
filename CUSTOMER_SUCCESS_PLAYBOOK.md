# Customer Success Playbook — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** Customer success, implementation, and account management teams  
**Purpose:** Deliver consistent, high-value outcomes for every design partner and customer

---

## Overview

In the design partner phase, customer success is product-embedded. CS is not a separate function — it is a co-design relationship where SZL Holdings and the partner build the product together. The CS team's job is to ensure every design partner:

1. Gets live on their domain pack within the committed timeline
2. Adopts the governed decision loop for at least one real operational workflow
3. Generates clear, measurable outcome data from the pilot
4. Provides structured product feedback that informs the roadmap
5. Renews or expands the relationship at the end of the pilot

---

## Onboarding Ownership Model

### Who owns what

| Phase | Owner | Timeframe |
|---|---|---|
| Handoff from sales | Sales + CS | Day 0 |
| Technical setup and integration | Engineering + CS | Weeks 1–2 |
| Workflow configuration | CS + Partner | Weeks 2–3 |
| Go-live on first real workflow | CS + Partner | Weeks 3–4 |
| Adoption monitoring | CS | Weeks 4–8 |
| Mid-pilot review | CS + Partner + Founder | Week 6 |
| Expansion or renewal conversation | CS + Sales | Week 10–12 |

### The CS contact model
Each design partner has:
- **Technical CS Manager** — owns integration, configuration, and technical support
- **Relationship Lead** — owns executive relationship, feedback collection, renewal
- **Escalation path** — direct to Founder for blockers or strategic issues

---

## Onboarding Checklist

Complete each item with the partner. Track in CRM.

### Week 1 — Technical Foundation
- [ ] Admin access provisioned (partner admin signs in successfully)
- [ ] Identity provider / SSO configured and tested
- [ ] SCIM provisioning configured (or manual user list imported)
- [ ] All users assigned correct roles and domain pack access
- [ ] Domain-specific integrations connected:
  - Aegis: SIEM or threat feed connected
  - Vessels: AIS feed provider configured
  - Terra: data sources or MLS feed connected
- [ ] API health confirmed: `/api/health` returns 200
- [ ] CORTEX mobile app installed by key users

### Week 2 — Workflow Configuration
- [ ] First governed workflow identified with partner (which real operational decision to pilot)
- [ ] Covenant Policies reviewed and customized for partner's governance requirements
- [ ] Approval chains configured for the pilot workflow
- [ ] Notification rules configured (severity thresholds, escalation paths)
- [ ] Demo walkthrough completed with partner team
- [ ] Partner admin trained on user management

### Week 3–4 — Go-Live
- [ ] First real signal processed through the governed decision loop
- [ ] First approval action taken by a partner operator
- [ ] First outcome recorded
- [ ] Partner team debrief: what worked, what needs adjustment
- [ ] Any configuration adjustments made based on feedback
- [ ] Go-live confirmed — pilot is running on real operational data

### Week 6 — Mid-Pilot Review
- [ ] Adoption metrics reviewed with partner (see Adoption Checkpoints below)
- [ ] Outcome data reviewed — is the simulation accuracy reasonable?
- [ ] Feedback collected on specific workflow steps (structured feedback form)
- [ ] Any product gaps documented and shared with product team
- [ ] Expansion domains or features identified
- [ ] Renewal timeline confirmed

---

## Adoption Checkpoints

Measure adoption at weeks 2, 4, 6, and 8. Use these as the health signal.

### Green — On Track
- At least 1 real workflow running through the full governed loop
- Approval actions taken within SLA window (>80% of signals)
- Proof Chain records sealing successfully on all approved actions
- At least 3 unique operators using the platform per week
- Partner admin completing weekly signal queue review

### Yellow — At Risk
- Workflow is running but operators are not using approval gate (approving everything without review)
- Signals are accumulating unacknowledged (queue backlog >48 hours)
- Only 1–2 users actively engaging
- Partner admin has not logged in for >7 days
- Integration is connected but data is stale

### Red — Intervention Required
- No real workflow running after Week 4
- Integration not connected
- Partner admin account inactive
- Escalating complaints about usability or data quality
- Partner expressing doubt about the program

**If Yellow or Red:** Escalate to Relationship Lead immediately. Schedule a recovery call within 48 hours.

---

## Expansion Signals

Watch for these signals to initiate an expansion conversation:

| Signal | What it indicates | Next step |
|---|---|---|
| Operators in one domain asking about another domain | Cross-domain expansion readiness | Demo the additional domain pack |
| Admin adding new users without being prompted | Organic adoption | Acknowledge + discuss formal expansion |
| Partner asking about API access or integrations outside scope | Technical depth / integration expansion | Schedule technical discovery |
| Founder/executive asking about roadmap | Strategic alignment | Schedule executive briefing |
| Partner achieving measurable outcome from the pilot | Proof of value established | Start renewal / expansion conversation |

See [LAND_AND_EXPAND.md](LAND_AND_EXPAND.md) for the full expansion motion.

---

## Renewal Posture

### Timing
Start the renewal conversation at Week 10 of a 12-week pilot. Do not wait for the pilot to end.

### Renewal framework (DEAR)
- **D — Document outcomes:** Compile the pilot outcome data. How many decisions governed? Prediction accuracy? Time savings?
- **E — Expand scope:** Identify which additional domain packs or workflows to add in the renewal
- **A — Align stakeholders:** Confirm the champion, economic buyer, and any new stakeholders
- **R — Renewal terms:** Propose renewal pricing with multi-year discount if appropriate

### Renewal pricing
Renewal transitions from design partner terms to standard SaaS pricing. See [PRICING_PACKAGING.md](PRICING_PACKAGING.md) for current rates and discount authority.

### If renewal is at risk
Signs: partner going quiet, champion departure, budget freeze, competitive evaluation.

Response:
1. Escalate to Relationship Lead + Founder immediately
2. Schedule a direct executive call
3. Compile outcome data and ROI summary (see [ROI_MODEL.md](ROI_MODEL.md))
4. Offer outcome-based renewal framing if appropriate ("pay for what you got value from")
5. If competitive: do not panic. Return to the accountability gap. Competitors show data; SZL Holdings governs decisions.

---

## Feedback Collection

Design partners are co-designers. Structured feedback is a deliverable of the CS relationship, not a bonus.

### Weekly lightweight feedback
- 3-question pulse check via email or in-app: "What worked this week? What didn't? What would you change?"
- Log responses in CRM under the partner record

### Mid-pilot structured review (Week 6)
- 60-minute structured session
- Cover: adoption, workflow gaps, feature requests, integration needs, roadmap alignment
- Document and share a written summary with the partner within 48 hours
- Share highlights with product team same day

### End-of-pilot retrospective (Week 12)
- 90-minute formal retrospective
- Cover: outcomes achieved, what the partner would tell their peers, renewal intent, roadmap input
- Produce a case study draft (if partner consents)
- Document for product + investor use

---

## Escalation Paths

| Situation | Escalation target | SLA |
|---|---|---|
| Integration failure | Engineering lead | 4 hours |
| Security concern | Founder + security | 1 hour |
| Partner executive threatening to cancel | Founder | 24 hours |
| Data issue (incorrect / missing data) | Engineering lead | 8 hours |
| Billing or contract dispute | Founder | 24 hours |
| Feature gap blocking pilot | Product lead | 48 hours |

---

## CS Metrics

Track these per partner per quarter:

| Metric | Target | Note |
|---|---|---|
| Time to first governed decision | <4 weeks | From kickoff |
| Approval SLA compliance | >80% | Signals acknowledged within SLA |
| Proof Chain seal rate | 100% | All approved actions have sealed records |
| Weekly active users | ≥3 per domain pack | Minimum viable adoption |
| Mid-pilot satisfaction | ≥4/5 | Pulse check score |
| Renewal rate | >75% | Design partner → paying customer |
| Net Revenue Retention | >110% | Expansion > churn |

---

## Reference

- [Sales Handoff Guide](SALES_HANDOFF_GUIDE.md) — Deal handoff from sales
- [Design Partner Program](DESIGN_PARTNER_PROGRAM.md) — Program structure and terms
- [Land and Expand](LAND_AND_EXPAND.md) — Expansion motion
- [ROI Model](ROI_MODEL.md) — Value quantification for renewal conversations
- [Proof of Value Playbook](PROOF_OF_VALUE_PLAYBOOK.md) — Demonstrating pilot ROI
