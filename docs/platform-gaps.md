# SZL Holdings — Platform Gaps (Top 25)

**Version:** 1.0  
**Date:** 2026-04-28  
**Source:** `docs/platform-inventory.md` + filesystem analysis  
**Audience:** Platform engineering team, technical leadership

> Severity: **CRITICAL** = blocks production safety or blocks next phase · **HIGH** = significant risk or compliance gap · **MEDIUM** = quality/efficiency gap · **LOW** = improvement opportunity

---

## Gap Register

| # | Gap ID | Title | Severity | Plane(s) | Phase |
|---|--------|-------|----------|----------|-------|
| 1 | PLT-001 | No software catalog — Backstage or equivalent | CRITICAL | Developer Control | Phase 3 (next) |
| 2 | PLT-002 | No unified OTel collector or trace backend | CRITICAL | Observability | Phase 4 |
| 3 | PLT-003 | Azure production environment not deployed | CRITICAL | Resource | Phase 5 |
| 4 | PLT-004 | No OPA / policy-as-code enforcement at runtime | CRITICAL | Security & Governance | Phase 4 |
| 5 | PLT-005 | Node.js version skew (Node 22 CI vs Node 24 dev) | HIGH | Developer Control / Delivery | Phase 3 |
| 6 | PLT-006 | No structured logging standard enforced across all surfaces | HIGH | Observability | Phase 4 |
| 7 | PLT-007 | Health endpoints absent or undocumented on 10+ services | HIGH | Observability / Developer Control | Phase 3 |
| 8 | PLT-008 | No golden-path scaffolding for new domains, agents, or UIs | HIGH | Developer Control | Phase 3 |
| 9 | PLT-009 | lib/ontology duplicates packages/ontology (split ownership) | HIGH | Developer Control | Phase 3 |
| 10 | PLT-010 | No workload identity or secrets rotation pipeline for production | HIGH | Security & Governance | Phase 5 |
| 11 | PLT-011 | No distributed tracing (Tempo / Jaeger / Azure Monitor) | HIGH | Observability | Phase 4 |
| 12 | PLT-012 | No Argo CD or GitOps delivery pipeline | HIGH | Integration & Delivery | Phase 5 |
| 13 | PLT-013 | No Crossplane or IaC composites for self-service infra | HIGH | Resource | Phase 5 |
| 14 | PLT-014 | API error envelope not consistently applied (80+ routes remaining) | HIGH | Developer Control / Delivery | Phase 3 |
| 15 | PLT-015 | No platform-wide metrics scrape target (no Prometheus / OTEL metrics) | HIGH | Observability | Phase 4 |
| 16 | PLT-016 | Archived artifact dirs (firestorm, imperium, prism-counsel) still on disk with live API routes | MEDIUM | Developer Control | Phase 3 |
| 17 | PLT-017 | No Score workload maturity scoring integration | MEDIUM | Developer Control | Phase 3 |
| 18 | PLT-018 | No per-artifact or per-service DORA metric collection | MEDIUM | Observability | Phase 4 |
| 19 | PLT-019 | No centralized dependency policy enforcement (beyond Dependabot) | MEDIUM | Security & Governance / Delivery | Phase 4 |
| 20 | PLT-020 | AI trace data not persisted across server restarts (in-memory only) | MEDIUM | Observability | Phase 3 |
| 21 | PLT-021 | Mobile (Expo) credential rotation process documented but not automated | MEDIUM | Security & Governance | Phase 4 |
| 22 | PLT-022 | Large stale assets in git history (zip files, screenshots not gitignored) | MEDIUM | Developer Control | Phase 3 (hygiene) |
| 23 | PLT-023 | No staged rollout / canary strategy for API server updates | MEDIUM | Integration & Delivery | Phase 5 |
| 24 | PLT-024 | docs/ directory has 172+ files with significant redundancy and no index enforcement | LOW | Developer Control | Phase 6 |
| 25 | PLT-025 | No cross-service contract testing (consumer-driven contracts) | LOW | Developer Control / Delivery | Phase 4 |

---

## Detailed Gap Descriptions

### PLT-001 — No software catalog (Backstage or equivalent)
**Severity:** CRITICAL | **Plane:** Developer Control  
**Description:** There is no machine-readable service catalog. No Backstage instance, no Score integration, no `catalog-info.yaml` files. Engineers cannot discover what owns what, what depends on what, or what the current health of any service is. This is the top prerequisite for all subsequent Developer Control Plane work.  
**Remediation Phase:** Phase 3 — Developer Control Plane (Backstage + Score + golden-path templates).  
**Affected Entities:** All 103 packages, 15 artifacts, 8 services, 4 apps, 5 workers.

