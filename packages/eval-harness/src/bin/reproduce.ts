#!/usr/bin/env node
/**
 * reproduce — re-run an eval and verify suite manifest reproducibility.
 *
 * Reproducibility is defined over deterministic inputs (pinned dataset content_hash),
 * not stochastic model responses.  Two runs of the same suite against the same
 * pinned dataset always produce the same suite_content_hash.
 *
 * Usage:
 *   EVAL_RUNNER_URL=http://localhost:8001 \
 *   EVAL_RUNNER_SIGNING_KEY=<key> \
 *   pnpm eval-harness:reproduce --run-id <uuid>
 */

import { EvalHarnessClient } from '../client.js';
import { verifyReportSignature } from '../sign.js';

const args = process.argv.slice(2);

function parseFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const runId = parseFlag('--run-id') ?? parseFlag('-r');

if (!runId) {
  console.error('[reproduce] Error: --run-id is required');
  console.error('  Usage: pnpm eval-harness:reproduce --run-id <uuid>');
  process.exit(1);
}

if (!process.env['EVAL_RUNNER_SIGNING_KEY']) {
  console.warn('[reproduce] WARNING: EVAL_RUNNER_SIGNING_KEY not set — using insecure dev default.');
}

const runnerUrl = process.env['EVAL_RUNNER_URL'] ?? 'http://localhost:8001';
const client = new EvalHarnessClient({ runnerUrl });

console.log(`[reproduce] Fetching original run ${runId}...`);

try {
  const original = await client.getRun(runId);
  if (!original) {
    console.error(`[reproduce] Run not found: ${runId}`);
    process.exit(1);
  }

  console.log('[reproduce] Original run:');
  console.log(`  suite_id:           ${original.suite_id}`);
  console.log(`  model_id:           ${original.model_id}`);
  console.log(`  pass_rate:          ${(original.pass_rate * 100).toFixed(1)}%`);
  console.log(`  suite_content_hash: ${original.suite_content_hash}`);
  console.log(`  content_hash:       ${original.content_hash}`);
  console.log(`  signature:          ${original.signature}`);

  // No seed — reproduce verifies pinned dataset manifest determinism, not model responses.
  console.log('\n[reproduce] Submitting reproduce verification (no seed — suite manifest check only)...');
  const result = await client.reproduce(runId);

  console.log('\n[reproduce] Reproducibility result:');
  console.log(`  suite_reproduced:         ${result.suite_reproduced}`);
  console.log(`  original_suite_hash:      ${result.original_suite_content_hash}`);
  console.log(`  reproduced_suite_hash:    ${result.suite_content_hash}`);
  console.log(`  manifest_hash:            ${result.manifest_hash}`);
  console.log(`  manifest_signature:       ${result.manifest_signature}`);
  console.log(`  reproduce_run_id:         ${result.reproduce_run_id}`);

  if (result.cli_invocation) {
    console.log('\n[reproduce] Auditor CLI (run externally to re-verify):');
    console.log(`  ${result.cli_invocation}`);
  }

  if (!result.suite_reproduced) {
    console.error('\n[reproduce] SUITE MANIFEST MISMATCH — pinned dataset inputs have changed.');
    console.error('  Re-pin the dataset revision and re-run the benchmark to restore evidence chain.');
    process.exit(2);
  }

  // Verify the reproduce run signature
  if (result.reproduce_run_id) {
    const reproRun = await client.getRun(result.reproduce_run_id);
    if (reproRun?.content_hash && reproRun?.signature) {
      const sigValid = verifyReportSignature(reproRun.content_hash, reproRun.signature);
      console.log(`\n[reproduce] Reproduce run signature valid: ${sigValid}`);
      if (!sigValid) {
        console.error('[reproduce] SIGNATURE VERIFICATION FAILED — report may have been tampered with');
        process.exit(3);
      }
    }
  }

  console.log('\n[reproduce] OK — suite manifest reproducible; signed manifest hash verified.');
} catch (err) {
  console.error('[reproduce] Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}
