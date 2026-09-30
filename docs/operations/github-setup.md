# GitHub Repository & Org Setup Checklist

**Purpose:** Manual steps to configure the GitHub repository and org for enterprise-grade CI/CD, branch protection, security, and investor-ready presentation.

**Repo:** `github.com/szl-holdings/platform`
**Org:** `github.com/szl-holdings`

---

## Current Status

| Category | Status |
|----------|--------|
| All artifact READMEs | ✅ Investor-ready template applied (all 11 active artifacts) |
| Org profile README | ✅ Up to date — `.github/profile/README.md` |
| Issue templates | ✅ Bug, feature, security report templates in place |
| PR template | ✅ `.github/PULL_REQUEST_TEMPLATE.md` |
| CODEOWNERS | ✅ `.github/CODEOWNERS` |
| Dependabot | ✅ `.github/dependabot.yml` (weekly, grouped, npm + GitHub Actions) |
| Security policy | ✅ `SECURITY.md` |
| Contributing guide | ✅ `CONTRIBUTING.md` |
| License | ✅ `LICENSE.md` |
| Code of Conduct | ✅ `CODE_OF_CONDUCT.md` |
| CI workflows | 47 workflows measured in `artifacts/SOURCE_OF_TRUTH.json`; current run status must be checked separately |
| Branch protection | ✅ Applied to both `master` (default) and `main` (1 review, code owners, required checks, strict, no force push, enforce admins) |
| Repo description + topics | ✅ Applied (description, homepage, 8 topics from task spec) |
| Merge settings | ✅ Squash-only, auto-delete head branches, auto-merge enabled |
| Dependabot alerts | ✅ Enabled |
| Dependabot security updates | ✅ Enabled |
| CodeQL scanning | ✅ Enabled (workflow committed; analysis runs on push/PR) |
| Secret scanning | ✅ Enabled |
| Secret scanning push protection | ✅ Enabled |
| Environments | ✅ `staging` and `production` created (protected branches policy) |
| Pinned repos | ⬜ Manual — requires `admin:org` scope; pin via org Customize page |
| Social preview image | ⬜ Manual — no public REST API; upload via repo Settings → General |
| Environment secrets | ⬜ Manual — add `REPLIT_DEPLOY_TOKEN`, `REPLIT_APP_ID`, staging variants |
| Required reviewer on `production` env | ⬜ Manual — add at least 1 required reviewer in env settings |

---

## 0. Org Profile

The org profile README is at `.github/profile/README.md`. For GitHub to display it:

