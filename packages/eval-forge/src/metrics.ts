import type { EvalCaseResult, EvalForgeMetrics } from "./types.js";

function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(Math.floor(sorted.length * pct), sorted.length - 1)]!;
}

export function computeCorrectnessMetrics(results: EvalCaseResult[]): EvalForgeMetrics["correctness"] {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const avgScore = total > 0 ? results.reduce((s, r) => s + r.score, 0) / total : 0;
  return {
    passRate: total > 0 ? passed / total : 0,
    avgScore,
    passed,
    failed: total - passed,
    total,
  };
}

export function computeEvidenceQualityMetrics(results: EvalCaseResult[]): EvalForgeMetrics["evidenceQuality"] {
  let totalCitations = 0;
  let citationCoverage = 0;
  let citationAccuracy = 0;
  let sourceVerified = 0;
  let count = 0;

  for (const r of results) {
    const out = r.output;
    const gt = r.groundTruth;
    const citations = Array.isArray(out.citations) ? out.citations.length :
      typeof out.citationCount === "number" ? out.citationCount : 0;
    const expectedCitations = typeof gt.minCitations === "number" ? gt.minCitations :
      Array.isArray(gt.citations) ? gt.citations.length : 0;

    totalCitations += citations;
    const coverage = expectedCitations > 0 ? Math.min(1, citations / expectedCitations) : (citations > 0 ? 1 : 0.5);
    citationCoverage += coverage;

    const accurate = typeof out.citationAccuracy === "number" ? out.citationAccuracy :
      typeof r.graderDetails?.citationAccuracy === "number" ? r.graderDetails.citationAccuracy : r.score;
    citationAccuracy += accurate;

    const verified = out.sourceVerified === true ? 1 : (typeof out.sourceVerifiedCount === "number" ? out.sourceVerifiedCount : 0);
    sourceVerified += verified;
    count++;
  }

  const n = count || 1;
  const score = (citationCoverage / n) * 0.4 + (citationAccuracy / n) * 0.4 + Math.min(1, sourceVerified / n) * 0.2;

  return {
    citationCoverage: citationCoverage / n,
    citationAccuracy: citationAccuracy / n,
    sourceVerified,
    totalCitations,
    score,
  };
}

export function computeConfidenceCalibration(results: EvalCaseResult[]): EvalForgeMetrics["confidenceCalibration"] {
  if (results.length === 0) {
    return { avgConfidence: 0, calibrationError: 0, overconfidenceRate: 0, underconfidenceRate: 0, brierScore: 0, score: 1 };
  }

  let totalConf = 0;
  let brierSum = 0;
  let overconfident = 0;
  let underconfident = 0;

  for (const r of results) {
    const conf = typeof r.output.confidence === "number" ? r.output.confidence :
      typeof r.graderDetails?.confidence === "number" ? r.graderDetails.confidence : r.score;
    const outcome = r.passed ? 1 : 0;

    totalConf += conf;
    brierSum += (conf - outcome) ** 2;

    if (conf > 0.8 && !r.passed) overconfident++;
    if (conf < 0.4 && r.passed) underconfident++;
  }

  const n = results.length;
  const avgConf = totalConf / n;
  const brierScore = brierSum / n;
  const calibrationError = Math.abs(avgConf - results.filter((r) => r.passed).length / n);
  const score = Math.max(0, 1 - brierScore);

  return {
    avgConfidence: avgConf,
    calibrationError,
    overconfidenceRate: overconfident / n,
    underconfidenceRate: underconfident / n,
    brierScore,
    score,
  };
}

export function computeLatencyMetrics(results: EvalCaseResult[]): EvalForgeMetrics["latency"] {
  if (results.length === 0) {
    return { avgLatencyMs: 0, p50LatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, maxLatencyMs: 0 };
  }
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  return {
    avgLatencyMs: avg,
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    p99LatencyMs: percentile(latencies, 0.99),
    maxLatencyMs: latencies[latencies.length - 1]!,
  };
}

export function computeCostMetrics(results: EvalCaseResult[], successfulOutcomes: number): EvalForgeMetrics["cost"] {
  if (results.length === 0) {
    return { totalCostUsd: 0, avgCostUsd: 0, costPerOutcome: 0, totalTokensUsed: 0, avgTokensUsed: 0, p95CostUsd: 0 };
  }
  const costs = results.map((r) => r.costUsd).sort((a, b) => a - b);
  const totalCostUsd = costs.reduce((a, b) => a + b, 0);
  const totalTokensUsed = results.reduce((s, r) => s + r.tokensUsed, 0);
  return {
    totalCostUsd,
    avgCostUsd: totalCostUsd / results.length,
    costPerOutcome: successfulOutcomes > 0 ? totalCostUsd / successfulOutcomes : totalCostUsd,
    totalTokensUsed,
    avgTokensUsed: totalTokensUsed / results.length,
    p95CostUsd: percentile(costs, 0.95),
  };
}

