/**
 * RF Intelligence API
 *
 * Exposes satellite pass data, RF anomaly alerts, and per-vessel correlation
 * history from the RF Intel Store.
 *
 * Routes (all public — no auth required for geo-intel integration):
 *   GET /api/rf-intel/passes           — recent satellite passes (24h default)
 *   GET /api/rf-intel/anomalies        — active RF anomalies
 *   GET /api/rf-intel/vessels          — tracked vessel list with correlation status
 *   GET /api/rf-intel/vessel/:entityId/correlation — per-vessel correlation history
 *   GET /api/rf-intel/meta             — summary stats for dashboard widgets
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import {
  getActiveRfAnomalies,
  getRecentPasses,
  getVesselCorrelation,
  TRACKED_VESSELS,
  rfAnomaliesStore,
} from '../services/rf-intel-store';

const router: IRouter = Router();

// ─── GET /rf-intel/passes ─────────────────────────────────────────────────────

router.get('/rf-intel/passes', (_req: Request, res: Response) => {
  const limitHours = 24;
  const passes = getRecentPasses(limitHours);

  res.json({
    passes,
    total: passes.length,
    limitHours,
    generatedAt: new Date().toISOString(),
  });
});

// ─── GET /rf-intel/anomalies ──────────────────────────────────────────────────

router.get('/rf-intel/anomalies', (_req: Request, res: Response) => {
  const active = getActiveRfAnomalies();

  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sorted = [...active].sort(
    (a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9),
  );

  const byType = {
    SPOOFING: sorted.filter((a) => a.anomalyType === 'SPOOFING').length,
    DARK_VESSEL: sorted.filter((a) => a.anomalyType === 'DARK_VESSEL').length,
    POSITION_JUMP: sorted.filter((a) => a.anomalyType === 'POSITION_JUMP').length,
    AIS_GAP: sorted.filter((a) => a.anomalyType === 'AIS_GAP').length,
  };

  res.json({
    anomalies: sorted,
    total: sorted.length,
    byType,
    generatedAt: new Date().toISOString(),
  });
});

// ─── GET /rf-intel/vessels ────────────────────────────────────────────────────

router.get('/rf-intel/vessels', (_req: Request, res: Response) => {
  const vesselSummaries = TRACKED_VESSELS.map((vessel) => {
    const anomalies = [...rfAnomaliesStore.values()].filter(
      (a) => a.entityId === vessel.entityId && a.status === 'active',
    );
    const aisGapHours =
      (Date.now() - new Date(vessel.lastAisAt).getTime()) / 3_600_000;

    let correlationStatus: string = 'nominal';
    if (anomalies.some((a) => a.anomalyType === 'SPOOFING' || a.anomalyType === 'POSITION_JUMP')) {
      correlationStatus = 'spoofing';
    } else if (aisGapHours >= 8) {
      correlationStatus = 'dark';
    } else if (aisGapHours >= 4) {
      correlationStatus = 'degraded';
    } else if (anomalies.length > 0) {
      correlationStatus = 'degraded';
    }

    return {
      entityId: vessel.entityId,
      imoNumber: vessel.imoNumber,
      mmsi: vessel.mmsi,
      name: vessel.name,
      flag: vessel.flag,
      vesselType: vessel.vesselType,
      lat: vessel.lat,
      lon: vessel.lon,
      heading: vessel.heading,
      speedKnots: vessel.speedKnots,
      destination: vessel.destination,
      lastAisAt: vessel.lastAisAt,
      aisGapHours: Math.round(aisGapHours * 10) / 10,
      region: vessel.region,
      correlationStatus,
      activeAnomalies: anomalies.length,
    };
  });

  res.json({
    vessels: vesselSummaries,
    total: vesselSummaries.length,
    generatedAt: new Date().toISOString(),
  });
});

// ─── GET /rf-intel/vessel/:entityId/correlation ───────────────────────────────

router.get('/rf-intel/vessel/:entityId/correlation', (req: Request, res: Response) => {
  const { entityId } = req.params;
  const history = getVesselCorrelation(entityId);

  if (!history) {
    res.status(404).json({ error: `Vessel ${entityId} not found in RF tracking registry` });
    return;
  }

  res.json(history);
});

// ─── GET /rf-intel/meta ───────────────────────────────────────────────────────

router.get('/rf-intel/meta', (_req: Request, res: Response) => {
  const active = getActiveRfAnomalies();
  const passes24h = getRecentPasses(24);

  const now = Date.now();
  const darkVessels = TRACKED_VESSELS.filter(
    (v) => (now - new Date(v.lastAisAt).getTime()) / 3_600_000 >= 8,
  ).length;

  const aisGapVessels = TRACKED_VESSELS.filter((v) => {
    const gapH = (now - new Date(v.lastAisAt).getTime()) / 3_600_000;
    return gapH >= 4 && gapH < 8;
  }).length;

  const spoofingAlerts = active.filter(
    (a) => a.anomalyType === 'SPOOFING' || a.anomalyType === 'POSITION_JUMP',
  ).length;

  const avgCorrelation =
    passes24h.length > 0
      ? Math.round(passes24h.reduce((s, p) => s + p.correlationScore, 0) / passes24h.length)
      : 0;

  res.json({
    totalTrackedVessels: TRACKED_VESSELS.length,
    activeAnomalies: active.length,
    darkVessels,
    aisGapVessels,
    spoofingAlerts,
    passes24h: passes24h.length,
    avgCorrelationScore: avgCorrelation,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
