import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
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
import { run as runCognitiveLoop, type CognitiveContext } from "@workspace/cognitive-runtime";
import { defaultTraceStore } from "@workspace/trace-graph";
import { defaultMemoryStore } from "@workspace/memory-fabric";
import type { AgentEvalRunContract } from "@szl-holdings/telemetry-standards";
import { db, dosAnalyticsEventsTable } from "@szl-holdings/db";
import { promptRegistry } from "@szl-holdings/prompt-registry";
import { logger } from "../lib/logger";
import {
  upsertEvalForgeSuites,
  persistEvalForgeRun,
  loadRecentRunsFromDb,
} from "../lib/eval-forge-store";
import {validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router: IRouter = Router();

const runStore = new Map<string, EvalRunReport>();
const suiteStore = new Map<string, EvalSuiteDef>(
  ALL_SUITES.map((s: any) => [s.suiteId, s]),
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
  .then(({ unschedule }: { unschedule: () => void }) => {
    process.once("SIGTERM", unschedule);
    process.once("SIGINT", unschedule);
  })
  .catch(() => {});

function defaultExecutor(input: any, caseId: string, domain: string) {
  const start = Date.now();
  return Promise.resolve({
    output: { ...input, _stub: true, caseId, domain },
    model: "stub-executor-v1",
    latencyMs: Date.now() - start,
    tokensUsed: 0,
    costUsd: 0,
  });
}

// ---------------------------------------------------------------------------
// Variant replay support
// ---------------------------------------------------------------------------
// Variant replay dispatches a baseline suite against a different model /
// orchestration strategy / prompt version through the real cognitive runtime
// (`@workspace/cognitive-runtime`). Each eval case becomes a `runCognitiveLoop`
// invocation that flows through perceive → orient → plan → execute → verify
// → reflect → update phases just like a production agent run, so the variant
// compare table is showing real backend behavior, not placeholder data.
//
// Per-model pricing is layered on top of the runtime result so latency comes
// from the actual loop and cost is computed from the model's token pricing.

// Pricing in USD per 1K tokens. Used to derive cost from the runtime's actual
// token usage when a variant model is selected.
const MODEL_PRICING_PER_1K: Record<string, number> = {
  "gpt-4o":            0.00500,
  "gpt-4o-mini":       0.00060,
  "claude-3-5-sonnet": 0.00600,
  "claude-3-haiku":    0.00050,
  "gemini-1.5-pro":    0.00400,
};

// Map a variant model name → (provider, canonical model) used by the
// cognitive runtime / model router. Allows the eval UI to talk in friendly
// names while the loop pins routing to a real provider+model pair.
const MODEL_TO_PROVIDER: Record<string, { provider: string; model: string }> = {
  "gpt-4o":            { provider: "openai",    model: "gpt-4o" },
  "gpt-4o-mini":       { provider: "openai",    model: "gpt-4o-mini" },
  "claude-3-5-sonnet": { provider: "anthropic", model: "claude-3-5-sonnet" },
  "claude-3-haiku":    { provider: "anthropic", model: "claude-3-haiku" },
  "gemini-1.5-pro":    { provider: "google",    model: "gemini-1.5-pro" },
};

// Map orchestration strategy → cognitive-runtime knobs that change loop behavior.
const STRATEGY_TO_RUNTIME: Record<
  string,
  { agentTier: "assistant" | "analyst" | "operator" | "autonomous"; verifierEnabled: boolean; reflectionEnabled: boolean; maxVerifyRevisions: number }
> = {
  "default":          { agentTier: "analyst",    verifierEnabled: true,  reflectionEnabled: false, maxVerifyRevisions: 1 },
  "chain-of-thought": { agentTier: "analyst",    verifierEnabled: true,  reflectionEnabled: false, maxVerifyRevisions: 2 },
  "react":            { agentTier: "operator",   verifierEnabled: true,  reflectionEnabled: true,  maxVerifyRevisions: 2 },
  "reflection":       { agentTier: "operator",   verifierEnabled: true,  reflectionEnabled: true,  maxVerifyRevisions: 3 },
  "multi-agent":      { agentTier: "autonomous", verifierEnabled: true,  reflectionEnabled: true,  maxVerifyRevisions: 3 },
};

function objectiveFromInput(input: any, caseId: string, domain: string): string {
  if (typeof input === "string") return input;
  if (input && typeof input === "object") {
    if (typeof input.objective === "string") return input.objective;
    if (typeof input.prompt === "string")    return input.prompt;
    if (typeof input.query === "string")     return input.query;
    if (typeof input.question === "string")  return input.question;
    try { return `Eval case ${caseId} (${domain}): ${JSON.stringify(input).slice(0, 400)}`; } catch {}
  }
  return `Eval case ${caseId} (${domain})`;
}

// Resolve a variant prompt id against the prompt registry. Accepts either a
// versionId (e.g. `support-classifier@v3`) or a definition id (in which case
// the active version is used). Returns null if nothing resolves so the
// executor can fall back to the cognitive runtime's default prompt selection
// (and surface a metadata flag so the UI / contract record reflects that).
function resolveVariantPrompt(promptId: string): { versionId: string; provider?: string; model?: string } | null {
  if (!promptId) return null;
  // Direct version match (e.g. "foo@v2").
  const directDefId = promptId.includes("@") ? promptId.split("@")[0]! : promptId;
  const def = promptRegistry.get(directDefId) ?? null;
  if (promptId.includes("@")) {
    const v = def ? promptRegistry.getVersion(directDefId, promptId) : undefined;
    if (v) return { versionId: v.versionId, provider: v.modelHints.preferredProvider, model: v.modelHints.preferredModel };
  }
  if (def) {
    const v = promptRegistry.getActiveVersion(def.id);
    if (v) return { versionId: v.versionId, provider: v.modelHints.preferredProvider, model: v.modelHints.preferredModel };
  }
  return null;
}

function buildVariantExecutor(model: string, strategy: string, promptId: string, suiteDomain?: string) {
  const runtimeKnobs = STRATEGY_TO_RUNTIME[strategy] ?? STRATEGY_TO_RUNTIME["default"]!;
  const pricePer1K = MODEL_PRICING_PER_1K[model] ?? MODEL_PRICING_PER_1K["gpt-4o-mini"]!;
  const providerMap = MODEL_TO_PROVIDER[model];
  const promptResolution = resolveVariantPrompt(promptId);
  // Variant-pinned routing: prefer the explicit model→provider mapping, else
  // honor whatever provider/model the prompt version's modelHints suggest.
  const preferredProvider = providerMap?.provider ?? promptResolution?.provider;
  const preferredModel    = providerMap?.model    ?? promptResolution?.model ?? model;

  return async (input: any, caseId: string, domain: string) => {
    const objective = objectiveFromInput(input, caseId, domain);
    const startedAt = Date.now();
    const evalRunSessionId = `eval-variant-${caseId}-${randomUUID().slice(0, 8)}`;

    const ctx: CognitiveContext = {
      agentId: `eval-variant-${model}`,
      sessionId: evalRunSessionId,
      domain: domain || suiteDomain,
      agentTier: runtimeKnobs.agentTier,
      verifierEnabled: runtimeKnobs.verifierEnabled,
      reflectionEnabled: runtimeKnobs.reflectionEnabled,
      maxVerifyRevisions: runtimeKnobs.maxVerifyRevisions,
      // Pin the runtime to the variant's model + prompt version so plan
      // routing actually selects them (see plan.ts override block). Without
      // these the cognitive runtime would re-route to whatever the model
      // router picks by priority.
      preferredProvider,
      preferredModel,
      promptVersionId: promptResolution?.versionId,
      // dryRun avoids any side effects from the production-grade loop
      // (memory writes, checkpoints, etc.) while still exercising the real
      // perceive/orient/plan/execute pipeline.
      dryRun: true,
      perceiveInput: {
        eventType: "eval-case",
        sourceDomain: domain || suiteDomain,
        sourceId: caseId,
        rawSignals: [{ caseId, domain, payload: input }],
      },
      metadata: {
        evalCaseId: caseId,
        variantModel: model,
        variantStrategy: strategy,
        variantPromptId: promptId,
        variantPromptResolved: promptResolution?.versionId ?? null,
        variantPreferredProvider: preferredProvider ?? null,
        variantPreferredModel: preferredModel,
      },
    };

    try {
      const result = await runCognitiveLoop(objective, ctx, {
        traceStore: defaultTraceStore,
        memoryStore: defaultMemoryStore,
      });

      const latencyMs = result.run.durationMs ?? (Date.now() - startedAt);
      // Token estimate: cognitive-runtime doesn't expose per-loop token counts
      // in the public RunResult, so we estimate from objective + output size
      // (~4 chars/token) which is consistent with how MODEL_PRICING_PER_1K
      // is calibrated.
      const outputStr = typeof result.run.output === "string"
        ? result.run.output
        : JSON.stringify(result.run.output ?? {});
      const tokensUsed = Math.max(1, Math.ceil((objective.length + outputStr.length) / 4));
      const costUsd = (tokensUsed / 1000) * pricePer1K;

      return {
        output: { summary: result.summary, output: result.run.output, status: result.run.status, phases: result.run.phases.map((p) => p.phase) },
        model,
        latencyMs,
        tokensUsed,
        costUsd,
        traceId: result.run.traceId,
        metadata: {
          variantStrategy: strategy,
          variantPromptId: promptId,
          runtimeRunId: result.run.runId,
          phases: result.run.phases.length,
          status: result.run.status,
          success: result.success,
        },
      };
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      // Bubble error info so the grader can record a failure rather than crash.
      throw new Error(
        `Variant cognitive-runtime call failed (case=${caseId} model=${model}): ${err instanceof Error ? err.message : String(err)} (after ${latencyMs}ms)`,
      );
    }
  };
}

async function emitAgentEvalRunContract(contract: AgentEvalRunContract): Promise<void> {
  try {
    await db.insert(dosAnalyticsEventsTable).values({
      eventType: "page_view" as const,
      path: null,
      metadata: {
        app: "api-server",
        eventName: "agent.eval.run",
        contract: "AgentEvalRunContract",
        ...contract,
      },
    });
  } catch (err) {
    logger.warn({ err }, "[evals] failed to persist AgentEvalRunContract");
  }
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
      redTeamCount: s.cases.filter((c: any) => c.isRedTeam).length,
      graderTypes: [...new Set(s.cases.map((c: any) => c.graderType))],
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
  validateQuery(listQuerySchema),
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
        redTeamCount: s.cases.filter((c: any) => c.isRedTeam).length,
        graderTypes: [...new Set(s.cases.map((c: any) => c.graderType))],
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
  validateQuery(listQuerySchema),
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
  validateBody(jsonObjectBodySchema),
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
        avgLatencyMs: report.avgLatencyMs,
        totalCostUsd: report.totalCostUsd,
        runAt: report.runAt,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal error" });
    }
  },
);

