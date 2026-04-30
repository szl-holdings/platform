# From signal to proof: a day inside a governed decision.

**What every consequential enterprise decision should look like — and the infrastructure that makes it possible.**

---

[IMAGE: 01-hero-decision-loop.png — SZL Holdings nine-step governed decision loop diagram, 1440×900, dark mode]

---

*Post 3 of 3 in the SZL Holdings launch series. [Post 1 — Thursday: The accountability gap.](https://szlholdings.substack.com) [Post 2 — Sunday: Six primitives, not features.](https://szlholdings.substack.com)*

---

The first two posts in this series argued the thesis (the accountability gap is the next enterprise problem) and described the architecture (six primitives, not features). This post is for practitioners. It walks one real consequential decision — start to finish, no abstraction — through the governed decision loop.

The scenario is taken from the maritime domain because it is concrete, multi-party, and crosses domain boundaries (maritime → legal). The same structure applies to security incidents, real estate underwriting, and legal matter triage.

The scenario:

> A bulk carrier registered to a counterparty has gone dark on AIS tracking while transiting a sanctions-adjacent maritime corridor. The Vessels domain pack surfaces the signal. Operations, compliance, and legal need to act — together, traceably, before exposure compounds.

Here is what the operator sees, what the AI does, and what the platform records at every step.

---

## Step 1 — Signal

[IMAGE: 02-signal-detection.png — Vessels signal panel showing dark AIS event detection, 1440×900, dark mode]

The Event Fabric receives an AIS feed update. A vessel that had been transmitting on a 6-minute cadence has gone silent for 47 minutes. Threshold logic in the Vessels domain pack identifies this as a "dark vessel" event in a sanctions-adjacent corridor — a classification with elevated regulatory exposure.

The signal is normalized: vessel IMO, last known position, last AIS timestamp, corridor classification, severity, source feed identifier. The normalized event is published to the Event Fabric.

**What the platform records:** A signal event with full provenance — source feed, raw payload reference, timestamp, normalized fields, severity score.

---

## Step 2 — Context

[IMAGE: 03-context-enrichment.png — AI context panel with vessel history, ownership, sanctions exposure, 1440×900, dark mode]

An AI agent subscribed to dark vessel events in this corridor activates. It pulls relevant context:

- The vessel's prior 12 months of AIS history
- The registered beneficial owner and any sanctions exposure
- Comparable dark events in the same corridor over the prior 90 days
- Prior matters in Counsel involving the same counterparty
- Any active charters or contracts involving this vessel

Each piece of context is attached to the event with a source citation. The agent computes a confidence score for its forthcoming recommendation: 0.84.

**What the platform records:** A context enrichment event with citations, retrieval provenance, and the agent's confidence score. All sources are traceable in the Proof Chain.

---

## Step 3 — Recommendation

The agent produces a structured recommendation:

> Escalate to compliance officer for sanctions screening review. Open a Counsel matter for legal chain-of-custody. Notify the charter party operator of potential voyage disruption. Recommended urgency: P1 (action within 60 minutes).

The recommendation surfaces in the Lyte action queue with all attached context: the originating signal, the enriched context, the citations, the confidence score, and the recommended workflow path.

**What the platform records:** A recommendation event with the structured payload, the agent identity, the model version, the input context references, and the timestamp.

---

## Step 4 — Simulation

[IMAGE: 04-decision-simulation.png — Decision Simulation showing two-path probability comparison, 1440×900, dark mode]

Before the recommendation is presented for action, the Decision Simulation engine models two paths:

- **Path A:** Escalate now and open Counsel matter
- **Path B:** Hold for additional AIS confirmation (typically 30–60 minutes)

For each path, the simulation produces probability-weighted outcome ranges for: time-to-resolution, regulatory exposure cost, charter disruption cost, and reputation impact. The operator will see the distributions side-by-side, not a single number.

The simulation result indicates Path A has a tighter outcome distribution and lower expected exposure cost. Path B has a wider distribution with a heavy tail on regulatory exposure if the dark event extends beyond 4 hours.

**What the platform records:** A simulation event with the modeled scenarios, the input parameters, the output distributions, and a reference to the simulation code version.

---

## Step 5 — Policy

[IMAGE: 05-policy-gate.png — Covenant Policy gate showing approval routing for compliance review, 1440×900, dark mode]

Covenant Policy evaluates the recommendation against the organization's approval matrix. This decision type — sanctions-adjacent escalation involving a counterparty — requires compliance officer approval. AI cannot proceed autonomously below this severity classification.

The policy engine identifies the on-call compliance officer, the backup approver, and the escalation timeout. The action is routed to the compliance officer's queue with full context attached.

**What the platform records:** A policy gate event identifying the matched policy rule, the required approver role, the routing decision, and the timeout configuration.

---

## Step 6 — Execution

[IMAGE: 06-execution-workflow.png — Workflow Engine view showing multi-step execution with parallel actors, 1440×900, dark mode]

The compliance officer reviews in Lyte. She sees: the original signal, the enriched context with citations, the AI recommendation with confidence score, the simulation results comparing Path A and Path B, and the policy gate context. She approves Path A.

The Workflow Engine initiates the governed process — multi-step, multi-party, durable:

1. Flag the voyage as under sanctions review in Vessels
2. Open a matter in Counsel for legal chain-of-custody, pre-populated with the AI context and citations
3. Notify the assigned attorney of record
4. Notify the charter party operator with a templated communication
5. Set a 4-hour AIS re-acquisition watchdog with auto-escalation if the dark state persists

Each step is tracked. Each handoff is attributed. If any step fails — for example, the templated notification cannot reach the operator — the workflow checkpoint allows recovery from the last verified step.

**What the platform records:** A workflow execution event for each step, with the actor (human or AI), the step result, and the timestamp. Cross-domain side effects (the Counsel matter creation, the Vessels voyage flag) are linked back to the originating decision via the Outcome Graph.

---

## Step 7 — Proof

[IMAGE: 07-proof-chain-trail.png — Proof Chain reconstruction view of the full decision trail, 1440×900, dark mode]

The Proof Chain now contains a complete, verifiable trail:

```
T+00:00  Signal received        — AIS gap detected, normalized
T+00:01  Context enriched        — agent_v3.2, 14 citations attached
T+00:02  Recommendation made     — confidence 0.84, payload [...]
T+00:03  Simulation run          — Path A vs B distributions [...]
T+00:04  Policy gate evaluated   — compliance officer approval required
T+00:08  Approval recorded       — actor: compliance officer, decision: Path A
T+00:09  Workflow initiated      — 5 steps queued
T+00:10  Voyage flagged          — Vessels
T+00:11  Matter opened           — Counsel, attorney_id [...]
T+00:11  Notification sent       — charter party operator
T+00:12  Watchdog armed          — 4-hour AIS re-acquisition
```

Every entry is append-only. Every entry carries actor attribution. The chain is structurally verifiable.

A regulator, an internal auditor, or a court of inquiry can reconstruct this decision from start to finish. The AI's role is transparent. The human approver is named. The downstream actions are linked.

**What the platform records:** This is what the platform records.

---

## Step 8 — Outcome

[IMAGE: 08-outcome-resolution.png — Outcome panel showing AIS reacquisition and matter closure, 1440×900, dark mode]

The vessel re-establishes AIS signal at T+00:38 — within the watchdog window. The voyage flag is updated. The Counsel matter is updated with the resolution event. The Outcome Graph records:

- **Originating signal:** dark AIS event at corridor X
- **Decision made:** Path A (escalate, open matter)
- **Outcome observed:** AIS re-acquired within window, no regulatory exposure incurred, matter resolved as informational

**What the platform records:** An outcome event linked to the decision and the originating signal. The Outcome Graph now has a complete loop.

---

## Step 9 — Learning

The agent calibration layer reads the Outcome Graph. The recommendation made at T+00:02 was: escalate immediately. The outcome was: vessel re-acquired AIS within watchdog, no exposure incurred.

The agent updates its priors for dark AIS events in this corridor — specifically, the conditional probability of regulatory exposure given different dark-state durations. Future recommendations for similar events in the same corridor will reflect this calibration.

**What the platform records:** A calibration update event linked to the agent identity, the parameter changes, and the outcome reference that triggered the update.

---

## What Just Happened, Structurally

Nine steps. Two AI agent invocations. One human approval. Five downstream actions across three domains (Vessels, Counsel, Lyte). One closed loop in the Outcome Graph. One verifiable Proof Chain entry per significant event.

No silent decisions. No unattributed actions. No AI execution without human gating. No domain siloing — the maritime signal and the legal matter are linked structurally, not by manual forwarding.

This is what every consequential decision should look like in an AI-assisted enterprise environment.

---

## What This Replaces

To make the contrast concrete, here is what this same scenario typically looks like in environments without governed decision infrastructure:

- The dark AIS event surfaces in a maritime tracking dashboard. Someone notices.
- They email compliance.
- Compliance asks legal whether a matter needs to be opened.
- Legal asks the maritime operator for context.
- The maritime operator pulls vessel history from a separate system.
- An ad-hoc decision is made over Slack or in a meeting.
- The vessel re-acquires AIS. The thread fades.
- No record exists of what was decided, by whom, or based on what evidence.
- The next dark event in the same corridor starts the same loop from scratch.

This is the accountability gap, in operational form. SZL Holdings replaces this loop with infrastructure.

---

## Design Partner Program

We are in the design partner phase. We are working with a small number of operators in security, maritime, real estate, legal, and advisory to co-design the platform — in exchange for early access, preferred pricing, and direct input into the roadmap.

If your organization is navigating the accountability gap in any of these domains, the conversation starts here:

**inquiries@szlholdings.com**

---

## Read the Full Series

- [Post 1 — Thursday: The accountability gap is the next enterprise problem](https://szlholdings.substack.com)
- [Post 2 — Sunday: Six primitives, not features](https://szlholdings.substack.com)
- Post 3 — Monday: From signal to proof *(this post)*

---

## Links

- Platform: [szlholdings.com](https://szlholdings.com)
- GitHub: [github.com/stephenlutar2-hash/szl-holdings-platform](https://github.com/stephenlutar2-hash/szl-holdings-platform)
- Trust Center: [szlholdings.com](https://szlholdings.com)
- Medium: [@stephen_38454](https://medium.com/@stephen_38454)
- Substack: [szlholdings.substack.com](https://szlholdings.substack.com)
- LinkedIn: [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240)

---

*The launch series ends here. Implementation conversations begin at inquiries@szlholdings.com.*
