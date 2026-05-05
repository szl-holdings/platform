#!/usr/bin/env bash
# scripts/doctor.sh — SZL Holdings Platform
# Diagnoses the local runtime: env vars, port availability, DB reachability,
# and integration readiness. Run before starting the platform to catch
# configuration problems early.
#
# Usage:
#   bash scripts/doctor.sh           # full diagnostic (exit 0 on pass)
#   bash scripts/doctor.sh --strict  # exit 1 on any warning
#   bash scripts/doctor.sh --json    # emit structured JSON report
#
# Exit codes:
#   0  — all required checks pass (warnings are acceptable in default mode)
#   1  — one or more required checks fail; OR any issue in --strict mode

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

STRICT=false
JSON_MODE=false
for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=true ;;
    --json)   JSON_MODE=true ;;
  esac
done

PASS=0; WARN=0; FAIL=0
declare -a RESULTS=()

log()  { [ "$JSON_MODE" = "false" ] && echo "[doctor] $*"; }
pass() { PASS=$((PASS+1)); RESULTS+=("PASS|$1|$2"); [ "$JSON_MODE" = "false" ] && echo "  ✅  $1: $2"; }
warn() { WARN=$((WARN+1)); RESULTS+=("WARN|$1|$2"); [ "$JSON_MODE" = "false" ] && echo "  ⚠️   $1: $2"; }
fail() { FAIL=$((FAIL+1)); RESULTS+=("FAIL|$1|$2"); [ "$JSON_MODE" = "false" ] && echo "  ❌  $1: $2"; }

log "SZL Holdings Platform — Runtime Doctor"
log "======================================="

# ── 1. Node & pnpm versions ─────────────────────────────────────────────────
log ""
log "[ Tool Versions ]"
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
  MAJOR="${NODE_VER%%.*}"
  if [ "$MAJOR" -ge 24 ]; then
    pass "node" "v$NODE_VER (>=24 required)"
  else
    fail "node" "v$NODE_VER — requires >=24"
  fi
else
  fail "node" "not found"
fi

if command -v pnpm >/dev/null 2>&1; then
  PNPM_VER=$(pnpm --version 2>/dev/null)
  pass "pnpm" "v$PNPM_VER"
else
  fail "pnpm" "not found — install with: npm i -g pnpm"
fi

# ── 2. Required environment variables ───────────────────────────────────────
log ""
log "[ Environment Variables ]"

check_env_required() {
  local key="$1" desc="$2"
  if [ -n "${!key:-}" ]; then
    pass "$key" "set"
  else
    fail "$key" "MISSING — $desc"
  fi
}

check_env_recommended() {
  local key="$1" desc="$2"
  if [ -n "${!key:-}" ]; then
    pass "$key" "set"
  else
    warn "$key" "not set — $desc"
  fi
}

# Required — API server exits on startup if these are missing in production
check_env_required    "DATABASE_URL"          "PostgreSQL connection string"
check_env_required    "SESSION_SECRET"        "session signing secret (>=32 chars)"
check_env_required    "SECRET_ENCRYPTION_KEY" "field encryption key (>=32 chars)"
check_env_required    "ISSUER_URL"            "OIDC/auth issuer URL"
check_env_required    "PUBLIC_APP_URL"        "public-facing application URL"

# Recommended — service degrades gracefully without these
check_env_recommended "ALLOY_INTERNAL_TOKEN"  "internal service auth token"
check_env_recommended "CORS_ORIGINS"          "allowed CORS origins"
check_env_recommended "VAPID_PUBLIC_KEY"      "web push VAPID public key"

# Optional integrations (informational only)
for key in OPENAI_API_KEY ANTHROPIC_API_KEY RESEND_API_KEY STRIPE_SECRET_KEY SENTRY_DSN; do
  if [ -n "${!key:-}" ]; then
    pass "$key" "configured"
  else
    log "  ⬜  $key: not set (optional — service will use mock/demo mode)"
  fi
done

# ── 3. PORT availability ─────────────────────────────────────────────────────
log ""
log "[ Port Availability ]"

check_port() {
  local port="$1" service="$2"
  if command -v nc >/dev/null 2>&1; then
    if nc -z localhost "$port" 2>/dev/null; then
      warn "port:$port" "$service — port already in use (may be OK if process is already running)"
    else
      pass "port:$port" "$service — available"
    fi
  else
    log "  ⬜  port:$port ($service) — cannot check (nc not available)"
  fi
}

check_port "${PORT:-8080}"  "api-server (main)"
check_port 9090             "shared-proxy"
check_port 4110             "a11oy"

# ── 4. Database connectivity ─────────────────────────────────────────────────
log ""
log "[ Database Connectivity ]"

if [ -z "${DATABASE_URL:-}" ]; then
  warn "database" "DATABASE_URL not set — skipping connectivity check"
