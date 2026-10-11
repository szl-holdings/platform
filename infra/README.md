# SZL Holdings — Azure Infrastructure

This directory contains Bicep templates for the intended Azure stack for SZL Holdings.

> **Production HOLD:** source-contract tests verify local module resolution and immutable API image plumbing. The templates have not been compiled with the Azure CLI/Bicep CLI in the current evidence environment, deployed to Azure, or qualified with production traffic. Do not treat source validation as deployment evidence.

## Architecture

```
                         ┌─────────────────────────────────┐
     szlholdings.com ──► │  Azure Front Door Premium + WAF  │
                         │  (Bot protection, rate limiting) │
                         └──────────────┬──────────────────┘
                                        │
                         ┌──────────────┴──────────────────┐
                         │                                 │
               ┌─────────▼──────────┐           ┌─────────▼──────────┐
               │  Static Web Apps   │           │  Container Apps     │
               │  (18 frontends)    │           │  min 2 / max 10     │
               └────────────────────┘           └─────────┬──────────┘
                                                          │
                                    ┌─────────────────────┼─────────────────────┐
                                    │                     │                     │
                             ┌──────▼──────┐     ┌────────▼──────┐    ┌────────▼──────┐
                             │  Key Vault  │     │  PostgreSQL    │    │  Redis Cache  │
                             │ (Deny+PE)   │     │ GeneralPurpose │    │  Standard C1  │
                             └─────────────┘     │ ZoneRedundant  │    │  (replicated) │
                                    │            │ Geo-redundant  │    └───────────────┘
                             ┌──────▼──────┐     └───────────────┘
                             │Blob Storage │     ┌───────────────┐
                             │ (GRS+PE)    │     │ App Insights   │
                             └─────────────┘     │ + Log Analytics│
                                                 │ (90-day retain)│
                                                 └───────────────┘
```

All data-plane services (PostgreSQL, Key Vault, Storage) are accessed via **Private Endpoints** — they do not accept public internet traffic. The Container Apps environment is deployed into a dedicated VNet subnet with NSG rules for defense-in-depth.

## What's New (Champion-Tier Hardening)

| Area | Before | After |
|------|--------|-------|
| PostgreSQL | Burstable B1ms, no HA, no geo-backup | GeneralPurpose D2s_v3, Zone-Redundant HA, geo-redundant backups, auto-grow |
| Redis | Basic C0, no SLA | Standard C1, replicated, 99.9% SLA |
| Storage SKU | Standard_LRS | Standard_GRS |
| Network | Public internet access | VNet + Private Endpoints for all data services |
| Container App min replicas | 1 | 2 |
| Container App CPU/memory scaling | HTTP only | HTTP + CPU + memory triggers |
| Log retention | 30 days | 90 days |
| Container | Running as root, no dumb-init | Non-root user (nodeapp), dumb-init, OCI labels, SBOM |
| CI/CD | None | Full GitHub Actions: lint, typecheck, build, Trivy scan, push to ACR, deploy |
| Alerting | None | CPU, memory, 5xx, latency P95, DB connection alerts with Action Groups |
| Diagnostics | Minimal | All resources ship logs/metrics to Log Analytics |
| Health endpoints | Basic | Structured JSON with per-dependency latency + pool metrics |
| Graceful shutdown | 15s hard timeout | Configurable drain timeout + in-flight request tracking |
| W3C Trace Context | Proprietary headers only | Full W3C `traceparent`/`tracestate` propagation |

## Prerequisites

- Azure CLI (`az`) installed and logged in: `az login`
- An Azure subscription
- A resource group: `az group create -n szlholdings-rg -l eastus2`
- An Azure Container Registry: `az acr create -n szlholdingsacr -g szlholdings-rg --sku Standard`

## Quick Start

### 1. Build, Push, and Resolve the Image Digest

```bash
# Use the exact source revision as a traceable build label. Azure deployment is
# pinned to the registry digest resolved after the push, not to this label.
API_IMAGE_REPOSITORY="szlholdingsacr.azurecr.io/szlholdings-api"
API_BUILD_LABEL="$(git rev-parse HEAD)"

docker build -t "${API_IMAGE_REPOSITORY}:${API_BUILD_LABEL}" .
az acr login --name szlholdingsacr
docker push "${API_IMAGE_REPOSITORY}:${API_BUILD_LABEL}"

API_IMAGE_DIGEST="$(az acr manifest show-metadata \
  --registry szlholdingsacr \
  --name "szlholdings-api:${API_BUILD_LABEL}" \
  --query digest \
  --output tsv)"

if ! printf '%s' "${API_IMAGE_DIGEST}" | grep -Eq '^sha256:[0-9a-f]{64}$'; then
  echo "ACR did not return a valid sha256 digest" >&2
  exit 1
fi
```

