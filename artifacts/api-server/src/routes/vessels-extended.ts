import { Router, type IRouter } from "express";
import {
  db,
  voyagesTable,
  fleetExceptionsTable,
  corridorsTable,
  vesselMaintenanceTable,
  portsTable,
  insertVoyageSchema,
  insertFleetExceptionSchema,
  insertVesselMaintenanceSchema,
  vesselsTable,
  vesselsFleetsTable,
  vesselsAlertsTable,
} from "@workspace/db";
import { eq, desc, and, sql, ne } from "drizzle-orm";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendNoContent,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { requireFeatureFlag } from "../middlewares/feature-flag";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/dashboard", authMiddleware(), async (_req, res) => {
  try {
    const [
      vesselCount,
      activeExceptions,
      pendingMaintenance,
      activeVoyages,
      recentExceptions,
      fleetSummary,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(vesselsTable).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(fleetExceptionsTable).where(eq(fleetExceptionsTable.status, "active")).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(vesselMaintenanceTable).where(eq(vesselMaintenanceTable.status, "overdue")).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(voyagesTable).where(eq(voyagesTable.status, "at_sea")).then(r => r[0]?.count ?? 0),
      db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.status, "active")).orderBy(desc(fleetExceptionsTable.detectedAt)).limit(5),
      db.select().from(vesselsFleetsTable).limit(10),
    ]);
    sendSuccess(res, {
      summary: {
        totalVessels: vesselCount,
        activeExceptions,
        overdueMaintenanceItems: pendingMaintenance,
        activeVoyages,
      },
      recentExceptions,
      fleetSummary,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build vessels dashboard");
  }
});

router.get("/fleet-summary", authMiddleware(), async (_req, res) => {
  try {
    const fleets = await db.select().from(vesselsFleetsTable).orderBy(vesselsFleetsTable.name);
    const vessels = await db.select().from(vesselsTable).orderBy(vesselsTable.name);
    const exceptions = await db.select().from(fleetExceptionsTable).where(ne(fleetExceptionsTable.status, "resolved"));
    const summary = fleets.map(fleet => {
      const fleetVessels = vessels.filter(v => v.fleetId === fleet.id);
      const fleetExceptionCount = exceptions.filter(e => fleetVessels.some(v => v.id === e.vesselId)).length;
      return {
        ...fleet,
        vesselCount: fleetVessels.length,
        activeExceptions: fleetExceptionCount,
        vessels: fleetVessels,
      };
    });
    sendSuccess(res, { fleets: summary, totalVessels: vessels.length, totalExceptions: exceptions.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to build fleet summary");
  }
});

router.get("/map-payload", authMiddleware(), async (_req, res) => {
  try {
    const vessels = await db.select().from(vesselsTable).limit(50);
    const exceptions = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.status, "active"));
    const voyages = await db.select().from(voyagesTable).where(eq(voyagesTable.status, "at_sea")).limit(20);
    sendSuccess(res, {
      vessels: vessels.map(v => ({
        id: v.id,
        name: v.name,
        imo: v.imo,
        status: v.status,
        vesselType: v.vesselType,
        flag: v.flag,
      })),
      activeExceptions: exceptions.length,
      activeVoyages: voyages.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build map payload");
  }
});

router.get("/voyages", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(voyagesTable).orderBy(desc(voyagesTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(voyagesTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list voyages");
  }
});

router.get("/voyages/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(voyagesTable).where(eq(voyagesTable.id, id));
    if (!row) { sendNotFound(res, "Voyage"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get voyage");
  }
});

router.post("/voyages", requireFeatureFlag("vessels_command_mode_enabled"), authMiddleware(), async (req, res) => {
  try {
    const data = insertVoyageSchema.parse(req.body);
    const [row] = await db.insert(voyagesTable).values(data).returning();
    sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create voyage");
  }
});

router.patch("/voyages/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(voyagesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(voyagesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Voyage"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update voyage");
  }
});

router.get("/exceptions", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const query = db.select().from(fleetExceptionsTable).orderBy(desc(fleetExceptionsTable.detectedAt)).limit(limit).offset(offset);
    const rows = await query;
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(fleetExceptionsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list exceptions");
  }
});

router.get("/exceptions/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.id, id));
    if (!row) { sendNotFound(res, "Exception"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get exception");
  }
});

