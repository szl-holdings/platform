import { runEvalSuite, checkRunRegression } from "./runtime.js";
import { FORGE_SUITES } from "./suites/index.js";
import type { EvalSuiteDef, EvalExecutor, EvalRunReport } from "./types.js";

export interface NightlyRunOptions {
  suites?: EvalSuiteDef[];
  executor?: EvalExecutor;
  baselineStore?: Map<string, EvalRunReport>;
  regressionThresholdPct?: number;
  triggeredBy?: string;
  verbose?: boolean;
}

export interface NightlyRunSummary {
  runAt: string;
  totalSuites: number;
  totalCases: number;
  totalPassed: number;
  totalFailed: number;
  overallPassRate: number;
  suitesWithRegression: number;
  criticalRegressions: string[];
  suiteReports: EvalRunReport[];
  regressionDetails: Array<{
    suiteId: string;
    evalType: string;
    severity: string;
    notes: string[];
  }>;
  durationMs: number;
  byEvalType: Record<
    string,
    { suiteId: string; passRate: number; passed: number; total: number }
  >;
}

const stubExecutor: EvalExecutor = async (input, caseId, domain) => {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, Math.random() * 10 + 5));
  return {
    output: { ...input, _stub: true, domain, caseId, confidence: 0.85 },
    model: "stub-model-v1",
    latencyMs: Date.now() - start,
    tokensUsed: 0,
    costUsd: 0,
  };
};

export async function runNightlyEvals(opts: NightlyRunOptions = {}): Promise<NightlyRunSummary> {
  const {
    suites = FORGE_SUITES,
    executor = stubExecutor,
    baselineStore = new Map(),
    regressionThresholdPct = 5,
    triggeredBy = "nightly-cron",
    verbose = false,
  } = opts;

  const startTime = Date.now();
  const runAt = new Date().toISOString();

  if (verbose) {
    console.log(`[Eval Forge] Nightly run starting at ${runAt}`);
    console.log(`[Eval Forge] ${suites.length} suites | triggered by: ${triggeredBy}`);
  }

  const suiteReports: EvalRunReport[] = [];
  const regressionDetails: NightlyRunSummary["regressionDetails"] = [];
  const criticalRegressions: string[] = [];

  for (const suite of suites) {
    if (verbose) {
      console.log(`[Eval Forge]   Running: ${suite.name} (${suite.evalType}, ${suite.cases.length} cases)`);
    }

    const report = await runEvalSuite(suite, executor, {
      triggeredBy,
      maxConcurrency: 5,
    });

    const baseline = baselineStore.get(suite.suiteId);
    if (baseline) {
      const regression = checkRunRegression(baseline, report, regressionThresholdPct);
      report.hasRegression = regression.hasRegression;
      report.regressionSeverity = regression.severity;
      report.regressionNotes = regression.regressionNotes;
      report.improvementNotes = regression.improvementNotes;
      report.baselineRunId = baseline.runId;

      if (regression.hasRegression) {
        regressionDetails.push({
          suiteId: suite.suiteId,
          evalType: suite.evalType ?? "unknown",
          severity: regression.severity,
          notes: regression.regressionNotes,
        });
        if (regression.severity === "critical") {
          criticalRegressions.push(suite.suiteId);
        }
      }
    }

    baselineStore.set(suite.suiteId, report);
    suiteReports.push(report);

    if (verbose) {
      const marker = report.hasRegression ? "⚠️" : "✓";
      console.log(
        `[Eval Forge]   ${marker} ${suite.suiteId}: ${report.passed}/${report.totalCases} passed (${(report.passRate * 100).toFixed(1)}%)`,
      );
    }
  }

  const totalCases = suiteReports.reduce((s, r) => s + r.totalCases, 0);
  const totalPassed = suiteReports.reduce((s, r) => s + r.passed, 0);
  const totalFailed = suiteReports.reduce((s, r) => s + r.failed, 0);
  const overallPassRate = totalCases > 0 ? totalPassed / totalCases : 0;
  const suitesWithRegression = suiteReports.filter((r) => r.hasRegression).length;
  const durationMs = Date.now() - startTime;

  const byEvalType: NightlyRunSummary["byEvalType"] = {};
  for (const r of suiteReports) {
    if (r.evalType) {
      byEvalType[r.evalType] = {
        suiteId: r.suiteId,
        passRate: r.passRate,
        passed: r.passed,
        total: r.totalCases,
      };
    }
  }

  const summary: NightlyRunSummary = {
    runAt,
    totalSuites: suites.length,
    totalCases,
    totalPassed,
    totalFailed,
    overallPassRate,
    suitesWithRegression,
    criticalRegressions,
    suiteReports,
    regressionDetails,
    durationMs,
    byEvalType,
  };

  if (verbose) {
    console.log(`\n[Eval Forge] Run complete in ${durationMs}ms`);
    console.log(`[Eval Forge] ${totalPassed}/${totalCases} cases passed (${(overallPassRate * 100).toFixed(1)}%)`);
    if (suitesWithRegression > 0) {
      console.log(`[Eval Forge] ⚠️  ${suitesWithRegression} suite(s) with regressions`);
    }
    if (criticalRegressions.length > 0) {
      console.log(`[Eval Forge] 🚨 CRITICAL regressions: ${criticalRegressions.join(", ")}`);
    }
    console.log(`[Eval Forge] Eval types covered: ${Object.keys(byEvalType).join(", ")}`);
  }

  return summary;
}

export async function scheduleNightlyRun(
  cronHourUtc = 2,
  opts: NightlyRunOptions = {},
): Promise<{ unschedule: () => void }> {
  const intervalMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCHours(cronHourUtc, 0, 0, 0);
  if (nextRun <= now) nextRun.setUTCDate(nextRun.getUTCDate() + 1);

  const delay = nextRun.getTime() - now.getTime();
  let timeoutId: ReturnType<typeof setTimeout>;
  let intervalId: ReturnType<typeof setInterval>;
  let active = true;

  timeoutId = setTimeout(() => {
    if (!active) return;
    runNightlyEvals({ ...opts, verbose: true }).catch((err) =>
      console.error("[Eval Forge] Nightly run error:", err),
    );
    intervalId = setInterval(() => {
      if (!active) return;
      runNightlyEvals({ ...opts, verbose: true }).catch((err) =>
        console.error("[Eval Forge] Nightly run error:", err),
      );
    }, intervalMs);
  }, delay);

  if (opts.verbose) {
    console.log(`[Eval Forge] Scheduled nightly run at UTC ${cronHourUtc}:00 (first run in ${Math.round(delay / 60000)}m)`);
  }

  return {
    unschedule: () => {
      active = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId!);
    },
  };
}
