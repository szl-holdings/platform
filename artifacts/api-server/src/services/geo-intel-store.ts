/**
 * Geo-Intel Store — DB-backed persistence for mutable map pins.
 *
 * SIGINT pins are derived from `sentra_incidents` (already DB-backed) and
 * INFRASTRUCTURE/RF_INTEL pins are computed live from their own services.
 * This store owns the pins that an operator can directly mutate via the
 * map UI — currently PERSONNEL and WEATHER baselines, plus any ad-hoc
 * pins added at runtime.
 *
 * Lifecycle:
 *   1. On boot, `hydrateFromDb()` loads every row of `geo_intel_pins`
 *      into the in-memory Map. If the table is empty (first boot, or a
 *      brand-new environment) it seeds the DB from BASE_PINS so the map
 *      is never blank.
 *   2. Reads serve from the in-memory Map for low latency.
 *   3. Mutations (`upsertPin`, `updatePin`, `deletePin`) write through to
 *      the DB and update the Map atomically. Any thrown DB error
 *      surfaces to the caller so the API responds with a 5xx instead of
 *      silently dropping the change.
 *
 * This guarantees that live threat-level escalations, new ephemeral pins,
 * and pin removals all survive an API server restart.
 */

import { db, geoIntelPinsTable, type GeoIntelPinRow } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger';

export type GeoLayer = 'SIGINT' | 'INFRASTRUCTURE' | 'PERSONNEL' | 'WEATHER' | 'RF_INTEL';
export type GeoThreat = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NOMINAL';
export type Classification = 'OPEN' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SOVEREIGN';

export interface GeoPin {
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

// ─── Baseline pins ────────────────────────────────────────────────────────────
//
// Used to seed the DB on first boot. These mirror the legacy hard-coded
// PERSONNEL_PINS/WEATHER_PINS arrays that lived in routes/geo-intel.ts.

export const BASE_PINS: GeoPin[] = [
  {
    id: 'geo-personnel-001',
    layer: 'PERSONNEL',
    lat: 40.7128,
    lng: -74.006,
    label: 'EXEC — New York',
    sublabel: 'Authorized administrator',
    classification: 'SOVEREIGN',
    threat: 'NOMINAL',
    stale: false,
    updatedAt: new Date(0).toISOString(),
    detail: {
      summary:
        'C-suite executive access via Zero Trust NAC. MFA verified. Session active. Read-only mode.',
      source: 'Entra ID / Conditional Access',
      timestamp: 'T-00:02',
      confidence: 100,
      tags: ['C-SUITE', 'MFA-VERIFIED', 'READ-ONLY'],
    },
  },
  {
    id: 'geo-personnel-002',
    layer: 'PERSONNEL',
    lat: 34.0522,
    lng: -118.2437,
    label: 'DEVOPS — Los Angeles',
    sublabel: 'Infrastructure engineer',
    classification: 'RESTRICTED',
    threat: 'NOMINAL',
    stale: false,
    updatedAt: new Date(0).toISOString(),
    detail: {
      summary:
        'Senior DevOps engineer. Active deployment pipeline session. Azure RBAC: Contributor on Compute RG. Approved change window.',
      source: 'Entra ID / Azure RBAC',
      timestamp: 'T-00:08',
      confidence: 100,
      tags: ['DEVOPS', 'CONTRIBUTOR', 'CHANGE-WINDOW'],
    },
  },
  {
    id: 'geo-personnel-003',
    layer: 'PERSONNEL',
    lat: 48.8566,
    lng: 2.3522,
    label: 'ANALYST — Paris',
    sublabel: 'Security analyst — read-only',
    classification: 'CONFIDENTIAL',
    threat: 'NOMINAL',
    stale: false,
    updatedAt: new Date(0).toISOString(),
    detail: {
      summary:
        'SOC analyst reviewing threat telemetry. Reader role on Aegis SIEM workspace. No anomalies.',
      source: 'Entra ID / Aegis Access Log',
      timestamp: 'T-00:14',
      confidence: 100,
      tags: ['SOC', 'READER', 'NOMINAL'],
    },
  },
  {
    id: 'geo-weather-001',
    layer: 'WEATHER',
    lat: 38.9072,
    lng: -77.0369,
    label: 'WEATHER-DC — Thunderstorm risk',
    sublabel: 'AZ-1 availability concern',
    classification: 'OPEN',
    threat: 'LOW',
    stale: false,
    updatedAt: new Date(0).toISOString(),
    detail: {
      summary:
        'Severe thunderstorm watch in DC metro. Azure US East AZ-1 may experience power fluctuation. HA failover pre-warmed to AZ-2.',
      source: 'NOAA API / Azure Health',
      timestamp: 'T-00:30',
      confidence: 78,
      tags: ['WEATHER', 'AZ-RISK', 'PRE-WARMED'],
    },
  },
  {
    id: 'geo-weather-002',
    layer: 'WEATHER',
    lat: 35.6762,
    lng: 139.6503,
    label: 'WEATHER-Tokyo — Seismic alert',
    sublabel: 'APAC edge node monitoring',
    classification: 'OPEN',
    threat: 'LOW',
    stale: false,
    updatedAt: new Date(0).toISOString(),
    detail: {
      summary:
        'M4.2 earthquake registered near Tokyo. Azure Japan East CDN edge operating normally. No infrastructure impact detected.',
      source: 'JMA / Azure Health Advisories',
      timestamp: 'T-01:15',
      confidence: 90,
      tags: ['SEISMIC', 'MONITORING', 'NO-IMPACT'],
    },
  },
];

// ─── In-memory store ──────────────────────────────────────────────────────────

const geoPinStore = new Map<string, GeoPin>();
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

// ─── Row ↔ GeoPin mapping ─────────────────────────────────────────────────────

function rowToPin(row: GeoIntelPinRow): GeoPin {
  return {
    id: row.id,
    layer: row.layer as GeoLayer,
    lat: row.lat,
    lng: row.lng,
    label: row.label,
    sublabel: row.sublabel,
    classification: row.classification as Classification,
    threat: row.threat as GeoThreat,
    stale: row.stale,
    updatedAt: row.updatedAt.toISOString(),
    detail: {
      summary: row.detailSummary,
      source: row.detailSource,
      timestamp: row.detailTimestamp,
      confidence: row.detailConfidence,
      tags: Array.isArray(row.detailTags) ? (row.detailTags as string[]) : [],
    },
  };
}

function pinToInsert(pin: GeoPin) {
  return {
    id: pin.id,
    layer: pin.layer,
    lat: pin.lat,
    lng: pin.lng,
    label: pin.label,
    sublabel: pin.sublabel,
    classification: pin.classification,
    threat: pin.threat,
    stale: pin.stale,
    detailSummary: pin.detail.summary,
    detailSource: pin.detail.source,
    detailTimestamp: pin.detail.timestamp,
    detailConfidence: pin.detail.confidence,
    detailTags: pin.detail.tags,
    updatedAt: new Date(pin.updatedAt),
  };
}

// ─── Hydration ────────────────────────────────────────────────────────────────

async function seedDbFromBase(): Promise<void> {
  for (const pin of BASE_PINS) {
    await db.insert(geoIntelPinsTable).values(pinToInsert(pin)).onConflictDoNothing();
  }
}

export async function hydrateFromDb(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      let rows = await db.select().from(geoIntelPinsTable);
      if (rows.length === 0) {
        await seedDbFromBase();
        rows = await db.select().from(geoIntelPinsTable);
      }
      geoPinStore.clear();
      for (const row of rows) {
        const pin = rowToPin(row);
        geoPinStore.set(pin.id, pin);
      }
      hydrated = true;
      logger.info(
        { pinsLoaded: geoPinStore.size },
        '[geo-intel] Hydrated mutable pins from DB',
      );
    } catch (err) {
      logger.warn(
        { err },
        '[geo-intel] DB hydration failed — falling back to in-memory BASE_PINS',
      );
      geoPinStore.clear();
      for (const pin of BASE_PINS) geoPinStore.set(pin.id, pin);
      hydrated = true;
    }
  })();
  return hydratePromise;
}

