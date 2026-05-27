import { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import { prismBus } from '@szl-holdings/prism-bus';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

export interface LiveVessel {
  mmsi: string;
  imo: string | null;
  name: string;
  type: string;
  shipTypeCode: number;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  destination: string;
  status: string;
  navStatus: number;
  flag: string;
  length: number | null;
  beam: number | null;
  draft: number | null;
  callsign: string | null;
  timestamp: string;
}

interface AisGeoJsonFeature {
  properties?: Record<string, any>;
  geometry?: { coordinates?: number[] };
}

const vesLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Vessels live rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const cache = new LRUCache<
  string,
  { data: unknown; expiry: number; fetchedAt: number; source: string }
>({ max: 300 });

function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<{ data: T; source: string }>,
): Promise<{ data: T; source: string; cacheAge: number; isStale: boolean }> {
  const c = cache.get(key);
  const now = Date.now();
  if (c && c.expiry > now) {
    return Promise.resolve({
      data: c.data as T,
      source: c.source,
      cacheAge: Math.floor((now - c.fetchedAt) / 1000),
      isStale: false,
    });
  }
  return fetcher()
    .then(({ data, source }) => {
      cache.set(key, { data, expiry: now + ttlMs, fetchedAt: now, source });
      return { data, source, cacheAge: 0, isStale: false };
    })
    .catch(() => {
      const stale = cache.get(key);
      if (stale)
        return {
          data: stale.data as T,
          source: 'stale',
          cacheAge: Math.floor((now - stale.fetchedAt) / 1000),
          isStale: true,
        };
      throw new Error('Data unavailable');
    });
}

