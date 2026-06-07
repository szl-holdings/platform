# Golden Signals — SZL Holdings Platform

**Version:** 1.0
**Date:** April 16, 2026

The Four Golden Signals (Latency, Traffic, Errors, Saturation) applied across each platform surface. These are the primary signals that on-call engineers monitor and that alert rules are built from.

---

## Signal Definitions

| Signal | Definition | Measure When |
|--------|-----------|-------------|
| **Latency** | Time to serve a request | Always — split by success/error |
| **Traffic** | Request rate | Always — split by domain |
| **Errors** | Rate of failed requests | Always — distinguish 4xx from 5xx |
| **Saturation** | System resource headroom | Always — CPU, DB connections, memory |

---

## 1. API Server (Backend)

### Latency

| Metric | Target (p50) | Target (p95) | Target (p99) | Alert Threshold |
|--------|------------|------------|------------|----------------|
| All authenticated API routes | < 100ms | < 500ms | < 1s | p95 > 1s for 5 min |
| Health endpoints (`/api/health`) | < 50ms | < 200ms | < 500ms | p95 > 500ms |
| AI inference routes | < 2s | < 8s | < 15s | p95 > 15s for 5 min |
| Database queries | < 20ms | < 100ms | < 500ms | p95 > 500ms for 3 min |
| Workflow submission | < 500ms | < 2s | < 5s | p95 > 5s |

### Traffic

| Signal | Normal Range | Alert Threshold |
|--------|------------|----------------|
| Requests per minute (all routes) | 10–500 rpm | > 2000 rpm (load spike) |
| AI inference calls per minute | 1–50 rpm | > 200 rpm (cost alert) |
| Webhook events per minute | 0–20 rpm | > 100 rpm |
| Auth events per minute | 1–50 rpm | > 500 rpm (credential stuffing alert) |

### Errors

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| HTTP 5xx error rate | < 0.1% | > 1% for 5 min → Sev 1 |
| HTTP 5xx error rate | < 0.1% | > 5% for 2 min → Sev 0 |
| Auth failure rate | < 2% | > 10% for 5 min → Sev 0 |
| DB error rate | < 0.01% | > 1% for 3 min → Sev 0 |
| AI inference error rate | < 1% | > 10% for 5 min → Sev 1 |

### Saturation

| Resource | Target | Alert Threshold |
|----------|--------|----------------|
| DB connection pool utilization | < 50% | > 80% for 5 min |
| Memory usage | < 70% | > 90% for 5 min |
| CPU usage | < 60% | > 85% for 5 min |
| Open file descriptors | < 50% | > 80% |

---

## 2. Domain Pack Surfaces

Each domain pack (Aegis, Terra, Vessels, Forge, PRISM, Command, CORTEX) has its own golden signals derived from the shared API metrics with `domain` label filtering.

### Vessels Maritime

| Signal | Target | Alert |
|--------|--------|-------|
| Fleet position update latency | < 1s | > 5s → Sev 1 |
| Voyage P&L calculation time | < 500ms | > 3s → Sev 2 |
| AIS feed ingestion lag | < 30s | > 5 min → Sev 1 |

### Terra Real Estate

| Signal | Target | Alert |
|--------|--------|-------|
| Property intelligence fetch | < 300ms | > 2s → Sev 2 |
| Distress signal detection latency | < 5s | > 30s → Sev 1 |
| Market data feed freshness | < 1 hour | > 6 hours → Sev 2 |

### Aegis Defense

| Signal | Target | Alert |
|--------|--------|-------|
| Threat alert generation | < 2s | > 10s → Sev 1 |
| OSINT feed ingestion | < 5 min | > 1 hour → Sev 1 |
| Incident status update propagation | < 1s | > 5s → Sev 2 |

### Forge AI Platform

| Signal | Target | Alert |
|--------|--------|-------|
| AI inference (Alloy chat) | < 3s first token | > 10s → Sev 1 |
| Model arena evaluation job | < 60s | > 5 min → Sev 2 |
| Agent run queue depth | < 10 pending | > 50 pending → Sev 1 |

---

## 3. Frontend / Web Apps

Web Vitals measured via `ClientTelemetryCollector`:

| Metric | Target | Alert |
|--------|--------|-------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4s (Sev 3) |
| INP (Interaction to Next Paint) | < 200ms | > 500ms (Sev 3) |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 (Sev 3) |
| FCP (First Contentful Paint) | < 1.8s | > 3s (Sev 3) |
| TTFB (Time to First Byte) | < 600ms | > 1.8s (Sev 2) |

---

## 4. Authentication

| Signal | Target | Alert |
|--------|--------|-------|
| Login success rate | > 98% | < 90% for 5 min → Sev 0 |
| Session creation latency | < 200ms | > 1s → Sev 1 |
| Token validation latency | < 10ms | > 100ms → Sev 1 |
| Failed auth attempts per IP | < 10/min | > 50/min → Sev 0 (block) |

---

## 5. Health Endpoint SLOs

The `/api/health/ready` endpoint must reflect actual system state:

| Check | Healthy State | Degraded State |
|-------|--------------|---------------|
| Database | Query executes < 100ms | Timeout or connection failure |
| Auth configuration | `SESSION_SECRET` present | Missing → returns `degraded` |
| Storage | Bucket accessible | Unreachable → `degraded` |
| AI provider | API key present | Missing → `mock` mode flagged |
| Backup | Last backup < 25 hours | > 25 hours → warning |

Health endpoint must NOT return `status: ok` when the database is actually unreachable. This is a Sev 1 failure.

---

## 6. SLO Summary Table

| Service | Availability SLO | Latency SLO | Error Rate SLO |
|---------|----------------|-------------|---------------|
| API Server (all routes) | 99.9% | p95 < 1s | < 1% 5xx |
| Health endpoints | 99.99% | p95 < 200ms | 0% 5xx |
| AI inference | 99.5% | p95 < 15s | < 5% |
| Database | 99.9% | p95 < 500ms | < 0.1% |
| Frontend apps | 99.5% | LCP < 2.5s | < 0.5% JS errors |
| Auth flow | 99.95% | p95 < 1s | < 0.5% |

---

## 7. Saturation Pre-Alerts (Capacity Planning)

These are warnings before hard limits are hit:

| Resource | Warning | Critical |
|----------|---------|---------|
| DB connection pool | > 60% | > 80% |
| API server memory | > 75% | > 90% |
| Disk (logs + backups) | > 70% | > 85% |
| AI token budget | > 70% of monthly limit | > 90% |
