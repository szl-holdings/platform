import type { EvalSuiteReport } from "./runner.ts";

export interface BaselineRecord {
  suiteId: string;
  model?: string;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  recordedAt: string;
  version: string;
}

export interface RegressionResult {
  suiteId: string;
  model?: string;
  hasRegression: boolean;
  passRateDelta: number;
  avgScoreDelta: number;
  latencyDelta: number;
  costDelta: number;
  regressions: string[];
  improvements: string[];
  severity: "none" | "minor" | "major" | "critical";
  comparedTo: BaselineRecord;
  checkedAt: string;
}

export interface RegressionDashboard {
  totalSuites: number;
  suitesWithRegression: number;
  recentRuns: Array<{
    suiteId: string;
    hasRegression: boolean;
    severity: RegressionResult["severity"];
    passRateDelta: number;
    checkedAt: string;
  }>;
  generatedAt: string;
}

const baselineStore = new Map<string, BaselineRecord>();
const regressionHistory: RegressionResult[] = [];

export function recordBaseline(report: EvalSuiteReport): BaselineRecord {
  const baseline: BaselineRecord = {
    suiteId: report.suiteId,
    model: report.model,
    passRate: report.passRate,
    avgScore: report.avgScore,
    avgLatencyMs: report.costLatency.avgLatencyMs,
    totalCostUsd: report.costLatency.totalCostUsd,
    recordedAt: new Date().toISOString(),
    version: "1.0",
  };
  const key = `${report.suiteId}:${report.model ?? "default"}`;
  baselineStore.set(key, baseline);
  return baseline;
}

export function getBaseline(suiteId: string, model?: string): BaselineRecord | undefined {
  const key = `${suiteId}:${model ?? "default"}`;
  return baselineStore.get(key);
}

export function checkRegression(
  report: EvalSuiteReport,
  thresholdPct: number = 5,
): RegressionResult | null {
  const key = `${report.suiteId}:${report.model ?? "default"}`;
  const baseline = baselineStore.get(key);
  if (!baseline) return null;

  const threshold = thresholdPct / 100;
  const passRateDelta = report.passRate - baseline.passRate;
  const avgScoreDelta = report.avgScore - baseline.avgScore;
  const latencyDelta = report.costLatency.avgLatencyMs - baseline.avgLatencyMs;
  const costDelta = report.costLatency.totalCostUsd - baseline.totalCostUsd;

  const regressions: string[] = [];
  const improvements: string[] = [];

  if (passRateDelta < -threshold) regressions.push(`Pass rate dropped ${(passRateDelta * 100).toFixed(1)}%`);
  else if (passRateDelta > threshold) improvements.push(`Pass rate improved ${(passRateDelta * 100).toFixed(1)}%`);

  if (avgScoreDelta < -threshold) regressions.push(`Avg score dropped ${(avgScoreDelta * 100).toFixed(1)}%`);
  else if (avgScoreDelta > threshold) improvements.push(`Avg score improved ${(avgScoreDelta * 100).toFixed(1)}%`);

  if (latencyDelta > baseline.avgLatencyMs * 0.2) regressions.push(`Latency increased ${latencyDelta.toFixed(0)}ms`);
  else if (latencyDelta < -baseline.avgLatencyMs * 0.1) improvements.push(`Latency improved ${Math.abs(latencyDelta).toFixed(0)}ms`);

  if (costDelta > baseline.totalCostUsd * 0.3) regressions.push(`Cost increased $${costDelta.toFixed(4)}`);

  let severity: RegressionResult["severity"] = "none";
  if (regressions.length > 0) {
    if (passRateDelta < -0.15 || regressions.length >= 3) severity = "critical";
    else if (passRateDelta < -0.1 || regressions.length >= 2) severity = "major";
    else severity = "minor";
  }

  const result: RegressionResult = {
    suiteId: report.suiteId,
    model: report.model,
    hasRegression: regressions.length > 0,
    passRateDelta,
    avgScoreDelta,
    latencyDelta,
    costDelta,
    regressions,
    improvements,
    severity,
    comparedTo: baseline,
    checkedAt: new Date().toISOString(),
  };

  regressionHistory.push(result);
  return result;
}

export function getRegressionDashboard(): RegressionDashboard {
  const suitesWithRegression = new Set(
    regressionHistory.filter(r => r.hasRegression).map(r => r.suiteId)
  ).size;

  return {
    totalSuites: baselineStore.size,
    suitesWithRegression,
    recentRuns: regressionHistory.slice(-20).reverse().map(r => ({
      suiteId: r.suiteId,
      hasRegression: r.hasRegression,
      severity: r.severity,
      passRateDelta: r.passRateDelta,
      checkedAt: r.checkedAt,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export function listBaselines(): BaselineRecord[] {
  return Array.from(baselineStore.values());
}
