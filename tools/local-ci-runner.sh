#!/usr/bin/env bash
# =============================================================================
# tools/local-ci-runner.sh
# Local CI runner for szl-holdings/platform
#
# PURPOSE
#   Executes all CI checks that GitHub Actions would run (minus the two that
#   require GitHub-hosted infra: CodeQL and szl-zarf-publish) and optionally
#   reports each check's result back to GitHub via the Checks API.
#
# USAGE
#   # Dry run — just run locally, no GitHub reporting:
#   ./tools/local-ci-runner.sh
#
#   # Report results to GitHub as check-runs on the current HEAD commit:
#   GH_REPORT=1 ./tools/local-ci-runner.sh
#
#   # Report on a specific SHA (e.g., a PR head):
#   GH_REPORT=1 HEAD_SHA=<sha> ./tools/local-ci-runner.sh
#
# REQUIREMENTS
#   - node >= 18, pnpm >= 8 on PATH
#   - gh CLI authenticated (only required when GH_REPORT=1)
#   - Run from the repo root
#
# EXIT CODE
#   0  all blocking checks passed
#   1  one or more blocking checks failed
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

GH_REPORT="${GH_REPORT:-0}"
HEAD_SHA="${HEAD_SHA:-$(git rev-parse HEAD)}"
REPO_SLUG="szl-holdings/platform"
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
# gh Checks API reporter
# ---------------------------------------------------------------------------
gh_report() {
  local name="$1" conclusion="$2" summary="$3"
  [[ "$GH_REPORT" != "1" ]] && return 0
  gh api "repos/${REPO_SLUG}/check-runs" \
    -X POST \
    -H "Accept: application/vnd.github+json" \
    -f name="local-ci / ${name}" \
    -f head_sha="${HEAD_SHA}" \
    -f status="completed" \
    -f conclusion="${conclusion}" \
    -f "output[title]=${name} (local runner)" \
    -f "output[summary]=${summary}" \
    --silent || warn "gh Checks API report failed for '${name}' (non-fatal)"
}

# ---------------------------------------------------------------------------
# run_check <name> <blocking|advisory> <env_overrides> -- <command...>
#   Runs a check, logs output, records pass/fail, optionally reports to GitHub.
# ---------------------------------------------------------------------------
declare -a RESULTS=()

run_check() {
  local name="$1"
  local severity="$2"   # blocking | advisory
  shift 2

  # Parse optional env overrides (KEY=VALUE pairs before --)
  local -a env_pairs=()
  while [[ "$1" != "--" ]]; do
    env_pairs+=("$1")
    shift
  done
  shift  # consume --

  local log_file="${LOG_DIR}/${name// /-}.log"
  sep
  log "Running: ${BOLD}${name}${RESET} [${severity}]"
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
    RESULTS+=("PASS|${name}|${severity}|${elapsed}s")
    gh_report "$name" "success" "Passed in ${elapsed}s."
  else
    local tail_output
    tail_output=$(tail -40 "$log_file" 2>/dev/null || true)

    if [[ "$severity" == "blocking" ]]; then
      fail "${name} — ${elapsed}s  ← BLOCKING"
      RESULTS+=("FAIL|${name}|${severity}|${elapsed}s")
      OVERALL_EXIT=1
      gh_report "$name" "failure" "Failed after ${elapsed}s.\n\n\`\`\`\n${tail_output}\n\`\`\`"
    else
      warn "${name} — ${elapsed}s  [advisory — non-blocking]"
      RESULTS+=("WARN|${name}|${severity}|${elapsed}s")
      gh_report "$name" "neutral" "Advisory check failed after ${elapsed}s (non-blocking).\n\n\`\`\`\n${tail_output}\n\`\`\`"
    fi
    echo ""
    echo "  Last 20 lines of log (${log_file}):"
    tail -20 "$log_file" | sed 's/^/    /'
  fi

  echo "" >> "$SUMMARY_FILE"
  echo "${RESULTS[-1]}" >> "$SUMMARY_FILE"
}

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
sep
log "Local CI Runner — szl-holdings/platform"
log "HEAD: ${HEAD_SHA}"
log "Date: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
log "Node: $(node --version 2>/dev/null || echo 'not found')"
log "pnpm: $(pnpm --version 2>/dev/null || echo 'not found')"
log "GH report: ${GH_REPORT}"
if [[ "$GH_REPORT" == "1" ]]; then
  log "Repo slug: ${REPO_SLUG}"
