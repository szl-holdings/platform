# Repository Settings Checklist

> SZL Holdings Platform Repository Settings · April 2026

All items require manual action in the GitHub UI at the repository settings page. Apply in the order listed.

---

## General Settings

Navigate to **Settings → General**:

### Repository Details

- [ ] Description: `Governed decision infrastructure — connecting what is observable to what is executable, with full attribution.`
- [ ] Website: `https://szlholdings.com`
- [ ] Topics: `monorepo`, `react`, `typescript`, `postgresql`, `vite`, `ai-governance`, `decision-intelligence`, `enterprise`
- [ ] Social preview: Upload a high-quality hero screenshot (1280×640px minimum)

### Features

| Feature | Setting |
|---------|---------|
| Wikis | Disabled — documentation is in the repo |
| Issues | Enabled |
| Projects | Enabled (if used for roadmap) |
| Discussions | Disabled — use email for evaluator questions |

### Pull Requests

| Setting | Value |
|---------|-------|
| Allow merge commits | Disabled |
| Allow squash merging | Enabled |
| — Default commit message | Pull request title and description |
| Allow rebase merging | Disabled |
| Always suggest updating branches | Enabled |
| Allow auto-merge | Disabled |
| Automatically delete head branches | Enabled |

---

## Branch Protection Rules

Navigate to **Settings → Branches**:

For branch `master` (or `main` if renamed):

- [ ] Require a pull request before merging
  - [ ] Required approvals: 1
  - [ ] Dismiss stale pull request approvals when new commits are pushed
  - [ ] Require review from Code Owners
  - [ ] Require approval of the most recent reviewable push
  - [ ] Require conversation resolution before merging
- [ ] Require status checks to pass before merging
  - [ ] Require branches to be up to date
  - [ ] Add checks: `CI Gate`, `E2E Gate`, `Lighthouse Gate`, `dependency-review`, `analyze`
- [ ] Require linear history
- [ ] Do not allow bypassing the above settings
- [ ] Allow force pushes: **Disabled**
- [ ] Allow deletions: **Disabled**

---

## Code Security and Analysis

Navigate to **Settings → Code security and analysis**:

- [ ] Private vulnerability reporting: Enabled
- [ ] Dependency graph: Enabled
- [ ] Dependabot alerts: Enabled
- [ ] Dependabot security updates: Enabled
- [ ] Dependabot version updates: Enabled (configured via `.github/dependabot.yml`)
- [ ] Code scanning (CodeQL): Enabled (configured via `.github/workflows/codeql.yml`)
- [ ] Secret scanning: Enabled
- [ ] Push protection: Enabled
- [ ] Secret scanning validity checks: Enable if available

---

## Environments

Navigate to **Settings → Environments**:

### `staging` environment
- [ ] Create environment: `staging`
- [ ] Required reviewers: Optional
- [ ] Environment secrets:
  - `REPLIT_STAGING_DEPLOY_TOKEN`
  - `REPLIT_STAGING_APP_ID`

### `production` environment
- [ ] Create environment: `production`
- [ ] Required reviewers: 1 (recommended)
- [ ] Deployment branches: Protected branches only
- [ ] Environment secrets:
  - `REPLIT_DEPLOY_TOKEN`
  - `REPLIT_APP_ID`

---

## Actions

Navigate to **Settings → Actions → General**:

- [ ] Actions permissions: Allow all actions and reusable workflows (or restrict to specific allowlist)
- [ ] Workflow permissions: Read repository contents and packages (default)
- [ ] Allow GitHub Actions to create and approve pull requests: Disabled

---

## Webhooks

Navigate to **Settings → Webhooks**:

- [ ] Review existing webhooks — remove any stale or unknown webhooks
- [ ] Ensure all active webhooks use HTTPS and have a secret configured

---

*Apply these settings manually in the GitHub UI. Last reviewed: April 2026*
