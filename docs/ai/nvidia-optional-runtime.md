# NVIDIA Optional Runtime Strategy

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Platform Engineering — AI Infrastructure

---

## Overview

SZL Holdings' AI infrastructure is designed to be GPU-optional. The platform runs on CPU-backed model providers by default (OpenAI, Anthropic, HuggingFace Inference). NVIDIA capabilities are layered on top as an optional runtime tier — enabled when GPU infrastructure is available, disabled without code changes when it is not.

The `@szl-holdings/nvidia-adapters` package implements three optional NVIDIA capability layers:

1. **NIM Endpoint Adapter** — routes model calls to NVIDIA NIM managed endpoints
2. **NeMo Evaluation Hooks** — integrates NVIDIA NeMo Evaluator observability into the eval pipeline
3. **Agent Profiler** — tracks per-agent execution traces for performance analysis

None of these components require a local GPU. NIM endpoints are API-accessible (cloud or on-prem). NeMo hooks integrate via HTTP. The agent profiler is entirely in-memory. Local GPU/CUDA installation is not required for development or test environments.

---

## Package: `@szl-holdings/nvidia-adapters`

```
packages/nvidia-adapters/
├── src/
│   ├── nim-endpoint.ts    NIM model endpoint management + OpenAI-compatible completion
│   ├── nemo-hooks.ts      NeMo eval suite registration + observability event emission
│   ├── agent-profiler.ts  Per-agent trace recording, step profiling, performance grading
│   └── index.ts
```

---

## NIM Endpoint Integration

### What Is NIM?

NVIDIA NIM (NVIDIA Inference Microservices) packages optimized LLMs as Docker-compatible microservices. NIM endpoints expose an OpenAI-compatible REST API. When a NIM endpoint is available (cloud via `integrate.api.nvidia.com` or on-prem), the model router can route inference calls to it with zero code changes.

### Predefined NIM Endpoints

| Endpoint ID | Model | GPU Required | Base URL |
|-------------|-------|-------------|---------|
| `nim-llama-3-1-70b` | Llama 3.1 70B Instruct | No (cloud) | `integrate.api.nvidia.com/v1` |
| `nim-llama-3-1-8b` | Llama 3.1 8B Instruct | No (cloud) | `integrate.api.nvidia.com/v1` |
| `nim-mixtral-8x7b` | Mixtral 8x7B Instruct | No (cloud) | `integrate.api.nvidia.com/v1` |
| `nim-local-llama` | Llama 3.1 70B (on-prem) | **Yes** | `localhost:8000/v1` |

The local on-prem NIM endpoint is `enabled: false` by default. It activates only when `NIM_LOCAL_API_KEY` is set and the local NIM server is running. Cloud NIM endpoints require `NVIDIA_API_KEY`.

### Availability Checking

```typescript
import { nimEndpointManager } from "@szl-holdings/nvidia-adapters";

const status = nimEndpointManager.isAvailable("nim-llama-3-1-70b");
// { available: false, reason: "API key env var 'NVIDIA_API_KEY' not configured" }
// OR
// { available: true }
```

Availability is checked before any completion call. Unavailable endpoints are excluded from routing silently.

### Using NIM as a Provider Type

NIM endpoints integrate with the AI control plane as `provider: "nim"`. They can be registered into the `ModelRouter` alongside OpenAI and Anthropic endpoints:

```typescript
import { modelRouter } from "@szl-holdings/ai-control-plane";
import { nimEndpointManager } from "@szl-holdings/nvidia-adapters";

// Register a NIM endpoint into the model router
const nimConfig = nimEndpointManager.get("nim-llama-3-1-70b");
if (nimConfig && nimEndpointManager.isAvailable("nim-llama-3-1-70b").available) {
  modelRouter.addEndpoint({
    provider: "nim",
    model: nimConfig.modelId,
    baseUrl: nimConfig.baseUrl,
    apiKeyEnvVar: nimConfig.apiKeyEnvVar,
    priority: 25,
    maxTokens: nimConfig.maxTokens,
    tags: nimConfig.tags,
    enabled: true,
  });
}
```

---

## NeMo Evaluation Hooks

### What Is NeMo Evaluator?

NVIDIA NeMo Evaluator is a framework for systematic LLM evaluation — measuring accuracy, safety, and domain-specific capability on curated test sets. The `nemoHooks` adapter integrates NeMo-style evaluation into the SZL platform's eval pipeline without requiring NeMo to be installed locally.

### Eval Suite Registration

