# Branch Protection & GitHub Settings

This document describes the recommended GitHub repository settings to enforce the CI/CD pipeline.

## Required Branch Protection Rules for `main`

Navigate to **Settings → Branches → Add rule** and configure the following for the `main` branch.

### Status Checks (Required to pass before merging)

Enable **"Require status checks to pass before merging"** and add these required checks:

| Status Check | Workflow |
|---|---|
| `CI` | `.github/workflows/ci.yml` — aggregate gate job |
| `Lint` | `.github/workflows/ci.yml` |
| `Typecheck` | `.github/workflows/ci.yml` |
| `Test` | `.github/workflows/ci.yml` |
| `Build all artifacts` | `.github/workflows/build.yml` |

> **Tip:** The `CI` job is an aggregate gate — requiring only this one check is sufficient, but adding individual checks gives clearer failure messages in the PR UI.

### Pull Request Requirements

- **Require a pull request before merging** — enabled
- **Require approvals** — 1 (minimum)
- **Dismiss stale pull request approvals when new commits are pushed** — enabled
- **Require review from Code Owners** — optional, enable if you add a `CODEOWNERS` file

### Additional Protections

- **Require branches to be up to date before merging** — enabled (ensures CI runs against the latest main)
- **Require conversation resolution before merging** — enabled
- **Do not allow bypassing the above settings** — enabled (apply to admins too)
- **Allow force pushes** — disabled
- **Allow deletions** — disabled

## Secrets Required for Auto-Deploy

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `REPLIT_DEPLOY_TOKEN` | Replit personal access token or deploy token |
| `REPLIT_APP_ID` | Replit app/repl ID to trigger deployment on |

If these secrets are not set, the deploy workflow will skip gracefully with a warning.

## Recommended Additional Settings

### General

- **Merge button**: Allow **Squash merging** only (keeps a clean linear history)
- **Automatically delete head branches** — enabled

### Environments

Create a `production` environment under **Settings → Environments** with:
- Required reviewers (optional, for an extra gate before production deploy)
- The `REPLIT_DEPLOY_TOKEN` and `REPLIT_APP_ID` secrets scoped to this environment
