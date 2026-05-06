# Deployment Strategy

## Overview

SZL Holdings operates a multi-environment deployment strategy with Replit as the primary development and staging environment, and Azure as the target production infrastructure for enterprise customers.

## Environments

| Environment | Platform | Purpose |
|-------------|----------|---------|
| Development | Replit | Active development, feature branches, live previews |
| Staging | Replit (published) | Pre-production validation, demo environment |
| Production | Azure | Enterprise customer-facing, multi-tenant |

## Replit Deployment

The live Replit workspace serves as both the development environment and the staging/demo deployment. Publishing via Replit creates an autoscaled deployment with:

- Automatic HTTPS/TLS
- Managed PostgreSQL
- Environment secret management
- Health check monitoring
- Zero-downtime deploys

### Publishing

```bash
# Build all artifacts
pnpm -r build

# API server build
pnpm --filter @workspace/api-server build

# Publish via Replit (UI or CLI)
```

## Azure Production (Enterprise)

Full Azure infrastructure is defined in `/infra/` using Bicep templates.

### Resources

- **App Service** — Node.js 22 LTS, Linux, autoscale
- **PostgreSQL Flexible Server** — General Purpose tier, automated backups
- **Key Vault** — Centralized secrets management
- **Redis Cache** — Session store, real-time cache
- **CDN** — Static asset delivery via Azure Front Door
- **Application Insights** — APM, distributed tracing, log analytics

### Deployment Steps

```bash
# 1. Deploy infrastructure
az deployment group create \
  --resource-group szl-production \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json

# 2. Configure secrets in Key Vault
az keyvault secret set --vault-name szl-keyvault --name DATABASE-URL --value "..."
az keyvault secret set --vault-name szl-keyvault --name SESSION-SECRET --value "..."

# 3. Build and deploy API server
pnpm --filter @workspace/api-server build
az webapp deploy --resource-group szl-production --name szl-api ...

# 4. Build and deploy frontend artifacts
pnpm -r build
# Deploy static assets to CDN / blob storage
```

### Multi-Tenant Configuration

Enterprise deployments use per-tenant configuration stored in the `azure_tenants` table:

- Tenant-scoped Power BI workspace config (encrypted)
- Per-tenant embed token issuance with Row-Level Security
- Azure AD integration for SSO
- Tenant provisioning wizard (4-step onboarding)

## Database Management

```bash
# Push schema changes (development)
pnpm --filter db push

# Force push (reset + apply)
yes '' | pnpm --filter db push --force

# Seed demo data
pnpm --filter scripts run seed
```

## Health Checks

- `GET /api/health` — Rich liveness (server, db+latency, job_queue, storage, auth, ai+latency, huggingface gate, registered platform apps). Public.
- `GET /api/healthz` — Codex-kernel deployment contract payload. Public.
- `GET /api/health/live` — Boot-gated liveness (returns 503 with `{status:"starting"}` until `bootstrapDone=true`). Public.
- `GET /api/health/detailed` — Full system status including DB pool metrics. Authenticated or internal token.

## Production URL

The published Replit deployment is reachable at:

> **https://szlholdings.replit.app**

This is the canonical staging/demo URL for SZL Holdings and is the URL referenced in `userenv.production.PUBLIC_APP_URL`. Operator runbook for cutting and verifying a deploy: `docs/GO_LIVE_VERIFICATION.md`. Hard blockers list: `docs/GO_LIVE_BLOCKERS.md`.

## CI/CD

The workspace uses a post-merge setup script (`scripts/post-merge.sh`) that runs automatically after task branch merges:

1. Install dependencies (`pnpm install`)
2. Push database schema (`pnpm --filter db push`)
3. Verify build integrity
