#!/usr/bin/env bash
# scripts/git-health-check.sh
#
# Validates the Git and GitHub operational health of this repository:
#   1. Git remote is configured and points to the correct org/repo
#   2. GitHub authentication is available (gh CLI or GH_TOKEN)
#   3. Branch protection status can be queried for main/master
#   4. Husky pre-commit hook is installed and wired into Git
#
# Usage:
#   bash scripts/git-health-check.sh
#
# Optional: set GH_TOKEN to enable token-based auth probing without gh CLI.

set -euo pipefail

OWNER="szl-holdings"
REPO="szl-holdings-platform"
HOOK_PATH=".husky/pre-commit"

PASS=0
WARN=0
FAIL=0

_pass() { echo "  [PASS] $*"; PASS=$((PASS + 1)); }
_warn() { echo "  [WARN] $*"; WARN=$((WARN + 1)); }
_fail() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }

# Match HTTPS and SSH remote patterns for szl-holdings/szl-holdings-platform:
#   HTTPS: https://github.com/szl-holdings/szl-holdings-platform(.git)
#   HTTPS w/ token: https://x-access-token:...@github.com/szl-holdings/szl-holdings-platform(.git)
#   SSH:   git@github.com:szl-holdings/szl-holdings-platform(.git)
_remote_matches() {
  local URL="$1"
  echo "${URL}" | grep -qE "(github\.com[/:]${OWNER}/${REPO})(\.git)?$"
}

echo ""
echo "=================================================="
echo "  SZL Holdings — Git & GitHub Health Check"
echo "  Repo: ${OWNER}/${REPO}"
echo "=================================================="
echo ""

# ── Check 1: Git remote configuration ─────────────────────────────────────────
echo "[ 1/4 ] Git remote configuration"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  _fail "Not inside a Git repository."
else
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ -z "${REMOTE_URL}" ]]; then
    _fail "No 'origin' remote is configured. Run: git remote add origin git@github.com:${OWNER}/${REPO}.git"
  elif _remote_matches "${REMOTE_URL}"; then
    _pass "Remote 'origin' points to ${REMOTE_URL}"
  else
    _warn "Remote 'origin' is set to '${REMOTE_URL}' — expected ${OWNER}/${REPO} on github.com (HTTPS or SSH)"
  fi
fi
echo ""

# ── Check 2: GitHub authentication ────────────────────────────────────────────
echo "[ 2/4 ] GitHub authentication"

GH_AUTH_OK=false

if command -v gh > /dev/null 2>&1; then
  if gh auth status > /dev/null 2>&1; then
    AUTH_DETAIL=$(gh auth status 2>&1 | head -1 || true)
    _pass "gh CLI authenticated: ${AUTH_DETAIL}"
    GH_AUTH_OK=true
  else
    _warn "gh CLI is installed but not authenticated. Run: gh auth login"
  fi
else
  _warn "gh CLI not found — install from https://cli.github.com or export GH_TOKEN for token-based auth"
fi

