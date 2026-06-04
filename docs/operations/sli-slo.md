# SZL Holdings — SLI / SLO Definitions

**Last updated:** 2026-04-25 (Task #3489 — A11oy Operationalization Sweep)  
**Owner:** Platform Engineering  
**Audience:** Engineering leadership, VP Engineering, enterprise architects, SRE

This document defines the Service Level Indicators (SLIs), Service Level Objectives (SLOs), and error budget policy for critical SZL Holdings platform surfaces.

---

## Overview

| Term | Definition |
|------|-----------|
| **SLI** (Service Level Indicator) | A quantitative measure of a service characteristic (availability, latency, error rate) |
| **SLO** (Service Level Objective) | A target percentage for an SLI over a rolling window |
| **Error Budget** | The allowed deviation from 100% without violating the SLO |
| **Burn Rate** | The rate at which the error budget is consumed relative to the time window |

---

## Critical Surfaces

| Surface | Artifact | Preview Path | Tier |
|---------|----------|-------------|------|
| API Server | `artifacts/api-server` | `/api/` | Tier 1 — Core |
| SZL Holdings Dashboard | `artifacts/szl-holdings` | `/` | Tier 1 — Core |
| KORA (Decision Intelligence) | `artifacts/lyte-command-center` | `/lyte/` | Tier 1 — Core |
| FORGE Command Portal | `artifacts/command` | `/command/` | Tier 1 — Core |
| TENAX (Cyber Resilience) | `artifacts/sentra` | `/sentra/` | Tier 2 — Domain |
| Counsel (Legal) | `artifacts/counsel` | `/counsel/` | Tier 2 — Domain |
| SEXTANT (Maritime) | `artifacts/vessels` | `/vessels/` | Tier 2 — Domain |
| DOMAINE (Real Estate) | `artifacts/terra` | `/terra/` | Tier 2 — Domain |
| Carlota Jo | `artifacts/carlota-jo` | `/carlota-jo/` | Tier 2 — Domain |
| A11oy Fabric API | `artifacts/api-server` | `/api/a11oy/` | Tier 1 — Core |

---

## Tier 1 SLO Definitions

### API Server — Availability SLO

| Field | Value |
|-------|-------|
| **SLI** | % of health check requests returning HTTP 200 (GET `/api/health`) |
| **Measurement window** | 30-day rolling |
| **SLO Target** | 99.5% |
| **Error budget** | 0.5% = ~3.6 hours/month |
| **Alert threshold** | 2× burn rate (budget consumed in 15 days at current rate) |
| **Measurement source** | External uptime monitor (Betterstack / UptimeRobot) — GET `/api/health` every 60 seconds |

### API Server — Latency SLO

| Field | Value |
|-------|-------|
| **SLI** | p99 response time for `GET /api/health` and authenticated API requests |
| **Measurement window** | 30-day rolling |
| **SLO Target** | p50 < 200ms; p95 < 500ms; p99 < 2000ms |
| **Alert threshold** | p99 > 1000ms for 5 consecutive minutes |
| **Measurement source** | OpenTelemetry spans exported to configured OTLP endpoint |

### API Server — Error Rate SLO

| Field | Value |
|-------|-------|
| **SLI** | % of authenticated API requests returning HTTP 5xx |
| **Measurement window** | 30-day rolling |
| **SLO Target** | ≤ 0.1% 5xx error rate |
| **Error budget** | 0.1% of all requests |
| **Alert threshold** | > 1% 5xx for any 5-minute window |
| **Measurement source** | Pino structured logs aggregated by log level ERROR |

---

### SZL Holdings Dashboard — Availability SLO

| Field | Value |
|-------|-------|
| **SLI** | % of page loads returning HTTP 200 (GET `/`) |
| **Measurement window** | 30-day rolling |
| **SLO Target** | 99.5% |
| **Error budget** | 0.5% = ~3.6 hours/month |

### KORA — Availability SLO

| Field | Value |
|-------|-------|
| **SLI** | % of requests returning HTTP 200 (GET `/lyte/`) |
| **Measurement window** | 30-day rolling |
| **SLO Target** | 99.5% |

### A11oy Fabric API — Availability SLO

| Field | Value |
|-------|-------|
| **SLI** | % of requests to `GET /api/a11oy/status` returning HTTP 200 |
| **Measurement window** | 30-day rolling |
| **SLO Target** | 99.9% (Phase 1 — in-memory; no DB dependency; degradation-resistant) |
| **Error budget** | 0.1% = ~43 minutes/month |

---

## Tier 2 SLO Definitions

All Tier 2 domain surfaces share the following baseline SLOs:

| SLI | SLO Target | Error Budget |
|-----|-----------|-------------|
| Availability (HTTP 200) | 99.0% | 1% = ~7.2 hours/month |
| p95 Latency | < 1000ms | — |
| 5xx Error Rate | ≤ 0.5% | — |

---

## Error Budget Policy

| Error Budget Remaining | Action |
|-----------------------|--------|
| > 50% | Normal — no action required |
| 25–50% | Yellow alert — engineering awareness; review recent deploys |
| 10–25% | Orange alert — engineering escalation; freeze non-critical deployments |
| < 10% | Red alert — incident response; all hands; deploy freeze |
| 0% (exhausted) | SLO violated — post-incident review required; 30-day corrective plan |

---

## Alerting Configuration

Alert thresholds are configured in the observability stack. Current observability config (`artifacts/api-server/src/lib/observability.ts`) supports:

| Exporter | Env Var | SLO-relevant alerts |
|----------|---------|-------------------|
| OTLP (generic) | `OTEL_EXPORTER_OTLP_ENDPOINT` | Latency, error rate |
| Azure Monitor | `AZURE_APP_INSIGHTS_CONNECTION_STRING` | All SLIs |
| New Relic | `NEW_RELIC_LICENSE_KEY` | All SLIs |
| Sentry | `SENTRY_DSN` | Error rate |
| Uptime Monitor | `UPTIME_MONITOR_ID` | Availability |

**Alert routing:** On-call via PagerDuty / Betterstack → engineering leads → status page webhook.

---

## Incident Response Thresholds

| Severity | Condition | Response |
|----------|-----------|---------|
| SEV1 | API server unavailable > 2 consecutive health checks | Immediate on-call page + status page update |
| SEV2 | p99 latency > 2000ms for > 5 minutes | Engineering alert; post-incident review |
| SEV3 | 5xx rate > 1% for > 5 minutes | Engineering alert; investigate within 1 hour |
| SEV4 | Single domain surface unavailable | Engineering alert; investigate within 4 hours |

---

## SLO Review Cadence

| Review | Frequency | Owner |
|--------|-----------|-------|
| Error budget consumption review | Weekly | Platform Engineer |
| SLO target adjustment | Quarterly | VP Engineering |
| Annual SLO retrospective | Annually | Engineering leadership |

---

## Notes

- **Pre-launch phase:** These SLOs apply to the active development and investor preview environment. Production SLOs will be re-baselined after production infrastructure is provisioned.
- **No production deployment active:** As of 2026-04-25, the platform has no active Replit Deployment. SLOs apply when the deployment is live.
- **External uptime monitor:** Must be provisioned per `docs/operations/operations-runbook.md § Observability Runbook`. Set `UPTIME_MONITOR_ID` in Replit Secrets once configured.

---

*SLI/SLO definitions are living documents. Update when infrastructure changes, new surfaces are added, or error budgets are re-baselined after production launch.*
