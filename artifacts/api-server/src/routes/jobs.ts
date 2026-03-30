import { Router, type IRouter } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess, sendError, sendBadRequest } from "../lib/api-response";
import { jobQueue, JOB_TYPES } from "../lib/job-queue";
import { getJobRegistry, triggerOnDemandJob, NAMED_JOB_TYPES, type NamedJobType } from "../lib/scheduled-jobs";
import { PLATFORM_JOB_TYPES } from "../lib/platform-jobs";
import { logActivity } from "../lib/activity-logger";

const router: IRouter = Router();

const ALL_JOB_TYPES = { ...JOB_TYPES, ...PLATFORM_JOB_TYPES };
const ALL_JOB_TYPE_VALUES = new Set(Object.values(ALL_JOB_TYPES));

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

router.get("/jobs/stats", authMiddleware(), requireRole("ops", "admin"), (_req, res) => {
  sendSuccess(res, jobQueue.getStats());
});

router.get("/jobs/recent", authMiddleware(), requireRole("ops", "admin"), (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
  sendSuccess(res, jobQueue.getRecentJobs(limit));
});

router.get("/jobs/registry", authMiddleware(), requireRole("ops", "admin"), (_req, res) => {
  sendSuccess(res, getJobRegistry());
});

router.get("/jobs/types", authMiddleware(), requireRole("ops", "admin"), (_req, res) => {
  const types = Array.from(ALL_JOB_TYPE_VALUES).map((type) => ({
    type,
    schedule: DAILY_JOBS.has(type) ? "daily" : HOURLY_JOBS.has(type) ? "hourly" : "on-demand",
  }));
  sendSuccess(res, { types, total: types.length });
});

router.get("/jobs/status", authMiddleware(), requireRole("ops", "admin"), (_req, res) => {
  const stats = jobQueue.getStats();
  const recent = jobQueue.getRecentJobs(50);

  const byType: Record<string, { completed: number; failed: number; avgDurationMs: number }> = {};
  for (const job of recent) {
    if (!byType[job.type]) byType[job.type] = { completed: 0, failed: 0, avgDurationMs: 0 };
    if (job.status === "completed") byType[job.type].completed++;
    if (job.status === "failed") byType[job.type].failed++;
    if (job.startedAt && job.completedAt) {
      byType[job.type].avgDurationMs = job.completedAt - job.startedAt;
    }
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
});

router.post("/jobs/enqueue", authMiddleware(), requireRole("ops", "admin"), async (req, res) => {
  try {
    const { type, payload, maxRetries } = req.body as { type: string; payload?: unknown; maxRetries?: number };

    if (!type || typeof type !== "string") {
      sendBadRequest(res, "type is required and must be a string");
      return;
    }

    if (!ALL_JOB_TYPE_VALUES.has(type)) {
      sendBadRequest(res, `Invalid job type: "${type}". Allowed types: ${Array.from(ALL_JOB_TYPE_VALUES).join(", ")}`);
      return;
    }

    const job = await jobQueue.enqueue(type, payload ?? {}, { maxRetries: maxRetries ?? 3 });
    await logActivity(req, "enqueue_job", "job", job.id, `Manually enqueued job: ${type}`);
    sendSuccess(res, { id: job.id, type: job.type, status: job.status }, 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to enqueue job";
    sendError(res, message, 500);
  }
});

const ON_DEMAND_TYPES = new Set<NamedJobType>([
  NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB,
  NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB,
  NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB,
  NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB,
]);

router.post("/jobs/trigger/:type", authMiddleware(), requireRole("ops"), async (req, res) => {
  const { type } = req.params;
  if (!type || !ON_DEMAND_TYPES.has(type as NamedJobType)) {
    const allowed = Array.from(ON_DEMAND_TYPES).join(", ");
    res.status(400).json({ error: `Unknown on-demand job type. Allowed: ${allowed}` });
    return;
  }
  try {
    const job = await triggerOnDemandJob(type as NamedJobType, req.body ?? {});
    sendSuccess(res, { id: job?.id, type: job?.type, status: job?.status }, 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to trigger job";
    res.status(500).json({ error: message });
  }
});

export default router;
