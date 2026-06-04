# Design Partner Machine — SZL Holdings

**Phase:** G · **Audience:** Founder, internal · **Last reviewed:** 2026-04-16

---

## Purpose

The Design Partner Machine is the repeatable system for sourcing, qualifying, signing, and running design partners. It is the first commercial muscle the company builds — every other commercial system (proof, references, case studies, packaging) depends on it producing high-quality pilots reliably.

Without this machine, the company has occasional pilots. With it, the company has a predictable cadence of design partner intake.

---

## The Machine, End-to-End

```
Source → Qualify → Discover → Diagnose → Sign → Onboard → Run → Convert
```

Each stage has an input, an output, and a gate. The machine fails when a stage is skipped or its gate is not met.

---

## Stage 1 — Source

**Goal:** Generate a steady inflow of qualified design partner candidates.

### Source channels (in priority order)

| Channel | Effort | Quality |
|---------|--------|---------|
| Founder direct outreach (LinkedIn, intros, conferences) | High | Highest |
| Warm intros from existing pilots / references | Medium | Highest |
| Investor / advisor referrals | Low | High |
| Inbound from szlholdings.com / content / GitHub | Medium | Variable |
| Cold outbound (templated) | Low | Lowest |

**Founder discipline:** 3-5 hours / week of direct sourcing, every week. No exceptions during the design partner phase.

### Source artifact
- A simple pipeline spreadsheet or CRM with: name, title, company, source, last contact, next action, stage

---

## Stage 2 — Qualify

**Goal:** Decide quickly whether a candidate is a real design partner prospect.

### Qualification criteria (all must be true)

1. **Real decision pain.** Buyer has a specific, expensive, recurring decision they make poorly today
2. **Decision authority.** The candidate is the economic decision-maker OR has direct access to one
3. **Operator availability.** Buyer has at least one operator who will be in the loop weekly
4. **Honest engagement.** Buyer is willing to share baseline data and give honest feedback
5. **90-day commitment.** Buyer can commit to 90 days of weekly engagement

### Disqualifiers (any one disqualifies)

- "We're evaluating 5 vendors" — they want a bake-off, not a pilot
- "We need everything customized first" — they want a built-to-order product, not a pilot
- "Procurement requires SOC 2 before we sign anything" — they're not at the design partner stage
- "Our budget for this is $0 and stays $0" — they want free software, not a partnership
- "I can connect you to someone on my team" — the principal isn't the buyer

### Qualification gate
Founder writes a 3-sentence qualification note: who they are, what their pain is, why they qualify. If can't write it, not qualified.

---

## Stage 3 — Discover

See `buyer-close-system.md` Step 1 (Discovery).

**Output:** 30-45 minute conversation, no demo, no deck. Founder writes the discovery note.

**Gate:** Can identify the buyer's specific decision pain in 3 sentences with a $ or time number.

---

## Stage 4 — Diagnose (Demo + Joint Diagnosis)

See `buyer-close-system.md` Steps 2-3 (Demo + Joint Diagnosis).

**Output:** Joint diagnosis document signed by buyer's ops lead.

**Gate:** Buyer signs the diagnosis. If they hesitate, the pilot is not ready.

---

## Stage 5 — Sign

See `buyer-close-system.md` Steps 4-6 (Proposal, Agreement, Signed).

**Output:** Signed design partner agreement on file.

**Gate:** Signed. Kickoff scheduled within 2 weeks.

---

## Stage 6 — Onboard

**Goal:** Get the buyer to first decision in the loop within 2 weeks of signing.

### Week 1 (Days 1-7)
- Day 1: Kickoff call — review baseline metrics, success criteria, weekly cadence
- Day 2-3: Provision tenant; configure operator access
- Day 4-5: Connect first signal source (read-only is fine)
- Day 6-7: First operator dry-run with seeded signals

### Week 2 (Days 8-14)
- Day 8-10: First real signal flowing into the loop
- Day 11-12: First decision made through the platform
- Day 13: First weekly partner review
- Day 14: Founder writes Week 2 note: did first decision happen? if not, what's blocked?

### Onboarding gate
By Day 14, at least one real decision has flowed through the loop. If not, escalate — onboarding has stalled and needs founder intervention.

---

## Stage 7 — Run

**Goal:** 90 days of disciplined operation that generates the proof artifacts.

See `proof-engine.md` for the proof lifecycle and `weekly-partner-review.md` for the weekly cadence.

**Run gate:** Each week, at least one decision processed and one weekly partner review completed.

---

## Stage 8 — Convert

See `pilot-vs-production-commercial-model.md` for the conversion conversation and outcomes.

**Convert gate:** By Day 90+15, buyer has either signed a production contract OR exited cleanly with reference rights captured.

---

## Pipeline Math

For the design partner phase to produce 5 anchor pilots in 6 months, the founder needs:

| Stage | Conversion rate (assumed) | Volume needed |
|-------|--------------------------|---------------|
| Source → Qualified | 30% | 50 sourced → 15 qualified |
| Qualified → Discovery completed | 50% | 15 qualified → 7-8 discoveries |
| Discovery → Joint diagnosis signed | 60% | 7-8 → 4-5 diagnoses |
| Joint diagnosis → Signed pilot | 80% | 4-5 → 4 pilots |

**Bottom line:** ~50 sourced contacts produces ~4 signed pilots. The funnel is wider than founders typically expect.

---

## Time Allocation (Founder, Weekly, in Design Partner Phase)

| Activity | Hours / week |
|----------|--------------|
| Sourcing (outreach, intros, conferences) | 3-5 |
| Discovery and demo calls (with prospects) | 5-8 |
| Joint diagnosis sessions (with serious prospects) | 2-4 |
| Weekly partner reviews (with active pilots) | 4-6 (1 hour x active pilots) |
| Pilot operations (founder white-glove during pilot) | 4-8 |
| Pipeline management (notes, follow-ups, CRM) | 2-3 |
| **Total commercial time** | **20-34 hours / week** |

This is a full-time founder commitment. If the founder cannot commit this time, the design partner machine will not produce the cadence required.

---

## Cohort Strategy

### Cohort 1 (anchors): Pilots 1-5
- Free pilots in exchange for case study + reference rights
- Founder personally owns every aspect
- Goal: 1 anchor reference per domain pack we want to launch with

### Cohort 2: Pilots 6-15
- Nominal pilot fee ($5K-$15K)
- Founder still primary, CS support emerging
- Goal: Convert 60%+ to production; refine playbook with each pilot

### Cohort 3: Pilots 16+
- Paid evaluation pricing ($25K+)
- CS team handles onboarding and ops; founder handles strategic / executive engagement
- Goal: Predictable conversion rate, predictable pricing, lower founder dependency

---

## Anti-Patterns

- **Skipping qualification.** Every unqualified pilot consumes founder time that should have gone to a qualified one.
- **Skipping diagnosis.** Pilots without agreed success metrics become Day 90 coin flips.
- **Pilot proliferation.** Running 10 pilots in parallel destroys the founder's ability to engage white-glove. Cap at 3-4 active.
- **No post-pilot lessons.** Every pilot should refine the playbook. If the next pilot looks the same as the last, lessons aren't being captured.
- **Sourcing pause.** Stopping sourcing because pipeline "feels full" → 60 days later the pipeline is empty. Source every week.

---

*The Design Partner Machine is the first commercial muscle. Build it deliberately. Run it disciplined. Every other commercial system depends on this machine producing reliably.*
