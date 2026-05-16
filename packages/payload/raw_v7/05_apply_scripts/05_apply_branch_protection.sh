#!/usr/bin/env bash
# Fly V7 — Tier 3: Apply 6 Branch Protection PUTs
# REQUIRES: gh CLI authenticated as stephenlutar2-hash with admin rights
# REQUIRES: human confirm_action PER REPO (one-way doors)
# REQUIRES: prior decision on review-count deadlock (see BP_FIX_REPORT.md risk register)
#
# Order: low-risk repos first, allow rollback if something blocks Stephen's
# own future PRs.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPOS=(szl-brand szl-cookbook szl-trust lutar-lean vsp-otel agi-forecast)

for repo in "${REPOS[@]}"; do
  echo "==> Applying BP for szl-holdings/${repo}"
  echo "    payload: ${ROOT}/02_specialists/bp_fix/${repo}_bp_payload.json"
  read -r -p "    confirm apply? [y/N] " ans
  if [[ "${ans,,}" == "y" ]]; then
    gh api -X PUT "/repos/szl-holdings/${repo}/branches/main/protection" \
      --input "${ROOT}/02_specialists/bp_fix/${repo}_bp_payload.json"
    echo "    applied."
  else
    echo "    skipped."
  fi
done

echo "Done. BP application loop complete."
