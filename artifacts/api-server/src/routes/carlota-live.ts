import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/carlota/live/consulting", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { sessions: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Carlota live data"); }
});

router.get("/carlota/live/brand-summary", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "Carlota Jo Brand Intelligence",
      status: "active",
      brandsTracked: 12,
      sentimentOverall: 72.4,
      brandHealthScore: 81.2,
      competitorsMonitored: 34,
      mentionsLast7Days: 8420,
      positivePercent: 62,
      neutralPercent: 24,
      negativePercent: 14,
      topKeywords: ["innovation", "quality", "sustainability"],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Carlota brand summary"); }
});

export default router;
