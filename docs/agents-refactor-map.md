# Agent Layer Refactor Map — Phase 4

> **Date:** April 2026  
> **Purpose:** One-page mapping of existing agent-adjacent packages into the four canonical `agents-*` packages.  
> All migrations are additive during the transition. Old packages become re-export shims only after all consumers are migrated.

---

## Target Package Architecture

```
packages/
├── agents-core      — run lifecycle, retries, approval gates, OTel spans, structured logs
├── agents-tools     — typed tool definitions (Zod in/out + handler); approval-gate flag
├── agents-prompts   — prompt templates, semantic versioning, named references
└── agents-evals     — eval suites wired to tool/prompt registries
```

---

## Module Mapping

### `packages/agents-core`

| Moved from | Module / Concept | Notes |
|---|---|---|
| `cognitive-runtime` | `run()` orchestrator | Wrap in `AgentRun` lifecycle with typed status |
| `cognitive-runtime` | Phase loop (perceive → update) | Keep phases; expose via `AgentRun.runPhase()` |
| `cognitive-runtime` | `CheckpointStore` + `PostgresCheckpointStore` | Centralize here; remove from `cognitive-runtime` after migration |
| `cognitive-runtime` | `CognitiveLoopRun`, `PhaseResult`, `LoopStatus` types | Canonical run-level types live here |
| `guardian` | `GuardianDecisionEngine` | Gate hook called per step from `agents-core` |
| `policy-engine` | `checkAction`, `buildPolicyEvaluation` | Called inside the approval gate |
| `approvals-inbox` | `submitApprovalAction`, `getApprovalForRecommendation` | Approval-gate writes to inbox; orchestrator polls |
| `action-engine` | `ActionExecutor`, `ActionHistory` | Step executor wired into the run loop |
| `cognitive-observability` | `globalCollector`, OTel span helpers | Per-step span emission lives here |
| `trace-graph` | `TraceWriter`, `TraceGraphStore` | Structured log-per-step + OTel span stored here |

**New concepts introduced in `agents-core`:**
- `AgentRun` — typed run handle with `.start()`, `.step()`, `.complete()`, `.fail()` methods
- `RetryPolicy` — bounded retries per step with typed error categories
- `ApprovalGate` — synchronous gate that pauses the run, writes to approvals-inbox, and resumes on decision
- `RunErrorCategory` — typed error enum: `timeout | validation | provider | policy | unknown`
- `DeadLetterStore` — destination for runs that exhaust all retries

---

### `packages/agents-tools`

| Moved from | Module / Concept | Notes |
|---|---|---|
| `tool-mesh` | `ToolManifestSchema`, `ToolManifest` | Extended with mandatory Zod `inputSchema` + `outputSchema` |
| `tool-mesh` | `InMemoryToolRegistry`, `defaultToolRegistry` | Canonical registry rejects untyped tools at registration |
| `tool-mesh` | `ToolMeshGateway` | Execution gateway — wraps approval gate, rate limiter, tracing |
| `tool-mesh` | `ToolRateLimiter` | Keep; re-export via `agents-tools` |
| `tool-mesh` | `McpBridge` | MCP adapter lives here |
| `tool-mesh` | `tools/security-tools`, `finance-tools`, `operations-tools`, etc. | Domain tool definitions migrated as `TypedTool<In, Out>` |
| `tool-registry` | Entire package (already a shim) | Fully removed after migration; redirect to `@workspace/agents-tools` |

**New concepts introduced in `agents-tools`:**
- `TypedTool<TInput, TOutput>` — `{ manifest, inputSchema: ZodType<TInput>, outputSchema: ZodType<TOutput>, handler }` 
- `registerTypedTool()` — validates both schemas at registration time; throws if untyped
- `requiresApproval` flag on manifest triggers the approval gate in `agents-core`

---

### `packages/agents-prompts`

| Moved from | Module / Concept | Notes |
|---|---|---|
| `prompt-registry` | `PromptRegistry`, `PromptDefinition`, `PromptVersion` | Canonical registry; business logic must reference prompts by ID only |
| `prompt-registry` | `loadActivePrompt`, `loadPromptVersion`, `renderTemplate` | Kept; re-exported |
| `prompt-registry` | `PromptEvaluator` | Kept; wired to `agents-evals` eval suites |
| `cognitive-runtime` (inline templates) | Any inline string templates in phases | Replaced with `loadActivePrompt(id, vars)` calls |

