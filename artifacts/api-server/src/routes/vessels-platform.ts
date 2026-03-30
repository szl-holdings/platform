import { Router, type IRouter } from "express";
import {
  db,
  maritimeVesselsTable,
  portsTable,
  voyagesTable,
  maritimeExceptionsTable,
  corridorsTable,
  readinessItemsTable,
  platformSignalsTable,
  eventLogTable,
  workflowsTable,
  workflowRunsTable,
} from "@workspace/db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam, canAccessOrgRecord } from "../middlewares/auth";
import { isFlagEnabled } from "../lib/platform-flags";

const router: IRouter = Router();
const VESSELS_PRODUCT = "vessels";

function logVesselsEvent(orgId: number, actorId: number | null, actorName: string, eventType: string, entityType: string, entityId: string | null) {
  db.insert(eventLogTable).values({
    orgId,
    product: VESSELS_PRODUCT,
    actorId: actorId ?? undefined,
    actorName,
    eventType,
    entityType,
    entityId,
  }).catch(() => {});
}

async function triggerAlloyWorkflow(orgId: number, product: string, entityType: string, entityId: number, triggerData: Record<string, unknown>) {
  try {
    const [workflow] = await db.select().from(workflowsTable).where(
      and(
        eq(workflowsTable.orgId, orgId),
        eq(workflowsTable.status, "active"),
        eq(workflowsTable.product, "alloy"),
      )
    ).limit(1);

    if (workflow) {
      await db.insert(workflowRunsTable).values({
        orgId,
        workflowId: workflow.id,
        status: "queued",
        input: { product, entityType, entityId, ...triggerData },
        startedAt: new Date(),
      });
    }
  } catch {
  }
}

function buildFleetSummary(vessels: any[]) {
  const atSea = vessels.filter(v => v.status === "at_sea");
  const inPort = vessels.filter(v => v.status === "in_port");
  const maintenance = vessels.filter(v => v.status === "maintenance");
  const anchored = vessels.filter(v => v.status === "anchored");

  return {
    total: vessels.length,
    atSea: atSea.length,
    inPort: inPort.length,
    maintenance: maintenance.length,
    anchored: anchored.length,
    active: vessels.filter(v => v.status === "active").length,
    utilizationRate: vessels.length > 0 ? Math.round((atSea.length / vessels.length) * 100) : 0,
  };
}

function buildMapPayload(vessels: any[], ports: any[], exceptions: any[]) {
  const vesselPoints = vessels
    .filter(v => v.latitude && v.longitude)
    .map(v => ({
      id: v.id,
      name: v.name,
      type: "vessel" as const,
      lat: parseFloat(v.latitude),
      lon: parseFloat(v.longitude),
      status: v.status,
      vesselType: v.vesselType,
      heading: v.heading ? parseFloat(v.heading) : null,
      speed: v.speedOverGround ? parseFloat(v.speedOverGround) : null,
      flag: v.flag,
      hasException: exceptions.some(e => e.vesselId === v.id && !["resolved", "dismissed"].includes(e.status)),
    }));

  const portPoints = ports
    .filter(p => p.latitude && p.longitude)
    .map(p => ({
      id: p.id,
      name: p.name,
      type: "port" as const,
      lat: parseFloat(p.latitude),
      lon: parseFloat(p.longitude),
      status: p.status,
      locode: p.locode,
      country: p.country,
    }));

  const exceptionPoints = exceptions
    .filter(e => !["resolved", "dismissed"].includes(e.status))
    .filter(e => {
      const vessel = vessels.find(v => v.id === e.vesselId);
      return vessel?.latitude && vessel?.longitude;
    })
    .map(e => {
      const vessel = vessels.find(v => v.id === e.vesselId);
      return {
        id: e.id,
        type: "exception" as const,
        lat: parseFloat(vessel?.latitude ?? "0"),
        lon: parseFloat(vessel?.longitude ?? "0"),
        severity: e.severity,
        title: e.title,
        exceptionType: e.exceptionType,
        vesselId: e.vesselId,
      };
    });

  return { vessels: vesselPoints, ports: portPoints, exceptions: exceptionPoints };
}

