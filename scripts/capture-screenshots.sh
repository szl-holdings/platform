#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# SZL Holdings — Screenshot Regeneration Harness
# Captures hero screenshots and key-view galleries for every artifact.
#
# Usage:
#   bash scripts/capture-screenshots.sh            # all artifacts
#   bash scripts/capture-screenshots.sh sentra     # single artifact
#
# Output: media/screenshots/<artifact>/<view>.png  (2× resolution, 1920×1080)
#
# Requirements:
#   • Playwright browsers installed  →  npx playwright install chromium
#   • All artifact workflows running  →  check via workflow status
#   • Run from repo root
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$REPO_ROOT/media/screenshots"
SCRIPT="$SCRIPT_DIR/_screenshot-runner.mjs"

# Base URL — Replit dev domain or local fallback
BASE_URL="${REPLIT_DEV_DOMAIN:+https://${REPLIT_DEV_DOMAIN}}"
BASE_URL="${BASE_URL:-http://localhost:80}"

FILTER="${1:-}"

echo ""
echo "  SZL Holdings Screenshot Harness"
echo "  Base URL: $BASE_URL"
echo "  Output:   $OUT_DIR"
echo ""

mkdir -p "$OUT_DIR"

node "$SCRIPT" "$BASE_URL" "$OUT_DIR" "$FILTER"

echo ""
echo "  Done. Screenshots written to media/screenshots/"
echo ""
