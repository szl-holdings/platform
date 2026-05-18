import { bodyShape } from '@szl-holdings/contracts/common';
import { db, dosAnalyticsEventsTable } from '@szl-holdings/db';
import {
  type AgentEvalExecutor,
  formatPromotionReport,
  runAgentEvals,
} from '@szl-holdings/pulse-evals';
import { gatewayInfer, type GatewayRequest } from '../lib/ai-gateway';
import { promptRegistry } from '@szl-holdings/prompt-registry';
import type { AgentEvalRunContract } from '@szl-holdings/telemetry-standards';
import {
  AEF_DOMAIN_PROFILE_DOMAINS,
  type AEFDomain,
  defaultProfileRegistry,
} from '@workspace/aef-domain-profiles';
import {
  ALL_GOLDEN_QUERIES,
  ALL_MOCK_CORPORA,
  type GoldenQuery,
  type MetricResult,
  type RetrievalAdapter,
  type RetrievedResult,
  runRetrievalEval,
} from '@workspace/aef-evals';
import { type CognitiveContext, run as runCognitiveLoop } from '@workspace/cognitive-runtime';
import {
  ALL_EVAL_TYPES,
  FORGE_SUITES as ALL_SUITES,
  checkRunRegression,
  type EvalForgeMetrics,
  type EvalRunReport,
  type EvalSuiteDef,
  runEvalSuite,
  runNightlyEvals,
  FORGE_SUITE_BY_DOMAIN as SUITE_BY_DOMAIN,
  FORGE_SUITE_BY_ID as SUITE_BY_ID,
  scheduleNightlyRun,
} from '@workspace/eval-forge';
import { defaultMemoryStore } from '@workspace/memory-fabric';
import { defaultTraceStore } from '@workspace/trace-graph';
import { randomUUID } from 'node:crypto';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { buildDefaultExecutor, defaultExecutorFactory } from '../lib/eval-executors';
import {
  loadRecentRunsFromDb,
  persistEvalForgeRun,
  upsertEvalForgeSuites,
} from '../lib/eval-forge-store';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

