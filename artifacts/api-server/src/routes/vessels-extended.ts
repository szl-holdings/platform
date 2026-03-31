import { Router, type IRouter } from "express";
import {
  db,
  voyagesTable,
  fleetExceptionsTable,
  corridorsTable,
  vesselMaintenanceTable,
  vesselSanctionsScreeningTable,
  vesselPortCallsTable,
  vesselVoyageEconomicsTable,
  portsTable,
  insertFleetExceptionSchema,
  insertVesselMaintenanceSchema,
  vesselsTable,
  vesselsFleetsTable,
  vesselsPositionsTable,
  type FleetException,
  type VesselMaintenance,
  type VesselSanctionsScreening,
  type VesselPortCall,
  type VesselVoyageEconomics,
} from "@workspace/db";
import { eq, desc, and, sql, type SQL } from "drizzle-orm";
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
import { adminGuard } from "../middlewares/admin-guard";
import { logger } from "../lib/logger";
import { seedVesselsData } from "../lib/seed-vessels";

const router: IRouter = Router();

// ── Fleet dashboard analytics ────────────────────────────────────────────────

router.get("/vessels/dashboard", authMiddleware(), async (_req, res) => {
  try {
    const [
      vesselCount,
      activeExceptions,
      pendingMaintenance,
      activeVoyages,
      recentExceptions,
      fleetSummary,
      statusDistribution,
      typeDistribution,
      flagDistribution,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(vesselsTable).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(fleetExceptionsTable).where(eq(fleetExceptionsTable.status, "active")).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(vesselMaintenanceTable).where(eq(vesselMaintenanceTable.status, "overdue")).then(r => r[0]?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(vesselVoyageEconomicsTable).where(eq(vesselVoyageEconomicsTable.status, "at_sea")).then(r => r[0]?.count ?? 0),
      db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.status, "active")).orderBy(desc(fleetExceptionsTable.detectedAt)).limit(5),
      db.select().from(vesselsFleetsTable).limit(10),
      db.select({ status: vesselsTable.status, count: sql<number>`count(*)::int` }).from(vesselsTable).groupBy(vesselsTable.status),
      db.select({ type: vesselsTable.vesselType, count: sql<number>`count(*)::int` }).from(vesselsTable).groupBy(vesselsTable.vesselType),
      db.select({ flag: vesselsTable.flag, count: sql<number>`count(*)::int` }).from(vesselsTable).groupBy(vesselsTable.flag).orderBy(desc(sql<number>`count(*)`)).limit(10),
    ]);

    const ageDistribution = await db.select({
      yearBuilt: vesselsTable.yearBuilt,
      count: sql<number>`count(*)::int`,
    }).from(vesselsTable).where(sql`year_built is not null`).groupBy(vesselsTable.yearBuilt).orderBy(vesselsTable.yearBuilt);

    const ageBuckets: Record<string, number> = {};
    for (const row of ageDistribution) {
      if (!row.yearBuilt) continue;
      const decade = `${Math.floor(row.yearBuilt / 10) * 10}s`;
      ageBuckets[decade] = (ageBuckets[decade] ?? 0) + row.count;
    }

    const [voyageMetrics] = await db.select({
      totalRevenue: sql<number>`coalesce(sum(gross_revenue), 0)::float`,
      totalCosts: sql<number>`coalesce(sum(total_costs_usd), 0)::float`,
      totalMargin: sql<number>`coalesce(sum(net_margin_usd), 0)::float`,
      avgMarginPct: sql<number>`coalesce(avg(margin_pct), 0)::float`,
      completedVoyages: sql<number>`count(*)::int`,
    }).from(vesselVoyageEconomicsTable).where(eq(vesselVoyageEconomicsTable.status, "completed"));

    const atSea = statusDistribution.find(s => s.status === "at_sea")?.count ?? 0;
    const utilizationRate = vesselCount > 0 ? Math.round((atSea / vesselCount) * 100) : 0;

    sendSuccess(res, {
      summary: {
        totalVessels: vesselCount,
        activeExceptions,
        overdueMaintenanceItems: pendingMaintenance,
        activeVoyages,
        utilizationRate,
      },
      statusDistribution,
      typeDistribution,
      flagDistribution,
      ageBuckets,
      recentExceptions,
      fleetSummary,
      economics: voyageMetrics ? {
        totalRevenue: voyageMetrics.totalRevenue,
        totalCosts: voyageMetrics.totalCosts,
        totalMargin: voyageMetrics.totalMargin,
        avgMarginPct: voyageMetrics.avgMarginPct,
        completedVoyages: voyageMetrics.completedVoyages,
      } : null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build fleet dashboard");
  }
});

