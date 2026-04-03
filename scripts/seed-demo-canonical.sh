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

echo "[demo-seed] Demo seed pack complete."