function calculateEtaDrift(voyage: any): number {
  if (!voyage.scheduledArrivalAt || !voyage.estimatedArrivalAt) return 0;
  const scheduled = new Date(voyage.scheduledArrivalAt).getTime();
  const estimated = new Date(voyage.estimatedArrivalAt).getTime();
  return Math.round((estimated - scheduled) / 3600000);
}

function detectRouteDeviation(vessel: any, voyage: any): { deviated: boolean; severityKm?: number; reason?: string } {
  if (!voyage || !vessel.latitude || !vessel.longitude) return { deviated: false };

  const driftHours = parseFloat(voyage.etaDriftHours ?? "0");
  if (Math.abs(driftHours) > 12) {
    return {
      deviated: true,
      severityKm: Math.abs(driftHours) * 18.52,
      reason: driftHours > 0 ? "Behind schedule — possible weather detour" : "Ahead of schedule",
    };
  }
  return { deviated: false };
}

function computeVoyageEconomics(voyage: any) {
  const revenue = parseFloat(voyage.revenueUsd ?? "0");
  const fuelCost = parseFloat(voyage.fuelCostUsd ?? "0");
  const portCosts = parseFloat(voyage.portCostsUsd ?? "0");
  const totalCost = fuelCost + portCosts;
  const grossMargin = revenue > 0 ? ((revenue - totalCost) / revenue) * 100 : 0;
  const dailyRate = parseFloat(voyage.charterRatePerDay ?? "0");

  const scheduledDeparture = voyage.scheduledDepartureAt ? new Date(voyage.scheduledDepartureAt) : null;
  const scheduledArrival = voyage.scheduledArrivalAt ? new Date(voyage.scheduledArrivalAt) : null;
  const plannedDays = (scheduledDeparture && scheduledArrival)
    ? (scheduledArrival.getTime() - scheduledDeparture.getTime()) / 86400000
    : null;

  return {
    revenueUsd: revenue,
    fuelCostUsd: fuelCost,
    portCostsUsd: portCosts,
    totalCostUsd: totalCost,
    grossMarginPct: Math.round(grossMargin * 10) / 10,
    netProfitUsd: revenue - totalCost,
    charterRatePerDay: dailyRate,
    plannedDurationDays: plannedDays ? Math.round(plannedDays) : null,
    costPerNm: voyage.distanceNm ? Math.round(totalCost / parseFloat(voyage.distanceNm) * 100) / 100 : null,
  };
}

function buildExceptionQueue(exceptions: any[], vessels: any[]) {
  const active = exceptions.filter(e => !["resolved", "dismissed"].includes(e.status));
  const bySeverity = {
    critical: active.filter(e => e.severity === "critical"),
    high: active.filter(e => e.severity === "high"),
    medium: active.filter(e => e.severity === "medium"),
    low: active.filter(e => e.severity === "low"),
  };

  const totalValueAtRisk = active
    .filter(e => e.valueAtRiskUsd)
    .reduce((sum, e) => sum + parseFloat(e.valueAtRiskUsd), 0);

  return {
    total: active.length,
    bySeverity: {
      critical: bySeverity.critical.length,
      high: bySeverity.high.length,
      medium: bySeverity.medium.length,
      low: bySeverity.low.length,
    },
    totalValueAtRiskUsd: Math.round(totalValueAtRisk),
    priorityQueue: bySeverity.critical.concat(bySeverity.high).slice(0, 10).map(e => ({
      ...e,
      vesselName: vessels.find(v => v.id === e.vesselId)?.name ?? "Unknown",
    })),
  };
}

