# Runbook: GPU Node Provisioning

> Covers first-time provisioning of the Azure GPU lane for the substrate fleet.

## Prerequisites

- Azure CLI ≥ 2.60 installed and logged in (`az login`)
- Subscription has NC-series GPU quota in the target region (eastus2)
  - Request via: Azure Portal → Subscriptions → [sub] → Usage + Quotas → Request Increase
  - Minimum: 6 vCPUs (Standard NC6s v3) per region
- Contributor role on the target resource group

## Step 1 — Verify GPU Quota

```bash
az vm list-usage \
  --location eastus2 \
  --query "[?contains(name.value, 'StandardNCSv3')].{Name:name.localizedValue, Current:currentValue, Limit:limit}" \
  -o table
```

If `Current < 6`, submit a quota increase before proceeding.

## Step 2 — Validate Bicep Template (Dry Run)

```bash
az deployment group what-if \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json \
  --parameters deploySubstrateFleet=true substrateApiKey="dummy-key-for-validation"
```

Review the what-if output. Confirm:
- No existing resources will be deleted
- `substrate-inference` and `substrate-py-workers` Container Apps will be created
- NSG `substrate-nsg` will be created with the expected rules

## Step 3 — Provision

```bash
./scripts/deploy-substrate.sh
```

The script will:
1. Run pre-flight checks (credentials, ACR reachability)
2. Build and push both Docker images
3. Run `az deployment group create` with `deploySubstrateFleet=true`
4. Wait for services to become healthy
5. Submit a synthetic stage claim as a smoke test

## Step 4 — Verify GPU Availability

After the Container App revision starts, check the inference `/health` endpoint:

```bash
INFERENCE_URL="https://$(az containerapp show \
  --name szlholdings-substrate-inference \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query 'properties.configuration.ingress.fqdn' -o tsv)"

curl "$INFERENCE_URL/health" | python3 -m json.tool
```

Confirm `gpu_info.vram_total_mb > 0` and `engine` contains `live` (not `stub`).

## Step 5 — Wire the API Server

Set `SUBSTRATE_PYTHON_WORKER_URL` and `SUBSTRATE_API_KEY` in the API server
Container App:

```bash
WORKER_URL="https://$(az containerapp show \
  --name szlholdings-substrate-workers \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query 'properties.configuration.ingress.fqdn' -o tsv)"

az containerapp update \
  --name szlholdings-api \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --set-env-vars \
    "SUBSTRATE_PYTHON_WORKER_URL=$WORKER_URL" \
    "SUBSTRATE_API_KEY=$SUBSTRATE_API_KEY"
```

## Rollback

See `RUNBOOK_SUBSTRATE_ROLLBACK.md`.

## Notes

- The NSG (`substrate-nsg`) restricts inbound to VNet-internal traffic only.
  External access is not possible without updating the NSG.
- GPU Container Apps do not support autoscaling to 0 — min replicas = 1.
- Model downloads happen on first `/v1/models/load` call (or auto-load on startup
  if `SUBSTRATE_DEFAULT_MODEL` is set). Initial load may take 5–15 minutes
  for 70B+ models.
