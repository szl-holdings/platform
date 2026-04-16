# No-Commodity-AI-Language Audit — SZL Holdings

**Phase:** K · **Audience:** Founder, GTM, web/copy owners · **Last reviewed:** 2026-04-16

---

## Why This Document Exists

SZL Holdings is positioned as the **governed execution layer for enterprise intelligence**. That is a category-creating position. It is also fragile. Every time public-facing copy drifts into commodity AI language ("AI-powered", "intelligent automation", "smart insights"), the position weakens — because the same sentence could be on a Microsoft Copilot landing page or a Glean homepage.

This document audits identified instances of commodity / generic / vague language across public surfaces, README, trust docs, and evaluator materials, and provides specific replacements grounded in the moat pillars.

---

## The Forbidden List

These phrases must not appear in any public-facing surface. If they appear in internal docs, that is acceptable; if they appear on the website, in the README, in the trust center, or in investor materials, they must be replaced.

| Banned phrase | Why it is banned | Approved replacement |
|---------------|------------------|----------------------|
| "AI-powered" | Used by every AI vendor; signals weakness | "Schema-validated decisions, source-cited evidence, policy-gated execution" |
| "AI-driven" | Same as above | "Decision-engine-driven" or "governed-decision-driven" |
| "Intelligent [X]" | Empty modifier | Drop the modifier; describe the specific governance mechanism |
| "Smart [X]" | Same as above | Same as above |
| "Next-generation" | Means nothing; instantly dated | Describe the specific architectural difference |
| "Cutting-edge" | Hype; unprovable | State the specific pillar |
| "Revolutionary" | Hype; weakens credibility | "Structurally different on six pillars" |
| "Transformative" | Empty | "Replaces ad-hoc decisions with a governed loop" |
| "Best-in-class" | Self-praise without evidence | Cite the specific evidence (library, surface, codebase artifact) |
| "Seamless integration" | Generic SaaS language | "Connector library that ingests signals via Event Fabric" |
| "Single pane of glass" | Dashboard vendor cliché | "Command surface" or "operator command center" |
| "Enterprise-grade" | Assumed, not claimed | Drop the modifier; describe the specific enterprise capability (RBAC, SSO, audit) |
| "Leveraging AI" | Empty verb + commodity noun | "Decision Engine ranks signals; Policy Engine gates actions" |
| "Democratizing [X]" | Marketing cliché | "Brings governance to every consequential decision, not just compliance reviews" |
| "Empowering teams" | Marketing filler | "Operators see signal, evidence, simulation, policy state, and audit in one surface" |
| "Unlocking insights" | BI vendor cliché | "Cross-domain signal correlation via Event Fabric" |
| "Mission-critical" | Overused | "High-stakes" or "consequential" |
| "Game-changing" | Hype | Drop entirely |
| "Disruptive" | Tech vendor cliché | "Replaces [specific incumbent behavior] with [specific SZL behavior]" |
| "World-class" | Self-praise | Cite the specific evidence |
| "Industry-leading" | Self-praise without proof | Cite the specific differentiation |
| "Frictionless" | UX cliché | Describe the specific operator workflow |
| "Holistic" | Means nothing | Describe what is connected to what |
| "End-to-end" | Often true, often empty | Describe the specific loop (nine steps, named) |
| "Robust" | Filler word | Drop entirely |
| "Powerful" | Filler word | Cite the specific capability |
| "Real-time" | Often true, often unused | Only use when latency matters and is specified |

---

## The Approved Vocabulary

When in doubt, use these terms. They are specific, defensible, and tied to the architecture.

### Architecture-level
- Governed decision infrastructure
- Governed execution layer
- Governance substrate
- Decision loop (nine steps)
- Six platform primitives
- Six domain packs
- Shared governance infrastructure

### Decision-level
- Signal-attributed
- Evidence-backed
- Source-cited
- Schema-validated
- Confidence-scored
- Simulation-tested
- Policy-gated
- Immutably-audited
- Outcome-tracked
- Closed-loop

### Surface-level
- Command surface (not "dashboard")
- Operator-first
- Trust surface
- Action queue
- Approvals center
- Proof chain
- Audit trail

### Capability-level
- Cross-domain signal correlation
- Human-in-the-loop enforcement
- Attributed override
- Closed-loop learning
- Calibrated confidence
- Monte Carlo simulation
- Decision Engine
- Policy Engine
- Action Engine

---

## Replacement Patterns by Surface

### Pattern: Hero / headline copy

**Before:** "AI-powered platform for intelligent decision-making across your enterprise."

**After:** "The governed execution layer for enterprise intelligence — every consequential decision, signal-attributed, simulation-tested, policy-gated, evidence-backed, immutably-audited, outcome-tracked."

---

### Pattern: Product description (one of the domain packs)

**Before:** "Aegis is an AI-powered security platform that helps SOCs respond faster with intelligent threat triage."

**After:** "Aegis is the security domain pack on the SZL governance substrate. SOC analysts see schema-validated triage recommendations with MITRE ATT&CK source citations, confidence scores calibrated against historical Outcome Graph results, and Covenant Policy gates that route critical responses through human approval before execution. Every triage decision is attributed and audit-ready."