function buildMaintenanceWatch(vessels: any[]) {
  const maintenance = vessels.filter(v => v.status === "maintenance");
  const atRisk = vessels.filter(v => {
    const age = v.yearBuilt ? new Date().getFullYear() - v.yearBuilt : 0;
    return age > 20 && v.status !== "maintenance" && v.status !== "decommissioned";
  });

  return {
    activeMaintenanceCount: maintenance.length,
    atRiskVessels: atRisk.slice(0, 5).map(v => ({
      id: v.id,
      name: v.name,
      age: v.yearBuilt ? new Date().getFullYear() - v.yearBuilt : null,
      status: v.status,
      vesselType: v.vesselType,
    })),
    maintenanceVessels: maintenance.map(v => ({
      id: v.id,
      name: v.name,
      vesselType: v.vesselType,
      flag: v.flag,
    })),
  };
}

function buildCorridorIntelligence(corridors: any[]) {
  const highRisk = corridors.filter(c => c.riskLevel === "high" || c.riskLevel === "critical");
  const activeConflictCorridors = corridors.filter(c => Array.isArray(c.activeConflicts) && c.activeConflicts.length > 0);

  return {
    totalCorridors: corridors.length,
    highRiskCount: highRisk.length,
    activeConflictCount: activeConflictCorridors.length,
    riskDistribution: {
      critical: corridors.filter(c => c.riskLevel === "critical").length,
      high: corridors.filter(c => c.riskLevel === "high").length,
      moderate: corridors.filter(c => c.riskLevel === "moderate").length,
      low: corridors.filter(c => c.riskLevel === "low").length,
    },
    watchList: highRisk.slice(0, 5),
  };
}

router.get("/vessels/platform/dashboard", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [vessels, ports, voyages, exceptions, readinessItems, corridors] = await Promise.all([
      db.select().from(maritimeVesselsTable).where(eq(maritimeVesselsTable.orgId, orgId)).orderBy(desc(maritimeVesselsTable.updatedAt)),
      db.select().from(portsTable).where(
        or(eq(portsTable.orgId, orgId), sql`${portsTable.orgId} IS NULL`)
      ).limit(100),
      db.select().from(voyagesTable).where(eq(voyagesTable.orgId, orgId)).orderBy(desc(voyagesTable.createdAt)).limit(50),
      db.select().from(maritimeExceptionsTable).where(eq(maritimeExceptionsTable.orgId, orgId)).orderBy(desc(maritimeExceptionsTable.detectedAt)),
      db.select().from(readinessItemsTable).where(
        and(eq(readinessItemsTable.orgId, orgId), eq(readinessItemsTable.product, VESSELS_PRODUCT))
      ).limit(20),
      db.select().from(corridorsTable).where(
        or(eq(corridorsTable.orgId, orgId), sql`${corridorsTable.orgId} IS NULL`)
      ).orderBy(corridorsTable.riskLevel),
    ]);

    const activeVoyages = voyages.filter(v => ["departed", "at_sea", "loading", "discharging"].includes(v.status));
    const etaDrifts = activeVoyages.map(v => ({
      voyageId: v.id,
      vesselId: v.vesselId,
      driftHours: calculateEtaDrift(v),
    })).filter(d => Math.abs(d.driftHours) > 6);

    const readinessScore = readinessItems.length > 0
      ? Math.round(readinessItems.filter(r => r.status === "completed").length / readinessItems.length * 100)
      : 0;

    sendSuccess(res, {
      fleetSummary: buildFleetSummary(vessels),
      mapPayload: buildMapPayload(vessels, ports, exceptions),
      exceptionQueue: buildExceptionQueue(exceptions, vessels),
      maintenanceWatch: buildMaintenanceWatch(vessels),
      corridorIntelligence: buildCorridorIntelligence(corridors),
      etaDriftAlerts: etaDrifts.slice(0, 10),
      voyageSummary: {
        total: voyages.length,
        active: activeVoyages.length,
        planned: voyages.filter(v => v.status === "planned").length,
        completed: voyages.filter(v => v.status === "completed").length,
      },
      readinessScore,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to build vessels dashboard");
  }
});

