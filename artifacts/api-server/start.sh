#!/bin/bash
set -e
cd /home/runner/workspace/artifacts/api-server

# --- API server build ---------------------------------------------------------
# This script is the authoritative standalone entry point for the API server.
# It runs as its own workflow (artifacts/api-server: api) independently of any
# other app. Rebuild the server bundle whenever source files are newer than the
# built output so that a simple workflow restart picks up code changes.
DIST="./dist/index.mjs"
NEEDS_BUILD=0
if [ ! -f "$DIST" ]; then
  NEEDS_BUILD=1
elif [ -n "$(find ./src -name '*.ts' -newer "$DIST" -print -quit 2>/dev/null)" ]; then
  NEEDS_BUILD=1
elif [ package.json -nt "$DIST" ] || [ build.mjs -nt "$DIST" ]; then
  NEEDS_BUILD=1
fi
if [ "$NEEDS_BUILD" = "1" ]; then
  echo "[api-server start.sh] Building API server..."
  node ./build.mjs
  echo "[api-server start.sh] Build complete."
else
  echo "[api-server start.sh] Build is up to date; skipping rebuild."
fi
# -----------------------------------------------------------------------------

# --- NEXUS frontend rebuild (RETIRED) -----------------------------------------
# As of task #4310 (Praxis→A11oy / NEXUS consolidation), the standalone
# mockup-sandbox NEXUS UI was retired and all 16 Nexus pages now live inside
# the A11oy artifact under /nexus/*. The static-serve route in app.ts that
# pointed to mockup-sandbox/dist/public was removed in the same merge.
# This block previously ran a Vite build + watcher against the now-deleted
# /home/runner/workspace/artifacts/mockup-sandbox directory, which fails with
# "Could not resolve entry module index.html" on every workflow restart.
# Skipping intentionally. Re-enable only if mockup-sandbox is reinstated.
NEXUS_WATCH_PID=""
echo "[api-server start.sh] NEXUS frontend build skipped — mockup-sandbox retired (task #4310). Nexus now lives in artifacts/a11oy/src/pages/nexus/."
# -----------------------------------------------------------------------------

# --- Substrate MCP gateway sidecar -------------------------------------------
# The substrate MCP gateway runs as a sibling Node process so that the api-server
# workflow exposes both the main API (on :8080) and the MCP gateway (on :8099).
# The api-server router proxies /mcp/* to localhost:8099.
SUBSTRATE_GATEWAY_PORT="${SUBSTRATE_GATEWAY_PORT:-8099}"
export SUBSTRATE_GATEWAY_PORT
echo "[api-server start.sh] Launching substrate-mcp-gateway sidecar on port ${SUBSTRATE_GATEWAY_PORT}..."
(
  cd /home/runner/workspace/services/substrate-mcp-gateway
  exec pnpm start 2>&1 | sed -u 's/^/[mcp-gateway] /'
) &
GATEWAY_PID=$!

