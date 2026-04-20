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

import process from "node:process";
import { replay, formatDiff, resolvePolicyProfileById } from "./replay.js";
import type { ReplayOptions } from "./replay.js";

const args = process.argv.slice(2);
const [cmd, ...rest] = args;

function printUsage(): void {
  console.log([
    "Usage:",
    "  substrate replay <runId>",
    "  substrate replay <runId> --counterfactual [--model=<adapterId>] [--policy=<policyId>]",
    "",
    "Options:",
    "  --counterfactual   Run in counterfactual mode and print a decision diff",
    "  --model=<id>       Substitute model adapter for counterfactual run",
    "  --policy=<id>      Substitute policy profile ID for counterfactual run",
  ].join("\n"));
}

async function main(): Promise<void> {
  if (!cmd || cmd === "--help" || cmd === "-h") {
    printUsage();
    process.exit(cmd ? 0 : 1);
  }

  if (cmd !== "replay") {
    console.error(`[substrate] Unknown command: ${cmd}`);
    console.error("Available commands: replay");
    printUsage();
    process.exit(1);
  }

  const runId = rest[0];
  if (!runId || runId.startsWith("--")) {
    console.error("[substrate] replay requires a run ID as its first argument");
    printUsage();
    process.exit(1);
  }

  const opts: ReplayOptions = { runId };
  let policyId: string | undefined;
  for (const arg of rest.slice(1)) {
    if (arg === "--counterfactual") {
      opts.counterfactual = true;
    } else if (arg.startsWith("--model=")) {
      opts.model = arg.slice("--model=".length);
    } else if (arg.startsWith("--policy=")) {
      policyId = arg.slice("--policy=".length);
    } else {
      console.error(`[substrate] Unknown option: ${arg}`);
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
      console.error(`[substrate] No policy registered with id "${policyId}"`);
      process.exit(1);
    }
    opts.policy = profile;
    console.log(`[substrate] Using policy profile: ${profile.name} (min-tier: ${profile.minimumApprovalTier})`);
  }

  console.log(`[substrate] Replaying run ${runId}${opts.counterfactual ? " (counterfactual)" : ""}...\n`);

  const result = await replay(opts);

  if (opts.counterfactual && result.diff) {
    console.log(formatDiff(result.diff));
  } else {
    console.log(`Replay complete.`);
    console.log(`  Source run:  ${result.sourceRun.runId}  status=${result.sourceRun.status}`);
    console.log(`  Replay run:  ${result.replayRun.runId}  status=${result.replayRun.status}`);
    console.log(`  Hash stable: ${result.stableHashes ? "yes" : "NO — inputs changed"}`);
    if (result.mismatchedStages.length > 0) {
      console.log(`  Mismatched stages: ${result.mismatchedStages.join(", ")}`);
    }
  }
}

main().catch((err: unknown) => {
  console.error("[substrate]", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
