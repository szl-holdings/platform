#!/usr/bin/env bash
# scripts/inventory/generate.sh — SZL Holdings Platform
# Generates the workspace artifact inventory report.
# Wraps scripts/inventory/generate-inventory.js.
#
# Usage:
#   bash scripts/inventory/generate.sh              # full inventory to stdout
#   bash scripts/inventory/generate.sh --output <file>  # write to file

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

OUTPUT=""
NEXT_IS_OUTPUT=false
for arg in "$@"; do
  if [ "$NEXT_IS_OUTPUT" = "true" ]; then
    OUTPUT="$arg"
    NEXT_IS_OUTPUT=false
  elif [ "$arg" = "--output" ]; then
    NEXT_IS_OUTPUT=true
  fi
done

echo "[inventory] Generating workspace artifact inventory…"

if [ -n "$OUTPUT" ]; then
  node scripts/inventory/generate-inventory.js > "$OUTPUT"
  echo "[inventory] ✅ Inventory written to: $OUTPUT"
else
  node scripts/inventory/generate-inventory.js
fi
