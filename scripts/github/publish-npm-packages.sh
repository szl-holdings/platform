#!/usr/bin/env bash
# SZL Holdings — Manual npm Publish Script
#
# Publishes all @szl-holdings/* packages to GitHub Packages.
# This script is for manual publishing. CI publishing is handled by
# .github/workflows/npm-publish.yml on release tags.
#
# Usage:
#   ./scripts/github/publish-npm-packages.sh <version>
#   ./scripts/github/publish-npm-packages.sh 1.2.3
#
# Requirements:
#   - NODE_AUTH_TOKEN env var with write:packages scope (GitHub PAT)
#     e.g.: export NODE_AUTH_TOKEN=ghp_your_token_here
#   - pnpm installed
#   - All packages built

set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Error: Version argument required."
  echo "Usage: $0 <version> (e.g. $0 1.2.3)"
  exit 1
fi

if [ -z "${NODE_AUTH_TOKEN:-}" ]; then
  echo "Error: NODE_AUTH_TOKEN environment variable is required."
  echo "Set it with: export NODE_AUTH_TOKEN=ghp_your_token_here"
  exit 1
fi

echo "Verifying GitHub Packages authentication..."
if ! npm whoami --registry https://npm.pkg.github.com 2>/dev/null; then
  echo "Error: Authentication failed. Check that NODE_AUTH_TOKEN has write:packages scope."
  exit 1
fi

echo "========================================"
echo "  SZL Holdings — npm Package Publisher"
echo "  Version: $VERSION"
echo "  Registry: https://npm.pkg.github.com"
echo "========================================"
echo ""

# All publishable lib packages
PACKAGES=(
  "lib/shared-ui"
  "lib/observability"
  "lib/config"
  "lib/services"
  "lib/api-spec"
  "lib/analytics"
  "lib/api-client-react"
  "lib/api-zod"
  "lib/approvals"
  "lib/audit"
  "lib/auth"
  "lib/data-connectors"
  "lib/graphql-client"
  "lib/i18n"
  "lib/mcp-client"
  "lib/proof-chain"
  "lib/replit-auth-web"
  "lib/workflow-engine"
  "lib/worldline"
  "lib/db"
  "lib/ai-engine"
  "lib/integrations-anthropic-ai"
  "lib/integrations-gemini-ai"
  "lib/integrations-openai-ai-server"
)

echo "Step 1: Building all packages..."
pnpm run build
echo ""

echo "Step 2: Setting version $VERSION on all packages..."
for pkg in "${PACKAGES[@]}"; do
  if [ -f "$pkg/package.json" ]; then
    echo "  Versioning $pkg -> $VERSION"
    pnpm --filter "./$pkg" exec npm version "$VERSION" --no-git-tag-version 2>/dev/null || true
  fi
done
echo ""

echo "Step 3: Publishing to GitHub Packages..."
PUBLISHED=0
FAILED=0

for pkg in "${PACKAGES[@]}"; do
  if [ -f "$pkg/package.json" ]; then
    PKG_NAME=$(node -e "console.log(require('./$pkg/package.json').name)" 2>/dev/null || echo "unknown")
    echo "  Publishing $PKG_NAME..."
    if pnpm --filter "./$pkg" publish --no-git-checks --access public 2>&1; then
      echo "    OK"
      PUBLISHED=$((PUBLISHED + 1))
    else
      echo "    FAILED (may already exist or have build issues)"
      FAILED=$((FAILED + 1))
    fi
  fi
done

echo ""
echo "========================================"
echo "  Publish Complete"
echo "  Published: $PUBLISHED"
echo "  Failed/Skipped: $FAILED"
echo ""
echo "  View packages at:"
echo "  https://github.com/orgs/szl-holdings/packages"
echo "========================================"
