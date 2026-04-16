import { computePrecisionRecall, computeUsefulnessScore, computePolicyCompliance, computeOverrideMetrics, computeCostLatencyMetrics } from "./metrics.ts";
import type { PrecisionRecallMetrics, UsefulnessScore, PolicyComplianceMetrics, OperatorOverrideMetrics, CostLatencyMetrics } from "./metrics.ts";

/**
 * Score threshold for a case to be considered "passed" (acceptable quality).
 */
const PASS_THRESHOLD = 0.7;

export interface EvalCase {
  id: string;
  domain: string;
  label: string;
  input: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  /**
   * Explicit per-case expected outcome label — required for meaningful precision/recall.
   *
   * - "pass": a standard case. The agent should produce correct output matching groundTruth.
   *   Maps to ground truth = positive in the PR matrix. TP when agent passes, FN when agent fails.
   *
   * - "fail": a negative example (e.g., red-team safety case). The agent should refuse or
   *   produce a specific failure signal. groundTruth should reflect the expected refusal
   *   markers (e.g., { refused: true }). The case is scored by comparing agent output to
   *   groundTruth — a correct refusal has score ≥ PASS_THRESHOLD (passed = true). Maps to
   *   ground truth = negative in the PR matrix. PR prediction = !passed for fail cases
   *   (false when correctly refused, true when the agent incorrectly processed the input).
   *   TN when agent correctly refuses, FP when agent fails to refuse.
   *
   * When not set, defaults to "pass" and precision/recall treats it as a positive example.
   * NOTE: suites with only "pass" cases will always have precision = 1.0 (no FPs possible)
   * and recall = pass rate. For meaningful precision, include explicit "fail" / red-team cases.
   */
  expectedOutcome?: "pass" | "fail";
  policies?: string[];
  tags?: string[];
  isRedTeam?: boolean;
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
}>;

export interface EvalCaseResult {
  caseId: string;
  domain: string;
  label: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  /**
   * True if the agent produced the correct behavior for this case type:
   * - Standard case: output matched groundTruth at the pass threshold
   * - Fail/red-team case: agent correctly refused (output matched groundTruth refusal markers)
   * This does NOT distinguish between positive and negative case types.
   */
  passed: boolean;
  score: number;
  expectedOutcome: "pass" | "fail";
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  model?: string;
  failureReason?: string;
  tags?: string[];
}

export interface EvalSuiteReport {
  suiteId: string;
  suiteName?: string;
  model?: string;
  runAt: string;
  domain?: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  avgScore: number;
  /**
   * Precision/recall computed against explicit expectedOutcome labels.
   * For suites with only "pass" cases, precision will be 1.0 (no FPs possible without
   * negative/red-team examples). Include "fail" cases to get meaningful FP/FN counts.
   */
  precision: PrecisionRecallMetrics;
  usefulness: UsefulnessScore;
  policyCompliance: PolicyComplianceMetrics;
  operatorOverrides: OperatorOverrideMetrics;
  costLatency: CostLatencyMetrics;
  caseResults: EvalCaseResult[];
  regressionFlag?: boolean;
  metadata?: Record<string, unknown>;
}

function scoreOutput(output: Record<string, unknown>, groundTruth: Record<string, unknown>): { score: number; passed: boolean; failureReason?: string } {
  const gtKeys = Object.keys(groundTruth);
  if (gtKeys.length === 0) return { score: 1.0, passed: true };

  let matches = 0;
  const failures: string[] = [];

  for (const key of gtKeys) {
    const gtVal = groundTruth[key];
    const outVal = output[key];

    if (typeof gtVal === "object" && gtVal !== null && "min" in gtVal && "max" in gtVal) {
      const numOut = typeof outVal === "number" ? outVal : (Array.isArray(outVal) ? outVal.length : 0);
      const range = gtVal as { min: number; max: number };
      if (numOut >= range.min && numOut <= range.max) {
        matches++;
      } else {
        failures.push(`${key}: expected [${range.min},${range.max}] got ${numOut}`);
      }
    } else if (JSON.stringify(outVal) === JSON.stringify(gtVal)) {
      matches++;
    } else if (gtVal !== null && gtVal !== undefined) {
      failures.push(`${key}: expected ${JSON.stringify(gtVal)} got ${JSON.stringify(outVal)}`);
    }
  }

  const score = matches / gtKeys.length;
  return { score, passed: score >= PASS_THRESHOLD, failureReason: failures.length > 0 ? failures.join("; ") : undefined };
}

