import { bodyShape } from '@szl-holdings/contracts/common';
import type { DurableJobStatus } from '@szl-holdings/forge-runtime';
import { type IRouter, Router } from 'express';
import { logActivity } from '../lib/activity-logger';
import { sendBadRequest, sendError, sendSuccess } from '../lib/api-response';
import { durableJobQueue, durableScheduler } from '../lib/durable-init';
import { JOB_TYPES } from '../lib/job-queue';
import { PLATFORM_JOB_TYPES } from '../lib/platform-jobs';
import { getJobRegistry, NAMED_JOB_TYPES } from '../lib/scheduled-jobs';
import {
  durableJobEnqueueSchema,
  jobEnqueueSchema,
  jobScheduleEnableSchema,
  listQuerySchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

const ALL_JOB_TYPES = { ...JOB_TYPES, ...PLATFORM_JOB_TYPES, ...NAMED_JOB_TYPES };
const ALL_JOB_TYPE_VALUES = new Set<string>(Object.values(ALL_JOB_TYPES));

const VALID_JOB_STATUSES = new Set<DurableJobStatus>([
  'pending',
  'running',
  'completed',
  'failed',
  'dead_letter',
  'cancelled',
  'waiting',
]);

function parseStatus(raw: unknown): DurableJobStatus | undefined {
  if (typeof raw === 'string' && VALID_JOB_STATUSES.has(raw as DurableJobStatus)) {
    return raw as DurableJobStatus;
  }
  return undefined;
}

const DAILY_JOBS = new Set<string>([
  PLATFORM_JOB_TYPES.LYTE_DIGEST,
  PLATFORM_JOB_TYPES.READINESS_DIGEST,
  PLATFORM_JOB_TYPES.EXCEPTION_SUMMARY,
  PLATFORM_JOB_TYPES.ARTIFACT_CLEANUP,
  PLATFORM_JOB_TYPES.FEATURE_FLAG_SYNC,
  JOB_TYPES.DAILY_DIGEST,
]);

const HOURLY_JOBS = new Set<string>([
  PLATFORM_JOB_TYPES.SIGNAL_NORMALIZATION,
  PLATFORM_JOB_TYPES.STALE_ACTION_SCAN,
  PLATFORM_JOB_TYPES.VESSEL_ETA_REFRESH,
  PLATFORM_JOB_TYPES.ROUTE_PRESSURE_SCAN,
  JOB_TYPES.HEALTH_SCAN,
  JOB_TYPES.ALERT_CHECK,
]);

const ON_DEMAND_JOBS = new Set<string>([
  PLATFORM_JOB_TYPES.WORKFLOW_RETRY,
  PLATFORM_JOB_TYPES.ARTIFACT_GENERATION,
  PLATFORM_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE,
  PLATFORM_JOB_TYPES.READINESS_SCORE_RECOMPUTE,
  JOB_TYPES.WEBHOOK_DELIVERY,
  JOB_TYPES.REPORT_GENERATION,
  JOB_TYPES.NOTIFICATION_DISPATCH,
  JOB_TYPES.EMAIL_SEND,
  JOB_TYPES.READINESS_CHECK,
]);

router.get('/jobs/stats', authMiddleware(), requireRole('ops', 'admin'), async (_req, res) => {
  try {
    const stats = await durableJobQueue.getStats();
    sendSuccess(res, { timestamp: new Date().toISOString(), ...stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get job stats';
    sendError(res, message, 500);
  }
});

router.get(
  '/jobs/recent',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
      const jobs = await durableJobQueue.getRecentJobs(limit);
      sendSuccess(res, { jobs, total: jobs.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get recent jobs';
      sendError(res, message, 500);
    }
  },
);

router.get('/jobs/registry', authMiddleware(), requireRole('ops', 'admin'), async (_req, res) => {
  try {
    const registry = await getJobRegistry();
    sendSuccess(res, registry);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get job registry';
    sendError(res, message, 500);
  }
});

router.get('/jobs/types', authMiddleware(), requireRole('ops', 'admin'), (_req, res) => {
  const types = Array.from(ALL_JOB_TYPE_VALUES).map((type) => ({
    type,
    schedule: DAILY_JOBS.has(type) ? 'daily' : HOURLY_JOBS.has(type) ? 'hourly' : 'on-demand',
  }));
  sendSuccess(res, { types, total: types.length });
});

router.get('/jobs/status', authMiddleware(), requireRole('ops', 'admin'), async (_req, res) => {
  try {
    const [stats, recent] = await Promise.all([
      durableJobQueue.getStats(),
      durableJobQueue.getRecentJobs(50),
    ]);

    const byTypeAccum: Record<
      string,
      { completed: number; failed: number; totalDurationMs: number; durationCount: number }
    > = {};
    for (const job of recent) {
      if (!byTypeAccum[job.type])
        byTypeAccum[job.type] = { completed: 0, failed: 0, totalDurationMs: 0, durationCount: 0 };
      if (job.status === 'completed') byTypeAccum[job.type]!.completed++;
      if (job.status === 'failed') byTypeAccum[job.type]!.failed++;
      if (job.startedAt && job.completedAt) {
        const durationMs = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
        byTypeAccum[job.type]!.totalDurationMs += durationMs;
        byTypeAccum[job.type]!.durationCount++;
      }
    }
    const byType: Record<string, { completed: number; failed: number; avgDurationMs: number }> = {};
    for (const [type, data] of Object.entries(byTypeAccum)) {
      byType[type] = {
        completed: data.completed,
        failed: data.failed,
        avgDurationMs:
          data.durationCount > 0 ? Math.round(data.totalDurationMs / data.durationCount) : 0,
      };
    }

    sendSuccess(res, {
      timestamp: new Date().toISOString(),
      stats,
      byType,
      scheduledTypes: {
        daily: Array.from(DAILY_JOBS),
        hourly: Array.from(HOURLY_JOBS),
        onDemand: Array.from(ON_DEMAND_JOBS),
      },
      recentJobs: recent.slice(0, 20),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get job status';
    sendError(res, message, 500);
  }
});

router.post(
  '/jobs/enqueue',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(jobEnqueueSchema),
  async (req, res) => {
    try {
      const { type, payload, maxRetries } = req.body;

      if (!ALL_JOB_TYPE_VALUES.has(type)) {
        sendBadRequest(
          res,
          `Invalid job type: "${type}". Allowed types: ${Array.from(ALL_JOB_TYPE_VALUES).join(', ')}`,
        );
        return;
      }

      const job = await durableJobQueue.enqueue(type, payload ?? {}, {
        maxRetries: maxRetries ?? 3,
        metadata: { enqueuedBy: 'admin-api' },
      });
      await logActivity(req, 'enqueue_job', 'job', job.id, `Manually enqueued job: ${type}`);
      sendSuccess(res, { id: job.id, type: job.type, status: job.status }, 202);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enqueue job';
      sendError(res, message, 500);
    }
  },
);

router.post(
  '/jobs/trigger/:type',
  authMiddleware(),
  requireRole('ops'),
  validateBody(bodyShape({})),
  async (req, res) => {
    const { type } = req.params as Record<string, string>;
    const ON_DEMAND_TYPES = new Set<string>([
      NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB,
      NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB,
      NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB,
      NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB,
      PLATFORM_JOB_TYPES.WORKFLOW_RETRY,
      PLATFORM_JOB_TYPES.ARTIFACT_GENERATION,
      PLATFORM_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE,
      PLATFORM_JOB_TYPES.READINESS_SCORE_RECOMPUTE,
    ]);
    if (!type || !ON_DEMAND_TYPES.has(type)) {
      const allowed = Array.from(ON_DEMAND_TYPES).join(', ');
      res.status(400).json({ error: `Unknown on-demand job type. Allowed: ${allowed}` });
      return;
    }
    try {
      const job = await durableJobQueue.enqueue(type, req.body ?? {}, {
        maxRetries: 2,
        metadata: { enqueuedBy: 'trigger-api' },
      });
      sendSuccess(res, { id: job.id, type: job.type, status: job.status }, 202);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to trigger job';
      res.status(500).json({ error: message });
    }
  },
);

router.get(
  '/jobs/durable/stats',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (_req, res) => {
    try {
      const stats = await durableJobQueue.getStats();
      sendSuccess(res, { timestamp: new Date().toISOString(), ...stats });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get durable queue stats';
      sendError(res, message, 500);
    }
  },
);

router.get(
  '/jobs/durable/recent',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
      const status = parseStatus(req.query.status);
      const type = req.query.type as string | undefined;
      const queue = req.query.queue as string | undefined;

      const jobs = await durableJobQueue.getRecentJobs(limit, { status, type, queue });
      sendSuccess(res, { jobs, total: jobs.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get recent durable jobs';
      sendError(res, message, 500);
    }
  },
);

router.get(
  '/jobs/durable/dead-letter',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
      const dlq = await durableJobQueue.getDeadLetterQueue(limit);
      sendSuccess(res, { entries: dlq, total: dlq.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get dead letter queue';
      sendError(res, message, 500);
    }
  },
);

router.post(
  '/jobs/durable/dead-letter/:jobId/replay',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const jobId = String(req.params.jobId ?? '');
      const job = await durableJobQueue.replayDeadLetterJob(jobId);
      await logActivity(
        req,
        'replay_dead_letter_job',
        'job',
        jobId,
        `Replayed dead letter job: ${jobId}`,
      );
      sendSuccess(res, { id: job.id, type: job.type, status: job.status }, 202);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to replay dead letter job';
      sendError(res, message, 500);
    }
  },
);

router.post(
  '/jobs/durable/:jobId/cancel',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const jobId = String(req.params.jobId ?? '');
      const cancelled = await durableJobQueue.cancelJob(jobId);
      if (!cancelled) {
        sendBadRequest(
          res,
          `Job ${jobId} is not in a cancellable state (must be pending or waiting)`,
        );
        return;
      }
      await logActivity(req, 'cancel_job', 'job', jobId, `Cancelled durable job: ${jobId}`);
      sendSuccess(res, { jobId, cancelled: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel job';
      sendError(res, message, 500);
    }
  },
);

router.post(
  '/jobs/durable/enqueue',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(durableJobEnqueueSchema),
  async (req, res) => {
    try {
      const { type, payload, priority, queue, maxRetries, dependsOn, scheduledAt } = req.body;

      const job = await durableJobQueue.enqueue(type, payload ?? {}, {
        priority: priority ?? 'normal',
        queue: queue ?? 'default',
        maxRetries: maxRetries ?? 3,
        dependsOn: dependsOn ?? [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        metadata: { enqueuedBy: 'admin-api' },
      });

      await logActivity(req, 'enqueue_durable_job', 'job', job.id, `Enqueued durable job: ${type}`);
      sendSuccess(res, { id: job.id, type: job.type, queue: job.queue, status: job.status }, 202);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enqueue durable job';
      sendError(res, message, 500);
    }
  },
);

router.get('/jobs/schedules', authMiddleware(), requireRole('ops', 'admin'), async (_req, res) => {
  try {
    const schedules = await durableScheduler.getSchedules();
    sendSuccess(res, { schedules, total: schedules.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get schedules';
    sendError(res, message, 500);
  }
});

router.patch(
  '/jobs/schedules/:name/enable',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(jobScheduleEnableSchema),
  async (req, res) => {
    try {
      const name = String(req.params.name ?? '');
      const { enabled } = req.body;
      await durableScheduler.enableSchedule(name, enabled);
      await logActivity(
        req,
        'update_schedule',
        'schedule',
        name,
        `${enabled ? 'Enabled' : 'Disabled'} schedule: ${name}`,
      );
      sendSuccess(res, { name, enabled });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update schedule';
      sendError(res, message, 500);
    }
  },
);

router.post(
  '/jobs/schedules/:name/trigger',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const name = String(req.params.name ?? '');
      await durableScheduler.triggerNow(name);
      await logActivity(
        req,
        'trigger_schedule',
        'schedule',
        name,
        `Manually triggered schedule: ${name}`,
      );
      sendSuccess(res, { name, triggered: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to trigger schedule';
      sendError(res, message, 500);
    }
  },
);

router.get(
  '/jobs/durable/dashboard',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (_req, res) => {
    try {
      const [stats, recentJobs, dlq, schedules] = await Promise.all([
        durableJobQueue.getStats(),
        durableJobQueue.getRecentJobs(20),
        durableJobQueue.getDeadLetterQueue(10),
        durableScheduler.getSchedules(),
      ]);

      const alertsTriggered: string[] = [];
      if (stats.failureRate > 10)
        alertsTriggered.push(`High failure rate: ${stats.failureRate.toFixed(1)}%`);
      if (stats.deadLetter > 50)
        alertsTriggered.push(`Dead letter queue depth: ${stats.deadLetter} entries`);
      if (stats.pending > 500)
        alertsTriggered.push(`Queue depth critical: ${stats.pending} pending jobs`);

      sendSuccess(res, {
        timestamp: new Date().toISOString(),
        health: {
          status: alertsTriggered.length === 0 ? 'healthy' : 'degraded',
          alerts: alertsTriggered,
        },
        stats,
        recentJobs,
        deadLetterQueue: dlq,
        schedules,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get dashboard data';
      sendError(res, message, 500);
    }
  },
);

export default router;
