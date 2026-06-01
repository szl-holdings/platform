# GitHub Environment Protection Rules — Setup Guide

This guide documents the `staging` and `production` GitHub Environments configured for `szl-holdings/platform`, and explains how to complete the protection rule setup that requires a paid GitHub plan.

---

## Current State (Configured via API)

Both environments now exist in **Settings → Environments** with all required secrets configured:

| Environment | Status | Branch Restriction | Required Reviewers | Secrets |
|---|---|---|---|---|
| `staging` | Created | `main`, `master` only | Not applicable (free plan) | ✅ Configured (2026-04-21) |
| `production` | Pre-existing | Protected branches only | Requires Team/Enterprise plan | ✅ Configured (2026-04-21) |

---

## Environment Details

### `staging`

- **Created:** 2026-04-17
- **Deployment branch policy:** Custom — restricted to `main` and `master` branches only
- **Required reviewers:** None (GitHub free plan limitation — see upgrade path below)
- **Workflow:** `.github/workflows/deploy-staging.yml` — triggers automatically on push to `main`/`master`

**Environment secrets (set under Settings → Environments → staging → Environment secrets):**

| Secret | Description | Status |
|---|---|---|
| `REPLIT_STAGING_DEPLOY_TOKEN` | Replit personal access or deploy token for the staging Repl | ✅ Set 2026-04-21 |
| `REPLIT_STAGING_APP_ID` | Replit app/repl ID for the staging environment | ✅ Set 2026-04-21 |

### `production`

- **Created:** 2026-04-03 (pre-existing)
- **Deployment branch policy:** Protected branches only (requires branch protection rules to be active)
- **Required reviewers:** Requires GitHub Team or Enterprise plan (see upgrade path below)
- **Workflow:** `.github/workflows/deploy-production.yml` — triggers on published releases or `workflow_dispatch` with `confirm: "deploy"`

**Environment secrets (set under Settings → Environments → production → Environment secrets):**

| Secret | Description | Status |
|---|---|---|
| `REPLIT_DEPLOY_TOKEN` | Replit personal access or deploy token for the production Repl | ✅ Set 2026-04-21 |
| `REPLIT_APP_ID` | Replit app/repl ID for the production environment | ✅ Set 2026-04-21 |

---

## How to Rotate Secrets

All secrets have been configured. To rotate a secret (e.g., after a token is revoked):

1. Go to **GitHub → Settings → Environments → [environment name]**
2. Scroll to **Environment secrets**
3. Click the secret name, then **Update** and enter the new value

Secrets scoped to an environment are only available to workflows running in that environment's context, providing stronger access control than repository-level secrets.

---

## Completing Protection Rules (Requires GitHub Team or Enterprise Plan)

The following protection rules **cannot be configured on a free GitHub Organization plan** and require upgrading:

### Required Reviewers (production)

Once on GitHub Team or Enterprise:

1. Go to **Settings → Environments → production**
2. Under **Deployment protection rules**, enable **Required reviewers**
3. Add at least one reviewer (user or team)
4. Save

This gates every production deployment on explicit human approval.

### Required Reviewers (staging, optional)

For a staging reviewer gate (e.g., QA sign-off before production promotion):

1. Go to **Settings → Environments → staging**
2. Enable **Required reviewers** and add the QA reviewer(s)

---

## Deployment Flow

```
push to main/master
    │
    ├─► deploy-staging.yml  (auto) → staging environment
    │       └── Branch check: only main/master allowed
    │       └── Secrets: REPLIT_STAGING_DEPLOY_TOKEN, REPLIT_STAGING_APP_ID
    │
    └─► release.yml (auto) → GitHub Release published
                                     │
                                     └─► deploy-production.yml → production environment
                                             └── Branch check: protected branches only
                                             └── [Reviewer gate: requires Team plan]
                                             └── Secrets: REPLIT_DEPLOY_TOKEN, REPLIT_APP_ID
```

---

## Verifying the Setup

To confirm both environments are active:

```bash
# List environments (requires GitHub CLI)
gh api repos/szl-holdings/platform/environments

# List staging branch policies
gh api repos/szl-holdings/platform/environments/staging/deployment-branch-policies
```

Expected results:
- Two environments: `staging` and `production`
- Staging has two branch policies: `main` and `master`
- Production has `protected_branches: true`

---

## References

- [GitHub Environments documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Environment protection rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-protection-rules)
- Branch protection rules: see `.github/BRANCH_PROTECTION.md`
- Deployment workflows: `.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-production.yml`
