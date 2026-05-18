#!/usr/bin/env bash
# audit-repo-settings.sh
#
# Read-only health-check that compares the live GitHub remote against the
# documented expectations in:
#   - ops/github/repo-metadata.json  (canonical, Phase 2+)
#   - ops/github/repo-settings.json  (legacy, pre-Phase 2)
#
# Checks:
#   - default branch
#   - visibility (private/public)
#   - topics (set equality)
#   - feature toggles (issues, wiki, projects, has_discussions, packages)
#   - branch protection on the protected branch:
#       * exists at all
#       * required status checks (set equality)
#       * required pull request reviews
#       * enforce_admins
#       * allow_force_pushes
#       * allow_deletions
#
# This script performs NO mutations. Safe to run on a cron.
#
# Usage:
#   GH_TOKEN=<pat> bash ops/github/audit-repo-settings.sh
#   GH_TOKEN=<pat> bash ops/github/audit-repo-settings.sh --json   # machine-readable
#
# Exit codes:
#   0  no drift detected
#   1  drift detected (one or more checks FAILED)
#   2  usage / environment error (missing token, missing files, API failure)
#
# Token: `repo` scope (classic) or fine-grained PAT with at least
#   "Metadata: read" and "Administration: read" on this repository.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
META_FILE="${SCRIPT_DIR}/repo-metadata.json"
LEGACY_FILE="${SCRIPT_DIR}/repo-settings.json"

JSON_OUT=0
if [[ "${1:-}" == "--json" ]]; then
  JSON_OUT=1
fi

for f in "${META_FILE}" "${LEGACY_FILE}"; do
  if [[ ! -f "${f}" ]]; then
    echo "ERROR: missing expected file: ${f}" >&2
    exit 2
  fi
done

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: 'jq' is required but not on PATH." >&2
  exit 2
fi

TOKEN="${GH_TOKEN:?GH_TOKEN env var is required}"

REPO_FULL="$(jq -r '.repository' "${META_FILE}")"
OWNER="${REPO_FULL%%/*}"
REPO="${REPO_FULL##*/}"
PROTECTED_BRANCH="$(jq -r '.branch_protection.branch' "${META_FILE}")"

API="https://api.github.com"
AUTH_HEADER="Authorization: Bearer ${TOKEN}"
ACCEPT_HEADER="Accept: application/vnd.github+json"
API_VERSION_HEADER="X-GitHub-Api-Version: 2022-11-28"
TOPICS_ACCEPT_HEADER="Accept: application/vnd.github.mercy-preview+json"

PASS_COUNT=0
FAIL_COUNT=0
RESULTS_JSON="[]"

