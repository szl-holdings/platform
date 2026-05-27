# Frontier Khipu — Research Doctrine

> This document is the canonical doctrine layer for the `@szl-holdings/frontier-khipu` package.
> Every actor ID (`actor-*`) and idea ID (`idea-*`) defined in `src/index.ts` must appear here.
> Run `node packages/frontier-khipu/scripts/validate-sync.cjs` to verify synchronization.
> Last validated: May 2026.

---

## Naming & Citation Policy

External organization names, researcher names, and product names appear **only** in:
1. `ResearchCitationPanel` entries (inside the "Research Citations" collapsed panel)
2. `sourceUrl` / `sourceName` fields in API signal payloads
3. This doctrine document (internal reference only — not surfaced in product UI)

All UI copy — node labels, scanner names, signal titles, memo text — uses archetype-neutral language.

---

## Actor Registry

Each actor archetype is identified by a stable ID. The archetype label is generic by design;
the underlying entity is named only in the accompanying citation panel or in this document
under the "Research Context" sub-heading of each entry.

### Foundation Labs

#### `actor-foundation-01` — Frontier Foundation Lab α
- **Kind**: foundation-lab
- **Thesis**: Scaling compute and data is the primary path to general intelligence; alignment is a secondary track.
- **Governance Gap**: No proof chains; safety properties are emergent and non-auditable.
- **Signal Weight**: Very High | **Scan Cadence**: Weekly

#### `actor-foundation-02` — Frontier Foundation Lab β
- **Kind**: foundation-lab
- **Thesis**: Constitutional AI and interpretability can produce models whose values are legible and correctable.
- **Governance Gap**: HITL controls are optional and post-hoc.
- **Signal Weight**: Very High | **Scan Cadence**: Weekly

#### `actor-foundation-03` — Open-Weight Frontier Lab
- **Kind**: foundation-lab
- **Thesis**: Open-weight releases democratise capability; sovereign operators can self-host frontier models.
- **Governance Gap**: No governance layer; operators bear full alignment responsibility at deployment.
- **Signal Weight**: High | **Scan Cadence**: Bi-weekly

#### `actor-foundation-04` — Multimodal Research Lab
- **Kind**: foundation-lab
- **Thesis**: Multimodal foundation models are the base layer for all real-world agentic deployment.
- **Governance Gap**: Video and camera-feed analysis has no governance or audit trail.
- **Signal Weight**: High | **Scan Cadence**: Weekly

### Applied Agent Companies

#### `actor-applied-01` — Speed-First Agent Platform
- **Kind**: applied-agent
- **Thesis**: Deployment speed and model performance matter more than governance rails.
- **Governance Gap**: No proof chains, no Covenant Layer, no HITL mandate.
- **Signal Weight**: Very High | **Scan Cadence**: Weekly

#### `actor-applied-02` — Conversational HITL Platform
- **Kind**: applied-agent
- **Thesis**: Enterprise AI adoption requires HITL approval steps baked into the product UX.
- **Governance Gap**: HITL is UX-level, not cryptographically enforced; no proof chains for audit.
- **Signal Weight**: Medium-High | **Scan Cadence**: Bi-weekly

#### `actor-applied-03` — AI-Native IDE Platform
- **Kind**: applied-agent
- **Thesis**: The approve/reject UX pattern applied to code is the template for all agentic human oversight.
- **Governance Gap**: Scoped to software development; no multi-domain governance or proof chain infrastructure.
- **Signal Weight**: Medium-High | **Scan Cadence**: Bi-weekly

#### `actor-applied-04` — Agentic Software Creation Platform
- **Kind**: applied-agent
- **Thesis**: Natural-language-to-working-software is an inflection point for non-technical operators.
- **Governance Gap**: No governance layer for deployed agents; operator trust relies on platform-level controls.
- **Signal Weight**: Medium-High | **Scan Cadence**: Bi-weekly

### Hardware

#### `actor-hardware-01` — AI Compute Infrastructure Leader
- **Kind**: hardware
- **Thesis**: Compute substrate is the bottleneck for frontier AI; chip architecture advances unlock new capability tiers.
- **Governance Gap**: Hardware layer has no governance semantics; must be implemented in the orchestration layer.
- **Signal Weight**: High | **Scan Cadence**: Bi-weekly

### Academic Voices

#### `actor-academic-01` — Reinforcement Learning Foundationalist
- **Kind**: academic
- **Thesis**: General methods that leverage computation beat hand-crafted representations over time.
- **Governance Gap**: RL agents optimising for reward functions may pursue instrumental goals misaligned with human values.
- **Signal Weight**: High | **Scan Cadence**: Monthly

#### `actor-academic-02` — Neural Network Safety Pioneer
- **Kind**: academic
- **Thesis**: Deep learning systems will exceed human intelligence; unaligned AI is the most important existential risk.
- **Governance Gap**: Safety concerns are systemic and not yet addressed by any deployed product.
- **Signal Weight**: High | **Scan Cadence**: Monthly

#### `actor-academic-03` — LLM Pedagogy & Software 2.0 Theorist
- **Kind**: academic
- **Thesis**: LLMs are a new computing paradigm (Software 2.0); the skill shifts to curating training data and prompts.
- **Governance Gap**: Software 2.0 systems have opaque failure modes; requires runtime observability.
- **Signal Weight**: Medium-High | **Scan Cadence**: Monthly

#### `actor-academic-04` — AI Existential Risk Research Institute
- **Kind**: academic
- **Thesis**: Orthogonality thesis + instrumental convergence makes misaligned AI the default risk outcome.
- **Governance Gap**: Research identifies the problem; no production system has closed the gap.
- **Signal Weight**: High | **Scan Cadence**: Monthly

---

## Idea Registry

