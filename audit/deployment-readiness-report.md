# Deployment Readiness Report
**Generated:** 2026-04-21  
**Track:** Zero-Gap Track 5 — Infra, CI & Deployment Readiness  
**Scope:** GitHub Actions workflows, deployment scripts, health checks, perf checks, security checks, SBOM tooling, Replit config, artifact registrations

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ GREEN | Working, no issues found |
| ⚠️ FLAKY | May work but has known risks or inconsistencies |
| 🔴 BROKEN | Will fail or is known to be non-functional |
| 📦 STALE-REF | References a removed file, script, or deprecated target |
| 🗄️ ARCHIVED | Intentionally disabled/archived; not expected to run |

---

## 1. GitHub Actions Workflows

### Core CI (`ci.yml`)

| Job | Status | Notes |
|-----|--------|-------|
| `lint` | ✅ GREEN | Runs biome lint; pinned action hashes |
| `typecheck` | ✅ GREEN | Runs turbo typecheck |
| `test` | ✅ GREEN | Runs `pnpm test` (vitest unit suite) |
| `build` | ✅ GREEN | Explicit per-app build gates for command, aegis, pulse |
| `integration-test` | ✅ GREEN | PostgreSQL service container; migrates + runs integration tests |
| `docs-sync-check` | ✅ GREEN | `continue-on-error: true`; advisory only |
| `docs-claims-check` | ✅ GREEN | `scripts/docs/check-docs-claims.js` exists |
| `secret-scan` | ✅ GREEN | Gitleaks 8.21.2; `.gitleaks.toml` present |
| `readiness-gate` | ✅ GREEN | Builds api-server, starts it, waits for health, runs `smoke:product-mode` |
| `proof-chain-checks` | ✅ GREEN | Runs targeted vitest invocations on proof-chain packages |
| `route-security-matrix` | ✅ GREEN | `pnpm --filter @workspace/api-server run audit:route-security:strict` |
| `ci-gate` | ✅ GREEN | Aggregates all jobs; blocks merge on any failure |

**Residual:** `integration-test` job requires `INTEGRATION_TEST_TOKEN` secret in GitHub repo settings. If unset, tests that depend on it will be skipped or fail gracefully (tested in CI).

---

### Build Check (`build.yml`)

| Job | Status | Notes |
|-----|--------|-------|
| `build-all` | ✅ GREEN | Builds api-server, szl-holdings, aegis, pulse, command, terra, vessels, carlota-jo |

**Note:** `build.yml` overlaps partially with the `build` job in `ci.yml`. Both run on push to main. The `build.yml` is a separate, faster sanity check; `ci.yml` build includes dependency jobs. No conflict.

---

### E2E Tests (`e2e.yml`)

| Job | Status | Notes |
|-----|--------|-------|
| `e2e-app (szl-holdings)` | ✅ GREEN | `@workspace/szl-holdings` builds; spec exists |
| `e2e-app (forge)` | ✅ GREEN | Same build as szl-holdings |
| `e2e-app (aegis)` | ✅ GREEN | `@workspace/aegis` builds; spec exists |
| `e2e-app (terra)` | ✅ GREEN | Spec exists |
| `e2e-app (vessels)` | ✅ GREEN | Spec exists |
| `e2e-app (carlota-jo)` | ✅ GREEN | Spec exists |
| `e2e-app (command)` | ✅ GREEN | Spec exists |
| `e2e-app (governed-decision-loop)` | ✅ GREEN | Same build as command |
| `e2e-app (imperium)` | ✅ GREEN | Same build as command |
| `e2e-app (lyte)` | ✅ GREEN | Same build as szl-holdings |
| `e2e-app (lyte-onboarding)` | ✅ GREEN | `@workspace/lyte-command-center`; spec exists |
| `e2e-app (auth)` | ✅ GREEN | Spec exists |
| `e2e-app (rbac)` | ✅ GREEN | Spec exists |
| `e2e-app (prism-counsel)` | ⚠️ FLAKY | `@workspace/prism-counsel` is **archived** (see `artifacts/prism-counsel/ARCHIVED.md`). Directory and node_modules still exist so build may succeed, but artifact is not in the registered artifact registry. Spec exists. Risk: build breaks silently if archive removes package.json. **Owner:** Platform team. **Action:** Add `# ARCHIVED` comment in matrix; track removal when prism-counsel source is deleted. |
| `e2e-app (sentra)` | ✅ GREEN | Spec exists; artifact registered |
| `e2e-app (counsel)` | ✅ GREEN | Spec exists; artifact registered (distinct from prism-counsel) |
| `e2e-app (pulse)` | ✅ GREEN | Spec exists; artifact registered |
| `e2e-app (stephen-site)` | ✅ GREEN | Embedded in szl-holdings; spec self-guards with `STEPHEN_BASE_PATH` |
| `e2e-app (correlation-deeplinks)` | ✅ GREEN | Uses `isReachable()` guards |
| `e2e-app (decision-theater)` | ✅ GREEN | Spec exists |
| `e2e-app (a11y)` | ✅ GREEN | axe-core; spec exists |
| `e2e-app (health-and-404)` | ✅ GREEN | Self-skips API check without live server |
| `a11y` | ✅ GREEN | Standalone a11y job (duplicate of matrix a11y for visibility) |
| `e2e` gate | ✅ GREEN | Aggregates e2e-app + a11y |