// POST /evals/suites/:suiteId/runs/variant
//
// Streams a variant replay against the named baseline run via Server-Sent
// Events. The body specifies `model`, `strategy`, `promptId` (optionally with
// a `baselineRunId` and `triggeredBy`). The endpoint emits one SSE `case`
// event per completed case so the Eval Studio compare table can update in
// real time, then a terminal `complete` event with the full report and
// regression diff against the baseline.
router.post(
  "/evals/suites/:suiteId/runs/variant",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  perUserWriteSlidingLimiter,
  validateBody(jsonObjectBodySchema),
  async (req, res) => {
    const suiteId = req.params.suiteId as string;
    const {
      model = "gpt-4o-mini",
      strategy = "default",
      promptId = "v2",
      baselineRunId,
      triggeredBy = "variant-compare",
    } = req.body as {
      model?: string;
      strategy?: string;
      promptId?: string;
      baselineRunId?: string;
      triggeredBy?: string;
    };

    const suite = SUITE_BY_ID[suiteId] ?? suiteStore.get(suiteId);
    if (!suite) {
      res.status(404).json({ error: "Suite not found", suiteId });
      return;
    }

    let baseline = baselineRunId
      ? runStore.get(baselineRunId) ?? null
      : Array.from(runStore.values())
          .filter((r) => r.suiteId === suiteId)
          .sort((a, b) => b.runAt.localeCompare(a.runAt))[0] ?? null;
    // Reject a baseline that belongs to a different suite — comparing the
    // variant against the wrong suite's run produces meaningless regression
    // reports. Be explicit when an explicit baselineRunId is supplied.
    if (baselineRunId && baseline && baseline.suiteId !== suiteId) {
      res.status(400).json({
        error: "baseline_suite_mismatch",
        message: `baselineRunId ${baselineRunId} belongs to suite ${baseline.suiteId}, not ${suiteId}`,
      });
      return;
    }
    // For implicit baseline lookup, the suiteId filter above already guarantees
    // a match — but defensively ignore any mismatch here too.
    if (baseline && baseline.suiteId !== suiteId) baseline = null;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const send = (event: string, payload: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    let aborted = false;
    req.on("close", () => { aborted = true; });

    try {
      send("start", {
        suiteId,
        suiteName: suite.name,
        domain: suite.domain,
        totalCases: suite.cases.length,
        baselineRunId: baseline?.runId ?? null,
        variant: { model, strategy, promptId },
      });

      const executor = buildVariantExecutor(model, strategy, promptId, suite.domain);
      const startedAt = Date.now();

      const report = await runEvalSuite(suite, executor, {
        triggeredBy,
        // Cognitive runtime calls are heavier than the stub executor — keep
        // concurrency low so we don't overload the runtime per replay.
        maxConcurrency: 2,
        metadata: { variantModel: model, variantStrategy: strategy, variantPromptId: promptId },
        onCaseComplete: (result: any, progress: { completed: number; total: number }) => {
          if (aborted) return;
          send("case", {
            caseId: result.caseId,
            label: result.label,
            domain: result.domain,
            passed: result.passed,
            score: result.score,
            latencyMs: result.latencyMs,
            costUsd: result.costUsd,
            tokensUsed: result.tokensUsed,
            failureReason: result.failureReason,
            progress,
          });
        },
      });

      if (baseline) {
        const reg = checkRunRegression(baseline, report);
        report.hasRegression = reg.hasRegression;
        report.regressionSeverity = reg.severity;
        report.regressionNotes = reg.regressionNotes;
        report.improvementNotes = reg.improvementNotes;
        report.baselineRunId = baseline.runId;
      }

      runStore.set(report.runId, report);
      persistEvalForgeRun(report).catch(() => {});

      // Emit the typed AgentEvalRunContract from @szl-holdings/telemetry-standards
      // so the variant replay is correlatable to its baseline run, suite, and
      // configured variant params in downstream observability.
      const evalContract: AgentEvalRunContract = {
        traceId: undefined,
        spanId: undefined,
        evalSuiteId: report.suiteId,
        evalRunId: report.runId,
        domain: report.domain,
        passRate: report.passRate,
        avgScore: report.avgScore,
        totalCases: report.totalCases,
        passed: report.passed,
        failed: report.failed,
        hasRegression: report.hasRegression ?? false,
        regressionSeverity: report.regressionSeverity ?? "none",
        triggeredBy: report.triggeredBy,
        avgLatencyMs: report.avgLatencyMs,
        totalCostUsd: report.totalCostUsd,
        variantModel: model,
        variantStrategy: strategy,
        variantPrompt: promptId,
        timestamp: Date.now(),
      };
      emitAgentEvalRunContract(evalContract).catch(() => {});

      send("complete", {
        runId: report.runId,
        suiteId: report.suiteId,
        suiteName: report.suiteName,
        domain: report.domain,
        passRate: report.passRate,
        avgScore: report.avgScore,
        totalCases: report.totalCases,
        passed: report.passed,
        failed: report.failed,
        avgLatencyMs: report.avgLatencyMs,
        totalCostUsd: report.totalCostUsd,
        totalTokensUsed: report.totalTokensUsed,
        hasRegression: report.hasRegression ?? false,
        regressionSeverity: report.regressionSeverity ?? "none",
        regressionNotes: report.regressionNotes ?? [],
        improvementNotes: report.improvementNotes ?? [],
        baselineRunId: report.baselineRunId ?? null,
        runAt: report.runAt,
        triggeredBy: report.triggeredBy,
        durationMs: Date.now() - startedAt,
        variant: { model, strategy, promptId },
        agentEvalRun: evalContract,
      });
      res.end();
    } catch (err) {
      send("error", { message: err instanceof Error ? err.message : "Variant replay failed" });
      res.end();
    }
  },
);

router.post(
  "/evals/run-all",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  perUserWriteSlidingLimiter,
  validateBody(jsonObjectBodySchema),
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

      const baselineStore = new Map<string, EvalRunReport>(
        Array.from(runStore.values())
          .filter((r) => suitesToRun.some((s: any) => s.suiteId === r.suiteId))
          .reduce((acc: any, run: any) => {
            if (!acc.has(run.suiteId) || (acc.get(run.suiteId) as any)!.runAt < run.runAt) {
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
        runIds: summary.suiteReports.map((r: any) => r.runId),
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
  validateBody(jsonObjectBodySchema),
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
      const result = run.caseResults.find((r: any) => r.caseId === scoreId);
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
