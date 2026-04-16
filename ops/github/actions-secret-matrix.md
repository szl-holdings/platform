# GitHub Actions Secrets Matrix — SZL Holdings Platform

Last updated: 2026-04-16

This document is the canonical inventory of all secrets used in GitHub Actions workflows. It replaces and supersedes `actions-secrets-matrix.md` (the legacy file).

---

## Repository-Level Secrets

These secrets are available to all workflows across all environments unless overridden by environment-level secrets.

| Secret Name | Used By | Required | How to Obtain |
|-------------|---------|----------|--------------|
| `REPLIT_STAGING_APP_ID` | `deploy-staging.yml` | Yes | Replit → Deployments → App ID |
| `REPLIT_STAGING_DEPLOY_TOKEN` | `deploy-staging.yml` | Yes | Replit → Deployments → Generate deploy token |
| `REPLIT_APP_ID` | `deploy-production.yml` | Yes | Replit → Deployments → App ID (production) |
| `REPLIT_DEPLOY_TOKEN` | `deploy-production.yml` | Yes | Replit → Deployments → Generate deploy token (production) |
| `NPM_TOKEN` | `npm-publish.yml` | Optional | npm → Access Tokens → Automation token |
| `CODECOV_TOKEN` | `ci.yml` (coverage upload) | Optional | codecov.io → Settings → Repository token |

---

## How Deploy Workflows Consume Secrets

Both deploy workflows run under a GitHub Environment (`environment: staging` and `environment: production`). Set secrets in the corresponding GitHub Environment, not at the repository level.

### Staging (`deploy-staging.yml`)

The workflow runs in `environment: staging` and reads `${{ secrets.REPLIT_STAGING_DEPLOY_TOKEN }}` and `${{ secrets.REPLIT_STAGING_APP_ID }}`. Set these in **Settings → Environments → staging → Secrets**:

| Secret Name | Value |
|-------------|-------|
| `REPLIT_STAGING_APP_ID` | Staging app ID from Replit |
| `REPLIT_STAGING_DEPLOY_TOKEN` | Staging deploy token from Replit |

> The workflow's own warning message confirms: "Configure this secret in Settings → Environments → staging"

### Production (`deploy-production.yml`)

The workflow runs in `environment: production` and reads `${{ secrets.REPLIT_APP_ID }}` and `${{ secrets.REPLIT_DEPLOY_TOKEN }}` (shorter names, no STAGING prefix). Set these in **Settings → Environments → production → Secrets**:

| Secret Name | Value |
|-------------|-------|
| `REPLIT_APP_ID` | Production app ID from Replit |
| `REPLIT_DEPLOY_TOKEN` | Production deploy token from Replit |

**Security note:** The `production` environment requires reviewer approval before secrets are exposed. This provides a human gate between staging and production — never store production deploy credentials as repository-level secrets, which would bypass this gate.

---

## Automatic Secrets (GitHub-provided)

These are automatically injected by GitHub and do not need to be configured manually.

| Secret | Available In | Description |
|--------|-------------|-------------|
| `GITHUB_TOKEN` | All workflows | Short-lived token scoped to repo; used for release creation, PR comments, artifact upload |

---

## Application Secrets (Replit Deployment settings, not GitHub)

These are NOT stored in GitHub. They live in the Replit Deployment settings for each deployment target.

| Secret | Staging | Production | Notes |
|--------|---------|-----------|-------|
| `DATABASE_URL` | Staging DB | Production DB | Never share between environments |
| `SESSION_SECRET` | Staging value | Production value | `openssl rand -hex 32` |
| `FIELD_ENCRYPTION_KEY` | Staging value | Production value | `openssl rand -hex 32`; rotate quarterly |
| `CONNECTOR_ENCRYPTION_KEY` | Staging value | Production value | `openssl rand -hex 32` |
| `ALLOY_INTERNAL_TOKEN` | Staging value | Production value | Internal service auth token |
| `OPENAI_API_KEY` | Optional | Required | AI features |
| `ANTHROPIC_API_KEY` | Optional | Required | AI features |
| `GEMINI_API_KEY` | Optional | Required | AI features |
| `VAPID_PUBLIC_KEY` | Shared | Shared | Push notification public key |
| `VAPID_PRIVATE_KEY` | Staging | Production | Push notification private key |

---

## Secret Rotation Policy

| Secret | Rotation Frequency | Owner |
|--------|-------------------|-------|
| `FIELD_ENCRYPTION_KEY` | Quarterly | Platform lead |
| `SESSION_SECRET` | On suspected compromise | Platform lead |
| `REPLIT_DEPLOY_TOKEN` | Annually or on personnel change | Platform lead |
| `NPM_TOKEN` | Annually | Platform lead |
| AI API keys | On provider recommendation | Platform lead |

---

## Adding New Secrets

1. Add the secret to GitHub: **Settings → Secrets and variables → Actions → New repository secret**
2. Add to the appropriate environment if environment-scoped: **Settings → Environments → [env name] → Add secret**
3. Update this document with the new secret entry
4. Add to `.env.example` (name only, no value) so developers know it exists
5. Reference in the workflow file using `${{ secrets.SECRET_NAME }}`

---

## Secret Audit

Run a secret presence check by verifying workflow files reference documented secrets only:

```bash
grep -r 'secrets\.' .github/workflows/ | grep -v '#' | sort -u
```

Any `secrets.<NAME>` reference not in this document should be investigated and either documented or removed.
