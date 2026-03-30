import { Router, type IRouter } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess } from "../lib/api-response";
import { jobQueue, JOB_TYPES } from "../lib/job-queue";
import { getJobRegistry, triggerOnDemandJob, NAMED_JOB_TYPES, type NamedJobType } from "../lib/scheduled-jobs";

const router: IRouter = Router();

router.get("/jobs/stats", authMiddleware(), requireRole("ops"), (_req, res) => {
  sendSuccess(res, jobQueue.getStats());
});

router.get("/jobs/recent", authMiddleware(), requireRole("ops"), (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
  sendSuccess(res, jobQueue.getRecentJobs(limit));
});

router.get("/jobs/registry", (_req, res) => {
  sendSuccess(res, getJobRegistry());
});

router.post("/jobs/enqueue", authMiddleware(), requireRole("ops"), async (req, res) => {
  try {
    const { type, payload, maxRetries } = req.body;
    if (!type || !Object.values(JOB_TYPES).includes(type)) {
      res.status(400).json({ error: `Invalid job type. Allowed: ${Object.values(JOB_TYPES).join(", ")}` });
      return;
    }
    const job = await jobQueue.enqueue(type, payload ?? {}, { maxRetries });
    sendSuccess(res, { id: job.id, type: job.type, status: job.status }, 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to enqueue job";
    res.status(500).json({ error: message });
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
