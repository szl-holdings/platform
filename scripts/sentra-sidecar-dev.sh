#!/usr/bin/env bash
# Sentra Detector Sidecar — local dev entry point.
#
# Bootstraps a virtualenv on first run, installs dependencies, then
# launches uvicorn. Wired to `pnpm sentra:sidecar:dev` at the repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SIDECAR_DIR="$ROOT/services/sentra-detector-sidecar"
VENV="$SIDECAR_DIR/.venv"

if [ ! -d "$VENV" ]; then
  echo "[sentra:sidecar] creating virtualenv at $VENV"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --upgrade pip wheel >/dev/null
  "$VENV/bin/pip" install -r "$SIDECAR_DIR/requirements.txt"
  "$VENV/bin/pip" install pytest httpx
fi

export PYTHONPATH="$SIDECAR_DIR/src${PYTHONPATH:+:$PYTHONPATH}"
export SENTRA_SIDECAR_PORT="${SENTRA_SIDECAR_PORT:-8765}"
export SENTRA_API_SERVER_URL="${SENTRA_API_SERVER_URL:-http://127.0.0.1:5000}"

exec "$VENV/bin/python" -m sidecar.main