// ── Fleet summary (vessels list) ─────────────────────────────────────────────

router.get("/vessels/fleet-summary", authMiddleware(), async (_req, res) => {
  try {
    const vessels = await db.select().from(vesselsTable).orderBy(vesselsTable.name).limit(100);
    sendSuccess(res, vessels);
  } catch (err) {
    handleRouteError(res, err, "Failed to get fleet summary");
  }
});

// ── Enriched vessel roster (vessels + latest position + active voyage + exception count) ──

router.get("/vessels/roster", authMiddleware(), async (_req, res) => {
  try {
    const vessels = await db.select().from(vesselsTable).orderBy(vesselsTable.name).limit(200);

    const [positions, activeVoyages, exceptionCounts] = await Promise.all([
      db.select({
        vesselId: vesselsPositionsTable.vesselId,
        latitude: vesselsPositionsTable.latitude,
        longitude: vesselsPositionsTable.longitude,
        heading: vesselsPositionsTable.heading,
        speed: vesselsPositionsTable.speed,
        recordedAt: vesselsPositionsTable.recordedAt,
      }).from(vesselsPositionsTable),

      db.select({
        vesselId: vesselVoyageEconomicsTable.vesselId,
        destinationPort: vesselVoyageEconomicsTable.destinationPort,
        estimatedArrivalAt: vesselVoyageEconomicsTable.estimatedArrivalAt,
        charterType: vesselVoyageEconomicsTable.charterType,
        voyageRef: vesselVoyageEconomicsTable.voyageRef,
        grossRevenue: vesselVoyageEconomicsTable.grossRevenue,
        marginPct: vesselVoyageEconomicsTable.marginPct,
        tcePerDay: vesselVoyageEconomicsTable.tcePerDay,
        originPort: vesselVoyageEconomicsTable.originPort,
        cargoType: vesselVoyageEconomicsTable.cargoType,
      }).from(vesselVoyageEconomicsTable)
        .where(eq(vesselVoyageEconomicsTable.status, "at_sea")),

      db.select({
        vesselId: fleetExceptionsTable.vesselId,
        count: sql<number>`count(*)::int`,
      }).from(fleetExceptionsTable)
        .where(eq(fleetExceptionsTable.status, "active"))
        .groupBy(fleetExceptionsTable.vesselId),
    ]);

    const posMap = new Map(positions.map(p => [p.vesselId, p]));
    const voyageMap = new Map<number, typeof activeVoyages[0]>();
    for (const v of activeVoyages) {
      if (v.vesselId !== null && !voyageMap.has(v.vesselId)) {
        voyageMap.set(v.vesselId, v);
      }
    }
    const excMap = new Map(exceptionCounts.map(e => [e.vesselId ?? 0, e.count]));

    const roster = vessels.map(v => {
      const pos = posMap.get(v.id);
      const voy = voyageMap.get(v.id);
      const excCount = excMap.get(v.id) ?? 0;
      return {
        id: v.id,
        name: v.name,
        imo: v.imo,
        mmsi: v.mmsi,
        flag: v.flag,
        vesselType: v.vesselType,
        status: v.status,
        yearBuilt: v.yearBuilt,
        grossTonnage: v.grossTonnage,
        latitude: pos?.latitude ?? null,
        longitude: pos?.longitude ?? null,
        heading: pos?.heading ?? null,
        speed: pos?.speed ?? null,
        positionRecordedAt: pos?.recordedAt ?? null,
        destination: voy?.destinationPort ?? null,
        origin: voy?.originPort ?? null,
        eta: voy?.estimatedArrivalAt ?? null,
        cargoType: voy?.cargoType ?? null,
        charterType: voy?.charterType ?? null,
        voyageRef: voy?.voyageRef ?? null,
        tcePerDay: voy?.tcePerDay ?? null,
        marginPct: voy?.marginPct ?? null,
        activeExceptions: excCount,
      };
    });

    sendSuccess(res, roster);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel roster");
  }
});

