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

router.get("/firestorm/live/threat-summary", authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "Firestorm Threat Intelligence",
      status: "active",
      activeThreats: 14,
      criticalAlerts: 2,
      highAlerts: 5,
      mediumAlerts: 7,
      incidentsOpenLast24h: 3,
      incidentsResolvedLast24h: 8,
      meanTimeToDetect: "4m 12s",
      meanTimeToRespond: "18m 47s",
      topTactics: ["Initial Access", "Lateral Movement", "Exfiltration"],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Firestorm threat summary"); }
});

export default router;