### PLT-002 — No unified OTel collector or trace backend
**Severity:** CRITICAL | **Plane:** Observability  
**Description:** `packages/otel` and `packages/observability-core` exist and are partially wired into api-server. However, there is no configured OTLP exporter endpoint in Replit dev, no Collector deployment, and no backend (Tempo/Jaeger/Azure Monitor) receiving spans. Traces are generated but not stored or queryable.  
**Remediation Phase:** Phase 4 — OpenTelemetry baseline.  
**Affected Entities:** api-server, all alloy apps, all services.

### PLT-003 — Azure production environment not deployed
**Severity:** CRITICAL | **Plane:** Resource  
**Description:** All Bicep modules are authored and parameterized (PostgreSQL Flexible Server, Container Apps, Front Door, Key Vault, Redis, Service Bus, Blob Storage, ACR) but no Azure resources have been provisioned. The platform currently runs entirely in Replit dev. No production environment exists.  
**Remediation Phase:** Phase 5 — Resource & Delivery Plane (Crossplane composites + Argo + Azure Landing Zone).  
**Affected Entities:** `infra/` — all Bicep modules.

### PLT-004 — No OPA / policy-as-code enforcement at runtime
**Severity:** CRITICAL | **Plane:** Security & Governance  
**Description:** `packages/policy-engine`, `packages/policy-guard`, and `packages/aef-policy-guard` exist as TypeScript packages. However, there is no Open Policy Agent (OPA) deployment, no Rego policy bundles, and no runtime enforcement point (admission controller or sidecar). Policy is code but not enforced infrastructure-wide.  
**Remediation Phase:** Phase 4 — Operability & Governance (OPA policy layer).  
**Affected Entities:** All services, all artifacts, infra admission.

### PLT-005 — Node.js version skew
**Severity:** HIGH | **Plane:** Developer Control / Delivery  
**Description:** CI and Dockerfiles target Node 22 LTS. The Replit dev environment runs Node 24 (platform-managed, cannot be overridden). `.node-version` and `.nvmrc` specify `22`. This creates a reproducibility gap. Node 24 is API-compatible with Node 22 but native module builds may differ.  
**Remediation Phase:** Phase 3 — document and enforce; investigate Replit NVM override or pin Nix channel to Node 22.  
**Affected Entities:** All TypeScript packages and services.

### PLT-006 — No structured logging standard enforced across all surfaces
**Severity:** HIGH | **Plane:** Observability  
**Description:** api-server emits structured JSON logs. The 14 web SPA artifacts emit unstructured `console.log`. Python services have no logging standard. Workers have no confirmed log schema. `packages/telemetry-standards` exists but adoption is partial.  
**Remediation Phase:** Phase 4 — enforce via `packages/telemetry-standards` and OTel instrumentation.  
**Affected Entities:** All frontend SPAs, all Python services/workers, alloy apps.

### PLT-007 — Health endpoints absent or undocumented on 10+ services
**Severity:** HIGH | **Plane:** Observability / Developer Control  
**Description:** api-server has `/api/health`. substrate-inference has `/v1/health`. 10+ services (alloy-fabric-api, alloy-fabric-ingest-control, lyte-metrics-store, substrate-mcp-gateway, all workers, apps/alloy-*) have no confirmed or documented health endpoint. Backstage and the delivery plane require machine-readable health signals.  
**Remediation Phase:** Phase 3 — standardize in golden-path template; document in inventory.  
**Affected Entities:** `services/alloy-fabric-api`, `services/alloy-fabric-ingest-control`, `services/lyte-metrics-store`, `services/substrate-mcp-gateway`, `workers/*`, `apps/alloy-*`.

### PLT-008 — No golden-path scaffolding for new domain, agent, or UI
**Severity:** HIGH | **Plane:** Developer Control  
**Description:** There is no `plop`, `turbo gen`, or Backstage software template for creating a new domain API, a new agent worker, or a new domain UI. Each new surface has been bootstrapped ad-hoc, resulting in inconsistent tsconfig, env loading, health endpoint, and logging patterns.  
**Remediation Phase:** Phase 3 — three golden paths defined in `docs/golden-paths.md`; implemented in Developer Control Plane task.  
**Affected Entities:** All future new domain packs and agents.