record() {
  # record <status> <check> <expected> <actual> [note]
  local status="$1" check="$2" expected="$3" actual="$4" note="${5:-}"
  if [[ "${status}" == "PASS" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  if [[ ${JSON_OUT} -eq 0 ]]; then
    local sym="✅"
    [[ "${status}" != "PASS" ]] && sym="❌"
    printf '  %s %-32s expected=%s  actual=%s' "${sym}" "${check}" "${expected}" "${actual}"
    if [[ -n "${note}" ]]; then
      printf '  (%s)' "${note}"
    fi
    printf '\n'
  fi
  RESULTS_JSON=$(jq -c \
    --arg status "${status}" \
    --arg check "${check}" \
    --arg expected "${expected}" \
    --arg actual "${actual}" \
    --arg note "${note}" \
    '. + [{status:$status, check:$check, expected:$expected, actual:$actual, note:$note}]' \
    <<<"${RESULTS_JSON}")
}

api_get() {
  # api_get <path> [extra accept header]
  local path="$1" accept="${2:-${ACCEPT_HEADER}}"
  curl -sS -w '\n%{http_code}' \
    -H "${AUTH_HEADER}" -H "${accept}" -H "${API_VERSION_HEADER}" \
    "${API}${path}"
}

split_response() {
  # echoes "<http_code>\t<body>"
  local raw="$1"
  local code body
  code="$(printf '%s' "${raw}" | tail -n1)"
  body="$(printf '%s' "${raw}" | sed '$d')"
  printf '%s\t%s' "${code}" "${body}"
}

# Set-equality of two JSON arrays of strings (order-independent, dedup).
sets_equal() {
  local a b
  a="$(jq -c 'map(tostring) | unique' <<<"${1}")"
  b="$(jq -c 'map(tostring) | unique' <<<"${2}")"
  [[ "${a}" == "${b}" ]]
}

if [[ ${JSON_OUT} -eq 0 ]]; then
  echo "=== GitHub repo settings audit — ${OWNER}/${REPO} ==="
  echo "Mode: READ-ONLY"
  echo ""
fi

# ── Fetch /repos/:owner/:repo ─────────────────────────────────────────────────
RAW=$(api_get "/repos/${OWNER}/${REPO}")
IFS=$'\t' read -r CODE BODY <<<"$(split_response "${RAW}")"
if [[ "${CODE}" != "200" ]]; then
  echo "ERROR: GET /repos/${OWNER}/${REPO} returned HTTP ${CODE}" >&2
  echo "${BODY}" >&2
  exit 2
fi
REPO_JSON="${BODY}"

# ── Fetch topics ──────────────────────────────────────────────────────────────
RAW=$(api_get "/repos/${OWNER}/${REPO}/topics" "${TOPICS_ACCEPT_HEADER}")
IFS=$'\t' read -r CODE BODY <<<"$(split_response "${RAW}")"
if [[ "${CODE}" != "200" ]]; then
  echo "ERROR: GET /repos/${OWNER}/${REPO}/topics returned HTTP ${CODE}" >&2
  exit 2
fi
REMOTE_TOPICS_JSON="$(jq -c '.names' <<<"${BODY}")"

# ── Fetch branch protection ───────────────────────────────────────────────────
RAW=$(api_get "/repos/${OWNER}/${REPO}/branches/${PROTECTED_BRANCH}/protection")
IFS=$'\t' read -r CODE BODY <<<"$(split_response "${RAW}")"
PROTECTION_HTTP="${CODE}"
PROTECTION_JSON="${BODY}"

if [[ ${JSON_OUT} -eq 0 ]]; then
  echo "── Repository basics ────────────────────────────────────────────────"
fi

# default branch
EXPECTED_DEFAULT="${PROTECTED_BRANCH}"
ACTUAL_DEFAULT="$(jq -r '.default_branch' <<<"${REPO_JSON}")"
if [[ "${EXPECTED_DEFAULT}" == "${ACTUAL_DEFAULT}" ]]; then
  record PASS "default_branch" "${EXPECTED_DEFAULT}" "${ACTUAL_DEFAULT}"
else
  record FAIL "default_branch" "${EXPECTED_DEFAULT}" "${ACTUAL_DEFAULT}"
fi

# visibility — strict: must match the documented value in repo-metadata.json
EXPECTED_VISIBILITY="$(jq -r '.visibility // ""' "${META_FILE}")"
if [[ -z "${EXPECTED_VISIBILITY}" ]]; then
  echo "ERROR: ${META_FILE} is missing required field 'visibility'." >&2
  echo "       Add e.g. \"visibility\": \"public\" or \"private\" and re-run." >&2
  exit 2
fi
ACTUAL_VISIBILITY="$(jq -r '.visibility' <<<"${REPO_JSON}")"
if [[ "${EXPECTED_VISIBILITY}" == "${ACTUAL_VISIBILITY}" ]]; then
  record PASS "visibility" "${EXPECTED_VISIBILITY}" "${ACTUAL_VISIBILITY}"
else
  record FAIL "visibility" "${EXPECTED_VISIBILITY}" "${ACTUAL_VISIBILITY}" \
    "documented in ${META_FILE##*/}; see repo-visibility-decision.md"
fi

# homepage
EXPECTED_HOMEPAGE="$(jq -r '.homepage' "${META_FILE}")"
ACTUAL_HOMEPAGE="$(jq -r '.homepage // ""' <<<"${REPO_JSON}")"
if [[ "${EXPECTED_HOMEPAGE}" == "${ACTUAL_HOMEPAGE}" ]]; then
  record PASS "homepage" "${EXPECTED_HOMEPAGE}" "${ACTUAL_HOMEPAGE}"
else
  record FAIL "homepage" "${EXPECTED_HOMEPAGE}" "${ACTUAL_HOMEPAGE}"
fi

if [[ ${JSON_OUT} -eq 0 ]]; then
  echo ""
  echo "── Topics ───────────────────────────────────────────────────────────"
fi

EXPECTED_TOPICS_META="$(jq -c '.topics' "${META_FILE}")"
EXPECTED_TOPICS_LEGACY="$(jq -c '.topics' "${LEGACY_FILE}")"

if sets_equal "${EXPECTED_TOPICS_META}" "${REMOTE_TOPICS_JSON}"; then
  record PASS "topics (canonical)" "${EXPECTED_TOPICS_META}" "${REMOTE_TOPICS_JSON}"
else
  MISSING="$(jq -c --argjson r "${REMOTE_TOPICS_JSON}" '. - $r' <<<"${EXPECTED_TOPICS_META}")"
  EXTRA="$(jq -c --argjson e "${EXPECTED_TOPICS_META}" '. - $e' <<<"${REMOTE_TOPICS_JSON}")"
  record FAIL "topics (canonical)" "${EXPECTED_TOPICS_META}" "${REMOTE_TOPICS_JSON}" \
    "missing=${MISSING} extra=${EXTRA}"
fi

if sets_equal "${EXPECTED_TOPICS_LEGACY}" "${REMOTE_TOPICS_JSON}"; then
  record PASS "topics (legacy reference)" "${EXPECTED_TOPICS_LEGACY}" "${REMOTE_TOPICS_JSON}"
else
  record PASS "topics (legacy reference)" "${EXPECTED_TOPICS_LEGACY}" "${REMOTE_TOPICS_JSON}" \
    "informational only — canonical is repo-metadata.json"
fi

if [[ ${JSON_OUT} -eq 0 ]]; then
  echo ""
  echo "── Feature toggles ──────────────────────────────────────────────────"
fi

check_feature() {
  # check_feature <key-in-json> <api-field>
  local key="$1" api_field="$2"
  local expected actual
  expected="$(jq -r ".features.${key}" "${META_FILE}")"
  actual="$(jq -r ".${api_field}" <<<"${REPO_JSON}")"
  if [[ "${expected}" == "${actual}" ]]; then
    record PASS "feature.${key}" "${expected}" "${actual}"
  else
    record FAIL "feature.${key}" "${expected}" "${actual}"
  fi
}

check_feature issues       has_issues
check_feature wiki         has_wiki
check_feature projects     has_projects
check_feature discussions  has_discussions
# packages: there is no direct repo field, so the canonical value is informational.
EXPECTED_PACKAGES="$(jq -r '.features.packages' "${META_FILE}")"
record PASS "feature.packages" "${EXPECTED_PACKAGES}" "<no-api-field>" "informational — set at org/registry level"

if [[ ${JSON_OUT} -eq 0 ]]; then
  echo ""
  echo "── Branch protection: ${PROTECTED_BRANCH} ─────────────────────────────"
fi

case "${PROTECTION_HTTP}" in
  200)
    EXPECTED_CHECKS="$(jq -c '.branch_protection.required_status_checks' "${META_FILE}")"
    ACTUAL_CHECKS="$(jq -c '.required_status_checks.contexts // []' <<<"${PROTECTION_JSON}")"
    if sets_equal "${EXPECTED_CHECKS}" "${ACTUAL_CHECKS}"; then
      record PASS "required_status_checks" "${EXPECTED_CHECKS}" "${ACTUAL_CHECKS}"
    else
      MISSING="$(jq -c --argjson a "${ACTUAL_CHECKS}" '. - $a' <<<"${EXPECTED_CHECKS}")"
      EXTRA="$(jq -c --argjson e "${EXPECTED_CHECKS}" '. - $e' <<<"${ACTUAL_CHECKS}")"
      record FAIL "required_status_checks" "${EXPECTED_CHECKS}" "${ACTUAL_CHECKS}" \
        "missing=${MISSING} extra=${EXTRA}"
    fi