router.get("/vessels/platform/fleet", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const status = req.query.status as string | undefined;

    const vessels = await db.select().from(maritimeVesselsTable).where(
      and(
        eq(maritimeVesselsTable.orgId, orgId),
        status ? eq(maritimeVesselsTable.status, status as typeof maritimeVesselsTable.status._.data) : undefined,
      )
    ).orderBy(maritimeVesselsTable.name);

    sendSuccess(res, { vessels, summary: buildFleetSummary(vessels) });
  } catch (err) {
    handleRouteError(res, err, "Failed to get fleet");
  }
});

router.get("/vessels/platform/map", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [vessels, ports, exceptions] = await Promise.all([
      db.select().from(maritimeVesselsTable).where(eq(maritimeVesselsTable.orgId, orgId)),
      db.select().from(portsTable).where(
        or(eq(portsTable.orgId, orgId), sql`${portsTable.orgId} IS NULL`)
      ).limit(50),
      db.select().from(maritimeExceptionsTable).where(
        and(eq(maritimeExceptionsTable.orgId, orgId))
      ).orderBy(desc(maritimeExceptionsTable.detectedAt)).limit(50),
    ]);

    sendSuccess(res, buildMapPayload(vessels, ports, exceptions));
  } catch (err) {
    handleRouteError(res, err, "Failed to build map payload");
  }
});

router.get("/vessels/platform/vessels/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [vessel] = await db.select().from(maritimeVesselsTable).where(
      and(eq(maritimeVesselsTable.id, id), eq(maritimeVesselsTable.orgId, orgId))
    );
    if (!vessel) { sendNotFound(res, "Vessel"); return; }

    const [activeVoyages, recentExceptions] = await Promise.all([
      db.select().from(voyagesTable).where(
        and(eq(voyagesTable.vesselId, id), or(
          eq(voyagesTable.status, "at_sea"),
          eq(voyagesTable.status, "departed"),
          eq(voyagesTable.status, "loading"),
        ))
      ).limit(1),
      db.select().from(maritimeExceptionsTable).where(
        and(eq(maritimeExceptionsTable.vesselId, id), eq(maritimeExceptionsTable.orgId, orgId))
      ).orderBy(desc(maritimeExceptionsTable.detectedAt)).limit(5),
    ]);

    const currentVoyage = activeVoyages[0];
    const etaDrift = currentVoyage ? calculateEtaDrift(currentVoyage) : null;
    const routeDeviation = currentVoyage ? detectRouteDeviation(vessel, currentVoyage) : null;
    const economics = currentVoyage ? computeVoyageEconomics(currentVoyage) : null;

    sendSuccess(res, {
      vessel,
      currentVoyage: currentVoyage || null,
      etaDriftHours: etaDrift,
      routeDeviation,
      economics,
      recentExceptions,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel detail");
  }
});

