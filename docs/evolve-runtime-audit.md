# AEEP Runtime Audit — Phase 1

**Version:** 1.0 | **Date:** April 2026 | **Scope:** AI runtime, cognitive loop, retrieval, memory, evidence, policy, workflow execution

---

## 1. Runtime Landscape

The platform has evolved multiple overlapping runtime layers. This audit maps each to its AEEP equivalent and identifies consolidation opportunities.

---

## 2. Cognitive / Agent Runtime

### `packages/cognitive-runtime` (Active)

**Architecture:** 8-phase cognitive loop (perceive → orient → plan → execute → verify → reflect → update_self_model → update_memory). Zod-typed phase schemas, checkpoint support, guardian-blocked states, approval interrupt, postgres checkpoint store.

**Key types:** `CognitivePhase`, `LoopStatus`, `PhaseResult`, `PerceiveInput`, `WorldModelUpdate`.

**Strengths:** Well-typed phase contracts, approval interrupts, checkpoint persistence.

**Gaps:**
- No typed role contracts (MissionPlanner, RetrievalStrategist, etc.)
- No evidence assembly in the loop
- No traceId threading through all phases
- No policy pre/post check hooks in the loop body
- No event sourcing / timeline replay

**AEEP target:** Refactor → `packages/agent-core`. The cognitive-runtime becomes the inner loop of agent-core. Add typed role contracts, evidence threading, traceId propagation, and policy hooks.

### `packages/agents-core` / `packages/agents-evals` / `packages/agents-prompts` / `packages/agents-tools`

**Architecture:** Agent capability packages — definitions, eval harness, prompt management, tool bindings.

**AEEP target:** Fold into `packages/agent-core` (agents-core, agents-tools) and `packages/evals` (agents-evals). `packages/agents-prompts` → `packages/prompt-registry` (already exists).

### `packages/alloy` (Active)

**Architecture:** Checkpoint store, model router, plan orchestrator, run manager, workflow execution. Approval interrupt support, postgres checkpoint store, comprehensive test coverage.

**Strengths:** Checkpoint persistence works, run lifecycle well-modeled, plan-orchestrator tested.

**Gaps:**
- No event sourcing (writes to log but not replayable event stream)
- No timeline replay
- No idempotency guarantees on step execution
- Approval interrupts exist but not wired to a workflow approval center
- No retry-safe node contract

**AEEP target:** Refactor → `packages/workflow-runtime`. The alloy package becomes the execution core. Add: event sourcing, idempotent steps, retry-safe node contract, pause/resume, proper approval routing, timeline replay. Adapter layer maintains backward compatibility.

### `packages/szl-alloy`

Thin wrapper over `packages/alloy`. **AEEP target:** Deprecate. Direct consumers migrate to `packages/workflow-runtime`.

### `packages/planner`

Planning module. **AEEP target:** Fold into `packages/agent-core` planning phase.

### `packages/action-engine`

Action execution. **AEEP target:** Fold into `packages/agent-core` execute phase.

### `packages/reflection-engine`

Structured self-improvement — scores run quality, classifies failure modes, identifies best routes, drafts candidate skills. **AEEP target:** Keep as eval adapter; wire to `packages/evals` Evaluator role contract.

### `packages/replay-core`

Incident capture and scenario replay. **AEEP target:** Fold into `packages/workflow-runtime` timeline replay subsystem.

---

## 3. Retrieval Runtime

### `packages/aef-retrieval-core` (Active)

**Architecture:** 
- `adapters.ts` — pluggable retrieval adapters
- `boost.ts` — exact-match boosting (166 lines)
- `citations.ts` — citation assembly (55 lines)
- `filter.ts` — metadata filters (40 lines)
- `fusion.ts` — RRF (Reciprocal Rank Fusion) + keyword fusion (89 lines)
- `normalize.ts` — result normalization (36 lines)
- `query-normalizer.ts` — query preprocessing (56 lines)
- Tests: 420 lines

**Strengths:** Dense + keyword + RRF fusion working. Exact-match boosting. Metadata filters. Citation assembly.

**Gaps:**
- No optional rerank integration at this layer (rerank is in separate worker)
- No full Evidence object emission (sourceUri, chunkId, profileVersion, retrievalPath, traceId)
- No batching by profile+backend+modelRef+inputType
- No queue-depth metrics
- No size/time flush windows
- Embedding backends not exposed here (delegated to embed-worker)

**AEEP target:** Refactor → `packages/retrieval-core`. Keep all existing capabilities, add: full Evidence object emission, rerank integration hooks, batching, queue metrics, profile-aware retrieval context, traceId threading.

### `lib/intelligence-feeds` (Active)

AIS, STIX/TAXII, legal data ingestion adapters. **AEEP role:** Signal ingestion layer; not the retrieval layer. Keep separate from retrieval-core.

### `packages/signal-mesh` (Active)

Signal routing and evidence store. **AEEP role:** Signal backbone. Wire to retrieval-core for evidence assembly.