    EXPECTED_PR="$(jq -r '.branch_protection.require_pull_request' "${META_FILE}")"
    ACTUAL_PR_PRESENT="$(jq -r 'if .required_pull_request_reviews then "true" else "false" end' <<<"${PROTECTION_JSON}")"
    if [[ "${EXPECTED_PR}" == "${ACTUAL_PR_PRESENT}" ]]; then
      record PASS "require_pull_request" "${EXPECTED_PR}" "${ACTUAL_PR_PRESENT}"
    else
      record FAIL "require_pull_request" "${EXPECTED_PR}" "${ACTUAL_PR_PRESENT}"
    fi

    EXPECTED_ADMINS="$(jq -r '.branch_protection.include_administrators' "${META_FILE}")"
    ACTUAL_ADMINS="$(jq -r '.enforce_admins.enabled' <<<"${PROTECTION_JSON}")"
    if [[ "${EXPECTED_ADMINS}" == "${ACTUAL_ADMINS}" ]]; then
      record PASS "enforce_admins" "${EXPECTED_ADMINS}" "${ACTUAL_ADMINS}"
    else
      record FAIL "enforce_admins" "${EXPECTED_ADMINS}" "${ACTUAL_ADMINS}"
    fi

    EXPECTED_FP="$(jq -r '.branch_protection.allow_force_pushes' "${META_FILE}")"
    ACTUAL_FP="$(jq -r '.allow_force_pushes.enabled' <<<"${PROTECTION_JSON}")"
    if [[ "${EXPECTED_FP}" == "${ACTUAL_FP}" ]]; then
      record PASS "allow_force_pushes" "${EXPECTED_FP}" "${ACTUAL_FP}"
    else
      record FAIL "allow_force_pushes" "${EXPECTED_FP}" "${ACTUAL_FP}"
    fi

