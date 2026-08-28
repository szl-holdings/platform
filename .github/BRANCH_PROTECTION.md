# Branch Protection & GitHub Settings

This is the definitive checklist of GitHub UI settings required to enforce the CI/CD pipeline, protect the default branch, and enable environment-based deployments. All settings are manual steps in the GitHub repository settings UI.

---

## 1. Branch Protection Rules

Navigate to **Settings → Branches → Add rule** (or update the existing ruleset) and configure the following for the default branch (`main` / `master`).

### Pull Request Requirements

| Setting | Value |
|---|---|
| Require a pull request before merging | Enabled |
| Required approvals | 1 |
| Dismiss stale pull request approvals when new commits are pushed | Enabled |
| Require review from Code Owners | Enabled (see `.github/CODEOWNERS`) |
| Require approval of the most recent reviewable push | Enabled |
| Require conversation resolution before merging | Enabled |

### Required Status Checks

Enable **"Require status checks to pass before merging"** and add the following checks. Require branches to be up to date before merging.

| Status Check | Workflow | Description |
|---|---|---|
| `CI Gate` | `.github/workflows/ci.yml` | Aggregate gate — lint, typecheck, test, build, smoke, proof-chain |
| `Readiness Gate (smoke:product-mode)` | `.github/workflows/ci.yml` | Product-mode smoke test — surfaces readiness directly on PRs |
| `E2E Gate` | `.github/workflows/e2e.yml` | Aggregate E2E gate |
| `dependency-review` | `.github/workflows/dependency-review.yml` | Vulnerability scan on dependency changes |
| `analyze` | `.github/workflows/codeql.yml` | CodeQL security analysis |
| `Security Gate (blocking)` | `.github/workflows/security.yml` | Aggregate gate — dependency scan, secret scan, lockfile integrity, license report, **and the api-server `security-tests` vitest suite** |
| `Security Tests (api-server vitest)` | `.github/workflows/security.yml` | Runs `pnpm --filter @workspace/api-server test` on every push/PR — covers `security-middleware.test.ts`, `security-routes.test.ts`, `security-hardening.test.ts` and the rest of the api-server suite |

> **Tip:** `CI Gate` and `E2E Gate` are aggregate jobs — requiring these two (plus `dependency-review` and `analyze`) gives clean PR feedback while covering all required checks underneath.
>
> **Decision — surface `Readiness Gate (smoke:product-mode)` as its own required check:** the readiness smoke job is already aggregated inside `CI Gate` (see `.github/workflows/ci.yml` — the `ci-gate` job lists `readiness-gate` in its `needs`). However, we additionally require it as a named status check so reviewers can see at a glance on the PR whether the product-mode smoke test passed without drilling into the `CI Gate` logs. The job name in branch protection must match the workflow job's `name:` exactly: `Readiness Gate (smoke:product-mode)`.
>
> **Note on Lighthouse:** The `lighthouse.yml` workflow job is named `Lighthouse Gate (accessibility enforced)`. Its matrix and aggregate gate fail closed for accessibility assertion failures and incomplete infrastructure; performance, best-practices, and SEO assertions remain advisory. This checklist does not currently list the Lighthouse gate as a required branch-protection context, so do not represent it as branch-required unless the live ruleset is updated and verified separately.

### Lighthouse Score Thresholds

Configured in `.lighthouserc.json`:

| Category | Minimum Score | Workflow behavior |
|---|---|---|
| Performance | 80 | Advisory warning |
| Accessibility | 90 | Enforced error |
| Best Practices | 90 | Advisory warning |
| SEO | 90 | Advisory warning |

### Additional Branch Protections

| Setting | Value |
|---|---|
| Require branches to be up to date before merging | Enabled |
| Do not allow bypassing the above settings | Enabled (applies to admins too) |
| Allow force pushes | Disabled |
| Allow deletions | Disabled |

---

## 2. Merge Settings

Navigate to **Settings → General → Pull Requests**:

| Setting | Value |
|---|---|
| Allow merge commits | Disabled |
| Allow squash merging | Enabled |
| Allow rebase merging | Disabled |
| Automatically delete head branches | Enabled |

---

## 3. Environments

Navigate to **Settings → Environments** and create the following two environments.

### `staging`

