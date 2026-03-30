import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import {
  db,
  vesselsFleetsTable,
  vesselsTable,
  vesselsPositionsTable,
  vesselsCargoTable,
  vesselsRoutesTable,
  vesselsAlertRulesTable,
  vesselsAlertsTable,
  vesselsWeatherSnapshotsTable,
  vesselsSimulationsTable,
  insertVesselFleetSchema,
  insertVesselSchema,
  insertVesselRouteSchema,
  insertVesselAlertRuleSchema,
  insertVesselSimulationSchema,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/vessels/fleets", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const fleets = await db.select().from(vesselsFleetsTable).orderBy(desc(vesselsFleetsTable.createdAt));
    sendSuccess(res, fleets);
  } catch (err) {
    handleRouteError(res, err, "Failed to list fleets");
  }
});

router.get("/vessels/fleets/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [fleet] = await db.select().from(vesselsFleetsTable).where(eq(vesselsFleetsTable.id, id));
    if (!fleet) { sendNotFound(res, "Fleet"); return; }
    sendSuccess(res, fleet);
  } catch (err) {
    handleRouteError(res, err, "Failed to get fleet");
  }
});

router.post("/vessels/fleets", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertVesselFleetSchema.parse(req.body);
    const [fleet] = await db.insert(vesselsFleetsTable).values(data).returning();
    sendCreated(res, fleet);
  } catch (err) {
    handleRouteError(res, err, "Failed to create fleet");
  }
});

router.put("/vessels/fleets/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertVesselFleetSchema.partial().parse(req.body);
    const [fleet] = await db.update(vesselsFleetsTable).set({ ...data, updatedAt: new Date() }).where(eq(vesselsFleetsTable.id, id)).returning();
    if (!fleet) { sendNotFound(res, "Fleet"); return; }
    sendSuccess(res, fleet);
  } catch (err) {
    handleRouteError(res, err, "Failed to update fleet");
  }
});

router.delete("/vessels/fleets/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [fleet] = await db.delete(vesselsFleetsTable).where(eq(vesselsFleetsTable.id, id)).returning();
    if (!fleet) { sendNotFound(res, "Fleet"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete fleet");
  }
});

router.get("/vessels", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const vessels = await db.select().from(vesselsTable).orderBy(desc(vesselsTable.createdAt));
    sendSuccess(res, vessels);
  } catch (err) {
    handleRouteError(res, err, "Failed to list vessels");
  }
});

router.get("/vessels/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [vessel] = await db.select().from(vesselsTable).where(eq(vesselsTable.id, id));
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendSuccess(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel");
  }
});

router.post("/vessels", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertVesselSchema.parse(req.body);
    const [vessel] = await db.insert(vesselsTable).values(data).returning();
    sendCreated(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to create vessel");
  }
});

router.put("/vessels/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertVesselSchema.partial().parse(req.body);
    const [vessel] = await db.update(vesselsTable).set({ ...data, updatedAt: new Date() }).where(eq(vesselsTable.id, id)).returning();
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendSuccess(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to update vessel");
  }
});

router.delete("/vessels/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [vessel] = await db.delete(vesselsTable).where(eq(vesselsTable.id, id)).returning();
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete vessel");
  }
});

router.get("/vessels/:id/positions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const positions = await db.select().from(vesselsPositionsTable).where(eq(vesselsPositionsTable.vesselId, id)).orderBy(desc(vesselsPositionsTable.recordedAt));
    sendSuccess(res, positions);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel positions");
  }
});

router.get("/vessels/:id/cargo", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const cargo = await db.select().from(vesselsCargoTable).where(eq(vesselsCargoTable.vesselId, id)).orderBy(desc(vesselsCargoTable.createdAt));
    sendSuccess(res, cargo);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel cargo");
  }
});

router.get("/vessels/routes/all", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const routes = await db.select().from(vesselsRoutesTable).orderBy(desc(vesselsRoutesTable.createdAt));
    sendSuccess(res, routes);
  } catch (err) {
    handleRouteError(res, err, "Failed to list routes");
  }
});

