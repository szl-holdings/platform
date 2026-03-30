import { Router, type IRouter } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess } from "../lib/api-response";
import { jobQueue, JOB_TYPES } from "../lib/job-queue";

const router: IRouter = Router();

router.get("/jobs/stats", authMiddleware(), requireRole("ops"), (_req, res) => {
  sendSuccess(res, jobQueue.getStats());
});

router.get("/jobs/recent", authMiddleware(), requireRole("ops"), (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
  sendSuccess(res, jobQueue.getRecentJobs(limit));
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

export default router;
