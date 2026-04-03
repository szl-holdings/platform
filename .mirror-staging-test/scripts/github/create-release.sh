#!/usr/bin/env bash
# =============================================================================
# SZL Holdings — Create GitHub Release Script
# Usage: ./scripts/github/create-release.sh v0.2.0
# Prerequisites: gh CLI installed and authenticated
# =============================================================================

set -e

REPO="stephenlutar2-hash/szl-holdings-platform"
VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 v0.2.0"
  exit 1
fi

# Strip leading 'v' for file name
VERSION_NUM="${VERSION#v}"
NOTES_FILE="docs/releases/${VERSION}.md"

echo "================================================================"
echo "  Creating GitHub Release: $VERSION"
echo "  Repository: $REPO"
echo "================================================================"
echo ""

# Verify release notes file exists
if [ ! -f "$NOTES_FILE" ]; then
  echo "ERROR: Release notes not found: $NOTES_FILE"
  echo "Create the release notes file before creating the release."
  exit 1
fi

# Verify gh auth
gh auth status || { echo "ERROR: Run 'gh auth login' first"; exit 1; }

# Run validation
echo "Running pre-release validation..."
bash scripts/public-mirror/validate-mirror.sh
echo ""

# Create the release
echo "Creating release $VERSION..."
gh release create "$VERSION" \
  --repo "$REPO" \
  --title "$VERSION — $(head -3 "$NOTES_FILE" | tail -1 | sed 's/^## //')" \
  --notes-file "$NOTES_FILE" \
  --latest

echo ""
echo "Release created: https://github.com/$REPO/releases/tag/$VERSION"
echo ""
