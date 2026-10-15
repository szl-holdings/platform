#!/usr/bin/env bash
set -euo pipefail

echo "Unsafe network vendoring is disabled." >&2
echo "engine/ollm is reviewed, tracked source; do not replace it from a mutable tag." >&2
echo "A source update requires an exact commit, provenance/license review, tests," >&2
echo "and refreshed dependency, SBOM, and clean-build evidence." >&2
exit 2