// ── Vessel detail (enriched single vessel) ───────────────────────────────────

router.get("/vessels/:id/detail", authMiddleware(), async (req, res) => {
  try {
    const vesselId = parseIdParam(req.params["id"]);
    if (!vesselId) return sendBadRequest(res, "Invalid vessel id");

    const [vessels, positions, voyages, maintenance, portCalls, exceptions, sanctions] = await Promise.all([
      db.select().from(vesselsTable).where(eq(vesselsTable.id, vesselId)).limit(1),
      db.select().from(vesselsPositionsTable)
        .where(eq(vesselsPositionsTable.vesselId, vesselId))
        .orderBy(desc(vesselsPositionsTable.recordedAt)).limit(1),
      db.select().from(vesselVoyageEconomicsTable)
        .where(eq(vesselVoyageEconomicsTable.vesselId, vesselId))
        .orderBy(desc(vesselVoyageEconomicsTable.scheduledDepartureAt)).limit(10),
      db.select().from(vesselMaintenanceTable)
        .where(eq(vesselMaintenanceTable.vesselId, vesselId))
        .orderBy(desc(vesselMaintenanceTable.createdAt)).limit(20),
      db.select().from(vesselPortCallsTable)
        .where(eq(vesselPortCallsTable.vesselId, vesselId))
        .orderBy(desc(vesselPortCallsTable.arrivalAt)).limit(10),
      db.select().from(fleetExceptionsTable)
        .where(and(eq(fleetExceptionsTable.vesselId, vesselId), eq(fleetExceptionsTable.status, "active")))
        .orderBy(desc(fleetExceptionsTable.detectedAt)).limit(10),
      db.select().from(vesselSanctionsScreeningTable)
        .where(eq(vesselSanctionsScreeningTable.vesselId, vesselId))
        .orderBy(desc(vesselSanctionsScreeningTable.screeningDate)).limit(1),
    ]);

    const vessel = vessels[0];
    if (!vessel) return sendNotFound(res, "Vessel not found");

    const pos = positions[0];
    const latestSanction = sanctions[0];
    const activeVoyage = voyages.find(v => v.status === "at_sea") ?? voyages[0];

    sendSuccess(res, {
      vessel,
      position: pos ?? null,
      activeVoyage: activeVoyage ?? null,
      voyageHistory: voyages,
      maintenance,
      portCalls,
      exceptions,
      sanctions: latestSanction ?? null,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel detail");
  }
});

// ── Map payload ──────────────────────────────────────────────────────────────

router.get("/vessels/map-payload", authMiddleware(), async (_req, res) => {
  try {
    const vessels = await db.select({
      id: vesselsTable.id,
      name: vesselsTable.name,
      imo: vesselsTable.imo,
      mmsi: vesselsTable.mmsi,
      vesselType: vesselsTable.vesselType,
      flag: vesselsTable.flag,
      status: vesselsTable.status,
      latitude: vesselsPositionsTable.latitude,
      longitude: vesselsPositionsTable.longitude,
      heading: vesselsPositionsTable.heading,
      speed: vesselsPositionsTable.speed,
      recordedAt: vesselsPositionsTable.recordedAt,
    }).from(vesselsTable)
      .innerJoin(
        vesselsPositionsTable,
        eq(vesselsPositionsTable.vesselId, vesselsTable.id)
      )
      .limit(100);
    sendSuccess(res, vessels);
  } catch (err) {
    handleRouteError(res, err, "Failed to get map payload");
  }
});

// ── Voyage Economics ─────────────────────────────────────────────────────────

router.get("/vessels/voyage-economics", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const statusFilter = req.query["status"] as VesselVoyageEconomics["status"] | undefined;
    const vesselIdFilter = req.query["vesselId"] ? parseInt(req.query["vesselId"] as string, 10) : undefined;

    const conditions: SQL[] = [];
    if (statusFilter) conditions.push(eq(vesselVoyageEconomicsTable.status, statusFilter));
    if (vesselIdFilter && !isNaN(vesselIdFilter)) conditions.push(eq(vesselVoyageEconomicsTable.vesselId, vesselIdFilter));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      db.select().from(vesselVoyageEconomicsTable)
        .where(whereClause)
        .orderBy(desc(vesselVoyageEconomicsTable.createdAt))
        .limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(vesselVoyageEconomicsTable).where(whereClause),
    ]);

    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list voyage economics");
  }
});

