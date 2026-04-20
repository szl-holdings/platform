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

# --- NEXUS frontend rebuild ---------------------------------------------------
# The NEXUS UI (artifacts/mockup-sandbox) is served as a static build by this
# API server (see app.ts -> nexusDist). Rebuild the Vite bundle automatically
# whenever any source file is newer than the built index.html so that a simple
# restart of this workflow is enough to pick up frontend changes.
NEXUS_DIR="/home/runner/workspace/artifacts/mockup-sandbox"
NEXUS_DIST_INDEX="$NEXUS_DIR/dist/public/index.html"
NEEDS_NEXUS_BUILD=0
if [ ! -f "$NEXUS_DIST_INDEX" ]; then
  NEEDS_NEXUS_BUILD=1
elif [ -n "$(find "$NEXUS_DIR/src" "$NEXUS_DIR/index.html" "$NEXUS_DIR/vite.config.ts" "$NEXUS_DIR/package.json" -newer "$NEXUS_DIST_INDEX" -print -quit 2>/dev/null)" ]; then
  NEEDS_NEXUS_BUILD=1
fi
if [ "${FORCE_NEXUS_BUILD:-0}" = "1" ]; then
  NEEDS_NEXUS_BUILD=1
fi
if [ "${SKIP_NEXUS_BUILD:-0}" = "1" ]; then
  NEEDS_NEXUS_BUILD=0
fi
if [ "$NEEDS_NEXUS_BUILD" = "1" ]; then
  echo "[api-server start.sh] Building NEXUS frontend (mockup-sandbox)..."
  if (cd "$NEXUS_DIR" && NODE_ENV=production node_modules/.bin/vite build); then
    echo "[api-server start.sh] NEXUS frontend build complete."
  else
    echo "[api-server start.sh] WARN: NEXUS frontend build failed — API server will start without updated NEXUS UI." >&2
  fi
else
  echo "[api-server start.sh] NEXUS frontend build is up to date; skipping rebuild."
fi
# -----------------------------------------------------------------------------

# --- NEXUS frontend watch-mode rebuild ---------------------------------------
# Run `vite build --watch` in the background so edits in mockup-sandbox/src are
# rebuilt into dist/public on every save without restarting this workflow.
# Disable with WATCH_NEXUS=0. The watcher is killed when this script exits.
NEXUS_WATCH_LOG="/tmp/nexus-vite-watch.log"
NEXUS_WATCH_PID=""
if [ "${WATCH_NEXUS:-1}" = "1" ]; then
  echo "[api-server start.sh] Starting NEXUS frontend watch (vite build --watch) — log: $NEXUS_WATCH_LOG"
  (
    cd "$NEXUS_DIR" && NODE_ENV=production exec node_modules/.bin/vite build --watch --logLevel warn
  ) >"$NEXUS_WATCH_LOG" 2>&1 &
  NEXUS_WATCH_PID=$!
  echo "[api-server start.sh] NEXUS watcher pid=$NEXUS_WATCH_PID"
  trap 'if [ -n "$NEXUS_WATCH_PID" ] && kill -0 "$NEXUS_WATCH_PID" 2>/dev/null; then kill "$NEXUS_WATCH_PID" 2>/dev/null || true; fi' EXIT INT TERM
else
  echo "[api-server start.sh] WATCH_NEXUS=0 — skipping NEXUS watcher."
fi
# -----------------------------------------------------------------------------

exec node --max-old-space-size=1536 --expose-gc --optimize-for-size --enable-source-maps ./dist/index.mjs
