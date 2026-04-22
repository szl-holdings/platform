import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  vesselsCargoTable,
  vesselsPositionsTable,
  vesselsRoutesTable,
  vesselsTable,
} from '@szl-holdings/db';
import { type RouteSimulationParams, type VesselUsdState, exportRouteSimulation, exportVesselTwin } from '@szl-holdings/openusd-export';
import { desc, eq } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleRouteError, sendBadRequest, sendNotFound } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const twinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Digital twin rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
});

// ─── Vessel Digital Twin Export ───────────────────────────────────────────────

router.get(
  '/vessels/:imo/digital-twin',
  twinRateLimit,
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const { imo } = req.params;

      const [vessel] = await db
        .select()
        .from(vesselsTable)
        .where(eq(vesselsTable.imo, imo))
        .limit(1);

      if (!vessel) {
        sendNotFound(res, `Vessel IMO ${imo}`);
        return;
      }

      const positions = await db
        .select()
        .from(vesselsPositionsTable)
        .where(eq(vesselsPositionsTable.vesselId, vessel.id))
        .orderBy(desc(vesselsPositionsTable.recordedAt))
        .limit(1);

      const routes = await db
        .select()
        .from(vesselsRoutesTable)
        .where(eq(vesselsRoutesTable.vesselId, vessel.id))
        .orderBy(desc(vesselsRoutesTable.createdAt))
        .limit(1);

      const cargoes = await db
        .select()
        .from(vesselsCargoTable)
        .where(eq(vesselsCargoTable.vesselId, vessel.id))
        .limit(1);

      const latestPos = positions[0];
      const activeRoute = routes[0];
      const activeCargo = cargoes[0];

      const state: VesselUsdState = {
        imoNumber: vessel.imo ?? imo,
        name: vessel.name,
        vesselType: vessel.vesselType,
        position: {
          lat: latestPos ? Number(latestPos.latitude) : 0,
          lon: latestPos ? Number(latestPos.longitude) : 0,
        },
        heading: latestPos?.heading ? Number(latestPos.heading) : undefined,
        speedKnots: latestPos?.speed ? Number(latestPos.speed) : undefined,
        destination: activeRoute?.destinationPort ?? undefined,
        eta: activeRoute?.arrivalAt?.toISOString() ?? undefined,
        routeWaypoints: Array.isArray(
          (activeRoute as { waypoints?: unknown } | undefined)?.waypoints,
        )
          ? (activeRoute?.waypoints as Array<{ lat: number; lon: number; name?: string }>)
          : [],
        deadweightTonnage: vessel.grossTonnage ? Number(vessel.grossTonnage) : undefined,
        flagState: vessel.flag ?? undefined,
        cargoStatus: activeCargo ? `${activeCargo.cargoType} — ${activeCargo.status}` : undefined,
        simulationScenario: 'live_state',
        metadata: {
          vesselId: String(vessel.id),
          mmsi: vessel.mmsi ?? '',
          status: vessel.status,
          yearBuilt: vessel.yearBuilt ? String(vessel.yearBuilt) : '',
        },
      };

      const result = exportVesselTwin(state);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="vessel-${imo}.usda"`);
      res.setHeader('X-SZL-Export-Type', 'vessel_digital_twin');
      res.setHeader('X-SZL-Prim-Count', String(result.primCount));
      res.setHeader('X-SZL-Export-At', result.exportedAt);
      if (result.warnings.length > 0) {
        res.setHeader('X-SZL-Warnings', result.warnings.join('; '));
      }
      res.status(200).send(result.usdaContent);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export vessel digital twin');
    }
  },
);

// ─── Vessel Route Simulation Export ───────────────────────────────────────────

const VALID_VESSEL_SCENARIOS = [
  'normal',
  'storm_diversion',
  'chokepoint_delay',
  'emergency_deviation',
] as const;
type VesselScenario = (typeof VALID_VESSEL_SCENARIOS)[number];

router.post(
  '/vessels/:imo/simulate',
  twinRateLimit,
  authMiddleware({ required: false }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const { imo } = req.params;
      const rawScenario = (req.body?.scenario as string | undefined) ?? 'normal';

      if (!VALID_VESSEL_SCENARIOS.includes(rawScenario as VesselScenario)) {
        sendBadRequest(res, `Invalid scenario. Valid values: ${VALID_VESSEL_SCENARIOS.join(', ')}`);
        return;
      }

      const scenario = rawScenario as VesselScenario;

      const [vessel] = await db
        .select()
        .from(vesselsTable)
        .where(eq(vesselsTable.imo, imo))
        .limit(1);

      if (!vessel) {
        sendNotFound(res, `Vessel IMO ${imo}`);
        return;
      }

      const [latestPos] = await db
        .select()
        .from(vesselsPositionsTable)
        .where(eq(vesselsPositionsTable.vesselId, vessel.id))
        .orderBy(desc(vesselsPositionsTable.recordedAt))
        .limit(1);

      const [activeRoute] = await db
        .select()
        .from(vesselsRoutesTable)
        .where(eq(vesselsRoutesTable.vesselId, vessel.id))
        .orderBy(desc(vesselsRoutesTable.createdAt))
        .limit(1);

      const [activeCargo] = await db
        .select()
        .from(vesselsCargoTable)
        .where(eq(vesselsCargoTable.vesselId, vessel.id))
        .limit(1);

      const vesselState: VesselUsdState = {
        imoNumber: vessel.imo ?? imo,
        name: vessel.name,
        vesselType: vessel.vesselType,
        position: {
          lat: latestPos ? Number(latestPos.latitude) : 0,
          lon: latestPos ? Number(latestPos.longitude) : 0,
        },
        heading: latestPos?.heading ? Number(latestPos.heading) : undefined,
        speedKnots: latestPos?.speed ? Number(latestPos.speed) : undefined,
        destination: activeRoute?.destinationPort ?? undefined,
        eta: activeRoute?.arrivalAt?.toISOString() ?? undefined,
        deadweightTonnage: vessel.grossTonnage ? Number(vessel.grossTonnage) : undefined,
        flagState: vessel.flag ?? undefined,
        cargoStatus: activeCargo ? `${activeCargo.cargoType} — ${activeCargo.status}` : undefined,
        metadata: {
          vesselId: String(vessel.id),
          mmsi: vessel.mmsi ?? '',
          status: vessel.status,
        },
      };

      const waypoints = Array.isArray(
        (activeRoute as { waypoints?: unknown } | undefined)?.waypoints,
      )
        ? (activeRoute?.waypoints as Array<{ lat: number; lon: number; name?: string }>)
        : [];

      const simulationParams: RouteSimulationParams = {
        vessel: vesselState,
        originPort: activeRoute?.originPort
          ? { lat: 0, lon: 0, name: activeRoute.originPort }
          : undefined,
        destinationPort: activeRoute?.destinationPort
          ? { lat: 0, lon: 0, name: activeRoute.destinationPort }
          : undefined,
        waypoints,
        simulatedDurationHours: activeRoute?.distanceNm
          ? Number(activeRoute.distanceNm) / ((vesselState.speedKnots ?? 14) || 14)
          : 72,
        scenario,
      };

      const result = exportRouteSimulation(simulationParams);

      const projectedState = buildProjectedVesselState(vesselState, scenario);

      res.json({
        imo,
        scenario,
        vessel: {
          id: vessel.id,
          name: vessel.name,
          imo: vessel.imo,
          vesselType: vessel.vesselType,
          status: vessel.status,
        },
        projectedState,
        export: {
          entityId: result.entityId,
          entityType: result.entityType,
          exportedAt: result.exportedAt,
          fileSizeBytes: result.fileSizeBytes,
          primCount: result.primCount,
          warnings: result.warnings,
          usdaContent: result.usdaContent,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to run vessel route simulation');
    }
  },
);

function buildProjectedVesselState(
  base: VesselUsdState,
  scenario: VesselScenario,
): Record<string, unknown> {
  const etaDeltaHours =
    scenario === 'storm_diversion'
      ? 36
      : scenario === 'chokepoint_delay'
        ? 18
        : scenario === 'emergency_deviation'
          ? 12
          : 0;

  const speedMultiplier =
    scenario === 'storm_diversion' ? 0.75 : scenario === 'emergency_deviation' ? 0.85 : 1.0;

  const fuelDeltaPct =
    scenario === 'storm_diversion' ? -12 : scenario === 'chokepoint_delay' ? -5 : 0;

  return {
    scenario,
    imoNumber: base.imoNumber,
    name: base.name,
    projectedSpeedKnots: Math.round((base.speedKnots ?? 14) * speedMultiplier * 10) / 10,
    etaDeltaHours,
    projectedFuelLevelPct: Math.max(0, (base.fuelLevelPercent ?? 60) + fuelDeltaPct),
    routeRiskLevel:
      scenario === 'storm_diversion' || scenario === 'emergency_deviation'
        ? 'high'
        : scenario === 'chokepoint_delay'
          ? 'medium'
          : 'low',
    simulationNotes: getSimulationNotes(scenario),
    generatedAt: new Date().toISOString(),
  };
}

function getSimulationNotes(scenario: VesselScenario): string {
  switch (scenario) {
    case 'storm_diversion':
      return 'Route diverted to avoid storm system — alternate waypoints applied, ETA extended.';
    case 'chokepoint_delay':
      return 'Queuing delay at chokepoint — ETA extended by estimated congestion clearance time.';
    case 'emergency_deviation':
      return 'Emergency course deviation — reduced speed, distress protocol active.';
    default:
      return 'Normal operations — no scenario adjustments applied.';
  }
}

export default router;
