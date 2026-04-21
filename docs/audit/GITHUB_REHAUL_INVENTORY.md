# GitHub Rehaul — Repository Inventory

> Series A readiness audit · April 2026 · Phase 1 of 11

---

## 1. Root Directory Inventory

### Files at root — canonical set (keep)

| File | Status | Notes |
|------|--------|-------|
| `README.md` | Keep | Main public-facing README — Series A quality |
| `CHANGELOG.md` | Keep | Conventional-commits format, up to date |
| `CONTRIBUTING.md` | Keep | Proprietary contribution policy |
| `CODE_OF_CONDUCT.md` | Keep | Contributor Covenant, professional framing |
| `LICENSE.md` | Keep | Proprietary/UNLICENSED |
| `SECURITY.md` | Keep | Responsible disclosure policy |
| `SECURITY-CHECKLIST.md` | Keep | Security controls checklist |
| `.gitignore` | Keep | Comprehensive — covers secrets, binaries, generated output |
| `.gitleaks.toml` | Keep | Secret scanning configuration |
| `.gitattributes` | Keep | LFS and line-ending rules |
| `biome.json` | Keep | Linter/formatter config |
| `playwright.config.ts` | Keep | E2E test config |
| `package.json` | Keep | Root workspace scripts and metadata |
| `pnpm-workspace.yaml` | Keep | pnpm monorepo workspace config |
| `pnpm-lock.yaml` | Keep | Lock file |
| `pyproject.toml` | Evaluate | Python build config for `build_carousel.py` |
| `docker-compose.yml` | Move | Developer utility — move to `ops/local/` |
| `.lighthouserc.json` | Keep | Lighthouse CI thresholds |
| `.npmrc` | Keep | pnpm config |
| `.nvmrc` / `.node-version` | Keep | Node version pinning |
| `.oxlintrc.json` | Keep | Linter config |
| `replit.md` | Keep | Replit environment documentation |
| `replit.nix` | Keep | Nix environment config |
| `.replit` | Keep | Replit runtime config |
| `GITHUB_SETTINGS_APPLIED.json` | Move | Move to `docs/github/GITHUB_SETTINGS_APPLIED.json` |

### Root files — redirect stubs (keep-as-is, these are intentional redirects)

| File | Canonical Location |
|------|--------------------|
| `ACCESS-CONTROL-MATRIX.md` | `docs/security/access-control-matrix.md` |
| `DEPLOYMENT-GUIDE.md` | `docs/operations/deployment-guide.md` |
| `KNOWN-GAPS.md` | `docs/operations/known-gaps.md` |
| `PLATFORM_PRIMITIVES.md` | `docs/architecture/platform-primitives.md` |
| `OPERATIONS-RUNBOOK.md` | `docs/operations/operations-runbook.md` |
| `INCIDENT_RESPONSE.md` | `docs/operations/operations-runbook.md` |

### Root files — noise / accidental / large binaries (action required)

| File / Dir | Issue | Action |
|-----------|-------|--------|
| `nohup.out` | Runtime log artifact — empty | **REMOVED** (already deleted) |
| `01-thursday-intro.zip` | Large binary archive | In `.gitignore`; confirm untracked |
| `02-sunday-deep-dive.zip` | Large binary archive | In `.gitignore`; confirm untracked |
| `03-monday-operator-lens.zip` | Large binary archive | In `.gitignore`; confirm untracked |
| `LINKEDIN-LAUNCH.zip` | 12 MB binary archive | In `.gitignore`; confirm untracked |
| `LINKEDIN-LAUNCH/` | LinkedIn launch assets | Social content; quarantine |
| `launch-shots/` | Old screenshots | Superseded by `docs/assets/screenshots/` |
| `build_carousel.py` | Python image builder | Move to `scripts/media/` |
| `build_video.sh` | Video build script | Move to `scripts/media/` |

---

## 2. Key Directories Inventory

