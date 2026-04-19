import { Router, type IRouter, type Request, type RequestHandler } from "express";
import { LRUCache } from "lru-cache";
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
  insertVesselAlertSchema,
  insertVesselSimulationSchema,
  insertVesselsExceptionEventSchema,
  insertVesselCommandWorkflowSchema,
} from "@szl-holdings/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { sendSuccess, sendCreated, sendNotFound, sendNoContent, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { tenantScope } from "../middlewares/tenant-scope";
import { broadcastWs, pubsub, VESSELS_EVENTS } from "../lib/pubsub-bridge.js";
import { listQuerySchema, validateBody, validateQuery, vesselsResourceMutationSchema, vesselsResourceDeleteSchema } from "../lib/validation";

const router: IRouter = Router();

// ─── Org-scoping helpers ─────────────────────────────────────────────────────

/**
 * Returns a WHERE clause that scopes a fleet query to the requesting org.
 * When orgId is undefined (elevated admin bypassed tenantScope), no filter is applied.
 */
function fleetOrgWhere(orgId: number | undefined) {
  return orgId !== undefined ? eq(vesselsFleetsTable.orgId, orgId) : undefined;
}

function vesselOrgWhere(orgId: number | undefined) {
  return orgId !== undefined ? eq(vesselsTable.orgId, orgId) : undefined;
}

function alertRuleOrgWhere(orgId: number | undefined) {
  return orgId !== undefined ? eq(vesselsAlertRulesTable.orgId, orgId) : undefined;
}

/**
 * Verify that a vessel record belongs to the requesting user's org.
 * Returns the vessel or null. Elevated admins (orgId undefined) can access any vessel.
 */
async function getVesselInOrg(vesselId: number, orgId: number | undefined) {
  const condition = orgId !== undefined
    ? and(eq(vesselsTable.id, vesselId), eq(vesselsTable.orgId, orgId))
    : eq(vesselsTable.id, vesselId);
  const [vessel] = await db.select().from(vesselsTable).where(condition);
  return vessel ?? null;
}

/**
 * Returns all vessel IDs for the given org.
 * Returns null for elevated admins (no filter — can see all vessels).
 * Returns [] when the org has no vessels (sub-resource queries should return empty).
 */
async function getOrgVesselIds(orgId: number | undefined): Promise<number[] | null> {
  if (orgId === undefined) return null;
  const vessels = await db.select().from(vesselsTable).where(eq(vesselsTable.orgId, orgId));
  return (vessels as Array<{ id: number }>).map(v => v.id);
}

// ─── Fleets ─────────────────────────────────────────────────────────────────

router.get("/vessels/fleets", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const where = fleetOrgWhere(req.tenantOrgId);
    const fleets = where
      ? await db.select().from(vesselsFleetsTable).where(where).orderBy(desc(vesselsFleetsTable.createdAt))
      : await db.select().from(vesselsFleetsTable).orderBy(desc(vesselsFleetsTable.createdAt));
    sendSuccess(res, fleets);
  } catch (err) {
    handleRouteError(res, err, "Failed to list fleets");
  }
});

router.get("/vessels/fleets/:id", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const condition = req.tenantOrgId !== undefined
      ? and(eq(vesselsFleetsTable.id, id), eq(vesselsFleetsTable.orgId, req.tenantOrgId))
      : eq(vesselsFleetsTable.id, id);
    const [fleet] = await db.select().from(vesselsFleetsTable).where(condition);
    if (!fleet) { sendNotFound(res, "Fleet"); return; }
    sendSuccess(res, fleet);
  } catch (err) {
    handleRouteError(res, err, "Failed to get fleet");
  }
});

router.post("/vessels/fleets", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const data = insertVesselFleetSchema.parse(req.body);
    const [fleet] = await db.insert(vesselsFleetsTable).values({
      ...data,
      orgId: req.tenantOrgId ?? null,
    }).returning();
    sendCreated(res, fleet);
  } catch (err) {
    handleRouteError(res, err, "Failed to create fleet");
  }
});

