# SZL Holdings — Observability Standard

**Version:** 1.0 (Phase 1 seed — current-state findings only)  
**Date:** 2026-04-28  
**Authority:** Platform Engineering  
**Audience:** Platform engineers, domain engineers, SREs  
**Note:** This document is seeded with current-state findings from the Phase 1 inventory. The Operability & Governance phase will extend it with the OTel collector configuration, dashboard definitions, and SLO enforcement.

---

## 1. Current Observability State (2026-04-28)

### Summary

| Signal | Status | Notes |
|--------|--------|-------|
| Distributed traces | ❌ NOT COLLECTED | OTel instrumentation present in api-server; no collector configured |
| Metrics | ❌ NOT COLLECTED | No Prometheus endpoint; lyte-metrics-store is custom only |
| Structured logs | 🟡 PARTIAL | api-server: yes; SPAs, Python services: no |
| Alerting | 🟡 PARTIAL | alerting.bicep drafted; uptime-monitor CI workflow only |
| AI trace persistence | 🟡 PARTIAL | cognitive-observability package exists; in-memory only |
| DORA metrics | ❌ NOT COLLECTED | No deployment tracking beyond CI workflow logs |
| SLO tracking | ❌ NOT ACTIVE | SLOS_AND_ALERTS.md documented; no backend |

**Platform Observability Maturity: 1.5 / 4.0**

---

## 2. Instrumentation Packages (Existing — Use These)

Every new service must use these packages. Do not introduce new observability libraries without platform team approval.

| Package | Role | Language | Import |
|---------|------|---------|--------|
| `packages/otel` | OTel SDK wrappers, tracer, meter | TypeScript | `@workspace/otel` |
| `packages/observability-core` | Health pool, slow query helpers, OBS primitives | TypeScript | `@workspace/observability-core` |
| `packages/cognitive-observability` | AI decision trace, cognitive layer OBS | TypeScript | `@workspace/cognitive-observability` |
| `packages/telemetry-standards` | Structured log event schema (canonical log shape) | TypeScript | `@workspace/telemetry-standards` |

For Python services:
- Logging: `structlog` with JSON output
- Tracing: `opentelemetry-sdk-python` + `opentelemetry-exporter-otlp-proto-grpc`
- No equivalent of `packages/otel` yet — Phase 4 will create a Python OTel bootstrap module

---

## 3. Log Schema Standard

All services must emit JSON logs conforming to this schema. SPAs may use console.log in dev but must not ship custom log formats to production.

### Canonical Log Event Shape

```json
{
  "timestamp": "2026-04-28T12:34:56.789Z",  // ISO 8601 UTC
  "level": "info",                            // debug | info | warn | error | fatal
  "service": "api-server",                    // package name from package.json
  "version": "1.0.0",                        // package version
  "traceId": "abc123",                       // OTel trace ID (if in a trace context)
  "spanId": "def456",                        // OTel span ID
  "tenantId": "tenant-xyz",                  // Tenant ID (if applicable)
  "userId": "user-abc",                      // User ID (never include PII)
  "message": "Human-readable description",
  "domain": "platform",                      // Domain from service-taxonomy
  "context": {                               // Arbitrary structured context
    "routeFile": "routes/guardian.ts",
    "operation": "createDecision",
    "durationMs": 42
  },
  "error": {                                 // Only present on error/fatal level
    "message": "Error message",
    "code": "DECISION_VALIDATION_FAILED",
    "stack": "..."                           // Dev only; strip in prod
  }
}
```

### Required Fields

| Field | Required | Notes |
|-------|----------|-------|
| `timestamp` | ✅ | Always UTC ISO 8601 |
| `level` | ✅ | Lowercase: debug, info, warn, error, fatal |
| `service` | ✅ | Match `package.json` name |
| `message` | ✅ | Human-readable; no PII |
| `traceId` | 🟡 | Required when inside OTel span |
| `domain` | ✅ | From canonical domain list in service-taxonomy.md |

