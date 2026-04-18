import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendError, sendBadRequest } from "../lib/api-response";
import { twinRegistry, vesselTwin, propertyTwin, postureTwin } from "@szl-holdings/ai-engine";
import type { VesselTwinState, PropertyTwinState, PostureTwinState, SimulationScenario } from "@szl-holdings/ai-engine";
import { z } from "zod";
import { jsonObjectBodySchema, validateBody } from "../lib/validation";

const twinEntitySchema = z.object({
  entityId: z.string().min(1).max(200),
  state: z.record(z.unknown()),
});

const simulateSchema = z.object({
  scenario: z.record(z.unknown()),
});

const router = Router();

router.get("/digital-twins", authMiddleware(), async (_req, res) => {
  const twins = twinRegistry.list();
  res.json({ success: true, twins, total: twins.length });
});

router.get("/digital-twins/:twinId", authMiddleware(), async (req, res) => {
  const twin = twinRegistry.get(req.params.twinId as string);
  if (!twin) return sendError(res, "Twin not found", 404);
  res.json({ success: true, twin });
});

router.get("/digital-twins/entity/:entityId", authMiddleware(), async (req, res) => {
  const twin = twinRegistry.getByEntity(req.params.entityId as string);
  if (!twin) return sendError(res, "No twin registered for this entity", 404);
  res.json({ success: true, twin });
});

router.get("/digital-twins/type/:type", authMiddleware(), async (req, res) => {
  const type = req.params.type as string as import("@szl-holdings/ai-engine").TwinType;
  const validTypes = ["vessel", "property", "posture", "matter", "portfolio", "incident", "port"];
  if (!validTypes.includes(type)) return sendBadRequest(res, "Invalid twin type");
  const twins = twinRegistry.getByType(type);
  res.json({ success: true, twins });
});

router.post("/digital-twins/vessel", authMiddleware(), validateBody(twinEntitySchema), async (req, res) => {
  try {
    const { entityId, state } = req.body as z.infer<typeof twinEntitySchema>;
    const twin = vesselTwin.createTwin(entityId, state as unknown as VesselTwinState);
    res.json({ success: true, twin });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create vessel twin" });
  }
});

router.post("/digital-twins/property", authMiddleware(), validateBody(twinEntitySchema), async (req, res) => {
  try {
    const { entityId, state } = req.body as z.infer<typeof twinEntitySchema>;
    const twin = propertyTwin.createTwin(entityId, state as unknown as PropertyTwinState);
    res.json({ success: true, twin });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create property twin" });
  }
});

router.post("/digital-twins/posture", authMiddleware(), validateBody(twinEntitySchema), async (req, res) => {
  try {
    const { entityId, state } = req.body as z.infer<typeof twinEntitySchema>;
    const twin = postureTwin.createTwin(entityId, state as unknown as PostureTwinState);
    res.json({ success: true, twin });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to create posture twin" });
  }
});

router.post("/digital-twins/:twinId/simulate", authMiddleware(), validateBody(simulateSchema), async (req, res) => {
  try {
    const { scenario } = req.body as z.infer<typeof simulateSchema>;

    const twin = twinRegistry.get(req.params.twinId as string);
    if (!twin) return sendError(res, "Twin not found", 404);

    let result;
    if (twin.twinType === "vessel") {
      result = await vesselTwin.simulate(req.params.twinId as string, scenario as any);
    } else if (twin.twinType === "property") {
      result = await propertyTwin.simulate(req.params.twinId as string, scenario as any);
    } else if (twin.twinType === "posture") {
      result = await postureTwin.simulate(req.params.twinId as string, scenario as any);
    } else {
      return sendBadRequest(res, "Unknown twin type");
    }

    res.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Simulation failed";
    res.status(500).json({ success: false, error: msg });
  }
});

router.patch("/digital-twins/:twinId", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const updated = twinRegistry.update(req.params.twinId as string, req.body);
    if (!updated) return sendError(res, "Twin not found", 404);
    res.json({ success: true, twin: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to update twin" });
  }
});

router.post("/digital-twins/demo/seed", validateBody(jsonObjectBodySchema), authMiddleware(), async (_req, res) => {
  if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
    res.status(404).json({ error: "Not found", code: "SEED_DISABLED_IN_PRODUCTION" });
    return;
  }
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
