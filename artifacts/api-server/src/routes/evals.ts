import { Router, type IRouter } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../middlewares/sliding-window-limiter";
import {
  FORGE_SUITES as ALL_SUITES,
  FORGE_SUITE_BY_ID as SUITE_BY_ID,
  FORGE_SUITE_BY_DOMAIN as SUITE_BY_DOMAIN,
  runEvalSuite,
  checkRunRegression,
  runNightlyEvals,
  scheduleNightlyRun,
  ALL_EVAL_TYPES,
  type EvalRunReport,
  type EvalSuiteDef,
} from "@workspace/eval-forge";
import {
  upsertEvalForgeSuites,
  persistEvalForgeRun,
  loadRecentRunsFromDb,
} from "../lib/eval-forge-store";

const router: IRouter = Router();

const runStore = new Map<string, EvalRunReport>();
const suiteStore = new Map<string, EvalSuiteDef>(
  ALL_SUITES.map((s) => [s.suiteId, s]),
);

upsertEvalForgeSuites(ALL_SUITES).catch(() => {});

loadRecentRunsFromDb(200).then((runs) => {
  for (const r of runs) {
    if (!runStore.has(r.runId)) {
      runStore.set(r.runId, r);
    }
  }
}).catch(() => {});

async function runAndPersistNightly(): Promise<void> {
  try {
    const baselineStore = new Map<string, EvalRunReport>(
      Array.from(runStore.values())
        .reduce((acc, r) => {
          if (!acc.has(r.suiteId) || acc.get(r.suiteId)!.runAt < r.runAt) {
            acc.set(r.suiteId, r);
          }
          return acc;
        }, new Map<string, EvalRunReport>()),
    );
    const summary = await runNightlyEvals({
      triggeredBy: "nightly-cron",
      baselineStore,
      verbose: false,
    });
    for (const report of summary.suiteReports) {
      runStore.set(report.runId, report);
      persistEvalForgeRun(report).catch(() => {});
    }
  } catch {}
}

scheduleNightlyRun(2, { triggeredBy: "nightly-cron", verbose: false })
  .then(({ unschedule }) => {
    process.once("SIGTERM", unschedule);
    process.once("SIGINT", unschedule);
  })
  .catch(() => {});

function defaultExecutor(input: Record<string, unknown>, caseId: string, domain: string) {
  const start = Date.now();
  return Promise.resolve({
    output: { ...input, _stub: true, caseId, domain },
    model: "stub-executor-v1",
    latencyMs: Date.now() - start,
    tokensUsed: 0,
    costUsd: 0,
  });
}

router.get(
  "/evals",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "analyst"),
  perUserApiSlidingLimiter,
  (_req, res) => {
    const suites = Array.from(suiteStore.values()).map((s) => ({
      suiteId: s.suiteId,
      name: s.name,
      description: s.description,
      domain: s.domain,
      evalType: s.evalType,
      version: s.version,
      tags: s.tags,
      caseCount: s.cases.length,
      redTeamCount: s.cases.filter((c) => c.isRedTeam).length,
      graderTypes: [...new Set(s.cases.map((c) => c.graderType))],
    }));

    const runs = Array.from(runStore.values())
      .sort((a, b) => b.runAt.localeCompare(a.runAt))
      .slice(0, 50)
      .map((r) => ({
        runId: r.runId,
        suiteId: r.suiteId,
        suiteName: r.suiteName,
        domain: r.domain,
        status: r.totalCases > 0 ? "completed" : "empty",
        passRate: r.passRate,
        avgScore: r.avgScore,
        totalCases: r.totalCases,
        passed: r.passed,
        failed: r.failed,
        hasRegression: r.hasRegression,
        regressionSeverity: r.regressionSeverity,
        runAt: r.runAt,
        triggeredBy: r.triggeredBy,
      }));

    res.json({
      suites,
      recentRuns: runs,
      domains: Object.keys(SUITE_BY_DOMAIN),
      evalTypes: ALL_EVAL_TYPES,
      totalSuites: suiteStore.size,
      totalRuns: runStore.size,
      version: "eval-forge-v1",
    });
  },
);

