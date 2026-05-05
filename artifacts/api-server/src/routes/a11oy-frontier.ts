import { Router, type Request, type Response } from 'express';
import {
  approveInboxItem,
  approveInboxItemShared,
  dbGetStatsShared,
  dbListDownstreamShared,
  dbListInboxShared,
  dbListPromotionsShared,
  dbListTimelineShared,
  discardInboxItem,
  discardInboxItemShared,
  ensureFrontierIngestDbSchema,
  ensureFrontierIngestSchedule,
  getStats,
  getSpendCap,
  isFrontierIngestDbEnabled,
  isWorkerRunning,
  listInbox,
  listPromoted,
  listSources,
  listTimeline,
  pullAll,
  pullSource,
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
import { handleRouteError, sendSuccess, sendBadRequest } from '../lib/api-response.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
const requireAuth = authMiddleware({ required: true });

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
    sendSuccess(res, {
      ...(shared ?? inMem),
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
