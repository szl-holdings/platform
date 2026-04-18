#!/usr/bin/env bash
# configure-branch-protection.sh
#
# One-shot script to configure branch protection for main/master via the
# GitHub GraphQL API.
#
# PREREQUISITE: The repository must be either:
#   (a) on GitHub Team (or higher) if private, OR
#   (b) public
# Private repos on the free org plan receive HTTP 403 / FORBIDDEN for all
# branch protection mutations — REST and GraphQL alike.
#
# Usage:
#   GH_TOKEN=<pat-with-repo-admin-scope> bash ops/github/configure-branch-protection.sh
#
# The token must have the `repo` scope (classic) or a fine-grained PAT with
# "Administration" read+write on this repository.
#
# After running, verify at:
#   https://github.com/stephenlutar2-hash/szl-holdings-platform/settings/branches

set -euo pipefail

OWNER="stephenlutar2-hash"
REPO="szl-holdings-platform"
TOKEN="${GH_TOKEN:?GH_TOKEN env var is required}"
GRAPHQL="https://api.github.com/graphql"

AUTH_HEADER="Authorization: Bearer ${TOKEN}"
CT_HEADER="Content-Type: application/json"

STATUS_CHECKS='["CI Gate","E2E Gate","Lighthouse Gate","CodeQL Analysis / analyze","Dependency Review"]'

# ── Step 1: Resolve the repository node ID ────────────────────────────────────
echo "Resolving repository ID for ${OWNER}/${REPO}…"
REPO_ID=$(curl -fsSL -X POST "${GRAPHQL}" \
  -H "${AUTH_HEADER}" \
  -H "${CT_HEADER}" \
  -d "{\"query\":\"query { repository(owner:\\\"${OWNER}\\\", name:\\\"${REPO}\\\") { id } }\"}" \
  | jq -r '.data.repository.id')

if [[ -z "${REPO_ID}" || "${REPO_ID}" == "null" ]]; then
  echo "ERROR: Could not resolve repository ID. Check token permissions and repo name."
  exit 1
fi
echo "Repository ID: ${REPO_ID}"

# ── Step 2: Create branch protection rule ──────────────────────────────────────
create_rule() {
  local PATTERN="$1"
  echo ""
  echo "Creating branch protection rule for pattern: ${PATTERN}"

  RESPONSE=$(curl -fsSL -X POST "${GRAPHQL}" \
    -H "${AUTH_HEADER}" \
    -H "${CT_HEADER}" \
    -d @- <<EOF
{
  "query": "mutation CreateBPR(\$repoId: ID!, \$pattern: String!, \$contexts: [String!]!) { createBranchProtectionRule(input: { repositoryId: \$repoId, pattern: \$pattern, requiresStatusChecks: true, requiredStatusCheckContexts: \$contexts, isAdminEnforced: true, requiresStrictStatusChecks: true, requiresApprovingReviews: true, requiredApprovingReviewCount: 1, dismissesStaleReviews: true, requiresCodeOwnerReviews: true, restrictsReviewDismissals: true, requiresConversationResolution: true, allowsForcePushes: false, allowsDeletions: false }) { branchProtectionRule { id pattern requiresStatusChecks requiredStatusCheckContexts isAdminEnforced } } }",
  "variables": {
    "repoId": "${REPO_ID}",
    "pattern": "${PATTERN}",
    "contexts": ${STATUS_CHECKS}
  }
}
EOF
  )

  echo "${RESPONSE}" | jq .

  if echo "${RESPONSE}" | jq -e '.errors' > /dev/null 2>&1; then
    echo "ERROR applying protection for '${PATTERN}':"
    echo "${RESPONSE}" | jq '.errors'
    return 1
  fi

  echo "Done: ${PATTERN}"
}

create_rule "main"

# master is optional — skip if it doesn't exist
if curl -fsSL -H "${AUTH_HEADER}" \
  "https://api.github.com/repos/${OWNER}/${REPO}/branches/master" \
  | jq -e '.name' > /dev/null 2>&1; then
  create_rule "master"
else
  echo "  (master branch not found — skipped)"
fi

echo ""
echo "Branch protection applied.  Verify at:"
echo "  https://github.com/${OWNER}/${REPO}/settings/branches"