fi
sep

# Ensure pnpm dependencies are installed (offline-first, mirrors CI behaviour)
log "Installing dependencies (--frozen-lockfile --prefer-offline)..."
pnpm install --frozen-lockfile --prefer-offline >"${LOG_DIR}/pnpm-install.log" 2>&1 || {
  fail "pnpm install failed — see ${LOG_DIR}/pnpm-install.log"
  exit 1
}
pass "pnpm install"

# ---------------------------------------------------------------------------
# Blocking checks (mirror ci.yml gates)
# ---------------------------------------------------------------------------

# 1. Lint
run_check "lint" "blocking" -- \
  pnpm run lint

# 2. Typecheck
run_check "typecheck" "blocking" -- \
  pnpm run typecheck

# 3. Unit tests
run_check "test" "blocking" \
  DATABASE_URL=postgres://ci-stub:ci-stub@127.0.0.1:5432/ci-stub \
  NODE_ENV=test \
  -- \
  pnpm run test

# 4. Build all packages
run_check "build" "blocking" -- \
  pnpm -r --if-present run build

# 5. Secret scan (gitleaks — downloaded on-demand if not present)
if command -v gitleaks &>/dev/null; then
  run_check "secret-scan" "blocking" -- \
    gitleaks detect --source . --config .gitleaks.toml --redact --exit-code 1
else
  warn "gitleaks not found on PATH — secret-scan skipped locally"
  warn "  Install: https://github.com/gitleaks/gitleaks#installing"
  RESULTS+=("SKIP|secret-scan|blocking|0s")
  echo "SKIP|secret-scan|blocking|0s" >> "$SUMMARY_FILE"
fi

# 6. Proof-chain static checks
run_check "proof-chain-checks" "blocking" -- \
  bash -c '
    node scripts/check-proof-chain.js &&
    pnpm --filter @szl-holdings/policy-engine exec vitest run src/policy-engine.test.ts &&
    pnpm --filter @szl-holdings/action-engine exec vitest run src/action-engine.test.ts &&
    pnpm --filter @workspace/trace-graph exec vitest run src/run-trace-e2e.test.ts &&
    pnpm --filter @szl-holdings/connectors exec vitest run src/connector-normalization.test.ts &&
    pnpm --filter @szl-holdings/telemetry-standards exec vitest run src/telemetry-coverage.test.ts &&
    pnpm --filter @szl-holdings/telemetry-standards exec vitest run src/telemetry-e2e.test.ts &&
    pnpm --filter @workspace/ontology exec vitest run src/recommendation-rendering.test.ts &&
    pnpm vitest run --config vitest.config.ts scripts/check-proof-chain.test.js
  '

# 7. Brand strings
run_check "brand-strings" "blocking" -- \
  pnpm brand:strings

# 8. Env-var coverage
run_check "env-coverage" "blocking" -- \
  pnpm check:env-coverage:strict

# 9. Design token drift
run_check "design-token-drift" "blocking" -- \
  pnpm exec tsx scripts/check-design-tokens-drift.ts --check --threshold=40

