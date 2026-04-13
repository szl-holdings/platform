import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services } from "@szl-holdings/services";
import { db, intelligenceCacheTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";

type ThreatFoxIoc = { ioc_type: string; confidence_level: number; threat_type: string; malware?: string; ioc: string; reference?: string; reporter?: string; first_seen_utc?: string };
type PhishTankEntry = { phish_id: number; url: string; verified: string; online: string; target?: string; submission_time?: string };
type OpenSkyAircraft = { icao24: string; callsign?: string; origin_country: string; originCountry: string; latitude?: number; longitude?: number; baro_altitude?: number; velocity?: number; on_ground: boolean; onGround: boolean };

const router: IRouter = Router();

const threatLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Threat feeds rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const svc = services as any;
const phishtankAdapter = svc.phishtank;
const threatfoxAdapter = svc.threatfox;
const openSkyAdapter = svc.opensky;

const tfMemCache = new Map<string, { data: unknown; expiresAt: number }>();

async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const mem = tfMemCache.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.data as T;
  const expiresAt = new Date(Date.now() + ttlMs);
  const dbKey = `tf-${key}`;
  try {
    const [row] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, dbKey)).limit(1);
    if (row && new Date(row.expiresAt) > new Date()) {
      tfMemCache.set(key, { data: row.data, expiresAt: new Date(row.expiresAt).getTime() });
      return row.data as T;
    }
  } catch (_e) { /* DB unavailable; fall through to live fetch */ }
  try {
    const data = await fetcher();
    tfMemCache.set(key, { data, expiresAt: expiresAt.getTime() });
    await db.insert(intelligenceCacheTable).values({ key: dbKey, data: data as unknown, expiresAt, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: intelligenceCacheTable.key, set: { data: data as unknown, expiresAt, fetchedAt: new Date() } })
      .catch(() => undefined);
    return data;
  } catch (err) {
    const [stale] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, dbKey)).limit(1).catch(() => [null]);
    if (stale) return stale.data as T;
    throw err;
  }
}

type IocResult = { iocs: ThreatFoxIoc[]; source: string; error?: string };
type PhishResult = { urls: PhishTankEntry[]; source: string; note?: string; error?: string };
type OpenSkyResult = { aircraft: OpenSkyAircraft[]; time: string; source: string; count: number; note?: string; error?: string };

interface UrlhausUrl { url_status: string; threat?: string; url: string; date_added: string; }
interface UrlhausResponse { urls?: UrlhausUrl[]; }

