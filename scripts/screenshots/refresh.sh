#!/usr/bin/env bash
# scripts/screenshots/refresh.sh — SZL Holdings Platform
# Refreshes product screenshots by running the proof-capture pipeline.
# Requires the platform to be running (all artifact workflows active).
#
# Usage:
#   SCREENSHOT_CAPTURE_MODE=local-qa \
#     SCREENSHOT_OUTPUT_DIR=audit/screenshots/<archive> \
#     PLAYWRIGHT_BASE_URL=http://127.0.0.1:<port> \
#     bash scripts/screenshots/refresh.sh
#   bash scripts/screenshots/refresh.sh --check   # assert workflows running, then exit

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

CHECK_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --check) CHECK_ONLY=true ;;
  esac
done

echo "[screenshots] Asserting platform workflows are running…"
if ! node scripts/assert-workflows-running.mjs; then
  echo "[screenshots] ❌ One or more artifact workflows are not running."
  echo "[screenshots]    Start the platform first: pnpm dev"
  exit 1
fi

if [ "$CHECK_ONLY" = "true" ]; then
  echo "[screenshots] ✅ All workflows running. (--check only, skipping capture)"
  exit 0
fi

echo "[screenshots] Capturing proof screenshots…"
node scripts/capture-proof-screenshots.mjs --filter=p0-series-a

echo "[screenshots] ✅ Screenshot refresh complete."