| Directory | Purpose | Status |
|-----------|---------|--------|
| `artifacts/` | All deployable surfaces | Active — 13 registered artifacts |
| `lib/` | Shared libraries and platform primitives | Active — 16+ packages |
| `packages/` | Config, registry, metrics | Active |
| `scripts/` | QA, seed, build, media scripts | Active |
| `docs/` | All documentation | Active — extensive |
| `ops/` | Infrastructure, runbooks, mobile | Active |
| `infra/` | Azure Bicep IaC | Active |
| `.github/` | CI/CD, issue templates, CODEOWNERS | Active |
| `archive/` | Archived materials | See matrix |
| `.archive/` | Internal archive (gitignored) | Quarantined |
| `.mirror-staging-test/` | Mirror validation (gitignored) | Quarantined |
| `.github-private/` | Private docs (gitignored) | Quarantined |
| `attached_assets/` | User payload dumps (gitignored) | Quarantined |
| `launch-shots/` | Old screenshot assets | Superseded |
| `LINKEDIN-LAUNCH/` | LinkedIn launch content | Social content |
| `demo-assets/` | Demo PDFs and assets | Some gitignored |
| `content/` | Content assets | Evaluate |
| `deliverables/` | Generated deliverables (gitignored) | Quarantined |
| `output/` | Generated output (gitignored) | Quarantined |
| `backups/` | Database backups (gitignored) | Quarantined |
| `analytics/` | Analytics scripts | Minor |
| `elite-layer/` | Unknown | Evaluate |
| `exports/` | Exported assets (gitignored) | Quarantined |
| `integrations/` | Integration configs | Minor |
| `media/` | Media assets | Evaluate |
| `profile-readme/` | Profile README source | Used by `.github/profile/` |
| `playwright-report/` | E2E reports (gitignored) | Quarantined |

---

## 3. GitHub-Native Trust Files Inventory

| File | Status |
|------|--------|
| `SECURITY.md` | ✅ Present |
| `CODE_OF_CONDUCT.md` | ✅ Present |
| `CONTRIBUTING.md` | ✅ Present |
| `LICENSE.md` | ✅ Present |
| `SUPPORT.md` | ⚠️ Missing — **Created this pass** |
| `.github/CODEOWNERS` | ✅ Present |
| `.github/PULL_REQUEST_TEMPLATE.md` | ✅ Present |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | ✅ Present |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | ✅ Present |
| `.github/ISSUE_TEMPLATE/security_report.md` | ✅ Present |
| `.github/ISSUE_TEMPLATE/config.yml` | ✅ Present |
| `.github/dependabot.yml` | ✅ Present |
| `.github/workflows/codeql.yml` | ✅ Present |
| `.github/workflows/ci.yml` | ✅ Present |
| `.github/workflows/security.yml` | ✅ Present |
| `.github/workflows/release.yml` | ✅ Present |
| `.github/BRANCH_PROTECTION.md` | ✅ Present |
| `RELEASE_CHECKLIST.md` | ⚠️ Missing — **Created this pass** |
| `.gitleaks.toml` | ✅ Present |

---

## 4. CI/CD Workflow Inventory

| Workflow | File | Purpose |
|----------|------|---------|
| CI | `ci.yml` | Lint, typecheck, test, build, smoke |
| CodeQL | `codeql.yml` | SAST security analysis |
| Security Audit | `security.yml` | Dependency and secret audit |
| Release | `release.yml` | Semantic versioning and GitHub Release |
| Deploy Staging | `deploy-staging.yml` | Auto-deploy to staging on main push |
| Deploy Production | `deploy-production.yml` | Production deploy on release |
| E2E | `e2e.yml` | Playwright end-to-end tests |
| Lighthouse | `lighthouse.yml` | Performance CI |
| Dependency Review | `dependency-review.yml` | Vulnerability scan on PRs |
| Backup | `backup.yml` | Database backup |
| README QA | `readme-qa.yml` | README asset validation |
| Secret Scan Scheduled | `secret-scan-scheduled.yml` | Scheduled gitleaks run |
| Uptime Monitor | `uptime-monitor.yml` | Production uptime check |

---

## 5. Screenshot / Visual Asset Inventory

| Location | Contents | Status |
|---------|---------|--------|
| `assets/readme/` | README product screenshots | Partially current |
| `launch-shots/` | Launch-day marketing shots | Superseded |
| `LINKEDIN-LAUNCH/images/` | LinkedIn image assets | Social content, not README |
| `docs/assets/screenshots/current/` | **New canonical location** | Created this pass |
| `docs/assets/screenshots/archive/` | **Archive for retired shots** | Created this pass |

---

*Generated: April 21, 2026 — Series A GitHub Rehaul*
