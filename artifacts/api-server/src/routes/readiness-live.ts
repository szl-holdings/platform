import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/readiness/live/assessments", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { assessments: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch readiness assessments"); }
});

router.get("/readiness/live/metrics", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { metrics: {}, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch readiness metrics"); }
});

export default router;
