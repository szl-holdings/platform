# SZL Agentic Cognitive Operating Intelligence Platform — Core Architecture

> Version 1.0 · April 2026

## Overview

The Platform Core establishes eight shared cognitive layers that form the operational backbone of the SZL Agentic Cognitive Operating Intelligence Platform. Every application — Lyte, Alloy, Terra, PRISM, Vessels, Aegis, Imperium, Command, Carlota Jo, CORTEX — will progressively adopt these layers through per-app 3.0 upgrade tasks.

**This is purely additive.** No existing application code, routes, or UI behavior changes as a result of this foundation.

---

## Layer Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Application Layer                               │
│   Terra  Vessels  Aegis  PRISM  Command  Carlota Jo  Lyte  CORTEX  │
└────────────────────────┬────────────────────────────────────────────┘
                         │ (per-app 3.0 adoption tasks)
┌────────────────────────▼────────────────────────────────────────────┐
│                   @workspace/alloy (Alloy OS)                       │
│   Run Manager · Checkpoint/Replay · Model Router · Action Ledger    │
├───────────────────┬─────────────────────┬───────────────────────────┤
│  @workspace/      │  @workspace/         │  @workspace/              │
│  tool-mesh        │  memory-fabric       │  trace-graph              │
│  (MCP Gateway)    │  (Tiered Memory)     │  (Trace Capture)          │
├───────────────────┼─────────────────────┼───────────────────────────┤
│  @workspace/guardian (Policy Engine + Approval Tiers)               │
├─────────────────────────────────────────────────────────────────────┤
│  @workspace/constellation (Cross-Domain Operational Graph)          │
├─────────────────────────────────────────────────────────────────────┤
│  @workspace/eval-os (Evaluation Framework)                          │
├─────────────────────────────────────────────────────────────────────┤
│  @workspace/cognitive-observability (Telemetry & Metrics)           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layer Contracts

### 1. Constellation (`@workspace/constellation`)

**Purpose**: Cross-domain ontology and operational graph. The single source of truth for all entities across the platform.

**Key contracts**:
- `ConstellationNode` — typed node with provenance, freshness, confidence, sensitivity tier, business impact, linked traces
- `ConstellationEdge` — typed edge with provenance and weight
- `DomainAdapter` interface — projects domain data (Terra parcels, Vessels ships, PRISM matters) into the graph without schema changes
- `InMemoryGraphStore` — reference store; apps wire a database adapter per-app
- Query helpers: `findNeighbors`, `findPath`, `subgraph`, `searchNodes`

**Absorption target**: `@szl-holdings/atlas-core`

---

### 2. Alloy OS (`@workspace/alloy`)

**Purpose**: Cognitive runtime and execution fabric. The orchestration engine every agent workflow runs through.

**Key contracts**:
- `RunManager` — creates and executes multi-step workflows with Guardian gating per step
- `WorkflowStep` / `StepContext` / `StepResult` — typed step contract
- `CheckpointStore` — saves/restores run state for replay and recovery
- `ModelRouter` — selects the optimal model given latency budget and cost constraints
- `ActionLedgerWriter` — immutable record of all actions in a run
- Reference workflow: `runReferenceWorkflow` (ECHO → VALIDATE end-to-end demo)

**Dependencies**: Guardian, Tool Mesh, Trace Graph

**Absorption target**: `@szl-holdings/action-engine`

---

### 3. Trace Graph (`@workspace/trace-graph`)

**Purpose**: Full-fidelity run/agent/tool trace capture and deterministic replay.

**Key contracts**:
- `TraceRecord` — captures all 20+ fields from the spec including model, prompt version, tool calls, retrieval, memory I/O, citations, latency, tokens, cost, approvals, guardrails, errors, retries, rollback, business impact
- `TraceWriter` — append-only API for recording trace events
- `TraceReplayer` — visitor-pattern replay API + trace comparison/diff
- `InMemoryTraceStore` — reference store; wire a DB adapter per-app

**Absorption target**: `@szl-holdings/replay-core`

---

### 4. Eval OS (`@workspace/eval-os`)

**Purpose**: Unified evaluation framework for benchmarking agent behavior over time.

**Key contracts**:
- 10 eval categories: gold-dataset, scenario-suite, prompt-test, tool-reliability, citation-quality, hallucination, policy-adherence, latency, cost, regression
- `EvalPack` — named collection of scenarios and examples
- `runPack(opts)` — async runner that exercises your agent against all examples and produces a scored `EvalReport`
- `detectRegressions(baseline, current)` — automated regression detection
- `SAMPLE_EVAL_PACK` — baseline eval pack for platform core primitives

**Absorption target**: `@szl-holdings/evals-core`

---

### 5. Memory Fabric (`@workspace/memory-fabric`)

**Purpose**: Tiered memory system with eight distinct memory tiers, each with provenance, freshness, confidence, retention, and sensitivity tracking.

**Key contracts**:
- 8 tiers: session, workflow, entity, artifact, executive, domain, operator-feedback, long-term
- `MemoryEntry` — fully typed with provenance, confidence, retention policy, sensitivity, linked traces and entities
- `InMemoryStore` — reference store with `getByKey`, `list`, `evictExpired`
- Retention helpers: `applyRetentionDefaults`, `isExpired`, `checkSensitivity`

---

### 6. MCP Tool Mesh (`@workspace/tool-mesh`)

**Purpose**: First-class tool registry and gateway. Every tool used by agents must be registered here.

