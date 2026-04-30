# SZL Holdings — 5-Plane Reference Architecture

**Version:** 1.0  
**Date:** 2026-04-28  
**Status:** Target state — this is where the platform is going. Current state gaps are captured in `docs/platform-gaps.md`.  
**Audience:** Platform engineers, architects, technical leadership

---

## Architecture Thesis

SZL Holdings is a **governed decision infrastructure platform**. Every signal that enters any domain surfaces through a shared nine-step loop:

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

Nothing is opaque. Nothing executes without attribution. The platform engineering target organizes all substrate around five planes that make this loop reliable, observable, secure, and developer-accessible at scale.

---

## The Five Planes

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  PLANE 1 — DEVELOPER CONTROL                                                  │
│  Backstage catalog · Score workload spec · Golden-path templates · Dev portal  │
├────────────────────────────────────────────────────────────────────────────────┤
│  PLANE 2 — INTEGRATION & DELIVERY                                             │
│  GitHub Actions CI · Turbo build graph · Container Registry · Semantic Release │
├────────────────────────────────────────────────────────────────────────────────┤
│  PLANE 3 — RESOURCE                                                           │
│  Crossplane composites · Argo CD app-of-apps · Azure Landing Zone             │
├────────────────────────────────────────────────────────────────────────────────┤
│  PLANE 4 — OBSERVABILITY                                                      │
│  OpenTelemetry collector · Lyte intelligence layer · Metrics · Alerting        │
├────────────────────────────────────────────────────────────────────────────────┤
│  PLANE 5 — SECURITY & GOVERNANCE                                              │
│  Aegis trust layer · OPA policy · Secret management · RBAC · Audit chain      │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Plane 1 — Developer Control

**Purpose:** Give every engineer a single pane of glass for discovering, scaffolding, and owning services.

### Current State (2026-04-28)
- 103 packages, 14 artifacts, 8 services, 4 apps, 5 workers — no machine-readable catalog
- No Backstage instance, no Score manifests, no `catalog-info.yaml` files
- No golden-path templates; each new surface bootstrapped ad hoc

### Target State
| Component | Target Location | Description |
|-----------|----------------|-------------|
| Backstage IDP | `/platform/backstage/` | Self-hosted Backstage; catalog, TechDocs, software templates |
| Backstage catalog | `catalog-info.yaml` in every package/service | Component, API, Resource, System, Domain kinds |
| Score manifests | `score.yaml` in every workload | Workload-agnostic spec; translated to Helm/Compose by Humctl |
| Golden-path templates | `/platform/backstage/templates/` | `new-domain-api`, `new-agent-worker`, `new-domain-ui` |
| Dev portal | Backstage frontend | Single entry point for all developer workflows |

### Folder → Plane Mapping

| Current Path | Plane Role | Target Path | What Changes |
|-------------|-----------|-------------|--------------|
| `artifacts/` (15 dirs) | Product surfaces — **product-specific** | Stay in `artifacts/` | Add `catalog-info.yaml` to each |
| `packages/` (103 dirs) | Shared substrate — **shared substrate** | Stay in `packages/`; catalog each | Add `catalog-info.yaml` |
| `lib/` (40 dirs) | Shared libraries — **shared substrate** | Consolidate duplicates into `packages/`; remainder stays in `lib/` | Resolve duplicates (PLT-009) |
| `apps/` (4 dirs) | Backend apps — **shared substrate** | Stay in `apps/`; add Score manifests | Health endpoints, Score, catalog |
| `services/` (8 dirs) | Platform services — **shared substrate** | Stay in `services/`; add Score manifests | Health endpoints, Score, catalog |
| `workers/` (5 dirs) | Async workers — **shared substrate** | Stay in `workers/`; add Score manifests | Health endpoints, Score, catalog |
| `/platform/backstage/` | Developer Control Plane | **New in Phase 3** | Backstage app |
| `docs/` | TechDocs content | Linked from Backstage | No move; TechDocs plugin reads in-place |

### What Stays Product-Specific
- All `artifacts/` branding, domain logic, domain-specific UI components
- Domain pack business rules (vessels, terra, counsel, carlota-jo, sentra, conduit)
- Mobile-specific Expo configuration

