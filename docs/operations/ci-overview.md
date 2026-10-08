# CI Overview

Last updated: 2026-10-06.

This is a source-derived overview of `.github/workflows/`, not a hosted-run
receipt. The current tree contains **47** tracked workflow YAML files. A workflow
being present proves only that the configuration exists at this revision;
successful execution, secret availability, deployment, and live enforcement
require separate evidence.

## Evidence labels

- **Source-declared** — parsed from the workflow YAML in this checkout.
- **Live-required (observed)** — returned by an authenticated read of the
  Platform repository ruleset on 2026-10-06.
- **Hosted result** — a conclusion for one exact GitHub Actions run and SHA. No
  hosted result is inferred in this document.

## Promotion-relevant workflows

| Workflow | Source-declared triggers | Gate or job | Live-required at observation? | Scope |
|---|---|---|---|---|
| `ci.yml` | PR to `main`/`master`, push to `main`, manual | Clean clone (Linux/Windows), Lint, Typecheck | No | Clone invariants and static checks; there is no `CI Gate` or readiness job in this file |
| `build.yml` | PR/push to `main`/`master`, manual | `Build All Artifacts` | No | Frozen install and canonical full-workspace build |
| `e2e.yml` | PR/push to `main`/`master`, manual | `E2E Gate` | **Yes** | Playwright matrix for A11oy and Carlota Jo; not every repository surface |
| `a11y.yml` | PR/push to `main`/`master`, manual | `A11y Gate` | No | axe WCAG 2.1 AA matrix across six named artifacts |
| `lighthouse.yml` | PR/push to `main`/`master`, manual | `Lighthouse Gate (accessibility enforced)` | No | Six-artifact matrix; accessibility is enforced, other categories are advisory |
| `audit-full.yml` | PR/push to `main`/`master`, manual | `Runtime Audit (audit:full)` | **Yes** | Full audit pipeline with real local smoke targets; 60-minute timeout |
| `codeql.yml` | PR/push to `main`, weekly, manual | `severity-gate` | **Yes** | JavaScript/TypeScript and Python analysis; exact synthetic PR-merge-ref High/Critical gate |
| `security.yml` | PR/push to `main`, Mondays 03:00 UTC, manual | `Security Gate (blocking)` | **Yes** | pnpm audit, SBOM, Gitleaks, project secret scan, lockfile integrity, and license report |
| `trivy.yml` | PR/push to `main`, Mondays 06:00 UTC | `Grype filesystem/SCA gate (fail on HIGH/CRITICAL)` | No | Trivy SARIF plus raw, digest-sealed Grype evidence and fail-closed local-patch admission |
| `repro-check.yml` | PR, Mondays 04:17 UTC, manual | `repro` | No | Two clean, forced builds of one candidate SHA with complete path-and-byte manifest comparison |
| `lockfile-registry.yml` | PR/push to `main`, manual | reusable `lockfiles` check | **Yes** | Rejects Replit-internal registry references in lockfiles |
| `dependency-review.yml` | PR to `main` | `Review dependency changes` | No | Blocks newly introduced High/Critical dependencies and configured denied licenses when run |
| `source-of-truth.yml` | path-filtered PR/push to `main`, daily, manual | canonical validator | No | Current-tree metrics and documentation; scheduled/manual Hugging Face comparison is advisory |

“No” means the context was not in the dated live-required list. It does not
mean the workflow is disabled or unimportant.

## Dated live ruleset observation

An authenticated 2026-10-06 read of Platform ruleset `Protect main -
solo-builder exact-head` (repository ruleset ID `22286649`) observed these five
required contexts. The sanitized configuration receipt is
[`audit/evidence/github-platform-ruleset-summary-2026-10-06.json`](../../audit/evidence/github-platform-ruleset-summary-2026-10-06.json):

- `Runtime Audit (audit:full)`
- `Security Gate (blocking)`
- `E2E Gate`
- `severity-gate`
- `lockfiles / No lockfile references a Replit-internal registry host`

The ruleset required a pull request and conversation resolution, with zero
approving reviews configured and no approval of the last reviewable push. It
allowed squash merge only and prohibited deletion and non-fast-forward updates;
no bypass actor was configured. This is a repository-scoped, dated observation,
not an organization-wide claim. Organization-ruleset detail remained
unavailable to the caller, and any later ruleset mutation requires a fresh
readback before this list is represented as current.

## Release and deployment boundary

- `release.yml` runs on created/published releases or manual dispatch and
  produces SBOM/provenance attestations. It does not create a release from a
  push to `main`.
- `npm-publish.yml` publishes to GitHub Packages on a published release,
  version tag, or manual dispatch. `npm-public-publish.yml` is a separately
  confirmed manual public-publication path.
- `deploy-staging.yml` is a best-effort staging trigger on pushes to
  `main`/`master`; missing credentials skip it and remote API errors are
  warnings. It is not production-deployment evidence.
- No current workflow named `deploy-production.yml` or
  `container-publish.yml` exists in this tree.

## Credential boundary

Workflow source references credentials including GitHub, npm, Hugging Face,
staging deployment, signing, observability, wake-receipt, and notification
secrets. Source references do not establish that any value is configured,
valid, scoped correctly, or available to a pull request. Verify repository and
environment bindings without placing secret values in documentation.

## Caching observed in source

| Cache | Workflows |
|---|---|
| pnpm store via `actions/setup-node` | Selected Node workflows, including CI, build, tests, audit, security, and reproducibility |
| Playwright Chromium | `e2e.yml`, `a11y.yml`, and `post-deploy-smoke.yml` |

No general `node_modules` cache is declared in the current workflows.
