import type { EvalPack } from "./dataset.js";
import type { EvalReport, EvalResult } from "./types.js";
import { exactMatchScorer, scoreExample, aggregateResults } from "./scorer.js";
import { detectRegressions } from "./regression.js";

export interface RunPackOptions {
  pack: EvalPack;
  runFn: (input: unknown, context: Record<string, unknown>) => Promise<unknown>;
  scoreThreshold?: number;
  baselineReport?: EvalReport;
}

export async function runPack(opts: RunPackOptions): Promise<EvalReport> {
  const results: EvalResult[] = [];
  const start = Date.now();

  for (const scenario of opts.pack.scenarios) {
    for (const example of scenario.examples) {
      const t0 = Date.now();
      let actualOutput: unknown;
      let errorMessage: string | undefined;

      try {
        actualOutput = await opts.runFn(example.input, example.context);
      } catch (err) {
        actualOutput = undefined;
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      const latencyMs = Date.now() - t0;
      const result = scoreExample(example, actualOutput, exactMatchScorer, {
        latencyMs,
        scoreThreshold: opts.scoreThreshold,
      });

      results.push({ ...result, scenarioId: scenario.id, errorMessage });
    }
  }

  const { overallScore } = aggregateResults(results);
  const passed = results.filter((r) => r.passed).length;

  const report: EvalReport = {
    reportId: `report-${Date.now()}`,
    packId: opts.pack.id,
    runAt: new Date().toISOString(),
    totalExamples: results.length,
    passedExamples: passed,
    failedExamples: results.length - passed,
    overallScore,
    results,
    metrics: [
      { name: "overall_score", value: overallScore },
      { name: "pass_rate", value: results.length > 0 ? passed / results.length : 0 },
      { name: "total_latency_ms", value: Date.now() - start, unit: "ms" },
    ],
    regressions: [],
    baselineReportId: opts.baselineReport?.reportId,
    metadata: { packVersion: opts.pack.version },
  };

  if (opts.baselineReport) {
    const reg = detectRegressions(opts.baselineReport, report);
    report.regressions = reg.regressions;
  }

  return report;
}

export function printReport(report: EvalReport): void {
  console.log(`\nEval Report: ${report.reportId}`);
  console.log(`Pack: ${report.packId} | Run: ${report.runAt}`);
  console.log(`Results: ${report.passedExamples}/${report.totalExamples} passed | Score: ${(report.overallScore * 100).toFixed(1)}%`);
  if (report.regressions.length > 0) {
    console.log(`\nRegressions (${report.regressions.length}):`);
    for (const r of report.regressions) console.log(`  ⚠ ${r}`);
  }
  console.log();
}