router.post("/exceptions", requireFeatureFlag("vessels_command_mode_enabled"), authMiddleware(), async (req, res) => {
  try {
    const data = insertFleetExceptionSchema.parse(req.body);
    const [row] = await db.insert(fleetExceptionsTable).values(data).returning();
    sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create exception");
  }
});

router.post("/exceptions/:id/acknowledge", requireFeatureFlag("vessels_command_mode_enabled"), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [exc] = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.id, id));
    if (!exc) { sendNotFound(res, "Exception"); return; }
    if (exc.status !== "active") { sendBadRequest(res, "Only active exceptions can be acknowledged"); return; }
    const [row] = await db.update(fleetExceptionsTable).set({
      status: "acknowledged",
      acknowledgedAt: new Date(),
      acknowledgedBy: req.user?.id ?? null,
      updatedAt: new Date(),
    }).where(eq(fleetExceptionsTable.id, id)).returning();
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to acknowledge exception");
  }
});

router.post("/exceptions/:id/resolve", requireFeatureFlag("vessels_command_mode_enabled"), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [exc] = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.id, id));
    if (!exc) { sendNotFound(res, "Exception"); return; }
    if (exc.status === "resolved") { sendBadRequest(res, "Exception is already resolved"); return; }
    const [row] = await db.update(fleetExceptionsTable).set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: req.user?.id ?? null,
      resolutionNotes: req.body.notes ?? null,
      updatedAt: new Date(),
    }).where(eq(fleetExceptionsTable.id, id)).returning();
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve exception");
  }
});

router.post("/exceptions/:id/escalate", requireFeatureFlag("vessels_command_mode_enabled"), authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [exc] = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.id, id));
    if (!exc) { sendNotFound(res, "Exception"); return; }
    const newSeverity = exc.severity === "watch" ? "high" : exc.severity === "high" ? "critical" : exc.severity;
    const [row] = await db.update(fleetExceptionsTable).set({
      severity: newSeverity,
      updatedAt: new Date(),
      metadata: { ...(exc.metadata as Record<string, unknown> ?? {}), escalatedAt: new Date().toISOString(), escalatedBy: req.user?.displayName ?? "system" },
    }).where(eq(fleetExceptionsTable.id, id)).returning();
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate exception");
  }
});

router.get("/corridors", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(corridorsTable).orderBy(corridorsTable.name).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(corridorsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list corridors");
  }
});

router.get("/corridors/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(corridorsTable).where(eq(corridorsTable.id, id));
    if (!row) { sendNotFound(res, "Corridor"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get corridor");
  }
});

router.get("/maintenance", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(vesselMaintenanceTable).orderBy(desc(vesselMaintenanceTable.dueDate)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(vesselMaintenanceTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list maintenance items");
  }
});

router.get("/:id/maintenance", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const items = await db.select().from(vesselMaintenanceTable).where(eq(vesselMaintenanceTable.vesselId, id)).orderBy(desc(vesselMaintenanceTable.dueDate));
    sendSuccess(res, items);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel maintenance");
  }
});

router.get("/:id/voyages", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const voyages = await db.select().from(voyagesTable).where(eq(voyagesTable.vesselId, id)).orderBy(desc(voyagesTable.createdAt));
    sendSuccess(res, voyages);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel voyages");
  }
});

router.get("/:id/exceptions", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const exceptions = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.vesselId, id)).orderBy(desc(fleetExceptionsTable.detectedAt));
    sendSuccess(res, exceptions);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel exceptions");
  }
});

router.get("/ports", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(portsTable).orderBy(portsTable.name).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(portsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list ports");
  }
});

router.get("/readiness", authMiddleware(), async (_req, res) => {
  try {
    const vessels = await db.select().from(vesselsTable).limit(20);
    const maintenanceItems = await db.select().from(vesselMaintenanceTable).where(eq(vesselMaintenanceTable.status, "overdue"));
    const activeExceptions = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.status, "active"));
    const readyVessels = vessels.filter(v => !maintenanceItems.some(m => m.vesselId === v.id) && !activeExceptions.some(e => e.vesselId === v.id && (e.severity === "critical" || e.severity === "high")));
    sendSuccess(res, {
      totalVessels: vessels.length,
      readyVessels: readyVessels.length,
      readinessScore: vessels.length > 0 ? Math.round((readyVessels.length / vessels.length) * 100) : 0,
      overdueMaintenanceCount: maintenanceItems.length,
      criticalExceptionCount: activeExceptions.filter(e => e.severity === "critical").length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build vessels readiness");
  }
});

export default router;