if [[ "${GH_AUTH_OK}" == "false" ]]; then
  TOKEN="${GH_TOKEN:-}"
  if [[ -n "${TOKEN}" ]]; then
    HTTP_STATUS=$(curl -fsS -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer ${TOKEN}" \
      "https://api.github.com/repos/${OWNER}/${REPO}" 2>/dev/null || echo "000")
    if [[ "${HTTP_STATUS}" == "200" ]]; then
      _pass "GH_TOKEN probe succeeded (HTTP ${HTTP_STATUS}) — repo is accessible"
      GH_AUTH_OK=true
    elif [[ "${HTTP_STATUS}" == "404" ]]; then
      _warn "GH_TOKEN probe returned 404 — token may lack repo scope or repo name is wrong"
    else
      _warn "GH_TOKEN probe returned HTTP ${HTTP_STATUS} — check token validity and network"
    fi
  else
    _warn "No GitHub auth available. Install gh CLI (gh auth login) or export GH_TOKEN."
  fi
fi
echo ""

# ── Check 3: Branch protection status ─────────────────────────────────────────
echo "[ 3/4 ] Branch protection status"

query_branch_protection() {
  local BRANCH="$1"
  local STATUS

  if command -v gh > /dev/null 2>&1 && gh auth status > /dev/null 2>&1; then
    STATUS=$(gh api "repos/${OWNER}/${REPO}/branches/${BRANCH}/protection" \
      --jq '.required_status_checks.strict' 2>/dev/null || echo "error")
    if [[ "${STATUS}" == "error" ]] || [[ -z "${STATUS}" ]]; then
      HTTP=$(gh api "repos/${OWNER}/${REPO}/branches/${BRANCH}" \
        --jq '.protected' 2>/dev/null || echo "error")
      if [[ "${HTTP}" == "true" ]]; then
        _pass "Branch '${BRANCH}' is protected (full detail requires admin token)"
      elif [[ "${HTTP}" == "false" ]]; then
        _warn "Branch '${BRANCH}' exists but has NO protection rules applied"
      else
        _warn "Branch '${BRANCH}' protection query failed — branch may not exist or token lacks admin scope"
      fi
    else
      _pass "Branch '${BRANCH}' protection active (strict status checks: ${STATUS})"
    fi
  elif [[ -n "${GH_TOKEN:-}" ]]; then
    HTTP_STATUS=$(curl -fsS -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer ${GH_TOKEN}" \
      "https://api.github.com/repos/${OWNER}/${REPO}/branches/${BRANCH}/protection" 2>/dev/null || echo "000")
    if [[ "${HTTP_STATUS}" == "200" ]]; then
      _pass "Branch '${BRANCH}' protection rules are active (HTTP 200)"
    elif [[ "${HTTP_STATUS}" == "404" ]]; then
      _warn "Branch '${BRANCH}' has no protection rules (HTTP 404) or branch does not exist"
    elif [[ "${HTTP_STATUS}" == "403" ]]; then
      _warn "Branch '${BRANCH}' protection query returned 403 — token lacks admin scope"
    else
      _warn "Branch '${BRANCH}' protection query returned HTTP ${HTTP_STATUS}"
    fi
  else
    _warn "Cannot query branch protection — no GitHub auth available (see check 2)"
  fi
}

query_branch_protection "main"
query_branch_protection "master"
echo ""

# ── Check 4: Husky pre-commit hook ────────────────────────────────────────────
echo "[ 4/4 ] Husky pre-commit hook"

# 4a: Husky source hook file
if [[ -f "${HOOK_PATH}" ]]; then
  if [[ -x "${HOOK_PATH}" ]]; then
    _pass "Pre-commit hook source exists and is executable: ${HOOK_PATH}"
  else
    _warn "Pre-commit hook source exists but is NOT executable. Run: chmod +x ${HOOK_PATH}"
  fi
else
  _fail "Pre-commit hook not found at ${HOOK_PATH}. Run: pnpm exec husky install"
fi

# 4b: Verify Husky is wired into Git's hook runtime
# Husky v8+ sets core.hooksPath in .git/config; v7 installs shims to .git/hooks/
HOOKS_PATH_CFG=$(git config core.hooksPath 2>/dev/null || echo "")
if [[ "${HOOKS_PATH_CFG}" == ".husky" ]] || [[ "${HOOKS_PATH_CFG}" == ".husky/" ]]; then
  _pass "Git core.hooksPath is set to '${HOOKS_PATH_CFG}' — Husky is wired into Git"
elif [[ -f ".git/hooks/pre-commit" ]]; then
  # Husky v7-style shim installed in .git/hooks/
  _pass "Git hook shim installed at .git/hooks/pre-commit — Husky is wired into Git"
else
  _warn "Husky is not wired into Git (core.hooksPath not set, no .git/hooks/pre-commit shim). Run: pnpm exec husky install"
fi

# 4c: Verify the hook references expected tooling
if [[ -f "${HOOK_PATH}" ]]; then
  if grep -q "biome" "${HOOK_PATH}" 2>/dev/null; then
    _pass "Hook references biome (format + lint)"
  else
    _warn "Hook does not reference biome — it may be misconfigured"
  fi

  # Check that required binaries are installed
  if [[ -f "node_modules/.bin/biome" ]]; then
    _pass "node_modules/.bin/biome is installed"
  else
    _warn "node_modules/.bin/biome not found — run: pnpm install"
  fi

  if [[ -f "node_modules/.bin/oxlint" ]]; then
    _pass "node_modules/.bin/oxlint is installed"
  else
    _warn "node_modules/.bin/oxlint not found — run: pnpm install"
  fi
fi
echo ""

# ── Summary ────────────────────────────────────────────────────────────────────
echo "=================================================="
echo "  Summary"
echo "  PASS: ${PASS}  |  WARN: ${WARN}  |  FAIL: ${FAIL}"
echo "=================================================="
echo ""

if [[ ${FAIL} -gt 0 ]]; then
  echo "  One or more critical checks failed. Resolve the [FAIL] items above."
  exit 1
elif [[ ${WARN} -gt 0 ]]; then
  echo "  All critical checks passed. Review [WARN] items above for non-blocking issues."
  exit 0
else
  echo "  All checks passed."
  exit 0
fi
