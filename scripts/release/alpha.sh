#!/usr/bin/env bash
# scripts/release/alpha.sh — SZL Holdings Platform
# Alpha release gate: runs pre-release checks and (optionally) publishes
# a GitHub release draft via the existing publish-github-release.mjs script.
#
# Usage:
#   bash scripts/release/alpha.sh              # gate checks only (dry run)
#   bash scripts/release/alpha.sh --publish    # run checks then publish draft
#   bash scripts/release/alpha.sh --skip-tests # skip test suite (fast gate)
#
# Exit codes:
#   0  — gate passed (or publish succeeded)
#   1  — gate failed (or publish failed)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

PUBLISH=false
SKIP_TESTS=false

for arg in "$@"; do
  case "$arg" in
    --publish)    PUBLISH=true ;;
    --skip-tests) SKIP_TESTS=true ;;
  esac
done

log()  { echo "[alpha-release] $*"; }
die()  { echo "[alpha-release] FATAL: $*" >&2; exit 1; }

log "=== Alpha Release Gate ==="

# ── 1. Env validation ────────────────────────────────────────────────────────
log "[1/5] Validating environment…"
node scripts/qa/verify-env.js || die "Environment validation failed."

# ── 2. Brand check ───────────────────────────────────────────────────────────
log "[2/5] Brand string check…"
pnpm run brand:strings || die "Brand string violations found."

# ── 3. Type check ────────────────────────────────────────────────────────────
log "[3/5] TypeScript type check…"
pnpm run typecheck:libs || die "TypeScript errors found."

# ── 4. Tests ─────────────────────────────────────────────────────────────────
if [ "$SKIP_TESTS" = "false" ]; then
  log "[4/5] Unit tests…"
  pnpm run test:unit || die "Unit tests failed."
else
  log "[4/5] Tests skipped (--skip-tests)."
fi

# ── 5. Mock / route audit ────────────────────────────────────────────────────
log "[5/5] Mock and route audit…"
pnpm run audit:mocks || die "Mock audit failed."
pnpm run audit:routes || die "Route audit failed."

log "=== Gate PASSED ==="

# ── Publish (optional) ────────────────────────────────────────────────────────
if [ "$PUBLISH" = "true" ]; then
  log "Publishing GitHub release draft…"
  node scripts/launch/publish-github-release.mjs || die "GitHub release publish failed."
  log "✅ Alpha release draft published."
else
  log "✅ Gate passed. Run with --publish to create a GitHub release draft."
fi