---

## 4. Memory Runtime

### `packages/memory-fabric` (Active)

**Architecture:**
- `types.ts` — Memory tier types (working, episodic, semantic, governance)
- `store.ts` — Memory store interface
- `postgres-store.ts` — PostgreSQL-backed store
- `behaviors.ts` — Retention behaviors
- `retention.ts` — Retention policy enforcement
- Tests: comprehensive

**Strengths:** 4-tier memory model well-defined. Provenance tracking. Freshness, retention, sensitivity.

**Gaps:**
- No contradiction detection
- No source-linking from memory entries back to Evidence objects
- No tenant/profile policy enforcement at memory read/write
- No governance memory tier controls (audit of what was remembered, by whom, when)

**AEEP target:** Refactor → `packages/memory-core`. Enhance with: contradiction detection, Evidence source-linking, tenant/profile policy enforcement at memory layer, governance tier audit.

---

## 5. Evidence Runtime

### `packages/aef-evidence-ledger` (Active)

**Architecture:**
- `types.ts` — Evidence entry types
- `store.ts` — Evidence store interface
- `fs-store.ts` — Filesystem-backed store (91 lines)
- `query.ts` — Evidence query interface (47 lines)
- Tests: 303 lines

**Strengths:** Evidence storage and query working. File-backed store for local dev.

**Gaps:**
- No full Evidence schema (missing: sourceUri, chunkId, scores, profileVersion, retrievalPath, traceId)
- No ledger persistence (events not sourced to append-only log)
- PostgreSQL store not implemented
- No evidence compaction or retention

**AEEP target:** Refactor → `packages/evidence-ledger`. Add: full Evidence schema, PostgreSQL store, append-only ledger writes, compaction, retention.

### `packages/evidence-graph` (Active)

Graph-based evidence linking. **AEEP target:** Fold into `packages/evidence-ledger` as a relationship layer.

### `packages/run-ledger` (Active)

Run-level ledger entries. **AEEP target:** Wire to `packages/evidence-ledger`.

---

## 6. Policy Runtime

### `packages/aef-policy-guard` (Active)

**Architecture:**
- `engine.ts` — Policy decision engine (95 lines)
- `redaction.ts` — Field redaction (39 lines)
- `retention.ts` — Retention policy (28 lines)
- `tenant.ts` — Tenant isolation (35 lines)
- `types.ts` — Policy types (41 lines)
- Tests: 324 lines

**Strengths:** Tenant isolation, redaction, retention working. Good test coverage.

**Gaps:**
- No role+profile-aware permissions
- No approval routing contracts
- No override logging
- No destructive-action gating
- No export restriction policies
- No provenance requirements enforcement
- No post-check hooks (only pre-check)

**AEEP target:** Refactor → `packages/policy-guard`. Enhance with: role+profile awareness, approval routing, override logging, destructive-action gating, export restrictions, provenance requirements, post-check hooks.

### `packages/guardian` (Active)

Guardian policy enforcement — blocks cognitive runtime on policy violation. **AEEP target:** Fold into `packages/policy-guard` as guardian enforcement mode.

### `packages/policy-engine` / `lib/covenant-policy` / `lib/policy-engine`

Multiple policy enforcement layers. **AEEP target:** Consolidate into `packages/policy-guard` with adapter shims for existing consumers.

---

## 7. Contracts / Schemas

### `packages/aef-contracts` (Active)

**Architecture:** Zod schemas for embed/rerank/search/ingest/index-ops/evals/openai-compat/evidence/events/backends/tenant.

**AEEP target:** Refactor → `packages/shared-contracts`. Extend with full AEEP v1 API contracts including typed role contracts.

### `packages/contracts` (Active)

**Architecture:** Zod schemas for auth/alloy/ai/admin/governance/webhooks. Tests included.

**AEEP target:** Keep as domain contract layer; extend for AEEP v1 routes.

---

## 8. Workflow / Approval Runtime

### `lib/workflow-engine` (Active)

Alloy workflow CRUD, execution routing, approval gates, agent coordination.

**AEEP target:** This is the Express/API-facing layer. Wire it to `packages/workflow-runtime` as the execution backend.

### `packages/approvals-inbox` (Active)

Approval queue management. **AEEP target:** Fold into `packages/workflow-runtime` approval subsystem.

---

## 9. Embedding / Reranking Runtime

### `apps/alloy-embedding-api` (Active)

Express 5 gateway — `/v1/embed`, `/v1/rerank`, `/v1/hybrid-search`, `/v1/ingest`, `/v1/index/rebuild`, `/v1/index/verify`, `/v1/evals/run`, `/v1/openai/embeddings`, `/health`, `/metrics`, `/docs`. Bearer-token auth, per-tenant rate limiting, Prometheus metrics, OTel tracing, evidence-ledger writes.

