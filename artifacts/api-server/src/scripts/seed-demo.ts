/**
 * seed-demo.ts — Master Demo Seed Orchestrator
 *
 * Runs all domain seed modules in dependency order to populate every
 * dashboard and chart in the SZL Holdings platform with realistic,
 * internally-consistent cross-domain data.
 *
 * Idempotent: each sub-seed checks for existing data and skips gracefully.
 * Safe to re-run at any time. Does NOT truncate tables.
 *
 * Usage:
 *   pnpm seed:demo                      # from repo root
 *   pnpm --filter @workspace/api-server seed:demo
 *   tsx src/scripts/seed-demo.ts        # from api-server dir
 *
 * Seed order (dependency-aware):
 *   Phase 1: Core security — Aegis (Firestorm findings, assets, incidents)
 *   Phase 2: Domain data — Vessels, Holdings, Governance, Carlota Jo
 *   Phase 3: Platform infra — Agent OS, Forge, MSP, Observability, etc.
 *   Phase 4: Briefings — 30-day Pulse briefing and daily briefing history
 *   Phase 5: Ownership & decisions — cap structure + AI decision audit trail
 *   Phase 6: Cross-domain graph — Constellation nodes and edges
 */

import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Imported-function seeds (export a function; can be called directly)
import { seedAegis } from './seed-aegis.js';
import { seedAgentOS } from './seed-agent-os.js';
import { seedCarlotaClients } from './seed-carlota-clients.js';
import { seedConstellationExtended } from './seed-constellation-extended.js';
import { seedDailyBriefings } from './seed-daily-briefings.js';
import { seedDecisions } from './seed-decisions.js';
import { seedDistributionOS } from './seed-distribution-os.js';
import { seedForge } from './seed-forge.js';
import { seedGovernance } from './seed-governance.js';
import { seedHoldingsFundops } from './seed-holdings-fundops.js';
import { seedMarineExtended } from './seed-marine-extended.js';
import { seedOwnership } from './seed-ownership.js';
import { seedPrismCounsel } from './seed-prism-counsel.js';
import { seedPulse } from './seed-pulse.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SeedResult {
  name: string;
  status: 'seeded' | 'skipped' | 'failed';
  details?: Record<string, number | string>;
  error?: string;
  durationMs: number;
}