| Setting | Value |
|---|---|
| Required reviewers | Optional — add for extra gate |
| Deployment protection rules | Enabled |
| Secrets | `REPLIT_STAGING_DEPLOY_TOKEN`, `REPLIT_STAGING_APP_ID` |

The `deploy-staging.yml` workflow deploys to this environment automatically on every push to `main`.

### `production`

| Setting | Value |
|---|---|
| Required reviewers | Recommended — at least 1 |
| Deployment protection rules | Enabled |
| Secrets | `REPLIT_DEPLOY_TOKEN`, `REPLIT_APP_ID` |

The `deploy-production.yml` workflow deploys to this environment on published releases or manual dispatch with confirmation.

---

## 4. Secrets

> **Recommended:** Set these secrets as **environment-scoped** secrets under **Settings → Environments → [environment name] → Environment secrets**. Environment secrets are only exposed to workflows running in that specific environment and cannot leak across deployment targets. Setting them at the repository level (Settings → Secrets and variables → Actions) also works but provides weaker access control.

| Secret | Environment | Description |
|---|---|---|
| `REPLIT_STAGING_DEPLOY_TOKEN` | `staging` | Replit personal access or deploy token for the staging Repl |
| `REPLIT_STAGING_APP_ID` | `staging` | Replit app/repl ID for the staging environment |
| `REPLIT_DEPLOY_TOKEN` | `production` | Replit personal access or deploy token for the production Repl |
| `REPLIT_APP_ID` | `production` | Replit app/repl ID for the production environment |

For the complete setup walkthrough, see [`docs/github/environment-protection-setup.md`](../docs/github/environment-protection-setup.md).

---

## 5. GitHub Repository Secret Scanning

Navigate to **Settings → Code security and analysis** and enable:

| Setting | Value |
|---|---|
| Secret scanning | Enabled |
| Push protection | Enabled — blocks pushes containing known secret patterns before they land |
| Secret scanning alerts | Notify security contact (configure under Settings → Security → Notifications) |

> **Why:** GitHub's native secret scanning runs continuously on the full commit history and detects secrets from 200+ service providers. Combined with the gitleaks CI gate (`.github/workflows/ci.yml` `secret-scan` job and `.gitleaks.toml`), this provides defence in depth: gitleaks catches leaks before merge; GitHub catches anything that slips through on `main`. Push protection additionally blocks secrets at the point of `git push`.

---

## 6. Dependabot

Dependabot is configured in `.github/dependabot.yml` to update four package ecosystems weekly (Monday, 09:00 ET):

| Ecosystem | Directories | PR Limit | Grouping |
|-----------|------------|----------|---------|
| `npm` | Root (all pnpm workspaces) | 10 | React, Vite, testing, TypeScript, UI, database, TanStack |
| `pip` | `workers/substrate-python`, `services/substrate-py-workers`, `services/lyte-metrics-store`, `scripts/media` | 3 per dir | None |
| `docker` | `artifacts/api-server`, `artifacts/szl-holdings`, `artifacts/vessels`, `artifacts/terra`, `artifacts/carlota-jo` | 3 per dir | None |
| `github-actions` | Root | 5 | `actions/*`, `github/*`, CI tooling |

To enable **Dependabot auto-merge** for patch-level updates (optional):

1. Navigate to **Settings → Code security and analysis → Dependabot**
2. Enable "Dependabot security updates" and "Dependabot version updates"
3. Use a branch protection ruleset or GitHub Action to auto-approve and auto-merge patch PRs after CI passes

---

## 7. Release Workflow

Releases are created automatically on every push to `main`:

1. The `release.yml` workflow determines the next semantic version from commit message prefixes
2. A Git tag is created (`vX.Y.Z`) and a GitHub Release is published
3. Publishing the release triggers `deploy-production.yml` → production deployment

**Commit message conventions:**

| Prefix | Bump |
|---|---|
| `feat!:` or `BREAKING CHANGE:` | Major |
| `feat:` | Minor |
| `fix:`, `chore:`, `docs:`, etc. | Patch |

### Staging → Production Promotion Flow

```
push to main
    │
    ├─► deploy-staging.yml  (auto) → staging environment
    │
    └─► release.yml (auto) → GitHub Release published
                                     │
                                     └─► deploy-production.yml → production environment
```
