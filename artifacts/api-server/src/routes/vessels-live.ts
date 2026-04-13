import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services } from "@szl-holdings/services";

const router: IRouter = Router();

const vesLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Vessels live rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

interface CacheEntry { data: unknown; expiry: number; fetchedAt: number; source: string }
const cache = new Map<string, CacheEntry>();

interface DigitrafficAisProperties {
  mmsi?: number;
  imo?: number;
  name?: string;
  shipType?: number;
  navStat?: number;
  sog?: number;
  cog?: number;
  heading?: number;
  destination?: string;
  draught?: number;
  dimensions?: { a?: number; b?: number; c?: number; d?: number };
  callSign?: string;
  timestampExternal?: number;
}

interface DigitrafficAisFeature {
  properties?: DigitrafficAisProperties;
  geometry?: { coordinates?: number[] };
}

interface DigitrafficAisResponse {
  features?: DigitrafficAisFeature[];
}

interface BarentsWatchVessel {
  mmsi?: number;
  imo?: number;
  name?: string;
  shipType?: number;
  latitude?: number;
  longitude?: number;
  speedOverGround?: number;
  courseOverGround?: number;
  trueHeading?: number;
  destination?: string;
  navigationalStatus?: number;
  draught?: number;
  dimension?: { a?: number; b?: number; c?: number; d?: number };
  callSign?: string;
  msgtime?: string;
}

interface OpenMeteoMarineResponse {
  current?: {
    wave_height?: number;
    wind_wave_height?: number;
    swell_wave_height?: number;
    wave_period?: number;
    wave_direction?: number;
  };
  hourly?: {
    time?: string[];
    wave_height?: number[];
    swell_wave_height?: number[];
    wave_period?: number[];
  };
}

interface OpenMeteoWindResponse {
  current?: {
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    temperature_2m?: number;
    precipitation?: number;
  };
}

interface DigitrafficVesselDetail {
  mmsi?: number;
  imo?: number;
  name?: string;
  callSign?: string;
  shipType?: number;
  destination?: string;
  eta?: string;
  draught?: number;
  dimensions?: { a?: number; b?: number; c?: number; d?: number };
}

interface AISStreamService {
  isLive: boolean;
  getVessels: (limit: number) => Array<{
    mmsi: string;
    lat: number;
    lon: number;
    speed: number;
    course: number;
    name?: string;
    shipType?: number;
    shipTypeName?: string;
    heading?: number;
    navStatus?: number;
    navStatusName?: string;
    destination?: string;
    timestamp?: string;
  }>;
}

interface NOAAAlertService {
  getActiveAlerts: (opts: { domain: string; limit: number }) => Promise<Array<{
    event: string;
    severity: string;
    areaDesc: string;
  }>>;
}

interface ExtendedServices {
  aisstream?: AISStreamService;
  noaaAlerts?: NOAAAlertService;
  [key: string]: unknown;
}

function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<{ data: T; source: string }>): Promise<{ data: T; source: string; cacheAge: number; isStale: boolean }> {
  const c = cache.get(key);
  const now = Date.now();
  if (c && c.expiry > now) {
    return Promise.resolve({ data: c.data as T, source: c.source, cacheAge: Math.floor((now - c.fetchedAt) / 1000), isStale: false });
  }
  return fetcher().then(({ data, source }) => {
    cache.set(key, { data, expiry: now + ttlMs, fetchedAt: now, source });
    return { data, source, cacheAge: 0, isStale: false };
  }).catch(() => {
    const stale = cache.get(key);
    if (stale) return { data: stale.data as T, source: "stale", cacheAge: Math.floor((now - stale.fetchedAt) / 1000), isStale: true };
    throw new Error("Data unavailable");
  });
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Vessels/1.0", Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const SHIP_TYPE_MAP: Record<number, string> = {
  20: "WIG", 21: "WIG - Hazardous A", 22: "WIG - Hazardous B", 23: "WIG - Hazardous C", 24: "WIG - Hazardous D",
  30: "Fishing", 31: "Towing", 32: "Towing (large)", 33: "Dredging", 34: "Diving Ops", 35: "Military Ops",
  36: "Sailing", 37: "Pleasure Craft", 40: "High Speed Craft", 50: "Pilot Vessel", 51: "SAR",
  52: "Tug", 53: "Port Tender", 54: "Anti-pollution", 55: "Law Enforcement", 58: "Medical Transport",
  60: "Passenger", 61: "Passenger A", 62: "Passenger B", 63: "Passenger C", 64: "Passenger D",
  70: "Cargo", 71: "Cargo A", 72: "Cargo B", 73: "Cargo C", 74: "Cargo D",
  80: "Tanker", 81: "Tanker A", 82: "Tanker B", 83: "Tanker C", 84: "Tanker D",
  90: "Other", 1001: "General Cargo", 1002: "Bulk Carrier", 1003: "Container",
};

