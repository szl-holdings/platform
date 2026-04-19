# Branch Rulesets and Protections — SZL Holdings Platform

Last updated: 2026-04-19

> **Resolved (2026-04-19):** Repository was made **public** to unlock the branch protection API (alternative to the GitHub Team upgrade). Branch protection is now active on both `main` and `master` with all five required status checks. The repo is owned by the `szl-holdings` organization (the earlier `stephenlutar2-hash` reference was incorrect and has been fixed throughout this directory).

This document defines the exact branch protection and ruleset configuration required for the repository. It pairs with `/ops/github/manual-click-paths.md` which provides the step-by-step GitHub UI instructions.

---

## Configuration Status

| Item | Status | Notes |
|------|--------|-------|
| `codeql.yml` workflow | **Done** | Runs on every PR; job name `analyze` |
| `dependency-review.yml` workflow | **Done** | Runs on every PR; fails on high/critical CVE |
| Branch protection on `main` | **Done** | Applied 2026-04-19 via REST API (equivalent of `configure-branch-protection.sh`) |
| Branch protection on `master` | **Done** | Applied 2026-04-19 — all six required checks active |
| `CodeQL Analysis / analyze` as required check | **Done** | Listed in required contexts on both branches |
| `Dependency Review` as required check | **Done** | Listed in required contexts on both branches |
| `Security Audit & SBOM / Security Gate (blocking)` as required check | **Done** | Listed in required contexts on both branches |

### Verification evidence (2026-04-19)

`GET /repos/szl-holdings/szl-holdings-platform/branches/{main,master}/protection` returned identical config on both branches:

- `required_status_checks.strict: true`
- `required_status_checks.contexts: ["CI Gate","E2E Gate","Lighthouse Gate","CodeQL Analysis / analyze","Dependency Review","Security Audit & SBOM / Security Gate (blocking)"]`
- `enforce_admins.enabled: true`
- `required_pull_request_reviews.required_approving_review_count: 1`
- `required_pull_request_reviews.require_code_owner_reviews: true`
- `allow_force_pushes: false`, `allow_deletions: false`, `required_conversation_resolution: true`

> **How it was unblocked:** Repository visibility was changed from private to **public**. This is the no-cost alternative to upgrading the org to GitHub Team — both unlock the branch protection API. If the repo needs to be made private again later, the org must first be upgraded to GitHub Team or the protection rules will become unenforceable.

---

## Target Branch: `main` (and `master` if present)

Both `main` and `master` should have identical protection rules applied. The canonical default branch is `main`; `master` is kept for legacy compatibility.

---

## Required Ruleset Configuration

### Ruleset Name: `main-protection`

| Setting | Value | Rationale |
|---------|-------|-----------|
| Enforcement status | **Active** | Always enforced |
| Target branches | `main`, `master` | Both trunk branches |
| Restrict deletions | **On** | Prevent accidental branch deletion |
| Require linear history | **Off** | Allow merge commits for release branches |
| Require signed commits | **Off** (recommended to enable later) | Enables commit provenance |
| Require a pull request before merging | **On** | No direct commits to trunk |
| Required approvals | **1** | Minimum review gate |
| Dismiss stale reviews on new commits | **On** | Force re-review after changes |
| Require review from CODEOWNERS | **On** | Domain-specific ownership enforced |
| Restrict who can dismiss reviews | **On** (owner only) | Prevent self-dismissal |
| Require status checks to pass | **On** | CI must be green |
| Required status checks | See below | All CI gates must pass |
| Require branches to be up to date | **On** | No stale-branch merges |
| Block force pushes | **On** | Preserve history integrity |
| Restrict force pushes | **On** | No exceptions |
| Require deployments to succeed | **Off** (optional) | Enable once staging deploy is reliable |

---

## Required Status Checks

The following status checks must be listed as required in the branch ruleset:

| Check Name | Workflow | Purpose |
|-----------|---------|---------|
| `CI Gate` | `ci.yml` | Lint + typecheck + test + build must all pass |
| `E2E Gate` | `e2e.yml` | Playwright E2E must pass across all apps |
| `Lighthouse Gate` | `lighthouse.yml` | Perf/accessibility thresholds enforced |
| `CodeQL Analysis / analyze` | `codeql.yml` | SAST must complete without critical findings |
| `Dependency Review` | `dependency-review.yml` | No high/critical CVE introductions |
| `Security Audit & SBOM / Security Gate (blocking)` | `security.yml` | Fan-in gate: secret scanning (Gitleaks), dependency vulnerability scan, and lockfile integrity must all pass |

> **Note**: GitHub requires status checks to have run at least once before they can be selected as required checks in the UI. Merge a test PR first if adding a new check.

---

## GitHub Environment Protection Rules

### `staging` Environment

| Setting | Value |
|---------|-------|
| Required reviewers | None (auto-deploys on push to main) |
| Wait timer | None |
| Deployment branches | `main`, `master` |

### `production` Environment

| Setting | Value |
|---------|-------|
| Required reviewers | 1 (repo owner or designated reviewer) |
| Wait timer | None (review serves as gate) |
| Deployment branches | Protected branches only (`main`, `master`) |

---

## Dependabot Configuration Reference

File: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    reviewers:
      - "stephenlutar2-hash"
    labels:
      - "dependencies"
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: "development"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    reviewers:
      - "stephenlutar2-hash"
    labels:
      - "dependencies"
      - "github-actions"
```

---

## Recommended Repository Settings

These settings should be configured in **Settings → General**:

| Setting | Value |
|---------|-------|
| Default branch | `main` |
| Allow merge commits | On |
| Allow squash merging | On (default for PRs) |
| Allow rebase merging | Off (keeps history clean) |
| Automatically delete head branches | On |
| Allow auto-merge | Off (manual review only) |

---

## CodeQL Configuration

CodeQL is configured in `.github/workflows/codeql.yml` for `javascript-typescript`. It runs:
- On every push to `main`/`master`
- On every PR targeting `main`/`master`
- Weekly on Mondays at 06:00 UTC

Findings are reported in **Security → Code scanning alerts**. Critical and high findings block merging when the status check is required.

---

## Audit and Compliance

- All merges to `main` produce an audit trail via GitHub's audit log
- CODEOWNERS ensures every path change is reviewed by the designated owner
- The deploy-production environment requires approval, creating a human gate before production changes
- SBOM artifacts are retained for 90 days for compliance purposes