### What Becomes Shared Substrate
- `packages/env` — canonical env contract (all services must use this)
- `packages/observability-core` + `packages/otel` — all services instrument from here
- `packages/auth-shared` — all auth primitives
- `packages/policy-engine` / `packages/policy-guard` — all policy enforcement
- `packages/telemetry-standards` — all log schemas
- Golden-path templates — source of truth for how to start any new workload

### What Is Deprecated / Archived
- `lib/ontology` (3 consumers) → migrate to `packages/ontology` (36 consumers); archive lib version
- `artifacts/firestorm/`, `artifacts/imperium/`, `artifacts/prism-counsel/` — directories archived; API routes triaged and either kept or removed

---

## Plane 2 — Integration & Delivery

**Purpose:** Every commit that passes CI is buildable, testable, and deployable without human intervention up to the staging gate.

### Current State (2026-04-28)
- 25 GitHub Actions workflows, all pinned to full SHAs ✅
- Turbo monorepo build graph ✅
- pnpm 10 workspace with catalog-pinned versions ✅
- Dependabot + dependency-review workflow ✅
- No Argo CD, no container image promotion, no GitOps reconciliation

### Target State
| Component | Target Location | Description |
|-----------|----------------|-------------|
| GitHub Actions CI | `.github/workflows/` | Current — keep and extend |
| Turbo build graph | `turbo.json` | Current — keep |
| Container image build | `.github/workflows/container-publish.yml` | Extended to push to ACR on main |
| Semantic release | `.github/workflows/release.yml` | Current — keep |
| Argo CD | `/platform/gitops/` | App-of-apps for Container Apps (Phase 5) |
| Image promotion | ACR → Argo CD sync | dev → staging → prod promotion (Phase 5) |

### Folder → Plane Mapping

| Path | Plane Role | Notes |
|------|-----------|-------|
| `.github/workflows/` | Delivery substrate — **shared substrate** | Keep all; pin all SHAs |
| `turbo.json` | Build graph — **shared substrate** | Keep; add `codegen` tasks |
| `pnpm-workspace.yaml` | Dependency catalog — **shared substrate** | Keep; catalog section is canonical |
| `/platform/gitops/` | GitOps delivery — **new in Phase 5** | Argo CD app-of-apps |

### What Stays Product-Specific
- Per-artifact Vite configs, Expo configs, build scripts
- Per-service Dockerfile (each service owns its container shape)

### What Becomes Shared Substrate
- Base Dockerfile patterns (golden-path template produces these)
- Shared CI job templates (lint, typecheck, build, test — reusable workflows)
- Shared release configuration (semantic-release config at root)

---

## Plane 3 — Resource

**Purpose:** Any authorized engineer can provision a compliant cloud environment without hand-crafting ARM/Bicep. Infrastructure is declared, version-controlled, and reconciled automatically.

### Current State (2026-04-28)
- Azure Bicep authored for all target resources (PostgreSQL, Container Apps, Front Door, Key Vault, Redis, Service Bus, Blob Storage, ACR, Static Web Apps, VNet, Document Intelligence, Alerting)
- No resources deployed — platform runs on Replit (dev) only
- No Crossplane, no Argo CD

### Target State
| Component | Target Location | Description |
|-----------|----------------|-------------|
| Crossplane provider | `/platform/crossplane/` | Azure provider, XRDs for environment, database, cache (Phase 5) |
| Crossplane composites | `/platform/crossplane/compositions/` | `XEnvironment`, `XDatabase`, `XCache`, `XMessageBus` |
| Argo CD app-of-apps | `/platform/gitops/apps/` | Each service has an Argo Application pointing to its Helm chart |
| Azure Landing Zone | `infra/` (existing Bicep, Phase 5 execution) | VNet, Key Vault, ACR, Front Door, PostgreSQL, Redis, Service Bus |
| Per-service Helm charts | `infra/charts/<service>/` | Generated by Score + Humctl or hand-authored |

### Folder → Plane Mapping

| Path | Plane Role | Notes |
|------|-----------|-------|
| `infra/main.bicep` | Azure Landing Zone — **shared substrate** | Deploy once per subscription |
| `infra/modules/` | Azure resource modules — **shared substrate** | Reusable Bicep modules |
| `infra/runbooks/` | Operational runbooks — **shared substrate** | Keep and expand |
| `/platform/crossplane/` | IaC composites — **new in Phase 5** | Self-service resource provisioning |
| `/platform/gitops/` | GitOps delivery — **new in Phase 5** | Argo CD app-of-apps |

