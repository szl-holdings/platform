import type {
  EvalSuiteReport,
  SideBySideComparison,
  RegressionBaseline,
  RegressionCheckResult,
  EvalDomain,
} from "./types.js";

const regressionBaselines = new Map<string, RegressionBaseline>();

export function compareSuites(reports: EvalSuiteReport[]): SideBySideComparison {
  if (reports.length === 0) {
    throw new Error("At least one report required for comparison");
  }

  const base = reports[0];
  const entries = reports.map(r => ({ model: r.model, report: r }));

  const sorted = [...reports].sort((a, b) => b.passRate - a.passRate);
  const winner = sorted[0]?.model;
  const deltaPassRate =
    reports.length >= 2
      ? (sorted[0]?.passRate ?? 0) - (sorted[sorted.length - 1]?.passRate ?? 0)
      : undefined;
  const deltaLatencyMs =
    reports.length >= 2
      ? (sorted[0]?.avgLatencyMs ?? 0) - (sorted[sorted.length - 1]?.avgLatencyMs ?? 0)
      : undefined;

  return {
    suiteId: `comparison_${Date.now()}`,
    suiteName: base.suiteName,
    domain: base.domain,
    timestamp: new Date().toISOString(),
    entries,
    winner,
    deltaPassRate,
    deltaLatencyMs,
  };
}

export function recordBaseline(report: EvalSuiteReport): RegressionBaseline {
  const baseline: RegressionBaseline = {
    suiteId: report.suiteId,
    model: report.model,
    passRate: report.passRate,
    avgLatencyMs: report.avgLatencyMs,
    avgScore: report.avgScore,
    recordedAt: new Date().toISOString(),
  };
  regressionBaselines.set(`${report.suiteId}:${report.model}`, baseline);
  return baseline;
}

export function checkRegression(
  current: EvalSuiteReport,
  thresholdPct = 5,
): RegressionCheckResult | null {
  const key = `${current.suiteId}:${current.model}`;
  const baseline = regressionBaselines.get(key);
  if (!baseline) return null;

  const passRateDelta = (current.passRate - baseline.passRate) * 100;
  const latencyDelta = current.avgLatencyMs - baseline.avgLatencyMs;
  const scoreDelta = current.avgScore - baseline.avgScore;

  const regressionFields: string[] = [];
  if (passRateDelta < -thresholdPct) regressionFields.push("passRate");
  if (scoreDelta < -(thresholdPct / 100)) regressionFields.push("avgScore");
  if (latencyDelta > baseline.avgLatencyMs * (thresholdPct / 100)) regressionFields.push("latency");

  return {
    suiteId: current.suiteId,
    model: current.model,
    baseline,
    current: {
      passRate: current.passRate,
      avgLatencyMs: current.avgLatencyMs,
      avgScore: current.avgScore,
    },
    passRateDelta,
    latencyDelta,
    scoreDelta,
    regressionDetected: regressionFields.length > 0,
    regressionFields,
  };
}

export function getRegressionBaselines(): RegressionBaseline[] {
  return Array.from(regressionBaselines.values());
}

export function getRegressionDashboard(): {
  baselines: RegressionBaseline[];
  totalTracked: number;
  lastUpdated: string;
} {
  const baselines = getRegressionBaselines();
  return {
    baselines,
    totalTracked: baselines.length,
    lastUpdated: baselines.length > 0
      ? baselines.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0].recordedAt
      : new Date().toISOString(),
  };
}
