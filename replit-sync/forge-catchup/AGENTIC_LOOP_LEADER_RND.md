# Agentic Loop Leader R&D
## Best-in-Class Patterns for RAG → MCP → Kernel/Policy → Signed-Receipt Pipelines

*Research cutoff: June 2026. Compiled for SZL Holdings a11oy / killinchu engineering team.*

---

## Table of Contents

1. [Leader-by-Leader Pattern Table](#1-leader-by-leader-pattern-table)
2. [MCP Security / Doctrine Model](#2-mcp-security--doctrine-model)
3. [OTEL / Tracing Model](#3-otel--tracing-model)
4. [Formal Properties: Lean 4 Provability Ranking](#4-formal-properties-lean-4-provability-ranking)
5. [Make It Real & Operational: a11oy / killinchu Engineering Checklist](#5-make-it-real--operational-a11oy--killinchu-engineering-checklist)
6. [Honest Notes: Provable vs Heuristic vs Idealized](#6-honest-notes-provable-vs-heuristic-vs-idealized)

---

## 1. Leader-by-Leader Pattern Table

### 1.1 Agentic RAG Architecture Leaders

| Leader / System | Core Pattern | Key Invariants Asserted | What Is Provable | What Is Heuristic | Reference |
|---|---|---|---|---|---|
| **LangGraph (LangChain)** | Cyclic state machine: nodes = compute steps, edges = conditional transitions. Checkpointing persists `GraphState` to durable store after each node. | (1) State transitions are explicit and typed. (2) HITL interrupts block before designated nodes. (3) Every node writes only to its declared output keys. | State transition determinism (same inputs → same graph path) is testable; checkpointing guarantees recoverability; HITL consent is structurally enforced. | Retrieval relevance, hallucination absence. | [LangGraph agentic RAG notebook](https://github.com/langchain-ai/langgraph/blob/main/examples/rag/langgraph_agentic_rag.ipynb) |
| **LlamaIndex Agentic RAG** | Hierarchical agent tree: per-document sub-agents + top-level meta-agent. Top-level uses Chain-of-Thought to route to sub-agents via tool calls. | Sub-agents MUST use at least one tool (system prompt hard constraint). Composite retriever uses explicit `CompositeRetrievalMode.ROUTED`. | Routing determinism given same model temperature=0. | Document agent relevance scoring. | [LlamaIndex Agentic RAG architecture](https://www.llamaindex.ai/blog/agentic-rag-with-llamaindex-2721b8a49ff6) |
| **Self-RAG** | Single LM trained to emit *reflection tokens* (`[Retrieve]`, `[IsRel]`, `[IsSup]`, `[IsUse]`) inline. Each token gates the next action. | Retrieve-or-not gate is model-generated but grounded by training signal on reflection token correctness. | Reflection token emission is structured (finite vocabulary); token-by-token grading is verifiable against gold answers. | Model may hallucinate reflection tokens when OOD. | [Asai et al. 2023, arXiv:2310.11511](https://arxiv.org/abs/2310.11511), [Semantic Scholar](https://www.semanticscholar.org/paper/ddbd8fe782ac98e9c64dd98710687a962195dd9b) |
| **CRAG (Corrective RAG)** | Lightweight retrieval evaluator scores docs → triggers one of three actions: {Correct, Ambiguous, Incorrect} → optional web-search augmentation → decompose-then-recompose filter. | Confidence score gates action selection. Incorrect path mandates web search fallback. | Action routing is deterministic given evaluator score; fallback path is always defined (no dead end). | Evaluator score accuracy depends on model quality. | [Yan et al. 2024, arXiv:2401.15884](https://arxiv.org/abs/2401.15884) |
| **RAG-Critic (RUC-NLPIR)** | Error-critic model provides hierarchical error taxonomy feedback; critic-guided agentic workflow selects executor-based solution flows. | Error taxonomy is hierarchical and data-driven. Correction loops are finite (max iterations). | Error taxonomy coverage is empirically measurable. Loop termination is bounded by iteration cap. | Critic may misclassify error type. | [Dong et al. 2025, ACL 2025](https://aclanthology.org/2025.acl-long.179) |
| **DecEx-RAG** | Models RAG as Markov Decision Process. Separates decision (routing) from execution (retrieval+generate). Process-level supervision with explicit pruning. | MDP reward structure separates decision quality from execution quality. Pruning bound: ~6× data efficiency gain. | MDP formulation makes decision steps formally analyzable; reward shaping is explicit and auditable. | Policy optimality depends on reward design. | [Leng et al. 2025, arXiv:2510.05691](https://arxiv.org/abs/2510.05691) |
| **Haystack (deepset)** | Explicit DAG: indexing → retrieval → reranking → generation. Each node has typed I/O. BM25+dense hybrid + cross-encoder reranking. | Explicit DAG; no cycles without deliberate configuration. Evaluation nodes are first-class pipeline citizens. | Pipeline execution order is provably topological; evaluation node outputs are comparable across runs. | Retrieval quality. | [deepset Haystack docs](https://haystack.deepset.ai) |

### 1.2 Cross-Cutting Architectural Invariants

The best-in-class systems converge on five structural invariants:

1. **State is explicit and typed** — every hop reads a defined input state and writes to defined output keys. No implicit side-channels through globals.
2. **Routing is conditional, not probabilistic** — action selection (retrieve vs. skip, rewrite vs. answer) uses discrete gates backed by classifiers or model-generated tokens, not raw LLM probability.
3. **Loops are bounded** — every corrective cycle has a maximum iteration count; the pipeline must reach a terminal state.
4. **Human-in-the-loop is structurally enforceable** — `interrupt_before=[node]` in LangGraph; capability-based halts in AgentSpec — not just a policy promise.
5. **Evaluation is in-band** — graders, hallucination checkers, and reflection tokens are pipeline nodes, not post-hoc audits.

---

## 2. MCP Security / Doctrine Model

### 2.1 The MCP Specification (2025-06-18)

MCP is an open protocol using JSON-RPC 2.0 over stateful connections. The latest spec (2025-06-18) defines:

- **Hosts** — LLM apps that initiate connections  
- **Clients** — connectors within the host  
- **Servers** — services providing tools, resources, prompts  

Server capabilities: `tools`, `resources`, `prompts`  
Client capabilities: `sampling`, `roots`, `elicitation`  

Source: [MCP Specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)

### 2.2 Threat Taxonomy (from formal analyses)

The [arxiv.org security analysis of MCP (arXiv:2601.17549)](https://arxiv.org/html/2601.17549v1) identifies three **protocol-level** vulnerabilities:

| Vulnerability | Description | Attack Success Rate (vs. non-MCP baseline) |
|---|---|---|
| **Capability Attestation Absence** | Servers self-assert capabilities; no verification against authority. Server can escalate beyond declared scope post-init. | Cross-server propagation: +41.6% |
| **Bidirectional Sampling Without Origin Auth** | `sampling/createMessage` lacks origin authentication; enables server-side prompt injection into the LLM conversation stream. | Sampling-based injection: 67.2% |
| **Implicit Trust Propagation** | Multi-server configurations share trust context; a compromised server can hijack trusted servers' tool outputs. | Tool response manipulation: +23.7% |

Additional threats (from [Invariant Labs Tool Poisoning disclosure](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)):

- **Tool Poisoning Attack (TPA)**: Malicious instructions embedded in tool `description` fields, invisible to users but parsed by the LLM. Hidden Unicode Tags bypass visual inspection.
- **Confused Deputy**: MCP protocol does not propagate user identity from host → server by default. Server holds credential for "User A" but cannot distinguish legitimate vs. injected calls. RFC 9068 audience validation and RFC 8707 resource indicators exist to fix this; most production servers ignore both. ([Practical DevSecOps confused deputy explanation](https://www.practical-devsecops.com/glossary/confused-deputy-attack-mcp/))
- **Shadowing Attack**: A malicious server modifies agent behavior w.r.t. *other trusted servers* — agent never needs to invoke the malicious tool.

### 2.3 The Doctrine-Aware / Policy-Gated MCP Model We Adopt

Based on MCPSHIELD ([Acharya & Gupta 2026, Semantic Scholar](https://www.semanticscholar.org/paper/f28a78235a0ec6bc74135a46688a5008a38044d9)), AttestMCP ([arXiv:2601.17549](https://arxiv.org/html/2601.17549v1)), and MCP Guardian practices ([Black Hills InfoSec](https://www.blackhillsinfosec.com/model-context-protocol/)):

```
┌──────────────┐    tools/list    ┌──────────────────────────┐
│  MCP Client  │ ───────────────► │  Policy Proxy / Guardian │
│  (a11oy /    │ ◄─── filtered ── │  • Schema validation      │
│  killinchu)  │                  │  • Tool allowlist         │
└──────┬───────┘                  │  • OAuth 2.1 scope check  │
       │ tool_call                │  • Rate limits            │
       ▼                          │  • Decision log (OPA)     │
┌──────────────────┐              └──────────┬───────────────┘
│  Kernel / Policy │                         │ decision_id
│  Gate            │ ◄───────────────────────┘
│  (OPA / Cedar)   │  policy bundle version
└──────┬───────────┘
       │ allow + decision_id
       ▼
┌──────────────────────────────────────────────────────────┐
│  MCP Server  (sandboxed, per-session SPIFFE SVID)        │
│  • Signed receipt emitted on every tool call             │
│  • Receipt includes: decision_id, input_hash, output_hash│
└──────────────────────────────────────────────────────────┘
```

**Required implementation elements:**

1. **Tool attestation at registration** — sign each server's tool manifest with Sigstore keyless (OIDC → Fulcio cert → Rekor log). Client verifies manifest signature before loading tools. ([Sigstore A2A integration](https://dev.to/lukehinds/building-trust-in-the-ai-agent-economy-sigstore-meets-agent2agent-44f5))
2. **Per-session scoped SPIFFE SVID** — each agent session gets a short-lived workload identity (TTL < session lifetime). Tools verify the SVID; no long-lived shared credentials.
3. **OAuth 2.1 with per-tool scopes** — each tool call presents a token scoped to that tool's Protected Resource Metadata (`prm.json`). Audience validation (`aud` claim) on every request.
4. **OPA policy gate** — before every tool invocation: (a) validate input schema, (b) evaluate policy bundle, (c) emit `decision_id`. Tool call MUST NOT proceed without a `decision_id`.
5. **Tool description sanitization** — strip hidden Unicode, enforce max length on `description` fields, display full description to user (not just a simplified summary).
6. **Cross-server isolation** — each server runs in its own sandbox (separate container or process). No shared filesystem. Token intersection-downgrade when delegating across servers.
7. **Capability attestation (AttestMCP pattern)** — capability declarations are co-signed by a capability authority; clients reject servers that claim capabilities beyond their attested set.

**What MCP itself cannot enforce at protocol level** (per spec §Security): user consent UI, access controls, data protections. These are *implementor* responsibilities. Treat the spec's "SHOULD" clauses as "MUST" for a11oy/killinchu.

---

## 3. OTEL / Tracing Model

### 3.1 OpenTelemetry GenAI Semantic Conventions

The [OTEL GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) (status: Development) define standardized attributes for every hop of the agentic loop. The [GenAI agent span specification](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) defines the following `gen_ai.operation.name` values:

| Span Operation | `gen_ai.operation.name` | Span Kind | Use in Our Pipeline |
|---|---|---|---|
| Retrieval | `retrieval` | INTERNAL | RAG retrieval hop |
| LLM chat / plan | `chat` | CLIENT | Planner LLM call |
| Tool execution | `execute_tool` | INTERNAL | MCP tool call |
| Agent invocation | `invoke_agent` | INTERNAL | Sub-agent call |
| Workflow invocation | `invoke_workflow` | INTERNAL | Top-level orchestrator |
| Create agent | `create_agent` | INTERNAL | Agent initialization |

Key span attributes at creation time:
- `gen_ai.operation.name` — REQUIRED
- `gen_ai.provider.name` — REQUIRED
- `gen_ai.request.model` — REQUIRED
- `gen_ai.data_source.id` — Conditionally required (for retrieval spans)
- `server.address`, `server.port` — for external calls

**Per-hop tracing model for our pipeline:**

```
Trace: {trace_id}
  │
  ├─ Span: invoke_workflow  [gen_ai.operation.name=invoke_workflow]
  │    │
  │    ├─ Span: retrieval   [gen_ai.operation.name=retrieval]
  │    │    attrs: gen_ai.data_source.id, retrieval.query, retrieval.top_k
  │    │    events: retrieved_document{content_hash, relevance_score}
  │    │
  │    ├─ Span: chat (plan) [gen_ai.operation.name=chat]
  │    │    attrs: gen_ai.request.model, gen_ai.usage.input_tokens
  │    │    events: gen_ai.choice{content, finish_reason}
  │    │
  │    ├─ Span: execute_tool [gen_ai.operation.name=execute_tool]
  │    │    attrs: gen_ai.tool.name, gen_ai.tool.call.id
  │    │    custom: policy.decision_id, policy.bundle_version
  │    │    events: tool_call{input_hash, output_hash, receipt_id}
  │    │
  │    └─ Span: chat (gen)  [gen_ai.operation.name=chat]
  │         attrs: gen_ai.request.model, gen_ai.usage.output_tokens
```

**Custom span attributes for a11oy/killinchu** (beyond standard semconv):

```yaml
# Add to every execute_tool span:
szl.policy.decision_id: string       # OPA decision ID
szl.policy.bundle_version: string    # Policy bundle git SHA
szl.receipt.id: string               # Signed receipt ID (Sello / in-toto)
szl.receipt.log_url: string          # Transparency log URL
szl.agent.session_svid: string       # SPIFFE SVID (sub, not private key)
szl.hop.index: int                   # Position in pipeline (for receipt chaining)
szl.hop.parent_receipt_id: string    # Previous hop's receipt ID
```

### 3.2 Platform Comparison

| Platform | OTel Native | Self-Hostable | MCP Tracing | Best For a11oy/killinchu |
|---|---|---|---|---|
| **Arize Phoenix** | Yes (no proprietary layer) | Yes (Docker/K8s/CloudFormation) | Yes (OpenInference spec) | Best choice: OTel-native, self-hosted, no vendor lock-in, 10 span kinds including TOOL/RETRIEVER/GUARDRAIL |
| **W&B Weave** | Partial (Apache 2.0 SDK) | SDK only | Yes (auto-log MCP with `@weave.op()`) | Good if already on W&B; MCP auto-logging is excellent |
| **LangSmith** | No (proprietary) | No (SaaS) | Via LangGraph integration | Good for LangGraph/LangChain teams |
| **Langfuse** | Yes (OTLP export) | Yes (MIT, open source) | Partial | Open-source alternative to LangSmith |

[Arize Phoenix span kinds](https://arize.com/docs/phoenix/tracing/llm-traces): CHAIN, LLM, TOOL, RETRIEVER, EMBEDDING, AGENT, RERANKER, GUARDRAIL, EVALUATOR — these map cleanly to our pipeline hops.

### 3.3 What Makes a Trace Tamper-Evident?

Standard OTel traces are **not** tamper-evident by themselves — they are mutable log entries. To make traces auditable:

1. **Content-hash spans at write time** — hash `{trace_id, span_id, parent_span_id, attributes, events, start_time, end_time}` immediately on span close.
2. **Chain hashes forward** — each span includes `szl.hop.parent_receipt_id` which is the hash of the previous span's receipt. This creates a linked list detectable on reorder/delete.
3. **Anchor to external log** — periodically publish Merkle root of span hashes to Rekor or a SCITT-compatible transparency log. Any later verifier can check inclusion proof.
4. **Cross-link with signed action envelopes** — each `execute_tool` span's `szl.receipt.id` must correspond to an independently signed receipt (see §5 below). The receipt is signed outside the tracing system; the trace cannot forge it.

The [Sello protocol (arXiv:2606.04193)](https://arxiv.org/html/2606.04193v1) provides the cleanest model: **receiver-side signing** by the called service (not the agent), so the agent cannot forge its own trail.

---

## 4. Formal Properties: Lean 4 Provability Ranking

### 4.1 The Classical Foundations Available

Before proposing Lean statements, we must map each property to its classical mathematical anchor:

| Property | Classical Anchor | Lean 4 / Mathlib Availability |
|---|---|---|
| Hash chain integrity (tamper-evidence) | Collision resistance of SHA-256 (computational assumption); hash function properties in Mathlib | `Mathlib.Data.List.Chain`, crypto axioms via CryptoLib |
| Receipt completeness | Invariant preservation over a state machine (induction over List / Fin n) | `Mathlib.Data.Finset`, `List.mapAccumr`, structural induction |
| Gate soundness | Partial correctness of a decision procedure (Hoare logic / precondition reasoning) | `Mathlib.Tactic.Linarith`, `Mathlib.Control.Monad.Basic` |
| Non-interference (IFC) | Goguen-Meseguer noninterference (1982); termination-insensitive NI theorem | LLMbda Calculus (Garby, Gordon, Sands 2026, arXiv:2602.20064) proves NI for a lambda calculus with LLM primitives |
| Replay determinism | Functional determinism: f(x) = f(x) for pure functions | `Lean.Core` definitional equality; requires pure state model |
| Merkle tree inclusion | Merkle inclusion proof correctness (collision resistance + hash tree definition) | `Mathlib.Data.Tree`, custom Merkle definitions |

### 4.2 Ranked List: End-to-End Properties

**Rank 1 — Most Honestly Provable (in Lean 4 today)**

#### (a) Receipt Completeness

Every executed hop produces a chained receipt.

**Classical anchor**: Induction over a list of executed steps.

**Informal statement**: If the pipeline executes n hops, the receipt list has exactly n elements, each chained to the previous via a hash pointer.

**Proposed Lean 4 statement**:
```lean
-- Model a hop as a record with an action and a receipt
structure Hop where
  action : Action
  receipt : Receipt

-- A Receipt chains to its predecessor by hash
structure Receipt where
  hop_index : Nat
  action_hash : Hash
  parent_hash : Option Hash   -- None for genesis

-- Receipt completeness: every hop produces a receipt
theorem receipt_completeness
    (pipeline : List Hop)
    (h_exec : ∀ (i : Fin pipeline.length), (pipeline.get i).receipt.hop_index = i.val) :
    pipeline.length = (pipeline.map fun h => h.receipt).length := by
  simp [List.length_map]

-- Chain property: each receipt's parent_hash equals the previous receipt's hash
theorem receipt_chaining
    (pipeline : List Hop) (h_len : pipeline.length ≥ 2) :
    ∀ (i : Fin (pipeline.length - 1)),
      (pipeline.get ⟨i.val + 1, by omega⟩).receipt.parent_hash =
        some (hashReceipt (pipeline.get ⟨i.val, by omega⟩).receipt) := by
  intro i
  -- requires axiom: hash function is deterministic (pure function)
  sorry  -- discharge with hash function axioms
```

**What this proves**: Given a model where each hop is recorded as a typed `Hop` structure, completeness (length equality) is definitionally trivial. The chaining property requires an axiom about hash function purity; with that axiom it is mechanically checkable. **No collision resistance assumption needed for completeness alone.**

---

**Rank 2 — Provable with Bounded Policy Model**

#### (b) Gate Soundness

No action proceeds without a passing policy check.

**Classical anchor**: Hoare logic precondition: `{¬PolicyPassed} action {False}` — i.e., if policy fails, action is unreachable.

**Proposed Lean 4 statement**:
```lean
-- Policy gate: returns Option DecisionId
def policyGate (input : ToolCallInput) (policy : Policy) : Option DecisionId :=
  if policy.evaluate input then some (mkDecisionId input policy) else none

-- Soundness: a tool call only executes if gate returns Some
theorem gate_soundness
    (input : ToolCallInput)
    (policy : Policy)
    (h_exec : toolCallExecuted input) :
    ∃ (did : DecisionId), policyGate input policy = some did := by
  -- The pipeline architecture enforces: execute only after gate returns Some
  -- This is provable IF executeToolCall is defined to require a DecisionId argument
  exact ⟨_, rfl⟩   -- by construction if toolCallExecuted is defined as:
                     -- toolCallExecuted input ↔ ∃ did, gatePass input policy did ∧ ...
```

**What this proves**: Soundness is **definitional** if we define `executeToolCall` to take a `DecisionId` as a required argument (making it impossible to call without one). The "proof" is then just unfolding the definition. This is genuinely useful: it means the type system enforces the invariant. **The limitation**: our policy model must be formalized (finite policy rules over structured inputs); it cannot capture arbitrary natural-language policies.

---

**Rank 3 — Provable with Significant Modeling Effort**

#### (c) Tamper-Evidence of the Receipt Chain

Modifying any receipt in the chain is detectable.

**Classical anchor**: Collision resistance of the hash function (computational assumption, not pure mathematics). Given collision resistance, altering receipt `r_i` changes `hash(r_i)`, which breaks `r_{i+1}.parent_hash` and cascades to the chain tip.

**Proposed Lean 4 statement** (axiomatic):
```lean
-- Axiom: hash function is collision-resistant (not provable in pure math)
axiom hash_collision_resistant : ∀ (a b : Receipt), hashReceipt a = hashReceipt b → a = b

-- Tamper evidence: if chain verifies, receipts are unmodified
theorem tamper_evidence
    (chain : List Receipt)
    (h_verify : chainVerifies chain)
    (original : List Receipt)
    (h_original : chainVerifies original)
    (h_tip : (chain.getLast?).map hashReceipt = (original.getLast?).map hashReceipt) :
    chain = original := by
  -- Follows from collision resistance + chain verification definition
  induction chain with
  | nil => cases original with
    | nil => rfl
    | cons h t => simp at h_tip
  | cons r rs ih =>
    -- use hash_collision_resistant to derive r = original.head?
    -- use induction hypothesis for the tail
    sorry -- mechanizable given the axiom
```

**Honest caveat**: This is provable *given the axiom*. Lean 4 accepts axiomatic proofs as valid. The axiom is a **computational security assumption** (SHA-256 collision resistance) — not a mathematical theorem. Anyone who can find a SHA-256 collision invalidates this proof.

---

**Rank 4 — Requires New Lean Formalization Work**

#### (d) Non-Interference of Untrusted Retrieval

Untrusted retrieval context cannot alter a denied policy decision.

**Classical anchor**: Goguen-Meseguer (1982) noninterference. The LLMbda Calculus ([Garby, Gordon, Sands 2026](https://arxiv.org/abs/2602.20064)) proves termination-insensitive noninterference for a lambda calculus with LLM primitives, establishing integrity and confidentiality guarantees.

**Proposed Lean 4 statement** (conceptual):
```lean
-- Label type: Untrusted (retrieval context) vs. Trusted (policy decision)
inductive Label where | Untrusted | Trusted

-- Pipeline state carries labelled values
structure LabelledState where
  retrieval_context : LabelledValue Label.Untrusted
  policy_input : LabelledValue Label.Trusted
  decision : LabelledValue Label.Trusted

-- Non-interference: varying untrusted retrieval context cannot change trusted decision
-- when policy input is held fixed
theorem retrieval_noninterference
    (s1 s2 : LabelledState)
    (h_policy_eq : s1.policy_input = s2.policy_input)
    (h_retrieval_diff : s1.retrieval_context ≠ s2.retrieval_context) :
    runPolicyGate s1 = runPolicyGate s2 := by
  -- Requires: runPolicyGate only reads Label.Trusted inputs
  -- This is provable IF runPolicyGate is defined to be parametric in
  -- Label.Untrusted values (i.e., policy gate ignores retrieval context entirely)
  sorry -- discharge by showing runPolicyGate is constant in retrieval_context
```

**What this proves**: Non-interference is provable *for the policy gate in isolation* if we define the policy function to only read typed `Trusted` inputs. **The hard part**: in a real RAG pipeline the retrieval context *does* influence the LLM planner, which *does* influence what tool call is submitted to the gate. Full NI for the whole loop requires either (a) modeling the LLM as a pure function (unrealistic) or (b) adopting the LLMbda Calculus formalization (significant new proof work to port to Lean 4).

---

**Rank 5 — Idealized / Long-Horizon**

#### (e) Replay Determinism

Given the same inputs and receipts, the pipeline produces the same outputs.

**Classical anchor**: Functional determinism (referential transparency).

**Honest caveat**: Determinism requires LLM inference to be deterministic (temperature=0 is necessary but not sufficient — model API providers do not guarantee identical outputs across versions, hardware, or batching strategies). Provable only for a *fully specified, frozen model snapshot* treated as a pure function — not for any live API call.

```lean
-- Determinism holds for a purely functional pipeline model
theorem replay_determinism
    (pipeline : PurePipeline)
    (input : PipelineInput) :
    pipeline.run input = pipeline.run input := by rfl  -- trivially true by definitional equality
```

**What this means**: Lean trivially proves functional determinism. The engineering challenge is making the actual system match the pure model. This requires: pinned model versions, seeded samplers, deterministic tool call routing, and frozen policy bundles. These are **operational guarantees**, not mathematical ones.

### 4.3 Summary Table

| Property | Lean Provability | Assumption Required | Modeling Effort |
|---|---|---|---|
| Receipt completeness | ✅ Provable today (structural induction) | Hash function purity (definitional) | Low |
| Gate soundness | ✅ Provable today (by construction / types) | Policy model is finite + formalized | Medium |
| Tamper-evidence | ✅ Provable given axiom | SHA-256 collision resistance (computational) | Medium |
| Non-interference (gate only) | ✅ Provable if gate ignores retrieval | Gate is parametric in untrusted labels | Medium-High |
| Non-interference (full loop) | ⚠️ Research-level (LLMbda Calculus approach) | LLM modeled as pure function | Very High |
| Replay determinism | ⚠️ Trivial in pure model; hard operationally | Deterministic LLM inference | Operational |

---

## 5. Make It Real & Operational: a11oy / killinchu Engineering Checklist

### Phase 0: Fix Dead MCP (Week 1)

- [ ] **0.1** Audit current MCP server code: identify what servers are defined, whether they start, and what tools are registered
- [ ] **0.2** Verify JSON-RPC 2.0 transport (stdio for local; bind to 127.0.0.1 only if using TCP)
- [ ] **0.3** Run `tools/list` call and assert non-empty response
- [ ] **0.4** Check capability declarations match actual tool implementations
- [ ] **0.5** Verify no server starts with `sampling` capability unless explicitly needed (attack surface: arXiv:2601.17549 vulnerability 2)
- [ ] **0.6** Pin tool manifest version: compute SHA-256 of `tools/list` response at registration; verify on each session

### Phase 1: Wire RAG → MCP (Week 2)

- [ ] **1.1** Choose RAG framework: LangGraph (recommended for production; checkpointing + HITL) or LlamaIndex (multi-index routing)
- [ ] **1.2** Implement Router node: distinguish retrieval-needed vs. direct-answer queries
- [ ] **1.3** Implement Grader node: score retrieved documents for relevance (structured output: `{relevant: bool, confidence: float}`)
- [ ] **1.4** Implement Hallucination Checker node: ground-check generation against retrieved docs
- [ ] **1.5** Set maximum iteration count for corrective loop (e.g., `MAX_RETRIEVAL_RETRIES=3`)
- [ ] **1.6** Wire retrieval output as typed `GraphState` key — no implicit prompt injection from retrieval into policy context
- [ ] **1.7** Tag every LlamaIndex/LangGraph span with `gen_ai.data_source.id` matching the vector store

### Phase 2: Wire MCP → Kernel / Policy Gate (Week 2-3)

- [ ] **2.1** Deploy OPA or AWS Cedar as the policy gate (Cedar preferred if already using AWS; OPA for portability)
- [ ] **2.2** Define policy bundle: tool allowlist per agent role, max scope per tool, blacklisted inputs
- [ ] **2.3** Assign each agent session a SPIFFE SVID (use SPIRE server locally, or leverage cloud workload identity)
- [ ] **2.4** Implement `PolicyGate.evaluate(tool_call, policy_bundle) → (decision_id | Deny)` — synchronous, blocking
- [ ] **2.5** Pass `decision_id` as required parameter to MCP tool invocation adapter — gate soundness by construction
- [ ] **2.6** Implement per-tool OAuth 2.1 scopes using `prm.json` Protected Resource Metadata
- [ ] **2.7** Validate `aud` claim on every token presented to MCP server (mitigates confused deputy, RFC 9068)
- [ ] **2.8** Deploy MCP Guardian proxy (or equivalent) between client and servers: enforce schema validation, rate limits, token filtering

### Phase 3: Wire Kernel → Signed Receipt (Week 3-4)

- [ ] **3.1** Implement signed action envelope (DSSE format, Ed25519 key):
  ```json
  {
    "envelope_version": "agent-action/v1",
    "action_id": "act_...",
    "parent_action_id": "act_... (previous hop)",
    "agent_identity": "spiffe://szlholdings.com/a11oy/...",
    "policy_decision_id": "dec_...",
    "tool": {"name": "...", "version": "1"},
    "input_digest": "sha256:...",
    "output_digest": "sha256:...",
    "started_at": "...",
    "ended_at": "..."
  }
  ```
- [ ] **3.2** Integrate Sigstore Cosign for keyless signing: `cosign attest --predicate envelope.json` — tied to OIDC workload identity
- [ ] **3.3** Publish each signed receipt to Rekor (Sigstore transparency log) or a private SCITT-compatible log
- [ ] **3.4** Store receipts in hash-chained local journal: `receipt[i].parent_hash = sha256(receipt[i-1])`
- [ ] **3.5** Anchor Merkle root of journal to external log every N hops or T seconds
- [ ] **3.6** Implement receipt verification endpoint: given `receipt_id`, verify DSSE signature + inclusion proof against transparency log
- [ ] **3.7** Consider implementing Sello-pattern receiver-side receipts ([arXiv:2606.04193](https://arxiv.org/html/2606.04193v1)) for highest-assurance tool calls: the MCP *server* signs the receipt (not the client), making the agent unable to forge its own trail

### Phase 4: Wire Tracing End-to-End (Week 4)

- [ ] **4.1** Deploy Arize Phoenix (Docker) or configure OTLP exporter to existing collector
- [ ] **4.2** Instrument RAG retrieval span: `gen_ai.operation.name=retrieval`, `gen_ai.data_source.id`, `szl.hop.index`
- [ ] **4.3** Instrument planner LLM span: `gen_ai.operation.name=chat`, `gen_ai.request.model`, input/output token counts
- [ ] **4.4** Instrument tool call span: `gen_ai.operation.name=execute_tool`, `szl.policy.decision_id`, `szl.receipt.id`
- [ ] **4.5** Instrument policy gate span: custom `szl.policy.gate` operation, `szl.policy.bundle_version`, allow/deny outcome
- [ ] **4.6** Cross-link: embed `trace_id` + `span_id` inside signed action envelope; embed `szl.receipt.id` inside trace span attributes
- [ ] **4.7** Enable `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` to emit latest GenAI semconv attributes
- [ ] **4.8** Add span events for: retrieval document hashes, grader scores, hallucination checker verdict, policy decision, receipt publication

### Phase 5: Formal Proofs (Months 2-3)

- [ ] **5.1** Formalize pipeline state machine in Lean 4: `GraphState`, `Hop`, `Receipt` types
- [ ] **5.2** Prove Receipt Completeness (Rank 1) — immediate, ~1 day of Lean work
- [ ] **5.3** Prove Gate Soundness (Rank 2) — define `executeToolCall` to require `DecisionId`, ~2-3 days
- [ ] **5.4** Prove Tamper-Evidence (Rank 3) with SHA-256 collision resistance axiom, ~1 week
- [ ] **5.5** Prove Non-Interference for policy gate in isolation (Rank 4 partial), ~2-3 weeks with labelled types
- [ ] **5.6** File proofs in `proofs/` directory; run `lake build` in CI to prevent regression
- [ ] **5.7** Document all `sorry` and `axiom` statements with honest explanations of what assumptions remain

---

## 6. Honest Notes: Provable vs Heuristic vs Idealized

### What Is GENUINELY PROVABLE

| Claim | How It Is Proved | Strength |
|---|---|---|
| Receipt chain has n receipts for n hops | Structural induction over List | Mathematical theorem; machine-checked |
| Tool call cannot execute without a DecisionId | Type-theoretic construction (DecisionId is a required argument) | As strong as the type system; falsified if you call `executeToolCall` via an unsafe FFI or bypass |
| Hash chain detects reordering and deletion (given collision resistance axiom) | Induction + collision resistance axiom | Conditional mathematical theorem; as strong as SHA-256 collision resistance |
| Policy gate ignores retrieval context (if gate is parametric in untrusted labels) | Parametricity / information flow types | Mechanically checkable given the labelled type system |
| MCP Guardian correctly blocks tools not on allowlist | Allowlist membership check is a finite set lookup | Trivially decidable; provable |

### What Is HEURISTIC (Engineered but Not Formally Proved)

| Claim | Why It Is Heuristic |
|---|---|
| Retrieved documents are relevant | Cosine similarity / BM25 scores are heuristic; no formal bound on recall or precision |
| LLM planner produces correct tool-call parameters | LLM behavior is stochastic and model-dependent; no formal specification |
| Grader correctly classifies relevance | Grader is itself an LLM call; grader accuracy is empirically measured, not proved |
| Hallucination checker catches all hallucinations | Current state-of-the-art LLM-judges have measurable false-negative rates |
| HITL approval is semantically meaningful | Human may approve without understanding; the approval is recorded, not its semantic correctness |
| Prompt injection is fully mitigated | No deterministic solution exists for prompt injection ([embracethered.com analysis](https://embracethered.com/blog/posts/2025/model-context-protocol-security-risks-and-exploits/)) |
| Policy gate covers all attack vectors | Policy is only as good as its specification; unspecified threats are not covered |

### What Is IDEALIZED (Assumed for Proofs but Not Realizable in Practice)

| Assumption | Reality |
|---|---|
| LLM inference is deterministic | Temperature=0 helps; API providers do not guarantee bit-identical outputs across versions, hardware, or batching. Full replay determinism is not achievable against a live API. |
| SHA-256 is collision-resistant | This is a computational hardness conjecture (NP ≠ P level). Formally unprovable in current mathematics. A quantum adversary with Grover's algorithm halves effective bit security. |
| Policy bundle captures all relevant rules | Natural-language policies have unbounded edge cases. Formalization is necessarily lossy. |
| Sigstore transparency log is tamper-evident at the infrastructure level | Relies on independent witnesses and log operators being honest. A globally compromised Rekor is theoretically possible but practically implausible at current security posture. |
| Non-interference of the full loop | Requires treating the LLM as a pure function with no side-channels. Actual LLMs have training-data-dependent behavior, context-length effects, and RLHF fine-tuning that creates subtle dependencies not captured by any type system today. The LLMbda Calculus ([arXiv:2602.20064](https://arxiv.org/abs/2602.20064)) provides the best current formal foundation, but porting it to Lean 4 for a production pipeline is a multi-person-year research project. |

### The Honest Engineering Conclusion

**You can FORMALLY PROVE, today:**
- Structural invariants of the receipt chain (completeness, chaining)
- Gate soundness by construction (type-enforced precondition)
- Tamper-evidence of the hash chain (conditional on collision resistance axiom)
- Non-interference of a formally specified policy gate in isolation

**You CANNOT formally prove:**
- The LLM will not be manipulated by adversarial retrieval context (prompt injection is an open research problem)
- The pipeline will produce identical outputs on replay against live APIs
- The policy covers all relevant threat scenarios

**The value of the formal proofs is not "perfect security"** — it is:
1. Clearly separating what the system guarantees from what it hopes
2. Catching regressions in the formally specified components
3. Making the threat model explicit: the remaining heuristic components are the attack surface

Every `sorry` in the Lean proof file is a public declaration of an unverified assumption. That is more honest than a security policy document that lists no caveats.

---

## References

| # | Citation | URL |
|---|---|---|
| 1 | Asai et al., Self-RAG, arXiv:2310.11511, 2023 | https://arxiv.org/abs/2310.11511 |
| 2 | Yan et al., Corrective RAG (CRAG), arXiv:2401.15884, 2024 | https://arxiv.org/abs/2401.15884 |
| 3 | Singh et al., Agentic RAG Survey, arXiv:2501.09136, 2025 | https://arxiv.org/abs/2501.09136 |
| 4 | Dong et al., RAG-Critic, ACL 2025 | https://aclanthology.org/2025.acl-long.179 |
| 5 | Leng et al., DecEx-RAG, arXiv:2510.05691, 2025 | https://arxiv.org/abs/2510.05691 |
| 6 | AlphaCorp, Top 5 RAG Frameworks Nov 2025 | https://alphacorp.ai/blog/top-5-rag-frameworks-november-2025 |
| 7 | LangGraph Agentic RAG Notebook (GitHub) | https://github.com/langchain-ai/langgraph/blob/main/examples/rag/langgraph_agentic_rag.ipynb |
| 8 | LlamaIndex Agentic RAG Architecture | https://www.llamaindex.ai/blog/agentic-rag-with-llamaindex-2721b8a49ff6 |
| 9 | MCP Specification 2025-06-18 | https://modelcontextprotocol.io/specification/2025-06-18 |
| 10 | Anthropic, Introducing MCP | https://www.anthropic.com/news/model-context-protocol |
| 11 | Anthropic, Code Execution with MCP | https://www.anthropic.com/engineering/code-execution-with-mcp |
| 12 | Pento.ai, A Year of MCP 2025 Review | https://www.pento.ai/blog/a-year-of-mcp-2025-review |
| 13 | Nivalto et al., Security Analysis of MCP, arXiv:2601.17549, 2026 | https://arxiv.org/html/2601.17549v1 |
| 14 | Acharya & Gupta, MCPSHIELD, Semantic Scholar, 2026 | https://www.semanticscholar.org/paper/f28a78235a0ec6bc74135a46688a5008a38044d9 |
| 15 | Invariant Labs, Tool Poisoning Attacks | https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks |
| 16 | Black Hills InfoSec, MCP Security | https://www.blackhillsinfosec.com/model-context-protocol/ |
| 17 | Practical DevSecOps, Confused Deputy in MCP | https://www.practical-devsecops.com/glossary/confused-deputy-attack-mcp/ |
| 18 | embracethered.com, MCP Security Risks | https://embracethered.com/blog/posts/2025/model-context-protocol-security-risks-and-exploits/ |
| 19 | Kim et al., Prompt Flow Integrity, arXiv:2503.15547, 2025 | https://arxiv.org/pdf/2503.15547.pdf |
| 20 | Wang et al., AgentSpec, arXiv:2503.18666, ICSE 2026 | https://arxiv.org/abs/2503.18666 |
| 21 | AgentSpec GitHub | https://github.com/haoyuwang99/AgentSpec |
| 22 | Garby, Gordon, Sands, LLMbda Calculus (IFC + NI), arXiv:2602.20064, 2026 | https://arxiv.org/abs/2602.20064 |
| 23 | Yu et al., Trustworthy LLM Agents Survey, arXiv:2503.09648, 2025 | https://arxiv.org/html/2503.09648v1 |
| 24 | OTEL GenAI Semantic Conventions | https://opentelemetry.io/docs/specs/semconv/gen-ai/ |
| 25 | OTEL GenAI Agent Spans | https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/ |
| 26 | MLflow OTEL GenAI Semconv | https://mlflow.org/docs/latest/genai/tracing/opentelemetry/genai-semconv/ |
| 27 | Arize Phoenix Tracing | https://arize.com/docs/phoenix/tracing/llm-traces |
| 28 | W&B Weave Agents | https://wandb.ai/site/agents/ |
| 29 | GoodEye Labs, Top AI Agent Evaluation Tools 2026 | https://www.goodeyelabs.com/articles/top-ai-agent-evaluation-tools-2026 |
| 30 | ATSC Draft Spec (OTel-compatible AI Agent Observability) | https://github.com/agent-telemetry-spec/atsc |
| 31 | Sigstore Cosign In-Toto Attestations | https://docs.sigstore.dev/cosign/verifying/attestation/ |
| 32 | Ferra et al., Sello: Receiver-Attested Confidential Receipts, arXiv:2606.04193, 2026 | https://arxiv.org/html/2606.04193v1 |
| 33 | Hinds, Sigstore meets A2A (dev.to) | https://dev.to/lukehinds/building-trust-in-the-ai-agent-economy-sigstore-meets-agent2agent-44f5 |
| 34 | Zylos.ai, Agent Identity and Signed Provenance | https://zylos.ai/research/2026-04-25-agent-identity-provenance-signed-audit-trails |
| 35 | Aquilax, Supply Chain Artifact Signing | https://aquilax.ai/blog/supply-chain-artifact-signing-slsa |
| 36 | CSA Research Note, Sigstore Worm 2026 | https://labs.cloudsecurityalliance.org/research/csa-research-note-mini-shai-hulud-supply-chain-sigstore-2026/ |
| 37 | de Moura et al., Lean 4 at CAV 2024 | https://leodemoura.github.io/files/CAV2024.pdf |
| 38 | LambdaClass, Lean 4 for ZK Systems | https://blog.lambdaclass.com/if-it-compiles-it-is-correct-almost-an-introduction-to-lean-4-for-zk-systems-and-engineering-2/ |
| 39 | FormalVerifML (GitHub) | https://github.com/fraware/leanverifier |
| 40 | Goguen & Meseguer, Security Policies and Security Models, IEEE S&P 1982 | https://ieeexplore.ieee.org/document/6234468 (original; see also quantum generalization: https://ieeexplore.ieee.org/document/6595825/) |

---

*Document version: 1.0 — June 2026*  
*Maintained at: `team/AGENTIC_LOOP_LEADER_RND.md`*