1. Navigate to **github.com/szl-holdings**
2. Create a public repository named exactly `.github` (if it doesn't exist)
3. Add a `profile/README.md` file to that repo with the contents of `.github/profile/README.md`

The org profile README includes:
- Platform overview and architecture
- Product gallery with screenshots
- Tech stack
- Trust & governance table
- Investor links

---

## 1. Repository Description, Topics, and Website

Navigate to **github.com/szl-holdings/platform → Settings (gear icon next to "About")**:

**Description:**
```
Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. 11 artifacts, 2,816 API endpoints, 798 tables. TypeScript throughout.
```

**Website:** `https://szlholdings.com`

**Topics** (add all):
```
typescript react vite postgresql drizzle-orm express ai-governance
enterprise decision-intelligence audit-trail rbac multi-tenant
monorepo pnpm maritime real-estate cybersecurity
```

**Social preview image:** Upload `assets/readme/products/szl-holdings-dashboard.jpg` as the social preview.

---

## 2. Pinned Repositories

Navigate to **github.com/szl-holdings → Customize your organization**:

Pin these repos (in order):
1. `szl-holdings-platform` — core platform monorepo
2. Any dedicated product repos if created

---

## 3. Branch Protection Rules

Navigate to **Settings → Branches → Add rule** for the `main` (or `master`) branch.

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

| Status Check | Workflow | Description |
|---|---|---|
| `CI Gate` | `ci.yml` | Aggregate — lint, typecheck, test, build, integration tests |
| `E2E Gate` | `e2e.yml` | Playwright end-to-end tests |
| `Lighthouse Gate` | `lighthouse.yml` | Performance score thresholds |
| `dependency-review` | `dependency-review.yml` | Vulnerability scan on dependency changes |
| `analyze` | `codeql.yml` | CodeQL security analysis |

---

## 4. Merge Settings

Navigate to **Settings → General → Pull Requests**:

- [ ] Disable merge commits (allow squash merging only)
- [ ] Enable squash merging
- [ ] Disable rebase merging
- [ ] Enable "Automatically delete head branches"

---

## 5. Environments

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

## 6. Repository Secrets

Navigate to **Settings → Secrets and variables → Actions**:

- [ ] `REPLIT_DEPLOY_TOKEN` — Replit deploy token for production
- [ ] `REPLIT_APP_ID` — Replit app ID for production
- [ ] `REPLIT_STAGING_DEPLOY_TOKEN` — Replit deploy token for staging
- [ ] `REPLIT_STAGING_APP_ID` — Replit app ID for staging

---

## 7. Code Security & Analysis

Navigate to **Settings → Code security and analysis**:

- [ ] Enable Dependency graph
- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable Dependabot version updates (configured via `.github/dependabot.yml`)
- [ ] Enable Code scanning (CodeQL configured via `.github/workflows/codeql.yml`)
- [ ] Enable Secret scanning
- [ ] Enable Secret scanning push protection

---

## 8. Verify In-Repo Configuration

These files are committed and ready:

| File | Purpose | Status |
|---|---|---|
| `.github/CODEOWNERS` | Code ownership for PR reviews | ✅ Ready |
| `.github/dependabot.yml` | Dependency update schedule (weekly, grouped) | ✅ Ready |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR template with quality checklist | ✅ Ready |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Bug report template | ✅ Ready |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Feature request template | ✅ Ready |
| `.github/ISSUE_TEMPLATE/security_report.md` | Security vulnerability report | ✅ Ready |
| `.github/ISSUE_TEMPLATE/config.yml` | Issue template config + contact links | ✅ Ready |
| `.github/profile/README.md` | Org profile README — investor front door | ✅ Ready |
| `.github/workflows/ci.yml` | CI pipeline (lint, typecheck, test, build) | ✅ Ready |
| `.github/workflows/release.yml` | Semantic versioning + GitHub Release | ✅ Ready |
| `.github/workflows/deploy-staging.yml` | Auto-deploy to staging on push to main | ✅ Ready |
| `.github/workflows/deploy-production.yml` | Deploy to production on release publish | ✅ Ready |
| `.github/workflows/codeql.yml` | CodeQL security analysis | ✅ Ready |
| `.github/workflows/dependency-review.yml` | Dependency vulnerability review | ✅ Ready |
| `.github/workflows/e2e.yml` | Playwright E2E tests | ✅ Ready |
| `.github/workflows/lighthouse.yml` | Lighthouse performance audit | ✅ Ready |
| `.github/workflows/security.yml` | Security scanning | ✅ Ready |
| `.github/workflows/readme-qa.yml` | README asset and badge validation | ✅ Ready |
| `SECURITY.md` | Vulnerability disclosure policy | ✅ Ready |
| `CONTRIBUTING.md` | Contribution guidelines | ✅ Ready |
| `LICENSE.md` | License | ✅ Ready |
| `CODE_OF_CONDUCT.md` | Code of conduct | ✅ Ready |
| `artifacts/*/README.md` | Per-artifact investor-ready READMEs | ✅ Ready (all 11) |

---

## 9. Deployment Flow

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

## 10. Investor Visitor Flow

When an investor lands on the org page, the experience should be:

```
github.com/szl-holdings
  → Org profile README (platform overview, product gallery, investor links)
  → szl-holdings-platform repo (comprehensive README with badges, architecture, portfolio)
  → artifacts/[product]/README.md (1-line pitch, screenshot, features, tech stack, quick start)
  → docs/investor/ (platform thesis, product readiness, GTM, data room index)
```

All four layers are now populated and investor-ready.

---

## Related Documents

| Document | Path |
|---|---|
| Branch protection details | `.github/BRANCH_PROTECTION.md` |
| Contributing guidelines | `CONTRIBUTING.md` |
| Deployment guide | `DEPLOYMENT-GUIDE.md` |
| Operations runbook | `OPERATIONS-RUNBOOK.md` |
| Secrets setup | `SECRETS_SETUP.md` |
| Platform architecture | `ARCHITECTURE.md` |
| Investor materials | `docs/investor/` |
