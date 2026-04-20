/**
 * @szl/substrate — Replay + Counterfactual CLI
 *
 * substrate replay <runId>
 * substrate replay <runId> --counterfactual --model=<id> --policy=<profile>
 *
 * Outputs a side-by-side decision diff. Also exposed as a typed API endpoint
 * for the future Eval Console (Task #1173).
 */

import type {
  PipelineRun,
  CounterfactualDiff,
  StageDiff,
  StageResultStatus,
  WorkflowDefinition,
  PolicyProfile,
  RuntimeStartOptions,
} from "../types.js";
import { PolicyProfileSchema } from "../types.js";
import { defaultRunStore, defaultJournal } from "../journal.js";
import { defaultRuntime, lookupWorkflow, type SubstrateRuntimeOptions } from "../engine.js";

/**
 * Look up a policy from the policy-engine registry by ID and project it into a
 * substrate PolicyProfile. The policy-engine Policy type is structurally
 * different (rule-based evaluation object) from PolicyProfile (governance
 * shape), so we map explicitly — never cast — and fill in required fields with
 * safe defaults via PolicyProfileSchema.parse().
 *
 * Returns undefined when no matching policy is registered.
 */
/** Thrown by handleReplayRequest when a policyId is supplied but not registered. */
export class PolicyNotFoundError extends Error {
  readonly policyId: string;
  constructor(policyId: string) {
    super(`No policy registered with id "${policyId}"`);
    this.name = "PolicyNotFoundError";
    this.policyId = policyId;
  }
}

export async function resolvePolicyProfileById(policyId: string): Promise<PolicyProfile | undefined> {
  const { getRegisteredPolicies } = await import("@szl-holdings/policy-engine");
  const policies = getRegisteredPolicies();
  const found = policies.find((p) => p.id === policyId);
  if (!found) return undefined;
  return PolicyProfileSchema.parse({
    id: found.id,
    name: found.name,
    // Reference the source policy-engine policy by its id.
    policyIds: [found.id],
    // Omit highRiskCategories so PolicyProfileSchema applies its default
    // (financial, deletion, write-external, infrastructure) — the full
    // strict governance posture for counterfactual evaluation.
    minimumApprovalTier: "operator",
  });
}

// ─── Replay API ───────────────────────────────────────────────────────────────

export interface ReplayOptions {
  /** Source run ID to replay */
  runId: string;
  /** If true, run in counterfactual mode with substitutions */
  counterfactual?: boolean;
  /** Substitute model adapter ID for counterfactual */
  model?: string;
  /** Substitute policy profile for counterfactual */
  policy?: PolicyProfile;
  /** The workflow definition to replay against (required for replay) */
  workflow?: WorkflowDefinition;
  /** Additional runtime options */
  runtimeOptions?: SubstrateRuntimeOptions;
}

export interface ReplayResult {
  sourceRun: PipelineRun;
  replayRun: PipelineRun;
  /** Only present for counterfactual replays */
  diff?: CounterfactualDiff;
  stableHashes: boolean;
  mismatchedStages: string[];
}

/**
 * Replay a past run, optionally with counterfactual substitutions.
 * Produces a side-by-side decision diff for counterfactual runs.
 */
