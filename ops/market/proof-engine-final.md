# Proof Engine — Final

**Last updated:** April 2026  
**Purpose:** Defines the repeatable model for generating, capturing, and publishing proof of platform value. Moves from raw platform capabilities to documented, referenceable outcomes.

---

## The Proof Problem

Design partners and pilots generate valuable signal — about what works, what doesn't, and what real operational impact looks like. Without a structured capture model, that signal stays inside the pilot and dies.

The proof engine is the system that converts pilot experience into referenceable, compounding commercial proof.

---

## The Proof Progression

```
Baseline → Signals → Evaluations → Approvals → Deltas → Lessons → Case Study → Public Reference
```

Each stage is a formal milestone with a structured output:

### Stage 1: Baseline

**When:** Before pilot goes live  
**Output:** Written baseline document capturing current-state metrics

Capture for each pilot:
- How decisions are currently made in this domain (process, tools, timing)
- Quantified current-state metrics: time per decision, error rate, rework rate, cycle time, compliance overhead
- Subjective current-state: confidence in current process, visibility into outcomes, auditability
- Manual steps that are candidates for governed automation

**Template fields:**
```
Organization: [name or code if confidential]
Domain: [Aegis / Vessels / Terra / Counsel / other]
Baseline date: [date]
Current decision process: [description]
Key metrics:
  - Decision cycle time: [X hours/days]
  - Error/rework rate: [X%]
  - Compliance overhead: [X hours/week]
  - Manual steps in process: [list]
Confidence score: [1–10 self-reported]
Primary pain point: [1 sentence]
```

---

### Stage 2: Signals

**When:** During pilot (ongoing)  
**Output:** Structured signal log — what the platform surfaced that the partner's previous process missed

Capture weekly:
- High-priority signals surfaced by domain pack agents
- Signals that triggered decisions (record decision and outcome)
- Signals that were reviewed and dismissed (record rationale)
- False positives (record and use to calibrate)

**Why this matters:** The signal log is the raw material for the case study and the evidence base for "the platform found things your previous process missed."

---

### Stage 3: Evaluations

**When:** During pilot (per decision cycle)  
**Output:** Evaluation log — AI recommendations reviewed, approved, or rejected

For each significant AI recommendation:
- What did the AI recommend?
- What was the confidence score?
- What evidence did it cite?
- What did the practitioner decide?
- Why (brief rationale if rejected)?

**Why this matters:** Evaluation logs prove the advisory model works — AI recommends, humans decide. They also identify calibration opportunities.

---

### Stage 4: Approvals

**When:** During pilot (per workflow cycle)  
**Output:** Approval audit log — consequential actions taken through the platform with full attribution

For each consequential action:
- Who approved?
- What role?
- What was the action?
- What was the signal that triggered it?
- What was the AI recommendation?
- What was the outcome?

This is generated automatically by the Proof Chain. The pilot review should include a walk-through of the approval log to validate it captures what partners care about.

---

### Stage 5: Deltas

**When:** 60-day and 90-day reviews  
**Output:** Delta report — baseline metrics vs. pilot period metrics

For each baseline metric captured:
- Before: [baseline value]
- After: [pilot period value]
- Delta: [absolute and percentage change]
- Attribution confidence: High / Medium / Low (was the change caused by the platform, or by other factors?)

**Honest delta reporting:**
- Do not claim attribution for changes that have other likely causes
- Medium or Low attribution confidence is acceptable and credible
- If a metric got worse, report it and explain why

---

### Stage 6: Lessons

**When:** 90-day review  
**Output:** Lessons document — what worked, what didn't, what would be done differently

For each pilot:
- What worked well?
- What failed or fell short of expectations?
- What did the platform not do that the partner expected it to do?
- What configuration or onboarding changes would improve the next pilot?

**Why this matters:** Lessons feed directly into product roadmap. Design partners whose feedback is visibly incorporated become stronger references.

---

### Stage 7: Case Study

**When:** Post-90-day, if partner agrees to be referenceable  
**Output:** Written case study structured around problem → approach → outcome

**Case study structure:**

```markdown
# [Partner Name or Pseudonym] — [Domain] Pilot

## The Situation
[2-3 sentences: who they are, what domain, what problem]

## The Approach
[2-3 sentences: what they deployed, how they used it, pilot scope]

## What Changed
[Specific delta metrics with attribution confidence]
- Decision cycle time: X → Y (Z% reduction)
- [Other delta]

## What They Said
[Direct quote if they agreed to be quoted — do not fabricate]

## What We Learned
[1-2 honest observations about what worked and what needs improvement]
```

**What not to do:**
- Do not publish a case study without explicit partner approval
- Do not fabricate or round up metrics
- Do not omit that the partner was a design partner (not a paying commercial customer)
- Do not claim the pilot was "production" if it was a limited trial scope

---

### Stage 8: Public Reference

**When:** Partner agrees to be named and referenceable  
**Output:** Public-facing reference — case study, testimonial, or logo

Public reference tiers:
1. **Named case study** — full write-up with partner name and quotes (highest value)
2. **Anonymous case study** — full write-up, industry/domain only, no name
3. **Testimonial** — direct quote with partner name and title
4. **Logo** — logo display on website with permission (requires named case study or explicit logo permission)

---

## Proof Engine Operating Rules

1. Baseline is mandatory before every pilot. No exceptions.
2. Signal and evaluation logs are maintained weekly — not reconstructed from memory.
3. Delta reports are honest: low attribution confidence is reported, not hidden.
4. Case studies require explicit written partner approval before publication.
5. Lessons are shared with partners in the 90-day review — showing you listened matters.
6. No public proof claims ("proven ROI," "customers saw X% improvement") until at least one named case study exists.

---

*See also: `pilot-to-case-study-playbook.md` (execution detail), `referenceability-ladder.md` (public proof progression)*