**AEEP target:** This becomes the embedding sub-router inside `apps/alloy-runtime-api`. The v1 API surface expands to include all AEEP endpoints.

### `workers/alloy-embed-worker` (Active)

MicroBatchQueue, 5 backends (cpu-local, external-http, gpu-stub, azure-stub, dev-hash), pooling (cls/mean/last_token), truncation, WarmPool.

**AEEP target:** Keep as `workers/alloy-vector-worker` (rename, semantic alignment).

### `workers/alloy-rerank-worker` (Active)

Cross-encoder HTTP backend + deterministic TF fallback.

**AEEP target:** Keep as `workers/alloy-rank-worker` (rename).

---

## 10. Eval Runtime

### `packages/eval-forge` / `packages/eval-os` / `packages/evals-core` (Active)

Multiple evaluation harness packages. **AEEP target:** Consolidate → `packages/evals`. Expose Evaluator role contract.

---

## 11. Typed Role Contracts (Required — Not Implemented)

AEEP requires bounded role contracts for all agent roles. Current state:

| Role | Exists? | Notes |
|------|---------|-------|
| `MissionPlanner` | No | Planner exists but not as typed bounded role |
| `RetrievalStrategist` | No | Retrieval adapters exist but no role contract |
| `MemoryCustodian` | No | Memory fabric exists but no role contract |
| `ToolOrchestrator` | No | Tool registry exists but no orchestrator contract |
| `PolicyGuardian` | No | Guardian package exists but not as typed role |
| `ExecutionSupervisor` | No | Run manager exists but no supervisor contract |
| `EvidenceSynthesizer` | No | Not implemented |
| `Evaluator` | No | Eval harness exists but no role contract |

**AEEP target:** Define all 8 typed role contracts in `packages/shared-contracts`. Each contract specifies: input schema, output schema, policy hooks (pre/post), evidence emission requirements, traceId propagation, approval conditions.

---

## 12. v1 API Surface Assessment

### Current endpoints (apps/alloy-embedding-api)
- `/v1/embed` — embedding generation
- `/v1/rerank` — result reranking
- `/v1/hybrid-search` — hybrid search
- `/v1/ingest` — data ingestion
- `/v1/index/rebuild` — index rebuild
- `/v1/index/verify` — index verification
- `/v1/evals/run` — eval execution
- `/v1/openai/embeddings` — OpenAI-compat endpoint

### Required AEEP v1 additions
- `/v1/tasks/plan` — task planning
- `/v1/tasks/execute` — task execution
- `/v1/memory/write` — memory write
- `/v1/memory/query` — memory query
- `/v1/workflows/start` — workflow start
- `/v1/workflows/resume` — workflow resume
- `/v1/workflows/approve` — workflow approval
- `/health` — health check (exists)
- `/metrics` — Prometheus metrics (exists)
- `/docs` — API documentation (exists)

**Gap:** 7 of 14 required AEEP v1 endpoints do not exist.

---

## 13. Keep / Refactor / Replace / Remove Matrix — Runtime

| Item | Decision | Reason |
|------|----------|--------|
| `cognitive-runtime` | Refactor → agent-core inner loop | Core loop is sound; needs role contracts + evidence threading |
| `alloy` | Refactor → workflow-runtime core | Execution model solid; needs event sourcing + idempotency |
| `szl-alloy` | Remove (adapter shim) | Thin wrapper; no unique value |
| `planner` | Fold into agent-core | Logical integration |
| `action-engine` | Fold into agent-core | Logical integration |
| `reflection-engine` | Keep as eval adapter | Unique value in quality scoring |
| `replay-core` | Fold into workflow-runtime | Timeline replay belongs there |
| `aef-retrieval-core` | Refactor → retrieval-core | Solid foundation; needs Evidence output + rerank hooks |
| `memory-fabric` | Refactor → memory-core | Solid 4-tier model; needs contradiction detection + source-linking |
| `aef-evidence-ledger` | Refactor → evidence-ledger | Needs full Evidence schema + PG store |
| `evidence-graph` | Fold into evidence-ledger | Relationship layer belongs in ledger |
| `aef-policy-guard` | Refactor → policy-guard | Needs role+profile awareness + approval routing |
| `guardian` | Fold into policy-guard | Policy enforcement belongs together |
| `policy-engine` / `covenant-policy` | Fold into policy-guard | Consolidate |
| `aef-contracts` | Refactor → shared-contracts | AEEP namespace + role contracts |
| `agents-core` / `agents-tools` | Fold into agent-core | |
| `agents-evals` | Fold into evals | |
| `eval-forge` / `eval-os` / `evals-core` | Consolidate → evals | |
| `approvals-inbox` | Fold into workflow-runtime | |
| `alloy-embedding-api` | Refactor → alloy-runtime-api sub-router | Embedding becomes sub-router |
| `alloy-embed-worker` | Keep, rename → alloy-vector-worker | |
| `alloy-rerank-worker` | Keep, rename → alloy-rank-worker | |