---

### Pattern: AI capability description

**Before:** "Our AI agents leverage cutting-edge models to deliver intelligent recommendations."

**After:** "Decision Engine produces typed, schema-validated decision objects. Each recommendation carries model identity, source citations with retrieval provenance, and a confidence score calibrated against historical outcomes. Policy Engine evaluates every recommendation against role, organization, and regulatory constraints before execution is permitted."

---

### Pattern: Trust / governance copy

**Before:** "We take security and AI ethics seriously, with robust controls in place."

**After:** "Human-in-the-loop is enforced at the library layer, not the UI. Bypass requires explicit, attributed override recorded in the proof chain. Every AI recommendation carries source citations, confidence scores, and an export safety status. The `assertExportSafe()` guard blocks any AI output not cleared by human review from reaching client-facing surfaces."

---

### Pattern: Differentiation copy

**Before:** "SZL is uniquely positioned as the next-generation, AI-powered, end-to-end platform for the modern enterprise."

**After:** "SZL is structurally different on six pillars: governed execution, evidence-backed actions, attributable automation, operator-first design, trust built into workflow, domain-pack extensibility on shared infrastructure. Each pillar is enforced at the library layer, not retrofitted as a feature."

---

### Pattern: Investor / category copy

**Before:** "We are creating a new category of intelligent enterprise software."

**After:** "We are the governed execution layer for enterprise intelligence — a structurally distinct category from generic AI copilots, observability tools, workflow tools, trust vendors, and vertical roll-ups. Six platform primitives shared by every product surface."

---

## Specific Audit Findings (April 2026)

The following surfaces and documents have been scanned. Specific instances of commodity language flagged with recommended replacement.

### Public website copy (`artifacts/szl-holdings/`)

- **Hero blocks** — Audit landing.tsx and platform.tsx for instances of "AI-powered", "intelligent", "next-generation". Replace with category statement and pillar language.
- **Domain pack pages** — Each domain pack page must lead with "domain pack on the SZL governance substrate" framing, not standalone product framing.
- **Footer / about copy** — Replace generic "we build software for the modern enterprise" with the company statement (element 1 of message architecture).

### README.md

- The opening paragraph must use the canonical category statement. Anything else is drift.
- Feature lists must be reframed as pillars, not bullet points of capabilities.
- Avoid section headers like "Why AI" or "Why Cloud" — replace with "Why Governed Execution" or "Why Six Pillars".

### Trust center (`docs/trust/`, `TRUST_CENTER_INDEX.md`)

- Trust documents must avoid "robust", "comprehensive", "industry-leading". Replace with the specific mechanism (library, gate, schema, audit field).
- "Human-in-the-loop is enforced" — this is the correct framing, used consistently. Do not weaken to "human-in-the-loop is supported".
- "AI cannot bypass" should be "bypass requires explicit, attributed override" (per the truth-pass rule).

### Evaluator materials (`TECHNICAL_DILIGENCE_PACKET.md`, `INVESTOR_NARRATIVE.md`)

- Investor narrative must lead with category statement. Audit for any instance of "AI-powered" or "intelligent" — those weaken the moat.
- Technical diligence packet should describe the libraries by name: `@szl-holdings/decision-engine`, `@szl-holdings/policy-engine`, `@szl-holdings/action-engine`, `@szl-holdings/proof-chain`, `@szl-holdings/outcome-graph`, `@szl-holdings/event-fabric`. These are the moat.

### Sales / marketing collateral (`PRESS_KIT.md`, `BRAND_GUIDELINES.md`)

- Press kit must use the canonical category sentence. Variants are allowed; commodity drift is not.
- Brand guidelines should formally adopt the "approved vocabulary" list above as the company-wide style guide for AI/governance language.

---

## Enforcement Rules

1. **Every public-facing copy change** (website, README, trust docs, investor materials, press kit) must be reviewed against this document before merge.
2. **The forbidden list is not exhaustive.** New commodity phrases will emerge; add them to the list as they are identified.
3. **The approved vocabulary is the default.** When writing any new copy, the question is not "what do other vendors say" — it is "which approved term names what I am describing."
4. **Founder writes the canonical paragraphs.** Operators can rewrite for their surface; the canonical category sentence and pillar language must remain exact.
5. **Re-audit quarterly.** The market drifts. The vocabulary will need refresh as competitor copy evolves.

---

## How to Tell If Your Copy Has Drifted

Read the paragraph aloud. Then ask:

- Could this sentence appear on a Microsoft Copilot landing page? If yes, it is too generic.
- Does any word say nothing? ("powerful", "robust", "seamless", "intelligent", "smart") — replace it.
- Could a buyer who reads only this paragraph name even one of the six pillars? If no, the paragraph is failing its job.
- Is there a specific library, schema, or surface named? If no, the paragraph is at risk of drift.

If any of those four checks fails, rewrite using the approved vocabulary.

---

*Source-of-truth files: `message-architecture.md`, `one-sentence-category-statement.md`, `moat-definition.md`, `BRAND_GUIDELINES.md`, `CATEGORY_POSITIONING.md`. This document is the canonical style guide for all AI/governance language across SZL Holdings public surfaces.*
