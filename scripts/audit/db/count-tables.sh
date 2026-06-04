#!/usr/bin/env bash
# scripts/audit/db/count-tables.sh
# Count pgTable definitions in the primary schema directory.
# Usage: bash scripts/audit/db/count-tables.sh
# Run from workspace root.

set -uo pipefail

SCHEMA_DIR="lib/db/src/schema"
SUPP_DIR="packages/db-schema/src/domains"

echo "=== DB Audit: Table Definition Counts ==="
echo "Date: $(date -u '+%Y-%m-%d')"
echo ""

echo "--- Primary schema ($SCHEMA_DIR) ---"
PRIMARY_FILES=$(find "$SCHEMA_DIR" -name "*.ts" | wc -l | tr -d ' ')
PRIMARY_TABLES=$(grep -rh 'pgTable(' "$SCHEMA_DIR" --include="*.ts" 2>/dev/null | grep -v '^//' | wc -l | tr -d ' ')
echo "  Schema files   : $PRIMARY_FILES"
echo "  pgTable() calls: $PRIMARY_TABLES"

echo ""
echo "--- Supplementary schema ($SUPP_DIR) ---"
SUPP_FILES=$(find "$SUPP_DIR" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
SUPP_TABLES=$(grep -rh 'pgTable(' "$SUPP_DIR" --include="*.ts" 2>/dev/null | grep -v '^//' 2>/dev/null | wc -l | tr -d ' ')
echo "  Schema files   : $SUPP_FILES"
echo "  pgTable() calls: $SUPP_TABLES  (0 = re-exports only; no independent table definitions)"

echo ""
echo "--- Migration inventory ---"
DRIZZLE_MIGS=$(ls lib/db/drizzle/ | grep -v '^meta$' | wc -l | tr -d ' ')
JOURNAL_ENTRIES=$(python3 -c "import json; d=json.load(open('lib/db/drizzle/meta/_journal.json')); print(len(d.get('entries',[])))" 2>/dev/null || echo "N/A")
HAND_MIGS=$(ls lib/db/migrations/ 2>/dev/null | wc -l | tr -d ' ')
ROLLBACK_SCRIPTS=$(ls scripts/rollback/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo "  Drizzle SQL files (lib/db/drizzle/)          : $DRIZZLE_MIGS"
echo "  Drizzle journal entries (__drizzle_migrations): $JOURNAL_ENTRIES"
echo "  Hand-authored migrations (lib/db/migrations/) : $HAND_MIGS"
echo "  Rollback scripts (scripts/rollback/)          : $ROLLBACK_SCRIPTS"

echo ""
echo "--- Supplemental package migration ---"
SUPP_MIGS=$(ls packages/db/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo "  packages/db/migrations/*.sql: $SUPP_MIGS"

echo ""
echo "--- Seed inventory ---"
SEED_NARRATIVES=$(ls packages/demo-seed/src/narrative-*.ts 2>/dev/null | wc -l | tr -d ' ')
SEED_SCRIPTS=$(ls scripts/seed-*.ts scripts/seed-*.sh 2>/dev/null | wc -l | tr -d ' ')
echo "  Demo-seed narrative files: $SEED_NARRATIVES"
echo "  Root seed scripts        : $SEED_SCRIPTS"

echo ""
echo "=== Done ==="
