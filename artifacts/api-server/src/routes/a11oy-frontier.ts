import { Router, type Request, type Response } from 'express';
import {
  approveInboxItem,
  approveInboxItemShared,
  dbGetFrontierTableCounts,
  dbGetStatsShared,
  dbListDownstreamShared,
  dbListInboxShared,
  dbListPromotionsShared,
  dbListTimelineShared,
  discardInboxItem,
  discardInboxItemShared,
  ensureFrontierIngestDbSchema,
  ensureFrontierIngestSchedule,
  ensureFrontierRetentionSchedule,
  getDailySpendHydrated,
  getStats,
  getSpendCap,
  isFrontierIngestDbEnabled,
  isWorkerRunning,
  listInbox,
  listPromoted,
  listSources,
  listTimeline,
  pruneFrontierRetention,
  pullAll,
  pullSource,
  resolveFrontierRetentionConfig,
  setSpendCap,
  startWorker,
  stopWorker,
  _resetForTests,
} from '@workspace/frontier-ingest';
import { listAllPromotions } from '@workspace/frontier-ingest/adapters';
import {
  downstreamCounts,
  listAllDownstream,
  listDownstream,
  type DownstreamTarget,
} from '../a11oy/runtime/frontier-downstream.js';
import { createHash } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { handleRouteError, sendSuccess, sendBadRequest } from '../lib/api-response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
const requireAuth = authMiddleware({ required: true });

/**
 * Public, unauthenticated read of the promoted model catalog.
 *
 * Consumed by the public install of `tools/a11oy-code` (see
 * `src/providers/router.mjs`) so operators who set
 * `A11OY_FRONTIER_REGISTRY_URL` can auto-update their model registry
 * without provisioning a bearer token. Returns only the *promoted*
 * `operator_model_registry` entries with `kind === 'model'`, projected
 * to the minimal `{ id, provider, weight }` shape the router accepts.
 *
 * No score rationales, no inbox metadata, no internal IDs — this is
 * intentionally the narrowest possible projection of the catalog so we
 * don't leak codex internals to anonymous callers.
 *
 * Rate-limited per IP (separate budget from the global authenticated
 * limiter) and cache-friendly (max-age + ETag) so it can be hammered
 * from every install without melting the api-server.
 */
const PUBLIC_MODELS_CACHE_SECONDS = 300;

const publicModelsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 60 : 600,
  standardHeaders: true,
  legacyHeaders: true,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests for public model catalog. Please slow down.',
      code: 'RATE_LIMITED',
    });
  },
});

interface PublicModelEntry {
  id: string;
  provider: string;
  weight: number;
  kind: 'model';
}

function weightFromScore(composite: unknown): number {
  const n = typeof composite === 'number' ? composite : Number(composite);
  if (!Number.isFinite(n)) return 0.5;
  // Codex composite is already 0..1; clamp defensively.
  return Math.max(0, Math.min(1, n));
}

