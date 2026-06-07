# SLI / SLO Specification
**Generated:** 2026-04-03
**Phase:** Post-Payload Phase 6-7 — Readiness Gates + Automation Coverage

---

## Purpose

This document defines the Service Level Indicators (SLIs) and Service Level Objectives (SLOs) for each active product. These are candidates for the first production SLO contract — not yet enforced, but ready to instrument.

---

## SLI Definitions

| SLI Name | Measurement | Source |
|----------|------------|--------|
| **Availability** | % of health check polls that return HTTP 200 | Uptime monitor / Prometheus |
| **Request Success Rate** | % of non-5xx HTTP responses / total requests | API server logs |
| **Latency p95 (read)** | 95th percentile response time for GET endpoints | APM / trace spans |
| **Latency p95 (write)** | 95th percentile response time for POST/PATCH/DELETE | APM / trace spans |
| **Error Rate** | % of requests resulting in unhandled exception | Error tracking (Sentry-equivalent) |
| **Core Web Vitals (LCP)** | Largest Contentful Paint measured by RUM | Browser telemetry |
| **E2E Journey Pass Rate** | % of scheduled Playwright runs that pass fully | CI / E2E run reports |

---

## SLO Targets by App

### Platform / API Server

| SLI | SLO Target | Measurement Window | Alert Threshold |
|-----|-----------|-------------------|-----------------|
| Availability | 99.5% | Rolling 7 days | < 99.0% triggers P1 |
| Request Success Rate | 99.0% | Rolling 24h | < 98.0% triggers P1 |
| Latency p95 (read) | < 500ms | Rolling 1h | > 1s triggers P2 |
| Latency p95 (write) | < 2000ms | Rolling 1h | > 4s triggers P1 |
| Error Rate | < 0.5% | Rolling 1h | > 2% triggers P0 |

---

### Lyte Command Center

| SLI | SLO Target | Measurement Window | Alert Threshold |
|-----|-----------|-------------------|-----------------|
| Availability | 99.0% | Rolling 7 days | < 98.5% triggers P2 |
| LCP | < 2.5s | Rolling 24h RUM | > 4s triggers P2 |
| E2E Journey Pass Rate | 95% | Weekly scheduled run | < 90% triggers P2 |
| Request Success Rate | 98.5% | Rolling 24h | < 97% triggers P2 |

---

### Aegis (Firestorm)

| SLI | SLO Target | Measurement Window | Alert Threshold |
|-----|-----------|-------------------|-----------------|
| Availability | 99.0% | Rolling 7 days | < 98.5% triggers P2 |
| LCP | < 2.5s | Rolling 24h RUM | > 4s triggers P2 |
| E2E Journey Pass Rate | 95% | Weekly scheduled run | < 90% triggers P2 |
| Incident Queue Load Time | < 1s | Rolling 1h | > 2s triggers P2 |

---

### Terra

| SLI | SLO Target | Measurement Window | Alert Threshold |
|-----|-----------|-------------------|-----------------|
| Availability | 99.0% | Rolling 7 days | < 98.5% triggers P2 |
| LCP | < 3.0s | Rolling 24h RUM | > 5s triggers P2 (map-heavy) |
| E2E Journey Pass Rate | 95% | Weekly scheduled run | < 90% triggers P2 |
| Map Tile Load Time | < 3s | Rolling 1h | > 6s triggers P2 |

---

### Vessels

| SLI | SLO Target | Measurement Window | Alert Threshold |
|-----|-----------|-------------------|-----------------|
| Availability | 99.0% | Rolling 7 days | < 98.5% triggers P2 |
| LCP | < 3.0s | Rolling 24h RUM | > 5s triggers P2 |
| E2E Journey Pass Rate | 95% | Weekly scheduled run | < 90% triggers P2 |
| Fleet Dashboard Load | < 2s | Rolling 1h | > 4s triggers P2 |

---

### SZL Holdings

| SLI | SLO Target | Measurement Window | Alert Threshold |
|-----|-----------|-------------------|-----------------|
| Availability | 99.5% | Rolling 7 days | < 99.0% triggers P1 |
| LCP | < 2.5s | Rolling 24h RUM | > 4s triggers P2 |
| E2E Journey Pass Rate | 95% | Weekly scheduled run | < 90% triggers P2 |

---

### Carlota Jo

| SLI | SLO Target | Measurement Window | Alert Threshold |
|-----|-----------|-------------------|-----------------|
| Availability | 99.0% | Rolling 7 days | < 98.0% triggers P2 |
| Booking Form Load | < 2s | Rolling 1h | > 4s triggers P2 |
| E2E Journey Pass Rate | 90% | Weekly scheduled run | < 85% triggers P2 |

---

## Error Budget Policy

**Error Budget** = 1 - SLO Target

- If error budget is > 50% consumed in a 30-day window → freeze feature work, focus on reliability
- If error budget is fully consumed → P0 incident declared, leadership notified, release freeze
- Error budget resets monthly on the 1st

---

## Instrumentation Prerequisites

The following must be in place before SLOs can be enforced:
1. Health endpoint `/health` returning `{ status: "ok", timestamp }` on all API routes
2. Structured request logging with `duration_ms`, `status_code`, `route` fields
3. APM trace spans on all database and external API calls
4. Browser RUM snippet (or Playwright scheduled runs as proxy for LCP)
5. Uptime monitor polling `/health` every 60 seconds
