import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services } from "@szl-holdings/services";
import { db, intelligenceCacheTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const noaaLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "NOAA Alerts rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const noaaAlertsAdapter = services.noaaAlerts;

const alertMemCache = new Map<string, { data: unknown; expiresAt: number }>();

async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const mem = alertMemCache.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.data as T;
  const expiresAt = new Date(Date.now() + ttlMs);
  const dbKey = `noaa-alerts-${key}`;
  try {
    const [row] = await db.select().from(intelligenceCacheTable).where(eq(intelligenceCacheTable.key, dbKey)).limit(1);
    if (row && new Date(row.expiresAt) > new Date()) {
      alertMemCache.set(key, { data: row.data, expiresAt: new Date(row.expiresAt).getTime() });
      return row.data as T;
    }
  } catch (_e) { /* DB unavailable; fall through to live fetch */ }
  try {
    const data = await fetcher();
    alertMemCache.set(key, { data, expiresAt: expiresAt.getTime() });
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

type AlertsResult = { alerts: Awaited<ReturnType<typeof noaaAlertsAdapter.getActiveAlerts>>; source: string; error?: string };
type PropertyResult = {
  property: ReturnType<typeof noaaAlertsAdapter.categorizeForDomain>["property"];
  infrastructure: ReturnType<typeof noaaAlertsAdapter.categorizeForDomain>["infrastructure"];
  marine: ReturnType<typeof noaaAlertsAdapter.categorizeForDomain>["marine"];
  source: string;
  error?: string;
};

router.get("/noaa/alerts", noaaLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const area = req.query.area as string;
    const severity = req.query.severity as string;
    const event = req.query.event as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const cacheKey = `all-${area ?? "all"}-${severity ?? "all"}-${event ?? "all"}-${limit}`;

    const alerts = await getCached<AlertsResult>(cacheKey, 300000, async () => {
      try {
        const data = await noaaAlertsAdapter.getActiveAlerts({ area, severity, event, limit });
        return { alerts: data, source: "live" };
      } catch (err: unknown) {
        return { alerts: [], source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    const categorized = noaaAlertsAdapter.categorizeForDomain(alerts.alerts ?? []);

    sendSuccess(res, {
      source: "NOAA National Weather Service Active Alerts API",
      url: "https://api.weather.gov/alerts",
      apiDocs: "https://www.weather.gov/documentation/services-web-api",
      dataSource: alerts.source,
      liveData: alerts.source === "live",
      count: alerts.alerts.length,
      alerts: alerts.alerts,
      summary: {
        total: alerts.alerts.length,
        extreme: alerts.alerts.filter(a => a.severity === "Extreme").length,
        severe: alerts.alerts.filter(a => a.severity === "Severe").length,
        moderate: alerts.alerts.filter(a => a.severity === "Moderate").length,
        minor: alerts.alerts.filter(a => a.severity === "Minor").length,
        marine: categorized.marine.length,
        property: categorized.property.length,
        infrastructure: categorized.infrastructure.length,
      },
      ...(alerts.error ? { error: alerts.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch NOAA alerts"); }
});

router.get("/noaa/alerts/state/:state", noaaLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const state = String(req.params["state"] ?? "");
    const stateUpper = state.toUpperCase();

    const alerts = await getCached<AlertsResult>(`state-${stateUpper}`, 300000, async () => {
      try {
        const data = await noaaAlertsAdapter.getAlertsByState(stateUpper);
        return { alerts: data, source: "live" };
      } catch (err: unknown) {
        return { alerts: [], source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    const categorized = noaaAlertsAdapter.categorizeForDomain(alerts.alerts ?? []);

    sendSuccess(res, {
      source: "NOAA NWS State Weather Alerts",
      url: `https://api.weather.gov/alerts/active/area/${stateUpper}`,
      state: stateUpper,
      dataSource: alerts.source,
      liveData: alerts.source === "live",
      count: alerts.alerts.length,
      alerts: alerts.alerts,
      domains: {
        marine: categorized.marine,
        property: categorized.property,
        infrastructure: categorized.infrastructure,
      },
      ...(alerts.error ? { error: alerts.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch NOAA state alerts"); }
});

router.get("/noaa/alerts/severe", noaaLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const alerts = await getCached<AlertsResult>("severe", 180000, async () => {
      try {
        const data = await noaaAlertsAdapter.getSevereAlerts(["Extreme", "Severe"]);
        return { alerts: data, source: "live" };
      } catch (err: unknown) {
        return { alerts: [], source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    sendSuccess(res, {
      source: "NOAA NWS Severe & Extreme Weather Alerts",
      url: "https://api.weather.gov/alerts/active",
      dataSource: alerts.source,
      liveData: alerts.source === "live",
      count: alerts.alerts.length,
      alerts: alerts.alerts,
      ...(alerts.error ? { error: alerts.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch severe alerts"); }
});

router.get("/noaa/alerts/marine", noaaLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const alerts = await getCached<AlertsResult>("marine-hazard", 300000, async () => {
      try {
        const all = await noaaAlertsAdapter.getActiveAlerts({ limit: 200 });
        const marine = noaaAlertsAdapter.categorizeForDomain(all).marine;
        return { alerts: marine, source: "live" };
      } catch (err: unknown) {
        return { alerts: [], source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    sendSuccess(res, {
      source: "NOAA NWS Marine & Coastal Alerts",
      url: "https://api.weather.gov/alerts",
      dataSource: alerts.source,
      liveData: alerts.source === "live",
      count: alerts.alerts.length,
      alerts: alerts.alerts,
      domains: ["Vessels", "Terra (coastal properties)"],
      ...(alerts.error ? { error: alerts.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch marine alerts"); }
});

router.get("/noaa/alerts/property-impact", noaaLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const state = (req.query.state as string)?.toUpperCase();
    const cacheKey = `property-impact-${state ?? "all"}`;

    const alerts = await getCached<PropertyResult>(cacheKey, 300000, async () => {
      try {
        const all = state
          ? await noaaAlertsAdapter.getAlertsByState(state)
          : await noaaAlertsAdapter.getActiveAlerts({ limit: 200 });
        const categorized = noaaAlertsAdapter.categorizeForDomain(all);
        return {
          property: categorized.property,
          infrastructure: categorized.infrastructure,
          marine: categorized.marine,
          source: "live",
        };
      } catch (err: unknown) {
        return { property: [], infrastructure: [], marine: [], source: "error", error: err instanceof Error ? err.message : String(err) };
      }
    });

    sendSuccess(res, {
      source: "NOAA NWS Property & Infrastructure Impact Alerts — Terra Integration",
      url: "https://api.weather.gov/alerts",
      state,
      dataSource: alerts.source,
      liveData: alerts.source === "live",
      propertyAlerts: alerts.property,
      infrastructureAlerts: alerts.infrastructure,
      marineAlerts: alerts.marine,
      count: {
        property: alerts.property.length,
        infrastructure: alerts.infrastructure.length,
        marine: alerts.marine.length,
      },
      ...(alerts.error ? { error: alerts.error } : {}),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch property impact alerts"); }
});

export default router;
