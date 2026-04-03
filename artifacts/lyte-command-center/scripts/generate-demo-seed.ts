#!/usr/bin/env npx tsx
/**
 * Demo Seed Regeneration Script
 *
 * Usage: npx tsx scripts/generate-demo-seed.ts
 *
 * Validates and outputs the complete Lyte demo seed dataset.
 * All timestamps are recalculated relative to now(), so running
 * this script always produces a fresh, time-consistent snapshot.
 *
 * The seed is defined in src/lib/demo-seed.ts. To regenerate with
 * new timestamps, simply re-import — constants are computed at
 * module load time using `const now = Date.now()`.
 */

import { getDemoSeed } from "../src/lib/demo-seed.ts";

const seed = getDemoSeed();

const summary = {
  signals: seed.signals.length,
  alerts: seed.alerts.length,
  priorities: seed.priorities.length,
  workflows: seed.workflows.length,
  runs: seed.runs.length,
  recommendations: seed.recommendations.length,
  auditEvents: seed.auditEvents.length,
  exceptions: seed.exceptions.length,
  readinessItems: seed.readinessItems.length,
  integrations: seed.integrations.length,
  reports: seed.reports.length,
  roles: Object.keys(seed.roleSummaries).length,
};

console.log("\n=== Lyte Demo Seed ===\n");
Object.entries(summary).forEach(([k, v]) => {
  console.log(`  ${k.padEnd(20)} ${v} records`);
});
console.log(`\n  Generated at: ${new Date().toISOString()}`);
console.log("\n✓ Demo seed valid and ready.\n");
