#!/usr/bin/env bash
# Fly V7 — Tier 1: MERGE 12 Dependabot PRs
# REQUIRES: gh CLI authenticated as stephenlutar2-hash
# REQUIRES: human confirm_action
# Reference: 02_specialists/pr_triage/PR_TRIAGE_REPORT.md
#
# All 12 are routine action-version bumps:
#   - github/codeql-action 4.35.4 -> 4.35.5
#   - step-security/harden-runner 2.19.1 -> 2.19.3
# CI green, mergeable=clean, non-draft, no doctrine violations.
#
# NOTE: enforce_admins=true blocks `gh pr merge --admin`. If a merge fails,
# either temporarily relax review count via BP PATCH, or have a 2nd
# collaborator review. See 02_specialists/bp_fix/BP_FIX_REPORT.md.

set -euo pipefail

# Format: <repo>:<pr_number> — fill from all_prs_final.json before running
DEPENDABOT_PRS=(
  # "amaru:NNN"
  # "a11oy:NNN"
  # "sentra:NNN"
  # "terra:NNN"
  # "vessels:NNN"
  # "counsel:NNN"
  # "carlota-jo:NNN"
  # ... (12 total)
)

for spec in "${DEPENDABOT_PRS[@]}"; do
  repo="${spec%%:*}"
  pr="${spec##*:}"
  echo "==> Merging szl-holdings/${repo}#${pr} (squash)"
  gh pr merge "${pr}" --repo "szl-holdings/${repo}" --squash --auto
done

echo "Done. ${#DEPENDABOT_PRS[@]} Dependabot PRs queued for auto-merge."
