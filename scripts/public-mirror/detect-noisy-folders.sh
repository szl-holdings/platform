#!/usr/bin/env bash
# =============================================================================
# SZL Holdings — Noisy Folder Detection Script
# Lists all directories and files that should not appear in the public mirror.
# =============================================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo "================================================================"
echo "  SZL Holdings — Noisy Folder Detection"
echo "  Scanning: $REPO_ROOT"
echo "================================================================"
echo ""

FOUND=0

# Noisy directory names
NOISY_DIRS=(".archive" "backups" "exports" "temp" "tmp" "scratch" ".tmp")
for dir in "${NOISY_DIRS[@]}"; do
  HITS=$(find "$REPO_ROOT" \
    -not -path "*/node_modules/*" \
    -not -path "*/.local/*" \
    -not -path "*/.cache/*" \
    -type d \
    -name "$dir" 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo "  [NOISY DIR] $HITS"
    FOUND=1
  fi
done

# Noisy file patterns
NOISY_PATTERNS=("*.log" "*.bak" "*.backup" "*.tar.gz" "*.zip")
for pattern in "${NOISY_PATTERNS[@]}"; do
  HITS=$(find "$REPO_ROOT" \
    -not -path "*/node_modules/*" \
    -not -path "*/.local/*" \
    -not -path "*/.cache/*" \
    -name "$pattern" 2>/dev/null | head -10 || true)
  if [ -n "$HITS" ]; then
    echo "$HITS" | while read f; do echo "  [NOISY FILE] $f"; done
    FOUND=1
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "  No noisy folders or files detected."
  echo ""
  echo "  Workspace is clean."
else
  echo ""
  echo "  ACTION REQUIRED: Review the above paths before mirror push."
  echo "  Add them to .gitignore or remove them from the workspace."
fi

echo ""
