# Manual Click Paths — GitHub UI Configuration

Last updated: 2026-04-16

This document provides exact step-by-step instructions for GitHub UI changes that cannot be automated via code. Complete these once when setting up a new repository or after major configuration resets.

---

## 1. Set the Default Branch to `main`

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings`
2. Scroll to **Default branch**
3. Click the pencil icon (edit)
4. Select `main` from the dropdown
5. Click **Update**
6. Confirm the rename if prompted

---

## 2. Configure Branch Ruleset for `main`

> **Status: PENDING** — This step has not been completed. The `CodeQL Analysis / analyze` and
> `Dependency Review` checks run on every PR but are not yet enforced as required status checks,
> meaning a PR with a critical finding can still be merged.
>
> **Prerequisite:** The GitHub API for branch protection on private org repos requires **GitHub Team**.
> If the organization has been upgraded, run the automated script instead of the UI steps below:
>
> ```bash
> GH_TOKEN=<admin-pat> bash ops/github/configure-branch-protection.sh
> ```
>
> The PAT needs the `repo` scope (or a fine-grained PAT with Administration read+write). The script
> configures both `main` and `master` and sets all five required status checks in one shot.
>
> If still on the free plan, complete the UI steps below manually.

### Navigate to rulesets

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings/rules`
2. Click **New ruleset**
3. Select **New branch ruleset**

### Ruleset settings

**Ruleset name:** `main-protection`  
**Enforcement status:** Active

**Target branches:**
1. Click **Add target** → **Include by pattern**
2. Enter `main` → Click **Add**
3. Click **Add target** → **Include by pattern**
4. Enter `master` → Click **Add**

**Rules to enable (check each box):**

| Rule | Setting |
|------|---------|
| Restrict deletions | On |
| Require a pull request before merging | On |
| → Required approvals | `1` |
| → Dismiss stale pull request approvals when new commits are pushed | On |
| → Require review from Code Owners | On |
| → Restrict who can dismiss pull request reviews | On (Roles: Maintain, Admin) |
| Require status checks to pass | On |
| → Require branches to be up to date before merging | On |
| Block force pushes | On |

**Adding required status checks:**

After enabling "Require status checks to pass":
1. Click **Add checks**
2. Search for and add each of the following (they must have run at least once):
   - `CI Gate`
   - `E2E Gate`
   - `Lighthouse Gate`
   - `CodeQL Analysis / analyze`
   - `Dependency Review`
3. Click **Add** for each

**Save:**
1. Scroll to the bottom
2. Click **Create** (or **Save changes** if editing)

---

## 3. Configure GitHub Environments

### Create `staging` environment

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings/environments`
2. Click **New environment**
3. Name: `staging`
4. Click **Configure environment**
5. Under **Deployment branches and tags**: Select **Protected branches only** → add `main` and `master`
6. Under **Environment secrets**, add:
   - `REPLIT_STAGING_APP_ID` ← staging app ID from Replit
   - `REPLIT_STAGING_DEPLOY_TOKEN` ← staging deploy token from Replit
7. Click **Save protection rules**

### Create `production` environment

1. Click **New environment**
2. Name: `production`
3. Click **Configure environment**
4. Check **Required reviewers** → click **Add required reviewers** → add `stephenlutar2-hash`
5. Under **Deployment branches and tags**: Select **Protected branches only** → add `main` and `master`
6. Under **Environment secrets**, add:
   - `REPLIT_DEPLOY_TOKEN` ← production deploy token from Replit
   - `REPLIT_APP_ID` ← production app ID from Replit
7. Click **Save protection rules**

---

## 4. Verify Repository-Level Secrets (Optional)

No repository-level secrets are required by the deploy workflows. Both `deploy-staging.yml` (environment: staging) and `deploy-production.yml` (environment: production) read their credentials from the GitHub Environment secrets configured in step 3. If you previously set any `REPLIT_*` secrets at the repository level, you can remove them to avoid confusion.

To view or delete repository-level secrets: **Settings → Secrets and variables → Actions**.

---

## 5. Configure General Repository Settings

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings`

**Merge button settings** (scroll to "Pull Requests"):
- Allow merge commits: **On** (for release branches)
- Allow squash merging: **On** ← default for PRs
- Allow rebase merging: **Off**
- Default commit message for squash: `Pull request title and description`
- Automatically delete head branches: **On**
- Allow auto-merge: **Off**

---

## 6. Configure Dependabot

Dependabot is configured via `.github/dependabot.yml` (already in the repository). To verify it is active:

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings/security_analysis`
2. Scroll to **Dependabot**
3. Verify:
   - Dependabot alerts: **Enabled**
   - Dependabot security updates: **Enabled**
   - Dependabot version updates: **Enabled** (driven by `.github/dependabot.yml`)

---

## 7. Enable GitHub Advanced Security (if available on plan)

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/settings/security_analysis`
2. Under **Code scanning**, click **Set up** → **Advanced** (to use the repo's `codeql.yml` workflow)
3. Under **Secret scanning**:
   - Secret scanning: **Enable**
   - Push protection: **Enable** (blocks commits containing detected secrets)

---

## 8. Configure Repository Topics and Description

1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform`
2. Click the gear icon next to **About** (top right of the description area)
3. Set **Description**: `SZL Holdings unified intelligence and command platform`
4. Add **Topics**: `pnpm-workspace`, `typescript`, `react`, `replit`, `monorepo`
5. Click **Save changes**

---

## 9. Verify CODEOWNERS Is Active

CODEOWNERS only works if:
- The file is at `.github/CODEOWNERS` (already the case)
- All mentioned users/teams exist in the organization
- Branch protection requires CODEOWNERS review (set in step 2)

To verify:
1. Open any PR
2. Check the **Reviewers** panel — CODEOWNERS should auto-populate reviewers
3. If not appearing, check that usernames in `.github/CODEOWNERS` match GitHub handles exactly

---

## 10. Configure Notifications

For the repository owner:
1. Go to: `https://github.com/stephenlutar2-hash/szl-holdings-platform`
2. Click **Watch** → **Custom**
3. Enable: Issues, Pull requests, Releases, Security alerts, Deployments
4. Click **Apply**