/** Run a seed function that exports a function — inline, same process. */
async function runSeed(
  name: string,
  fn: () => Promise<Record<string, unknown> | { skipped: boolean } | void>,
): Promise<SeedResult> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    if (result && typeof result === 'object' && 'skipped' in result && result.skipped) {
      return { name, status: 'skipped', durationMs };
    }
    const details: Record<string, number | string> = {};
    if (result && typeof result === 'object') {
      for (const [k, v] of Object.entries(result)) {
        if (typeof v === 'number' || typeof v === 'string') details[k] = v;
      }
    }
    return { name, status: 'seeded', details, durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[seed-demo] ✗ ${name} FAILED: ${error}`);
    return { name, status: 'failed', error, durationMs };
  }
}

/** Run a standalone seed script in a child process (for scripts that call process.exit). */
function runSeedScript(name: string, scriptName: string): SeedResult {
  const start = Date.now();
  const scriptPath = join(__dirname, scriptName);
  try {
    const result = spawnSync('tsx', [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      timeout: 120_000,
    });
    const durationMs = Date.now() - start;
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) {
      const error = result.stderr?.slice(0, 200) ?? `Exit code ${result.status}`;
      return { name, status: 'failed', error, durationMs };
    }
    // Detect skip pattern in output
    const output = result.stdout ?? '';
    const skipped =
      /already (exists|seeded|populated|present)/i.test(output) && !output.includes('Inserted');
    return { name, status: skipped ? 'skipped' : 'seeded', durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    return { name, status: 'failed', error: String(err), durationMs };
  }
}

function printResult(r: SeedResult) {
  const icon = r.status === 'seeded' ? '✓' : r.status === 'skipped' ? '↷' : '✗';
  const suffix =
    r.status === 'seeded' && r.details && Object.keys(r.details).length > 0
      ? ` (${Object.entries(r.details)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')})`
      : r.status === 'skipped'
        ? ' [already seeded]'
        : r.error
          ? ` — ${r.error.slice(0, 100)}`
          : '';
  console.log(`  ${icon} ${r.name}${suffix} [${r.durationMs}ms]`);
}

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  SZL Holdings — Demo Seed (Idempotent)');
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('════════════════════════════════════════════════════\n');

  const totalStart = Date.now();
  const results: SeedResult[] = [];

  // ── Phase 1: Core Security ───────────────────────────────────────────────────
  console.log('── Phase 1: Core Security & Baseline ──');
  results.push(runSeedScript('Ecosystem Baseline', 'seed-ecosystem.ts'));
  results.push(await runSeed('Aegis (Security)', seedAegis));

  // ── Phase 2: Domain Data ─────────────────────────────────────────────────────
  console.log('\n── Phase 2: Domain Data ──');
  results.push(await runSeed('Marine Extended (Vessels)', seedMarineExtended));
  results.push(await runSeed('Holdings & Fund Ops', seedHoldingsFundops));
  results.push(await runSeed('Governance & Compliance', seedGovernance));
  results.push(await runSeed('Carlota Jo Clients', seedCarlotaClients));

  // ── Phase 3: Platform Infrastructure ─────────────────────────────────────────
  // These scripts call process.exit() so run as child processes
  console.log('\n── Phase 3: Platform Infrastructure ──');
  results.push(await runSeed('Agent OS', seedAgentOS));
  results.push(await runSeed('Forge', seedForge));
  results.push(runSeedScript('Capital & Certification', 'seed-capital-cert.ts'));
  results.push(runSeedScript('MSP Platform', 'seed-msp.ts'));
  results.push(runSeedScript('Marketing OS', 'seed-marketing-os.ts'));
  results.push(runSeedScript('Document Engine', 'seed-document-engine.ts'));
  results.push(await runSeed('Distribution OS', seedDistributionOS));
  results.push(await runSeed('Counsel', seedPrismCounsel));
  results.push(runSeedScript('Alloy Narratives', 'seed-alloy.ts'));
  results.push(runSeedScript('Observability', 'seed-observability.ts'));
  results.push(runSeedScript('Terra Full', 'seed-terra-full.ts'));

  // ── Phase 4: Intelligence & Briefings ────────────────────────────────────────
  console.log('\n── Phase 4: Intelligence & Briefings ──');
  results.push(await runSeed('Pulse Briefings (30-day)', seedPulse));
  results.push(await runSeed('Daily Briefings (30-day)', seedDailyBriefings));

  // ── Phase 5: Ownership & Decision Audit ──────────────────────────────────────
  console.log('\n── Phase 5: Ownership & Decision Audit ──');
  results.push(await runSeed('Ownership Scenarios & Cap Table', seedOwnership));
  results.push(await runSeed('AI Decisions, Runs & Policy', seedDecisions));

  // ── Phase 6: Cross-Domain Constellation Graph ─────────────────────────────────
  console.log('\n── Phase 6: Constellation Graph ──');
  results.push(await runSeed('Constellation Nodes & Edges', seedConstellationExtended));

  // ── Summary ───────────────────────────────────────────────────────────────────
  const totalMs = Date.now() - totalStart;
  const seeded = results.filter((r) => r.status === 'seeded');
  const skipped = results.filter((r) => r.status === 'skipped');
  const failed = results.filter((r) => r.status === 'failed');

  console.log('\n════════════════════════════════════════════════════');
  console.log('  Seed Summary');
  console.log('════════════════════════════════════════════════════');
  for (const r of results) printResult(r);

  console.log('\n────────────────────────────────────────────────────');
  console.log(`  Total:   ${results.length} modules`);
  console.log(`  Seeded:  ${seeded.length}`);
  console.log(`  Skipped: ${skipped.length} (already populated)`);
  console.log(`  Failed:  ${failed.length}`);
  console.log(`  Duration: ${(totalMs / 1000).toFixed(1)}s`);
  console.log('════════════════════════════════════════════════════');

  if (failed.length > 0) {
    console.error(`\n[seed-demo] ${failed.length} module(s) failed — see errors above`);
    process.exit(1);
  }

  console.log('\n[seed-demo] All dashboards populated. Platform ready.\n');
  process.exit(0);
}

main();
