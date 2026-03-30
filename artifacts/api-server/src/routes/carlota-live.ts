import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/carlota/live/consulting", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { sessions: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Carlota live data"); }
});

export default router;
