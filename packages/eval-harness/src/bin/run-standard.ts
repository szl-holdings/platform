#!/usr/bin/env node
/**
 * run-standard — submit the Standard Suite against a model and print the signed report.
 *
 * Usage:
 *   EVAL_RUNNER_URL=http://localhost:8001 \
 *   EVAL_RUNNER_SIGNING_KEY=<key> \
 *   node --loader ts-node/esm src/bin/run-standard.ts \
 *     --model gpt-4o-mini --provider openai
 */

import { EvalHarnessClient } from '../client.js';
import { verifyReportSignature } from '../sign.js';
import { STANDARD_SUITE_ID } from '../constants.js';
import type { EvalProvider } from '../types.js';

const args = process.argv.slice(2);

function parseFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const modelId   = parseFlag('--model')    ?? parseFlag('-m') ?? 'gpt-4o-mini';
const provider  = parseFlag('--provider') ?? parseFlag('-p') ?? 'openai';
const runnerUrl = process.env['EVAL_RUNNER_URL'] ?? 'http://localhost:8001';

if (!process.env['EVAL_RUNNER_SIGNING_KEY']) {
  console.warn('[run-standard] WARNING: EVAL_RUNNER_SIGNING_KEY not set — signature verification will use the insecure dev default.');
}

const client = new EvalHarnessClient({ runnerUrl });

console.log(`[run-standard] Submitting ${STANDARD_SUITE_ID} against ${modelId} (${provider})...`);

try {
  const run = await client.submitRun({
    suiteId: STANDARD_SUITE_ID,
    modelId,
    provider: provider as EvalProvider,
    triggeredBy: 'run-standard-cli',
  });
  console.log(`[run-standard] Run submitted: ${run.run_id}`);

  let report = await client.getRun(run.run_id);
  let attempts = 0;
  const MAX_POLLS = 60;

  while (attempts < MAX_POLLS && (!report || (report.status !== 'completed' && report.status !== 'failed'))) {
    await new Promise(r => setTimeout(r, 3000));
    report = await client.getRun(run.run_id);
    process.stdout.write('.');
    attempts++;
  }
  console.log('\n');

  if (!report || report.status === 'failed') {
    console.error(`[run-standard] Run failed or timed out. status=${report?.status ?? 'unknown'}`);
    process.exit(1);
  }

  const completedReport = report;
  console.log('[run-standard] Result:');
  console.log(`  suite_id:        ${completedReport.suite_id}`);
  console.log(`  model_id:        ${completedReport.model_id}`);
  console.log(`  status:          ${completedReport.status}`);
  console.log(`  pass_rate:       ${(completedReport.pass_rate * 100).toFixed(1)}%`);
  console.log(`  aggregate_score: ${(completedReport.aggregate_score * 100).toFixed(1)}%`);
  console.log(`  content_hash:    ${completedReport.content_hash}`);
  console.log(`  signature:       ${completedReport.signature}`);

  if (completedReport.content_hash && completedReport.signature) {
    const valid = verifyReportSignature(completedReport.content_hash, completedReport.signature);
    console.log(`  signature_valid: ${valid}`);
    if (!valid) {
      console.error('[run-standard] SIGNATURE VERIFICATION FAILED — report may have been tampered with');
      process.exit(2);
    }
  }

  console.log('\n[run-standard] Full report:');
  console.log(JSON.stringify(completedReport, null, 2));
} catch (err) {
  console.error('[run-standard] Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}
