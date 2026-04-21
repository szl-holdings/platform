# Observability Review
**Date:** 2026-04-20  
**Phase:** Series-A Reset — Phase 10  
**Scope:** Step traces, latency/error/retry/outcome metrics, operator-readable run summaries

---

## Executive Summary

The AEEP platform has two parallel observability stacks (`cognitive-observability` and `observability-core`) that are not currently unified into a single export pipeline. Metric definitions are well-designed (15 named constants covering the full operational surface), OTel-format exporters exist (`ConsoleOtelExporter`, `HttpOtelExporter`, `BatchingExporter`), and the `run-ledger` captures rich per-run structured records. The critical gaps are: the `BatchingExporter` is never started automatically — metrics accumulate indefinitely in `globalCollector` until a caller manually invokes `flush()`; there is no operator-readable narrative summary at run completion; high-cardinality labels create time-series backend risk; and `observability-core` (distributed tracing + correlation context) is not wired to `cognitive-observability` (metrics), leaving two disconnected instrumentation paths.

---

## Observability Stack Inventory

### Package 1: `cognitive-observability`

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `InMemoryMetricCollector` | collector.ts | Buffer metrics in-process | Active |
| `globalCollector` | collector.ts | Singleton instance | Active |
| `CognitiveMetric` / `KnownMetricName` | metrics.ts | 15 typed metric definitions | Active |
| `ConsoleOtelExporter` | exporter.ts | Print metrics to stdout | Present, not auto-started |
| `HttpOtelExporter` | exporter.ts | POST metrics to OTEL Collector | Present, not auto-started |
| `BatchingExporter` | exporter.ts | Flush collector on interval | Present, **never started** |

### Package 2: `observability-core`

| Component | Path | Purpose | Status |
|-----------|------|---------|--------|
| Correlation context | context/index.ts | Propagate trace context across async boundaries | Present |
| Correlation ID utilities | correlation/index.ts | Generate and attach correlation IDs | Present |
| Middleware | middleware/ | HTTP middleware for trace propagation | Present |

### Package 3: `run-ledger`

| Component | Status |
|-----------|--------|
| `RunLedgerBuilder` | Active — builds structured run records |
| `RunLedgerEntry` | Active — captures stage timings, tool calls, policy outcomes, approval events, eval scores |
| `InMemoryRunLedgerStore` | Active |
| `PostgresRunLedgerStore` | Available — must be explicitly activated |
| `MutableRunLedgerStore` | Active — swappable backend |
| `evaluateQualityGate` | Active — 5-gate post-run quality check |

### Package 4: `trace-graph` (referenced by `agents-core`)

| Component | Purpose | Status |
|-----------|---------|--------|
| `TraceWriter` | Append OTel-compatible spans and tool-call records per trace | Active |
| `defaultTraceStore` | In-memory span storage | Active |

---

## Step Trace Coverage

Every step in an `AgentRun` emits:

```
run.start        → emitStepLog (info) + globalCollector.recordKnown('run_started')
step.start       → globalCollector.recordKnown('step_started', 1, {runId, stepId, stepName, spanId})
step.complete    → TraceWriter.appendToolCall + TraceWriter.appendSpan + globalCollector.recordKnown('step_completed', durationMs)
step.fail        → TraceWriter.appendToolCall(success: false) + TraceWriter.appendSpan(status: 'error') + globalCollector.recordKnown('step_failed', durationMs)
run.complete     → TraceWriter.completeTrace + globalCollector.recordKnown('run_completed', durationMs)
run.fail         → TraceWriter.recordError + TraceWriter.completeTrace + globalCollector.recordKnown('run_failed')
approval.pending → globalCollector.recordKnown('run_status_transition', 1, {status: 'pending_approval'})
```

Cognitive loop phases additionally emit per-phase `PhaseResult` records captured in `CognitiveLoopRun.phases`.

