# SLO / SLI Catalog

Last updated: 2026-04-16

## Purpose

This catalog defines Service Level Objectives (SLOs) and the Service Level Indicators (SLIs) that measure them for all core SZL Holdings platform services. These targets are the contractual floor for reliability — alerts fire before we breach them.

---

## 1. API Server (`szl-api-server`)

### SLI Definitions

| SLI | Measurement Method | Collection Point |
|-----|-------------------|-----------------|
| Availability | `count(non-5xx responses) / count(all responses)` over a rolling 30-day window | API gateway / pino-http logs |
| Request Latency | Histogram of response time in ms at p50, p95, p99 | `telemetryMiddleware` + OTEL |
| Error Rate | `count(5xx) / count(all)` over 5m rolling window | pino-http `res.statusCode >= 500` |
| Auth Failure Rate | `count(401 + 403) / count(auth endpoint requests)` | Auth middleware logs |
| DB Query Latency | Average + p95 of PostgreSQL query execution time | `withDbSpan` in telemetry.ts |
| AI Provider Latency | p95 response time for Anthropic/OpenAI calls | `withExternalSpan` |

### SLO Targets

| Service | SLO | Target | Alert Threshold | Window |
|---------|-----|--------|-----------------|--------|
| API Server | Availability | 99.9% | < 99.5% | 5m rolling |
| API Server | Latency p95 | < 500ms | > 750ms | 5m rolling |
| API Server | Latency p99 | < 2000ms | > 3000ms | 5m rolling |
| API Server | Error Rate | < 1% | > 2% | 5m rolling |
| API Server | Auth Failure Rate | < 5% | > 10% | 5m (brute-force signal) |
| PostgreSQL | Query Latency avg | < 100ms | > 250ms | 5m rolling |
| PostgreSQL | Query Latency p95 | < 300ms | > 500ms | 5m rolling |
| AI Provider | Response Latency p95 | < 10s | > 15s | 5m rolling |
| AI Provider | Availability | 99% | < 97% | 30m rolling |

### Error Budget

For a 99.9% monthly SLO the error budget is **43.8 minutes/month**.

- Yellow flag: budget > 50% consumed in first 15 days of month
- Red flag: budget > 80% consumed at any point in the month

---

## 2. Web Application (`szl-holdings` flagship site)

### SLI Definitions

| SLI | Measurement Method |
|-----|--------------------|
| Page Load (LCP) | Largest Contentful Paint from Web Vitals RUM |
| Interactivity (FID/INP) | First Input Delay / Interaction to Next Paint from Web Vitals RUM |
| Visual Stability (CLS) | Cumulative Layout Shift from Web Vitals RUM |
| Time to Interactive (TTI) | Lighthouse CI + RUM |

### SLO Targets

| Metric | Target | Needs Improvement | Poor |
|--------|--------|------------------|------|
| LCP | < 2.5s | 2.5–4s | > 4s |
| INP | < 200ms | 200–500ms | > 500ms |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 |
| TTI | < 3.5s | 3.5–7.5s | > 7.5s |

---

## 3. AI Features (Alloy / Lyte inference)

| SLO | Target | Alert Threshold |
|-----|--------|-----------------|
| AI Response Time (p95) | < 10s | > 15s over 5m |
| AI Request Availability | 99% | < 97% over 30m |
| Fallback Rate | < 5% | > 10% over 5m |
| Token Budget Overrun | < 1% of requests | > 3% over 15m |

---

## 4. Mobile (`szl-holdings-mobile` / CORTEX)

| SLO | Target | Alert Threshold |
|-----|--------|-----------------|
| Cold Start Time | < 2s | > 3s regression vs baseline |
| Crash-Free Session Rate | > 99% | < 98.5% |
| Offline Sync Latency | < 30s on reconnect | > 60s |
| Push Notification Delivery | > 95% | < 90% |

---

## 5. Database (`szl-postgres`)

| SLO | Target | Alert Threshold |
|-----|--------|-----------------|
| Connection Pool Availability | 99.95% | Connections > 85% of max |
| Replication Lag | < 500ms | > 2s |
| Backup Completion | 100% (daily) | Any missed backup |
| Query P95 | < 300ms | > 500ms over 5m |

---

## Monitoring Dashboard Spec

### Primary Dashboard Panels
1. Request rate (rpm) — time series
2. Error rate (%) — time series with threshold lines at 1% and 2%
3. Latency distribution (p50/p95/p99) — time series
4. Active sessions — gauge
5. Database connection pool — gauge with 85% warning marker
6. AI provider health — status indicators per provider
7. Top 10 slowest routes — ranked table refreshing every 5m
8. Error budget burn rate — time series for current month
9. Recent errors — log stream with level filter

### Error Budget Dashboard
- Monthly budget remaining (minutes)
- Daily burn rate trend
- Incidents by service this month

---

## Review Cadence

| Review | Frequency | Owner |
|--------|-----------|-------|
| SLO Dashboard | Real-time | On-call |
| Error budget review | Weekly | Engineering lead |
| SLO target adjustment | Quarterly | CTO + Engineering |
| Full SLI methodology review | Semi-annual | Engineering |
