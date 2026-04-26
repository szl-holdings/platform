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
 *   Phase 1: Core security — PARAGON (Firestorm findings, assets, incidents)
 *   Phase 2: Domain data — Vessels, Holdings, Governance, Carlota Jo
 *   Phase 3: Platform infra — Agent OS, Forge, MSP, Observability, etc.
 *   Phase 4: Briefings — 30-day Pulse briefing and daily briefing history
 *   Phase 5: Ownership & decisions — cap structure + AI decision audit trail
 *   Phase 6: Cross-domain graph — Constellation nodes and edges
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Imported-function seeds (export a function; can be called directly)
import { seedAegis } from './seed-aegis.js';
import { seedAgentOS } from './seed-agent-os.js';
import { seedAlloyRuntimeAgents } from './seed-alloy-runtime-agents.js';
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
import { seedUptimeHistory } from './seed-uptime-history.js';

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
  fn: () => Promise<Record<string, unknown> | { skipped: boolean } | undefined>,
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
  const _icon = r.status === 'seeded' ? '✓' : r.status === 'skipped' ? '↷' : '✗';
  const _suffix =
    r.status === 'seeded' && r.details && Object.keys(r.details).length > 0
      ? ` (${Object.entries(r.details)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')})`
      : r.status === 'skipped'
        ? ' [already seeded]'
        : r.error
          ? ` — ${r.error.slice(0, 100)}`
          : '';
}

async function main() {

  const totalStart = Date.now();
  const results: SeedResult[] = [];
  results.push(runSeedScript('Ecosystem Baseline', 'seed-ecosystem.ts'));
  results.push(await runSeed('PARAGON (Security)', seedAegis));
  results.push(await runSeed('Alloy Runtime Agents (PARAGON Registry)', seedAlloyRuntimeAgents));
  results.push(await runSeed('Marine Extended (Vessels)', seedMarineExtended));
  results.push(await runSeed('Holdings & Fund Ops', seedHoldingsFundops));
  results.push(await runSeed('Governance & Compliance', seedGovernance));
  results.push(await runSeed('Carlota Jo Clients', seedCarlotaClients));
  results.push(await runSeed('Agent OS', seedAgentOS));
  results.push(await runSeed('Forge', seedForge));
  results.push(await runSeed('Uptime History (90-day backfill)', seedUptimeHistory));
  results.push(runSeedScript('Capital & Certification', 'seed-capital-cert.ts'));
  results.push(runSeedScript('MSP Platform', 'seed-msp.ts'));
  results.push(runSeedScript('Marketing OS', 'seed-marketing-os.ts'));
  results.push(runSeedScript('Document Engine', 'seed-document-engine.ts'));
  results.push(await runSeed('Distribution OS', seedDistributionOS));
  results.push(await runSeed('Counsel', seedPrismCounsel));
  results.push(runSeedScript('Alloy Narratives', 'seed-alloy.ts'));
  results.push(runSeedScript('Observability', 'seed-observability.ts'));
  results.push(runSeedScript('Terra Full', 'seed-terra-full.ts'));
  results.push(await runSeed('Pulse Briefings (30-day)', seedPulse));
  results.push(await runSeed('Daily Briefings (30-day)', seedDailyBriefings));
  results.push(await runSeed('Ownership Scenarios & Cap Table', seedOwnership));
  results.push(await runSeed('AI Decisions, Runs & Policy', seedDecisions));
  results.push(await runSeed('Constellation Nodes & Edges', seedConstellationExtended));

  // ── Summary ───────────────────────────────────────────────────────────────────
  const _totalMs = Date.now() - totalStart;
  const _seeded = results.filter((r) => r.status === 'seeded');
  const _skipped = results.filter((r) => r.status === 'skipped');
  const failed = results.filter((r) => r.status === 'failed');
  for (const r of results) printResult(r);

  if (failed.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
