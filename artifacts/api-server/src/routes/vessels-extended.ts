import { bodyShape } from '@szl-holdings/contracts/common';
import {
  corridorsTable,
  db,
  type FleetException,
  fleetExceptionsTable,
  insertFleetExceptionSchema,
  portsTable,
  type VesselMaintenance,
  type VesselPortCall,
  type VesselSanctionsScreening,
  type VesselVoyageEconomics,
  vesselMaintenanceTable,
  vesselPortCallsTable,
  vesselSanctionsScreeningTable,
  vesselsFleetsTable,
  vesselsPositionsTable,
  vesselsTable,
  vesselVoyageEconomicsTable,
  voyagesTable,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { guardSeedInProduction } from '../lib/seed-guard';
import { seedVesselsData } from '../lib/seed-vessels';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { adminGuard } from '../middlewares/admin-guard';
import { authMiddleware, parseIdParam } from '../middlewares/auth';
import { recordTenantIsolationViolation, tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

// ─── Org-scoping helpers ─────────────────────────────────────────────────────
// Mirrors helpers in vessels.ts: req.tenantOrgId is undefined for elevated
// admins (super_admin / admin) and a number for everyone else.

function vesselOrgWhere(orgId: number | undefined): SQL | undefined {
  return orgId !== undefined ? eq(vesselsTable.orgId, orgId) : undefined;
}

/** Returns the set of vessel IDs in the current org, or null for elevated admins (no filter). */
async function getOrgVesselIds(orgId: number | undefined): Promise<number[] | null> {
  if (orgId === undefined) return null;
  const rows = await db
    .select({ id: vesselsTable.id })
    .from(vesselsTable)
    .where(eq(vesselsTable.orgId, orgId));
  return rows.map((r) => r.id);
}

/** Verify that a vessel record belongs to the requesting user's org (or admin). */
async function getVesselInOrg(vesselId: number, orgId: number | undefined) {
  const condition =
    orgId !== undefined
      ? and(eq(vesselsTable.id, vesselId), eq(vesselsTable.orgId, orgId))
      : eq(vesselsTable.id, vesselId);
  const [vessel] = await db.select().from(vesselsTable).where(condition);
  return vessel ?? null;
}

/** Build a `vesselId IN (...)` clause for sub-resources, or undefined for admin. Returns null when org has no vessels (caller should return empty). */
function _buildVesselScopeClause<T extends { vesselId: typeof vesselsTable.id }>(
  column: T['vesselId'],
  vesselIds: number[] | null,
): SQL | undefined | 'EMPTY' {
  if (vesselIds === null) return undefined;
  if (vesselIds.length === 0) return 'EMPTY';
  return inArray(column, vesselIds);
}

// ── Fleet dashboard analytics ────────────────────────────────────────────────

router.get('/vessels/dashboard', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const orgId = req.tenantOrgId;
    const orgVesselIds = await getOrgVesselIds(orgId);
    // Org has no vessels — return zeroed dashboard
    if (orgVesselIds !== null && orgVesselIds.length === 0) {
      sendSuccess(res, {
        summary: {
          totalVessels: 0,
          activeExceptions: 0,
          overdueMaintenanceItems: 0,
          activeVoyages: 0,
          utilizationRate: 0,
        },
        statusDistribution: [],
        typeDistribution: [],
        flagDistribution: [],
        ageBuckets: {},
        recentExceptions: [],
        fleetSummary: [],
        economics: null,
        fetchedAt: new Date().toISOString(),
      });
      return;
    }

    const vWhere = vesselOrgWhere(orgId);
    const subWhere = (col: typeof vesselsTable.id) =>
      orgVesselIds !== null ? inArray(col, orgVesselIds) : undefined;
    const fleetSubWhere = (col: typeof vesselsFleetsTable.orgId) =>
      orgId !== undefined ? eq(col, orgId) : undefined;

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
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(vesselsTable)
        .where(vWhere)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(fleetExceptionsTable)
        .where(
          and(eq(fleetExceptionsTable.status, 'active'), subWhere(fleetExceptionsTable.vesselId)),
        )
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(vesselMaintenanceTable)
        .where(
          and(
            eq(vesselMaintenanceTable.status, 'overdue'),
            subWhere(vesselMaintenanceTable.vesselId),
          ),
        )
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(vesselVoyageEconomicsTable)
        .where(
          and(
            eq(vesselVoyageEconomicsTable.status, 'at_sea'),
            subWhere(vesselVoyageEconomicsTable.vesselId),
          ),
        )
        .then((r) => r[0]?.count ?? 0),
      db
        .select()
        .from(fleetExceptionsTable)
        .where(
          and(eq(fleetExceptionsTable.status, 'active'), subWhere(fleetExceptionsTable.vesselId)),
        )
        .orderBy(desc(fleetExceptionsTable.detectedAt))
        .limit(5),
      db.select().from(vesselsFleetsTable).where(fleetSubWhere(vesselsFleetsTable.orgId)).limit(10),
      db
        .select({ status: vesselsTable.status, count: sql<number>`count(*)::int` })
        .from(vesselsTable)
        .where(vWhere)
        .groupBy(vesselsTable.status),
      db
        .select({ type: vesselsTable.vesselType, count: sql<number>`count(*)::int` })
        .from(vesselsTable)
        .where(vWhere)
        .groupBy(vesselsTable.vesselType),
      db
        .select({ flag: vesselsTable.flag, count: sql<number>`count(*)::int` })
        .from(vesselsTable)
        .where(vWhere)
        .groupBy(vesselsTable.flag)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(10),
    ]);

    const ageDistribution = await db
      .select({
        yearBuilt: vesselsTable.yearBuilt,
        count: sql<number>`count(*)::int`,
      })
      .from(vesselsTable)
      .where(and(sql`year_built is not null`, vWhere))
      .groupBy(vesselsTable.yearBuilt)
      .orderBy(vesselsTable.yearBuilt);

    const ageBuckets: Record<string, number> = {};
    for (const row of ageDistribution) {
      if (!row.yearBuilt) continue;
      const decade = `${Math.floor(row.yearBuilt / 10) * 10}s`;
      ageBuckets[decade] = (ageBuckets[decade] ?? 0) + row.count;
    }

    const economicsVesselIds = await getOrgVesselIds(req.tenantOrgId);
    const [voyageMetrics] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(gross_revenue), 0)::float`,
        totalCosts: sql<number>`coalesce(sum(total_costs_usd), 0)::float`,
        totalMargin: sql<number>`coalesce(sum(net_margin_usd), 0)::float`,
        avgMarginPct: sql<number>`coalesce(avg(margin_pct), 0)::float`,
        completedVoyages: sql<number>`count(*)::int`,
      })
      .from(vesselVoyageEconomicsTable)
      .where(
        economicsVesselIds === null
          ? eq(vesselVoyageEconomicsTable.status, 'completed')
          : and(
              eq(vesselVoyageEconomicsTable.status, 'completed'),
              economicsVesselIds.length === 0
                ? sql`false`
                : sql`${vesselVoyageEconomicsTable.vesselId} = ANY(${economicsVesselIds})`,
            ),
      );

    const atSea = statusDistribution.find((s) => s.status === 'at_sea')?.count ?? 0;
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
      economics: voyageMetrics
        ? {
            totalRevenue: voyageMetrics.totalRevenue,
            totalCosts: voyageMetrics.totalCosts,
            totalMargin: voyageMetrics.totalMargin,
            avgMarginPct: voyageMetrics.avgMarginPct,
            completedVoyages: voyageMetrics.completedVoyages,
          }
        : null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to build fleet dashboard');
  }
});

// ── Fleet summary (vessels list) ─────────────────────────────────────────────

router.get('/vessels/fleet-summary', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const where = vesselOrgWhere(req.tenantOrgId);
    const vessels = where
      ? await db.select().from(vesselsTable).where(where).orderBy(vesselsTable.name).limit(100)
      : await db.select().from(vesselsTable).orderBy(vesselsTable.name).limit(100);
    sendSuccess(res, vessels);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get fleet summary');
  }
});

// ── Enriched vessel roster (vessels + latest position + active voyage + exception count) ──

router.get('/vessels/roster', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const orgId = req.tenantOrgId;
    const vWhere = vesselOrgWhere(orgId);
    const vessels = vWhere
      ? await db.select().from(vesselsTable).where(vWhere).orderBy(vesselsTable.name).limit(200)
      : await db.select().from(vesselsTable).orderBy(vesselsTable.name).limit(200);

    const orgVesselIds = orgId !== undefined ? vessels.map((v) => v.id) : null;
    if (orgVesselIds !== null && orgVesselIds.length === 0) {
      sendSuccess(res, []);
      return;
    }
    const subScope = (col: typeof vesselsTable.id) =>
      orgVesselIds !== null ? inArray(col, orgVesselIds) : undefined;

    const [positions, activeVoyages, exceptionCounts] = await Promise.all([
      db
        .select({
          vesselId: vesselsPositionsTable.vesselId,
          latitude: vesselsPositionsTable.latitude,
          longitude: vesselsPositionsTable.longitude,
          heading: vesselsPositionsTable.heading,
          speed: vesselsPositionsTable.speed,
          recordedAt: vesselsPositionsTable.recordedAt,
        })
        .from(vesselsPositionsTable)
        .where(subScope(vesselsPositionsTable.vesselId)),

      db
        .select({
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
        })
        .from(vesselVoyageEconomicsTable)
        .where(
          and(
            eq(vesselVoyageEconomicsTable.status, 'at_sea'),
            subScope(vesselVoyageEconomicsTable.vesselId),
          ),
        ),

      db
        .select({
          vesselId: fleetExceptionsTable.vesselId,
          count: sql<number>`count(*)::int`,
        })
        .from(fleetExceptionsTable)
        .where(
          and(eq(fleetExceptionsTable.status, 'active'), subScope(fleetExceptionsTable.vesselId)),
        )
        .groupBy(fleetExceptionsTable.vesselId),
    ]);

    const posMap = new Map(positions.map((p) => [p.vesselId, p]));
    const voyageMap = new Map<number, (typeof activeVoyages)[0]>();
    for (const v of activeVoyages) {
      if (v.vesselId !== null && !voyageMap.has(v.vesselId)) {
        voyageMap.set(v.vesselId, v);
      }
    }
    const excMap = new Map(exceptionCounts.map((e) => [e.vesselId ?? 0, e.count]));

    const roster = vessels.map((v) => {
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
    handleRouteError(res, err, 'Failed to get vessel roster');
  }
});

// ── Vessel detail (enriched single vessel) ───────────────────────────────────

router.get('/vessels/:id/detail', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const vesselId = parseIdParam(req.params.id);
    if (!vesselId) return sendBadRequest(res, 'Invalid vessel id');

    // Cross-tenant guard: returns 404 if vessel belongs to a different org.
    const ownVessel = await getVesselInOrg(vesselId, req.tenantOrgId);
    if (!ownVessel) return sendNotFound(res, 'Vessel not found');

    const [vessels, positions, voyages, maintenance, portCalls, exceptions, sanctions] =
      await Promise.all([
        db.select().from(vesselsTable).where(eq(vesselsTable.id, vesselId)).limit(1),
        db
          .select()
          .from(vesselsPositionsTable)
          .where(eq(vesselsPositionsTable.vesselId, vesselId))
          .orderBy(desc(vesselsPositionsTable.recordedAt))
          .limit(1),
        db
          .select()
          .from(vesselVoyageEconomicsTable)
          .where(eq(vesselVoyageEconomicsTable.vesselId, vesselId))
          .orderBy(desc(vesselVoyageEconomicsTable.scheduledDepartureAt))
          .limit(10),
        db
          .select()
          .from(vesselMaintenanceTable)
          .where(eq(vesselMaintenanceTable.vesselId, vesselId))
          .orderBy(desc(vesselMaintenanceTable.createdAt))
          .limit(20),
        db
          .select()
          .from(vesselPortCallsTable)
          .where(eq(vesselPortCallsTable.vesselId, vesselId))
          .orderBy(desc(vesselPortCallsTable.arrivalAt))
          .limit(10),
        db
          .select()
          .from(fleetExceptionsTable)
          .where(
            and(
              eq(fleetExceptionsTable.vesselId, vesselId),
              eq(fleetExceptionsTable.status, 'active'),
            ),
          )
          .orderBy(desc(fleetExceptionsTable.detectedAt))
          .limit(10),
        db
          .select()
          .from(vesselSanctionsScreeningTable)
          .where(eq(vesselSanctionsScreeningTable.vesselId, vesselId))
          .orderBy(desc(vesselSanctionsScreeningTable.screeningDate))
          .limit(1),
      ]);

    const vessel = vessels[0];
    if (!vessel) return sendNotFound(res, 'Vessel not found');

    const pos = positions[0];
    const latestSanction = sanctions[0];
    const activeVoyage = voyages.find((v) => v.status === 'at_sea') ?? voyages[0];

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
    handleRouteError(res, err, 'Failed to get vessel detail');
  }
});

// ── Map payload ──────────────────────────────────────────────────────────────

router.get('/vessels/map-payload', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const orgId = req.tenantOrgId;
    const baseQuery = db
      .select({
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
      })
      .from(vesselsTable)
      .innerJoin(vesselsPositionsTable, eq(vesselsPositionsTable.vesselId, vesselsTable.id));
    const vessels =
      orgId !== undefined
        ? await baseQuery.where(eq(vesselsTable.orgId, orgId)).limit(100)
        : await baseQuery.limit(100);
    sendSuccess(res, vessels);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get map payload');
  }
});

// ── Vessel Track History ─────────────────────────────────────────────────────

router.get('/vessels/track/:vesselId', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const vesselId = parseIdParam(req.params.vesselId!);
    // Cross-tenant guard
    const ownVessel = await getVesselInOrg(vesselId, req.tenantOrgId);
    if (!ownVessel) {
      sendNotFound(res, 'Vessel not found');
      return;
    }

    const [vessel, positions] = await Promise.all([
      db
        .select({
          id: vesselsTable.id,
          name: vesselsTable.name,
          vesselType: vesselsTable.vesselType,
        })
        .from(vesselsTable)
        .where(eq(vesselsTable.id, vesselId))
        .limit(1),
      db
        .select({
          latitude: vesselsPositionsTable.latitude,
          longitude: vesselsPositionsTable.longitude,
          heading: vesselsPositionsTable.heading,
          speed: vesselsPositionsTable.speed,
          recordedAt: vesselsPositionsTable.recordedAt,
        })
        .from(vesselsPositionsTable)
        .where(eq(vesselsPositionsTable.vesselId, vesselId))
        .orderBy(desc(vesselsPositionsTable.recordedAt))
        .limit(48),
    ]);

    if (!vessel[0]) {
      sendNotFound(res, 'Vessel not found');
      return;
    }

    const latest = positions[0];
    let track: Array<{ lat: number; lon: number; recordedAt: string }>;

    if (positions.length >= 2) {
      track = positions.map((p) => ({
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
        const dLat = (-Math.cos(rad) * distNm) / 60;
        const dLon = (-Math.sin(rad) * distNm) / (60 * Math.cos((baseLat * Math.PI) / 180));
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
    handleRouteError(res, err, 'Failed to get vessel track');
  }
});

// ── Voyage Economics ─────────────────────────────────────────────────────────

router.get(
  '/vessels/voyage-economics',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const statusFilter = req.query.status as VesselVoyageEconomics['status'] | undefined;
      const vesselIdFilter = req.query.vesselId
        ? parseInt(req.query.vesselId as string, 10)
        : undefined;

      const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
      if (orgVesselIds !== null && orgVesselIds.length === 0) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }
      // If a specific vesselId was requested, ensure it belongs to the user's org
      if (vesselIdFilter && orgVesselIds !== null && !orgVesselIds.includes(vesselIdFilter)) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }

      const conditions: SQL[] = [];
      if (statusFilter) conditions.push(eq(vesselVoyageEconomicsTable.status, statusFilter));
      if (vesselIdFilter && !Number.isNaN(vesselIdFilter))
        conditions.push(eq(vesselVoyageEconomicsTable.vesselId, vesselIdFilter));
      else if (orgVesselIds !== null)
        conditions.push(inArray(vesselVoyageEconomicsTable.vesselId, orgVesselIds));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [{ count }]] = await Promise.all([
        db
          .select({
            voyage: vesselVoyageEconomicsTable,
            vesselName: vesselsTable.name,
            vesselClass: vesselsTable.vesselClass,
            vesselType: vesselsTable.vesselType,
          })
          .from(vesselVoyageEconomicsTable)
          .leftJoin(vesselsTable, eq(vesselsTable.id, vesselVoyageEconomicsTable.vesselId))
          .where(whereClause)
          .orderBy(desc(vesselVoyageEconomicsTable.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vesselVoyageEconomicsTable)
          .where(whereClause),
      ]);

      const enriched = rows.map(({ voyage, vesselName, vesselClass, vesselType }) => ({
        ...voyage,
        vesselName,
        vesselClass,
        vesselType,
      }));

      sendSuccess(res, enriched, 200, { page, limit, total: count });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list voyage economics');
    }
  },
);

router.get(
  '/vessels/voyage-economics/analytics',
  authMiddleware(),
  tenantScope(),
  async (req, res) => {
    try {
      const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
      if (orgVesselIds !== null && orgVesselIds.length === 0) {
        sendSuccess(res, { revenueByMonth: [], topRoutes: [], utilizationTrend: [] });
        return;
      }
      const scope =
        orgVesselIds !== null
          ? inArray(vesselVoyageEconomicsTable.vesselId, orgVesselIds)
          : undefined;

      const [revenueByMonth, topRoutes, utilizationTrend] = await Promise.all([
        db
          .select({
            month: sql<string>`to_char(scheduled_departure_at, 'YYYY-MM')`,
            revenue: sql<number>`coalesce(sum(gross_revenue), 0)::float`,
            costs: sql<number>`coalesce(sum(total_costs_usd), 0)::float`,
            margin: sql<number>`coalesce(sum(net_margin_usd), 0)::float`,
            voyages: sql<number>`count(*)::int`,
          })
          .from(vesselVoyageEconomicsTable)
          .where(and(sql`scheduled_departure_at >= now() - interval '12 months'`, scope))
          .groupBy(sql`to_char(scheduled_departure_at, 'YYYY-MM')`)
          .orderBy(sql`to_char(scheduled_departure_at, 'YYYY-MM')`),

        db
          .select({
            route: sql<string>`concat(origin_port, ' → ', destination_port)`,
            voyages: sql<number>`count(*)::int`,
            avgMargin: sql<number>`coalesce(avg(net_margin_usd), 0)::float`,
            totalRevenue: sql<number>`coalesce(sum(gross_revenue), 0)::float`,
            avgTce: sql<number>`coalesce(avg(tce_per_day), 0)::float`,
          })
          .from(vesselVoyageEconomicsTable)
          .where(and(eq(vesselVoyageEconomicsTable.status, 'completed'), scope))
          .groupBy(sql`concat(origin_port, ' → ', destination_port)`)
          .orderBy(desc(sql<number>`sum(gross_revenue)`))
          .limit(10),

        db
          .select({
            status: vesselVoyageEconomicsTable.status,
            count: sql<number>`count(*)::int`,
            avgMarginPct: sql<number>`coalesce(avg(margin_pct), 0)::float`,
          })
          .from(vesselVoyageEconomicsTable)
          .where(scope)
          .groupBy(vesselVoyageEconomicsTable.status),
      ]);

      sendSuccess(res, { revenueByMonth, topRoutes, utilizationTrend });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get voyage economics analytics');
    }
  },
);

router.get('/vessels/voyage-economics/:id', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db
      .select()
      .from(vesselVoyageEconomicsTable)
      .where(eq(vesselVoyageEconomicsTable.id, id));
    if (!row) {
      sendNotFound(res, 'Voyage Economics Record');
      return;
    }
    // Cross-tenant guard: ensure parent vessel belongs to caller's org
    if (row.vesselId !== null) {
      const ownVessel = await getVesselInOrg(row.vesselId, req.tenantOrgId);
      if (!ownVessel) {
        sendNotFound(res, 'Voyage Economics Record');
        return;
      }
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get voyage economics');
  }
});

// ── Legacy Voyages (maritime.ts voyagesTable — has orgId) ────────────────────

router.get(
  '/vessels/voyages',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const orgScope =
        req.tenantOrgId !== undefined ? eq(voyagesTable.orgId, req.tenantOrgId) : undefined;
      const [rows, [{ count }]] = await Promise.all([
        db
          .select()
          .from(voyagesTable)
          .where(orgScope)
          .orderBy(desc(voyagesTable.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(voyagesTable).where(orgScope),
      ]);
      sendSuccess(res, rows, 200, { page, limit, total: count });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list voyages');
    }
  },
);

router.get('/vessels/voyages/:id', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(voyagesTable).where(eq(voyagesTable.id, id));
    if (!row) {
      sendNotFound(res, 'Voyage');
      return;
    }
    if (req.tenantOrgId !== undefined && row.orgId !== req.tenantOrgId) {
      sendNotFound(res, 'Voyage');
      return;
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get voyage');
  }
});

// ── Exceptions ───────────────────────────────────────────────────────────────

router.get(
  '/vessels/exceptions',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const statusFilter = req.query.status as FleetException['status'] | undefined;
      const severityFilter = req.query.severity as FleetException['severity'] | undefined;
      const typeFilter = req.query.type as FleetException['exceptionType'] | undefined;

      const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
      if (orgVesselIds !== null && orgVesselIds.length === 0) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }

      const conditions: SQL[] = [];
      if (statusFilter) conditions.push(eq(fleetExceptionsTable.status, statusFilter));
      if (severityFilter) conditions.push(eq(fleetExceptionsTable.severity, severityFilter));
      if (typeFilter) conditions.push(eq(fleetExceptionsTable.exceptionType, typeFilter));
      if (orgVesselIds !== null)
        conditions.push(inArray(fleetExceptionsTable.vesselId, orgVesselIds));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const baseSelect = db
        .select({
          exception: fleetExceptionsTable,
          vesselName: vesselsTable.name,
        })
        .from(fleetExceptionsTable)
        .leftJoin(vesselsTable, eq(fleetExceptionsTable.vesselId, vesselsTable.id));

      const [rows, [{ count }]] = await Promise.all([
        baseSelect
          .where(whereClause)
          .orderBy(desc(fleetExceptionsTable.detectedAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(fleetExceptionsTable)
          .where(whereClause),
      ]);

      const data = rows.map((r) => ({
        ...r.exception,
        vesselName: r.vesselName,
      }));

      sendSuccess(res, data, 200, { page, limit, total: count });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list exceptions');
    }
  },
);

router.get('/vessels/exceptions/:id', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db
      .select()
      .from(fleetExceptionsTable)
      .where(eq(fleetExceptionsTable.id, id));
    if (!row) {
      sendNotFound(res, 'Exception');
      return;
    }
    if (row.vesselId !== null) {
      const own = await getVesselInOrg(row.vesselId, req.tenantOrgId);
      if (!own) {
        sendNotFound(res, 'Exception');
        return;
      }
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get exception');
  }
});

router.post(
  '/vessels/exceptions',
  authMiddleware(),
  tenantScope(),
  validateBody(
    bodyShape({
      vesselId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const data = insertFleetExceptionSchema.parse(req.body);
      // Cross-tenant guard on the parent vessel reference
      if (data.vesselId !== null && data.vesselId !== undefined) {
        const own = await getVesselInOrg(data.vesselId, req.tenantOrgId);
        if (!own) {
          recordTenantIsolationViolation(
            req,
            req.user,
            req.tenantOrgId ?? null,
            'vessels exception cross-tenant create',
          );
          res.status(403).json({ error: 'Cross-tenant access denied' });
          return;
        }
      }
      const [row] = await db.insert(fleetExceptionsTable).values(data).returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create exception');
    }
  },
);

router.post(
  '/vessels/exceptions/:id/acknowledge',
  authMiddleware(),
  tenantScope(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [exc] = await db
        .select()
        .from(fleetExceptionsTable)
        .where(eq(fleetExceptionsTable.id, id));
      if (!exc) {
        sendNotFound(res, 'Exception');
        return;
      }
      if (exc.vesselId !== null) {
        const own = await getVesselInOrg(exc.vesselId, req.tenantOrgId);
        if (!own) {
          sendNotFound(res, 'Exception');
          return;
        }
      }
      if (exc.status !== 'active') {
        sendBadRequest(res, 'Only active exceptions can be acknowledged');
        return;
      }
      const [row] = await db
        .update(fleetExceptionsTable)
        .set({
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(fleetExceptionsTable.id, id))
        .returning();
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to acknowledge exception');
    }
  },
);

router.post(
  '/vessels/exceptions/:id/resolve',
  authMiddleware(),
  tenantScope(),
  validateBody(
    bodyShape({
      notes: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [exc] = await db
        .select()
        .from(fleetExceptionsTable)
        .where(eq(fleetExceptionsTable.id, id));
      if (!exc) {
        sendNotFound(res, 'Exception');
        return;
      }
      if (exc.vesselId !== null) {
        const own = await getVesselInOrg(exc.vesselId, req.tenantOrgId);
        if (!own) {
          sendNotFound(res, 'Exception');
          return;
        }
      }
      if (exc.status === 'resolved') {
        sendBadRequest(res, 'Exception is already resolved');
        return;
      }
      const notes: string | null = typeof req.body?.notes === 'string' ? req.body.notes : null;
      const [row] = await db
        .update(fleetExceptionsTable)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolutionNotes: notes,
          updatedAt: new Date(),
        })
        .where(eq(fleetExceptionsTable.id, id))
        .returning();
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to resolve exception');
    }
  },
);

router.post(
  '/vessels/exceptions/:id/escalate',
  authMiddleware(),
  tenantScope(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [exc] = await db
        .select()
        .from(fleetExceptionsTable)
        .where(eq(fleetExceptionsTable.id, id));
      if (!exc) {
        sendNotFound(res, 'Exception');
        return;
      }
      if (exc.vesselId !== null) {
        const own = await getVesselInOrg(exc.vesselId, req.tenantOrgId);
        if (!own) {
          sendNotFound(res, 'Exception');
          return;
        }
      }
      const severityUpgrade: Record<FleetException['severity'], FleetException['severity']> = {
        watch: 'high',
        high: 'critical',
        critical: 'critical',
        normal: 'watch',
      };
      const newSeverity = severityUpgrade[exc.severity];
      const existingMeta =
        exc.metadata && typeof exc.metadata === 'object' && !Array.isArray(exc.metadata)
          ? (exc.metadata as Record<string, unknown>)
          : {};
      const [row] = await db
        .update(fleetExceptionsTable)
        .set({
          severity: newSeverity,
          updatedAt: new Date(),
          metadata: { ...existingMeta, escalatedAt: new Date().toISOString() },
        })
        .where(eq(fleetExceptionsTable.id, id))
        .returning();
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to escalate exception');
    }
  },
);

// ── Corridors ────────────────────────────────────────────────────────────────

router.get(
  '/vessels/corridors',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const [rows, [{ count }]] = await Promise.all([
        db.select().from(corridorsTable).orderBy(corridorsTable.name).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(corridorsTable),
      ]);
      sendSuccess(res, rows, 200, { page, limit, total: count });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list corridors');
    }
  },
);

router.get('/vessels/corridors/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(corridorsTable).where(eq(corridorsTable.id, id));
    if (!row) {
      sendNotFound(res, 'Corridor');
      return;
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get corridor');
  }
});

// ── Maintenance ──────────────────────────────────────────────────────────────

router.get(
  '/vessels/maintenance',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const statusFilter = req.query.status as VesselMaintenance['status'] | undefined;
      const vesselIdFilter = req.query.vesselId
        ? parseInt(req.query.vesselId as string, 10)
        : undefined;

      const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
      if (orgVesselIds !== null && orgVesselIds.length === 0) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }
      if (vesselIdFilter && orgVesselIds !== null && !orgVesselIds.includes(vesselIdFilter)) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }

      const conditions: SQL[] = [];
      if (statusFilter) conditions.push(eq(vesselMaintenanceTable.status, statusFilter));
      if (vesselIdFilter && !Number.isNaN(vesselIdFilter))
        conditions.push(eq(vesselMaintenanceTable.vesselId, vesselIdFilter));
      else if (orgVesselIds !== null)
        conditions.push(inArray(vesselMaintenanceTable.vesselId, orgVesselIds));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const baseSelect = db
        .select({
          maintenance: vesselMaintenanceTable,
          vesselName: vesselsTable.name,
          vesselType: vesselsTable.vesselType,
          vesselFlag: vesselsTable.flag,
        })
        .from(vesselMaintenanceTable)
        .leftJoin(vesselsTable, eq(vesselMaintenanceTable.vesselId, vesselsTable.id));

      const [rows, [{ count }]] = await Promise.all([
        baseSelect
          .where(whereClause)
          .orderBy(desc(vesselMaintenanceTable.dueDate))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vesselMaintenanceTable)
          .where(whereClause),
      ]);

      const data = rows.map((r) => ({
        ...r.maintenance,
        vesselName: r.vesselName,
        vesselType: r.vesselType,
        vesselFlag: r.vesselFlag,
      }));

      sendSuccess(res, data, 200, { page, limit, total: count });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list maintenance items');
    }
  },
);

// ── Sanctions Screening ──────────────────────────────────────────────────────

router.get(
  '/vessels/sanctions',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const ofacStatusFilter = req.query.ofacStatus as
        | VesselSanctionsScreening['ofacStatus']
        | undefined;
      const vesselIdFilter = req.query.vesselId
        ? parseInt(req.query.vesselId as string, 10)
        : undefined;

      const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
      if (orgVesselIds !== null && orgVesselIds.length === 0) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }
      if (vesselIdFilter && orgVesselIds !== null && !orgVesselIds.includes(vesselIdFilter)) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }

      const conditions: SQL[] = [];
      if (ofacStatusFilter)
        conditions.push(eq(vesselSanctionsScreeningTable.ofacStatus, ofacStatusFilter));
      if (vesselIdFilter && !Number.isNaN(vesselIdFilter))
        conditions.push(eq(vesselSanctionsScreeningTable.vesselId, vesselIdFilter));
      else if (orgVesselIds !== null)
        conditions.push(inArray(vesselSanctionsScreeningTable.vesselId, orgVesselIds));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const baseSelect = db
        .select({
          screening: vesselSanctionsScreeningTable,
          vesselName: vesselsTable.name,
          vesselType: vesselsTable.vesselType,
          vesselFlag: vesselsTable.flag,
          vesselImo: vesselsTable.imo,
          vesselMmsi: vesselsTable.mmsi,
        })
        .from(vesselSanctionsScreeningTable)
        .leftJoin(vesselsTable, eq(vesselSanctionsScreeningTable.vesselId, vesselsTable.id));

      const [rows, [{ count }]] = await Promise.all([
        baseSelect
          .where(whereClause)
          .orderBy(desc(vesselSanctionsScreeningTable.screeningDate))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vesselSanctionsScreeningTable)
          .where(whereClause),
      ]);

      const data = rows.map((r) => ({
        ...r.screening,
        vesselName: r.vesselName,
        vesselType: r.vesselType,
        vesselFlag: r.vesselFlag,
        vesselImo: r.vesselImo,
        vesselMmsi: r.vesselMmsi,
      }));

      sendSuccess(res, data, 200, { page, limit, total: count });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list sanctions screening');
    }
  },
);

router.get('/vessels/sanctions/summary', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
    if (orgVesselIds !== null && orgVesselIds.length === 0) {
      sendSuccess(res, { ofacDistribution: [], pscDistribution: [], stats: {} });
      return;
    }
    const scope =
      orgVesselIds !== null
        ? inArray(vesselSanctionsScreeningTable.vesselId, orgVesselIds)
        : undefined;

    const [ofacDistribution, pscDistribution, complianceStats] = await Promise.all([
      db
        .select({
          status: vesselSanctionsScreeningTable.ofacStatus,
          count: sql<number>`count(*)::int`,
        })
        .from(vesselSanctionsScreeningTable)
        .where(scope)
        .groupBy(vesselSanctionsScreeningTable.ofacStatus),

      db
        .select({
          result: vesselSanctionsScreeningTable.pscResult,
          count: sql<number>`count(*)::int`,
          avgDeficiencies: sql<number>`coalesce(avg(psc_deficiencies), 0)::float`,
        })
        .from(vesselSanctionsScreeningTable)
        .where(scope)
        .groupBy(vesselSanctionsScreeningTable.pscResult),

      db
        .select({
          avgScore: sql<number>`coalesce(avg(compliance_score::float), 0)`,
          minScore: sql<number>`coalesce(min(compliance_score::float), 0)`,
          maxScore: sql<number>`coalesce(max(compliance_score::float), 0)`,
          clearCount: sql<number>`count(*) filter (where ofac_status = 'clear')::int`,
          matchCount: sql<number>`count(*) filter (where ofac_status in ('match', 'partial_match'))::int`,
          opaqueCount: sql<number>`count(*) filter (where ownership_opaque = true)::int`,
        })
        .from(vesselSanctionsScreeningTable)
        .where(scope),
    ]);

    sendSuccess(res, {
      ofacDistribution,
      pscDistribution,
      stats: complianceStats[0] ?? {},
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get sanctions summary');
  }
});

router.get('/vessels/:id/sanctions', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const ownVessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!ownVessel) {
      sendNotFound(res, 'Sanctions Screening');
      return;
    }
    const [row] = await db
      .select()
      .from(vesselSanctionsScreeningTable)
      .where(eq(vesselSanctionsScreeningTable.vesselId, id));
    if (!row) {
      sendNotFound(res, 'Sanctions Screening');
      return;
    }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get vessel sanctions');
  }
});

// ── Port Calls ───────────────────────────────────────────────────────────────

router.get(
  '/vessels/port-calls',
  authMiddleware(),
  tenantScope(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const vesselIdFilter = req.query.vesselId
        ? parseInt(req.query.vesselId as string, 10)
        : undefined;
      const purposeFilter = req.query.purpose as VesselPortCall['purpose'] | undefined;

      const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
      if (orgVesselIds !== null && orgVesselIds.length === 0) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }
      if (vesselIdFilter && orgVesselIds !== null && !orgVesselIds.includes(vesselIdFilter)) {
        sendSuccess(res, [], 200, { page, limit, total: 0 });
        return;
      }

      const conditions: SQL[] = [];
      if (vesselIdFilter && !Number.isNaN(vesselIdFilter))
        conditions.push(eq(vesselPortCallsTable.vesselId, vesselIdFilter));
      else if (orgVesselIds !== null)
        conditions.push(inArray(vesselPortCallsTable.vesselId, orgVesselIds));
      if (purposeFilter) conditions.push(eq(vesselPortCallsTable.purpose, purposeFilter));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const baseSelect = db
        .select({
          portCall: vesselPortCallsTable,
          vesselName: vesselsTable.name,
          vesselType: vesselsTable.vesselType,
        })
        .from(vesselPortCallsTable)
        .leftJoin(vesselsTable, eq(vesselPortCallsTable.vesselId, vesselsTable.id));

      const [rows, [{ count }]] = await Promise.all([
        baseSelect
          .where(whereClause)
          .orderBy(desc(vesselPortCallsTable.arrivalAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vesselPortCallsTable)
          .where(whereClause),
      ]);

      const data = rows.map((r) => ({
        ...r.portCall,
        vesselName: r.vesselName,
        vesselType: r.vesselType,
      }));

      sendSuccess(res, data, 200, { page, limit, total: count });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list port calls');
    }
  },
);

router.get('/vessels/:id/port-calls', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const ownVessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!ownVessel) {
      sendNotFound(res, 'Vessel not found');
      return;
    }
    const rows = await db
      .select()
      .from(vesselPortCallsTable)
      .where(eq(vesselPortCallsTable.vesselId, id))
      .orderBy(desc(vesselPortCallsTable.arrivalAt))
      .limit(20);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get vessel port calls');
  }
});

// ── Per-vessel sub-resources ─────────────────────────────────────────────────

router.get('/vessels/:id/maintenance', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const ownVessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!ownVessel) {
      sendNotFound(res, 'Vessel not found');
      return;
    }
    const items = await db
      .select()
      .from(vesselMaintenanceTable)
      .where(eq(vesselMaintenanceTable.vesselId, id))
      .orderBy(desc(vesselMaintenanceTable.dueDate));
    sendSuccess(res, items);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get vessel maintenance');
  }
});

router.get('/vessels/:id/voyages', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const ownVessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!ownVessel) {
      sendNotFound(res, 'Vessel not found');
      return;
    }
    const voyages = await db
      .select()
      .from(vesselVoyageEconomicsTable)
      .where(eq(vesselVoyageEconomicsTable.vesselId, id))
      .orderBy(desc(vesselVoyageEconomicsTable.createdAt));
    sendSuccess(res, voyages);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get vessel voyages');
  }
});

router.get('/vessels/:id/exceptions', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const ownVessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!ownVessel) {
      sendNotFound(res, 'Vessel not found');
      return;
    }
    const exceptions = await db
      .select()
      .from(fleetExceptionsTable)
      .where(eq(fleetExceptionsTable.vesselId, id))
      .orderBy(desc(fleetExceptionsTable.detectedAt));
    sendSuccess(res, exceptions);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get vessel exceptions');
  }
});

// ── Ports ────────────────────────────────────────────────────────────────────

router.get('/vessels/ports', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(portsTable).orderBy(portsTable.name).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(portsTable),
    ]);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list ports');
  }
});

// ── Fleet Readiness ──────────────────────────────────────────────────────────

router.get('/vessels/readiness', authMiddleware(), tenantScope(), async (req, res) => {
  try {
    const vWhere = vesselOrgWhere(req.tenantOrgId);
    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
    const subVesselFilter =
      orgVesselIds === null
        ? undefined
        : orgVesselIds.length === 0
          ? sql`false`
          : sql`vessel_id = ANY(${orgVesselIds})`;
    const [vessels, maintenanceItems, activeExceptions] = await Promise.all([
      vWhere
        ? db.select({ id: vesselsTable.id }).from(vesselsTable).where(vWhere).limit(60)
        : db.select({ id: vesselsTable.id }).from(vesselsTable).limit(60),
      db
        .select({ vesselId: vesselMaintenanceTable.vesselId })
        .from(vesselMaintenanceTable)
        .where(
          subVesselFilter
            ? and(eq(vesselMaintenanceTable.status, 'overdue'), subVesselFilter)
            : eq(vesselMaintenanceTable.status, 'overdue'),
        ),
      db
        .select({
          vesselId: fleetExceptionsTable.vesselId,
          severity: fleetExceptionsTable.severity,
        })
        .from(fleetExceptionsTable)
        .where(
          subVesselFilter
            ? and(eq(fleetExceptionsTable.status, 'active'), subVesselFilter)
            : eq(fleetExceptionsTable.status, 'active'),
        ),
    ]);

    const overdueVesselIds = new Set(maintenanceItems.map((m) => m.vesselId));
    const criticalExcVesselIds = new Set(
      activeExceptions
        .filter((e) => e.severity === 'critical' || e.severity === 'high')
        .map((e) => e.vesselId),
    );
    const readyVessels = vessels.filter(
      (v) => !overdueVesselIds.has(v.id) && !criticalExcVesselIds.has(v.id),
    );

    sendSuccess(res, {
      totalVessels: vessels.length,
      readyVessels: readyVessels.length,
      readinessScore:
        vessels.length > 0 ? Math.round((readyVessels.length / vessels.length) * 100) : 0,
      overdueMaintenanceCount: maintenanceItems.length,
      criticalExceptionCount: activeExceptions.filter((e) => e.severity === 'critical').length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to build vessels readiness');
  }
});

// ── Seed endpoint (admin-only) ────────────────────────────────────────────────

router.post(
  '/vessels/seed',
  validateBody(bodyShape({})),
  authMiddleware(),
  adminGuard,
  async (_req, res) => {
    if (guardSeedInProduction(res)) return;
    try {
      logger.info('Vessels seed triggered by admin');
      await seedVesselsData();
      sendSuccess(res, { message: 'Vessels seed completed successfully' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to seed vessels data');
    }
  },
);

export default router;
