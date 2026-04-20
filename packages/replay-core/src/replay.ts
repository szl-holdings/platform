import type { ReplaySnapshot } from './snapshot.ts';

export type AgentExecutor = (
  input: Record<string, unknown>,
  historicalContext: Record<string, unknown>,
  snapshotId: string,
) => Promise<ReplayResult>;

export interface ReplayResult {
  snapshotId: string;
  agentOutput: Record<string, unknown>;
  latencyMs: number;
  tokensUsed?: number;
  costUsd?: number;
  model?: string;
  groundTruthMatch?: boolean;
  groundTruthScore?: number;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

export interface TraceReplayInput {
  traceId: string;
  runId?: string;
  objective?: string;
  selfModelSnapshot?: Record<string, unknown>;
  worldModelSnapshot?: Record<string, unknown>;
  capturedToolOutputs?: Record<string, unknown>;
  capturedModelOutputs?: Record<string, unknown>;
  originalModel?: string;
  originalPromptVersions?: string[];
}

export interface DeterministicReplayResult {
  originalTraceId: string;
  replayedAt: string;
  steps: Array<{
    kind: string;
    name: string;
    sequenceIndex: number;
    data: unknown;
  }>;
  matchedStepCount: number;
  totalStepCount: number;
  deterministicScore: number;
  errors: string[];
}

export interface ReplayRunConfig {
  maxConcurrency?: number;
  timeoutMs?: number;
  compareGroundTruth?: boolean;
  groundTruthComparator?: (
    output: Record<string, unknown>,
    groundTruth: Record<string, unknown>,
  ) => number;
}

export interface ReplayRunReport {
  runId: string;
  scenarioId: string;
  startedAt: string;
  completedAt: string;
  totalSnapshots: number;
  successful: number;
  failed: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  totalTokensUsed: number;
  groundTruthMatchRate?: number;
  results: ReplayResult[];
}

function defaultGroundTruthComparator(
  output: Record<string, unknown>,
  groundTruth: Record<string, unknown>,
): number {
  const outKeys = Object.keys(output);
  const gtKeys = Object.keys(groundTruth);
  if (gtKeys.length === 0) return 1.0;
  let matches = 0;
  for (const key of gtKeys) {
    if (outKeys.includes(key) && JSON.stringify(output[key]) === JSON.stringify(groundTruth[key])) {
      matches++;
    }
  }
  return matches / gtKeys.length;
}

export async function replaySnapshot(
  snapshot: ReplaySnapshot,
  executor: AgentExecutor,
  config: ReplayRunConfig = {},
): Promise<ReplayResult> {
  const {
    timeoutMs = 30000,
    compareGroundTruth = true,
    groundTruthComparator = defaultGroundTruthComparator,
  } = config;

  const start = Date.now();
  const errors: string[] = [];
  let agentOutput: Record<string, unknown> = {};

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Replay timed out after ${timeoutMs}ms`)), timeoutMs),
    );

    const inputs = snapshot.agentInputs[0] ?? {};
    const result = await Promise.race([
      executor(inputs, snapshot.historicalContext, snapshot.id),
      timeoutPromise,
    ]);

    agentOutput = result.agentOutput;
    const latencyMs = Date.now() - start;

    let groundTruthScore: number | undefined;
    let groundTruthMatch: boolean | undefined;

    if (compareGroundTruth && snapshot.groundTruth) {
      groundTruthScore = groundTruthComparator(agentOutput, snapshot.groundTruth);
      groundTruthMatch = groundTruthScore >= 0.8;
    }

    return {
      snapshotId: snapshot.id,
      agentOutput,
      latencyMs,
      tokensUsed: result.tokensUsed,
      costUsd: result.costUsd,
      model: result.model,
      groundTruthMatch,
      groundTruthScore,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    return {
      snapshotId: snapshot.id,
      agentOutput,
      latencyMs: Date.now() - start,
      errors: [err instanceof Error ? err.message : String(err)],
      groundTruthMatch: false,
      groundTruthScore: 0,
    };
  }
}

export async function replayScenario(
  snapshots: ReplaySnapshot[],
  executor: AgentExecutor,
  config: ReplayRunConfig = {},
): Promise<ReplayRunReport> {
  const { maxConcurrency = 3 } = config;
  const runId = `replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const scenarioId = snapshots[0]?.scenarioId ?? 'unknown';
  const startedAt = new Date().toISOString();
  const results: ReplayResult[] = [];

  for (let i = 0; i < snapshots.length; i += maxConcurrency) {
    const batch = snapshots.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(batch.map((s) => replaySnapshot(s, executor, config)));
    results.push(...batchResults);
  }

  const successful = results.filter((r) => !r.errors?.length).length;
  const failed = results.length - successful;
  const avgLatencyMs = results.reduce((sum, r) => sum + r.latencyMs, 0) / (results.length || 1);
  const totalCostUsd = results.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
  const totalTokensUsed = results.reduce((sum, r) => sum + (r.tokensUsed ?? 0), 0);

  const withGroundTruth = results.filter((r) => r.groundTruthMatch !== undefined);
  const groundTruthMatchRate =
    withGroundTruth.length > 0
      ? withGroundTruth.filter((r) => r.groundTruthMatch).length / withGroundTruth.length
      : undefined;

  return {
    runId,
    scenarioId,
    startedAt,
    completedAt: new Date().toISOString(),
    totalSnapshots: results.length,
    successful,
    failed,
    avgLatencyMs,
    totalCostUsd,
    totalTokensUsed,
    groundTruthMatchRate,
    results,
  };
}

export function replayFromTrace(input: TraceReplayInput): DeterministicReplayResult {
  const { traceId, capturedToolOutputs = {}, capturedModelOutputs = {} } = input;

  const steps: DeterministicReplayResult['steps'] = [];
  const errors: string[] = [];
  let sequenceIndex = 0;
  let matchedStepCount = 0;

  const selfModel = input.selfModelSnapshot ?? {};
  const worldModel = input.worldModelSnapshot ?? {};

  if (Object.keys(selfModel).length > 0) {
    steps.push({
      kind: 'self_model_restore',
      name: 'self-model',
      sequenceIndex: sequenceIndex++,
      data: selfModel,
    });
    matchedStepCount++;
  }
  if (Object.keys(worldModel).length > 0) {
    steps.push({
      kind: 'world_model_restore',
      name: 'world-model',
      sequenceIndex: sequenceIndex++,
      data: { ref: input.worldModelSnapshot },
    });
    matchedStepCount++;
  }

  for (const [toolId, output] of Object.entries(capturedToolOutputs)) {
    const matched = output !== undefined;
    if (matched) matchedStepCount++;
    else errors.push(`Missing captured output for tool: ${toolId}`);
    steps.push({
      kind: 'tool_replay',
      name: toolId,
      sequenceIndex: sequenceIndex++,
      data: { toolId, output, replayed: matched },
    });
  }

  for (const [modelId, output] of Object.entries(capturedModelOutputs)) {
    const matched = output !== undefined;
    if (matched) matchedStepCount++;
    else errors.push(`Missing captured output for model: ${modelId}`);
    steps.push({
      kind: 'model_replay',
      name: modelId,
      sequenceIndex: sequenceIndex++,
      data: { modelId, output, replayed: matched },
    });
  }

  const totalStepCount = steps.length;
  const deterministicScore = totalStepCount > 0 ? matchedStepCount / totalStepCount : 1.0;

  return {
    originalTraceId: traceId,
    replayedAt: new Date().toISOString(),
    steps,
    matchedStepCount,
    totalStepCount,
    deterministicScore,
    errors,
  };
}