router.get("/vessels/voyage-economics/analytics", authMiddleware(), async (_req, res) => {
  try {
    const [revenueByMonth, topRoutes, utilizationTrend] = await Promise.all([
      db.select({
        month: sql<string>`to_char(scheduled_departure_at, 'YYYY-MM')`,
        revenue: sql<number>`coalesce(sum(gross_revenue), 0)::float`,
        costs: sql<number>`coalesce(sum(total_costs_usd), 0)::float`,
        margin: sql<number>`coalesce(sum(net_margin_usd), 0)::float`,
        voyages: sql<number>`count(*)::int`,
      }).from(vesselVoyageEconomicsTable)
        .where(sql`scheduled_departure_at >= now() - interval '12 months'`)
        .groupBy(sql`to_char(scheduled_departure_at, 'YYYY-MM')`)
        .orderBy(sql`to_char(scheduled_departure_at, 'YYYY-MM')`),

      db.select({
        route: sql<string>`concat(origin_port, ' → ', destination_port)`,
        voyages: sql<number>`count(*)::int`,
        avgMargin: sql<number>`coalesce(avg(net_margin_usd), 0)::float`,
        totalRevenue: sql<number>`coalesce(sum(gross_revenue), 0)::float`,
        avgTce: sql<number>`coalesce(avg(tce_per_day), 0)::float`,
      }).from(vesselVoyageEconomicsTable)
        .where(eq(vesselVoyageEconomicsTable.status, "completed"))
        .groupBy(sql`concat(origin_port, ' → ', destination_port)`)
        .orderBy(desc(sql<number>`sum(gross_revenue)`))
        .limit(10),

      db.select({
        status: vesselVoyageEconomicsTable.status,
        count: sql<number>`count(*)::int`,
        avgMarginPct: sql<number>`coalesce(avg(margin_pct), 0)::float`,
      }).from(vesselVoyageEconomicsTable)
        .groupBy(vesselVoyageEconomicsTable.status),
    ]);

    sendSuccess(res, { revenueByMonth, topRoutes, utilizationTrend });
  } catch (err) {
    handleRouteError(res, err, "Failed to get voyage economics analytics");
  }
});

router.get("/vessels/voyage-economics/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(vesselVoyageEconomicsTable).where(eq(vesselVoyageEconomicsTable.id, id));
    if (!row) { sendNotFound(res, "Voyage Economics Record"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get voyage economics");
  }
});

// ── Legacy Voyages (maritime.ts voyagesTable) ────────────────────────────────

router.get("/vessels/voyages", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(voyagesTable).orderBy(desc(voyagesTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(voyagesTable),
    ]);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list voyages");
  }
});

router.get("/vessels/voyages/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(voyagesTable).where(eq(voyagesTable.id, id));
    if (!row) { sendNotFound(res, "Voyage"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get voyage");
  }
});

// ── Exceptions ───────────────────────────────────────────────────────────────