router.post("/vessels/platform/vessels", authMiddleware(), async (req, res) => {
  try {
    const commandEnabled = await isFlagEnabled("vessels_command_mode_enabled");
    if (!commandEnabled) {
      res.status(403).json({ error: "Feature not available", feature: "vessels_command_mode_enabled", message: "Vessel command mode is not enabled" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const vesselType = (typeof body.vesselType === "string" ? body.vesselType : "container") as "container" | "bulk_carrier" | "tanker" | "ro_ro" | "general_cargo" | "lng" | "lpg" | "cruise" | "offshore" | "other";
    const vesselStatus = (typeof body.status === "string" ? body.status : "active") as "active" | "inactive" | "under_maintenance" | "decommissioned" | "at_sea" | "in_port" | "anchored";

    const [vessel] = await db.insert(maritimeVesselsTable).values({
      orgId,
      name: body.name as string,
      imo: typeof body.imo === "string" ? body.imo : null,
      mmsi: typeof body.mmsi === "string" ? body.mmsi : null,
      callSign: typeof body.callSign === "string" ? body.callSign : null,
      flag: typeof body.flag === "string" ? body.flag : null,
      vesselType,
      yearBuilt: typeof body.yearBuilt === "number" ? body.yearBuilt : null,
      grossTonnage: body.grossTonnage ? String(body.grossTonnage) : null,
      status: vesselStatus,
      latitude: body.latitude ? String(body.latitude) : null,
      longitude: body.longitude ? String(body.longitude) : null,
      metadata: (body.metadata && typeof body.metadata === "object") ? body.metadata as Record<string, unknown> : null,
    }).returning();

    logVesselsEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", "vessel.created", "maritime_vessel", String(vessel.id));
    sendCreated(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to create vessel");
  }
});

router.patch("/vessels/platform/vessels/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const { orgId: _drop, ...safeBody } = req.body as Record<string, unknown>;
    const [vessel] = await db.update(maritimeVesselsTable).set({ ...safeBody, updatedAt: new Date() } as Partial<typeof maritimeVesselsTable.$inferInsert>).where(
      and(eq(maritimeVesselsTable.id, id), eq(maritimeVesselsTable.orgId, orgId))
    ).returning();

    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendSuccess(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to update vessel");
  }
});

router.get("/vessels/platform/voyages", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);

    const voyages = await db.select().from(voyagesTable).where(
      and(
        eq(voyagesTable.orgId, orgId),
        vesselId ? eq(voyagesTable.vesselId, vesselId) : undefined,
        status ? eq(voyagesTable.status, status as typeof voyagesTable.status._.data) : undefined,
      )
    ).orderBy(desc(voyagesTable.createdAt)).limit(limit);

    const enriched = voyages.map(v => ({
      ...v,
      etaDriftHours: calculateEtaDrift(v),
      economics: computeVoyageEconomics(v),
    }));

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(voyagesTable).where(eq(voyagesTable.orgId, orgId));

    sendSuccess(res, enriched, 200, { total: count, limit });
  } catch (err) {
    handleRouteError(res, err, "Failed to list voyages");
  }
});

router.get("/vessels/platform/voyages/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [voyage] = await db.select().from(voyagesTable).where(
      and(eq(voyagesTable.id, id), eq(voyagesTable.orgId, orgId))
    );
    if (!voyage) { sendNotFound(res, "Voyage"); return; }

    const [vessel] = await db.select().from(maritimeVesselsTable).where(eq(maritimeVesselsTable.id, voyage.vesselId));
    const routeDeviation = detectRouteDeviation(vessel, voyage);

    sendSuccess(res, {
      ...voyage,
      etaDriftHours: calculateEtaDrift(voyage),
      economics: computeVoyageEconomics(voyage),
      routeDeviation,
      vessel: vessel || null,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get voyage");
  }
});

router.post("/vessels/platform/voyages", authMiddleware(), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const voyageStatus = (typeof body.status === "string" ? body.status : "planned") as "planned" | "active" | "in_progress" | "completed" | "cancelled" | "delayed";

    const [voyage] = await db.insert(voyagesTable).values({
      orgId,
      vesselId: body.vesselId as number,
      voyageNumber: typeof body.voyageNumber === "string" ? body.voyageNumber : null,
      originPortId: typeof body.originPortId === "number" ? body.originPortId : null,
      destinationPortId: typeof body.destinationPortId === "number" ? body.destinationPortId : null,
      cargoType: typeof body.cargoType === "string" ? body.cargoType : null,
      cargoDescription: typeof body.cargoDescription === "string" ? body.cargoDescription : null,
      cargoTonnage: body.cargoTonnage ? String(body.cargoTonnage) : null,
      cargoValueUsd: body.cargoValueUsd ? String(body.cargoValueUsd) : null,
      status: voyageStatus,
      scheduledDepartureAt: body.scheduledDepartureAt ? new Date(body.scheduledDepartureAt as string) : null,
      scheduledArrivalAt: body.scheduledArrivalAt ? new Date(body.scheduledArrivalAt as string) : null,
      estimatedArrivalAt: body.estimatedArrivalAt ? new Date(body.estimatedArrivalAt as string) : null,
      distanceNm: body.distanceNm ? String(body.distanceNm) : null,
      revenueUsd: body.revenueUsd ? String(body.revenueUsd) : null,
      charterRatePerDay: body.charterRatePerDay ? String(body.charterRatePerDay) : null,
      corridorId: typeof body.corridorId === "number" ? body.corridorId : null,
      metadata: (body.metadata && typeof body.metadata === "object") ? body.metadata as Record<string, unknown> : null,
    }).returning();

    logVesselsEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", "voyage.created", "voyage", String(voyage.id));
    sendCreated(res, voyage);
  } catch (err) {
    handleRouteError(res, err, "Failed to create voyage");
  }
});

