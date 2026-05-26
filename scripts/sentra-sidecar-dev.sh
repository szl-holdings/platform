#!/usr/bin/env bash
# Sentra Detector Sidecar — local dev entry point.
#
# Bootstraps a virtualenv on first run, installs dependencies, then
# launches uvicorn. Wired to `pnpm sentra:sidecar:dev` at the repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SIDECAR_DIR="$ROOT/services/sentra-detector-sidecar"
VENV="$SIDECAR_DIR/.venv"

STAMP="$VENV/.bootstrap-ok"
# Gate on a stamp file (not just the venv directory) so a previously
# partially-installed .venv from a failed bootstrap is re-installed instead
# of silently skipped.
if [ ! -f "$STAMP" ]; then
  echo "[sentra:sidecar] bootstrapping virtualenv at $VENV"
  [ -d "$VENV" ] || python3 -m venv "$VENV"
  # Replit's nixpkgs Python ships an EXTERNALLY-MANAGED marker (PEP 668) AND a
  # global PIP_CONFIG_FILE in the nix store that redirects pip's install target.
  # Both make `pip install` inside the venv unreliable. `uv pip` ignores both
  # signals and installs into the venv's site-packages by default.
  if command -v uv >/dev/null 2>&1; then
    VIRTUAL_ENV="$VENV" uv pip install --python "$VENV/bin/python" \
      -r "$SIDECAR_DIR/requirements.txt" pytest httpx
  else
    # Fallback: explicit --prefix forces install into the venv even if a global
    # pip config sets a different target.
    PIP_USER=0 "$VENV/bin/pip" install --no-user --break-system-packages \
      --prefix "$VENV" --upgrade pip wheel >/dev/null
    PIP_USER=0 "$VENV/bin/pip" install --no-user --break-system-packages \
      --prefix "$VENV" -r "$SIDECAR_DIR/requirements.txt" pytest httpx
  fi
  # Sanity check: confirm the runtime entry point imports before stamping.
  PYTHONPATH="$SIDECAR_DIR/src" "$VENV/bin/python" -c "import sidecar.main" \
    || { echo "[sentra:sidecar] bootstrap verification failed"; exit 1; }
  touch "$STAMP"
fi

export PYTHONPATH="$SIDECAR_DIR/src${PYTHONPATH:+:$PYTHONPATH}"
export SENTRA_SIDECAR_PORT="${SENTRA_SIDECAR_PORT:-8765}"
export SENTRA_API_SERVER_URL="${SENTRA_API_SERVER_URL:-http://127.0.0.1:8080}"
# Bind on all interfaces (IPv4 + IPv6) so Replit's port prober — which dials
# the container's external interface, not loopback — can detect that 8765 is
# open. Localhost-only binding causes the workflow to be marked FAILED with
# "didn't open port 8765" even though uvicorn started cleanly.
export SENTRA_SIDECAR_HOST="${SENTRA_SIDECAR_HOST:-::}"

exec "$VENV/bin/python" -m sidecar.main
