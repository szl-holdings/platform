#!/usr/bin/env bash
# =============================================================================
# SZL Holdings — Public Mirror Validation Script
# Validates workspace is safe for public mirror push before running git push.
# =============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_FILE="$REPO_ROOT/scripts/public-mirror/mirror-report.md"
ERRORS=0
WARNINGS=0

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "================================================================"
echo "  SZL Holdings — Public Mirror Validation"
echo "  $(date)"
echo "================================================================"
echo ""

# Initialize report
cat > "$REPORT_FILE" << EOF
# SZL Holdings — Mirror Validation Report
**Generated:** $(date)

---

## Results

EOF

# =============================================================================
# CHECK 1: Noisy Directories
# =============================================================================
echo -e "${BLUE}[1/6] Checking for noisy directories...${NC}"

NOISY_DIRS=(".archive" "backups" "exports" "temp" "tmp" "scratch")
for dir in "${NOISY_DIRS[@]}"; do
  if [ -d "$REPO_ROOT/$dir" ]; then
    echo -e "  ${RED}ERROR:${NC} Noisy directory found: /$dir"
    echo "- ❌ **ERROR:** Noisy directory found: \`/$dir\` — quarantine or exclude before push" >> "$REPORT_FILE"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "  ${GREEN}OK:${NC} /$dir not present"
    echo "- ✅ \`/$dir\` not present" >> "$REPORT_FILE"
  fi
done
echo ""

# =============================================================================
# CHECK 2: Secret Material Patterns
# =============================================================================
echo -e "${BLUE}[2/6] Checking for potential secret material...${NC}"

# Look for .env files that aren't .env.example
ENV_FILES=$(find "$REPO_ROOT" \
  -not -path "*/.local/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/.cache/*" \
  -not -path "*/attached_assets/*" \
  -name ".env" -o \
  -name ".env.local" -o \
  -name ".env.production" \
  2>/dev/null | grep -v ".env.example" | head -20 || true)

if [ -n "$ENV_FILES" ]; then
  echo -e "  ${RED}ERROR:${NC} .env files found outside .gitignore scope:"
  echo "$ENV_FILES" | while read f; do echo "    $f"; done
  echo "- ❌ **ERROR:** .env files found — these must not be committed" >> "$REPORT_FILE"
  ERRORS=$((ERRORS + 1))
else
  echo -e "  ${GREEN}OK:${NC} No unprotected .env files found"
  echo "- ✅ No unprotected .env files found" >> "$REPORT_FILE"
fi

# Look for obvious secret patterns in tracked files
echo "  Scanning for obvious secret patterns in source files..."
SECRET_HITS=$(git -C "$REPO_ROOT" grep -r \
  -e "sk_live_" \
  -e "sk_test_" \
  -e "AKIA" \
  -e "password.*=.*['\"][^'\"]{8,}" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  -l 2>/dev/null | grep -v ".env.example" | head -10 || true)

if [ -n "$SECRET_HITS" ]; then
  echo -e "  ${YELLOW}WARNING:${NC} Potential secret patterns found in:"
  echo "$SECRET_HITS" | while read f; do echo "    $f"; done
  echo "- ⚠️ **WARNING:** Potential secret patterns found — review before push" >> "$REPORT_FILE"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "  ${GREEN}OK:${NC} No obvious secret patterns in source files"
  echo "- ✅ No obvious secret patterns in source files" >> "$REPORT_FILE"
fi
echo ""

# =============================================================================
# CHECK 3: Internal-Only Documents
# =============================================================================
echo -e "${BLUE}[3/6] Checking for internal-only documents...${NC}"

INTERNAL_PATTERNS=("cap-table" "financial-projection" "internal-sprint" "triage-report" "NOTES.md" "TODO.md")
INTERNAL_FOUND=0
for pattern in "${INTERNAL_PATTERNS[@]}"; do
  HITS=$(find "$REPO_ROOT/docs" -name "*$pattern*" 2>/dev/null | head -5 || true)
  if [ -n "$HITS" ]; then
    echo -e "  ${YELLOW}WARNING:${NC} Potentially internal doc found: $HITS"
    echo "- ⚠️ **WARNING:** Potentially internal document: \`$HITS\`" >> "$REPORT_FILE"
    WARNINGS=$((WARNINGS + 1))
    INTERNAL_FOUND=1
  fi
done

if [ $INTERNAL_FOUND -eq 0 ]; then
  echo -e "  ${GREEN}OK:${NC} No internal-only document patterns detected"
  echo "- ✅ No internal-only document patterns detected" >> "$REPORT_FILE"
