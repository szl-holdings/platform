# The SZL Doctrine
**Version:** 1.0 — April 18, 2026  
**Word count:** ~1,900  
**Audience:** Engineering, design, product, sales, investors — anyone building on or presenting the SZL platform

---

## What This Document Is

Every platform eventually develops a voice, a set of convictions, and a set of lines it will not cross. This document makes SZL's explicit. It is not a style guide. It is not a marketing brief. It is the operating doctrine — the "why we do it this way" that should inform every line of code, every demo, every sales conversation, and every design decision.

---

## The Four Pillars

### 1. Governed Autonomy

AI in enterprise operations has a trust problem. Not because AI is wrong — it often isn't — but because no one knows how to audit what it decided, who approved it, or what happened as a result. "AI-assisted" has become synonymous with "AI-responsible," which means no one is responsible.

SZL's answer is governed autonomy: AI agents that can observe, analyze, recommend, and simulate, but cannot execute consequential actions without a human decision point in the chain. This is enforced architecturally via the Covenant Policy — not as a configuration option, but as a structural constraint baked into the action-engine.

The governance loop is nine steps: **Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome.** Every consequential action must traverse this loop. The Proof Chain is the immutable record that it did.

This is not about slowing AI down. It is about making AI trustworthy enough to actually use in high-stakes operational contexts — fleet management, security incident response, real estate underwriting, fund governance.

**Voice rule:** Never describe the platform as "AI-powered." Describe it as "governed." AI is the engine; governance is the product.

### 2. Evidence-First

Recommendations without evidence are opinions. Dashboards without attribution are theater. SZL's position is that every AI output must carry its source: what signals drove it, what data it retrieved, what model produced it, and how confident the system is.

This is implemented structurally: Pulse briefings include confidence levels per judgment, retrieval provenance citations, and explicit gaps/assumptions. Recommendations in the Decision Theater link back to the raw signals that triggered them. The Outcome Graph tracks whether a recommendation led to a measurable result.

Evidence-first is also an anti-pattern detector. If a screen shows a metric but you cannot click through to its source, the metric is theater. This is the "no mock theater" principle.

**Voice rule:** Every number on a public-facing surface must have a traceable source or a visible "Demo" label. No exceptions.

### 3. Policy-Aware Actions

Actions in a governed system are not API calls. They are named, typed operations that carry: an actor (human, agent, system, external), a policy context (which rules applied), a decision (approved, denied, deferred), and a timestamp. This is the difference between an action log and a proof record.

SZL's action-engine models actions as first-class entities, not side effects. This is inspired by — but architecturally distinct from — Palantir Foundry's Action Types model. Unlike Palantir, SZL's action types are defined in TypeScript and run on standard infrastructure, not a proprietary ontology platform.

Policy-awareness also means the system knows what it cannot do. The policy-engine evaluates every proposed action against the current Covenant Policy before execution. A denied action is recorded just as carefully as an approved one — because what was blocked is as important as what was executed.

**Voice rule:** "Execution fabric" is accurate. "Automation" is not — automation implies no human in the loop. SZL's execution requires human confirmation for consequential actions.

### 4. Operational Ontology

Every domain (maritime, real estate, security, advisory, fund operations) has entities, relationships, and states that are native to that domain. A Fleet contains Vessels. A Voyage has a P&L. A Property is in a Distress State. A Recommendation is linked to a Signal.

SZL's `packages/ontology` defines these entities and their relationships in a TypeScript-native schema. This is the "operational ontology" — not a graph database product, not a proprietary semantic layer, but a shared type system that makes cross-domain intelligence coherent.

When the maritime agent (Helmsman) and the security agent (Sentinel) both reference the same entity schema, their outputs can be composed into a unified briefing (Pulse) without translation. The ontology is the interoperability layer.

**Voice rule:** "Domain pack" is the right term for each vertical product (Vessels, Terra, Aegis, Carlota Jo). Domain packs are not separate products — they are structured applications of the same governance loop to a new entity space.

---

## The "No Mock Theater" Principle

Mock theater is the practice of presenting simulated data, fake metrics, or placeholder UI as if it were real. It is endemic in enterprise SaaS demos. It is the single biggest credibility risk in a pre-commercial platform.

SZL's doctrine is explicit: **every screen that shows demo or seed data must carry a visible label.** This is not optional and it is not a design detail — it is a trust principle. Investors who discover a metric was hardcoded lose trust in every metric. Prospects who see a blank map because the API key is missing lose confidence in the product.