async function ensureHydrated(): Promise<void> {
  if (!hydrated) await hydrateFromDb();
}

// ─── Read API ─────────────────────────────────────────────────────────────────

export async function getAllPins(): Promise<GeoPin[]> {
  await ensureHydrated();
  return [...geoPinStore.values()];
}

export async function getPin(id: string): Promise<GeoPin | undefined> {
  await ensureHydrated();
  return geoPinStore.get(id);
}

// ─── Mutation API (write-through) ─────────────────────────────────────────────

export async function upsertPin(pin: GeoPin): Promise<GeoPin> {
  await ensureHydrated();
  const insert = pinToInsert({ ...pin, updatedAt: new Date().toISOString() });
  await db
    .insert(geoIntelPinsTable)
    .values(insert)
    .onConflictDoUpdate({
      target: geoIntelPinsTable.id,
      set: {
        layer: insert.layer,
        lat: insert.lat,
        lng: insert.lng,
        label: insert.label,
        sublabel: insert.sublabel,
        classification: insert.classification,
        threat: insert.threat,
        stale: insert.stale,
        detailSummary: insert.detailSummary,
        detailSource: insert.detailSource,
        detailTimestamp: insert.detailTimestamp,
        detailConfidence: insert.detailConfidence,
        detailTags: insert.detailTags,
        updatedAt: insert.updatedAt,
      },
    });
  const stored: GeoPin = { ...pin, updatedAt: insert.updatedAt.toISOString() };
  geoPinStore.set(stored.id, stored);
  return stored;
}

export interface PinUpdate {
  layer?: GeoLayer;
  lat?: number;
  lng?: number;
  label?: string;
  sublabel?: string;
  classification?: Classification;
  threat?: GeoThreat;
  stale?: boolean;
  detail?: Partial<GeoPin['detail']>;
}

export async function updatePin(
  id: string,
  patch: PinUpdate,
): Promise<GeoPin | undefined> {
  await ensureHydrated();
  const current = geoPinStore.get(id);
  if (!current) return undefined;

  const next: GeoPin = {
    ...current,
    ...patch,
    detail: { ...current.detail, ...(patch.detail ?? {}) },
    updatedAt: new Date().toISOString(),
  };

  await db
    .update(geoIntelPinsTable)
    .set({
      layer: next.layer,
      lat: next.lat,
      lng: next.lng,
      label: next.label,
      sublabel: next.sublabel,
      classification: next.classification,
      threat: next.threat,
      stale: next.stale,
      detailSummary: next.detail.summary,
      detailSource: next.detail.source,
      detailTimestamp: next.detail.timestamp,
      detailConfidence: next.detail.confidence,
      detailTags: next.detail.tags,
      updatedAt: new Date(next.updatedAt),
    })
    .where(eq(geoIntelPinsTable.id, id));

  geoPinStore.set(id, next);
  return next;
}

export async function deletePin(id: string): Promise<boolean> {
  await ensureHydrated();
  if (!geoPinStore.has(id)) return false;
  await db.delete(geoIntelPinsTable).where(eq(geoIntelPinsTable.id, id));
  geoPinStore.delete(id);
  return true;
}

// ─── Bootstrap: hydrate on module load ────────────────────────────────────────
//
// Mirrors the rf-intel-store pattern. The promise is awaited lazily on the
// first read; this fire-and-forget call just gets the work started early.

void hydrateFromDb();