const NAV_STATUS_MAP: Record<number, string> = {
  0: "Under way using engine", 1: "At anchor", 2: "Not under command", 3: "Restricted manoeuvrability",
  4: "Constrained by her draught", 5: "Moored", 6: "Aground", 7: "Engaged in fishing",
  8: "Under way sailing", 15: "Undefined",
};

const FLAG_MAP: Record<string, string> = {
  "230": "FI", "257": "NO", "265": "SE", "219": "DK", "224": "ES", "232": "GB",
  "244": "NL", "211": "DE", "247": "IT", "228": "FR", "338": "US", "477": "HK",
  "352": "PA", "538": "MH", "636": "LR", "310": "BM", "378": "VG", "376": "TC",
};

const FALLBACK_AIS_VESSELS = [
  { mmsi: "211234567", imo: "9876123", name: "ATLANTIC VOYAGER", type: "Cargo", shipTypCode: 70, lat: 51.52, lon: 1.35, speed: 12.4, course: 225, heading: 223, destination: "ROTTERDAM", status: "Under way using engine", navStatus: 0, flag: "DE", length: 225, beam: 32, draft: 11.2, timestamp: new Date(Date.now() - 120000).toISOString(), callsign: "DCAB3" },
  { mmsi: "636092587", imo: "9654321", name: "PACIFIC GUARDIAN", type: "Tanker", shipTypeCode: 80, lat: 1.26, lon: 103.85, speed: 8.2, course: 315, heading: 312, destination: "SINGAPORE", status: "Under way using engine", navStatus: 0, flag: "LR", length: 330, beam: 58, draft: 14.5, timestamp: new Date(Date.now() - 180000).toISOString(), callsign: "A8KL9" },
  { mmsi: "477234100", imo: "9234100", name: "STAR PHOENIX", type: "Container", shipTypeCode: 70, lat: 29.97, lon: 32.56, speed: 14.1, course: 340, heading: 338, destination: "PIRAEUS", status: "Under way using engine", navStatus: 0, flag: "HK", length: 366, beam: 51, draft: 13.8, timestamp: new Date(Date.now() - 90000).toISOString(), callsign: "VRBD7" },
  { mmsi: "538006712", imo: "9006712", name: "OCEAN MERIDIAN", type: "Bulk Carrier", shipTypeCode: 70, lat: 26.07, lon: 56.27, speed: 10.8, course: 90, heading: 88, destination: "MUMBAI", status: "Under way using engine", navStatus: 0, flag: "MH", length: 292, beam: 45, draft: 12.1, timestamp: new Date(Date.now() - 150000).toISOString(), callsign: "V7ML4" },
  { mmsi: "352456789", imo: "9456789", name: "LIBERTY WAVE", type: "Container", shipTypeCode: 70, lat: 9.0, lon: 79.55, speed: 16.2, course: 70, heading: 68, destination: "COLOMBO", status: "Under way using engine", navStatus: 0, flag: "PA", length: 400, beam: 59, draft: 15.2, timestamp: new Date(Date.now() - 60000).toISOString(), callsign: "3EJK2" },
  { mmsi: "244123456", imo: "9123456", name: "NORTH SEA PIONEER", type: "Tanker", shipTypeCode: 80, lat: 57.7, lon: 1.8, speed: 6.5, course: 180, heading: 178, destination: "ABERDEEN", status: "Under way using engine", navStatus: 0, flag: "NL", length: 274, beam: 46, draft: 12.8, timestamp: new Date(Date.now() - 200000).toISOString(), callsign: "PBHE3" },
];

