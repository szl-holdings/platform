# SZL Holdings — Deployment Surface Map

**Generated:** 2026-04-21  
**Track:** Zero-Gap Track 1

---

## Deployment Environments

| Environment | Purpose | Trigger |
|-------------|---------|---------|
| Development | Active development and internal preview | Always on (Replit workspace) |
| Staging | Integration validation before production | Push to `main` via `deploy-staging.yml` |
| Production | Customer-facing deployment | Published release via `deploy-production.yml` |

---

## Replit Deployment Configuration (`.replit`)

| Attribute | Value |
|-----------|-------|
| Deployment router | `application` |
| Deployment target | `autoscale` |
| Post-build step | `pnpm store prune` (with `CI=true`) |
| Run button | `Project` workflow |
| Port 8080 | External port 80 (primary web) |
| Port 9090 | External port 3000 (secondary preview) |
| Port 21130 | External port 3001 |

### Registered Artifacts in `.replit`

| Artifact | Notes |
|---------|-------|
| `artifacts/api-server` | API server |
| `artifacts/mockup-sandbox` | NEXUS design sandbox |

**Note:** Only 2 artifacts are declared in `.replit` `[[artifacts]]` sections. The other 12 registered artifacts are managed via the Replit workspace artifact system (artifact.toml), not via the top-level `.replit` `[[artifacts]]` blocks.

---

## Active Workflows in `.replit`

| Workflow | Command | Port | Type |
|---------|---------|------|------|
| `Project` | Parallel launcher | — | Meta-workflow |
| `artifacts/lyte-command-center: web` | Vite dev server | 9090 | webview |
| `artifacts/counsel: web` | Vite dev server | — | webview |

---

## CI/CD Pipelines

| Pipeline | File | Status | Notes |
|---------|------|--------|-------|
| Primary CI | `.github/workflows/ci.yml` | Active | Lint, typecheck, test |
| Build | `.github/workflows/build.yml` | Active | Build validation |
| CodeQL | `.github/workflows/codeql.yml` | Active | Pinned-SHA code scanning |
| Security | `.github/workflows/security.yml` | Active | Security scan suite |
| Secret scan | `.github/workflows/secret-scan-scheduled.yml` | Active | Scheduled Gitleaks |
| Dependency review | `.github/workflows/dependency-review.yml` | Active | PR dependency review |
| Deploy staging | `.github/workflows/deploy-staging.yml` | Active | Staging deployment on main push |
| Deploy production | `.github/workflows/deploy-production.yml` | Active | Production deployment on release |
| Release | `.github/workflows/release.yml` | Active | Changelog + tag generation |
| E2E | `.github/workflows/e2e.yml` | Active | Playwright E2E |
| README QA | `.github/workflows/readme-qa.yml` | Active | README asset and badge validation |
| Lighthouse | `.github/workflows/lighthouse.yml` | Active | Performance audits |
| Audit full | `.github/workflows/audit-full.yml` | Active | Full audit suite |
| Container publish | `.github/workflows/container-publish.yml` | Active | Container image publishing |
| NPM publish | `.github/workflows/npm-publish.yml` | Active | NPM package publishing |
| Uptime monitor | `.github/workflows/uptime-monitor.yml` | Active | Uptime monitoring |
| Backup | `.github/workflows/backup.yml` | Active | Database backup |
| PRISM Counsel CI | `.github/workflows/prism-counsel-ci.yml` | **Stale** | Legacy pipeline for archived artifact |

---

## Infrastructure as Code

| Location | Technology | Coverage |
|---------|-----------|---------|
| `infra/` | Azure Bicep | App Service, PostgreSQL Flexible Server, Key Vault, Redis, CDN |
| `ops/infra/target-production-architecture.md` | Documentation | Production topology |
| `ops/infra/environment-matrix.md` | Documentation | Dev/staging/prod separation |
| `ops/infra/recovery-and-backup-model.md` | Documentation | Backup and DR |
| `docker-compose.yml` | Docker Compose | Local development services |

---

## Production URLs and Routes

| Surface | Public URL Pattern | Status |
|---------|------------------|--------|
| Primary web | `https://szlholdings.replit.app/` | Configured (`PUBLIC_APP_URL` env var) |
| API | `https://szlholdings.replit.app/api/` | Configured |
| Domain packs | `/terra/`, `/vessels/`, `/carlota-jo/`, `/pulse/`, `/aegis/`, `/sentra/`, `/counsel/`, `/lyte/`, `/command/` | Configured |
| NEXUS (internal) | `/nexus/` | Internal only |

---

## Deployment Readiness (as of 2026-04-21)

| Component | Status | Blocker |
|-----------|--------|---------|
| API server | Ready to deploy | None known |
| SZL Holdings web | Ready to deploy | Hardcoded KPI stats |
| Carlota Jo | Ready to deploy | None known |
| Aegis | Ready to deploy | None known |
| Terra | Partially ready | Mapbox token required |
| Vessels | Partially ready | Live AIS credentials required |
| Pulse | Partially ready | Auth pattern non-standard |
| Command | Partially ready | Most data seeded |
| Sentra | Partially ready | Live agent telemetry planned |
| Counsel | Not ready | Placeholder only |
| Mobile | Not ready | Deferred |
| CORTEX mobile | Not started | Concept phase |

---

## Post-Merge Setup

| File | Purpose |
|------|---------|
| `scripts/post-merge.sh` | Runs automatically after task merges (configured in `.replit` `[postMerge]`) |
| Timeout | 180,000 ms (3 minutes) |
