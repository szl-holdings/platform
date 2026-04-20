#!/usr/bin/env tsx
/**
 * Data-layer render assertion for szl-holdings.
 *
 * Imports ventures.ts (the actual render data) and verifies that the metric
 * values for registry-sourced claims contain the expected display strings from
 * the public claims registry. This proves the registry values flow through the
 * entire data chain to the UI render layer.
 *
 * Run from this directory: pnpm tsx scripts/render-check.ts
 * Or invoked via the workspace smoke test: scripts/smoke-claims-registry.ts
 *
 * Exits 0 if all assertions pass, 1 on any failure.
 */

import { ventures } from '../src/data/ventures.ts';
import {
  AEGIS_SIMULATIONS,
  LYTE_FALSE_POSITIVE_RATE,
  LYTE_SIGNAL_DETECTION_TIME,
  LYTE_SIGNALS_PER_DAY,
  metricDisplay,
  TERRA_PORTFOLIO_AUM,
  VESSELS_COUNT,
  VESSELS_DARK_DETECTION_LEAD,
} from '../src/lib/claims.ts';

let passed = 0;
let failed = 0;

function check(desc: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`  ✓  ${desc}`);
    passed++;
  } else {
    console.error(`  ✗  ${desc}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function findMetric(ventureId: string, label: string): string | undefined {
  const v = ventures.find((v) => v.id === ventureId);
  if (!v) return undefined;
  return v.metrics?.find((m) => m.label === label)?.value;
}

console.log('\n[data-layer render assertion]\n');

// ─── Lyte venture ─────────────────────────────────────────────────────────────

const lyteDetection = findMetric('lyte', 'Avg. Signal Detection Time');
const expectedLyteDetection = metricDisplay(LYTE_SIGNAL_DETECTION_TIME);
check(
  `Lyte "Avg. Signal Detection Time" renders from registry (expected: "${expectedLyteDetection}")`,
  lyteDetection === expectedLyteDetection,
  `got: "${lyteDetection}"`,
);

const lyteSignals = findMetric('lyte', 'Signals Processed / Day');
const expectedLyteSignals = metricDisplay(LYTE_SIGNALS_PER_DAY);
check(
  `Lyte "Signals Processed / Day" renders from registry (expected: "${expectedLyteSignals}")`,
  lyteSignals === expectedLyteSignals,
  `got: "${lyteSignals}"`,
);

const lyteFpr = findMetric('lyte', 'False Positive Rate');
const expectedLyteFpr = metricDisplay(LYTE_FALSE_POSITIVE_RATE);
check(
  `Lyte "False Positive Rate" renders from registry (expected: "${expectedLyteFpr}")`,
  lyteFpr === expectedLyteFpr,
  `got: "${lyteFpr}"`,
);

// ─── Vessels venture ──────────────────────────────────────────────────────────

const vesselsCount = findMetric('vessels', 'Vessels Monitored');
const expectedVesselsCount = metricDisplay(VESSELS_COUNT);
check(
  `Vessels "Vessels Monitored" renders from registry (expected: "${expectedVesselsCount}")`,
  vesselsCount === expectedVesselsCount,
  `got: "${vesselsCount}"`,
);

const vesselsDark = findMetric('vessels', 'Dark Vessel Detections (Avg Lead)');
const expectedVesselsDark = metricDisplay(VESSELS_DARK_DETECTION_LEAD);
check(
  `Vessels "Dark Vessel Detections" renders from registry (expected: "${expectedVesselsDark}")`,
  vesselsDark === expectedVesselsDark,
  `got: "${vesselsDark}"`,
);

// ─── Aegis venture ────────────────────────────────────────────────────────────

const aegisSims = findMetric('firestorm', 'Simulations Executed');
const expectedAegisSims = metricDisplay(AEGIS_SIMULATIONS);
check(
  `Aegis "Simulations Executed" renders from registry (expected: "${expectedAegisSims}")`,
  aegisSims === expectedAegisSims,
  `got: "${aegisSims}"`,
);

// ─── Terra venture (cross-surface mirror) ─────────────────────────────────────

const terraAum = findMetric('terra', 'Assets Under Analysis');
const expectedTerraAum = metricDisplay(TERRA_PORTFOLIO_AUM);
check(
  `Terra "Assets Under Analysis" renders from registry (expected: "${expectedTerraAum}")`,
  terraAum === expectedTerraAum,
  `got: "${terraAum}"`,
);

// ─── Verify no venture uses a banned raw metric string ────────────────────────

const bannedValues = [
  '< 4 min',
  '2.4M+',
  '< 3%',
  '52,000+',
  '34 days pre-designation',
  '31,200+',
  '$4.2B+',
];

for (const venture of ventures) {
  for (const metric of venture.metrics ?? []) {
    const isBanned = bannedValues.includes(metric.value);
    if (isBanned) {
      check(
        `Venture "${venture.id}" metric "${metric.label}" is NOT a banned hardcoded string`,
        false,
        `value: "${metric.value}" — add to public-claims.ts and use metricDisplay()`,
      );
      failed++;
    }
  }
}

check(
  'No venture metric uses a banned hardcoded claim string',
  !ventures.some((v) => (v.metrics ?? []).some((m) => bannedValues.includes(m.value))),
);

// ─── Summary ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${'─'.repeat(60)}`);
console.log(`Render check: ${passed}/${total} passed, ${failed} failed`);
console.log(`${'─'.repeat(60)}\n`);

process.exit(failed > 0 ? 1 : 0);
