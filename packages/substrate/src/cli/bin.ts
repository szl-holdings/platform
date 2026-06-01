#!/usr/bin/env node
/**
 * @szl/substrate — CLI entrypoint
 *
 * Usage:
 *   substrate replay <runId>
 *   substrate replay <runId> --counterfactual [--model=<adapterId>] [--policy=<policyId>]
 *
 * Replays a past substrate run, optionally with counterfactual substitutions.
 * For counterfactual runs, prints a side-by-side decision diff.
 *
 * Requires the run store to contain the target runId. The workflow definition
 * is resolved from the run's embedded __workflowSnapshot (written by start())
 * so replay works across process restarts without manual workflow registration.
 */

import process from 'node:process';
import { type ReplayOptions, replay, resolvePolicyProfileById } from './replay.js';

const args = process.argv.slice(2);
const [cmd, ...rest] = args;

function printUsage(): void {
}

async function main(): Promise<void> {
  if (!cmd || cmd === '--help' || cmd === '-h') {
    printUsage();
    process.exit(cmd ? 0 : 1);
  }

  if (cmd !== 'replay') {
    printUsage();
    process.exit(1);
  }

  const runId = rest[0];
  if (!runId || runId.startsWith('--')) {
    printUsage();
    process.exit(1);
  }

  const opts: ReplayOptions = { runId };
  let policyId: string | undefined;
  for (const arg of rest.slice(1)) {
    if (arg === '--counterfactual') {
      opts.counterfactual = true;
    } else if (arg.startsWith('--model=')) {
      opts.model = arg.slice('--model='.length);
    } else if (arg.startsWith('--policy=')) {
      policyId = arg.slice('--policy='.length);
    } else {
      printUsage();
      process.exit(1);
    }
  }

  // Resolve policy profile from registry when --policy=<id> is supplied.
  // Maps the policy-engine Policy object to a substrate PolicyProfile via
  // explicit field projection and Zod parsing (no unsafe casts).
  if (policyId) {
    const profile = await resolvePolicyProfileById(policyId);
    if (!profile) {
      process.exit(1);
    }
    opts.policy = profile;
  }

  const result = await replay(opts);

  if (opts.counterfactual && result.diff) {
  } else {
    if (result.mismatchedStages.length > 0) {
    }
  }
}

main().catch((_err: unknown) => {
  process.exit(1);
});
