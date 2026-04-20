# Production Observability Audit — SZL Holdings Platform

**Audit date:** 2026-04-20  
**Auditor:** Engineering / Founder  
**Scope:** API server, database layer, background jobs, AI pipelines, multi-tenant isolation  
**Canonical reference:** [telemetry-model.md](../../telemetry-model.md) · [OBSERVABILITY_ARCHITECTURE.md](../../OBSERVABILITY_ARCHITECTURE.md)

---

## Executive Summary

The SZL Holdings platform has a well-structured observability stack built on OpenTelemetry (`packages/otel`, `packages/observability-core`), structured logging via Pino, Sentry error tracking, health endpoints, and a self-monitoring daemon. The telemetry model is documented and enforced at the API layer. The majority of critical signals are instrumented; the main gaps are in external exporter configuration (OTEL endpoint, Sentry DSN) which must be set before production launch.

**Overall readiness:** AMBER — instrumentation is complete; production exporters must be wired before GA.

---

## 1. Structured Logging

### Status: GREEN (implemented)

| Signal | Implementation | Assessment |
|--------|---------------|------------|
| Structured JSON logs via Pino | `lib/observability` — all API routes log structured JSON | PASS |
| Request correlation IDs | `packages/observability-core/src/middleware` — injects `x-correlation-id` into every request | PASS |
| Log level by environment | `LOG_LEVEL` env var; defaults to `info` in production | PASS |
| Slow query logging | `SLOW_QUERY_THRESHOLD_MS` (default 500ms) — queries above threshold logged with full SQL | PASS |
| Tenant / org_id in log context | Correlation middleware includes `org_id` when session present | PASS |
| Log shipping to external sink | **NOT CONFIGURED** — logs go to stdout; no log aggregator (Datadog, Loki, CloudWatch) is wired | GAP |

**Gap: Log shipping.** Stdout logs are sufficient in development and on Replit. For production (Azure App Service), logs must be shipped to Azure Monitor / Log Analytics or a third-party aggregator. Required before GA.

---

## 2. Critical Metrics

### Request Rate, Latency, Error Rate

| Signal | Implementation | Threshold | Assessment |
|--------|---------------|-----------|------------|
| HTTP request rate | OTel HTTP instrumentation via `packages/observability-core` | — | PASS |
| P95 / P99 latency | Tracked in `lib/observability` telemetry snapshot; exposed on `/api/health/detailed` | Alert at P95 > 2s | PASS |
| Error rate (5xx) | `lib/self-monitor.ts` polls health endpoint; alerts fire at > 5% | 5% | PASS |
| Auth failure rate | Auth middleware logs each failure with `org_id`, route, reason; rolling rate computed in `serverTelemetry`; self-monitor alerts when > 10/min | 10 failures/min | PASS |
| Tenant isolation violations | Recorded via `serverTelemetry.recordTenantIsolationViolation` at every middleware/route 403; self-monitor fires a critical alert on any new occurrence | Any (1+) occurrence | PASS |

### Queue Depth

| Signal | Implementation | Threshold | Assessment |
|--------|---------------|-----------|------------|
| Job queue depth (pending/running/failed) | Exposed on `/api/health/detailed` — `queueDepth.pending`, `.running`, `.failed` | Alert at pending > 50 | PASS |
| Failed job accumulation | Logged with job type and error; health detailed returns count | — | PASS |

### Database

| Signal | Implementation | Threshold | Assessment |
|--------|---------------|-----------|------------|
| DB reachability | `/api/health` — 503 if DB is unreachable | Immediate alert | PASS |
| Connection pool saturation | `/api/health/detailed` returns pool `active`, `idle`, `total` | No threshold configured | PARTIAL |
| Slow queries | Logged above `SLOW_QUERY_THRESHOLD_MS` | No alert wired | PARTIAL |

### AI Pipeline

| Signal | Implementation | Threshold | Assessment |
|--------|---------------|-----------|------------|
| AI provider reachability | Active health probes (OpenAI, Anthropic, Gemini) every 2 min | Alert on failure | PASS |
| GenAI span attributes | `packages/telemetry-standards/genai` — model, tokens, latency per call | — | PASS |
| AI model error rate | Logged per call; OTel spans capture error attribute | No aggregated alert | PARTIAL |

---

## 3. Distributed Tracing