router.get("/vessels/exceptions", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const statusFilter = req.query["status"] as FleetException["status"] | undefined;
    const severityFilter = req.query["severity"] as FleetException["severity"] | undefined;
    const typeFilter = req.query["type"] as FleetException["exceptionType"] | undefined;

    const conditions: SQL[] = [];
    if (statusFilter) conditions.push(eq(fleetExceptionsTable.status, statusFilter));
    if (severityFilter) conditions.push(eq(fleetExceptionsTable.severity, severityFilter));
    if (typeFilter) conditions.push(eq(fleetExceptionsTable.exceptionType, typeFilter));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseSelect = db.select({
      exception: fleetExceptionsTable,
      vesselName: vesselsTable.name,
    }).from(fleetExceptionsTable)
      .leftJoin(vesselsTable, eq(fleetExceptionsTable.vesselId, vesselsTable.id));

    const [rows, [{ count }]] = await Promise.all([
      baseSelect.where(whereClause).orderBy(desc(fleetExceptionsTable.detectedAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(fleetExceptionsTable).where(whereClause),
    ]);

    const data = rows.map(r => ({
      ...r.exception,
      vesselName: r.vesselName,
    }));

    sendSuccess(res, data, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list exceptions");
  }
});

router.get("/vessels/exceptions/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.id, id));
    if (!row) { sendNotFound(res, "Exception"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get exception");
  }
});

router.post("/vessels/exceptions", authMiddleware(), async (req, res) => {
  try {
    const data = insertFleetExceptionSchema.parse(req.body);
    const [row] = await db.insert(fleetExceptionsTable).values(data).returning();
    sendCreated(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to create exception");
  }
});

router.post("/vessels/exceptions/:id/acknowledge", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [exc] = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.id, id));
    if (!exc) { sendNotFound(res, "Exception"); return; }
    if (exc.status !== "active") { sendBadRequest(res, "Only active exceptions can be acknowledged"); return; }
    const [row] = await db.update(fleetExceptionsTable).set({
      status: "acknowledged",
      acknowledgedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(fleetExceptionsTable.id, id)).returning();
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to acknowledge exception");
  }
});

router.post("/vessels/exceptions/:id/resolve", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [exc] = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.id, id));
    if (!exc) { sendNotFound(res, "Exception"); return; }
    if (exc.status === "resolved") { sendBadRequest(res, "Exception is already resolved"); return; }
    const notes: string | null = typeof req.body?.notes === "string" ? req.body.notes : null;
    const [row] = await db.update(fleetExceptionsTable).set({
      status: "resolved",
      resolvedAt: new Date(),
      resolutionNotes: notes,
      updatedAt: new Date(),
    }).where(eq(fleetExceptionsTable.id, id)).returning();
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve exception");
  }
});

router.post("/vessels/exceptions/:id/escalate", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [exc] = await db.select().from(fleetExceptionsTable).where(eq(fleetExceptionsTable.id, id));
    if (!exc) { sendNotFound(res, "Exception"); return; }
    const severityUpgrade: Record<FleetException["severity"], FleetException["severity"]> = {
      watch: "high",
      high: "critical",
      critical: "critical",
      normal: "watch",
    };
    const newSeverity = severityUpgrade[exc.severity];
    const existingMeta = (exc.metadata && typeof exc.metadata === "object" && !Array.isArray(exc.metadata))
      ? exc.metadata as Record<string, unknown>
      : {};
    const [row] = await db.update(fleetExceptionsTable).set({
      severity: newSeverity,
      updatedAt: new Date(),
      metadata: { ...existingMeta, escalatedAt: new Date().toISOString() },
    }).where(eq(fleetExceptionsTable.id, id)).returning();
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate exception");
  }
});

// ── Corridors ────────────────────────────────────────────────────────────────

router.get("/vessels/corridors", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(corridorsTable).orderBy(corridorsTable.name).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(corridorsTable),
    ]);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list corridors");
  }
});

router.get("/vessels/corridors/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(corridorsTable).where(eq(corridorsTable.id, id));
    if (!row) { sendNotFound(res, "Corridor"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get corridor");
  }
});

// ── Maintenance ──────────────────────────────────────────────────────────────

router.get("/vessels/maintenance", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const statusFilter = req.query["status"] as VesselMaintenance["status"] | undefined;
    const vesselIdFilter = req.query["vesselId"] ? parseInt(req.query["vesselId"] as string, 10) : undefined;

    const conditions: SQL[] = [];
    if (statusFilter) conditions.push(eq(vesselMaintenanceTable.status, statusFilter));
    if (vesselIdFilter && !isNaN(vesselIdFilter)) conditions.push(eq(vesselMaintenanceTable.vesselId, vesselIdFilter));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseSelect = db.select({
      maintenance: vesselMaintenanceTable,
      vesselName: vesselsTable.name,
      vesselType: vesselsTable.vesselType,
      vesselFlag: vesselsTable.flag,
    }).from(vesselMaintenanceTable)
      .leftJoin(vesselsTable, eq(vesselMaintenanceTable.vesselId, vesselsTable.id));

    const [rows, [{ count }]] = await Promise.all([
      baseSelect.where(whereClause).orderBy(desc(vesselMaintenanceTable.dueDate)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(vesselMaintenanceTable).where(whereClause),
    ]);

    const data = rows.map(r => ({
      ...r.maintenance,
      vesselName: r.vesselName,
      vesselType: r.vesselType,
      vesselFlag: r.vesselFlag,
    }));

    sendSuccess(res, data, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list maintenance items");
  }
});