### What Stays Product-Specific
- Per-domain-pack resource requirements documented in their `catalog-info.yaml`
- Per-surface environment variable overrides (domain-specific secrets)

### What Becomes Shared Substrate
- All Azure Landing Zone Bicep modules — deployed once, consumed by all
- Crossplane XRDs — composites abstract provider details from developers
- Argo CD — single GitOps operator for the entire platform

---

## Plane 4 — Observability

**Purpose:** Any engineer can understand the health, performance, and AI decision quality of any service at any time, from a single dashboard.

### Current State (2026-04-28)
- OTel instrumentation in api-server (`@opentelemetry/exporter-trace-otlp-http` present)
- `packages/otel`, `packages/observability-core`, `packages/cognitive-observability`, `packages/telemetry-standards` exist
- `services/lyte-metrics-store` — custom metrics persistence
- `artifacts/lyte-command-center` — Lyte decision intelligence UI
- No configured OTel Collector, no trace backend, no metrics scrape target, no alerting backend

### Target State
| Component | Target Location | Description |
|-----------|----------------|-------------|
| OTel Collector | `/observability/collector/` | OTLP receiver → Azure Monitor / Grafana |
| Azure Monitor | Azure (infra/modules/alerting.bicep) | Trace backend, metrics, alerts |
| Lyte intelligence | `artifacts/lyte-command-center` | Operational intelligence UI — stays product-specific |
| Lyte metrics store | `services/lyte-metrics-store` | Metrics persistence — stays as service |
| Structured log schema | `packages/telemetry-standards` | Enforced across all services |
| DORA metrics | CI integration | Deployment frequency, lead time, MTTR |
| AI trace persistence | Database (api-server) | Cognitive-observability traces persisted to DB |

### Folder → Plane Mapping

| Path | Plane Role | Notes |
|------|-----------|-------|
| `packages/otel` | OTel SDK — **shared substrate** | All services import from here |
| `packages/observability-core` | OBS core — **shared substrate** | Health pool, slow query, trace helpers |
| `packages/cognitive-observability` | AI trace — **shared substrate** | AI decision telemetry |
| `packages/telemetry-standards` | Log schema — **shared substrate** | Canonical log event shape |
| `services/lyte-metrics-store` | Metrics persistence — **shared substrate** | Stays as service |
| `artifacts/lyte-command-center` | Observability UI — **product-specific** | Lyte domain product |
| `/observability/` | OTel stack config — **new in Phase 4** | Collector config, dashboards |

### What Stays Product-Specific
- Lyte's domain-specific analytics and intelligence features
- Per-surface Plausible analytics (privacy analytics for public surfaces)

### What Becomes Shared Substrate
- OTel instrumentation from `packages/otel` — mandatory for all new services (golden path)
- Structured log schema from `packages/telemetry-standards` — mandatory
- Health endpoint pattern — every service must expose `/health`

---

## Plane 5 — Security & Governance

**Purpose:** Every decision, every execution, every policy is traceable and auditable. No capability escapes the proof chain.

### Current State (2026-04-28)
- `packages/policy-engine`, `packages/policy-guard`, `packages/aef-policy-guard` — TypeScript policy primitives
- `packages/auth-shared`, `packages/replit-auth-web` — auth utilities
- `packages/security-headers` — HTTP security middleware
- `lib/proof-chain`, `lib/evidence-ledger`, `lib/evidence-graph`, `lib/outcome-graph` — governance primitives
- Secret scanning: `secret-scan.yml`, `secret-scan-scheduled.yml`, `.gitleaks.toml` ✅
- Dependency review: `dependency-review.yml` ✅
- CodeQL: `codeql.yml` ✅
- No OPA deployment, no Rego policies, no Azure Managed Identity, no runtime policy enforcement