export async function replay(opts: ReplayOptions): Promise<ReplayResult> {
  const sourceRun = await defaultRunStore.get(opts.runId);
  if (!sourceRun) {
    throw new Error(`[substrate replay] Run '${opts.runId}' not found in run store`);
  }

  // Resolve workflow: caller-supplied takes priority; then check the workflow snapshot
  // embedded in the run's metadata (written by engine.start() for replay durability);
  // fall back to the in-memory registry last (present only when the process started
  // the original run in the same session).
  const snapshotDef = sourceRun.metadata?.["__workflowSnapshot"] as WorkflowDefinition | undefined;
  const workflow = opts.workflow ?? snapshotDef ?? lookupWorkflow(sourceRun.workflowId);
  if (!workflow) {
    throw new Error(
      `[substrate replay] Workflow '${sourceRun.workflowId}' cannot be resolved for run '${opts.runId}'. ` +
      "Pass the WorkflowDefinition explicitly via opts.workflow, or use a run created after workflow-snapshot support (v0.1.0).",
    );
  }

  const mode: RuntimeStartOptions["mode"] = opts.counterfactual ? "counterfactual" : "replay";

  const runtime = new (await import("../engine.js")).SubstrateRuntime(opts.runtimeOptions ?? {});

  const replayRun = await runtime.start(workflow, sourceRun.input, {
    mode,
    sourceRunId: opts.runId,
    ...(opts.model !== undefined ? { counterfactualModel: opts.model } : {}),
    ...(opts.policy !== undefined ? { counterfactualPolicy: opts.policy } : {}),
    replayDiffOnly: !opts.counterfactual,
    metadata: {
      replayOf: opts.runId,
      replayMode: mode,
      ...(opts.model ? { counterfactualModel: opts.model } : {}),
      ...(opts.policy ? { counterfactualPolicy: opts.policy.id } : {}),
    },
  });

  // Verify hash stability for pure replays
  const { stable, mismatchedStages } = await defaultJournal.verifyReplayStability(
    opts.runId,
    replayRun.runId,
  );

  let diff: CounterfactualDiff | undefined;
  if (opts.counterfactual) {
    diff = buildCounterfactualDiff(sourceRun, replayRun, opts.model, opts.policy?.id);
  }

  return { sourceRun, replayRun, ...(diff !== undefined ? { diff } : {}), stableHashes: stable, mismatchedStages };
}

// ─── Diff Builder ─────────────────────────────────────────────────────────────

