# Proof Engine — Final
**Phase C — CTO Pass**
*Completed: April 16, 2026*
*Owner: Founder*

---

## Purpose

This document defines the repeatable proof engine used to structure design partner pilots. Every pilot follows the same template: baseline → signals → decisions → actions → delta → lessons. This ensures consistent evidence generation, comparable outcomes across pilots, and a clear path to case study.

---

## The Proof Engine Template

A proof engine is not a feature. It is a structured methodology for capturing evidence before, during, and after an intervention — so the impact of the SZL operating loop can be measured, attributed, and reported.

### The Six-Stage Proof Arc

```
BASELINE  →  SIGNALS  →  DECISIONS  →  ACTIONS  →  DELTA  →  LESSONS
  (T0)       (Week 1)    (Week 2-3)   (Week 3-4)   (T1)     (Close-out)
```

---

## Stage 1: Baseline (T0)

**Purpose:** Capture the current state of the organization's operating loop before SZL is instrumented. This is the control measurement.

**Timing:** Week 0 — before any connector is live.

**What to measure:**

| Metric | Measurement Method | Baseline Target |
|--------|-------------------|----------------|
| Average approval latency | Pull from existing approval system (Jira, email, ServiceNow) | Record as-found |
| Number of open items older than SLA | Manual count or export from task system | Record as-found |
| Ownership gap rate | % of open items with no assigned owner | Record as-found |
| Decision turnaround time | Average time from flagged issue to decision recorded | Record as-found |
| Audit coverage | % of consequential actions with documented rationale | Record as-found |
| Escalation rate | % of items that escalated beyond initial owner | Record as-found |

**Deliverable:** `pilot-[client]-baseline.md` — a single document capturing all six metrics with sources, timestamps, and methodology notes.

**Who completes it:** Founder + design partner ops lead, jointly. Data must come from the partner's own systems — SZL does not estimate baselines.

---

## Stage 2: Signals (Week 1–2)

**Purpose:** Instrument the first workflow and begin ingesting signals. Validate that signal capture is working before building decision logic.

**What to do:**

1. Identify the first workflow to instrument (highest signal value, lowest integration risk)
2. Configure connector(s) for that workflow — API, webhook, or event stream
3. Run Lyte in observe-only mode for one week — capture signals without any action
4. Review signal feed daily with the partner ops lead: are the signals accurate? Are any false positives appearing?
5. Tune classification thresholds if needed

**Evidence to capture:**
- Signal count by day (week 1 vs week 2 — should stabilize)
- Signal classification accuracy (validated by partner ops lead)
- Any false positive or false negative patterns
- Time to first meaningful signal after go-live

**Deliverable:** `pilot-[client]-signals-week1.md` — signal feed summary, accuracy assessment, tuning notes.

---

## Stage 3: Decisions (Week 2–3)

**Purpose:** Activate the evaluation and recommendation layers. Capture the quality of structured decisions being produced.

**What to do:**

1. Switch from observe-only to propose-only mode for the instrumented workflow
2. For each signal that generates a recommendation, record:
   - Was the recommendation accepted by the partner ops lead?
   - Was it rejected? Why?
   - Was the evidence trail complete?
   - What was the confidence score?
3. Review Alloy Intelligence evidence retrieval — is the knowledge base surfacing the right context?
4. Track decision acceptance rate as the core quality metric

**Evidence to capture:**
- Decision acceptance rate (target: >70% by end of week 3)
- Evidence retrieval relevance score (reviewed with partner)
- Number of recommendations requiring manual override
- Time from signal ingestion to recommendation produced

**Deliverable:** `pilot-[client]-decisions-week2-3.md` — recommendation log, acceptance rates, evidence quality notes.

---

## Stage 4: Actions (Week 3–4)

**Purpose:** Activate the approval gate and action routing. Measure the impact on approval latency and ownership accountability.

**What to do:**

1. Switch from propose-only to approval-required mode
2. Confirm approval chain configuration is correct for the partner's org structure
3. Run one full operating loop cycle: signal → recommendation → approval → action → receipt
4. Record the approval chain traversal time — compare to baseline
5. Track action completion rate and time-to-close

