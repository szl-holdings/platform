# SZL Holdings — Agent & GenAI Observability

## Overview

Every AI model call, tool invocation, agent step, and approval boundary event in the platform is observable, traceable, and correlatable. Observability is not a monitoring add-on — it is embedded in the decision lifecycle.

## Instrumentation Architecture

```
┌──────────────────────────────────────────────────────────┐
│                OBSERVABILITY PLANE                        │
├──────────────┬──────────────┬──────────────┬─────────────┤
│  Model Call  │  Tool Call   │  Agent Step  │  Approval   │
│  Traces      │  Traces      │  Traces      │  Events     │
├──────────────┴──────────────┴──────────────┴─────────────┤
│           OpenTelemetry Span Correlation                  │
├──────────────────────────────────────────────────────────┤
│           Proof Chain Integration                        │
└──────────────────────────────────────────────────────────┘
```

### Model Call Tracing

Every LLM invocation captures:
- Model identifier and version
- Input prompt (sanitized for PII)
- Output response
- Token count (input + output)
- Latency (ms)
- Confidence score
- Error/retry information
- Correlation ID linking to parent decision

### Tool Call Tracing

Every tool invocation captures:
- Tool identifier
- Input parameters
- Output result
- Execution time
- Success/failure status
- Side effects (database writes, API calls)
- Correlation ID

### Agent Step Tracing

Multi-step agent workflows capture:
- Step index and total steps
- Step type (think, act, observe, decide)
- Step input and output
- Tools used in step
- Models used in step
- Decision points and branches taken
- Cumulative resource consumption

### Approval Boundary Events

Every approval gate captures:
- Decision ID
- Risk tier that triggered the gate
- Policy reference
- Recommendation summary
- Approver identity
- Approval/rejection timestamp
- Rationale (if provided)
- Escalation chain (if applicable)

## Correlation

All traces share a common correlation structure:
- **Request ID** — unique per API request
- **Decision ID** — unique per governed decision
- **Correlation ID** — links related spans across services
- **Causation ID** — links cause to effect across events
- **Tenant ID** — organizational scope

This enables tracing from initial signal → model call → tool execution → approval → outcome across the full decision lifecycle.

## Implementation

| Component | Package/File |
|-----------|-------------|
| OTel middleware | `artifacts/api-server/src/middlewares/otel-span.ts` |
| Correlation middleware | `artifacts/api-server/src/middlewares/correlation.ts` |
| AI telemetry | `lib/alloy-embedding-api` |
| Cognitive telemetry | Domain-specific instrumentation |
| Agent scheduling | `artifacts/api-server/src/routes/agent-scheduler.ts` |

## Cost Tracking

Token consumption is tracked per:
- Model (GPT-4o, Claude, etc.)
- Domain (Vessels, Terra, Aegis, etc.)
- Request type (analysis, recommendation, extraction)
- Tenant

This enables cost attribution and budget enforcement at the organizational level.

## Evaluation Integration

Observability data feeds into Command Arena evaluations:
- Latency distributions inform SLA compliance scoring
- Error rates inform reliability scoring
- Token efficiency informs cost scoring
- Evidence attachment rates inform completeness scoring
