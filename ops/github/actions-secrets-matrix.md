# GitHub Actions Secrets Matrix

> **Superseded by [`ops/github/actions-secret-matrix.md`](./actions-secret-matrix.md)** — Canonical secrets reference including corrected environment vs repository secret scoping for deploy workflows. This file is retained for historical reference only.

Generated: 2026-04-15

## Repository Secrets

| Secret Name | Used By | Required | How to Get |
|-------------|---------|----------|------------|
| `REPLIT_STAGING_DEPLOY_TOKEN` | deploy-staging.yml | Yes | Replit > Deployments > Generate token |
| `REPLIT_STAGING_APP_ID` | deploy-staging.yml | Yes | Replit > Deployments > App ID |
| `REPLIT_PROD_DEPLOY_TOKEN` | deploy-production.yml | Yes | Replit > Deployments > Generate token |
| `REPLIT_PROD_APP_ID` | deploy-production.yml | Yes | Replit > Deployments > App ID |
| `NPM_TOKEN` | npm-publish.yml | Optional | npm > Access Tokens > Generate |
| `CODECOV_TOKEN` | ci.yml (coverage) | Optional | codecov.io > Settings |

## Environment Secrets

### Staging Environment
| Secret Name | Value Source |
|-------------|-------------|
| `REPLIT_DEPLOY_TOKEN` | Same as REPLIT_STAGING_DEPLOY_TOKEN |
| `REPLIT_APP_ID` | Same as REPLIT_STAGING_APP_ID |

### Production Environment
| Secret Name | Value Source |
|-------------|-------------|
| `REPLIT_DEPLOY_TOKEN` | Same as REPLIT_PROD_DEPLOY_TOKEN |
| `REPLIT_APP_ID` | Same as REPLIT_PROD_APP_ID |

## Environment Configuration

### Staging
- No approval required
- Deploys on push to main

### Production
- Requires 1 reviewer approval
- Deploys on GitHub Release publish
- Manual dispatch available with confirmation input

## Dependabot Configuration

File: `.github/dependabot.yml` (create if missing)
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "stephenlutar"
    labels:
      - "dependencies"
    open-pull-requests-limit: 10
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "stephenlutar"
```
