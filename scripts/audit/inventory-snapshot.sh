#!/usr/bin/env bash
# Reproducibility companion for docs/audits/machine-gap-audit.md.
# Snapshots the structural counts that the audit doc cites, so any future
# reader can verify "as of date X, the machine had N artifacts / M libs / ..."
# rather than relying on prose claims.
#
# Usage:
#   bash scripts/audit/inventory-snapshot.sh                    # print to stdout
#   bash scripts/audit/inventory-snapshot.sh > out/snap.txt     # capture
#
# Exits non-zero if run from outside the monorepo root.

set -euo pipefail

if [[ ! -f pnpm-workspace.yaml ]]; then
  echo "ERROR: must be run from the monorepo root (pnpm-workspace.yaml not found)" >&2
  exit 2
fi

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

count_dirs()  {
  # Top-level dirs only — explicitly skip node_modules / dist / hidden.
  find "$1" -mindepth 1 -maxdepth 1 -type d \
    ! -name 'node_modules' ! -name 'dist' ! -name '.*' 2>/dev/null \
    | wc -l | tr -d ' '
}
count_files_shallow() {
  # File count under a specific known path — bounded depth to stay fast.
  find "$1" -maxdepth 4 -type f -name "$2" \
    ! -path '*/node_modules/*' ! -path '*/dist/*' 2>/dev/null \
    | wc -l | tr -d ' '
}

artifacts_count="$(count_dirs artifacts)"
archived_artifacts_count="$(count_dirs archive/artifacts)"
lib_count="$(count_dirs lib)"
packages_count="$(count_dirs packages)"
workers_count="$(count_dirs workers)"
api_routes_count="$(count_files_shallow artifacts/api-server/src/routes '*.ts')"
schema_count="$(find lib packages -maxdepth 6 -type f -name 'schema.ts' \
  ! -path '*/node_modules/*' ! -path '*/dist/*' 2>/dev/null | wc -l | tr -d ' ')"

echo "# Machine inventory snapshot"
echo "# Generated: ${ts}"
echo "# Cross-reference: docs/audits/machine-gap-audit.md"
echo ""
echo "artifacts.active_dirs               = ${artifacts_count}"
echo "artifacts.archived_dirs             = ${archived_artifacts_count}"
echo "lib.packages                        = ${lib_count}"
echo "packages.packages                   = ${packages_count}"
echo "workers.packages                    = ${workers_count}"
echo "api_server.route_files              = ${api_routes_count}"
echo "drizzle.schema_files                = ${schema_count}"
echo ""
echo "# Active artifact directories:"
find artifacts -mindepth 1 -maxdepth 1 -type d ! -name 'node_modules' 2>/dev/null | sort | sed 's|^|  |'
echo ""
echo "# Archived artifact directories:"
find archive/artifacts -mindepth 1 -maxdepth 1 -type d ! -name 'node_modules' 2>/dev/null | sort | sed 's|^|  |'
echo ""
echo "# Worker packages:"
find workers -mindepth 1 -maxdepth 1 -type d ! -name 'node_modules' 2>/dev/null | sort | sed 's|^|  |'
