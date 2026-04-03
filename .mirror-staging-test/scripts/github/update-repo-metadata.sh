#!/usr/bin/env bash
# =============================================================================
# SZL Holdings — Update Repository Metadata Script
# Applies canonical description, topics, and homepage to the flagship repo.
# Prerequisites: gh CLI installed and authenticated
# =============================================================================

set -e

REPO="stephenlutar2-hash/szl-holdings-platform"

echo "================================================================"
echo "  Updating GitHub Repository Metadata"
echo "  Repository: $REPO"
echo "================================================================"
echo ""

gh auth status || { echo "ERROR: Run 'gh auth login' first"; exit 1; }

echo "Updating description and homepage..."
gh repo edit "$REPO" \
  --description "Platform ecosystem for business observability, AI orchestration, maritime intelligence, and secure execution — built by Stephen Lutar." \
  --homepage "https://szlholdings.com" \
  --enable-issues \
  --disable-wiki \
  --disable-projects
echo "  ✓ Repository metadata updated"
echo ""

echo "Setting topics..."
gh repo edit "$REPO" \
  --add-topic typescript \
  --add-topic react \
  --add-topic nodejs \
  --add-topic postgresql \
  --add-topic drizzle-orm \
  --add-topic expo \
  --add-topic monorepo \
  --add-topic pnpm \
  --add-topic azure \
  --add-topic ai-orchestration \
  --add-topic business-observability \
  --add-topic maritime-intelligence \
  --add-topic saas
echo "  ✓ Topics set"
echo ""

echo "Complete. View repository: https://github.com/$REPO"
