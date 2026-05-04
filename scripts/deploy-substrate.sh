#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-substrate.sh — Build, push, and deploy the substrate fleet to Azure.
#
# Usage:
#   ./scripts/deploy-substrate.sh [--dry-run] [--skip-push] [--skip-deploy]
#
# Required environment variables (copy .env.substrate.example → .env.substrate):
#   ACR_LOGIN_SERVER          e.g. szlholdingsacr.azurecr.io
#   AZURE_SUBSCRIPTION_ID     Azure subscription ID
#   AZURE_RESOURCE_GROUP      Resource group containing the substrate fleet
#   SUBSTRATE_API_KEY         API key for the substrate inference service
#
# Optional:
#   GIT_SHA                   Overrides the auto-detected git SHA
#   BICEP_PARAMS_FILE         Path to Bicep parameters file (default: infra/parameters.json)
#   SMOKE_WORKER_URL          Worker URL for post-deploy smoke (default: from Bicep outputs)
#   MAX_WORKERS               Maximum worker replicas (default: 10)
#   MIN_WORKERS               Minimum worker replicas (default: 1)
#   SCALE_OUT_QUEUE_DEPTH     Queue depth threshold for scale-out (default: 3)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Parse flags ───────────────────────────────────────────────────────────────
DRY_RUN=0
SKIP_PUSH=0
SKIP_DEPLOY=0
for arg in "$@"; do
  case "$arg" in
    --dry-run)     DRY_RUN=1 ;;
    --skip-push)   SKIP_PUSH=1 ;;
    --skip-deploy) SKIP_DEPLOY=1 ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[substrate-deploy]${NC} $*"; }
warn()  { echo -e "${YELLOW}[substrate-deploy] WARN${NC} $*"; }
error() { echo -e "${RED}[substrate-deploy] ERROR${NC} $*" >&2; }
die()   { error "$*"; exit 1; }

run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "  [DRY-RUN] $*"
  else
    "$@"
  fi
}

# ── Load env file if present ──────────────────────────────────────────────────
if [[ -f ".env.substrate" ]]; then
  info "Loading .env.substrate"
  # shellcheck disable=SC1091
  set -a; source .env.substrate; set +a
fi

# ── Pre-flight checks ─────────────────────────────────────────────────────────
info "Running pre-flight checks..."

REQUIRED_VARS=(
  ACR_LOGIN_SERVER
  AZURE_SUBSCRIPTION_ID
  AZURE_RESOURCE_GROUP
  SUBSTRATE_API_KEY
)
MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    MISSING+=("$var")
  fi