fi
echo ""

# =============================================================================
# CHECK 4: Build Artifacts
# =============================================================================
echo -e "${BLUE}[4/6] Checking for build artifacts...${NC}"

ARTIFACT_PATTERNS=("*.tsbuildinfo")
ARTIFACT_FOUND=0
for pattern in "${ARTIFACT_PATTERNS[@]}"; do
  HITS=$(find "$REPO_ROOT" \
    -not -path "*/node_modules/*" \
    -not -path "*/.local/*" \
    -name "$pattern" 2>/dev/null | head -5 || true)
  if [ -n "$HITS" ]; then
    echo -e "  ${YELLOW}WARNING:${NC} Build artifact found: $pattern"
    echo "- ⚠️ **WARNING:** Build artifact should be excluded: \`$pattern\`" >> "$REPORT_FILE"
    WARNINGS=$((WARNINGS + 1))
    ARTIFACT_FOUND=1
  fi
done

if [ $ARTIFACT_FOUND -eq 0 ]; then
  echo -e "  ${GREEN}OK:${NC} No stray build artifacts found"
  echo "- ✅ No stray build artifacts found" >> "$REPORT_FILE"
fi
echo ""

# =============================================================================
# CHECK 5: .gitignore Coverage
# =============================================================================
echo -e "${BLUE}[5/6] Verifying .gitignore coverage...${NC}"

REQUIRED_IGNORES=(".env" "node_modules" "dist" ".local/" ".cache/" "attached_assets/")
GITIGNORE="$REPO_ROOT/.gitignore"
MISSING_IGNORES=0

for entry in "${REQUIRED_IGNORES[@]}"; do
  if grep -q "$entry" "$GITIGNORE" 2>/dev/null; then
    echo -e "  ${GREEN}OK:${NC} .gitignore covers: $entry"
  else
    echo -e "  ${YELLOW}WARNING:${NC} .gitignore missing: $entry"
    echo "- ⚠️ **WARNING:** .gitignore missing entry: \`$entry\`" >> "$REPORT_FILE"
    WARNINGS=$((WARNINGS + 1))
    MISSING_IGNORES=1
  fi
done

if [ $MISSING_IGNORES -eq 0 ]; then
  echo "- ✅ .gitignore covers all required patterns" >> "$REPORT_FILE"
fi
echo ""

# =============================================================================
# CHECK 6: README Currency Check
# =============================================================================
echo -e "${BLUE}[6/6] Checking README currency...${NC}"

README="$REPO_ROOT/README.md"
if [ -f "$README" ]; then
  README_LINES=$(wc -l < "$README")
  if [ "$README_LINES" -lt 100 ]; then
    echo -e "  ${YELLOW}WARNING:${NC} README.md is very short ($README_LINES lines) — may need update"
    echo "- ⚠️ **WARNING:** README.md is short ($README_LINES lines) — review before push" >> "$REPORT_FILE"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "  ${GREEN}OK:${NC} README.md present ($README_LINES lines)"
    echo "- ✅ README.md present and substantive ($README_LINES lines)" >> "$REPORT_FILE"
  fi
else
  echo -e "  ${RED}ERROR:${NC} README.md not found"
  echo "- ❌ **ERROR:** README.md not found" >> "$REPORT_FILE"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
cat >> "$REPORT_FILE" << EOF

---

## Summary

| Metric | Count |
|--------|-------|
| Errors | $ERRORS |
| Warnings | $WARNINGS |
| Status | $([ $ERRORS -eq 0 ] && echo "✅ Mirror-safe" || echo "❌ Blocked — fix errors before pushing") |

---

*Report generated by \`scripts/public-mirror/validate-mirror.sh\`*
EOF

echo "================================================================"
echo "  VALIDATION SUMMARY"
echo "================================================================"
echo ""
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "  ${RED}STATUS: BLOCKED — Fix errors before mirror push${NC}"
  echo ""
  echo "  Report: $REPORT_FILE"
  echo ""
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "  ${YELLOW}STATUS: PROCEED WITH CAUTION — Review warnings${NC}"
  echo ""
  echo "  Report: $REPORT_FILE"
  echo ""
  exit 0
else
  echo -e "  ${GREEN}STATUS: CLEAR — Mirror push is safe${NC}"
  echo ""
  echo "  Report: $REPORT_FILE"
  echo ""
  exit 0
fi
