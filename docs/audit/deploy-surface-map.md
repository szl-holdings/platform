# SZL Holdings — Deployment Surface Map

**Date:** April 16, 2026
**Purpose:** Map every deployment surface (Replit, GitHub Actions, Docker, Azure Bicep) to the apps they serve, with primary vs. secondary vs. internal designation

---

## Deployment Surface Classification

| Designation | Meaning |
|---|---|
| **Primary** | The canonical live deployment surface used for investor demos and commercial evaluation |
| **Secondary** | Enterprise-grade deployment; designed but not yet activated |
| **Internal** | Development, testing, or CI tooling — not customer-facing |

---

## 1. Replit (Primary)

### 1.1 Live Deployment (Published)

| Surface | Status | URL Pattern | Notes |
|---|---|---|---|
| Replit Autoscale Deployment | **Primary** | `https://szlholdings.replit.app` | Configured via `.replit` `[deployment]` — `deploymentTarget = "autoscale"` |

### 1.2 Registered Artifacts → Replit Workflow Mapping

| Artifact | Preview Path | Workflow | Port Binding |
|---|---|---|---|
| `artifacts/szl-holdings` | `/` | `artifacts/szl-holdings: web` | Port 8080 → External 80 |
| `artifacts/api-server` | `/api/` | `artifacts/api-server: api` | Port 9090 → External 3000 |
| `artifacts/aegis` | `/aegis/` | `artifacts/aegis: web` | Assigned by platform |
| `artifacts/carlota-jo` | `/carlota-jo/` | `artifacts/carlota-jo: web` | Assigned by platform |
| `artifacts/command` | `/command/` | `artifacts/command: web` | Assigned by platform |
| `artifacts/firestorm` | `/firestorm/` | `artifacts/firestorm: web` | Assigned by platform |
| `artifacts/mockup-sandbox` | `/__mockup` | `artifacts/mockup-sandbox: Component Preview Server` | Port 21130 → External 3001 |
| `artifacts/prism-counsel` | `/prism-counsel/` | `artifacts/prism-counsel: web` | Assigned by platform |
| `artifacts/stephen-site` | `/stephen-site/` | `artifacts/stephen-site: web` | **Deprecated** — should be deregistered |
| `artifacts/szl-holdings-mobile` | `/szl-holdings-mobile/` | `artifacts/szl-holdings-mobile: expo` | Expo dev server |
| `artifacts/terra` | `/terra/` | `artifacts/terra: web` | Assigned by platform |
| `artifacts/vessels` | `/vessels/` | `artifacts/vessels: web` | Assigned by platform |

### 1.3 Replit Environment Configuration

| Config | Value |
|---|---|
| Runtime modules | `nodejs-24`, `postgresql-16` |
| Nix channel | `stable-25_05` |
| Router type | `application` (path-based routing) |
| Deploy target | `autoscale` |
| Post-build | `pnpm store prune` |
| Post-merge script | `scripts/post-merge.sh` (pnpm install + db:push + build verification) |
| Production env | `NODE_ENV=production`, `LOG_LEVEL=info`, `CORS_ORIGINS=https://*.replit.app,...`, `PUBLIC_APP_URL=https://szlholdings.replit.app` |
| VAPID keys | Shared across all environments via `[userenv.shared]` |

---

## 2. GitHub Actions CI/CD Pipelines (Internal + Secondary)

### 2.1 Active Workflows

| Workflow File | Trigger | Purpose | Designation |
|---|---|---|---|
| `.github/workflows/ci.yml` | PR + push to `master`/`main` | Lint, typecheck, test, build all packages | Internal — CI gate |
| `.github/workflows/build.yml` | (separate trigger) | Full production build verification | Internal |
| `.github/workflows/deploy-staging.yml` | Push to `master`/`main` | Trigger Replit staging deployment via API | Secondary — inactive (token not configured) |
| `.github/workflows/deploy-production.yml` | Release published or manual dispatch (confirm=`deploy`) | Production deployment trigger | Secondary — inactive (token not configured) |
| `.github/workflows/deploy.yml` | (general deploy) | General deployment trigger | Secondary |

### 2.2 Security / Quality Workflows

| Workflow File | Purpose | Status |
|---|---|---|
| `.github/workflows/codeql.yml` | CodeQL static analysis | Active (scans on PR) |
| `.github/workflows/dependency-review.yml` | Dependency license and vulnerability review | Active |
| `.github/workflows/security.yml` | Security scanning | Active |
| `.github/workflows/lighthouse.yml` | Lighthouse performance/accessibility audit | Active |
| `.github/workflows/e2e.yml` | End-to-end test runner | Defined — no active E2E suite yet |
| `.github/workflows/prism-counsel-ci.yml` | Prism Counsel specific CI | Active |

### 2.3 Publishing Workflows (Placeholder / Scaffolded)

