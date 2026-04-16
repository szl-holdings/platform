#!/usr/bin/env bash
# bundle.sh — Package each launch-series post into a distributable zip archive.
# Run from the project root: bash content/launch-series/bundle.sh
#
# Uses Python's built-in zipfile module so this works without the system `zip`
# binary. Python 3 is required.

set -euo pipefail

SERIES_DIR="content/launch-series"
OUTPUT_DIR="."

POSTS=(
  "01-thursday-intro"
  "02-sunday-deep-dive"
  "03-monday-operator-lens"
)

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required to run this script." >&2
  exit 1
fi

echo "Bundling SZL Holdings Launch Series..."
echo ""

for post in "${POSTS[@]}"; do
  src="${SERIES_DIR}/${post}"
  out="${OUTPUT_DIR}/${post}.zip"

  if [ ! -d "$src" ]; then
    echo "  [SKIP] ${post} — directory not found"
    continue
  fi

  rm -f "$out"

  python3 - "$src" "$out" <<'PY'
import os, sys, zipfile

src, out = sys.argv[1], sys.argv[2]
skip_names = {".DS_Store", ".gitkeep"}

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src):
        # Skip macOS metadata folders
        dirs[:] = [d for d in dirs if d != "__MACOSX"]
        for name in files:
            if name in skip_names:
                continue
            full = os.path.join(root, name)
            arc = os.path.relpath(full, os.path.dirname(src))
            zf.write(full, arc)
PY

  echo "  [OK]   ${out}"
done

echo ""
echo "Done. Three archives ready for distribution:"
for post in "${POSTS[@]}"; do
  echo "  ${OUTPUT_DIR}/${post}.zip"
done