router.patch("/vessels/platform/voyages/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const { orgId: _drop, ...safeBody } = req.body as Record<string, unknown>;
    const [voyage] = await db.update(voyagesTable).set({ ...safeBody, updatedAt: new Date() } as Partial<typeof maritimeVesselsTable.$inferInsert>).where(
      and(eq(voyagesTable.id, id), eq(voyagesTable.orgId, orgId))
    ).returning();

    if (!voyage) { sendNotFound(res, "Voyage"); return; }
    sendSuccess(res, { ...voyage, etaDriftHours: calculateEtaDrift(voyage), economics: computeVoyageEconomics(voyage) });
  } catch (err) {
    handleRouteError(res, err, "Failed to update voyage");
  }
});

router.get("/vessels/platform/exceptions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;
    const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);

    const exceptions = await db.select().from(maritimeExceptionsTable).where(
      and(
        eq(maritimeExceptionsTable.orgId, orgId),
        status ? eq(maritimeExceptionsTable.status, status as typeof maritimeExceptionsTable.status._.data) : undefined,
        severity ? eq(maritimeExceptionsTable.severity, severity as typeof maritimeExceptionsTable.severity._.data) : undefined,
        vesselId ? eq(maritimeExceptionsTable.vesselId, vesselId) : undefined,
      )
    ).orderBy(desc(maritimeExceptionsTable.detectedAt)).limit(limit);

    const vessels = await db.select({ id: maritimeVesselsTable.id, name: maritimeVesselsTable.name }).from(maritimeVesselsTable).where(eq(maritimeVesselsTable.orgId, orgId));

    const enriched = exceptions.map(e => ({
      ...e,
      vesselName: vessels.find(v => v.id === e.vesselId)?.name ?? null,
    }));

    sendSuccess(res, enriched, 200, { total: enriched.length, limit });
  } catch (err) {
    handleRouteError(res, err, "Failed to list exceptions");
  }
});

router.get("/vessels/platform/exceptions/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [exc] = await db.select().from(maritimeExceptionsTable).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId)));
    if (!exc) { sendNotFound(res, "Exception"); return; }

    const vessel = exc.vesselId ? (await db.select({ id: maritimeVesselsTable.id, name: maritimeVesselsTable.name, vesselType: maritimeVesselsTable.vesselType, flag: maritimeVesselsTable.flag }).from(maritimeVesselsTable).where(eq(maritimeVesselsTable.id, exc.vesselId)).limit(1))[0] : null;
    const voyage = exc.voyageId ? (await db.select().from(voyagesTable).where(eq(voyagesTable.id, exc.voyageId)).limit(1))[0] : null;

    sendSuccess(res, { ...exc, vessel: vessel ?? null, voyage: voyage ?? null });
  } catch (err) {
    handleRouteError(res, err, "Failed to get exception");
  }
});

router.post("/vessels/platform/exceptions/:id/acknowledge", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const [exc] = await db.update(maritimeExceptionsTable).set({
      status: "acknowledged",
      acknowledgedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId))).returning();

    if (!exc) { sendNotFound(res, "Exception"); return; }
    logVesselsEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", "exception.acknowledged", "maritime_exception", String(id));
    sendSuccess(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to acknowledge exception");
  }
});

