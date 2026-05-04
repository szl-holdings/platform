# Frontier Doctrine — Public Architectural Patterns Mapped to SZL's 10 Layers

**Version:** 1.1 · **Date:** April 17, 2026 · **Status:** Strategy reference for growth capital diligence and Foundation 07+ planning.

## Implementation status legend

Every "SZL evolution" claim below is tagged with one of:
- **[Shipped]** — code merged to `main`, tests passing, referenced commit / package available.
- **[Partially shipped]** — schema and skeleton merged, runtime wiring incomplete; safe to discuss as in-progress.
- **[In flight]** — assigned project task currently being implemented.
- **[Planned]** — recommended next foundation task, not yet scoped into a project task.

---

## Purpose

SZL's category — **Governed Decision Infrastructure (GDI)** — is novel as a packaged offering, but its constituent doctrines are not invented from scratch. Each of SZL's 10 shared layers (`docs/PLATFORM_CANONICAL.md`) corresponds to a publicly documented architectural pattern at a frontier vendor. This document maps those patterns 1:1, cites the public source, and states the SZL-specific evolution.

We **steal architectural patterns, not branding**. We do not borrow product names, marketing claims, or proprietary code. All references below are to public technical documentation, vendor blogs, peer-reviewed research, or open standards.

> **Out of scope:** illicit, leaked, or unauthorized sources. None of the patterns here require non-public material — frontier vendors publish their architecture precisely so the ecosystem can adopt it.

---

## Vendor reference set

| Vendor | Why it's in the set | Primary public source |
|---|---|---|
| **NVIDIA** (NeMo Guardrails, NIM) | System-level guardrails as microservices; reference architecture for agentic safety. | https://developer.nvidia.com/nemo-guardrails |
| **IBM** (watsonx.governance) | End-to-end AI lifecycle governance; Forrester Wave Leader Q3 2025. Maps to our policy + audit story for regulated buyers. | https://www.ibm.com/products/watsonx-governance |
| **Microsoft** (Azure AI Foundry / Agent Service) | Hosted agent runtime with Responsible AI controls, identity, observability, and content safety integrated. | https://learn.microsoft.com/en-us/azure/foundry/agents/overview |
| **Apple** (Private Cloud Compute) | Verifiable transparency and stateless compute for sensitive workloads — gold standard for sovereign mode. | https://security.apple.com/blog/private-cloud-compute/ |
| **Hugging Face** (lm-eval-harness, lighteval, model cards) | The de facto open standard for LLM evaluation reproducibility and model documentation. | https://github.com/huggingface/evaluation-guidebook |
| **Palantir** (Foundry Ontology, AIP) | The reference implementation of an enterprise ontology + kinetic actions over it. Closest analogue to our Constellation + Alloy split. | https://www.palantir.com/docs/foundry/ontology/overview |
| **Anthropic** (Constitutional AI, Constitutional Classifiers, ASL tiers) | The reference for capability-tier governance and policy-as-principles. | https://www.anthropic.com/news/constitutional-classifiers |
| **OpenTelemetry** (GenAI semantic conventions) | The emerging open standard for LLM trace/metric span attributes. Adopting it makes our Trace Graph portable. | https://opentelemetry.io/docs/specs/semconv/gen-ai/ |
| **OWASP** (LLM Top 10, 2025) | The accepted threat taxonomy for our Red Team & Safety Lab. | https://owasp.org/www-project-top-10-for-large-language-model-applications/ |

---

## Layer-by-layer mapping

### Layer 1 — Constellation (cross-domain ontology + intelligence graph)

