# SZL Holdings — Observability Specification

**Purpose:** Define OpenTelemetry-aligned trace/span/attribute conventions for the SZL platform — covering correlation IDs, actor attribution, workspace/tenant context, and policy/workflow/model/eval/replay ID propagation.

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## Overview

SZL platform observability follows the OpenTelemetry (OTel) specification for distributed tracing, with platform-specific attribute conventions for business and governance context. Every platform request, workflow execution, agent inference, and approval event should produce correlated trace data that can be queried across the full signal-to-action lifecycle.

The goal is **end-to-end traceability** — from an incoming API request or external signal event through every service boundary to the final audit log entry.

---

## Trace Naming Conventions

### Format

```
<service>.<component>.<operation>
```

### Service Names (OTel `service.name`)

| Service | `service.name` |
|---|---|
| API Server | `szl-api-server` |
| Alloy Workflow Engine | `szl-alloy-workflow` |
| AI Engine | `szl-ai-engine` |
| Signal Ingestion | `szl-signal-ingestion` |
| Audit Service | `szl-audit` |
| Proof Chain | `szl-proof-chain` |
| Job Queue | `szl-job-queue` |
| Domain Pack (Maritime) | `szl-vessels` |
| Domain Pack (Security) | `szl-aegis` |
| Domain Pack (Real Estate) | `szl-terra` |
| Domain Pack (Business Obs) | `szl-lyte` |

### Span Names

```
# API request
http.server.request

# Workflow operations
alloy.workflow.start
alloy.workflow.step.execute
alloy.workflow.approval.request
alloy.workflow.approval.receive
alloy.workflow.complete

# AI operations
ai.agent.inference.run
ai.agent.eval.run
ai.agent.replay.run
ai.model.completion.request

# Signal processing
signal.ingest
signal.enrich
signal.route
signal.correlate

# Audit / governance
audit.log.write
proof-chain.entry.append
decision-ledger.entry.write
```

---

## Standard Attribute Set

### Core Context (Required on all spans)

| Attribute | Type | Description |
|---|---|---|
| `szl.workspace.id` | string | Tenant workspace UUID |
| `szl.workspace.name` | string | Tenant workspace display name |
| `szl.organization.id` | string | Organization UUID |
| `szl.environment` | string | `development` \| `staging` \| `production` |
| `szl.correlation.id` | string | End-to-end correlation ID — propagated across all service boundaries for one business event |
| `szl.request.id` | string | Per-request unique ID (maps to HTTP `X-Request-ID` header) |

### Actor Attribution (Required on spans involving user or agent actions)

| Attribute | Type | Description |
|---|---|---|
| `szl.actor.id` | string | Actor UUID |
| `szl.actor.type` | string | `human` \| `agent` \| `system` \| `external` |
| `szl.actor.role` | string | Platform role (e.g., `operator`, `analyst`, `admin`) |
| `szl.actor.display_name` | string | Human-readable name (redacted in logs for privacy) |
| `szl.actor.session.id` | string | Session UUID (for human actors) |

### Signal Context (Required on signal processing spans)

| Attribute | Type | Description |
|---|---|---|
| `szl.signal.id` | string | Signal UUID |
| `szl.signal.domain` | string | `maritime` \| `security` \| `real_estate` \| `business` \| `cross_domain` |
| `szl.signal.type` | string | Signal type from canonical enum |
| `szl.signal.severity` | string | `info` \| `warning` \| `critical` \| `emergency` |
| `szl.signal.source.type` | string | Source entity type |
| `szl.signal.source.id` | string | Source entity UUID |
| `szl.signal.correlation.cluster` | string | Correlation cluster ID (if signal is part of a cluster) |

### Workflow Context (Required on Alloy workflow spans)

| Attribute | Type | Description |
|---|---|---|
| `szl.workflow.id` | string | Workflow run UUID |
| `szl.workflow.type` | string | Workflow template type |
| `szl.workflow.step` | string | Current step name |
| `szl.workflow.step.index` | int | Step index in workflow sequence |
| `szl.action.id` | string | Action UUID (when workflow executes an action) |
| `szl.policy.id` | string | Policy UUID governing this workflow |
| `szl.policy.version` | string | Policy version applied |
| `szl.approval.id` | string | Approval UUID (when workflow requires approval) |