router.put("/vessels/fleets/:id", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    // Strip orgId — tenant context is authoritative; clients must not reassign tenancy
    const { orgId: _discardOrgId, ...data } = insertVesselFleetSchema.partial().parse(req.body);
    const condition = req.tenantOrgId !== undefined
      ? and(eq(vesselsFleetsTable.id, id), eq(vesselsFleetsTable.orgId, req.tenantOrgId))
      : eq(vesselsFleetsTable.id, id);
    const [fleet] = await db.update(vesselsFleetsTable).set({ ...data, updatedAt: new Date() }).where(condition).returning();
    if (!fleet) { sendNotFound(res, "Fleet"); return; }
    sendSuccess(res, fleet);
  } catch (err) {
    handleRouteError(res, err, "Failed to update fleet");
  }
});

router.delete("/vessels/fleets/:id", validateBody(vesselsResourceDeleteSchema), authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin"), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const condition = req.tenantOrgId !== undefined
      ? and(eq(vesselsFleetsTable.id, id), eq(vesselsFleetsTable.orgId, req.tenantOrgId))
      : eq(vesselsFleetsTable.id, id);
    const [fleet] = await db.delete(vesselsFleetsTable).where(condition).returning();
    if (!fleet) { sendNotFound(res, "Fleet"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete fleet");
  }
});

// ─── Literal 2-segment routes — must be registered BEFORE /vessels/:id ───────

router.get("/vessels/events", authMiddleware(), tenantScope(), validateQuery(listQuerySchema), async (req: Request, res) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    // Optional: narrow to a specific vessel within the org (client convenience filter).
    // The org-level scope is always enforced — vesselId is validated against orgVesselIds.
    const vesselIdFilter = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;

    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);

    if (orgVesselIds !== null && orgVesselIds.length === 0) { sendSuccess(res, []); return; }

    // If a vesselId filter is requested, verify it belongs to this org before using it
    if (vesselIdFilter !== undefined && orgVesselIds !== null && !orgVesselIds.includes(vesselIdFilter)) {
      sendNotFound(res, "Vessel"); return;
    }

    const effectiveVesselIds = vesselIdFilter !== undefined
      ? [vesselIdFilter]
      : orgVesselIds;

    const events = effectiveVesselIds !== null
      ? await db.select().from(vesselsEventsTable).where(inArray(vesselsEventsTable.vesselId, effectiveVesselIds)).orderBy(desc(vesselsEventsTable.occurredAt))
      : await db.select().from(vesselsEventsTable).orderBy(desc(vesselsEventsTable.occurredAt));

    const filtered = statusFilter ? events.filter((e) => e.status === statusFilter) : events;
    sendSuccess(res, filtered);
  } catch (err) { handleRouteError(res, err, "Failed to list vessel events"); }
});

router.post("/vessels/events", authMiddleware(), tenantScope(), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const data = insertVesselsExceptionEventSchema.parse(req.body);
    const vessel = await getVesselInOrg(data.vesselId, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    const [event] = await db.insert(vesselsEventsTable).values(data).returning();
    sendCreated(res, event);
  } catch (err) { handleRouteError(res, err, "Failed to create vessel event"); }
});

router.get("/vessels/command-workflows", authMiddleware(), tenantScope(), validateQuery(listQuerySchema), async (req: Request, res) => {
  try {
    // Optional: narrow to a specific vessel within the org (client convenience filter).
    // Org-level scope is always enforced — vesselId is validated against orgVesselIds.
    const vesselIdFilter = req.query.vesselId ? parseInt(req.query.vesselId as string, 10) : undefined;

    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
    if (orgVesselIds !== null && orgVesselIds.length === 0) { sendSuccess(res, []); return; }

    if (vesselIdFilter !== undefined && orgVesselIds !== null && !orgVesselIds.includes(vesselIdFilter)) {
      sendNotFound(res, "Vessel"); return;
    }

    const effectiveVesselIds = vesselIdFilter !== undefined ? [vesselIdFilter] : orgVesselIds;

    const workflows = effectiveVesselIds !== null
      ? await db.select().from(vesselsCommandWorkflowsTable).where(inArray(vesselsCommandWorkflowsTable.vesselId, effectiveVesselIds)).orderBy(desc(vesselsCommandWorkflowsTable.createdAt))
      : await db.select().from(vesselsCommandWorkflowsTable).orderBy(desc(vesselsCommandWorkflowsTable.createdAt));
    sendSuccess(res, workflows);
  } catch (err) { handleRouteError(res, err, "Failed to list command workflows"); }
});