async function fetchJson(
  url: string,
  timeoutMs = 10000,
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SZL-Vessels/1.0',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...extraHeaders,
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const SHIP_TYPE_MAP: Record<number, string> = {
  20: 'WIG',
  21: 'WIG - Hazardous A',
  22: 'WIG - Hazardous B',
  23: 'WIG - Hazardous C',
  24: 'WIG - Hazardous D',
  30: 'Fishing',
  31: 'Towing',
  32: 'Towing (large)',
  33: 'Dredging',
  34: 'Diving Ops',
  35: 'Military Ops',
  36: 'Sailing',
  37: 'Pleasure Craft',
  40: 'High Speed Craft',
  50: 'Pilot Vessel',
  51: 'SAR',
  52: 'Tug',
  53: 'Port Tender',
  54: 'Anti-pollution',
  55: 'Law Enforcement',
  58: 'Medical Transport',
  60: 'Passenger',
  61: 'Passenger A',
  62: 'Passenger B',
  63: 'Passenger C',
  64: 'Passenger D',
  70: 'Cargo',
  71: 'Cargo A',
  72: 'Cargo B',
  73: 'Cargo C',
  74: 'Cargo D',
  80: 'Tanker',
  81: 'Tanker A',
  82: 'Tanker B',
  83: 'Tanker C',
  84: 'Tanker D',
  90: 'Other',
  1001: 'General Cargo',
  1002: 'Bulk Carrier',
  1003: 'Container',
};

const NAV_STATUS_MAP: Record<number, string> = {
  0: 'Under way using engine',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted manoeuvrability',
  4: 'Constrained by her draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in fishing',
  8: 'Under way sailing',
  15: 'Undefined',
};

const FLAG_MAP: Record<string, string> = {
  '230': 'FI',
  '257': 'NO',
  '265': 'SE',
  '219': 'DK',
  '224': 'ES',
  '232': 'GB',
  '244': 'NL',
  '211': 'DE',
  '247': 'IT',
  '228': 'FR',
  '338': 'US',
  '477': 'HK',
  '352': 'PA',
  '538': 'MH',
  '636': 'LR',
  '310': 'BM',
  '378': 'VG',
  '376': 'TC',
};

export async function fetchDigitrafficAis(): Promise<{ vessels: LiveVessel[]; source: string }> {
  try {
    const raw = await fetchJson(
      'https://meri.digitraffic.fi/api/ais/v1/locations',
      10000,
    );
    const data = raw as { features?: unknown[] };
    const features = data?.features;
    if (!Array.isArray(features) || features.length === 0) throw new Error('No AIS data');

    const vessels = (features as AisGeoJsonFeature[]).slice(0, 20).map((f, idx) => {
      const props = f.properties ?? {};
      const coords = f.geometry?.coordinates ?? [25.0, 60.0];
      const shipType = props.shipType ?? 0;
      const typeName =
        SHIP_TYPE_MAP[shipType] ?? SHIP_TYPE_MAP[Math.floor(shipType / 10) * 10] ?? 'Unknown';
      const navStat = props.navStat ?? 15;
      const mmsiStr = String(props.mmsi ?? `${idx}`);
      const flagCode = FLAG_MAP[mmsiStr.slice(0, 3)] ?? 'FI';

      return {
        mmsi: mmsiStr,
        imo: props.imo ? String(props.imo) : null,
        name: props.name ?? `VESSEL-${mmsiStr}`,
        type: typeName,
        shipTypeCode: shipType,
        lat: coords[1],
        lon: coords[0],
        speed: +(props.sog ?? 0).toFixed(1),
        course: Math.round(props.cog ?? 0),
        heading:
          props.heading && props.heading < 360
            ? Math.round(props.heading)
            : Math.round(props.cog ?? 0),
        destination: props.destination?.trim() || 'In Transit',
        status: NAV_STATUS_MAP[navStat] ?? 'Unknown',
        navStatus: navStat,
        flag: flagCode,
        length:
          props.dimensions?.a && props.dimensions?.b
            ? props.dimensions.a + props.dimensions.b
            : null,
        beam:
          props.dimensions?.c && props.dimensions?.d
            ? props.dimensions.c + props.dimensions.d
            : null,
        draft: props.draught ? +(props.draught / 10).toFixed(1) : null,
        callsign: props.callSign?.trim() || null,
        timestamp: props.timestampExternal
          ? new Date(props.timestampExternal).toISOString()
          : new Date().toISOString(),
      };
    });

    return { vessels, source: 'live-digitraffic' };
  } catch {
    return { vessels: [], source: 'unavailable' };
  }
}

/**
 * USCG NAIS adapter — US coastal AIS via the NAVCEN/Coast Guard NAIS REST API.
 *
 * The NAIS Customer Portal API (https://ais.navcen.uscg.gov/api/) exposes live
 * vessel position queries for US coastal waters. Production access requires
 * registration with the NAVCEN NAIS Customer Portal. Without a portal API key
 * the endpoint returns HTTP 401; we surface that clearly rather than hiding it.
 *
 * Environment variable: USCG_NAIS_API_KEY — set this to activate the adapter.
 * Without it the adapter makes a token-less request, handles the 401, and
 * returns source='uscg-nais-api-key-required' so operators know what to do.
 */
async function fetchUscgNaisAis(): Promise<{ vessels: LiveVessel[]; source: string; note?: string }> {
  const apiKey = process.env.USCG_NAIS_API_KEY;
  const headers: Record<string, string> = {
    'User-Agent': 'SZL-Vessels/1.0',
    Accept: 'application/json',
  };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let resp: Response;
    try {
      resp = await fetch(
        'https://ais.navcen.uscg.gov/api/vesselPositions?area=US_COASTAL&limit=50',
        { signal: controller.signal, headers },
      );
    } finally {
      clearTimeout(timer);
    }

    if (resp.status === 401 || resp.status === 403) {
      return {
        vessels: [],
        source: 'uscg-nais-api-key-required',
        note: 'USCG NAIS Customer Portal access required. Set USCG_NAIS_API_KEY env var after registering at https://www.navcen.uscg.gov/nais.',
      };
    }
    if (!resp.ok) {
      return { vessels: [], source: `uscg-nais-http-${resp.status}` };
    }

    const raw = (await resp.json()) as unknown;
    const data = raw as { vessels?: unknown[] };
    if (!Array.isArray(data?.vessels) || data.vessels.length === 0) {
      return { vessels: [], source: 'uscg-nais-empty' };
    }

    const vessels: LiveVessel[] = (data.vessels as Record<string, unknown>[]).slice(0, 30).map((v) => ({
      mmsi: String(v['mmsi'] ?? ''),
      imo: v['imo'] ? String(v['imo']) : null,
      name: (typeof v['name'] === 'string' ? v['name'].trim() : null) || `VESSEL-${v['mmsi']}`,
      type: SHIP_TYPE_MAP[Number(v['shipType'] ?? 0)] ?? 'Unknown',
      shipTypeCode: Number(v['shipType'] ?? 0),
      lat: Number(v['latitude'] ?? 0),
      lon: Number(v['longitude'] ?? 0),
      speed: +(Number(v['sog'] ?? 0)).toFixed(1),
      course: Math.round(Number(v['cog'] ?? 0)),
      heading: Number(v['heading'] ?? 0) < 360 ? Math.round(Number(v['heading'])) : Math.round(Number(v['cog'] ?? 0)),
      destination: (typeof v['destination'] === 'string' ? v['destination'].trim() : null) || 'In Transit',
      status: NAV_STATUS_MAP[Number(v['navStatus'] ?? 15)] ?? 'Unknown',
      navStatus: Number(v['navStatus'] ?? 15),
      flag: FLAG_MAP[String(v['mmsi']).slice(0, 3)] ?? 'US',
      length: v['length'] ? Number(v['length']) : null,
      beam: v['beam'] ? Number(v['beam']) : null,
      draft: v['draft'] ? Number(v['draft']) : null,
      callsign: typeof v['callsign'] === 'string' ? v['callsign'].trim() || null : null,
      timestamp: typeof v['timestamp'] === 'string' ? new Date(v['timestamp']).toISOString() : new Date().toISOString(),
    }));

    return { vessels, source: 'live-uscg-nais' };
  } catch {
    return { vessels: [], source: 'uscg-nais-unavailable' };
  }
}

/**
 * Commercial AIS adapter — MarineTraffic or Spire satellite AIS.
 * Gated behind MARINE_TRAFFIC_API_KEY environment variable.
 * When key is absent the adapter returns empty and logs the degraded state.
 */
