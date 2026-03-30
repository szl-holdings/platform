import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/firestorm/live/threats", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { threats: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live threats"); }
});

router.get("/firestorm/live/incidents", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { incidents: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live incidents"); }
});

export default router;
