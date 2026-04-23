# Lyte Command Center — Decision Intelligence: Demo Script

**Duration:** 6–8 minutes  
**Persona:** Marcus Holt (CFO) or CTO  
**URL:** `/lyte/`  
**Pre-requisite:** Demo seed loaded; signed into platform

---

## Pre-Demo Checklist

- [ ] Overview page shows business metrics (revenue pipeline, headcount signals, approval latency)
- [ ] At least 2 pending approvals in the decision center
- [ ] Signals console shows ≥ 5 active signals
- [ ] Eval studio has at least 1 completed evaluation run

---

## Step 1 — Overview (1 min)

**URL:** `/lyte/`

> "Lyte is the decision intelligence layer. It watches everything — revenue pipeline, operational signals, approval queues — and surfaces where decisions are blocked."

Point to the key metrics: Aged Approvals, Ownership Gaps, Value at Risk, Decision Latency.

> "Value at Risk: $5M. That's not a financial model estimate — it's the dollar value of decisions currently sitting in review queues past their SLA. The business is losing money while approvals wait."

---

## Step 2 — Signals Console (2 min)

**URL:** `/lyte/signals-console`

> "The signals console is the raw feed of everything the platform is observing. Every signal has a source, a severity, a classification, and a chain of custody."

Click on a high-severity signal.

> "This signal came from the Salesforce connector — an opportunity moved to 'Negotiation' stage but has been there for 22 days without a next step. That's a stall signal. Lyte classified it as 'pipeline risk.'"

Point to the **signal chain** button.

> "Every signal traces back to its source. No black boxes. An auditor can see exactly where this came from, what transformed it, and what action it triggered."

---

## Step 3 — Decision Center / Approvals (2 min)

**URL:** `/lyte/decision-center`

> "The decision center surfaces every action waiting for executive input. Not just the what — but the why it's waiting and how long it's been waiting."

Click a pending approval.

> "Approve fleet rerouting for Bay of Bengal. 34-hour latency. The cost of delay is shown — this isn't abstract governance, it has a dollar number."

Click **Approve**.

> "The approval is recorded, the proof chain entry is created, and the downstream workflow is triggered. The approval propagates to Command, to Vessels, and to the briefing queue."

---

## Step 4 — Entity Graph (1 min)

**URL:** `/lyte/entity-graph`

> "Every decision is connected to the entities it affects. This graph shows how a single approval propagates through the portfolio — which teams, which assets, which downstream tasks."

---

## Step 5 — Eval Studio (1 min)

**URL:** `/lyte/eval-studio`

> "Eval Studio is where you test whether the platform's decision recommendations are correct. Run a historical scenario against the current model and see how many times the system would have gotten it right."

---

## Avoidance Guide

- Business metrics are seeded — do not present as live operational data without framing
- Datadog / CloudWatch connectors are not yet configured — do not reference live infra metrics
- Role-based views (CTO vs CFO) are behind a feature flag — show unified view; role switcher is in the demo toolbar if needed

---

## Questions to Anticipate

**"How does this differ from a BI tool?"**  
> "BI tools show you what happened. Lyte shows you what's blocked right now and what it's costing. It's operational intelligence, not historical reporting. And every signal has attribution — you know who's accountable."

**"Can this integrate with our existing approval workflow?"**  
> "Yes — the approval engine has a webhook API. When a Jira issue is created from an approval, or a ServiceNow ticket is closed, Lyte gets the event and updates the decision record. The Jira bidirectional sync is live when credentials are provisioned."
