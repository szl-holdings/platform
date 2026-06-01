#!/usr/bin/env bash
# check-zod-coverage.sh — Enforces ≥80% Zod input validation coverage across
# API route files. Run this in CI to prevent coverage regression.
#
# Exit codes:
#   0 — coverage at or above the threshold
#   1 — coverage below the threshold (CI fail)
#
# Usage:
#   bash scripts/check-zod-coverage.sh
#   bash scripts/check-zod-coverage.sh --threshold 85   # custom threshold
#
set -euo pipefail

ROUTES_DIR="${ROUTES_DIR:-artifacts/api-server/src/routes}"
THRESHOLD="${2:-80}"
if [[ "${1:-}" == "--threshold" && -n "${2:-}" ]]; then
  THRESHOLD="$2"
fi

# Count route files (exclude test files, barrel indexes, and shared helpers)
TOTAL=$(find "$ROUTES_DIR" -name "*.ts" \
  | grep -v "__tests__" \
  | grep -v "/index\.ts$" \
  | grep -v "/shared\.ts$" \
  | wc -l | tr -d ' ')

# A file "has validation" if it contains any of:
#   validateBody(   — middleware-style Zod gate
#   validateQuery(  — query param validation
#   safeParse(      — inline Zod safeParse
#   z\.parse(       — direct Zod schema parse
#   \.parse(req     — Drizzle insert schema parse on req.body
WITH_VALIDATION=$(grep -rl \
  "validateBody\|validateQuery\|safeParse\|z\.parse\|\.parse(req" \
  "$ROUTES_DIR" --include="*.ts" \
  | grep -v "__tests__" \
  | grep -v "/index\.ts$" \
  | grep -v "/shared\.ts$" \
  | wc -l | tr -d ' ')

if [[ "$TOTAL" -eq 0 ]]; then
  echo "ERROR: No route files found in $ROUTES_DIR" >&2
  exit 1
fi

COVERAGE=$(( WITH_VALIDATION * 100 / TOTAL ))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Zod Input Validation Coverage Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Route files audited : $TOTAL"
echo "  Files with validation: $WITH_VALIDATION"
echo "  Coverage             : $COVERAGE%"
echo "  Required threshold   : ${THRESHOLD}%"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$COVERAGE" -lt "$THRESHOLD" ]]; then
  echo "FAIL — Coverage $COVERAGE% is below the required ${THRESHOLD}% threshold."
  echo ""
  echo "Files WITHOUT validation (sample — first 20):"
  grep -rL "validateBody\|validateQuery\|safeParse\|z\.parse\|\.parse(req" \
    "$ROUTES_DIR" --include="*.ts" \
    | grep -v "__tests__" \
    | grep -v "/index\.ts$" \
    | grep -v "/shared\.ts$" \
    | head -20
  exit 1
fi

echo "PASS — Coverage $COVERAGE% meets the ${THRESHOLD}% threshold."
exit 0
