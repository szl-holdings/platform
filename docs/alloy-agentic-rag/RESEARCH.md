# Alloy Agentic RAG — Research & Recommendations Dossier

> **Classification:** Internal — SZL Holdings Platform Team  
> **Date:** April 28, 2026  
> **Authors:** Alloy Platform Team  
> **Status:** Living document — updated with each major platform release

---

## Executive Summary

This dossier surveys the leading open-source Agentic RAG frameworks, traces what Alloy has adopted, where we deliberately diverged, and what we intend to build next. The guiding thesis: governed autonomy, cross-vertical memory federation, and evidence-grounded generation are the next frontier. Most open-source projects optimise for developer velocity; Alloy optimises for auditable, policy-gated production intelligence.

---

## Part 1 — Framework Survey

### 1.1 LangGraph (LangChain Inc.)

**What it does well:**
- Stateful, cyclic computation graphs for multi-agent orchestration.
- First-class human-in-the-loop interrupt nodes.
- Streaming and checkpointing built in.
- Strong community; LangSmith tracing integration.

**Where Alloy differs:**
- LangGraph graphs are runtime-constructed Python/JS objects with no schema enforcement at the boundary — Alloy enforces Zod-typed `AgenticRagRequest / AgenticRagResponse` contracts at every API surface.
- LangGraph's memory is optional and plug-in; Alloy mandates two named tiers (short-term working + long-term episodic/semantic) wired into every run by default.
- LangGraph has no built-in MCP class taxonomy; Alloy ships a canonical three-class model (LocalData / SearchEngine / CloudEngine) with typed capability descriptors.
- Alloy's Guardian Decision Engine applies policy-tier governance before any tool call; LangGraph delegates this entirely to the application layer.

