#!/usr/bin/env bash
# Push .github/workflows/ to szl-holdings/szl-holdings-platform on master and main.
#
# Why this script exists:
# Replit's GitHub OAuth connection has the `repo` scope but not the `workflow` scope.
# GitHub blocks any commit touching `.github/workflows/` from a token without `workflow`,
# which is why these YAMLs were missing from the remote until task #2187.
#
# Usage (run on a machine where you are signed in as a repo admin):
#   1. Create a classic PAT at https://github.com/settings/tokens with the `workflow` scope checked.
#   2. export GH_WORKFLOW_TOKEN=ghp_xxxxxxxxxxxxxxxxx
#   3. bash ops/github/push-workflows.sh
#
# This script clones the repo to a tempdir, copies the workflow files in, and pushes
# both master and main. Idempotent — safe to re-run.
set -euo pipefail

OWNER="szl-holdings"
REPO="szl-holdings-platform"
SRC_DIR="$(cd "$(dirname "$0")/../.." && pwd)/.github/workflows"

if [[ -z "${GH_WORKFLOW_TOKEN:-}" ]]; then
  echo "ERROR: GH_WORKFLOW_TOKEN not set. Create a classic PAT with the 'workflow' scope and export it." >&2
  exit 1
fi

if [[ ! -d "$SRC_DIR" ]]; then
  echo "ERROR: source workflows dir not found: $SRC_DIR" >&2
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"

echo ">>> cloning $OWNER/$REPO"
git clone --depth 1 --no-single-branch \
  "https://x-access-token:${GH_WORKFLOW_TOKEN}@github.com/${OWNER}/${REPO}.git" repo
cd repo
git config user.email "ci@szl-holdings.local"
git config user.name "SZL CI"

push_branch() {
  local branch="$1"
  echo ">>> pushing to $branch"
  git fetch origin "$branch":"$branch" 2>/dev/null || git fetch origin "$branch"
  git checkout "$branch"
  mkdir -p .github/workflows
  cp "$SRC_DIR"/*.yml .github/workflows/
  git add .github/workflows
  if git diff --cached --quiet; then
    echo "    no changes for $branch"
    return
  fi
  git commit -m "ci: update GitHub Actions workflows — disable broken automated triggers, fix codenames (task #3163)

- container-publish.yml: disabled automated release/tag triggers (Dockerfiles not present)
- npm-publish.yml: disabled automated release/tag triggers (packages not ready)
- ci.yml: fix comment — LUMINA → Pulse (AI Executive Briefing)
All core CI jobs (lint, typecheck, build, integration-test, e2e,
security, readiness-gate, proof-chain, brand-strings) remain unchanged."
  git push origin "$branch"
}

push_branch master
push_branch main

echo ">>> done. Verify at https://github.com/${OWNER}/${REPO}/actions"
