# Partner Onboarding Machine
Generated: 2026-04-16

## Purpose
A repeatable, step-by-step system for taking a qualified design partner from signed NDA to active pilot in ≤14 days. Every step has a clear owner, output, and handoff.

---

## Full Lifecycle Overview

```
Inbound → Qualification → Diligence → NDA → Onboarding → Pilot → Weekly Review → Success Review → Expand or Exit
```

Each stage has entry criteria, activities, and exit criteria. Nothing advances until the exit criteria are met.

---

## Stage 1: Inbound

**Entry:** Contact form submission, referral, or direct outreach  
**Owner:** Founder (Stephen)

### Activities
- Acknowledge within 24 hours (email or personal note)
- Review LinkedIn / org context before reply
- Send a 3-sentence qualifying reply: confirm we're still in design-partner stage, note the commitment required, ask 1 clarifying question about their problem

### Exit Criteria
- Lead has replied and expressed continued interest
- Initial problem statement is readable

---

## Stage 2: Qualification Call

**Entry:** Lead has replied  
**Owner:** Founder  
**Duration:** 30 minutes

### Pre-Call Checklist
- [ ] Research organization: domain, size, known problems
- [ ] Review funnel event log (did they visit /trust, /design-partner, /architecture?)
- [ ] Prepare 2 tailored questions about their specific operational problem

### Call Structure
| Time | Topic |
|------|-------|
| 0–5 min | Brief intro; confirm the problem they submitted |
| 5–15 min | Let them describe the problem in their own words — listen, don't pitch |
| 15–22 min | Brief overview of Lyte/Alloy and relevant domain pack |
| 22–28 min | Explain design-partner model and commitment level |
| 28–30 min | Agree next step or honest no |

### Qualification Scoring (internal, not shared)
Rate 1–3 on each criterion from the offer doc:
- Problem specificity
- Sponsor authority
- Internal champion capacity
- Data access likelihood
- Timeline alignment

Score ≥ 12: proceed. Score 8–11: conditional proceed with flag. Score < 8: politely decline.

### Exit Criteria
- Decision made: proceed or decline
- If proceed: verbal commitment to NDA and follow-up diligence

---

## Stage 3: Diligence & NDA

**Entry:** Qualification call passed  
**Owner:** Founder + Ops  
**Target:** Complete within 5 business days

### Activities
- Send mutual NDA (standard template, no redlines without legal review)
- Send Partner Brief template for them to complete (see Appendix A)
- Internal check: no conflicts, org not in active litigation, data access plausible

### Exit Criteria
- Signed NDA received
- Partner Brief received (partial is OK; we'll complete it in kickoff)

---

## Stage 4: Onboarding Kickoff

**Entry:** NDA signed  
**Owner:** Founder  
**Format:** 60-minute video call  
**Materials:** Partner Brief, onboarding deck, access credentials

### Kickoff Agenda
| Time | Topic |
|------|-------|
| 0–10 min | Introductions; confirm the team attending the pilot |
| 10–20 min | Jointly finalize the Partner Brief: problem statement, success metrics, data access plan |
| 20–35 min | Platform walkthrough: Lyte signal ingestion, Alloy action routing, proof chain |
| 35–45 min | Integration and data access: what connects, how, and by when |
| 45–55 min | Weekly review cadence: time, attendees, format |
| 55–60 min | Open questions; confirm Week 1 action items |

### Access Provisioning (before kickoff)
- [ ] Platform credentials created and tested
- [ ] Domain pack configured for their org
- [ ] Slack channel or shared workspace created for async comms
- [ ] Weekly review invite sent

### Exit Criteria
- Partner Brief finalized and shared back
- Credentials confirmed working by partner
- Week 1 actions agreed and documented

---

## Stage 5: Active Pilot

**Duration:** 90 days  
**Cadence:** Weekly 45-minute review + async Slack  
**Milestones:** Week 4 feedback, Week 8 feedback, Week 12 success review

See `first-30-days-partner-plan.md` for the detailed operating model during this stage.  
See `weekly-partner-review-system.md` for the review format.

---

## Stage 6: Success Review

**Timing:** Week 12 (or sooner if pilot objectives met)  
**Duration:** 60 minutes  
**Owner:** Founder

### Agenda
| Time | Topic |
|------|-------|
| 0–10 min | Partner self-assessment: what worked, what didn't |
| 10–25 min | Metrics review: operational outcomes vs. targets set in Partner Brief |
| 25–40 min | Platform feedback: what to build, change, or remove |
| 40–50 min | Commercial conversation: expansion path, pricing, timeline |
| 50–60 min | Next steps or clean exit |

### Exit Paths
- **Convert:** Move to commercial terms, initiate case study process
- **Extend:** 30-day extension if specific milestone is close
- **Exit:** Debrief doc filed, lead marked as "exited — revisit in 6 months"

---

## Appendix A: Partner Brief Template

```
# Partner Brief — [Org Name]

**Date:** YYYY-MM-DD  
**Partner contact:** Name, Title, Email  
**Internal champion:** Name, Title  
**Domain pack:** [Counsel / Vessels / Aegis / Terra / Core Lyte]

## Problem Statement
[2–4 sentences describing the operational problem in plain language]

## Current State
[How is this problem being handled today? What breaks when it fails?]

## Success Metrics
1. [Metric 1 with target and timeline]
2. [Metric 2 with target and timeline]
3. [Metric 3 with target and timeline]

## Data Access Plan
- System(s) to connect:
- Format / access method:
- Timeline to first data ingestion:
- Approvals required:

## Stakeholders
| Name | Role | Involvement |
|------|------|-------------|
|      |      |             |

## Known Constraints
[Any deadlines, org changes, or sensitivities we should know about]
```

---

## Version History
- 2026-04-16: Initial draft, CTO Pass Phase F