**Assessment:** Step trace coverage is comprehensive. Every state transition is instrumented. The OTel span model is correctly implemented with `spanId`, `parentSpanId`, latency, and status.

**Gap:** `TraceWriter.appendSpan` attributes include `toolId`, `promptId`, and `retryCount` — but not `agentId`, `domain`, or `tenantId`. Cross-tenant trace filtering is not possible from span data alone.

---

## Metric Coverage Assessment

### Defined Metrics

| Metric Name | Type | Unit | Populated By | Gap |
|-------------|------|------|-------------|-----|
| `latency_ms` | histogram | ms | `step_completed` (durationMs) | Only populated at step level, not per cognitive phase |
| `token_count` | counter | tokens | Not currently emitted | **No emitter found** |
| `tool_error_rate` | gauge | ratio | Not computed as a ratio | Raw `step_failed` count only |
| `retrieval_quality_score` | gauge | score | Not currently emitted | **No emitter found** |
| `memory_hit_rate` | gauge | ratio | Not currently emitted | **No emitter found** |
| `hallucination_rate` | gauge | ratio | Not currently emitted | **No emitter found** |
| `citation_coverage` | gauge | ratio | Not currently emitted | **No emitter found** |
| `approval_bottleneck_ms` | histogram | ms | Not currently emitted | **No emitter found** |
| `override_rate` | gauge | ratio | Not currently emitted | **No emitter found** |
| `rollback_count` | counter | events | Not currently emitted | **No emitter found** |
| `drift_score` | gauge | score | Not currently emitted | **No emitter found** |
| `value_created_usd` | counter | USD | Not currently emitted | **No emitter found** |
| `value_at_risk_usd` | gauge | USD | Not currently emitted | **No emitter found** |
| `agent_reliability_score` | gauge | score | Not currently emitted | **No emitter found** |
| `cost_usd` | counter | USD | Not currently emitted | **No emitter found** |

**Critical finding:** 12 of the 15 defined metrics have no active emitter. The metric schema is well-designed but almost entirely unimplemented. Only `latency_ms` (as `step_completed` duration), plus raw event counts for `run_started`, `run_completed`, `run_failed`, `step_started`, `step_completed`, `step_failed`, and `run_status_transition` are currently populated.

---

## Export Pipeline Assessment

### Current State

```
globalCollector.recordKnown(...)
     │
     ▼
InMemoryMetricCollector.buffer (unbounded array)
     │
     ▼
  [Nothing] — no auto-flush, no periodic export
```

The `BatchingExporter` class exists and is correct — but its `start()` method is never called anywhere in the codebase. Metrics accumulate in `globalCollector.buffer` indefinitely.

### What Should Happen

```
globalCollector.recordKnown(...)
     │
     ▼
InMemoryMetricCollector.buffer
     │ (auto-flush every 60s)
     ▼
BatchingExporter.start() [called at process startup]
     │
     ▼
HttpOtelExporter → OTEL Collector endpoint
     │
     ▼
Prometheus / Grafana / Datadog / etc.
```

**Recommendation:** In the API server startup path, call:

```typescript
import { BatchingExporter, globalCollector, HttpOtelExporter } from '@workspace/cognitive-observability';

const exporter = new BatchingExporter(
  new HttpOtelExporter({ endpoint: process.env.OTEL_EXPORTER_ENDPOINT! }),
  globalCollector,
  60_000, // 60s flush interval
);
exporter.start();
process.on('SIGTERM', () => exporter.shutdown());
```

This is the single highest-impact observability fix — it requires zero schema changes and makes all currently-recorded metrics durable.

---

## Label Cardinality Analysis

### High-Cardinality Labels (Risk)

| Label | Used In | Cardinality | Risk |
|-------|---------|-------------|------|
| `runId` | `step_started`, `step_completed`, `step_failed` | Unbounded (UUID per run) | High — explodes time-series count in Prometheus |
| `stepId` | `step_started`, `step_completed`, `step_failed` | Unbounded | High |
| `spanId` | `step_started`, `step_completed`, `step_failed` | Unbounded | High |

