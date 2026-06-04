# CI Overview

Last updated: 2026-04-27. One screen summary of every workflow in `.github/workflows/`.

---

## Workflow Inventory

| Workflow | File | Trigger | Avg duration | Blocking? | Failure means |
|---|---|---|---|---|---|
| **CI** | `ci.yml` | PR → main/master, `workflow_dispatch` | 8–15 min | Yes — ci-gate | Lint, type, test, build, integration tests, security, proof-chain, brand, env-coverage, API-spec or design-token checks failed |
| **Build Check** | `build.yml` | Push → main/master, `workflow_dispatch` | 5–10 min | Advisory | One or more artifact builds broken on main |
| **E2E Tests** | `e2e.yml` | Push/PR → main/master, `workflow_dispatch` | 15–30 min | Yes — e2e gate | A Playwright test or axe accessibility check failed for one of the 18 matrix apps |
| **Accessibility Checks** | `a11y.yml` | Push/PR → main/master, `workflow_dispatch` | 15–20 min | Advisory | axe-core WCAG 2.1 AA violations in one of the 11 governed artifacts; does not block merge |
| **Lighthouse CI** | `lighthouse.yml` | Push/PR → main/master, `workflow_dispatch` | 15–20 min | Accessibility enforced, others advisory | Performance, best-practices, or SEO below threshold; accessibility ≥ 90 is the hard gate |
| **Runtime Audit** | `audit-full.yml` | Push/PR → main/master, `workflow_dispatch` | Up to 45 min | Advisory | Full audit pipeline (`audit:full:ci`) produced failures; check evidence artifact |
| **CodeQL Analysis** | `codeql.yml` | Mondays @ 06:00 UTC, `workflow_dispatch` | 10–20 min | Advisory | CodeQL flagged a security finding; review Security tab |
| **Security Audit & SBOM** | `security.yml` | Mondays @ 03:00 UTC, `workflow_dispatch` | 15–30 min | Yes — security-gate | Dependency scan, secret scan, lockfile integrity, license report, or security unit tests failed |
| **Secret Scan — PR Gate** | `secret-scan.yml` | PR → main/master | < 5 min | Yes (required status check) | Gitleaks found a potential secret in the PR diff; rotate before merging |
| **Secret Scan — Scheduled** | `secret-scan-scheduled.yml` | Daily @ 06:17 UTC, push to workflow file | 5–10 min | Advisory — opens issue | Gitleaks found a potential secret in full default-branch history; follow `ops/github/secret-scanning-runbook.md` |
| **Dependency Review** | `dependency-review.yml` | PR → main/master | < 2 min | Yes | A new dependency introduces a high/critical CVE or a denied license (GPL-3.0, AGPL-3.0) |
| **Commitlint** | `commitlint.yml` | PR → main/master, `workflow_dispatch` | < 2 min | Advisory | A commit message in the PR does not follow Conventional Commits |
| **README QA** | `readme-qa.yml` | Push/PR → main/master (paths-filtered), `workflow_dispatch` | 2–5 min | Advisory | README images, badge workflows, portfolio table, or profile README assets are out of sync |
| **API Spec Drift** | `api-spec-drift.yml` | Push/PR → main/master, `workflow_dispatch` | 2–5 min | Yes | An Express route file is missing from `lib/api-spec/openapi.yaml` or vice versa |
| **PRAXIS Visual Regression** | `nexus-visual-regression.yml` | PR → main/master, `workflow_dispatch` | 10–20 min | Advisory | Visual diff between current build and baseline screenshots for PRAXIS catalog |
| **Verify Source-of-Truth** | `verify-source-of-truth.yml` | Push/PR → main/master (paths-filtered), `workflow_dispatch` | < 5 min | Advisory | `audit/verify.sh` detected drift between `audit/source-of-truth.json` and codebase metrics |
| **Nightly Smoke** | `nightly-smoke.yml` | Daily @ 03:30 UTC, `workflow_dispatch` | 5–10 min | Advisory — Slack alert | DOMAINE diligence lifecycle smoke test failed; posts to Slack if `SLACK_WEBHOOK_URL` is set |
| **Operational Audit** | `operational-audit.yml` | `workflow_dispatch` only | 5–15 min | N/A | Smoke, URL crawl, or stress test against a target URL failed |
| **Uptime Monitor** | `uptime-monitor.yml` | Every 5 min, `workflow_dispatch` | < 2 min | N/A — opens issue + Slack | `/api/health/live` returned non-200; opens a GitHub issue and alerts Slack |
| **Database Backup** | `backup.yml` | Daily @ 02:00 UTC, `workflow_dispatch` | 5–15 min | Advisory | pg_dump or remote upload to Azure Blob failed; check `backup_manifest.json` artifact |
| **Release** | `release.yml` | Push → main/master, `workflow_dispatch` | 2–5 min | Advisory | Tag/changelog creation failed; may need manual `git push` if the bot commit was blocked |
| **Deploy — Staging** | `deploy-staging.yml` | Push → main/master | < 2 min | Advisory | `REPLIT_STAGING_DEPLOY_TOKEN` missing or Replit API returned an error |
| **Deploy — Production** | `deploy-production.yml` | GitHub Release published, `workflow_dispatch` | < 2 min | Advisory | `REPLIT_DEPLOY_TOKEN` missing or Replit API returned an error |
| **Container Publish** | `container-publish.yml` | GitHub Release published, push `v*.*.*` tag, `workflow_dispatch` | 15–30 min | Advisory | Docker build or push to GHCR failed for one of the 6 services |
| **npm Publish** | `npm-publish.yml` | GitHub Release published, push `v*.*.*` tag, `workflow_dispatch` | 10–20 min | Advisory | One or more `@szl-holdings/*` packages failed to publish to GitHub Packages |