router.post("/vessels/command-workflows", authMiddleware(), tenantScope(), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const data = insertVesselCommandWorkflowSchema.parse(req.body);
    if (data.vesselId) {
      const vessel = await getVesselInOrg(data.vesselId, req.tenantOrgId);
      if (!vessel) { sendNotFound(res, "Vessel"); return; }
    }
    const [workflow] = await db.insert(vesselsCommandWorkflowsTable).values(data).returning();
    sendCreated(res, workflow);
  } catch (err) { handleRouteError(res, err, "Failed to create command workflow"); }
});

// ─── Vessels ─────────────────────────────────────────────────────────────────

router.get("/vessels", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const where = vesselOrgWhere(req.tenantOrgId);
    const vessels = where
      ? await db.select().from(vesselsTable).where(where).orderBy(desc(vesselsTable.createdAt))
      : await db.select().from(vesselsTable).orderBy(desc(vesselsTable.createdAt));
    sendSuccess(res, vessels);
  } catch (err) {
    handleRouteError(res, err, "Failed to list vessels");
  }
});

router.get("/vessels/:id", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const vessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendSuccess(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel");
  }
});

router.post("/vessels", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const data = insertVesselSchema.parse(req.body);
    // orgId is intentionally nullable: a super_admin acting outside any tenant
    // context (tenantOrgId = undefined) produces a "platform vessel" with
    // orgId = null.  Tenant-scoped users query with WHERE org_id = <id>, so
    // NULL rows are invisible to them — SQL NULL comparison always evaluates
    // to UNKNOWN, never TRUE.  Platform vessels are only accessible to admins
    // whose tenantOrgId is undefined (no WHERE filter applied).
    const [vessel] = await db.insert(vesselsTable).values({
      ...data,
      orgId: req.tenantOrgId ?? null,
    }).returning();
    sendCreated(res, vessel);
  } catch (err) {
    handleRouteError(res, err, "Failed to create vessel");
  }
});

router.put("/vessels/:id", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    // Strip orgId — tenant context is authoritative; clients must not reassign tenancy
    const { orgId: _discardOrgId, ...data } = insertVesselSchema.partial().parse(req.body);
    const condition = req.tenantOrgId !== undefined
      ? and(eq(vesselsTable.id, id), eq(vesselsTable.orgId, req.tenantOrgId))
      : eq(vesselsTable.id, id);
    const [vessel] = await db.update(vesselsTable).set({ ...data, updatedAt: new Date() }).where(condition).returning();
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

router.delete("/vessels/:id", validateBody(vesselsResourceDeleteSchema), authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin"), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const condition = req.tenantOrgId !== undefined
      ? and(eq(vesselsTable.id, id), eq(vesselsTable.orgId, req.tenantOrgId))
      : eq(vesselsTable.id, id);
    const [vessel] = await db.delete(vesselsTable).where(condition).returning();
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete vessel");
  }
});

// ─── Positions (scoped through parent vessel org check) ─────────────────────

router.get("/vessels/:id/positions", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const vessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    const positions = await db.select().from(vesselsPositionsTable).where(eq(vesselsPositionsTable.vesselId, id)).orderBy(desc(vesselsPositionsTable.recordedAt));
    sendSuccess(res, positions);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel positions");
  }
});

// ─── Cargo (scoped through parent vessel org check) ─────────────────────────

router.get("/vessels/:id/cargo", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const vessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    const cargo = await db.select().from(vesselsCargoTable).where(eq(vesselsCargoTable.vesselId, id)).orderBy(desc(vesselsCargoTable.createdAt));
    sendSuccess(res, cargo);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel cargo");
  }
});

// ─── Routes (org-scoped via vessel ownership) ────────────────────────────────

