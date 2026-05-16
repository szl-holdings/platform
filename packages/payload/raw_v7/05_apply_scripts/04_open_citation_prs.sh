#!/usr/bin/env bash
# Fly V7 — Tier 1: Open 13 CITATION.cff email-add PRs
# REQUIRES: gh CLI authenticated as stephenlutar2-hash
# REQUIRES: human confirm_action
# Source files: 02_specialists/citation_fix/{repo}_CITATION.cff

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPOS=(amaru a11oy sentra terra vessels counsel carlota-jo ouroboros ouroboros-thesis lutar-lean vsp-otel agi-forecast .github)

for repo in "${REPOS[@]}"; do
  branch="chore/citation-email-${repo//./}"
  echo "==> Preparing CITATION.cff PR for szl-holdings/${repo} on ${branch}"

  workdir=$(mktemp -d)
  pushd "$workdir" >/dev/null

  gh repo clone "szl-holdings/${repo}" -- --depth 1
  cd "${repo}"
  git checkout -b "${branch}"

  cp "${ROOT}/02_specialists/citation_fix/${repo}_CITATION.cff" CITATION.cff

  git add CITATION.cff
  git -c user.email='stephen@szlholdings.com' \
      -c user.name='Lutar, Stephen P.' \
      commit -S -m "chore(citation): add canonical contact email to CITATION.cff" \
              -m "Per SZL Holdings author metadata standard (Fly V7)."

  git push -u origin "${branch}"

  gh pr create --repo "szl-holdings/${repo}" \
    --title "chore(citation): add canonical contact email" \
    --body-file "${ROOT}/02_specialists/citation_fix/${repo}_PR_BODY.md" \
    --base main --head "${branch}"

  popd >/dev/null
  rm -rf "$workdir"
done

echo "Done. ${#REPOS[@]} CITATION.cff PRs opened."