export async function fetchDigitrafficAis(): Promise<{ vessels: typeof FALLBACK_AIS_VESSELS; source: string }> {
  try {
    const data = await fetchJson("https://meri.digitraffic.fi/api/ais/v1/locations/latest?from=0&to=100", 10000) as DigitrafficAisResponse;
    const features = data?.features;
    if (!Array.isArray(features) || features.length === 0) throw new Error("No AIS data");

    const vessels = features.slice(0, 20).map((f: DigitrafficAisFeature, idx: number) => {
      const props = f.properties ?? {};
      const coords = f.geometry?.coordinates ?? [25.0, 60.0];
      const shipType = props.shipType ?? 0;
      const typeName = SHIP_TYPE_MAP[shipType] ?? SHIP_TYPE_MAP[Math.floor(shipType / 10) * 10] ?? "Unknown";
      const navStat = props.navStat ?? 15;
      const mmsiStr = String(props.mmsi ?? `${idx}`);
      const flagCode = FLAG_MAP[mmsiStr.slice(0, 3)] ?? "FI";

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
        heading: props.heading && props.heading < 360 ? Math.round(props.heading) : Math.round(props.cog ?? 0),
        destination: props.destination?.trim() || "In Transit",
        status: NAV_STATUS_MAP[navStat] ?? "Unknown",
        navStatus: navStat,
        flag: flagCode,
        length: props.dimensions?.a && props.dimensions?.b ? props.dimensions.a + props.dimensions.b : null,
        beam: props.dimensions?.c && props.dimensions?.d ? props.dimensions.c + props.dimensions.d : null,
        draft: props.draught ? +(props.draught / 10).toFixed(1) : null,
        callsign: props.callSign?.trim() || null,
        timestamp: props.timestampExternal ? new Date(props.timestampExternal).toISOString() : new Date().toISOString(),
      };
    });

    return { vessels: vessels as typeof FALLBACK_AIS_VESSELS, source: "live-digitraffic" };
  } catch {
    return { vessels: FALLBACK_AIS_VESSELS, source: "demo" };
  }
}

export async function fetchBarentsWatchAis(): Promise<{ vessels: any[]; source: string }> {
  try {
    const data = await fetchJson(
      "https://www.barentswatch.no/bwapi/v2/latest/combined?Xabcd=positions&area=NOR",
      10000,
    ) as BarentsWatchVessel[];
    if (!Array.isArray(data) || data.length === 0) throw new Error("No BarentsWatch data");
    const vessels = data.slice(0, 15).map((v: BarentsWatchVessel) => ({
      mmsi: String(v.mmsi ?? ""),
      imo: v.imo ? String(v.imo) : null,
      name: v.name?.trim() || `VESSEL-${v.mmsi}`,
      type: SHIP_TYPE_MAP[v.shipType ?? 0] ?? "Unknown",
      shipTypeCode: v.shipType ?? 0,
      lat: v.latitude,
      lon: v.longitude,
      speed: +(v.speedOverGround ?? 0).toFixed(1),
      course: Math.round(v.courseOverGround ?? 0),
      heading: v.trueHeading && v.trueHeading < 360 ? Math.round(v.trueHeading) : Math.round(v.courseOverGround ?? 0),
      destination: v.destination?.trim() || "In Transit",
      status: NAV_STATUS_MAP[v.navigationalStatus ?? 15] ?? "Unknown",
      navStatus: v.navigationalStatus ?? 15,
      flag: "NO",
      length: v.dimension ? (v.dimension.a ?? 0) + (v.dimension.b ?? 0) : null,
      beam: v.dimension ? (v.dimension.c ?? 0) + (v.dimension.d ?? 0) : null,
      draft: v.draught ? +(v.draught / 10).toFixed(1) : null,
      callsign: v.callSign?.trim() || null,
      timestamp: v.msgtime ? new Date(v.msgtime).toISOString() : new Date().toISOString(),
      provider: "BarentsWatch",
    }));
    return { vessels, source: "live-barentswatch" };
  } catch {
    return { vessels: [], source: "demo" };
  }
}