---

### Deploy Staging (`deploy-staging.yml`)

| Job | Status | Notes |
|-----|--------|-------|
| `deploy-staging` | ⚠️ FLAKY | Requires `REPLIT_STAGING_DEPLOY_TOKEN` + `REPLIT_STAGING_APP_ID` secrets. If absent, job warns and skips (does not fail). Staging environment must be created in GitHub repo Settings → Environments → staging. Currently no staging Replit app is configured — effective behavior is warn-and-skip. |

---

### Deploy Production (`deploy-production.yml`)

| Job | Status | Notes |
|-----|--------|-------|
| `validate-dispatch` | ✅ GREEN | Requires `confirm: deploy` on manual dispatch |
| `deploy-production` | ⚠️ FLAKY | Requires `REPLIT_DEPLOY_TOKEN` + `REPLIT_APP_ID` secrets. If absent, warns and skips. Triggered by GitHub Release publication or `workflow_dispatch`. **Missing credentials:** `REPLIT_APP_ID`, `REPLIT_DEPLOY_TOKEN` (set in GitHub Settings → Environments → production). |

---

### Lighthouse CI (`lighthouse.yml`)

| Job | Status | Notes |
|-----|--------|-------|
| `lighthouse` | ✅ GREEN | Targets `@workspace/szl-holdings` only; scores enforced via `.lighthouserc.json` (perf ≥ 0.80, a11y ≥ 0.90, best-practices ≥ 0.90, SEO ≥ 0.90). Chromium via `treosh/lighthouse-ci-action`. |
| `lighthouse-gate` | ✅ GREEN | Blocks on Lighthouse failure |

**Residual:** Lighthouse only audits szl-holdings. Other artifacts (terra, vessels, counsel, sentra) are not covered. Expand matrix if broader coverage is desired.

---

### Security Audit & SBOM (`security.yml`)

| Job | Status | Notes |
|-----|--------|-------|
| `dependency-scan` | ✅ GREEN | `scripts/qa/generate-sbom.js` + `scripts/qa/generate-vuln-report.js`; uploads to `security/` |
| `secret-scan` | ✅ GREEN | Gitleaks; same logic as ci.yml secret-scan |
| CodeQL (`codeql.yml`) | ✅ GREEN | javascript-typescript; weekly schedule + PR/push; SARIF upload |

---

### Dependency Review (`dependency-review.yml`)

| Status | Notes |
|--------|-------|
| ✅ GREEN | Fails on high-severity new deps; denies GPL-3.0, AGPL-3.0 |

---

### Secret Scan Scheduled (`secret-scan-scheduled.yml`)

| Status | Notes |
|--------|-------|
| ✅ GREEN | Daily Gitleaks sweep of full default branch history; uploads SARIF |

---

### Uptime Monitor (`uptime-monitor.yml`)

| Status | Notes |
|--------|-------|
| ⚠️ FLAKY | Runs every minute. Effective only when `PUBLIC_APP_URL` is a live production URL. In dev/demo environment, health check target may not be stable. Ensure `target_url` input or production URL is set before relying on this for alerting. |

---

### Database Backup (`backup.yml`)

| Status | Notes |
|--------|-------|
| ⚠️ FLAKY | Runs daily. Primary target is Azure Blob Storage (requires `AZURE_STORAGE_*` secrets). Falls back to GitHub Actions artifact-only mode if secrets absent. Azure secrets not configured → backup works but is transient (7-day retention only). **Action:** Configure `AZURE_STORAGE_*` secrets or migrate backup target to Replit-native PostgreSQL snapshots. |

---

### Container Publish (`container-publish.yml`)

| Status | Notes |
|--------|-------|
| ✅ GREEN | Triggers on release or `v*.*.*` tag. Pushes to `ghcr.io/szl-holdings/*`. Requires `GITHUB_TOKEN` with `packages: write`. |

