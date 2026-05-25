/**
 * Live demo — Sentra instrumented callsites → ROSIE evolution tick.
 *
 * Drives ~30 synthetic invocations against each of the three instrumented
 * Sentra ML scoring callsites with observed values that drift above their
 * registry baselines, then triggers a single `runRosieEvolutionTick` and
 * prints the resulting Codex queue summary. Done = "proposals: ≥1".
 *
 * Run: pnpm --filter @workspace/api-server exec tsx src/scripts/demo-rosie-drift.ts
 */

// Importing the A11oy formulas route module wires `setInvocationSink` to
// the api-server's drift bridge. Without this side-effect the helpers
// below would emit into a no-op sink.
import '../routes/a11oy-formulas-api.js';
import {
  recordAssetRiskObservation,
  recordBlastRadiusObservation,
  recordAdversaryReplayObservation,
} from '../lib/sentra-formula-observations.js';
import { runRosieEvolutionTick } from '../jobs/rosie-evolution-loop.js';

const PER_CALLSITE = 30;

function pumpAssetRisk(): void {
  for (let i = 0; i < PER_CALLSITE; i++) {
    // Critical-tier asset; baseline 0.35; observed drifts to ~0.70.
    recordAssetRiskObservation({
      criticality: 'critical',
      internetExposure: true,
      cvssScore: 9.2,
      observed: 0.68 + (i % 5) * 0.01,
    });
  }
}

function pumpBlastRadius(): void {
  for (let i = 0; i < PER_CALLSITE; i++) {
    // Service-account; baseline 0.28; observed drifts to ~0.55.
    recordBlastRadiusObservation({
      identityType: 'service-account',
      hasAdminRights: true,
      accessibleSystems: 80,
      observed: 0.54 + (i % 5) * 0.01,
      estimatedBlastRadius: 2_500_000,
    });
  }
}

function pumpAdversaryReplay(): void {
  for (let i = 0; i < PER_CALLSITE; i++) {
    // Baseline 0.30; observed drifts to ~0.65.
    recordAdversaryReplayObservation({
      observed: 0.62 + (i % 5) * 0.01,
      kevListedCount: 4,
      webApps: 5,
      endpoints: 120,
    });
  }
}

async function main(): Promise<void> {
  console.log('[demo-rosie-drift] pumping', PER_CALLSITE, 'observations per callsite…');
  pumpAssetRisk();
  pumpBlastRadius();
  pumpAdversaryReplay();

  // Give the lazy-imported drift bridge a tick to flush.
  await new Promise((r) => setTimeout(r, 250));

  console.log('[demo-rosie-drift] triggering runRosieEvolutionTick()…');
  const summary = await runRosieEvolutionTick();
  console.log('[demo-rosie-drift] tick summary:', JSON.stringify(summary, null, 2));

  if (summary.proposals < 1) {
    console.error('[demo-rosie-drift] FAIL — expected ≥1 tuning proposal');
    process.exit(1);
  }
  console.log('[demo-rosie-drift] OK — ROSIE Codex queue populated unprompted.');
  process.exit(0);
}

void main().catch((err) => {
  console.error('[demo-rosie-drift] crashed:', err);
  process.exit(2);
});