// ── Sanctions Screening ──────────────────────────────────────────────────────

router.get("/vessels/sanctions", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const ofacStatusFilter = req.query["ofacStatus"] as VesselSanctionsScreening["ofacStatus"] | undefined;
    const vesselIdFilter = req.query["vesselId"] ? parseInt(req.query["vesselId"] as string, 10) : undefined;

    const conditions: SQL[] = [];
    if (ofacStatusFilter) conditions.push(eq(vesselSanctionsScreeningTable.ofacStatus, ofacStatusFilter));
    if (vesselIdFilter && !isNaN(vesselIdFilter)) conditions.push(eq(vesselSanctionsScreeningTable.vesselId, vesselIdFilter));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseSelect = db.select({
      screening: vesselSanctionsScreeningTable,
      vesselName: vesselsTable.name,
      vesselType: vesselsTable.vesselType,
      vesselFlag: vesselsTable.flag,
      vesselImo: vesselsTable.imo,
      vesselMmsi: vesselsTable.mmsi,
    }).from(vesselSanctionsScreeningTable)
      .leftJoin(vesselsTable, eq(vesselSanctionsScreeningTable.vesselId, vesselsTable.id));

    const [rows, [{ count }]] = await Promise.all([
      baseSelect.where(whereClause).orderBy(desc(vesselSanctionsScreeningTable.screeningDate)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(vesselSanctionsScreeningTable).where(whereClause),
    ]);

    const data = rows.map(r => ({
      ...r.screening,
      vesselName: r.vesselName,
      vesselType: r.vesselType,
      vesselFlag: r.vesselFlag,
      vesselImo: r.vesselImo,
      vesselMmsi: r.vesselMmsi,
    }));

    sendSuccess(res, data, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list sanctions screening");
  }
});

router.get("/vessels/sanctions/summary", authMiddleware(), async (_req, res) => {
  try {
    const [ofacDistribution, pscDistribution, complianceStats] = await Promise.all([
      db.select({
        status: vesselSanctionsScreeningTable.ofacStatus,
        count: sql<number>`count(*)::int`,
      }).from(vesselSanctionsScreeningTable).groupBy(vesselSanctionsScreeningTable.ofacStatus),

      db.select({
        result: vesselSanctionsScreeningTable.pscResult,
        count: sql<number>`count(*)::int`,
        avgDeficiencies: sql<number>`coalesce(avg(psc_deficiencies), 0)::float`,
      }).from(vesselSanctionsScreeningTable).groupBy(vesselSanctionsScreeningTable.pscResult),

      db.select({
        avgScore: sql<number>`coalesce(avg(compliance_score::float), 0)`,
        minScore: sql<number>`coalesce(min(compliance_score::float), 0)`,
        maxScore: sql<number>`coalesce(max(compliance_score::float), 0)`,
        clearCount: sql<number>`count(*) filter (where ofac_status = 'clear')::int`,
        matchCount: sql<number>`count(*) filter (where ofac_status in ('match', 'partial_match'))::int`,
        opaqueCount: sql<number>`count(*) filter (where ownership_opaque = true)::int`,
      }).from(vesselSanctionsScreeningTable),
    ]);

    sendSuccess(res, {
      ofacDistribution,
      pscDistribution,
      stats: complianceStats[0] ?? {},
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get sanctions summary");
  }
});

router.get("/vessels/:id/sanctions", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(vesselSanctionsScreeningTable).where(eq(vesselSanctionsScreeningTable.vesselId, id));
    if (!row) { sendNotFound(res, "Sanctions Screening"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel sanctions");
  }
});

// ── Port Calls ───────────────────────────────────────────────────────────────

router.get("/vessels/port-calls", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const vesselIdFilter = req.query["vesselId"] ? parseInt(req.query["vesselId"] as string, 10) : undefined;
    const purposeFilter = req.query["purpose"] as VesselPortCall["purpose"] | undefined;

    const conditions: SQL[] = [];
    if (vesselIdFilter && !isNaN(vesselIdFilter)) conditions.push(eq(vesselPortCallsTable.vesselId, vesselIdFilter));
    if (purposeFilter) conditions.push(eq(vesselPortCallsTable.purpose, purposeFilter));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseSelect = db.select({
      portCall: vesselPortCallsTable,
      vesselName: vesselsTable.name,
      vesselType: vesselsTable.vesselType,
    }).from(vesselPortCallsTable)
      .leftJoin(vesselsTable, eq(vesselPortCallsTable.vesselId, vesselsTable.id));

    const [rows, [{ count }]] = await Promise.all([
      baseSelect.where(whereClause).orderBy(desc(vesselPortCallsTable.arrivalAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(vesselPortCallsTable).where(whereClause),
    ]);

    const data = rows.map(r => ({
      ...r.portCall,
      vesselName: r.vesselName,
      vesselType: r.vesselType,
    }));

    sendSuccess(res, data, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list port calls");
  }
});

router.get("/vessels/:id/port-calls", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const rows = await db.select().from(vesselPortCallsTable)
      .where(eq(vesselPortCallsTable.vesselId, id))
      .orderBy(desc(vesselPortCallsTable.arrivalAt))
      .limit(20);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel port calls");
  }
});

// ── Per-vessel sub-resources ─────────────────────────────────────────────────

router.get("/vessels/:id/maintenance", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const items = await db.select().from(vesselMaintenanceTable)
      .where(eq(vesselMaintenanceTable.vesselId, id))
      .orderBy(desc(vesselMaintenanceTable.dueDate));
    sendSuccess(res, items);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel maintenance");
  }
});