# Combined cleanup trap: kill both the NEXUS watcher (if running) and the
# substrate MCP gateway sidecar when this script exits.
cleanup() {
  if [ -n "$NEXUS_WATCH_PID" ] && kill -0 "$NEXUS_WATCH_PID" 2>/dev/null; then
    kill "$NEXUS_WATCH_PID" 2>/dev/null || true
  fi
  if [ -n "$GATEWAY_PID" ] && kill -0 "$GATEWAY_PID" 2>/dev/null; then
    kill "$GATEWAY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM
# -----------------------------------------------------------------------------

# --- Agent Gateway sidecar ---------------------------------------------------
# The agent-gateway exposes /v1/capabilities and /v1/agent/action for tool-using
# agents. It runs as a Node sidecar bound to port 6800. The api-server artifact's
# secondary [[services]] entry maps /agent-gateway/* to this port via the proxy.
AGENT_GATEWAY_PORT="${AGENT_GATEWAY_PORT:-6800}"
AGENT_GATEWAY_DIR="/home/runner/workspace/platform/agent-gateway"
AGENT_GATEWAY_LOG="/tmp/agent-gateway.log"
if [ ! -d "$AGENT_GATEWAY_DIR" ]; then
  echo "[api-server start.sh] FATAL: agent-gateway directory not found at $AGENT_GATEWAY_DIR" >&2
  exit 1
fi
# Build dist/ if missing or stale (dist/ is intentionally untracked in git).
AG_DIST="$AGENT_GATEWAY_DIR/dist/server.js"
AG_NEEDS_BUILD=0
if [ ! -f "$AG_DIST" ]; then
  AG_NEEDS_BUILD=1
elif [ -n "$(find "$AGENT_GATEWAY_DIR/src" -name '*.ts' -newer "$AG_DIST" -print -quit 2>/dev/null)" ]; then
  AG_NEEDS_BUILD=1
fi
if [ "$AG_NEEDS_BUILD" = "1" ]; then
  echo "[api-server start.sh] Building agent-gateway (tsc)..."
  # tsc returns non-zero on type errors elsewhere in the workspace (e.g. unrelated
  # 'openai' module), but still emits dist/. Tolerate non-zero exit and verify
  # dist/server.js was produced below.
  (cd "$AGENT_GATEWAY_DIR" && pnpm run build) || \
    echo "[api-server start.sh] WARN: agent-gateway tsc reported errors; verifying emitted dist/..." >&2
fi
if [ ! -f "$AG_DIST" ]; then
  echo "[api-server start.sh] FATAL: agent-gateway dist/server.js still missing after build" >&2
  exit 1
fi
if (exec 3<>/dev/tcp/127.0.0.1/"$AGENT_GATEWAY_PORT") 2>/dev/null; then
  exec 3<&- 3>&-
  echo "[api-server start.sh] Port ${AGENT_GATEWAY_PORT} already bound (standalone agent-gateway workflow); skipping sidecar spawn"
  AGENT_GATEWAY_PID=""
else
  echo "[api-server start.sh] Launching agent-gateway sidecar on port ${AGENT_GATEWAY_PORT} — log: $AGENT_GATEWAY_LOG"
  (
    cd "$AGENT_GATEWAY_DIR"
    PORT="$AGENT_GATEWAY_PORT" BASE_PATH="/agent-gateway" exec node dist/server.js 2>&1 \
      | sed -u 's/^/[agent-gateway] /' \
      | tee -a "$AGENT_GATEWAY_LOG"
  ) &
  AGENT_GATEWAY_PID=$!
  echo "[api-server start.sh] Agent-gateway pid=$AGENT_GATEWAY_PID"
fi
old_cleanup_ag=$(declare -f cleanup)
cleanup() {
  eval "${old_cleanup_ag#cleanup ()}"
  if [ -n "$AGENT_GATEWAY_PID" ] && kill -0 "$AGENT_GATEWAY_PID" 2>/dev/null; then
    kill "$AGENT_GATEWAY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM
# -----------------------------------------------------------------------------

# --- Eval Runner sidecar -----------------------------------------------------
# The governed evaluation harness runs as a Python FastAPI process alongside the
# API server. Starts on port 8001 (EVAL_RUNNER_URL defaults to localhost:8001).
# The api-server proxies /eval-harness/* to this sidecar.
EVAL_RUNNER_DIR="/home/runner/workspace/apps/eval-runner"
EVAL_RUNNER_LOG="/tmp/eval-runner.log"
if [ -f "$EVAL_RUNNER_DIR/run.py" ] && [ -f "$EVAL_RUNNER_DIR/scripts/bootstrap.sh" ] && command -v python3 >/dev/null 2>&1; then
  # Idempotent venv bootstrap (task #5260). Without this the sidecar tries to
  # import fastapi/uvicorn/httpx from a non-existent .pythonlibs/ in any clean
  # environment and crash-loops on every restart.
  echo "[api-server start.sh] Bootstrapping eval-runner venv..."
  if ! bash "$EVAL_RUNNER_DIR/scripts/bootstrap.sh"; then
    echo "[api-server start.sh] WARN: eval-runner bootstrap failed — skipping sidecar." >&2
    EVAL_RUNNER_PID=""
  else
  echo "[api-server start.sh] Launching eval-runner sidecar on port 8001 — log: $EVAL_RUNNER_LOG"
  (
    cd "$EVAL_RUNNER_DIR"
    PORT=8001 exec .venv/bin/python run.py
  ) >"$EVAL_RUNNER_LOG" 2>&1 &
  EVAL_RUNNER_PID=$!
  echo "[api-server start.sh] Eval-runner pid=$EVAL_RUNNER_PID"
  # Extend cleanup trap to also kill the eval-runner
  old_cleanup=$(declare -f cleanup)
  cleanup() {
    eval "${old_cleanup#cleanup ()}"
    if [ -n "$EVAL_RUNNER_PID" ] && kill -0 "$EVAL_RUNNER_PID" 2>/dev/null; then
      kill "$EVAL_RUNNER_PID" 2>/dev/null || true
    fi
  }
  trap cleanup EXIT INT TERM
  fi
else
  echo "[api-server start.sh] WARN: eval-runner not found or python3 unavailable — skipping sidecar." >&2
fi
# -----------------------------------------------------------------------------

# --- Amaru sidecar -----------------------------------------------------------
# Amaru (FastAPI) is the chakra orchestrator that serves /amaru/* via the
# api-server's proxy route to localhost:6810. We co-launch it here as a child
# of the api workflow because the standalone `[[services]] amaru` artifact
# workflow consistently fails the platform's port-readiness check on Replit's
# infrastructure even when uvicorn binds successfully on 0.0.0.0:6810 — both
# IPv6-dualstack and plain IPv4 bind variants were tested (task #5260). The
# standalone entry was removed from artifact.toml; this inline co-launch is
# now the single source of truth.
AMARU_DIR="/home/runner/workspace/services/amaru"
AMARU_LOG="/tmp/amaru.log"
AMARU_PORT="${AMARU_PORT:-6810}"
export AMARU_PORT
if (exec 3<>/dev/tcp/127.0.0.1/"$AMARU_PORT") 2>/dev/null; then
  exec 3<&- 3>&-
  echo "[api-server start.sh] Port ${AMARU_PORT} already bound; skipping amaru spawn"
  AMARU_PID=""
elif [ -f "$AMARU_DIR/scripts/serve_dualstack.py" ] && [ -f "$AMARU_DIR/scripts/bootstrap_venv.sh" ]; then
  echo "[api-server start.sh] Launching amaru sidecar on port ${AMARU_PORT} — log: $AMARU_LOG"
  (
    cd "$AMARU_DIR"
    bash scripts/bootstrap_venv.sh
    PYTHONPATH=src PORT="$AMARU_PORT" \
      AMARU_YAWAR_BUS_URL="${AMARU_YAWAR_BUS_URL:-http://localhost:8080/api/prism-bus/publish}" \
      AMARU_YAWAR_BUS_DOMAIN="${AMARU_YAWAR_BUS_DOMAIN:-amaru}" \
      exec .venv/bin/python scripts/serve_dualstack.py
  ) >"$AMARU_LOG" 2>&1 &
  AMARU_PID=$!
  echo "[api-server start.sh] Amaru pid=$AMARU_PID"
  old_cleanup_am=$(declare -f cleanup)
  cleanup() {
    eval "${old_cleanup_am#cleanup ()}"
    if [ -n "$AMARU_PID" ] && kill -0 "$AMARU_PID" 2>/dev/null; then
      kill "$AMARU_PID" 2>/dev/null || true
    fi
  }
  trap cleanup EXIT INT TERM
else
  echo "[api-server start.sh] WARN: amaru not found — skipping sidecar." >&2
fi
# -----------------------------------------------------------------------------

# --- sentra-core sidecar bootstrap -------------------------------------------
# Sentra is invoked from the api-server via subprocess (see
# src/domain-services/sentra/sentra-core-bridge.ts). The bridge spawns
# `python -m sentra_core.cli` and depends on httpx + sentra_core being importable.
# We bootstrap the venv at workflow start (idempotent, no-op when healthy) so
# the bridge keeps working even when .pythonlibs/ is absent (task #5191).
SENTRA_CORE_DIR="/home/runner/workspace/services/sentra-core"
if [ ! -f "$SENTRA_CORE_DIR/scripts/bootstrap.sh" ]; then
  echo "[api-server start.sh] FATAL: sentra-core bootstrap script missing at $SENTRA_CORE_DIR/scripts/bootstrap.sh" >&2
  exit 1
fi
echo "[api-server start.sh] Bootstrapping sentra-core venv..."
# Fail fast: a broken sentra-core sidecar means every /api/sentra/core/* request
# will 500. Refuse to start rather than serve a half-broken surface (task #5191).
bash "$SENTRA_CORE_DIR/scripts/bootstrap.sh"
# -----------------------------------------------------------------------------

# --- Sentra Detector Sidecar -------------------------------------------------
# Hosts the Python anomaly detectors (sklearn IsolationForest, embedding drift)
# from services/sentra-detector-sidecar/. The api-server proxies
# /api/sentra/detectors/:id/run to this sidecar when manifest.runtime=="python".
# Same rationale as amaru above: the standalone artifact workflow cannot pass
# Replit's port-readiness check, so this inline co-launch is the single source
# of truth (task #5260). The CSRF and global-auth exemptions for
# /api/sentra/detectors/sidecar-register are now in place so the registration
# handshake succeeds end-to-end.
SENTRA_SIDECAR_DIR="/home/runner/workspace/services/sentra-detector-sidecar"
SENTRA_SIDECAR_LOG="/tmp/sentra-sidecar.log"
SENTRA_SIDECAR_PORT="${SENTRA_SIDECAR_PORT:-8765}"
export SENTRA_SIDECAR_PORT
export SENTRA_API_SERVER_URL="${SENTRA_API_SERVER_URL:-http://127.0.0.1:${PORT:-8080}}"
export SENTRA_SIDECAR_HEARTBEAT_SECONDS="${SENTRA_SIDECAR_HEARTBEAT_SECONDS:-30}"
if (exec 3<>/dev/tcp/127.0.0.1/"$SENTRA_SIDECAR_PORT") 2>/dev/null; then
  exec 3<&- 3>&-
  echo "[api-server start.sh] Port ${SENTRA_SIDECAR_PORT} already bound; skipping sentra-sidecar spawn"
  SENTRA_SIDECAR_PID=""
elif [ -f "$SENTRA_SIDECAR_DIR/src/sidecar/main.py" ] && command -v python3 >/dev/null 2>&1; then
  echo "[api-server start.sh] Launching sentra-sidecar on port ${SENTRA_SIDECAR_PORT} — log: $SENTRA_SIDECAR_LOG"
  # IMPORTANT: override PORT here. sidecar/main.py reads PORT FIRST and only
  # falls back to SENTRA_SIDECAR_PORT — without this override the api's
  # PORT=8080 leaks through and uvicorn tries to bind 8080 (api's port)
  # instead of 8765, crashing with EADDRINUSE (task #5260).
  (
    PORT="$SENTRA_SIDECAR_PORT" exec bash /home/runner/workspace/scripts/sentra-sidecar-dev.sh
  ) >"$SENTRA_SIDECAR_LOG" 2>&1 &
  SENTRA_SIDECAR_PID=$!
  echo "[api-server start.sh] sentra-sidecar pid=$SENTRA_SIDECAR_PID"
  old_cleanup_ss=$(declare -f cleanup)
  cleanup() {
    eval "${old_cleanup_ss#cleanup ()}"
    if [ -n "$SENTRA_SIDECAR_PID" ] && kill -0 "$SENTRA_SIDECAR_PID" 2>/dev/null; then
      kill "$SENTRA_SIDECAR_PID" 2>/dev/null || true
    fi
  }
  trap cleanup EXIT INT TERM
else
  echo "[api-server start.sh] WARN: sentra-sidecar not found or python3 unavailable — skipping sidecar." >&2
fi
# -----------------------------------------------------------------------------

exec node --max-old-space-size=1536 --expose-gc --optimize-for-size --enable-source-maps ./dist/index.mjs
