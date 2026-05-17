#!/usr/bin/env bash
# retire-master-branch.sh
#
# One-shot, idempotent operator script that fully retires the legacy
# `master` branch on the GitHub remote after the default has been renamed
# to `main`.
#
# What this script does:
#   1. Verifies the remote default branch is `main`.
#   2. Checks whether a `master` ref still exists on the remote.
#   3. Lists any open PRs still targeting `master` (refuses to delete if any).
#   4. Prints the exact `gh` / `curl` commands the operator needs to run
#      to delete the stale `master` ref.
#   5. If `--apply` is passed and no open PRs target `master`, performs the
#      deletion via `gh api`.
#
# Usage:
#   GH_TOKEN=<pat>  bash ops/github/retire-master-branch.sh           # dry-run (default)
#   GH_TOKEN=<pat>  bash ops/github/retire-master-branch.sh --apply   # actually delete
#
# The token must have the `repo` scope (classic) or a fine-grained PAT
# with "Administration" + "Contents" read+write on this repository.
#
# This script is safe to run repeatedly — if `master` is already gone it
# exits 0 with a friendly message.

set -euo pipefail

OWNER="szl-holdings"
REPO="szl-holdings-platform"
TOKEN="${GH_TOKEN:?GH_TOKEN env var is required}"

APPLY=0
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=1
fi

API="https://api.github.com"
AUTH_HEADER="Authorization: Bearer ${TOKEN}"
ACCEPT_HEADER="Accept: application/vnd.github+json"
API_VERSION_HEADER="X-GitHub-Api-Version: 2022-11-28"

echo "=== Retire master branch — ${OWNER}/${REPO} ==="
echo "Mode: $([[ ${APPLY} -eq 1 ]] && echo APPLY || echo DRY-RUN)"
echo ""

# ── Step 1: Verify remote default branch is `main` ────────────────────────────
echo "[1/4] Verifying remote default branch…"
DEFAULT_BRANCH=$(curl -fsSL \
  -H "${AUTH_HEADER}" -H "${ACCEPT_HEADER}" -H "${API_VERSION_HEADER}" \
  "${API}/repos/${OWNER}/${REPO}" \
  | jq -r '.default_branch')

echo "    Remote default branch: ${DEFAULT_BRANCH}"
if [[ "${DEFAULT_BRANCH}" != "main" ]]; then
  echo "    ERROR: expected default branch 'main', got '${DEFAULT_BRANCH}'."
  echo "    Refusing to proceed — fix the default first."
  exit 1
fi

# ── Step 2: Check whether `master` still exists on the remote ─────────────────
echo ""
echo "[2/4] Checking whether 'master' ref still exists on the remote…"
HTTP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "${AUTH_HEADER}" -H "${ACCEPT_HEADER}" -H "${API_VERSION_HEADER}" \
  "${API}/repos/${OWNER}/${REPO}/branches/master")

case "${HTTP_CODE}" in
  200)
    echo "    'master' ref EXISTS on remote — proceeding with safety checks."
    ;;
  404)
    echo "    'master' ref is already gone. Nothing to do. ✅"
    exit 0
    ;;
  *)
    echo "    ERROR: unexpected HTTP ${HTTP_CODE} when probing 'master' ref."
    exit 1
    ;;
esac

# ── Step 3: Refuse to delete if any open PR still targets `master` ────────────
echo ""
echo "[3/4] Listing open PRs that still target 'master'…"
OPEN_PRS_JSON=$(curl -fsSL \
  -H "${AUTH_HEADER}" -H "${ACCEPT_HEADER}" -H "${API_VERSION_HEADER}" \
  "${API}/repos/${OWNER}/${REPO}/pulls?state=open&base=master&per_page=100")

OPEN_PR_COUNT=$(echo "${OPEN_PRS_JSON}" | jq 'length')
echo "    Open PRs targeting master: ${OPEN_PR_COUNT}"

if [[ "${OPEN_PR_COUNT}" -gt 0 ]]; then
  echo ""
  echo "    The following open PRs still target 'master':"
  echo "${OPEN_PRS_JSON}" | jq -r '.[] | "      #\(.number)  \(.title)  (\(.html_url))"'
  echo ""
  echo "    Refusing to delete 'master'. Retarget or close these PRs first."
  exit 1
fi

# ── Step 4: Print or execute the delete command ───────────────────────────────
echo ""
echo "[4/4] Ready to delete the 'master' ref."
echo ""
echo "    Exact gh command:"
echo "      gh api -X DELETE repos/${OWNER}/${REPO}/git/refs/heads/master"
echo ""
echo "    Exact curl command:"
echo "      curl -fsSL -X DELETE \\"
echo "        -H \"Authorization: Bearer \$GH_TOKEN\" \\"
echo "        -H \"Accept: application/vnd.github+json\" \\"
echo "        -H \"X-GitHub-Api-Version: 2022-11-28\" \\"
echo "        ${API}/repos/${OWNER}/${REPO}/git/refs/heads/master"
echo ""

if [[ ${APPLY} -ne 1 ]]; then
  echo "    Dry-run only. Re-run with --apply to actually delete."
  exit 0
fi

echo "    Applying deletion…"
curl -fsSL -X DELETE \
  -H "${AUTH_HEADER}" -H "${ACCEPT_HEADER}" -H "${API_VERSION_HEADER}" \
  "${API}/repos/${OWNER}/${REPO}/git/refs/heads/master"

echo "    'master' ref deleted. ✅"
echo ""
echo "    Verify:"
echo "      gh api repos/${OWNER}/${REPO}/branches/master  # should return 404"