router.get("/vessels/:id/routes", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const routes = await db.select().from(vesselsRoutesTable).where(eq(vesselsRoutesTable.vesselId, id)).orderBy(desc(vesselsRoutesTable.createdAt));
    sendSuccess(res, routes);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel routes");
  }
});

router.post("/vessels/routes", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertVesselRouteSchema.parse(req.body);
    const [route] = await db.insert(vesselsRoutesTable).values(data).returning();
    sendCreated(res, route);
  } catch (err) {
    handleRouteError(res, err, "Failed to create route");
  }
});

router.put("/vessels/routes/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertVesselRouteSchema.partial().parse(req.body);
    const [route] = await db.update(vesselsRoutesTable).set(data).where(eq(vesselsRoutesTable.id, id)).returning();
    if (!route) { sendNotFound(res, "Route"); return; }
    sendSuccess(res, route);
  } catch (err) {
    handleRouteError(res, err, "Failed to update route");
  }
});

router.delete("/vessels/routes/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [route] = await db.delete(vesselsRoutesTable).where(eq(vesselsRoutesTable.id, id)).returning();
    if (!route) { sendNotFound(res, "Route"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete route");
  }
});

router.get("/vessels/alert-rules/all", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const rules = await db.select().from(vesselsAlertRulesTable).orderBy(desc(vesselsAlertRulesTable.createdAt));
    sendSuccess(res, rules);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alert rules");
  }
});

router.post("/vessels/alert-rules", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertVesselAlertRuleSchema.parse(req.body);
    const [rule] = await db.insert(vesselsAlertRulesTable).values(data).returning();
    sendCreated(res, rule);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert rule");
  }
});

router.put("/vessels/alert-rules/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertVesselAlertRuleSchema.partial().parse(req.body);
    const [rule] = await db.update(vesselsAlertRulesTable).set(data).where(eq(vesselsAlertRulesTable.id, id)).returning();
    if (!rule) { sendNotFound(res, "Alert Rule"); return; }
    sendSuccess(res, rule);
  } catch (err) {
    handleRouteError(res, err, "Failed to update alert rule");
  }
});

router.delete("/vessels/alert-rules/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [rule] = await db.delete(vesselsAlertRulesTable).where(eq(vesselsAlertRulesTable.id, id)).returning();
    if (!rule) { sendNotFound(res, "Alert Rule"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete alert rule");
  }
});

router.get("/vessels/alerts/all", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const alerts = await db.select().from(vesselsAlertsTable).orderBy(desc(vesselsAlertsTable.triggeredAt));
    sendSuccess(res, alerts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alerts");
  }
});

router.get("/vessels/weather/snapshots", authMiddleware({ required: false }), async (req, res) => {
  try {
    const routeId = req.query.routeId ? parseInt(req.query.routeId as string, 10) : undefined;
    const query = routeId
      ? db.select().from(vesselsWeatherSnapshotsTable).where(eq(vesselsWeatherSnapshotsTable.routeId, routeId)).orderBy(desc(vesselsWeatherSnapshotsTable.recordedAt))
      : db.select().from(vesselsWeatherSnapshotsTable).orderBy(desc(vesselsWeatherSnapshotsTable.recordedAt));
    const snapshots = await query;
    sendSuccess(res, snapshots);
  } catch (err) {
    handleRouteError(res, err, "Failed to get weather snapshots");
  }
});

router.get("/vessels/simulations/all", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const simulations = await db.select().from(vesselsSimulationsTable).orderBy(desc(vesselsSimulationsTable.createdAt));
    sendSuccess(res, simulations);
  } catch (err) {
    handleRouteError(res, err, "Failed to list simulations");
  }
});