### Target State
| Component | Target Location | Description |
|-----------|----------------|-------------|
| OPA policy engine | `/platform/policy/` | Rego policy bundles; OPA sidecar or Gatekeeper |
| Aegis trust layer | `artifacts/aegis/` | Aegis investor/trust surface (current; formalize) |
| Azure Managed Identity | Infra (Phase 5) | Workload identity for all Container Apps |
| Azure Key Vault | `infra/modules/keyvault.bicep` (Phase 5) | All production secrets |
| Proof chain | `lib/proof-chain` | Cryptographic proof — keep, formalize |
| Evidence ledger | `lib/evidence-ledger` | Immutable audit — keep, formalize |
| RBAC enforcement | api-server middleware + policy-engine | Keep, extend to all new services |
| Secret scanning | `.github/workflows/secret-scan*.yml` | Current — keep |
| Dependency policy | `dependency-review.yml` + enforcement | Extend with license gating |

### Folder → Plane Mapping

| Path | Plane Role | Notes |
|------|-----------|-------|
| `packages/policy-engine` | Policy runtime — **shared substrate** | Extend to support Rego evaluation |
| `packages/policy-guard` | Policy middleware — **shared substrate** | Mandatory in golden path |
| `packages/security-headers` | HTTP security — **shared substrate** | Mandatory in golden path |
| `packages/auth-shared` | Auth primitives — **shared substrate** | Mandatory in golden path |
| `lib/proof-chain` | Proof chain — **shared substrate** | Keep; formalize; add to catalog |
| `lib/evidence-ledger` | Evidence ledger — **shared substrate** | Keep; formalize; add to catalog |
| `lib/audit` | Audit utilities — **shared substrate** | Keep; IP hashing active |
| `artifacts/aegis/` | Trust UI — **product-specific** | Aegis product surface |
| `/platform/policy/` | OPA policies — **new in Phase 4** | Rego bundles, OPA runtime config |
| `.github/workflows/secret-scan*.yml` | Secret scanning — **shared substrate** | Keep |

### What Stays Product-Specific
- Aegis investor trust surface and its domain-specific dashboards
- Per-domain-pack permission models

### What Becomes Shared Substrate
- All OPA Rego policies (centralized in `/platform/policy/`)
- Azure Managed Identity binding (one per Container App service account)
- Proof chain and evidence ledger (every new agent/workflow must emit proof)

---

## Alloy / Lyte / Aegis / Domain-Pack Boundaries

### Alloy — Central Platform Orchestrator and Proof Chain

**What it is:** The AI execution fabric. Alloy handles embedding, ingestion, ranking, retrieval, and the cryptographic proof chain that makes every AI decision auditable.

| Component | Current Location | Target Location |
|-----------|----------------|----------------|
| AEF REST gateway | `apps/alloy-embedding-api` | Stay in `apps/`; add catalog + Score |
| Alloy runtime API | `apps/alloy-runtime-api` | Stay in `apps/`; add catalog + Score |
| Alloy ingestion orchestrator | `apps/alloy-ingestion-orchestrator` | Stay in `apps/`; add catalog + Score |
| Alloy fabric API | `services/alloy-fabric-api` | Stay in `services/`; add catalog + Score |
| Alloy fabric ingest control | `services/alloy-fabric-ingest-control` | Stay in `services/`; add catalog + Score |
| Alloy workers (embed, rank, rerank, vector) | `workers/alloy-*` | Stay in `workers/`; add catalog + Score |
| Alloy brand orchestration layer | `artifacts/a11oy` | Stay in `artifacts/`; product surface |
| AEF contracts / packages | `packages/aef-*`, `packages/agents-*` | Stay in `packages/`; add catalog |
| Proof chain | `lib/proof-chain` | Stay; formalize in catalog |

**Doctrine:** Alloy is the substrate. A11oy (brand) is a product surface that sits on top. They share naming heritage but serve different layers.

### Lyte — Observability and Operational Intelligence

**What it is:** The operational intelligence layer. Lyte collects platform signals, applies AI analysis, and surfaces decisions through its command center UI.

| Component | Current Location | Target Location |
|-----------|----------------|----------------|
| Lyte command center (UI) | `artifacts/lyte-command-center` | Stay in `artifacts/`; product surface |
| Lyte metrics store | `services/lyte-metrics-store` | Stay in `services/`; Plane 4 substrate |
| Lyte cognitive packages | `packages/cognitive-observability`, `packages/otel`, `packages/observability-core` | Stay in `packages/`; Plane 4 substrate |