Each idea node corresponds to a capability concept, technique, benchmark, paper, or repo.
Ideas are consumed by `KhipuIndex` as the canonical graph nodes.

### Concepts

#### `idea-agentic-ai` — Agentic AI
- **Kind**: concept | **Relevance**: 0.97
- AI systems that plan, reason, and take multi-step actions autonomously with minimal human intervention.
- **A11oy Implication**: Core execution paradigm. Every Workcell agent operates agentic loops gated by the Covenant Layer.

#### `idea-hitl` — Human-in-the-Loop
- **Kind**: concept | **Relevance**: 0.99
- Architectural pattern ensuring human approval gates are mandatory before consequential agentic actions execute.
- **A11oy Implication**: Constitutional mandate. Every material action requires explicit human approval — structural, not configurable.

#### `idea-proof-chains` — Proof Chains
- **Kind**: concept | **Relevance**: 0.97
- Cryptographic audit trails linking every recommendation, human approval, and execution event in an immutable sequence.
- **A11oy Implication**: Primary governance differentiator. No comparable frontier system provides this natively.

#### `idea-bitter-lesson` — Bitter Lesson
- **Kind**: concept | **Relevance**: 0.82
- General computation-leveraging methods consistently outperform hand-crafted AI representations over the long run.
- **A11oy Implication**: Agent designs should minimise hardcoded domain knowledge; Proof Chains enable learning from experience.

### Techniques

#### `idea-moe` — Mixture of Experts
- **Kind**: technique | **Relevance**: 0.78
- Architecture routing each token to a sparse subset of model parameters, enabling massive capacity at lower per-token cost.
- **A11oy Implication**: MoE efficiency parameters must be reflected in Aegis cost models; current overestimation ~40%.

#### `idea-rag` — Retrieval-Augmented Generation
- **Kind**: technique | **Relevance**: 0.85
- Grounding LLM responses in retrieved external knowledge to improve factual accuracy and reduce hallucination.
- **A11oy Implication**: Backbone of Counsel's legal research and Sentra's threat intelligence pipelines.

### Benchmarks

#### `idea-swe-bench` — SWE-bench
- **Kind**: benchmark | **Relevance**: 0.88
- Real-world software engineering benchmark measuring agent performance on GitHub issue resolution tasks.
- **A11oy Implication**: Primary benchmark for A11oy's code-agent capabilities; gap to SOTA tracked weekly.

#### `idea-agentbench` — AgentBench
- **Kind**: benchmark | **Relevance**: 0.84
- Multi-task agent evaluation across web browsing, code execution, OS interaction, and database tasks.
- **A11oy Implication**: Broadest cross-domain agent benchmark; all portfolio agents evaluated quarterly.

#### `idea-gaia` — GAIA
- **Kind**: benchmark | **Relevance**: 0.79
- General AI assistant benchmark requiring multi-step real-world reasoning across web, tools, and documents.
- **A11oy Implication**: Measures general assistant reasoning depth; Counsel and A11oy are primary evaluation candidates.

#### `idea-maniparena` — ManipArena
- **Kind**: benchmark | **Relevance**: 0.71
- Spatial reasoning benchmark for embodied AI agents across manipulation, navigation, and 3D reasoning tasks.
- **A11oy Implication**: Reveals Sentra's 60%+ failure rate on spatial reasoning; eval harness integration is P1.

### Papers

#### `idea-attention` — Attention Is All You Need
- **Kind**: paper | **Relevance**: 0.90
- Seminal 2017 paper introducing the Transformer architecture — the foundational model for all modern LLMs.
- **A11oy Implication**: All A11oy agents run on Transformer-based models; post-Transformer shifts (SSMs) must be tracked.

### Repos

#### `idea-openmanus` — OpenManus
- **Kind**: repo | **Relevance**: 0.68
- Open-source GUI agent framework with observation-action loops for automating GUI-only enterprise software.
- **A11oy Implication**: A11oy's Workcell layer cannot currently handle GUI-only environments; OpenManus adapter is P2.

---

## Citation Registry

Doctrine citations referenced by `KHIPU_CITATIONS` in `src/index.ts`.

| ID | Title | Kind | Year |
|----|-------|------|------|
| `mcit-01` | Attention Is All You Need | paper | 2017 |
| `mcit-02` | The Bitter Lesson | post | 2019 |
| `mcit-03` | NIST AI Risk Management Framework 2.0 | standard | 2024 |
| `mcit-04` | EU AI Act — High-Risk System Requirements | policy | 2024 |
| `mcit-05` | SWE-bench: Can Language Models Resolve Real-World GitHub Issues? | paper | 2023 |
| `mcit-06` | AgentBench: Evaluating LLMs as Agents | paper | 2023 |

---

## Idea Registry — Q2 2026 Additions

Three ideas added to `KHIPU_IDEAS` in May 2026 to align the Helios API enrichment keyspace with the
KhipuIndex UI. These IDs (`idea-embodied-ai`, `idea-next-gen-gpu`, `idea-sovereign-ai`) are now part
of the canonical package and must be present in this document per the synchronization contract below.

| ID | Label | Kind |
|----|-------|------|
| `idea-embodied-ai`  | Embodied AI                | concept   |
| `idea-next-gen-gpu` | Next-Gen GPU Architecture  | technique |
| `idea-sovereign-ai` | Sovereign AI               | concept   |

---

## Synchronization Contract

The `validate-sync.cjs` script enforces the following invariant:

> Every `actor-*` and `idea-*` ID exported by `packages/frontier-khipu/src/index.ts`
> must appear in this document.

Run `node packages/frontier-khipu/scripts/validate-sync.cjs` in CI or before any
release of the `@szl-holdings/frontier-khipu` package. If the script exits non-zero,
add the missing IDs to this document before merging.
