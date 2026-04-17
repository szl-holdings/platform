import { getGrader, type GraderType } from "./graders.js";

export interface EvalCase {
  id: string;
  domain: string;
  label: string;
  graderType: GraderType;
  input: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  expectedOutcome?: "pass" | "fail";
  policies?: string[];
  tags?: string[];
  isRedTeam?: boolean;
  weight?: number;
  traceId?: string;
}

export interface EvalSuiteDef {
  suiteId: string;
  name: string;
  description?: string;
  domain: string;
  cases: EvalCase[];
  tags?: string[];
  version?: number;
}

export type EvalExecutor = (
  input: Record<string, unknown>,
  caseId: string,
  domain: string,
) => Promise<{
  output: Record<string, unknown>;
  model?: string;
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  traceId?: string;
  metadata?: Record<string, unknown>;
}>;

export interface EvalCaseResult {
  caseId: string;
  domain: string;
  label: string;
  graderType: GraderType;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  passed: boolean;
  score: number;
  expectedOutcome: "pass" | "fail";
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  model?: string;
  traceId?: string;
  failureReason?: string;
  graderDetails?: Record<string, unknown>;
  tags?: string[];
}

export interface EvalRunReport {
  runId: string;
  suiteId: string;
  suiteName?: string;
  domain?: string;
  model?: string;
  runAt: string;
  triggeredBy: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  totalTokensUsed: number;
  hasRegression?: boolean;
  regressionSeverity?: "none" | "minor" | "major" | "critical";
  regressionNotes?: string[];
  improvementNotes?: string[];
  baselineRunId?: string;
  caseResults: EvalCaseResult[];
  metadata?: Record<string, unknown>;
}

export async function runEvalSuite(
  suite: EvalSuiteDef,
  executor: EvalExecutor,
  options: {
    runId?: string;
    triggeredBy?: string;
    maxConcurrency?: number;
    traceStore?: Map<string, Record<string, unknown>>;
  } = {},
): Promise<EvalRunReport> {
  const {
    runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    triggeredBy = "api",
    maxConcurrency = 5,
    traceStore,
  } = options;

  const runAt = new Date().toISOString();
  const caseResults: EvalCaseResult[] = [];

  const cases = suite.cases;
  for (let i = 0; i < cases.length; i += maxConcurrency) {
    const batch = cases.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(
      batch.map(async (c): Promise<EvalCaseResult> => {
        const expectedOutcome = c.expectedOutcome ?? "pass";
        try {
          const result = await executor(c.input, c.id, c.domain);
          const trace = traceStore?.get(c.traceId ?? result.traceId ?? "");
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
            metadata: { ...result.metadata, trace, humanLabel: result.metadata?.humanLabel, humanScore: result.metadata?.humanScore },
          });
          return {
            caseId: c.id,
            domain: c.domain,
            label: c.label,
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
      }),
    );
    caseResults.push(...batchResults);
  }

  const passed = caseResults.filter((r) => r.passed).length;
  const failed = caseResults.length - passed;
  const passRate = caseResults.length > 0 ? passed / caseResults.length : 0;
  const avgScore = caseResults.length > 0 ? caseResults.reduce((s, r) => s + r.score, 0) / caseResults.length : 0;
  const avgLatencyMs = caseResults.length > 0 ? caseResults.reduce((s, r) => s + r.latencyMs, 0) / caseResults.length : 0;
  const totalCostUsd = caseResults.reduce((s, r) => s + r.costUsd, 0);
  const totalTokensUsed = caseResults.reduce((s, r) => s + r.tokensUsed, 0);

  return {
    runId,
    suiteId: suite.suiteId,
    suiteName: suite.name,
    domain: suite.domain,
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
    caseResults,
  };
}

export function checkRunRegression(
  baseline: EvalRunReport,
  current: EvalRunReport,
  thresholdPct = 5,
): {
  hasRegression: boolean;
  severity: "none" | "minor" | "major" | "critical";
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

  let severity: "none" | "minor" | "major" | "critical" = "none";
  if (regressionNotes.length > 0) {
    if (passRateDelta < -0.15 || regressionNotes.length >= 4) severity = "critical";
    else if (passRateDelta < -0.1 || regressionNotes.length >= 2) severity = "major";
    else severity = "minor";
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
