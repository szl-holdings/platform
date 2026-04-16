# OpenTelemetry Implementation Plan

Last updated: 2026-04-16

## Current State (Implemented)

### Tracing

- `lib/observability/src/otel.ts` provides `initializeOpenTelemetry()` with multi-exporter support:
  - OTLP endpoint (Honeycomb, Jaeger, Grafana Tempo)
  - Azure Monitor (via `AZURE_APP_INSIGHTS_CONNECTION_STRING`)
  - New Relic (via `NEW_RELIC_LICENSE_KEY`)
  - Console export (via `OTEL_CONSOLE_EXPORT=true`)
- `OtelTracer` wrapper with `startSpan()` and `withSpan()` — falls back to NoOpSpan when OTel is not configured
- `traceparent` header propagation via correlation middleware
- GenAI semantic conventions in `genai-telemetry.ts` (model_call, tool_call, agent_step, retrieval spans)

### Metrics

- `ServerTelemetryCollector` in `telemetry.ts` — tracks P50/P95/P99 latency, error rates, active alerts
- `telemetryMiddleware` in `artifacts/api-server/src/middlewares/telemetry.ts` — per-request APM spans with DB query time, external API latency, serialization time
- Memory monitoring (20-second interval, GC triggers at 70%/82%/92% of 512MB limit)
- Self-monitoring via `lib/self-monitor.ts` polling `/api/health/detailed` every 5 minutes

### Logs

- Structured logging via pino with service/version/env metadata in every log line
- `X-Correlation-Id` and `X-Request-Id` included in all request logs
- Request/response serializers redact `authorization`, `cookie`, `set-cookie` headers
- Log level auto-escalation: 5xx → error, 4xx → warn, 2xx/3xx → info

### Initialization

Called in `artifacts/api-server/src/index.ts` at startup:

```typescript
initializeOpenTelemetry({
  serviceName: process.env.OTEL_SERVICE_NAME ?? "szl-api",
  serviceVersion: process.env.npm_package_version ?? "1.0.0",
  otlpEndpoint: process.env.OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  exportToAzureMonitor: !!process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING,
  exportToNewRelic: !!process.env.NEW_RELIC_LICENSE_KEY,
  exportToConsole: process.env.OTEL_CONSOLE_EXPORT === "true",
});
```

---

## Target Architecture (Next Steps)

### Phase 1: Auto-Instrumentation (Priority: High)

Add OpenTelemetry auto-instrumentation packages to api-server:

```
@opentelemetry/instrumentation-express
@opentelemetry/instrumentation-http
@opentelemetry/instrumentation-pg
@opentelemetry/instrumentation-dns
```

This will automatically create spans for every Express route, outbound HTTP call, and database query without modifying route code.

### Phase 2: Trace-Log Correlation (Priority: High)

Inject OTel trace ID and span ID into pino log entries:

```typescript
const logger = pino({
  mixin() {
    const span = trace.getActiveSpan();
    if (span) {
      const ctx = span.spanContext();
      return { traceId: ctx.traceId, spanId: ctx.spanId };
    }
    return {};
  },
});
```

This enables clicking from a log line directly to the associated trace in Honeycomb/Jaeger.

### Phase 3: Custom Business Spans (Priority: Medium)

Add manual spans for business-critical operations:

| Operation | Span Name | Key Attributes |
|-----------|-----------|---------------|
| AI inference | `ai.inference` | `ai.model`, `ai.tokens`, `ai.provider`, `ai.confidence` |
| Workflow execution | `alloy.workflow.execute` | `workflow.id`, `workflow.type`, `workflow.step` |
| Approval gate | `alloy.approval.evaluate` | `approval.required`, `approval.auto` |
| Sanctions screening | `vessels.sanctions.screen` | `vessel.imo`, `lists.checked`, `matches` |
| Monte Carlo simulation | `simulation.montecarlo.run` | `scenarios`, `iterations`, `p95_value` |

### Phase 4: Metrics Export (Priority: Medium)

Export custom OTel metrics to complement auto-instrumentation:

| Metric | Type | Labels |
|--------|------|--------|
| `api.request.duration` | Histogram | `method`, `route`, `status` |
| `api.active.requests` | UpDownCounter | `method` |
| `db.pool.connections` | Gauge | `state` (active/idle/waiting) |
| `ai.inference.duration` | Histogram | `provider`, `model` |
| `ai.inference.tokens` | Counter | `provider`, `type` (prompt/completion) |
| `job.queue.depth` | Gauge | `status` (pending/running) |
| `auth.failures` | Counter | `type` (login/token/csrf) |

### Phase 5: Distributed Tracing (Priority: Low)

For multi-service deployments:
- Propagate `traceparent` header to external service calls
- Link frontend browser traces to backend API traces via `fetchWithContext`
- Link mobile CORTEX traces via `X-Trace-Id` header

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OTEL_SERVICE_NAME` | No | Service name (default: `szl-api`) |
| `OTLP_ENDPOINT` | No | OTLP collector endpoint |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | Alternative OTLP endpoint env var |
| `OTEL_EXPORTER_OTLP_HEADERS` | No | Auth headers for OTLP (e.g., `x-honeycomb-team=<key>`) |
| `OTEL_CONSOLE_EXPORT` | No | Set `true` for console span export (dev only) |
| `AZURE_APP_INSIGHTS_CONNECTION_STRING` | No | Azure Monitor export |
| `NEW_RELIC_LICENSE_KEY` | No | New Relic export |

## Recommended Production Setup

For Replit deployment, the simplest path is Honeycomb (generous free tier, OTEL-native):

```env
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=<YOUR_API_KEY>
OTEL_SERVICE_NAME=szl-api-server
```

---

*See also: [service-health-model.md](service-health-model.md) · [slo-sli-catalog.md](slo-sli-catalog.md)*
