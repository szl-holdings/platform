/**
 * RF Intelligence Store — Satellite AIS Correlation Engine
 *
 * Simulates a satellite RF intelligence layer that:
 * 1. Generates realistic satellite AIS pass observations for tracked vessels
 * 2. Correlates satellite-observed positions against last-known AIS positions
 * 3. Detects position spoofing (AIS-reported position diverges from satellite)
 * 4. Detects AIS gaps (AIS silent for 4–8 h) and dark-vessel events (silent > 8 h)
 *
 * Architecture:
 * - TRACKED_VESSELS: the simulated fleet with baseline AIS positions
 * - Twin-engine augmentation: if a vessel twin is registered in twinRegistry,
 *   its live currentPosition overrides the static baseline lat/lon
 * - rfPassesStore: in-memory ring-buffer of satellite passes (max 500 records),
 *   hydrated from Postgres on startup so history survives restarts
 * - rfAnomaliesStore: active anomalies (keyed entityId:anomalyType), backed by
 *   the rf_anomalies table (upserted on each cycle)
 * - processSatelliteCycle(): runs every 90 seconds
 */

import { db, rfAnomaliesTable, rfSatellitePassesTable } from '@szl-holdings/db';
import { twinRegistry } from '@szl-holdings/ai-engine';
import { eq, desc, gte, or } from 'drizzle-orm';
import { logger } from '../lib/logger';

// ─── Configuration ────────────────────────────────────────────────────────────

const SPOOFING_THRESHOLD_NM = 8;
const AIS_GAP_THRESHOLD_HOURS = 4;
const DARK_VESSEL_THRESHOLD_HOURS = 8;
const SATELLITE_NOISE_FACTOR = 0.04;
const PASS_RING_BUFFER_SIZE = 500;
const CYCLE_INTERVAL_MS = 90_000;

// ─── Helper math ─────────────────────────────────────────────────────────────

function haversineNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function seededNoise(seed: number, amplitude: number): number {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return (s - Math.floor(s) - 0.5) * 2 * amplitude;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function minsAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

let _passIdSeq = 1;
function nextPassId(): string {
  return `SAT-PASS-${String(_passIdSeq++).padStart(6, '0')}`;
}

let _anomalyIdSeq = 1;
function nextAnomalyId(): string {
  return `RF-ANO-${String(_anomalyIdSeq++).padStart(5, '0')}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnomalyType = 'SPOOFING' | 'AIS_GAP' | 'DARK_VESSEL' | 'POSITION_JUMP';

export interface TrackedVessel {
  entityId: string;
  imoNumber: string;
  mmsi: string;
  name: string;
  flag: string;
  vesselType: string;
  lat: number;
  lon: number;
  heading: number;
  speedKnots: number;
  destination: string;
  lastAisAt: string;
  region: string;
}

export interface SatellitePass {
  id: string;
  satelliteId: string;
  entityId: string;
  vesselName: string;
  imoNumber: string;
  observedLat: number;
  observedLon: number;
  aisReportedLat: number;
  aisReportedLon: number;
  driftDistanceNm: number;
  bearingDeviationDeg: number;
  correlationScore: number;
  anomalyFlag: boolean;
  anomalyType: AnomalyType | null;
  passTimestamp: string;
  coverageQuality: 'excellent' | 'good' | 'marginal' | 'poor';
  confidencePercent: number;
}

export interface RfAnomaly {
  id: string;
  entityId: string;
  vesselName: string;
  imoNumber: string;
  anomalyType: AnomalyType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lat: number;
  lon: number;
  driftDistanceNm: number | null;
  lastKnownLat: number | null;
  lastKnownLon: number | null;
  gapHours: number | null;
  correlationScore: number;
  satellitePassId: string;
  detectedAt: string;
  updatedAt: string;
  status: 'active' | 'investigating' | 'resolved';
  description: string;
  predictedHeading: number | null;
  confidencePercent: number;
  tags: string[];
  region: string;
}

export interface VesselCorrelationHistory {
  entityId: string;
  vesselName: string;
  imoNumber: string;
  lastPassAt: string | null;
  passCount24h: number;
  avgCorrelationScore: number;
  activeAnomalies: number;
  correlationStatus: 'nominal' | 'degraded' | 'dark' | 'spoofing';
  passes: SatellitePass[];
  anomalies: RfAnomaly[];
}

// ─── Tracked vessel fleet (baseline positions) ────────────────────────────────

export const TRACKED_VESSELS: TrackedVessel[] = [
  {
    entityId: 'vessel-rf-001',
    imoNumber: '9234567',
    mmsi: '123456789',
    name: 'MV ALBATROSS CROWN',
    flag: 'Panama',
    vesselType: 'Crude Oil Tanker',
    lat: 26.4,
    lon: 56.1,
    heading: 287,
    speedKnots: 11.2,
    destination: 'FUJAIRAH',
    lastAisAt: minsAgo(22),
    region: 'Strait of Hormuz',
  },
  {
    entityId: 'vessel-rf-002',
    imoNumber: '9301856',
    mmsi: '567891234',
    name: 'MV MERIDIAN STAR',
    flag: 'Comoros',
    vesselType: 'Product Tanker',
    lat: 26.7,
    lon: 55.9,
    heading: 112,
    speedKnots: 0,
    destination: 'BANDAR ABBAS',
    lastAisAt: hoursAgo(9.2),
    region: 'Persian Gulf',
  },
  {
    entityId: 'vessel-rf-003',
    imoNumber: '9445221',
    mmsi: '987654321',
    name: 'MV PACIFIC MERIDIAN',
    flag: 'Tanzania',
    vesselType: 'VLCC',
    lat: 25.4,
    lon: 56.2,
    heading: 195,
    speedKnots: 8.1,
    destination: 'JEBEL ALI',
    lastAisAt: hoursAgo(14.4),
    region: 'Strait of Hormuz',
  },
  {
    entityId: 'vessel-rf-004',
    imoNumber: '9187432',
    mmsi: '234567890',
    name: 'MV CASPIAN PIONEER',
    flag: 'Comoros',
    vesselType: 'Chemical Tanker',
    lat: 37.8,
    lon: 23.1,
    heading: 54,
    speedKnots: 12.4,
    destination: 'NOVOROSSIYSK',
    lastAisAt: minsAgo(4),
    region: 'Black Sea',
  },
  {
    entityId: 'vessel-rf-005',
    imoNumber: '9654321',
    mmsi: '345678901',
    name: 'MV GULF VOYAGER',
    flag: 'Tanzania',
    vesselType: 'LPG Carrier',
    lat: 12.7,
    lon: 44.9,
    heading: 322,
    speedKnots: 14.8,
    destination: 'DJIBOUTI',
    lastAisAt: minsAgo(8),
    region: 'Gulf of Aden',
  },
  {
    entityId: 'vessel-rf-006',
    imoNumber: '9112233',
    mmsi: '456789012',
    name: 'MV FAR EASTERN PROGRESS',
    flag: 'Palau',
    vesselType: 'Bulk Carrier',
    lat: 3.1,
    lon: 103.4,
    heading: 278,
    speedKnots: 10.6,
    destination: 'ZHOUSHAN',
    lastAisAt: hoursAgo(6.9),
    region: 'South China Sea',
  },
  {
    entityId: 'vessel-rf-007',
    imoNumber: '9312445',
    mmsi: '678901234',
    name: 'MV SAFFRON TIDE',
    flag: 'Marshall Islands',
    vesselType: 'Aframax Tanker',
    lat: 51.9,
    lon: 4.5,
    heading: 168,
    speedKnots: 4.2,
    destination: 'ROTTERDAM',
    lastAisAt: minsAgo(2),
    region: 'North Sea',
  },
  {
    entityId: 'vessel-rf-008',
    imoNumber: '9601447',
    mmsi: '789012345',
    name: 'MV NORTHERN STAR',
    flag: 'Cyprus',
    vesselType: 'Container Ship',
    lat: 1.28,
    lon: 103.85,
    heading: 95,
    speedKnots: 18.2,
    destination: 'SINGAPORE',
    lastAisAt: minsAgo(1),
    region: 'Malacca Strait',
  },
];

// ─── In-memory stores ─────────────────────────────────────────────────────────

export const rfPassesStore: SatellitePass[] = [];
export const rfAnomaliesStore = new Map<string, RfAnomaly>();

// ─── Twin-engine position augmentation ───────────────────────────────────────
//
// When a vessel twin is registered in the digital-twin registry (e.g. via the
// POST /api/digital-twins/vessel endpoint), its live currentPosition overrides
// the static baseline lat/lon in TRACKED_VESSELS. This makes the RF correlation
// engine responsive to real-time twin state changes.

function getAugmentedVessel(base: TrackedVessel): TrackedVessel {
  try {
    const allTwins = twinRegistry.getByType('vessel');
    const match = allTwins.find(
      (twin) =>
        twin.entityId === base.entityId ||
        (twin.currentState as Record<string, unknown>)?.imoNumber === base.imoNumber,
    );
    if (!match) return base;

    const state = match.currentState as Record<string, unknown>;
    const pos = state.currentPosition as Record<string, number> | undefined;
    if (!pos || typeof pos.lat !== 'number' || typeof pos.lon !== 'number') return base;

    return {
      ...base,
      lat: pos.lat,
      lon: pos.lon,
      heading: typeof state.heading === 'number' ? state.heading : base.heading,
      speedKnots: typeof state.speedKnots === 'number' ? state.speedKnots : base.speedKnots,
      lastAisAt:
        typeof state.lastAisAt === 'string' ? state.lastAisAt : base.lastAisAt,
    };
  } catch {
    return base;
  }
}

// ─── Satellite constellation ──────────────────────────────────────────────────

const SATELLITES = [
  'ATLAS-SAT-01',
  'ATLAS-SAT-02',
  'ATLAS-SAT-03',
  'SENTINEL-SAT-07',
  'SENTINEL-SAT-12',
  'HORIZON-SAT-04',
  'HORIZON-SAT-09',
];

function selectSatellite(vesselLat: number, cycleTs: number): string {
  const idx = Math.floor(Math.abs(Math.sin(vesselLat * cycleTs * 0.0001)) * SATELLITES.length);
  return SATELLITES[idx % SATELLITES.length];
}

function coverageQuality(driftNm: number): SatellitePass['coverageQuality'] {
  if (driftNm < 1) return 'excellent';
  if (driftNm < 4) return 'good';
  if (driftNm < 8) return 'marginal';
  return 'poor';
}

function correlationScore(driftNm: number): number {
  if (driftNm < 1) return 95 + Math.random() * 4;
  if (driftNm < 3) return 82 + Math.random() * 10;
  if (driftNm < 6) return 60 + Math.random() * 18;
  if (driftNm < SPOOFING_THRESHOLD_NM) return 38 + Math.random() * 20;
  return 10 + Math.random() * 25;
}

// ─── Classify AIS gap severity ────────────────────────────────────────────────
//
// AIS_GAP  : 4 h ≤ gap < 8 h — vessel went radio-silent but not yet classified dark
// DARK_VESSEL : gap ≥ 8 h    — extended blackout, dark-vessel track initiated

function classifyGapAnomaly(aisGapHours: number): AnomalyType | null {
  if (aisGapHours >= DARK_VESSEL_THRESHOLD_HOURS) return 'DARK_VESSEL';
  if (aisGapHours >= AIS_GAP_THRESHOLD_HOURS) return 'AIS_GAP';
  return null;
}

// ─── Simulation: generate one satellite pass per vessel ───────────────────────

function generatePassForVessel(vessel: TrackedVessel, cycleTs: number): SatellitePass {
  const seed = cycleTs * vessel.imoNumber.charCodeAt(0) + vessel.imoNumber.charCodeAt(2);

  const aisGapHours = (Date.now() - new Date(vessel.lastAisAt).getTime()) / 3_600_000;
  const gapAnomalyType = classifyGapAnomaly(aisGapHours);
  const isGapAnomaly = gapAnomalyType !== null;

  let noiseLat: number;
  let noiseLon: number;
  let isSpoofed = false;

  if (vessel.entityId === 'vessel-rf-001') {
    noiseLat = seededNoise(seed, SATELLITE_NOISE_FACTOR) + seededNoise(seed + 1, 0.06);
    noiseLon = seededNoise(seed + 2, SATELLITE_NOISE_FACTOR) + seededNoise(seed + 3, 0.09);
    isSpoofed = true;
  } else if (vessel.entityId === 'vessel-rf-003') {
    noiseLat = seededNoise(seed, SATELLITE_NOISE_FACTOR) + seededNoise(seed + 1, 0.15);
    noiseLon = seededNoise(seed + 2, SATELLITE_NOISE_FACTOR) + seededNoise(seed + 3, 0.18);
    isSpoofed = true;
  } else if (vessel.entityId === 'vessel-rf-006') {
    noiseLat = seededNoise(seed, SATELLITE_NOISE_FACTOR) + seededNoise(seed + 1, 0.07);
    noiseLon = seededNoise(seed + 2, SATELLITE_NOISE_FACTOR) + seededNoise(seed + 3, 0.11);
    isSpoofed = Math.abs(noiseLat) + Math.abs(noiseLon) > 0.1;
  } else {
    noiseLat = seededNoise(seed, SATELLITE_NOISE_FACTOR);
    noiseLon = seededNoise(seed + 2, SATELLITE_NOISE_FACTOR);
  }

  const observedLat = vessel.lat + noiseLat;
  const observedLon = vessel.lon + noiseLon;
  const driftNm = haversineNm(vessel.lat, vessel.lon, observedLat, observedLon);
  const bearingDev = bearingDeg(vessel.lat, vessel.lon, observedLat, observedLon);
  const score = Math.round(correlationScore(driftNm));
  const isAnomalous = isSpoofed || isGapAnomaly || driftNm >= SPOOFING_THRESHOLD_NM;

  let anomalyType: AnomalyType | null = null;
  if (isGapAnomaly) {
    anomalyType = gapAnomalyType;
  } else if (isSpoofed || driftNm >= SPOOFING_THRESHOLD_NM) {
    anomalyType = driftNm >= 20 ? 'POSITION_JUMP' : 'SPOOFING';
  }

  return {
    id: nextPassId(),
    satelliteId: selectSatellite(vessel.lat, cycleTs),
    entityId: vessel.entityId,
    vesselName: vessel.name,
    imoNumber: vessel.imoNumber,
    observedLat: Math.round(observedLat * 10000) / 10000,
    observedLon: Math.round(observedLon * 10000) / 10000,
    aisReportedLat: vessel.lat,
    aisReportedLon: vessel.lon,
    driftDistanceNm: Math.round(driftNm * 100) / 100,
    bearingDeviationDeg: Math.round(bearingDev),
    correlationScore: score,
    anomalyFlag: isAnomalous,
    anomalyType,
    passTimestamp: new Date().toISOString(),
    coverageQuality: coverageQuality(driftNm),
    confidencePercent: Math.min(99, Math.max(10, score)),
  };
}

// ─── Anomaly builder ──────────────────────────────────────────────────────────

function buildAnomaly(vessel: TrackedVessel, pass: SatellitePass): RfAnomaly {
  const aisGapHours = (Date.now() - new Date(vessel.lastAisAt).getTime()) / 3_600_000;
  const isDark = pass.anomalyType === 'DARK_VESSEL';
  const isAisGap = pass.anomalyType === 'AIS_GAP';
  const isGapBased = isDark || isAisGap;

  let severity: RfAnomaly['severity'];
  let description: string;
  const tags: string[] = [vessel.flag.toUpperCase(), vessel.vesselType.toUpperCase().replace(/\s+/g, '-'), vessel.region.toUpperCase().replace(/\s+/g, '-')];

  if (isDark) {
    const gapH = Math.round(aisGapHours * 10) / 10;
    severity = gapH > 12 ? 'critical' : 'high';
    description = `AIS signal lost for ${gapH}h. Last known position ${vessel.lat.toFixed(4)}°N ${vessel.lon.toFixed(4)}°E. Dark-vessel track initiated — predicted course ${vessel.heading}° at ${vessel.speedKnots} kts.`;
    tags.push('DARK-VESSEL', 'AIS-GAP', `${Math.round(gapH)}H-BLACKOUT`);
  } else if (isAisGap) {
    const gapH = Math.round(aisGapHours * 10) / 10;
    severity = 'medium';
    description = `AIS signal intermittent for ${gapH}h. Vessel went radio-silent; satellite confirmed last known position ${vessel.lat.toFixed(4)}°N ${vessel.lon.toFixed(4)}°E. Monitoring for dark-vessel escalation.`;
    tags.push('AIS-GAP', `${Math.round(gapH)}H-SILENT`, 'MONITORING');
  } else if (pass.anomalyType === 'POSITION_JUMP') {
    severity = 'critical';
    description = `Extreme position jump detected: ${pass.driftDistanceNm}nm divergence between AIS-reported (${vessel.lat.toFixed(4)}°N, ${vessel.lon.toFixed(4)}°E) and satellite-observed (${pass.observedLat.toFixed(4)}°N, ${pass.observedLon.toFixed(4)}°E). Likely transponder manipulation.`;
    tags.push('POSITION-JUMP', 'TRANSPONDER-MANIPULATION', `${Math.round(pass.driftDistanceNm)}NM-DRIFT`);
  } else {
    severity = pass.driftDistanceNm >= 15 ? 'high' : 'medium';
    description = `RF position spoofing suspected. Satellite observed vessel at ${pass.observedLat.toFixed(4)}°N, ${pass.observedLon.toFixed(4)}°E — ${pass.driftDistanceNm}nm from AIS-reported position. Correlation score: ${pass.correlationScore}%.`;
    tags.push('SPOOFING', `${Math.round(pass.driftDistanceNm)}NM-DRIFT`, 'RF-CORRELATED');
  }

  const existingKey = `${vessel.entityId}:${pass.anomalyType ?? 'DARK_VESSEL'}`;
  const existing = rfAnomaliesStore.get(existingKey);

  return {
    id: existing?.id ?? nextAnomalyId(),
    entityId: vessel.entityId,
    vesselName: vessel.name,
    imoNumber: vessel.imoNumber,
    anomalyType: pass.anomalyType ?? 'DARK_VESSEL',
    severity,
    lat: isGapBased ? vessel.lat : pass.observedLat,
    lon: isGapBased ? vessel.lon : pass.observedLon,
    driftDistanceNm: isGapBased ? null : pass.driftDistanceNm,
    lastKnownLat: vessel.lat,
    lastKnownLon: vessel.lon,
    gapHours: isGapBased ? Math.round(aisGapHours * 10) / 10 : null,
    correlationScore: pass.correlationScore,
    satellitePassId: pass.id,
    detectedAt: existing?.detectedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: existing?.status ?? 'active',
    description,
    predictedHeading: vessel.heading,
    confidencePercent: pass.confidencePercent,
    tags,
    region: vessel.region,
  };
}

// ─── DB persistence helpers ───────────────────────────────────────────────────

async function persistPass(pass: SatellitePass): Promise<void> {
  try {
    await db.insert(rfSatellitePassesTable).values({
      id: pass.id,
      satelliteId: pass.satelliteId,
      entityId: pass.entityId,
      vesselName: pass.vesselName,
      imoNumber: pass.imoNumber,
      observedLat: pass.observedLat,
      observedLon: pass.observedLon,
      aisReportedLat: pass.aisReportedLat,
      aisReportedLon: pass.aisReportedLon,
      driftDistanceNm: pass.driftDistanceNm,
      bearingDeviationDeg: pass.bearingDeviationDeg,
      correlationScore: pass.correlationScore,
      anomalyFlag: pass.anomalyFlag ? 1 : 0,
      anomalyType: pass.anomalyType ?? null,
      passTimestamp: new Date(pass.passTimestamp),
      coverageQuality: pass.coverageQuality,
      confidencePercent: pass.confidencePercent,
    });
  } catch (err) {
    logger.warn({ err }, '[rf-intel] Failed to persist satellite pass to DB');
  }
}

async function upsertAnomaly(anomaly: RfAnomaly): Promise<void> {
  try {
    await db
      .insert(rfAnomaliesTable)
      .values({
        id: anomaly.id,
        entityId: anomaly.entityId,
        vesselName: anomaly.vesselName,
        imoNumber: anomaly.imoNumber,
        anomalyType: anomaly.anomalyType,
        severity: anomaly.severity,
        lat: anomaly.lat,
        lon: anomaly.lon,
        driftDistanceNm: anomaly.driftDistanceNm ?? undefined,
        lastKnownLat: anomaly.lastKnownLat ?? undefined,
        lastKnownLon: anomaly.lastKnownLon ?? undefined,
        gapHours: anomaly.gapHours ?? undefined,
        correlationScore: anomaly.correlationScore,
        satellitePassId: anomaly.satellitePassId,
        description: anomaly.description,
        predictedHeading: anomaly.predictedHeading ?? undefined,
        confidencePercent: anomaly.confidencePercent,
        tags: anomaly.tags,
        region: anomaly.region,
        status: anomaly.status,
        detectedAt: new Date(anomaly.detectedAt),
        updatedAt: new Date(anomaly.updatedAt),
      })
      .onConflictDoUpdate({
        target: rfAnomaliesTable.id,
        set: {
          severity: anomaly.severity,
          lat: anomaly.lat,
          lon: anomaly.lon,
          correlationScore: anomaly.correlationScore,
          satellitePassId: anomaly.satellitePassId,
          description: anomaly.description,
          confidencePercent: anomaly.confidencePercent,
          gapHours: anomaly.gapHours ?? undefined,
          status: anomaly.status,
          updatedAt: new Date(anomaly.updatedAt),
          tags: anomaly.tags,
        },
      });
  } catch (err) {
    logger.warn({ err }, '[rf-intel] Failed to upsert anomaly to DB');
  }
}

// ─── Startup hydration from DB ────────────────────────────────────────────────

export async function hydrateFromDb(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 24 * 3_600_000);
    const [passes, anomalies] = await Promise.all([
      db
        .select()
        .from(rfSatellitePassesTable)
        .where(gte(rfSatellitePassesTable.passTimestamp, cutoff))
        .orderBy(desc(rfSatellitePassesTable.passTimestamp))
        .limit(PASS_RING_BUFFER_SIZE),
      db
        .select()
        .from(rfAnomaliesTable)
        .where(
          or(
            eq(rfAnomaliesTable.status, 'active'),
            eq(rfAnomaliesTable.status, 'investigating'),
          ),
        ),
    ]);

    for (const row of passes.reverse()) {
      rfPassesStore.push({
        id: row.id,
        satelliteId: row.satelliteId,
        entityId: row.entityId,
        vesselName: row.vesselName,
        imoNumber: row.imoNumber,
        observedLat: row.observedLat,
        observedLon: row.observedLon,
        aisReportedLat: row.aisReportedLat,
        aisReportedLon: row.aisReportedLon,
        driftDistanceNm: row.driftDistanceNm,
        bearingDeviationDeg: row.bearingDeviationDeg,
        correlationScore: row.correlationScore,
        anomalyFlag: row.anomalyFlag !== 0,
        anomalyType: (row.anomalyType as AnomalyType) ?? null,
        passTimestamp: row.passTimestamp.toISOString(),
        coverageQuality: (row.coverageQuality as SatellitePass['coverageQuality']) ?? 'good',
        confidencePercent: row.confidencePercent,
      });
    }
    if (rfPassesStore.length > PASS_RING_BUFFER_SIZE) {
      rfPassesStore.splice(0, rfPassesStore.length - PASS_RING_BUFFER_SIZE);
    }

    for (const row of anomalies) {
      const key = `${row.entityId}:${row.anomalyType}`;
      rfAnomaliesStore.set(key, {
        id: row.id,
        entityId: row.entityId,
        vesselName: row.vesselName,
        imoNumber: row.imoNumber,
        anomalyType: row.anomalyType as AnomalyType,
        severity: row.severity as RfAnomaly['severity'],
        lat: row.lat,
        lon: row.lon,
        driftDistanceNm: row.driftDistanceNm ?? null,
        lastKnownLat: row.lastKnownLat ?? null,
        lastKnownLon: row.lastKnownLon ?? null,
        gapHours: row.gapHours ?? null,
        correlationScore: row.correlationScore,
        satellitePassId: row.satellitePassId,
        detectedAt: row.detectedAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        status: row.status as RfAnomaly['status'],
        description: row.description,
        predictedHeading: row.predictedHeading ?? null,
        confidencePercent: row.confidencePercent,
        tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
        region: row.region,
      });
    }

    logger.info(
      { passesLoaded: rfPassesStore.length, anomaliesLoaded: rfAnomaliesStore.size },
      '[rf-intel] Hydrated from DB',
    );
  } catch (err) {
    logger.warn({ err }, '[rf-intel] DB hydration failed — starting with empty store');
  }
}

// ─── Main processing cycle ────────────────────────────────────────────────────

let cycleCount = 0;

export function processSatelliteCycle(): void {
  cycleCount++;
  const cycleTs = Date.now();

  for (const baseVessel of TRACKED_VESSELS) {
    const vessel = getAugmentedVessel(baseVessel);
    const pass = generatePassForVessel(vessel, cycleTs + cycleCount);

    rfPassesStore.push(pass);
    if (rfPassesStore.length > PASS_RING_BUFFER_SIZE) {
      rfPassesStore.splice(0, rfPassesStore.length - PASS_RING_BUFFER_SIZE);
    }

    void persistPass(pass);

    if (pass.anomalyFlag) {
      const key = `${vessel.entityId}:${pass.anomalyType ?? 'DARK_VESSEL'}`;
      const anomaly = buildAnomaly(vessel, pass);
      rfAnomaliesStore.set(key, anomaly);
      void upsertAnomaly(anomaly);
    } else {
      for (const [key, ano] of rfAnomaliesStore) {
        if (key.startsWith(vessel.entityId + ':') && ano.status === 'active') {
          const updated = { ...ano, status: 'investigating' as const, updatedAt: new Date().toISOString() };
          rfAnomaliesStore.set(key, updated);
          void upsertAnomaly(updated);
        }
      }
    }
  }
}

// ─── Correlation history per vessel ──────────────────────────────────────────

export function getVesselCorrelation(entityId: string): VesselCorrelationHistory | null {
  const vessel = TRACKED_VESSELS.find((v) => v.entityId === entityId);
  if (!vessel) return null;

  const cutoff24h = Date.now() - 24 * 3_600_000;
  const passes = rfPassesStore
    .filter((p) => p.entityId === entityId)
    .filter((p) => new Date(p.passTimestamp).getTime() > cutoff24h);

  const anomalies = [...rfAnomaliesStore.values()].filter((a) => a.entityId === entityId);
  const activeAnomalies = anomalies.filter((a) => a.status === 'active').length;

  const avgScore =
    passes.length > 0
      ? Math.round(passes.reduce((s, p) => s + p.correlationScore, 0) / passes.length)
      : 0;

  const lastPass = passes.length > 0 ? passes[passes.length - 1] : null;

  let correlationStatus: VesselCorrelationHistory['correlationStatus'] = 'nominal';
  const effectiveVessel = getAugmentedVessel(vessel);
  const aisGapHours = (Date.now() - new Date(effectiveVessel.lastAisAt).getTime()) / 3_600_000;
  if (aisGapHours >= DARK_VESSEL_THRESHOLD_HOURS) {
    correlationStatus = 'dark';
  } else if (aisGapHours >= AIS_GAP_THRESHOLD_HOURS) {
    correlationStatus = 'degraded';
  } else if (activeAnomalies > 0) {
    const hasSpoof = anomalies.some(
      (a) => a.status === 'active' && (a.anomalyType === 'SPOOFING' || a.anomalyType === 'POSITION_JUMP'),
    );
    correlationStatus = hasSpoof ? 'spoofing' : 'degraded';
  } else if (avgScore < 65) {
    correlationStatus = 'degraded';
  }

  return {
    entityId,
    vesselName: vessel.name,
    imoNumber: vessel.imoNumber,
    lastPassAt: lastPass?.passTimestamp ?? null,
    passCount24h: passes.length,
    avgCorrelationScore: avgScore,
    activeAnomalies,
    correlationStatus,
    passes: passes.slice(-20),
    anomalies,
  };
}

// ─── Accessor for geo-intel integration ──────────────────────────────────────

export function getActiveRfAnomalies(): RfAnomaly[] {
  return [...rfAnomaliesStore.values()].filter((a) => a.status === 'active');
}

export function getRecentPasses(limitHours = 24): SatellitePass[] {
  const cutoff = Date.now() - limitHours * 3_600_000;
  return rfPassesStore.filter((p) => new Date(p.passTimestamp).getTime() > cutoff);
}

// ─── Bootstrap: hydrate from DB, run an initial cycle, then schedule ──────────

void hydrateFromDb().then(() => {
  processSatelliteCycle();
});

const _rfTimer = setInterval(processSatelliteCycle, CYCLE_INTERVAL_MS);
if (typeof _rfTimer === 'object' && 'unref' in _rfTimer) {
  (_rfTimer as NodeJS.Timeout).unref();
}