### 2. Deploy Infrastructure

```bash
az deployment group create \
  --resource-group szlholdings-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json \
  --parameters \
    pgAdminLogin=<YOUR_PG_LOGIN> \
    pgAdminPassword=<YOUR_PG_PASSWORD> \
    apiImageDigest="${API_IMAGE_DIGEST}"
```

> **Note:** The first deploy with VNet enabled takes ~15 minutes for PostgreSQL provisioning.

### 3. Update the Container App

```bash
az deployment group create \
  --resource-group szlholdings-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json \
  --parameters \
    pgAdminLogin=<YOUR_PG_LOGIN> \
    pgAdminPassword=<YOUR_PG_PASSWORD> \
    apiImageDigest="${API_IMAGE_DIGEST}"
```

Resolve `API_IMAGE_DIGEST` again after every image push. Reapplying the Bicep deployment preserves the digest-bound image contract.

### 4. Run Database Migrations

```bash
DATABASE_URL=$(az deployment group show \
  -g szlholdings-rg -n main \
  --query "properties.outputs.pgServerFqdn.value" -o tsv | \
  xargs -I{} echo "postgresql://<login>:<password>@{}:5432/szlholdings?sslmode=require")

DATABASE_URL=$DATABASE_URL pnpm --filter @workspace/db run db:push
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `baseName` | Prefix for all resources | `szlholdings` |
| `location` | Azure region | Resource group location |
| `pgAdminLogin` | PostgreSQL admin username | (required) |
| `pgAdminPassword` | PostgreSQL admin password | (required) |
| `customDomain` | Custom domain for Front Door | `szlholdings.com` |
| `apiImageDigest` | Immutable OCI digest in `sha256:<64 lowercase hex>` form | Required; no default |
| `acrLoginServer` | ACR login server | `szlholdingsacr.azurecr.io` |
| `redisSku` | Redis Cache SKU | `Standard` |
| `pgSkuTier` | PostgreSQL SKU tier | `GeneralPurpose` |
| `pgSkuName` | PostgreSQL compute size | `Standard_D2s_v3` |
| `pgStorageSizeGB` | PostgreSQL storage | `128` |
| `enableVnet` | Enable VNet + Private Endpoints | `true` |
| `alertEmailAddress` | Email for ops alerts | `ops@szlholdings.com` |
| `alertWebhookUrl` | Optional webhook for alerts | `` |

## Resources Provisioned

| Resource | Purpose | SKU |
|----------|---------|-----|
| **Front Door + WAF** | CDN, SSL termination, DDoS/bot protection | Premium |
| **Static Web Apps** (×18) | Host each frontend SPA | Standard |
| **Container Apps** | Host the Express API server, min 2 / max 10 replicas | Consumption |
| **Key Vault** | Centralized secrets, private endpoint | Standard |
| **PostgreSQL Flexible Server** | Primary database, Zone-Redundant HA, geo-backup | GeneralPurpose D2s_v3 |
| **Redis Cache** | Session storage and API caching, replicated | Standard C1 |
| **Blob Storage** | File uploads, exports, assets, logs | Standard GRS |
| **Application Insights** | Telemetry, tracing, error tracking | Per GB |
| **Log Analytics** | Centralized log aggregation, 90-day retention | PerGB2018 |
| **Virtual Network** | Network isolation with subnets + NSGs | — |
| **Private Endpoints** | Key Vault, Storage (PostgreSQL uses VNet delegation) | — |
| **Alert Rules + Action Groups** | CPU, memory, 5xx, latency, DB saturation alerts | — |

## VNet Topology

| Subnet | CIDR | Purpose |
|--------|------|---------|
| `container-apps` | `10.0.0.0/23` | Container Apps Environment |
| `postgres` | `10.0.2.0/24` | PostgreSQL delegation |
| `private-endpoints` | `10.0.3.0/24` | Key Vault + Storage private endpoints |

## CI/CD

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` with:

