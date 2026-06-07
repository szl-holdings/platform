# Public Architecture Story

**Status**: Phase C deliverable
**Owner**: Stephen Lutar, Founder & CEO
**Pairs with**: `category-site-pass.md`, `buyer-journey-by-persona.md`, `moat-definition.md`, `no-commodity-ai-language.md`

---

## 1. Why this document exists

The public site has to tell an architecture story that is real enough for a Principal Engineer to respect, and clear enough for an Executive buyer to follow. Those two audiences have wildly different vocabularies, attention spans, and tolerance for abstraction. This document is the canonical version of the architecture story — what we say in public, in what order, and why.

It is the source of truth for `/`, `/platform`, `/architecture`, `/docs/*`, and the architecture sections of every domain-pack page.

## 2. The story in one sentence

> SZL Holdings builds the **structural layer between signal detection and action execution** — a governed decision loop that makes every consequential operating decision observable, simulatable, policy-checked, executable, and provable.

## 3. The story in one diagram (the 9-step loop)

> **Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning**

This loop is the category. It is the headline of the site. It runs as a monospace caption beneath the hero. It is the single most important visual element on the public surface.

Each step is a real component, not a marketing label:

| Step | What it is | Where it lives |
|---|---|---|
| **Signal** | Continuous read of operating systems (CRM, GRC, ITSM, comms, AIS, market, threat) | Lyte (signal ingest), Alloy connector mesh |
| **Context** | The operator-relevant state assembled around the signal — who owns it, what it depends on, what it costs if it slips | Lyte (decision objects), Alloy (state fabric) |
| **Recommendation** | Model-assisted reasoning over the contextualised signal — what the system suggests doing | Alloy (reasoning runtime), domain-pack rule sets |
| **Simulation** | Pre-execution modelling of the recommended action's likely effect, blast radius, and policy interactions | Alloy (simulation layer) |
| **Policy** | The covenant policy layer that gates which actions are permitted, by whom, under what conditions | Alloy (covenant policy engine) |
| **Execution** | The governed action — taken automatically or routed to a human approver, depending on policy | Alloy (workflow engine), CORTEX (mobile approval surface) |
| **Proof** | The immutable, attributed record of what happened, what was recommended, who decided, and why | Alloy (Proof Chain) |
| **Outcome** | The observed real-world result, measured against the recommendation and the policy | Lyte (outcome telemetry) |
| **Learning** | The structured improvement loop — what we now know about this class of decision, fed back into recommendation and policy | Forge (model and policy update pipeline) |

## 4. The three-tier platform

The site introduces the platform in three tiers, and only three. More than three creates "platform sprawl"; fewer than three under-represents what is actually built.

### 4.1 Lyte — Flagship Command Surface
The operator-facing layer. Lyte is what the executive buyer, the operator, and the analyst look at every day. It surfaces what is stuck, at risk, or about to break, in the operator's own vocabulary. Lyte renders the loop; it does not run it.

### 4.2 Alloy — Governance Execution Fabric
The infrastructure layer. Alloy is the engine of the loop. It runs signal ingest, contextualisation, recommendation, simulation, policy enforcement, action routing, Proof Chain capture, and outcome telemetry. Alloy is what makes the same governed decision loop available to every domain pack.

### 4.3 CORTEX — Mobile Command
The away-from-desk surface. CORTEX is how the human approver participates in the loop when the policy layer routes a decision to them and they are not in front of Lyte. Mobile is not a feature of Lyte; it is a peer surface to it, with its own governance posture (biometric auth, on-device policy cache, audited offline approvals).

## 5. The six domain packs

Domain packs sit on top of Alloy. Each pack is a vertical configuration of the loop — domain-specific signals, domain-specific decision objects, domain-specific policy templates, domain-specific recommendation patterns. The pack does not re-implement the loop. It teaches the loop the vocabulary of one industry.