### Prohibited in Logs

- Raw IP addresses (use `hashIp()` from `lib/audit`)
- Personal data (names, emails, phone numbers)
- Credentials, secrets, API keys
- Database query parameters that may contain PII

---

## 4. Trace Standard

### Span Naming Convention

```
<http-method> <route-pattern>          # HTTP spans
  e.g. GET /api/decisions/:id

<domain>.<operation>                    # Domain operation spans
  e.g. alloy.embed, terra.search, counsel.summarize

<worker>.<job-type>                     # Worker job spans
  e.g. alloy-embed-worker.embed-batch
```

### Required Span Attributes

| Attribute | Value | Notes |
|-----------|-------|-------|
| `service.name` | Package name | Set via OTel SDK resource |
| `service.version` | Package version | Set via OTel SDK resource |
| `szl.domain` | Domain from taxonomy | Custom attribute |
| `szl.tenant_id` | Tenant ID | Custom attribute; omit if not applicable |
| `http.method` | HTTP method | Auto-instrumented by OTel Express plugin |
| `http.route` | Route pattern | Auto-instrumented |
| `http.status_code` | Response status | Auto-instrumented |
| `error` | `true` if error | Set on error spans |
| `szl.proof_chain_id` | Proof chain ID | Required for agent decision spans |

### Trace Propagation

All HTTP calls between services must propagate W3C trace context headers (`traceparent`, `tracestate`). The `@szl-holdings/api-client-react` (frontend) and the golden-path service templates will include propagation by default in Phase 3.

---

## 5. Health Endpoint Standard

Every HTTP service (not workers, not SPAs) must expose `GET /health`.

### Response Contract

```json
// 200 OK — service healthy
{
  "status": "ok",
  "version": "1.0.0",
  "service": "api-server",
  "uptime": 12345,
  "checks": {
    "db": "ok",         // if service uses a database
    "cache": "ok"       // if service uses Redis
  }
}

// 503 Service Unavailable — service unhealthy
{
  "status": "degraded",
  "version": "1.0.0",
  "service": "api-server",
  "checks": {
    "db": "error: connection refused"
  }
}
```

### Current Health Endpoint Status

| Service | Health Endpoint | Status |
|---------|----------------|--------|
| api-server | `/api/health` | ✅ Active |
| substrate-inference | `/v1/health` (FastAPI) | ✅ Active |
| alloy-embedding-api | Unknown | ❓ Needs verification |
| alloy-ingestion-orchestrator | Unknown | ❓ Needs verification |
| alloy-runtime-api | Unknown | ❓ Needs verification |
| alloy-fabric-api | Unknown | ❓ Needs verification |
| alloy-fabric-ingest-control | Unknown | ❓ Needs verification |
| lyte-metrics-store | Unknown | ❓ Needs verification |
| substrate-mcp-gateway | Unknown | ❓ Needs verification |
| meridian_control_plane | Unknown | ❓ Needs verification |

**Action for Phase 3:** Verify and add health endpoints to all services. Wire to `pnpm health:check` and Backstage catalog.

---

## 6. Metrics Standard

### Target Metric Naming Convention (Prometheus-compatible)

```
szl_<domain>_<operation>_total              # Counter
szl_<domain>_<operation>_duration_seconds   # Histogram
szl_<domain>_<resource>_active              # Gauge
szl_<domain>_error_total                    # Error counter
```

Examples:
```
szl_api_request_total
szl_api_request_duration_seconds
szl_alloy_embed_request_total
szl_alloy_embed_request_duration_seconds
szl_db_connection_pool_active
szl_proof_chain_emission_total
szl_policy_evaluation_total
szl_policy_evaluation_blocked_total
```

### Required Labels

| Label | Description |
|-------|-------------|
| `service` | Package name |
| `domain` | Domain from taxonomy |
| `env` | `development`, `staging`, `production` |
| `version` | Service version |

