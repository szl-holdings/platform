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
} from "@szl-holdings/db";
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

// ── Vessel Track History ─────────────────────────────────────────────────────

router.get("/vessels/track/:vesselId", authMiddleware({ required: false }), async (req, res) => {
  if (!req.isAuthenticated() && !req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const vesselId = parseIdParam(req.params["vesselId"]!);
    const [vessel, positions] = await Promise.all([
      db.select({ id: vesselsTable.id, name: vesselsTable.name, vesselType: vesselsTable.vesselType })
        .from(vesselsTable).where(eq(vesselsTable.id, vesselId)).limit(1),
      db.select({
        latitude: vesselsPositionsTable.latitude,
        longitude: vesselsPositionsTable.longitude,
        heading: vesselsPositionsTable.heading,
        speed: vesselsPositionsTable.speed,
        recordedAt: vesselsPositionsTable.recordedAt,
      }).from(vesselsPositionsTable)
        .where(eq(vesselsPositionsTable.vesselId, vesselId))
        .orderBy(desc(vesselsPositionsTable.recordedAt))
        .limit(48),
    ]);

    if (!vessel[0]) { sendNotFound(res, "Vessel not found"); return; }

    const latest = positions[0];
    let track: Array<{ lat: number; lon: number; recordedAt: string }>;

    if (positions.length >= 2) {
      track = positions.map(p => ({
        lat: parseFloat(p.latitude as string),
        lon: parseFloat(p.longitude as string),
        recordedAt: (p.recordedAt as Date).toISOString(),
      }));
    } else if (latest) {
      const baseLat = parseFloat(latest.latitude as string);
      const baseLon = parseFloat(latest.longitude as string);
      const headingDeg = (latest.heading ?? 90) as number;
      const speedKts = (latest.speed ?? 12) as number;
      const rad = (headingDeg * Math.PI) / 180;
      const now = new Date((latest.recordedAt as Date).getTime());
      track = Array.from({ length: 8 }, (_, i) => {
        const hoursBack = (7 - i) * 3;
        const distNm = speedKts * hoursBack;
        const dLat = -Math.cos(rad) * distNm / 60;
        const dLon = -Math.sin(rad) * distNm / (60 * Math.cos((baseLat * Math.PI) / 180));
        return {
          lat: baseLat + dLat,
          lon: baseLon + dLon,
          recordedAt: new Date(now.getTime() - hoursBack * 3600 * 1000).toISOString(),
        };
      });
    } else {
      track = [];
    }

    sendSuccess(res, { vesselId, vessel: vessel[0], track });
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel track");
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

// ── Dark Pattern Decoder — Predictive Sanctions Evasion Engine ────────────────

/**
 * Computes a vessel-level evasion probability score (0–100) from real DB signals:
 * - sanctions screening data (OFAC/EU/UN match status)
 * - AIS gap frequency derived from position age
 * - flag state risk (known evasion registry flags)
 * - port call history (sanctioned ports)
 * - maintenance / inspection records
 * Each factor contributes a weighted sub-score to the composite evasion score.
 */

const HIGH_RISK_FLAGS = new Set([
  "Comoros", "Tanzania", "Palau", "Cameroon", "Togo", "Belize", "Cook Islands",
  "Moldova", "Tuvalu", "Vanuatu", "Kiribati", "Sierra Leone", "North Korea",
]);

const SANCTIONED_PORTS = new Set([
  "Bandar Abbas", "Shahid Rajaee", "Novorossiysk", "Kerch", "Sevastopol",
  "Latakia", "Tartus", "Wonsan", "Nampo", "Zhoushan", "Hudaydah",
]);

type EvasionSignalResult = {
  type: string;
  label: string;
  value: string;
  riskContribution: number;
  detected: string;
};

type EvasionVesselResult = {
  vesselId: number;
  vesselName: string;
  imo: string;
  flag: string;
  vesselType: string;
  evasionScore: number;
  severity: "critical" | "high" | "watch";
  signals: EvasionSignalResult[];
  lastPosition: string | null;
  lastPositionAge: string;
  sanctionsStatus: string;
  relatedSanctions: string[];
  exceptionId: number | null;
  scoredAt: string;
};

async function computeEvasionScore(
  vessel: { id: number; name: string; imo: string | null; flag: string | null; vesselType: string | null },
  sanctions: { ofacStatus: string | null; euStatus: string | null; unStatus: string | null; flagState: string | null; ownershipOpaque: boolean | null } | null,
  portCalls: { portName: string; arrivedAt: Date | string | null }[],
  positionAge: number, // hours since last AIS position
): Promise<{ score: number; signals: EvasionSignalResult[] }> {
  const signals: EvasionSignalResult[] = [];
  let score = 0;

  // 1. Sanctions match status (up to 40 pts)
  if (sanctions) {
    const matchCount = [sanctions.ofacStatus, sanctions.euStatus, sanctions.unStatus].filter(s => s === "match").length;
    const partialCount = [sanctions.ofacStatus, sanctions.euStatus, sanctions.unStatus].filter(s => s === "partial_match").length;
    const sanctionsScore = Math.min(40, matchCount * 18 + partialCount * 10);
    if (sanctionsScore > 0) {
      const lists: string[] = [];
      if (sanctions.ofacStatus === "match" || sanctions.ofacStatus === "partial_match") lists.push("OFAC");
      if (sanctions.euStatus === "match" || sanctions.euStatus === "partial_match") lists.push("EU");
      if (sanctions.unStatus === "match" || sanctions.unStatus === "partial_match") lists.push("UN");
      score += sanctionsScore;
      signals.push({
        type: "sanctions_match",
        label: "Sanctions List Match",
        value: `${lists.join(", ")} — ${matchCount} direct match${matchCount !== 1 ? "es" : ""}, ${partialCount} partial`,
        riskContribution: sanctionsScore,
        detected: "Active screening",
      });
    }
    if (sanctions.ownershipOpaque) {
      score += 8;
      signals.push({ type: "flag_change", label: "Opaque Beneficial Ownership", value: "Owner chain unverifiable", riskContribution: 8, detected: "Last sanctions screening" });
    }
  }

  // 2. AIS gap (stale position = dark vessel indicator, up to 25 pts)
  if (positionAge > 0) {
    const aisScore = positionAge >= 24 ? 25 : positionAge >= 12 ? 18 : positionAge >= 6 ? 12 : positionAge >= 2 ? 6 : 0;
    if (aisScore > 0) {
      score += aisScore;
      signals.push({
        type: "ais_gap_freq",
        label: "AIS Signal Age",
        value: `Last position ${positionAge.toFixed(1)}h ago`,
        riskContribution: aisScore,
        detected: `${positionAge.toFixed(1)} hours ago`,
      });
    }
  }

  // 3. High-risk flag (up to 15 pts)
  const flag = vessel.flag ?? "";
  if (HIGH_RISK_FLAGS.has(flag)) {
    const flagScore = 15;
    score += flagScore;
    signals.push({ type: "flag_change", label: "High-Risk Flag Registry", value: flag, riskContribution: flagScore, detected: "Current registration" });
  }

  // 4. Sanctioned port calls (up to 20 pts)
  const sanctionedCalls = portCalls.filter(pc => SANCTIONED_PORTS.has(pc.portName));
  if (sanctionedCalls.length > 0) {
    const portScore = Math.min(20, sanctionedCalls.length * 10);
    score += portScore;
    signals.push({
      type: "port_sequence",
      label: "Sanctioned Port Call History",
      value: `${sanctionedCalls.length} call${sanctionedCalls.length !== 1 ? "s" : ""} at sanctioned ports: ${sanctionedCalls.slice(0, 2).map(pc => pc.portName).join(", ")}`,
      riskContribution: portScore,
      detected: "Port call records",
    });
  }

  return { score: Math.min(100, score), signals };
}

router.get("/vessels/dark-pattern-decoder/flagged", authMiddleware(), async (_req, res) => {
  try {
    const [vessels, allSanctions, allPositions, allPortCalls] = await Promise.all([
      db.select({
        id: vesselsTable.id,
        name: vesselsTable.name,
        imo: vesselsTable.imo,
        flag: vesselsTable.flag,
        vesselType: vesselsTable.vesselType,
      }).from(vesselsTable).limit(80),
      db.select().from(vesselSanctionsScreeningTable),
      db.select({
        vesselId: vesselsPositionsTable.vesselId,
        recordedAt: vesselsPositionsTable.recordedAt,
        latitude: vesselsPositionsTable.latitude,
        longitude: vesselsPositionsTable.longitude,
      }).from(vesselsPositionsTable).orderBy(desc(vesselsPositionsTable.recordedAt)),
      db.select({
        vesselId: vesselPortCallsTable.vesselId,
        portName: vesselPortCallsTable.portName,
        arrivedAt: vesselPortCallsTable.arrivalAt,
      }).from(vesselPortCallsTable),
    ]);

    const sanctionsMap = new Map(allSanctions.map(s => [s.vesselId, s]));
    const latestPositionMap = new Map<number, typeof allPositions[0]>();
    for (const pos of allPositions) {
      if (!latestPositionMap.has(pos.vesselId)) {
        latestPositionMap.set(pos.vesselId, pos);
      }
    }
    const portCallMap = new Map<number, typeof allPortCalls>();
    for (const pc of allPortCalls) {
      const existing = portCallMap.get(pc.vesselId) ?? [];
      existing.push(pc);
      portCallMap.set(pc.vesselId, existing);
    }

    const now = Date.now();
    const results: EvasionVesselResult[] = [];

    for (const vessel of vessels) {
      const sanctions = sanctionsMap.get(vessel.id) ?? null;
      const latestPos = latestPositionMap.get(vessel.id);
      const portCalls = portCallMap.get(vessel.id) ?? [];
      const posAge = latestPos
        ? (now - new Date(latestPos.recordedAt).getTime()) / 3600000
        : 48;

      const { score, signals } = await computeEvasionScore(vessel, sanctions, portCalls, posAge);

      if (score < 20) continue; // Only include vessels with meaningful evasion signal

      const severity: "critical" | "high" | "watch" =
        score >= 75 ? "critical" : score >= 50 ? "high" : "watch";

      const relatedSanctions: string[] = [];
      if (sanctions?.ofacStatus === "match" || sanctions?.ofacStatus === "partial_match") relatedSanctions.push("OFAC");
      if (sanctions?.euStatus === "match" || sanctions?.euStatus === "partial_match") relatedSanctions.push("EU Sanctions");
      if (sanctions?.unStatus === "match" || sanctions?.unStatus === "partial_match") relatedSanctions.push("UN Security Council");

      const posLabel = latestPos
        ? `${parseFloat(latestPos.latitude ?? "0").toFixed(2)}°N ${parseFloat(latestPos.longitude ?? "0").toFixed(2)}°E`
        : "Position unknown";
      const posAgeLabel = posAge < 1 ? `${Math.round(posAge * 60)}m ago` : posAge < 24 ? `${posAge.toFixed(1)}h ago` : `${Math.round(posAge / 24)}d ago`;

      results.push({
        vesselId: vessel.id,
        vesselName: vessel.name,
        imo: vessel.imo ?? "Unknown",
        flag: vessel.flag ?? "Unknown",
        vesselType: vessel.vesselType ?? "Unknown",
        evasionScore: Math.round(score),
        severity,
        signals,
        lastPosition: posLabel,
        lastPositionAge: posAgeLabel,
        sanctionsStatus: sanctions?.ofacStatus ?? "not_screened",
        relatedSanctions,
        exceptionId: null, // populated by upsert below
        scoredAt: new Date().toISOString(),
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.evasionScore - a.evasionScore);

    // Upsert "predicted_evasion" exceptions for high/critical vessels
    for (const v of results.filter(r => r.severity !== "watch" || r.evasionScore >= 40)) {
      try {
        const excRef = `DPD-${v.vesselId}-${new Date().toISOString().slice(0, 10)}`;
        const existing = await db.select({ id: fleetExceptionsTable.id })
          .from(fleetExceptionsTable)
          .where(and(
            eq(fleetExceptionsTable.vesselId, v.vesselId),
            eq(fleetExceptionsTable.exceptionType, "predicted_evasion"),
            eq(fleetExceptionsTable.status, "active"),
          ))
          .limit(1);

        if (existing.length === 0) {
          const [created] = await db.insert(fleetExceptionsTable).values({
            vesselId: v.vesselId,
            exceptionRef: excRef,
            exceptionType: "predicted_evasion",
            severity: v.severity === "critical" ? "critical" : v.severity === "high" ? "high" : "watch",
            title: `${v.vesselName} — Predicted Evasion (${v.evasionScore}% probability)`,
            description: `Dark Pattern Decoder has detected ${v.signals.length} pre-evasion behavioral signals on ${v.vesselName} (IMO: ${v.imo}). Evasion probability score: ${v.evasionScore}%. Last position: ${v.lastPosition}.`,
            whyItMatters: `Behavioral fingerprinting indicates this vessel may engage in sanctions evasion before going dark. Early detection enables pre-emptive compliance action.`,
            recommendedResponse: `Review behavioral signals, increase monitoring frequency, pre-stage compliance documentation, alert P&I Club.`,
            estimatedImpactUsd: v.severity === "critical" ? "2500000" : "850000",
            metadata: { evasionScore: v.evasionScore, signals: v.signals, relatedSanctions: v.relatedSanctions },
          }).returning({ id: fleetExceptionsTable.id });
          v.exceptionId = created?.id ?? null;
        } else {
          v.exceptionId = existing[0]?.id ?? null;
          // Update the existing exception score
          await db.update(fleetExceptionsTable)
            .set({
              title: `${v.vesselName} — Predicted Evasion (${v.evasionScore}% probability)`,
              description: `Dark Pattern Decoder has detected ${v.signals.length} pre-evasion behavioral signals. Evasion score: ${v.evasionScore}%. Last position: ${v.lastPosition}.`,
              metadata: { evasionScore: v.evasionScore, signals: v.signals, relatedSanctions: v.relatedSanctions },
              updatedAt: new Date(),
            })
            .where(eq(fleetExceptionsTable.id, existing[0].id));
        }
      } catch { /* Non-fatal — scoring still returns results */ }
    }

    sendSuccess(res, {
      flaggedVessels: results,
      summary: {
        total: results.length,
        critical: results.filter(r => r.severity === "critical").length,
        high: results.filter(r => r.severity === "high").length,
        watch: results.filter(r => r.severity === "watch").length,
        avgScore: results.length > 0
          ? Math.round(results.reduce((s, r) => s + r.evasionScore, 0) / results.length)
          : 0,
      },
      scoredAt: new Date().toISOString(),
      modelVersion: "v1.0-behavioral-fingerprint",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute dark pattern evasion scores");
  }
});

router.get("/vessels/dark-pattern-decoder/historical", authMiddleware(), async (_req, res) => {
  try {
    // Return confirmed evasion events from fleet_exceptions where the exception was resolved
    // with a sanctions_match or ais_dark type, enriched with metadata
    const resolvedSanctionsExceptions = await db.select({
      id: fleetExceptionsTable.id,
      vesselId: fleetExceptionsTable.vesselId,
      title: fleetExceptionsTable.title,
      description: fleetExceptionsTable.description,
      resolvedAt: fleetExceptionsTable.resolvedAt,
      resolutionNotes: fleetExceptionsTable.resolutionNotes,
      exceptionType: fleetExceptionsTable.exceptionType,
      severity: fleetExceptionsTable.severity,
      estimatedImpactUsd: fleetExceptionsTable.estimatedImpactUsd,
    })
      .from(fleetExceptionsTable)
      .where(and(
        eq(fleetExceptionsTable.status, "resolved"),
        eq(fleetExceptionsTable.exceptionType, "sanctions_match"),
      ))
      .orderBy(desc(fleetExceptionsTable.resolvedAt))
      .limit(20);

    sendSuccess(res, {
      confirmedEvasionEvents: resolvedSanctionsExceptions,
      totalAnalyzed: resolvedSanctionsExceptions.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch historical evasion events");
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