router.get("/vessels/routes/all", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
    if (orgVesselIds !== null && orgVesselIds.length === 0) { sendSuccess(res, []); return; }
    const routes = orgVesselIds !== null
      ? await db.select().from(vesselsRoutesTable).where(inArray(vesselsRoutesTable.vesselId, orgVesselIds)).orderBy(desc(vesselsRoutesTable.createdAt))
      : await db.select().from(vesselsRoutesTable).orderBy(desc(vesselsRoutesTable.createdAt));
    sendSuccess(res, routes);
  } catch (err) {
    handleRouteError(res, err, "Failed to list routes");
  }
});

router.get("/vessels/:id/routes", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const vessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    const routes = await db.select().from(vesselsRoutesTable).where(eq(vesselsRoutesTable.vesselId, id)).orderBy(desc(vesselsRoutesTable.createdAt));
    sendSuccess(res, routes);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel routes");
  }
});

router.get("/vessels/:id/route", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const vessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    const [latestPosition] = await db.select().from(vesselsPositionsTable)
      .where(eq(vesselsPositionsTable.vesselId, id))
      .orderBy(desc(vesselsPositionsTable.recordedAt))
      .limit(1);
    const [latestRoute] = await db.select().from(vesselsRoutesTable)
      .where(eq(vesselsRoutesTable.vesselId, id))
      .orderBy(desc(vesselsRoutesTable.createdAt))
      .limit(1);
    sendSuccess(res, {
      vessel,
      position: latestPosition ?? null,
      waypoints: Array.isArray(latestRoute?.waypoints) ? latestRoute.waypoints : [],
      route: latestRoute ?? null,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get vessel active route");
  }
});

router.post("/vessels/routes", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const data = insertVesselRouteSchema.parse(req.body);
    const vessel = await getVesselInOrg(data.vesselId, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    const [route] = await db.insert(vesselsRoutesTable).values(data).returning();
    sendCreated(res, route);
  } catch (err) {
    handleRouteError(res, err, "Failed to create route");
  }
});

router.put("/vessels/routes/:id", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    // Strip vesselId — parent ownership must not be reassigned by clients
    const { vesselId: _discardVesselId, ...data } = insertVesselRouteSchema.partial().parse(req.body);
    const [existing] = await db.select().from(vesselsRoutesTable).where(eq(vesselsRoutesTable.id, id));
    if (!existing) { sendNotFound(res, "Route"); return; }
    if (existing.vesselId) {
      const vessel = await getVesselInOrg(existing.vesselId, req.tenantOrgId);
      if (!vessel) { sendNotFound(res, "Route"); return; }
    }
    const [route] = await db.update(vesselsRoutesTable).set(data).where(eq(vesselsRoutesTable.id, id)).returning();
    if (!route) { sendNotFound(res, "Route"); return; }
    sendSuccess(res, route);
  } catch (err) {
    handleRouteError(res, err, "Failed to update route");
  }
});

router.delete("/vessels/routes/:id", validateBody(vesselsResourceDeleteSchema), authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin"), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [existing] = await db.select().from(vesselsRoutesTable).where(eq(vesselsRoutesTable.id, id));
    if (!existing) { sendNotFound(res, "Route"); return; }
    if (existing.vesselId) {
      const vessel = await getVesselInOrg(existing.vesselId, req.tenantOrgId);
      if (!vessel) { sendNotFound(res, "Route"); return; }
    }
    const [route] = await db.delete(vesselsRoutesTable).where(eq(vesselsRoutesTable.id, id)).returning();
    if (!route) { sendNotFound(res, "Route"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete route");
  }
});

// ─── Alert Rules (org-scoped via orgId column) ────────────────────────────────

router.get("/vessels/alert-rules/all", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const where = alertRuleOrgWhere(req.tenantOrgId);
    const rules = where
      ? await db.select().from(vesselsAlertRulesTable).where(where).orderBy(desc(vesselsAlertRulesTable.createdAt))
      : await db.select().from(vesselsAlertRulesTable).orderBy(desc(vesselsAlertRulesTable.createdAt));
    sendSuccess(res, rules);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alert rules");
  }
});

router.post("/vessels/alert-rules", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const data = insertVesselAlertRuleSchema.parse(req.body);
    const [rule] = await db.insert(vesselsAlertRulesTable).values({
      ...data,
      orgId: req.tenantOrgId ?? null,
    }).returning();
    sendCreated(res, rule);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert rule");
  }
});

