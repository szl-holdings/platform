# SZL Holdings — Platform Maturity Scorecard

**Version:** 1.0  
**Date:** 2026-04-28  
**Source:** `docs/platform-inventory.md`, `docs/platform-gaps.md`, filesystem analysis  
**Audience:** Platform engineering team, technical leadership, investor technical diligence

> Scores use the DORA / CDF platform maturity rubric: **1** = ad hoc · **2** = defined · **3** = managed · **4** = optimized  
> Current scores reflect the state as of 2026-04-28 (Phase 1/2/12 baseline). Target scores are the Phase 5 goals.

---

## Per-Plane Maturity

| Plane | Current Score | Target Score | Key Gap |
|-------|--------------|-------------|---------|
| Developer Control | 1.5 | 4.0 | No catalog, no golden paths, no Score manifests |
| Integration & Delivery | 2.5 | 4.0 | CI strong; no GitOps, no canary, no Argo CD |
| Resource | 1.0 | 4.0 | Bicep drafted; no Azure resources deployed |
| Observability | 1.5 | 4.0 | OTel partial; no collector, no trace backend, no metrics |
| Security & Governance | 2.5 | 4.0 | Secret scanning active; no OPA, no workload identity |

### Overall Platform Maturity: **1.8 / 4.0**

---

## Rubric Definitions

| Score | Level | Meaning |
|-------|-------|---------|
| 1 | Ad Hoc | Inconsistent, manual, undocumented, reactive |
| 2 | Defined | Documented process, partially automated, some consistency |
| 3 | Managed | Consistently applied, automated gates, measurable |
| 4 | Optimized | Self-service, data-driven, continuously improved |

---

## Per-Service Maturity Matrix

### Artifacts (Product Surfaces)

| Service | Catalog | Health EP | OTel | Logging | Policy | Score | Auth | CI/CD | Overall |
|---------|---------|-----------|------|---------|--------|-------|------|-------|---------|
| api-server | ❌ | ✅ `/api/health` | 🟡 Partial | ✅ JSON | 🟡 Partial | ❌ | ✅ | ✅ | 2.3 |
| szl-holdings | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| command | ❌ | ❌ SPA | 🟡 OTel dep | ❌ | ❌ | ❌ | ✅ | ✅ | 1.4 |
| lyte-command-center | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| a11oy | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| vessels | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| terra | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| counsel | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| carlota-jo | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| sentra | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| pulse | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| conduit | ❌ | ❌ SPA | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 1.3 |
| szl-holdings-mobile | ❌ | ❌ Mobile | ❌ | ❌ | ❌ | ❌ | ✅ | 🟡 EAS | 1.3 |

### Apps

| Service | Catalog | Health EP | OTel | Logging | Policy | Score | Auth | CI/CD | Overall |
|---------|---------|-----------|------|---------|--------|-------|------|-------|---------|
| alloy-embedding-api | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| alloy-ingestion-orchestrator | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| alloy-runtime-api | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| substrate-inference | ❌ | ✅ `/v1/health` | ❌ | ❓ Python | ❌ | ❌ | 🟡 | ✅ | 1.4 |

### Services

| Service | Catalog | Health EP | OTel | Logging | Policy | Score | Auth | CI/CD | Overall |
|---------|---------|-----------|------|---------|--------|-------|------|-------|---------|
| alloy-fabric-api | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| alloy-fabric-ingest-control | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| lyte-metrics-store | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| substrate-mcp-gateway | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| substrate-py-workers | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| meridian_control_plane | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | ❌ | ✅ | 1.1 |
| meridian_forecast_lab | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | ❌ | ✅ | 1.1 |
| verticals | ❌ | ❓ Unknown | ❌ | ❓ | ❌ | ❌ | ❌ | ✅ | 1.1 |

### Workers

| Service | Catalog | Health EP | OTel | Logging | Policy | Score | Auth | CI/CD | Overall |
|---------|---------|-----------|------|---------|--------|-------|------|-------|---------|
| alloy-embed-worker | ❌ | N/A worker | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| alloy-rank-worker | ❌ | N/A worker | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| alloy-rerank-worker | ❌ | N/A worker | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| alloy-vector-worker | ❌ | N/A worker | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |
| substrate-python | ❌ | N/A worker | ❌ | ❓ | ❌ | ❌ | 🟡 | ✅ | 1.2 |

**Legend:** ✅ = present and working · 🟡 = partial/in progress · ❌ = absent · ❓ = unknown (needs verification)

---

## Per-Plane Scorecard Detail