type VesselRecord = Record<string, unknown>;

interface CombinedAisPayload {
  vessels: VesselRecord[];
  sources: { digitraffic: string; barentswatch: string; aisstream: string };
  noaaMarineAlerts: { count: number; alerts: { event: string; severity: string; areas: string }[]; source: string };
}

router.get("/vessels/live/ais", vesLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const provider = (req.query.provider as string) ?? "digitraffic";
    const cacheKey = `ais-${provider}`;

    const result = await getCached<VesselRecord[]>(cacheKey, 5 * 60 * 1000, async () => {
      const fetched = provider === "barentswatch" ? await fetchBarentsWatchAis() : await fetchDigitrafficAis();
      return { data: fetched.vessels as VesselRecord[], source: fetched.source };
    });

    sendSuccess(res, {
      source: provider === "barentswatch" ? "BarentsWatch AIS (Norwegian Coastal Administration)" : "Digitraffic AIS (Finnish Transport Infrastructure Agency)",
      url: provider === "barentswatch" ? "https://www.barentswatch.no/bwapi/" : "https://meri.digitraffic.fi/",
      count: result.data.length,
      vessels: result.data,
      dataSource: result.source,
      liveData: !result.source.includes("demo"),
      cacheAgeSeconds: result.cacheAge,
      isStale: result.isStale,
      providers: ["digitraffic", "barentswatch"],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch AIS data"); }
});

router.get("/vessels/live/ais/combined", vesLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const extServices = services as unknown as ExtendedServices;
    const result = await getCached<CombinedAisPayload>("ais-combined", 5 * 60 * 1000, async () => {
      const aisStreamAdapter = extServices.aisstream;

      const [digitraffic, barentswatch] = await Promise.allSettled([
        fetchDigitrafficAis(),
        fetchBarentsWatchAis(),
      ]);

      const dtVessels = digitraffic.status === "fulfilled" ? digitraffic.value.vessels : FALLBACK_AIS_VESSELS;
      const bwVessels = barentswatch.status === "fulfilled" ? barentswatch.value.vessels : [];
      const dtSource = digitraffic.status === "fulfilled" ? digitraffic.value.source : "demo";
      const bwSource = barentswatch.status === "fulfilled" ? barentswatch.value.source : "demo";

      const mmsiSeen = new Set(dtVessels.map(v => v.mmsi));
      const uniqueBwVessels = bwVessels.filter(v => !mmsiSeen.has(String(v.mmsi ?? "")));
      uniqueBwVessels.forEach(v => mmsiSeen.add(String(v.mmsi ?? "")));
      const combined = [...dtVessels, ...uniqueBwVessels] as VesselRecord[];

      let aisStreamVessels: VesselRecord[] = [];
      let aisStreamSource = "not-configured";
      if (aisStreamAdapter?.isLive) {
        aisStreamVessels = aisStreamAdapter.getVessels(500)
          .filter((v: any) => !mmsiSeen.has(v.mmsi))
          .map((v: any) => ({
            mmsi: v.mmsi,
            lat: v.lat,
            lon: v.lon,
            sog: v.speed,
            cog: v.course,
            name: v.name || `MMSI ${v.mmsi}`,
            shipType: v.shipType,
            shipTypeName: v.shipTypeName,
            heading: v.heading,
            navStatus: v.navStatus,
            navStatusName: v.navStatusName,
            destination: v.destination,
            timestamp: v.timestamp,
            source: "aisstream-ws" as const,
          }));
        aisStreamSource = aisStreamVessels.length > 0 ? "live-aisstream-ws" : "aisstream-connected-no-data";
      }

      const allVessels = [...combined, ...aisStreamVessels];
      const isLive = dtSource !== "demo" || bwSource !== "demo" || aisStreamVessels.length > 0;

      let noaaMarineAlerts: { count: number; alerts: { event: string; severity: string; areas: string }[]; source: string } = { count: 0, alerts: [], source: "not-fetched" };
      try {
        const alerts = await extServices.noaaAlerts?.getActiveAlerts({ domain: "marine", limit: 10 }) ?? [];
        noaaMarineAlerts = {
          count: alerts.length,
          alerts: alerts.slice(0, 5).map((a: any) => ({ event: a.event, severity: a.severity, areas: a.areaDesc.slice(0, 100) })),
          source: "live-noaa",
        };
      } catch (_e) { noaaMarineAlerts = { count: 0, alerts: [], source: "error" }; }

      return {
        data: {
          vessels: allVessels,
          sources: { digitraffic: dtSource, barentswatch: bwSource, aisstream: aisStreamSource },
          noaaMarineAlerts,
        },
        source: isLive ? "live" : "demo",
      };
    });

    sendSuccess(res, {
      source: "Combined AIS Feed — Digitraffic + BarentsWatch + AISStream",
      count: result.data.vessels.length,
      vessels: result.data.vessels,
      dataSource: result.source,
      sources: result.data.sources,
      marineWeather: result.data.noaaMarineAlerts,
      liveData: !result.source.includes("demo"),
      cacheAgeSeconds: result.cacheAge,
      isStale: result.isStale,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch combined AIS data"); }
});

router.get("/vessels/live/vessel-details/:mmsi", vesLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const { mmsi } = req.params;
    const result = await getCached<VesselRecord>(`vessel-details-${mmsi}`, 5 * 60 * 1000, async () => {
      try {
        const data = await fetchJson(
          `https://meri.digitraffic.fi/api/ais/v1/vessels/${mmsi}`,
          8000,
        ) as DigitrafficVesselDetail;

        if (!data?.mmsi) throw new Error("No vessel data");

        const shipType = data.shipType ?? 0;

        return {
          data: {
            mmsi: String(data.mmsi),
            imo: data.imo ? String(data.imo) : null,
            name: data.name?.trim() || `VESSEL-${mmsi}`,
            callSign: data.callSign?.trim() || null,
            type: SHIP_TYPE_MAP[shipType] ?? "Unknown",
            shipTypeCode: shipType,
            flag: FLAG_MAP[String(mmsi).slice(0, 3)] ?? null,
            destination: data.destination?.trim() || "Unknown",
            eta: data.eta ? new Date(data.eta).toISOString() : null,
            draught: data.draught ? +(data.draught / 10).toFixed(1) : null,
            dimensions: data.dimensions ? {
              length: (data.dimensions.a ?? 0) + (data.dimensions.b ?? 0),
              beam: (data.dimensions.c ?? 0) + (data.dimensions.d ?? 0),
            } : null,
          },
          source: "live-digitraffic",
        };
      } catch {
        const demo = FALLBACK_AIS_VESSELS.find(v => v.mmsi === mmsi) ?? FALLBACK_AIS_VESSELS[0];
        return { data: demo, source: "demo" };
      }
    });

    sendSuccess(res, {
      source: "Digitraffic AIS Vessel Registry",
      mmsi,
      vessel: result.data,
      dataSource: result.source,
      liveData: result.source !== "demo",
      cacheAgeSeconds: result.cacheAge,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch vessel details"); }
});

router.get("/vessels/live/weather", vesLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 60.0;
    const lon = parseFloat(req.query.lon as string) || 25.0;
    const result = await getCached<VesselRecord>(`weather-marine-${lat.toFixed(2)}-${lon.toFixed(2)}`, 15 * 60 * 1000, async () => {
      try {
        const raw = await fetchJson(
          `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_period,swell_wave_direction&current=wave_height,wind_wave_height,swell_wave_height,wave_direction,wave_period&timezone=UTC&forecast_days=3`,
          8000,
        ) as OpenMeteoMarineResponse;
        if (!raw?.current) throw new Error("No marine weather data");

        const windRaw = await fetchJson(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,temperature_2m,precipitation&timezone=UTC`,
          6000,
        ) as OpenMeteoWindResponse;

        const windSpeed = Math.round(windRaw?.current?.wind_speed_10m ?? 0);
        const windDir = windRaw?.current?.wind_direction_10m ?? 0;
        const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        const windDirName = dirs[Math.round(windDir / 45) % 8];

        const waveHeight = raw.current.wave_height ?? null;
        const beaufort = windSpeed > 55 ? 10 : windSpeed > 47 ? 9 : windSpeed > 38 ? 8 : windSpeed > 28 ? 7 : windSpeed > 22 ? 6 : windSpeed > 16 ? 5 : windSpeed > 11 ? 4 : windSpeed > 6 ? 3 : windSpeed > 3 ? 2 : windSpeed > 1 ? 1 : 0;

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
              condition: windSpeed > 30 ? "Rough seas" : windSpeed > 20 ? "Moderate seas" : windSpeed > 10 ? "Slight seas" : "Calm",
              warnings: beaufort >= 7 ? [`Beaufort ${beaufort} — ${beaufort >= 9 ? "Severe" : "Gale"} warning in effect`] : [],
            },
            forecast3h: raw.hourly?.time?.slice(0, 24).map((t: string, i: number) => ({
              time: t,
              waveHeight: raw.hourly?.wave_height?.[i] ?? null,
              swellHeight: raw.hourly?.swell_wave_height?.[i] ?? null,
              wavePeriod: raw.hourly?.wave_period?.[i] ?? null,
            })) ?? [],
          },
          source: "live-open-meteo",
        };
      } catch {
        return {
          data: {
            location: { lat, lon },
            current: { waveHeight: 1.8, windWaveHeight: 1.2, swellWaveHeight: 1.4, windSpeed: 15, windDirectionName: "NW", beaufortScale: 4, condition: "Moderate seas", warnings: [] },
            forecast3h: [],
          },
          source: "demo",
        };
      }
    });

    sendSuccess(res, {
      source: "Open-Meteo Marine & Weather API",
      url: "https://marine-api.open-meteo.com/",
      ...result.data,
      dataSource: result.source,
      liveData: result.source !== "demo",
      cacheAgeSeconds: result.cacheAge,
      isStale: result.isStale,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch marine weather"); }
});

router.get("/vessels/live/fleet-summary", vesLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await getCached<any>("fleet-summary", 5 * 60 * 1000, async () => {
      try {
        const [dt, bw] = await Promise.allSettled([
          fetchDigitrafficAis(),
          fetchBarentsWatchAis(),
        ]);

        const dtVessels = dt.status === "fulfilled" ? dt.value.vessels : [];
        const bwVessels = bw.status === "fulfilled" ? bw.value.vessels : [];
        const allVessels = [...dtVessels, ...bwVessels];

        const underway = allVessels.filter((v: any) => v.navStatus === 0).length;
        const anchored = allVessels.filter((v: any) => v.navStatus === 1).length;
        const moored = allVessels.filter((v: any) => v.navStatus === 5).length;
        const avgSpeed = allVessels.filter((v: any) => v.speed > 0).reduce((s: number, v: any) => s + v.speed, 0) / Math.max(1, allVessels.filter((v: any) => v.speed > 0).length);

        return {
          data: {
            source: "Live AIS — Digitraffic + BarentsWatch",
            status: "operational",
            totalVesselsTracked: allVessels.length,
            digitrafficCount: dtVessels.length,
            barentsWatchCount: bwVessels.length,
            underwayCount: underway,
            anchoredCount: anchored,
            mooredCount: moored,
            avgSpeedKnots: +avgSpeed.toFixed(1),
            typeBreakdown: allVessels.reduce((acc: Record<string, number>, v: any) => {
              const t = v.type || "Unknown";
              acc[t] = (acc[t] ?? 0) + 1;
              return acc;
            }, {}),
            liveData: dtVessels.length > 0 || bwVessels.length > 0,
          },
          source: dtVessels.length > 0 ? "live" : "demo",
        };
      } catch {
        return {
          data: {
            source: "Vessels Maritime Intelligence",
            status: "operational",
            totalVesselsTracked: 847,
            underwayCount: 412,
            anchoredCount: 89,
            mooredCount: 156,
            avgSpeedKnots: 11.4,
            typeBreakdown: { Cargo: 312, Tanker: 156, Container: 203, "Bulk Carrier": 176 },
            liveData: false,
          },
          source: "demo",
        };
      }
    });

    sendSuccess(res, {
      ...result.data,
      cacheAgeSeconds: result.cacheAge,
      isStale: result.isStale,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Vessels fleet summary"); }
});

export default router;
