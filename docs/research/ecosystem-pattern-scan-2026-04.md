<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# Ecosystem Pattern Scan & Evolution Roadmap
**SZL Holdings Platform — AI Shared Library & A11oy Orchestration Surface**
*Research period: April–May 2026 · Author: Platform Intelligence · Status: Draft for Human Review*

---

## Table of Contents

1. [Scan Scope](#1-scan-scope)
2. [Current-State Baseline](#2-current-state-baseline)
3. [Pattern Catalog](#3-pattern-catalog)
4. [Adoption Matrix](#4-adoption-matrix)
5. [Recommended Roadmap](#5-recommended-roadmap)
6. [Proposed Shared-Library Shape (Now Tier)](#6-proposed-shared-library-shape-now-tier)
7. [Open Questions for the Human](#7-open-questions-for-the-human)

---

## 1. Scan Scope

The following sources were surveyed for the period ending May 2026. Each entry records the approximate version or publication date observed, its license, and whether it is included or excluded from adoption recommendations.

### 1a. Provider-Gateway Patterns

| Source | Version / Date | License | Status |
|:-------|:--------------|:--------|:-------|
| Vercel AI SDK (`vercel/ai`) | v4.3, May 2026 | Apache-2.0 | **Included** |
| LiteLLM | v1.43, Apr 2026 | MIT | **Included** |
| OpenRouter API | Public spec, Apr 2026 | Proprietary API / open spec | **Included** (patterns only) |
| AWS Bedrock — Converse API | Apr 2026 docs | Proprietary | **Included** (patterns only) |
| Anthropic Messages API + extended thinking | Claude 3.7+, 2025-2026 | Proprietary | **Included** (patterns only) |
| LM Studio REST API | 0.3.x, 2026 | MIT | **Included** |

### 1b. Agent Orchestration Runtimes

| Source | Version / Date | License | Status |
|:-------|:--------------|:--------|:-------|
| LangGraph (`langchain-ai/langgraph`) | 0.2.x, Apr 2026 | MIT | **Included** |
| Mastra (`mastra-ai/mastra`) | 0.9.x, May 2026 | Elastic License 2.0 | **Flagged** — EL2 restricts SaaS use; patterns noted, adoption excluded |
| OpenAI Agents SDK (`openai/openai-agents-python`) | 0.0.15, May 2026 | MIT | **Included** |
| Inngest (`inngest/inngest`) | v3.2, May 2026 | Server Side Public License | **Flagged** — SSPL restricts offering as a service; patterns noted, adoption excluded |
| Temporal (`temporalio/temporal`) | v1.26, May 2026 | Server: BSL 1.1 (converts to Apache-2.0 after 4-year window; prohibits competing hosted offerings before conversion). SDK: MIT. | **Included** (SDK patterns only; server licensing requires legal review before self-hosting) |
| Restack | 0.4.x, Apr 2026 | Apache-2.0 | **Included** |

### 1c. MCP Ecosystem

| Source | Version / Date | License | Status |
|:-------|:--------------|:--------|:-------|
| MCP Specification (`modelcontextprotocol/modelcontextprotocol`) | 2025-11-05 revision, Dec 2025 | MIT | **Included** |
| MCP TypeScript SDK (`modelcontextprotocol/typescript-sdk`) | 1.11.x, May 2026 | MIT | **Included** |
| MCP Server Registry (Anthropic-curated list) | May 2026 | Public listing | **Included** (patterns only) |
| FastMCP (Python) (`jlowin/fastmcp`) | 2.3, May 2026 | Apache-2.0 | **Included** |
| mcp-use (`pietrozanella/mcp-use`) | 0.2.x, Apr 2026 | MIT | **Included** |

### 1d. Structured-Output & Tool-Use Ergonomics

| Source | Version / Date | License | Status |
|:-------|:--------------|:--------|:-------|
| BAML (`BoundaryML/baml`) | 0.73, May 2026 | Apache-2.0 | **Included** |
| Pydantic AI (`pydantic/pydantic-ai`) | 0.2.x, May 2026 | MIT | **Included** |
| Instructor (`jxnl/instructor`) | 1.7.x, May 2026 | MIT | **Included** |
| `zod-to-json-schema` | 3.x, 2026 | MIT | **Included** |

### 1e. Eval & Observability

| Source | Version / Date | License | Status |
|:-------|:--------------|:--------|:-------|
| Promptfoo (`promptfoo/promptfoo`) | 0.91, May 2026 | MIT | **Included** |
| Langfuse (`langfuse/langfuse`) | 3.x, May 2026 | MIT (self-host); proprietary (cloud) | **Included** (self-host patterns) |
| Braintrust | Cloud SaaS, 2026 | Proprietary | **Included** (patterns only) |
| Inspect AI (`UKGovernmentBEIS/inspect_ai`) | 0.3.x, May 2026 | MIT | **Included** |
| OpenAI Evals (`openai/evals`) | May 2026 | MIT | **Included** |
| Eleuther LM Evaluation Harness | 0.4.x, 2026 | MIT | **Included** |
| OpenTelemetry GenAI Semantic Conventions | v0.10, 2026 | Apache-2.0 | **Included** |

### 1f. Governance / Policy

| Source | Version / Date | License | Status |
|:-------|:--------------|:--------|:-------|
| Open Policy Agent / Rego | v0.68, Apr 2026 | Apache-2.0 | **Included** |
| Cedar (`cedar-policy/cedar`) | 4.x, May 2026 | Apache-2.0 | **Included** |
| Anthropic Responsible Scaling Policy v3.0 | Feb 2026 | Public commitment | **Included** (patterns only) |
| NIST AI RMF 1.1 | Jan 2026 | Public domain | **Included** |
| EU AI Act (Annex IV / Articles 9-72) | Effective Aug 2026 | EU regulation | **Included** (patterns only) |
| ISO/IEC 42001:2023 | 2023 | Standard (behind paywall) | **Included** (summaries from public annex commentary) |

---

## 2. Current-State Baseline

This section summarizes what the SZL shared AI stack already provides, so adoption candidates are evaluated against real capability rather than gaps we may already have filled. References point to authoritative source files rather than restating their full content.

### 2a. `lib/ai-engine` — Nuro Mesh & Model Router

The engine is the platform's largest shared library. Its functional surface breaks into roughly twelve sub-systems.

**Model Router** (`src/model-router.ts`): Nine named lane classes (`reasoning`, `planning`, `triage`, `tool_calling`, `extraction`, `summarization`, `classification`, `vision_understanding`, `background_batch`). The router resolves a model via three cascading steps: (1) Model Passport lookup (signed, DB-persisted policy envelope with Ed25519 digest and autonomy tier), (2) fine-tuned model registry per agent, (3) static lane→model map. Cost estimation, per-tenant feature toggles, lane disabling, and approval-gate enforcement are built in. A pluggable `RouterStrategyHook` lets the Cognitive Reflexivity engine bias lane/model/retrieval-depth/confidence-floor decisions without compile-time coupling.

**Nuro Mesh** (`src/nuro-mesh.ts`): Fifteen-plus named agents registered in `AGENT_REGISTRY` — Alloy (orchestrator), Helmsman (maritime), Sentinel (security/maker-checker), INCA (research), Muse (creative), Beacon (analytics), Zeus (infrastructure), Compass (readiness), Lexis (legal), Atlas (financial), Terra (real-estate), Nexus (client), Scribe (writing), Visionary (visual), Architect (presentation), Analyst (data), Scheduler, Curator (knowledge), and Sovereign (autonomous). The mesh routes by semantic intent matching and supports multi-agent consultation, adversarial red-team challenges, and coalition formation.

**Consciousness Layer** (`src/consciousness/`): Cognitive workspace, inner monologue, metacognitive monitoring, goal engine, emotional signals, self-model, temporal awareness, predictive processing, and dream consolidation (long-context learning pass). No comparable system was observed among the scanned public sources — all surveyed runtimes treat the agent as a stateless function call rather than a continuously-modeled process.

**Shadow Council** (`src/shadow-council.ts`): A Contrarian adversary agent automatically challenges high-stakes outputs before delivery. Severity scoring (none → critical) gates pass/warn/revise/block decisions. All challenges are logged for the flywheel.

**Coalition Intelligence** (`src/coalition/`): Ad-hoc multi-agent coalitions with scratchpad sharing and consensus voting.

**Karpathy Layer** (`src/karpathy/`): Residual stream, self-distilling knowledge base, distillation engine, ephemeral reasoning (scoped chain-of-thought with GC), autonomy depth profiles, and gate primitives (Think Gate, Simplicity Gate, Surgical Scope Gate, Goal Verification Gate).

**Learning Loop** (`src/learning/`, `src/meta-learning.ts`, `src/flywheel/`): Outcome learning, trajectory store, and meta-learning (strategy outcome recording).

**Cost Layer** (`src/cost/`): Budget manager per agent/tenant, cost-performance router (`src/cost-performance-router.ts`), and cost estimation table covering 15+ models.

**MCP Apps** (`src/mcp-apps/`): MCP integration hooks inside the engine layer.

**Extended Thinking** (`src/extended-thinking.ts`): Wrapper for Anthropic's extended thinking mode, exposing thinking budget controls and streamed token capture.

**Sovereign Intelligence** (`src/sovereign-intelligence.ts`): The highest-autonomy agent tier, with its own deliberation and escalation path.

**A2A Delegation** (`src/a2a/`): Agent-to-agent delegation and agent registry, implementing the emerging A2A interoperability pattern.

### 2b. `packages/substrate` — Sovereign Execution Substrate

The substrate provides a strongly-typed, policy-enforced execution runtime distinct from the Nuro Mesh's conversational routing. Stage primitives are `Reason`, `Retrieve`, `ToolCall`, `Verify`, `Decide`, and `ApprovalGate`. Workflows are defined declaratively, compiled to a bundle, and the bundle hash is cryptographically signed at runtime. Reference workflows ship for `AegisThreatTriage`, `ExecutiveBrief`, and `RiskEscalation`. The substrate integrates with the Substrate Edge Inference service (oLLM) for local GPU inference.

### 2c. `lib/prompt-registry` / `packages/prompt-registry` / `packages/agents-prompts`

Two co-existing prompt-registry locations exist in the monorepo: `lib/prompt-registry` (the source library directory, appears legacy/reference) and `packages/prompt-registry` (the active npm package, containing `seed.ts`, `registry.ts`, `ref.ts`). `packages/agents-prompts` is a wrapper/bridge over `packages/prompt-registry` that adds agent-specific loading, evaluation, and template rendering. The active package provides: versioned prompt management with status lifecycle (`draft` → `canary` → `active` → `deprecated`), template rendering, and a `PromptEvaluator` that scores prompts against eval cases. References in the pattern catalog below that say `packages/prompt-registry` mean the active package; `lib/prompt-registry` references should be treated as pointing to the same canonical implementation until the lib directory is retired.

### 2d. `packages/tool-registry`

A typed catalog of tool definitions covering ID, display name, owning specialist, functional category (14 categories including `policy`, `approval`, `execution`), side-effect flag, approval requirement, estimated cost per call, and version. Extensible via `registerTool()`. Not yet MCP-emitting — tools are defined here but the MCP serialization layer is handled separately in `src/mcp-apps/`.

### 2e. `packages/eval-os` / `packages/evals-core`

The Domain-Jury Evaluator Pipeline scores recommendations on five dimensions: Grounding (evidence quality), Actionability (can a human act on it?), Policy Compliance (covenant gate alignment), Reversibility (consequence of being wrong), and Confidence (calibration). The golden set in `lib/ai-engine/src/evals/golden-set.ts` defines structured test cases with assertions. `run-evals.ts` produces a pass-rate report by category.

### 2f. `packages/cognitive-runtime`

The agentic execution runtime: `orchestrator.ts` drives the Reason → Retrieve → ToolCall → Verify → Decide cycle. Includes drift detection, consensus quorum, counterfactual engine, approval interrupt, and checkpoint/replay (Postgres-backed). This is the execution substrate used by workcells.

### 2g. `packages/memory-fabric`

Scoped memory per agent/session with configurable retention, a Postgres-backed store, and exported `MemoryFabric` type. Supports write/read/prune operations. Does not yet have cross-agent memory sharing or semantic retrieval beyond exact-scope lookup.

### 2h. `packages/agents-core`

Agent runner, retry, dead-letter, step I/O store, step logger, approval gate, hooks, and multi-agent orchestration (`orchestration.ts` — chainAgents, evaluatorLoop, fan-out). The orchestration module supports parallel fan-out but not yet declarative graph topology.

### 2i. `packages/ai-control-plane`

Provider-agnostic model routing for OpenAI-compatible, Anthropic-compatible, local/self-hosted, NIM, and Substrate endpoints. Eval-aware model selection (`eval-selector.ts`), fallback chains, cost controls, PII redaction, and a policy engine enforcing agent-tier constraints (assistant / analyst / operator / autonomous). This is a higher-level wrapper over the low-level `lib/ai-engine` routing — the two serve different call sites and overlap partially.

### 2j. `lib/intelligence-feeds` / `packages/ontology` / `packages/eval-os`

Note on naming: `lib/eval-os` contains a README describing the evaluation system; the active implementation lives in `packages/eval-os`. `lib/ontology` is deprecated; the canonical implementation is `packages/ontology`. `lib/intelligence-feeds` is the active location (no packages/ mirror).

**Intelligence Feeds** (`lib/intelligence-feeds`): Four OSINT adapters (AIS vessel positions, legal records, OFAC/UN sanctions, STIX/TAXII threat intelligence), a `FusionEngine` that correlates patterns and emits `FusionAlert` objects, and a `FeedScheduler` for polling on intervals.

**Ontology** (`packages/ontology`): Single source of truth for entity, signal, and evidence definitions. Exports `SignalSchema`, `EntitySnapshotSchema`, `ProvenanceSchema`, `SignalSourceSchema`; the `EntityRegistry`; signal construction helpers (`createSignal`, `fromAtlasEvent`); and pipeline stage definitions.

### 2j. `packages/covenant-policy` + `packages/proof-chain`

**Covenant Policy**: Policy-as-code enforcement layer. Gates every consequential action against declared constraints before dispatch.

**Proof Chain**: Cryptographic audit trail. Every proof packet links actor, policy envelope (covenant), data inputs, model, and outcome in an append-only record. The `SubstrateJournal` in `packages/substrate` contributes bundle hashes.

### 2k. `packages/mcp-client`

An MCP client that connects to external MCP servers. The platform is already an MCP *consumer*; there is no current production MCP *server* exposing A11oy tools to external agents.

### 2l. What is Intentionally Missing

The baseline review revealed several deliberate gaps relative to the ecosystem scan:

- No **streaming eval feedback** — evals run to completion; there is no incremental result stream.
- No **OTel-native trace export** — telemetry is captured internally but not yet emitted as OTLP spans.
- No **MCP server** — the platform consumes MCP servers but does not expose one, meaning no external agent can invoke A11oy tools via the MCP protocol.
- No **declarative agent graph topology** — agent orchestration is imperative (chain/fan-out functions), not a graph with conditional edges and cycles as in LangGraph.
- No **first-class structured output contracts** — tool responses use Zod at call sites but there is no platform-wide schema registry for tool input/output shapes, meaning cross-agent schema mismatches are caught only at runtime.
- No **eval dataset versioning with provenance** — golden-set cases exist but have no versioned snapshot history or contribution attribution.
- No **cost anomaly alerting** — budget manager tracks spend but does not proactively alert when a model or lane exceeds a cost-rate threshold.
- No **MCP server registry with discovery** — tool discovery requires knowing tool IDs in advance; there is no runtime server advertisement.

---

## 3. Pattern Catalog

For each candidate pattern: a description in our own terms, observed sources, comparison to what we already have, and a fit verdict.

---

### P-01: Unified Provider Facade with Streaming Normalization

**What it is.** The Vercel AI SDK and LiteLLM both implement the same core idea: wrap every LLM provider behind a single call surface that normalizes streaming, tool-call deltas, finish reasons, and usage metadata. The caller never imports a provider SDK directly; it imports the facade and names a model string. Streaming is always a first-class return value (an async iterable or ReadableStream), not an afterthought. The facade handles retries, timeout, and provider-specific quirks internally.

What makes this pattern substantive is not the abstraction itself (every platform has one) but the *streaming normalization* — tool-call chunks arrive in provider-specific formats (OpenAI emits partial JSON per delta; Anthropic emits `input_json_delta` events separately from `text_delta`). A proper facade merges these into a single typed event stream so callers write streaming-aware code once.

**Observed in:** Vercel AI SDK v4 (`@ai-sdk/provider` interface + provider packages), LiteLLM proxy (provider-agnostic `/chat/completions` endpoint), OpenRouter (single endpoint across 200+ models).

**What's novel vs. what we already do.** `lib/ai-engine` already has provider-specific clients (`providers/anthropic`, `providers/openai`, `providers/gemini`) and the model router dispatches to them. However, streaming is handled differently per provider and the tool-call delta merge is partial. The key gap is that our streaming path is not normalized at the provider-facade level — it is normalized downstream in specific route handlers. Callers outside `api-server` (e.g., `packages/substrate`) cannot easily consume streamed completions.

**Fit verdict.** Strong fit. Low risk. Directly improves substrate workflows and future mobile streaming.

---

### P-02: Declarative Agent Graph with Conditional Edges

**What it is.** LangGraph represents an agent's execution as a directed graph where nodes are computation steps (tool calls, LLM calls, sub-agent invocations) and edges carry state. Edges can be conditional: the graph inspects the current state and chooses the next node at runtime. Cycles are explicit — an agent can loop back to a previous node (e.g., "refine then re-evaluate") without the orchestrator needing to hard-code a loop counter. State flows through the graph as a typed object that any node can read and write. Graph compilation produces an execution plan that can be serialized, replayed, and visualized.

The meaningful differentiator over imperative orchestration is auditability: because the graph is a first-class object, tooling can replay any execution from any checkpoint simply by rewinding state and re-entering at a node.

**Observed in:** LangGraph (Python + JS), OpenAI Agents SDK (handoff graph), Restack (workflow-as-graph with durable execution).

**What's novel vs. what we already do.** `packages/agents-core` supports `chainAgents` and `evaluatorLoop` — both imperative. The `packages/cognitive-runtime` implements a fixed Reason → Retrieve → ToolCall → Verify → Decide cycle with hard-coded phase progression. There is no mechanism to define a custom topology, add conditional edges, or allow cycles. The checkpoint/replay in `cognitive-runtime` snapshots phases but cannot replay from an arbitrary mid-graph state.

**Fit verdict.** Strong fit for complex multi-step workcells where the decision path varies at runtime. Medium effort — requires a graph compiler and state-passing convention on top of existing phases.

---

### P-03: Durable Execution with Event-Driven Step Isolation

**What it is.** Temporal and Inngest both treat agent steps as durable activities: each step is persisted before it runs, and if the process crashes mid-execution, the runtime replays only the incomplete steps from the last checkpoint. State is not held in memory — it is journaled to a store (Temporal: Temporal service; Inngest: Inngest Cloud or self-hosted). This makes long-running agents (hours, days) possible without managing crash recovery manually.

The ergonomic benefit: agent authors write sequential TypeScript functions; the framework inserts durability transparently. Retries, timeouts, and step-level idempotency keys are declared as annotations on steps, not threaded through application logic.

**Observed in:** Temporal TypeScript SDK, Inngest (SSPL — patterns only), Restack (Apache-2.0, built on Temporal internally).

**What's novel vs. what we already do.** `packages/cognitive-runtime` has Postgres-backed checkpointing and can resume after a failure if the caller re-invokes with the same `correlationId`. This is manual durability — the caller must handle re-invocation. There is no transparent replay, no step-level idempotency, and no support for workflows that span days. The `packages/substrate` compile + sign step produces a bundle but does not journal execution state mid-flight.

**Fit verdict.** Strong fit for the workcell engine evolution (Phase 2). Large effort — the design decision is whether to embed Temporal's open-source server or build a lighter journal protocol on top of our existing Postgres infrastructure.

---

### P-04: MCP Server Registry with Runtime Discovery

**What it is.** The MCP ecosystem is developing a convention where an MCP server advertises its available tools, resource types, and prompt templates via a structured manifest that clients can fetch at connection time. A registry (centralized or distributed) maps server names to endpoints so clients can discover and connect to servers without hardcoded configuration. The MCP TypeScript SDK provides the server-side primitives (`McpServer`, `tool()`, `resource()`, `prompt()`) that make building a compliant MCP server straightforward.

The pattern is that any agent, IDE, or external system that speaks MCP can invoke your tools through a standard protocol — removing the need for bespoke integrations with each consumer.

**Observed in:** MCP spec (2025-11-05), MCP TypeScript SDK 1.11, Anthropic-curated server list (100+ production servers as of May 2026), FastMCP.

**What's novel vs. what we already do.** The platform is already an MCP *consumer* (`packages/mcp-client`). It is not an MCP *server*. Any external system wanting to invoke A11oy tools — a partner IDE, a third-party agent, an Anthropic Claude instance — must use our proprietary REST/GraphQL API. An A11oy MCP server would expose governed tools (with covenant policy gates and proof-chain logging) to any MCP-speaking client.

**Fit verdict.** Strong fit and strategically differentiating. The Pillpintu partner program already builds external trust relationships; an A11oy MCP server makes those relationships programmable. Low-to-medium effort — the tools already exist; the work is wrapping them in the MCP protocol with appropriate governance.

---

### P-05: Structured Output Contracts with Schema-First Tool Definitions

**What it is.** BAML, Pydantic AI, and Instructor all invert the typical prompt-engineering flow: instead of writing a free-text prompt and hoping the model returns JSON, you define the *output type first* (a Pydantic model, a BAML `class`, a Zod schema) and the library generates the prompt machinery to produce a guaranteed-parseable result. The key innovation is that the contract is *testable* — you can assert that a model reliably returns a schema-conformant result across a test suite, and you version the schema alongside the prompt.

For tool definitions, BAML goes further: it allows you to declare a tool's input and output schema in a DSL, then generate both the JSON Schema sent to the model and the TypeScript types the caller uses, from the same source of truth.

**Observed in:** BAML 0.73 (Apache-2.0), Pydantic AI 0.2.x (MIT), Instructor 1.7.x (MIT), `zod-to-json-schema`.

**What's novel vs. what we already do.** The platform already uses Zod schemas extensively at route and tool call sites. However, there is no *schema registry* — the same tool's input/output shape may be declared independently in `packages/tool-registry`, in `lib/ai-engine/src/mcp-apps/`, and in API route validators. Cross-agent schema mismatches are caught at runtime, not at build time. There is no generated documentation or test harness derived from the tool contracts.

**Fit verdict.** Medium fit. The pattern would significantly reduce the schema drift problem visible across 80+ route files (the existing API error envelope migration task is a symptom of this). Medium effort — requires a canonical schema registry and tooling to derive prompt machinery and TypeScript types from it.

---

### P-06: Eval-Driven Prompt Iteration (Red-Green-Refactor for Prompts)

**What it is.** Promptfoo formalizes a loop that most teams do informally: write a prompt, run it against a test matrix (model × input × expected output), see which combinations pass/fail, tune the prompt, repeat. The test matrix is declarative YAML; results are a structured report with per-combination pass/fail, latency, cost, and diff view. Promptfoo also supports "red-teaming" by running adversarial prompt injections across the matrix to check for safety regressions.

Braintrust extends this with production logging: every live completion is optionally logged and scored against the same eval set, so the eval suite is always measuring real distribution, not synthetic fixtures.

**Observed in:** Promptfoo 0.91, Braintrust (cloud, patterns only), Inspect AI 0.3.x (UK AISI — MIT).

**What's novel vs. what we already do.** `packages/eval-os` provides a Domain-Jury Evaluator that scores recommendations on five dimensions. `lib/ai-engine/src/evals/run-evals.ts` runs golden-set cases and produces a pass-rate report. What we do not have is a *prompt-iteration loop* — a system where a prompt author can rapidly test the same prompt against a matrix of models, see failures as a diff, and iterate before committing. The golden set is a static corpus; it does not grow from production data automatically.

**Fit verdict.** Strong fit. Directly accelerates the `packages/prompt-registry` investment. Low-to-medium effort — can be built as a CLI wrapper over existing eval infrastructure.

---

### P-07: OTel-Native AI Trace Export

**What it is.** The OpenTelemetry GenAI Semantic Conventions (SIG, 2025-2026) define a standard schema for AI spans: `gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.prompt_tokens`, `gen_ai.usage.completion_tokens`, `gen_ai.response.finish_reason`, plus event types for streamed chunks, tool calls, and tool responses. Any OTLP-compatible backend (Langfuse self-hosted, Grafana, Honeycomb, Datadog) can ingest these spans without custom adapters.

Langfuse and Braintrust both implement OTLP ingestion and provide AI-specific views (prompt → completion trees, cost aggregations, latency p50/p95/p99, eval scores overlaid on traces).

**Observed in:** OTel GenAI Semantic Conventions v0.10, Langfuse 3.x (MIT self-host), OpenAI SDK (emits OTel spans natively since v1.50).

**What's novel vs. what we already do.** `lib/ai-engine/src/observability/behavioral-tracer.ts` and `lib/ai-engine/src/innovation/telemetry-pipeline.ts` capture internal telemetry. The `ModelRouterTelemetry` object is rich (latency, cost, tokens, passport, strategy). However, none of this is emitted as OTLP. External observability tooling cannot see our AI calls without a custom integration. The `packages/cognitive-observability` package suggests this is a known gap.

**Fit verdict.** Strong fit. Enterprise buyers increasingly require OTLP-compatible traces as a procurement requirement. Small-to-medium effort — the telemetry data already exists; the work is adding an OTLP exporter and mapping `ModelRouterTelemetry` fields to GenAI conventions.

---

### P-08: Policy-as-Code with Structural Verification (OPA / Cedar Patterns)

**What it is.** Open Policy Agent (Rego) and Cedar both compile policies to a verifiable artifact: given a request context, the policy engine produces a decision deterministically and can also *enumerate* all requests that would be denied, or diff two policy versions to show exactly what changes. Cedar adds type-checking — a policy that references an undefined attribute is a compile error, not a runtime surprise. Both support off-policy reasoning ("what would change if we lowered this threshold?").

The pattern in agent governance is to express covenant constraints as structured, versionable policy artifacts that can be audited by external reviewers — not as imperative code that must be read end-to-end to understand its behavior.

**Observed in:** OPA 0.68 (Apache-2.0), Cedar 4.x (Apache-2.0), Anthropic Constitutional AI (research), prior research sweep (`KHIPU_RESEARCH_SWEEP.md §5`).

**What's novel vs. what we already do.** `packages/covenant-policy` enforces constraints at runtime and is already integrated into the PCE gate. The Khipu Constitution DSL is in development. What we do not yet have is *structural verification*: the ability to statically analyze a covenant policy document and prove that a class of requests will always be denied, or that two policy versions are equivalent in a given domain. We also do not have a diff view between policy versions that is machine-checkable rather than human-readable prose.

**Fit verdict.** Medium fit. The structural verification property matters most to regulated enterprise buyers (financial, defense) who need independent auditors to verify policy correctness without running the system. Medium effort — integrating Cedar's verifier or OPA's rego-eval tool against our covenant schema.

---

### P-09: Semantic Memory with Episodic Retrieval

**What it is.** Multiple agent runtimes (Mastra patterns, mem0 — Apache-2.0, MemGPT patterns) distinguish between working memory (the active context window), episodic memory (a timestamped record of past interactions), and semantic memory (a distilled, deduplicated knowledge graph extracted from episodes). Retrieval from semantic memory is embedding-based: given the current query, retrieve the K most relevant facts, ordered by recency-weighted similarity.

The key pattern is automatic episodic → semantic distillation: after each session, the system extracts durable facts (entity relationships, preferences, outcomes) from the episodic record and writes them into a semantic store. Future queries retrieve from the semantic store, not the raw episodic log — keeping retrieval latency constant as the history grows.

**Observed in:** mem0 (Apache-2.0), MemGPT research patterns, Mastra memory module (EL2 — patterns only), Langfuse memory traces.

**What's novel vs. what we already do.** `packages/memory-fabric` provides scoped memory with Postgres persistence and retention. `lib/ai-engine/src/memory/rl-memory.ts` provides RL-style memory for agent learning. `lib/ai-engine/src/karpathy/self-distilling-kb.ts` provides a self-distilling knowledge base. However, these components are not connected into the episodic → semantic pipeline described above. Cross-agent memory sharing (one domain's agents learning from another domain's outcomes) is noted as a planned feature in `a11oy-1-adaptive-intelligence.md` (Pillar 4 — Cross-Domain Intelligence Transfer) but is not yet implemented.

**Fit verdict.** Strong fit. Directly enables the a11oy.1 Cross-Domain Intelligence Transfer pillar. Medium effort — the building blocks exist; the work is the distillation pipeline and embedding-based retrieval.

---

### P-10: Agent Identity & Signed Capability Attestation

**What it is.** The emerging A2A (Agent-to-Agent) protocol (Google, May 2025; Apache-2.0) specifies that each agent exposes an *Agent Card* — a JSON document describing its capabilities, supported input/output modalities, authentication requirements, and a public key for verifying that messages from this agent are genuine. When agent A delegates a task to agent B, A signs its delegation request with its private key. B can verify that the delegation is genuine and from an authorized source before executing.

This pattern moves agent identity from "trust the caller because they're inside our system" to "verify the caller's signed credential before accepting any task."

**Observed in:** Google A2A Protocol spec (Apache-2.0), Microsoft AutoGen patterns (MIT), OpenAI Agents SDK handoff spec.

**What's novel vs. what we already do.** `lib/ai-engine/src/a2a/` has an A2A delegation module and agent registry. The Model Passport system signs routing decisions with Ed25519. However, there is no *agent capability attestation* — no Agent Card format that external systems can fetch to discover what a specific A11oy agent can do, what its governance constraints are, and how to verify its messages. This is distinct from the existing proof-chain, which records what an agent *did*, not what it is *authorized to do*.

**Fit verdict.** Strong fit, especially for the Pillpintu partner ecosystem where external agents need to interact with A11oy agents under a trust model. Low-to-medium effort — the identity infrastructure (Model Passport, Ed25519) already exists; the work is the Agent Card format and discovery endpoint.

---

### P-11: Cost-Aware Batching and Async Inference Routing

**What it is.** AWS Bedrock Batch Inference, vLLM's continuous batching, and LiteLLM's routing logic all expose a pattern: for work that is not latency-sensitive (background classification, eval runs, report generation), requests should be queued and batched to maximize GPU utilization or to use cheaper batch-inference pricing tiers (AWS Bedrock Batch is typically 50% the cost of on-demand). The routing decision — real-time vs. async batch — is made at call time based on declared SLA, cost budget, and current queue depth.

A related pattern is *tiered inference*: expensive frontier models are only used when simpler models cannot meet a confidence threshold, and the confidence check itself uses a cheap model.

**Observed in:** AWS Bedrock Batch (Converse API patterns), vLLM production deployment guides, LiteLLM router documentation.

**What's novel vs. what we already do.** The model router has a `background_batch` lane class and a cost-performance router (`src/cost-performance-router.ts`). However, actual batch submission (collecting requests into a batch, submitting async, polling results) is not implemented — the `background_batch` lane class dispatches to a provider synchronously like any other lane. The cost-performance router selects cheaper models for lower-stakes calls but does not defer execution asynchronously.

**Fit verdict.** Medium fit. Most A11oy operations are interactive/near-real-time. The batch pattern is most valuable for the eval pipeline (running golden-set cases overnight), the outcome learning flywheel (bulk trajectory processing), and report generation (executive briefs). Medium effort.

---

### P-12: Prompt Caching and Semantic Deduplication

**What it is.** Anthropic's prompt caching (Cache Control headers), OpenAI's prompt caching (automatic on long context), and projects like GPTCache/Semantic Cache implement a two-layer approach: (1) exact-match caching on repeated prefix tokens at the provider level, and (2) embedding-based semantic similarity matching on the query to return a cached result when the user is asking the same question in slightly different words.

The ergonomic insight is that in an enterprise platform where many users ask domain-specific questions against the same data (e.g., "what are our active maritime sanctions exposures?"), semantic deduplication can dramatically reduce both latency and cost without the user noticing any change.

**Observed in:** Anthropic Cache Control (supported since Claude 3.5, 2024), OpenAI prompt caching (automatic), LangFuse semantic cache patterns, `gptcache` (MIT).

**What's novel vs. what we already do.** `lib/ai-engine/src/prompt-cache.ts` exists and provides a basic cache layer (`getCachedResponse`, `setCachedResponse`). The model router checks this cache before dispatching. However, the cache is exact-match only — there is no semantic similarity layer. Anthropic's Cache Control breakpoints (system prompt, long tool definitions) are not yet sent in our API requests, meaning we are not benefiting from provider-side prefix caching.

**Fit verdict.** Medium fit. High ROI for frequently repeated queries in production. Small effort for provider-side cache control headers; medium effort for semantic deduplication.

---

### P-13: Eval-Gated Model Promotion (Canary → Production)

**What it is.** The pattern, practiced by Braintrust and Inspect AI and implicit in the OpenAI Evals framework, treats model upgrades like software releases: a new model or prompt version enters a canary tier, runs against the eval suite, and is only promoted to the production routing table if it meets a pass-rate threshold across all critical categories. Any regression — even a small one in a non-primary category — blocks promotion and triggers a human review request.

Inspect AI extends this to *task-based evaluation*: rather than just running a golden set, the model is given open-ended tasks (e.g., "complete a 10-step research task") and scored on end-to-end task completion rate and alignment quality.

**Observed in:** Inspect AI (UK AI Safety Institute, MIT), OpenAI Evals framework (MIT), Braintrust (cloud, patterns only).

**What's novel vs. what we already do.** `packages/prompt-registry` has a status lifecycle (`draft → canary → active → deprecated`) and `packages/ai-control-plane` has eval-aware model selection. However, the promotion gate is manual — no system automatically blocks a model from entering the `active` state if its eval scores fall below threshold. There is no end-to-end task completion scoring (Inspect AI style), only field-level assertions on structured outputs.

**Fit verdict.** Strong fit. This directly upgrades the existing prompt-registry canary system into something automated and trustworthy. Low-to-medium effort.

---

### P-14: Compliance-as-Evidence (Continuous Audit Readiness)

**What it is.** NIST AI RMF 1.1 and the EU AI Act's Annex IV both require that a high-risk AI system maintain *contemporaneous* evidence of its governance activities: risk assessments, monitoring logs, human oversight records, and incident response documentation. The pattern is to generate this evidence automatically at runtime — each workcell completion produces a structured evidence artifact (who invoked it, which policy governed it, what the outcome was, was a human in the loop) rather than relying on quarterly audit reconstruction.

The practical implication is that the audit package is always current: pressing "export audit package" produces a complete, timestamped evidence bundle that maps directly to EU AI Act Annex IV fields and NIST GOVERN/MEASURE categories.

**Observed in:** NIST AI RMF 1.1 (GOVERN 1.1–6.2, MEASURE 2.5, MANAGE 4.1), EU AI Act Annex IV, ISO/IEC 42001 Annex A.6-A.10, A11oy's existing Compliance Fabric (Layer 9) — CARE, Compass, Agent-BOM.

**What's novel vs. what we already do.** A11oy's Layer 9 Compliance Fabric already includes Compass (real-time compliance posture), Agent-BOM (CycloneDX ML-BOM), Delegation Chain, Trust Exchange, and CARE (Continuous Audit Readiness Engine). Among the scanned sources, no other system combines all five of these primitives in a single runtime layer. The gap is that the underlying proof-chain records do not yet map their fields to specific NIST RMF or EU AI Act control IDs, so the export package requires manual cross-referencing. Auto-mapping would reduce audit preparation from weeks to minutes.

**Fit verdict.** Medium fit — largely already covered. Incremental improvement would close the mapping gap. Small effort.

---

## 4. Adoption Matrix

Each pattern is scored on six dimensions. Strategic Fit: 1 (low) to 5 (high). Effort: S (days), M (weeks), L (month), XL (quarter+). Risk: Low / Medium / High. License Posture: Green (permissive), Yellow (review needed), Red (excluded). A11oy Orchestration Touchpoints: which A11oy operator surfaces would expose or govern the capability. Consuming Artifacts: which existing artifacts would benefit.

| # | Pattern | Strategic Fit | Effort | Risk | License | A11oy Surfaces | Consuming Artifacts |
|:--|:--------|:-------------|:-------|:-----|:--------|:---------------|:--------------------|
| P-01 | Unified provider facade + streaming normalization | 5 | M | Low | Green | AI Gateway, Model Router | All artifacts via api-server |
| P-02 | Declarative agent graph with conditional edges | 4 | L | Medium | Green | Workcells, Agent Orchestration | A11oy workcells, all domain packs |
| P-03 | Durable execution (Temporal-style step isolation) | 4 | XL | Medium | Green (Temporal SDK) | Workcells, Control Tower | All domain packs with long-horizon tasks |
| P-04 | MCP server with governed tool exposure | 5 | M | Low | Green | AI Gateway, SkillsLibrary, Pillpintu | External agents, partner integrations |
| P-05 | Structured output contracts + schema registry | 4 | M | Low | Green | Lab / PromptRegistry, AI Gateway | All artifacts via api-server |
| P-06 | Eval-driven prompt iteration loop | 4 | M | Low | Green | EvalConsole, MirrorEval, Lab | A11oy, all domain packs |
| P-07 | OTel-native AI trace export | 4 | S | Low | Green | Control Tower, Compass | A11oy ops, enterprise buyers |
| P-08 | Policy-as-code structural verification | 3 | M | Low | Green | Constitution, Covenant policies, Pillpintu | A11oy governance, regulated buyers |
| P-09 | Semantic memory with episodic retrieval | 4 | M | Low | Green | Memory (fabric), AgentMesh | All domain agents |
| P-10 | Agent identity + signed capability attestation | 4 | M | Low | Green | AgentBom, Pillpintu, A2AInterop | Partner agents, external MCP clients |
| P-11 | Cost-aware async batch routing | 3 | M | Low | Green | CostAwareMonitoring, AI Gateway | Eval pipeline, report generation |
| P-12 | Prompt caching + semantic deduplication | 3 | S | Low | Green | Model Router, AI Gateway | All artifacts (cost reduction) |
| P-13 | Eval-gated model promotion | 4 | M | Low | Green | EvalConsole, NexusEvalLayer, PromptRegistry | All artifacts using model router |
| P-14 | Compliance-as-evidence (control ID mapping) | 3 | S | Low | Green | Compass, CARE Engine, Agent-BOM | Regulated enterprise buyers |

---

## 5. Recommended Roadmap

Patterns are placed in four tiers: **Now** (do in the next sprint cycle), **Next** (next quarter), **Later** (future, after Next is shipped), **Pass** (not worth pursuing at this stage).

### Now — High-leverage, low-risk, directly unblocks existing work

**P-04: MCP Server with Governed Tool Exposure**
A11oy becoming an MCP server is the single highest-leverage move available. The Pillpintu partner ecosystem, the Nexus marketplace, and any future A11oy SDK story all hinge on external systems being able to invoke governed A11oy tools through a standard protocol. The infrastructure is ready: tools are defined in `packages/tool-registry`, covenant policies gate them, and the proof chain logs every invocation. The work is wrapping them in the MCP server protocol. This directly extends the existing `packages/mcp-client` investment into a bidirectional protocol relationship.

**P-07: OTel-Native AI Trace Export**
The `ModelRouterTelemetry` struct is already rich. Emitting it as OTLP spans with GenAI semantic conventions requires a small exporter module — a few hundred lines. The payoff is immediate: enterprise buyers and internal operators gain a vendor-neutral observability stream. This feeds into Compass (Layer 9 compliance posture) and makes the Control Tower's live mesh verifiable by external tools. Treat this as infrastructure plumbing, not a feature.

**P-12: Prompt Caching + Provider-Side Cache Control Headers**
The exact-match prompt cache already exists (`src/prompt-cache.ts`). Adding Anthropic Cache Control breakpoints to our system prompt and long tool definition blocks is a small code change with measurable cost impact. This should be instrumented in `ModelRouterTelemetry` (add `promptCacheHit: boolean` and `promptCacheTokensSaved: number`) so the savings are visible in Compass.

**P-13: Eval-Gated Model Promotion**
The `packages/prompt-registry` canary lifecycle and `packages/ai-control-plane` eval-aware selection are both in place. Adding an automated gate that runs the eval suite against a canary model before setting `status: 'active'` closes the loop. This is the a11oy.1 "self-improving eval pipeline" precondition — you cannot auto-grow the golden set usefully until the golden set gates promotion.

### Next — Important, medium effort, plan and design this quarter

**P-01: Unified Provider Facade with Streaming Normalization**
The current provider split (`providers/anthropic`, `providers/openai`, `providers/gemini`) is manageable with five providers but will become painful as the substrate edge inference (Voxtral, Qwen3, Llama) expands. Streaming normalization is the specific gap — the substrate's workflow engine and future mobile surfaces need a single typed event stream. Design the facade in `lib/ai-engine/src/providers/` and migrate providers one at a time. This is prerequisite infrastructure for P-02 (graph runtime) and P-03 (durable execution), which need clean streaming semantics.

**P-05: Structured Output Contracts + Schema Registry**
The API error envelope migration (80+ route files, existing task) is a symptom of schema drift. A canonical tool schema registry — where each tool's input/output shape is declared once and TypeScript types, JSON Schema for model calls, and OpenAPI spec are all derived from it — would prevent this problem from recurring. This does not require BAML or Pydantic AI; it can be a thin Zod → JSON Schema → OpenAPI pipeline over `packages/tool-registry`. Priority: do this before adding more tools.

**P-06: Eval-Driven Prompt Iteration Loop**
Once P-13 (eval-gated promotion) is live, a prompt-iteration CLI (`packages/prompt-registry` extended with a `test` command) would let domain authors run their prompts against the golden set matrix locally before pushing. The matrix should include model × input × expected output combinations, producing a structured pass/fail diff. This accelerates domain pack development and reduces the golden-set contribution burden on platform engineers.

**P-09: Semantic Memory with Episodic Retrieval**
The building blocks (`memory-fabric`, `self-distilling-kb`, `rl-memory`) are in place. The missing pipeline is: (1) at workcell completion, extract structured facts from the agent's reasoning trace; (2) write facts to the semantic store with entity tags; (3) at workcell start, retrieve top-K relevant facts by embedding similarity. This directly enables a11oy.1 Pillar 4 (Cross-Domain Intelligence Transfer) and would make the Nuro Mesh agents demonstrably smarter across domains over time.

**P-10: Agent Identity + Signed Capability Attestation**
The Model Passport (Ed25519, signed routing decisions) and `lib/ai-engine/src/a2a/` form most of the foundation. The missing artifact is the Agent Card — a discoverable JSON document per A11oy agent that declares its capabilities, autonomy tier, covenant constraints, and verification key. This is low risk because it adds a read-only discovery endpoint; it does not change execution behavior. Priority: design the Agent Card schema to align with Google A2A spec so external agents can interoperate without a custom bridge.

### Later — Valuable, high effort, do after Next tier is solid

**P-02: Declarative Agent Graph with Conditional Edges**
This is the right long-term architecture for complex workcells, but it requires re-thinking how the cognitive-runtime's fixed phase sequence is expressed. Design this carefully: a poorly designed graph system will make debugging harder, not easier. The dependency is P-01 (clean streaming facade) and P-03 (durable execution checkpoint model). Do not rush this — the imperative chain/fan-out is serviceable for Phase 2.

**P-03: Durable Execution with Event-Driven Step Isolation**
Long-horizon agents (multi-hour regulatory workflows, overnight evaluation sweeps, multi-day deal diligence) require true step isolation with transparent replay. The decision is Temporal vs. a bespoke journal on Postgres. Temporal's MIT SDK is appealing but the server-side licensing (BSL 1.1 for self-hosted) requires legal review before commitment. Restack (Apache-2.0, Temporal-based) is an alternative worth evaluating. Either way, this is an XL effort that should be scoped after the Phase 2 workcell engine is operating.

**P-08: Policy-as-Code Structural Verification**
Cedar's type-checker and OPA's `rego-eval` can statically verify that a covenant policy document is internally consistent and matches its declared intent. The payoff is strongest for regulated buyers (financial, defense) who need external auditors to verify governance without running the system. Medium effort, medium business case — do this when the first regulated enterprise pilot is under negotiation.

**P-11: Cost-Aware Async Batch Routing**
True async batch (collect → submit → poll → return) is valuable for overnight eval runs and bulk outcome-learning flywheel passes. The effort is non-trivial (queue management, result polling, webhook callbacks). The ROI calculation: if 30% of eval runs could be batched at 50% lower cost, the savings on a mid-scale deployment are meaningful but not critical for early-stage. Revisit when monthly AI spend crosses $20K.

### Pass — Not worth pursuing at this stage

**Mastra** (EL2 license): Patterns are interesting (workflow DAG, memory modules) but the Elastic License 2.0 prevents offering Mastra-based capabilities as a service, which is A11oy's entire business model. Individual pattern inspiration is already captured in P-01, P-02, P-09.

**Inngest** (SSPL): Same issue as Mastra — the Server Side Public License explicitly restricts offering the software as a hosted service. The durable execution pattern is better pursued via Temporal (MIT SDK).

**Full BAML adoption**: BAML's compiler is impressive but adds a non-TypeScript DSL to the toolchain. The structured output benefit is achievable with Zod + JSON Schema generation (P-05) without the DSL complexity. Revisit if the team finds the Zod approach insufficient.

---

## 6. Proposed Shared-Library Shape (Now Tier)

For each "Now" pattern, the following sketches where it would live in the monorepo, what its exported surface would look like conceptually, and which A11oy operator surfaces would expose or govern it. No signatures are locked in — this is directional planning input for the next sprint.

### 6a. P-04: MCP Server — `packages/mcp-server`

**Target package**: New package `packages/mcp-server` alongside the existing `packages/mcp-client`.

**Conceptual surface:**
```
// packages/mcp-server/src/index.ts (conceptual)
export { A11oyMcpServer } from './server.js'
export { registerGovernedTool } from './governed-tool.js'
export { registerGovernedResource } from './governed-resource.js'
export type { GovernedToolOptions, GovernedResourceOptions } from './types.js'
```

A `GovernedTool` wraps a `ToolDefinition` from `packages/tool-registry` and enforces: (1) covenant policy check before execution, (2) proof-chain write after execution, (3) telemetry emission via `ModelRouterTelemetry` shape, (4) rate limiting per caller identity. The server exposes a standard MCP transport (stdio for local, HTTP+SSE for remote). Tool names are prefixed with a domain namespace (e.g., `a11oy.signal.query`, `a11oy.action.recommend`, `a11oy.proof.verify`).

**A11oy operator surfaces:**
- **AI Gateway** page (`/a11oy/ai-gateway`): shows connected MCP clients and governed tool call log.
- **SkillsLibrary** page (`/a11oy/skills`): exposed tools surfaced as browsable skills with their covenant constraints visible.
- **Pillpintu** partner program: partner agents connect via MCP; their calls are logged with partner identity and show in the CAVD audit trail.

**Consuming artifacts**: Any external agent, IDE, or automation that speaks MCP. Internal: `packages/agents-core` could use the MCP server to invoke cross-artifact tools without hardcoded API calls.

---

### 6b. P-07: OTel AI Trace Export — `packages/otel-ai-exporter`

**Target package**: New package `packages/otel-ai-exporter` — a thin adapter over the existing `@opentelemetry/api` and `@opentelemetry/exporter-trace-otlp-http` packages.

**Conceptual surface:**
```
// packages/otel-ai-exporter/src/index.ts (conceptual)
export { installGenAiExporter } from './exporter.js'
export { telemetryToSpan } from './span-mapper.js'
export type { GenAiExporterConfig } from './types.js'
```

`installGenAiExporter(config)` is called once at `api-server` boot and registers a handler via `registerTelemetryHandler` (already in `lib/ai-engine/src/model-router.ts`). The handler maps `ModelRouterTelemetry` fields to OTel GenAI semantic conventions and exports each inference call as a span to the configured OTLP endpoint. The span includes: system (`gen_ai.system`), model, prompt/completion token counts, latency, cost estimate, and SZL-specific attributes (`szl.passport_id`, `szl.proof_chain_entry`, `szl.tenant_id`, `szl.pack_slug`).

**A11oy operator surfaces:**
- **Control Tower** (`/a11oy/control-tower`): links each workcell run to its OTel trace ID so operators can open the full trace in their OTLP backend.
- **Compass** (`/a11oy/compass`): shows real-time AI call volume, cost rate, and latency percentiles derived from the OTel pipeline (via a local aggregation layer if no external backend is configured).

**Consuming artifacts**: All artifacts that route AI calls through `api-server` gain trace export automatically. No per-artifact change required.

---

### 6c. P-12: Prompt Caching — `lib/ai-engine` extension (no new package)

**Target**: Extend `lib/ai-engine/src/prompt-cache.ts` and provider client wrappers.

**Conceptual surface (additions):**
```
// Additions to ModelRouterTelemetry (lib/ai-engine/src/model-router.ts)
promptCacheHit: boolean
promptCacheTokensSaved: number
promptCacheWriteTokens: number

// New function in providers/anthropic/
function buildCacheControlledMessages(
  systemPrompt: string,
  conversationHistory: HFChatMessage[],
  toolDefinitions: HFToolDef[]
): { messages: AnthropicMessage[]; cacheControl: CacheControlSpec }
```

The `buildCacheControlledMessages` helper places Anthropic `cache_control: { type: 'ephemeral' }` markers at the system prompt boundary and at the end of the tool definitions block — the two highest-value cache breakpoints. Token savings are passed through to `ModelRouterTelemetry` and surfaced in Compass.

**A11oy operator surfaces:**
- **CostAwareMonitoring** page: shows prompt cache hit rate and estimated monthly savings.
- **Compass**: cost efficiency dimension gains a "cache utilization" sub-metric.

---

### 6d. P-13: Eval-Gated Model Promotion — `packages/prompt-registry` + `packages/ai-control-plane` extensions

**Target**: Extend existing packages; no new package needed.

**Conceptual surface (additions):**
```
// packages/prompt-registry/src/promotion-gate.ts (new file)
export async function runPromotionEval(
  promptVersionId: string,
  modelId: string,
  passThreshold: number  // e.g. 0.90
): Promise<PromotionEvalResult>

export interface PromotionEvalResult {
  passed: boolean
  passRate: number
  failedCategories: string[]
  blockingReason?: string
  reportUrl?: string
}

// packages/prompt-registry/src/registry.ts (extended)
// promote() now calls runPromotionEval() internally;
// throws PromotionBlockedError if below threshold
```

The `runPromotionEval` function runs the domain-relevant golden-set cases from `lib/ai-engine/src/evals/golden-set.ts` against the candidate model+prompt, collects results via the existing `run-evals.ts` logic, and returns a `PromotionEvalResult`. The promotion workflow: a human or CI job calls `registry.promote(versionId, modelId)` → gate runs → if passed, `status` transitions to `active`; if blocked, `status` stays at `canary` and the blocking reason is recorded.

**A11oy operator surfaces:**
- **NexusEvalLayer** (`/a11oy/nexus/eval-layer`): shows promotion eval history with pass/fail per category.
- **EvalConsoleNative** (`/a11oy/lab/eval-console`): allows triggering a promotion eval manually.

---

## 7. Open Questions for the Human

These are the decisions that cannot be resolved from the codebase alone. Each one should be settled before any of the corresponding "Now" or "Next" tier patterns become implementation tasks.

---

**Q1: Does the MCP server expose A11oy's production governance gates, or is it a sandboxed "read-only" surface initially?**

The safest initial design is read-only: external MCP clients can query signals, read proof-chain entries, and retrieve recommendations — but cannot trigger workcell execution or approve actions. A fully governed execution path (where an external agent can submit a task through an MCP call, have it pass through the covenant policy gate, and produce a proof-chain entry) is the right end-state but requires more design work on caller identity verification. Which scope should ship first?

---

**Q2: Temporal server vs. Postgres-native journal for durable execution (P-03)?**

Temporal's MIT SDK is appealing but the open-source server is now under BSL 1.1 (cannot offer as a hosted service). We could use the Temporal Cloud managed service (per-execution billing, adds an external dependency), Restack (Apache-2.0, wraps Temporal under the hood), or build a lighter durable step journal on our existing Postgres infrastructure. The Postgres path is more work but keeps the stack entirely under our control. Thoughts on dependency risk vs. build cost?

---

**Q3: Should we add AWS Bedrock as a fourth hosted provider lane alongside Anthropic, OpenAI, and Gemini?**

The scan found that AWS Bedrock's Converse API is a strong provider-gateway pattern and that several enterprise buyers in regulated industries (financial, defense, government) have mandatory AWS agreements and prefer Bedrock for data residency reasons. Adding Bedrock would require a new provider adapter in `lib/ai-engine/src/providers/` and Bedrock credentials management. It would not change the routing model — Bedrock endpoints would be first-class entries in the cost-per-token table and the passport system. Is this a priority for the next enterprise pilot conversation?

---

**Q4: Do we publish the Agent Card spec for A11oy agents as an open standard, or keep it proprietary?**

The Khipu Doctrine Open Spec (CC-BY-4.0) sets a precedent for open-sourcing governance primitives. An open Agent Card format for governed AI agents — extending Google's A2A Agent Card with covenant-constraint and proof-chain fields — could position SZL as a standards author in the governed AI space, similar to how Anthropic is the MCP spec author. The alternative is a proprietary format that maximizes control but may slow ecosystem adoption. This is partly a business/positioning decision.

---

**Q5: Should the semantic memory system (P-09) be a platform primitive in `packages/memory-fabric`, or a domain-specific capability built per domain pack?**

The cross-domain lesson transfer vision (a11oy.1 Pillar 4) requires platform-level memory — facts from a maritime workcell need to be retrievable by a legal workcell. But platform-level memory raises data isolation concerns (does a maritime insight about a specific vessel belong in the same retrieval pool as legal privilege-protected matter notes?). One architecture: memory is scoped to a trust boundary (e.g., org → vertical → agent), and cross-domain retrieval only surfaces facts at the org trust boundary. Another: all memory is siloed per agent by default, and cross-domain sharing is an explicit operator opt-in per lesson type. Which isolation model matches your enterprise security posture?

---

**Q6: Is the OTel OTLP endpoint an internal aggregator (e.g., a Grafana Alloy sidecar) or should tenants be able to bring their own OTLP endpoint?**

Enterprise buyers often have existing observability stacks (Datadog, Grafana, Honeycomb) and will want to ingest A11oy's AI traces into their own backend. This would mean the `otel-ai-exporter` sends to a per-tenant OTLP URL rather than a single platform-owned endpoint. The per-tenant model is more complex (secrets management per tenant, potential for exfiltration of inference metadata). The platform-only model is simpler but limits enterprise customization. Which model aligns with the Phase 3 multi-tenant deployment architecture?

---

**Q7: How should the eval-gated promotion system handle domain-specific golden sets that don't exist yet?**

Many domain packs (Vessels, Sentra, Carlota) do not yet have domain-specific golden-set cases — they rely on the generic cross-domain set in `lib/ai-engine/src/evals/golden-set.ts`. Promoting a maritime-specific prompt against generic eval cases may produce misleading pass rates. Options: (1) block promotion until a minimum number of domain-specific cases exist (e.g., 20 per category); (2) allow promotion with a disclaimer that domain eval coverage is below threshold; (3) auto-generate synthetic domain eval cases from the prompt's declared intent using a cheap model, then have a human approve the synthetic cases before they count. Which approach fits your quality bar?

---

*End of research document. This document is intended as a single-sitting read and planning input for the next sprint cycle. All recommendations are proposals — no implementation has been performed and no commitments have been made. Implementation tasks should be created by the human after reviewing this document and resolving the open questions above.*

---

*Reviewed: May 2026 · Next scheduled review: August 2026*
*Document classification: Internal / Platform Planning*
*Copyright © 2024–2026 SZL Holdings. All rights reserved.*