router.get(
  "/evals/suites",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "analyst"),
  perUserApiSlidingLimiter,
  (req, res) => {
    const domain = req.query.domain as string | undefined;
    const suites = domain
      ? (SUITE_BY_DOMAIN[domain] ?? [])
      : Array.from(suiteStore.values());

    res.json({
      suites: suites.map((s) => ({
        suiteId: s.suiteId,
        name: s.name,
        description: s.description,
        domain: s.domain,
        evalType: s.evalType,
        version: s.version,
        tags: s.tags,
        caseCount: s.cases.length,
        redTeamCount: s.cases.filter((c) => c.isRedTeam).length,
        graderTypes: [...new Set(s.cases.map((c) => c.graderType))],
      })),
      total: suites.length,
    });
  },
);

router.get(
  "/evals/suites/:suiteId",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "analyst"),
  perUserApiSlidingLimiter,
  (req, res) => {
    const suiteId = req.params.suiteId as string;
    const suite = SUITE_BY_ID[suiteId] ?? suiteStore.get(suiteId);
    if (!suite) {
      res.status(404).json({ error: "Suite not found", availableSuiteIds: Array.from(suiteStore.keys()) });
      return;
    }

    res.json({
      ...suite,
      caseCount: suite.cases.length,
      redTeamCount: suite.cases.filter((c: { isRedTeam?: boolean }) => c.isRedTeam).length,
      graderTypes: [...new Set(suite.cases.map((c: { graderType: string }) => c.graderType))],
    });
  },
);

router.get(
  "/evals/runs",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "analyst"),
  perUserApiSlidingLimiter,
  (req, res) => {
    const suiteId = req.query.suiteId as string | undefined;
    const domain = req.query.domain as string | undefined;
    const hasRegression = req.query.hasRegression as string | undefined;
    let runs = Array.from(runStore.values());

    if (suiteId) runs = runs.filter((r) => r.suiteId === suiteId);
    if (domain) runs = runs.filter((r) => r.domain === domain);
    if (hasRegression !== undefined && hasRegression !== null) {
      const rFlag = hasRegression === "true";
      runs = runs.filter((r) => r.hasRegression === rFlag);
    }

    runs.sort((a, b) => b.runAt.localeCompare(a.runAt));

    res.json({
      runs: runs.slice(0, 100).map((r) => ({
        runId: r.runId,
        suiteId: r.suiteId,
        suiteName: r.suiteName,
        domain: r.domain,
        passRate: r.passRate,
        avgScore: r.avgScore,
        totalCases: r.totalCases,
        passed: r.passed,
        failed: r.failed,
        hasRegression: r.hasRegression,
        regressionSeverity: r.regressionSeverity,
        regressionNotes: r.regressionNotes,
        improvementNotes: r.improvementNotes,
        runAt: r.runAt,
        triggeredBy: r.triggeredBy,
        avgLatencyMs: r.avgLatencyMs,
        totalCostUsd: r.totalCostUsd,
      })),
      total: runs.length,
    });
  },
);

router.get(
  "/evals/runs/:runId",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "analyst"),
  perUserApiSlidingLimiter,
  (req, res) => {
    const runId = req.params.runId as string;
    const run = runStore.get(runId);
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }
    res.json(run);
  },
);

router.get(
  "/evals/:id",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "analyst"),
  perUserApiSlidingLimiter,
  (req, res) => {
    const id = req.params.id as string;
    const suite = SUITE_BY_ID[id] ?? suiteStore.get(id);
    if (suite) {
      res.json({
        type: "suite",
        ...suite,
        caseCount: suite.cases.length,
        redTeamCount: suite.cases.filter((c: { isRedTeam?: boolean }) => c.isRedTeam).length,
        graderTypes: [...new Set(suite.cases.map((c: { graderType: string }) => c.graderType))],
      });
      return;
    }
    const run = runStore.get(id);
    if (run) {
      res.json({ type: "run", ...run });
      return;
    }
    res.status(404).json({ error: "Not found", id });
  },
);

