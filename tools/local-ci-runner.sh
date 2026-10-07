#!/usr/bin/env bash
# =============================================================================
# tools/local-ci-runner.sh
# Local preflight runner for szl-holdings/platform
#
# PURPOSE
#   Executes a useful subset of repository checks with the canonical root
#   commands. This is developer feedback only: it does not reproduce hosted
#   workflow isolation, publish GitHub statuses, satisfy branch protection,
#   or prove that required checks passed for a pushed commit.
#
# USAGE
#   ./tools/local-ci-runner.sh
#
# REQUIREMENTS
#   - Node >=24; the runner activates exact pnpm 10.26.1
#   - Gitleaks 8.21.2 on PATH (absence or version drift is blocking)
#   - Run from the repo root
#
# EXIT CODE
#   0  selected local checks passed and required local tooling was available
#   1  a selected check failed or required local tooling was unavailable
#
# A zero exit code is not a hosted CI result or merge authorization.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

HEAD_SHA="$(git rev-parse HEAD)"
LOG_DIR="${REPO_ROOT}/.local-ci-logs"
SUMMARY_FILE="${LOG_DIR}/summary.txt"

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

mkdir -p "$LOG_DIR"
: > "$SUMMARY_FILE"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()   { echo -e "${CYAN}[local-ci]${RESET} $*"; }
pass()  { echo -e "${GREEN}✓${RESET} $*"; }
fail()  { echo -e "${RED}✗${RESET} $*"; }
warn()  { echo -e "${YELLOW}⚠${RESET} $*"; }
sep()   { echo -e "${BOLD}──────────────────────────────────────────${RESET}"; }

OVERALL_EXIT=0

# ---------------------------------------------------------------------------
# run_check <name> <env_overrides> -- <command...>
#   Runs a selected local check, logs output, and records pass/fail. Every
#   selected check is blocking for this preflight; hosted CI remains separate.
# ---------------------------------------------------------------------------
declare -a RESULTS=()