| Workflow File | Status | Notes |
|---|---|---|
| `.github/workflows/npm-publish.yml` | Inactive | Would publish lib packages to npm; not activated |
| `.github/workflows/container-publish.yml` | Inactive | Docker container registry publish; not activated |
| `.github/workflows/nuget-publish.yml` | Inactive | .NET package publish; not applicable to this stack |
| `.github/workflows/maven-publish.yml` | Inactive | Java package publish; not applicable to this stack |
| `.github/workflows/rubygems-publish.yml` | Inactive | Ruby gem publish; not applicable to this stack |
| `.github/workflows/release.yml` | Inactive | Release automation; not yet used |

### 2.4 CI Pipeline Steps (ci.yml)

| Job | Command | Notes |
|---|---|---|
| `lint` | `pnpm run lint` | ESLint across monorepo |
| `typecheck` | `pnpm run typecheck` | TypeScript typecheck |
| `test` | `pnpm run test` | Unit/integration test run; uploads coverage artifact |
| `build` | `pnpm -r --if-present run build` | Builds all packages with `package.json#scripts.build` |
| `ci-gate` | Gate job — requires all above | Blocks merge on failure |

**Node.js version in CI:** 20 (vs. production runtime Node.js 24 — **mismatch; should align in Phase 2**)
**pnpm version in CI:** 9 (vs. runtime pnpm 10 — **mismatch; should align in Phase 2**)

---

## 3. Docker (Secondary — Local Dev)

### 3.1 Docker Compose

| File | Purpose | Status |
|---|---|---|
| `docker-compose.yml` | Full local multi-service development stack | Secondary — local dev use only |

### 3.2 Docker Compose Services

| Service | Image | Purpose |
|---|---|---|
| `postgres` | `postgres:16-alpine` | Local PostgreSQL for Docker dev |
| `api-server` | Built from `artifacts/api-server/Dockerfile` | API server container |

**Known Dockerfiles:**
- `artifacts/stephen-site/Dockerfile` — deprecated artifact; Dockerfile is orphaned

### 3.3 Azure Container Registry

The deploy workflows reference `container-publish.yml` but Docker image publishing to Azure Container Registry (ACR) is **not yet activated**.

---

## 4. Azure (Secondary — Enterprise Production)

### 4.1 Infrastructure as Code

| Directory | Purpose | Status |
|---|---|---|
| `infra/` | Azure Bicep IaC templates | **Designed, not deployed** — pending first commercial contract |

### 4.2 Azure Bicep Modules

| Module | Azure Resource | Purpose |
|---|---|---|
| `infra/modules/alerting.bicep` | Azure Monitor / Alerts | Operational alerting |
| `infra/modules/blobstorage.bicep` | Azure Blob Storage | Asset and file storage |
| `infra/modules/containerapp.bicep` | Azure Container Apps | App server container hosting |
| `infra/modules/docintell.bicep` | Azure AI Document Intelligence | Document processing |
| `infra/modules/frontdoor.bicep` | Azure Front Door | CDN + edge caching + WAF |
| `infra/modules/keyvault.bicep` | Azure Key Vault | Centralized secrets |
| `infra/modules/postgres.bicep` | PostgreSQL Flexible Server | Enterprise-grade database |
| `infra/modules/redis.bicep` | Azure Cache for Redis | Session store + cache |
| `infra/modules/servicebus.bicep` | Azure Service Bus | Message queue for async ops |
| `infra/modules/staticwebapp.bicep` | Azure Static Web Apps | Frontend static hosting |
| `infra/modules/storage.bicep` | Azure Storage Account | General storage |
| `infra/modules/vnet.bicep` | Azure Virtual Network | Network isolation |

### 4.3 Azure Deployment Targets

| App | Azure Resource | Status |
|---|---|---|
| API Server | Azure Container Apps (or App Service) | Not deployed |
| Frontend apps | Azure Static Web Apps or Container Apps | Not deployed |
| Database | Azure PostgreSQL Flexible Server | Not deployed |
| Redis | Azure Cache for Redis | Not deployed |
| CDN | Azure Front Door | Not deployed |
| APM | Application Insights | Not deployed |

---

## 5. Public GitHub Mirror

| Repo | Branch | Visibility | Role |
|---|---|---|---|
| `stephenlutar2-hash/szl-holdings-platform` | `master` | Public | Curated public mirror — not a live sync; curated pushes only |
| `stephenlutar2-hash/stephenlutar2-hash` | `main` | Public | GitHub profile README |

---

## 6. Deployment Priority Map

| Priority | Artifact | Target | Reason |
|---|---|---|---|
| 1 | `api-server` | Replit | All apps depend on this |
| 2 | `szl-holdings` | Replit | Primary corporate/investor surface |
| 3 | `carlota-jo` | Replit | GA-ready; advisory with live integrations |
| 4 | `aegis` + `firestorm` | Replit | Security command — investor narrative |
| 5 | `vessels` | Replit | Maritime intelligence — high-value demo |
| 6 | `terra` | Replit | Real estate — live NYC data pipeline |
| 7 | `prism-counsel` | Replit | Legal matter management |
| 8 | `command` | Replit | Unified Command Portal |
| 9 | `szl-holdings-mobile` | Expo/TestFlight | Mobile command |
| — | `mockup-sandbox` | Replit | Internal design tool only |
| — | `stephen-site` | **Deregister** | Deprecated |

---

*Part of Series A Cleanup — Phase 1 audit. April 2026.*
