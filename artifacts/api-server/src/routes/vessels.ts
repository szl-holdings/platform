import { Router, type IRouter } from "express";
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

export default router;