### Current State

No services expose `/metrics` endpoints. Phase 4 will:
1. Add `prom-client` (TypeScript) or OTel metric export to all golden-path templates
2. Configure OTel Metrics SDK → OTLP → Azure Monitor or Prometheus
3. Define alert rules for the required metrics above

---

## 7. Alert Standard

### Required Alerts (Per Service, Phase 4 Target)

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Service down | `health` endpoint returns non-200 for 2+ minutes | CRITICAL | PagerDuty / Slack |
| Error rate spike | `szl_<domain>_error_total` rate > 5% over 5 min | HIGH | Slack |
| Slow response | p99 latency > 2s for 5 min | HIGH | Slack |
| DB pool saturation | `szl_db_connection_pool_active` > 80% max | HIGH | Slack |
| Proof chain failure | `szl_proof_chain_emission_total{status="failed"}` > 0 | HIGH | Slack + audit |
| Policy block spike | `szl_policy_evaluation_blocked_total` rate > 10/min | HIGH | Slack + audit |

### Current Alerting Mechanism

- `uptime-monitor.yml` GitHub Actions workflow — endpoint uptime only
- `infra/modules/alerting.bicep` — Azure Monitor alert rules authored; not deployed
- `SLACK_WEBHOOK_URL` configured — ready for alert routing

---

## 8. Cognitive / AI Observability Standard

All AI agent decisions that have consequences (state change, approval required, external action) must be observable through the cognitive observability layer.

### Required AI Trace Attributes

```typescript
{
  traceId: string,              // OTel trace ID
  decisionId: string,           // Unique decision ID (UUID)
  agentId: string,              // Agent identifier
  domain: string,               // Domain from taxonomy
  tenantId: string,             // Tenant context
  userId?: string,              // User who triggered (if applicable)
  orgId?: string,               // Organization context
  inputs: object,               // Redacted/summarized inputs (no PII)
  outputs: object,              // Redacted/summarized outputs
  policyId: string,             // Policy evaluated
  policyOutcome: 'allowed' | 'blocked' | 'modified',
  proofChainId?: string,        // Proof chain entry ID
  modelId: string,              // AI model used (e.g. "gpt-4o")
  latencyMs: number,            // Decision latency
  timestamp: string,            // ISO 8601 UTC
  quality?: {
    score: number,              // 0-1 quality score
    evaluatorId: string         // Which evaluator scored this
  }
}
```

### Current AI Trace State

- `packages/cognitive-observability` implements the trace schema
- Traces held in-memory in api-server process only (lost on restart) — PLT-020
- **Phase 3 action:** Persist AI traces to database (active task)
- **Phase 4 action:** Export AI traces via OTel → Azure Monitor

---

## 9. What Subsequent Phases Must Add

**Phase 3 (Developer Control):**
- Health endpoints on all alloy/substrate services
- OTel instrumentation in golden-path templates
- AI trace persistence to database

**Phase 4 (Operability & Governance — next after Developer Control):**
- OTel Collector deployment (`/observability/collector/`)
- OTLP exporter endpoint configured for all services
- Prometheus `/metrics` endpoint on all services (via golden path)
- Azure Monitor Application Insights or Grafana stack as trace/metric backend
- Alert rules for all required alerts above
- DORA metrics collection pipeline
- Lyte intelligence layer wired to real OTel data

**Phase 5 (Resource & Delivery):**
- Production Azure Monitor workspace
- Log Analytics workspace for structured log ingestion
- SLO monitoring via Azure Monitor SLO or Grafana SLO

---

## Phase 8 — Operability & Governance (2026-05-01)

