export interface PrecisionRecallMetrics {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
}

export function computePrecisionRecall(
  predictions: boolean[],
  groundTruths: boolean[],
): PrecisionRecallMetrics {
  if (predictions.length !== groundTruths.length) {
    throw new Error("Predictions and ground truths must have the same length");
  }

  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i]!;
    const gt = groundTruths[i]!;
    if (pred && gt) tp++;
    else if (pred && !gt) fp++;
    else if (!pred && gt) fn++;
    else tn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  const accuracy = predictions.length > 0 ? (tp + tn) / predictions.length : 0;

  return { truePositives: tp, falsePositives: fp, falseNegatives: fn, trueNegatives: tn, precision, recall, f1Score, accuracy };
}

export interface UsefulnessScore {
  relevance: number;
  completeness: number;
  accuracy: number;
  actionability: number;
  composite: number;
}

export function computeUsefulnessScore(scores: Omit<UsefulnessScore, "composite">): UsefulnessScore {
  const weights = { relevance: 0.3, completeness: 0.2, accuracy: 0.35, actionability: 0.15 };
  const composite =
    scores.relevance * weights.relevance +
    scores.completeness * weights.completeness +
    scores.accuracy * weights.accuracy +
    scores.actionability * weights.actionability;
  return { ...scores, composite };
}

export interface PolicyComplianceResult {
  policyId: string;
  policyName: string;
  passed: boolean;
  violations: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface PolicyComplianceMetrics {
  totalPolicies: number;
  passed: number;
  failed: number;
  complianceRate: number;
  violations: PolicyComplianceResult[];
  criticalViolations: number;
}

export function computePolicyCompliance(results: PolicyComplianceResult[]): PolicyComplianceMetrics {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const complianceRate = results.length > 0 ? passed / results.length : 1;
  const criticalViolations = results.filter(r => !r.passed && r.severity === "critical").length;
  return {
    totalPolicies: results.length,
    passed,
    failed,
    complianceRate,
    violations: results.filter(r => !r.passed),
    criticalViolations,
  };
}

export interface OperatorOverrideMetrics {
  totalDecisions: number;
  overridden: number;
  accepted: number;
  overrideRate: number;
  overrideReasons: Record<string, number>;
}

export function computeOverrideMetrics(
  decisions: Array<{ overridden: boolean; reason?: string }>,
): OperatorOverrideMetrics {
  const overridden = decisions.filter(d => d.overridden).length;
  const accepted = decisions.length - overridden;
  const overrideRate = decisions.length > 0 ? overridden / decisions.length : 0;
  const overrideReasons: Record<string, number> = {};
  for (const d of decisions) {
    if (d.overridden && d.reason) {
      overrideReasons[d.reason] = (overrideReasons[d.reason] ?? 0) + 1;
    }
  }
  return { totalDecisions: decisions.length, overridden, accepted, overrideRate, overrideReasons };
}

export interface CostLatencyMetrics {
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  totalCostUsd: number;
  avgCostUsd: number;
  costPerOutcome: number;
  totalTokensUsed: number;
  avgTokensUsed: number;
}

export function computeCostLatencyMetrics(
  samples: Array<{ latencyMs: number; costUsd: number; tokensUsed: number }>,
  successfulOutcomes: number,
): CostLatencyMetrics {
  if (samples.length === 0) {
    return { avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, totalCostUsd: 0, avgCostUsd: 0, costPerOutcome: 0, totalTokensUsed: 0, avgTokensUsed: 0 };
  }

  const latencies = samples.map(s => s.latencyMs).sort((a, b) => a - b);
  const p = (arr: number[], pct: number) => arr[Math.floor(arr.length * pct)] ?? arr[arr.length - 1]!;

  const totalCostUsd = samples.reduce((sum, s) => sum + s.costUsd, 0);
  const totalTokensUsed = samples.reduce((sum, s) => sum + s.tokensUsed, 0);

  return {
    avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    p50LatencyMs: p(latencies, 0.5),
    p95LatencyMs: p(latencies, 0.95),
    p99LatencyMs: p(latencies, 0.99),
    totalCostUsd,
    avgCostUsd: totalCostUsd / samples.length,
    costPerOutcome: successfulOutcomes > 0 ? totalCostUsd / successfulOutcomes : totalCostUsd,
    totalTokensUsed,
    avgTokensUsed: totalTokensUsed / samples.length,
  };
}
