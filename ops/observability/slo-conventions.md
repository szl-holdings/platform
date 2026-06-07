# SZL Holdings — SLO Conventions

**Version:** 1.0 (Phase 8)
**Authority:** Platform Engineering

---

## SLO Structure

Every production service must have a documented SLO covering the four golden signals.

### Template

```yaml
# slo.yaml — place alongside catalog-info.yaml in every service
apiVersion: szl.io/v1
kind: ServiceLevelObjective
metadata:
  name: <service-slug>-slo
  annotations:
    szl.io/owner: "<team>"
    szl.io/domain: "<domain>"
spec:
  service: "<service-name>"               # matches package.json name
  version: "1.0"
  environment: production
  window: 30d

  objectives:

    availability:
      description: "Percentage of requests returning non-5xx responses"
      target: 99.5
      metric: "1 - (rate(szl_<domain>_error_total[5m]) / rate(szl_<domain>_request_total[5m]))"
      breachAlertMinutes: 5
      errorBudgetBurnRate: 5x              # alert when burning 5x faster than budget allows

    latency:
      description: "P99 request latency below 2 seconds"
      target: 99.0                         # 99% of requests under threshold
      threshold_ms: 2000
      metric: "histogram_quantile(0.99, rate(szl_<domain>_request_duration_seconds_bucket[5m]))"
      breachAlertMinutes: 5

    throughput:
      description: "No sustained drop in request rate"
      target: 99.0
      minimumRpm: 10                       # minimum expected requests-per-minute; tune per service
      metric: "rate(szl_<domain>_request_total[5m]) * 60"

    saturation:
      description: "DB connection pool utilization below 80%"
      target: 95.0                         # 95% of time below 80% pool utilization
      threshold_percent: 80
      metric: "szl_db_connection_pool_active / szl_db_connection_pool_max * 100"

  dependsOn:
    - service: "api-server"               # upstream dependencies; breach cascades alert
    - service: "alloy-runtime-api"
```

---

## Standard SLO Targets by Tier

| Tier | Service Examples | Availability | P99 Latency | Error Rate |
|------|-----------------|:---:|:---:|:---:|
| Tier 0 — Platform critical | api-server, alloy-runtime-api | 99.9% | < 500ms | < 0.1% |
| Tier 1 — Core features | domain-pack APIs, lyte-metrics-store | 99.5% | < 2s | < 0.5% |
| Tier 2 — Non-critical | ingestion workers, batch jobs | 99.0% | < 10s | < 1% |
| Tier 3 — Internal tooling | Backstage, dev portal | 95.0% | < 5s | < 5% |

---

## Error Budget Policy

| Budget Consumed | Action |
|-----------------|--------|
| 0–50% | Operate normally |
| 50–75% | Review error sources; block non-essential feature work |
| 75–90% | Freeze feature deployments; focus on reliability |
| 90–100% | Incident declared; all hands on reliability |
| >100% (exhausted) | Mandatory post-mortem; change freeze until budget resets |

---

## SLO Files Location Convention

```
<service-root>/
├── catalog-info.yaml          # Backstage component
├── score.yaml                 # Score workload spec
├── slo.yaml                   # SLO definition (this format)
└── docs/runbook.md            # Linked from catalog-info.yaml
```

---

## Service Maturity Scoring Rubric

Each service is scored 0–4 across five dimensions. The total score (0–20) maps to a maturity level.

| # | Dimension | 0 | 1 | 2 | 3 | 4 |
|---|-----------|---|---|---|---|---|
| 1 | **Health** | No endpoint | `/health` exists | `/ready` exists | Both return structured JSON per spec | Both wired to Backstage catalog |
| 2 | **Traces** | No tracing | OTel SDK imported | Spans emitted | W3C propagation working | Traces visible in collector |
| 3 | **Metrics** | No metrics | RED counters defined | `/metrics` endpoint | Scraped by collector | Alert rules defined |
| 4 | **Logs** | Unstructured | Structured JSON | All required fields present | No PII leakage | Log retention enforced |
| 5 | **SLO** | Not defined | Draft SLO | SLO in `slo.yaml` | Error budget tracked | Budget policy enforced |

**Maturity Level:**
- 0–8: **Level 1 — Baseline** (unsafe for production)
- 9–12: **Level 2 — Observable** (production-eligible with gaps)
- 13–16: **Level 3 — Managed** (full SLO coverage)
- 17–20: **Level 4 — Optimised** (error budget automation active)

### Current Service Maturity Scores (Phase 8 Assessment)

| Service | Health | Traces | Metrics | Logs | SLO | Total | Level |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| api-server | 3 | 2 | 0 | 2 | 0 | 7 | L1 |
| substrate-inference | 2 | 0 | 0 | 1 | 0 | 3 | L1 |
| alloy-embedding-api | 1 | 0 | 0 | 0 | 0 | 1 | L1 |
| alloy-runtime-api | 1 | 0 | 0 | 0 | 0 | 1 | L1 |
| alloy-ingestion-orchestrator | 1 | 0 | 0 | 0 | 0 | 1 | L1 |
| alloy-fabric-api | 0 | 0 | 0 | 0 | 0 | 0 | L1 |
| lyte-metrics-store | 0 | 0 | 0 | 0 | 0 | 0 | L1 |
| substrate-mcp-gateway | 0 | 0 | 0 | 0 | 0 | 0 | L1 |

**Target Phase 8 close:** api-server at Level 2 (score ≥ 9). All others documented.

**Target Phase 9 target:** All Tier 0/1 services at Level 2+. SLO files in place.
