# Observability Specification
**Phase:** 5 + 9  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Observability Stack

| Layer | Tool | Status |
|---|---|---|
| Structured logging | Pino (`pino` + `pino-http`) | ✅ Live — all console.* removed from production paths |
| Error tracking | Sentry Node.js SDK | ⚠️ Code ready; `SENTRY_DSN` not set (LB-003) |
| Distributed tracing | OpenTelemetry (`artifacts/api-server/src/lib/observability.ts`) | ⚠️ Code ready; `OTEL_EXPORTER_OTLP_ENDPOINT` not set (LB-006) |
| Product analytics | PostHog | ✅ Configured and passing smoke test |
| Web analytics | Amplitude | ✅ Configured and passing smoke test |
| Uptime monitoring | External (Betterstack/UptimeRobot) | ⚠️ Not provisioned (LB-002) |
| APM | OpenTelemetry → Azure Monitor or New Relic | ⚠️ Pending endpoint (LB-006) |

---

## Log Structure

Every log entry from the API server includes:

```json
{
  "level": "info",
  "time": "2026-04-19T12:00:00.000Z",
  "correlationId": "req-uuid-xxxx",
  "tenantId": "org-demo-szl",
  "userId": "user-uuid",
  "method": "POST",
  "url": "/api/decisions",
  "statusCode": 201,
  "responseTime": 42,
  "msg": "Decision created"
}
```

---

## Health Endpoints

| Endpoint | Auth | Response |
|---|---|---|
| `GET /api/health` | None | `{ "status": "ok", "timestamp": "...", "version": "..." }` |
| `GET /api/health/detailed` | Bearer token | DB pool, job queue, AI provider health |
| `GET /api/health/ready` | None | 200 if ready; 503 if not ready |
| `GET /api/version` | None | `{ "version": "x.y.z", "buildTime": "...", "gitSha": "..." }` |

---

## Agent / AI Observability

| Metric | Captured | Location |
|---|---|---|
| Agent run latency | ✅ | `agent_runs` table + OTEL span |
| AI model call cost | ✅ | `agent_runs.cost_tokens` |
| AI model call errors | ✅ | Sentry + Pino error log |
| Tool invocation count | ✅ | `agent_tools` table |
| Memory fetch latency | ✅ | OTEL span |
| Policy check result | ✅ | `policy_checks` table |
| Proof chain write | ✅ | `proof_entries` table |

---

## Background Job Observability

| Job | Freshness Indicator | Error Alert |
|---|---|---|
| AIS polling | Last poll timestamp in DB | Pino WARN if > configured interval |
| STIX/TAXII feed | Last ingest timestamp | Pino WARN if > 24h stale |
| CISA KEV | Last ingest timestamp | Pino WARN |
| Sanctions feed | Last ingest timestamp | Pino WARN |
| Alloy workflow runs | Run status in `workflow_runs` | Sentry error capture |
| Email delivery | Delivery event logged | Pino + Sentry on failure |

---

## Connector Freshness View

The Command artifact at `/command/overview` includes an **Integration Health** panel showing:
- Last-updated timestamp per connector
- Red/Yellow/Green staleness indicator
- Error count for last 24h
- Manual refresh trigger

---

## Production Observability Setup Steps

1. Create Sentry project (Node.js) → obtain DSN → set `SENTRY_DSN` in production secrets
2. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to production OTLP backend (Grafana Cloud, New Relic, Datadog, or Azure Monitor)
3. Set `AZURE_APP_INSIGHTS_CONNECTION_STRING` if using Azure Monitor
4. Provision Betterstack or UptimeRobot monitor on `GET /api/health`
5. Configure alert routing (email + on-call) per OPERATIONS-RUNBOOK.md § 5.3
6. Verify `GET /api/health/detailed` returns healthy with all components green
7. Verify Sentry captures a test exception
8. Verify PostHog receives a test event from production

---

## SLI/SLO Targets (Proposed — Not Yet Formalized)

| SLI | Target | Measurement |
|---|---|---|
| API availability | 99.5% | Uptime monitor on `/api/health` |
| API p50 latency | < 200ms | OTEL span distribution |
| API p99 latency | < 2000ms | OTEL span distribution |
| Decision write success rate | > 99% | Error rate on `POST /api/decisions` |
| Agent run completion rate | > 95% | `workflow_runs` status tracking |
| Auth flow success rate | > 99.9% | Auth error rate |

**Note:** SLI/SLO definitions (KG023) are not yet formally committed. These are proposed targets pending VP Engineering sign-off.