router.get("/aegis/live/threatfox", threatLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 3, 7);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const iocs = await getCached<IocResult>(`threatfox-iocs-${days}-${limit}`, 3600000, async () => {
      try {
        const data = await threatfoxAdapter.getRecentIocs(days, limit);
        if (data.length === 0) throw new Error("No ThreatFox IOCs returned");
        return { iocs: data, source: "live" };
      } catch (err: unknown) {
        return { iocs: [], source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    const iocsByType = iocs.iocs.reduce<Record<string, number>>((acc, i) => {
      acc[i.ioc_type] = (acc[i.ioc_type] ?? 0) + 1;
      return acc;
    }, {});

    const iocsByMalware = iocs.iocs.reduce<Record<string, number>>((acc, i) => {
      if (i.malware) acc[i.malware] = (acc[i.malware] ?? 0) + 1;
      return acc;
    }, {});

    sendSuccess(res, {
      source: "Abuse.ch ThreatFox IOC Feed — Free, No Key Required",
      url: "https://threatfox.abuse.ch/",
      configured: true,
      dataSource: iocs.source,
      liveData: iocs.source === "live",
      count: iocs.iocs.length,
      iocs: iocs.iocs,
      summary: {
        byType: iocsByType,
        byMalware: Object.entries(iocsByMalware).sort((a, b) => b[1] - a[1]).slice(0, 10),
        daysRequested: days,
      },
      ...(iocs.error ? { error: iocs.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch ThreatFox IOCs"); }
});

router.get("/aegis/live/threatfox/search", threatLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const ioc = req.query.ioc as string;
    if (!ioc) { res.status(400).json({ error: "ioc query parameter required" }); return; }

    const result = await getCached(`threatfox-search-${ioc}`, 1800000, async () => {
      try {
        const found = await threatfoxAdapter.searchIoc(ioc);
        return { ioc: found, source: "live" };
      } catch (err: unknown) {
        return { ioc: null, source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    sendSuccess(res, {
      source: "Abuse.ch ThreatFox IOC Search",
      url: "https://threatfox.abuse.ch/",
      searchTerm: ioc,
      ...(result as object),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to search ThreatFox IOC"); }
});

router.get("/aegis/live/phishtank", threatLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await getCached<PhishResult>(`phishtank-recent-${limit}`, 3600000, async () => {
      try {
        const data = await phishtankAdapter.getRecentPhishingUrls(limit);
        if (data.length === 0) throw new Error("No PhishTank data returned");
        return { urls: data, source: "live" };
      } catch (err: unknown) {
        return {
          urls: [],
          source: "unavailable",
          note: "PhishTank public data feed may be rate-limited for anonymous access. Register a free API key at https://www.phishtank.com/api_info.php",
          error: err instanceof Error ? err.message : String(err),
        };
      }
    });

    const byTarget = result.urls.reduce<Record<string, number>>((acc, p) => {
      if (p.target) acc[p.target] = (acc[p.target] ?? 0) + 1;
      return acc;
    }, {});

    sendSuccess(res, {
      source: "PhishTank Phishing URL Database — Community Anti-Phishing Feed",
      url: "https://www.phishtank.com/",
      configured: true,
      dataSource: result.source,
      liveData: result.source === "live",
      count: result.urls.length,
      urls: result.urls,
      summary: {
        topTargets: Object.entries(byTarget).sort((a, b) => b[1] - a[1]).slice(0, 10),
        verifiedCount: result.urls.filter(u => u.verified === "yes").length,
        onlineCount: result.urls.filter(u => u.online === "yes").length,
      },
      ...(result.note ? { note: result.note } : {}),
      ...(result.error ? { error: result.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch PhishTank data"); }
});

router.get("/aegis/live/opensky", threatLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const lamin = parseFloat(req.query.lamin as string) || null;
    const lomin = parseFloat(req.query.lomin as string) || null;
    const lamax = parseFloat(req.query.lamax as string) || null;
    const lomax = parseFloat(req.query.lomax as string) || null;

    const cacheKey = `opensky-${lamin}-${lomin}-${lamax}-${lomax}`;

    const result = await getCached<OpenSkyResult>(cacheKey, 60000, async () => {
      try {
        const params: { lamin?: number; lomin?: number; lamax?: number; lomax?: number } = {};
        if (lamin != null) params.lamin = lamin;
        if (lomin != null) params.lomin = lomin;
        if (lamax != null) params.lamax = lamax;
        if (lomax != null) params.lomax = lomax;
        const { aircraft, time, source } = await openSkyAdapter.getStates(params);
        return { aircraft, time, source, count: aircraft.length };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("rate limit")) {
          return { aircraft: [], time: new Date().toISOString(), source: "rate-limited", count: 0, note: msg };
        }
        return { aircraft: [], time: new Date().toISOString(), source: "error", count: 0, error: msg };
      }
    });

    const airborne = result.aircraft.filter(a => !a.onGround);
    const byCountry = result.aircraft.reduce<Record<string, number>>((acc, a) => {
      if (a.originCountry) acc[a.originCountry] = (acc[a.originCountry] ?? 0) + 1;
      return acc;
    }, {});

    sendSuccess(res, {
      source: "OpenSky Network Aircraft Tracking — Free Anonymous REST API",
      url: "https://opensky-network.org/",
      configured: true,
      dataSource: result.source,
      liveData: result.source === "live-opensky",
      count: result.count,
      airborneCount: airborne.length,
      aircraft: result.aircraft,
      summary: {
        total: result.count,
        airborne: airborne.length,
        onGround: result.count - airborne.length,
        topOriginCountries: Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 5),
      },
      ...(result.note ? { note: result.note } : {}),
      ...(result.error ? { error: result.error } : {}),
      observationTime: result.time,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch OpenSky aircraft data"); }
});

router.get("/aegis/live/threat-intel-summary", threatLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    type ThreatFoxSummary = { total: number; byType: Record<string, number>; highConfidence: number; source: string };
    type UrlhausSummary = { total: number; online: number; byThreat: Record<string, number>; source: string };

    const [threatfoxResult, urlhausResult] = await Promise.allSettled([
      getCached<ThreatFoxSummary>("threatfox-summary", 3600000, async () => {
        const iocs: ThreatFoxIoc[] = await threatfoxAdapter.getRecentIocs(1, 100);
        return {
          total: iocs.length,
          byType: iocs.reduce<Record<string, number>>((acc, i) => { acc[i.ioc_type] = (acc[i.ioc_type] ?? 0) + 1; return acc; }, {}),
          highConfidence: iocs.filter((i) => i.confidence_level >= 75).length,
          source: "live",
        };
      }),
      getCached<UrlhausSummary>("urlhaus-summary", 3600000, async () => {
        const r = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/limit/50/", {
          headers: { "User-Agent": "SZL-Aegis/1.0" },
          signal: AbortSignal.timeout(10000),
        });
        if (!r.ok) throw new Error(`URLhaus HTTP ${r.status}`);
        const data = await r.json() as UrlhausResponse;
        const urls = data?.urls ?? [];
        return {
          total: urls.length,
          online: urls.filter(u => u.url_status === "online").length,
          byThreat: urls.reduce<Record<string, number>>((acc, u) => {
            if (u.threat) acc[u.threat] = (acc[u.threat] ?? 0) + 1;
            return acc;
          }, {}),
          source: "live",
        };
      }),
    ]);

    const tfError = threatfoxResult.status === "rejected" ? String((threatfoxResult as PromiseRejectedResult).reason) : undefined;
    const uhError = urlhausResult.status === "rejected" ? String((urlhausResult as PromiseRejectedResult).reason) : undefined;

    sendSuccess(res, {
      source: "Aegis Threat Intelligence Summary — Live Public Feeds",
      feeds: {
        threatfox: {
          name: "Abuse.ch ThreatFox",
          url: "https://threatfox.abuse.ch/",
          requiresKey: false,
          ...(threatfoxResult.status === "fulfilled" ? threatfoxResult.value : { source: "error", error: tfError }),
        },
        urlhaus: {
          name: "Abuse.ch URLhaus",
          url: "https://urlhaus.abuse.ch/",
          requiresKey: false,
          ...(urlhausResult.status === "fulfilled" ? urlhausResult.value : { source: "error", error: uhError }),
        },
        phishtank: {
          name: "PhishTank",
          url: "https://www.phishtank.com/",
          requiresKey: false,
          note: "Full feed requires app key registration",
          source: "available",
        },
        opensky: {
          name: "OpenSky Network",
          url: "https://opensky-network.org/",
          requiresKey: false,
          note: "Anonymous access limited to 400 API calls/day",
          source: "available",
        },
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch threat intel summary"); }
});

export default router;
