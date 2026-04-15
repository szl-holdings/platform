import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendError, sendBadRequest } from "../lib/api-response";
import { twinRegistry, vesselTwin, propertyTwin, postureTwin } from "@szl-holdings/ai-engine";
import type { VesselTwinState, PropertyTwinState, PostureTwinState, SimulationScenario } from "@szl-holdings/ai-engine";

const router = Router();

router.get("/digital-twins", authMiddleware, async (_req, res) => {
  const twins = twinRegistry.list();
  res.json({ success: true, twins, total: twins.length });
});

router.get("/digital-twins/:twinId", authMiddleware, async (req, res) => {
  const twin = twinRegistry.get(req.params.twinId);
  if (!twin) return sendError(res, 404, "Twin not found");
  res.json({ success: true, twin });
});

router.get("/digital-twins/entity/:entityId", authMiddleware, async (req, res) => {
  const twin = twinRegistry.getByEntity(req.params.entityId);
  if (!twin) return sendError(res, 404, "No twin registered for this entity");
  res.json({ success: true, twin });
});

router.get("/digital-twins/type/:type", authMiddleware, async (req, res) => {
  const type = req.params.type as "vessel" | "property" | "posture";
  if (!["vessel", "property", "posture"].includes(type)) return sendBadRequest(res, "Invalid twin type");
  const twins = twinRegistry.getByType(type);
  res.json({ success: true, twins });
});

router.post("/digital-twins/vessel", authMiddleware, async (req, res) => {
  try {
    const { entityId, state } = req.body as { entityId: string; state: VesselTwinState };
    if (!entityId || !state) return sendBadRequest(res, "entityId and state are required");
    const twin = vesselTwin.createTwin(entityId, state);
    res.json({ success: true, twin });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create vessel twin" });
  }
});

router.post("/digital-twins/property", authMiddleware, async (req, res) => {
  try {
    const { entityId, state } = req.body as { entityId: string; state: PropertyTwinState };
    if (!entityId || !state) return sendBadRequest(res, "entityId and state are required");
    const twin = propertyTwin.createTwin(entityId, state);
    res.json({ success: true, twin });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create property twin" });
  }
});

router.post("/digital-twins/posture", authMiddleware, async (req, res) => {
  try {
    const { entityId, state } = req.body as { entityId: string; state: PostureTwinState };
    if (!entityId || !state) return sendBadRequest(res, "entityId and state are required");
    const twin = postureTwin.createTwin(entityId, state);
    res.json({ success: true, twin });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create posture twin" });
  }
});

router.post("/digital-twins/:twinId/simulate", authMiddleware, async (req, res) => {
  try {
    const { scenario } = req.body as { scenario: SimulationScenario };
    if (!scenario) return sendBadRequest(res, "scenario is required");

    const twin = twinRegistry.get(req.params.twinId);
    if (!twin) return sendError(res, 404, "Twin not found");

    let result;
    if (twin.twinType === "vessel") {
      result = await vesselTwin.simulate(req.params.twinId, scenario);
    } else if (twin.twinType === "property") {
      result = await propertyTwin.simulate(req.params.twinId, scenario);
    } else if (twin.twinType === "posture") {
      result = await postureTwin.simulate(req.params.twinId, scenario);
    } else {
      return sendBadRequest(res, "Unknown twin type");
    }

    res.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Simulation failed";
    res.status(500).json({ success: false, error: msg });
  }
});

router.patch("/digital-twins/:twinId", authMiddleware, async (req, res) => {
  try {
    const updated = twinRegistry.update(req.params.twinId, req.body);
    if (!updated) return sendError(res, 404, "Twin not found");
    res.json({ success: true, twin: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update twin" });
  }
});

router.post("/digital-twins/demo/seed", authMiddleware, async (_req, res) => {
  try {
    const vesselState: VesselTwinState = {
      imoNumber: "9234567",
      name: "MV AURORA",
      currentPosition: { lat: 1.35, lon: 103.82, timestamp: new Date().toISOString() },
      heading: 275,
      speedKnots: 14.2,
      statusCode: "underway",
      destination: "Rotterdam (NLRTM)",
      eta: new Date(Date.now() + 14 * 24 * 3600000).toISOString(),
      fuelLevelPercent: 62,
      fuelConsumptionRate: 2.8,
      cargoStatus: "Full — 45,000MT bulk cargo",
      weatherConditions: { windSpeedKnots: 18, waveHeightM: 2.1, visibility: "good" },
      routeRiskLevel: "medium",
      sanctionsExposure: false,
      predictedArrivalConfidence: 0.87,
    };

    const propertyState: PropertyTwinState = {
      address: "345 Atlantic Ave, Brooklyn, NY",
      currentValuation: 4_200_000,
      lastAppraisalDate: new Date(Date.now() - 90 * 24 * 3600000).toISOString(),
      capRate: 0.062,
      noi: 260_400,
      occupancyRate: 0.91,
      weightedAverageLeaseTerm: 3.2,
      debtServiceCoverageRatio: 1.31,
      loanToValue: 0.68,
      marketTrend: "stable",
      tenantRiskScore: 38,
      floodRiskScore: 55,
      vacancyRisk: "low",
      comparableCapRate: 0.058,
      pricePerSqft: 485,
    };

    const postureState: PostureTwinState = {
      overallPostureScore: 67,
      criticalVulnerabilities: 3,
      highVulnerabilities: 12,
      meanTimeToDetect: 142,
      meanTimeToRespond: 315,
      attackSurfaceScore: 44,
      identityRiskScore: 58,
      dataExposureRisk: 41,
      endpointCoverage: 0.87,
      networkSegmentationScore: 62,
      zeroTrustMaturity: 2.1,
      incidentResponseReadiness: 71,
      threatActorTargeting: ["APT41", "Lazarus Group"],
      lastPenTestDate: new Date(Date.now() - 180 * 24 * 3600000).toISOString(),
      activeThreats: 2,
    };

    const vt = vesselTwin.createTwin("demo-vessel-aurora", vesselState);
    const pt = propertyTwin.createTwin("demo-property-brooklyn", propertyState);
    const st = postureTwin.createTwin("demo-posture-szl", postureState);

    res.json({ success: true, twins: { vessel: vt, property: pt, posture: st } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Demo seed failed" });
  }
});

export default router;