router.post(
  "/evals/run",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    try {
      const { suiteId, triggeredBy = "api" } = req.body as { suiteId?: string; triggeredBy?: string };

      if (!suiteId) {
        res.status(400).json({ error: "suiteId is required" });
        return;
      }

      const suite = SUITE_BY_ID[suiteId] ?? suiteStore.get(suiteId);
      if (!suite) {
        res.status(404).json({ error: "Suite not found", availableSuiteIds: Array.from(suiteStore.keys()) });
        return;
      }

      const previousRun = Array.from(runStore.values())
        .filter((r) => r.suiteId === suiteId)
        .sort((a, b) => b.runAt.localeCompare(a.runAt))[0];

      const report = await runEvalSuite(suite, defaultExecutor, {
        triggeredBy,
        maxConcurrency: 5,
      });

      if (previousRun) {
        const reg = checkRunRegression(previousRun, report);
        report.hasRegression = reg.hasRegression;
        report.regressionSeverity = reg.severity;
        report.regressionNotes = reg.regressionNotes;
        report.improvementNotes = reg.improvementNotes;
        report.baselineRunId = previousRun.runId;
      }

      runStore.set(report.runId, report);
      persistEvalForgeRun(report).catch(() => {});

      res.status(201).json({
        runId: report.runId,
        suiteId: report.suiteId,
        suiteName: report.suiteName,
        domain: report.domain,
        passRate: report.passRate,
        avgScore: report.avgScore,
        totalCases: report.totalCases,
        passed: report.passed,
        failed: report.failed,
        hasRegression: report.hasRegression,
        regressionSeverity: report.regressionSeverity,
        regressionNotes: report.regressionNotes,
        improvementNotes: report.improvementNotes,
        runAt: report.runAt,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
    }
  },
);

router.post(
  "/evals/run-all",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    try {
      const { triggeredBy = "api", domain } = req.body as { triggeredBy?: string; domain?: string };

      const suitesToRun = domain
        ? (SUITE_BY_DOMAIN[domain] ?? [])
        : ALL_SUITES;

      if (suitesToRun.length === 0) {
        res.status(404).json({ error: "No suites found", domain });
        return;
      }

      const baselineStore = new Map(
        Array.from(runStore.values())
          .filter((r) => suitesToRun.some((s) => s.suiteId === r.suiteId))
          .reduce((acc, run) => {
            if (!acc.has(run.suiteId) || acc.get(run.suiteId)!.runAt < run.runAt) {
              acc.set(run.suiteId, run);
            }
            return acc;
          }, new Map<string, EvalRunReport>()),
      );

      const summary = await runNightlyEvals({
        suites: suitesToRun,
        triggeredBy,
        baselineStore,
        verbose: false,
      });

      for (const report of summary.suiteReports) {
        runStore.set(report.runId, report);
        persistEvalForgeRun(report).catch(() => {});
      }

      res.status(201).json({
        runAt: summary.runAt,
        totalSuites: summary.totalSuites,
        totalCases: summary.totalCases,
        totalPassed: summary.totalPassed,
        totalFailed: summary.totalFailed,
        overallPassRate: summary.overallPassRate,
        suitesWithRegression: summary.suitesWithRegression,
        criticalRegressions: summary.criticalRegressions,
        regressionDetails: summary.regressionDetails,
        durationMs: summary.durationMs,
        runIds: summary.suiteReports.map((r) => r.runId),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
    }
  },
);

router.patch(
  "/evals/scores/:scoreId/human-label",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  perUserWriteSlidingLimiter,
  (req, res) => {
    const { scoreId } = req.params;
    const { label, notes, labeledBy } = req.body as {
      label: "pass" | "partial" | "fail";
      notes?: string;
      labeledBy?: string;
    };

    if (!["pass", "partial", "fail"].includes(label)) {
      res.status(400).json({ error: "label must be 'pass', 'partial', or 'fail'" });
      return;
    }

    for (const run of runStore.values()) {
      const result = run.caseResults.find((r) => r.caseId === scoreId);
      if (result) {
        result.graderDetails = {
          ...result.graderDetails,
          humanLabel: label,
          humanNotes: notes,
          humanLabeledBy: labeledBy,
          humanLabeledAt: new Date().toISOString(),
        };
        res.json({ scoreId, label, notes, labeledBy, updatedAt: new Date().toISOString() });
        return;
      }
    }

    res.status(404).json({ error: "Score not found", scoreId });
  },
);

export default router;
