#!/bin/bash
set -e
cd /home/runner/workspace/artifacts/api-server

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
  (cd "$NEXUS_DIR" && NODE_ENV=production node_modules/.bin/vite build)
  echo "[api-server start.sh] NEXUS frontend build complete."
else
  echo "[api-server start.sh] NEXUS frontend build is up to date; skipping rebuild."
fi
# -----------------------------------------------------------------------------

test -f ./dist/index.mjs || node ./build.mjs
exec node --max-old-space-size=1536 --expose-gc --optimize-for-size --enable-source-maps ./dist/index.mjs