### Status: AMBER (instrumented; exporter not configured)

| Signal | Implementation | Assessment |
|--------|---------------|------------|
| OTel SDK initialized | `packages/otel` — `initializeOpenTelemetry()` called in `index.ts` | PASS |
| HTTP spans | Auto-instrumented via `packages/observability-core` | PASS |
| PostgreSQL query spans | `packages/otel/src/drizzle-instrumentation.ts` | PASS |
| Correlation span propagation | `packages/otel/src/correlation-span.ts` | PASS |
| GenAI spans | `packages/telemetry-standards` semantic conventions enforced | PASS |
| OTLP exporter configured | **NOT CONFIGURED** — `OTEL_EXPORTER_OTLP_ENDPOINT` or `AZURE_APP_INSIGHTS_CONNECTION_STRING` must be set | GAP |
| Console exporter (dev) | Available via `OTEL_CONSOLE_EXPORT=true` | PASS |

**Gap: OTLP exporter.** The OTel SDK is fully instrumented. No traces are shipped to an external backend until an exporter env var is set. Must be configured before production launch (Azure Application Insights is the recommended target for Azure deployments).

---

## 4. Error Tracking (Sentry)

### Status: AMBER (code complete; DSN not configured)

| Signal | Implementation | Assessment |
|--------|---------------|------------|
| Sentry SDK initialized | `artifacts/api-server/src/lib/sentry.ts` — wired in startup | PASS |
| Unhandled exceptions captured | `onUncaughtExceptionIntegration` | PASS |
| Express route errors | `expressIntegration` | PASS |
| PostgreSQL query spans | `postgresIntegration` | PASS |
| PII scrubbing | Auth, cookie, internal token headers scrubbed before send | PASS |
| Release tagging | `szl-api@<version>` set automatically from `package.json` | PASS |
| `SENTRY_DSN` configured | **NOT CONFIGURED** — Sentry is inactive until DSN is set | GAP |

**Gap: Sentry DSN.** The Sentry integration is production-ready. Activation requires creating a Sentry project and setting `SENTRY_DSN` in the production environment.

---

## 5. Alerts

### Status: PARTIAL

| Alert | Mechanism | Threshold | Assessment |
|-------|-----------|-----------|------------|
| High error rate | `lib/self-monitor.ts` — polls `/api/health/detailed` every 5 min | > 5% error rate | PASS |
| High P95 latency | Self-monitor | > 2s | PASS |
| DB unreachable | Self-monitor + health endpoint | Immediate | PASS |
| Queue depth | Self-monitor | > 50 pending | PASS |
| AI provider down | AI health probe every 2 min | On failure | PASS |
| Auth failure spike | Self-monitor checks `serverTelemetry.getAuthFailureRatePerMin()` each cycle | > 10 failures/min | PASS |
| Tenant isolation violation | Self-monitor reads `serverTelemetry.getTenantIsolationViolationsSince()` each cycle | Any (1+) occurrence | PASS |
| Backup age > 24 hours | Backup manifest read by health endpoint | > 24 hours — warning status | PASS |
| DB connection pool near max | **NOT WIRED** — pool metrics visible but no alert threshold | — | GAP |
| External uptime monitor | Documented in `OPERATIONS-RUNBOOK.md §5.3` — Betterstack / UptimeRobot not yet configured | — | GAP |

**Notification routing:** Self-monitor fires Slack webhook alerts (when `SLACK_WEBHOOK_URL` is set). Rate limiting: 5 critical alerts/min, 10 warning/min.

---

## 6. Dashboards

### Status: PARTIAL — no external dashboard; health endpoint is the current surface

| Dashboard | State | Notes |
|-----------|-------|-------|
| `/api/health` public liveness | LIVE | Returns `{"status":"healthy"}` or `{"status":"degraded"}` |
| `/api/health/detailed` full status | LIVE | DB pool, queue depth, telemetry snapshot, memory, backup manifest |
| Grafana / Azure Application Insights | NOT CONFIGURED | Requires OTLP exporter wiring |
| Sentry Issues | NOT CONFIGURED | Requires `SENTRY_DSN` |
| Business metrics dashboard | Decision Fabric surfaces in `OBSERVABILITY_ARCHITECTURE.md` | Available via API; no external dashboard |

---

## 7. Critical Signals Summary

