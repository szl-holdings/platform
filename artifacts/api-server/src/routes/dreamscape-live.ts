import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dreamscape/live/campaigns", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { campaigns: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live campaigns"); }
});

router.get("/dreamscape/live/metrics", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { metrics: {}, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live metrics"); }
});

export default router;