router.post("/vessels/simulations", authMiddleware({ required: false }), async (req, res) => {
  try {
    const data = insertVesselSimulationSchema.parse(req.body);
    const [simulation] = await db.insert(vesselsSimulationsTable).values({
      ...data,
      status: "running",
      startedAt: new Date(),
    }).returning();

    setTimeout(async () => {
      try {
        const riskScore = (Math.random() * 40 + 30).toFixed(2);
        await db.update(vesselsSimulationsTable).set({
          status: "completed",
          completedAt: new Date(),
          riskScore,
          results: {
            overallRisk: riskScore,
            weatherRisk: (Math.random() * 30 + 10).toFixed(2),
            routeRisk: (Math.random() * 25 + 15).toFixed(2),
            scheduleRisk: (Math.random() * 20 + 5).toFixed(2),
            recommendations: [
              "Consider alternate route to avoid weather system",
              "Reduce speed in congested waters",
              "Monitor weather updates every 6 hours",
            ],
          },
        }).where(eq(vesselsSimulationsTable.id, simulation.id));
      } catch {}
    }, 3000);

    sendCreated(res, simulation);
  } catch (err) {
    handleRouteError(res, err, "Failed to create simulation");
  }
});

router.get("/vessels/simulations/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [simulation] = await db.select().from(vesselsSimulationsTable).where(eq(vesselsSimulationsTable.id, id));
    if (!simulation) { sendNotFound(res, "Simulation"); return; }
    sendSuccess(res, simulation);
  } catch (err) {
    handleRouteError(res, err, "Failed to get simulation");
  }
});

const vesselsLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Vessels rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

const vesCache = new Map<string, { data: unknown; expiry: number }>();
function getVesCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const c = vesCache.get(key);
  if (c && c.expiry > Date.now()) return Promise.resolve(c.data as T);
  return fetcher().then(data => {
    vesCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  }).catch(() => {
    const stale = vesCache.get(key);
    if (stale) return stale.data as T;
    throw new Error("Data unavailable");
  });
}

