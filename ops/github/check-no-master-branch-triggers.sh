#!/usr/bin/env bash
# check-no-master-branch-triggers.sh
#
# Fails (exit 1) if any file under .github/workflows/ contains the literal
# token `master` in a `branches:` trigger — in either YAML form:
#
#   Single-line bracket array:
#     branches: [master, main]
#     branches: [main, "master"]
#
#   Multi-line block list:
#     branches:
#       - master
#       - main
#
# This repo's canonical trunk is `main`; the legacy `master` branch has been
# retired (see ops/github/retire-master-branch.sh). This guard prevents PRs
# from re-introducing `master` triggers via copy-pasted workflow templates.
#
# Intentionally NOT matched:
#   - Comments such as `# uses: actions/checkout@master` in `ci.yml`
#   - The `default_branch || 'master'` fallback in `secret-scan-scheduled.yml`
#   - Any `master` reference outside of a `branches:` trigger
#
# Wired into CI by `.github/workflows/ci.yml` (job: workflow-branch-guard).
# Documented in `ops/github/github-operating-model.md` (Branch Strategy).
#
# Usage:
#   bash ops/github/check-no-master-branch-triggers.sh [WORKFLOWS_DIR]
#
# Self-test:
#   bash ops/github/check-no-master-branch-triggers.sh --self-test
set -euo pipefail

# --- Self-test mode ---------------------------------------------------------
if [[ "${1:-}" == "--self-test" ]]; then
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  mkdir -p "$tmp/positive_bracket" "$tmp/positive_multiline" \
           "$tmp/positive_quoted" "$tmp/negative"

  cat > "$tmp/positive_bracket/wf.yml" <<'YAML'
on:
  pull_request:
    branches: [master, main]
YAML

  cat > "$tmp/positive_multiline/wf.yml" <<'YAML'
on:
  pull_request:
    branches:
      - master
      - main
YAML

  cat > "$tmp/positive_quoted/wf.yml" <<'YAML'
on:
  push:
    branches: ["master"]
YAML

  cat > "$tmp/negative/wf.yml" <<'YAML'
on:
  pull_request:
    branches: [main]
  # uses: actions/checkout@master   <- not a branches: trigger
jobs:
  x:
    steps:
      - run: echo "${{ github.event.repository.default_branch || 'master' }}"
      - name: branches
        run: |
          # the literal word branches: appears here but not as a trigger key
          echo "branches: [master]"
YAML

  fail=0
  for d in positive_bracket positive_multiline positive_quoted; do
    if bash "$0" "$tmp/$d" >/dev/null 2>&1; then
      echo "SELFTEST FAIL: $d should have been detected as a violation"
      fail=1
    else
      echo "SELFTEST ok:   $d correctly flagged"
    fi
  done
  if bash "$0" "$tmp/negative" >/dev/null 2>&1; then
    echo "SELFTEST ok:   negative correctly passed"
  else
    echo "SELFTEST FAIL: negative was flagged but should have passed"
    bash "$0" "$tmp/negative" || true
    fail=1
  fi
  exit "$fail"
fi

# --- Main check -------------------------------------------------------------
DIR="${1:-.github/workflows}"

if [[ ! -d "$DIR" ]]; then
  echo "::error::workflows directory not found: $DIR" >&2
  exit 2
fi

violations=0
tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT

# Form A: single-line bracket array — `branches: [..., master, ...]`
#   Matches master / "master" / 'master' as a whole token inside the array.
PATTERN_BRACKET='^[[:space:]]*branches:[[:space:]]*\[[^]]*\bmaster\b[^]]*\]'

if grep -rEn --include='*.yml' --include='*.yaml' \
     "$PATTERN_BRACKET" "$DIR" >> "$tmpfile"; then
  violations=1
fi

# Form B: multi-line block list — a `branches:` key (no value on same line)
#   followed by indented `- master` (or `- "master"` / `- 'master'`) items,
#   possibly interleaved with other list items or blank lines.
#
# We can't do this with a single regex per line, so scan per-file with awk.
# State machine:
#   in_branches = true  when we're inside an open `branches:` block whose
#                       value is given as a YAML list (no inline `[...]`).
#   branches_indent     the indentation (number of leading spaces) of the
#                       `branches:` key; list items must be indented strictly
#                       more than this. Any line at <= this indent that is
#                       not blank/comment closes the block.
while IFS= read -r -d '' file; do
  awk -v file="$file" '
    function leading_spaces(s,   i) {
      i = 0
      while (i < length(s) && substr(s, i+1, 1) == " ") i++
      return i
    }
    BEGIN { in_branches = 0; branches_indent = -1 }
    {
      line = $0
      # strip trailing \r just in case
      sub(/\r$/, "", line)

      # Skip pure blank or comment lines without changing state
      if (line ~ /^[[:space:]]*$/) next
      if (line ~ /^[[:space:]]*#/) next

      indent = leading_spaces(line)

      if (in_branches) {
        # Close the block when we hit a line at <= the branches: indent
        if (indent <= branches_indent) {
          in_branches = 0
          branches_indent = -1
          # fall through so this line is re-evaluated for a new branches: key
        } else {
          # Inside the block — look for a `- master` list item
          if (line ~ /^[[:space:]]*-[[:space:]]*("master"|'\''master'\''|master)[[:space:]]*(#.*)?$/) {
            printf("%s:%d:%s\n", file, NR, line)
            found = 1
          }
          next
        }
      }

      # Detect the start of a new `branches:` block with NO inline value
      # (inline bracket form is handled by the single-line regex above).
      if (match(line, /^[[:space:]]*branches:[[:space:]]*(#.*)?$/)) {
        in_branches = 1
        branches_indent = indent
      }
    }
    END { exit (found ? 0 : 1) }
  ' "$file" >> "$tmpfile" && violations=1 || true
done < <(find "$DIR" -type f \( -name '*.yml' -o -name '*.yaml' \) -print0)

if (( violations )); then
  # Print collected violations (file:line:content)
  sort -u "$tmpfile"
  echo ""
  echo "::error::Found 'master' in a workflow 'branches:' trigger above."
  echo "::error::This repo's canonical trunk is 'main'. Remove 'master' from the branches: trigger."
  echo "::error::See ops/github/github-operating-model.md (Branch Strategy) for context."
  exit 1
fi

echo "OK: no workflow re-introduces 'master' branch triggers."