# 10. Pin check (all workflow action refs must be SHA-pinned)
run_check "pin-check" "blocking" -- \
  bash -c '
    set -euo pipefail
    WORKFLOW_DIR=".github/workflows"
    VIOLATIONS=$(mktemp)
    for file in "$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml; do
      [ -f "$file" ] || continue
      while IFS= read -r line; do
        ref=$(echo "$line" | sed -n '"'"'s/.*uses:[[:space:]]*\([^[:space:]#]*\).*/\1/p'"'"')
        [ -z "$ref" ] && continue
        [[ "$ref" == ./* ]] && continue
        after_at="${ref##*@}"
        if ! echo "$after_at" | grep -qE "^[0-9a-f]{40}$"; then
          echo "Unpinned action: $ref in $file" | tee -a "$VIOLATIONS"
        fi
      done < <(grep -E "^\s*(-\s+)?uses:\s+\S" "$file" | grep -v "^\s*#")
    done
    if [ -s "$VIOLATIONS" ]; then rm -f "$VIOLATIONS"; exit 1; fi
    rm -f "$VIOLATIONS"
    echo "All action refs are SHA-pinned."
  '

# ---------------------------------------------------------------------------
# Advisory checks (mirror ci.yml advisory jobs)
# ---------------------------------------------------------------------------

# 11. Docs sync check
run_check "docs-sync-check" "advisory" -- \
  node scripts/docs/check-docs-sync.js

# 12. Docs catalogue check
run_check "docs-catalogue-check" "advisory" -- \
  pnpm docs:check

# ---------------------------------------------------------------------------
# Advisory checks from other workflows
# ---------------------------------------------------------------------------

# 13. README QA
run_check "readme-qa" "advisory" -- \
  bash -c '
    pnpm readme:check &&
    pnpm readme:portfolio:check &&
    node scripts/validate-readme-assets.js --readme profile-readme/README.md
  '

# 14. Security audit (SBOM + vuln + license — no Snyk token needed locally)
run_check "security-audit" "advisory" -- \
  bash -c '
    node scripts/qa/generate-sbom.js &&
    node scripts/qa/generate-vuln-report.js &&
    node scripts/qa/generate-license-report.js
  '

# ---------------------------------------------------------------------------
# External / deferred checks (require GitHub-hosted infra)
# ---------------------------------------------------------------------------
sep
warn "The following workflows are DEFERRED — require GitHub-hosted infra:"
warn "  • codeql.yml         — CodeQL SARIF analysis (github/codeql-action)"
warn "  • szl-zarf-publish.yml — Zarf/UDS bundle + GHCR push + cosign signing"
warn "  • deploy-staging.yml — Replit staging deploy (secrets + external API)"
warn "  • post-deploy-smoke.yml — Production URL smoke (PRODUCTION_BASE_URL secret)"
warn "  • e2e.yml            — Playwright E2E (Chromium infra intensive)"
warn "  • a11y.yml           — axe + Playwright (Chromium infra intensive)"
warn "  • lighthouse.yml     — Lighthouse CI (Chromium infra intensive)"
warn "  • audit-full.yml     — Full audit harness (superset of above)"
warn "These will run normally once Actions minutes reset on 2026-06-01,"
warn "or immediately if the repo is made public (unlimited free minutes)."

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
sep
echo ""
echo -e "${BOLD}CI Summary — ${HEAD_SHA:0:12}${RESET}"
echo ""
printf "%-40s %-12s %-10s %s\n" "CHECK" "RESULT" "SEVERITY" "TIME"
printf "%-40s %-12s %-10s %s\n" "-----" "------" "--------" "----"

PASS_COUNT=0 FAIL_COUNT=0 WARN_COUNT=0 SKIP_COUNT=0
for r in "${RESULTS[@]}"; do
  IFS='|' read -r status name severity elapsed <<< "$r"
  case "$status" in
    PASS) printf "${GREEN}%-40s %-12s %-10s %s${RESET}\n" "$name" "PASS" "$severity" "$elapsed"; ((PASS_COUNT++)) ;;
    FAIL) printf "${RED}%-40s %-12s %-10s %s${RESET}\n"   "$name" "FAIL" "$severity" "$elapsed"; ((FAIL_COUNT++)) ;;
    WARN) printf "${YELLOW}%-40s %-12s %-10s %s${RESET}\n" "$name" "ADVISORY" "$severity" "$elapsed"; ((WARN_COUNT++)) ;;
    SKIP) printf "${YELLOW}%-40s %-12s %-10s %s${RESET}\n" "$name" "SKIPPED" "$severity" "$elapsed"; ((SKIP_COUNT++)) ;;
  esac
done

echo ""
echo -e "  Passed: ${GREEN}${PASS_COUNT}${RESET}  Failed: ${RED}${FAIL_COUNT}${RESET}  Advisory/warn: ${YELLOW}${WARN_COUNT}${RESET}  Skipped: ${YELLOW}${SKIP_COUNT}${RESET}"
echo ""

if [[ $OVERALL_EXIT -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ All blocking checks passed.${RESET}"
  if [[ "$GH_REPORT" == "1" ]]; then
    echo -e "  GitHub check-runs posted to ${REPO_SLUG}@${HEAD_SHA:0:12}"
  fi
else
  echo -e "${RED}${BOLD}✗ One or more blocking checks FAILED.${RESET}"
  echo -e "  Logs in: ${LOG_DIR}/"
  echo -e "  Fix the failures above, then re-run: ${BOLD}./tools/local-ci-runner.sh${RESET}"
fi

echo ""
exit "$OVERALL_EXIT"
