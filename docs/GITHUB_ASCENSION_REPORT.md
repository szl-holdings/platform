# SZL Holdings — GitHub Ascension Report

**Date:** April 28, 2026  
**Scope:** Public repo readiness, CI pipeline health, trust surface, narrative quality  
**Prior report:** April 22, 2026

---

## Repo Root Cleanliness

| Assessment | Status |
|------------|--------|
| Top-level structure legible | **Good** — clear separation: `artifacts/`, `lib/`, `packages/`, `scripts/`, `docs/`, `tests/` |
| Dead files at root | **Clean** — no stale artifacts at root level |
| Essential files present | **Yes** — README, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT, LICENSE, CHANGELOG |
| Config files minimal | **Good** — `biome.json`, `tsconfig.base.json`, `turbo.json`, `pnpm-workspace.yaml` |
| Clutter | **Low** — several strategy MDs at root could move to `docs/` (tracked below) |

### Root Files That Could Move to `docs/`

| File | Recommendation |
|------|---------------|
| `ANALYTICS-EVENTS.md` | Move to `docs/` |
| `API-SPEC.md` | Move to `docs/` |
| `ARCHITECTURE.md` | Superseded by `docs/architecture/architecture.md` — remove |
| `DATA-MODEL.md` | Move to `docs/` |
| `INCIDENT_RESPONSE.md` | Move to `docs/operations/` |
| `ORIGINALITY_REPORT.md` | Move to `docs/` |
| `PRODUCT-SURFACES.md` | Canonical version now at `docs/PRODUCT_SURFACES.md` — root version can be a redirect stub |
| `RELEASE_CHECKLIST.md` | Move to `docs/operations/` |
| `RELEASE_NOTES.md` | Move to `docs/releases/` |
| `SUPPORT.md` | Keep at root (standard GitHub convention) |
| `threat_model.md` | Move to `docs/security/` |

---

## CI/CD Pipeline Assessment

### Current Workflow Inventory (25 per `generated/platform-metrics.json`; 28 files on disk)

All workflows use pinned action SHAs (supply-chain hardening — enforced by `pin-check` job in `ci.yml`).

| Workflow | File | Covers | Assessment |
|----------|------|--------|------------|
| CI | `ci.yml` | Lint, typecheck, build, test, integration tests, security matrix, brand strings, env coverage, design tokens, API spec drift, SHA pin check, agent eval gate | **Solid** — 17-job pipeline with `CI Gate` rollup job |
| Build | `build.yml` | Full artifact build per-app | **Solid** — explicit per-artifact build gates |
| Security | `security.yml` | Dependency audit, SAST | **Solid** — `pnpm audit` + dependency review |
| CodeQL | `codeql.yml` | Semantic SAST — TypeScript/JavaScript | **Solid** — weekly schedule (Mondays) + `workflow_dispatch` |
| E2E | `e2e.yml` | Playwright end-to-end | **Needs runtime** — requires DB + API server in CI |
| Secret Scan (PR) | `secret-scan.yml` | Gitleaks PR-diff scan — required status check, blocks merge | **Solid** |
| Secret Scan (scheduled) | `secret-scan-scheduled.yml` | Nightly full-repo Gitleaks scan | **Solid** |
| Dependency Review | `dependency-review.yml` | PR-level new CVE blocking | **Solid** |
| Dependabot Auto-merge | `dependabot-auto-merge.yml` | Auto-merges patch Dependabot PRs that pass CI | **Good** |
| Release | `release.yml` | Semver tagging, changelog generation | **Solid** |
| Deploy Production | `deploy-production.yml` | Production deployment | **Solid** |
| Deploy Staging | `deploy-staging.yml` | Staging deployment | **Solid** |
| Post-Deploy Smoke | `post-deploy-smoke.yml` | Post-deployment health verification | **Solid** |
| Nightly Smoke | `nightly-smoke.yml` | Nightly regression smoke test | **Solid** |
| Backup | `backup.yml` | Database backup | **Solid** |
| Uptime Monitor | `uptime-monitor.yml` | Service health monitoring | **Solid** |
| Accessibility | `a11y.yml` | Accessibility audit | **Good** |
| Lighthouse | `lighthouse.yml` | Performance audit | **Good** |
| Audit Full | `audit-full.yml` | Full audit pipeline | **Good** |
| Commitlint | `commitlint.yml` | Conventional commit enforcement | **Good** |
| README QA | `readme-qa.yml` | README asset validation, portfolio table sync | **Good** |
| Verify Source of Truth | `verify-source-of-truth.yml` | Platform facts drift detection | **Good** |
| API Spec Drift | `api-spec-drift.yml` | OpenAPI spec vs route implementation | **Good** |
| Container Publish | `container-publish.yml` | Container image publishing | **Good** |
| npm Publish | `npm-publish.yml` | Package publishing | **Good** |
| Eval Gate | `eval-gate.yml` | AI agent evaluation gate | **Good** |
| Nexus Visual Regression | `nexus-visual-regression.yml` | Visual regression tests | **Good** |
| Operational Audit | `operational-audit.yml` | Operational posture audit | **Good** |

### CI Coverage Gaps

| Gap | Priority | Status |
|-----|----------|--------|
| SBOM release attachment | Medium | SBOM generated weekly (`security.yml` → `security/sbom-latest.json`, 90-day CI artifact); not yet attached to GitHub release artifacts |
| Documentation link check | Low | **Added** — `doc-link-check` advisory job in `ci.yml` (emits warnings, does not block) |
| Container signing | Low | Not configured — Cosign integration planned |
| SLSA provenance attestation | Low | Not configured — planned after SBOM |

---

