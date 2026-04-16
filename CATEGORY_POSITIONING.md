# Category Positioning — SZL Holdings

**Version:** 2.0 · **Last updated:** April 2026

---

## The Category SZL Creates

**Governed Decision Infrastructure.**

A new class of enterprise software — the structural layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential decision.

Not a dashboard. Not an AI copilot. Not a workflow tool.

The governed decision infrastructure that ensures every consequential decision has a signal source, cross-domain context, a simulation result, a policy gate, an immutable audit trail, and a recorded outcome. Nine steps, one canonical loop, every domain.

---

## What This Platform Is

SZL Holdings builds governed decision infrastructure. It ingests signals from across an organization's operational surface — security events, fleet telemetry, property data, legal filings, financial metrics — and routes them through a structured decision pipeline:

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

Every step in this pipeline is instrumented. Every decision is attributed to an actor. Every AI recommendation carries source citations and confidence scores. Every consequential action requires human confirmation before execution.

The platform is organized in a clear hierarchy:

| Layer | Product | Role |
|-------|---------|------|
| **Platform** | SZL Holdings | The governed decision layer — shared governance infrastructure |
| **Flagship command** | Lyte | The operator command surface — PRISM framework, signal-to-action |
| **Execution fabric** | Alloy | The governance backbone — workflow orchestration, approval gates, audit trail |
| **Mobile command** | CORTEX | Unified mobile command — all domains, one app |
| **Domain packs** | Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM | Domain-specific intelligence on shared governance infrastructure |

---

## What This Platform Is Not

| It is not... | Because... |
|-------------|-----------|
| A dashboard | Dashboards show what happened. This platform shows what to do next, who is responsible, and whether it is safe to execute. |
| An AI copilot | Copilots generate recommendations without accountability. This platform enforces governance on every AI output — approval gates, proof chains, and outcome tracking. |
| A workflow tool | Workflow tools automate sequences. This platform adds policy enforcement, simulation-based risk assessment, and immutable attribution to every workflow step. |
| A SIEM / SOC platform | Aegis provides security intelligence, but as a domain pack on a shared governed infrastructure — not a standalone point solution. |
| An analytics platform | Analytics tools visualize historical data. This platform connects real-time signals to forward-looking decisions with consequence modeling. |

---

## Why Dashboards Are Insufficient

Dashboards solve the *visibility* problem. They do not solve the *accountability* problem.

In most organizations today:
- Signals arrive in siloed tools with no cross-domain correlation
- AI recommendations are generated without governance or attribution
- Decisions are made informally — in Slack threads, email chains, and hallway conversations
- There is no audit trail connecting a signal to the decision it triggered to the outcome it produced
- When something goes wrong, no one can reconstruct the decision chain

The accountability gap grows as AI adoption increases. More recommendations, more automation, more decisions running in parallel — with no structured way to track who approved what, based on what evidence, with what expected outcome.

---

## Why AI Copilots Are Insufficient

AI copilots add recommendation volume without adding governance.

| Copilot Pattern | Governed Decision Pattern |
|----------------|--------------------------|
| "Here's what I recommend" | "Here's what I recommend, based on these sources, with this confidence score" |
| Executes on user's behalf | Requires explicit approval before consequential action |
| No audit trail | Immutable proof chain with actor attribution |
| No outcome tracking | Closed-loop feedback: recommendation → decision → outcome |
| Single-domain | Cross-domain signal correlation via Event Fabric |

The difference is structural, not cosmetic. Governance is enforced at the platform layer (Alloy), not bolted on as an afterthought.

---

## The Six Platform Primitives

What makes this platform structurally different from dashboards, copilots, and workflow tools:

| Primitive | What It Does | Why It Matters |
|-----------|-------------|----------------|
| **Outcome Graph** | Tracks the full lifecycle of a recommendation: agent → decision → outcome | Enables closed-loop learning. The platform gets smarter because it knows which recommendations led to which results. |
| **Proof Chain** | Generates an immutable, verifiable audit trail for every significant action | Compliance teams and regulators can reconstruct any decision chain. AI outputs carry provenance metadata. |
| **Covenant Policy** | Defines what agents and users can do, under what conditions, with what approval requirements | Human-in-the-loop is not a UI pattern — it is an enforced policy gate that AI cannot bypass. |
| **Decision Simulation** | Runs probabilistic simulations to model risk and uncertainty before action | Operators see not just "what should we do" but "what could happen if we do it" — with confidence intervals. |
| **Workflow Engine** | Orchestrates multi-step processes with durable state, agent coordination, and event-driven triggers | Complex operational decisions are broken into trackable steps, not executed as opaque one-shots. |
| **Event Fabric** | Cross-domain signal backbone — normalizes, routes, and correlates events across all domain packs | Cross-domain intelligence is possible only because signals from maritime, security, legal, and real estate share a common event layer. |

See [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) for the full technical specification.

---

## The Domain-Pack Extensibility Model

Domain packs extend the platform's governance infrastructure into specific operational domains. They are not separate products — they are governed extensions of the same shared layer.

A domain pack contributes:
1. **Signal sources** — domain-specific data feeds (AIS telemetry, STIX/TAXII, court records, property records)
2. **Analysis models** — domain-specific AI agents and scoring engines (Helmsman, Sentinel, etc.)
3. **Action vocabulary** — domain-specific actions (sanction a vessel, escalate a threat, approve a deal)
4. **UI surface** — domain-specific screens built on the shared design system

A domain pack inherits from the platform:
- All six primitives (Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric)
- Shared RBAC and tenant isolation
- Alloy execution fabric (approval gates, audit trail)
- CORTEX mobile command layer
- API server and shared database

This means a new domain pack can be stood up without rebuilding governance. The infrastructure is already there.

---

## Competitive Positioning

| Dimension | SZL Holdings | Dashboards (Datadog, Grafana) | AI Copilots (ChatGPT, Copilot) | Workflow Tools (n8n, Zapier) |
|-----------|-------------|-------------------------------|-------------------------------|------------------------------|
| Signal → action pipeline | Full (signal to outcome) | Signal to visualization | Prompt to response | Trigger to action |
| Decision attribution | Actor, signal, confidence, outcome | None | None | Trigger source only |
| Human-in-the-loop | Enforced at policy layer | Not applicable | Optional / absent | Optional |
| Audit trail | Immutable proof chain | Log retention | None | Execution logs |
| AI governance | Policy-gated, advisory-only | Not applicable | None | None |
| Outcome tracking | Closed-loop (recommendation → decision → outcome) | None | None | None |
| Cross-domain intelligence | 6 domain packs on shared governance infrastructure (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM) | Per-domain | Single conversation | Per-workflow |
| Simulation | Monte Carlo with sensitivity analysis | None | None | None |

---

## The Buyer

**Primary:** Mid-market and enterprise operators in regulated, high-stakes industries — security, maritime, real estate, legal, professional services.

**Persona:** The operator who is accountable for decisions but lacks a structured system to make, track, and justify those decisions. They need more than visibility. They need a decision surface with governance.

**Entry motion:** Design partner program. 3–6 partners per domain who co-design the product in exchange for early access and preferred pricing.

---

## One-Sentence Positioning

> SZL Holdings builds governed decision infrastructure — the structural layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential decision.

---

## Related Documents

| Document | Path |
|----------|------|
| Market positioning | [MARKET_POSITIONING.md](MARKET_POSITIONING.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| System overview | [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) |
| Proof and policy model | [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) |
| Decision simulation | [DECISION_SIMULATION.md](DECISION_SIMULATION.md) |
| Brand guidelines | [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) |
