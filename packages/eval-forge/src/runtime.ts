import { getGrader } from './graders.js';
import { computeAllMetrics } from './metrics.js';
import type {
  EvalCase,
  EvalCaseResult,
  EvalExecutor,
  EvalRunReport,
  EvalSuiteDef,
} from './types.js';

export type { EvalCase, EvalCaseResult, EvalExecutor, EvalRunReport, EvalSuiteDef };

/**
 * Persistence sink invoked by `runEvalSuite` after each completed run.
 * Wired by `persistence-init.ts` so that every eval run — regardless of
 * caller — lands in `eval_runs`/`eval_scores` automatically. Errors in the
 * sink are swallowed so eval execution is never blocked by persistence
 * failures.
 */
export type EvalRunSink = (report: EvalRunReport) => void | Promise<void>;

let evalRunSink: EvalRunSink | null = null;

export function registerEvalRunSink(sink: EvalRunSink | null): void {
  evalRunSink = sink;
}

export function getEvalRunSink(): EvalRunSink | null {
  return evalRunSink;
}

export async function runEvalSuite(
  suite: EvalSuiteDef,
  executor: EvalExecutor,
  options: {
    runId?: string;
    triggeredBy?: string;
    maxConcurrency?: number;
    traceStore?: Map<string, Record<string, unknown>>;
    onCaseComplete?: (
      result: EvalCaseResult,
      progress: { completed: number; total: number },
    ) => void | Promise<void>;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<EvalRunReport> {
  const {
    runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    triggeredBy = 'api',
    maxConcurrency = 5,
    traceStore,
    onCaseComplete,
    metadata: extraMetadata,
  } = options;

  const runAt = new Date().toISOString();
  const totalCount = suite.cases.length;
  // Pre-allocate so we can write each case into its original index, preserving
  // suite order in the report regardless of completion order.
  const caseResults: EvalCaseResult[] = new Array(totalCount);
  let completedCount = 0;

  const runOne = async (c: EvalCase): Promise<EvalCaseResult> => {
    const expectedOutcome = c.expectedOutcome ?? 'pass';
    try {
      const result = await executor(c.input, c.id, c.domain);
      const trace = traceStore?.get(c.traceId ?? result.traceId ?? '');
      const grader = getGrader(c.graderType);
      const graderResult = await grader({
        graderType: c.graderType,
        caseId: c.id,
        domain: c.domain,
        input: c.input,
        output: result.output,
        groundTruth: c.groundTruth,
        latencyMs: result.latencyMs,
        costUsd: result.costUsd,
        tokensUsed: result.tokensUsed,
        traceId: c.traceId ?? result.traceId,
        model: result.model,
        metadata: {
          ...result.metadata,
          trace,
          humanLabel: result.metadata?.humanLabel,
          humanScore: result.metadata?.humanScore,
        },
      });
      return {
        caseId: c.id,
        domain: c.domain,
        label: c.label,
        evalType: c.evalType,
        graderType: c.graderType,
        input: c.input,
        output: result.output,
        groundTruth: c.groundTruth,
        passed: graderResult.passed,
        score: graderResult.score,
        expectedOutcome,
        latencyMs: result.latencyMs,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
        model: result.model,
        traceId: c.traceId ?? result.traceId,
        failureReason: graderResult.failureReason,
        graderDetails: graderResult.details,
        tags: c.tags,
      };
    } catch (err) {
      return {
        caseId: c.id,
        domain: c.domain,
        label: c.label,
        evalType: c.evalType,
        graderType: c.graderType,
        input: c.input,
        output: {},
        groundTruth: c.groundTruth,
        passed: false,
        score: 0,
        expectedOutcome,
        latencyMs: 0,
        tokensUsed: 0,
        costUsd: 0,
        failureReason: err instanceof Error ? err.message : String(err),
        tags: c.tags,
      };
    }
  };

  // Worker-pool scheduler: keeps `maxConcurrency` cases running at a time and
  // fires `onCaseComplete` the moment each individual case finishes, instead
  // of waiting for the whole batch to settle. This is what gives the SSE
  // stream its true real-time feel (a slow case no longer blocks fast ones
  // in the same batch from being reported).
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(maxConcurrency, totalCount));
  const workers: Promise<void>[] = [];
  for (let w = 0; w < workerCount; w++) {
    workers.push(
      (async () => {
        while (true) {
          const idx = nextIndex++;
          if (idx >= totalCount) return;
          const c = suite.cases[idx]!;
          const result = await runOne(c);
          caseResults[idx] = result;
          if (onCaseComplete) {
            completedCount += 1;
            try {
              await onCaseComplete(result, { completed: completedCount, total: totalCount });
            } catch {
              // Progress callbacks must never block eval execution.
            }
          }
        }
      })(),
    );
  }
  await Promise.all(workers);

  const passed = caseResults.filter((r) => r.passed).length;
  const failed = caseResults.length - passed;
  const passRate = caseResults.length > 0 ? passed / caseResults.length : 0;
  const avgScore =
    caseResults.length > 0 ? caseResults.reduce((s, r) => s + r.score, 0) / caseResults.length : 0;
  const avgLatencyMs =
    caseResults.length > 0
      ? caseResults.reduce((s, r) => s + r.latencyMs, 0) / caseResults.length
      : 0;
  const totalCostUsd = caseResults.reduce((s, r) => s + r.costUsd, 0);
  const totalTokensUsed = caseResults.reduce((s, r) => s + r.tokensUsed, 0);
  const metrics = computeAllMetrics(caseResults);

  const report: EvalRunReport = {
    runId,
    suiteId: suite.suiteId,
    suiteName: suite.name,
    domain: suite.domain,
    evalType: suite.evalType,
    model: caseResults.find((r) => r.model)?.model,
    runAt,
    triggeredBy,
    totalCases: caseResults.length,
    passed,
    failed,
    passRate,
    avgScore,
    avgLatencyMs,
    totalCostUsd,
    totalTokensUsed,
    metrics,
    caseResults,
    ...(extraMetadata ? { metadata: extraMetadata } : {}),
  };

  if (evalRunSink) {
    try {
      const result = evalRunSink(report);
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch(() => {});
      }
    } catch {
      // Persistence is best-effort; never fail an eval run because of it.
    }
  }

  return report;
}