## Public Documents Assessment

| Document | Status | Quality | Notes |
|----------|--------|---------|-------|
| `README.md` | Current | **Good** | Clear thesis, portfolio table, architecture diagram, trust section |
| `SECURITY.md` | Current | **Good** | Responsible disclosure policy, scope, severity SLA, security architecture |
| `CONTRIBUTING.md` | Current | **Good** | PR process, code standards, branch strategy, security requirements |
| `CODE_OF_CONDUCT.md` | Current | **Good** | Standard contributor covenant |
| `LICENSE.md` | Current | **N/A** | UNLICENSED — intentional for proprietary |
| `SUPPORT.md` | Current | **Good** | Support tiers by relationship type |
| `RELEASE_TRUST_PACK.md` | **New** | **Good** | Bundles CI, security, supply-chain evidence |
| `.github/CODEOWNERS` | Current | **Good** | Defined ownership |
| `.github/PULL_REQUEST_TEMPLATE.md` | Current | **Good** | Structured PR template |
| `.github/ISSUE_TEMPLATE/` | Current | **Good** | Bug report + feature request templates |
| `.github/RELEASE_TEMPLATE.md` | Current | **Good** | Structured release notes template |

### Trust Documentation Suite

| Document | Location | Status |
|----------|----------|--------|
| Trust Center (engineering) | `docs/trust-center.md` | Current — code-verified, status labels |
| Trust Center (overview) | `docs/TRUST_CENTER.md` | Current |
| Security Posture | `docs/security-posture.md` | Current — VERIFIED/PARTIALLY VERIFIED/UNVERIFIED labels |
| Release Governance | `docs/RELEASE_GOVERNANCE.md` | Current |
| Provenance & Attestation | `docs/PROVENANCE_AND_ATTESTATION.md` | **New** — supply-chain posture |
| Platform Metrics | `docs/PLATFORM_METRICS.md` | **New** — sourced from `generated/platform-metrics.json` |
| Product Surfaces | `docs/PRODUCT_SURFACES.md` | **New** — full surface inventory |

---

## README Narrative Assessment

| Element | Present? | Quality |
|---------|----------|---------|
| One-paragraph platform thesis | Yes | **Strong** — "Governed decision infrastructure" |
| Live vs pilot vs demo labelling | Yes | APP_STATUS.md linked |
| Architecture diagram | Yes | Text diagram in architecture docs |
| Trust/governance posture | Yes | Trust section with structural controls |
| How to run locally | Partial | Start commands listed per artifact |
| Release status | Yes | Badges + CHANGELOG |
| Links to trust docs | Yes | Trust Center, Security, Proof Model |
| Screenshots | Yes | 2 screenshots; currency needs verification (screenshot task separate) |

---

## Supply-Chain Trust

| Control | Status |
|---------|--------|
| Pinned action SHAs | **Yes** — all workflows SHA-pinned; enforced by `pin-check` CI job |
| Lock file committed | **Yes** — `pnpm-lock.yaml` |
| Dependency review on PRs | **Yes** — `dependency-review.yml` |
| Dependabot auto-merge | **Yes** — patch-level updates auto-merged if CI passes |
| Secret scanning | **Yes** — PR gate (`secret-scan.yml`) + weekly scheduled scans (`secret-scan-scheduled.yml`, `security.yml`) |
| CodeQL analysis | **Yes** — TypeScript/JavaScript |
| Container signing | **Not configured** — Cosign integration planned |
| SBOM generation | **Active** — weekly CI artifact (`security/sbom-latest.json`, 90-day retention via `security.yml`) — not yet release-attached |
| Release provenance | **Partial** — release workflow exists; SLSA attestation not configured |

---

## Platform Scale (Source: `generated/platform-metrics.json`, 2026-04-27)

| Metric | Count |
|--------|-------|
| TS + TSX files | 6,235 |
| Packages (lib + standalone) | 152 |
| API route files | 180 |
| API route handlers | 6,063 |
| DB table definitions | 1,047 |
| SQL migrations | 59 |
| Test files | 387 |
| CI workflows | 25 (source: `generated/platform-metrics.json`) |
| Platform primitives implemented | 12 / 12 |

---

## Verdict

The GitHub surface is **materially strong** for a growth capital / enterprise evaluation. 25 CI workflows (per `generated/platform-metrics.json`; 28 workflow files on disk) covering lint, typecheck, build, test, security, accessibility, performance, release, and deployment. All actions SHA-pinned and enforced by a `pin-check` CI gate. SBOM is generated weekly (`security.yml` CI artifact). Trust documentation is comprehensive and includes code-verified status labels. The trust documentation suite has been expanded with Provenance & Attestation, Platform Metrics, and Product Surfaces docs. The main remaining gaps (SBOM release-attachment to tags, container signing, SLSA attestation) are operational rather than structural, and are disclosed.

**Changes since April 22 report:**
- Workflow count: prior report cited 22; `generated/platform-metrics.json` (April 27) counts 25. Additional workflow files on disk include `dependabot-auto-merge`, `eval-gate`, `nexus-visual-regression`, `nightly-smoke`, `operational-audit`, `post-deploy-smoke`, `api-spec-drift` (added since the prior report)
- `prism-counsel-ci.yml` dead workflow has been removed
- Documentation link check added: `doc-link-check` advisory job added to `ci.yml`
- Trust documentation suite expanded: `RELEASE_TRUST_PACK.md`, `docs/PROVENANCE_AND_ATTESTATION.md`, `docs/PLATFORM_METRICS.md`, `docs/PRODUCT_SURFACES.md` created
- `pin-check` job added to CI — SHA-pinning now enforced automatically