### PLT-009 — lib/ontology duplicates packages/ontology
**Severity:** HIGH | **Plane:** Developer Control  
**Description:** `lib/ontology` (`@szl-holdings/ontology`, 3 consumers) and `packages/ontology` (`@workspace/ontology`, 36 consumers) serve the same purpose. The `packages/` version is canonical. The `lib/` version is a legacy artifact. Tracked in `CONSOLIDATION_DECISIONS.md` but not yet resolved.  
**Remediation Phase:** Phase 3 — migrate the 3 consumers of `lib/ontology` to `packages/ontology`; archive `lib/ontology`.  
**Affected Entities:** `lib/ontology`, 3 consuming packages.

### PLT-010 — No workload identity or secrets rotation pipeline for production
**Severity:** HIGH | **Plane:** Security & Governance  
**Description:** Azure Key Vault is in the Bicep plan but not deployed. There is no Azure Managed Identity, no workload identity federation, no automated secrets rotation. Production will require Entra ID managed identities for all Container Apps. Currently secrets are delivered via Replit Secrets (dev) with no rotation automation.  
**Remediation Phase:** Phase 5 — Azure Landing Zone + Key Vault deployment.  
**Affected Entities:** All secrets-consuming services.

### PLT-011 — No distributed tracing backend
**Severity:** HIGH | **Plane:** Observability  
**Description:** OTel spans are instrumented in api-server (`@opentelemetry/exporter-trace-otlp-http` is a dependency) but the exporter endpoint is not configured for any collector. No Tempo, Jaeger, Zipkin, or Azure Monitor Application Insights receives spans. Traces are generated and discarded.  
**Remediation Phase:** Phase 4 — configure OTLP exporter → Azure Monitor or self-hosted Grafana stack.  
**Affected Entities:** api-server, command (has OTel client dep), alloy apps.

### PLT-012 — No Argo CD or GitOps delivery pipeline
**Severity:** HIGH | **Plane:** Integration & Delivery  
**Description:** GitHub Actions workflows exist for build, test, and deploy-staging/deploy-production gates. However, there is no Argo CD app-of-apps, no GitOps reconciliation loop, and no declarative desired-state delivery for the target Azure Container Apps environment. GitHub Actions are CI gates, not continuous delivery.  
**Remediation Phase:** Phase 5 — Resource & Delivery Plane.  
**Affected Entities:** `.github/workflows/deploy-*.yml`, `infra/`.

### PLT-013 — No Crossplane or IaC composites for self-service infra
**Severity:** HIGH | **Plane:** Resource  
**Description:** Infrastructure is defined in Bicep but there is no Crossplane XRD, no Composite Resource Definition, and no self-service mechanism for developers to provision environments or infrastructure components. Every environment requires manual Bicep deployment.  
**Remediation Phase:** Phase 5 — Crossplane composites alongside Argo CD.  
**Affected Entities:** `infra/`, all services needing environment provisioning.

### PLT-014 — API error envelope inconsistency
**Severity:** HIGH | **Plane:** Developer Control / Delivery  
**Description:** The canonical `{ error: string, code: string, details?: object }` error envelope is not consistently returned across all 357 api-server route files. ~80 routes still return ad-hoc error shapes. This is a documented gap (see existing task: "Complete API error envelope migration across 80+ remaining route files").  
**Remediation Phase:** Phase 3 — ongoing; this is an active task.  
**Affected Entities:** `artifacts/api-server/src/routes/` — ~80 files.

### PLT-015 — No platform-wide metrics scrape target
**Severity:** HIGH | **Plane:** Observability  
**Description:** No `/metrics` Prometheus endpoint is exposed by any service. `packages/observability-core` and `packages/otel` provide instrumentation primitives but no metric export pipeline. `services/lyte-metrics-store` is a custom persistence layer, not a Prometheus-compatible target.  
**Remediation Phase:** Phase 4 — add `prom-client` or OTel metric export; configure scrape.  
**Affected Entities:** api-server, all services.

### PLT-016 — Archived artifact dirs with live API routes
**Severity:** MEDIUM | **Plane:** Developer Control  
**Description:** `artifacts/firestorm/`, `artifacts/imperium/`, and `artifacts/prism-counsel/` are not registered as artifacts but their corresponding API routes remain active in api-server (`routes/guardian.ts` 3,973 LOC; Counsel routes). This creates confusion: are these services still supported?  
**Remediation Phase:** Phase 3 — triage; either re-register as internal tools or deprecate routes.  
**Affected Entities:** `artifacts/firestorm/`, `artifacts/prism-counsel/`, corresponding api-server routes.

