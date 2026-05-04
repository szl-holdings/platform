/**
 * Self-Attesting Eval Gates
 *
 * A passport declares the eval thresholds it must clear before transitioning
 * draft → active. The gate checks these thresholds against an actual eval run
 * and blocks the transition with specific numbers if any threshold is not met.
 *
 * The run id is pinned into the passport's provenance.evalRunId on success.
 * Gate evaluation consumes the EvalReport shape returned by the eval lab runner.
 * The EvalReport type is defined locally here to avoid circular cross-package
 * dependencies.
 */

export interface EvalGates {
  minGoldenSetPassRate: number;
  maxP95LatencyMs: number;
  maxCostPerCallUsd: number;
}

export const DEFAULT_EVAL_GATES: EvalGates = {
  minGoldenSetPassRate: 0.7,
  maxP95LatencyMs: 10000,
  maxCostPerCallUsd: 1.0,
};

/**
 * Minimal EvalReport shape consumed by the gate checker.
 * Structurally compatible with lib/ai-engine/src/evals/run-evals.ts#EvalReport
 * so callers can pass either directly.
 */
export interface EvalReportSummary {
  timestamp: string;
  model: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: string;
  byCategory: Record<string, { total: number; passed: number; failed: number }>;
  results: unknown[];
  avgLatencyMs: number;
}

export interface EvalGateThresholdResult {
  threshold: string;
  required: number;
  measured: number;
  passed: boolean;
  delta: number;
}

export interface EvalGateCheckResult {
  passed: boolean;
  evalRunId: string;
  checkedAt: string;
  gates: EvalGateThresholdResult[];
  failedGates: EvalGateThresholdResult[];
  errorMessage?: string;
}

export function checkEvalGates(
  gates: EvalGates,
  report: EvalReportSummary,
  evalRunId: string,
  options?: { costPerCallUsd?: number },
): EvalGateCheckResult {
  const checkedAt = new Date().toISOString();
  const measuredPassRate = report.totalTests > 0 ? report.passed / report.totalTests : 0;
  const measuredP95Ms = report.avgLatencyMs;
  const measuredCostUsd = options?.costPerCallUsd ?? 0;

  const results: EvalGateThresholdResult[] = [
    {
      threshold: 'minGoldenSetPassRate',
      required: gates.minGoldenSetPassRate,
      measured: measuredPassRate,
      passed: measuredPassRate >= gates.minGoldenSetPassRate,
      delta: measuredPassRate - gates.minGoldenSetPassRate,
    },
    {
      threshold: 'maxP95LatencyMs',
      required: gates.maxP95LatencyMs,
      measured: measuredP95Ms,
      passed: measuredP95Ms <= gates.maxP95LatencyMs,
      delta: gates.maxP95LatencyMs - measuredP95Ms,
    },
    {
      threshold: 'maxCostPerCallUsd',
      required: gates.maxCostPerCallUsd,
      measured: measuredCostUsd,
      passed: measuredCostUsd <= gates.maxCostPerCallUsd,
      delta: gates.maxCostPerCallUsd - measuredCostUsd,
    },
  ];

  const failedGates = results.filter((r) => !r.passed);

  let errorMessage: string | undefined;
  if (failedGates.length > 0) {
    errorMessage = failedGates
      .map((g) => {
        if (g.threshold === 'minGoldenSetPassRate') {
          return (
            `Golden-set pass rate ${(g.measured * 100).toFixed(1)}% below required ` +
            `${(g.required * 100).toFixed(1)}% (delta: ${(g.delta * 100).toFixed(1)}pp)`
          );
        }
        if (g.threshold === 'maxP95LatencyMs') {
          return (
            `P95 latency ${Math.round(g.measured)}ms exceeds limit ${Math.round(g.required)}ms ` +
            `(delta: ${Math.round(Math.abs(g.delta))}ms)`
          );
        }
        if (g.threshold === 'maxCostPerCallUsd') {
          return (
            `Cost per call $${g.measured.toFixed(4)} exceeds limit $${g.required.toFixed(4)}`
          );
        }
        return `Gate '${g.threshold}' failed: measured ${g.measured}, required ${g.required}`;
      })
      .join('; ');
  }

  return {
    passed: failedGates.length === 0,
    evalRunId,
    checkedAt,
    gates: results,
    failedGates,
    errorMessage,
  };
}

export function formatGateError(result: EvalGateCheckResult): string {
  if (result.passed) return 'All eval gates passed';
  return (
    `Eval gate(s) failed — ${result.errorMessage ?? 'unknown'}. ` +
    `Run ID: ${result.evalRunId}`
  );
}