function buildCounterfactualDiff(
  baseline: PipelineRun,
  counterfactual: PipelineRun,
  counterfactualModel?: string,
  counterfactualPolicy?: string,
): CounterfactualDiff {
  const baselineByStage = new Map(baseline.stageResults.map((r) => [r.stageId, r]));
  const counterfactualByStage = new Map(counterfactual.stageResults.map((r) => [r.stageId, r]));
  const allStageIds = new Set([
    ...baseline.stageResults.map((r) => r.stageId),
    ...counterfactual.stageResults.map((r) => r.stageId),
  ]);

  const stageDiffs: StageDiff[] = [];

  for (const stageId of allStageIds) {
    const baselineResult = baselineByStage.get(stageId) ?? null;
    const cfResult = counterfactualByStage.get(stageId) ?? null;

    const bStatus = baselineResult?.status ?? null;
    const cfStatus = cfResult?.status ?? null;
    const bConf = baselineResult?.confidence;
    const cfConf = cfResult?.confidence;

    const differ =
      bStatus !== cfStatus ||
      (bConf !== undefined && cfConf !== undefined && Math.abs(bConf - cfConf) > 0.05);

    const decisionChanged =
      bStatus !== cfStatus &&
      (bStatus === "completed" || cfStatus === "completed");

    stageDiffs.push({
      stageId,
      stageType: (baselineResult ?? cfResult)!.stageType,
      baseline: baselineResult
        ? {
            status: baselineResult.status as StageResultStatus,
            ...(baselineResult.confidence !== undefined ? { confidence: baselineResult.confidence } : {}),
            ...(baselineResult.output !== undefined ? { output: baselineResult.output } : {}),
          }
        : null,
      counterfactual: cfResult
        ? {
            status: cfResult.status as StageResultStatus,
            ...(cfResult.confidence !== undefined ? { confidence: cfResult.confidence } : {}),
            ...(cfResult.output !== undefined ? { output: cfResult.output } : {}),
          }
        : null,
      differ,
      decisionChanged,
    });
  }

  const finalConfidenceDelta =
    (counterfactual.finalConfidence ?? 0) - (baseline.finalConfidence ?? 0);
  const outcomeChanged = baseline.status !== counterfactual.status;

  return {
    baselineRunId: baseline.runId,
    counterfactualRunId: counterfactual.runId,
    ...(counterfactualModel !== undefined ? { counterfactualModel } : {}),
    ...(counterfactualPolicy !== undefined ? { counterfactualPolicy } : {}),
    stageDiffs,
    finalConfidenceDelta,
    outcomeChanged,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Text Diff Formatter (for CLI output) ─────────────────────────────────────

export function formatDiff(diff: CounterfactualDiff): string {
  const lines: string[] = [];
  lines.push("=".repeat(70));
  lines.push(`COUNTERFACTUAL DIFF`);
  lines.push(`Baseline:        ${diff.baselineRunId}`);
  lines.push(`Counterfactual:  ${diff.counterfactualRunId}`);
  if (diff.counterfactualModel) lines.push(`Model Swap:      ${diff.counterfactualModel}`);
  if (diff.counterfactualPolicy) lines.push(`Policy Swap:     ${diff.counterfactualPolicy}`);
  lines.push(`Generated:       ${diff.generatedAt}`);
  lines.push("-".repeat(70));

  for (const sd of diff.stageDiffs) {
    const marker = sd.decisionChanged ? "⚡" : sd.differ ? "~" : " ";
    lines.push(`${marker} [${sd.stageType}] ${sd.stageId}`);
    if (sd.baseline) {
      const bConf = sd.baseline.confidence !== undefined ? ` conf=${(sd.baseline.confidence * 100).toFixed(1)}%` : "";
      lines.push(`    baseline:       status=${sd.baseline.status}${bConf}`);
    } else {
      lines.push(`    baseline:       (not executed)`);
    }
    if (sd.counterfactual) {
      const cfConf = sd.counterfactual.confidence !== undefined ? ` conf=${(sd.counterfactual.confidence * 100).toFixed(1)}%` : "";
      lines.push(`    counterfactual: status=${sd.counterfactual.status}${cfConf}`);
    } else {
      lines.push(`    counterfactual: (not executed)`);
    }
  }

  lines.push("-".repeat(70));
  const delta = diff.finalConfidenceDelta;
  const deltaStr = (delta >= 0 ? "+" : "") + (delta * 100).toFixed(1) + "%";
  lines.push(`Final Confidence Delta: ${deltaStr}`);
  lines.push(`Outcome Changed:        ${diff.outcomeChanged ? "YES ⚡" : "no"}`);
  lines.push("=".repeat(70));

  return lines.join("\n");
}

// ─── Typed API Endpoint Handler (for Eval Console) ───────────────────────────

export interface ReplayEndpointRequest {
  runId: string;
  counterfactual?: boolean;
  model?: string;
  /** Policy profile object — takes priority over policyId lookup */
  policy?: PolicyProfile;
  /** Policy ID to look up from the policy registry for counterfactual substitution */
  policyId?: string;
  workflow?: WorkflowDefinition;
}

export interface ReplayEndpointResponse {
  sourceRunId: string;
  replayRunId: string;
  mode: string;
  stableHashes: boolean;
  mismatchedStages: string[];
  diff: CounterfactualDiff | null;
  replayRun: PipelineRun;
}

export async function handleReplayRequest(
  req: ReplayEndpointRequest,
): Promise<ReplayEndpointResponse> {
  // Resolve counterfactual policy profile from policyId when provided.
  // Caller-supplied policy object takes priority over policyId lookup.
  let counterfactualPolicy: PolicyProfile | undefined = req.policy;
  if (!counterfactualPolicy && req.policyId) {
    counterfactualPolicy = await resolvePolicyProfileById(req.policyId);
    if (!counterfactualPolicy) {
      throw new PolicyNotFoundError(req.policyId);
    }
  }

  const result = await replay({
    runId: req.runId,
    ...(req.counterfactual !== undefined ? { counterfactual: req.counterfactual } : {}),
    ...(req.model !== undefined ? { model: req.model } : {}),
    ...(counterfactualPolicy !== undefined ? { policy: counterfactualPolicy } : {}),
    ...(req.workflow !== undefined ? { workflow: req.workflow } : {}),
  });

  return {
    sourceRunId: req.runId,
    replayRunId: result.replayRun.runId,
    mode: result.replayRun.mode,
    stableHashes: result.stableHashes,
    mismatchedStages: result.mismatchedStages,
    diff: result.diff ?? null,
    replayRun: result.replayRun,
  };
}
