# GenAI Observability Specification

**Package:** `@szl-holdings/telemetry-standards`, `@szl-holdings/observability` (genai-telemetry)
**Status:** Implemented
**As of:** April 2026

---

## Overview

SZL's AI-native platform requires observability that goes beyond traditional APM. Every model invocation, agent reasoning step, tool call, retrieval operation, and approval decision must produce correlated trace data that enables:

- **Cost attribution** — model cost per tenant, domain, workflow, and route class
- **Quality measurement** — confidence, grounding quality, token efficiency
- **Safety audit** — tool risk levels, policy application, approval chain
- **Latency debugging** — model vs. retrieval vs. tool vs. orchestration breakdown
- **Compliance evidence** — full agent decision trail with actor attribution

---

## Semantic Conventions

The `@szl-holdings/telemetry-standards` package implements OpenTelemetry GenAI semantic conventions aligned with the [OTel GenAI Working Group](https://opentelemetry.io/docs/specs/semconv/gen-ai/).

### Core Attribute Namespaces

| Namespace | Description |
|---|---|
| `gen_ai.*` | GenAI operation attributes |
| `business.*` | ATLAS business context |
| `szl.*` | Platform-specific context |
| `http.*` | HTTP semantic conventions |

---

## Span Types

### 1. Model Call Span (`kind: "model_call"`)

Captures a single LLM inference invocation.

| Attribute | OTel Semantic | Description |
|---|---|---|
| `gen_ai.system` | `gen_ai.system` | Provider: `openai`, `anthropic`, `gemini`, etc. |
| `gen_ai.operation.name` | `gen_ai.operation.name` | `chat`, `text_completion`, `embeddings` |
| `gen_ai.request.model` | `gen_ai.request.model` | Requested model ID |
| `gen_ai.response.model` | `gen_ai.response.model` | Actual model used (may differ from request) |
| `gen_ai.usage.input_tokens` | `gen_ai.usage.input_tokens` | Prompt token count |
| `gen_ai.usage.output_tokens` | `gen_ai.usage.output_tokens` | Completion token count |
| `gen_ai.cost.estimate_usd` | SZL extension | Estimated cost in USD |
| `gen_ai.model.used_fallback` | SZL extension | Whether a fallback model was used |
| `gen_ai.route.class` | SZL extension | Route class (e.g., `summarize`, `extract`, `reason`) |
| `gen_ai.tenant.id` | SZL extension | Tenant isolation |

### 2. Tool Call Span (`kind: "tool_call"`)

Captures a single agent tool invocation.

| Attribute | Description |
|---|---|
| `gen_ai.tool.name` | Name of the tool called |
| `gen_ai.tool.call.type` | `function`, `api`, `db`, `file` |
| `gen_ai.tool.risk_level` | `low` / `medium` / `high` / `critical` |
| `gen_ai.tool.policy_applied` | Policy ID that governed this call |
| `gen_ai.tool.approval_required` | Whether human approval was required |

### 3. Agent Step Span (`kind: "agent_step"`)

Captures one step in a multi-step agent execution.

| Attribute | Description |
|---|---|
| `gen_ai.agent.id` | Agent instance ID |
| `gen_ai.agent.name` | Human-readable agent name |
| `gen_ai.agent.domain` | Domain pack (maritime, defense, etc.) |
| `gen_ai.agent.step_index` | Zero-based step position in the run |
| `gen_ai.agent.step_type` | `think` / `plan` / `tool_select` / `execute` / `summarize` / `escalate` |

### 4. Retrieval Span (`kind: "retrieval"`)

Captures a vector search or document retrieval operation.

| Attribute | Description |
|---|---|
| `gen_ai.retrieval.engine` | Retrieval system identifier |
| `gen_ai.retrieval.query` | The search query (may be truncated) |
| `gen_ai.retrieval.chunks_retrieved` | Number of chunks returned |
| `gen_ai.retrieval.chunks_used` | Number of chunks injected into prompt |
| `gen_ai.retrieval.top_score` | Top similarity score (0.0–1.0) |

### 5. Approval Span (`kind: "approval"`)

Captures a human-in-the-loop or auto-approval decision.

| Attribute | Description |
|---|---|
| `gen_ai.decision.id` | Decision record ID |
| `gen_ai.decision.type` | Decision category |
| `gen_ai.approval.level` | `auto` / `human` / `executive` |
| `gen_ai.approval.delay_ms` | Time from request to decision |
| `gen_ai.approval.outcome` | `approved` / `rejected` / `pending` / `escalated` |

### 6. Execution Run Span (`kind: "execution_run"`)

Captures the full lifecycle of an agent execution run (parent span).

| Attribute | Description |
|---|---|
| `szl.domain` | Domain pack |
| `gen_ai.total_model_calls` | Total model invocations in the run |
| `gen_ai.total_tool_calls` | Total tool invocations in the run |
| `gen_ai.total_cost_usd` | Cumulative cost for the run |

---

## Trace Hierarchy

A complete agent execution trace looks like:

```
execution_run (root)
  ├── model_call (initial reasoning)
  ├── agent_step[0] (think)
  │     └── retrieval (knowledge lookup)
  ├── agent_step[1] (plan)
  │     └── model_call (planning model)
  ├── agent_step[2] (tool_select)
  ├── tool_call (external API)
  │     └── approval (human gate, if required)
  ├── agent_step[3] (execute)
  │     └── model_call (execution model)
  └── agent_step[4] (summarize)
        └── model_call (summary model)
```

All spans within a trace share the same `traceId`. Parent-child relationships are expressed via `parentSpanId`.

---

## Correlation

Every GenAI span carries:
- `gen_ai.trace.id` — the trace root ID
- `gen_ai.correlation.id` — HTTP/workflow correlation ID from the originating request
- `gen_ai.tenant.id` — tenant isolation context
- `gen_ai.org.id` — organization context

This allows correlating GenAI spans back to:
- The originating HTTP request (via correlation ID)
- The Alloy workflow (via workflow ID)
- The ATLAS business event (via correlation ID)

---

## API Endpoints

The API server exposes GenAI telemetry via `/api/genai-telemetry/`:

| Method | Path | Description |
|---|---|---|
| POST | `/genai-telemetry/spans` | Ingest a single span |
| POST | `/genai-telemetry/spans/batch` | Ingest multiple spans |
| GET | `/genai-telemetry/snapshot` | Aggregated snapshot (windowed) |
| GET | `/genai-telemetry/spans` | Raw span list (admin/operator) |
| GET | `/genai-telemetry/trace/:traceId` | All spans for a trace |
| GET | `/genai-telemetry/langfuse/:traceId` | Langfuse-compatible export |
| GET | `/genai-telemetry/dashboard/:appSlug` | Per-app GenAI dashboard |

---

## Cost Attribution Model

Token costs are estimated at ingestion time using provider rate cards:

```
estimated_cost = (prompt_tokens * input_rate) + (completion_tokens * output_rate)
```

Rate cards are configurable per model. Cost is attributed to:
1. The tenant (`gen_ai.tenant.id`)
2. The domain (`gen_ai.agent.domain`)
3. The route class (`gen_ai.route.class`)
4. The workflow (`szl.workflow_id`)

---

## Prompt Trace Contract

The `GenAIPromptTraceContract` captures the full prompt lifecycle:

```typescript
interface GenAIPromptTraceContract {
  traceId: string;
  promptId?: string;       // Template ID if using prompt management
  promptVersion?: string;  // Semantic version of the prompt template
  template?: string;       // The raw template (may be omitted for PII)
  variables?: Record<string, unknown>; // Template variables
  renderedInput?: string;  // Final rendered prompt (may be truncated)
  tokenCount?: number;     // Token count of the rendered prompt
  timestamp: number;
}
```

---

## Langfuse Export

The `genAITelemetry.exportLangfuseTrace()` method produces a Langfuse-compatible trace export for integration with the Langfuse observability platform:

```json
{
  "id": "trace-abc123",
  "name": "Trace abc123",
  "observations": [
    {
      "id": "span-xyz",
      "traceId": "trace-abc123",
      "type": "GENERATION",
      "name": "model_call",
      "input": { "model": "gpt-4o", ... },
      "output": { "tokens": 1234 },
      "startTime": "...",
      "endTime": "..."
    }
  ]
}
```

---

## Packages

### `@szl-holdings/telemetry-standards`

| Export path | Contents |
|---|---|
| `.` | All re-exports |
| `./genai` | `GENAI_ATTRS`, `GENAI_OPERATION`, `GENAI_SYSTEM`, `GENAI_FINISH_REASON`, span contracts |
| `./business` | `BUSINESS_ATTRS`, `ATLAS_EVENT_CLASS` constants |
| `./http` | `HTTP_ATTRS`, `SZL_ATTRS`, `SPAN_NAMES` |

### `@szl-holdings/observability` (existing)

The existing `lib/observability` package provides the runtime GenAI telemetry collector via `genAITelemetry` and `GenAITelemetry` class. The `telemetry-standards` package provides the semantic convention constants that both the collector and API clients use to ensure consistency.

---

## Security and Privacy

- Prompt content may contain PII. The `template` and `renderedInput` fields are **optional** and should be omitted when handling sensitive inputs.
- Tool inputs/outputs may contain secrets. Apply field masking before emitting tool call spans.
- All GenAI telemetry endpoints require authentication (`authMiddleware({ required: true })`).
- Span retrieval endpoints require `admin` or `operator` role.