elif command -v psql >/dev/null 2>&1; then
  if PGPASSWORD="" psql "$DATABASE_URL" -c "SELECT 1;" -q --no-psqlrc >/dev/null 2>&1; then
    pass "database" "reachable via psql"
  else
    fail "database" "unreachable — check DATABASE_URL and PostgreSQL service"
  fi
elif command -v node >/dev/null 2>&1; then
  # Use the api-server's own pg installation via its node_modules
  DB_SCRIPT="$REPO_ROOT/artifacts/api-server"
  if [ -d "$DB_SCRIPT/node_modules/pg" ]; then
    DB_CHECK=$(node --input-type=commonjs <<EOF 2>&1
const { Pool } = require('$DB_SCRIPT/node_modules/pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
pool.connect()
  .then(client => client.query('SELECT 1').then(() => { client.release(); return pool.end(); }))
  .then(() => { process.stdout.write('OK'); process.exit(0); })
  .catch(err => { process.stdout.write('FAIL|' + err.message); process.exit(1); });
EOF
    ) || true
    if [ "${DB_CHECK%%|*}" = "OK" ]; then
      pass "database" "reachable"
    else
      fail "database" "unreachable — ${DB_CHECK#*|}"
    fi
  else
    log "  ⬜  database: pg not available at api-server — skipping connectivity check"
    log "  ⬜  Hint: run 'pnpm install' first, then re-run doctor"
  fi
else
  warn "database" "neither psql nor node available — skipping connectivity check"
fi

# ── 5. API server health (if running) ────────────────────────────────────────
log ""
log "[ API Server Health ]"

API_PORT="${PORT:-8080}"
HEALTH_URL="http://localhost:${API_PORT}/healthz"

if command -v curl >/dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$HEALTH_URL" 2>/dev/null) || HTTP_CODE="000"
  if [ "$HTTP_CODE" = "200" ]; then
    pass "api-server/healthz" "responding HTTP $HTTP_CODE"
  elif [ "$HTTP_CODE" = "000" ]; then
    log "  ⬜  api-server/healthz: not running (start with: pnpm dev)"
  else
    warn "api-server/healthz" "HTTP $HTTP_CODE — server may be starting"
  fi

  READY_URL="http://localhost:${API_PORT}/readyz"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$READY_URL" 2>/dev/null) || HTTP_CODE="000"
  if [ "$HTTP_CODE" = "200" ]; then
    pass "api-server/readyz" "responding HTTP $HTTP_CODE"
  elif [ "$HTTP_CODE" = "000" ]; then
    log "  ⬜  api-server/readyz: not running"
  else
    warn "api-server/readyz" "HTTP $HTTP_CODE"
  fi
else
  log "  ⬜  api-server health: curl not available — skipping"
fi

# ── 6. pnpm workspace integrity ──────────────────────────────────────────────
log ""
log "[ Workspace Integrity ]"

if [ -f "pnpm-lock.yaml" ]; then
  pass "pnpm-lock.yaml" "present"
else
  warn "pnpm-lock.yaml" "missing — run: pnpm install"
fi

if [ -d "node_modules" ]; then
  pass "node_modules" "present"
else
  fail "node_modules" "missing — run: pnpm install"
fi

# ── 7. Summary ───────────────────────────────────────────────────────────────
log ""
log "[ Summary ]"
log "  PASS: $PASS  |  WARN: $WARN  |  FAIL: $FAIL"

if [ "$JSON_MODE" = "true" ]; then
  echo "{"
  echo "  \"pass\": $PASS,"
  echo "  \"warn\": $WARN,"
  echo "  \"fail\": $FAIL,"
  echo "  \"checks\": ["
  FIRST=true
  for r in "${RESULTS[@]}"; do
    STATUS="${r%%|*}"; REST="${r#*|}"; NAME="${REST%%|*}"; MSG="${REST#*|}"
    [ "$FIRST" = "true" ] && FIRST=false || echo ","
    printf '    {"status":"%s","name":"%s","message":"%s"}' "$STATUS" "$NAME" "$MSG"
  done
  echo ""
  echo "  ]"
  echo "}"
fi

if [ "$FAIL" -gt 0 ]; then
  [ "$JSON_MODE" = "false" ] && log "RESULT: ❌ FAIL — $FAIL required check(s) failed. Fix errors above before starting the platform."
  exit 1
elif [ "$STRICT" = "true" ] && [ "$WARN" -gt 0 ]; then
  [ "$JSON_MODE" = "false" ] && log "RESULT: ⚠️  WARN (strict) — $WARN warning(s) present. Fix warnings or remove --strict."
  exit 1
else
  [ "$JSON_MODE" = "false" ] && log "RESULT: ✅ PASS — runtime environment looks good."
  exit 0
fi