router.post("/vessels/platform/exceptions/:id/assign", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const { assignedTo } = req.body as { assignedTo: number };
    if (!assignedTo || typeof assignedTo !== "number") { sendBadRequest(res, "assignedTo (number) required"); return; }

    const [exc] = await db.update(maritimeExceptionsTable).set({
      status: "assigned",
      assignedTo,
      updatedAt: new Date(),
    }).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId))).returning();

    if (!exc) { sendNotFound(res, "Exception"); return; }
    logVesselsEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", "exception.assigned", "maritime_exception", String(id));
    sendSuccess(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to assign exception");
  }
});

router.post("/vessels/platform/exceptions/:id/escalate", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const reason = typeof req.body?.reason === "string" ? req.body.reason : null;
    const [exc] = await db.update(maritimeExceptionsTable).set({
      status: "escalated",
      severity: "critical",
      updatedAt: new Date(),
      metadata: { escalatedAt: new Date().toISOString(), escalatedBy: req.user.displayName ?? "system", reason },
    }).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId))).returning();

    if (!exc) { sendNotFound(res, "Exception"); return; }
    logVesselsEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", "exception.escalated", "maritime_exception", String(id));
    await triggerAlloyWorkflow(orgId, VESSELS_PRODUCT, "maritime_exception", id, {
      action: "escalate",
      exceptionId: id,
      severity: "critical",
      vesselId: exc.vesselId,
      voyageId: exc.voyageId,
      exceptionType: exc.exceptionType,
      title: exc.title,
    });
    sendSuccess(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate exception");
  }
});

router.post("/vessels/platform/exceptions/:id/resolve", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const resolution = typeof req.body?.resolution === "string" ? req.body.resolution : null;
    const [exc] = await db.update(maritimeExceptionsTable).set({
      status: "resolved",
      resolvedAt: new Date(),
      updatedAt: new Date(),
      metadata: { resolution, resolvedBy: req.user.displayName ?? "system" },
    }).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId))).returning();

    if (!exc) { sendNotFound(res, "Exception"); return; }
    logVesselsEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", "exception.resolved", "maritime_exception", String(id));
    sendSuccess(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve exception");
  }
});

router.post("/vessels/platform/exceptions", authMiddleware(), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const exceptionType = (typeof body.exceptionType === "string" ? body.exceptionType : "other") as "eta_delay" | "cargo_damage" | "weather_deviation" | "mechanical_failure" | "crew_incident" | "port_delay" | "route_deviation" | "fuel_overconsumption" | "regulatory_violation" | "security_incident" | "other";
    const severity = (typeof body.severity === "string" ? body.severity : "medium") as "low" | "medium" | "high" | "critical";

    const [exc] = await db.insert(maritimeExceptionsTable).values({
      orgId,
      vesselId: typeof body.vesselId === "number" ? body.vesselId : null,
      voyageId: typeof body.voyageId === "number" ? body.voyageId : null,
      signalId: typeof body.signalId === "number" ? body.signalId : null,
      exceptionType,
      severity,
      title: body.title as string,
      description: typeof body.description === "string" ? body.description : null,
      status: "new",
      valueAtRiskUsd: body.valueAtRiskUsd ? String(body.valueAtRiskUsd) : null,
      etaImpactHours: body.etaImpactHours ? String(body.etaImpactHours) : null,
      costImpactUsd: body.costImpactUsd ? String(body.costImpactUsd) : null,
      detectedAt: new Date(),
      metadata: (body.metadata && typeof body.metadata === "object") ? body.metadata as Record<string, unknown> : null,
    }).returning();

    logVesselsEvent(orgId, req.user.id ?? null, req.user.displayName ?? "system", "exception.created", "maritime_exception", String(exc.id));
    sendCreated(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to create exception");
  }
});

router.get("/vessels/platform/routes", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const vesselId = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;
    const status = req.query.status as string | undefined;

    const voyages = await db.select().from(voyagesTable).where(
      and(
        eq(voyagesTable.orgId, orgId),
        vesselId ? eq(voyagesTable.vesselId, vesselId) : undefined,
        status ? eq(voyagesTable.status, status as typeof voyagesTable.status._.data) : undefined,
      )
    ).orderBy(desc(voyagesTable.createdAt)).limit(100);

    const enriched = voyages.map(v => ({
      ...v,
      etaDriftHours: calculateEtaDrift(v),
      economics: computeVoyageEconomics(v),
    }));

    sendSuccess(res, { routes: enriched, total: enriched.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list routes");
  }
});

