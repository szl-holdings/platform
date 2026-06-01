# Design Partner Operating Model

**Last updated:** April 2026  
**Purpose:** Defines the full operating structure for the design partner program — from inbound to qualification to pilot to review to expansion.

---

## Program Overview

The design partner program is the commercial entry motion for SZL Holdings. It is how the platform moves from functional alpha to first revenue, from no public proof to referenceable outcomes, and from founder-only GTM to a structured commercial operation.

The program is designed to run 3–6 design partners per domain pack concurrently. Exceeding this threshold risks quality degradation — the founder cannot give meaningful engagement to more than 6 active pilots simultaneously.

---

## Stage Gate Model

```
Inbound → Qualification → Diligence → Pilot → Review → Expansion or Exit
```

Each stage has defined entry criteria, defined activities, and a defined exit gate.

---

## Stage 1: Inbound

**Sources:**
- Demo request form (/demo)
- Direct founder outreach
- Warm referrals from advisors or network
- LinkedIn or event conversations

**Actions within 24 hours:**
- Review inbound for basic domain fit (does their domain map to a current domain pack?)
- If fit is plausible: schedule an initial 30-minute discovery call
- If no fit: respond with honest explanation and keep relationship warm

**No qualification in the inbound stage.** The initial call is discovery — not a sales pitch and not yet a qualification gate.

---

## Stage 2: Qualification

**Objective:** Determine whether this prospect meets design partner criteria before investing founder time in a demo.

**Qualification call agenda (30 minutes):**
1. Their current operation and decision process (10 min)
2. The specific problem they are trying to solve (10 min)
3. What they expect from a pilot (5 min)
4. Initial commercial conversation — do they have budget authority and timeline? (5 min)

**Qualification criteria review (see `design-partner-offer.md`):**
- [ ] Domain fit confirmed
- [ ] Executive sponsor identifiable
- [ ] Technical POC identifiable
- [ ] Pilot window realistic
- [ ] Success metrics can be defined

**Qualification outcome:**
- **Proceed:** Move to Diligence — schedule full demo and diligence session
- **Not yet:** Keep in pipeline with a specific re-engagement trigger (e.g., "reach back when budget is confirmed")
- **No fit:** Close gracefully with a clear explanation

---

## Stage 3: Diligence

**Objective:** Allow the prospect to conduct their evaluation while the founder validates fit in detail.

**Founder activities:**
- Deliver full platform demo tailored to their domain
- Provide trust center and API documentation access
- Answer diligence questions from technical evaluator and security reviewer
- Surface design partner offer document

**Prospect activities (self-serve):**
- Review trust center, API docs, architecture overview
- Evaluate domain pack fit
- Internal discussion with executive sponsor and technical POC

**Diligence stage SLA:**
- All prospect questions answered within 24–48 hours
- Diligence stage maximum: 3 weeks. If no decision after 3 weeks, close conversation or restart with a specific commitment from prospect.

**Diligence exit gate:**
- Prospect ready to discuss pilot terms → proceed to Pilot setup
- Prospect has unresolved concerns → address or close

---

## Stage 4: Pilot

**Objective:** Run a structured 60–90 day pilot that generates baseline-to-delta proof.

**Pilot setup (week 0):**
- [ ] Pilot agreement or LOI signed
- [ ] Success metrics agreed and documented
- [ ] Baseline document completed and signed off by partner
- [ ] First-30-days plan reviewed with partner
- [ ] Platform access provisioned
- [ ] Kickoff session completed

**Weekly operating rhythm (see `pilot-to-case-study-playbook.md`):**
- Async check-in: signal log + blockers
- Bi-weekly 30-minute sync call
- 30-day, 60-day, 90-day formal checkpoints

**Founder time commitment per active pilot:**
- 1–2 hours/week for async communication and signal review
- 30 minutes bi-weekly for sync call
- 2–3 hours at each 30/60/90-day checkpoint

**Concurrent pilot capacity (founder-only):**
- Maximum 4–6 active pilots simultaneously
- Priority to pilots closest to their 90-day review date

---

## Stage 5: Review

**Objective:** Generate the commercial and proof output from the pilot.

**90-day review meeting (60–90 minutes):**
1. Delta report presentation
2. Lessons discussion
3. Commercial conversion conversation
4. Referenceability conversation

**Review outputs:**
- Signed delta report
- Lessons document
- Commercial path decision: convert, extend, or exit
- Referenceability decision: named / anonymous / none

**Post-review actions (within 2 weeks):**
- [ ] Case study drafted and sent for approval (if referenceable)
- [ ] Commercial agreement drafted (if converting)
- [ ] Lessons document sent to partner (even if not converting)

---

## Stage 6: Expansion or Exit

### Expansion Path

Commercial conversion:
- Production agreement replaces pilot terms
- Billing activated (Stripe configuration — see `packaging-model-final.md`)
- SLA and support terms formalized
- Account assigned to ongoing founder engagement or future customer success role

Expansion triggers:
- Additional domain packs added
- More users onboarded
- New organizational units included
- CORTEX mobile deployment

### Exit Path

Structured exit if pilot does not convert:
- 30-minute exit call
- Written feedback captured
- Reason classified: product gap / commercial gap / timing / wrong fit
- Relationship kept warm — non-converting partners often refer

---

## Pipeline Tracking

Maintain a simple pipeline tracker (spreadsheet or equivalent):

| Organization | Domain | Stage | Entry Date | Expected 90-Day | Status | Notes |
|---|---|---|---|---|---|---|
| [Name or code] | [Domain] | [Stage] | [Date] | [Date] | Active / Paused / Closed | [Brief] |

Review pipeline weekly. Any organization that has not advanced in 3 weeks needs a decision: follow up, pause, or close.

---

## Program Capacity Limits

| Metric | Limit | Rationale |
|---|---|---|
| Concurrent active pilots | 6 | Founder engagement quality floor |
| Partners per domain pack | 3–6 | Enough for cross-domain learning; not so many that attention is split |
| Total pipeline (all stages) | 15–20 | Beyond this, qualification becomes inconsistent |

When at capacity: pause new inbound evaluations or queue them clearly with an expected timeline.

---

*See also: `design-partner-offer.md` (terms and qualification), `first-30-days-partner-plan.md` (kickoff structure), `pilot-to-case-study-playbook.md` (proof capture)*
