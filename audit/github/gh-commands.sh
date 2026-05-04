#!/usr/bin/env bash
# =============================================================================
# gh-commands.sh — Safe GitHub CLI Commands for SZL Holdings Org Management
# =============================================================================
#
# Phase D — growth capital Readiness Reset
# Produced: April 2026
#
# IMPORTANT SAFETY NOTES:
# - This script contains ONLY safe, reversible commands.
# - No repos are deleted, force-pushed, or permanently destroyed.
# - Archive operations can be undone via GitHub UI or API.
# - All commands use --dry-run where available, or are read-only by default.
# - Each command is commented with its exact effect and how to undo it.
# - Review every command before executing. Do not pipe this script to bash.
#
# PREREQUISITES:
# - GitHub CLI (gh) installed and authenticated: gh auth login
# - Authenticated account must have org admin permissions for archive/pin operations
# - For org-level operations: gh auth login --scopes "admin:org,repo"
#
# USAGE:
# Run individual commands by copying and pasting — do NOT run this file as a
# script unless you have reviewed every line and understand each operation.
#
# =============================================================================

set -euo pipefail

ORG="szl-holdings"
PLATFORM_REPO="szl-holdings-platform"

# =============================================================================
# SECTION 1: READ-ONLY VERIFICATION COMMANDS
# These are safe to run at any time. They do not modify anything.
# =============================================================================

echo "=== Verify org repos ==="
# Lists all public repos in the org. Verify count and names.
# gh repo list "${ORG}" --public --json name,description,isArchived,pushedAt

echo "=== Check repo topics ==="
# View current topics on the platform repo.
# gh api "repos/${ORG}/${PLATFORM_REPO}/topics" --jq '.names[]'

echo "=== Check branch protection ==="
# View branch protection rules for main and master.
# gh api "repos/${ORG}/${PLATFORM_REPO}/branches/master/protection" 2>/dev/null || echo "No protection on master"
# gh api "repos/${ORG}/${PLATFORM_REPO}/branches/main/protection" 2>/dev/null || echo "No protection on main"

echo "=== Check secret scanning status ==="
# gh api "repos/${ORG}/${PLATFORM_REPO}" --jq '.security_and_analysis'

echo "=== List org members ==="
# gh api "orgs/${ORG}/members" --jq '.[].login'

echo "=== List org teams ==="
# gh api "orgs/${ORG}/teams" --jq '.[].name' 2>/dev/null || echo "No teams or insufficient permissions"

# =============================================================================
# SECTION 2: REPO TOPIC UPDATES (Reversible)
# Adding topics does not remove existing content. Reversible via API.
# =============================================================================

echo "=== Add recommended topics to platform repo ==="
# Current topics: ai-governance, decision-intelligence, enterprise, monorepo,
#                 postgresql, react, typescript, vite
# Recommended additions: pnpm, drizzle-orm, expo, react-native, maritime,
#                        real-estate, cybersecurity
#
# EFFECT: Adds 7 new topics. Improves discoverability by technical investors.
# UNDO: gh api --method PUT "repos/${ORG}/${PLATFORM_REPO}/topics" \
#              -f "names[]=ai-governance" -f "names[]=decision-intelligence" \
#              -f "names[]=enterprise" -f "names[]=monorepo" \
#              -f "names[]=postgresql" -f "names[]=react" \
#              -f "names[]=typescript" -f "names[]=vite"
#
# UNCOMMENT TO EXECUTE:
# gh api --method PUT "repos/${ORG}/${PLATFORM_REPO}/topics" \
#   -f "names[]=ai-governance" \
#   -f "names[]=decision-intelligence" \
#   -f "names[]=enterprise" \
#   -f "names[]=monorepo" \
#   -f "names[]=postgresql" \
#   -f "names[]=react" \
#   -f "names[]=typescript" \
#   -f "names[]=vite" \
#   -f "names[]=pnpm" \
#   -f "names[]=drizzle-orm" \
#   -f "names[]=expo" \
#   -f "names[]=react-native" \
#   -f "names[]=maritime" \
#   -f "names[]=real-estate" \
#   -f "names[]=cybersecurity"
# echo "Topics updated."

# =============================================================================
# SECTION 3: REPO DESCRIPTION UPDATE (Reversible)
# Updates the one-line description shown on the repo page and in search results.
# =============================================================================