export function checkRunRegression(
  baseline: EvalRunReport,
  current: EvalRunReport,
  thresholdPct = 5,
): {
  hasRegression: boolean;
  severity: 'none' | 'minor' | 'major' | 'critical';
  regressionNotes: string[];
  improvementNotes: string[];
  passRateDelta: number;
  avgScoreDelta: number;
  latencyDelta: number;
  costDelta: number;
} {
  const threshold = thresholdPct / 100;
  const passRateDelta = current.passRate - baseline.passRate;
  const avgScoreDelta = current.avgScore - baseline.avgScore;
  const latencyDelta = current.avgLatencyMs - baseline.avgLatencyMs;
  const costDelta = current.totalCostUsd - baseline.totalCostUsd;

  const regressionNotes: string[] = [];
  const improvementNotes: string[] = [];

  if (passRateDelta < -threshold)
    regressionNotes.push(`Pass rate dropped ${(passRateDelta * 100).toFixed(1)}%`);
  else if (passRateDelta > threshold)
    improvementNotes.push(`Pass rate improved ${(passRateDelta * 100).toFixed(1)}%`);

  if (avgScoreDelta < -threshold)
    regressionNotes.push(`Avg score dropped ${(avgScoreDelta * 100).toFixed(1)}%`);
  else if (avgScoreDelta > threshold)
    improvementNotes.push(`Avg score improved ${(avgScoreDelta * 100).toFixed(1)}%`);

  if (baseline.avgLatencyMs > 0 && latencyDelta > baseline.avgLatencyMs * 0.2)
    regressionNotes.push(`Latency increased ${latencyDelta.toFixed(0)}ms`);
  else if (baseline.avgLatencyMs > 0 && latencyDelta < -baseline.avgLatencyMs * 0.1)
    improvementNotes.push(`Latency improved ${Math.abs(latencyDelta).toFixed(0)}ms`);

  if (baseline.totalCostUsd > 0 && costDelta > baseline.totalCostUsd * 0.3)
    regressionNotes.push(`Cost increased $${costDelta.toFixed(4)}`);

  for (const cur of current.caseResults) {
    const base = baseline.caseResults.find((r) => r.caseId === cur.caseId);
    if (base?.passed && !cur.passed)
      regressionNotes.push(`Case "${cur.label}" regressed from pass to fail`);
  }

  let severity: 'none' | 'minor' | 'major' | 'critical' = 'none';
  if (regressionNotes.length > 0) {
    if (passRateDelta < -0.15 || regressionNotes.length >= 4) severity = 'critical';
    else if (passRateDelta < -0.1 || regressionNotes.length >= 2) severity = 'major';
    else severity = 'minor';
  }

  return {
    hasRegression: regressionNotes.length > 0,
    severity,
    regressionNotes,
    improvementNotes,
    passRateDelta,
    avgScoreDelta,
    latencyDelta,
    costDelta,
  };
}