---

### NPM Publish (`npm-publish.yml`)

| Status | Notes |
|--------|-------|
| ✅ GREEN | Publishes to GitHub Packages on release. Requires `GITHUB_TOKEN`. |

---

### README QA (`readme-qa.yml`)

| Status | Notes |
|--------|-------|
| ✅ GREEN | Path-filtered; runs on README/docs changes. Validates assets and product table. |

---

### Release (`release.yml`)

| Status | Notes |
|--------|-------|
| ✅ GREEN | Auto-version from commits on main; supports manual bump type override. |

---

### Audit Full (`audit-full.yml`)

| Status | Notes |
|--------|-------|
| ✅ GREEN | Runs `scripts/audit-full.js`; triggered on PR + push to main. |

---

### PRISM Counsel CI (`prism-counsel-ci.yml`)

| Status | Notes |
|--------|-------|
| 🗄️ ARCHIVED | `workflow_dispatch` only. Azure targets decommissioned. Safe to leave — will not run automatically. |

---

## 2. Deployment Scripts

| Script | Status | Notes |
|--------|--------|-------|
| `scripts/ci-preflight.ts` | ✅ GREEN | Pre-CI env check |
| `scripts/backup-db.sh` | ✅ GREEN | DB dump to local/remote |
| `scripts/backup-upload.sh` | ✅ GREEN | Upload to remote backend |
| `scripts/backup-restore.sh` | ✅ GREEN | Restore from backup |
| `scripts/deploy-mobile.js` | ✅ GREEN | Expo EAS submit wrapper |
| `scripts/post-merge.sh` | ✅ GREEN | Runs after platform task merge (configured in `.replit`) |
| `scripts/seed-demo-canonical.sh` | ✅ GREEN | Seeds all demo data |
| `infra/runbooks/RUNBOOK_DEPLOYMENT.md` | 📦 STALE-REF | References Azure Container Apps deployment as the primary path. **Deployment doctrine changed April 16, 2026: Replit is the sole primary deployment target.** Azure steps are no longer valid. See `docs/ops/deploy-runbook.md` for the current canonical runbook. |
| `infra/main.bicep` | 🗄️ ARCHIVED | Azure Bicep templates kept for reference (enterprise SSO/Power BI integration docs) but not part of primary deploy path. |
| `docker-compose.yml` | ✅ GREEN | Valid for local Docker-based dev. Note: Compose covers api-server + 5 web artifacts; newer artifacts (sentra, counsel, pulse, lyte, command, szl-demo-video, mockup-sandbox) not in Compose — add if Docker-based local dev is needed for those. |

---

