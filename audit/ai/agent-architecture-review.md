# Agent Architecture Review
**Date:** 2026-04-20  
**Phase:** Series-A Reset — Phase 10  
**Scope:** End-to-end agentic platform architecture

---

## Executive Summary

The AEEP (Autonomous Enterprise Execution Platform) agent stack is structurally sound and maps cleanly onto the seven target layers. All layers are implemented as distinct TypeScript packages with typed interfaces. The canonical nine-stage event chain (INGEST → TRANSFORM → ANALYZE → DECIDE → APPROVE → EXECUTE → VERIFY → AUDIT → DELIVER) is fully expressed through the cognitive-runtime phase loop. The primary gaps are: (1) the policy layer is split across two partially-overlapping packages with inconsistent evaluation paths; (2) the observability collector is in-memory only with no durable export path connected end-to-end; (3) intended-vs-observed comparison in the Verifier layer is post-hoc rather than pre-bound to plan steps; (4) memory growth bounds are declared but not enforced at the store level for the in-memory fallback. No silent irreversible automation exists — every high-risk path requires explicit approval.

---

## Seven-Layer Stack Map

### Layer 1 — Planner
**Packages:** `packages/planner`  
**Key types:** `PlanGraph`, `PlanStep`, `PlanContext`, `RouteDecision`, `RollbackPoint`  

The Planner decomposes an objective into a typed `PlanGraph` via five pure functions executed in pipeline order:

```
decomposeObjective → routePlanSteps → estimateRiskAndApprovals → topoSort → generateFallbackPlans → rankFallbacks
```

**Strengths:**
- Fully typed with Zod schemas; invalid context is rejected at the boundary.
- Topological sort detects cycles and raises `PlanCycleError` deterministically.
- Risk estimation automatically gates steps at or above the configurable `approvalThreshold`.
- Rollback points are auto-injected for any step with `riskLevel ≥ high`.
- Counterfactual fallback plans are generated and ranked by the decision-engine.
- `replayPlan` provides deterministic what-if queries over stored plans.

**Gaps:**
- Step decomposition (`decomposeObjective`) is heuristic when no seeds are supplied; the five-phase skeleton (Perceive → Plan → Act → Verify → Reflect) is a reasonable default but produces identical structure for all objectives. Production deployments should drive seed injection from domain-specific profiles.
- `PlanStep.inputs` is `Record<string, unknown>` — no schema validation at decomposition time. A downstream executor may receive malformed inputs.
- `estimatedRisk` on the "Act" baseline step is hard-coded to 0.55, which always crosses a `high` threshold and always demands an approval gate. This may cause approval fatigue in low-stakes domains; threshold should be per-domain configurable.

---

### Layer 2 — Tool Router
**Packages:** `packages/tool-mesh`, `packages/ai-control-plane`  
**Key types:** `ToolManifest`, `ToolMeshExecutor`, `ModelRouter`, `RouteRequest`, `RouteResult`

Two distinct routing concerns are cleanly separated:

- **Model routing** (`ai-control-plane/router.ts`): selects the LLM endpoint by `routeClass` + agent tier + budget, with circuit-breaker per provider and eval-score-aware selection.
- **Tool routing** (`tool-mesh/gateway.ts`): resolves a registered handler by tool ID, validates input schema, enforces per-tool rate limits, and records an immutable `ToolExecutionRecord`.

**Strengths:**
- Circuit breaker opens after 5 failures, auto-recovers after 30 s.
- `executeWithTimeout` wraps every handler call.
- MCP bridge (`mcp-bridge.ts`) enables external tool integration without changing internal routing.
- Schema validator enforces JSON-Schema-like contracts on tool inputs.
- Agent tier definitions (`agent-tiers.ts`) restrict which route classes and tools are accessible per tier — preventing `assistant`-tier agents from using `operator`-only tools.

**Gaps:**
- `ToolExecutionRecord.output` is typed as `unknown`. Output schemas are not enforced post-execution — the executor validates input but not the result returned by the handler.
- Tool timeout defaults are not declared per-manifest; timeout is injected by the caller. A tool registered without a `timeoutMs` in its manifest relies entirely on the caller to set one.
- Rate-limiter state is process-local (in-memory). In a horizontally-scaled deployment, per-tool rate limits are not coordinated across instances.
- The `ModelRouter` exports a singleton `modelRouter` — there is no per-run or per-tenant model router instance, making per-tenant policy overrides (e.g. forcing local models for sensitive tenants) a manual caller responsibility.

