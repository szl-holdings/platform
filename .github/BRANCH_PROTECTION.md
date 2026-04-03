# Branch Protection & GitHub Settings

This document describes the recommended GitHub repository settings to enforce the CI/CD pipeline.

## Required Branch Protection Rules for `main` / `master`

Navigate to **Settings → Branches → Add rule** (or update the existing ruleset) and configure the following for the default branch.

### Status Checks (Required to pass before merging)

Enable **"Require status checks to pass before merging"** and add these required checks:

| Status Check | Workflow | Description |
|---|---|---|
| `CI Gate` | `.github/workflows/ci.yml` | Aggregate gate — lint, typecheck, test, build |
| `Lint` | `.github/workflows/ci.yml` | ESLint across all packages |
| `Typecheck` | `.github/workflows/ci.yml` | TypeScript type checking |
| `Test` | `.github/workflows/ci.yml` | Unit test suite |
| `Build API` | `.github/workflows/ci.yml` | API server build |
| `Build Web Apps` | `.github/workflows/ci.yml` | All web app builds |
| `E2E Gate` | `.github/workflows/e2e.yml` | Aggregate E2E gate |
| `Lighthouse Gate` | `.github/workflows/lighthouse.yml` | Performance score thresholds |
| `dependency-review` | `.github/workflows/dependency-review.yml` | Vulnerability scan |
| `analyze` | `.github/workflows/codeql.yml` | CodeQL security analysis |

> **Tip:** The `CI Gate` and `E2E Gate` jobs are aggregate gates — requiring only these two (plus `Lighthouse Gate` and `dependency-review`) gives cleaner PR feedback while covering all required checks.

### Score Thresholds (Lighthouse)

The Lighthouse CI workflow enforces the following minimum scores:

| Category | Minimum Score |
|---|---|
| Performance | 80 |
| Accessibility | 90 |
| Best Practices | 90 |
| SEO | 90 |

Configuration: `.lighthouserc.json`

### Pull Request Requirements

- **Require a pull request before merging** — enabled
- **Require approvals** — 1 (minimum)
- **Dismiss stale pull request approvals when new commits are pushed** — enabled
- **Require review from Code Owners** — recommended (see `.github/CODEOWNERS`)
- **Required review thread resolution** — enabled

### Additional Protections

- **Require branches to be up to date before merging** — enabled (ensures CI runs against the latest main)
- **Require conversation resolution before merging** — enabled
- **Do not allow bypassing the above settings** — enabled (apply to admins too)
- **Allow force pushes** — disabled
- **Allow deletions** — disabled

## Secrets Required

Set these in **Settings → Secrets and variables → Actions** and under **Settings → Environments → production**:

| Secret | Required | Description |
|---|---|---|
| `REPLIT_DEPLOY_TOKEN` | For auto-deploy | Replit personal access token or deploy token |
| `REPLIT_APP_ID` | For auto-deploy | Replit app/repl ID to trigger deployment on |

If these secrets are not set, the deploy workflow will skip gracefully with a warning.

## Recommended Additional Settings

### General

- **Merge button**: Allow **Squash merging** only (keeps a clean linear history)
- **Automatically delete head branches** — enabled

### Environments

Create a `production` environment under **Settings → Environments** with:
- Required reviewers (optional, for an extra gate before production deploy)
- The `REPLIT_DEPLOY_TOKEN` and `REPLIT_APP_ID` secrets scoped to this environment
- Deployment protection rules enabled

## Release Workflow

Releases are created automatically on every push to `main`:

1. The release workflow determines the next semantic version based on commit message prefixes
2. A Git tag is created (`vX.Y.Z`)
3. A GitHub Release is published with an auto-generated changelog
4. The deploy workflow is triggered by the `release.published` event

**Commit message conventions:**
- `feat: ...` → minor version bump
- `feat!: ...` or `BREAKING CHANGE:` → major version bump
- All other prefixes (`fix:`, `chore:`, `docs:`, etc.) → patch version bump

## Dependabot

Dependabot is configured in `.github/dependabot.yml` to:
- Update npm packages weekly (Monday, 09:00 ET)
- Update GitHub Actions weekly (Monday, 09:00 ET)
- Group related packages (React, Vite, testing, TypeScript, UI, database, TanStack)
- Cap at 10 open npm PRs and 5 Actions PRs at a time
