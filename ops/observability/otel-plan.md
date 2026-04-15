# OpenTelemetry Plan

Generated: 2026-04-15

## Current State

- `lib/observability` exists with telemetry middleware
- Pino structured logging with request IDs via `X-Correlation-Id`
- `telemetryMiddleware` tracks latency and error rates internally
- `/api/health/detailed` exposes internal metrics
- No external OTEL exporter configured

## Target Architecture

### Traces
- Instrument Express middleware with `@opentelemetry/instrumentation-express`
- Instrument HTTP client calls with `@opentelemetry/instrumentation-http`
- Instrument PostgreSQL queries with `@opentelemetry/instrumentation-pg`
- Propagate trace context via W3C headers

### Metrics
- Request latency (p50, p95, p99) per route
- Error rate per route and status code
- Active connections / concurrent requests
- Database query latency
- AI provider latency and error rate
- Queue depth (if background jobs exist)

### Logs
- Already structured (Pino)
- Add trace ID to all log entries
- Add environment and service name metadata

## Export Targets (Production)

| Signal | Recommended Target | Alternative |
|--------|-------------------|-------------|
| Traces | Honeycomb, Jaeger, or Grafana Tempo | Datadog |
| Metrics | Prometheus + Grafana | Datadog |
| Logs | Grafana Loki or Elasticsearch | Datadog |

For Replit deployment, the simplest path is Honeycomb (generous free tier, OTEL-native).

## Environment Variables

```
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=<YOUR_API_KEY>
OTEL_SERVICE_NAME=szl-api-server
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production
```

## Implementation Priority

1. Add `@opentelemetry/sdk-node` to api-server
2. Configure auto-instrumentation for Express + pg
3. Inject trace ID into Pino log entries
4. Export to chosen backend
5. Build dashboards for SLOs
