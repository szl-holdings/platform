# SZL Holdings — Dashboard Definitions

**Version:** 1.0 (Phase 8)
**Backend:** Azure Monitor / Grafana (to be deployed in Phase 5)

---

## Dashboard 1: Platform Overview

**Purpose:** Bird's-eye view of all SZL services for on-call SRE.

| Panel | Metric | Visualization |
|-------|--------|---------------|
| Service health map | `up{job="szl-services"}` | State timeline |
| Request rate (all services) | `sum(rate(szl_api_request_total[5m])) by (service)` | Time series |
| Error rate (all services) | `sum(rate(szl_api_error_total[5m])) / sum(rate(szl_api_request_total[5m]))` | Gauge + time series |
| P99 latency heatmap | `histogram_quantile(0.99, rate(szl_api_request_duration_seconds_bucket[5m]))` | Heatmap |
| DB pool utilization | `szl_db_connection_pool_active / szl_db_connection_pool_max * 100` | Gauge |
| Active Temporal workflows | `szl_temporal_workflow_running` by `workflow_type` | Bar chart |
| Policy blocks/min | `rate(szl_policy_evaluation_blocked_total[5m]) * 60` | Time series |
| Proof chain emission health | `rate(szl_proof_chain_emission_total{status="failed"}[5m])` | Alert badge |

---

## Dashboard 2: AI / Cognitive Quality

**Purpose:** AI decision quality monitoring for product owners and AI leads.

| Panel | Metric | Visualization |
|-------|--------|---------------|
| Decisions per domain | `sum(rate(szl_ai_decision_total[5m])) by (domain)` | Pie chart |
| Policy allow/block ratio | `szl_policy_evaluation_blocked_total / szl_policy_evaluation_total` | Gauge |
| Average quality score | `avg(szl_ai_decision_quality_score) by (domain)` | Gauge |
| Alloy embed latency P99 | `histogram_quantile(0.99, rate(szl_alloy_embed_request_duration_seconds_bucket[5m]))` | Time series |
| Proof chain coverage | `szl_proof_chain_emission_total{status="ok"} / szl_ai_decision_total * 100` | Gauge |
| AI trace count (in-memory) | `szl_cognitive_traces_in_memory` | Gauge + alert if > 10k |

---

## Dashboard 3: Governance & Audit

**Purpose:** Compliance and audit trail health for Aegis trust surface.

| Panel | Metric | Visualization |
|-------|--------|---------------|
| OPA evaluations/min | `rate(szl_policy_evaluation_total[5m]) * 60` | Time series |
| Policy blocks by rule | `rate(szl_policy_evaluation_blocked_total[5m]) by (policy_id)` | Bar chart |
| Approval workflow SLA | `histogram_quantile(0.99, szl_approval_workflow_duration_seconds_bucket)` | Gauge |
| Change window violations | `szl_change_window_violation_total` | Counter |
| Secret scan failures | (GitHub Actions — external signal) | Link badge |
| Evidence ledger entries/day | `increase(szl_evidence_ledger_entries_total[24h])` | Stat |

---

## Dashboard 4: Per-Service Detail

**Purpose:** Per-service deep-dive for on-call engineers.

Template variables: `$service`, `$env`

| Panel | Query | Notes |
|-------|-------|-------|
| Request rate | `rate(szl_api_request_total{service="$service", env="$env"}[5m])` | |
| Error breakdown | `rate(szl_api_error_total{service="$service"}[5m]) by (error_code)` | |
| P50/P95/P99 latency | `histogram_quantile(0.Xn, ...)` | |
| Top slow routes | `topk(10, histogram_quantile(0.99, rate(szl_api_route_duration_seconds_bucket{service="$service"}[5m])) by (http_route))` | |
| DB pool | `szl_db_connection_pool_active{service="$service"}` | |
| Active spans | Trace explorer: `service.name="$service"` | Link to Azure Monitor Traces |

---

## Grafana Dashboard JSON Location

Dashboard JSON definitions (Grafana format) will be placed at:
```
observability/dashboards/grafana/
├── platform-overview.json
├── ai-cognitive-quality.json
├── governance-audit.json
└── per-service-detail.json
```

Azure Monitor workbook definitions (ARM/Bicep) will be placed at:
```
infra/modules/workbooks/
├── platform-overview.bicep
└── governance-audit.bicep
```

Phase 5 delivery: deploy the above to the Azure Monitor workspace.
