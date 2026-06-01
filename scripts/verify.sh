#!/usr/bin/env bash
# scripts/verify.sh — SZL Holdings Platform
# Thin orchestration wrapper: env validation → health check.
# Run after bootstrap to confirm the platform is ready to serve traffic.
#
# Usage:
#   bash scripts/verify.sh              # default: env + health
#   bash scripts/verify.sh --strict     # fail on any missing recommended var
#   bash scripts/verify.sh --env-only   # only run env validation
#   bash scripts/verify.sh --health-only # only run health check

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

STRICT=""
ENV_ONLY=false
HEALTH_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --strict)      STRICT="--strict" ;;
    --env-only)    ENV_ONLY=true ;;
    --health-only) HEALTH_ONLY=true ;;
  esac
done

EXIT_CODE=0

if [ "$HEALTH_ONLY" = "false" ]; then
  echo "[verify] === Environment validation ==="
  # shellcheck disable=SC2086
  node scripts/qa/verify-env.js $STRICT || EXIT_CODE=$?
  echo ""
fi

if [ "$ENV_ONLY" = "false" ]; then
  echo "[verify] === API server health ==="
  node --experimental-vm-modules scripts/qa/health-check.js || EXIT_CODE=$?
  echo ""
fi

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "[verify] ✅ All checks passed."
else
  echo "[verify] ❌ One or more checks failed — see output above."
fi

exit $EXIT_CODE