The corollary: every claim made on a public surface must either be verified against live data or labeled as a projection/demo. The public claims registry (`docs/audit/2026-04/public-claims-registry.md`) is the enforcement mechanism.

"No mock theater" is also a product differentiator. SZL's trust story — governed decisions, immutable proof, full attribution — only holds if the platform itself is honest about what is real. A platform that preaches accountability while presenting fabricated KPIs is incoherent.

---

## Voice and Tone Rules

### What SZL sounds like

- **Precise and direct.** Specific claims backed by specific evidence. No vague superlatives.
- **Operationally grounded.** Uses the language of operators — signals, exceptions, approvals, outcomes — not the language of AI marketing — "revolutionary," "cutting-edge," "transformative."
- **Honest about state.** A feature in beta is labeled beta. A metric derived from seed data says so. The platform earns trust by being more transparent than anyone expects.
- **Confident without bluster.** SZL's governance model is genuinely novel. State this clearly: "This is how we enforce accountability. This is why it matters. This is what it looks like in code." No need to oversell.

### What SZL does not sound like

- **Generic AI marketing:** "Harness the power of AI to transform your operations." This is not SZL's voice.
- **Passive-voice accountability dodges:** "Decisions are made" rather than "the decision was made by [actor] at [timestamp] based on [signal]."
- **Aspirational metrics as current facts:** Do not present a market size projection as an operational metric. Do not present a seed data value as a live measurement.
- **Feature inflation:** A module that exists in the route tree but has no database backing is not a feature — it is a stub. Label it or hide it.

---

## Visual and Language Signatures

These are the recurring patterns that make SZL recognizable across all surfaces:

**The nine-step loop.** Every product explanation begins or ends with the governance loop: Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome. This is SZL's canonical "what we do" expressed as a process, not a tagline.

**The proof receipt.** Every consequential action produces a structured proof receipt: actor, timestamp, policy decision, outcome linkage. This is always displayed in a consistent visual format — monospace font, neutral background, subtle border. Never hidden; always accessible.

**The demo badge.** A consistent visual indicator (amber/yellow, upper right of data module) applied to any view showing seed or simulated data. The badge links to a one-liner explaining what is real and what is not. This is not an embarrassment — it is evidence of integrity.

**The confidence score.** AI recommendations include a numerical confidence level (0–100) and a one-line explanation of what drives uncertainty. This appears in Pulse briefings, Decision Theater recommendations, and any agent output surface.

**The "no anonymous entries" rule.** Every audit event has an actor. The actor type (human / agent / system / external) is always shown. "The AI recommended" is never sufficient — "Helmsman (v2.1) recommended, based on AIS exception EX-4421, with 78% confidence" is the standard.

---

## Anti-Patterns (What SZL Is Not)

| Anti-pattern | What SZL does instead |
|---|---|
| AI chatbot with no governance | Covenant Policy enforces approval gates before execution |
| Dashboard with no data lineage | Every metric links to its source signal or carries a demo label |
| "Powered by AI" as a feature | Governance of AI as the feature |
| Separate demo codebase that drifts | `RUNTIME_MODE=demo` on the same production code path |
| Retrospective audit logs | Pre-execution policy evaluation + audit as a byproduct |
| Hardcoded uptime claims | Uptime derived from real monitoring or removed |
| Generic "enterprise AI platform" positioning | Domain-specific governance loops with named entities and policies |

---

## Sources

This doctrine is grounded in public research synthesized in `docs/doctrine/inspiration-research.md`. Key influences:

1. **LangSmith / Langfuse** — trace hierarchy and structured observability for AI systems
2. **OpenFeature** — evaluation context and hook model for feature flags
3. **OpenTelemetry GenAI semantic conventions** — standardized attribute naming for AI telemetry
4. **Palantir Foundry Ontology / AIP** — action types as first-class governance constructs (rejected: proprietary infrastructure)
5. **Datadog SLOs** — error budget and SLO as forcing functions for reliability claims (extended to Governance SLOs)
6. **Enterprise SaaS demo engineering best practices** — one-click reset, consistent demo labeling, same codebase for demo and production

All borrowed patterns are at the architectural/conceptual level. No proprietary code, prompts, or designs were copied.

---

*This document is the governing point of view for the SZL platform. It should be read by every new contributor and revisited after each major platform phase. Last updated: April 18, 2026.*
