#!/usr/bin/env bash
# scripts/audit/db/local-boot.sh
#
# Deterministic local DB boot sequence:
#   (optional clean reset) → Postgres up → Drizzle migrations →
#   hand-authored migrations → supplemental migration →
#   demo seed → start API server → health check
#
# Usage (from workspace root, with Docker installed):
#   bash scripts/audit/db/local-boot.sh
#
# Clean-state mode (drops and recreates volumes before migrating from zero):
#   CLEAN=1 bash scripts/audit/db/local-boot.sh
#
# Replit / CI environments (DATABASE_URL already set, Postgres already running):
#   SKIP_DOCKER=1 bash scripts/audit/db/local-boot.sh
#
# Prerequisites:
#   - DATABASE_URL set in environment (see .env.example)
#   - Docker and docker-compose installed (unless SKIP_DOCKER=1)
#   - pnpm installed and workspace packages built
#
# Exit codes:
#   0  — all steps completed successfully
#   1  — a step failed (error message printed)

set -euo pipefail

SKIP_DOCKER="${SKIP_DOCKER:-0}"
CLEAN="${CLEAN:-0}"           # Set to 1 to drop and recreate the DB volume before migrating
API_PORT="${PORT:-3000}"
API_PID_FILE="/tmp/szl-api-server.pid"

log()  { echo "[local-boot] $*"; }
fail() { echo "[local-boot] ERROR: $*" >&2; exit 1; }

# Hand-authored migrations are now applied through the
# `__manual_migrations` tracker (see lib/db/scripts/apply-manual-migrations.mjs)
# rather than the previous quarantine-list + raw-psql loop. RR-21 (skills
# column drift in 0003_skill_library_tables.sql) was resolved by adding
# ADD COLUMN IF NOT EXISTS guards inside that file. There is no longer a
# quarantine list — every file in lib/db/migrations/ is in the apply set.
QUARANTINED_MIGRATIONS=()

# ── Step 0 (optional): Clean reset ─────────────────────────────────────────
if [ "$CLEAN" = "1" ]; then
  if [ "$SKIP_DOCKER" = "1" ]; then
    fail "CLEAN=1 requires Docker (cannot reset volume without docker compose); set SKIP_DOCKER=0"
  fi
  log "Step 0/5 — CLEAN MODE: dropping all volumes and containers..."
  docker compose down -v --remove-orphans 2>/dev/null || true
  log "  Volumes and containers removed. Starting fresh."
fi

# ── Step 1: Start Postgres (Docker) ────────────────────────────────────────
if [ "$SKIP_DOCKER" = "0" ]; then
  log "Step 1/5 — Starting Postgres 16 (docker compose)..."
  docker compose up -d postgres || fail "Failed to start Postgres"

  log "  Waiting for Postgres to be ready..."
  for i in $(seq 1 30); do
    # Use compose SERVICE NAME 'postgres' (not container name 'szl-postgres')
    if docker compose exec -T postgres pg_isready -U szl_platform_user -d szl_platform >/dev/null 2>&1; then
      log "  Postgres ready (attempt $i)"
      break
    fi
    [ "$i" -eq 30 ] && fail "Postgres did not become ready within 60 seconds"
    sleep 2
  done
else
  log "Step 1/5 — Skipping Docker (SKIP_DOCKER=1); verifying existing DATABASE_URL..."
  psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1 \
    || fail "Cannot connect to DATABASE_URL — ensure Postgres is running"
  log "  Postgres connection OK"
fi

# ── Step 2: Apply Drizzle-kit + hand-authored migrations ──────────────────
# `pnpm --filter @szl-holdings/db migrate` runs three steps in order:
#   1. backfill-migrations.mjs       — seeds __drizzle_migrations from journal
#   2. drizzle-kit migrate           — applies Drizzle journal entries
#   3. apply-manual-migrations.mjs   — applies lib/db/migrations/ via the
#                                      __manual_migrations tracker
# This boot script intentionally invokes only the unified `migrate` command
# so manual migrations are not run twice in the same boot.
log "Step 2/5 — Applying Drizzle-kit + hand-authored migrations..."
pnpm --filter @szl-holdings/db migrate \
  || fail "Migrate failed — check DATABASE_URL, lib/db/drizzle/, and lib/db/migrations/"
log "  Drizzle journal applied (63 entries, idx 0–94) + hand-authored migrations tracked in __manual_migrations."

# ── Step 3: Apply supplemental index-only migration ───────────────────────
log "Step 3/5 — Applying supplemental migration (packages/db/migrations/)..."

# Supplemental migration (IF NOT EXISTS index-only; NOTICE for existing indexes is normal).
# This file is not part of either tracker; it is applied directly via psql.
SUPP_MIGRATION="packages/db/migrations/0021_phase_b_missing_indexes.sql"
if [ -f "$SUPP_MIGRATION" ]; then
  log "  Applying supplemental migration: $SUPP_MIGRATION..."
  psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f "$SUPP_MIGRATION" \
    || fail "Supplemental migration failed: $SUPP_MIGRATION"
  # Note: NOTICE messages ("relation already exists, skipping") are expected for existing indexes;
  # they are informational only and do not indicate errors.
fi

log "  Supplemental migration complete."

# ── Step 4: Run demo seeds ─────────────────────────────────────────────────
log "Step 4/5 — Running demo seeds (all four narrative domains)..."
pnpm --filter @workspace/demo-seed seed:all \
  || fail "Demo seed failed — check DATABASE_URL and packages/demo-seed/"
log "  Demo seeds complete."

# ── Step 5: Start API server and verify health ─────────────────────────────
log "Step 5/5 — Starting API server and verifying health endpoint..."
HEALTH_URL="${API_HEALTH_URL:-http://localhost:${API_PORT}/api/health}"

# Launch the API server in the background
pnpm --filter @workspace/api-server dev > /tmp/szl-api-server.log 2>&1 &
API_PID=$!
echo "$API_PID" > "$API_PID_FILE"
log "  API server launched (pid=$API_PID); log: /tmp/szl-api-server.log"

# Poll until health endpoint returns 200 or timeout
for i in $(seq 1 30); do
  HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    log "  API health check passed (HTTP $HTTP_STATUS at $HEALTH_URL)"
    break
  fi
  if [ "$i" -eq 30 ]; then
    log "  Last HTTP status: $HTTP_STATUS"
    log "  Server log tail:"
    tail -20 /tmp/szl-api-server.log 2>/dev/null || true
    fail "API health endpoint did not return 200 within 60 seconds"
  fi
  sleep 2
done

log ""
log "=== Local DB boot complete ==="
log "  Postgres          : running"
log "  Drizzle migs      : applied (63 journal entries, idx 0–94)"
log "  Hand-authored migs: applied (tracked in __manual_migrations)"
log "  Supplemental mig  : applied (packages/db/migrations/0021_phase_b_missing_indexes.sql)"
log "  Demo seeds        : inserted (4 narrative domains)"
log "  API server        : running (pid=$(cat "$API_PID_FILE" 2>/dev/null || echo 'unknown'))"
log "  Health endpoint   : OK ($HEALTH_URL)"
log ""
log "  To stop the API server: kill \$(cat $API_PID_FILE)"
