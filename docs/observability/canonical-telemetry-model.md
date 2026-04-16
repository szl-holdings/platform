# Canonical Telemetry Model — SZL Holdings Platform

**Version:** 1.0
**Date:** April 16, 2026
**Package:** `@szl-holdings/observability`

This document defines the authoritative naming conventions, event taxonomy, and attribute schema for all telemetry emitted by the SZL Holdings platform. Every span, metric, log, and business event must conform to this model.

---

## Overview

The platform emits three kinds of telemetry:

| Kind | Description | Primary Sink |
|------|-------------|-------------|
| **Traces** | Distributed request spans (OpenTelemetry) | OTLP collector |
| **Metrics** | Counters, histograms, gauges | Prometheus-compatible |
| **Business Events** | Domain transactions via ATLAS event bus | PostgreSQL + stream |

All telemetry shares a common context envelope defined in `@szl-holdings/observability`.

---

## 1. Trace Naming Conventions

### 1.1 HTTP Server Spans

```
http.server.<method>.<route_template>
```

Examples:
- `http.server.GET./api/health`
- `http.server.POST./api/forge/runs`
- `http.server.GET./api/vessels/fleet`

Required attributes:
| Attribute | Type | Description |
|-----------|------|-------------|
| `http.method` | string | HTTP verb |
| `http.route` | string | Route template (not interpolated path) |
| `http.status_code` | int | Response status |
| `http.url` | string | Full URL (no query string in prod) |
| `app.tenant_id` | string | Org/tenant ID if authenticated |
| `app.user_id` | string | User ID if authenticated |
| `app.domain` | string | Domain pack slug (`aegis`, `terra`, `vessels`, etc.) |

### 1.2 Database Spans

```
db.<vendor>.<operation>.<table>
```

Examples:
- `db.postgres.query.users`
- `db.postgres.insert.audit_events`
- `db.postgres.select.vessels_fleet`

Required attributes:
| Attribute | Type | Description |
|-----------|------|-------------|
| `db.system` | string | Always `postgresql` |
| `db.operation` | string | `query`, `insert`, `update`, `delete` |
| `db.sql.table` | string | Primary table affected |
| `db.rows_affected` | int | Rows returned or mutated |
| `db.latency_ms` | float | Query duration |

### 1.3 AI Inference Spans

```
ai.inference.<provider>.<model>
```

Examples:
- `ai.inference.openai.gpt-4o`
- `ai.inference.anthropic.claude-3-5-sonnet`
- `ai.inference.openrouter.mistral-7b`

Required attributes:
| Attribute | Type | Description |
|-----------|------|-------------|
| `ai.provider` | string | `openai`, `anthropic`, `openrouter`, `gemini` |
| `ai.model` | string | Model identifier |
| `ai.prompt_tokens` | int | Input token count |
| `ai.completion_tokens` | int | Output token count |
| `ai.total_tokens` | int | Sum |
| `ai.latency_ms` | float | Time to first token (streaming) or full response |
| `ai.domain` | string | Domain that triggered inference |
| `ai.workflow_id` | string | Alloy workflow ID if applicable |
| `ai.tool_calls` | int | Number of tool calls in response |

### 1.4 Workflow / Approval Spans

```
workflow.<domain>.<workflow_type>.<action>
```

Examples:
- `workflow.forge.deal_review.submitted`
- `workflow.aegis.threat_assessment.approved`
- `workflow.vessels.voyage_plan.rejected`

Required attributes:
| Attribute | Type | Description |
|-----------|------|-------------|
| `workflow.id` | string | Alloy workflow instance ID |
| `workflow.type` | string | Workflow type slug |
| `workflow.domain` | string | Domain pack slug |
| `workflow.action` | string | `submitted`, `approved`, `rejected`, `escalated` |
| `workflow.actor_id` | string | User who triggered action |
| `workflow.latency_ms` | float | Time from submission to resolution |

### 1.5 Connector / Integration Spans

```
connector.<provider>.<operation>
```

Examples:
- `connector.stripe.charge_create`
- `connector.linear.issue_create`
- `connector.github.pr_merge`

Required attributes:
| Attribute | Type | Description |
|-----------|------|-------------|
| `connector.provider` | string | Integration name |
| `connector.operation` | string | Operation performed |
| `connector.status` | string | `ok`, `error`, `timeout` |
| `connector.latency_ms` | float | Round-trip time |

---

## 2. Metric Naming Conventions

All metrics follow Prometheus naming conventions (snake_case, unit suffix).

### 2.1 HTTP Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests by method, route, status |
| `http_request_duration_seconds` | Histogram | Request latency distribution |
| `http_requests_in_flight` | Gauge | Concurrent requests |

Labels: `method`, `route`, `status_code`, `domain`