**Evidence to capture:**
- Approval latency (compare to Stage 1 baseline)
- Number of actions completed within SLA
- Approval chain completeness (any broken links?)
- First trust receipt generated (screenshot for case study archive)

**Deliverable:** `pilot-[client]-actions-week3-4.md` — action log, approval latency data, first receipt record.

---

## Stage 5: Delta (T1)

**Purpose:** Measure the outcome delta — the difference between T0 (baseline) and T1 (after pilot). This is the evidence the case study is built on.

**Timing:** End of pilot engagement (typically week 8–12 depending on scope).

**What to measure:**

| Metric | T0 (Baseline) | T1 (Post-Pilot) | Delta | % Change |
|--------|--------------|----------------|-------|----------|
| Average approval latency | — | — | — | — |
| Open items > SLA | — | — | — | — |
| Ownership gap rate | — | — | — | — |
| Decision turnaround time | — | — | — | — |
| Audit coverage | — | — | — | — |
| Escalation rate | — | — | — | — |

Fill this table from the same data sources used in Stage 1. Do not change methodology between T0 and T1.

**Additional evidence to capture:**
- Partner ops lead qualitative assessment (structured interview, 30 minutes)
- Any specific incidents that were resolved or prevented by the operating loop
- Any compliance or audit requests that the proof chain supported
- Business value estimate (optional — partner may provide or decline)

**Deliverable:** `pilot-[client]-delta.md` — T0 vs T1 comparison table, qualitative assessment notes, value estimate if provided.

---

## Stage 6: Lessons (Close-out)

**Purpose:** Capture what worked, what didn't, and what should be improved — both for the product and for the pilot methodology.

**What to capture:**

**Product feedback:**
- Which features were most used?
- Which features were confusing or unused?
- What was missing that the partner expected?
- Any integration issues or connector gaps?

**Methodology feedback:**
- Was the baseline methodology robust?
- Did the 6-week arc feel right, or should the timeline change?
- What would have made the pilot more compelling?

**Referencability assessment:**
- Is the partner willing to be referenced publicly? (Yes / No / NDA-only)
- Are they willing to participate in a case study? (Full / Attributed / Anonymous)
- Would they provide a quote for the website?

**Deliverable:** `pilot-[client]-lessons.md` — structured lessons log, referencability assessment, any product feedback filed.

---

## Proof Engine Archive Structure

Each pilot generates a set of documents in `docs/internal/pilots/[client-slug]/`:

```
docs/internal/pilots/[client-slug]/
├── pilot-[client]-baseline.md
├── pilot-[client]-signals-week1.md
├── pilot-[client]-decisions-week2-3.md
├── pilot-[client]-actions-week3-4.md
├── pilot-[client]-delta.md
├── pilot-[client]-lessons.md
└── pilot-[client]-receipts/
    ├── receipt-001.png   (first trust receipt screenshot)
    ├── receipt-002.png
    └── ...
```

This archive is the evidentiary foundation of the case study.

---

## Quality Bar for Case Study Eligibility

A pilot is eligible for case study if it meets **at minimum three** of the following:

- [ ] T0 baseline was documented before any instrumentation
- [ ] T1 delta shows improvement on at least two metrics
- [ ] At least one full operating loop cycle was completed (signal → receipt)
- [ ] Partner ops lead provided a qualitative assessment on record
- [ ] Partner has agreed to at least anonymous reference

If a pilot meets all five, it is eligible for a named, attributed case study.

---

## Evidence Artifacts for Investor / Board Use

Even before a case study is publishable, the following artifacts from the proof engine can be shared with investors and board members:

- The delta table (with client anonymized if needed)
- The trust receipt (screenshot, redacted if needed)
- The approval chain visualization (screenshot)
- The operating loop rail screenshot showing all 6 stages active

These artifacts live in `docs/internal/pilots/[client-slug]/` and can be extracted for data rooms and investor updates.

---

*See also: [Pilot to Case Study System](./pilot-to-case-study-system.md) · [Demo Finalization](./demo-finalization.md) · [Enterprise Demo Script](./enterprise-demo-script.md)*
