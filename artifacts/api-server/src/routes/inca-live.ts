import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/inca/live/reports", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { reports: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch INCA reports"); }
});

export default router;