### 2.2 Database Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `db_query_duration_seconds` | Histogram | Query latency |
| `db_connections_active` | Gauge | Active pool connections |
| `db_errors_total` | Counter | Query errors by table, operation |

### 2.3 AI Inference Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `ai_inference_duration_seconds` | Histogram | Inference latency by provider, model |
| `ai_tokens_total` | Counter | Token consumption by provider, model, type (prompt/completion) |
| `ai_errors_total` | Counter | Inference errors by provider |

### 2.4 Business Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `business_transactions_total` | Counter | Domain transactions by domain, type, outcome |
| `workflow_approvals_total` | Counter | Workflow approvals by domain, type, action |
| `risk_signals_total` | Counter | Risk signal detections by domain, severity |

---

## 3. Business Event Schema (ATLAS)

All business events emitted via `doctrineEventBus` must include:

```typescript
{
  event_id: string;          // UUID v4
  event_type: string;        // Dot-separated: "domain.entity.action"
  timestamp: string;         // ISO 8601
  tenant_id: string;         // Org ID
  actor_id: string;          // User ID (or "system" for automated)
  domain: string;            // Domain pack slug
  entity_type: string;       // e.g., "deal", "vessel", "threat"
  entity_id: string;         // Resource identifier
  payload: Record<string, unknown>;  // Domain-specific data
  metadata: {
    session_id?: string;
    workflow_id?: string;
    correlation_id?: string;
    source_app: string;
  };
}
```

### 3.1 Event Type Naming

```
<domain>.<entity>.<action>
```

Examples:
- `forge.deal.submitted`
- `aegis.threat.detected`
- `vessels.voyage.approved`
- `terra.property.flagged`
- `alloy.workflow.completed`
- `platform.auth.login_failed`

---

## 4. Structured Log Format

All runtime logs (not seed scripts) must use structured JSON:

```typescript
{
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;          // ISO 8601
  app: string;                // Service name
  domain?: string;            // Domain pack if applicable
  tenant_id?: string;
  user_id?: string;
  trace_id?: string;          // OTel trace ID
  span_id?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;     // Domain-specific context
}
```

**Prohibited in structured logs:**
- Raw passwords or tokens
- Full request/response bodies containing PII
- Session cookie values
- Database query results containing personal data

---

## 5. Context Propagation

Every request entering the system must have these values attached to its OpenTelemetry span context and propagated to all downstream calls:

| Context Key | Source | Description |
|-------------|--------|-------------|
| `tenant_id` | JWT claim / session | Organization identifier |
| `user_id` | JWT claim / session | User identifier |
| `correlation_id` | `X-Correlation-ID` header or generated | Request correlation |
| `trace_id` | OpenTelemetry auto-generated | Distributed trace |
| `domain` | Route prefix | Owning domain pack |

---

## 6. Logging Audit — April 2026 Findings

An audit of all `console.log` / `console.error` usage across the platform was performed as part of the Wave 5–6 observability discipline work.

**Findings:**

| Location | console.log count | Assessment |
|----------|-------------------|-----------|
| `artifacts/api-server/src/routes/` | 0 | ✓ Clean — all routes use pino structured logger |
| `artifacts/api-server/src/lib/` | 0 | ✓ Clean — runtime lib uses structured logging |
| `artifacts/api-server/src/scripts/` | ~240 | Acceptable — seed/migration scripts are not runtime paths |
| `artifacts/api-server/src/lib/seed-*.ts` | ~36 | Acceptable — seed scripts |
| `lib/shared-ui/src/` | 3 | ⚠ Low priority — notification-center.tsx, web-push-registration.ts; Sev 3 |

**Conclusion:** The API server runtime (routes, middleware, services) already uses fully structured pino-based logging with JSON output. No runtime `console.log` conversion is required. The 3 shared-ui warnings are in client-side notification utilities and are logged as Sev 3 backlog items.

**Existing structured logging pattern** (already in use in `artifacts/api-server/`):

```typescript
import { logger } from "../lib/logger";

logger.info({ domain: "vessels", tenant_id, user_id }, "Fleet position updated");
logger.warn({ route: "/api/forge/runs", status: 401 }, "Unauthorized request");
logger.error({ err, domain: "terra" }, "Property intelligence fetch failed");
```

The pino logger is configured in `artifacts/api-server/src/lib/logger.ts` with structured JSON output in production and pretty-print in development. This matches the structured log format defined in §4 above.

---

## 7. Telemetry Initialization

The observability library is initialized in `artifacts/api-server/src/index.ts`:

```typescript
import { initializeOpenTelemetry } from "@szl-holdings/observability";
initializeOpenTelemetry({ serviceName: "api-server", environment: process.env.NODE_ENV });
```

Frontend telemetry uses `ClientTelemetryCollector` from `@szl-holdings/observability` with `Web Vitals` reporting.