**New concepts introduced in `agents-prompts`:**
- `PromptRef` — `{ id: string; versionConstraint?: string }` — typed reference instead of raw strings
- `resolvePrompt(ref, vars)` — resolves a `PromptRef` to a rendered string; validates variable presence
- `registerSeedPrompts()` — seed function that populates the registry with built-in system prompts
- Semantic versioning enforced: `v1`, `v2`, … with `draft → active → deprecated` lifecycle

---

### `packages/agents-evals`

| Moved from | Module / Concept | Notes |
|---|---|---|
| `eval-forge` | `runEvalSuite`, `computeAllMetrics`, `EvalSuiteDef`, `EvalCase` | Canonical eval runner |
| `eval-forge` | `graders` (all 10 eval types) | Keep; expose via `agents-evals` |
| `eval-forge` | `nightly-runner` | Scheduled eval runner |
| `eval-forge` | `EvalExecutor`, `EvalRunReport` | Typed executor contract |
| `evals-core` | Entire package (already a shim → `eval-forge`) | Fully removed after migration |
| `eval-os` | Entire package (already a shim → `eval-forge`) | Fully removed after migration |
| `replay-core` | `captureIncident`, `captureFlow`, `replayScenario` | Deterministic replay wired here for trace-replay evals |
| `trace-graph` | `TraceGraphReader`, `TraceGraphStore` | Used by evals to read run traces for grading |

**New concepts introduced in `agents-evals`:**
- `createToolEvalSuite(tool: TypedTool)` — auto-generates a `tool-reliability` eval suite from a typed tool
- `createPromptEvalSuite(ref: PromptRef)` — auto-generates a `prompt-eval` suite from a prompt version
- `replayRunAsEval(runId)` — replays a past run by ID; feeds captured tool I/O back as deterministic fixtures

---

## Migration Status

| Package | Status | Target |
|---|---|---|
| `cognitive-runtime` | Active — migrating | `agents-core` |
| `tool-mesh` | Active — migrating | `agents-tools` |
| `tool-registry` | **Deleted** (Apr 2026) | Removed; consumers use `@workspace/tool-mesh` / `@workspace/agents-tools` |
| `prompt-registry` | Active — migrating | `agents-prompts` |
| `evals-core` | **Deleted** (Apr 2026) | Removed; `grader-primitives` absorbed into `@workspace/eval-forge`; consumers use `@workspace/agents-evals` |
| `eval-os` | **Deleted** (Apr 2026) | Removed; consumers use `@workspace/agents-evals` (re-exports from `@workspace/eval-forge`) |
| `eval-forge` | Active — migrating | `agents-evals` |
| `replay-core` | Active — integrating | `agents-evals` (replay eval path) |
| `trace-graph` | Shared infra — keep | Used by `agents-core` + `agents-evals` |
| `guardian` | Active — keep as dep | Re-exported via `agents-core` |
| `policy-engine` | Active — keep as dep | Re-exported via `agents-core` |
| `action-engine` | Active — integrating | `agents-core` step executor |
| `decision-engine` | Active — keep as dep | Used by `agents-core` planner |
| `reflection-engine` | Active — keep as dep | Used by `cognitive-runtime` reflect phase |
| `planner` | Active — keep as dep | Used by `agents-core` plan phase |
| `approvals-inbox` | Shared UI service — keep | Written to by `agents-core` approval gate |
| `ai-control-plane` | Shared infra — keep | Model routing used by `agents-core` |
| `cognitive-observability` | Shared infra — keep | OTel helpers used by `agents-core` |

---

## Dependency Graph (Post-Migration)

```
agents-evals
  └── agents-tools (for TypedTool contracts)
  └── agents-prompts (for PromptRef contracts)
  └── eval-forge (eval runtime)
  └── replay-core (trace replay)
  └── trace-graph (trace reading)

agents-core
  └── agents-tools (tool invocation)
  └── agents-prompts (prompt resolution)
  └── guardian + policy-engine (approval gate)
  └── approvals-inbox (gate writes)
  └── action-engine (step executor)
  └── planner (plan phase)
  └── cognitive-observability (OTel + metrics)
  └── trace-graph (structured log)

agents-tools
  └── tool-mesh (registry, gateway, manifests)
  └── cognitive-observability (trace hooks)
  └── guardian (approval tier mapping)

agents-prompts
  └── prompt-registry (registry + loader)
```