### Plane 1 — Developer Control: **1.5 / 4.0**

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Service catalog | 1 | No Backstage, no catalog-info.yaml, no Score manifests |
| Golden-path templates | 1 | No plop/turbo-gen/Backstage templates; ad-hoc bootstrapping |
| Developer portal | 1 | No IDP; docs are in markdown files only |
| API contract consistency | 2 | OpenAPI spec exists (`lib/api-spec`); api-spec-drift CI check active |
| Dependency management | 3 | pnpm catalog, Dependabot, dependency-review all active |
| Code quality gates | 3 | Biome lint, TypeScript strict, Commitlint, CodeQL all active |
| Documentation | 2 | 172+ docs files; no enforced index; significant redundancy |

### Plane 2 — Integration & Delivery: **2.5 / 4.0**

| Dimension | Score | Evidence |
|-----------|-------|---------|
| CI pipeline | 3 | 25 workflows, all SHA-pinned, Turbo build graph, pnpm cache |
| Build reproducibility | 3 | Frozen lockfile in CI, pnpm catalog, tsconfig.base.json |
| Test automation | 2 | Unit tests exist; Playwright e2e exists; integration tests partial; no contract tests |
| Container build | 2 | container-publish.yml exists; no active ACR or image promotion |
| Release automation | 3 | release.yml; semantic versioning; CHANGELOG.md |
| GitOps / CD | 1 | No Argo CD; deploy-staging/production gates exist but no reconciliation |
| Canary/rollout | 1 | ROLLBACK_AND_CANARY_PLAN.md exists; not implemented |

### Plane 3 — Resource: **1.0 / 4.0**

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Azure Landing Zone | 1 | Bicep authored; not deployed; no Azure resources provisioned |
| IaC composites | 1 | No Crossplane, no XRDs |
| Environment provisioning | 1 | Manual; dev is Replit-managed only |
| Disaster recovery | 1 | Backup workflow (backup.yml) runs but uploads to nowhere confirmed |
| Cost management | 1 | No tagging, no budget alerts |

### Plane 4 — Observability: **1.5 / 4.0**

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Distributed tracing | 1 | OTel dep in api-server; no collector, no backend |
| Metrics collection | 1 | No Prometheus endpoints; lyte-metrics-store is custom-only |
| Structured logging | 2 | api-server: JSON logs; everything else: console.log or unknown |
| Alerting | 1 | alerting.bicep drafted; uptime-monitor.yml runs; no Azure Monitor |
| AI trace / cognitive OBS | 2 | packages/cognitive-observability exists; in-memory only (PLT-020) |
| DORA metrics | 1 | No collection |
| SLO tracking | 1 | SLOS_AND_ALERTS.md exists; not wired to any backend |

### Plane 5 — Security & Governance: **2.5 / 4.0**

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Secret management | 3 | Replit Secrets (dev); .env.example; gitleaks; CI secret scan |
| RBAC | 2 | Tenant-scope middleware; policy-engine packages; partial enforcement |
| Policy as code | 1 | policy-engine TypeScript packages; no OPA/Rego runtime |
| Workload identity | 1 | No Azure Managed Identity; no workload identity federation |
| Dependency security | 3 | Dependabot; dependency-review; CodeQL; gitleaks |
| Audit trail | 3 | lib/audit; IP hashing; 4 audit tables; proof chain primitives |
| Compliance readiness | 2 | GDPR/CCPA controls in place; SOC2 not validated |

---

## Maturity Targets by Phase

| Plane | Phase 3 Target | Phase 4 Target | Phase 5 Target |
|-------|---------------|---------------|---------------|
| Developer Control | 3.0 | 3.5 | 4.0 |
| Integration & Delivery | 3.0 | 3.5 | 4.0 |
| Resource | 1.5 | 2.0 | 3.5 |
| Observability | 2.0 | 3.5 | 4.0 |
| Security & Governance | 3.0 | 3.5 | 4.0 |

---

## Score Improvement Actions (Priority Order)

1. **Deploy Backstage** → Developer Control +1.5 (catalog, portal, golden paths)
2. **Wire OTel collector** → Observability +1.5 (traces, metrics, logs)
3. **Deploy Azure Landing Zone** → Resource +2.0 (database, Key Vault, Container Apps)
4. **Deploy OPA** → Security & Governance +0.5 (policy enforcement)
5. **Implement Argo CD** → Integration & Delivery +1.0 (GitOps)
6. **Add Score manifests** → Developer Control +0.5 (workload spec)
7. **Standardize health endpoints** → Observability +0.5 (all services)
8. **Enforce log schema** → Observability +0.5 (all services)
9. **Implement canary** → Integration & Delivery +0.5 (staged rollout)
10. **Add Azure Managed Identity** → Security & Governance +0.5 (workload identity)
