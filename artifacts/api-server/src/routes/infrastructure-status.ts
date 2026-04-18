import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { handleRouteError } from "../lib/api-response";

const router: IRouter = Router();

type ThreatLevel = "CLEAR" | "ELEVATED" | "ACTIVE" | "CRITICAL";

function computeStatus() {
  const now = Date.now();

  // Simulate time-varying metrics anchored to a stable seed so values feel
  // realistic but shift gradually across the day.
  const minuteOfDay = Math.floor((now / 60000) % 1440);
  const baseNoise = Math.sin(minuteOfDay / 120) * 0.5 + 0.5; // 0..1

  // AquilaScore: blend of base 93 with small daily variance
  const aquilaScore = Math.round(91 + baseNoise * 6); // 91-97

  // Active self-healing runs influence threat level
  const activeRemediation = Math.floor(baseNoise * 2); // 0-1 active runs
  const pendingApproval = baseNoise > 0.8 ? 1 : 0;

  let threatLevel: ThreatLevel;
  if (pendingApproval > 0 && activeRemediation > 0) {
    threatLevel = "ACTIVE";
  } else if (activeRemediation > 0) {
    threatLevel = "ELEVATED";
  } else {
    threatLevel = "CLEAR";
  }

  const uptime = 99.97 - (baseNoise * 0.05);
  const activeAgents = 12 + Math.floor(baseNoise * 4);
  const p95LatencyMs = Math.round(38 + baseNoise * 22);

  return {
    aquilaScore,
    threatLevel,
    uptime: parseFloat(uptime.toFixed(3)),
    activeAgents,
    p95LatencyMs,
    activeRemediation,
    pendingApproval,
    totalResources: 58,
    legionCount: 2,
    sovereignZones: 4,
    totalCostPerMonth: 14200,
    generatedAt: new Date(now).toISOString(),
  };
}

router.get(
  "/infrastructure/status",
  authMiddleware({ required: false }),
  (_req: Request, res: Response) => {
    try {
      res.json(computeStatus());
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch infrastructure status");
    }
  },
);

export default router;
