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

# Known-broken hand-authored migrations — quarantined with documented reason.
# See: audit/residual-risk-register.md RR-21
QUARANTINED_MIGRATIONS=(
  "lib/db/migrations/0003_skill_library_tables.sql"
  # ^ Indexes on skills.category and skills.enabled columns do not exist in the
  #   drizzle-push schema. Fix: add IF NOT EXISTS column guards or align migration
  #   to live schema before removing from this list.
)

is_quarantined() {
  local file="$1"
  for q in "${QUARANTINED_MIGRATIONS[@]}"; do
    [ "$file" = "$q" ] && return 0
  done
  return 1
}

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

# ── Step 2: Apply Drizzle-kit migrations ──────────────────────────────────
log "Step 2/5 — Applying Drizzle-kit migrations (lib/db/drizzle/)..."
pnpm --filter @szl-holdings/db migrate \
  || fail "Drizzle migrate failed — check DATABASE_URL and lib/db/drizzle/"
log "  Drizzle migrations applied (63 journal entries, idx 0–94)."

# ── Step 3: Apply hand-authored + supplemental migrations ──────────────────
log "Step 3/5 — Applying hand-authored migrations (lib/db/migrations/ + packages/db/migrations/)..."

for SQL_FILE in lib/db/migrations/*.sql; do
  [ -f "$SQL_FILE" ] || continue
  if is_quarantined "$SQL_FILE"; then
    log "  SKIPPING (quarantined — see RR-21): $SQL_FILE"
    continue
  fi
  log "  Applying $SQL_FILE..."
  psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f "$SQL_FILE" \
    || fail "Migration failed: $SQL_FILE — fix or add to QUARANTINED_MIGRATIONS"
done

# Apply supplemental migration (IF NOT EXISTS index-only; NOTICE for existing indexes is normal)
SUPP_MIGRATION="packages/db/migrations/0021_phase_b_missing_indexes.sql"
if [ -f "$SUPP_MIGRATION" ]; then
  log "  Applying supplemental migration: $SUPP_MIGRATION..."
  psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f "$SUPP_MIGRATION" \
    || fail "Supplemental migration failed: $SUPP_MIGRATION"
  # Note: NOTICE messages ("relation already exists, skipping") are expected for existing indexes;
  # they are informational only and do not indicate errors.
fi

log "  Hand-authored migrations complete (quarantined: ${#QUARANTINED_MIGRATIONS[@]})."

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
log "  Hand-authored migs: applied (${#QUARANTINED_MIGRATIONS[@]} quarantined — see RR-21)"
log "  Supplemental mig  : applied (packages/db/migrations/0021_phase_b_missing_indexes.sql)"
log "  Demo seeds        : inserted (4 narrative domains)"
log "  API server        : running (pid=$(cat "$API_PID_FILE" 2>/dev/null || echo 'unknown'))"
log "  Health endpoint   : OK ($HEALTH_URL)"
log ""
log "  To stop the API server: kill \$(cat $API_PID_FILE)"
