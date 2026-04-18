#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# check-generic-empty-states.sh
#
# Scans operator-facing pages for generic "no data" empty-state strings that
# should be replaced with contextual, actionable messages before release.
#
# Exit 0 = clean; Exit 1 = violations found.
# ---------------------------------------------------------------------------
set -euo pipefail

SEARCH_DIRS=(
  "artifacts/vessels/src/pages"
  "artifacts/szl-holdings/src/pages"
  "artifacts/command/src/pages"
  "artifacts/command/src/infrastructure/pages"
  "artifacts/terra/src"
  "artifacts/aegis/src"
)

# Patterns that indicate a generic, unhelpful empty state.
# Uses case-insensitive matching (-i) for each grep call.
PATTERNS=(
  ">No data<"
  ">No data yet"
  ">No data —"
  ">No data\."
  ">No data!"
  "\"No data\""
  "'No data'"
  "\`No data\`"
  "\"No data yet\""
  "'No data yet'"
  ">Coming soon[<.]"
  ">Coming Soon[<.]"
  "\"Coming soon"
  "'Coming soon"
  "TODO.*empty.state"
)

VIOLATIONS=0

for dir in "${SEARCH_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    continue
  fi
  for pattern in "${PATTERNS[@]}"; do
    matches=$(grep -rni --include="*.tsx" --include="*.ts" -E "$pattern" "$dir" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "FAIL: Generic empty-state string found (pattern: $pattern)"
      echo "$matches" | while IFS= read -r line; do
        echo "  $line"
      done
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
done

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "OK: No generic empty-state strings found in operator pages."
  exit 0
else
  echo ""
  echo "Found $VIOLATIONS generic empty-state pattern(s). Replace with contextual, actionable messages."
  exit 1
fi