export function computeInterventionValueMetrics(results: EvalCaseResult[]): EvalForgeMetrics["interventionValue"] {
  let interventions = 0;
  let improvementSum = 0;

  for (const r of results) {
    const intervened = r.graderDetails?.intervened === true ||
      r.tags?.includes("intervened") ||
      (r.output.interventionApplied === true);
    if (intervened) {
      interventions++;
      const improvement = typeof r.graderDetails?.improvementDelta === "number"
        ? r.graderDetails.improvementDelta
        : (r.passed ? 0.15 : 0);
      improvementSum += improvement;
    }
  }

  const n = results.length || 1;
  const estimatedValueSaved = improvementSum * 1000;

  return {
    interventions,
    totalDecisions: results.length,
    interventionRate: interventions / n,
    avgImprovementFromIntervention: interventions > 0 ? improvementSum / interventions : 0,
    estimatedValueSaved,
  };
}

export function computeHumanOverrideMetrics(results: EvalCaseResult[]): EvalForgeMetrics["humanOverrideRate"] {
  let overrides = 0;
  const overrideReasons: Record<string, number> = {};

  for (const r of results) {
    const overridden = !r.passed && r.score < 0.5 ||
      r.graderDetails?.humanOverride === true;
    if (overridden) {
      overrides++;
      const reason = r.failureReason ?? "unspecified";
      overrideReasons[reason] = (overrideReasons[reason] ?? 0) + 1;
    }
  }

  const n = results.length || 1;

  return {
    overrides,
    totalDecisions: results.length,
    overrideRate: overrides / n,
    acceptedRate: (results.length - overrides) / n,
    overrideReasons,
  };
}

export function computeRollbackMetrics(results: EvalCaseResult[]): EvalForgeMetrics["rollbackRate"] {
  let rollbacks = 0;
  let rollbackLatencySum = 0;
  const rollbackReasons: Record<string, number> = {};

  for (const r of results) {
    const rolledBack = r.output.rolledBack === true ||
      r.graderDetails?.rolledBack === true ||
      r.tags?.includes("rollback");
    if (rolledBack) {
      rollbacks++;
      const latency = typeof r.graderDetails?.rollbackLatencyMs === "number"
        ? r.graderDetails.rollbackLatencyMs : r.latencyMs;
      rollbackLatencySum += latency;
      const reason = r.failureReason ?? "execution-failure";
      rollbackReasons[reason] = (rollbackReasons[reason] ?? 0) + 1;
    }
  }

  const n = results.length || 1;

  return {
    rollbacks,
    totalActions: results.length,
    rollbackRate: rollbacks / n,
    rollbackReasons,
    avgRollbackLatencyMs: rollbacks > 0 ? rollbackLatencySum / rollbacks : 0,
  };
}

export function computePolicyViolationMetrics(results: EvalCaseResult[]): EvalForgeMetrics["policyViolations"] {
  let violations = 0;
  let criticalViolations = 0;
  const violationsByType: Record<string, number> = {};

  for (const r of results) {
    const policies = r.groundTruth.policies as string[] | undefined ?? r.tags?.filter((t) => t.startsWith("policy:")) ?? [];
    const violationDetected = !r.passed && policies.length > 0 ||
      r.graderDetails?.policyViolation === true ||
      r.output.policyViolation !== undefined;

    if (violationDetected) {
      violations++;
      const severity = r.score < 0.3 ? "critical" : "standard";
      if (severity === "critical") criticalViolations++;
      const vType = typeof r.output.policyViolation === "string" ? r.output.policyViolation :
        typeof r.graderDetails?.violationType === "string" ? r.graderDetails.violationType : "general";
      violationsByType[vType] = (violationsByType[vType] ?? 0) + 1;
    }
  }

  const n = results.length || 1;

  return {
    totalChecks: results.length,
    violations,
    violationRate: violations / n,
    criticalViolations,
    violationsByType,
    complianceRate: (results.length - violations) / n,
  };
}

export function computeAllMetrics(results: EvalCaseResult[]): EvalForgeMetrics {
  const correctness = computeCorrectnessMetrics(results);
  return {
    correctness,
    evidenceQuality: computeEvidenceQualityMetrics(results),
    confidenceCalibration: computeConfidenceCalibration(results),
    latency: computeLatencyMetrics(results),
    cost: computeCostMetrics(results, correctness.passed),
    interventionValue: computeInterventionValueMetrics(results),
    humanOverrideRate: computeHumanOverrideMetrics(results),
    rollbackRate: computeRollbackMetrics(results),
    policyViolations: computePolicyViolationMetrics(results),
  };
}

export type {
  EvalForgeMetrics,
};
