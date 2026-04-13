import { Router, type IRouter, type RequestHandler } from "express";
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
  vesselsEventsTable,
  vesselsCommandWorkflowsTable,
  insertVesselFleetSchema,
  insertVesselSchema,
  insertVesselRouteSchema,
  insertVesselAlertRuleSchema,
  insertVesselSimulationSchema,
  insertVesselsExceptionEventSchema,
  insertVesselCommandWorkflowSchema,
} from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { broadcastWs, pubsub, VESSELS_EVENTS } from "../lib/pubsub-bridge";

const router: IRouter = Router();

router.get("/vessels/fleets", authMiddleware(), async (_req, res) => {
  try {
    const fleets = await db.select().from(vesselsFleetsTable).orderBy(desc(vesselsFleetsTable.createdAt));
    sendSuccess(res, fleets);
  } catch (err) {
    handleRouteError(res, err, "Failed to list fleets");
  }
});

router.get("/vessels/fleets/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [fleet] = await db.select().from(vesselsFleetsTable).where(eq(vesselsFleetsTable.id, id));
    if (!fleet) { sendNotFound(res, "Fleet"); return; }
    sendSuccess(res, fleet);
  } catch (err) {
    handleRouteError(res, err, "Failed to get fleet");
  }
});

router.post("/vessels/fleets", authMiddleware(), requireRole("ops", "exec", "admin", "editor"), async (req, res) => {
  try {
    const data = insertVesselFleetSchema.parse(req.body);
    const [fleet] = await db.insert(vesselsFleetsTable).values(data).returning();
    sendCreated(res, fleet);
  } catch (err) {
    handleRouteError(res, err, "Failed to create fleet");
  }
});

router.put("/vessels/fleets/:id", authMiddleware(), requireRole("ops", "exec", "admin", "editor"), async (req, res) => {
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

router.delete("/vessels/fleets/:id", authMiddleware(), requireRole("ops", "exec", "admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [fleet] = await db.delete(vesselsFleetsTable).where(eq(vesselsFleetsTable.id, id)).returning();
    if (!fleet) { sendNotFound(res, "Fleet"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete fleet");
  }
});

router.get("/vessels", authMiddleware(), async (_req, res) => {
  try {
    const vessels = await db.select().from(vesselsTable).orderBy(desc(vesselsTable.createdAt));
    sendSuccess(res, vessels);
  } catch (err) {
    handleRouteError(res, err, "Failed to list vessels");
  }
});

router.get("/vessels/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [vessel] = await db.select().from(vesselsTable).where(eq(vesselsTable.id, id));
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendSuccess(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel");
  }
});

router.post("/vessels", authMiddleware(), requireRole("ops", "exec", "admin", "editor"), async (req, res) => {
  try {
    const data = insertVesselSchema.parse(req.body);
    const [vessel] = await db.insert(vesselsTable).values(data).returning();
    sendCreated(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to create vessel");
  }
});

router.put("/vessels/:id", authMiddleware(), requireRole("ops", "exec", "admin", "editor"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const data = insertVesselSchema.partial().parse(req.body);
    const [vessel] = await db.update(vesselsTable).set({ ...data, updatedAt: new Date() }).where(eq(vesselsTable.id, id)).returning();
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    broadcastWs("vessel-positions", "vessel-updated", { id: vessel.id, status: vessel.status });
    const [latestPos] = await db.select().from(vesselsPositionsTable).where(eq(vesselsPositionsTable.vesselId, vessel.id)).orderBy(desc(vesselsPositionsTable.recordedAt)).limit(1);
    if (latestPos) {
      void pubsub.publish(VESSELS_EVENTS.POSITION_UPDATED, { vesselPositionUpdated: latestPos });
    }
    sendSuccess(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to update vessel");
  }
});

router.delete("/vessels/:id", authMiddleware(), requireRole("ops", "exec", "admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [vessel] = await db.delete(vesselsTable).where(eq(vesselsTable.id, id)).returning();
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete vessel");
  }
});

router.get("/vessels/:id/positions", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const positions = await db.select().from(vesselsPositionsTable).where(eq(vesselsPositionsTable.vesselId, id)).orderBy(desc(vesselsPositionsTable.recordedAt));
    sendSuccess(res, positions);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel positions");
  }
});

router.get("/vessels/:id/cargo", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const cargo = await db.select().from(vesselsCargoTable).where(eq(vesselsCargoTable.vesselId, id)).orderBy(desc(vesselsCargoTable.createdAt));
    sendSuccess(res, cargo);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel cargo");
  }
});

router.get("/vessels/routes/all", authMiddleware(), async (_req, res) => {
  try {
    const routes = await db.select().from(vesselsRoutesTable).orderBy(desc(vesselsRoutesTable.createdAt));
    sendSuccess(res, routes);
  } catch (err) {
    handleRouteError(res, err, "Failed to list routes");
  }
});

