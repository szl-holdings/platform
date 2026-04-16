# Proof Engine — SZL Holdings

**Phase:** B · **Audience:** Founder, customer success, design partner ops · **Last reviewed:** 2026-04-16

---

## Purpose

The Proof Engine is the repeatable system for turning every design partner pilot into measurable, attributable, externalizable proof. It defines the six-stage proof lifecycle and the artifacts each stage must produce.

Without this engine, every pilot is a one-off story. With it, every pilot generates: (a) a case study, (b) a referenceable account, (c) a quantified before/after delta, and (d) lessons that compound across the next pilot.

---

## The Six-Stage Proof Lifecycle

```
Baseline → Signals → Decisions → Approvals → Outcomes → Lessons
```

Every pilot runs this loop. The engine is the discipline of capturing the right artifact at the right stage.

### Stage 1 — Baseline
**What is captured:** The state of the buyer's operation before SZL is deployed.

| Artifact | Owner | Cadence |
|----------|-------|---------|
| Baseline metrics worksheet (5-10 ops metrics) | Founder + buyer ops lead | Day 0 of pilot |
| Decision archaeology (3-5 recent consequential decisions, how they were made) | Founder + buyer ops lead | Day 0-7 |
| Tooling map (current decision tools, signals, escalation paths) | Buyer ops lead | Day 0-7 |
| Pain inventory (top 5 frustrations the buyer wants resolved) | Buyer ops lead | Day 0-7 |

**Quality bar:** Quantitative where possible (latency, missed signals, time-to-decision). Qualitative is acceptable when the buyer cannot produce numbers.

### Stage 2 — Signals
**What is captured:** Which signals the platform ingests and surfaces during the pilot.

| Artifact | Owner | Cadence |
|----------|-------|---------|
| Signal volume by source | Platform telemetry | Continuous |
| Signal-to-attention rate (% reviewed by an operator) | Platform telemetry | Weekly |
| Signal-to-decision rate (% that became a decision) | Platform telemetry | Weekly |
| Signal quality feedback (false positive / negative) | Buyer ops + founder | Weekly |

### Stage 3 — Decisions
**What is captured:** Every consequential decision the platform helped make.

| Artifact | Owner | Cadence |
|----------|-------|---------|
| Decision log (signal → recommendation → simulation → policy state → execution) | Platform | Continuous |
| Decision quality review (was the recommendation right?) | Buyer ops + founder | Weekly |
| Override events (operator overrode AI; reason captured) | Platform | Continuous |

### Stage 4 — Approvals
**What is captured:** Policy gates triggered, approvals granted, latency reduced.

| Artifact | Owner | Cadence |
|----------|-------|---------|
| Approval cycle time (request → decision) | Platform | Continuous |
| Approval coverage (% of consequential actions that hit a gate) | Platform | Continuous |
| Approval quality (approver had the evidence they needed) | Buyer + founder | Weekly |

### Stage 5 — Outcomes
**What is captured:** What actually happened after the decision.

| Artifact | Owner | Cadence |
|----------|-------|---------|
| Outcome attribution (signal → decision → outcome chain) | Platform Outcome Graph | Continuous |
| Outcome quality (did the decision produce the desired result?) | Buyer ops + founder | Weekly + 30/60/90 days |
| Quantified delta vs. baseline (the headline metric for the case study) | Buyer ops + founder | Day 30, 60, 90 |

### Stage 6 — Lessons
**What is captured:** What this pilot taught us — about the buyer, the platform, and the playbook.

| Artifact | Owner | Cadence |
|----------|-------|---------|
| Buyer lessons (what surprised the buyer about their own operation) | Founder | Day 90 |
| Platform lessons (product gaps, feature requests, friction points) | Founder + product | Day 90 |
| Playbook lessons (talk track refinements, demo flow improvements, objection patterns) | Founder | Day 90 |

---

## Proof Engine Artifacts (Per Pilot)

By Day 90 of any pilot, the engine produces:

1. **Pilot scorecard** — Baseline vs. outcome metrics, signed by the buyer
2. **Case study draft** — 1-2 pages, anonymized first, named-version pending buyer approval
3. **Reference account dossier** — buyer contact, willingness-to-reference scope, talking points
4. **Before/after delta sheet** — single-page visual, ready for use in next sales conversation
5. **Lessons memo** — internal-only, fed back into talk tracks, demo flow, and product roadmap

---

## Proof Surfaces (Where Proof Shows Up)

| Surface | Form | Audience |
|---------|------|----------|
| szlholdings.com customer page | Anonymized → named case studies | Public buyers |
| Investor narrative | Quantified delta highlights | Investors |
| Founder talk tracks | Specific story examples | Live conversations |
| Operator demo | Real signals from real buyers (with permission) | Buyer prospects |
| Trust center | Audit trail evidence from real pilots | Compliance evaluators |
| Internal weekly review | Pilot health, proof velocity | Founder |

---

## Proof Engine Quality Bars

A pilot generates externalizable proof only if:

- [ ] Baseline was captured at Day 0 (without baseline, there is no delta to claim)
- [ ] At least one quantified metric improved by >20% vs. baseline
- [ ] Buyer signed the case study draft (or accepted anonymized version)
- [ ] At least one operator at the buyer is willing to take a reference call
- [ ] Lessons memo is filed and referenced in the next pilot's planning

If any of these fail, the pilot is internal learning only — not external proof. That is acceptable. Misrepresenting unfinished proof is not.

---

## Anti-Patterns

- **Storytelling without metrics.** A case study without a number is marketing, not proof.
- **Skipping baseline.** Without Day 0 baseline, the platform's contribution is not attributable.
- **Over-claiming attribution.** If the operator changed five things during the pilot, the platform gets partial credit. Say so.
- **Premature externalization.** Do not publish a case study before the buyer has signed it.
- **Lessons not fed back.** The point of the lessons memo is to refine the next pilot. If it sits in a folder, the engine has failed.

---

*The Proof Engine is the bridge between "we shipped a great architecture" and "buyers paid us for it because of these specific outcomes." Run the engine on every pilot. No exceptions.*
