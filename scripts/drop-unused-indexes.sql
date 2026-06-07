-- Drop Unused Database Indexes
--
-- This script identifies and drops indexes with zero scans (idx_scan = 0)
-- that are not primary keys or unique constraints. Run only after the
-- database has been live long enough for pg_stat_user_indexes to be
-- meaningful (typically 7+ days post-restart).
--
-- Usage:
--   1. Review the SELECT output first (dry run section below)
--   2. If satisfied, run the generated DROP statements
--   3. Monitor query performance for 24-48 hours after dropping
--
-- Safe to revert: any dropped index can be recreated from the schema
-- by running `pnpm --filter @szl-holdings/db run db:push` or the
-- equivalent drizzle migration.

-- ── Step 1: Audit — list all zero-scan non-unique, non-PK indexes ────────
SELECT
  s.schemaname,
  s.tablename,
  s.indexname,
  s.idx_scan,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  pg_get_indexdef(i.indexrelid) AS index_def
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisunique
  AND NOT i.indisprimary
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- ── Step 2: Generate DROP statements ─────────────────────────────────────
-- Copy the output of this query and review before executing.
SELECT
  format(
    'DROP INDEX CONCURRENTLY IF EXISTS %I.%I; -- table: %I, size: %s',
    s.schemaname,
    s.indexname,
    s.tablename,
    pg_size_pretty(pg_relation_size(i.indexrelid))
  ) AS drop_statement
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisunique
  AND NOT i.indisprimary
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- ── Step 3: Traces & entity_relationships table review ───────────────────
-- Check row counts and age distribution for the two largest tables.

SELECT
  'traces' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE started_at < NOW() - INTERVAL '90 days') AS older_than_90d,
  COUNT(*) FILTER (WHERE started_at < NOW() - INTERVAL '30 days') AS older_than_30d,
  pg_size_pretty(pg_total_relation_size('traces')) AS total_size
FROM traces
UNION ALL
SELECT
  'entity_relationships' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '90 days') AS older_than_90d,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days') AS older_than_30d,
  pg_size_pretty(pg_total_relation_size('entity_relationships')) AS total_size
FROM entity_relationships;
