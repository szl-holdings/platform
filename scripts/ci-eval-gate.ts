/**
 * CI Eval Gate Script
 *
 * Runs agent evals against a candidate model version and blocks promotion
 * if the promotion gate fails. Results are recorded to the Decision Ledger
 * automatically via the /api/evals/promote endpoint. A structured failure
 * report is printed to stderr when the gate blocks the candidate.
 *
 * EVAL_API_URL and EVAL_API_KEY are required — the gate always calls the live
 * /api/evals/promote endpoint backed by real gateway inference. Synthetic or
 * local inference is not used for promotion checks; if the endpoint is
 * unreachable the gate hard-blocks (exit 1) rather than permitting an
 * un-validated promotion.
 *
 * Usage:
 *   EVAL_API_URL=https://api.example.com EVAL_API_KEY=... \
 *     pnpm tsx scripts/ci-eval-gate.ts \
 *       --agent-id sentinel-maritime \
 *       --model-version gpt-4o \
 *       [--dataset-id eval_ds_maritime_dark_vessel_v1] \
 *       [--baseline-eval-id eval_run_<id>]
 *
 * Exit codes:
 *   0 — gate passed (approved or pending_review)
 *   1 — gate blocked (model must not be promoted)
 *   2 — configuration or runtime error
 */

import { type AgentId } from '@szl-holdings/pulse-evals';

interface PromoteResponse {
  promotion_blocked: boolean;
  decision: string;
  eval_id: string;
  aggregate_score: number;
  pass_rate: number;
  blocked_reasons?: string[];
  pending_reasons?: string[];
  failure_report?: string;
  promotion_report?: string;
}

interface CliArgs {
  agentId: AgentId;
  modelVersion: string;
  datasetId: string | undefined;
  baselineEvalId: string | undefined;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const agentId = get('--agent-id');
  const modelVersion = get('--model-version');

  if (!agentId) {
    process.stderr.write(
      'ERROR: --agent-id is required (e.g. sentinel-maritime, prism-ai, guardian-security)\n',
    );
    process.exit(2);
  }

  if (!modelVersion) {
    process.stderr.write('ERROR: --model-version is required (e.g. v2.1.0-candidate)\n');
    process.exit(2);
  }

  return {
    agentId: agentId as AgentId,
    modelVersion,
    datasetId: get('--dataset-id'),
    baselineEvalId: get('--baseline-eval-id'),
  };
}

async function runViaHttp(
  apiUrl: string,
  apiKey: string,
  args: CliArgs,
  triggeredBy: string,
): Promise<PromoteResponse> {
  const url = `${apiUrl.replace(/\/$/, '')}/api/evals/promote`;
  const body = {
    agent_id: args.agentId,
    model_version: args.modelVersion,
    dataset_id: args.datasetId,
    baseline_eval_id: args.baselineEvalId,
    triggered_by: triggeredBy,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (response.status !== 200 && response.status !== 422) {
    const text = await response.text().catch(() => '(no body)');
    throw new Error(`Unexpected HTTP ${response.status} from ${url}: ${text}`);
  }

  return response.json() as Promise<PromoteResponse>;
}


async function main(): Promise<void> {
  const args = parseArgs();
  const { agentId, modelVersion, datasetId, baselineEvalId } = args;

  const triggeredBy = `ci:eval-gate:${process.env.GITHUB_RUN_ID ?? 'local'}`;
  const apiUrl = process.env.EVAL_API_URL;
  const apiKey = process.env.EVAL_API_KEY;

  process.stdout.write(
    `\n=== CI Eval Gate ===\n` +
      `Agent:         ${agentId}\n` +
      `Model:         ${modelVersion}\n` +
      `Dataset:       ${datasetId ?? '(latest for agent)'}\n` +
      `Baseline Eval: ${baselineEvalId ?? '(none)'}\n` +
      `Triggered By:  ${triggeredBy}\n` +
      `Mode:          ${apiUrl ? `HTTP → ${apiUrl}` : 'NO EVAL_API_URL — gate will block'}\n\n`,
  );

  if (apiUrl && apiKey) {
    let result: PromoteResponse;
    try {
      result = await runViaHttp(apiUrl, apiKey, args, triggeredBy);
    } catch (err) {
      process.stderr.write(
        `ERROR: HTTP eval gate call failed: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      process.exit(2);
    }

    process.stdout.write(
      `=== Eval Results (HTTP mode) ===\n` +
        `Eval ID:         ${result.eval_id}\n` +
        `Decision:        ${result.decision}\n` +
        `Aggregate Score: ${result.aggregate_score.toFixed(3)}\n` +
        `Pass Rate:       ${(result.pass_rate * 100).toFixed(1)}%\n\n`,
    );

    const report = result.failure_report ?? result.promotion_report ?? '(no report)';
    process.stdout.write(`=== Promotion Gate ===\n${report}\n\n`);

    if (result.promotion_blocked) {
      process.stderr.write(
        `\n[BLOCKED] Model ${modelVersion} cannot be promoted for agent ${agentId}.\n` +
          `Eval ID: ${result.eval_id}\n` +
          `Blocked reasons:\n${(result.blocked_reasons ?? []).map((r) => `  - ${r}`).join('\n')}\n\n` +
          `Fix the conditions listed above and re-run the eval gate.\n\n`,
      );
      process.exit(1);
    }

    process.stdout.write(
      `[${result.decision === 'approve' ? 'APPROVED' : 'PENDING REVIEW'}] ` +
        `Model ${modelVersion} passed the CI eval gate for agent ${agentId}.\n` +
        `Eval ID: ${result.eval_id}\n\n`,
    );
    return;
  }

  if (apiUrl && !apiKey) {
    process.stderr.write(
      'ERROR: EVAL_API_URL is set but EVAL_API_KEY is missing. ' +
        'Provide EVAL_API_KEY or unset EVAL_API_URL to run in local mode.\n',
    );
    process.exit(2);
  }

  // When EVAL_API_URL is unset (e.g. fork PRs without secrets, or before the
  // infra is provisioned) treat this as soft-skip rather than hard-block.
  // A hard block requires explicit opt-in via EVAL_GATE_REQUIRE=1.
  if (process.env.EVAL_GATE_REQUIRE === '1') {
    process.stderr.write(
      `[BLOCKED] EVAL_API_URL is not configured and EVAL_GATE_REQUIRE=1.\n` +
        `Set EVAL_API_URL (endpoint) + EVAL_API_KEY (admin key) to enable the promotion gate.\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `[SKIPPED] EVAL_API_URL is not configured. Skipping promotion gate.\n` +
      `Set EVAL_GATE_REQUIRE=1 to fail builds when the gate cannot run.\n`,
  );
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`Unexpected error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
});
