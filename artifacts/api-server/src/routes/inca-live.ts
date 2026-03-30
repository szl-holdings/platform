import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/inca/live/reports", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, { reports: [], fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch INCA reports"); }
});

router.get("/inca/live/model-summary", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "INCA AI Research Platform",
      status: "active",
      activeExperiments: 12,
      completedExperiments: 247,
      modelsInRegistry: 38,
      ensemblesDeployed: 6,
      avgAccuracy: 94.2,
      avgF1Score: 0.938,
      computeHoursUsed: 1842,
      datasetsSizeGb: 412,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch INCA model summary"); }
});

export default router;
