# Moat Definition — SZL Holdings

**Phase:** A · **Audience:** Founder, investors, GTM, recruiting · **Last reviewed:** 2026-04-16

---

## The One-Sentence Moat

**SZL Holdings is the governed execution layer for enterprise intelligence — the only platform where every consequential decision carries a signal source, a simulated outcome range, a policy gate, an attributed approval, an immutable proof, and a closed-loop result, and where that contract is shared by every domain pack, every product surface, and every AI agent in the ecosystem.**

Everything below is the proof of why that sentence is defensible.

---

## What the Moat Is Not

It is not:
- A model — we do not train foundation models, and our defensibility does not depend on one
- A connector library — connectors are commodity; the value is what happens after the signal arrives
- A UI framework — the design system is excellent, but UIs are copyable
- A vertical app — Aegis, Vessels, Terra are domain packs, not the moat itself
- A compliance certification — SOC 2 is a precondition for sale, not a competitive advantage

The moat is **structural** — it lives in the architecture of how decisions are made, not in any single feature.

---

## The Six Moat Pillars

### Pillar 1 — Governed Execution

Every consequential action in the platform passes through the same nine-step loop:

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

This is enforced at the library layer (`@szl-holdings/policy-engine`, `@szl-holdings/action-engine`, `@szl-holdings/decision-engine`), not in the UI. A new domain pack inherits the loop on day one. A competitor would have to rebuild the loop, retrofit it across every product surface, and convince customers their retrofit is non-bypassable.

**Why it is hard to replicate:** Governance retrofitted onto an existing copilot or workflow tool is always optional. Governance designed into the execution layer of a platform is structural — bypass requires explicit, attributed override.

---

### Pillar 2 — Evidence-Backed Actions

Every AI recommendation carries:
- Model identity and version
- Source citations with retrieval provenance
- Confidence score calibrated against historical Outcome Graph results
- Source classification (`llm_generated`, `human_authored`, `system_computed`, `external_ingested`, `hybrid`)
- Export safety status (`safe`, `restricted`, `pending_review`, `blocked`)

The `assertExportSafe()` guard in `@szl-holdings/proof-chain` blocks any AI output not cleared by human review from reaching client-facing surfaces.

**Why it is hard to replicate:** Most copilots produce prose. SZL produces typed, schema-validated decision objects with sourced evidence. The schema is enforced at the API boundary — a competitor cannot retrofit it without rewriting their decision surface.

---

### Pillar 3 — Attributable Automation

Every action carries an actor, a role, a timestamp, and an evidence chain. Manual, semi-autonomous, and fully autonomous execution modes all generate the same audit record. There is no "system did it" event.

If an autonomous workflow took an action, the record names the operator who pre-approved the autonomous mode, the policy that allowed it, and the simulation that justified it.

**Why it is hard to replicate:** Workflow tools record events. SZL records decisions. The difference is who is accountable when something goes wrong — and only one of those answers a regulator's question.

---

### Pillar 4 — Operator-First Design

Every command surface (Lyte, CORTEX, Aegis Command, Vessels Command, Terra Command) is built around a single operator job: get from signal to confident action without leaving the surface. PRISM (Pulse, Risk, Intelligence, Signals, Motion) is the analytical model that organizes that job.

Operators see:
- The signal and why it matters in plain language
- The recommendation and the evidence behind it
- The simulated outcome range
- The policy state (allowed / requires approval / blocked)
- The action button and the audit trail it will produce

**Why it is hard to replicate:** Most enterprise tools are built for analysts (BI), administrators (workflow), or executives (dashboards). SZL is built for the person who is going to push the button. That changes every design decision in the product.

---

### Pillar 5 — Trust Built Into Workflow

Trust is not a tab. It is the fabric of how work happens.

- Proof Chain runs on every recommendation
- Covenant Policy gates every consequential action
- Outcome Graph closes the loop on every decision
- Trust surfaces (`/aegis/trust-provenance`, `/vessels/trust-provenance`, `/terra/trust-provenance`) are operator pages, not compliance pages — they are used during the day, not just before an audit