---

### Layer 3 — Context / Memory
**Packages:** `packages/memory-fabric`, `packages/memory-core`  
**Key types:** `MemoryEntry`, `MemoryStore`, `MemoryStoreQuery`, `InMemoryStore`, `PostgresStore`

**Strengths:**
- `MemoryEntry` is fully typed with Zod including provenance, freshness, sensitivity, retention policy, and domain scoping.
- `assertMemoryDomain` is called on every write — the invariant that all memory has a domain tag is enforced at runtime.
- Sensitivity levels (`public / internal / confidential / restricted`) are declared on every entry.
- Retention policies (`ephemeral / session-scoped / workflow-scoped / persistent / archival`) are modeled with optional `expiresAt` and `maxAgeDays`.
- `evictExpired()` removes entries past their TTL.
- Domain mirroring into `metadata.domain` ensures SQL readers see consistent values.

**Gaps:**
- `evictExpired()` is not called on a schedule — callers must invoke it manually. In long-running processes, expired entries accumulate until explicitly evicted.
- `InMemoryStore` has no hard cap on total entry count. The `maxAgeDays` and `expiresAt` fields are declared but only honored when `evictExpired()` is called. Memory growth in the in-memory fallback is unbounded.
- Context budget (prompt token limits) is not enforced by the memory layer. `MemoryStore.list()` returns all matching entries with no pagination or token-count guard. Callers must manually slice results.
- Scoped memory for sub-tasks (e.g. per-step `scopeId`) is modeled but there is no automatic cleanup when a step completes — stale working memory from completed steps persists until explicit deletion or eviction.
- The `PostgresStore` exists but the integration between `cognitive-runtime` and memory hydration is not wired end-to-end; the orchestrator constructs a `MemoryStore` but session memory is not automatically re-hydrated on `resumeFromCheckpoint`.

---

### Layer 4 — Policy / Guardrails
**Packages:** `packages/policy-engine`, `packages/policy-guard`, `packages/ai-control-plane` (policy-engine.ts, pii-redactor.ts), `packages/guardian`  
**Key types:** `Policy`, `PolicyRule`, `PolicyEvaluation`, `PolicyEvaluationResult`

**Strengths:**
- `PolicyEvaluation` captures every input used in a decision — the record is self-contained and reproducible without external state.
- `PolicyEvaluationSchema` (Zod) rejects empty or partial payloads at the action-engine boundary.
- Built-in guardrails cover: high-cost autonomous execution (>$10k requires admin approval), regulatory exposure escalation, data privacy sensitivity gating, and irreversible action confirmation.
- `PiiRedactor` scans for 10+ PII pattern types and injection signatures before any prompt is sent to a model.
- PRISM Counsel has domain-specific policy profiles (`prism-counsel-policies.ts`).
- Guardian (`packages/guardian`) adds a second, independent decision engine layer.

**Gaps:**
- **Split evaluation paths:** `policy-engine` (package-level) and `ai-control-plane/policy-engine.ts` are two separate implementations with overlapping but not identical rule sets. A caller that imports from `@szl-holdings/policy-engine` bypasses the `ai-control-plane` PII scan and vice versa. There is no single choke-point that guarantees both run before execution.
- `PolicyRule.conditions` are evaluated by a hand-rolled operator interpreter in `evaluator.ts`. The `matches` operator applies a RegExp but does not bound regex complexity — pathological patterns could cause catastrophic backtracking.
- `allow`-effect rules exist in the type system but are not modeled in `BUILT_IN_GUARDRAILS` — all built-in rules use `require_approval` or `escalate`. An explicit allow-list (tools/actions that are always permitted without policy evaluation) is not declared.
- Guardrail bypass via `audit_only` mode: the `audit_only` effect records a violation but does not block or gate — this is by design but there is no rate monitor on `audit_only` violations, so a slow policy breach can go unnoticed.
- Sensitivity handling for `restricted` data in memory (e.g. preventing `restricted` entries from being included in prompts sent to non-local models) is declared in the type system but not enforced by the Tool Router or Memory layer — callers must self-enforce.

