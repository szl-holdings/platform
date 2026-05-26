#!/usr/bin/env bash
# Production cold-start for the api-server deployment container.
#
# Background:
#   In development the workflow runs ./start.sh, which (a) bootstraps the
#   sentra-core + amaru venvs and (b) co-launches the amaru FastAPI sidecar.
#   In production the npm `start` script previously only bootstrapped
#   sentra-core and then exec'd node. That left the amaru FastAPI organ
#   (services/amaru, port 6810) un-launched, so every fresh autoscale
#   container served /amaru/* as 502 and every api-server feature that hit
#   the chakra orchestrator failed.
#
#   This script restores parity with start.sh for the production path:
#     1. sentra-core venv bootstrap (was already required, task #5191).
#     2. amaru venv bootstrap.
#     3. amaru FastAPI sidecar launch on $AMARU_PORT (default 6810).
#     4. exec node (the api-server itself).
#
# Idempotency: bootstrap_venv.sh / sentra-core bootstrap.sh both no-op when
# the venv is already healthy, so re-running this script is safe.
set -euo pipefail

cd "$(dirname "$0")"

# --- sentra-core venv bootstrap ---------------------------------------------
SENTRA_CORE_DIR="/home/runner/workspace/services/sentra-core"
if [ ! -f "$SENTRA_CORE_DIR/scripts/bootstrap.sh" ]; then
  echo "[api-server start-prod.sh] FATAL: sentra-core bootstrap missing at $SENTRA_CORE_DIR/scripts/bootstrap.sh" >&2
  exit 1
fi
echo "[api-server start-prod.sh] Bootstrapping sentra-core venv..."
bash "$SENTRA_CORE_DIR/scripts/bootstrap.sh"

# --- Amaru sidecar (FastAPI chakra orchestrator) ----------------------------
# Mirrors the amaru block in start.sh. The api-server proxies /amaru/* to this
# sidecar (see src/routes/amaru-proxy.ts) and ops-core features depend on it.
AMARU_DIR="/home/runner/workspace/services/amaru"
AMARU_LOG="/tmp/amaru.log"
AMARU_PORT="${AMARU_PORT:-6810}"
AMARU_PID=""
if [ ! -f "$AMARU_DIR/scripts/bootstrap_venv.sh" ] || [ ! -f "$AMARU_DIR/scripts/serve_dualstack.py" ]; then
  echo "[api-server start-prod.sh] FATAL: amaru sidecar missing at $AMARU_DIR" >&2
  exit 1
fi
if (exec 3<>/dev/tcp/127.0.0.1/"$AMARU_PORT") 2>/dev/null; then
  exec 3<&- 3>&-
  echo "[api-server start-prod.sh] Port ${AMARU_PORT} already bound; assuming external amaru and skipping sidecar spawn"
else
  echo "[api-server start-prod.sh] Bootstrapping amaru venv..."
  (cd "$AMARU_DIR" && bash scripts/bootstrap_venv.sh)
  echo "[api-server start-prod.sh] Launching amaru sidecar on port ${AMARU_PORT} — log: $AMARU_LOG"
  (
    cd "$AMARU_DIR"
    PYTHONPATH=src PORT="$AMARU_PORT" \
      AMARU_YAWAR_BUS_URL="${AMARU_YAWAR_BUS_URL:-http://localhost:${PORT:-8080}/api/prism-bus/publish}" \
      AMARU_YAWAR_BUS_DOMAIN="${AMARU_YAWAR_BUS_DOMAIN:-amaru}" \
      exec .venv/bin/python scripts/serve_dualstack.py
  ) >"$AMARU_LOG" 2>&1 &
  AMARU_PID=$!
  echo "[api-server start-prod.sh] Amaru pid=$AMARU_PID"
  cleanup() {
    if [ -n "$AMARU_PID" ] && kill -0 "$AMARU_PID" 2>/dev/null; then
      kill "$AMARU_PID" 2>/dev/null || true
    fi
  }
  trap cleanup EXIT INT TERM
fi

exec node --max-old-space-size=2048 --expose-gc --enable-source-maps ./dist/index.mjs
