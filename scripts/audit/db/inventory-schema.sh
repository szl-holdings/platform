#!/usr/bin/env bash
# scripts/audit/db/inventory-schema.sh
#
# Query live PostgreSQL for verified table, relation, index, and constraint counts.
# Requires DATABASE_URL to be set and Postgres to be running.
#
# Usage: bash scripts/audit/db/inventory-schema.sh
# Run from workspace root.

set -uo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set" >&2
  exit 1
fi

echo "=== DB Audit: Live Schema Inventory ==="
echo "Date: $(date -u '+%Y-%m-%d')"
echo "Source: information_schema + pg_catalog (PostgreSQL system catalogs)"
echo ""

psql "$DATABASE_URL" 2>&1 << 'PSQL'
-- ── Table count ──────────────────────────────────────────────────────────────
SELECT
  'Tables (public schema)' AS metric,
  count(*)::text AS value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

-- ── Index count ───────────────────────────────────────────────────────────────
SELECT
  'Indexes (public schema)' AS metric,
  count(*)::text AS value
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

-- ── FK constraints ────────────────────────────────────────────────────────────
SELECT
  'FK constraints (public schema)' AS metric,
  count(*)::text AS value
FROM information_schema.table_constraints
WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'

UNION ALL

-- ── Unique constraints ────────────────────────────────────────────────────────
SELECT
  'UNIQUE constraints (public schema)' AS metric,
  count(*)::text AS value
FROM information_schema.table_constraints
WHERE constraint_schema = 'public' AND constraint_type = 'UNIQUE'

UNION ALL

-- ── Check constraints (includes NOT NULL / enum checks) ───────────────────────
SELECT
  'CHECK constraints (includes NOT NULL + enums)' AS metric,
  count(*)::text AS value
FROM information_schema.table_constraints
WHERE constraint_schema = 'public' AND constraint_type = 'CHECK'

UNION ALL

-- ── PK constraints ────────────────────────────────────────────────────────────
SELECT
  'PRIMARY KEY constraints (public schema)' AS metric,
  count(*)::text AS value
FROM information_schema.table_constraints
WHERE constraint_schema = 'public' AND constraint_type = 'PRIMARY KEY'

UNION ALL

-- ── Drizzle migration tracker ─────────────────────────────────────────────────
SELECT
  '__drizzle_migrations table present' AS metric,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '__drizzle_migrations'
  ) THEN 'YES' ELSE 'NO (schema applied via drizzle push)' END AS value

ORDER BY metric;
PSQL

echo ""
echo "=== Top 10 tables by column count ==="
psql "$DATABASE_URL" 2>&1 << 'PSQL'
SELECT
  table_name,
  count(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY column_count DESC
LIMIT 10;
PSQL

echo ""
echo "=== FK coverage per domain (sample — tables with FKs vs. without) ==="
psql "$DATABASE_URL" 2>&1 << 'PSQL'
SELECT
  CASE
    WHEN table_name LIKE 'terra_%'      THEN 'terra'
    WHEN table_name LIKE 'vessels%'     THEN 'vessels'
    WHEN table_name LIKE 'pc_%'         THEN 'prism_counsel'
    WHEN table_name LIKE 'firestorm_%'  THEN 'firestorm'
    WHEN table_name LIKE 'alloy_%'      THEN 'alloy'
    WHEN table_name LIKE 'agent_%'      THEN 'agent'
    WHEN table_name LIKE 'a2a_%'        THEN 'a2a'
    WHEN table_name LIKE 'szl_%'        THEN 'szl_canonical'
    WHEN table_name LIKE 'lyte_%'       THEN 'lyte'
    WHEN table_name LIKE 'carlota_%'    THEN 'carlota'
    ELSE 'platform_other'
  END AS domain,
  count(*) AS total_tables,
  sum(CASE WHEN has_fk = 'yes' THEN 1 ELSE 0 END) AS tables_with_fks
FROM (
  SELECT
    t.table_name,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      WHERE tc.constraint_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = t.table_name
    ) THEN 'yes' ELSE 'no' END AS has_fk
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
) sub
GROUP BY domain
ORDER BY total_tables DESC;
PSQL

echo ""
echo "=== Done ==="