---

### Layer 5 — Execution
**Packages:** `packages/agents-core`, `packages/cognitive-runtime`, `packages/workflow-runtime`  
**Key types:** `AgentRun`, `StepDefinition`, `CognitiveLoopRun`, `CognitiveContext`

**Strengths:**
- `AgentRun` is the canonical execution unit with typed `StepDefinition`, per-step timeout, retry policy (exponential backoff with jitter-ready structure), approval gate integration, dead-letter routing, and OTel-compatible span emission.
- The cognitive-runtime `orchestrator` implements all eight `COGNITIVE_LOOP_PHASES` (perceive → orient → plan → execute → verify → reflect → update_self_model → update_memory) with checkpoint/resume support.
- `guardianEnabled` / `verifierEnabled` / `reflectionEnabled` flags allow phases to be toggled per run context.
- Dry-run mode (`dryRun: true`) short-circuits tool execution without changing run semantics.
- Dead-letter queue captures runs that exhaust all retries, preserving the failure context for async diagnosis.
- `checkpointEveryNSteps` enforces periodic state snapshots, enabling rollback to any persisted checkpoint.

**Gaps (Execution layer):**
- **Canonical event chain mapping:** The nine-stage AEEP chain (INGEST → TRANSFORM → ANALYZE → DECIDE → APPROVE → EXECUTE → VERIFY → AUDIT → DELIVER) is not surfaced as a named type or constant — it is implicit in the phase order. Adding an explicit `EventChainStage` enum and asserting the current phase against it would make deviations detectable.
- `workflow-runtime` (`run-engine.ts`) exists as a separate execution path from `cognitive-runtime`. The seam between the two is not documented; it is unclear which layer a caller should use for a given use-case, creating risk of divergent execution behavior.
- `AgentRun.step()` increments `stepCtx.attemptNumber` before calling the handler, meaning attempt 1 always reports as attempt 2. Minor but misleading in logs.
- Parallel step execution is not supported. All steps in `executionOrder` run serially, even when their `dependsOn` graphs allow parallelism.

---

### Layer 6 — Verification
**Packages:** `packages/verifier`, `packages/evidence-ledger`  
**Key types:** `VerifierDecision`, `VerifierOutput`, `CheckResult`, `DecisionAction`, `EvidenceLedger`

**Strengths:**
- Eight built-in checks: field completeness, citation coverage, contradiction detection, confidence calibration, domain rule evaluation, action safety (reversibility, blast radius, cost), policy compliance, and unsupported claims.
- `aggregateDecision` reduces all check results to a single `DecisionAction` using priority ordering (approve < revise < request_more_evidence < escalate < route_to_human_review < block).
- `VerifierDecision` is stored and indexed by trace, target, and org for audit retrieval.
- `EvidenceLedger` is append-only with frozen entries — immutability is enforced at the JavaScript object level.
- `EvidenceLedger.compilePackage` produces a self-contained evidence bundle with aggregated confidence and freshness.

**Gaps:**
- **Intended-vs-observed comparison is post-hoc.** The verifier receives the output of an already-completed step and checks it against domain rules and citations. There is no pre-execution step contract (expected output schema, expected side effects) that the verifier compares against — the "intended" half of the comparison is implicit.
- `VerifierDecision` does not carry a reference back to the `PlanStep` it was verifying, making it hard to correlate verification failures with specific plan nodes in the run ledger.
- The `EvidenceLedger` is in-memory only (array-backed). Entries do not survive process restart. For production auditability, the ledger must be persisted — currently only `run-ledger` has a `PostgresLedgerStore`.
- `disabledChecks` allows callers to suppress any built-in check by name. There is no policy-level guard preventing a caller from disabling the action safety or policy compliance checks.
- Citation verification (`citation.verified`) is a boolean flag set by the caller — the verifier trusts the caller's assertion rather than independently verifying the citation against its source.

---

### Layer 7 — Observability
**Packages:** `packages/cognitive-observability`, `packages/observability-core`, `packages/run-ledger`  
**Key types:** `CognitiveMetric`, `MetricCollector`, `RunLedgerEntry`, `TraceWriter`