### Acceptable-Cardinality Labels

| Label | Cardinality | Risk |
|-------|-------------|------|
| `status` | ~6 values | Low |
| `errorCategory` | ~7 values | Low |
| `stepName` | Bounded per service | Medium |
| `toolId` | Bounded to registered tools | Medium |

**Recommendation:** Remove `runId`, `stepId`, and `spanId` from metric labels. These are trace-level identifiers — they belong in span attributes in the trace graph, not in metric labels. Metrics should carry low-cardinality labels (`agentId`, `domain`, `stepName`, `errorCategory`). High-cardinality correlation should be done by joining metric aggregates with trace data via the shared `traceId`.

---

## Latency Measurement Coverage

| Scope | Measured | Breakdown Available |
|-------|----------|---------------------|
| Per-step execution time | Yes (`durationMs` in `StepResult`) | No percentiles |
| Per-cognitive-phase time | Yes (`PhaseResult.durationMs`) | No percentiles |
| Per-run total time | Yes (`AgentRunSummary.durationMs`) | No percentiles |
| Approval wait time | No | `approval_bottleneck_ms` undefined |
| Retry delay time | Yes (`RetryAttempt.delayedMs`) | Sum only |
| Model inference time | No | Not instrumented |
| Memory read latency | No | Not instrumented |
| Tool-level latency | Yes (`ToolExecutionRecord.latencyMs`) | No percentiles |

**Recommendation:** Compute p50/p95/p99 latency buckets in the `BatchingExporter` before exporting histograms. Add `approval_bottleneck_ms` emission in `requestApproval()` — record the elapsed time between submitting the approval request and receiving a verdict.

---

## Error and Retry Observability

### What is Captured

- Every step failure emits `step_failed` with `errorCategory` label.
- Every retry delay is recorded in `RetryAttempt.delayedMs` within the `retryLog`.
- Dead-letter events are captured in `sendToDeadLetter()` with run context.

### What is Missing

- `retryLog` is stored in the `RetryResult` object in memory but not persisted to the `run-ledger` or emitted as metrics. Retry counts appear in `StepResult.retryCount` only.
- Circuit breaker open/close events in the `ModelRouter` are not emitted as observability events.
- Rate-limit hits in `tool-mesh/rate-limiter.ts` are not emitted as metrics — `tool_error_rate` cannot distinguish between rate-limited and failed tool calls.
- Dead-letter events are not surfaced in the `RunLedgerEntry` — an operator cannot query "runs in dead-letter" from the ledger API.

---

## Operator-Readable Run Summary

### Current State

`AgentRunSummary` contains:
```typescript
{
  runId, objective, status, startedAt, completedAt, durationMs,
  stepResults: StepResult[],
  errorMessage?, errorCategory?, traceId
}
```

This is machine-readable but not human-readable. An operator debugging a failed run must read raw `stepResults` arrays and match them to log entries.

**There is no narrative run summary automatically emitted or persisted.** The `brief.ts` file in `cognitive-runtime` implements `generateExecutiveBrief(run: CognitiveLoopRun): ExecutiveBrief` — it produces a structured summary with status, world-model highlights, plan step counts, verify attempts, and reflection lessons from the `reflect` phase output. However, this function is only called when the orchestrator invokes it explicitly; the summary is not automatically emitted at `AgentRun.complete()` and is not persisted to the run ledger. An `AgentRun` that completes outside the cognitive-runtime orchestrator produces no narrative summary at all.

### Recommendation: Operator Run Summary Format

At `AgentRun.complete()` and `CognitiveLoopRun` completion, emit a structured narrative summary:

