#!/usr/bin/env bash
# Fly V7 — Tier 1: Open 2 Hygiene PRs (vsp-otel + agi-forecast)
# REQUIRES: gh CLI authenticated as stephenlutar2-hash
# REQUIRES: human confirm_action
# Source files: 02_specialists/hygiene/{repo}/{SECURITY,CONTRIBUTING,CODE_OF_CONDUCT}.md

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPOS=(vsp-otel agi-forecast)
BRANCH="chore/hygiene-files-fly-v7"

for repo in "${REPOS[@]}"; do
  echo "==> Preparing hygiene PR for szl-holdings/${repo}"
  workdir=$(mktemp -d)
  pushd "$workdir" >/dev/null

  gh repo clone "szl-holdings/${repo}" -- --depth 1
  cd "${repo}"
  git checkout -b "${BRANCH}"

  cp "${ROOT}/02_specialists/hygiene/${repo}/SECURITY.md"        SECURITY.md
  cp "${ROOT}/02_specialists/hygiene/${repo}/CONTRIBUTING.md"    CONTRIBUTING.md
  cp "${ROOT}/02_specialists/hygiene/${repo}/CODE_OF_CONDUCT.md" CODE_OF_CONDUCT.md

  git add SECURITY.md CONTRIBUTING.md CODE_OF_CONDUCT.md
  git -c user.email='stephen@szlholdings.com' \
      -c user.name='Lutar, Stephen P.' \
      commit -S -m "chore: add SECURITY, CONTRIBUTING, CODE_OF_CONDUCT (Fly V7 hygiene)" \
              -m "Per SZL Holdings doctrine V6 hygiene baseline."

  git push -u origin "${BRANCH}"

  gh pr create --repo "szl-holdings/${repo}" \
    --title "chore: Fly V7 hygiene baseline (SECURITY, CONTRIBUTING, COC)" \
    --body-file "${ROOT}/02_specialists/hygiene/${repo}/PR_BODY.md" \
    --base main --head "${BRANCH}"

  popd >/dev/null
  rm -rf "$workdir"
done

echo "Done. 2 hygiene PRs opened."
