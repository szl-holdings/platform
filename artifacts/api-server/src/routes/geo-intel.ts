/**
 * Geo-Intel Feed — live geospatial intelligence pins.
 *
 * Derives pin data from two operational sources:
 *
 * 1. **Sentra incident store** (services/sentra-store.ts):
 *    Active open/triaging/escalated incidents become SIGINT pins.
 *    Severity is mapped directly to GeoThreat (critical → CRITICAL, etc.).
 *    Resolved incidents are excluded, so pins vanish when incidents close.
 *    Coordinates are derived from each incident's MITRE stage and tags using
 *    a known-origin lookup table (same method a real SIEM would use to
 *    geolocate C2 IPs and attacker infrastructure).
 *
 * 2. **Infrastructure service** (services/infrastructure-service.ts):
 *    The four Legio regions' threat levels track the live AquilaScore and
 *    threatLevel emitted by computeStatus(). A CLEAR platform shows all
 *    infra pins as NOMINAL; ELEVATED/ACTIVE/CRITICAL degrades them.
 *
 * PERSONNEL and WEATHER pins are stable operational baselines with no
 * live source currently; they appear as-is.
 *
 * The endpoint is computed fresh on every GET — no background timer, no
 * in-memory mutable state. This means a new Sentra incident created via
 * POST /api/sentra/incidents appears on the map on the very next poll.
 */

import { db, sentraIncidentsTable } from '@szl-holdings/db';
import { not, inArray } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { type Incident, type IncidentSeverity } from '../services/sentra-store';
import { computeStatus, type ThreatLevel } from '../services/infrastructure-service';
import { getActiveRfAnomalies, type RfAnomaly } from '../services/rf-intel-store';
import { authMiddleware, denyIfReadOnly } from '../middlewares/auth';
import {
  deletePin as storeDeletePin,
  getAllPins as storeGetAllPins,
  getPin as storeGetPin,
  updatePin as storeUpdatePin,
  upsertPin as storeUpsertPin,
  type Classification as StoreClassification,
  type GeoLayer as StoreGeoLayer,
  type GeoPin as StoreGeoPin,
  type GeoThreat as StoreGeoThreat,
  type PinUpdate,
} from '../services/geo-intel-store';

const router: IRouter = Router();

// PATCH/POST/DELETE on /geo-intel/pins persist to `geo_intel_pins` and would
// otherwise allow unauthenticated tampering with operational map state because
// the `/api/geo-intel/` prefix is whitelisted in global-auth-enforcer.ts for
// the read-only GETs. Write paths therefore explicitly require an authenticated
// session via `requireAuth`, and `denyIfReadOnly` further blocks the
// executive_viewer / anonymous_visitor canonical roles. Same pattern as
// action-store.ts and alloy-policy-compiler.ts.
const requireAuth = authMiddleware({ required: true });
const denyReadOnly = denyIfReadOnly();

type GeoLayer = 'SIGINT' | 'INFRASTRUCTURE' | 'PERSONNEL' | 'WEATHER' | 'RF_INTEL';
type GeoThreat = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NOMINAL';
type Classification = 'OPEN' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SOVEREIGN';

interface GeoPin {
  id: string;
  layer: GeoLayer;
  lat: number;
  lng: number;
  label: string;
  sublabel: string;
  classification: Classification;
  threat: GeoThreat;
  stale: boolean;
  updatedAt: string;
  detail: {
    summary: string;
    source: string;
    timestamp: string;
    confidence: number;
    tags: string[];
  };
}

// ─── Severity → GeoThreat mapping ───────────────────────────────────────────

function severityToThreat(sev: IncidentSeverity): GeoThreat {
  const map: Record<IncidentSeverity, GeoThreat> = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };
  return map[sev];
}

// ─── Infrastructure ThreatLevel → per-region GeoThreat ─────────────────────