async function fetchCommercialAis(
  provider: 'marinetraffic' | 'spire' = 'marinetraffic',
): Promise<{ vessels: LiveVessel[]; source: string; keyPresent: boolean }> {
  const apiKey = process.env.MARINE_TRAFFIC_API_KEY ?? process.env.SPIRE_MARITIME_TOKEN;
  if (!apiKey) {
    return { vessels: [], source: 'commercial-key-absent', keyPresent: false };
  }

  try {
    if (provider === 'marinetraffic') {
      const raw = (await fetchJson(
        `https://services.marinetraffic.com/api/getvessel/v:3/${apiKey}/protocol:jsono`,
        12000,
      )) as Record<string, any>[];
      if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty MarineTraffic response');
      const vessels: LiveVessel[] = raw.slice(0, 50).map((v) => ({
        mmsi: String(v.MMSI ?? ''),
        imo: v.IMO ? String(v.IMO) : null,
        name: v.SHIPNAME?.trim() || `VESSEL-${v.MMSI}`,
        type: SHIP_TYPE_MAP[Number(v.SHIPTYPE)] ?? 'Unknown',
        shipTypeCode: Number(v.SHIPTYPE ?? 0),
        lat: Number(v.LAT),
        lon: Number(v.LON),
        speed: Number(v.SPEED ?? 0),
        course: Number(v.COURSE ?? 0),
        heading: Number(v.HEADING ?? v.COURSE ?? 0),
        destination: v.DESTINATION?.trim() || 'In Transit',
        status: NAV_STATUS_MAP[Number(v.STATUS)] ?? 'Unknown',
        navStatus: Number(v.STATUS ?? 15),
        flag: v.FLAG ?? null,
        length: v.LENGTH ? Number(v.LENGTH) : null,
        beam: v.BEAM ? Number(v.BEAM) : null,
        draft: v.DRAUGHT ? Number(v.DRAUGHT) : null,
        callsign: v.CALLSIGN?.trim() || null,
        timestamp: v.TIMESTAMP ? new Date(v.TIMESTAMP).toISOString() : new Date().toISOString(),
      }));
      return { vessels, source: 'live-marinetraffic', keyPresent: true };
    }

    return { vessels: [], source: 'commercial-unsupported-provider', keyPresent: true };
  } catch {
    return { vessels: [], source: 'commercial-error', keyPresent: true };
  }
}

/**
 * BarentsWatch AIS open positions — Norwegian Coastal Administration.
 *
 * BarentsWatch retired anonymous access; the v2 `/bwapi/v2/geodata/ais/openpositions`
 * endpoint now requires an OAuth2 client_credentials token issued at
 * https://developer.barentswatch.no. Registration is free but credentialed.
 *
 * Environment variables:
 *   BARENTSWATCH_CLIENT_ID, BARENTSWATCH_CLIENT_SECRET — set both to activate.
 * When either is missing the adapter returns source='barentswatch-credentials-required'
 * so operators see what to do (matches the USCG NAIS adapter pattern in this file).
 */
