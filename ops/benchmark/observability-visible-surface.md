# Observability — Visible Surface Inventory

Generated: 2026-04-16
Updated: 2026-04-16 (Competitive benchmark additions)

---

## What Is Observable Today

This document maps every place where platform health, telemetry, and operational state are currently surfaced — in the product UI, via API, and in operator tooling.

---

## In-Product Surfaces

### Command Portal (`/command/`)

| Surface | Page | What It Shows | Signal Source |
|---------|------|---------------|---------------|
| Health Score | `/command/health` | Composite health score (Security 30%, Operational 30%, Financial 25%, Compliance 15%), dimension bars, 15-day trend | `lib/observability` — client telemetry, domain data hook |
| Domain Cards | `/command/` dashboard | Per-domain health signal, active alerts, score | `useEcosystemData` hook |
| Alerts | `/command/alerts` | Active alert list, severity, source domain | Alert state + ecosystem data |
| SLA Tracker | `/command/sla` | SLA compliance by domain, breach flags | SLA telemetry |
| Costs | `/command/costs` | Budget utilization, MTD spend, over-budget domains | Financial telemetry |
| Signal Chains | `/command/signal-chains` | Cross-domain event correlation | Event bus / correlation engine |
| **Service Status** | `/command/health` (bottom panel) | API version, environment state, recent deploy info | `/api/health` endpoint |

### Aegis (`/aegis/`)

| Surface | What It Shows |
|---------|---------------|
| Threat dashboard | Active threat count, severity distribution, MTTR |
| Module health indicators | Per-module online/offline status |

### API Health Endpoints

| Endpoint | Returns | Consumer |
|----------|---------|----------|
| `GET /api/health/live` | `{ status: "ok" }` | Load balancer liveness probe |
| `GET /api/health/ready` | `{ status: "ok", db: { connected, latencyMs } }` | Readiness gate |
| `GET /api/health` | Full: version, uptime, db state, environment | Command UI, smoke tests |
| `GET /api/health/detailed` | Extended metrics, telemetry counters | Operator debugging |

---

## What Is Instrumented (Code Layer)

### `lib/observability`

| Module | Capability |
|--------|-----------|
| `telemetry.ts` | `ServerTelemetryCollector` — latency, error rate, request count per route; `ClientTelemetryCollector` — web vitals, user events |
| `collector.ts` | `MetricCollector` — aggregates and emits metrics |
| `otel.ts` | OpenTelemetry SDK bootstrap — `initializeOpenTelemetry()`, tracer, span helpers |
| `genai-telemetry.ts` | GenAI spans — model call, tool call, agent step, retrieval, approval, artifact job |
| `event-bus.ts` | Doctrine event bus — correlated event groups |
| `living-mesh.ts` | Distributed trace, heartbeat, GPU metric, business impact, predictive signal |
| `analytics/` | Analytics wrapper |

### API Server Middleware

| Middleware | What It Records |
|------------|----------------|
| `telemetryMiddleware` | Per-request: method, path, status code, latency, correlation ID |
| Pino logger | Structured JSON logs, `X-Correlation-Id` propagation |
| Auth audit | Login, logout, failed auth attempts |

---

## What Is Not Yet Externally Exported

| Signal | Gap | Plan |
|--------|-----|------|
| Traces | No OTEL exporter configured | See `ops/observability/otel-plan.md` |
| Metrics | Internal only — no Prometheus scrape endpoint | Phase 2 |
| Logs | Replit runtime logs only — no external sink | Phase 2 |

---

## Noise Reduction Policy

The Command health UI intentionally does **not** surface:
- Raw request logs
- Span-level trace waterfall
- Prometheus metric dumps

These belong in operator tooling (Grafana, Honeycomb), not the business command layer. The Command Portal shows summarized, scored, human-readable health — not raw telemetry.

---

## Competitive Benchmark Additions

### Vercel: Deployment-Centric Observability
- Every deployment has a visible log stream
- Build time, function execution time, cold start metrics visible
- Analytics dashboard shows traffic, errors, performance
- Alerts on deployment failure, not just runtime errors

### Cloudflare: Zone-Level Analytics
- Per-zone request volume, cache hit ratio, threat score
- Worker analytics (invocations, errors, duration)
- Real-time logs with severity filtering
- Anomaly detection with automatic alerts

### Stripe: API Health Dashboard
- API status page with real-time incident reporting
- Webhook delivery success rate
- Payment success/failure rates
- Integration health (broken webhooks, expired certificates)

### SZL Governance Observability (Target Layer)

Beyond infrastructure observability, SZL should surface **governance health** metrics:

| Metric | Description | Target |
|--------|-------------|--------|
| Signal-to-decision time | Average time through the full loop | < 30 min (critical) |
| Simulation coverage | % of decisions with Monte Carlo | > 90% |
| Policy gate pass rate | % approved on first attempt | 70-85% |
| Proof chain coverage | % of decisions with proof records | > 95% |
| Outcome loop closure | % of decisions with outcome records | > 80% |
| Agent confidence accuracy | Brier score: stated confidence vs. outcomes | > 0.75 |

### Operator-Facing Alerts (Target)

| Alert Type | Trigger | Channel |
|-----------|---------|---------|
| Signal surge | 3x normal volume in any domain | Push + banner |
| Policy escalation | Decision denied, requires executive | Push + email |
| Outcome variance | > 30% variance between predicted/actual | In-app |
| System degradation | API latency P95 > 2s or error rate > 2% | Push + PagerDuty |
| Proof gap | Decision without proof record | In-app alert |
| Agent underperformance | Acceptance rate < 50% | Weekly digest |

---

## Status

| Item | Status |
|------|--------|
| API health endpoints | Live |
| Structured logging | Live |
| Client telemetry hooks | Live |
| Server telemetry middleware | Live |
| GenAI span tracking | Live (lib ready) |
| Command health dashboard | Live |
| Service status panel in Command | Live |
| OTEL external export | Planned (see otel-plan.md) |
| External metrics endpoint | Planned |
| Governance health metrics | Planned (benchmark spec above) |