**What we adopted:** Cyclic graph thinking, interrupt node concept (materialised as Alloy's `ApprovalGate`), streaming via SSE.

---

### 1.2 LlamaIndex (LlamaIndex Inc.)

**What it does well:**
- Best-in-class document ingestion pipeline (140+ connectors).
- Mature query pipeline API with composable sub-pipelines.
- Strong RAG primitives: query engines, retrievers, rerankers, synthesisers.
- Agent abstractions (ReAct, LATS, function-calling).

**Where Alloy differs:**
- LlamaIndex's retrieval is single-tenant by default; Alloy enforces tenant scope at the memory store and retrieval layers.
- LlamaIndex has no evidence ledger or policy guard; Alloy records every retrieved chunk and every tool call in an immutable ledger with cost tracking.
- LlamaIndex's reranker requires an external cross-encoder model endpoint; Alloy ships RRF + a query-term cross-encoder approximation that works with zero external dependencies, with a clear swap point for a real model.

**What we adopted:** Hybrid query strategy inference (keyword / semantic / hybrid heuristics in `retrieval-core/query-planner.ts`), RRF fusion (ported to TypeScript in `retrieval-core/reranker.ts`), pipeline composition pattern.

---

### 1.3 CrewAI (CrewAI Inc.)

**What it does well:**
- Role-based multi-agent framework — agents are defined by role, goal, backstory.
- Task delegation between agents with memory sharing.
- Strong defaults for parallel vs. sequential task execution.
- Good developer experience for building specialist crews.

**Where Alloy differs:**
- CrewAI agents are defined by natural-language role prompts; Alloy specialist agents are typed classes bound to MCP server classes with structured output schemas.
- CrewAI has no MCP integration; Alloy's specialist agents are first-class MCP clients.
- CrewAI's memory is a flat key-value store; Alloy has 10 named memory types across two retention tiers.
- CrewAI does not integrate with a policy or governance layer.

**What we adopted:** The specialist registry pattern — one entry per specialist, no code fork. The parallel fan-out execution model for independent evidence tasks.

---

### 1.4 AutoGen (Microsoft Research)

**What it does well:**
- Conversational multi-agent patterns (two-agent, group-chat).
- Code execution in sandboxes with self-healing loops.
- Strong integration with Azure services.
- `AutoGen Studio` low-code builder.

**Where Alloy differs:**
- AutoGen's group-chat is emergent (agents talk until a termination condition); Alloy's PlanGraph is deterministic and auditable.
- AutoGen has no evidence bundle or reranking layer.
- AutoGen's code sandbox is its own runtime; Alloy uses the existing `cognitive-runtime` CodeSandbox with ToolMesh guardrails.
- AutoGen does not have planner mode selection (ReAct vs. CoT-decompose) as a first-class concept.

**What we adopted:** Code execution in sandboxed environments (via `packages/cognitive-runtime/code-sandbox.ts`). Self-healing retry loops in `packages/cognitive-runtime/phases/execute.ts`.

---

### 1.5 DSPy (Stanford NLP)

**What it does well:**
- Declarative signatures for LLM programs.
- Automatic prompt optimisation (MIPRO, COPRO, BootstrapFewShot).
- Compiler paradigm: program → optimised prompt + few-shot examples.
- Strong benchmarks on reasoning tasks.

**Where Alloy differs:**
- DSPy optimises for benchmark performance; Alloy optimises for production auditability.
- DSPy has no RAG-specific architecture (retrievers are plug-ins, not first-class citizens).
- DSPy programs are compiled once; Alloy plans are built dynamically per request with runtime risk estimation.

**What we adopted:** The idea of prompt kernels as typed program signatures (see `packages/prompt-registry` and task #3502). DSPy's assertion/backtracking mechanism inspires Alloy's `counterfactual replanning` innovation backlog item.

---

### 1.6 Haystack (deepset)

**What it does well:**
- Production-grade document store integrations (Weaviate, Pinecone, Qdrant, Elasticsearch).
- Pipeline YAML serialisation for reproducibility.
- Agentic components (ToolInvoker, SubPipeline).
- Strong evaluation framework.

**Where Alloy differs:**
- Haystack pipelines are Python-only; Alloy is TypeScript-native across the full stack.
- Haystack has no governance layer or approval gates.
- Haystack's memory is ephemeral chat history; Alloy has 10 typed memory tiers with retention policies.

**What we adopted:** Pipeline component typing philosophy (every component has typed inputs and outputs). Evaluation harness concept (see `packages/evals-core`).

---

### 1.7 Semantic Kernel (Microsoft)

**What it does well:**
- Strong .NET and Python support.
- Plugin model (functions exposed as tools to the kernel).
- Planner abstraction (sequential, stepwise, handlebars).
- Deep Azure OpenAI integration.

**Where Alloy differs:**
- Semantic Kernel's planner is sequential by default; Alloy supports parallel fan-out with dependency ordering.
- Semantic Kernel has no MCP integration; Alloy is MCP-native.
- Semantic Kernel has no memory federation across domains.

**What we adopted:** The "plugin = typed tool" concept materialised in Alloy's ToolMesh with schema-validated inputs/outputs.

---

### 1.8 Pydantic AI (Pydantic)

**What it does well:**
- Type-safe AI agent framework built on Pydantic v2.
- Structured output validation from LLMs.
- Dependency injection for agents.
- Clean, minimal API surface.

**Where Alloy differs:**
- Pydantic AI is Python-only; Alloy is TypeScript.
- Pydantic AI has no multi-agent orchestration, memory tiers, or MCP.

**What we adopted:** The philosophy of Zod (TypeScript's Pydantic) as the single source of truth for all contracts (see `packages/contracts`). Structured output validation at every agent boundary.

---

### 1.9 Mastra (Mastra AI)

**What it does well:**
- TypeScript-first agent framework.
- Workflow primitives with step graphs.
- Built-in RAG with Postgres/pgvector.
- MCP support.

**Where Alloy differs:**
- Mastra is a standalone framework; Alloy is embedded in a governed platform with multi-tenant isolation, policy engine, approval gates, and full observability.
- Mastra has no dual planner mode or specialist registry pattern.
- Mastra's memory is single-tier; Alloy has short-term + long-term with separate retention policies.

**What we adopted:** TypeScript-first design. Postgres + pgvector for long-term semantic memory (`packages/memory-fabric/postgres-store.ts`). The workflow step graph concept (Alloy's `PlanGraph`).

---

### 1.10 Letta / MemGPT (Letta AI)

**What it does well:**
- Infinite context through memory self-editing (main context + archival + recall).
- Persistent memory across conversations.
- OS-inspired memory abstraction.

**Where Alloy differs:**
- MemGPT's memory is agent-local; Alloy's long-term memory is shared across agents and products within a tenant (cross-vertical memory federation).
- MemGPT has no multi-agent fan-out or specialist registry.
- MemGPT has no governance layer.

**What we adopted:** The two-tier memory model (short-term working + long-term archival) directly inspired Alloy's `memoryTiers.ts` design. The concept of memory self-editing during the Reflect phase.

---

### 1.11 Mem0 (Mem0 AI)

**What it does well:**
- Managed memory layer as an API service.
- Automatic memory extraction from conversations.
- Search and retrieval over user/agent history.
- Multi-level memories (user, agent, session).

**Where Alloy differs:**
- Mem0 is a cloud service; Alloy runs memory fabric on-prem/self-hosted with Postgres.
- Mem0's extraction is model-based; Alloy writes structured memory entries typed by 10 named tiers.
- Mem0 has no cross-vertical federation — Alloy's long-term memory is queryable across domains with tenant isolation.

**What we adopted:** Multi-level memory concept (user, session, agent). Automatic memory write in Reflect phase.

---

### 1.12 Cognee (Topoteretes)

**What it does well:**
- Knowledge graph construction from unstructured text.
- Graph-based retrieval (entity-centric queries).
- Hybrid graph + vector search.

**Where Alloy differs:**
- Cognee builds graphs at ingest time; Alloy queries the existing `packages/evidence-graph` and `packages/knowledge-graph` at retrieval time.
- Cognee has no agent orchestration or planner.

**What we adopted:** Evidence graph concept — Alloy's `packages/evidence-graph` implements graph-grounded evidence retrieval. This is the foundation for the "evidence-graph-grounded answers" innovation (see Part 3).

---

### 1.13 Graphiti (Zep AI)

**What it does well:**
- Temporal knowledge graph for agents.
- Graph edges have timestamps and confidence scores.
- Incremental graph updates as new data arrives.

**Where Alloy differs:**
- Graphiti is graph-only; Alloy combines graph + vector + relational retrieval in a unified evidence bundle.
- Graphiti has no governance or approval layer.

**What we adopted:** Temporal confidence scoring on evidence chunks (the `score` and `retrievedAt` fields on `EvidenceChunk`). The concept of evidence freshness decay.

---

## Part 2 — GitHub & HuggingFace Top-20 Survey

The following list covers the 20 most-starred / most-active Agentic RAG repositories as of April 2026 (GitHub) and the most-downloaded relevant model spaces / datasets on HuggingFace.

| Rank | Name | Stars | What It Does | Alloy Comparison |
|------|------|-------|-------------|-----------------|
| 1 | `microsoft/autogen` | 43k | Multi-agent conversation framework | Alloy adds typed plans, MCP, governance |
| 2 | `langchain-ai/langgraph` | 38k | Stateful multi-agent graphs | Alloy adds typed contracts, MCP classes |
| 3 | `run-llama/llama_index` | 37k | RAG framework + agent abstractions | Alloy adds governance, ledger, cross-vertical memory |
| 4 | `crewAIInc/crewAI` | 28k | Role-based multi-agent crews | Alloy adds MCP, typed schemas, policy guard |
| 5 | `stanfordnlp/dspy` | 20k | Declarative LLM programming | Alloy adds RAG specialists, multi-agent |
| 6 | `pydantic/pydantic-ai` | 16k | Type-safe Python agent framework | TypeScript-native in Alloy |
| 7 | `deepset-ai/haystack` | 15k | Production RAG pipelines | Alloy adds governance, TS, multi-agent |
| 8 | `mem0ai/mem0` | 22k | Managed AI memory layer | Alloy runs on-prem, cross-vertical |
| 9 | `cpacker/MemGPT` | 12k | Infinite context via memory | Alloy adds cross-vertical, governance |
| 10 | `microsoft/semantic-kernel` | 22k | AI orchestration SDK | Alloy adds MCP classes, parallel fan-out |
| 11 | `mastra-ai/mastra` | 9k | TypeScript agent framework | Alloy adds governance, dual planner, multi-tenant |
| 12 | `topoteretes/cognee` | 7k | Knowledge graph + RAG | Alloy integrates as evidence-graph specialist |
| 13 | `getzep/graphiti` | 5k | Temporal knowledge graphs | Alloy uses temporal confidence scoring |
| 14 | `phidatahq/phidata` | 18k | AI apps + agents framework | Alloy adds MCP, policy, ledger |
| 15 | `BerriAI/litellm` | 14k | LLM proxy/routing | Alloy AI Control Plane uses similar fallback logic |
| 16 | `OpenBMB/ChatDev` | 25k | LLM software dev simulation | Different domain; Alloy takes code-mode execution idea |
| 17 | `modelcontextprotocol/python-sdk` | 11k | Official MCP SDK | Alloy TypeScript MCP classes align with this spec |
| 18 | `Significant-Gravitas/AutoGPT` | 170k | Autonomous GPT agent | Alloy adds governance gates that AutoGPT lacks |
| 19 | `babyagi/babyagi` | 21k | Task-driven autonomous agent | Alloy's PlanGraph is the typed, governed equivalent |
| 20 | `microsoft/promptflow` | 10k | LLM app workflow SDK | Alloy adds multi-agent, memory, MCP |

**HuggingFace notable spaces/datasets:**
- `cross-encoder/ms-marco-MiniLM-L-6-v2` — production-grade cross-encoder model; targeted for integration as Alloy's real cross-encoder reranker (currently approximated).
- `BAAI/bge-reranker-v2-m3` — multilingual reranker; relevant for Alloy's multi-tenant global deployments.
- `datasets/ms_marco` — standard RAG/retrieval benchmark; Alloy's `packages/evals-core` includes this benchmark.
- `sentence-transformers/all-MiniLM-L6-v2` — lightweight embeddings; used in Alloy's `lib/ai-engine/embedding-pipeline.ts`.

---

## Part 3 — Innovation Backlog

Prioritised items that take Alloy beyond current open-source leaders.

### ✅ Adopt Now (in this release)

| Item | Rationale |
|------|-----------|
| **Dual planner mode (ReAct / CoT-decompose)** | No open-source RAG framework makes this a first-class, per-request, policy-overridable toggle. Alloy ships this. |
| **Three-class MCP taxonomy** | The MCP standard is nascent; Alloy's typed LocalData / SearchEngine / CloudEngine taxonomy gives us a governed taxonomy that prevents capability sprawl. |
| **RRF + cross-encoder two-stage merging** | RRF alone is fragile for heterogeneous specialists. Two-stage (fusion then rerank) is best-practice; most open-source ships one or the other. |
| **Short-term + long-term memory by default** | MemGPT showed memory matters; Alloy makes it mandatory and typed per run, not optional middleware. |
| **Evidence bundle as first-class API output** | No framework returns an auditable bundle of ranked evidence as part of its response contract. Alloy does. |

### 🔜 Next (next 2 sprints)

| Item | Rationale | Unlock |
|------|-----------|--------|
| **Counterfactual replanning** | When a specialist returns low-confidence evidence, trigger an alternative plan branch. DSPy's assertion/backtracking is the closest analog; Alloy's `packages/planner/fallback-generator.ts` already generates fallback plans — wire them to the Aggregator. | Risk estimator + fallback chain |
| **Real cross-encoder reranker endpoint** | Replace the term-overlap approximation with `cross-encoder/ms-marco-MiniLM-L-6-v2` via `apps/alloy-embedding-api`. | `apps/alloy-embedding-api` endpoint |
| **Evidence-graph-grounded answers** | Before generation, traverse the `packages/evidence-graph` to find entity relationships between retrieved chunks. Annotate the final answer with graph provenance (e.g., "Vessel X → belongs to → Fleet Y → flagged by → Incident Z"). Graphiti/Cognee are building toward this; Alloy's graph infrastructure is already in place. | `packages/evidence-graph` integration |
| **Governed-autonomy approval gates** | For high-risk queries (e.g., compliance, legal, security posture), insert an `ApprovalGate` before generation. The query pauses pending human review. Already implemented in `cognitive-runtime`; wire it to the Aggregator via policy `requireApprovalForHighRisk`. | `packages/cognitive-runtime/approval-interrupt.ts` |
| **Streaming specialist fan-out** | Stream evidence chunks from each specialist as they arrive, rather than waiting for all parallel tasks to complete. Reduces p95 latency for high-cardinality queries. | SSE route + async generator |

### 📅 Later (roadmap)

| Item | Rationale |
|------|-----------|
| **Cross-vertical memory federation** | Today each product's memory is domain-scoped. Federation allows a Vessels insight (e.g., port disruption) to appear in a Terra query (real estate near that port) or a Pulse briefing. Requires a cross-tenant memory index with access control. Letta/Mem0 cannot do this. |
| **Self-improving prompt kernels** | Use DSPy-style optimisation on prompt templates per domain based on evidence-ledger quality scores and verifier feedback. Wire `packages/prompt-registry` to `packages/aef-evals` for automatic improvement loops. |
| **Policy-aware tool selection** | Let the policy layer express MCP class preferences per domain (e.g., Counsel never uses CloudEngineMCP). The SpecialistRegistry can filter by policy at plan time, not just at the start of the run. |
| **Evidence quality scoring per domain** | Per-domain quality gates that evaluate retrieved evidence against domain-specific criteria (e.g., recency for maritime, citation authority for legal). Wire `packages/aef-evals/eval-selector.ts` per domain. |
| **Multi-hop retrieval** | For complex analytical queries, allow specialists to iteratively retrieve: answer → identify gaps → retrieve again. Closest to LangGraph's cyclic graphs but with typed hop contracts and governance gates. |
| **Real-time knowledge graph updates** | As events land in the Alloy ingest pipeline, update the evidence graph live. Graphiti's incremental update model is the inspiration. |
| **Fine-tuned domain rerankers** | Train domain-specific cross-encoder rerankers (maritime, legal, cyber) on platform evidence data. Currently deferred (no model hosting in this release). |

---

## Part 4 — What Alloy Does Better

| Dimension | Best OSS Option | Alloy Advantage |
|-----------|----------------|-----------------|
| **Governance** | None (all delegate to app) | Guardian Decision Engine + ApprovalGate wired into every run |
| **Typed contracts** | Pydantic AI (Python only) | Zod schemas at every boundary, TypeScript-native |
| **Memory depth** | Letta (2-tier) | 10 named tiers, cross-vertical federation roadmap |
| **MCP taxonomy** | Mastra (basic MCP) | Typed 3-class taxonomy with capability descriptors |
| **Evidence auditability** | None ship an evidence ledger | Immutable EvidenceBundle + AggregatorTrace per run |
| **Multi-tenant isolation** | None enforce it | tenant scope at memory, retrieval, and trace layers |
| **Dual planner modes** | None | ReAct and CoT-decompose as first-class, policy-overridable |
| **Cross-platform** | Haystack (Python) | TypeScript/Node.js native; same SDK for web + mobile |
| **Cost tracking** | LiteLLM (proxy only) | Per-run token + cost on GenerationRecord |

---

*End of dossier. Next update scheduled with counterfactual replanning release.*