**Key contracts**:
- `ToolManifest` — schema, domain tags, policy tier, allowed environments, rate limits, timeouts, failure modes, fallback, approval requirements, owner, observability hooks
- `InMemoryToolRegistry` — register, get, list, unregister tools
- `ToolMeshGateway` — invokes tools after consulting Guardian, emits Trace Graph spans
- Reference tools: `graph-query` and `document-retrieval`

**Dependencies**: Guardian, Trace Graph

**Absorption target**: `@szl-holdings/tool-registry`

---

### 7. Guardian (`@workspace/guardian`)

**Purpose**: Unified policy engine with 8 approval tiers. Deny-by-default when no tier is set.

**Key contracts**:
- 8 policy tiers from `advisory-only` (risk 1) to `human-approval-mandatory` (risk 8)
- `GuardianDecisionEngine` — rule evaluation, tier gating, deny-by-default
- `GuardianRule` — condition DSL (eq, neq, in, gt, lt, matches, exists), priority ordering, enable/disable
- Decision outcomes: `allow`, `deny`, `require-approval`
- `human-approval-mandatory` always requires approval regardless of rules

**Absorption target**: `@szl-holdings/policy-engine`

---

### 8. Cognitive Observability (`@workspace/cognitive-observability`)

**Purpose**: Telemetry, quality, cost, drift, and value metrics with OpenTelemetry-compatible export.

**Key contracts**:
- 15 typed metric definitions covering the full spec: latency, tokens, tool errors, retrieval quality, memory hit rate, hallucination rate, citation coverage, approval bottlenecks, override rate, rollback count, drift, value created, value at risk, agent reliability score, cost
- `InMemoryMetricCollector` — record and flush metrics
- `ConsoleOtelExporter` — development exporter
- `HttpOtelExporter` — production OTel endpoint exporter
- `BatchingExporter` — configurable flush interval with a background timer
- `toOtelPayload` — converts metrics to OTel-compatible wire format

**Absorption target**: `@szl-holdings/observability-core`

---

## How the Layers Compose

```
Agent Request
      │
      ▼
Alloy RunManager.executeSteps()
      │
      ├─ Guardian.decide() ──────────────────► deny / require-approval
      │        (per step, per tool call)
      │
      ├─ ToolMesh.Gateway.invoke()
      │       ├─ Guardian.decide()
      │       ├─ TraceWriter.appendToolCall()
      │       └─ ToolHandler(input, manifest)
      │
      ├─ TraceWriter.appendSpan() / appendMemoryIO() / appendRetrieval()
      │
      ├─ CheckpointStore.save()
      │
      ├─ ActionLedger.record()
      │
      └─ CognitiveObservability.collector.recordKnown()
                  │
                  └─ OtelExporter.export()
```

---

## Adoption Path for Existing Apps

Each app adopts the platform core in a **separate follow-up task** for its 3.0 upgrade. The recommended adoption sequence is:

### Phase 1 — Foundation (no behavior change)
These packages are available now. No app needs to change anything yet.

### Phase 2 — Guardian wiring (per app)
1. Import `@workspace/guardian`
2. Create a `GuardianDecisionEngine` instance in the app's server initialization
3. Register app-specific allow rules for each API route category
4. Add Guardian checks to sensitive API handlers

### Phase 3 — Constellation projection (per domain)
1. Implement a `DomainAdapter` for each domain entity type
2. Register the adapter with `adapterRegistry`
3. Run `projectDomain` during data ingestion / seed

### Phase 4 — Trace Graph emission (per app)
1. Create a `TraceWriter` instance backed by a database adapter
2. Wrap agent calls with `writer.startTrace()` / `writer.completeTrace()`
3. Append tool calls, retrieval, memory I/O, and guardrail results

### Phase 5 — Memory Fabric adoption (per workflow)
1. Create a `MemoryStore` instance
2. Persist session context and workflow state to the fabric
3. Apply retention defaults and sensitivity controls

### Phase 6 — Observability wiring (per app)
1. Create an `InMemoryMetricCollector`
2. Record metrics at key agent lifecycle events
3. Configure a `BatchingExporter` with an `HttpOtelExporter` pointing at your OTel collector

### Phase 7 — Eval OS adoption (per app)
1. Build an eval pack for each agent workflow
2. Add eval pack runs to CI as a gate on agent regressions
3. Use `detectRegressions` to gate releases

---

## Non-Goals of This Foundation

- **No app changes**: Zero behavior changes to existing apps in this task.
- **No per-app 3.0 upgrades**: Each app's 3.0 upgrade is a separate task.
- **No mass schema migrations**: Constellation ships adapter interfaces; actual DB projections happen per-app.
- **No production deployment or tenant rollout**: This is foundation code only.
- **No existing package deletion**: Overlapping packages are absorbed via re-export or compatibility shim.

---

## Package Directory

| Package | npm name | Absorbs |
|---------|---------|---------|
| `packages/constellation` | `@workspace/constellation` | `@szl-holdings/atlas-core` |
| `packages/alloy` | `@workspace/alloy` | `@szl-holdings/action-engine` |
| `packages/trace-graph` | `@workspace/trace-graph` | `@szl-holdings/replay-core` |
| `packages/eval-os` | `@workspace/eval-os` | `@szl-holdings/evals-core` |
| `packages/memory-fabric` | `@workspace/memory-fabric` | _(new)_ |
| `packages/tool-mesh` | `@workspace/tool-mesh` | `@szl-holdings/tool-registry` |
| `packages/guardian` | `@workspace/guardian` | `@szl-holdings/policy-engine` |
| `packages/cognitive-observability` | `@workspace/cognitive-observability` | `@szl-holdings/observability-core` |