run_check() {
  local name="$1"
  shift

  # Parse optional env overrides (KEY=VALUE pairs before --)
  local -a env_pairs=()
  while [[ "$1" != "--" ]]; do
    env_pairs+=("$1")
    shift
  done
  shift  # consume --

  local log_file="${LOG_DIR}/${name// /-}.log"
  sep
  log "Running: ${BOLD}${name}${RESET} [local preflight]"
  echo -e "  Command: $*"

  local start_ts exit_code=0
  start_ts=$(date +%s)

  if [[ ${#env_pairs[@]} -gt 0 ]]; then
    env "${env_pairs[@]}" "$@" >"$log_file" 2>&1 || exit_code=$?
  else
    "$@" >"$log_file" 2>&1 || exit_code=$?
  fi

  local elapsed=$(( $(date +%s) - start_ts ))

  if [[ $exit_code -eq 0 ]]; then
    pass "${name} — ${elapsed}s"
    RESULTS+=("PASS|${name}|${elapsed}s")
  else
    fail "${name} — ${elapsed}s  ← LOCAL PREFLIGHT FAILED"
    RESULTS+=("FAIL|${name}|${elapsed}s")
    OVERALL_EXIT=1
    echo ""
    echo "  Last 20 lines of log (${log_file}):"
    tail -20 "$log_file" | sed 's/^/    /'
  fi

  echo "" >> "$SUMMARY_FILE"
  echo "${RESULTS[-1]}" >> "$SUMMARY_FILE"
}

record_unavailable() {
  local name="$1" reason="$2"
  warn "${name} — UNAVAILABLE (${reason})"
  RESULTS+=("UNAVAILABLE|${name}|0s")
  echo "UNAVAILABLE|${name}|0s" >> "$SUMMARY_FILE"
  OVERALL_EXIT=1
}

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
command -v node >/dev/null 2>&1 || {
  echo "[local-ci] Node >=24 is required." >&2
  exit 1
}
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [[ ! "$NODE_MAJOR" =~ ^[0-9]+$ ]] || (( NODE_MAJOR < 24 )); then
  echo "[local-ci] Node >=24 is required; found $(node --version)." >&2
  exit 1
fi
# shellcheck source=../scripts/activate-pnpm.sh
source "$REPO_ROOT/scripts/activate-pnpm.sh"
if [[ "$(pnpm --version)" != "10.26.1" ]]; then
  echo "[local-ci] pnpm 10.26.1 is required after activation." >&2
  exit 1
fi

sep
log "Local preflight — szl-holdings/platform"
log "HEAD: ${HEAD_SHA}"
log "Date: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
log "Node: $(node --version 2>/dev/null || echo 'not found')"
log "pnpm: $(pnpm --version 2>/dev/null || echo 'not found')"
warn "Partial local feedback only; required hosted checks remain authoritative."
sep

# Ensure pnpm dependencies are installed from the committed lockfile.
log "Installing dependencies (--frozen-lockfile --prefer-offline)..."
ONNXRUNTIME_NODE_INSTALL=skip pnpm install --frozen-lockfile --prefer-offline >"${LOG_DIR}/pnpm-install.log" 2>&1 || {
  fail "pnpm install failed — see ${LOG_DIR}/pnpm-install.log"
  exit 1
}
pass "pnpm install"

# ---------------------------------------------------------------------------
# Selected local checks. Use canonical package.json entry points where one is
# available so this helper does not fork the repository's command contract.
# ---------------------------------------------------------------------------

# 1. Clean-clone guards
run_check "clean-clone-guards" -- \
  pnpm run verify:clean-clone

# 2. CI lint
run_check "lint-ci" -- \
  pnpm run lint:ci

# 3. Typecheck
run_check "typecheck" TURBO_CONCURRENCY=3 -- \
  pnpm run typecheck

# 4. Tests
run_check "test" \
  DATABASE_URL=postgres://ci-stub:ci-stub@127.0.0.1:5432/ci-stub \
  NODE_ENV=test \
  -- \
  pnpm run test

# 5. Build
run_check "build" -- \
  pnpm run build

# 6. Secret scans. The hosted workflow pins Gitleaks 8.21.2; local absence or
# version drift is explicit and fails this preflight closed.
if ! command -v gitleaks >/dev/null 2>&1; then
  record_unavailable "gitleaks" "8.21.2 is not on PATH"
elif [[ "$(gitleaks version 2>/dev/null || true)" != "8.21.2" ]]; then
  record_unavailable "gitleaks" "expected 8.21.2, found $(gitleaks version 2>/dev/null || echo unknown)"
else
  run_check "gitleaks" -- \
    gitleaks detect --source . --config .gitleaks.toml --redact --exit-code 1
fi
run_check "project-secret-scan" -- \
  node scripts/qa/scan-secrets.js .

# 7. Brand strings
run_check "brand-strings" -- \
  pnpm run brand:strings

# 8. Env-var coverage
run_check "env-coverage" -- \
  pnpm run check:env-coverage:strict

# 9. Design token drift
run_check "design-token-drift" -- \
  pnpm run tokens:drift:check

# 10. Docs sync and catalogue checks
run_check "docs-sync-check" -- \
  pnpm run docs:sync-check
run_check "docs-catalogue-check" -- \
  pnpm run docs:check

# 11. README QA
run_check "readme-assets" -- \
  pnpm run readme:check
run_check "readme-portfolio" -- \
  pnpm run readme:portfolio:check

# 12. Repository-owned security report generators and blocking audit policy
run_check "security-audit" -- \
  pnpm run security:audit

# ---------------------------------------------------------------------------
# Hosted authority boundary
# ---------------------------------------------------------------------------
sep
warn "Not executed here: hosted workflow isolation, event/permission behavior,"
warn "matrix runners, service containers, browser suites, SARIF uploads, artifact"
warn "uploads, deployments, or any other required GitHub status context."
warn "Only required hosted checks reported by GitHub for the exact pushed commit"
warn "can satisfy branch protection. This script never substitutes for them."

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
sep
echo ""
echo -e "${BOLD}Local preflight summary — ${HEAD_SHA:0:12}${RESET}"
echo ""
printf "%-40s %-14s %s\n" "CHECK" "RESULT" "TIME"
printf "%-40s %-14s %s\n" "-----" "------" "----"

PASS_COUNT=0 FAIL_COUNT=0 UNAVAILABLE_COUNT=0
for r in "${RESULTS[@]}"; do
  IFS='|' read -r status name elapsed <<< "$r"
  case "$status" in
    PASS) printf "${GREEN}%-40s %-14s %s${RESET}\n" "$name" "PASS" "$elapsed"; ((PASS_COUNT += 1)) ;;
    FAIL) printf "${RED}%-40s %-14s %s${RESET}\n" "$name" "FAIL" "$elapsed"; ((FAIL_COUNT += 1)) ;;
    UNAVAILABLE) printf "${YELLOW}%-40s %-14s %s${RESET}\n" "$name" "UNAVAILABLE" "$elapsed"; ((UNAVAILABLE_COUNT += 1)) ;;
  esac
done

echo ""
echo -e "  Passed: ${GREEN}${PASS_COUNT}${RESET}  Failed: ${RED}${FAIL_COUNT}${RESET}  Unavailable: ${YELLOW}${UNAVAILABLE_COUNT}${RESET}"
echo ""

if [[ $OVERALL_EXIT -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ Selected local preflight checks passed.${RESET}"
  echo "  Await required hosted checks on the exact pushed commit before merge."
else
  echo -e "${RED}${BOLD}✗ Local preflight failed or is incomplete.${RESET}"
  echo -e "  Logs in: ${LOG_DIR}/"
  echo -e "  Fix the failures above, then re-run: ${BOLD}./tools/local-ci-runner.sh${RESET}"
fi

echo ""
exit "$OVERALL_EXIT"
