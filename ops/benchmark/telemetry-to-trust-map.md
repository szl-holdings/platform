# Telemetry-to-Trust Map

Generated: 2026-04-16
Phase: H — Observability & Release Control

---

## Purpose

This document maps raw telemetry signals to the operator/investor trust assertions they support. Every observable metric should answer a question that matters to someone who is reviewing or running this platform.

---

## Core Trust Assertions

### 1. "The platform is up and serving requests"

| Signal | Source | Assertion Strength |
|--------|--------|-------------------|
| `GET /api/health/live` → 200 | API health endpoint | Strong — direct liveness proof |
| `GET /api/health/ready` → 200 | Readiness endpoint | Strong — database connectivity confirmed |
| Error rate < 1% (5xx) | Telemetry middleware | Strong — functional confidence |
| Uptime duration in health response | `process.uptime()` | Moderate — no restart events |

---

### 2. "Authentication and authorization are working"

| Signal | Source | Assertion Strength |
|--------|--------|-------------------|
| Auth success rate > 95% | Auth route telemetry | Strong |
| Auth failure rate < 5% | Auth audit log | Strong |
| Rate-limit trip events | Rate limiter middleware | Strong — brute force detection |
| Session validation latency < 50ms | Request timing | Moderate |

---

### 3. "Data is protected and not leaking"

| Signal | Source | Assertion Strength |
|--------|--------|-------------------|
| No secrets in client bundle | `grep -r "sk-" dist/` at build | Strong — preventive |
| No PII in log output | Log audit | Strong |
| Encryption key present in env | Boot-time check | Strong |
| CORS headers on all responses | Helmet middleware | Moderate |
| Audit trail completeness | `lib/audit` entries | Moderate |

---

### 4. "AI features are functional and cost-controlled"

| Signal | Source | Assertion Strength |
|--------|--------|-------------------|
| AI response time < 10s | `genai-telemetry` spans | Strong |
| AI availability > 99% | AI route error rate | Strong |
| AI fallback rate < 5% | Fallback tracking in spans | Moderate |
| Provider-specific error counts | GenAI span status | Moderate |

---

### 5. "The platform handles load without degradation"

| Signal | Source | Assertion Strength |
|--------|--------|-------------------|
| API latency p95 < 500ms | Telemetry middleware | Strong |
| API latency p99 < 2000ms | Telemetry middleware | Strong |
| DB query latency < 100ms avg | pg instrumentation | Moderate |
| Active connections in range | DB pool monitor | Moderate |

---

### 6. "The codebase is safe to ship"

| Signal | Source | Assertion Strength |
|--------|--------|-------------------|
| CI gate passes (lint + typecheck + test + build) | `ci.yml` | Strong |
| No critical CVEs | `security.yml` dependency audit | Strong |
| CodeQL scan clean | `codeql.yml` | Strong |
| Dependency review passed | `dependency-review.yml` | Moderate |

---

### 7. "Releases are controlled and traceable"

| Signal | Source | Assertion Strength |
|--------|--------|-------------------|
| CHANGELOG.md entry exists | Manual + release.yml | Strong |
| Git tag matches SemVer | Release tagging | Strong |
| Smoke tests pass post-deploy | `ops/observability/post-deploy-smoke-tests.md` | Strong |
| Rollback criteria documented | Same doc | Moderate |

---

## Signal Priority for Investor Review

| Priority | Signal | Why It Matters |
|----------|--------|----------------|
| P0 | Health endpoint uptime | Proves platform runs |
| P0 | CI gate pass rate | Proves code quality discipline |
| P1 | Auth success rate | Proves security posture |
| P1 | AI response time | Proves AI features are real |
| P2 | API latency distribution | Proves performance |
| P2 | Error rate trends | Proves stability |
| P3 | Audit trail coverage | Proves compliance readiness |

---

## Gap Summary

| Trust Assertion | Current Gap | Action |
|----------------|-------------|--------|
| External trace validation | No OTEL exporter | Phase 2 — Honeycomb |
| Real-time metrics dashboard | No external sink | Phase 2 — Grafana/Prometheus |
| Uptime SLA with historical proof | No external monitor | Use UptimeRobot or BetterStack |
| AI cost tracking | No cost telemetry | Future — add spend tracking to GenAI spans |