1. **Lint + type-check** — Code quality gates
2. **Build frontends** — All 18 frontend apps built in parallel
3. **Build container** — Multi-stage Docker build with layer caching
4. **Trivy scan** — CRITICAL/HIGH CVE scan; fails on unfixed findings
5. **SBOM generation** — Software Bill of Materials archived for 90 days
6. **Push to ACR** — Tagged with short commit SHA
7. **Deploy to Container Apps** — New revision with smoke test
8. **Deploy frontends** — Parallel matrix deploy to 18 Static Web Apps

Uses OIDC/Federated Identity for Azure auth (no stored credentials).

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_CLIENT_ID` | Federated identity client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `SWA_TOKEN_rosie` | Static Web App deployment token |
| `SWA_TOKEN_<app>` | One per frontend app (18 total) |

### Federated Identity Setup

```bash
# Create app registration
az ad app create --display-name "szlholdings-github-deploy"

# Create federated credential for main branch
az ad app federated-credential create \
  --id <APP_ID> \
  --parameters '{
    "name": "github-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<owner>/<repo>:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Assign Contributor role on resource group
az role assignment create \
  --assignee <APP_ID> \
  --role Contributor \
  --scope /subscriptions/<SUB_ID>/resourceGroups/szlholdings-rg
```

## Alerting

Alert rules fire to the `szlholdings-ops-alerts` Action Group (email + optional webhook):

| Alert | Threshold | Severity |
|-------|-----------|----------|
| High CPU | > 80% for 10 min | 2 (Warning) |
| High Memory | > 85% for 10 min | 2 (Warning) |
| 5xx Spike | > 10 errors in 5 min | 1 (Error) |
| P95 Latency | > 2000ms for 15 min | 2 (Warning) |
| DB Connection Saturation | waiting > 5 for 10 min | 2 (Warning) |

## Health Endpoints

The API server exposes three health endpoints with structured JSON:

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /health` | Liveness — fast, no DB check | `{ ok, azure, circuitBreakers, database.pool }` |
| `GET /healthz` | Liveness + DB ping with latency | `{ ok, database: { ok, latencyMs, error } }` |
| `GET /readyz` | Full readiness: DB, Redis, KV, circuits | `{ ok, checks: { database, redis, keyVault, blobStorage, circuitBreakers } }` |
| `GET /metrics` | Internal metrics (pool, Redis, circuits) | `{ database.pool, redis, circuitBreakers[] }` |

## Store Secrets in Key Vault

After provisioning, populate Key Vault with application secrets:

```bash
KV_NAME=$(az deployment group show -g szlholdings-rg -n main \
  --query properties.outputs.keyVaultUrl.value -o tsv | \
  sed 's|https://||;s|\.vault.*||')

az keyvault secret set --vault-name $KV_NAME --name "stripe-secret-key" --value "<YOUR_KEY>"
az keyvault secret set --vault-name $KV_NAME --name "plaid-client-id" --value "<YOUR_KEY>"
az keyvault secret set --vault-name $KV_NAME --name "plaid-secret" --value "<YOUR_KEY>"
az keyvault secret set --vault-name $KV_NAME --name "jwt-secret" --value "<YOUR_KEY>"
```

## Cost Estimates (Monthly)

| Resource | SKU | Estimated Cost |
|----------|-----|---------------|
| Front Door Premium | Per request + bandwidth | ~$35-100 |
| Static Web Apps Standard (×18) | Standard tier | ~$0-162 |
| Container Apps | 2 vCPU, 4GB RAM × 2 min replicas | ~$60-120 |
| Key Vault | Standard | ~$1-5 |
| PostgreSQL Flexible | D2s_v3, 128GB, Zone-Redundant HA | ~$200-280 |
| Redis Cache | Standard C1 | ~$55 |
| Blob Storage | Standard GRS | ~$3-15 |
| Application Insights | Per GB ingested | ~$2-20 |
| VNet + Private Endpoints | Private endpoints (×2) | ~$15-20 |
| **Total** | | **~$370-780/mo** |

> The upgrade to production-grade SKUs significantly increases cost vs. the previous dev-grade setup (~$80-300/mo). This is the expected price of genuine cloud-champion infrastructure.
