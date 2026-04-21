#!/usr/bin/env bash
# scripts/audit/db/check-seed-coverage.sh
# Report seed coverage per domain.
# Usage: bash scripts/audit/db/check-seed-coverage.sh
# Run from workspace root.

set -euo pipefail

echo "=== DB Audit: Seed Coverage Check ==="
echo "Date: $(date -u '+%Y-%m-%d')"
echo ""

echo "--- packages/demo-seed narrative files ---"
ls packages/demo-seed/src/narrative-*.ts 2>/dev/null | wc -l | xargs echo "  Narrative files:"
ls packages/demo-seed/src/narrative-*.ts 2>/dev/null | sed 's|packages/demo-seed/src/||'

echo ""
echo "--- Root seed scripts (scripts/seed-*.ts + scripts/seed-*.sh) ---"
SEED_COUNT=$(ls scripts/seed-*.ts scripts/seed-*.sh 2>/dev/null | wc -l | tr -d ' ')
echo "  Total: $SEED_COUNT"
ls scripts/seed-*.ts scripts/seed-*.sh 2>/dev/null | sed 's|scripts/||'

echo ""
echo "--- Static JSON seed files ---"
echo "  seed-data/lyte/ :"
ls seed-data/lyte/ 2>/dev/null | sed 's/^/    /'
echo "  seed-data/vessels/ :"
ls seed-data/vessels/ 2>/dev/null | sed 's/^/    /'

echo ""
echo "--- API-side seed functions (artifacts/api-server/src/lib/seed-*.ts) ---"
ls artifacts/api-server/src/lib/seed-*.ts 2>/dev/null | sed 's|artifacts/api-server/src/lib/||' || echo "  (none found)"

echo ""
echo "--- Domains with dedicated seed coverage ---"
echo "  Lyte         : narrative-business-revops.ts + seed-data/lyte/ JSON"
echo "  Vessels      : narrative-maritime.ts + seed-data/vessels/ JSON + seed-vessels.ts"
echo "  Terra        : narrative-terra-distress.ts + terra-seed.ts + seed-tenant-health-scorecards.ts"
echo "  Counsel      : narrative-legal-compliance.ts + narrative-counsel-deadline.ts + seed-prism-counsel.ts"
echo "  Sentra       : narrative-security-soc.ts + narrative-sentra-ransomware.ts"
echo "  Pulse        : narrative-szl-treasury.ts + seed-atlas.ts + seed-governance.ts + seed-holdings-fundops.ts"
echo "  Carlota Jo   : carlota-advisory-seed.ts + narrative-carlota-jo-estate.ts + seed-carlota-clients.ts"
echo "  Agent/AI     : seed-agent-os.ts + seed-forge.ts + seed-constellation.ts + seed-distribution-os.ts"

echo ""
echo "--- Domains with thin/no seed coverage ---"
echo "  Terra 1031 Exchange        : NO dedicated seed — module may appear empty"
echo "  Terra Lease Abstraction    : NO dedicated seed — module may appear empty"
echo "  Counsel M365/Teams surfaces: NO seed (requires live M365 token)"
echo "  Firestorm campaigns/leads  : NO seed (Firestorm UI archived)"

echo ""
echo "=== Done ==="