**Why it is hard to replicate:** Compliance vendors sell the binder. SZL sells the operating system. A buyer who sees the trust surface inside the product they already use does not need a separate trust vendor.

---

### Pillar 6 — Domain Pack Extensibility on Shared Infrastructure

Every domain pack — Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM — is built on the same six platform primitives:

| Primitive | Library |
|-----------|---------|
| Outcome Graph | `@szl-holdings/outcome-graph` |
| Proof Chain | `@szl-holdings/proof-chain` |
| Covenant Policy | `@szl-holdings/policy-engine` |
| Decision Engine | `@szl-holdings/decision-engine` |
| Workflow / Action Engine | `@szl-holdings/action-engine` |
| Event Fabric | `@szl-holdings/event-fabric` |

A new domain pack ships with governance, attribution, simulation, and proof on day one. No new infrastructure investment. No "we'll add governance in v2."

**Why it is hard to replicate:** A vertical SaaS company expanding into a second vertical rebuilds half its stack. A horizontal platform expanding into a vertical loses domain depth. SZL has both — six fully-built domain packs on one shared, governed substrate.

---

## Differentiation Against Five Competitor Categories

| Category | Example Vendors | Where They Stop | Where SZL Continues |
|----------|----------------|-----------------|---------------------|
| Generic AI copilots | ChatGPT Enterprise, Microsoft Copilot, Glean | Recommendation volume, no governance, no audit, no closed loop | Schema-validated decisions + Covenant Policy + Proof Chain + Outcome Graph |
| Observability tools | Datadog, New Relic, Splunk, Grafana | "What happened" — pretty dashboards, alert fatigue | "What to do, who is accountable, what was the outcome" |
| Workflow tools | ServiceNow, Zapier, n8n, Asana | Sequence automation, no decision intelligence, no simulation, no proof | Decision Engine + Monte Carlo simulation + Covenant Policy gates + immutable audit |
| Trust / compliance vendors | Vanta, Drata, OneTrust | Binder for the auditor, separate from product | Trust surfaces inside the product the operator already uses, every day |
| Vertical / portfolio roll-ups | Specialty SIEM, maritime ops, real estate analytics | Single domain, no shared governance, no platform leverage | Six domain packs on one governance substrate, cross-domain Event Fabric |

Each competitor solves part of the loop. None solve the loop.

---

## Why This Is a One-of-One Position

A competitor would need all of the following, simultaneously, to displace SZL:

1. A schema-validated decision object model enforced at the API boundary
2. A governance library set (policy + proof + outcome) usable by any product surface
3. Six fully-built domain packs riding the same governance substrate
4. A unified mobile command surface (CORTEX) reflecting the same loop on the device
5. Operator-first command surfaces, not analyst dashboards
6. A founder-led narrative that connects all six pillars without commodity AI language

Vendors who have one of these do not have the others. Vendors who have a few of these do not have the others ridden by real domain packs with real data models. Vendors who have most of these do not have a coherent narrative — they sell features, not infrastructure.

The window to establish this position closes when one of the hyperscalers or one of the well-funded copilot vendors decides governance is the wedge. The architectural lead time is real. The narrative lead time is the harder one.

---

## What Strengthens the Moat Over Time

- **Outcome Graph data** — the longer the platform runs in customer environments, the better the calibration of simulation, recommendation confidence, and policy thresholds. This is a compounding data asset that competitors cannot synthesize.
- **Domain pack catalogue** — every new domain pack ships with governance for free; competitors pay full infrastructure cost per vertical
- **Trust surface adoption** — the more operators use trust surfaces day-to-day, the harder it is to displace with a separate compliance binder
- **Founder-led narrative** — Stephen owns the category language; commodity AI vendors cannot speak the language because they cannot ship the architecture

---

*Source-of-truth files: `PLATFORM_PRIMITIVES.md`, `CATEGORY_POSITIONING.md`, `MOAT_MAP.md`, `INVESTOR_NARRATIVE.md`. This document is the canonical short-form moat statement; the others are the full evidence packs.*
