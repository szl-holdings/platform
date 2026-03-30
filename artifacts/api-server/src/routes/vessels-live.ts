import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/vessels/live/ais", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { vessels: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch AIS data"); }
});

router.get("/vessels/live/weather", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { weather: {}, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch weather data"); }
});

export default router;