**Status:** ✅ Implemented — collector configs, SDK drop-in bootstraps, and observability conventions. No existing service runtime code modified.  
**Task reference:** #3487  
**Explicit scope boundary:** Phase 8 establishes the observability *foundation* layer: the OTel Collector pipeline, language SDK bootstraps, SLO schema, alert seeds, and operator-surface type contracts. Per-service adoption of the SDK bootstraps (wiring `/health`, `/ready`, structured logs, trace propagation, and RED metrics into each service's runtime) is deliberately deferred to follow-up task **#4597** to avoid destabilizing services mid-task. The gap report below is the explicit handoff artefact to #4597, not evidence of incomplete work.

### Phase 8 Deliverables

| Artifact | Location | Description |
|----------|----------|-------------|
| OTel Collector config (prod) | `observability/collector/otel-collector-config.yaml` | Full pipeline: OTLP receiver → processors → Azure Monitor + Prometheus |
| OTel Collector config (dev) | `observability/collector/otel-collector-config.dev.yaml` | Dev overlay with debug exporter |
| TypeScript SDK bootstrap | `observability/instrumentation/typescript-sdk-init.ts` | Drop-in OTel init for all TS services |
| Python SDK bootstrap | `observability/instrumentation/python-sdk-init.py` | OTel + structlog init for Python services |
| Trace propagation rules | `observability/instrumentation/trace-propagation.md` | W3C traceparent/baggage requirements |
| SLO conventions | `observability/slo/slo-conventions.md` | SLO schema, tier targets, maturity rubric |
| Alert rules | `observability/alerting/alert-rules.yaml` | PromQL alert seeds for all 5 signal categories |
| Dashboard definitions | `observability/dashboards/dashboard-definitions.md` | 4 dashboard specs for Azure Monitor / Grafana |
| Lyte operator surface | `observability/lyte-operator-surface.ts` | Schema + read paths for deployment/health/incident/approval/drift |

### Collector Pipeline Summary

```
OTLP gRPC (4317) ──┐
OTLP HTTP (4318) ──┤→ memory_limiter → resourcedetection → resource →
Prometheus scrape ─┘   attributes/redact → filter/health_probes →
                        transform/span_names → batch
                        → Azure Monitor (prod)
                        → Grafana OTLP (optional)
                        → Prometheus Remote Write (metrics)
                        → debug/logging (dev only)
```

### OTel Collector Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_MONITOR_CONNECTION_STRING` | ✅ Production | Azure Monitor App Insights connection string |
| `GRAFANA_OTLP_ENDPOINT` | Optional | Grafana Cloud OTLP endpoint |
| `GRAFANA_API_TOKEN` | Optional | Grafana Cloud API token |
| `AZURE_PROMETHEUS_REMOTE_WRITE_URL` | Optional | Azure Managed Prometheus remote-write URL |
| `DEPLOYMENT_ENV` | ✅ All | `development` / `staging` / `production` |

### Service Instrumentation Gap Report (Phase 8 Assessment)

Services deferred (too risky to instrument in this task; documented for follow-up):

| Service | Gap | Risk | Follow-up |
|---------|-----|------|-----------|
| alloy-fabric-api | No OTel, no health endpoint | Restart may drop active ingestion | Phase 9 follow-up |
| alloy-fabric-ingest-control | No OTel, no health endpoint | Same | Phase 9 follow-up |
| meridian_control_plane | Python; no OTel | Python OTel bootstrap required first | Phase 9 follow-up |
| meridian_forecast_lab | Python; no OTel | Same | Phase 9 follow-up |
| substrate-py-workers | Python; no OTel | Same | Phase 9 follow-up |

All other services are ready to adopt the SDK bootstrap in follow-up task **#4597** (per-service OTel instrumentation). The bootstrap at `observability/instrumentation/typescript-sdk-init.ts` is the drop-in entry point; wiring it requires only adding the `import` at the top of each service's entrypoint and setting the env vars listed above — no architectural changes.

### SLO Files Required (Next Action)

Every service must add `slo.yaml` alongside its `catalog-info.yaml`.
Use the template in `observability/slo/slo-conventions.md`. Target:
all Tier 0/1 services have SLO files by the next platform engineering sprint.