---

## Required Secrets

| Secret | Used by | Owner action needed |
|---|---|---|
| `INTEGRATION_TEST_TOKEN` | `ci.yml` (integration tests), `nightly-smoke.yml` | Rotate when compromised; see `ops/github/secret-scanning-runbook.md` |
| `SLACK_WEBHOOK_URL` | `uptime-monitor.yml`, `nightly-smoke.yml` | Set in repo Secrets to enable Slack alerts |
| `DATABASE_URL` | `backup.yml` | Production DB URL; must be set for backup to run |
| `AZURE_STORAGE_*` | `backup.yml` | Azure Blob credentials; without these, backups are artifact-only (7-day retention) |
| `REPLIT_STAGING_DEPLOY_TOKEN` / `REPLIT_STAGING_APP_ID` | `deploy-staging.yml` | Set in the `staging` environment to enable automated staging deploys |
| `REPLIT_DEPLOY_TOKEN` / `REPLIT_APP_ID` | `deploy-production.yml` | Set in the `production` environment to enable automated production deploys |

---

## Owner-Action Items (not changeable by PR)

- **Branch protection**: `secret-scan.yml` (`gitleaks-pr`) should be registered as a required status check in branch protection settings (Settings → Branches → Require status checks).
- **GitHub Team plan**: Deployment approval gates on the `production` environment require GitHub Team or higher. Currently unenforced.
- **Uptime monitor frequency**: The `*/5 * * * *` cron in `uptime-monitor.yml` is the GitHub Actions minimum interval; no further reduction is possible without an external uptime service.
- **GHCR org packages**: Container images publish to `ghcr.io/szl-holdings/*` — requires the `szl-holdings` org to have GHCR enabled and the repo to have `packages: write` permission granted.

---

## Caching Strategy

| Cache | Scope | Key |
|---|---|---|
| pnpm store | All Node.js jobs | Built into `actions/setup-node` via `cache: 'pnpm'` |
| `node_modules` | All Node.js jobs (secondary) | `${{ runner.os }}-node-modules-${{ hashFiles('pnpm-lock.yaml') }}` |
| Playwright browsers | e2e.yml, a11y.yml, nexus-visual-regression.yml | `playwright-chromium-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}` |
| Docker layer cache | container-publish.yml | GitHub Actions cache backend, scoped per service |