```typescript
import { nemoHooks } from "@szl-holdings/nvidia-adapters";

nemoHooks.registerSuite({
  suiteId: "maritime-triage-v1",
  description: "Maritime incident triage classification accuracy",
  modelId: "meta/llama-3.1-70b-instruct",
  cases: [
    {
      id: "case-001",
      input: "MV Aurora reports loss of propulsion 180nm from nearest port",
      expectedKeywords: ["P0", "immediate", "maritime_emergency"],
      domain: "maritime",
      category: "triage",
    },
    // ...more cases
  ],
  scoringStrategy: "keyword_match",
  passThreshold: 0.85,
  tags: ["maritime", "triage"],
});
```

### Running Evals and Capturing Observability

```typescript
const report = await nemoHooks.runEval("maritime-triage-v1", async (input) => {
  const start = Date.now();
  const result = await myModelCall(input);
  return { output: result.content, latencyMs: Date.now() - start };
});

// report.recommendation: "promote" | "hold" | "reject"
// report.passRate, report.avgScore, report.avgLatencyMs
```

### Observability Events

Every eval run emits structured observability events:

| Event Type | Trigger | Severity |
|------------|---------|---------|
| `eval_run` | Any eval run completes | `info` or `warn` |
| `threshold_breach` | Pass rate below threshold | `critical` |
| `model_call` | Individual model inference | `info` |
| `latency_spike` | Latency exceeds baseline | `warn` |
| `model_degradation` | Score drops vs. previous run | `warn` |

```typescript
const events = nemoHooks.getEvents({ type: "threshold_breach", severity: "critical", limit: 10 });
```

---

## Agent Profiler

The agent profiler provides per-execution telemetry for every AI agent run in the system. It captures: step-by-step model calls, tool invocations, token usage, cost, latency, and an overall performance grade.

### Starting a Trace

```typescript
import { agentProfiler } from "@szl-holdings/nvidia-adapters";

const traceId = agentProfiler.startTrace({
  agentId: "firestorm-threat-analyst",
  agentTier: "analyst",
  domain: "security",
});
```

### Recording Steps

```typescript
const stepId = agentProfiler.recordStep(traceId, {
  type: "llm_call",
  model: "claude-opus-4-5",
  startedAt: new Date().toISOString(),
  inputTokens: 1200,
  outputTokens: 340,
  costUsd: 0.0432,
  success: true,
});

agentProfiler.completeStep(traceId, stepId, {
  success: true,
  durationMs: 1840,
});
```

### Ending a Trace and Reading Grades

```typescript
const entry = agentProfiler.endTrace(traceId, "completed");
// entry.performanceGrade: "A" | "B" | "C" | "D" | "F"
// entry.durationMs, entry.totalCostUsd, entry.totalInputTokens
```

**Performance Grade Thresholds:**

| Grade | Duration | Cost |
|-------|---------|------|
| A | < 1s | < $0.01 |
| B | < 5s | < $0.10 |
| C | < 15s | < $0.50 |
| D | < 30s | Any |
| F | ≥ 30s or failed | — |

### Agent Performance Summary

```typescript
const summary = agentProfiler.getSummary("firestorm-threat-analyst");
// summary.successRate, summary.avgDurationMs, summary.p95DurationMs
// summary.topTools, summary.topModels, summary.gradeDist
```

---

## GPU-Readiness Path

The adapters are designed for a progressive GPU adoption path:

### Phase 1 — Cloud NIM (No GPU Required)
Enable `NVIDIA_API_KEY`. Route specific route classes to NIM cloud endpoints alongside OpenAI/Anthropic. Evaluate performance via NeMo hooks. No infrastructure changes needed.

### Phase 2 — On-Prem NIM (GPU Infrastructure Required)
Deploy NIM microservices on GPU-equipped nodes. Enable the `nim-local-llama` endpoint (set `enabled: true`, configure `NIM_LOCAL_API_KEY`). The model router automatically prefers local NIM for cost and latency optimization.

### Phase 3 — Full GPU-Native Pipeline
- Deploy NeMo Evaluator on GPU infrastructure
- Enable custom NIM model builds for domain-specific fine-tuned models
- Connect agent profiler to NVIDIA's observability stack (DCGM, Triton metrics)
- Export traces to OpenTelemetry / NVIDIA Triton

None of Phase 3 requires code changes — only configuration and infrastructure updates. The adapter interfaces are stable.

---

## Environment Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `NVIDIA_API_KEY` | Cloud NIM endpoints | NVIDIA NGC API key |
| `NIM_LOCAL_API_KEY` | On-prem NIM | Local NIM server API key (optional) |
| `NVIDIA_NIM_BASE_URL` | Custom NIM endpoints | Override NIM base URL |

---

*See also:*
- *[AI Control Plane Architecture](ai-control-plane.md)*
- *[Digital Twin and Simulation Strategy](../platform/digital-twin-and-simulation-strategy.md)*