router.put("/vessels/alert-rules/:id", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    // Strip orgId — tenant context is authoritative; clients must not reassign tenancy
    const { orgId: _discardOrgId, ...data } = insertVesselAlertRuleSchema.partial().parse(req.body);
    const condition = req.tenantOrgId !== undefined
      ? and(eq(vesselsAlertRulesTable.id, id), eq(vesselsAlertRulesTable.orgId, req.tenantOrgId))
      : eq(vesselsAlertRulesTable.id, id);
    const [rule] = await db.update(vesselsAlertRulesTable).set(data).where(condition).returning();
    if (!rule) { sendNotFound(res, "Alert Rule"); return; }
    sendSuccess(res, rule);
  } catch (err) {
    handleRouteError(res, err, "Failed to update alert rule");
  }
});

router.delete("/vessels/alert-rules/:id", validateBody(vesselsResourceDeleteSchema), authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin"), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const condition = req.tenantOrgId !== undefined
      ? and(eq(vesselsAlertRulesTable.id, id), eq(vesselsAlertRulesTable.orgId, req.tenantOrgId))
      : eq(vesselsAlertRulesTable.id, id);
    const [rule] = await db.delete(vesselsAlertRulesTable).where(condition).returning();
    if (!rule) { sendNotFound(res, "Alert Rule"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete alert rule");
  }
});

// ─── Alerts (org-scoped via parent vessel ownership) ─────────────────────────

router.get("/vessels/alerts/all", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
    if (orgVesselIds !== null && orgVesselIds.length === 0) { sendSuccess(res, []); return; }
    const alerts = orgVesselIds !== null
      ? await db.select().from(vesselsAlertsTable).where(inArray(vesselsAlertsTable.vesselId, orgVesselIds)).orderBy(desc(vesselsAlertsTable.triggeredAt))
      : await db.select().from(vesselsAlertsTable).orderBy(desc(vesselsAlertsTable.triggeredAt));
    sendSuccess(res, alerts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list alerts");
  }
});

router.post("/vessels/alerts", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "editor"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const data = insertVesselAlertSchema.parse(req.body);
    if (data.vesselId) {
      const vessel = await getVesselInOrg(data.vesselId, req.tenantOrgId);
      if (!vessel) { sendNotFound(res, "Vessel"); return; }
    }
    const [alert] = await db.insert(vesselsAlertsTable).values(data).returning();
    sendCreated(res, alert);
  } catch (err) {
    handleRouteError(res, err, "Failed to create alert");
  }
});

router.delete("/vessels/alerts/:id", validateBody(vesselsResourceDeleteSchema), authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin"), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [existing] = await db.select().from(vesselsAlertsTable).where(eq(vesselsAlertsTable.id, id));
    if (!existing) { sendNotFound(res, "Alert"); return; }
    if (existing.vesselId) {
      const vessel = await getVesselInOrg(existing.vesselId, req.tenantOrgId);
      if (!vessel) { sendNotFound(res, "Alert"); return; }
    }
    const [alert] = await db.delete(vesselsAlertsTable).where(eq(vesselsAlertsTable.id, id)).returning();
    if (!alert) { sendNotFound(res, "Alert"); return; }
    sendNoContent(res);
  } catch (err) {
    handleRouteError(res, err, "Failed to delete alert");
  }
});

// ─── Weather Snapshots (org-scoped via route→vessel chain) ───────────────────