echo "=== Update platform repo description ==="
# Current description (from GITHUB_SETTINGS_APPLIED.json):
#   "Governed decision infrastructure — connecting what is observable to what
#    is executable, with full attribution. 11 artifacts, 2,816 API endpoints,
#    798 tables. TypeScript throughout."
#
# Recommended (removes numeric claims that will drift):
#   "Governed decision infrastructure — connecting what is observable to what
#    is executable, with full attribution. TypeScript throughout."
#
# EFFECT: Updates the repo description. Numeric claims removed to prevent drift.
# UNDO: Re-run with the original description string.
#
# UNCOMMENT TO EXECUTE:
# gh api --method PATCH "repos/${ORG}/${PLATFORM_REPO}" \
#   -f description="Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. TypeScript throughout."
# echo "Description updated."

# =============================================================================
# SECTION 4: ORG PROFILE PIN RECOMMENDATIONS (Manual — GitHub UI only)
# Pinning repos requires org admin access and must be done via the GitHub UI.
# The GitHub API does not support pinning repos for org profiles.
# =============================================================================

echo "=== Pin recommendations (MANUAL — GitHub UI required) ==="
cat <<'EOF'
To pin repos on the org profile:
  1. Navigate to: https://github.com/szl-holdings
  2. Click "Customize your organization" (top-right, requires org admin)
  3. Under "Pinned repositories," select:
     Priority 1: szl-holdings/szl-holdings-platform
     Priority 2: szl-holdings/.github
  4. Save

Note: The GitHub API does not support programmatic pinning of org repos.
EOF

# =============================================================================
# SECTION 5: BRANCH PROTECTION VERIFICATION AND CONFIGURATION
# Branch protection rules can be read and written via the REST API:
#   PUT  /repos/{owner}/{repo}/branches/{branch}/protection  — write rules
#   GET  /repos/{owner}/{repo}/branches/{branch}/protection  — read rules
# The GitHub UI and GraphQL API are also valid paths for configuration.
# Fine-grained protection (rulesets) requires the new Rules API (beta).
# =============================================================================

echo "=== Branch protection check ==="
# Verify that branch protection is enabled on master (or main).
# Required settings: require PR review, require status checks, no force push.
#
# gh api "repos/${ORG}/${PLATFORM_REPO}/branches/master/protection" | jq '{
#   required_reviews: .required_pull_request_reviews.required_approving_review_count,
#   required_checks: .required_status_checks.contexts,
#   enforce_admins: .enforce_admins.enabled,
#   allow_force_pushes: .allow_force_pushes.enabled,
#   allow_deletions: .allow_deletions.enabled
# }'

# =============================================================================
# SECTION 6: ARCHIVE CANDIDATES (None at org level — see report)
# No public repos qualify for archiving as of April 2026.
# See audit/github/archive-candidates.md for the full assessment.
# =============================================================================

echo "=== Archive candidates ==="
cat <<'EOF'
No public repos in the szl-holdings org qualify for archiving as of April 2026.

  szl-holdings/szl-holdings-platform: Keep active — primary product
  szl-holdings/.github:               Keep active — org profile

On-disk artifact directories that are already soft-archived (not registered,
not deployed) are documented in ops/frontier/disposition-matrix.md. No
repo-level archive action is needed for these:
  artifacts/firestorm/  — archived Task #920
  artifacts/imperium/   — archived Task #920
  artifacts/lyte-command-center/ — archived Task #920

If archiving any of the above on-disk directories becomes necessary in the future:
# gh repo archive "${ORG}/${PLATFORM_REPO}" --confirm  # NEVER run this for the main platform repo
# Undo: gh api --method PATCH "repos/${ORG}/${PLATFORM_REPO}" -F archived=false
EOF

# =============================================================================
# SECTION 7: SECRET SCANNING & PUSH PROTECTION (Read-only check)
# Must be enabled via GitHub UI: Settings > Code security and analysis
# =============================================================================

echo "=== Secret scanning & push protection status ==="
# gh api "repos/${ORG}/${PLATFORM_REPO}" \
#   --jq '.security_and_analysis | {
#     secret_scanning: .secret_scanning.status,
#     secret_scanning_push_protection: .secret_scanning_push_protection.status,
#     dependabot_security_updates: .dependabot_security_updates.status
#   }'

# =============================================================================
# END OF SCRIPT
# =============================================================================

echo ""
echo "gh-commands.sh reviewed. No commands were executed automatically."
echo "Copy and uncomment individual commands to apply specific changes."
echo "See audit/github/ reports for full context on each recommendation."
