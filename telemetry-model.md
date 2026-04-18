# Telemetry Model — SZL Holdings Platform (Canonical)

**Version:** 1.0 | **Date:** April 2026 | **Status:** Canonical — supersedes `OBSERVABILITY_ARCHITECTURE.md`

> **Navigation:** [architecture.md](architecture.md) · [ontology.md](ontology.md) · [policy-model.md](policy-model.md) · [app-moats.md](app-moats.md)

---

## Overview

The SZL telemetry model defines how the platform observes itself — spans, events, metrics, and semantic conventions shared across all packages and services. Everything routes through OpenTelemetry-compatible instrumentation. Nothing is observed without attribution, correlation, and a freshness stamp.

---

## Layered Model

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 4 — Observability Surfaces                             │
│   Workflow 360 · Entity Investigation · Recommendation Trace  │
│   Approval Bottlenecks · Policy Failures · Prediction Drift   │
│   Domain Cluster Stats · Learning Jobs                        │
├──────────────────────────────────────────────────────────────┤
│ Layer 3 — Decision Fabric                                     │
│   correlation index · decision records · snapshots           │
│   playbook suggestions · learning loop                        │
│   lib/decision-fabric                                         │
├──────────────────────────────────────────────────────────────┤
│ Layer 2 — Primitives                                          │
│   Prism Bus · Proof Chain · Outcome Graph · Covenant Policy   │
│   Workflow Engine · Monte Carlo · Approvals                   │
├──────────────────────────────────────────────────────────────┤
│ Layer 1 — Infrastructure                                      │
│   packages/observability-core (OTel setup, middleware)        │
│   packages/telemetry-standards (semantic conventions)         │
│   packages/trace-graph (run/tool trace capture)               │
│   lib/observability (APM, pino, metrics, health)              │
│   PostgreSQL 16 via Drizzle ORM                               │
└──────────────────────────────────────────────────────────────┘
```

Layer 4 surfaces never read primitive tables directly. They always go through Layer 3, which guarantees that every joined view is consistent with the audit trail.

---

## Semantic Conventions

All telemetry signals must conform to the naming conventions defined in `packages/telemetry-standards`. The three convention modules are:

### 1. GenAI Conventions (`packages/telemetry-standards/genai`)

Attributes for AI model invocations:

| Attribute | Type | Description |
|-----------|------|-------------|
| `gen_ai.system` | string | Provider: `openai`, `anthropic`, `gemini` |
| `gen_ai.request.model` | string | Model identifier |
| `gen_ai.request.max_tokens` | int | Token limit |
| `gen_ai.usage.prompt_tokens` | int | Input tokens consumed |
| `gen_ai.usage.completion_tokens` | int | Output tokens produced |
| `gen_ai.response.finish_reason` | string | `stop`, `length`, `tool_calls`, `content_filter` |
| `szl.gen_ai.confidence` | float | Confidence score (0..1) |
| `szl.gen_ai.policy_state` | string | Policy evaluation result |
| `szl.gen_ai.freshness` | string | Freshness of supporting evidence |
| `szl.gen_ai.proof_id` | string | Proof Chain entry ID |

### 2. Business Event Conventions (`packages/telemetry-standards/business`)

Attributes for domain-level business events:

| Attribute | Type | Description |
|-----------|------|-------------|
| `szl.domain` | string | One of the canonical domains from [ontology.md](ontology.md) |
| `szl.entity.type` | string | Entity type from `EntityType` |
| `szl.entity.id` | string | Entity ID |
| `szl.org.id` | string | Tenant org ID |
| `szl.signal.type` | string | Signal type from `SignalType` |
| `szl.signal.severity` | string | `critical`, `high`, `medium`, `low`, `info` |
| `szl.correlation.id` | string | Correlation ID propagated through the nine-step loop |
| `szl.autonomy.mode` | string | `suggest`, `supervised`, `conditional`, `full_auto` |
| `szl.action.class` | string | Action classification for policy evaluation |

### 3. HTTP Conventions (`packages/telemetry-standards/http`)

Standard HTTP instrumentation conventions following OpenTelemetry semantic conventions plus SZL extensions:

| Attribute | Type | Description |
|-----------|------|-------------|
| `http.method` | string | HTTP method |
| `http.route` | string | Route template |
| `http.status_code` | int | Response status |
| `szl.request.correlation_id` | string | Injected by `correlationMiddleware` |
| `szl.request.api_version` | string | API version from `apiVersionMiddleware` |
| `szl.auth.role` | string | Authenticated user's platform role |
| `szl.auth.org_id` | string | Authenticated user's org ID |

---

## Correlation Contract

Every primitive that participates in the canonical nine-step loop must call `linkEvent()` exactly once per emitted artifact, supplying:

- `correlationId` (mandatory) — propagated from the originating signal; never regenerated mid-loop.
- `primitive` — one of: `prism_bus`, `proof_chain`, `outcome_graph`, `covenant_policy`, `workflow_engine`, `monte_carlo`, `approval`, `decision_record`.
- `primitiveId` — the source-of-truth row ID within that primitive.
- `entityType` + `entityId` — the subject of the event.
- `workflowRunId` — when the event occurred inside a workflow run.
- `domain` — one of the canonical domains from [ontology.md](ontology.md).

Without this contract, end-to-end views (Workflow 360, Recommendation Trace) fall back to per-primitive queries and lose cross-system stitching.

---

## Trace Schema

Agent runs are captured via `packages/trace-graph`. Every run produces a tree of spans:

```
RunSpan (root)
├── ModelCallSpan        — LLM invocation with prompt hash, tokens, confidence
├── ToolInvocationSpan   — tool call with input/output, policy state
├── RetrievalSpan        — memory or knowledge base lookup with freshness
├── MemoryReadSpan       — memory-fabric read with scope and tier
├── MemoryWriteSpan      — memory-fabric write with retention and sensitivity
└── PolicyCheckSpan      — policy evaluation result (permit/deny/escalate)
```

Each span carries: `spanId`, `parentSpanId`, `correlationId`, `orgId`, `agentId`, `startedAt`, `endedAt`, `durationMs`, and all relevant semantic attributes.

---

## Observability Surfaces

### Workflow 360
Answers: "What happened during this workflow run, end to end?"  
Source: `getWorkflow360(workflowRunId)` — joins `decision_records` with `correlation_links`.  
API: `GET /api/decision-fabric/workflows/:runId/360`

### Entity Investigation
Answers: "Show me everything that ever touched this vessel / property / agent / model."  
Source: `investigateEntity(type, id)` — parallel reads across `decision_records` and `correlation_links`.  
API: `GET /api/decision-fabric/entities/:type/:id/investigation`

### Recommendation Trace
Answers: "What downstream decisions and outcomes flowed from this recommendation?"  
Source: `traceRecommendation(recommendationId)` — walks decisions and expands correlationId.  
API: `GET /api/decision-fabric/recommendations/:id/trace`

### Approval Bottlenecks
Answers: "Where is the queue stuck right now?"  
Source: `getApprovalBottlenecks()` — groups pending approvals by action class and resource type.  
API: `GET /api/decision-fabric/approvals/bottlenecks`

### Policy Failures
Answers: "Which policies are denying the most actions?"  
Source: `getPolicyFailures()` — aggregates rolled-back decisions by policy name.  
API: `GET /api/decision-fabric/policies/failures`

### Prediction Drift
Answers: "Where are our predictions diverging most from reality?"  
Source: `getPredictionDrift()` — orders decision records by `abs(prediction_error)` descending.  
API: `GET /api/decision-fabric/predictions/drift`

### Domain Cluster Stats
Answers: "Which domain/entity cells produce the most decisions, and how reliable are they?"  
Source: `getDomainClusterStats()` — groups decisions by domain + entity type.  
API: `GET /api/decision-fabric/clusters`

### Learning Jobs
Answers: "What did we learn this cycle, and what calibration adjustments were proposed?"  
Source: `runLearningCycle()` — writes a calibration record to outcome_graph_learning_jobs.  
API: `POST /api/decision-fabric/learning/run`, `GET /api/outcome-graph/learning-jobs`

---

## Freshness Registry

Freshness thresholds are defined in `packages/telemetry-standards` and must be respected by all UI surfaces:

| Domain | Signal type | Live threshold | Stale threshold | Expired threshold |
|--------|-------------|---------------|-----------------|-------------------|
| Vessels | AIS position | 5 min | 1 hour | 24 hours |
| Vessels | Sanctions list | 4 hours | 48 hours | 7 days |
| Terra | Property record | 24 hours | 7 days | 30 days |
| Security | Threat indicator | 1 min | 1 hour | 24 hours |
| Counsel | Court filing | 1 hour | 24 hours | 7 days |
| Platform | Policy version | on change | — | — |

---

## Performance Contracts

All correlation queries are indexed on `correlation_id`, `workflow_run_id`, `(entity_type, entity_id)`, and `primitive`. Aggregation queries cap at 25–50 rows by default; callers must pass an explicit `limit` to fetch more.

---

## Org Isolation

Every fabric query takes an `orgId` parameter. HTTP routes always extract `orgId` from the authenticated session before invoking the library. Multi-tenant isolation is preserved even if a caller omits the filter. Rows with `orgId IS NULL` are visible only to `founder_admin` and `platform_admin` roles.

---

*Supersedes: [OBSERVABILITY_ARCHITECTURE.md](OBSERVABILITY_ARCHITECTURE.md). See also: [architecture.md](architecture.md) · [packages/telemetry-standards/](packages/telemetry-standards/) · [packages/observability-core/](packages/observability-core/)*