    EXPECTED_DEL="$(jq -r '.branch_protection.allow_deletions' "${META_FILE}")"
    ACTUAL_DEL="$(jq -r '.allow_deletions.enabled' <<<"${PROTECTION_JSON}")"
    if [[ "${EXPECTED_DEL}" == "${ACTUAL_DEL}" ]]; then
      record PASS "allow_deletions" "${EXPECTED_DEL}" "${ACTUAL_DEL}"
    else
      record FAIL "allow_deletions" "${EXPECTED_DEL}" "${ACTUAL_DEL}"
    fi
    ;;
  404)
    record FAIL "branch_protection_exists" "true" "false" \
      "no protection rule on '${PROTECTED_BRANCH}' (HTTP 404)"
    ;;
  403)
    record FAIL "branch_protection_exists" "true" "<forbidden>" \
      "HTTP 403 — token lacks Administration:read OR repo is private on free plan"
    ;;
  *)
    record FAIL "branch_protection_exists" "true" "<http ${PROTECTION_HTTP}>" \
      "unexpected response from protection endpoint"
    ;;
esac

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL=$((PASS_COUNT + FAIL_COUNT))

if [[ ${JSON_OUT} -eq 1 ]]; then
  jq -n \
    --arg owner "${OWNER}" \
    --arg repo "${REPO}" \
    --argjson pass "${PASS_COUNT}" \
    --argjson fail "${FAIL_COUNT}" \
    --argjson total "${TOTAL}" \
    --argjson results "${RESULTS_JSON}" \
    '{owner:$owner, repo:$repo, total:$total, pass:$pass, fail:$fail, drift: ($fail > 0), results:$results}'
else
  echo ""
  echo "── Summary ──────────────────────────────────────────────────────────"
  echo "  Total checks: ${TOTAL}"
  echo "  Pass:         ${PASS_COUNT}"
  echo "  Fail:         ${FAIL_COUNT}"
  echo ""
  if [[ ${FAIL_COUNT} -gt 0 ]]; then
    echo "  Drift detected. Review failures above."
  else
    echo "  All checks pass. No drift detected."
  fi
fi

[[ ${FAIL_COUNT} -eq 0 ]]