```
Run Summary: <objective>
Status: COMPLETED in 4.2s | 5 steps | 1 retry
──────────────────────────────────────────
✓ Perceive       — 0.3s
✓ Plan           — 0.8s
✓ Act            — 2.1s (1 retry: timeout)
✓ Verify         — 0.7s
✓ Reflect        — 0.3s
──────────────────────────────────────────
Approvals: None required
Policy: 0 violations
Cost: ~$0.0024
Evidence: 3 sources, avg confidence 0.87
```

This summary should be:
1. Emitted as a structured log event (`level: 'summary'`) via `emitStepLog`.
2. Stored in `RunLedgerEntry.narrative` (new field).
3. Available via a `GET /runs/:runId/summary` API endpoint.

---

## Quality Gate Review

`evaluateQualityGate` in `run-ledger/quality-gate.ts` implements five gates:

| Gate | Threshold (default) | Purpose |
|------|---------------------|---------|
| Completion rate | ≥ 50% steps succeed | Prevents degraded runs from being marked complete |
| Evidence coverage | ≥ 30% avg retrieval score | Ensures outputs are evidence-backed |
| Policy status | No `block` outcomes | Hard stop on policy violations |
| Tool failure rate | ≤ 50% tool calls fail | Detects tool mesh degradation |
| Latency budget | Configurable | Prevents timeout-induced partial runs |

**Assessment:** The quality gate logic is well-designed. The default thresholds (50% completion, 30% evidence) are conservative — appropriate for initial deployment but should be tightened as baselines stabilize.

**Gap:** Quality gate results are computed by callers but not automatically run at `AgentRun.complete()`. There is no guarantee that every run passes through the quality gate before its summary is surfaced.

**Recommendation:** Call `evaluateQualityGate(ledgerEntry)` automatically in `AgentRun.complete()` and `CognitiveLoopRun` completion. Attach the `QualityGateResult` to the run summary and emit it as a metric event.

---

## Observability Maturity Scorecard

| Dimension | Current | Target | Gap |
|-----------|---------|--------|-----|
| Step trace coverage | 9/10 | 10/10 | tenantId/domain on spans |
| Metric definitions | 15/15 | 15/15 | None |
| Metric emitters active | 3/15 | 15/15 | 12 metrics not emitted |
| Export pipeline active | 0/1 | 1/1 | BatchingExporter not started |
| Label cardinality managed | No | Yes | High-cardinality runId/stepId in metrics |
| Latency percentiles | No | Yes | Only raw values recorded |
| Approval wait time | No | Yes | Not instrumented |
| Operator run summary | No | Yes | No narrative output |
| Quality gate auto-run | No | Yes | Not called at completion |
| Unified stack | No | Yes | Two disconnected packages |

**Overall maturity: Early / Foundation.** The instrumentation infrastructure is correct and well-designed. The primary work is wiring it up end-to-end — not redesigning it.

---

## Priority Action Plan

| Priority | Action | Package | Effort |
|----------|--------|---------|--------|
| P0 | Call `BatchingExporter.start()` at API server startup | api-server | 1h |
| P0 | Remove high-cardinality labels (`runId`, `stepId`, `spanId`) from metrics | cognitive-observability | 2h |
| P1 | Add `approval_bottleneck_ms` emission in `requestApproval()` | agents-core | 1h |
| P1 | Add `token_count` and `cost_usd` emission at model call sites | ai-control-plane | 3h |
| P1 | Add operator narrative summary at run completion | agents-core, cognitive-runtime | 4h |
| P1 | Auto-run quality gate at `AgentRun.complete()` | agents-core, run-ledger | 2h |
| P2 | Emit `rollback_count`, `override_rate`, `drift_score` | cognitive-runtime, verifier | 4h |
| P2 | Emit circuit-breaker events from `ModelRouter` | ai-control-plane | 2h |
| P2 | Add `narrative` field to `RunLedgerEntry` | contracts/governance | 2h |
| P3 | Compute p95/p99 latency in `BatchingExporter` | cognitive-observability | 3h |
| P3 | Unify `observability-core` and `cognitive-observability` under single export pipeline | Both packages | 1 day |