router.get(
  '/a11oy/frontier/public/models',
  publicModelsLimiter,
  async (req: Request, res: Response) => {
    try {
      await ensureFrontierIngestDbSchema();
      const shared = isFrontierIngestDbEnabled()
        ? await dbListPromotionsShared(200)
        : undefined;
      const rows = shared ?? listPromoted(200);

      // Deduplicate by `${provider}:${externalId}` — promotions can repeat
      // across pulls and the router contract expects each model once.
      const seen = new Set<string>();
      const models: PublicModelEntry[] = [];
      for (const row of rows) {
        const artifact = row.artifact;
        if (!artifact || artifact.kind !== 'model') continue;
        // Only surface promotions destined for the operator model registry.
        // Other promotion targets (eval_harness, benchmark_registry, ...) are
        // internal intelligence routing and must not leak to anonymous callers.
        if (row.target !== 'operator_model_registry') continue;
        const id = String(artifact.externalId || artifact.id || '').trim();
        const provider = String(artifact.provider || '').toLowerCase();
        if (!id || !provider) continue;
        const key = `${provider}:${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        models.push({
          id,
          provider,
          weight: weightFromScore(row.evidence?.score?.composite),
          kind: 'model',
        });
      }

      const generatedAt = new Date().toISOString().slice(0, 19) + 'Z';
      const body = { models, count: models.length, generatedAt };
      // ETag derived from the model set (id+provider+weight) — stable across
      // restarts as long as the promoted catalog is unchanged so installs
      // get cheap 304s.
      const etagSource = models
        .map((m) => `${m.provider}:${m.id}:${m.weight.toFixed(4)}`)
        .join('|');
      const etag = `W/"a11oy-models-${createHash('sha1').update(etagSource).digest('hex').slice(0, 16)}-${models.length}"`;

      res.setHeader('Cache-Control', `public, max-age=${PUBLIC_MODELS_CACHE_SECONDS}, s-maxage=${PUBLIC_MODELS_CACHE_SECONDS}`);
      res.setHeader('ETag', etag);
      res.setHeader('Vary', 'Accept-Encoding');

      const ifNoneMatch = req.headers['if-none-match'];
      if (typeof ifNoneMatch === 'string' && ifNoneMatch === etag) {
        return res.status(304).end();
      }

      res.status(200).json(body);
    } catch (err) {
      handleRouteError(res, err, 'Failed to load public model catalog');
    }
  },
);

interface AuthUser {
  id?: string;
  email?: string;
}

function reviewerOf(req: Request): string {
  const user = req.user as AuthUser | undefined;
  return user?.email ?? user?.id ?? 'operator';
}

const VALID_PROVIDERS = new Set(['anthropic', 'openai', 'google', 'nvidia', 'huggingface']);
const VALID_KINDS = new Set(['model', 'dataset', 'paper', 'tool', 'doctrine']);
const VALID_INBOX_STATUSES = new Set(['pending', 'approved', 'discarded']);

function parseProvider(v: unknown): 'anthropic' | 'openai' | 'google' | 'nvidia' | 'huggingface' | undefined {
  return typeof v === 'string' && VALID_PROVIDERS.has(v) ? (v as 'anthropic') : undefined;
}
function parseKind(v: unknown): 'model' | 'dataset' | 'paper' | 'tool' | 'doctrine' | undefined {
  return typeof v === 'string' && VALID_KINDS.has(v) ? (v as 'model') : undefined;
}
function parseInboxStatus(v: unknown): 'pending' | 'approved' | 'discarded' {
  return typeof v === 'string' && VALID_INBOX_STATUSES.has(v) ? (v as 'pending') : 'pending';
}
function parseLimit(v: unknown, def = 200): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.floor(n), 1_000);
}

// All read endpoints require auth — they expose the operator review queue and
// internal intelligence metadata (provider catalog, codex scores, promotion
// targets) which must not leak to anonymous callers.
router.get('/a11oy/frontier/stats', requireAuth, async (_req: Request, res: Response) => {
  try {
    // Surface scheduler state alongside stats so the UI never reports
    // "stopped" while Temporal is actually driving the schedule.
    const temporal = await ensureFrontierIngestSchedule();
    await ensureFrontierIngestDbSchema();
    const inMem = getStats();
    // Prefer DB-backed stats so the api-server reflects discoveries/queues/
    // promotions made by the Temporal worker process. Fall back to in-memory
    // when the DB backend is unavailable so the route never breaks.
    const shared = isFrontierIngestDbEnabled()
      ? await dbGetStatsShared(inMem.spendCapUsd, inMem.capReached, inMem.lastPullAt)
      : undefined;
    // Use the hydrated daily spend so a cold-start read reflects the
    // durable persisted window rather than the process-local 0.
    const daily = await getDailySpendHydrated();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const msUntilReset = Math.max(0, new Date(daily.windowStart).getTime() + DAY_MS - Date.now());
    sendSuccess(res, {
      ...(shared ?? inMem),
      dailySpend: {
        usd: daily.usd,
        capUsd: daily.capUsd,
        windowStart: daily.windowStart,
        msUntilReset,
      },
      backend: shared ? 'postgres-shared' : 'in-memory',
      scheduler: {
        authoritative: temporal.ok ? 'temporal' : 'in_process_dev',
        temporal: {
          scheduled: temporal.ok,
          scheduleId: temporal.scheduleId,
          taskQueue: temporal.taskQueue,
          unavailableReason: temporal.ok ? undefined : temporal.reason,
        },
        inProcessDevWorker: {
          running: isWorkerRunning(),
          optInEnv: process.env.FRONTIER_INGEST_DEV_WORKER === 'true',
        },
      },
      // legacy field kept for backwards compatibility — prefer
      // `scheduler.inProcessDevWorker.running` which is unambiguous.
      workerRunning: isWorkerRunning(),
      sources: listSources().map((s) => ({
        provider: s.provider,
        name: s.name,
        kind: s.kind,
        ratePerHour: s.ratePerHour,
      })),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load frontier stats');
  }
});

router.get('/a11oy/frontier/timeline', requireAuth, async (req: Request, res: Response) => {
  try {
    await ensureFrontierIngestDbSchema();
    const filter = {
      provider: parseProvider(req.query.provider),
      kind: parseKind(req.query.kind),
      limit: parseLimit(req.query.limit),
    };
    const shared = isFrontierIngestDbEnabled() ? await dbListTimelineShared(filter) : undefined;
    sendSuccess(res, {
      backend: shared ? 'postgres-shared' : 'in-memory',
      events: shared ?? listTimeline(filter),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load timeline');
  }
});

router.get('/a11oy/frontier/inbox', requireAuth, async (req: Request, res: Response) => {
  try {
    await ensureFrontierIngestDbSchema();
    const filter = { status: parseInboxStatus(req.query.status), limit: parseLimit(req.query.limit) };
    const shared = isFrontierIngestDbEnabled() ? await dbListInboxShared(filter) : undefined;
    sendSuccess(res, {
      backend: shared ? 'postgres-shared' : 'in-memory',
      items: shared ?? listInbox(filter),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load inbox');
  }
});

router.get('/a11oy/frontier/promoted', requireAuth, async (_req: Request, res: Response) => {
  try {
    await ensureFrontierIngestDbSchema();
    const shared = isFrontierIngestDbEnabled() ? await dbListPromotionsShared(200) : undefined;
    sendSuccess(res, {
      backend: shared ? 'postgres-shared' : 'in-memory',
      promoted: shared ?? listPromoted(200),
      stores: listAllPromotions(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load promotions');
  }
});

const DOWNSTREAM_TARGETS = new Set<DownstreamTarget>([
  'thesis_corpus',
  'eval_harness',
  'tool_proposals',
  'benchmark_registry',
]);

router.get('/a11oy/frontier/downstream', requireAuth, async (_req: Request, res: Response) => {
  try {
    await ensureFrontierIngestDbSchema();
    const shared = isFrontierIngestDbEnabled() ? await dbListDownstreamShared(undefined, 500) : undefined;
    sendSuccess(res, {
      backend: shared ? 'postgres-shared' : 'in-memory',
      counts: downstreamCounts(),
      stores: shared ? groupByTarget(shared) : listAllDownstream(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load downstream stores');
  }
});

router.get('/a11oy/frontier/downstream/:target', requireAuth, async (req: Request, res: Response) => {
  try {
    const target = req.params.target as DownstreamTarget;
    if (!DOWNSTREAM_TARGETS.has(target)) {
      return sendBadRequest(res, `Unknown downstream target: ${req.params.target}`);
    }
    await ensureFrontierIngestDbSchema();
    const limit = parseLimit(req.query.limit);
    const shared = isFrontierIngestDbEnabled() ? await dbListDownstreamShared(target, limit) : undefined;
    sendSuccess(res, {
      backend: shared ? 'postgres-shared' : 'in-memory',
      target,
      records: shared ?? listDownstream(target, limit),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load downstream store');
  }
});

function groupByTarget(rows: Array<{ target: string; artifactId: string; proofChainRef?: string; payload: unknown; at: string }>): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {
    thesis_corpus: [], eval_harness: [], tool_proposals: [], benchmark_registry: [],
  };
  for (const r of rows) (out[r.target] ??= []).push(r);
  return out;
}

router.post('/a11oy/frontier/inbox/:id/approve', requireAuth, async (req: Request, res: Response) => {
  try {
    const note = typeof (req.body ?? {}).note === 'string' ? req.body.note : undefined;
    // Cross-process: when DB is enabled, prefer the shared variant
    // so we can approve items that were queued by the Temporal worker
    // process (and therefore aren't in this process's in-memory inbox).
    // Falls back to the in-memory path if DB is unavailable.
    const item = (await approveInboxItemShared(req.params.id, reviewerOf(req), note))
      ?? approveInboxItem(req.params.id, reviewerOf(req), note);
    if (!item) return sendBadRequest(res, 'Inbox item not found');
    sendSuccess(res, { item });
  } catch (err) {
    handleRouteError(res, err, 'Failed to approve inbox item');
  }
});

router.post('/a11oy/frontier/inbox/:id/discard', requireAuth, async (req: Request, res: Response) => {
  try {
    const note = typeof (req.body ?? {}).note === 'string' ? req.body.note : undefined;
    const item = (await discardInboxItemShared(req.params.id, reviewerOf(req), note))
      ?? discardInboxItem(req.params.id, reviewerOf(req), note);
    if (!item) return sendBadRequest(res, 'Inbox item not found');
    sendSuccess(res, { item });
  } catch (err) {
    handleRouteError(res, err, 'Failed to discard inbox item');
  }
});

router.post('/a11oy/frontier/pull', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as { source?: string; synthetic?: Record<string, unknown> };
    if (body.source) {
      const src = listSources().find((s) => s.name === body.source);
      if (!src) return sendBadRequest(res, `Unknown source: ${body.source}`);
      const result = await pullSource(src, { syntheticFeeds: body.synthetic });
      return sendSuccess(res, {
        source: src.name,
        artifactCount: result.artifacts.length,
        evidence: result.evidence,
        costUsd: result.costUsd,
      });
    }
    await pullAll({ syntheticFeeds: body.synthetic });
    sendSuccess(res, { ok: true, stats: getStats() });
  } catch (err) {
    handleRouteError(res, err, 'Failed to trigger pull');
  }
});

/**
 * Scheduler status — surfaces the *authoritative* scheduler state.
 * In production the scheduler is Temporal (`frontierIngestWorkflow` on
 * the `szl-frontier-ingest` task queue); the in-process dev worker is
 * only running when an operator explicitly opted in via
 * `FRONTIER_INGEST_DEV_WORKER=true`. Returns both so the UI never
 * misreports "stopped" while Temporal is active.
 */
router.get('/a11oy/frontier/scheduler', requireAuth, async (_req: Request, res: Response) => {
  try {
    const temporal = await ensureFrontierIngestSchedule();
    sendSuccess(res, {
      authoritativeScheduler: temporal.ok ? 'temporal' : 'in_process_dev',
      temporal: {
        scheduled: temporal.ok,
        scheduleId: temporal.scheduleId,
        workflowType: temporal.workflowType,
        taskQueue: temporal.taskQueue,
        unavailableReason: temporal.ok ? undefined : temporal.reason,
      },
      inProcessDevWorker: {
        running: isWorkerRunning(),
        optInEnv: process.env.FRONTIER_INGEST_DEV_WORKER === 'true',
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load scheduler state');
  }
});

/**
 * Dev-only in-process worker controls. These are intentionally NOT the
 * production controls — Temporal owns the durable schedule. Operators
 * use these in dev when Temporal isn't available locally; they require
 * `force:true` or `FRONTIER_INGEST_DEV_WORKER=true` to actually start.
 */
router.post('/a11oy/frontier/worker/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as { intervalMs?: number; force?: boolean };
    startWorker({ intervalMs: body.intervalMs, force: body.force === true });
    sendSuccess(res, {
      running: isWorkerRunning(),
      note: 'in-process dev worker only — Temporal is the production scheduler',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to start worker');
  }
});

router.post('/a11oy/frontier/worker/stop', requireAuth, async (_req: Request, res: Response) => {
  try {
    stopWorker();
    sendSuccess(res, {
      running: isWorkerRunning(),
      note: 'in-process dev worker only — Temporal schedule is unaffected',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to stop worker');
  }
});

router.post('/a11oy/frontier/cost-cap', requireAuth, async (req: Request, res: Response) => {
  try {
    const usd = Number((req.body ?? {}).usd);
    if (!Number.isFinite(usd) || usd < 0) return sendBadRequest(res, 'usd must be a non-negative number');
    setSpendCap(usd);
    sendSuccess(res, { spendCapUsd: getSpendCap() });
  } catch (err) {
    handleRouteError(res, err, 'Failed to set spend cap');
  }
});

/**
 * Admin: current row counts for every `frontier_*` table.
 *
 * Surfaces table growth so operators can see whether the retention sweep
 * is actually keeping the engine lean — without this they'd have to shell
 * into the DB to verify. Also reports the configured retention windows and
 * the Temporal schedule state for the retention workflow so the UI can
 * show a single "storage health" panel.
 */
router.get('/a11oy/frontier/admin/table-counts', requireAuth, async (_req: Request, res: Response) => {
  try {
    await ensureFrontierIngestDbSchema();
    const counts = isFrontierIngestDbEnabled() ? await dbGetFrontierTableCounts() : undefined;
    const retentionCfg = resolveFrontierRetentionConfig();
    const retentionSchedule = await ensureFrontierRetentionSchedule();
    sendSuccess(res, {
      persisted: isFrontierIngestDbEnabled(),
      counts: counts ?? null,
      retention: {
        timelineDays: retentionCfg.timelineDays,
        discardedInboxDays: retentionCfg.discardedInboxDays,
        intervalMs: retentionCfg.intervalMs,
      },
      retentionScheduler: {
        scheduled: retentionSchedule.ok,
        scheduleId: retentionSchedule.scheduleId,
        workflowType: retentionSchedule.workflowType,
        taskQueue: retentionSchedule.taskQueue,
        unavailableReason: retentionSchedule.ok ? undefined : retentionSchedule.reason,
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load frontier table counts');
  }
});

/**
 * Admin: on-demand retention sweep. The scheduled Temporal workflow is
 * the production path; this endpoint lets operators force a sweep without
 * waiting for the next tick (e.g. after a burst of test discoveries
 * flooded the timeline).
 */
router.post('/a11oy/frontier/admin/prune', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as { timelineDays?: number; discardedInboxDays?: number };
    const overrides: { timelineDays?: number; discardedInboxDays?: number } = {};
    if (typeof body.timelineDays === 'number' && body.timelineDays > 0) {
      overrides.timelineDays = body.timelineDays;
    }
    if (typeof body.discardedInboxDays === 'number' && body.discardedInboxDays > 0) {
      overrides.discardedInboxDays = body.discardedInboxDays;
    }
    await ensureFrontierIngestDbSchema();
    if (!isFrontierIngestDbEnabled()) {
      return sendSuccess(res, {
        persisted: false,
        skipped: true,
        note: 'DB backend disabled — nothing to prune',
      });
    }
    const result = await pruneFrontierRetention(overrides);
    sendSuccess(res, { persisted: true, result: result ?? null });
  } catch (err) {
    handleRouteError(res, err, 'Failed to prune frontier retention');
  }
});

router.post('/a11oy/frontier/_reset', requireAuth, async (_req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return sendBadRequest(res, 'reset disabled in production');
    }
    _resetForTests();
    sendSuccess(res, { ok: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to reset');
  }
});

export default router;