**Strengths:**
- 15 named `KnownMetricName` constants covering latency, cost, token counts, error rates, approval bottleneck, hallucination rate, override rate, rollback count, drift score, and value at risk.
- `globalCollector` records all metrics with timestamps and typed labels.
- `TraceWriter` emits OTel-compatible spans and tool call records per step; traces are indexed by `traceId`.
- `RunLedgerEntry` (via `@szl-holdings/contracts/governance`) captures stage timings, tool calls, policy outcomes, approval events, eval scores, and quality gate results.
- `run-ledger` has both in-memory and `PostgresLedgerStore` implementations.
- `emitStepLog` provides structured step-level logging (level, message, data) that flows to the observability pipeline.

**Gaps:**
- `globalCollector` is an in-memory buffer with no durable export path wired end-to-end. The `exporter.ts` file exists in `cognitive-observability` but is not automatically called — metrics accumulate until `flush()` is called manually or the process exits.
- `observability-core` has correlation and context utilities but is not connected to `cognitive-observability`. Two parallel observability stacks (one per package) exist without a unifying export pipeline.
- There is no operator-readable run summary generated at run completion. `AgentRunSummary` contains step results but no human-readable narrative. Operators debugging a failed run must reconstruct the story from raw step logs.
- Metric cardinality is unconstrained — `labels` is a free-form `Record<string, string>`. High-cardinality labels (e.g. `runId` per metric data point) will cause unbounded label explosion in any time-series backend (Prometheus, OTEL Collector).
- Latency percentile tracking (p50/p95/p99) is not built into `CognitiveMetric`; only raw values are stored. Histogram buckets must be computed by the consumer.

---

## Canonical Event Chain — Current Implementation Status

| Stage    | Cognitive Phase           | Package(s)                         | Status          |
|----------|---------------------------|------------------------------------|-----------------|
| INGEST   | `perceive`                | cognitive-runtime/phases/perceive  | Implemented     |
| TRANSFORM| `orient`                  | cognitive-runtime/phases/orient    | Implemented     |
| ANALYZE  | `plan` (decompose+route)  | planner                            | Implemented     |
| DECIDE   | `plan` (risk+approve gate)| planner, policy-engine             | Implemented     |
| APPROVE  | approval-gate             | agents-core/approval-gate          | Implemented     |
| EXECUTE  | `execute`                 | agents-core/run, cognitive-runtime | Implemented     |
| VERIFY   | `verify`                  | verifier                           | Implemented     |
| AUDIT    | `reflect` + ledgers       | run-ledger, evidence-ledger        | Partial — in-memory only |
| DELIVER  | `complete`                | agents-core/run.complete()         | Implemented     |

The event chain is implemented end-to-end. The AUDIT stage is the weakest link — evidence is persisted to the `run-ledger` (Postgres-backed) but the `evidence-ledger` is still in-memory. The DECIDE/APPROVE seam is well-enforced through the planner's risk estimator and the approval gate in `agents-core`.

---

## Priority Gap Remediation

| Priority | Gap | Recommended Action |
|----------|-----|--------------------|
| P0 | Split policy evaluation paths | Introduce a single `evaluateFull(request)` facade in `policy-engine` that chains PII scan → policy evaluation → guardian check before any handler is called |
| P0 | `EvidenceLedger` is in-memory | Persist entries to Postgres using the same pattern as `RunLedgerStore` |
| P1 | No output schema validation | Add `outputSchema` field to `ToolManifest`; validate handler return value in executor |
| P1 | Memory growth unbounded | Schedule `evictExpired()` on a background timer in `MemoryStore` init |
| P1 | No operator run summary | Emit a structured narrative summary at `AgentRun.complete()` and `CognitiveLoopRun` completion |
| P2 | Parallel step execution | Support fan-out for steps whose `dependsOn` sets are satisfied simultaneously |
| P2 | Metric export not wired | Auto-flush `globalCollector` to configured OTEL exporter on a periodic interval |
| P3 | Intended-vs-observed contract | Add `expectedOutput` schema to `PlanStep`; verifier compares actual output against contract |

---

## Conclusion

The AEEP agentic stack is architecturally well-structured. All seven layers exist, are typed, and compose through clear interfaces. High-risk operations universally require approval — there is no path to irreversible autonomous execution without a human gate. The most critical near-term work is unifying the policy evaluation path, persisting the evidence ledger, and connecting the observability export pipeline.