router.get("/vessels/:id/voyages", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const voyages = await db.select().from(vesselVoyageEconomicsTable)
      .where(eq(vesselVoyageEconomicsTable.vesselId, id))
      .orderBy(desc(vesselVoyageEconomicsTable.createdAt));
    sendSuccess(res, voyages);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel voyages");
  }
});

router.get("/vessels/:id/exceptions", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const exceptions = await db.select().from(fleetExceptionsTable)
      .where(eq(fleetExceptionsTable.vesselId, id))
      .orderBy(desc(fleetExceptionsTable.detectedAt));
    sendSuccess(res, exceptions);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel exceptions");
  }
});

// ── Ports ────────────────────────────────────────────────────────────────────

router.get("/vessels/ports", authMiddleware(), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(portsTable).orderBy(portsTable.name).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(portsTable),
    ]);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list ports");
  }
});

// ── Fleet Readiness ──────────────────────────────────────────────────────────

router.get("/vessels/readiness", authMiddleware(), async (_req, res) => {
  try {
    const [vessels, maintenanceItems, activeExceptions] = await Promise.all([
      db.select({ id: vesselsTable.id }).from(vesselsTable).limit(60),
      db.select({ vesselId: vesselMaintenanceTable.vesselId }).from(vesselMaintenanceTable).where(eq(vesselMaintenanceTable.status, "overdue")),
      db.select({ vesselId: fleetExceptionsTable.vesselId, severity: fleetExceptionsTable.severity }).from(fleetExceptionsTable).where(eq(fleetExceptionsTable.status, "active")),
    ]);

    const overdueVesselIds = new Set(maintenanceItems.map(m => m.vesselId));
    const criticalExcVesselIds = new Set(
      activeExceptions.filter(e => e.severity === "critical" || e.severity === "high").map(e => e.vesselId)
    );
    const readyVessels = vessels.filter(v => !overdueVesselIds.has(v.id) && !criticalExcVesselIds.has(v.id));

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

// ── Seed endpoint (admin-only) ────────────────────────────────────────────────

router.post("/vessels/seed", authMiddleware(), adminGuard, async (_req, res) => {
  try {
    logger.info("Vessels seed triggered by admin");
    await seedVesselsData();
    sendSuccess(res, { message: "Vessels seed completed successfully" });
  } catch (err) {
    handleRouteError(res, err, "Failed to seed vessels data");
  }
});

export default router;
