import { runEvalSuite, checkRunRegression, type EvalRunReport, type EvalSuiteDef, type EvalExecutor } from "./runtime.js";
import { ALL_SUITES } from "./suites/index.js";

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
    severity: string;
    notes: string[];
  }>;
  durationMs: number;
}

const defaultExecutor: EvalExecutor = async (input, caseId, domain) => {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, Math.random() * 10 + 5));
  return {
    output: { ...input, _stub: true, domain, caseId },
    model: "stub-model-v1",
    latencyMs: Date.now() - start,
    tokensUsed: 0,
    costUsd: 0,
  };
};

export async function runNightlyEvals(opts: NightlyRunOptions = {}): Promise<NightlyRunSummary> {
  const {
    suites = ALL_SUITES,
    executor = defaultExecutor,
    baselineStore = new Map(),
    regressionThresholdPct = 5,
    triggeredBy = "nightly-cron",
    verbose = false,
  } = opts;

  const startTime = Date.now();
  const runAt = new Date().toISOString();

  if (verbose) {
    console.log(`[Eval OS] Nightly run starting at ${runAt}`);
    console.log(`[Eval OS] ${suites.length} suites, triggered by: ${triggeredBy}`);
  }

  const suiteReports: EvalRunReport[] = [];
  const regressionDetails: NightlyRunSummary["regressionDetails"] = [];
  const criticalRegressions: string[] = [];

  for (const suite of suites) {
    if (verbose) {
      console.log(`[Eval OS]   Running suite: ${suite.name} (${suite.cases.length} cases)`);
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
      const emoji = report.hasRegression ? "⚠️" : "✓";
      console.log(
        `[Eval OS]   ${emoji} ${suite.suiteId}: ${report.passed}/${report.totalCases} passed (${(report.passRate * 100).toFixed(1)}%)`,
      );
    }
  }

  const totalCases = suiteReports.reduce((s, r) => s + r.totalCases, 0);
  const totalPassed = suiteReports.reduce((s, r) => s + r.passed, 0);
  const totalFailed = suiteReports.reduce((s, r) => s + r.failed, 0);
  const overallPassRate = totalCases > 0 ? totalPassed / totalCases : 0;
  const suitesWithRegression = suiteReports.filter((r) => r.hasRegression).length;
  const durationMs = Date.now() - startTime;

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
  };

  if (verbose) {
    console.log(`\n[Eval OS] Nightly run complete in ${durationMs}ms`);
    console.log(`[Eval OS] ${totalPassed}/${totalCases} cases passed (${(overallPassRate * 100).toFixed(1)}%)`);
    if (suitesWithRegression > 0) {
      console.log(`[Eval OS] ⚠️  ${suitesWithRegression} suite(s) with regressions`);
    }
    if (criticalRegressions.length > 0) {
      console.log(`[Eval OS] 🚨 CRITICAL regressions: ${criticalRegressions.join(", ")}`);
    }
  }

  return summary;
}

export async function runSuiteCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const suiteId = args[0];
  const verbose = args.includes("--verbose") || args.includes("-v");

  if (!suiteId || suiteId === "--help" || suiteId === "-h") {
    console.log("Usage: eval-os <suite-id|all> [--verbose]");
    console.log("\nAvailable suites:");
    for (const s of ALL_SUITES) {
      console.log(`  ${s.suiteId}  (${s.cases.length} cases) — ${s.domain}`);
    }
    return;
  }

  let suitesToRun: EvalSuiteDef[];
  if (suiteId === "all") {
    suitesToRun = ALL_SUITES;
  } else {
    const found = ALL_SUITES.find((s) => s.suiteId === suiteId);
    if (!found) {
      console.error(`Suite not found: ${suiteId}`);
      console.error(`Available: ${ALL_SUITES.map((s) => s.suiteId).join(", ")}`);
      process.exit(1);
    }
    suitesToRun = [found];
  }

  const summary = await runNightlyEvals({
    suites: suitesToRun,
    triggeredBy: "cli",
    verbose: verbose || true,
  });

  if (summary.criticalRegressions.length > 0) {
    process.exit(2);
  }
  if (summary.suitesWithRegression > 0) {
    process.exit(1);
  }
}

const isMain = process.argv[1] != null && (
  process.argv[1].endsWith("nightly-runner.ts") ||
  process.argv[1].endsWith("nightly-runner.js") ||
  process.argv[1].endsWith("eval-os")
);

if (isMain) {
  runSuiteCli(process.argv.slice(2)).catch((err) => {
    console.error("[Eval OS] Fatal error:", err);
    process.exit(1);
  });
}
