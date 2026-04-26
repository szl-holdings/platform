import { type PostureTwinState, type PropertyTwinState, type SimulationScenario, type VesselTwinState, postureTwin, propertyTwin, twinRegistry, vesselTwin } from '@szl-holdings/ai-engine';
import type { AuthenticatedUser } from '../middlewares/auth';
import { db, twinSimulationRunsTable } from '@szl-holdings/db';
import { bodyShape } from '@szl-holdings/contracts/common';
import { and, desc, eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { sendBadRequest, sendError } from '../lib/api-response';
import { guardSeedInProduction } from '../lib/seed-guard';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const INGEST_RATE_LIMIT = new Map<string, number>();
const INGEST_RATE_WINDOW_MS = 5_000;
const INGEST_MAX_PER_WINDOW = 20;

const twinEntitySchema = z.object({
  entityId: z.string().min(1).max(200),
  state: z.record(z.unknown()),
});

const simulateBodySchema = z.object({
  scenario: z.object({
    name: z.string().min(1),
    description: z.string().default(''),
    parameters: z.record(z.unknown()),
    impactedMetrics: z.array(z.string()).default([]),
  }),
});

function requireTwinRegistryReady(_req: Request, res: Response, next: NextFunction): void {
  if (!twinRegistry.isReady()) {
    res.status(503).json({
      success: false,
      error: 'Twin registry is still initializing — retry in a moment',
    });
    return;
  }
  next();
}

function twinBelongsToOrg(twin: { orgId?: number }, orgId: number | undefined): boolean {
  if (orgId === undefined) return true;
  return twin.orgId === orgId;
}

function twinOrgFilter(orgId: number | undefined) {
  return (twin: { orgId?: number }) => twinBelongsToOrg(twin, orgId);
}

const router = Router();

router.get('/digital-twins', authMiddleware(), tenantScope(), requireTwinRegistryReady, (req, res) => {
  const orgId = req.tenantOrgId;
  const allTwins = twinRegistry.list();
  const twins = orgId !== undefined ? allTwins.filter(twinOrgFilter(orgId)) : allTwins;
  res.json({ success: true, twins, total: twins.length });
});

router.get('/digital-twins/:twinId', authMiddleware(), tenantScope(), requireTwinRegistryReady, (req, res) => {
  const twin = twinRegistry.get(req.params.twinId as string);
  if (!twin || !twinBelongsToOrg(twin, req.tenantOrgId)) return sendError(res, 'Twin not found', 404);
  res.json({ success: true, twin });
});

router.get('/digital-twins/entity/:entityId', authMiddleware(), tenantScope(), requireTwinRegistryReady, (req, res) => {
  const orgId = req.tenantOrgId;
  const twin = twinRegistry.list().find(
    (t) => t.entityId === req.params.entityId && twinBelongsToOrg(t, orgId),
  );
  if (!twin) return sendError(res, 'No twin registered for this entity', 404);
  res.json({ success: true, twin });
});

router.get('/digital-twins/type/:type', authMiddleware(), tenantScope(), requireTwinRegistryReady, (req, res) => {
  const type = req.params.type as string as import('@szl-holdings/ai-engine').TwinType;
  const validTypes = ['vessel', 'property', 'posture', 'matter', 'portfolio', 'incident', 'port'];
  if (!validTypes.includes(type)) return sendBadRequest(res, 'Invalid twin type');
  const orgId = req.tenantOrgId;
  const twins = twinRegistry.getByType(type).filter(twinOrgFilter(orgId));
  res.json({ success: true, twins });
});

router.post(
  '/digital-twins/vessel',
  authMiddleware(),
  tenantScope(),
  validateBody(twinEntitySchema),
  async (req, res) => {
    try {
      const { entityId, state } = req.body as z.infer<typeof twinEntitySchema>;
      const twin = vesselTwin.createTwin(entityId, state as unknown as VesselTwinState, req.tenantOrgId);
      res.json({ success: true, twin });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to create vessel twin' });
    }
  },
);

router.post(
  '/digital-twins/property',
  authMiddleware(),
  tenantScope(),
  validateBody(twinEntitySchema),
  async (req, res) => {
    try {
      const { entityId, state } = req.body as z.infer<typeof twinEntitySchema>;
      const twin = propertyTwin.createTwin(entityId, state as unknown as PropertyTwinState, req.tenantOrgId);
      res.json({ success: true, twin });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to create property twin' });
    }
  },
);

router.post(
  '/digital-twins/posture',
  authMiddleware(),
  tenantScope(),
  validateBody(twinEntitySchema),
  async (req, res) => {
    try {
      const { entityId, state } = req.body as z.infer<typeof twinEntitySchema>;
      const twin = postureTwin.createTwin(entityId, state as unknown as PostureTwinState, req.tenantOrgId);
      res.json({ success: true, twin });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to create posture twin' });
    }
  },
);

router.post(
  '/digital-twins/:twinId/simulate',
  authMiddleware(),
  tenantScope(),
  validateBody(simulateBodySchema),
  async (req, res) => {
    try {
      const { scenario } = req.body as z.infer<typeof simulateBodySchema>;
      const typedScenario: SimulationScenario = {
        name: scenario.name,
        description: scenario.description,
        parameters: scenario.parameters,
        impactedMetrics: scenario.impactedMetrics,
      };
      const userId = (req.user as AuthenticatedUser | undefined)?.id;
      const twinId = req.params.twinId as string;

      const twin = twinRegistry.get(twinId);
      if (!twin || !twinBelongsToOrg(twin, req.tenantOrgId)) return sendError(res, 'Twin not found', 404);

      let result;
      if (twin.twinType === 'vessel') {
        result = await vesselTwin.simulate(twinId, typedScenario, userId);
      } else if (twin.twinType === 'property') {
        result = await propertyTwin.simulate(twinId, typedScenario, userId);
      } else if (twin.twinType === 'posture') {
        result = await postureTwin.simulate(twinId, typedScenario, userId);
      } else {
        return sendBadRequest(res, 'Unknown twin type');
      }

      res.json({ success: true, result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      res.status(500).json({ success: false, error: msg });
    }
  },
);

router.patch(
  '/digital-twins/:twinId',
  authMiddleware(),
  tenantScope(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const twinId = req.params.twinId as string;
      const existing = twinRegistry.get(twinId);
      if (!existing || !twinBelongsToOrg(existing, req.tenantOrgId)) return sendError(res, 'Twin not found', 404);
      const updated = twinRegistry.update(twinId, req.body);
      if (!updated) return sendError(res, 'Twin not found', 404);
      res.json({ success: true, twin: updated });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Failed to update twin' });
    }
  },
);

router.post(
  '/digital-twins/:twinId/ingest',
  authMiddleware(),
  tenantScope(),
  validateBody(
    z.object({
      stateUpdates: z.record(z.unknown()).min(1),
      source: z.string().optional().default('api'),
    }),
  ),
  async (req, res) => {
    const twinId = req.params.twinId as string;

    const now = Date.now();
    const lastCall = INGEST_RATE_LIMIT.get(twinId) ?? 0;
    if (now - lastCall < INGEST_RATE_WINDOW_MS) {
      const count = INGEST_RATE_LIMIT.get(`${twinId}:count`) ?? 0;
      if ((count as number) >= INGEST_MAX_PER_WINDOW) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded — max 20 ingests per 5 seconds per twin' });
      }
      INGEST_RATE_LIMIT.set(`${twinId}:count`, (count as number) + 1);
    } else {
      INGEST_RATE_LIMIT.set(twinId, now);
      INGEST_RATE_LIMIT.set(`${twinId}:count`, 1);
    }

    try {
      const twin = twinRegistry.get(twinId);
      if (!twin || !twinBelongsToOrg(twin, req.tenantOrgId)) return sendError(res, 'Twin not found', 404);

      const { stateUpdates } = req.body as { stateUpdates: Record<string, unknown>; source: string };

      const mergedState = { ...twin.currentState, ...stateUpdates };

      let updatedTwin;
      if (twin.twinType === 'vessel') {
        updatedTwin = vesselTwin.refreshTwin(twin.id, mergedState as unknown as VesselTwinState);
      } else if (twin.twinType === 'property') {
        updatedTwin = propertyTwin.refreshTwin(twin.id, mergedState as unknown as PropertyTwinState);
      } else if (twin.twinType === 'posture') {
        updatedTwin = postureTwin.refreshTwin(twin.id, mergedState as unknown as PostureTwinState);
      } else {
        updatedTwin = twinRegistry.update(twinId, { currentState: mergedState }) ?? twin;
      }
      const newAlerts = updatedTwin.alerts;

      const previousAlertIds = new Set(twin.alerts.map((a) => a.id));
      const triggeredAlerts = newAlerts.filter((a) => !previousAlertIds.has(a.id));
      res.json({
        success: true,
        twin: updatedTwin,
        alertsTriggered: newAlerts.length,
        newAlerts: triggeredAlerts,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ingest failed';
      res.status(500).json({ success: false, error: msg });
    }
  },
);

router.get('/digital-twins/:twinId/simulation-history', authMiddleware(), tenantScope(), requireTwinRegistryReady, async (req, res) => {
  try {
    const twinId = req.params.twinId as string;
    const orgId = req.tenantOrgId;
    const twin = twinRegistry.get(twinId);
    if (!twin || !twinBelongsToOrg(twin, orgId)) return sendError(res, 'Twin not found', 404);

    const whereClause = orgId !== undefined
      ? and(eq(twinSimulationRunsTable.twinId, twinId), eq(twinSimulationRunsTable.orgId, orgId))
      : eq(twinSimulationRunsTable.twinId, twinId);

    const runs = await db
      .select()
      .from(twinSimulationRunsTable)
      .where(whereClause)
      .orderBy(desc(twinSimulationRunsTable.createdAt))
      .limit(50);

    res.json({ success: true, runs, total: runs.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch simulation history';
    res.status(500).json({ success: false, error: msg });
  }
});

router.post(
  '/digital-twins/demo/seed',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (_req, res) => {
    if (guardSeedInProduction(res)) return;
    try {
      const vesselState: VesselTwinState = {
        imoNumber: '9234567',
        name: 'MV AURORA',
        currentPosition: { lat: 1.35, lon: 103.82, timestamp: new Date().toISOString() },
        heading: 275,
        speedKnots: 14.2,
        statusCode: 'underway',
        destination: 'Rotterdam (NLRTM)',
        eta: new Date(Date.now() + 14 * 24 * 3600000).toISOString(),
        fuelLevelPercent: 62,
        fuelConsumptionRate: 2.8,
        cargoStatus: 'Full — 45,000MT bulk cargo',
        weatherConditions: { windSpeedKnots: 18, waveHeightM: 2.1, visibility: 'good' },
        routeRiskLevel: 'medium',
        sanctionsExposure: false,
        predictedArrivalConfidence: 0.87,
      };

      const propertyState: PropertyTwinState = {
        address: '345 Atlantic Ave, Brooklyn, NY',
        currentValuation: 4_200_000,
        lastAppraisalDate: new Date(Date.now() - 90 * 24 * 3600000).toISOString(),
        capRate: 0.062,
        noi: 260_400,
        occupancyRate: 0.91,
        weightedAverageLeaseTerm: 3.2,
        debtServiceCoverageRatio: 1.31,
        loanToValue: 0.68,
        marketTrend: 'stable',
        tenantRiskScore: 38,
        floodRiskScore: 55,
        vacancyRisk: 'low',
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
        threatActorTargeting: ['APT41', 'Lazarus Group'],
        lastPenTestDate: new Date(Date.now() - 180 * 24 * 3600000).toISOString(),
        activeThreats: 2,
      };

      const vt = vesselTwin.createTwin('demo-vessel-aurora', vesselState);
      const pt = propertyTwin.createTwin('demo-property-brooklyn', propertyState);
      const st = postureTwin.createTwin('demo-posture-szl', postureState);

      res.json({ success: true, twins: { vessel: vt, property: pt, posture: st } });
    } catch (_err) {
      res.status(500).json({ success: false, error: 'Demo seed failed' });
    }
  },
);

export default router;
