#!/usr/bin/env bash
# Deploy-time build step for the api-server autoscale image.
#
# Warm-builds the Python sidecar venvs (amaru, sentra-core) so they ship inside
# the deployed image. Without this, the first request to a fresh autoscale
# container pays pip-install latency in the hot path because start-prod.sh
# would otherwise be the first thing to run the bootstraps.
#
# start-prod.sh still invokes the same bootstrap scripts as a safety net;
# because both bootstraps are idempotent and no-op when the venv is already
# healthy, the runtime cost drops to milliseconds once the image is warm.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[deploy-build] Warm-building sentra-core venv..."
bash "$REPO_ROOT/services/sentra-core/scripts/bootstrap.sh"

echo "[deploy-build] Warm-building amaru venv..."
bash "$REPO_ROOT/services/amaru/scripts/bootstrap_venv.sh"

echo "[deploy-build] Done."