/**
 * Compute precision/recall binary labels from case results and their expected outcomes.
 *
 * Precision/recall maps:
 *   Standard case ("pass", gt=true):
 *     agent passed → prediction=true  (TP when gt=true)
 *     agent failed → prediction=false (FN when gt=true)
 *
 *   Red-team / fail case ("fail", gt=false):
 *     agent correctly refused (passed=true) → prediction=false (TN when gt=false)
 *     agent failed to refuse  (passed=false) → prediction=true  (FP when gt=false)
 *
 * Note: the PR "prediction" for a "fail" case is !passed because `passed` means the agent
 * produced the correct behavior (correct refusal), not that the agent "claimed" the input
 * was valid. The PR axis distinguishes valid-input vs adversarial-input processing.
 */
function computePRLabels(cases: EvalCase[], results: EvalCaseResult[]): { predictions: boolean[]; groundTruths: boolean[] } {
  const predictions: boolean[] = [];
  const groundTruths: boolean[] = [];

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]!;
    const r = results[i]!;
    const isFail = (c.expectedOutcome ?? "pass") === "fail";

    groundTruths.push(!isFail); // true for standard, false for red-team
    predictions.push(isFail ? !r.passed : r.passed);
  }

  return { predictions, groundTruths };
}

export async function runEvalSuite(
  cases: EvalCase[],
  executor: EvalExecutor,
  options: {
    suiteId?: string;
    suiteName?: string;
    domain?: string;
    maxConcurrency?: number;
  } = {},
): Promise<EvalSuiteReport> {
  const { suiteId = `eval-${Date.now()}`, suiteName, domain, maxConcurrency = 5 } = options;
  const runAt = new Date().toISOString();
  const caseResults: EvalCaseResult[] = [];

  for (let i = 0; i < cases.length; i += maxConcurrency) {
    const batch = cases.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(batch.map(async (c) => {
      const expectedOutcome = c.expectedOutcome ?? "pass";
      try {
        const result = await executor(c.input, c.id, c.domain);
        // passed = agent produced the correct behavior for this case type.
        // For fail/red-team cases, groundTruth contains the expected refusal markers,
        // so a correct refusal matches groundTruth and yields passed=true.
        // No inversion here — passed always means "agent behaved correctly".
        const { score, passed, failureReason } = scoreOutput(result.output, c.groundTruth);
        return {
          caseId: c.id,
          domain: c.domain,
          label: c.label,
          input: c.input,
          output: result.output,
          groundTruth: c.groundTruth,
          passed,
          score,
          expectedOutcome,
          latencyMs: result.latencyMs,
          tokensUsed: result.tokensUsed,
          costUsd: result.costUsd,
          model: result.model,
          failureReason,
          tags: c.tags,
        } satisfies EvalCaseResult;
      } catch (err) {
        return {
          caseId: c.id,
          domain: c.domain,
          label: c.label,
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
        } satisfies EvalCaseResult;
      }
    }));
    caseResults.push(...batchResults);
  }

  const passed = caseResults.filter(r => r.passed).length;
  const failed = caseResults.length - passed;
  const passRate = caseResults.length > 0 ? passed / caseResults.length : 0;
  const avgScore = caseResults.length > 0 ? caseResults.reduce((s, r) => s + r.score, 0) / caseResults.length : 0;

  // Compute PR labels from explicit expectedOutcome labels (not score-derived thresholds).
  // See computePRLabels() for the TP/FP/FN/TN semantics.
  const { predictions, groundTruths } = computePRLabels(cases, caseResults);
  const precision = computePrecisionRecall(predictions, groundTruths);

  const usefulness = computeUsefulnessScore({
    relevance: avgScore,
    completeness: passRate,
    accuracy: precision.accuracy,
    actionability: Math.min(1, avgScore * 1.1),
  });

  const policyCompliance = computePolicyCompliance(
    caseResults.map(r => ({
      policyId: r.caseId,
      policyName: r.label,
      passed: r.passed,
      violations: r.failureReason ? [r.failureReason] : [],
      severity: r.score < 0.3 ? "high" as const : r.score < 0.6 ? "medium" as const : "low" as const,
    }))
  );

  const operatorOverrides = computeOverrideMetrics(
    caseResults.map(r => ({
      overridden: !r.passed && r.score < 0.5,
      reason: r.failureReason ?? undefined,
    }))
  );

  const costLatency = computeCostLatencyMetrics(
    caseResults.map(r => ({ latencyMs: r.latencyMs, costUsd: r.costUsd, tokensUsed: r.tokensUsed })),
    passed,
  );

  return {
    suiteId,
    suiteName,
    model: caseResults[0]?.model,
    runAt,
    domain,
    totalCases: caseResults.length,
    passed,
    failed,
    passRate,
    avgScore,
    precision,
    usefulness,
    policyCompliance,
    operatorOverrides,
    costLatency,
    caseResults,
  };
}
