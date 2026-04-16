import type { EvalSuiteReport } from "./runner.ts";

export interface SuiteComparison {
  suiteIds: string[];
  winner?: string;
  metrics: {
    passRate: Record<string, number>;
    avgScore: Record<string, number>;
    avgLatencyMs: Record<string, number>;
    avgCostUsd: Record<string, number>;
    f1Score: Record<string, number>;
    policyComplianceRate: Record<string, number>;
    overrideRate: Record<string, number>;
  };
  deltas: {
    passRate: number;
    avgScore: number;
    avgLatencyMs: number;
    avgCostUsd: number;
    f1Score: number;
  };
  recommendation: string;
  comparedAt: string;
}

export function compareSuites(reports: EvalSuiteReport[]): SuiteComparison {
  if (reports.length === 0) throw new Error("At least one report required");

  const metrics: SuiteComparison["metrics"] = {
    passRate: {}, avgScore: {}, avgLatencyMs: {}, avgCostUsd: {}, f1Score: {}, policyComplianceRate: {}, overrideRate: {},
  };

  for (const r of reports) {
    const key = r.suiteName ?? r.suiteId;
    metrics.passRate[key] = r.passRate;
    metrics.avgScore[key] = r.avgScore;
    metrics.avgLatencyMs[key] = r.costLatency.avgLatencyMs;
    metrics.avgCostUsd[key] = r.costLatency.avgCostUsd;
    metrics.f1Score[key] = r.precision.f1Score;
    metrics.policyComplianceRate[key] = r.policyCompliance.complianceRate;
    metrics.overrideRate[key] = r.operatorOverrides.overrideRate;
  }

  let winner: string | undefined;
  if (reports.length >= 2) {
    const scores = reports.map(r => {
      const key = r.suiteName ?? r.suiteId;
      return {
        key,
        composite: (metrics.passRate[key] ?? 0) * 0.4 + (metrics.avgScore[key] ?? 0) * 0.3 + (metrics.f1Score[key] ?? 0) * 0.2 + (1 - (metrics.overrideRate[key] ?? 0)) * 0.1,
      };
    });
    scores.sort((a, b) => b.composite - a.composite);
    winner = scores[0]?.key;
  }

  const keys = Object.keys(metrics.passRate);
  const vals = (m: Record<string, number>) => Object.values(m);
  const deltas = reports.length >= 2 ? {
    passRate: Math.max(...vals(metrics.passRate)) - Math.min(...vals(metrics.passRate)),
    avgScore: Math.max(...vals(metrics.avgScore)) - Math.min(...vals(metrics.avgScore)),
    avgLatencyMs: Math.max(...vals(metrics.avgLatencyMs)) - Math.min(...vals(metrics.avgLatencyMs)),
    avgCostUsd: Math.max(...vals(metrics.avgCostUsd)) - Math.min(...vals(metrics.avgCostUsd)),
    f1Score: Math.max(...vals(metrics.f1Score)) - Math.min(...vals(metrics.f1Score)),
  } : { passRate: 0, avgScore: 0, avgLatencyMs: 0, avgCostUsd: 0, f1Score: 0 };

  let recommendation = "Single suite — no comparison available.";
  if (reports.length >= 2 && winner) {
    const winnerPassRate = (metrics.passRate[winner] ?? 0) * 100;
    recommendation = `"${winner}" is the recommended strategy with ${winnerPassRate.toFixed(1)}% pass rate and the highest composite score.`;
    if (deltas.passRate < 0.05) {
      recommendation += " Suites are closely matched — consider cost and latency as tiebreakers.";
    }
  }

  return {
    suiteIds: keys,
    winner,
    metrics,
    deltas,
    recommendation,
    comparedAt: new Date().toISOString(),
  };
}

export interface AgentRegressionRate {
  agentId: string;
  domain: string;
  baselinePassRate: number;
  currentPassRate: number;
  regressionRate: number;
  trend: "improving" | "stable" | "degrading";
}

export function computeAgentRegressionRate(
  baseline: { passRate: number },
  current: { passRate: number },
  agentId: string,
  domain: string,
): AgentRegressionRate {
  const delta = current.passRate - baseline.passRate;
  const regressionRate = Math.max(0, -delta);
  const trend = delta > 0.05 ? "improving" : delta < -0.05 ? "degrading" : "stable";
  return {
    agentId,
    domain,
    baselinePassRate: baseline.passRate,
    currentPassRate: current.passRate,
    regressionRate,
    trend,
  };
}
