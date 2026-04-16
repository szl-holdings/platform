# GitHub Repository Setup Checklist

**Purpose:** Manual steps to configure the GitHub repository for enterprise-grade CI/CD, branch protection, and security. All items are GitHub UI settings that cannot be automated via code.

**Status:** Not yet applied — this is a reference checklist for when the repository is published.

---

## 1. Branch Protection Rules

Navigate to **Settings → Branches → Add rule** for the `main` branch.

- [ ] Require a pull request before merging (1 required approval)
- [ ] Dismiss stale pull request approvals when new commits are pushed
- [ ] Require review from Code Owners (`.github/CODEOWNERS`)
- [ ] Require approval of the most recent reviewable push
- [ ] Require conversation resolution before merging
- [ ] Require status checks to pass before merging
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings (applies to admins too)
- [ ] Disallow force pushes
- [ ] Disallow branch deletions

### Required Status Checks

Add these checks to the branch protection rule:

| Status Check | Workflow | Description |
|---|---|---|
| `CI Gate` | `ci.yml` | Aggregate — lint, typecheck, test, build, integration tests |
| `E2E Gate` | `e2e.yml` | Playwright end-to-end tests |
| `Lighthouse Gate` | `lighthouse.yml` | Performance score thresholds |
| `dependency-review` | `dependency-review.yml` | Vulnerability scan on dependency changes |
| `analyze` | `codeql.yml` | CodeQL security analysis |

---

## 2. Merge Settings

Navigate to **Settings → General → Pull Requests**:

- [ ] Disable merge commits (allow squash merging only)
- [ ] Enable squash merging
- [ ] Disable rebase merging
- [ ] Enable "Automatically delete head branches"

---

## 3. Environments

Navigate to **Settings → Environments** and create:

### `staging`

- [ ] Create environment
- [ ] Enable deployment protection rules
- [ ] Add secrets: `REPLIT_STAGING_DEPLOY_TOKEN`, `REPLIT_STAGING_APP_ID`

### `production`

- [ ] Create environment
- [ ] Add at least 1 required reviewer
- [ ] Enable deployment protection rules
- [ ] Add secrets: `REPLIT_DEPLOY_TOKEN`, `REPLIT_APP_ID`

---

## 4. Repository Secrets

Navigate to **Settings → Secrets and variables → Actions**:

- [ ] `REPLIT_DEPLOY_TOKEN` — Replit deploy token for production
- [ ] `REPLIT_APP_ID` — Replit app ID for production
- [ ] `REPLIT_STAGING_DEPLOY_TOKEN` — Replit deploy token for staging
- [ ] `REPLIT_STAGING_APP_ID` — Replit app ID for staging

---

## 5. Code Security & Analysis

Navigate to **Settings → Code security and analysis**:

- [ ] Enable Dependency graph
- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable Dependabot version updates (configured via `.github/dependabot.yml`)
- [ ] Enable Code scanning (CodeQL configured via `.github/workflows/codeql.yml`)
- [ ] Enable Secret scanning
- [ ] Enable Secret scanning push protection

---

## 6. Verify In-Repo Configuration

These files are already committed and ready:

| File | Purpose | Status |
|---|---|---|
| `.github/CODEOWNERS` | Code ownership for PR reviews | Ready |
| `.github/dependabot.yml` | Dependency update schedule | Ready |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR template with quality checklist | Ready |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Bug report template | Ready |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Feature request template | Ready |
| `.github/ISSUE_TEMPLATE/security_report.md` | Security vulnerability report | Ready |
| `.github/ISSUE_TEMPLATE/config.yml` | Issue template config + contact links | Ready |
| `.github/workflows/ci.yml` | CI pipeline (lint, typecheck, test, build) | Ready |
| `.github/workflows/release.yml` | Semantic versioning + GitHub Release | Ready |
| `.github/workflows/deploy-staging.yml` | Auto-deploy to staging on push to main | Ready |
| `.github/workflows/deploy-production.yml` | Deploy to production on release publish | Ready |
| `.github/workflows/codeql.yml` | CodeQL security analysis | Ready |
| `.github/workflows/dependency-review.yml` | Dependency vulnerability review | Ready |
| `.github/workflows/e2e.yml` | Playwright E2E tests | Ready |
| `.github/workflows/lighthouse.yml` | Lighthouse performance audit | Ready |
| `.github/workflows/security.yml` | Security scanning | Ready |

---

## 7. Deployment Flow

Once all settings are applied, the deployment flow will be:

```
PR → CI Gate + E2E + Lighthouse + CodeQL
       │
       └─► Merge to main
               │
               ├─► deploy-staging.yml (auto) → staging
               │
               └─► release.yml (auto) → GitHub Release
                                          │
                                          └─► deploy-production.yml → production
```

---

## Related Documents

| Document | Path |
|---|---|
| Branch protection details | `.github/BRANCH_PROTECTION.md` |
| Contributing guidelines | `CONTRIBUTING.md` |
| Deployment guide | `DEPLOYMENT-GUIDE.md` |
| Operations runbook | `OPERATIONS-RUNBOOK.md` |
| Secrets setup | `SECRETS_SETUP.md` |
