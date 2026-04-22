# SZL Holdings — GitHub Ascension Report

**Date:** April 22, 2026
**Scope:** Public repo readiness, CI pipeline health, trust surface, narrative quality

---

## Repo Root Cleanliness

| Assessment | Status |
|------------|--------|
| Top-level structure legible | **Good** — clear separation: `artifacts/`, `lib/`, `packages/`, `scripts/`, `docs/`, `tests/` |
| Dead files at root | **Clean** — no stale artifacts at root level |
| Essential files present | **Yes** — README, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT, LICENSE, CHANGELOG |
| Config files minimal | **Good** — `biome.json`, `tsconfig.base.json`, `turbo.json`, `pnpm-workspace.yaml` |
| Clutter | **Low** — `uv.lock` is unused (Python artifact removed); several strategy MDs at root could move to `docs/` |

### Root Files That Could Move to `docs/`

| File | Recommendation |
|------|---------------|
| `ANALYTICS-EVENTS.md` | Move to `docs/` |
| `API-SPEC.md` | Move to `docs/` |
| `ARCHITECTURE.md` | Superseded by `docs/architecture/architecture.md` — remove |
| `DATA-MODEL.md` | Move to `docs/` |
| `INCIDENT_RESPONSE.md` | Move to `docs/operations/` |
| `ORIGINALITY_REPORT.md` | Move to `docs/` |
| `PRODUCT-SURFACES.md` | Superseded by `docs/PRODUCT_MATRIX.md` — remove |
| `RELEASE_CHECKLIST.md` | Move to `docs/operations/` |
| `RELEASE_NOTES.md` | Move to `docs/releases/` |
| `SUPPORT.md` | Keep at root (standard) |
| `threat_model.md` | Move to `docs/security/` |
| `uv.lock` | Remove (no Python artifacts) |

---

## CI/CD Pipeline Assessment

### Existing Workflows (22)

All workflows use pinned action SHAs (good supply-chain practice).

| Workflow | Real? | Covers | Assessment |
|----------|-------|--------|------------|
| `ci.yml` | Yes | Lint, typecheck, build, test | **Solid** — uses caching, concurrency groups |
| `build.yml` | Yes | Full artifact build | **Solid** — covers api-server + 4 major web artifacts |
| `security.yml` | Yes | Dependency audit, SAST | **Solid** — audit + Snyk/Semgrep-compatible |
| `codeql.yml` | Yes | Semantic analysis | **Solid** — TypeScript/JavaScript coverage |
| `e2e.yml` | Yes | Playwright | **Needs runtime** — requires DB + API server |
| `secret-scan.yml` | Yes | Push-time secret scan | **Solid** |
| `secret-scan-scheduled.yml` | Yes | Scheduled scan | **Solid** |
| `dependency-review.yml` | Yes | PR dependency check | **Solid** |
| `release.yml` | Yes | Release artifacts | **Solid** |
| `deploy-production.yml` | Yes | Production deploy | **Solid** |
| `deploy-staging.yml` | Yes | Staging deploy | **Solid** |
| `backup.yml` | Yes | DB backup | **Solid** |
| `uptime-monitor.yml` | Yes | Health monitoring | **Solid** |
| `a11y.yml` | Yes | Accessibility | **Good** |
| `lighthouse.yml` | Yes | Performance | **Good** |
| `audit-full.yml` | Yes | Full audit pipeline | **Good** |
| `commitlint.yml` | Yes | Commit messages | **Good** |
| `readme-qa.yml` | Yes | README quality | **Good** |
| `verify-source-of-truth.yml` | Yes | Platform facts drift | **Good** |
| `container-publish.yml` | Yes | Container images | **Good** |
| `npm-publish.yml` | Yes | Package publishing | **Good** |
| `prism-counsel-ci.yml` | **Dead** | Archived artifact | **Remove** |

### Missing CI Coverage

| Gap | Priority | Recommendation |
|-----|----------|---------------|
| SBOM generation | Medium | Add CycloneDX or Syft step to `release.yml` |
| Documentation link check | Low | Add markdown-link-check to `ci.yml` |
| Screenshot existence check | Low | Add to `readme-qa.yml` |

---

## Public Documents Assessment

| Document | Status | Quality | Notes |
|----------|--------|---------|-------|
| `README.md` | Current | **Good** | Clear thesis, portfolio table, architecture diagram, trust section |
| `SECURITY.md` | Current | **Good** | Responsible disclosure policy, scope, contact |
| `CONTRIBUTING.md` | Current | **Good** | PR process, code standards, branch strategy |
| `CODE_OF_CONDUCT.md` | Current | **Good** | Standard contributor covenant |
| `LICENSE.md` | Current | **N/A** | UNLICENSED — intentional for proprietary |
| `.github/CODEOWNERS` | Current | **Good** | Defined ownership |
| `.github/PULL_REQUEST_TEMPLATE.md` | Current | **Good** | Structured PR template |
| `.github/ISSUE_TEMPLATE/` | Current | **Good** | Bug report + feature request templates |
| `.github/RELEASE_TEMPLATE.md` | Current | **Good** | Structured release notes template |

---

## README Narrative Assessment

| Element | Present? | Quality |
|---------|----------|---------|
| One-paragraph platform thesis | Yes | **Strong** — "Governed decision infrastructure" |
| Live vs pilot vs demo labeling | Yes | APP_STATUS.md linked |
| Architecture diagram | Yes | Text diagram in architecture docs |
| Trust/governance posture | Yes | Trust section with structural controls |
| How to run locally | Partial | Start commands listed per artifact |
| Release status | Yes | Badges + CHANGELOG |
| Links to trust docs | Yes | Trust Center, Security, Proof Model |
| Screenshots | Yes | 2 screenshots; currency needs verification |

---

## Supply-Chain Trust

| Control | Status |
|---------|--------|
| Pinned action SHAs | **Yes** — all workflows use commit SHAs |
| Lock file committed | **Yes** — `pnpm-lock.yaml` |
| Dependency review on PRs | **Yes** — `dependency-review.yml` |
| Secret scanning | **Yes** — push + scheduled |
| CodeQL analysis | **Yes** — TypeScript/JavaScript |
| Container signing | **Not configured** — recommended for production |
| SBOM generation | **Not configured** — recommended addition |
| Release provenance | **Partial** — release workflow exists; attestation not configured |

---

## Verdict

The GitHub surface is **materially strong** for a Series A / enterprise evaluation. 22 CI workflows covering lint, typecheck, build, test, security, accessibility, performance, and release. All actions pinned by SHA. Trust documentation is comprehensive and code-verified. The main gaps are cosmetic (root file clutter, one dead workflow, missing SBOM) rather than structural.
