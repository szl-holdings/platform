#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/demo-reset/reset.sh — Demo state reset and restore script
#
# Restores the SZL Holdings demo environment to a clean, presentation-ready
# state. Seeds all four demo narratives using @workspace/demo-seed.
#
# Usage:
#   ./scripts/demo-reset/reset.sh              # Full reset (all narratives)
#   ./scripts/demo-reset/reset.sh --yes        # Non-interactive full reset
#   ./scripts/demo-reset/reset.sh --narrative business
#   ./scripts/demo-reset/reset.sh --narrative security
#   ./scripts/demo-reset/reset.sh --narrative maritime
#   ./scripts/demo-reset/reset.sh --narrative legal
#   ./scripts/demo-reset/reset.sh --check      # Preflight check only
#
# Narrative aliases: business|lyte, security|soc|aegis, maritime|vessels, legal|prism
#
# Prerequisites:
#   1. DATABASE_URL set in environment or .env file
#   2. pnpm install completed
#   3. Migrations applied: pnpm --filter @szl-holdings/db run migrate
#
# Estimated runtime:
#   Single narrative:   ~30–60 seconds
#   Full reset:         ~90–180 seconds
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
NARRATIVE=""
CHECK_ONLY=false
YES=false
RESET_START=$(date +%s)

# ─── Colour helpers ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[0;33m'
CYN='\033[0;36m'
BLD='\033[1m'
RST='\033[0m'

info()  { echo -e "${CYN}[reset]${RST} $*"; }
ok()    { echo -e "${GRN}[reset] ✓${RST} $*"; }
warn()  { echo -e "${YLW}[reset] ⚠${RST} $*"; }
fail()  { echo -e "${RED}[reset] ✗${RST} $*"; exit 1; }
head_()  { echo -e "${BLD}${CYN}── $* ──${RST}"; }

# ─── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --narrative)
      NARRATIVE="${2:-}"
      shift 2
      ;;
    --check)
      CHECK_ONLY=true
      shift
      ;;
    --yes|-y)
      YES=true
      shift
      ;;
    --help|-h)
      grep '^#' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      fail "Unknown argument: $1. Use --help for usage."
      ;;
  esac
done

# ─── Preflight checks ─────────────────────────────────────────────────────────
head_ "Preflight Checks"

# Load DATABASE_URL from .env if not set
if [[ -z "${DATABASE_URL:-}" ]] && [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^DATABASE_URL=' "$ROOT_DIR/.env" 2>/dev/null || true)
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  fail "DATABASE_URL is not set. Set it in .env or environment before running."
fi
ok "DATABASE_URL present"

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  fail "pnpm not found. Run: npm install -g pnpm"
fi
ok "pnpm $(pnpm --version)"

# Check node_modules
if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
  warn "node_modules not found — running pnpm install..."
  pnpm install --frozen-lockfile 2>&1 | tail -3
fi
ok "node_modules present"

# Check migrations (drizzle migrate exits 0 if already up to date)
info "Applying any pending database migrations..."
if ! pnpm --filter @szl-holdings/db run migrate 2>&1 | tail -5; then
  fail "Database migrations failed — resolve schema errors before running demo reset."
fi
ok "Database migrations up to date"

if $CHECK_ONLY; then
  ok "Preflight check complete — environment is ready for demo seeding."
  exit 0
fi

# ─── Confirm before reset ─────────────────────────────────────────────────────
head_ "Demo State Reset"
echo ""
if [[ -n "$NARRATIVE" ]]; then
  echo -e "  Narrative: ${BLD}${NARRATIVE}${RST}"
else
  echo -e "  Scope:     ${BLD}Full reset — all four demo narratives${RST}"
fi
echo ""

if ! $YES; then
  read -r -p "  This will seed (or re-seed) demo data. Continue? [y/N] " CONFIRM
  echo ""
  if [[ "${CONFIRM,,}" != "y" ]]; then
    info "Reset cancelled."
    exit 0
  fi
fi

# ─── Seed using @workspace/demo-seed ─────────────────────────────────────────
head_ "Seeding Demo Narratives"

if [[ -z "$NARRATIVE" || "$NARRATIVE" == "all" ]]; then
  info "Running full demo seed (all four narratives)..."
  pnpm --filter @workspace/demo-seed run seed:all
  ok "All four narratives seeded via @workspace/demo-seed"
else
  # Normalise narrative alias to canonical id
  case "$NARRATIVE" in
    business|business-revops|lyte|revops)
      CANONICAL="business"
      ;;
    security|soc|aegis|sec)
      CANONICAL="security"
      ;;
    maritime|vessels|fleet)
      CANONICAL="maritime"
      ;;
    legal|prism|prism-counsel|compliance)
      CANONICAL="legal"
      ;;
    *)
      fail "Unknown narrative: '$NARRATIVE'. Valid: business, security, maritime, legal"
      ;;
  esac
  info "Running seed for narrative: $CANONICAL..."
  pnpm --filter @workspace/demo-seed "run" "seed:$CANONICAL"
  ok "Narrative '$CANONICAL' seeded"
fi

# ─── Optional: run existing canonical seed for supplemental data ──────────────
if [[ -z "$NARRATIVE" || "$NARRATIVE" == "all" ]]; then
  info "Running supplemental canonical seed (vessels, PRISM Counsel, Carlota Jo, marine)..."
  pnpm --filter @workspace/scripts run seed:canonical 2>&1 | tail -3 || warn "Canonical seed skipped or partially applied"
  pnpm --filter @workspace/scripts run seed:prism-counsel 2>&1 | tail -3 || warn "PRISM Counsel seed skipped (already seeded)"
  pnpm --filter @workspace/scripts run seed:marine-extended 2>&1 | tail -3 || warn "Marine extended seed skipped"
  ok "Supplemental seeds applied"
fi

# ─── API health check ─────────────────────────────────────────────────────────
head_ "Verification"
API_URL="${API_URL:-http://localhost:3001}"
if curl -sf --max-time 3 "${API_URL}/api/health" &>/dev/null; then
  ok "API health check passed (${API_URL})"
else
  warn "API health check failed or API not running — start with: pnpm --filter @workspace/api-server run dev"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
RESET_END=$(date +%s)
DURATION=$((RESET_END - RESET_START))

echo ""
head_ "Reset Complete"
echo -e "  Duration: ${BLD}${DURATION}s${RST}"
echo -e "  Status:   ${GRN}${BLD}Ready for demo${RST}"
echo ""
echo "  Checklist:"
echo "    1. Open the app at the preview URL"
echo "    2. Verify demo data banners are visible (data state badges)"
echo "    3. Walk through the persona switcher"
echo "    4. See docs/demo/demo-day-guide.md for the full presentation checklist"
echo ""