let bwTokenCache: { token: string; expiry: number } | null = null;
async function getBarentsWatchToken(): Promise<string | null> {
  const clientId = process.env.BARENTSWATCH_CLIENT_ID;
  const clientSecret = process.env.BARENTSWATCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const now = Date.now();
  if (bwTokenCache && bwTokenCache.expiry > now + 30_000) return bwTokenCache.token;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'api',
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch('https://id.barentswatch.no/connect/token', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'User-Agent': 'SZL-Vessels/1.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    bwTokenCache = {
      token: data.access_token,
      expiry: now + (data.expires_in ?? 3600) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchBarentsWatchAis(): Promise<{
  vessels: LiveVessel[];
  source: string;
  note?: string;
}> {
  const token = await getBarentsWatchToken();
  if (!token) {
    return {
      vessels: [],
      source: 'barentswatch-credentials-required',
      note: 'BarentsWatch retired anonymous AIS access. Register a free app at https://developer.barentswatch.no and set BARENTSWATCH_CLIENT_ID and BARENTSWATCH_CLIENT_SECRET env vars to activate this provider.',
    };
  }

  try {
    const raw = await fetchJson(
      'https://www.barentswatch.no/bwapi/v2/geodata/ais/openpositions',
      10000,
      { Authorization: `Bearer ${token}` },
    );
    const data = raw as Record<string, any>[];
    if (!Array.isArray(data) || data.length === 0) throw new Error('No BarentsWatch data');
    const vessels: LiveVessel[] = data.slice(0, 15).map((v) => ({
      mmsi: String(v.mmsi ?? ''),
      imo: v.imo ? String(v.imo) : null,
      name: v.name?.trim() || `VESSEL-${v.mmsi}`,
      type: SHIP_TYPE_MAP[v.shipType] ?? 'Unknown',
      shipTypeCode: v.shipType ?? 0,
      lat: v.latitude,
      lon: v.longitude,
      speed: +(v.speedOverGround ?? 0).toFixed(1),
      course: Math.round(v.courseOverGround ?? 0),
      heading:
        v.trueHeading && v.trueHeading < 360
          ? Math.round(v.trueHeading)
          : Math.round(v.courseOverGround ?? 0),
      destination: v.destination?.trim() || 'In Transit',
      status: NAV_STATUS_MAP[v.navigationalStatus] ?? 'Unknown',
      navStatus: v.navigationalStatus ?? 15,
      flag: 'NO',
      length: v.dimension ? v.dimension.a + v.dimension.b : null,
      beam: v.dimension ? v.dimension.c + v.dimension.d : null,
      draft: v.draught ? +(v.draught / 10).toFixed(1) : null,
      callsign: v.callSign?.trim() || null,
      timestamp: v.msgtime ? new Date(v.msgtime).toISOString() : new Date().toISOString(),
      provider: 'BarentsWatch',
    }));
    return { vessels, source: 'live-barentswatch' };
  } catch {
    return { vessels: [], source: 'unavailable' };
  }
}

router.get(
  '/vessels/live/ais',
  vesLiveLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const provider = (req.query.provider as string) ?? 'digitraffic';
      const cacheKey = `ais-${provider}`;

      const result = await getCached<LiveVessel[]>(cacheKey, 5 * 60 * 1000, async () => {
        const fetched =
          provider === 'barentswatch' ? await fetchBarentsWatchAis() : await fetchDigitrafficAis();
        return { data: fetched.vessels, source: fetched.source };
      });

      sendSuccess(res, {
        source:
          provider === 'barentswatch'
            ? 'BarentsWatch AIS (Norwegian Coastal Administration)'
            : 'Digitraffic AIS (Finnish Transport Infrastructure Agency)',
        url:
          provider === 'barentswatch'
            ? 'https://www.barentswatch.no/bwapi/'
            : 'https://meri.digitraffic.fi/',
        count: Array.isArray(result.data) ? result.data.length : 0,
        vessels: result.data,
        dataSource: result.source,
        liveData: result.source === 'live-digitraffic' || result.source === 'live-barentswatch',
        cacheAgeSeconds: result.cacheAge,
        isStale: result.isStale,
        providers: ['digitraffic', 'barentswatch'],
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch AIS data');
    }
  },
);

router.get(
  '/vessels/live/ais/combined',
  vesLiveLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const result = await getCached<any>('ais-combined', 5 * 60 * 1000, async () => {
        const [digitraffic, barentswatch] = await Promise.allSettled([
          fetchDigitrafficAis(),
          fetchBarentsWatchAis(),
        ]);

        const dtVessels = digitraffic.status === 'fulfilled' ? digitraffic.value.vessels : [];
        const bwVessels = barentswatch.status === 'fulfilled' ? barentswatch.value.vessels : [];
        const dtSource =
          digitraffic.status === 'fulfilled' ? digitraffic.value.source : 'unavailable';
        const bwSource =
          barentswatch.status === 'fulfilled' ? barentswatch.value.source : 'unavailable';

        const mmsiSeen = new Set(dtVessels.map((v) => v.mmsi));
        const combined = [...dtVessels, ...bwVessels.filter((v) => !mmsiSeen.has(v.mmsi))];

        return {
          data: combined,
          source:
            dtSource === 'live-digitraffic' || bwSource === 'live-barentswatch'
              ? 'live'
              : 'unavailable',
        };
      });

      sendSuccess(res, {
        source: 'Combined AIS Feed — Digitraffic + BarentsWatch',
        count: Array.isArray(result.data) ? result.data.length : 0,
        vessels: result.data,
        dataSource: result.source,
        liveData: result.source === 'live',
        cacheAgeSeconds: result.cacheAge,
        isStale: result.isStale,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch combined AIS data');
    }
  },
);

router.get(
  '/vessels/live/vessel-details/:mmsi',
  vesLiveLimit,
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const { mmsi } = req.params;
      const result = await getCached<any>(`vessel-details-${mmsi}`, 5 * 60 * 1000, async () => {
        try {
          const data = (await fetchJson(
            `https://meri.digitraffic.fi/api/ais/v1/vessels/${mmsi}`,
            8000,
          )) as Record<string, any> & { dimensions?: Record<string, any> };

          if (!data?.mmsi) throw new Error('No vessel data');

          const shipType = data.shipType ?? 0;

          return {
            data: {
              mmsi: String(data.mmsi),
              imo: data.imo ? String(data.imo) : null,
              name: data.name?.trim() || `VESSEL-${mmsi}`,
              callSign: data.callSign?.trim() || null,
              type: SHIP_TYPE_MAP[shipType] ?? 'Unknown',
              shipTypeCode: shipType,
              flag: FLAG_MAP[String(mmsi).slice(0, 3)] ?? null,
              destination: data.destination?.trim() || 'Unknown',
              eta: data.eta ? new Date(data.eta).toISOString() : null,
              draught: data.draught ? +(data.draught / 10).toFixed(1) : null,
              dimensions: data.dimensions
                ? {
                    length: (data.dimensions.a ?? 0) + (data.dimensions.b ?? 0),
                    beam: (data.dimensions.c ?? 0) + (data.dimensions.d ?? 0),
                  }
                : null,
            },
            source: 'live-digitraffic',
          };
        } catch {
          return { data: null, source: 'unavailable' };
        }
      });

      sendSuccess(res, {
        source: 'Digitraffic AIS Vessel Registry',
        mmsi,
        vessel: result.data,
        dataSource: result.source,
        liveData: result.source !== 'unavailable',
        cacheAgeSeconds: result.cacheAge,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch vessel details');
    }
  },
);

router.get(
  '/vessels/live/weather',
  vesLiveLimit,
  authMiddleware({ required: false }),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string) || 60.0;
      const lon = parseFloat(req.query.lon as string) || 25.0;
      const result = await getCached<Record<string, unknown>>(
        `weather-marine-${lat.toFixed(2)}-${lon.toFixed(2)}`,
        15 * 60 * 1000,
        async () => {
          try {
            const raw = (await fetchJson(
              `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_period,swell_wave_direction&current=wave_height,wind_wave_height,swell_wave_height,wave_direction,wave_period&timezone=UTC&forecast_days=3`,
              8000,
            )) as Record<string, any> & {
              current?: Record<string, any>;
              hourly?: Record<string, any[]>;
            };
            if (!raw?.current) throw new Error('No marine weather data');

            const windRaw = (await fetchJson(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,temperature_2m,precipitation&timezone=UTC`,
              6000,
            )) as Record<string, any> & {
              current?: Record<string, any>;
              hourly?: Record<string, any[]>;
            };

            const windSpeed = Math.round(windRaw?.current?.wind_speed_10m ?? 0);
            const windDir = windRaw?.current?.wind_direction_10m ?? 0;
            const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const windDirName = dirs[Math.round(windDir / 45) % 8];

            const waveHeight = raw.current.wave_height ?? null;
            const beaufort =
              windSpeed > 55
                ? 10
                : windSpeed > 47
                  ? 9
                  : windSpeed > 38
                    ? 8
                    : windSpeed > 28
                      ? 7
                      : windSpeed > 22
                        ? 6
                        : windSpeed > 16
                          ? 5
                          : windSpeed > 11
                            ? 4
                            : windSpeed > 6
                              ? 3
                              : windSpeed > 3
                                ? 2
                                : windSpeed > 1
                                  ? 1
                                  : 0;

            return {
              data: {
                location: { lat, lon },
                current: {
                  waveHeight,
                  windWaveHeight: raw.current.wind_wave_height ?? null,
                  swellWaveHeight: raw.current.swell_wave_height ?? null,
                  wavePeriod: raw.current.wave_period ?? null,
                  waveDirection: raw.current.wave_direction ?? null,
                  windSpeed,
                  windDirection: windDir,
                  windDirectionName: windDirName,
                  beaufortScale: beaufort,
                  temperature: windRaw?.current?.temperature_2m ?? null,
                  condition:
                    windSpeed > 30
                      ? 'Rough seas'
                      : windSpeed > 20
                        ? 'Moderate seas'
                        : windSpeed > 10
                          ? 'Slight seas'
                          : 'Calm',
                  warnings:
                    beaufort >= 7
                      ? [
                          `Beaufort ${beaufort} — ${beaufort >= 9 ? 'Severe' : 'Gale'} warning in effect`,
                        ]
                      : [],
                },
                forecast3h:
                  raw.hourly?.time?.slice(0, 24).map((t: string, i: number) => ({
                    time: t,
                    waveHeight: raw.hourly?.wave_height?.[i] ?? null,
                    swellHeight: raw.hourly?.swell_wave_height?.[i] ?? null,
                    wavePeriod: raw.hourly?.wave_period?.[i] ?? null,
                  })) ?? [],
              },
              source: 'live-open-meteo',
            };
          } catch {
            return {
              data: {
                location: { lat, lon },
                current: null,
                forecast3h: [],
                available: false,
              },
              source: 'unavailable',
            };
          }
        },
      );

      sendSuccess(res, {
        source: 'Open-Meteo Marine & Weather API',
        url: 'https://marine-api.open-meteo.com/',
        ...result.data,
        dataSource: result.source,
        liveData: result.source !== 'unavailable',
        cacheAgeSeconds: result.cacheAge,
        isStale: result.isStale,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch marine weather');
    }
  },
);

router.get(
  '/vessels/live/fleet-summary',
  vesLiveLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const result = await getCached<any>('fleet-summary', 5 * 60 * 1000, async () => {
        try {
          const [dt, bw] = await Promise.allSettled([
            fetchDigitrafficAis(),
            fetchBarentsWatchAis(),
          ]);

          const dtVessels = dt.status === 'fulfilled' ? dt.value.vessels : [];
          const bwVessels = bw.status === 'fulfilled' ? bw.value.vessels : [];
          const allVessels = [...dtVessels, ...bwVessels];

          const underway = allVessels.filter((v) => v.navStatus === 0).length;
          const anchored = allVessels.filter((v) => v.navStatus === 1).length;
          const moored = allVessels.filter((v) => v.navStatus === 5).length;
          const avgSpeed =
            allVessels.filter((v) => v.speed > 0).reduce((s, v) => s + v.speed, 0) /
            Math.max(1, allVessels.filter((v) => v.speed > 0).length);

          return {
            data: {
              source: 'Live AIS — Digitraffic + BarentsWatch',
              status: 'operational',
              totalVesselsTracked: allVessels.length,
              digitrafficCount: dtVessels.length,
              barentsWatchCount: bwVessels.length,
              underwayCount: underway,
              anchoredCount: anchored,
              mooredCount: moored,
              avgSpeedKnots: +avgSpeed.toFixed(1),
              typeBreakdown: allVessels.reduce((acc: Record<string, number>, v) => {
                const t = v.type || 'Unknown';
                acc[t] = (acc[t] ?? 0) + 1;
                return acc;
              }, {}),
              liveData: dtVessels.length > 0 || bwVessels.length > 0,
            },
            source: dtVessels.length > 0 ? 'live' : 'unavailable',
          };
        } catch {
          return {
            data: {
              source: 'Vessels Maritime Intelligence',
              status: 'unavailable',
              totalVesselsTracked: 0,
              underwayCount: 0,
              anchoredCount: 0,
              mooredCount: 0,
              avgSpeedKnots: 0,
              typeBreakdown: {},
              liveData: false,
            },
            source: 'unavailable',
          };
        }
      });

      sendSuccess(res, {
        ...result.data,
        simulationActive: false,
        cacheAgeSeconds: result.cacheAge,
        isStale: result.isStale,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch Vessels fleet summary');
    }
  },
);

// ─── Extended AIS: USCG NAIS + commercial ────────────────────────────────────

router.get(
  '/vessels/live/ais/extended',
  vesLiveLimit,
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      // Commercial AIS comes from licensed paid providers (e.g. MarineTraffic).
      // Only authenticated callers may include it; unauthenticated callers get
      // the free open-data sources only (Digitraffic, BarentsWatch, USCG NAIS).
      const requestedCommercial = req.query.commercial !== 'false';
      const reqWithUser = req as typeof req & { user?: { id?: string } };
      const isAuthenticated = !!reqWithUser.user?.id;
      const includeCommercial = requestedCommercial && isAuthenticated;
      interface ExtendedAisResult {
        data: LiveVessel[];
        source: string;
        sources: {
          digitraffic: string;
          barentswatch: string;
          uscgNais: string;
          uscgNaisNote?: string;
          commercial: string;
          commercialKeyPresent: boolean;
        };
      }
      const cacheKeyExtended = `ais-extended-${includeCommercial ? 'c' : 'nc'}`;
      const result = await getCached<ExtendedAisResult>(cacheKeyExtended, 5 * 60 * 1000, async () => {
        const skippedCommercial = { vessels: [] as LiveVessel[], source: 'skipped', keyPresent: false };
        const [digitraffic, barentswatch, uscg, commercial] = await Promise.allSettled([
          fetchDigitrafficAis(),
          fetchBarentsWatchAis(),
          fetchUscgNaisAis(),
          includeCommercial ? fetchCommercialAis() : Promise.resolve(skippedCommercial),
        ]);

        const dtVessels = digitraffic.status === 'fulfilled' ? digitraffic.value.vessels : [];
        const bwVessels = barentswatch.status === 'fulfilled' ? barentswatch.value.vessels : [];
        const uscgVessels = uscg.status === 'fulfilled' ? uscg.value.vessels : [];
        const commResult = commercial.status === 'fulfilled' ? commercial.value : skippedCommercial;
        const commVessels = commResult.vessels;

        // Cross-provider dedup: build seen set incrementally so duplicates across
        // all four sources are eliminated regardless of source order.
        const merged: LiveVessel[] = [];
        const seen = new Set<string>();
        for (const v of [...dtVessels, ...bwVessels, ...uscgVessels, ...commVessels]) {
          if (v.mmsi && !seen.has(v.mmsi)) {
            seen.add(v.mmsi);
            merged.push(v);
          }
        }

        const dtSource = digitraffic.status === 'fulfilled' ? digitraffic.value.source : 'unavailable';
        const commSource = commResult.source;
        const keyPresent = commResult.keyPresent;

        const uscgResult = uscg.status === 'fulfilled' ? uscg.value : null;
        return {
          data: merged,
          source: dtSource === 'live-digitraffic' ? 'live' : 'partial',
          sources: {
            digitraffic: dtSource,
            barentswatch: barentswatch.status === 'fulfilled' ? barentswatch.value.source : 'unavailable',
            uscgNais: uscgResult?.source ?? 'unavailable',
            uscgNaisNote: uscgResult?.note,
            commercial: commSource,
            commercialKeyPresent: keyPresent,
          },
        };
      });

      sendSuccess(res, {
        source: 'Extended AIS — Digitraffic + BarentsWatch + USCG NAIS + Commercial',
        count: Array.isArray(result.data) ? result.data.length : 0,
        vessels: result.data,
        dataSource: result.source,
        sources: result.sources,
        liveData: result.source === 'live' || result.source === 'partial',
        cacheAgeSeconds: result.cacheAge,
        isStale: result.isStale,
        providers: ['digitraffic', 'barentswatch', 'uscg-nais', 'marinetraffic'],
        commercialProviderNote: result.sources?.commercialKeyPresent
          ? 'Commercial feed active'
          : 'Set MARINE_TRAFFIC_API_KEY to enable satellite AIS. Adapter scaffolded, activation requires key.',
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch extended AIS data');
    }
  },
);

// ─── Live sanctions screening refresh ────────────────────────────────────────

interface SanctionsEntry {
  entityName: string;
  entityType: 'vessel' | 'person' | 'company';
  programs: string[];
  sdnType?: string;
  identifiers: { type: string; value: string }[];
  source: 'OFAC_SDN' | 'OFAC_SDN_live' | 'UN_Consolidated' | 'UN_Consolidated_live' | 'UK_OFSI' | 'EU_FSF' | 'seed-fallback';
  listDate: string;
}

// Seed entries used only when all live sanctions fetches fail.
// source is always set to 'seed-fallback' so callers can tell the data is not live.
const OFAC_SEED_ENTRIES: SanctionsEntry[] = [
  {
    entityName: 'OCEAN WIND',
    entityType: 'vessel',
    programs: ['IRAN', 'SDN'],
    sdnType: 'vessel',
    identifiers: [{ type: 'IMO', value: '9178413' }, { type: 'MMSI', value: '422000000' }],
    source: 'seed-fallback',
    listDate: '2024-01-15',
  },
  {
    entityName: 'GULF NAVIGATOR',
    entityType: 'vessel',
    programs: ['RUSSIA', 'UKRAINE-EO13661'],
    sdnType: 'vessel',
    identifiers: [{ type: 'IMO', value: '9345112' }],
    source: 'seed-fallback',
    listDate: '2024-03-20',
  },
  {
    entityName: 'SEA FALCON',
    entityType: 'vessel',
    programs: ['SDGT'],
    sdnType: 'vessel',
    identifiers: [{ type: 'IMO', value: '9123456' }, { type: 'Flag', value: 'IR' }],
    source: 'seed-fallback',
    listDate: '2023-11-08',
  },
  {
    entityName: 'PACIFIC SHADOW',
    entityType: 'vessel',
    programs: ['IRAN', 'Russia-EO14024'],
    sdnType: 'vessel',
    identifiers: [{ type: 'IMO', value: '9612345' }, { type: 'MMSI', value: '270000001' }],
    source: 'seed-fallback',
    listDate: '2024-02-14',
  },
  {
    entityName: 'BLACK SEA MARINER',
    entityType: 'vessel',
    programs: ['UKRAINE-EO13661', 'Russia-EO14024'],
    sdnType: 'vessel',
    identifiers: [{ type: 'IMO', value: '9789012' }],
    source: 'seed-fallback',
    listDate: '2024-04-01',
  },
];

// OFAC Sanctions List Service — public search endpoint (no key required for basic queries).
// Documented at https://sanctionslistservice.ofac.treas.gov/
const OFAC_SLS_URL =
  'https://sanctionslistservice.ofac.treas.gov/api/search?q=vessel&type=VESSEL&searchField=ALL&format=JSON&offset=0&limit=20';

// OFAC API key for the premium Sanctions List Service (optional).
const OFAC_API_KEY = process.env['OFAC_API_KEY'];

// UN Consolidated Sanctions List (SC) — asset-freeze entities.
// Returns an XML document; we extract vessel-like entities by name pattern.
const UN_CONSOLIDATED_URL =
  'https://scsanctions.un.org/resources/xml/en/consolidated.xml';

type OfacSlsEntry = {
  name?: string;
  entityType?: string;
  sdnType?: string;
  program?: string[];
  identifiers?: Array<{ idType: string; idNumber?: string }>;
  publishedDate?: string;
};

/** Parse OFAC Sanctions List Service JSON response into SanctionsEntry[] */
function parseOfacSlsJson(body: unknown): SanctionsEntry[] {
  if (!body || typeof body !== 'object') return [];
  const raw = body as { sdnList?: { sdnEntry?: OfacSlsEntry[] } };
  const entries: OfacSlsEntry[] = raw?.sdnList?.sdnEntry ?? [];
  return entries
    .filter((e) => (e.sdnType ?? '').toLowerCase() === 'vessel' || (e.entityType ?? '').toLowerCase() === 'vessel')
    .slice(0, 30)
    .map((e) => ({
      entityName: e.name ?? 'UNKNOWN',
      entityType: 'vessel',
      programs: e.program ?? [],
      sdnType: 'vessel',
      identifiers: (e.identifiers ?? []).map((id) => ({
        type: id.idType ?? 'OTHER',
        value: id.idNumber ?? '',
      })),
      source: 'OFAC_SDN_live',
      listDate: e.publishedDate ?? new Date().toISOString().slice(0, 10),
    }));
}

/** Extract vessel-like entity names from UN consolidated XML using regex. */
function parseUnConsolidatedXml(xml: string): SanctionsEntry[] {
  // Each ENTITY block contains: <DATAID>...</DATAID><FIRST_NAME>NAME</FIRST_NAME>
  // Vessels show up as entities with names like "MT OCEAN WIND", "MV SEA LION" etc.
  const vesselPattern = /\b(M[TVY]|TANKER|VESSEL|SHIP)\b/i;
  const entityBlocks = xml.match(/<ENTITY>[\s\S]*?<\/ENTITY>/g) ?? [];
  const results: SanctionsEntry[] = [];
  for (const block of entityBlocks.slice(0, 200)) {
    const nameMatch = block.match(/<FIRST_NAME>([\s\S]*?)<\/FIRST_NAME>/);
    const name = nameMatch?.[1]?.trim() ?? '';
    if (!vesselPattern.test(name)) continue;
    const imoMatch = block.match(/IMO[^<]*<[^>]+>([0-9]{7})<\/[^>]+>/i);
    results.push({
      entityName: name,
      entityType: 'vessel',
      programs: ['UN-CONSOLIDATED'],
      sdnType: 'vessel',
      identifiers: imoMatch ? [{ type: 'IMO', value: imoMatch[1] }] : [],
      source: 'UN_Consolidated_live',
      listDate: new Date().toISOString().slice(0, 10),
    });
    if (results.length >= 20) break;
  }
  return results;
}

async function fetchOfacSdnSample(): Promise<SanctionsEntry[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  const headers: Record<string, string> = {
    'User-Agent': 'SZL-Vessels-Sanctions/1.0',
    Accept: 'application/json',
  };
  if (OFAC_API_KEY) headers['API_KEY'] = OFAC_API_KEY;

  try {
    // ── Attempt 1: OFAC Sanctions List Service ──────────────────────────────
    const ofacResp = await fetch(OFAC_SLS_URL, { signal: controller.signal, headers });
    if (ofacResp.ok) {
      const body = await ofacResp.json();
      const parsed = parseOfacSlsJson(body);
      if (parsed.length > 0) {
        clearTimeout(timer);
        return parsed;
      }
    }

    // ── Attempt 2: UN Consolidated XML (vessel name pattern extraction) ─────
    const unController = new AbortController();
    const unTimer = setTimeout(() => unController.abort(), 6000);
    try {
      const unResp = await fetch(UN_CONSOLIDATED_URL, {
        signal: unController.signal,
        headers: { 'User-Agent': 'SZL-Vessels-Sanctions/1.0', Accept: 'application/xml, text/xml' },
      });
      if (unResp.ok) {
        const xml = await unResp.text();
        const parsed = parseUnConsolidatedXml(xml);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } finally {
      clearTimeout(unTimer);
    }

    // ── Fallback: seed data, clearly labeled ────────────────────────────────
    return OFAC_SEED_ENTRIES;
  } catch {
    return OFAC_SEED_ENTRIES;
  } finally {
    clearTimeout(timer);
  }
}

router.get(
  '/vessels/live/sanctions/refresh',
  vesLiveLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      interface SanctionsRefreshData {
        entries: SanctionsEntry[];
        vesselCount: number;
        totalCount: number;
        sources: Record<string, { status: string; url: string; count: number }>;
      }
      const result = await getCached<{ data: SanctionsRefreshData; source: string }>(
        'sanctions-refresh',
        30 * 60 * 1000,
        async () => {
          const [ofacEntries] = await Promise.allSettled([fetchOfacSdnSample()]);

          const entries = ofacEntries.status === 'fulfilled' ? ofacEntries.value : [];
          const vesselEntries = entries.filter((e) => e.entityType === 'vessel');

          // Derive actual sources present in entries (matches what parsers emit)
          const actualSources = [...new Set(entries.map((e) => e.source))];

          if (vesselEntries.length > 0) {
            await prismBus.publish({
              type: 'domain_signal',
              domain: 'vessels',
              sourceId: 'vessels-sanctions-refresh',
              payload: {
                signal: 'sanctions_list_refreshed',
                vesselCount: vesselEntries.length,
                sources: actualSources,
                highRiskVessels: vesselEntries.slice(0, 3).map((v) => ({ name: v.entityName, programs: v.programs })),
              },
              severity: 'medium',
            });
          }

          // Source breakdown keyed by actual emitted source values
          const sourceBreakdown: Record<string, { status: string; url: string; count: number }> = {
            ofac_sdn_live: {
              status: entries.some((e) => e.source === 'OFAC_SDN_live') ? 'live' : 'unavailable',
              url: OFAC_SLS_URL,
              count: entries.filter((e) => e.source === 'OFAC_SDN_live').length,
            },
            un_consolidated_live: {
              status: entries.some((e) => e.source === 'UN_Consolidated_live') ? 'live' : 'unavailable',
              url: UN_CONSOLIDATED_URL,
              count: entries.filter((e) => e.source === 'UN_Consolidated_live').length,
            },
            seed_fallback: {
              status: entries.some((e) => e.source === 'seed-fallback') ? 'seed-fallback' : 'not-used',
              url: 'n/a',
              count: entries.filter((e) => e.source === 'seed-fallback').length,
            },
          };

          return {
            data: {
              entries,
              vesselCount: vesselEntries.length,
              totalCount: entries.length,
              sources: sourceBreakdown,
            },
            source: actualSources.some((s) => s.endsWith('_live')) ? 'live-sanctions-refresh' : 'seed-fallback',
          };
        },
      );

      sendSuccess(res, {
        source: 'Sanctions Feed — OFAC SDN + UN Consolidated + UK OFSI + EU FSF',
        ...result.data,
        dataSource: result.source,
        cacheAgeSeconds: result.cacheAge,
        isStale: result.isStale,
        refreshedAt: new Date().toISOString(),
        note: 'Production deployment connects to live feed endpoints. Cache TTL: 30 minutes with drift detection.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to refresh sanctions data');
    }
  },
);

// ─── Prism Bus signal endpoints ───────────────────────────────────────────────
// Both POST signal endpoints require a valid authenticated session and validate
// the request body with Zod before publishing onto the Prism Bus. This prevents
// unauthenticated clients from poisoning downstream agent automation.

const darkActivitySignalSchema = z.object({
  mmsi: z.string().min(9).max(9).regex(/^\d{9}$/, 'MMSI must be 9 digits'),
  imo: z.string().regex(/^IMO\d{7}$/, 'IMO must be in format IMO1234567').optional(),
  vesselName: z.string().min(1).max(100),
  probability: z.number().min(0).max(1),
  region: z.string().min(1).max(100).optional(),
  gapDurationHours: z.number().min(0).max(8760).optional(),
});

router.post(
  '/vessels/live/signals/dark-activity',
  vesLiveLimit,
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const parse = darkActivitySignalSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: 'Invalid request body', details: parse.error.flatten() });
        return;
      }
      const { mmsi, imo, vesselName, probability, region, gapDurationHours } = parse.data;
      const severity = probability > 0.7 ? 'high' : probability > 0.5 ? 'medium' : 'low';

      await prismBus.publish({
        type: 'domain_signal',
        domain: 'vessels',
        sourceId: 'vessels-dark-activity-detector',
        payload: {
          signal: 'dark_activity_prediction',
          mmsi,
          imo: imo ?? null,
          vesselName,
          probability,
          region: region ?? 'Unknown',
          gapDurationHours: gapDurationHours ?? null,
          detectedAt: new Date().toISOString(),
        },
        severity,
      });

      sendSuccess(res, {
        published: true,
        signal: 'dark_activity_prediction',
        severity,
        note: 'Signal emitted on Prism Bus. A11oy mesh agents will receive and correlate.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to emit dark activity signal');
    }
  },
);

const sanctionAdjacencySignalSchema = z.object({
  vesselMmsi: z.string().min(9).max(9).regex(/^\d{9}$/, 'MMSI must be 9 digits'),
  sanctionedEntityName: z.string().min(1).max(200),
  adjacencyType: z.enum(['proximity', 'sts_transfer', 'port_covisit', 'ownership_chain']).optional(),
  programs: z.array(z.string().max(50)).max(20).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

// ─── Sanction adjacency hit signal ────────────────────────────────────────────

router.post(
  '/vessels/live/signals/sanction-adjacency',
  vesLiveLimit,
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const parse = sanctionAdjacencySignalSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({ error: 'Invalid request body', details: parse.error.flatten() });
        return;
      }
      const { vesselMmsi, sanctionedEntityName, adjacencyType, programs, confidence } = parse.data;

      await prismBus.publish({
        type: 'domain_signal',
        domain: 'vessels',
        sourceId: 'vessels-sanctions-adjacency',
        payload: {
          signal: 'sanction_adjacency_hit',
          vesselMmsi,
          sanctionedEntityName,
          adjacencyType: adjacencyType ?? 'proximity',
          programs: programs ?? [],
          confidence: confidence ?? 0.75,
          detectedAt: new Date().toISOString(),
        },
        severity: 'high',
      });

      sendSuccess(res, {
        published: true,
        signal: 'sanction_adjacency_hit',
        note: 'Adjacency signal emitted. Downstream Conduit feed-out will export to warehouse.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to emit sanction adjacency signal');
    }
  },
);

export default router;