router.get("/vessels/:id/routes", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const routes = await db.select().from(vesselsRoutesTable).where(eq(vesselsRoutesTable.vesselId, id)).orderBy(desc(vesselsRoutesTable.createdAt));
    sendSuccess(res, routes);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel routes");
  }
});

router.post("/vessels/routes", authMiddleware(), requireRole("ops", "exec", "admin", "editor"), async (req, res) => {
  try {
    const data = insertVesselRouteSchema.parse(req.body);
    const [route] = await db.insert(vesselsRoutesTable).values(data).returning();
    sendCreated(res, route);
  } catch (err) {
    handleRouteError(res, err, "Failed to create route");
  }
});

router.put("/vessels/routes/:id", authMiddleware(), requireRole("ops", "exec", "admin", "editor"), async (req, res) => {
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

router.delete("/vessels/routes/:id", authMiddleware(), requireRole("ops", "exec", "admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [route] = await db.delete(vesselsRoutesTable).where(eq(vesselsRoutesTable.id, id)).returning();
    if (!route) { sendNotFound(res, "Route"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete route");
  }
});

router.get("/vessels/alert-rules/all", authMiddleware(), async (_req, res) => {
  try {
    const rules = await db.select().from(vesselsAlertRulesTable).orderBy(desc(vesselsAlertRulesTable.createdAt));
    sendSuccess(res, rules);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alert rules");
  }
});

router.post("/vessels/alert-rules", authMiddleware(), requireRole("ops", "exec", "admin", "editor"), async (req, res) => {
  try {
    const data = insertVesselAlertRuleSchema.parse(req.body);
    const [rule] = await db.insert(vesselsAlertRulesTable).values(data).returning();
    sendCreated(res, rule);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert rule");
  }
});

router.put("/vessels/alert-rules/:id", authMiddleware(), requireRole("ops", "exec", "admin", "editor"), async (req, res) => {
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

router.delete("/vessels/alert-rules/:id", authMiddleware(), requireRole("ops", "exec", "admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [rule] = await db.delete(vesselsAlertRulesTable).where(eq(vesselsAlertRulesTable.id, id)).returning();
    if (!rule) { sendNotFound(res, "Alert Rule"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete alert rule");
  }
});

router.get("/vessels/alerts/all", authMiddleware(), async (_req, res) => {
  try {
    const alerts = await db.select().from(vesselsAlertsTable).orderBy(desc(vesselsAlertsTable.triggeredAt));
    sendSuccess(res, alerts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alerts");
  }
});

router.get("/vessels/weather/snapshots", authMiddleware(), async (req, res) => {
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

router.get("/vessels/simulations/all", authMiddleware(), async (_req, res) => {
  try {
    const simulations = await db.select().from(vesselsSimulationsTable).orderBy(desc(vesselsSimulationsTable.createdAt));
    sendSuccess(res, simulations);
  } catch (err) {
    handleRouteError(res, err, "Failed to list simulations");
  }
});

router.post("/vessels/simulations", authMiddleware(), requireRole("ops", "exec", "admin", "analyst"), async (req, res) => {
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
      } catch (simErr) {
        console.error("[Vessels] Failed to update simulation result:", simErr);
      }
    }, 3000);

    sendCreated(res, simulation);
  } catch (err) {
    handleRouteError(res, err, "Failed to create simulation");
  }
});

router.get("/vessels/simulations/:id", authMiddleware(), async (req, res) => {
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
}) as unknown as RequestHandler;

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

router.get("/vessels/live/chokepoints", vesselsLiveLimit, authMiddleware(), async (_req, res) => {
  try {
    const gdeltSignals = await getVesCached("vessels-chokepoints-gdelt", 3600000, async () => {
      const raw = await fetchVesJson(
        "https://api.gdeltproject.org/api/v2/geo/geo?query=maritime+chokepoint+shipping&mode=pointdata&format=json&maxrows=5",
        8000,
      ) as any;
      if (raw?.features?.length > 0) {
        return raw.features.slice(0, 5).map((f: any) => ({
          location: f.geometry?.coordinates,
          event: f.properties?.name ?? "Maritime event",
          tone: f.properties?.avgtone ?? 0,
        }));
      }
      return [];
    }) as any[];
    sendSuccess(res, {
      status: "NOT_CONFIGURED",
      note: "Connect a live AIS or maritime intelligence provider (e.g. MarineTraffic, Spire, UKMTO) for real-time chokepoint risk data.",
      gdeltSignals: gdeltSignals ?? [],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch chokepoint data"); }
});

router.get("/vessels/live/geopolitical-events", vesselsLiveLimit, authMiddleware(), async (_req, res) => {
  try {
    const gdeltArticles = await getVesCached("vessels-geopolitical-gdelt", 600000, async () => {
      const raw = await fetchVesJson(
        "https://api.gdeltproject.org/api/v2/doc/doc?query=maritime+ship+naval&mode=artlist&format=json&maxrecords=8&sortby=date&sourcelang=eng",
        10000,
      ) as any;
      const articles = raw?.articles;
      if (Array.isArray(articles) && articles.length > 0) {
        return articles.slice(0, 5).map((a: any) => ({
          title: a.title, url: a.url, source: a.domain, publishedAt: a.seendate,
          sentiment: a.tone < 0 ? "negative" : a.tone > 2 ? "positive" : "neutral",
          toneScore: a.tone,
        }));
      }
      return [];
    }) as any[];
    sendSuccess(res, {
      status: gdeltArticles.length > 0 ? "live" : "NOT_CONFIGURED",
      note: gdeltArticles.length === 0
        ? "No live GDELT maritime articles available. Connect a maritime threat intelligence feed (e.g. NATO Shipping Centre, UKMTO, IMB) for curated geopolitical event data."
        : undefined,
      source: "GDELT Maritime Geopolitical Intelligence",
      url: "https://www.gdeltproject.org/",
      gdeltArticles,
      liveArticles: gdeltArticles.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch geopolitical events"); }
});

router.get("/vessels/live/port-congestion", vesselsLiveLimit, authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      status: "NOT_CONFIGURED",
      note: "Connect a live AIS or port authority data provider (e.g. MarineTraffic, PortWatch, IHS Markit) for real-time port congestion data.",
      count: 0,
      ports: [],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch port congestion data"); }
});

router.get("/vessels/live/weather-marine", vesselsLiveLimit, authMiddleware(), async (req, res) => {
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

router.get("/vessels/events", authMiddleware(), async (req, res) => {
  try {
    const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;
    const status = req.query.status as string | undefined;
    const events = await db.select().from(vesselsEventsTable).orderBy(desc(vesselsEventsTable.occurredAt));
    const filtered = events.filter(e => {
      if (vesselId && e.vesselId !== vesselId) return false;
      if (status && e.status !== status) return false;
      return true;
    });
    sendSuccess(res, filtered);
  } catch (err) { handleRouteError(res, err, "Failed to list vessel events"); }
});

router.get("/vessels/:id/events", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const events = await db.select().from(vesselsEventsTable).where(eq(vesselsEventsTable.vesselId, id)).orderBy(desc(vesselsEventsTable.occurredAt));
    sendSuccess(res, events);
  } catch (err) { handleRouteError(res, err, "Failed to list vessel events"); }
});

router.post("/vessels/events", authMiddleware(), async (req, res) => {
  try {
    const data = insertVesselsExceptionEventSchema.parse(req.body);
    const [event] = await db.insert(vesselsEventsTable).values(data).returning();
    sendCreated(res, event);
  } catch (err) { handleRouteError(res, err, "Failed to create vessel event"); }
});

router.patch("/vessels/events/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { status, assignedTo, ...rest } = req.body;
    const updateData: Record<string, unknown> = { ...rest };
    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status === "acknowledged") updateData.acknowledgedAt = new Date();
    if (status === "resolved") updateData.resolvedAt = new Date();
    const [event] = await db.update(vesselsEventsTable).set(updateData).where(eq(vesselsEventsTable.id, id)).returning();
    if (!event) { sendNotFound(res, "Vessel event"); return; }
    sendSuccess(res, event);
  } catch (err) { handleRouteError(res, err, "Failed to update vessel event"); }
});

router.get("/vessels/command-workflows", authMiddleware(), async (req, res) => {
  try {
    const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;
    const status = req.query.status as string | undefined;
    const workflows = await db.select().from(vesselsCommandWorkflowsTable).orderBy(desc(vesselsCommandWorkflowsTable.createdAt));
    const filtered = workflows.filter(w => {
      if (vesselId && w.vesselId !== vesselId) return false;
      if (status && w.status !== status) return false;
      return true;
    });
    sendSuccess(res, filtered);
  } catch (err) { handleRouteError(res, err, "Failed to list command workflows"); }
});

router.post("/vessels/command-workflows", authMiddleware(), async (req, res) => {
  try {
    const data = insertVesselCommandWorkflowSchema.parse(req.body);
    const [workflow] = await db.insert(vesselsCommandWorkflowsTable).values(data).returning();
    sendCreated(res, workflow);
  } catch (err) { handleRouteError(res, err, "Failed to create command workflow"); }
});

router.patch("/vessels/command-workflows/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { status, assignedTo, notes, ...rest } = req.body;
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "completed") updateData.completedAt = new Date();
    const [workflow] = await db.update(vesselsCommandWorkflowsTable).set(updateData).where(eq(vesselsCommandWorkflowsTable.id, id)).returning();
    if (!workflow) { sendNotFound(res, "Command workflow"); return; }
    sendSuccess(res, workflow);
  } catch (err) { handleRouteError(res, err, "Failed to update command workflow"); }
});

export default router;