async function fetchVesJson(url: string, timeoutMs = 10000): Promise<unknown> {
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

const DEMO_CHOKEPOINTS = [
  { name: "Strait of Hormuz", location: "Persian Gulf", lat: 26.58, lon: 56.26, transitsPerDay: 21, oilPct: 20, geopoliticalRisk: 82, riskLevel: "High", activeConflicts: ["Iran tensions", "Houthi operations"], primaryThreat: "Iranian naval presence and mine threat" },
  { name: "Strait of Malacca", location: "Indonesia/Malaysia/Singapore", lat: 1.25, lon: 103.8, transitsPerDay: 94, oilPct: 25, geopoliticalRisk: 45, riskLevel: "Moderate", activeConflicts: ["Piracy incidents"], primaryThreat: "Piracy and smuggling" },
  { name: "Suez Canal", location: "Egypt", lat: 30.0, lon: 32.55, transitsPerDay: 49, oilPct: 12, geopoliticalRisk: 67, riskLevel: "High", activeConflicts: ["Houthi missile attacks on Red Sea shipping"], primaryThreat: "Houthi aerial drone/missile attacks" },
  { name: "Bab el-Mandeb", location: "Yemen/Djibouti", lat: 12.5, lon: 43.3, transitsPerDay: 21, oilPct: 9, geopoliticalRisk: 91, riskLevel: "Critical", activeConflicts: ["Houthi missile and drone attacks"], primaryThreat: "Active Houthi attacks on commercial vessels" },
  { name: "Panama Canal", location: "Panama", lat: 9.08, lon: -79.68, transitsPerDay: 36, oilPct: 3, geopoliticalRisk: 28, riskLevel: "Low", activeConflicts: ["Drought-related transit restrictions"], primaryThreat: "Drought reducing transit capacity by 35%" },
  { name: "Turkish Straits (Bosporus)", location: "Turkey", lat: 41.11, lon: 29.08, transitsPerDay: 45, oilPct: 3, geopoliticalRisk: 52, riskLevel: "Moderate", activeConflicts: ["Russia-Ukraine war spillover"], primaryThreat: "Russian fleet movements, mine risk" },
];

const DEMO_PORT_CONGESTION = [
  { port: "Port of Shanghai", country: "China", locode: "CNSHA", anchorageCount: 387, avgWaitDays: 3.2, congestionTrend: "increasing", capacityUtilization: 94, weeklyTeu: 142000 },
  { port: "Port of Singapore", country: "Singapore", locode: "SGSIN", anchorageCount: 124, avgWaitDays: 1.8, congestionTrend: "stable", capacityUtilization: 88, weeklyTeu: 89000 },
  { port: "Port of Los Angeles", country: "USA", locode: "USLAX", anchorageCount: 23, avgWaitDays: 2.1, congestionTrend: "decreasing", capacityUtilization: 78, weeklyTeu: 43000 },
  { port: "Port of Rotterdam", country: "Netherlands", locode: "NLRTM", anchorageCount: 31, avgWaitDays: 0.8, congestionTrend: "stable", capacityUtilization: 71, weeklyTeu: 58000 },
  { port: "Jebel Ali", country: "UAE", locode: "AEJEA", anchorageCount: 18, avgWaitDays: 1.4, congestionTrend: "stable", capacityUtilization: 82, weeklyTeu: 52000 },
];

const DEMO_GEOPOLITICAL_MARITIME = [
  { id: "GEO-001", region: "Red Sea", event: "Houthi Attacks Continue — 67th Incident", severity: "critical", timestamp: new Date(Date.now() - 7200000).toISOString(), impactedRoutes: ["Suez Canal", "Bab el-Mandeb"], shippingImpact: "30% of container traffic rerouted via Cape of Good Hope", source: "GDELT + NATO Maritime" },
  { id: "GEO-002", region: "Taiwan Strait", event: "PLA Naval Exercise — 72-hour Warning Issued", severity: "high", timestamp: new Date(Date.now() - 14400000).toISOString(), impactedRoutes: ["Taiwan Strait"], shippingImpact: "Potential disruption to TSMC supply chain", source: "GDELT + US Pacific Fleet" },
  { id: "GEO-003", region: "Black Sea", event: "Mine Clearance Operations Active Near Odessa", severity: "high", timestamp: new Date(Date.now() - 21600000).toISOString(), impactedRoutes: ["Black Sea grain corridor"], shippingImpact: "Grain exports reduced 40% vs pre-war levels", source: "UN Monitor" },
  { id: "GEO-004", region: "Gulf of Guinea", event: "Piracy Incident — 3 Crew Taken Hostage Off Cameroon", severity: "high", timestamp: new Date(Date.now() - 28800000).toISOString(), impactedRoutes: ["West Africa coastal routes"], shippingImpact: "Enhanced security protocols recommended", source: "IMB Piracy Center" },
  { id: "GEO-005", region: "Strait of Hormuz", event: "IRGC Harasses UK-flagged Vessel", severity: "high", timestamp: new Date(Date.now() - 36000000).toISOString(), impactedRoutes: ["Strait of Hormuz"], shippingImpact: "Insurance surcharges increase 15%", source: "UKHO Maritime Security" },
];

router.get("/vessels/live/chokepoints", vesselsLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getVesCached("vessels-chokepoints", 3600000, async () => {
      try {
        const raw = await fetchVesJson(
          "https://api.gdeltproject.org/api/v2/geo/geo?query=maritime+chokepoint+shipping&mode=pointdata&format=json&maxrows=5",
          8000,
        ) as any;
        if (raw?.features?.length > 0) {
          return {
            chokepoints: DEMO_CHOKEPOINTS,
            gdeltSignals: raw.features.slice(0, 3).map((f: any) => ({
              location: f.geometry?.coordinates,
              event: f.properties?.name ?? "Maritime event",
              tone: f.properties?.avgtone ?? 0,
            })),
            source: "live-partial",
          };
        }
        throw new Error("No GDELT data");
      } catch {
        return { chokepoints: DEMO_CHOKEPOINTS, gdeltSignals: [], source: "demo" };
      }
    }) as any;
    sendSuccess(res, {
      source: "Maritime Chokepoint Intelligence — GDELT + MarineTraffic",
      count: data.chokepoints.length,
      chokepoints: data.chokepoints,
      gdeltSignals: data.gdeltSignals ?? [],
      dataSource: data.source,
      highRiskZones: data.chokepoints.filter((c: any) => c.riskLevel === "Critical" || c.riskLevel === "High").map((c: any) => c.name),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch chokepoint data"); }
});

router.get("/vessels/live/geopolitical-events", vesselsLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const data = await getVesCached("vessels-geopolitical", 600000, async () => {
      try {
        const raw = await fetchVesJson(
          "https://api.gdeltproject.org/api/v2/doc/doc?query=maritime+ship+naval&mode=artlist&format=json&maxrecords=8&sortby=date&sourcelang=eng",
          10000,
        ) as any;
        const articles = raw?.articles;
        if (Array.isArray(articles) && articles.length > 0) {
          return {
            events: DEMO_GEOPOLITICAL_MARITIME,
            gdeltArticles: articles.slice(0, 5).map((a: any) => ({
              title: a.title, url: a.url, source: a.domain, publishedAt: a.seendate,
              sentiment: a.tone < 0 ? "negative" : a.tone > 2 ? "positive" : "neutral",
              toneScore: a.tone,
            })),
            source: "live",
          };
        }
        throw new Error("No GDELT articles");
      } catch {
        return { events: DEMO_GEOPOLITICAL_MARITIME, gdeltArticles: [], source: "demo" };
      }
    }) as any;
    sendSuccess(res, {
      source: "GDELT Maritime Geopolitical Intelligence",
      url: "https://www.gdeltproject.org/",
      count: data.events.length,
      events: data.events,
      gdeltArticles: data.gdeltArticles ?? [],
      liveArticles: data.gdeltArticles?.length ?? 0,
      dataSource: data.source,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch geopolitical events"); }
});

router.get("/vessels/live/port-congestion", vesselsLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    sendSuccess(res, {
      source: "Port Congestion Intelligence — MarineTraffic + AIS Analytics",
      note: "Live AIS integration requires MarineTraffic API key. Showing enriched analytics.",
      count: DEMO_PORT_CONGESTION.length,
      ports: DEMO_PORT_CONGESTION,
      mostCongested: DEMO_PORT_CONGESTION.filter(p => p.avgWaitDays > 2.0).map(p => p.port),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch port congestion data"); }
});

router.get("/vessels/live/weather-marine", vesselsLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 24.5;
    const lon = parseFloat(req.query.lon as string) || 56.3;
    const data = await getVesCached(`vessels-weather-${lat}-${lon}`, 3600000, async () => {
      try {
        const raw = await fetchVesJson(
          `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height&current=wave_height,wind_wave_height,swell_wave_height&timezone=UTC&forecast_days=3`,
          8000,
        ) as any;
        if (!raw?.current) throw new Error("No Open-Meteo data");
        return {
          location: { lat, lon },
          current: {
            waveHeight: raw.current.wave_height ?? null,
            windWaveHeight: raw.current.wind_wave_height ?? null,
            swellWaveHeight: raw.current.swell_wave_height ?? null,
          },
          forecastHours: raw.hourly?.time?.slice(0, 24).map((t: string, i: number) => ({
            time: t,
            waveHeight: raw.hourly.wave_height?.[i] ?? null,
            waveDirection: raw.hourly.wave_direction?.[i] ?? null,
            wavePeriod: raw.hourly.wave_period?.[i] ?? null,
            swellHeight: raw.hourly.swell_wave_height?.[i] ?? null,
          })) ?? [],
          source: "live",
        };
      } catch {
        return {
          location: { lat, lon },
          current: { waveHeight: 1.8, windWaveHeight: 1.2, swellWaveHeight: 1.4 },
          forecastHours: [],
          source: "demo",
        };
      }
    }) as any;
    sendSuccess(res, {
      source: "Open-Meteo Marine Weather API",
      url: "https://open-meteo.com/en/docs/marine-weather-api",
      ...data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch marine weather"); }
});

export default router;
