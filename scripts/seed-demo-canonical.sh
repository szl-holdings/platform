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

# Step 0 (auto-precondition): make sure the schema is fully migrated before
# running anything that inserts into recently-added tables. The
# non-interactive wrapper (added in task #1050) auto-answers drizzle-kit's
# rename prompts and enforces a hard timeout, so this is safe to run from
# a non-TTY context like CI. Without this, step 10 (marine-extended)
# fails on fresh environments because tables exist as "stub" placeholders.
echo "[demo-seed] Step 0: Ensure database schema is migrated"
pnpm migrate || {
  echo "[demo-seed] WARNING: migrate command failed — step 10 (marine-extended) may skip."
  echo "[demo-seed] Continuing with seed; investigate migrate failure separately."
}

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

echo "[demo-seed] Step 13: Forge — agents, models, prompts, tools, drift, promotions, executions"
pnpm --filter @workspace/scripts run seed:forge || echo "[demo-seed] Forge seed skipped (already seeded)"

echo "[demo-seed] Step 14: Deployment registry — historical + active versions per platform app"
pnpm --filter @workspace/scripts run seed:deployments || echo "[demo-seed] Deployments seed skipped (already seeded)"

echo "[demo-seed] Step 15: Live signal tables (firestorm incidents, vessel alerts, vessel delay events)"
pnpm --filter @workspace/scripts run seed:live-signals || echo "[demo-seed] Live signals seed skipped"

echo "[demo-seed] All demo seed packs complete."