router.get("/vessels/weather/snapshots", authMiddleware(), tenantScope(), validateQuery(listQuerySchema), async (req: Request, res) => {
  try {
    const routeIdParam = req.query.routeId ? parseInt(req.query.routeId as string, 10) : undefined;

    if (routeIdParam !== undefined) {
      const [route] = await db.select().from(vesselsRoutesTable).where(eq(vesselsRoutesTable.id, routeIdParam));
      if (!route) { sendSuccess(res, []); return; }
      if (route.vesselId) {
        const vessel = await getVesselInOrg(route.vesselId, req.tenantOrgId);
        if (!vessel) { sendSuccess(res, []); return; }
      }
      const snapshots = await db.select().from(vesselsWeatherSnapshotsTable).where(eq(vesselsWeatherSnapshotsTable.routeId, routeIdParam)).orderBy(desc(vesselsWeatherSnapshotsTable.recordedAt));
      sendSuccess(res, snapshots);
      return;
    }

    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
    if (orgVesselIds !== null) {
      if (orgVesselIds.length === 0) { sendSuccess(res, []); return; }
      const orgRoutes = await db.select().from(vesselsRoutesTable).where(inArray(vesselsRoutesTable.vesselId, orgVesselIds));
      const orgRouteIds = (orgRoutes as Array<{ id: number }>).map(r => r.id);
      if (orgRouteIds.length === 0) { sendSuccess(res, []); return; }
      const snapshots = await db.select().from(vesselsWeatherSnapshotsTable).where(inArray(vesselsWeatherSnapshotsTable.routeId, orgRouteIds)).orderBy(desc(vesselsWeatherSnapshotsTable.recordedAt));
      sendSuccess(res, snapshots);
    } else {
      const snapshots = await db.select().from(vesselsWeatherSnapshotsTable).orderBy(desc(vesselsWeatherSnapshotsTable.recordedAt));
      sendSuccess(res, snapshots);
    }
  } catch (err) {
    handleRouteError(res, err, "Failed to get weather snapshots");
  }
});

// ─── Simulations (org-scoped via parent vessel ownership) ────────────────────

router.get("/vessels/simulations/all", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const orgVesselIds = await getOrgVesselIds(req.tenantOrgId);
    if (orgVesselIds !== null && orgVesselIds.length === 0) { sendSuccess(res, []); return; }
    const simulations = orgVesselIds !== null
      ? await db.select().from(vesselsSimulationsTable).where(inArray(vesselsSimulationsTable.vesselId, orgVesselIds)).orderBy(desc(vesselsSimulationsTable.createdAt))
      : await db.select().from(vesselsSimulationsTable).orderBy(desc(vesselsSimulationsTable.createdAt));
    sendSuccess(res, simulations);
  } catch (err) {
    handleRouteError(res, err, "Failed to list simulations");
  }
});

router.post("/vessels/simulations", authMiddleware(), tenantScope(), requireRole("ops", "exec", "admin", "analyst"), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const data = insertVesselSimulationSchema.parse(req.body);
    if (data.vesselId) {
      const vessel = await getVesselInOrg(data.vesselId, req.tenantOrgId);
      if (!vessel) { sendNotFound(res, "Vessel"); return; }
    }
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

router.get("/vessels/simulations/:id", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [simulation] = await db.select().from(vesselsSimulationsTable).where(eq(vesselsSimulationsTable.id, id));
    if (!simulation) { sendNotFound(res, "Simulation"); return; }
    if (simulation.vesselId) {
      const vessel = await getVesselInOrg(simulation.vesselId, req.tenantOrgId);
      if (!vessel) { sendNotFound(res, "Simulation"); return; }
    }
    sendSuccess(res, simulation);
  } catch (err) {
    handleRouteError(res, err, "Failed to get simulation");
  }
});

// ─── Live Data (global maritime intelligence — authenticated + org-gated) ────

const vesselsLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Vessels rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const vesCache = new LRUCache<string, { data: unknown; expiry: number }>({ max: 300 });
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

