#!/bin/bash
set -euo pipefail

MIRROR_DIR="${1:-.mirror-staging}"
WORKSPACE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== SZL Holdings — Public Mirror Preparation ==="
echo "Source: $WORKSPACE_ROOT"
echo "Target: $MIRROR_DIR"

rm -rf "$MIRROR_DIR"
mkdir -p "$MIRROR_DIR"

INCLUDE_DIRS=(
  "artifacts"
  "lib"
  "packages"
  "docs"
  "infra"
  "scripts"
  "profile-readme"
  "ops"
  ".github"
)

INCLUDE_FILES=(
  "README.md"
  "CHANGELOG.md"
  "CONTRIBUTING.md"
  "LICENSE.md"
  "SECURITY.md"
  "package.json"
  "pnpm-workspace.yaml"
  "pnpm-lock.yaml"
  "tsconfig.json"
  ".gitignore"
  ".gitattributes"
  "artifact.toml"
)

EXCLUDE_PATTERNS=(
  "node_modules"
  ".env"
  ".env.*"
  "*.sql.gz"
  "*.dump"
  "*.pgdump"
  "*.bak"
  "*.backup"
  "dist"
  ".expo"
  ".tsbuildinfo"
  "__pycache__"
)

echo ""
echo "--- Copying included directories ---"
for dir in "${INCLUDE_DIRS[@]}"; do
  if [ -d "$WORKSPACE_ROOT/$dir" ]; then
    echo "  + $dir/"
    rsync -a \
      --exclude='node_modules' \
      --exclude='.env' \
      --exclude='.env.*' \
      --exclude='*.sql.gz' \
      --exclude='*.dump' \
      --exclude='*.bak' \
      --exclude='dist' \
      --exclude='.expo' \
      --exclude='*.tsbuildinfo' \
      "$WORKSPACE_ROOT/$dir/" "$MIRROR_DIR/$dir/"
  fi
done

echo ""
echo "--- Copying root files ---"
for file in "${INCLUDE_FILES[@]}"; do
  if [ -f "$WORKSPACE_ROOT/$file" ]; then
    echo "  + $file"
    cp "$WORKSPACE_ROOT/$file" "$MIRROR_DIR/$file"
  fi
done

EXCLUDE_DIRS=(
  ".archive"
  ".git-rewrite"
  "backups"
  "exports"
  "scratch"
  "temp"
  "tmp"
  "test-results"
  "attached_assets"
  "social-content"
  "spfx-webparts"
  ".local"
  ".cache"
  ".canvas"
  ".cursor"
)

echo ""
echo "--- Verifying exclusions ---"
for dir in "${EXCLUDE_DIRS[@]}"; do
  if [ -d "$MIRROR_DIR/$dir" ]; then
    echo "  ! Removing leaked directory: $dir"
    rm -rf "$MIRROR_DIR/$dir"
  fi
done

TOTAL_FILES=$(find "$MIRROR_DIR" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$MIRROR_DIR" | cut -f1)

echo ""
echo "=== Mirror Staging Complete ==="
echo "Files: $TOTAL_FILES"
echo "Size: $TOTAL_SIZE"
echo "Location: $MIRROR_DIR"
echo ""
echo "Next steps:"
echo "  1. Review: ls -la $MIRROR_DIR"
echo "  2. Validate: bash scripts/public-mirror/validate-public-surface.sh $MIRROR_DIR"
echo "  3. Push to GitHub: cd $MIRROR_DIR && git init && git remote add origin <repo-url> && git add -A && git commit -m 'v0.1.0 public mirror' && git push -f origin main"