/** Zod schema mirroring GoldenQuery — used to validate caller-supplied queries. */
const GoldenQuerySchema = z.object({
  queryId: z.string(),
  query: z.string().min(1),
  relevantChunkIds: z.array(z.string()),
  exactMatchBoostTerms: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** In-memory store for AEF retrieval eval runs — mirrors runStore pattern above. */
interface AEFRunRecord {
  evalId: string;
  domain: AEFDomain;
  profileId: string;
  profileVersion: string;
  tenantId: string;
  queryCount: number;
  successCount: number;
  errorCount: number;
  aggregateMetrics: MetricResult[];
  totalLatencyMs: number;
  avgLatencyMs: number;
  throughputQps: number;
  ranAt: string;
  triggeredBy: string;
}

const aefRunStore = new Map<string, AEFRunRecord>();

/**
 * Internal AEF API base URL.
 * The alloy-embedding-api router is mounted in this same process, so in
 * production the default resolves to an in-process loopback call. Override
 * via AEF_API_URL for external deployments.
 */
const AEF_INTERNAL_BASE = (() => {
  const envUrl = process.env.AEF_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const port = process.env.PORT ?? '5000';
  return `http://localhost:${port}/alloy-embedding-api`;
})();

/**
 * Live RetrievalAdapter that calls the AEF hybrid-search endpoint.
 * Returns retrieved chunks ranked by finalScore from the embed+rerank stack.
 */
function buildLiveAEFAdapter(tenantId: string): RetrievalAdapter {
  return {
    async retrieve(query: string, _profileId: string, k: number): Promise<RetrievedResult[]> {
      const response = await fetch(`${AEF_INTERNAL_BASE}/v1/hybrid-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({
          requestId: randomUUID(),
          tenantId,
          query,
          topK: k,
          candidatePool: Math.max(k * 3, 20),
          denseWeight: 0.6,
          keywordWeight: 0.4,
          includeProvenance: false,
        }),
      });
      if (!response.ok) {
        throw new Error(`AEF hybrid-search returned HTTP ${response.status}`);
      }
      const data = (await response.json()) as {
        hits?: Array<{ chunkId: string; finalScore: number }>;
      };
      return (data.hits ?? []).slice(0, k).map((h) => ({
        chunkId: h.chunkId,
        score: h.finalScore,
      }));
    },
  };
}

/**
 * Fixture-corpus adapter used for smoke/golden-fixture eval mode.
 * Uses text-overlap scoring on the pre-seeded domain fixture corpus — no
 * embedding service required. Suitable for CI and no-GPU environments.
 */
function buildMockCorpusAdapter(domain: AEFDomain): RetrievalAdapter {
  const corpus = ALL_MOCK_CORPORA[domain];
  return {
    async retrieve(query: string, _profileId: string, k: number): Promise<RetrievedResult[]> {
      const qLower = query.toLowerCase();
      const scored: Array<{ chunkId: string; score: number; boostTermsMatched: string[] }> = [];
      for (const [chunkId, { text, boostTerms }] of corpus.entries()) {
        const textLower = text.toLowerCase();
        let score = 0;
        const words = qLower.split(/\s+/).filter((w) => w.length > 3);
        let wordHits = 0;
        for (const w of words) {
          if (textLower.includes(w)) wordHits++;
        }
        score += (wordHits / Math.max(words.length, 1)) * 0.6;
        const boostHits: string[] = [];
        for (const term of boostTerms) {
          if (qLower.includes(term.toLowerCase()) || textLower.includes(term.toLowerCase())) {
            score += 0.1;
            boostHits.push(term);
          }
        }
        if (score > 0) scored.push({ chunkId, score, boostTermsMatched: boostHits });
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, k).map((s) => ({
        chunkId: s.chunkId,
        score: Math.min(s.score, 1),
        boostTermsMatched: s.boostTermsMatched,
      }));
    },
  };
}

const router: IRouter = Router();

export const runStore = new Map<string, EvalRunReport>();
const suiteStore = new Map<string, EvalSuiteDef>(ALL_SUITES.map((s: any) => [s.suiteId, s]));

upsertEvalForgeSuites(ALL_SUITES).catch(() => {});

loadRecentRunsFromDb(200)
  .then((runs) => {
    for (const r of runs) {
      if (!runStore.has(r.runId)) {
        runStore.set(r.runId, r);
      }
    }
  })
  .catch(() => {});

async function _runAndPersistNightly(): Promise<void> {
  try {
    const baselineStore = new Map<string, EvalRunReport>(
      Array.from(runStore.values()).reduce((acc, r) => {
        if (!acc.has(r.suiteId) || acc.get(r.suiteId)?.runAt < r.runAt) {
          acc.set(r.suiteId, r);
        }
        return acc;
      }, new Map<string, EvalRunReport>()),
    );
    const summary = await runNightlyEvals({
      triggeredBy: 'nightly-cron',
      baselineStore,
      executorFactory: defaultExecutorFactory,
      verbose: false,
    });
    for (const report of summary.suiteReports) {
      runStore.set(report.runId, report);
      persistEvalForgeRun(report).catch(() => {});
    }
  } catch {}
}

scheduleNightlyRun(2, {
  triggeredBy: 'nightly-cron',
  executorFactory: defaultExecutorFactory,
  verbose: false,
})
  .then(({ unschedule }: { unschedule: () => void }) => {
    process.once('SIGTERM', unschedule);
    process.once('SIGINT', unschedule);
  })
  .catch(() => {});

// `defaultExecutor` is now resolved per-suite via `buildDefaultExecutor`,
// which selects a real per-eval-type executor backed by the production AI
// gateway (`gatewayInfer`). Each executor returns shaped output the matching
// grader can score, so eval results reflect real model behaviour rather than
// echoing case input.

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
  'gpt-4o': 0.005,
  'gpt-4o-mini': 0.0006,
  'claude-3-5-sonnet': 0.006,
  'claude-3-haiku': 0.0005,
  'gemini-1.5-pro': 0.004,
};

// Map a variant model name → (provider, canonical model) used by the
// cognitive runtime / model router. Allows the eval UI to talk in friendly
// names while the loop pins routing to a real provider+model pair.
const MODEL_TO_PROVIDER: Record<string, { provider: string; model: string }> = {
  'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
  'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
  'claude-3-5-sonnet': { provider: 'anthropic', model: 'claude-3-5-sonnet' },
  'claude-3-haiku': { provider: 'anthropic', model: 'claude-3-haiku' },
  'gemini-1.5-pro': { provider: 'google', model: 'gemini-1.5-pro' },
};

// Map orchestration strategy → cognitive-runtime knobs that change loop behavior.
const STRATEGY_TO_RUNTIME: Record<
  string,
  {
    agentTier: 'assistant' | 'analyst' | 'operator' | 'autonomous';
    verifierEnabled: boolean;
    reflectionEnabled: boolean;
    maxVerifyRevisions: number;
  }
> = {
  default: {
    agentTier: 'analyst',
    verifierEnabled: true,
    reflectionEnabled: false,
    maxVerifyRevisions: 1,
  },
  'chain-of-thought': {
    agentTier: 'analyst',
    verifierEnabled: true,
    reflectionEnabled: false,
    maxVerifyRevisions: 2,
  },
  react: {
    agentTier: 'operator',
    verifierEnabled: true,
    reflectionEnabled: true,
    maxVerifyRevisions: 2,
  },
  reflection: {
    agentTier: 'operator',
    verifierEnabled: true,
    reflectionEnabled: true,
    maxVerifyRevisions: 3,
  },
  'multi-agent': {
    agentTier: 'autonomous',
    verifierEnabled: true,
    reflectionEnabled: true,
    maxVerifyRevisions: 3,
  },
};

function objectiveFromInput(input: any, caseId: string, domain: string): string {
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object') {
    if (typeof input.objective === 'string') return input.objective;
    if (typeof input.prompt === 'string') return input.prompt;
    if (typeof input.query === 'string') return input.query;
    if (typeof input.question === 'string') return input.question;
    try {
      return `Eval case ${caseId} (${domain}): ${JSON.stringify(input).slice(0, 400)}`;
    } catch {}
  }
  return `Eval case ${caseId} (${domain})`;
}

// Resolve a variant prompt id against the prompt registry. Accepts either a
// versionId (e.g. `support-classifier@v3`) or a definition id (in which case
// the active version is used). Returns null if nothing resolves so the
// executor can fall back to the cognitive runtime's default prompt selection
// (and surface a metadata flag so the UI / contract record reflects that).
function resolveVariantPrompt(
  promptId: string,
): { versionId: string; provider?: string; model?: string } | null {
  if (!promptId) return null;
  // Direct version match (e.g. "foo@v2").
  const directDefId = promptId.includes('@') ? promptId.split('@')[0]! : promptId;
  const def = promptRegistry.get(directDefId) ?? null;
  if (promptId.includes('@')) {
    const v = def ? promptRegistry.getVersion(directDefId, promptId) : undefined;
    if (v)
      return {
        versionId: v.versionId,
        provider: v.modelHints.preferredProvider,
        model: v.modelHints.preferredModel,
      };
  }
  if (def) {
    const v = promptRegistry.getActiveVersion(def.id);
    if (v)
      return {
        versionId: v.versionId,
        provider: v.modelHints.preferredProvider,
        model: v.modelHints.preferredModel,
      };
  }
  return null;
}

function buildVariantExecutor(
  model: string,
  strategy: string,
  promptId: string,
  suiteDomain?: string,
) {
  const runtimeKnobs = STRATEGY_TO_RUNTIME[strategy] ?? STRATEGY_TO_RUNTIME.default!;
  const pricePer1K = MODEL_PRICING_PER_1K[model] ?? MODEL_PRICING_PER_1K['gpt-4o-mini']!;
  const providerMap = MODEL_TO_PROVIDER[model];
  const promptResolution = resolveVariantPrompt(promptId);
  // Variant-pinned routing: prefer the explicit model→provider mapping, else
  // honor whatever provider/model the prompt version's modelHints suggest.
  const preferredProvider = providerMap?.provider ?? promptResolution?.provider;
  const preferredModel = providerMap?.model ?? promptResolution?.model ?? model;

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
        eventType: 'eval-case',
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

      const latencyMs = result.run.durationMs ?? Date.now() - startedAt;
      // Token estimate: cognitive-runtime doesn't expose per-loop token counts
      // in the public RunResult, so we estimate from objective + output size
      // (~4 chars/token) which is consistent with how MODEL_PRICING_PER_1K
      // is calibrated.
      const outputStr =
        typeof result.run.output === 'string'
          ? result.run.output
          : JSON.stringify(result.run.output ?? {});
      const tokensUsed = Math.max(1, Math.ceil((objective.length + outputStr.length) / 4));
      const costUsd = (tokensUsed / 1000) * pricePer1K;

      return {
        output: {
          summary: result.summary,
          output: result.run.output,
          status: result.run.status,
          phases: result.run.phases.map((p) => p.phase),
        },
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
      eventType: 'page_view' as const,
      path: null,
      metadata: {
        app: 'api-server',
        eventName: 'agent.eval.run',
        contract: 'AgentEvalRunContract',
        ...contract,
      },
    });
  } catch (err) {
    logger.warn({ err }, '[evals] failed to persist AgentEvalRunContract');
  }
}

router.get(
  '/evals',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
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
        status: r.totalCases > 0 ? 'completed' : 'empty',
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
      version: 'eval-forge-v1',
    });
  },
);

router.get(
  '/evals/suites',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserApiSlidingLimiter,
  validateQuery(listQuerySchema),
  (req, res) => {
    const domain = req.query.domain as string | undefined;
    const suites = domain ? (SUITE_BY_DOMAIN[domain] ?? []) : Array.from(suiteStore.values());

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
  '/evals/suites/:suiteId',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserApiSlidingLimiter,
  (req, res) => {
    const suiteId = req.params.suiteId as string;
    const suite = SUITE_BY_ID[suiteId] ?? suiteStore.get(suiteId);
    if (!suite) {
      res
        .status(404)
        .json({ error: 'Suite not found', availableSuiteIds: Array.from(suiteStore.keys()) });
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
  '/evals/runs',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
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
      const rFlag = hasRegression === 'true';
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
  '/evals/runs/:runId',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserApiSlidingLimiter,
  (req, res) => {
    const runId = req.params.runId as string;
    const run = runStore.get(runId);
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    res.json(run);
  },
);

router.get(
  '/evals/:id',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserApiSlidingLimiter,
  (req, res) => {
    const id = req.params.id as string;
    const suite = SUITE_BY_ID[id] ?? suiteStore.get(id);
    if (suite) {
      res.json({
        type: 'suite',
        ...suite,
        caseCount: suite.cases.length,
        redTeamCount: suite.cases.filter((c: { isRedTeam?: boolean }) => c.isRedTeam).length,
        graderTypes: [...new Set(suite.cases.map((c: { graderType: string }) => c.graderType))],
      });
      return;
    }
    const run = runStore.get(id);
    if (run) {
      res.json({ type: 'run', ...run });
      return;
    }
    res.status(404).json({ error: 'Not found', id });
  },
);

router.post(
  '/evals/run',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      suiteId: z.unknown().optional(),
      triggeredBy: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { suiteId, triggeredBy = 'api' } = req.body as {
        suiteId?: string;
        triggeredBy?: string;
      };

      if (!suiteId) {
        res.status(400).json({ error: 'suiteId is required' });
        return;
      }

      const suite = SUITE_BY_ID[suiteId] ?? suiteStore.get(suiteId);
      if (!suite) {
        res
          .status(404)
          .json({ error: 'Suite not found', availableSuiteIds: Array.from(suiteStore.keys()) });
        return;
      }

      const previousRun = Array.from(runStore.values())
        .filter((r) => r.suiteId === suiteId)
        .sort((a, b) => b.runAt.localeCompare(a.runAt))[0];

      const report = await runEvalSuite(suite, buildDefaultExecutor(suite), {
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
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
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
  '/evals/suites/:suiteId/runs/variant',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      baselineRunId: z.unknown().optional(),
      model: z.unknown().optional(),
      promptId: z.unknown().optional(),
      strategy: z.unknown().optional(),
      triggeredBy: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    const suiteId = req.params.suiteId as string;
    const {
      model = 'gpt-4o-mini',
      strategy = 'default',
      promptId = 'v2',
      baselineRunId,
      triggeredBy = 'variant-compare',
    } = req.body as {
      model?: string;
      strategy?: string;
      promptId?: string;
      baselineRunId?: string;
      triggeredBy?: string;
    };

    const suite = SUITE_BY_ID[suiteId] ?? suiteStore.get(suiteId);
    if (!suite) {
      res.status(404).json({ error: 'Suite not found', suiteId });
      return;
    }

    let baseline = baselineRunId
      ? (runStore.get(baselineRunId) ?? null)
      : (Array.from(runStore.values())
          .filter((r) => r.suiteId === suiteId)
          .sort((a, b) => b.runAt.localeCompare(a.runAt))[0] ?? null);
    // Reject a baseline that belongs to a different suite — comparing the
    // variant against the wrong suite's run produces meaningless regression
    // reports. Be explicit when an explicit baselineRunId is supplied.
    if (baselineRunId && baseline && baseline.suiteId !== suiteId) {
      res.status(400).json({
        error: 'baseline_suite_mismatch',
        message: `baselineRunId ${baselineRunId} belongs to suite ${baseline.suiteId}, not ${suiteId}`,
      });
      return;
    }
    // For implicit baseline lookup, the suiteId filter above already guarantees
    // a match — but defensively ignore any mismatch here too.
    if (baseline && baseline.suiteId !== suiteId) baseline = null;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (event: string, payload: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });

    try {
      send('start', {
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
          send('case', {
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
        regressionSeverity: report.regressionSeverity ?? 'none',
        triggeredBy: report.triggeredBy,
        avgLatencyMs: report.avgLatencyMs,
        totalCostUsd: report.totalCostUsd,
        variantModel: model,
        variantStrategy: strategy,
        variantPrompt: promptId,
        timestamp: Date.now(),
      };
      emitAgentEvalRunContract(evalContract).catch(() => {});

      send('complete', {
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
        regressionSeverity: report.regressionSeverity ?? 'none',
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
      send('error', { message: err instanceof Error ? err.message : 'Variant replay failed' });
      res.end();
    }
  },
);

router.post(
  '/evals/run-all',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      domain: z.unknown().optional(),
      triggeredBy: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { triggeredBy = 'api', domain } = req.body as { triggeredBy?: string; domain?: string };

      const suitesToRun = domain ? (SUITE_BY_DOMAIN[domain] ?? []) : ALL_SUITES;

      if (suitesToRun.length === 0) {
        res.status(404).json({ error: 'No suites found', domain });
        return;
      }

      const baselineStore = new Map<string, EvalRunReport>(
        Array.from(runStore.values())
          .filter((r) => suitesToRun.some((s: any) => s.suiteId === r.suiteId))
          .reduce((acc: any, run: any) => {
            if (!acc.has(run.suiteId) || (acc.get(run.suiteId) as any)?.runAt < run.runAt) {
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
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

router.patch(
  '/evals/scores/:scoreId/human-label',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      label: z.unknown().optional(),
      labeledBy: z.unknown().optional(),
      notes: z.unknown().optional(),
    }),
  ),
  (req, res) => {
    const { scoreId } = req.params;
    const { label, notes, labeledBy } = req.body as {
      label: 'pass' | 'partial' | 'fail';
      notes?: string;
      labeledBy?: string;
    };

    if (!['pass', 'partial', 'fail'].includes(label)) {
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

    res.status(404).json({ error: 'Score not found', scoreId });
  },
);

router.post(
  '/v1/evals/run',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      evalId: z.string().optional(),
      domain: z.string().optional(),
      profileId: z.string().optional(),
      version: z.string().optional(),
      queries: z.array(GoldenQuerySchema).optional(),
      topK: z.number().int().positive().optional(),
      useGoldenFixtures: z.boolean().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const {
        evalId = randomUUID(),
        domain,
        profileId,
        version,
        queries,
        topK,
        useGoldenFixtures = false,
      } = req.body as {
        evalId?: string;
        domain?: string;
        profileId?: string;
        version?: string;
        queries?: GoldenQuery[];
        topK?: number;
        useGoldenFixtures?: boolean;
      };

      const candidateDomain: string | undefined = domain ?? profileId;
      const resolvedDomain: AEFDomain | undefined = AEF_DOMAIN_PROFILE_DOMAINS.find(
        (d) => d === candidateDomain,
      );

      if (!resolvedDomain) {
        res.status(400).json({
          error: 'Valid domain or profileId is required',
          validDomains: AEF_DOMAIN_PROFILE_DOMAINS,
        });
        return;
      }

      const tenantId = String(
        (req as { user?: { orgs?: Array<{ orgId?: number }> } }).user?.orgs?.[0]?.orgId ??
          'default',
      );

      // If caller pins a specific profile version, use that exact version.
      // Otherwise resolve the tenant-active pointer for this domain.
      const profile =
        profileId && version
          ? defaultProfileRegistry.getProfile(profileId, version)
          : defaultProfileRegistry.getActiveProfileForTenant(tenantId, resolvedDomain);

      if (!profile) {
        const detail =
          profileId && version
            ? `Profile ${profileId}@${version} not found`
            : `No active profile for domain: ${resolvedDomain}`;
        res.status(404).json({ error: detail });
        return;
      }

      if (profile.domain !== resolvedDomain) {
        res.status(400).json({
          error: `Profile ${profile.profileId} belongs to domain '${profile.domain}', not '${resolvedDomain}'`,
        });
        return;
      }

      const goldenQueries: GoldenQuery[] =
        useGoldenFixtures || !queries || queries.length === 0
          ? ALL_GOLDEN_QUERIES[resolvedDomain]
          : queries;

      if (goldenQueries.length === 0) {
        res.status(400).json({ error: 'No queries provided and no golden fixtures available' });
        return;
      }

      const triggeredBy = (req as { user?: { id?: string } }).user?.id ?? 'api';

      // Use the live AEF hybrid-search stack by default. Fall back to the
      // fixture-corpus mock when useGoldenFixtures is explicitly requested,
      // or when the live endpoint is unreachable (dev/CI environments).
      const fixtureMode = useGoldenFixtures;
      let adapterMode: 'live' | 'fixture' = fixtureMode ? 'fixture' : 'live';
      const liveAdapter = buildLiveAEFAdapter(tenantId);
      const mockFallback = buildMockCorpusAdapter(resolvedDomain);

      const adapter: RetrievalAdapter = {
        async retrieve(query: string, profileId: string, k: number): Promise<RetrievedResult[]> {
          if (fixtureMode) return mockFallback.retrieve(query, profileId, k);
          try {
            return await liveAdapter.retrieve(query, profileId, k);
          } catch (liveErr) {
            adapterMode = 'fixture';
            logger.warn(
              { liveErr, domain: resolvedDomain },
              '[aef-evals] live AEF adapter unavailable, falling back to fixture corpus',
            );
            return mockFallback.retrieve(query, profileId, k);
          }
        },
      };

      const result = await runRetrievalEval({
        evalId,
        profile,
        queries: goldenQueries,
        adapter,
        topK,
      });

      const avgRecall = result.aggregateMetrics.find((m) => m.metric === 'recall')?.value ?? 0;
      const avgNdcg = result.aggregateMetrics.find((m) => m.metric === 'ndcg')?.value ?? 0;
      const avgMrr = result.aggregateMetrics.find((m) => m.metric === 'mrr')?.value ?? 0;

      const forgeMetrics: EvalForgeMetrics = {
        correctness: {
          passRate: result.queryCount > 0 ? result.successCount / result.queryCount : 0,
          avgScore: avgRecall,
          passed: result.successCount,
          failed: result.errorCount,
          total: result.queryCount,
        },
        evidenceQuality: {
          citationCoverage: avgNdcg,
          citationAccuracy: avgMrr,
          sourceVerified: result.successCount,
          totalCitations: result.queryCount,
          score: avgNdcg,
        },
        confidenceCalibration: {
          avgConfidence: avgRecall,
          calibrationError: 0,
          overconfidenceRate: 0,
          underconfidenceRate: 0,
          brierScore: 0,
          score: avgRecall,
        },
        latency: {
          avgLatencyMs: result.avgLatencyMs,
          p50LatencyMs: result.avgLatencyMs,
          p95LatencyMs: result.avgLatencyMs,
          p99LatencyMs: result.avgLatencyMs,
          maxLatencyMs: result.totalLatencyMs,
        },
        cost: {
          totalCostUsd: 0,
          avgCostUsd: 0,
          costPerOutcome: 0,
          totalTokensUsed: 0,
          avgTokensUsed: 0,
          p95CostUsd: 0,
        },
        interventionValue: {
          interventions: 0,
          totalDecisions: result.queryCount,
          interventionRate: 0,
          avgImprovementFromIntervention: 0,
          estimatedValueSaved: 0,
        },
        humanOverrideRate: {
          overrides: 0,
          totalDecisions: result.queryCount,
          overrideRate: 0,
          acceptedRate: 1,
          overrideReasons: {},
        },
        rollbackRate: {
          rollbacks: 0,
          totalActions: result.queryCount,
          rollbackRate: 0,
          rollbackReasons: {},
          avgRollbackLatencyMs: 0,
        },
        policyViolations: {
          totalChecks: result.queryCount,
          violations: 0,
          violationRate: 0,
          criticalViolations: 0,
          violationsByType: {},
          complianceRate: 1,
        },
      };

      const forgeReport: EvalRunReport = {
        runId: result.evalId,
        suiteId: `aef-retrieval:${resolvedDomain}`,
        suiteName: `AEF Retrieval — ${profile.displayName}`,
        domain: resolvedDomain,
        evalType: 'memory-retrieval',
        triggeredBy,
        totalCases: result.queryCount,
        passed: result.successCount,
        failed: result.errorCount,
        passRate: result.queryCount > 0 ? result.successCount / result.queryCount : 0,
        avgScore: avgRecall,
        avgLatencyMs: result.avgLatencyMs,
        totalCostUsd: 0,
        totalTokensUsed: 0,
        metrics: forgeMetrics,
        caseResults: [],
        runAt: result.ranAt,
        metadata: {
          profileVersion: result.profileVersion,
          tenantId,
          adapterMode,
          throughputQps: result.throughputQps,
          ndcg: avgNdcg,
          mrr: avgMrr,
        },
      };

      runStore.set(forgeReport.runId, forgeReport);
      persistEvalForgeRun(forgeReport).catch((err: unknown) => {
        logger.warn({ err }, '[aef-evals] failed to persist eval run to eval_forge_runs');
      });

      const runRecord: AEFRunRecord = {
        evalId: result.evalId,
        domain: resolvedDomain,
        profileId: result.profileId,
        profileVersion: result.profileVersion,
        tenantId,
        queryCount: result.queryCount,
        successCount: result.successCount,
        errorCount: result.errorCount,
        aggregateMetrics: result.aggregateMetrics,
        totalLatencyMs: result.totalLatencyMs,
        avgLatencyMs: result.avgLatencyMs,
        throughputQps: result.throughputQps,
        ranAt: result.ranAt,
        triggeredBy,
      };
      aefRunStore.set(result.evalId, runRecord);

      res.status(201).json({
        evalId: result.evalId,
        profileId: result.profileId,
        profileVersion: result.profileVersion,
        domain: resolvedDomain,
        adapterMode,
        queryCount: result.queryCount,
        successCount: result.successCount,
        errorCount: result.errorCount,
        aggregateMetrics: result.aggregateMetrics,
        totalLatencyMs: result.totalLatencyMs,
        avgLatencyMs: result.avgLatencyMs,
        throughputQps: result.throughputQps,
        ranAt: result.ranAt,
      });
    } catch (err) {
      logger.error({ err }, '[aef-evals] POST /v1/evals/run failed');
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

const PROMOTE_MODEL_ALIASES: Record<string, { provider: string; model: string }> = {
  'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
  'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
  'gpt-4-turbo': { provider: 'openai', model: 'gpt-4-turbo' },
  'claude-3-5-sonnet': { provider: 'anthropic', model: 'claude-3-5-sonnet' },
  'claude-3-haiku': { provider: 'anthropic', model: 'claude-3-haiku' },
  'claude-3-opus': { provider: 'anthropic', model: 'claude-3-opus' },
  'gemini-1.5-pro': { provider: 'gemini', model: 'gemini-1.5-pro' },
  'gemini-1.5-flash': { provider: 'gemini', model: 'gemini-1.5-flash' },
};

function resolveModelVersion(modelVersion: string): { model: string; preferredProvider?: string; aliasMatched: boolean } {
  for (const [alias, spec] of Object.entries(PROMOTE_MODEL_ALIASES)) {
    if (modelVersion === alias || modelVersion.startsWith(`${alias}:`) || modelVersion.startsWith(`${alias}-`)) {
      return { model: spec.model, preferredProvider: spec.provider, aliasMatched: true };
    }
  }
  return { model: modelVersion, aliasMatched: false };
}

/**
 * POST /evals/promote
 *
 * CI promotion gate: runs agent evals for a candidate model version and
 * blocks promotion if the gate fails. The result is automatically recorded
 * to the Decision Ledger via recordEvalRunToLedger() (called inside
 * runAgentEvals). A structured failure report is returned in the response
 * body when promotion is blocked so CI pipelines can surface the exact
 * conditions that failed.
 *
 * Returns 200 when promotion is approved or pending human review.
 * Returns 422 when the gate hard-blocks the candidate model.
 */
router.post(
  '/evals/promote',
  authMiddleware({ required: true }),
  requireRole('admin'),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      agent_id: z.unknown().optional(),
      model_version: z.unknown().optional(),
      dataset_id: z.unknown().optional(),
      baseline_eval_id: z.unknown().optional(),
      triggered_by: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const {
        agent_id,
        model_version,
        dataset_id,
        baseline_eval_id,
        triggered_by = 'ci:promote',
      } = req.body as {
        agent_id?: string;
        model_version?: string;
        dataset_id?: string;
        baseline_eval_id?: string;
        triggered_by?: string;
      };

      if (!agent_id) {
        res.status(400).json({ error: 'agent_id is required' });
        return;
      }
      if (!model_version) {
        res.status(400).json({ error: 'model_version is required' });
        return;
      }

      const resolvedModel = resolveModelVersion(model_version);
      if (!resolvedModel.aliasMatched) {
        logger.warn(
          { model_version, agent_id },
          '[evals/promote] model_version does not match a known alias; forwarding raw label to gateway',
        );
      }

      const inferenceExecutor: AgentEvalExecutor = async (input) => {
        const start = Date.now();
        const inputJson = JSON.stringify(input.input, null, 2);
        try {
          const response = await gatewayInfer({
            messages: [
              {
                role: 'system',
                content:
                  `You are an AI agent eval harness. Evaluate the following input for agent '${input.agent_id}'. ` +
                  `Return a JSON object with: inference_type (string), recommended_action (string), confidence (number 0-1), ` +
                  `evidence (array of objects with field "type"), and reasoning (string). ` +
                  `Be accurate — this output is scored against a known-correct expected output.`,
              },
              {
                role: 'user',
                content: `Eval case: ${input.case_id}\n\nInput:\n${inputJson}`,
              },
            ],
            strategy: 'fastest',
            maxTokens: 400,
            agentId: `ci-gate:${input.agent_id}`,
            domain: 'eval',
            model: resolvedModel.model,
            preferredProvider: resolvedModel.preferredProvider as GatewayRequest['preferredProvider'],
          });
          let parsed: Record<string, unknown>;
          try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as Record<string, unknown>) : {};
          } catch {
            parsed = { raw_response: response.content };
          }
          return { output: parsed, latency_ms: Date.now() - start };
        } catch (inferErr) {
          throw Object.assign(
            new Error(
              `[evals/promote] gateway inference unavailable for case ${input.case_id} ` +
              `(model: ${input.model_version}): ${inferErr instanceof Error ? inferErr.message : String(inferErr)}`,
            ),
            { code: 'GATEWAY_UNAVAILABLE' },
          );
        }
      };

      const evalRun = await runAgentEvals(inferenceExecutor, {
        agent_id,
        model_version,
        dataset_id,
        baseline_eval_id,
        run_type: 'ci_gate',
        triggered_by,
      });

      const promotionGate = {
        approved: evalRun.promotion_approved,
        decision: evalRun.promotion_decision,
        agent_id: evalRun.agent_id,
        model_version: evalRun.model_version,
        eval_id: evalRun.eval_id,
        aggregate_score: evalRun.aggregate_score,
        safety_flag_score: evalRun.dimension_scores.safety_flag,
        regression_cases: evalRun.regression_cases,
        blocked_reasons: evalRun.promotion_blocked_reasons,
        pending_reasons: evalRun.promotion_pending_reasons,
        replay_reviewed: false,
        human_reviewer_approved: false,
        gate_evaluated_at: evalRun.completed_at,
      };

      const failure_report = formatPromotionReport(promotionGate);

      if (evalRun.promotion_decision === 'block') {
        logger.warn(
          {
            agent_id,
            model_version,
            eval_id: evalRun.eval_id,
            blocked_reasons: evalRun.promotion_blocked_reasons,
            aggregate_score: evalRun.aggregate_score,
          },
          '[evals/promote] promotion blocked by CI gate',
        );
        res.status(422).json({
          promotion_blocked: true,
          decision: evalRun.promotion_decision,
          eval_id: evalRun.eval_id,
          agent_id: evalRun.agent_id,
          model_version: evalRun.model_version,
          aggregate_score: evalRun.aggregate_score,
          safety_flag_score: evalRun.dimension_scores.safety_flag,
          pass_rate: evalRun.pass_rate,
          cases_total: evalRun.cases_total,
          cases_failed: evalRun.cases_failed,
          regression_cases: evalRun.regression_cases,
          blocked_reasons: evalRun.promotion_blocked_reasons,
          failure_summary: evalRun.failure_summary,
          failure_report,
        });
        return;
      }

      res.status(200).json({
        promotion_blocked: false,
        decision: evalRun.promotion_decision,
        eval_id: evalRun.eval_id,
        agent_id: evalRun.agent_id,
        model_version: evalRun.model_version,
        aggregate_score: evalRun.aggregate_score,
        safety_flag_score: evalRun.dimension_scores.safety_flag,
        pass_rate: evalRun.pass_rate,
        cases_total: evalRun.cases_total,
        cases_passed: evalRun.cases_passed,
        cases_failed: evalRun.cases_failed,
        pending_reasons: evalRun.promotion_pending_reasons,
        promotion_report: failure_report,
      });
    } catch (err) {
      logger.error({ err }, '[evals/promote] eval gate failed');
      const isGatewayDown =
        err instanceof Error && (err as NodeJS.ErrnoException & { code?: string }).code === 'GATEWAY_UNAVAILABLE';
      const status = isGatewayDown ? 503 : 500;
      const message = err instanceof Error ? err.message : 'Internal error';
      res.status(status).json({
        error: isGatewayDown
          ? 'Gateway inference unavailable — promotion gate blocked. Ensure the AI gateway is reachable and retry.'
          : message,
        detail: isGatewayDown ? message : undefined,
      });
    }
  },
);

export default router;
