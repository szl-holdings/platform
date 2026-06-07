#!/usr/bin/env bash
# lint-copy.sh — Governed-Intelligence copy linter
#
# Blocks banned phrases from appearing in source files.
# Run as a CI step: pnpm run lint:copy
# Exit code 0 = clean, 1 = violations found.
#
# To suppress a specific line, add the marker comment:
#   // gi-lint-ignore
# Example:
#   const EXAMPLE = "sentient"; // gi-lint-ignore
#
# To suppress an entire file, add this anywhere in the file:
#   /* gi-lint-ignore-file */

set -euo pipefail

BANNED=(
  "sentient"
  "AI magic"
  "magic AI"
  "self-aware AI"
  "thinks for itself"
  "thinks on its own"
  "fully autonomous AI"
  "AI knows best"
  "the AI decided"
  "the AI thinks"
  "the AI feels"
  "the AI believes"
  "AI-powered magic"
)

PREFERRED=(
  "governed intelligence"
  "evidence-backed"
  "traceable autonomy"
  "policy-gated"
  "verifiable"
  "explainable"
  "human-in-the-loop"
  "audit trail"
)

SEARCH_DIRS=(
  "artifacts"
  "packages"
  "lib"
)

EXTENSIONS=("tsx" "ts" "jsx" "js" "mdx" "md")

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

VIOLATIONS=0

echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│  Governed-Intelligence Copy Linter               │"
echo "│  SZL Holdings — forbidden-phrase check           │"
echo "└─────────────────────────────────────────────────┘"
echo ""

for phrase in "${BANNED[@]}"; do
  # Find matches, excluding:
  #   - node_modules / dist / .git directories
  #   - files containing /* gi-lint-ignore-file */
  #   - lines containing // gi-lint-ignore
  raw_matches=$(grep -rn \
    --include="*.tsx" --include="*.ts" --include="*.jsx" \
    --include="*.js" --include="*.mdx" --include="*.md" \
    -i "$phrase" \
    "${SEARCH_DIRS[@]}" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    2>/dev/null || true)

  if [[ -z "$raw_matches" ]]; then
    continue
  fi

  # Filter out lines with the inline suppression marker
  filtered_matches=""
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    # Skip lines with inline ignore marker
    if echo "$line" | grep -q "gi-lint-ignore"; then
      continue
    fi
    # Skip files with file-level ignore: check if the file contains the marker
    filepath=$(echo "$line" | cut -d: -f1)
    if [[ -f "$filepath" ]] && grep -q "gi-lint-ignore-file" "$filepath" 2>/dev/null; then
      continue
    fi
    filtered_matches+="$line"$'\n'
  done <<< "$raw_matches"

  filtered_matches="${filtered_matches%$'\n'}"

  if [[ -n "$filtered_matches" ]]; then
    echo -e "${RED}✗ BANNED PHRASE:${RESET} \"$phrase\""
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      echo -e "  ${YELLOW}$line${RESET}"
    done <<< "$filtered_matches"
    echo ""
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

if [[ $VIOLATIONS -eq 0 ]]; then
  echo -e "${GREEN}✓ No banned phrases found.${RESET}"
  echo ""
  echo "Preferred vocabulary:"
  for p in "${PREFERRED[@]}"; do
    echo "  • $p"
  done
  echo ""
  exit 0
else
  echo -e "${RED}✗ $VIOLATIONS banned phrase(s) found.${RESET}"
  echo ""
  echo "Replace with governed-intelligence vocabulary:"
  for p in "${PREFERRED[@]}"; do
    echo "  • $p"
  done
  echo ""
  exit 1
fi