### AI / Model Context (Required on AI engine spans)

| Attribute | Type | Description |
|---|---|---|
| `szl.model.id` | string | Model identifier |
| `szl.model.version` | string | Model version string |
| `szl.model.provider` | string | `openai` \| `anthropic` \| `gemini` \| `szl-internal` |
| `szl.inference.id` | string | Inference UUID |
| `szl.inference.type` | string | Inference type from canonical enum |
| `szl.inference.confidence` | float | Confidence score (0.0–1.0) |
| `szl.eval.id` | string | Eval run UUID (for evaluation spans) |
| `szl.replay.id` | string | Replay run UUID (for replay spans) |
| `szl.agent.id` | string | Registered agent identifier |

### Audit / Governance Context (Required on audit and proof chain spans)

| Attribute | Type | Description |
|---|---|---|
| `szl.audit.event.type` | string | Audit event type |
| `szl.proof_chain.entry.id` | string | Proof chain entry UUID |
| `szl.decision_ledger.chain.id` | string | Decision ledger chain (action_id) |
| `szl.decision_ledger.entry.type` | string | Ledger entry type (signal/inference/policy/action/approval/execution/result) |

---

## Correlation ID Propagation

The `szl.correlation.id` is the thread that connects every span in a business event chain — from the first signal ingested to the final outcome recorded.

### Generation Rules

1. External signals: correlation ID is generated by the signal ingestion service at ingest time
2. User-initiated actions: correlation ID is generated at the API gateway on first request
3. Scheduled jobs: correlation ID is generated by the job queue at job start

### Propagation Rules

1. Correlation ID is propagated via HTTP header `X-SZL-Correlation-ID`
2. Correlation ID is propagated via message queue message attributes
3. All services extract and attach the correlation ID at trace start
4. Correlation ID is stored in the Decision Ledger alongside every chain entry
5. Correlation ID is never regenerated mid-chain — a single business event has one correlation ID for its entire lifecycle

---

## HTTP Header Conventions

| Header | Required | Description |
|---|---|---|
| `X-Request-ID` | Yes | Per-request unique ID (generated by API gateway if not present) |
| `X-SZL-Correlation-ID` | Yes (propagated) | End-to-end correlation ID |
| `X-SZL-Workspace-ID` | Yes (authenticated) | Tenant workspace scope |
| `X-SZL-Actor-ID` | Derived from auth | Actor performing the request |
| `traceparent` | Yes (OTel) | W3C Trace Context header |
| `tracestate` | Optional | W3C Trace Context state |

---

## Instrumentation Priorities

### Priority 1 — Must Instrument (MVP)

- All HTTP API routes (request/response spans)
- Alloy workflow start, step execution, and completion
- AI inference calls (model request + response)
- Approval request and receipt
- Decision Ledger writes
- Authentication events

### Priority 2 — High Value

- Signal ingestion and enrichment
- Database query spans (slow queries > 100ms)
- Job queue task start and completion
- Agent eval and replay runs

### Priority 3 — Complete Coverage

- Cache hit/miss events
- External API calls (AIS feed, NYC Open Data, CISA KEV)
- WebSocket connection lifecycle
- PDF generation
- Email delivery

---

## Collector and Export Configuration

```yaml
# opentelemetry-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 512
  resource:
    attributes:
      - key: szl.environment
        value: ${NODE_ENV}
        action: insert

exporters:
  # Primary: Structured logging to Pino (current implementation)
  logging:
    loglevel: info
  # Future: Datadog or Grafana Tempo
  otlp/datadog:
    endpoint: https://trace.agent.datadoghq.com

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [logging, otlp/datadog]
```

---

## Sampling Strategy

| Traffic Type | Sampling Rate | Rationale |
|---|---|---|
| All governance/approval events | 100% | Compliance — every approval must be traced |
| AI inference calls | 100% | Eval and debugging — full coverage required |
| Authentication events | 100% | Security audit requirement |
| High-severity signal processing | 100% | Operational criticality |
| Normal API traffic (read) | 10% | Cost control |
| Health check endpoints | 0% | No value; high volume |

---

*This spec provides the foundation for full platform observability. Implementation should begin with Priority 1 instrumentation on the API server and Alloy workflow engine.*
