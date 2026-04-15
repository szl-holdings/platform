#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# seed-demo-canonical.sh — Composite demo seed runner
#
# Runs all demo seed scripts in the correct order on top of the minimal seed.
# Usage: ./scripts/seed-demo-canonical.sh
#
# Prerequisites:
#   1. Run `pnpm --filter @workspace/db run migrate` first
#   2. Run `pnpm --filter @workspace/scripts run seed` first (minimal seed)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "[demo-seed] Starting demo seed pack..."
echo "[demo-seed] Step 1: SZL canonical data (ports, vessels, routes, signals, actions)"
pnpm --filter @workspace/scripts run seed:canonical

echo "[demo-seed] Step 2: Demo data (firestorm, lyte, vessels events)"
pnpm --filter @workspace/scripts run seed:demo

echo "[demo-seed] Step 3: Audit log history"
pnpm --filter @workspace/scripts run seed:audit

echo "[demo-seed] Step 4: Pilot org"
pnpm --filter @workspace/scripts run seed:pilot || echo "[demo-seed] Pilot seed skipped (already seeded)"

echo "[demo-seed] Step 5: Pilot data"
pnpm --filter @workspace/scripts run seed:pilot-data || echo "[demo-seed] Pilot data seed skipped"

echo "[demo-seed] Step 6: Holdings ventures & Fund Ops financials"
pnpm --filter @workspace/scripts run seed:holdings-fundops || echo "[demo-seed] Holdings/FundOps seed skipped (already seeded)"

echo "[demo-seed] Step 7: PRISM Counsel matters, parties, offers & AI forecasts"
pnpm --filter @workspace/scripts run seed:prism-counsel || echo "[demo-seed] PRISM Counsel seed skipped (already seeded)"

echo "[demo-seed] Step 8: Carlota Jo services, client profiles & reservations"
pnpm --filter @workspace/scripts run seed:carlota-clients || echo "[demo-seed] Carlota clients seed skipped (already seeded)"

echo "[demo-seed] Step 9: Governance policies, cost budgets & compliance records"
pnpm --filter @workspace/scripts run seed:governance || echo "[demo-seed] Governance seed skipped (already seeded)"

echo "[demo-seed] Step 10: Marine insurance, commodity trading & fleet intelligence"
pnpm --filter @workspace/scripts run seed:marine-extended || echo "[demo-seed] Marine extended seed skipped (already seeded)"

echo "[demo-seed] Step 11: Agent OS, A2A registry, skill registry & fine-tuning"
pnpm --filter @workspace/scripts run seed:agent-os || echo "[demo-seed] Agent OS seed skipped (already seeded)"

echo "[demo-seed] Step 12: Distribution OS — editorial pillars, articles, newsletters, campaigns & leads"
pnpm --filter @workspace/scripts run seed:distribution-os || echo "[demo-seed] Distribution OS seed skipped (already seeded)"

echo "[demo-seed] All demo seed packs complete."
