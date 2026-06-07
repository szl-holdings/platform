#!/bin/bash
set -uo pipefail

TARGET="${1:-.}"
REPORT="docs/audit/public-mirror-report.md"
ERRORS=0
WARNINGS=0

echo "=== SZL Holdings — Public Mirror Validation ==="
echo "Scanning: $TARGET"
echo ""

check_excluded() {
  local dir="$1"
  if [ -d "$TARGET/$dir" ]; then
    echo "  ERROR: Excluded directory found: $dir"
    ERRORS=$((ERRORS+1))
  fi
}

EXCLUDED_DIRS=(
  ".archive" ".git-rewrite" "backups" "exports" "scratch"
  "temp" "tmp" "test-results" "attached_assets" "social-content"
  ".local" ".cache" ".canvas" ".cursor"
)

echo "--- Checking excluded directories (recursive) ---"
for dir in "${EXCLUDED_DIRS[@]}"; do
  check_excluded "$dir"
  while IFS= read -r found; do
    if [ -n "$found" ]; then
      echo "  ERROR: Nested excluded directory: $found"
      ERRORS=$((ERRORS+1))
    fi
  done < <(find "$TARGET" -type d -name "$dir" -not -path "$TARGET/$dir" 2>/dev/null)
done

echo ""
echo "--- Checking for secrets/env files ---"
ENV_FILES=$(find "$TARGET" -name ".env" -o -name ".env.*" -o -name "*.env" 2>/dev/null | head -20)
if [ -n "$ENV_FILES" ]; then
  echo "  ERROR: Environment files found:"
  echo "$ENV_FILES" | sed 's/^/    /'
  ERRORS=$((ERRORS+1))
fi

echo ""
echo "--- Checking for secret patterns in files ---"
SECRET_HITS=$(grep -rl --include="*.ts" --include="*.js" --include="*.json" --include="*.md" -E "(sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|ghp_[a-zA-Z0-9]{36}|password\s*[:=]\s*['\"][^'\"]+['\"])" "$TARGET" 2>/dev/null | grep -v node_modules | head -10)
if [ -n "$SECRET_HITS" ]; then
  echo "  ERROR: Potential secrets found in files:"
  echo "$SECRET_HITS" | sed 's/^/    /'
  ERRORS=$((ERRORS+1))
fi

echo ""
echo "--- Checking for internal-only docs ---"
INTERNAL_HITS=$(find "$TARGET/docs" -type f -name "*.md" -path "*/internal/*" 2>/dev/null | head -10)
if [ -n "$INTERNAL_HITS" ]; then
  echo "  WARNING: Internal docs found in mirror:"
  echo "$INTERNAL_HITS" | sed 's/^/    /'
  WARNINGS=$((WARNINGS+1))
fi

echo ""
echo "--- Checking for database dumps ---"
DUMPS=$(find "$TARGET" -name "*.sql.gz" -o -name "*.dump" -o -name "*.pgdump" 2>/dev/null | head -10)
if [ -n "$DUMPS" ]; then
  echo "  ERROR: Database dumps found:"
  echo "$DUMPS" | sed 's/^/    /'
  ERRORS=$((ERRORS+1))
fi

echo ""
echo "--- Checking required trust files ---"
REQUIRED_FILES=(
  "README.md" "LICENSE.md" "SECURITY.md" "CONTRIBUTING.md" "CHANGELOG.md"
)
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$TARGET/$file" ]; then
    echo "  OK: $file"
  else
    echo "  WARNING: Missing $file"
    WARNINGS=$((WARNINGS+1))
  fi
done

echo ""
echo "--- Checking docs structure ---"
REQUIRED_DOCS=(
  "docs/architecture/system-overview.md"
  "docs/architecture/platform-map.md"
  "docs/trust/trust-center.md"
  "docs/trust/security-posture.md"
  "docs/investor/platform-thesis.md"
  "docs/investor/product-readiness.md"
  "docs/releases/v0.1.0.md"
)
for doc in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$TARGET/$doc" ]; then
    echo "  OK: $doc"
  else
    echo "  WARNING: Missing $doc"
    WARNINGS=$((WARNINGS+1))
  fi
done

echo ""
echo "--- Checking GitHub templates ---"
GITHUB_FILES=(
  ".github/CODEOWNERS"
  ".github/PULL_REQUEST_TEMPLATE.md"
  ".github/ISSUE_TEMPLATE/bug_report.md"
  ".github/ISSUE_TEMPLATE/feature_request.md"
)
for ghf in "${GITHUB_FILES[@]}"; do
  if [ -f "$TARGET/$ghf" ]; then
    echo "  OK: $ghf"
  else
    echo "  WARNING: Missing $ghf"
    WARNINGS=$((WARNINGS+1))
  fi
done

TOTAL_FILES=$(find "$TARGET" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$TARGET" | cut -f1)

echo ""
echo "=== Validation Summary ==="
echo "Files: $TOTAL_FILES | Size: $TOTAL_SIZE"
echo "Errors: $ERRORS | Warnings: $WARNINGS"

if [ $ERRORS -gt 0 ]; then
  echo "STATUS: FAILED — fix errors before publishing"
else
  echo "STATUS: PASSED"
fi

mkdir -p "$(dirname "$REPORT")"
cat > "$REPORT" <<EOF
# Public Mirror Validation Report

**Date:** $(date -u +"%Y-%m-%d %H:%M UTC")
**Status:** $([ $ERRORS -gt 0 ] && echo "FAILED" || echo "PASSED")

## Summary
- Total files: $TOTAL_FILES
- Total size: $TOTAL_SIZE
- Errors: $ERRORS
- Warnings: $WARNINGS

## Checks Performed
- Excluded directory scan (root + recursive)
- Secrets / env file detection
- Secret pattern grep (API keys, tokens, passwords)
- Internal-only doc detection
- Database dump detection
- Required trust files
- Documentation structure
- GitHub templates
EOF

echo ""
echo "Report saved to: $REPORT"

[ $ERRORS -gt 0 ] && exit 1 || exit 0
