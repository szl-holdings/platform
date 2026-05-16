#!/usr/bin/env bash
# Fly V7 — Tier 2: CLOSE 18 doctrine-violation PRs
# REQUIRES: gh CLI authenticated as stephenlutar2-hash
# REQUIRES: human confirm_action — DO NOT RUN UNTIL APPROVED
# Reference: 02_specialists/pr_triage/PR_TRIAGE_REPORT.md
#
# These PRs contain all 8 forbidden patterns verbatim in their bodies as
# part of checklist documentation. They are CI-green and could be merged
# by accident, which would inject doctrine violations into default branch.

set -euo pipefail

COMMENT="Closing per Fly V7 doctrine review. PR body contains forbidden patterns. \
A scrubbed replacement will be opened. Tracking: Fly-V7 doctrine sweep."

# 13 polish/hygiene-and-doctrine-sweep PRs — fill PR numbers from
# 02_specialists/pr_triage/all_prs_final.json before running.
# Format: <repo>:<pr_number>
PRS_POLISH=(
  # "amaru:NNN"
  # "a11oy:NNN"
  # "sentra:NNN"
  # "terra:NNN"
  # "vessels:NNN"
  # "counsel:NNN"
  # "carlota-jo:NNN"
  # "lutar-lean:NNN"
  # "szl-trust:NNN"
  # "szl-cookbook:NNN"
  # "szl-brand:NNN-a"
  # "szl-brand:NNN-b"
  # ".github:NNN"
)

# 5 additional doctrine-flagged feature PRs
PRS_FEATURE=(
  # "a11oy:15"
  # "lutar-lean:11"
  # "szl-brand:8"
  # ".github:29"
  # "ouroboros-thesis:36"
)

for spec in "${PRS_POLISH[@]}" "${PRS_FEATURE[@]}"; do
  repo="${spec%%:*}"
  pr="${spec##*:}"
  echo "==> Closing szl-holdings/${repo}#${pr}"
  gh pr close "${pr}" --repo "szl-holdings/${repo}" --comment "$COMMENT"
done

echo "Done. Closed ${#PRS_POLISH[@]} polish + ${#PRS_FEATURE[@]} feature PRs."