**Closest public pattern:** Palantir Foundry **Ontology**.
- Palantir splits the ontology into **semantic elements** (objects, properties, links — the digital twin) and **kinetic elements** (actions, functions, dynamic security). The ontology sits *on top of* integrated datasets, virtual tables, and models, and is the central artifact every downstream surface reads from. ([source](https://www.palantir.com/docs/foundry/ontology/overview))
- Microsoft's Foundry Agent Service follows the same instinct — agents are scoped against typed entities, not raw rows.

**SZL evolution:**
- **[Partially shipped]** Constellation schema (merged with Foundation 03) defines every node with `provenance / freshness / confidence / sensitivity tier / owner / impact score`. Linked-trace and linked-evidence joins are wired through the graph schema; runtime enforcement that blocks node insertion without provenance is on the F07 backlog.
- **[Planned]** Edge-level evidence links and active-status flags are defined in the schema; cross-edge confidence aggregation for "is this inference justified?" queries is not yet implemented.
- **Intended net delta vs. Palantir:** evidence-as-first-class on every edge; cross-domain (legal + maritime + cyber + RE + finance) as a single ontology rather than per-vertical bolt-ons. The schema supports this today; the runtime enforcement layer is the next milestone.

---

### Layer 2 — Alloy OS (cognitive runtime / control plane)

**Closest public patterns:** Microsoft **Foundry Agent Service** + Microsoft **Agent Framework** (the Semantic Kernel + AutoGen merger).
- Foundry Agent Service handles "hosting, scaling, identity, observability, and enterprise security so you can focus on your agent logic." It supports planner/executor and supervisor/worker patterns natively. ([source](https://learn.microsoft.com/en-us/azure/foundry/agents/overview))
- Anthropic's tool-use loop is the reference for the inner-loop pattern (think → call tool → observe → continue).

**SZL evolution:**
- **[Partially shipped]** Replay primitive lives in `packages/trace-graph/src/replay.ts` (Foundation 03 / #998). Action ledger + rollback + checkpointing are scoped into Foundation 06 (#1001 — in flight) under the Memory Fabric & Alloy control plane task.
- **[Planned]** Tier-aware planning (planner emits a different tool set per tier) is the *intent* of the Alloy ↔ Guardian integration; today Guardian gates execution after the plan is emitted. Plan-time gating is a Foundation 06/07 enhancement.
- **Intended net delta:** governance moves from sidecar to inline. The package boundary is in place (`@workspace/guardian` + `@workspace/trace-graph` + Alloy control plane), but the planner-rewrites-by-tier behavior is not yet wired.

---

### Layer 3 — Guardian (policy + autonomy governor)

**Closest public patterns:** **NVIDIA NeMo Guardrails** + **Anthropic Constitutional Classifiers** + **IBM watsonx.governance** (lifecycle policy enforcement).
- NeMo Guardrails enforces topic control, PII detection, RAG grounding, jailbreak prevention, and multilingual/multimodal content safety. NVIDIA's framing: *"It's not just about guard-railing a model anymore — it's about guard-railing a total system."* ([source](https://venturebeat.com/ai/nvidia-boosts-agentic-ai-safety-with-nemo-guardrails-promising-better-protection-with-low-latency))
- Anthropic's **Constitutional Classifiers** are runtime defenses against universal jailbreaks, separate from the model itself. ([source](https://www.anthropic.com/news/constitutional-classifiers))
- IBM watsonx.governance enforces policies across the model lifecycle and was named a Leader in The Forrester Wave™: AI Governance Solutions, Q3 2025. ([source](https://www.ibm.com/products/watsonx-governance))
- Anthropic's **AI Safety Levels (ASL-1 … ASL-4)** are the canonical capability-tier framework.

**SZL evolution:**
- **[Shipped]** Guardian decision engine (`packages/guardian/src/decision-engine.ts`, Foundation 04 / #999) implements deny-by-default, tier-keyed rules, priority ordering, approval-required flow, and a `human-approval-mandatory` always-gate. 35 tests passing.
- **[Shipped]** Capability tiers are an **8-tier named taxonomy** (`advisory-only`, `internal-workflow`, `operator-assisted`, `executive-facing`, `regulated-workflow`, `external-client-facing`, `autonomous-reversible`, `human-approval-mandatory`) with a `TIER_RISK_LEVEL` ordering 1→8. This is *named* rather than numeric (T0–T5) because financial-services and legal buyers reason about risk by surface, not abstract level.
- **[Partially shipped]** Single audit log: Trace Graph emits `policy_decision` events (`lib/db/src/schema/trace_graph.ts`); a unified Guardian audit query API across NeMo-style input filters + lifecycle is on the F07 backlog.
- **Intended net delta vs. NVIDIA / IBM / Anthropic:** one policy DSL spanning input filters + capability tiers + lifecycle, replayable from the Trace Graph. Today we have the tier governor and the trace events; the input-filter and lifecycle stages are integration work, not invention.

---

### Layer 4 — Trace Graph (run telemetry, replay, grading)

**Closest public pattern:** **OpenTelemetry GenAI Semantic Conventions** (experimental as of v1.37+).
- The OTel GenAI conventions define standard span attributes for LLM operations (`gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, etc.) so traces are portable across vendors. ([source](https://opentelemetry.io/docs/specs/semconv/gen-ai/))
- Customer-side instrumentation in the Microsoft Foundry, NVIDIA NeMo, and Anthropic SDKs commonly emits OTel-compatible spans (typically via OpenLLMetry, OpenInference, or vendor-provided SDK callbacks rather than first-party emission).

**SZL evolution:**
- **[Shipped]** Trace Graph (Foundation 03 / #998) runtime span schema (`packages/trace-graph/src/schema.ts`) carries `citations`, `approvals` (with approver + decision + timestamp), `rollbackId`, `businessImpact` (value created / value at risk), and tool-call records. DB schema (`lib/db/src/schema/trace_graph.ts`) additionally persists `replay_of_trace_id`, `is_replay`, `prompt_version`, `model`, latency/tokens/cost, and a typed event stream including `policy_decision`.
- **[Planned, F11]** OTel GenAI export adapter — publish a mapping from our `trace_spans.attributes` keys to OTel GenAI keys so customers can ingest into Datadog / Honeycomb / New Relic without losing fidelity. Recommended to run in parallel with F07.
- **Intended net delta:** OTel gives you spans; we add *deterministic replay over the span graph* with version diff. Replay is shipped in `replay.ts`; root-cause-walk UI is downstream of F10.

---

### Layer 5 — Eval Forge

**Closest public patterns:** Hugging Face **lm-evaluation-harness** + **LightEval** + **Open LLM Leaderboard** + the HF **Evaluation Guidebook**.
- lm-eval-harness is the backend for the Open LLM Leaderboard and is used internally by NVIDIA, Cohere, BigScience, BigCode, Nous Research, and Mosaic ML. It enforces reproducibility via publicly available prompts. ([source](https://github.com/EleutherAI/lm-evaluation-harness))
- HF's 2025 guidance recommends **LightEval** for new projects (faster, cleaner). ([source](https://github.com/huggingface/evaluation-guidebook))
- Model cards (HF spec) are the open standard for documenting evaluation results alongside the artifact.

**SZL evolution:**
- **[In flight, #1000]** Eval Forge is being built to be *workflow-aware*, not just model-aware: grading entire agent runs (planner → tool calls → output) replayed from the Trace Graph rather than isolated prompts.
- **[In flight]** Citation fidelity, unsupported-claim detection, and policy-adherence scorers are scoped into Foundation 05.
- **[Planned, F12]** Eval cards on Constellation nodes (UI surface): every entity asserted by an agent shows the asserting agent's gold-scenario score, refreshed per release. Downstream of F09 (Red Team).

---

### Layer 6 — Memory Fabric

**Closest public patterns:** Microsoft Foundry's **agent memory** + Anthropic's **conversation memory** patterns + LangChain/LlamaIndex semantic-memory tiers.
- Foundry Agent Service provides session, thread, and long-term agent memory natively, scoped by identity.
- The "session / workflow / entity / executive / long-term domain" tier breakdown in our spec mirrors patterns documented across the Anthropic cookbook and Microsoft Agent Framework docs.

**SZL evolution:**
- **[In flight, #1001]** Memory objects scoped to carry `provenance / freshness / confidence / retention policy / sensitivity tier / linked entities / linked traces / linked actions`. Most reference implementations carry only the embedding + source.
- **[Planned]** Memory writes pass through Guardian for tier-keyed gating (e.g., writes scoped `external-client-facing` or `human-approval-mandatory` require explicit approval). Wiring lands as part of the Alloy control plane in Foundation 06.
- **Intended net delta:** memory is a Constellation subgraph, not a vector-store sidecar; every retrieval is replayable in the Trace Graph.

---

### Layer 7 — Tool Mesh

**Closest public patterns:** **Anthropic MCP (Model Context Protocol)** + **NVIDIA NIM microservices** + Microsoft Foundry's **tool registry**.
- MCP is becoming the open standard for typed, schema-bound, permissioned tool exposure. Anthropic, OpenAI (via Apps SDK), and Microsoft all support it.
- NIM packages tools/models as containerized microservices with declared schemas, latency targets, and rate limits. ([source](https://developer.nvidia.com/nemo-guardrails))

**SZL evolution:**
- **[Shipped]** `@workspace/tool-mesh` (Foundation 04 / #999) ships 14 tools across security / finance / operations domains, each with declared schema, policy tier, and tier-aware handlers. 43 tests passing.
- **[Partially shipped]** Tool invocations are wired to emit Trace Graph spans (Foundation 03); Guardian gating is integrated at the decision-engine layer. Per-environment allowlist enforcement lands with F08 (Sovereign Mode).
- **[Planned]** Tools as Constellation nodes — ownership, version drift, and dependency health tracked alongside business entities. DB tables exist (`tool_mesh_tools`, `tool_mesh_tool_versions`); UI surface is downstream of F10.

---

### Layer 8 — Signal Fusion

**Closest public patterns:** Splunk's risk-based alerting model + Microsoft Sentinel's fusion engine + Palantir AIP's automated workflows over the Ontology.
- Sentinel correlates signals across logs/metrics/events/identity/network into ranked incidents with confidence scores. (Public Microsoft Learn docs.)
- Palantir AIP runs scheduled and event-driven jobs over the Ontology to produce ranked recommendations.

**SZL evolution:**
- **[Planned, F07 — recommended next foundation task]** Signal Fusion ingests across all six SZL domain packs (Lyte, Terra, PRISM, Vessels, Aegis, Imperium) into one ranked recommendation queue routed by Alloy. Sentinel is cyber-only; Palantir AIP requires per-tenant configuration. SZL's wedge is unified cross-domain.
- **Intended net delta:** outputs are typed `Recommendation` nodes in Constellation with linked evidence + linked traces + Guardian tier required to enact. Not opaque "alerts."

---

### Layer 9 — Sovereign Mode

**Closest public patterns:** **Apple Private Cloud Compute** (verifiable transparency, stateless nodes, attested boot) + Microsoft Azure **Confidential Computing** + AWS **Nitro Enclaves**.
- Apple PCC ships stateless compute nodes with cryptographic attestation, public binary transparency, and third-party security research access. Gold standard for "we can prove what ran." ([source](https://security.apple.com/blog/private-cloud-compute/))
- IBM watsonx and Microsoft Foundry both support hybrid / customer-VPC deployment with documented data residency controls.

**SZL evolution:**
- **[Planned, F08]** Six deployment lanes (dev / staging / prod / client-VPC / sovereign / high-restriction). Each lane has its own Guardian policy pack (model rules / tool rules / memory rules / data residency / egress / approval / audit).
- **[Planned, F08]** Sovereign lane requires attested deployment + signed promotion + reproducible build — pattern borrowed from PCC's transparency model.
- **[Partially shipped]** Imperium tenant graph + environment matrix schemas exist; promotion pipeline + attestation flow is the F08 deliverable.
- **Intended net delta:** the *governance overlay* portable across lanes (same Guardian policy syntax in dev as in sovereign), so a buyer can rehearse in sandbox what will run in their air-gapped tenant.

---

### Layer 10 — Red Team & Safety Lab

**Closest public patterns:** **OWASP LLM Top 10 (2025)** + **Anthropic Constitutional Classifiers benchmark suite** + **MITRE ATLAS**.
- OWASP LLM Top 10 is the accepted threat taxonomy: prompt injection, insecure output handling, training data poisoning, model DoS, supply chain, sensitive info disclosure, insecure plugin design, excessive agency, overreliance, model theft.
- Anthropic publishes Constitutional Classifier benchmarks against universal jailbreaks. ([source](https://www.anthropic.com/news/constitutional-classifiers))
- MITRE ATLAS is the adversarial ML threat matrix.

**SZL evolution:**
- **[Planned, F09]** Safety Lab runs continuous red-team suites against every deployed agent at every tier, scored by Eval Forge, with results posted to the relevant Constellation node's eval card.
- **[Planned, F09]** Regression detection — any drop in jailbreak resistance / unsupported-claim rate / policy-bypass rate blocks promotion to higher environments via Guardian. Gates F10 broad app sweep.
- **Intended net delta:** red team as a standing process attached to Trace Graph + Eval Forge, not a one-time external pen test. Every regression has a replayable trace.

---

## Cross-cutting innovations (where SZL is genuinely novel)

These are the differentiators safe to claim in growth capital diligence because no single vendor packages them together. Each is tagged by current state so we don't overstate.

1. **[Partially shipped]** **Evidence-on-every-edge.** Constellation schema models provenance/freshness/confidence on edges. Palantir doesn't enforce this by default. Runtime enforcement lands with F07.
2. **[Planned]** **Tier-aware planners.** Alloy planner rewrites the available tool set per Guardian tier — governance changes the *shape* of the plan, not just whether it executes. Today we gate execution; planner-time gating is F06/F07.
3. **[Shipped]** **Replay-as-eval.** Trace Graph replay (`packages/trace-graph/src/replay.ts`) feeds the in-flight Eval Forge directly. HF evals are prompt-level; ours are workflow-level.
4. **[Partially shipped]** **Six-domain unified ontology.** Real estate + legal + maritime + cyber + finance + ops in one Constellation. Schema covers all six; per-domain population varies.
5. **[Planned, F08]** **Governance overlay portable across deployment lanes.** Same Guardian policy DSL runs in sandbox and sovereign mode. Apple PCC is sovereign-only; IBM watsonx is hybrid; our intent is all six lanes with one policy surface.
6. **[Planned, F12]** **Eval cards on Constellation nodes.** Model cards (HF) attach to model artifacts; we attach an equivalent to every entity asserted by an agent.

---

## Recommended next foundation tasks (in dependency order)

| # | Task | Layer | Blocks on |
|---|---|---|---|
| **F07** | Signal Fusion engine (Layer 8) | 8 | Foundation 03 (Trace Graph ✅), 04 (Guardian ✅), 06 (Memory Fabric — in flight) |
| **F08** | Sovereign Mode + deployment lanes (Layer 9) | 9 | Foundation 04 (Guardian ✅), Imperium tenant graph |
| **F09** | Red Team & Safety Lab (Layer 10) | 10 | Foundation 05 (Eval Forge — in flight) |
| **F10** | App-evolution sweep — wire Lyte X / Terra X / PRISM X / Vessels X / Aegis X onto Constellation + Trace Graph + Guardian | per-app | F07 (recommendations come from Signal Fusion); **gated on F09 minimum safety baseline** before wiring tier-3+ flows |
| **F11** | OTel GenAI export adapter for Trace Graph (portability) | 4 | none — **recommended to run in parallel with F07** to retire the "portability later" risk early in diligence |
| **F12** | Eval card surface on Constellation nodes (UI) | 1, 5 | F09 |

---

## Citations index

All sources listed are public as of April 2026 and were retrieved via standard web search; no paywalled, leaked, or unauthorized material is referenced.

- NVIDIA NeMo Guardrails — https://developer.nvidia.com/nemo-guardrails ; https://developer.nvidia.com/blog/develop-specialized-ai-agents-with-new-nvidia-nemotron-vision-rag-and-guardrail-models/
- IBM watsonx.governance — https://www.ibm.com/products/watsonx-governance ; https://www.ibm.com/new/announcements/ibm-enhances-the-capabilities-of-watsonx-governance-with-the-new-model-risk-evaluation-engine
- Microsoft Foundry / Agent Service — https://learn.microsoft.com/en-us/azure/foundry/agents/overview ; https://azure.microsoft.com/en-us/blog/introducing-microsoft-agent-framework/
- Apple Private Cloud Compute — https://security.apple.com/blog/private-cloud-compute/ ; https://security.apple.com/documentation/private-cloud-compute
- Hugging Face evaluation — https://github.com/EleutherAI/lm-evaluation-harness ; https://github.com/huggingface/evaluation-guidebook
- Palantir Foundry Ontology / AIP — https://www.palantir.com/docs/foundry/ontology/overview ; https://www.palantir.com/docs/foundry/aip/overview
- Anthropic CAI / Constitutional Classifiers — https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback ; https://www.anthropic.com/news/constitutional-classifiers
- OpenTelemetry GenAI Semantic Conventions — https://opentelemetry.io/docs/specs/semconv/gen-ai/
- OWASP LLM Top 10 — https://owasp.org/www-project-top-10-for-large-language-model-applications/

---

*Maintained by SZL Holdings platform strategy. Update on every Foundation task merge.*