router.get("/vessels/platform/routes/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [voyage] = await db.select().from(voyagesTable).where(and(eq(voyagesTable.id, id), eq(voyagesTable.orgId, orgId)));
    if (!voyage) { sendNotFound(res, "Route"); return; }

    const vesselRows = voyage.vesselId ? await db.select().from(maritimeVesselsTable).where(eq(maritimeVesselsTable.id, voyage.vesselId)).limit(1) : [];
    const vessel = vesselRows[0] ?? null;
    const routeDeviation = vessel ? detectRouteDeviation(vessel, voyage) : null;

    sendSuccess(res, {
      ...voyage,
      etaDriftHours: calculateEtaDrift(voyage),
      economics: computeVoyageEconomics(voyage),
      routeDeviation,
      vessel: vessel ?? null,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get route");
  }
});

router.get("/vessels/platform/ports", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const ports = await db.select().from(portsTable).where(
      or(eq(portsTable.orgId, orgId), sql`${portsTable.orgId} IS NULL`)
    ).orderBy(portsTable.name);

    sendSuccess(res, ports);
  } catch (err) {
    handleRouteError(res, err, "Failed to list ports");
  }
});

router.get("/vessels/platform/corridors", authMiddleware({ required: false }), async (req, res) => {
  try {
    const corridorEnabled = await isFlagEnabled("vessels_corridor_intelligence_enabled");
    if (!corridorEnabled) {
      res.status(403).json({ error: "Feature not available", feature: "vessels_corridor_intelligence_enabled", fallback: { corridors: [], intelligence: { totalCorridors: 0, highRiskCount: 0, activeConflictCount: 0 } } });
      return;
    }
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const corridors = await db.select().from(corridorsTable).where(
      or(eq(corridorsTable.orgId, orgId), sql`${corridorsTable.orgId} IS NULL`)
    ).orderBy(corridorsTable.riskLevel);

    sendSuccess(res, { corridors, intelligence: buildCorridorIntelligence(corridors) });
  } catch (err) {
    handleRouteError(res, err, "Failed to get corridors");
  }
});

router.get("/vessels/platform/readiness", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const items = await db.select().from(readinessItemsTable).where(
      and(eq(readinessItemsTable.orgId, orgId), eq(readinessItemsTable.product, VESSELS_PRODUCT))
    ).orderBy(readinessItemsTable.priority);

    const byCategory: Record<string, any[]> = {};
    for (const item of items) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    }

    const overallScore = items.length > 0
      ? Math.round(items.filter(i => i.status === "completed").length / items.length * 100)
      : 0;

    sendSuccess(res, { items, byCategory, overallScore, totalItems: items.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to get readiness");
  }
});

router.post("/vessels/platform/readiness", authMiddleware(), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;
    if (!req.user || !canAccessOrgRecord(req.user, orgId)) { res.status(403).json({ error: "Forbidden" }); return; }

    const category = (typeof body.category === "string" ? body.category : "maritime") as typeof readinessItemsTable.category._.data;
    const priority = (typeof body.priority === "string" ? body.priority : "medium") as typeof readinessItemsTable.priority._.data;

    const [item] = await db.insert(readinessItemsTable).values({
      orgId,
      product: VESSELS_PRODUCT,
      category,
      title: body.title as string,
      description: typeof body.description === "string" ? body.description : null,
      status: "not_started",
      priority,
      ownerId: req.user.id ?? null,
      notes: typeof body.notes === "string" ? body.notes : null,
    }).returning();

    sendCreated(res, item);
  } catch (err) {
    handleRouteError(res, err, "Failed to create readiness item");
  }
});

export default router;
