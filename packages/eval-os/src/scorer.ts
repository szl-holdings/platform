import type { GoldExample, EvalResult, EvalMetric } from "./types.js";

export type ScoreFunction = (example: GoldExample, actualOutput: unknown) => number;

export function exactMatchScorer(example: GoldExample, actualOutput: unknown): number {
  return JSON.stringify(actualOutput) === JSON.stringify(example.expectedOutput) ? 1 : 0;
}

export function numericalToleranceScorer(tolerance: number) {
  return (example: GoldExample, actualOutput: unknown): number => {
    const expected = typeof example.expectedOutput === "number" ? example.expectedOutput : null;
    const actual = typeof actualOutput === "number" ? actualOutput : null;
    if (expected === null || actual === null) return 0;
    return Math.abs(actual - expected) <= tolerance ? 1 : 0;
  };
}

export function scoreExample(
  example: GoldExample,
  actualOutput: unknown,
  scorer: ScoreFunction,
  opts: { latencyMs?: number; costUsd?: number; scoreThreshold?: number } = {}
): EvalResult {
  const score = scorer(example, actualOutput);
  const threshold = opts.scoreThreshold ?? 0.8;
  const passed = score >= threshold;

  const metrics: EvalMetric[] = [
    { name: "score", value: score, threshold, passed },
  ];
  if (opts.latencyMs !== undefined) {
    metrics.push({ name: "latency_ms", value: opts.latencyMs, unit: "ms" });
  }
  if (opts.costUsd !== undefined) {
    metrics.push({ name: "cost_usd", value: opts.costUsd, unit: "USD" });
  }

  return {
    exampleId: example.id,
    scenarioId: "unknown",
    passed,
    score,
    metrics,
    actualOutput,
    expectedOutput: example.expectedOutput,
    latencyMs: opts.latencyMs,
    costUsd: opts.costUsd,
  };
}

export function aggregateResults(results: EvalResult[]): { overallScore: number; passRate: number } {
  if (results.length === 0) return { overallScore: 0, passRate: 0 };
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const passed = results.filter((r) => r.passed).length;
  return {
    overallScore: totalScore / results.length,
    passRate: passed / results.length,
  };
}
