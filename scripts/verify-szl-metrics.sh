#!/usr/bin/env bash
# verify-szl-metrics.sh
#
# Re-runnable empirical verifier for every quantitative claim on the
# szl-holdings landing page and the ouroboros-thesis README. Run from
# the platform/ repo root with DATABASE_URL set.
#
# Output is plain numbers — copy-paste them straight into a README
# badge bump or a funding deck. Numbers in this script are MEASURED,
# never hand-counted, never cached, never aspirational.
#
# Exit 0 always (this is a measurement, not a gate). The companion
# script `check-szl-metrics-drift.sh` (TODO) gates a max-allowed drift.

set -u
echo "=== SZL Holdings · Live metrics · $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# --- DB (requires DATABASE_URL) ----------------------------------------------
if [ -n "${DATABASE_URL:-}" ]; then
  TABLES=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null)
  echo "db_tables_public                 = ${TABLES:-?}"
else
  echo "db_tables_public                 = (DATABASE_URL not set)"
fi

# --- DB schema source files --------------------------------------------------
SCHEMA_TS=$(find lib/db/src -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
echo "db_schema_ts_files               = $SCHEMA_TS"

# --- API endpoints -----------------------------------------------------------
EP_STRICT=$(rg -t ts \
  "(?:router|app|r)\.(?:get|post|put|delete|patch|head|options)\s*\(\s*['\"\`]" \
  -g '!node_modules' -g '!*.test.ts' -g '!*.spec.ts' 2>/dev/null | wc -l | tr -d ' ')
EP_BROAD=$(rg -t ts \
  "(?:router|app|r|api)\.(?:get|post|put|delete|patch|all|use|head|options)\s*\(" \
  -g '!node_modules' -g '!*.test.ts' -g '!*.spec.ts' 2>/dev/null | wc -l | tr -d ' ')
EP_PY=$(rg "@(?:app|router)\.(?:get|post|put|delete|patch)" services/ 2>/dev/null | wc -l | tr -d ' ')
echo "api_endpoints_typescript_strict  = $EP_STRICT   # string-literal path"
echo "api_endpoints_typescript_broad   = $EP_BROAD    # includes .use(), .all(), middleware mounts"
echo "api_endpoints_python             = $EP_PY"

# --- Workspace packages ------------------------------------------------------
PKG_PNPM=$(pnpm m ls --depth -1 --json 2>/dev/null \
  | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
echo "workspace_packages_pnpm          = ${PKG_PNPM:-?}"

# --- Tests -------------------------------------------------------------------
TEST_FILES=$(find . -path ./node_modules -prune -o \
  \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) \
  -print 2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')
TEST_DECLS=$(rg "^\s*(?:test|it)\(" \
  -g '*.test.*' -g '*.spec.*' -g '!node_modules' 2>/dev/null | wc -l | tr -d ' ')
echo "test_files_total                 = $TEST_FILES"
echo "test_declarations_total          = $TEST_DECLS"

# --- CI ----------------------------------------------------------------------
CI=$(find .github/workflows -maxdepth 1 \( -name "*.yml" -o -name "*.yaml" \) 2>/dev/null \
  | wc -l | tr -d ' ')
echo "ci_workflows                     = $CI"

# --- Surfaces (artifacts) ----------------------------------------------------
ART_ALL=$(ls -d artifacts/*/ 2>/dev/null | wc -l | tr -d ' ')
ART_CUSTOMER=$(ls -d artifacts/{a11oy,sentra,amaru,vessels,counsel,carlota-jo,terra,lexicon,pulse,conduit}/ 2>/dev/null | wc -l | tr -d ' ')
echo "artifacts_total                  = $ART_ALL"
echo "artifacts_customer_facing        = $ART_CUSTOMER  # 8 surfaces + a11oy orchestrator + conduit (Amaru UI)"

# --- Ouroboros runtime tests claim (218/218) ---------------------------------
if [ -d packages/ouroboros-horizon ]; then
  OH=$(rg -c "^\s*(?:test|it)\(" packages/ouroboros-horizon/ 2>/dev/null \
    | awk -F: '{s+=$2} END {print s+0}')
  echo "ouroboros_horizon_test_decls     = $OH"
fi

# --- Ecosystem live verdict (if api-server is running) -----------------------
if curl -sf -o /dev/null -m 2 "http://localhost:80/api/ecosystem/snapshot"; then
  curl -sf -m 5 "http://localhost:80/api/ecosystem/snapshot" \
    | python3 -c "
import sys, json
d = json.load(sys.stdin)
c = d.get('counts', {})
print(f'ecosystem_verdict                = {d.get(\"ecosystem_verdict\")}')
print(f'ecosystem_apps_focus_op          = {c.get(\"apps_operational\")}/{c.get(\"apps_focus\")}')
print(f'ecosystem_org_repos_op           = {c.get(\"org_operational\")}/{c.get(\"org_repos\")}')
print(f'ecosystem_org_theater_flags      = {c.get(\"org_theater_flags\")}')
"
fi

echo "=== end ==="
