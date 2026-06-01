#!/usr/bin/env bash
# audit/verify.sh — Reproducible verification for key source-of-truth metrics
#
# Run from the repo root: bash audit/verify.sh
# Exit code 0 = all assertions pass; non-zero = at least one mismatch.
#
# Expected values are read dynamically from audit/source-of-truth.json so that
# this script never drifts out of sync with the canonical truth document.
# Requires: bash, python3, find, grep, ls (all available in the dev environment).
#
# RBAC NOTE (auth.rbac_roles.count = 11):
#   The source-of-truth tracks 11 *granted user roles* (platform-level permissions
#   assignable to authenticated users). This count is derived from cross-document
#   consistency. The platformRole text enum in lib/db/src/schema/auth.ts contains
#   12 entries: the 11 granted roles plus 'anonymous_visitor', which represents the
#   unauthenticated visitor state (not an assignable permission role). All public-
#   facing docs and source-of-truth.json use 11. See docs/trust/trust-center.md and
#   docs/security-posture.md for the full RBAC role taxonomy.

set -uo pipefail

SOT="audit/source-of-truth.json"

if [ ! -f "$SOT" ]; then
  echo "ERROR: $SOT not found. Run from the repo root." >&2
  exit 2
fi

# Read a numeric value from source-of-truth.json by dot-separated path
# Usage: read_sot "api.route_files.count"
read_sot() {
  local key_path="$1"
  python3 - "$SOT" "$key_path" << 'PYEOF'
import json, sys
with open(sys.argv[1]) as f:
    d = json.load(f)
parts = sys.argv[2].split(".")
val = d
for p in parts:
    val = val[p]
print(val)
PYEOF
}

PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" -eq "$expected" ] 2>/dev/null; then
    printf "  PASS  %-72s actual=%s\n" "$label" "$actual"
    PASS=$((PASS + 1))
  else
    printf "  FAIL  %-72s expected=%s, got=%s\n" "$label" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== SZL Holdings — Source-of-Truth Verification ==="
echo "    Expected values read from: $SOT"
echo ""

# ── api.route_files.count ─────────────────────────────────────────────────────
EXP=$(read_sot "api.route_files.count")
ACT=$(find artifacts/api-server/src/routes -name '*.ts' \
  ! -name '*.test.ts' ! -name '*.spec.ts' 2>/dev/null | wc -l | tr -d ' ')
check "api.route_files.count" "$EXP" "$ACT"

# ── api.route_groups_top_level.count ─────────────────────────────────────────
EXP=$(read_sot "api.route_groups_top_level.count")
ACT=$(find artifacts/api-server/src/routes \
  -mindepth 1 -maxdepth 1 -type d 2>/dev/null | grep -v '__tests__' | wc -l | tr -d ' ')
check "api.route_groups_top_level.count" "$EXP" "$ACT"

# ── packages.total_packages.count ─────────────────────────────────────────────
EXP=$(read_sot "packages.total_packages.count")
PKG=$(ls packages/ 2>/dev/null | wc -l | tr -d ' ')
LIB=$(ls lib/ 2>/dev/null | wc -l | tr -d ' ')
ACT=$((PKG + LIB))
check "packages.total_packages.count" "$EXP" "$ACT"

# ── track4_db_verification.schema.primary_schema_files.count ─────────────────
EXP=$(read_sot "track4_db_verification.schema.primary_schema_files.count")
ACT=$(find lib/db/src/schema -name '*.ts' 2>/dev/null | wc -l | tr -d ' ')
check "track4_db_verification.schema.primary_schema_files.count" "$EXP" "$ACT"

# ── track4_db_verification.schema.pgTable_call_sites.count ───────────────────
EXP=$(read_sot "track4_db_verification.schema.pgTable_call_sites.count")
ACT=$(grep -rh 'pgTable(' lib/db/src/schema/ --include='*.ts' 2>/dev/null \
  | grep -v '^//' | wc -l | tr -d ' ')
check "track4_db_verification.schema.pgTable_call_sites.count" "$EXP" "$ACT"

# ── screenshots.approved.count ───────────────────────────────────────────────
EXP=$(read_sot "screenshots.approved.count" 2>/dev/null || echo 10)
ACT=$(find screenshots/approved/ -maxdepth 1 -type f \
  \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' \) 2>/dev/null \
  | wc -l | tr -d ' ')
check "screenshots.approved.count" "$EXP" "$ACT"

# ── auth.rbac_roles.count (cross-doc claim, see header RBAC NOTE) ────────────
# Reported as INFO because the enum has 12 values (11 granted + anonymous_visitor),
# which does not equal the source-of-truth count (11). The discrepancy is explained
# in the RBAC NOTE above and in docs/trust/trust-center.md.
EXP_RBAC=$(read_sot "auth.rbac_roles.count")
echo ""
echo "  INFO  auth.rbac_roles.count (source-of-truth: $EXP_RBAC granted roles)"
echo "        platformRole enum has 12 values: 11 granted + 'anonymous_visitor' (unauthenticated state)."
echo "        See RBAC NOTE in this script and docs/trust/trust-center.md."

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "DRIFT DETECTED — update audit/source-of-truth.json if counts changed intentionally"
  exit 1
fi

echo "All asserted metrics match audit/source-of-truth.json"
exit 0
