#!/usr/bin/env bash
# Fly V7 — Tier 3: Patch GitHub display name
# REQUIRES: gh CLI authenticated as stephenlutar2-hash
# REQUIRES: human confirm_action
#
# Current: "Stephen Paul Lutar Jr." (contains 2 forbidden patterns)
# Target:  "Lutar, Stephen P."

set -euo pipefail

echo "Current profile:"
gh api /user --jq '{login, name, email}'

read -r -p "Patch display name to 'Lutar, Stephen P.'? [y/N] " ans
if [[ "${ans,,}" == "y" ]]; then
  gh api -X PATCH /user -f name='Lutar, Stephen P.'
  echo "Patched. New profile:"
  gh api /user --jq '{login, name, email}'
else
  echo "Skipped."
fi