| Pack | Domain | Status |
|---|---|---|
| **Aegis** | Defense and security operations | Beta |
| **Vessels** | Maritime intelligence and fleet command | Beta |
| **Terra** | Real estate intelligence and underwriting | Beta |
| **PRISM Counsel** | Legal operations and matter intelligence | Beta |
| **Carlota Jo** | Private advisory and wealth operations | Beta |
| **IMPERIUM** | Sovereign and intelligence-grade operations | Roadmap |

The story we tell publicly: *six packs is the demonstration that the loop is general. It is not a promise of breadth.* New packs are built only when there is a named design-partner workflow that demands one.

## 6. The three primitives that have to be true

These are the three architectural commitments that the technical evaluator and the security reviewer probe hardest. They are also the three things our competitors cannot simply ship.

### 6.1 Outcome Graph
A continuously updated, signal-and-state fabric that holds the *operating reality* of the customer — not a snapshot, not a dashboard query result, but a living graph of decisions, owners, dependencies, and outcomes. Recommendation and simulation read against this graph; Proof writes back to it.

### 6.2 Proof Chain
An append-only, attributed record of every consequential decision: the signal that triggered it, the context it was decided in, the recommendation, the simulation result, the policy gate, the human approver (if any), the executed action, and the observed outcome. Proof Chain is what makes the loop *defensible* and what makes audit a query, not a project.

### 6.3 Covenant Policy
The policy layer that gates execution. Policies are versioned, attributed, simulated against historical decisions before they go live, and *enforced at the action gate through cryptographic capability tokens*. Bypass is not architecturally impossible — bypass requires an explicit, attributed override that itself enters Proof Chain. The honest claim is "no untracked overrides," not "no overrides."

## 7. Truth-pass language

The architecture page and docs adhere to the following discipline:

- **We do not say "non-bypassable" or "architecturally impossible."** We say *"enforced at [layer] through [mechanism]; bypass requires explicit, attributed override record."*
- **We do not call ourselves an "AI platform."** We are *governed decision infrastructure.* Models are an input to recommendation and learning — they are not the category.
- **We do not claim production maturity for Beta packs.** Domain packs are listed with their stage visible.
- **We do not show fabricated logos or invented case studies.** We show design-partner sectors, with names where consent has been given and sector-only where not.

## 8. How the architecture story scales by audience

### 8.1 For the executive buyer
Three sentences:
> *We sit between the systems where your operating signal lives and the actions your team takes on it. We make sure the right action is recommended, the right policy is enforced, and the record of what happened is real. The result is fewer surprises, faster decisions, and an audit trail your CFO and your CISO will both accept.*

### 8.2 For the technical evaluator
Three components:
> *Outcome Graph (signal-and-state fabric), Proof Chain (attributed decision record), Covenant Policy (action-gate enforcement). Reasoning runtime sits above. Connector mesh sits below. Mobile is a peer surface. Domain packs are vertical configurations, not vertical re-implementations.*

### 8.3 For the security reviewer
Three guarantees:
> *Every consequential decision is attributable. Every executed action passes a versioned, simulated policy gate. Every override is recorded with the same attribution as the action it overrides. The system is auditable as a query, not as a project.*

## 9. What this document does not cover

- **Pricing and packaging architecture** — see `packaging-model.md`, `founder-pricing-notes.md`, `pilot-vs-production-commercial-model.md`.
- **Internal operator surfaces** (Forge, Alloy admin, command center) — these are not part of the public architecture story.
- **Specific integration list** — lives on `/api` and `/docs`.
- **Roadmap detail** — lives on `/roadmap`.
- **Compliance certification status** — lives on `/trust/security`. The architecture story makes the *posture* claim; the trust center makes the *certification* claim.

## 10. Maintenance

This document is the source of truth. If the site says something about architecture that contradicts this document, the site is wrong. If a new architectural commitment is true and shipping, this document gets updated *first*; the public site updates only after.
