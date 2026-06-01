#!/bin/bash
# wiki-commit.sh
#
# Commits and pushes wiki changes to the GitHub Wiki repository.
#
# Usage: bash scripts/wiki/wiki-commit.sh "<commit message>"
#
# Prerequisites:
#   - Wiki repo cloned at ../szl-holdings-platform.wiki
#   - export-docs-to-wiki.ts has been run (files copied to wiki dir)
#   - GitHub credentials available (SSH key or token)

set -euo pipefail

WIKI_DIR="${WIKI_DIR:-../szl-holdings-platform.wiki}"
COMMIT_MESSAGE="${1:-"Wiki update — $(date +%Y-%m-%d)"}"

if [ ! -d "$WIKI_DIR" ]; then
  echo "ERROR: Wiki directory not found: $WIKI_DIR"
  echo ""
  echo "Clone the wiki repo first:"
  echo "  git clone https://github.com/stephenlutar2-hash/szl-holdings-platform.wiki.git ../szl-holdings-platform.wiki"
  exit 1
fi

echo "=== Wiki Commit ==="
echo "Directory: $WIKI_DIR"
echo "Message:   $COMMIT_MESSAGE"
echo ""

cd "$WIKI_DIR"

git add -A

if git diff --staged --quiet; then
  echo "No changes to commit. Wiki is up to date."
  exit 0
fi

git diff --staged --name-only
echo ""

git commit -m "$COMMIT_MESSAGE"
git push origin master

echo ""
echo "✓ Wiki updated successfully."
echo ""
echo "Verify at: https://github.com/stephenlutar2-hash/szl-holdings-platform/wiki"
