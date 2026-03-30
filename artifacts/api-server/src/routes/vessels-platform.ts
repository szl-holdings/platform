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
} from "@workspace/db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

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
        status ? eq(maritimeVesselsTable.status, status as any) : undefined,
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

router.post("/vessels/platform/vessels", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;

    const [vessel] = await db.insert(maritimeVesselsTable).values({
      orgId,
      name: body.name as string,
      imo: body.imo as string || null,
      mmsi: body.mmsi as string || null,
      callSign: body.callSign as string || null,
      flag: body.flag as string || null,
      vesselType: (body.vesselType as any) || "container",
      yearBuilt: typeof body.yearBuilt === "number" ? body.yearBuilt : null,
      grossTonnage: body.grossTonnage ? String(body.grossTonnage) : null,
      status: (body.status as any) || "active",
      latitude: body.latitude ? String(body.latitude) : null,
      longitude: body.longitude ? String(body.longitude) : null,
      metadata: (body.metadata as any) || null,
    }).returning();

    logVesselsEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "vessel.created", "maritime_vessel", String(vessel.id));
    sendCreated(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to create vessel");
  }
});

router.patch("/vessels/platform/vessels/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [vessel] = await db.update(maritimeVesselsTable).set({ ...req.body, updatedAt: new Date() }).where(
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
        status ? eq(voyagesTable.status, status as any) : undefined,
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

router.post("/vessels/platform/voyages", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;

    const [voyage] = await db.insert(voyagesTable).values({
      orgId,
      vesselId: body.vesselId as number,
      voyageNumber: body.voyageNumber as string || null,
      originPortId: typeof body.originPortId === "number" ? body.originPortId : null,
      destinationPortId: typeof body.destinationPortId === "number" ? body.destinationPortId : null,
      cargoType: body.cargoType as string || null,
      cargoDescription: body.cargoDescription as string || null,
      cargoTonnage: body.cargoTonnage ? String(body.cargoTonnage) : null,
      cargoValueUsd: body.cargoValueUsd ? String(body.cargoValueUsd) : null,
      status: (body.status as any) || "planned",
      scheduledDepartureAt: body.scheduledDepartureAt ? new Date(body.scheduledDepartureAt as string) : null,
      scheduledArrivalAt: body.scheduledArrivalAt ? new Date(body.scheduledArrivalAt as string) : null,
      estimatedArrivalAt: body.estimatedArrivalAt ? new Date(body.estimatedArrivalAt as string) : null,
      distanceNm: body.distanceNm ? String(body.distanceNm) : null,
      revenueUsd: body.revenueUsd ? String(body.revenueUsd) : null,
      charterRatePerDay: body.charterRatePerDay ? String(body.charterRatePerDay) : null,
      corridorId: typeof body.corridorId === "number" ? body.corridorId : null,
      metadata: (body.metadata as any) || null,
    }).returning();

    logVesselsEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "voyage.created", "voyage", String(voyage.id));
    sendCreated(res, voyage);
  } catch (err) {
    handleRouteError(res, err, "Failed to create voyage");
  }
});

router.patch("/vessels/platform/voyages/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [voyage] = await db.update(voyagesTable).set({ ...req.body, updatedAt: new Date() }).where(
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
    const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);

    const exceptions = await db.select().from(maritimeExceptionsTable).where(
      and(
        eq(maritimeExceptionsTable.orgId, orgId),
        status ? eq(maritimeExceptionsTable.status, status as any) : undefined,
        severity ? eq(maritimeExceptionsTable.severity, severity as any) : undefined,
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

router.post("/vessels/platform/exceptions/:id/acknowledge", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [exc] = await db.update(maritimeExceptionsTable).set({
      status: "acknowledged",
      acknowledgedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId))).returning();

    if (!exc) { sendNotFound(res, "Exception"); return; }
    logVesselsEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "exception.acknowledged", "maritime_exception", String(id));
    sendSuccess(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to acknowledge exception");
  }
});

router.post("/vessels/platform/exceptions/:id/assign", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;
    const { assignedTo } = req.body as { assignedTo: number };
    if (!assignedTo) { sendBadRequest(res, "assignedTo required"); return; }

    const [exc] = await db.update(maritimeExceptionsTable).set({
      status: "assigned",
      assignedTo,
      updatedAt: new Date(),
    }).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId))).returning();

    if (!exc) { sendNotFound(res, "Exception"); return; }
    logVesselsEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "exception.assigned", "maritime_exception", String(id));
    sendSuccess(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to assign exception");
  }
});

router.post("/vessels/platform/exceptions/:id/escalate", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [exc] = await db.update(maritimeExceptionsTable).set({
      status: "escalated",
      severity: "critical",
      updatedAt: new Date(),
      metadata: { escalatedAt: new Date().toISOString(), escalatedBy: req.user?.displayName ?? "system" } as any,
    }).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId))).returning();

    if (!exc) { sendNotFound(res, "Exception"); return; }
    logVesselsEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "exception.escalated", "maritime_exception", String(id));
    sendSuccess(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to escalate exception");
  }
});

router.post("/vessels/platform/exceptions/:id/resolve", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : 1;

    const [exc] = await db.update(maritimeExceptionsTable).set({
      status: "resolved",
      resolvedAt: new Date(),
      updatedAt: new Date(),
      metadata: { resolution: req.body.resolution, resolvedBy: req.user?.displayName ?? "system" } as any,
    }).where(and(eq(maritimeExceptionsTable.id, id), eq(maritimeExceptionsTable.orgId, orgId))).returning();

    if (!exc) { sendNotFound(res, "Exception"); return; }
    logVesselsEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "exception.resolved", "maritime_exception", String(id));
    sendSuccess(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to resolve exception");
  }
});

router.post("/vessels/platform/exceptions", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;

    const [exc] = await db.insert(maritimeExceptionsTable).values({
      orgId,
      vesselId: typeof body.vesselId === "number" ? body.vesselId : null,
      voyageId: typeof body.voyageId === "number" ? body.voyageId : null,
      signalId: typeof body.signalId === "number" ? body.signalId : null,
      exceptionType: (body.exceptionType as any) || "other",
      severity: (body.severity as any) || "medium",
      title: body.title as string,
      description: body.description as string || null,
      status: "new",
      valueAtRiskUsd: body.valueAtRiskUsd ? String(body.valueAtRiskUsd) : null,
      etaImpactHours: body.etaImpactHours ? String(body.etaImpactHours) : null,
      costImpactUsd: body.costImpactUsd ? String(body.costImpactUsd) : null,
      detectedAt: new Date(),
      metadata: (body.metadata as any) || null,
    }).returning();

    logVesselsEvent(orgId, req.user?.id ?? null, req.user?.displayName ?? "system", "exception.created", "maritime_exception", String(exc.id));
    sendCreated(res, exc);
  } catch (err) {
    handleRouteError(res, err, "Failed to create exception");
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

router.post("/vessels/platform/readiness", authMiddleware({ required: false }), async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const orgId = typeof body.orgId === "number" ? body.orgId : 1;

    const [item] = await db.insert(readinessItemsTable).values({
      orgId,
      product: VESSELS_PRODUCT,
      category: (body.category as any) || "maritime",
      title: body.title as string,
      description: body.description as string || null,
      status: "not_started",
      priority: (body.priority as any) || "medium",
      ownerId: req.user?.id ?? null,
      notes: body.notes as string || null,
    }).returning();

    sendCreated(res, item);
  } catch (err) {
    handleRouteError(res, err, "Failed to create readiness item");
  }
});

export default router;