done
if [[ ${#MISSING[@]} -gt 0 ]]; then
  die "Missing required environment variables: ${MISSING[*]}\nCopy .env.substrate.example → .env.substrate and fill in the values."
fi

if [[ $SKIP_DEPLOY -eq 0 ]]; then
  if ! command -v az &>/dev/null; then
    die "Azure CLI ('az') is not installed or not in PATH. Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
  fi
  if ! az account show &>/dev/null; then
    die "Not logged in to Azure. Run: az login"
  fi
  CURRENT_SUB=$(az account show --query id -o tsv)
  if [[ "$CURRENT_SUB" != "$AZURE_SUBSCRIPTION_ID" ]]; then
    warn "Active subscription ($CURRENT_SUB) differs from AZURE_SUBSCRIPTION_ID ($AZURE_SUBSCRIPTION_ID). Switching..."
    run az account set --subscription "$AZURE_SUBSCRIPTION_ID"
  fi
fi

if ! command -v docker &>/dev/null; then
  die "Docker is not installed or not in PATH."
fi

info "Pre-flight checks passed."

# ── Resolve git SHA ────────────────────────────────────────────────────────────
GIT_SHA="${GIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"
info "Image tag: $GIT_SHA"

INFERENCE_IMAGE="${ACR_LOGIN_SERVER}/substrate-inference:${GIT_SHA}"
WORKER_IMAGE="${ACR_LOGIN_SERVER}/substrate-py-workers:${GIT_SHA}"

# ── Build images ──────────────────────────────────────────────────────────────
info "Building substrate-inference image..."
run docker build \
  --target runtime \
  -t "$INFERENCE_IMAGE" \
  -t "${ACR_LOGIN_SERVER}/substrate-inference:latest" \
  apps/substrate-inference/

info "Building substrate-py-workers image..."
run docker build \
  --target runtime \
  -t "$WORKER_IMAGE" \
  -t "${ACR_LOGIN_SERVER}/substrate-py-workers:latest" \
  services/substrate-py-workers/

# ── Push images ───────────────────────────────────────────────────────────────
if [[ $SKIP_PUSH -eq 0 ]]; then
  info "Logging in to ACR ($ACR_LOGIN_SERVER)..."
  run az acr login --name "${ACR_LOGIN_SERVER%%.*}"

  info "Pushing substrate-inference:${GIT_SHA}..."
  run docker push "$INFERENCE_IMAGE"
  run docker push "${ACR_LOGIN_SERVER}/substrate-inference:latest"

  info "Pushing substrate-py-workers:${GIT_SHA}..."
  run docker push "$WORKER_IMAGE"
  run docker push "${ACR_LOGIN_SERVER}/substrate-py-workers:latest"
else
  warn "Skipping image push (--skip-push)"
fi

# ── Deploy Bicep ──────────────────────────────────────────────────────────────
BICEP_PARAMS="${BICEP_PARAMS_FILE:-infra/parameters.json}"

if [[ $SKIP_DEPLOY -eq 0 ]]; then
  info "Running Bicep deployment (deploySubstrateFleet=true)..."
  DEPLOYMENT_NAME="substrate-fleet-${GIT_SHA}-$(date +%Y%m%d%H%M%S)"

  run az deployment group create \
    --subscription "$AZURE_SUBSCRIPTION_ID" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file infra/main.bicep \
    --parameters "@${BICEP_PARAMS}" \
    --parameters \
      deploySubstrateFleet=true \
      substrateImageTag="$GIT_SHA" \
      substrateApiKey="$SUBSTRATE_API_KEY" \
      maxWorkerReplicas="${MAX_WORKERS:-10}" \
      minWorkerReplicas="${MIN_WORKERS:-1}" \
      scaleOutQueueDepth="${SCALE_OUT_QUEUE_DEPTH:-3}"

  info "Deployment '$DEPLOYMENT_NAME' submitted. Waiting for health..."

  # Retrieve the worker FQDN from deployment outputs
  WORKER_FQDN=$(az deployment group show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.substrateWorkerFqdn.value' \
    -o tsv 2>/dev/null || echo "")

  INFERENCE_FQDN=$(az deployment group show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query 'properties.outputs.substrateInferenceFqdn.value' \
    -o tsv 2>/dev/null || echo "")

  SMOKE_WORKER_URL="${SMOKE_WORKER_URL:-${WORKER_FQDN:+https://$WORKER_FQDN}}"
  SMOKE_INFERENCE_URL="${SMOKE_INFERENCE_URL:-${INFERENCE_FQDN:+https://$INFERENCE_FQDN}}"

  # Smoke URLs are mandatory after a real deployment — if they are empty the
  # Bicep outputs did not return FQDNs, which means the deployment silently
  # failed to provision external ingress. Fail loudly rather than skip smoke.
  if [[ -z "${SMOKE_WORKER_URL:-}" ]]; then
    die "SMOKE_WORKER_URL is empty after deployment — Bicep output 'substrateWorkerFqdn' was blank.\n  Ensure deploySubstrateFleet=true and the worker app has external ingress enabled.\n  To override: set SMOKE_WORKER_URL before running this script."
  fi
  if [[ -z "${SMOKE_INFERENCE_URL:-}" ]]; then
    die "SMOKE_INFERENCE_URL is empty after deployment — Bicep output 'substrateInferenceFqdn' was blank.\n  Ensure deploySubstrateFleet=true and the inference app has external ingress enabled.\n  To override: set SMOKE_INFERENCE_URL before running this script."
  fi
else
  warn "Skipping Bicep deployment (--skip-deploy)"
  # When deploy is skipped, smoke URLs must be provided manually or smoke is skipped
  if [[ -z "${SMOKE_WORKER_URL:-}" || -z "${SMOKE_INFERENCE_URL:-}" ]]; then
    warn "SMOKE_WORKER_URL or SMOKE_INFERENCE_URL not set — skipping smoke tests (--skip-deploy mode)"
    info "To run smoke manually: SMOKE_WORKER_URL=https://... SMOKE_INFERENCE_URL=https://... $0 --skip-deploy --skip-push"
    exit 0
  fi
fi

# ── Post-deploy smoke ─────────────────────────────────────────────────────────
info "Running post-deploy smoke tests (URLs must respond or this script will fail)..."

SMOKE_PASS=1

if [[ -n "${SMOKE_INFERENCE_URL:-}" ]]; then
  info "  Probing inference /health at $SMOKE_INFERENCE_URL..."
  for i in 1 2 3 4 5; do
    STATUS=$(curl -sf --max-time 10 "${SMOKE_INFERENCE_URL}/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "")
    if [[ "$STATUS" == "ok" || "$STATUS" == "idle" ]]; then
      info "  inference /health: $STATUS (attempt $i)"
      break
    fi
    warn "  inference /health not ready yet (attempt $i/5, got '$STATUS'). Waiting 15s..."
    sleep 15
    if [[ $i -eq 5 ]]; then
      error "inference /health did not become ready after 5 attempts."
      SMOKE_PASS=0
    fi
  done

  info "  Probing inference /ready at $SMOKE_INFERENCE_URL..."
  READY=$(curl -sf --max-time 10 "${SMOKE_INFERENCE_URL}/ready" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ready','?'))" 2>/dev/null || echo "false")
  if [[ "$READY" != "True" && "$READY" != "true" ]]; then
    warn "inference /ready returned ready=$READY (may still be loading model)"
  else
    info "  inference /ready: ready=true"
  fi
fi

if [[ -n "${SMOKE_WORKER_URL:-}" ]]; then
  info "  Probing worker /health at $SMOKE_WORKER_URL..."
  for i in 1 2 3; do
    WSTATUS=$(curl -sf --max-time 10 "${SMOKE_WORKER_URL}/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "")
    if [[ "$WSTATUS" == "ok" ]]; then
      info "  worker /health: ok (attempt $i)"
      break
    fi
    warn "  worker /health not ready (attempt $i/3, got '$WSTATUS'). Waiting 10s..."
    sleep 10
    if [[ $i -eq 3 ]]; then
      error "Worker /health did not become ready."
      SMOKE_PASS=0
    fi
  done

  info "  Probing worker /ready at $SMOKE_WORKER_URL..."
  WREADY=$(curl -sf --max-time 10 "${SMOKE_WORKER_URL}/ready" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ready','?'))" 2>/dev/null || echo "false")
  if [[ "$WREADY" != "True" && "$WREADY" != "true" ]]; then
    error "Worker /ready returned ready=$WREADY"
    SMOKE_PASS=0
  else
    info "  worker /ready: ready=true"
  fi

  info "  Submitting synthetic stage claim to worker..."
  SMOKE_CLAIM=$(python3 -c "
import json, uuid, datetime
print(json.dumps({
  'protocolVersion': '1.0',
  'messageId': str(uuid.uuid4()),
  'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
  'type': 'stage.claim',
  'workerId': 'deploy-smoke',
  'runId': 'smoke-$(date +%s)',
  'workflowId': 'smoke-workflow',
  'stageId': 'smoke-stage-1',
  'stageType': 'retrieval',
  'stageConfig': {'stageKind': 'retrieval'},
  'input': {'query': 'smoke test', 'topK': 3},
  'budgetConfig': {'escalateAt': 0.7, 'requireHumanBelow': 0.4},
  'traceId': str(uuid.uuid4()),
  'mode': 'dry-run',
}))
")
  CLAIM_RESP=$(curl -sf --max-time 30 \
    -X POST "${SMOKE_WORKER_URL}/claim" \
    -H 'Content-Type: application/json' \
    -d "$SMOKE_CLAIM" 2>/dev/null || echo "{}")
  CLAIM_TYPE=$(echo "$CLAIM_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('type','?'))" 2>/dev/null || echo "?")
  if [[ "$CLAIM_TYPE" == "stage.result" ]]; then
    info "  Synthetic claim: stage.result received — smoke PASSED"
  else
    error "Synthetic claim returned type='$CLAIM_TYPE' (expected 'stage.result')"
    SMOKE_PASS=0
  fi
fi

# ── Result ────────────────────────────────────────────────────────────────────
if [[ $SMOKE_PASS -eq 1 ]]; then
  info "Substrate fleet deploy: ALL CHECKS PASSED"
  info "  Inference: ${SMOKE_INFERENCE_URL:-not tested}"
  info "  Workers:   ${SMOKE_WORKER_URL:-not tested}"
  info "  Image tag: $GIT_SHA"
else
  die "Substrate fleet deploy: SMOKE TESTS FAILED — check logs above"
fi
