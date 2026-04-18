# Branch Rulesets and Protections — SZL Holdings Platform

Last updated: 2026-04-18

This document defines the exact branch protection and ruleset configuration required for the repository. It pairs with `/ops/github/manual-click-paths.md` which provides the step-by-step GitHub UI instructions.

---

## Configuration Status

| Item | Status | Notes |
|------|--------|-------|
| `codeql.yml` workflow | **Done** | Runs on every PR; job name `analyze` |
| `dependency-review.yml` workflow | **Done** | Runs on every PR; fails on high/critical CVE |
| `main-protection` ruleset created | **Pending** | Must be done in GitHub UI (see manual-click-paths.md §2) |
| `CodeQL Analysis / analyze` as required check | **Pending** | Requires ruleset to be active |
| `Dependency Review` as required check | **Pending** | Requires ruleset to be active |

> **Why pending?** The GitHub branch protection and Rulesets APIs require **GitHub Team** (for private org repos) or a public repository. This repo is currently private on the free org plan. Options to unblock:
> - Upgrade the organization to **GitHub Team** — unlocks the Rulesets API and the `ops/github/configure-branch-protection.sh` script can then configure everything in one command.
> - **Until then**, the two security workflows run on every PR and will report failures, but a determined reviewer can still merge. Manual discipline is required.

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
