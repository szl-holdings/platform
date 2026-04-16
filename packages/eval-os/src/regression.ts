import type { EvalReport } from "./types.js";

export interface RegressionResult {
  hasRegression: boolean;
  regressions: string[];
  scoreDelta: number;
  passRateDelta: number;
}

export function detectRegressions(
  baseline: EvalReport,
  current: EvalReport,
  opts: { scoreThreshold?: number; passRateThreshold?: number } = {}
): RegressionResult {
  const scoreThreshold = opts.scoreThreshold ?? 0.05;
  const passRateThreshold = opts.passRateThreshold ?? 0.03;

  const regressions: string[] = [];
  const scoreDelta = current.overallScore - baseline.overallScore;
  const baselinePassRate = baseline.totalExamples > 0 ? baseline.passedExamples / baseline.totalExamples : 0;
  const currentPassRate = current.totalExamples > 0 ? current.passedExamples / current.totalExamples : 0;
  const passRateDelta = currentPassRate - baselinePassRate;

  if (scoreDelta < -scoreThreshold) {
    regressions.push(`Overall score dropped by ${(-scoreDelta).toFixed(3)} (threshold: ${scoreThreshold})`);
  }

  if (passRateDelta < -passRateThreshold) {
    regressions.push(`Pass rate dropped by ${(-passRateDelta).toFixed(3)} (threshold: ${passRateThreshold})`);
  }

  for (const currentResult of current.results) {
    const baselineResult = baseline.results.find((r) => r.exampleId === currentResult.exampleId);
    if (baselineResult && baselineResult.passed && !currentResult.passed) {
      regressions.push(`Example ${currentResult.exampleId} regressed from pass to fail`);
    }
  }

  return {
    hasRegression: regressions.length > 0,
    regressions,
    scoreDelta,
    passRateDelta,
  };
}