### PLT-017 — No Score workload maturity scoring
**Severity:** MEDIUM | **Plane:** Developer Control  
**Description:** No `score.yaml` or Score manifest exists for any workload. Score (the CNCF workload spec) is planned for the Developer Control Plane but not yet implemented. Without it, platform maturity cannot be programmatically measured per workload.  
**Remediation Phase:** Phase 3 — Developer Control Plane task.  
**Affected Entities:** All workloads.

### PLT-018 — No DORA metric collection
**Severity:** MEDIUM | **Plane:** Observability  
**Description:** No tooling collects Deployment Frequency, Lead Time for Changes, Change Failure Rate, or Mean Time to Recovery per service. These are expected inputs for the Lyte intelligence layer.  
**Remediation Phase:** Phase 4 — integrate with GitHub Actions event data + deployment tracking.  
**Affected Entities:** All artifacts and services.

### PLT-019 — No centralized dependency policy enforcement
**Severity:** MEDIUM | **Plane:** Security & Governance / Delivery  
**Description:** Dependabot is configured and dependency-review workflow is active. However, there is no internal `DEPENDENCY_POLICY.md` enforcement in CI (e.g., license allowlists, banned packages, vulnerability severity gates). The `docs/DEPENDENCY_POLICY.md` document exists but CI does not enforce it automatically.  
**Remediation Phase:** Phase 4 — wire policy to `dependency-review.yml`.  
**Affected Entities:** All packages; `.github/workflows/dependency-review.yml`.

### PLT-020 — AI trace data in-memory only
**Severity:** MEDIUM | **Plane:** Observability  
**Description:** AI decision traces (cognitive-observability layer) are held in-memory in the api-server process and lost on restart. This is a documented open task. No persistence layer is wired.  
**Remediation Phase:** Phase 3 — active task: "Persist AI trace data to the database so it survives server restarts".  
**Affected Entities:** `packages/cognitive-observability`, api-server AI trace routes.

### PLT-021 — Mobile credential rotation not automated
**Severity:** MEDIUM | **Plane:** Security & Governance  
**Description:** `CREDENTIAL_ROTATION.md` provides a manual runbook for Firebase and Google Play credential rotation (resolved KG001). However, there is no automated pipeline that detects expiry, rotates, and re-deploys EAS secrets. Rotation requires manual operator steps.  
**Remediation Phase:** Phase 4 — automate via GitHub Actions + EAS CLI.  
**Affected Entities:** `artifacts/szl-holdings-mobile`, EAS secrets.

### PLT-022 — Large stale assets tracked in git
**Severity:** MEDIUM | **Plane:** Developer Control  
**Description:** Several large files are tracked in git: `LINKEDIN-LAUNCH.zip` (12.5 MB), `X-LAUNCH-SERIES.zip` (1.4 MB), `SZL-Standby-Content-Calendar.docx` (385 KB), multiple `.zip` files at root. These inflate clone time and are not needed for development.  
**Remediation Phase:** Phase 3 (hygiene) — document and add to `.gitignore`; cannot rewrite history per brief constraints.  
**Affected Entities:** Root-level zip/docx files; `screenshots/`; `launch-shots/`.

### PLT-023 — No canary/staged rollout strategy
**Severity:** MEDIUM | **Plane:** Integration & Delivery  
**Description:** `ROLLBACK_AND_CANARY_PLAN.md` exists in docs but there is no implemented canary strategy (Azure Front Door weight-based routing, feature flags) for api-server or any artifact. All deployments are all-or-nothing.  
**Remediation Phase:** Phase 5 — implement via Azure Front Door traffic splitting.  
**Affected Entities:** api-server, all production-deployed artifacts.

### PLT-024 — docs/ directory redundancy and lack of index enforcement
**Severity:** LOW | **Plane:** Developer Control  
**Description:** 172+ markdown files in `docs/` with overlapping content, no machine-enforced canonical index, and no dead-link detection beyond the `readme-qa.yml` workflow. The `docs/INDEX.md` exists but is manually maintained.  
**Remediation Phase:** Phase 6 — doc consolidation sprint; enforce via CI link checker.  
**Affected Entities:** `docs/` — all 172 files.

### PLT-025 — No cross-service contract testing
**Severity:** LOW | **Plane:** Developer Control / Delivery  
**Description:** `packages/contracts` and `packages/shared-contracts` define cross-service types but there is no consumer-driven contract test (Pact or equivalent). API schema drift between api-server and frontend clients is detected only by the `api-spec-drift.yml` workflow against the OpenAPI spec, not by runtime contract tests.  
**Remediation Phase:** Phase 4 — introduce Pact or OpenAPI contract tests in CI.  
**Affected Entities:** api-server, all frontend clients using `@szl-holdings/api-client-react`.