## 3. Health Checks

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/health` | ✅ GREEN | Returns `{ status, timestamp, version, uptime, services }`. Alias for `/api/healthz`. |
| `GET /api/healthz` | ✅ GREEN | Canonical health endpoint |
| Uptime workflow check | ⚠️ FLAKY | See uptime-monitor.yml entry above |
| `pnpm verify:health` | ✅ GREEN | `scripts/qa/health-check.js` script |

---

## 4. Performance Checks

| Check | Status | Notes |
|-------|--------|-------|
| Lighthouse CI | ✅ GREEN | szl-holdings only; perf ≥ 0.80 enforced |
| `.lighthouserc.json` | ✅ GREEN | `lighthouse:no-pwa` preset; 1 run; temporary public storage upload |

---

## 5. Security Checks

| Check | Status | Notes |
|-------|--------|-------|
| Dependency Review | ✅ GREEN | PR gate; high-severity + license deny-list |
| Gitleaks (PR) | ✅ GREEN | Diff-scoped on PRs, full-tree on push |
| Gitleaks (Scheduled) | ✅ GREEN | Daily full-history sweep |
| CodeQL | ✅ GREEN | Weekly + PR/push; JS/TS |
| SBOM generation | ✅ GREEN | `security/sbom-latest.json`; 90-day artifact retention |
| Vulnerability report | ✅ GREEN | `security/vuln-report.md` from `pnpm audit` |
| Route security matrix | ✅ GREEN | Strict audit of all API routes for auth coverage |

---

## 6. SBOM

| Tool | Output | Status |
|------|--------|--------|
| `scripts/qa/generate-sbom.js` | `security/sbom-latest.json` | ✅ GREEN |
| Uploaded via `security.yml` | GitHub Actions artifact (90-day) | ✅ GREEN |

---

## 7. Replit Config Coherence

### `.replit` Alignment

| Check | Status | Notes |
|-------|--------|-------|
| `[deployment]` target = autoscale | ✅ GREEN | Correct for Replit production |
| `[deployment.postBuild]` prune pnpm store | ✅ GREEN | Reduces deploy image size |
| `runButton` workflow = "Project" | ✅ GREEN | Starts lyte-command-center + counsel in parallel |
| Port 8080 → external 80 | ✅ GREEN | Primary HTTP ingress |
| Port 9090 → external 3000 | ✅ GREEN | Lyte vite dev server |
| Port 21130 → external 3001 | ✅ GREEN | Used by mockup-sandbox |
| `[postMerge]` script | ✅ GREEN | `scripts/post-merge.sh` exists |
| `[nix]` packages | ✅ GREEN | Matches `replit.nix` package list |

### Workflow → Artifact Alignment

| Workflow Name | Artifact Dir | Status |
|--------------|-------------|--------|
| `artifacts/lyte-command-center: web` | `artifacts/lyte-command-center` | ✅ GREEN |
| `artifacts/counsel: web` | `artifacts/counsel` | ✅ GREEN |
| All other artifacts (aegis, api-server, carlota-jo, command, mockup-sandbox, pulse, sentra, szl-demo-video, szl-holdings, szl-holdings-mobile, terra, vessels) | Registered but not in `.replit` workflows | ⚠️ Note: Only lyte and counsel have explicit `.replit` workflow entries. Other artifacts start via Replit's artifact auto-start. This is expected behavior — only artifacts needing custom startup flags require explicit workflow entries. |

### Orphan / Stale Registrations

| Item | Status |
|------|--------|
| `artifacts/prism-counsel` | Files present, ARCHIVED.md present, **not in registered artifact list** — no orphan in `.replit`, directory is leftover archive. Safe. |
| `artifacts/firestorm` | Files present, no `artifact.toml` — archived. Safe. |
| `artifacts/internal-audit` | Files present — internal tooling, not a deployable artifact. Safe. |
| `artifacts/imperium` | Files present — embedded in command artifact, not standalone. Safe. |

---

## 8. Port Coherence

| Artifact | Dev Port (VITE_PORT) | External Port | Notes |
|----------|---------------------|---------------|-------|
| lyte-command-center | 9090 | 3000 | Explicit in `.replit` workflow |
| mockup-sandbox | 21130 | 3001 | Port declared in `.replit` |
| api-server | 8080 | 80 | Primary ingress |
| All others | Dynamic via `PORT` env | Via shared gateway | Sub-path routing via proxy |

No port collisions detected.

---

## 9. Residual Register

Items that are known issues without a hard blocker:

| ID | Item | Owner | Status | Reproducer |
|----|------|-------|--------|-----------|
| RES-001 | `prism-counsel` E2E matrix entry references archived artifact | Platform team | ✅ Resolved (Task #2880) | Directory `artifacts/prism-counsel/`, matrix entry, and `tests/e2e/prism-counsel.spec.ts` removed |
| RES-002 | `deploy-staging.yml` / `deploy-production.yml` missing Replit secrets | DevOps | ⚠️ Tracked | Run workflow without `REPLIT_DEPLOY_TOKEN` — warns, skips |
| RES-003 | `backup.yml` Azure secrets absent → short-retention backup only | Platform team | ⚠️ Tracked | Run backup.yml without `AZURE_STORAGE_*` secrets |
| RES-004 | `infra/runbooks/RUNBOOK_DEPLOYMENT.md` references deprecated Azure path | DevOps | 📦 Stale | Read file — references Azure Container Apps deploy |
| RES-005 | Lighthouse only covers szl-holdings; newer artifacts unaudited | QA | ✅ Resolved | `.github/workflows/lighthouse.yml` matrix now audits szl-holdings, aegis, carlota-jo, command, counsel, lyte-command-center, pulse, sentra, terra, vessels against `.lighthouserc.json` thresholds (perf ≥ 0.80, a11y/best-practices/SEO ≥ 0.90) |
| RES-006 | `uptime-monitor.yml` runs every minute but target may not be stable in dev | DevOps | ⚠️ Tracked | Monitor job pings `PUBLIC_APP_URL` |
| RES-007 | `docker-compose.yml` missing 8 newer artifacts | Platform team | ⚠️ Tracked | Run `docker-compose up` — sentra, counsel, pulse, lyte, command, etc. not included |
| RES-008 | `INTEGRATION_TEST_TOKEN` secret not documented in GitHub repo secrets setup | DevOps | ⚠️ Tracked | Integration tests in ci.yml skip if absent |
