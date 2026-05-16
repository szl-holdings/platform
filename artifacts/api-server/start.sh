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
if [ -f "$EVAL_RUNNER_DIR/run.py" ] && command -v python3 >/dev/null 2>&1; then
  echo "[api-server start.sh] Launching eval-runner sidecar on port 8001 — log: $EVAL_RUNNER_LOG"
  (
    cd "$EVAL_RUNNER_DIR"
    PORT=8001 exec python3 run.py
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
else
  echo "[api-server start.sh] WARN: eval-runner not found or python3 unavailable — skipping sidecar." >&2
fi
# -----------------------------------------------------------------------------

exec node --max-old-space-size=1536 --expose-gc --optimize-for-size --enable-source-maps ./dist/index.mjs
