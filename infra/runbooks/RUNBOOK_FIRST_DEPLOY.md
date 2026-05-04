# Runbook: First-Time Substrate Fleet Deploy

> Step-by-step guide for the very first production deployment of the substrate fleet.

## Before You Start

Complete the go-live checklist from `docs/operations/substrate-fleet.md`:

```
☐  ACR_LOGIN_SERVER          Azure Container Registry login server
☐  AZURE_SUBSCRIPTION_ID     Azure subscription ID
☐  AZURE_RESOURCE_GROUP      Resource group name
☐  SUBSTRATE_API_KEY         Random secret: openssl rand -hex 32
```

Ensure you have:
- Azure CLI installed and logged in
- Docker installed and running
- Contributor role on the target resource group
- GPU quota for NC-series VMs (see `RUNBOOK_GPU_PROVISIONING.md`)

## Step 1 — Copy and fill the env file

```bash
cp .env.substrate.example .env.substrate
$EDITOR .env.substrate
```

The `.env.substrate` file is gitignored. Never commit it.

## Step 2 — Dry-run the Bicep deployment

```bash
source .env.substrate  # load env vars

az deployment group what-if \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json \
  --parameters \
    deploySubstrateFleet=true \
    substrateApiKey="$SUBSTRATE_API_KEY" \
    substrateImageTag="$(git rev-parse --short HEAD)"
```

Review the output carefully. Verify no existing resources are modified when
`deploySubstrateFleet=true` is added for the first time.

## Step 3 — Run the deploy script

```bash
./scripts/deploy-substrate.sh
```

The script will print each step and fail loudly with an actionable error if
anything goes wrong. Expected runtime: 10–20 minutes (image build + push + deployment).

## Step 4 — Wire the API server

After a successful deploy, the script prints the inference and worker FQDNs.
Copy them and update the API server:

```bash
# Use the FQDNs printed by the deploy script, or retrieve them:
WORKER_URL=$(az containerapp show \
  --name szlholdings-substrate-workers \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query 'properties.configuration.ingress.fqdn' -o tsv)

az containerapp update \
  --name szlholdings-api \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --set-env-vars \
    "SUBSTRATE_PYTHON_WORKER_URL=https://$WORKER_URL" \
    "SUBSTRATE_API_KEY=$SUBSTRATE_API_KEY"
```

## Step 5 — Verify live model loading

Load a model and verify GPU inference:

```bash
INFERENCE_URL="https://$(az containerapp show \
  --name szlholdings-substrate-inference \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query 'properties.configuration.ingress.fqdn' -o tsv)"

# Load the 8B model (fastest to load, ~5 minutes)
curl -X POST "$INFERENCE_URL/v1/models/load" \
  -H "Authorization: Bearer $SUBSTRATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model_id": "llama-3.1-8b-instruct"}'

# Poll /ready until ready=true (up to 10 minutes for large models)
watch -n 15 "curl -s $INFERENCE_URL/ready | python3 -m json.tool"
```

## Step 6 — Submit a test inference

```bash
curl -X POST "$INFERENCE_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instruct",
    "messages": [{"role": "user", "content": "Say hello in one sentence."}],
    "max_tokens": 50
  }' | python3 -m json.tool
```

## Checklist Sign-off

```
☐  deploy-substrate.sh completed without errors
☐  Both /health endpoints return status=ok or status=idle
☐  Both /ready endpoints return ready=true
☐  Synthetic stage claim returned type=stage.result
☐  Model loaded and test inference returned a response
☐  API server SUBSTRATE_PYTHON_WORKER_URL and SUBSTRATE_API_KEY updated
☐  API server bridge status shows configured=true, healthy=true, ready=true
```