router.get("/vessels/live/chokepoints", vesselsLiveLimit, authMiddleware(), tenantScope(), async (_req, res) => {
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

router.get("/vessels/live/geopolitical-events", vesselsLiveLimit, authMiddleware(), tenantScope(), async (_req, res) => {
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

router.get("/vessels/live/port-congestion", vesselsLiveLimit, authMiddleware(), tenantScope(), async (_req, res) => {
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

router.get("/vessels/live/weather-marine", vesselsLiveLimit, authMiddleware(), tenantScope(), validateQuery(listQuerySchema), async (req, res) => {
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

// ─── Events (org-scoped via parent vessel ownership) ─────────────────────────

router.get("/vessels/:id/events", authMiddleware(), tenantScope(), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const vessel = await getVesselInOrg(id, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel"); return; }
    const events = await db.select().from(vesselsEventsTable).where(eq(vesselsEventsTable.vesselId, id)).orderBy(desc(vesselsEventsTable.occurredAt));
    sendSuccess(res, events);
  } catch (err) { handleRouteError(res, err, "Failed to list vessel events"); }
});

// ─── PATCH schemas — typed, enum-constrained, whitelist-only (no ownership fields) ───

const patchVesselEventSchema = z.object({
  status: z.enum(["open", "acknowledged", "assigned", "resolved"]).optional(),
  assignedTo: z.string().max(255).nullable().optional(),
  notes: z.string().max(4000).optional(),
});

const patchVesselCommandWorkflowSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
  notes: z.string().max(4000).optional(),
  assignedTo: z.string().max(255).nullable().optional(),
  consequenceImpact: z.string().max(2000).optional(),
});

router.patch("/vessels/events/:id", authMiddleware(), tenantScope(), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    // Strict schema: enum-constrained, length-bounded, no unknown keys allowed
    const parseResult = patchVesselEventSchema.strict().safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map(i => `${(i.path ?? []).join(".") || "(root)"}: ${i.message}`).join("; ");
      res.status(400).json({ error: `Validation error: ${errors}`, issues: parseResult.error.issues });
      return;
    }
    const patch = parseResult.data;
    if (Object.keys(patch).length === 0) { res.status(400).json({ error: "At least one field is required for update" }); return; }
    const [existing] = await db.select().from(vesselsEventsTable).where(eq(vesselsEventsTable.id, id));
    if (!existing) { sendNotFound(res, "Vessel event"); return; }
    const vessel = await getVesselInOrg(existing.vesselId, req.tenantOrgId);
    if (!vessel) { sendNotFound(res, "Vessel event"); return; }
    const updateData: Record<string, unknown> = {};
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.assignedTo !== undefined) updateData.assignedTo = patch.assignedTo;
    if (patch.notes !== undefined) updateData.notes = patch.notes;
    if (patch.status === "acknowledged") updateData.acknowledgedAt = new Date();
    if (patch.status === "resolved") updateData.resolvedAt = new Date();
    const [event] = await db.update(vesselsEventsTable).set(updateData).where(eq(vesselsEventsTable.id, id)).returning();
    if (!event) { sendNotFound(res, "Vessel event"); return; }
    sendSuccess(res, event);
  } catch (err) { handleRouteError(res, err, "Failed to update vessel event"); }
});

// ─── Command Workflows (org-scoped via parent vessel ownership) ───────────────

router.patch("/vessels/command-workflows/:id", authMiddleware(), tenantScope(), validateBody(vesselsResourceMutationSchema), async (req: Request, res) => {
  try {
    const id = parseIdParam(req.params.id);
    // Strict schema: enum-constrained, length-bounded, no unknown keys allowed
    const parseResult = patchVesselCommandWorkflowSchema.strict().safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map(i => `${(i.path ?? []).join(".") || "(root)"}: ${i.message}`).join("; ");
      res.status(400).json({ error: `Validation error: ${errors}`, issues: parseResult.error.issues });
      return;
    }
    const patch = parseResult.data;
    if (Object.keys(patch).length === 0) { res.status(400).json({ error: "At least one field is required for update" }); return; }
    const [existing] = await db.select().from(vesselsCommandWorkflowsTable).where(eq(vesselsCommandWorkflowsTable.id, id));
    if (!existing) { sendNotFound(res, "Command workflow"); return; }
    if (existing.vesselId) {
      const vessel = await getVesselInOrg(existing.vesselId, req.tenantOrgId);
      if (!vessel) { sendNotFound(res, "Command workflow"); return; }
    }
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.notes !== undefined) updateData.notes = patch.notes;
    if (patch.assignedTo !== undefined) updateData.assignedTo = patch.assignedTo;
    if (patch.consequenceImpact !== undefined) updateData.consequenceImpact = patch.consequenceImpact;
    if (patch.status === "completed") updateData.completedAt = new Date();
    const [workflow] = await db.update(vesselsCommandWorkflowsTable).set(updateData).where(eq(vesselsCommandWorkflowsTable.id, id)).returning();
    if (!workflow) { sendNotFound(res, "Command workflow"); return; }
    sendSuccess(res, workflow);
  } catch (err) { handleRouteError(res, err, "Failed to update command workflow"); }
});

export default router;
