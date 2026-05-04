# Runbook: Image Build and Push

> Covers building and pushing substrate Docker images to ACR.

## Overview

Two images are built and pushed for each release:
- `substrate-inference:<git-sha>` — oLLM GPU inference service
- `substrate-py-workers:<git-sha>` — Python worker fleet

Both images use multi-stage Dockerfiles. The build stage includes GPU headers
(CUDA devel) and compiles native extensions (FlashAttention-2). The runtime
stage is slim and does not include build tools.

## Automated (recommended)

The deploy script handles build + push automatically:

```bash
./scripts/deploy-substrate.sh
```

To build and push without deploying:

```bash
./scripts/deploy-substrate.sh --skip-deploy
```

## Manual

### Prerequisites

```bash
# Log in to ACR
az acr login --name "${ACR_LOGIN_SERVER%%.*}"
# or: az acr login --name szlholdingsacr

# Resolve image tag
GIT_SHA=$(git rev-parse --short HEAD)
```

### Build substrate-inference

```bash
docker build \
  --target runtime \
  -t "${ACR_LOGIN_SERVER}/substrate-inference:${GIT_SHA}" \
  -t "${ACR_LOGIN_SERVER}/substrate-inference:latest" \
  apps/substrate-inference/
```

FlashAttention-2 requires CUDA headers (only present in the `devel` base image
used in the build stage). If building on a CPU-only host, flash-attn will be
skipped with a warning — the runtime image still works correctly in stub mode.

### Build substrate-py-workers

```bash
docker build \
  --target runtime \
  -t "${ACR_LOGIN_SERVER}/substrate-py-workers:${GIT_SHA}" \
  -t "${ACR_LOGIN_SERVER}/substrate-py-workers:latest" \
  services/substrate-py-workers/
```

GDAL and Tesseract are compiled from system packages during the builder stage
and their shared libraries are copied into the runtime stage.

### Push both images

```bash
docker push "${ACR_LOGIN_SERVER}/substrate-inference:${GIT_SHA}"
docker push "${ACR_LOGIN_SERVER}/substrate-inference:latest"
docker push "${ACR_LOGIN_SERVER}/substrate-py-workers:${GIT_SHA}"
docker push "${ACR_LOGIN_SERVER}/substrate-py-workers:latest"
```

## Verifying the push

```bash
az acr repository show-tags \
  --name "${ACR_LOGIN_SERVER%%.*}" \
  --repository substrate-inference \
  --orderby time_desc \
  --top 5 \
  -o table

az acr repository show-tags \
  --name "${ACR_LOGIN_SERVER%%.*}" \
  --repository substrate-py-workers \
  --orderby time_desc \
  --top 5 \
  -o table
```

## Dry-run (local smoke without GPU)

```bash
# CPU stub stack (no GPU required)
docker compose \
  -f docker-compose.gpu.yml \
  -f docker-compose.cpu-stub.yml \
  up --build

# Wait for both services to report healthy, then:
curl http://localhost:8070/health | python3 -m json.tool
curl http://localhost:8090/health | python3 -m json.tool
curl http://localhost:8090/ready  | python3 -m json.tool
```

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `flash-attn` build fails | No CUDA headers in build environment | Expected on CPU hosts; flash-attn skipped with warning |
| `GDAL` binding fails | `gdal-config` version mismatch | Pin `GDAL==$(gdal-config --version)` or use `--no-build-isolation` |
| `docker push` 401 | ACR login expired | Re-run `az acr login --name szlholdingsacr` |
| `docker push` 403 | Principal lacks `AcrPush` role | Assign `AcrPush` role on the ACR resource |
