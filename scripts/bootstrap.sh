#!/usr/bin/env bash
# scripts/bootstrap.sh — SZL Holdings Platform
# Idempotent bootstrap: install deps → codegen → migrate → seed.
# Safe to run on every fresh clone or after pulling upstream changes.
#
# Usage:
#   bash scripts/bootstrap.sh           # full bootstrap
#   bash scripts/bootstrap.sh --no-seed # skip demo seed
#   bash scripts/bootstrap.sh --ci      # non-interactive CI mode (skips seed)
#
# Exit codes:
#   0  — bootstrap complete
#   1  — fatal error (install / migration failure)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

NO_SEED=false
CI_MODE=false

for arg in "$@"; do
  case "$arg" in
    --no-seed) NO_SEED=true ;;
    --ci)      CI_MODE=true; NO_SEED=true ;;
  esac
done

log()  { echo "[bootstrap] $*"; }
warn() { echo "[bootstrap] WARN: $*" >&2; }
die()  { echo "[bootstrap] FATAL: $*" >&2; exit 1; }

# ── 0. Verify tool prerequisites ────────────────────────────────────────────
log "Checking prerequisites…"
command -v node  >/dev/null 2>&1 || die "node not found — install Node >=24"
command -v pnpm  >/dev/null 2>&1 || die "pnpm not found — run: npm i -g pnpm"
node_version=$(node -e "process.stdout.write(process.version)")
log "node $node_version | pnpm $(pnpm --version)"

# ── 1. Install dependencies ──────────────────────────────────────────────────
log "Installing dependencies…"
if [ "$CI_MODE" = "true" ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi
log "Dependencies installed."

# ── 2. Codegen (API spec → client types) ────────────────────────────────────
log "Running codegen…"
if pnpm --filter @szl-holdings/api-spec run codegen; then
  log "Codegen complete."
else
  die "Codegen failed — cannot guarantee client/server type contract. Fix codegen errors above."
fi

# ── 3. Database migration ────────────────────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  die "DATABASE_URL is not set. Set it in Replit Secrets (or .env for local dev) and re-run bootstrap."
fi

log "Running database migrations…"
if pnpm --filter @szl-holdings/db run push-non-interactive; then
  log "Migrations applied."
else
  die "Migration failed. Check DATABASE_URL and PostgreSQL connectivity."
fi

# ── 4. Seed demo data ────────────────────────────────────────────────────────
if [ "$NO_SEED" = "false" ]; then
  log "Seeding demo data…"
  if bash scripts/seed-demo-canonical.sh; then
    log "Demo data seeded."
  else
    warn "Demo seed failed — the server will still start in demo-fallback mode."
  fi
else
  log "Seed skipped (--no-seed / --ci)."
fi

# ── 5. Validate environment ──────────────────────────────────────────────────
log "Validating environment variables…"
if node scripts/qa/verify-env.js; then
  log "Environment validation passed."
else
  die "Required environment variables are missing — see output above. Set them in Replit Secrets (or .env) and re-run bootstrap."
fi

log "Bootstrap complete. Start the platform with:"
log "  pnpm dev            # development (all artifacts in parallel)"
log "  pnpm start          # production (uses NODE_ENV=production)"