| Signal | Status | Priority to fix |
|--------|--------|----------------|
| Structured logs (stdout) | PASS | — |
| Log shipping to aggregator | GAP | P1 — required before GA |
| HTTP request rate / latency / error rate | PASS | — |
| Auth failure rate alert | PASS (self-monitor alerts > 10/min) | — |
| Tenant isolation violation alert | PASS (self-monitor alerts on any occurrence) | — |
| Queue depth monitoring | PASS | — |
| DB reachability alert | PASS | — |
| DB pool saturation alert | PARTIAL (visible, no alert) | P2 |
| AI provider health | PASS | — |
| Distributed tracing (OTel instrumented) | PASS (exporter not set) | P1 — configure before GA |
| Error tracking (Sentry instrumented) | PASS (DSN not set) | P1 — configure before GA |
| External uptime monitor | GAP | P1 — configure before GA |
| Backup age / manifest health | PASS | — |
| External alert routing (Slack) | PASS (requires `SLACK_WEBHOOK_URL`) | P1 |

---

## 8. Wiring Completed as Part of This Audit

The following signals were confirmed working and required no changes:
- Self-monitor alert thresholds (§5)
- Backup health endpoint integration with `backup_manifest.json`
- OTel SDK initialization and span instrumentation

The following were addressed:
- `backup.yml` CI workflow created — backup automation now runs on a verified schedule
- `BACKUP-RESTORE.md` updated to reflect the actual tested procedure

---

## 9. Known Gaps — Priority Register

| # | Gap | Priority | Resolution path | Target |
|---|-----|----------|----------------|--------|
| OBS-001 | OTLP exporter not configured in production | P1 | Set `AZURE_APP_INSIGHTS_CONNECTION_STRING` or `OTEL_EXPORTER_OTLP_ENDPOINT` before launch | Pre-GA |
| OBS-002 | Sentry DSN not set — error tracking inactive | P1 | Create Sentry project, set `SENTRY_DSN` secret | Pre-GA |
| OBS-003 | External uptime monitor not provisioned | P1 | Configure Betterstack per `OPERATIONS-RUNBOOK.md §5.3` | Pre-GA |
| OBS-004 | Log shipping — stdout only, no aggregator | P1 | Wire Azure Monitor / Log Analytics for Azure production | Pre-GA |
| OBS-005 | Tenant isolation violation — logged, no auto-alert | P1 | ✅ Resolved 2026-04-20 — `serverTelemetry.recordTenantIsolationViolation()` wired into tenant-scope middleware and route 403 paths; self-monitor fires a critical alert on any new occurrence each cycle | Done |
| OBS-006 | Auth failure rate — no alert threshold | P2 | ✅ Resolved 2026-04-20 — `serverTelemetry.getAuthFailureRatePerMin()` checked each self-monitor cycle; alert fires when > 10/min (critical when > 50/min) | Done |
| OBS-007 | DB pool saturation — no alert | P2 | ✅ Resolved 2026-04-20 — `/api/health/detailed` now exposes `dbPool` (active/idle/waiting/max/usedPct); self-monitor fires a high alert when usage stays > 80% for two consecutive cycles, escalates to critical when waiters are queued or usage ≥ 95% | Done |
| OBS-007a | Per-checkout leak detection (single client holding pool too long) | P2 | ✅ Resolved 2026-04-20 — `lib/db` wraps `pool.connect()` to record acquired-at + originating stack for every checkout, removes it on `client.release()`. A background sweeper logs a structured `db.pool.checkout.long` warning the first time a checkout crosses `DB_CHECKOUT_WARN_THRESHOLD_MS` (default 30s). Self-monitor reads `getLongRunningCheckouts()` each cycle and fires a high (or critical) signal that pinpoints the offending route via the captured stack, complementing the aggregate OBS-007 alert | Done |
| OBS-008 | Slow query alert — logged, no alert | P3 | Add aggregated alert for repeated slow queries | Q3 2026 |
| OBS-009 | Grafana / dashboard — no external dashboard | P2 | Set up Application Insights workbook or Grafana after OTLP wiring | Post-GA |
| OBS-010 | `Slack_WEBHOOK_URL` must be set in production | P1 | Add secret before launch | Pre-GA |

---

*Audit completed: 2026-04-20 · Next audit: 2026-07-01*