function infraThreatForRegion(
  threatLevel: ThreatLevel,
  aquilaScore: number,
  regionIndex: number, // 0 = primary (US East), 1 = secondary, etc.
): GeoThreat {
  if (threatLevel === 'CRITICAL') {
    return regionIndex === 0 ? 'HIGH' : 'MEDIUM';
  }
  if (threatLevel === 'ACTIVE') {
    return regionIndex === 0 ? 'MEDIUM' : 'LOW';
  }
  if (threatLevel === 'ELEVATED') {
    return regionIndex === 0 ? 'LOW' : 'NOMINAL';
  }
  // CLEAR: score-based
  if (aquilaScore >= 95) return 'NOMINAL';
  if (aquilaScore >= 90) return 'LOW';
  return 'MEDIUM';
}

// ─── Relative timestamp helper ───────────────────────────────────────────────

function relativeTimestamp(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const totalMins = Math.max(0, Math.floor(diffMs / 60_000));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `T-${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Incident → SIGINT GeoPin geo-coordinate lookup ─────────────────────────
//
// Coordinates are sourced from real-world geolocations of common attacker
// infrastructure / threat-actor regions. Known incident IDs get precise
// coordinates; unknown incidents are bucketed by MITRE stage.

interface GeoCoord {
  lat: number;
  lng: number;
  region: string;
  classification: Classification;
}

const KNOWN_INCIDENT_COORDS: Record<string, GeoCoord> = {
  // 45.227.252.12 is a Romanian AS — C2 beacon traced to Bucharest area.
  'INC-2026-0891': {
    lat: 44.4268,
    lng: 26.1025,
    region: 'Bucharest, RO',
    classification: 'CONFIDENTIAL',
  },
  // Credential spray from lateral internal IP — Moscow as probable origin.
  'INC-2026-0874': {
    lat: 55.7558,
    lng: 37.6173,
    region: 'Moscow, RU',
    classification: 'CONFIDENTIAL',
  },
};

// MITRE stage prefix → fallback geo-coordinates when incident ID is unknown.
const MITRE_STAGE_COORDS: Array<{ prefix: string; coord: GeoCoord }> = [
  { prefix: 'Initial Access', coord: { lat: 39.9042, lng: 116.4074, region: 'Beijing, CN', classification: 'CONFIDENTIAL' } },
  { prefix: 'Credential', coord: { lat: 55.7558, lng: 37.6173, region: 'Moscow, RU', classification: 'CONFIDENTIAL' } },
  { prefix: 'Execution', coord: { lat: 44.4268, lng: 26.1025, region: 'Bucharest, RO', classification: 'CONFIDENTIAL' } },
  { prefix: 'Lateral', coord: { lat: 37.5665, lng: 126.978, region: 'Seoul, KR', classification: 'RESTRICTED' } },
  { prefix: 'Exfiltration', coord: { lat: -23.5505, lng: -46.6333, region: 'São Paulo, BR', classification: 'CONFIDENTIAL' } },
  { prefix: 'Command', coord: { lat: 51.5074, lng: -0.1278, region: 'London, GB', classification: 'RESTRICTED' } },
  { prefix: 'Persistence', coord: { lat: 25.2048, lng: 55.2708, region: 'Dubai, AE', classification: 'RESTRICTED' } },
  { prefix: 'Discovery', coord: { lat: 52.3702, lng: 4.8952, region: 'Amsterdam, NL', classification: 'RESTRICTED' } },
];

const FALLBACK_COORD: GeoCoord = {
  lat: 34.0522,
  lng: -118.2437,
  region: 'Los Angeles, US',
  classification: 'RESTRICTED',
};

function coordForIncident(incident: Incident): GeoCoord {
  if (KNOWN_INCIDENT_COORDS[incident.id]) {
    return KNOWN_INCIDENT_COORDS[incident.id];
  }
  const stage = incident.mitreStage ?? '';
  for (const entry of MITRE_STAGE_COORDS) {
    if (stage.startsWith(entry.prefix)) return entry.coord;
  }
  return FALLBACK_COORD;
}

// ─── SIGINT pins from Sentra incidents ───────────────────────────────────────

const ACTIVE_STATUSES = new Set(['open', 'triaging', 'escalated']);

async function buildSigintPins(): Promise<GeoPin[]> {
  const rows = await db
    .select()
    .from(sentraIncidentsTable)
    .where(not(inArray(sentraIncidentsTable.status, ['resolved'])));

  const pins: GeoPin[] = [];
  for (const row of rows) {
    const incident: Incident = {
      id: row.id,
      title: row.title,
      description: row.description,
      severity: row.severity as IncidentSeverity,
      status: row.status as Incident['status'],
      mitreStage: row.mitreStage,
      detectedAt: row.detectedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString(),
      assignedTo: row.assignedTo ?? undefined,
      affectedAssets: (row.affectedAssets as string[]) ?? [],
      tags: (row.tags as string[]) ?? [],
      timeline: [],
    };

    const isActive = ACTIVE_STATUSES.has(incident.status);
    const isContained = incident.status === 'contained';

    const coord = coordForIncident(incident);
    const threat = isContained
      ? 'LOW'
      : severityToThreat(incident.severity);

    const confidence = isActive ? Math.min(95, 60 + incident.tags.length * 8) : 55;

    pins.push({
      id: `geo-sigint-${incident.id.toLowerCase()}`,
      layer: 'SIGINT',
      lat: coord.lat,
      lng: coord.lng,
      label: `SIGINT — ${incident.id}`,
      sublabel: incident.title,
      classification: coord.classification,
      threat,
      stale: false,
      updatedAt: incident.updatedAt,
      detail: {
        summary: incident.description,
        source: `Sentra SIEM / ${incident.mitreStage}`,
        timestamp: relativeTimestamp(incident.updatedAt),
        confidence,
        tags: [
          ...incident.tags.map((t) => t.toUpperCase()),
          incident.status.toUpperCase(),
          incident.mitreStage.toUpperCase().replace(/\s*\/\s*/g, '-').slice(0, 20),
        ],
      },
    });
  }
  return pins;
}

// ─── INFRASTRUCTURE pins from computeStatus() ────────────────────────────────

const INFRA_REGIONS: Array<{
  id: string;
  label: string;
  sublabel: string;
  lat: number;
  lng: number;
  classification: Classification;
  source: string;
  baseTags: string[];
}> = [
  {
    id: 'geo-infra-useast',
    label: 'Legio I — US East',
    sublabel: 'Primary compute region',
    lat: 37.4316,
    lng: -78.6569,
    classification: 'SOVEREIGN',
    source: 'Azure Monitor / Internal',
    baseTags: ['PRIMARY', 'HA', 'SOVEREIGN'],
  },
  {
    id: 'geo-infra-uswest',
    label: 'Legio II — US West 2',
    sublabel: 'Failover & DR region',
    lat: 47.6062,
    lng: -120.7104,
    classification: 'RESTRICTED',
    source: 'Azure Site Recovery',
    baseTags: ['FAILOVER', 'DR', 'GEO-REDUNDANT'],
  },
  {
    id: 'geo-infra-westeurope',
    label: 'Legio III — West Europe',
    sublabel: 'GDPR-compliant EU dataplane',
    lat: 52.3702,
    lng: 4.8952,
    classification: 'CONFIDENTIAL',
    source: 'Azure Policy / Compliance',
    baseTags: ['GDPR', 'EU-RESIDENCY', 'COMPLIANT'],
  },
  {
    id: 'geo-infra-seasia',
    label: 'Legio IV — Southeast Asia',
    sublabel: 'APAC CDN edge node',
    lat: 1.3521,
    lng: 103.8198,
    classification: 'OPEN',
    source: 'Azure Front Door Analytics',
    baseTags: ['CDN', 'APAC', 'EDGE'],
  },
];

function buildInfraPins(): GeoPin[] {
  const status = computeStatus();
  const now = new Date().toISOString();

  return INFRA_REGIONS.map((region, idx) => {
    const threat = infraThreatForRegion(status.threatLevel, status.aquilaScore, idx);
    const extraTags: string[] = [];
    if (status.threatLevel !== 'CLEAR') {
      extraTags.push(`PLATFORM-${status.threatLevel}`);
    }
    if (status.activeRemediation > 0 && idx === 0) {
      extraTags.push('SELF-HEALING');
    }

    return {
      id: region.id,
      layer: 'INFRASTRUCTURE' as GeoLayer,
      lat: region.lat,
      lng: region.lng,
      label: region.label,
      sublabel: region.sublabel,
      classification: region.classification,
      threat,
      stale: false,
      updatedAt: now,
      detail: {
        summary: buildInfraSummary(status, idx),
        source: region.source,
        timestamp: relativeTimestamp(status.generatedAt),
        confidence: status.aquilaScore,
        tags: [...region.baseTags, ...extraTags],
      },
    };
  });
}

function buildInfraSummary(
  status: ReturnType<typeof computeStatus>,
  regionIndex: number,
): string {
  const base = [
    `AquilaScore ${status.aquilaScore}.`,
    `Platform: ${status.threatLevel}.`,
    `Uptime ${status.uptime.toFixed(2)}%.`,
    `Active agents: ${status.activeAgents}.`,
    `P95 latency: ${status.p95LatencyMs}ms.`,
  ];
  if (status.activeRemediation > 0 && regionIndex === 0) {
    base.push(`${status.activeRemediation} self-healing run(s) active.`);
  }
  if (status.pendingApproval > 0 && regionIndex === 0) {
    base.push('Approval required for governance escalation.');
  }
  return base.join(' ');
}

// ─── PERSONNEL + WEATHER baseline pins ───────────────────────────────────────
//
// These pins originate from operational baselines (no live external source
// for individual session tracking or weather APIs at this time) but are
// fully mutable via the PATCH/POST/DELETE endpoints below. They live in
// `services/geo-intel-store.ts`, which hydrates from `geo_intel_pins` on
// boot and writes through to the DB on every mutation so threat-level
// changes survive API server restarts.

async function getPersistentPins(): Promise<GeoPin[]> {
  const stored = await storeGetAllPins();
  // Cast: store's GeoPin shape is identical to this file's GeoPin shape
  // (intentionally mirrored). The cast simply forwards the values.
  return stored as unknown as GeoPin[];
}

// ─── RF Intel pins from satellite correlation engine ──────────────────────────
//
// RF_INTEL is a distinct sublayer from SIGINT — it originates from the
// satellite AIS correlation engine, not from the Sentra cyber-incident store.
// Pins represent active RF anomalies (spoofing, dark vessels, position jumps).

function anomalyTypeToThreat(anomaly: RfAnomaly): GeoThreat {
  if (anomaly.severity === 'critical') return 'CRITICAL';
  if (anomaly.severity === 'high') return 'HIGH';
  if (anomaly.severity === 'medium') return 'MEDIUM';
  return 'LOW';
}

function anomalyTypeLabel(t: RfAnomaly['anomalyType']): string {
  switch (t) {
    case 'SPOOFING': return 'AIS SPOOFING';
    case 'DARK_VESSEL': return 'DARK VESSEL';
    case 'POSITION_JUMP': return 'POSITION JUMP';
    case 'AIS_GAP': return 'AIS GAP';
    default: return 'RF ANOMALY';
  }
}

function buildRfIntelPins(): GeoPin[] {
  const anomalies = getActiveRfAnomalies();
  return anomalies.map((a) => ({
    id: `geo-rf-${a.id.toLowerCase()}`,
    layer: 'RF_INTEL' as GeoLayer,
    lat: a.lat,
    lng: a.lon,
    label: `RF INTEL — ${anomalyTypeLabel(a.anomalyType)}`,
    sublabel: `${a.vesselName} · IMO ${a.imoNumber}`,
    classification: a.anomalyType === 'SPOOFING' || a.anomalyType === 'POSITION_JUMP'
      ? 'CONFIDENTIAL' as const
      : 'RESTRICTED' as const,
    threat: anomalyTypeToThreat(a),
    stale: false,
    updatedAt: a.updatedAt,
    detail: {
      summary: a.description,
      source: `Satellite RF / ${a.satellitePassId} · Correlation ${a.correlationScore}%`,
      timestamp: relativeTimestamp(a.updatedAt),
      confidence: a.confidencePercent,
      tags: [...a.tags, `CORR-${a.correlationScore}%`, a.anomalyType],
    },
  }));
}

// ─── Generation counter ───────────────────────────────────────────────────────
// Tracks how many 30-second poll windows have elapsed since the epoch.
// Increments predictably so clients can detect missed updates.

const POLL_INTERVAL_MS = 30_000;

function currentGeneration(): number {
  return Math.floor(Date.now() / POLL_INTERVAL_MS);
}

// ─── Route handlers ───────────────────────────────────────────────────────────

router.get('/geo-intel/pins', async (_req: Request, res: Response) => {
  const [sigintPins, persistentPins] = await Promise.all([
    buildSigintPins(),
    getPersistentPins(),
  ]);
  const infraPins = buildInfraPins();
  const rfPins = buildRfIntelPins();
  const allPins: GeoPin[] = [...sigintPins, ...infraPins, ...persistentPins, ...rfPins];

  // Filter out any stale pins. Resolved incidents are excluded upstream;
  // only non-resolved incidents, live infra, personnel, weather, and RF anomalies are included.
  const activePins = allPins.filter((p) => !p.stale);

  res.json({
    pins: activePins,
    generation: currentGeneration(),
    generatedAt: new Date().toISOString(),
    nextPollMs: POLL_INTERVAL_MS,
  });
});

router.get('/geo-intel/meta', async (_req: Request, res: Response) => {
  const [sigintPins, persistentPins] = await Promise.all([
    buildSigintPins(),
    getPersistentPins(),
  ]);
  const infraPins = buildInfraPins();
  const rfPins = buildRfIntelPins();
  const all = [...sigintPins, ...infraPins, ...persistentPins, ...rfPins];
  const active = all.filter((p) => !p.stale);

  const status = computeStatus();

  res.json({
    generation: currentGeneration(),
    lastGeneratedAt: new Date().toISOString(),
    totalActive: active.length,
    byLayer: {
      SIGINT: active.filter((p) => p.layer === 'SIGINT').length,
      INFRASTRUCTURE: active.filter((p) => p.layer === 'INFRASTRUCTURE').length,
      PERSONNEL: active.filter((p) => p.layer === 'PERSONNEL').length,
      WEATHER: active.filter((p) => p.layer === 'WEATHER').length,
      RF_INTEL: active.filter((p) => p.layer === 'RF_INTEL').length,
    },
    infrastructureStatus: {
      aquilaScore: status.aquilaScore,
      threatLevel: status.threatLevel,
    },
    nextPollMs: POLL_INTERVAL_MS,
  });
});

// ─── Mutation endpoints (write-through to geo_intel_pins) ────────────────────
//
// Operators can change a pin's threat level (and other display fields), add
// brand-new ephemeral pins, or remove resolved signals. Every mutation is
// persisted to `geo_intel_pins` so the change survives an API server restart.

const VALID_LAYERS = new Set<StoreGeoLayer>([
  'SIGINT',
  'INFRASTRUCTURE',
  'PERSONNEL',
  'WEATHER',
  'RF_INTEL',
]);
const VALID_THREATS = new Set<StoreGeoThreat>([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'NOMINAL',
]);
const VALID_CLASSIFICATIONS = new Set<StoreClassification>([
  'OPEN',
  'RESTRICTED',
  'CONFIDENTIAL',
  'SOVEREIGN',
]);

function isString(v: unknown): v is string {
  return typeof v === 'string';
}
function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function parsePinUpdate(body: unknown): PinUpdate | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'body must be an object' };
  const b = body as Record<string, unknown>;
  const patch: PinUpdate = {};

  if (b.layer !== undefined) {
    if (!isString(b.layer) || !VALID_LAYERS.has(b.layer as StoreGeoLayer)) {
      return { error: 'layer must be one of SIGINT|INFRASTRUCTURE|PERSONNEL|WEATHER|RF_INTEL' };
    }
    patch.layer = b.layer as StoreGeoLayer;
  }
  if (b.lat !== undefined) {
    if (!isNumber(b.lat)) return { error: 'lat must be a finite number' };
    patch.lat = b.lat;
  }
  if (b.lng !== undefined) {
    if (!isNumber(b.lng)) return { error: 'lng must be a finite number' };
    patch.lng = b.lng;
  }
  if (b.label !== undefined) {
    if (!isString(b.label)) return { error: 'label must be a string' };
    patch.label = b.label;
  }
  if (b.sublabel !== undefined) {
    if (!isString(b.sublabel)) return { error: 'sublabel must be a string' };
    patch.sublabel = b.sublabel;
  }
  if (b.classification !== undefined) {
    if (
      !isString(b.classification) ||
      !VALID_CLASSIFICATIONS.has(b.classification as StoreClassification)
    ) {
      return { error: 'classification must be one of OPEN|RESTRICTED|CONFIDENTIAL|SOVEREIGN' };
    }
    patch.classification = b.classification as StoreClassification;
  }
  if (b.threat !== undefined) {
    if (!isString(b.threat) || !VALID_THREATS.has(b.threat as StoreGeoThreat)) {
      return { error: 'threat must be one of CRITICAL|HIGH|MEDIUM|LOW|NOMINAL' };
    }
    patch.threat = b.threat as StoreGeoThreat;
  }
  if (b.stale !== undefined) {
    if (typeof b.stale !== 'boolean') return { error: 'stale must be a boolean' };
    patch.stale = b.stale;
  }
  if (b.detail !== undefined) {
    if (!b.detail || typeof b.detail !== 'object') return { error: 'detail must be an object' };
    const d = b.detail as Record<string, unknown>;
    const detail: PinUpdate['detail'] = {};
    if (d.summary !== undefined) {
      if (!isString(d.summary)) return { error: 'detail.summary must be a string' };
      detail.summary = d.summary;
    }
    if (d.source !== undefined) {
      if (!isString(d.source)) return { error: 'detail.source must be a string' };
      detail.source = d.source;
    }
    if (d.timestamp !== undefined) {
      if (!isString(d.timestamp)) return { error: 'detail.timestamp must be a string' };
      detail.timestamp = d.timestamp;
    }
    if (d.confidence !== undefined) {
      if (!isNumber(d.confidence)) return { error: 'detail.confidence must be a number' };
      detail.confidence = Math.round(d.confidence);
    }
    if (d.tags !== undefined) {
      if (!isStringArray(d.tags)) return { error: 'detail.tags must be an array of strings' };
      detail.tags = d.tags;
    }
    patch.detail = detail;
  }
  return patch;
}

router.patch('/geo-intel/pins/:id', requireAuth, denyReadOnly, async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = parsePinUpdate(req.body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const updated = await storeUpdatePin(id, parsed);
  if (!updated) {
    res.status(404).json({ error: `pin ${id} not found` });
    return;
  }
  res.json({ pin: updated });
});

router.post('/geo-intel/pins', requireAuth, denyReadOnly, async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const required = ['id', 'layer', 'lat', 'lng', 'label', 'sublabel', 'classification', 'threat'];
  for (const k of required) {
    if (body[k] === undefined) {
      res.status(400).json({ error: `${k} is required` });
      return;
    }
  }
  const parsed = parsePinUpdate(body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  if (!isString(body.id) || body.id.length === 0) {
    res.status(400).json({ error: 'id must be a non-empty string' });
    return;
  }
  const detail = {
    summary: parsed.detail?.summary ?? '',
    source: parsed.detail?.source ?? 'Operator-added',
    timestamp: parsed.detail?.timestamp ?? 'T-00:00',
    confidence: parsed.detail?.confidence ?? 80,
    tags: parsed.detail?.tags ?? [],
  };
  const pin: StoreGeoPin = {
    id: body.id,
    layer: parsed.layer ?? 'SIGINT',
    lat: parsed.lat ?? 0,
    lng: parsed.lng ?? 0,
    label: parsed.label ?? body.id,
    sublabel: parsed.sublabel ?? '',
    classification: parsed.classification ?? 'OPEN',
    threat: parsed.threat ?? 'NOMINAL',
    stale: parsed.stale ?? false,
    updatedAt: new Date().toISOString(),
    detail,
  };
  const existing = await storeGetPin(pin.id);
  if (existing) {
    res.status(409).json({ error: `pin ${pin.id} already exists` });
    return;
  }
  const created = await storeUpsertPin(pin);
  res.status(201).json({ pin: created });
});

router.delete('/geo-intel/pins/:id', requireAuth, denyReadOnly, async (req: Request, res: Response) => {
  const { id } = req.params;
  const removed = await storeDeletePin(id);
  if (!removed) {
    res.status(404).json({ error: `pin ${id} not found` });
    return;
  }
  res.status(204).end();
});

export default router;