**Doctrine:** Lyte is both a product (the command center UI) and a substrate consumer (using the shared observability packages). The distinction: `artifacts/lyte-command-center` is product-specific; `packages/otel` and friends are platform substrate that Lyte uses.

### Aegis — Trust, Policy, Compliance, and Vulnerability

**What it is:** The security and governance layer. Aegis encompasses the investor trust surface, policy enforcement, compliance audit, and vulnerability tracking.

| Component | Current Location | Target Location |
|-----------|----------------|----------------|
| Aegis UI (investor/trust) | `artifacts/aegis/` | Stay in `artifacts/`; product surface (register artifact.toml) |
| Policy engine | `packages/policy-engine`, `packages/policy-guard`, `packages/aef-policy-guard` | Stay in `packages/`; Plane 5 substrate |
| OPA policies | Not yet created | `/platform/policy/` (Phase 4) |
| Proof chain | `lib/proof-chain` | Stay; Plane 5 substrate |
| Evidence ledger | `lib/evidence-ledger` | Stay; Plane 5 substrate |
| AEF eval / security | `packages/aef-evals` | Stay in `packages/` |

**Doctrine:** Aegis as a product is the trust surface visible to investors and compliance reviewers. Aegis as substrate is the policy/proof/audit machinery used by every other surface.

### Domain Packs — Product-Specific Surfaces

Domain packs are self-contained product surfaces. They consume shared substrate (auth, OTel, policy, proof chain, API client) but own their domain logic, branding, and UI.

| Domain Pack | Current Location | Domain | Shared Substrate Used |
|-------------|----------------|--------|----------------------|
| Vessels | `artifacts/vessels` | Maritime | api-client-react, auth-shared, otel |
| Terra | `artifacts/terra` | Real Estate | api-client-react, auth-shared, otel |
| Counsel | `artifacts/counsel` | Legal | api-client-react, auth-shared, otel |
| Carlota Jo | `artifacts/carlota-jo` | Advisory | api-client-react, auth-shared, otel, i18next |
| Sentra | `artifacts/sentra` | Cyber | api-client-react, auth-shared, otel |
| Conduit | `artifacts/conduit` | Data / Reverse ETL | api-client-react, auth-shared, otel |
| Pulse | `artifacts/pulse` | AI Briefing | api-client-react, auth-shared, otel |

**Doctrine:** Domain packs are tenants of the platform, not substrate owners. A new domain pack is created via the `new-domain-ui` golden path. Domain packs do not import from each other.

---

## Deprecation Register

| Item | Status | Reason | Action |
|------|--------|--------|--------|
| `lib/ontology` | Deprecated (superseded by `packages/ontology`) | 3 vs 36 consumers | Migrate 3 consumers; archive |
| `artifacts/imperium/` | Archived | Merged into Command | Verify no active routes; clean up dir |
| `artifacts/firestorm/` | Archived | Aegis defense UI; routes still live | Triage API routes; clean up dir |
| `artifacts/prism-counsel/` | Archived | Counsel UI; routes still live | Triage API routes; clean up dir |
| `lib/` duplicates of `packages/` equivalents | Under review | Tracked in CONSOLIDATION_DECISIONS.md | Resolve in Backstage catalog phase |

---

## Target Folder Tree (Abbreviated)

```
/
├── apps/                          # Backend apps (Alloy + Substrate)
├── artifacts/                     # Product surfaces (domain packs + corporate)
├── infra/                         # Azure Bicep Landing Zone
├── lib/                           # Shared libraries (consolidating → packages/)
├── packages/                      # Shared substrate packages
├── platform/                      # NEW — platform engineering plane configs
│   ├── backstage/                 # Phase 3 — Backstage IDP
│   ├── crossplane/                # Phase 5 — Crossplane XRDs + compositions
│   ├── gitops/                    # Phase 5 — Argo CD app-of-apps
│   ├── policy/                    # Phase 4 — OPA Rego policies
│   └── agent-gateway/             # Future — MCP agent gateway config
├── observability/                 # Phase 4 — OTel collector config + dashboards
├── services/                      # Platform services (Alloy fabric + Lyte + Substrate)
├── workers/                       # Async workers (Alloy embed/rank/vector)
├── scripts/                       # CI and operational scripts
├── tests/                         # Cross-artifact e2e (Playwright)
└── docs/                          # TechDocs content (linked from Backstage)
```
