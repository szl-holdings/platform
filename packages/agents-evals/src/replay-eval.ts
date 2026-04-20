import { type CapturedStepIO as CoreStepIO, listStepIOForRun } from '@workspace/agents-core';
import type { EvalCase, EvalExecutor, EvalRunReport, EvalSuiteDef } from '@workspace/eval-forge';
import { runEvalSuite } from '@workspace/eval-forge';
import { defaultTraceStore, type ToolCallRecord, type TraceRecord } from '@workspace/trace-graph';
import { randomUUID } from 'crypto';

export interface CapturedStepIO {
  stepId: string;
  stepName: string;
  toolId?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  durationMs: number;
  tokensUsed?: number;
  costUsd?: number;
  model?: string;
  retryCount?: number;
}

export interface RunReplayManifest {
  runId: string;
  objective: string;
  capturedAt: string;
  steps: CapturedStepIO[];
  metadata?: Record<string, unknown>;
}

const replayManifestStore = new Map<string, RunReplayManifest>();

export function captureRunForReplay(manifest: RunReplayManifest): void {
  replayManifestStore.set(manifest.runId, manifest);
}

export function getReplayManifest(runId: string): RunReplayManifest | undefined {
  const explicit = replayManifestStore.get(runId);
  if (explicit) return explicit;

  const coreIO = listStepIOForRun(runId);
  if (coreIO.length > 0) {
    const traceRecord = defaultTraceStore.get(runId);
    const steps: CapturedStepIO[] = coreIO.map((s: CoreStepIO) => ({
      stepId: s.stepId,
      stepName: s.stepName,
      toolId: s.toolId,
      input: (s.input ?? {}) as Record<string, unknown>,
      output: (s.output ?? {}) as Record<string, unknown>,
      durationMs: s.durationMs,
      retryCount: s.retryCount,
    }));
    return {
      runId,
      objective: traceRecord?.objective ?? runId,
      capturedAt: new Date().toISOString(),
      steps,
      metadata: { source: 'agents-core:step-io-store', traceId: runId },
    };
  }

  const traceRecord = defaultTraceStore.get(runId);
  if (!traceRecord) return undefined;

  const steps: CapturedStepIO[] = (traceRecord.toolCalls ?? []).map(
    (tc: ToolCallRecord, idx: number) => ({
      stepId: tc.toolId ?? `step-${idx}`,
      stepName: tc.toolName ?? tc.toolId ?? `step-${idx}`,
      toolId: tc.toolId,
      input: {},
      output: {},
      durationMs: tc.latencyMs ?? 0,
      tokensUsed: tc.tokens,
      costUsd: tc.costUsd,
      retryCount: tc.retries ?? 0,
    }),
  );

  return {
    runId,
    objective: traceRecord.objective ?? runId,
    capturedAt: new Date().toISOString(),
    steps,
    metadata: { source: 'trace-graph', traceId: traceRecord.traceId },
  };
}

export function listReplayableRuns(): string[] {
  const explicit = Array.from(replayManifestStore.keys());
  const fromTrace = defaultTraceStore.list().map((t: TraceRecord) => t.traceId);
  return Array.from(new Set([...explicit, ...fromTrace]));
}

export async function replayRunAsEval(
  runId: string,
  options?: {
    triggeredBy?: string;
    onCaseComplete?: (result: unknown, progress: { completed: number; total: number }) => void;
  },
): Promise<EvalRunReport> {
  const manifest = getReplayManifest(runId);
  if (!manifest) {
    throw new Error(
      `No replay manifest or durable trace found for run '${runId}'. ` +
        `Ensure AgentRun.start() was called (which writes to trace-graph) or call captureRunForReplay() explicitly.`,
    );
  }

  const cases: EvalCase[] = manifest.steps.map((step) => ({
    id: `replay:${runId}:${step.stepId}`,
    domain: 'agents-core',
    label: `Replay — ${step.stepName}`,
    evalType: 'end-to-end-scenario' as const,
    graderType: 'exact-match' as const,
    input: step.input,
    groundTruth: step.output,
    expectedOutcome: 'pass' as const,
    traceId: runId,
    tags: ['replay', `run:${runId}`, ...(step.toolId ? [`tool:${step.toolId}`] : [])],
  }));

  const suite: EvalSuiteDef = {
    suiteId: `replay:${runId}`,
    name: `Replay Eval — Run ${runId}`,
    description: `Deterministic replay of run '${runId}' (objective: ${manifest.objective})`,
    domain: 'agents-core',
    evalType: 'end-to-end-scenario',
    cases,
    tags: ['replay', `run:${runId}`],
    version: 1,
  };

  const stepsByStepId = new Map(manifest.steps.map((s) => [s.stepId, s]));

  const executor: EvalExecutor = async (input, caseId, _domain) => {
    const stepId = caseId.split(':')[2];
    const capturedStep = stepId ? stepsByStepId.get(stepId) : undefined;

    if (capturedStep === undefined) {
      return {
        output: { error: `No captured output for stepId '${stepId ?? '(unknown)'}'` },
        latencyMs: 0,
        tokensUsed: 0,
        costUsd: 0,
        traceId: runId,
        metadata: { replay: true, runId, caseId },
      };
    }

    return {
      output: capturedStep.output,
      model: capturedStep.model,
      latencyMs: capturedStep.durationMs,
      tokensUsed: capturedStep.tokensUsed ?? 0,
      costUsd: capturedStep.costUsd ?? 0,
      traceId: runId,
      metadata: {
        replay: true,
        runId,
        stepId: capturedStep.stepId,
        stepName: capturedStep.stepName,
        toolId: capturedStep.toolId,
        retryCount: capturedStep.retryCount ?? 0,
      },
    };
  };

  return runEvalSuite(suite, executor, {
    runId: `replay-eval:${randomUUID()}`,
    triggeredBy: options?.triggeredBy ?? 'replay-eval',
    onCaseComplete: options?.onCaseComplete,
    metadata: { originalRunId: runId, objective: manifest.objective },
  });
}
