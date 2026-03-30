import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/lyte/live/signals", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { signals: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live signals"); }
});

router.get("/lyte/live/incidents", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { incidents: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live incidents"); }
});

export default router;
