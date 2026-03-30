import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  db,
  certificationProgramsTable,
  certificationRequirementsTable,
  certificationStatusTable,
  certificationTasksTable,
  ownershipScenariosTable,
  applicationArtifactsTable,
  opportunityPipelineTable,
  procurementContactsTable,
  certificationCalendarTable,
  auditLogsTable,
  featureFlagsTable,
} from "@workspace/db";
import { eq, desc, sql, and, asc } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();
const auth = [authMiddleware(), requireRole("ops", "exec", "admin")];

async function logCertAudit(action: string, entity: string, entityId: string | number, payload?: unknown) {
  try {
    await db.insert(auditLogsTable).values({
      actionType: action,
      entityType: entity,
      entityId: String(entityId),
      payloadJson: payload as Record<string, unknown> ?? null,
    });
  } catch {
    // non-fatal
  }
}

async function requireCertFlag(_req: Request, res: Response, next: NextFunction) {
  try {
    const [flag] = await db
      .select()
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, "certification_os_enabled"));
    if (flag && !flag.isEnabled) {
      res.status(403).json({ error: "Certification Readiness OS is currently disabled" });
      return;
    }
    next();
  } catch {
    next();
  }
}

router.use("/certification", requireCertFlag);

// ─── CERTIFICATION PROGRAMS ───────────────────────────────────────────────────

router.get("/certification/programs", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(certificationProgramsTable).where(eq(certificationProgramsTable.isActive, true)).orderBy(certificationProgramsTable.name);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list certification programs");
  }
});

router.post("/certification/programs", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(certificationProgramsTable).values(req.body).returning();
    await logCertAudit("create", "certification_program", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create certification program");
  }
});

router.get("/certification/programs/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [program] = await db.select().from(certificationProgramsTable).where(eq(certificationProgramsTable.id, id));
    if (!program) { sendNotFound(res, "Certification program"); return; }
    const [requirements, status, tasks] = await Promise.all([
      db.select().from(certificationRequirementsTable).where(eq(certificationRequirementsTable.programId, id)).orderBy(certificationRequirementsTable.sortOrder),
      db.select().from(certificationStatusTable).where(eq(certificationStatusTable.programId, id)),
      db.select().from(certificationTasksTable).where(eq(certificationTasksTable.programId, id)).orderBy(certificationTasksTable.sortOrder),
    ]);
    sendSuccess(res, { ...program, requirements, status: status[0] ?? null, tasks });
  } catch (err) {
    handleRouteError(res, err, "Failed to get certification program");
  }
});

router.patch("/certification/programs/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(certificationProgramsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(certificationProgramsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Certification program"); return; }
    await logCertAudit("update", "certification_program", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update certification program");
  }
});

router.delete("/certification/programs/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(certificationProgramsTable).set({ isActive: false, updatedAt: new Date() }).where(eq(certificationProgramsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Certification program"); return; }
    await logCertAudit("delete", "certification_program", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete certification program");
  }
});

// ─── CERTIFICATION REQUIREMENTS ───────────────────────────────────────────────

router.post("/certification/requirements", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(certificationRequirementsTable).values(req.body).returning();
    await logCertAudit("create", "certification_requirement", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create certification requirement");
  }
});

router.patch("/certification/requirements/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { createdAt, ...body } = req.body;
    const [row] = await db.update(certificationRequirementsTable).set(body).where(eq(certificationRequirementsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Requirement"); return; }
    await logCertAudit("update", "certification_requirement", id, body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update requirement");
  }
});

router.delete("/certification/requirements/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(certificationRequirementsTable).where(eq(certificationRequirementsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Requirement"); return; }
    await logCertAudit("delete", "certification_requirement", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete requirement");
  }
});

// ─── CERTIFICATION STATUS ─────────────────────────────────────────────────────

router.get("/certification/status", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(certificationStatusTable).orderBy(desc(certificationStatusTable.updatedAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list certification status");
  }
});

router.post("/certification/status", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(certificationStatusTable).values(req.body).returning();
    await logCertAudit("create", "certification_status", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create certification status");
  }
});

router.patch("/certification/status/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(certificationStatusTable).set({ ...req.body, updatedAt: new Date() }).where(eq(certificationStatusTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Certification status"); return; }
    await logCertAudit("update", "certification_status", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update certification status");
  }
});

router.delete("/certification/status/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(certificationStatusTable).where(eq(certificationStatusTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Certification status"); return; }
    await logCertAudit("delete", "certification_status", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete certification status");
  }
});

// ─── CERTIFICATION TASKS ──────────────────────────────────────────────────────

router.get("/certification/tasks", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(certificationTasksTable).orderBy(asc(certificationTasksTable.sortOrder), asc(certificationTasksTable.dueDate));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list certification tasks");
  }
});

router.post("/certification/tasks", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(certificationTasksTable).values(req.body).returning();
    await logCertAudit("create", "certification_task", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create certification task");
  }
});

router.patch("/certification/tasks/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const update = { ...req.body, updatedAt: new Date() };
    if (req.body.status === "complete" && !req.body.completedAt) update.completedAt = new Date();
    const [row] = await db.update(certificationTasksTable).set(update).where(eq(certificationTasksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Certification task"); return; }
    await logCertAudit("update", "certification_task", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update certification task");
  }
});

router.delete("/certification/tasks/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(certificationTasksTable).where(eq(certificationTasksTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Certification task"); return; }
    await logCertAudit("delete", "certification_task", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete certification task");
  }
});

// ─── OWNERSHIP SCENARIOS ──────────────────────────────────────────────────────

router.get("/certification/ownership-scenarios", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(ownershipScenariosTable).orderBy(desc(ownershipScenariosTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list ownership scenarios");
  }
});

router.post("/certification/ownership-scenarios", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(ownershipScenariosTable).values(req.body).returning();
    await logCertAudit("create", "ownership_scenario", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create ownership scenario");
  }
});

router.patch("/certification/ownership-scenarios/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(ownershipScenariosTable).set({ ...req.body, updatedAt: new Date() }).where(eq(ownershipScenariosTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Ownership scenario"); return; }
    await logCertAudit("update", "ownership_scenario", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update ownership scenario");
  }
});

router.delete("/certification/ownership-scenarios/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(ownershipScenariosTable).where(eq(ownershipScenariosTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Ownership scenario"); return; }
    await logCertAudit("delete", "ownership_scenario", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete ownership scenario");
  }
});

// ─── APPLICATION ARTIFACTS ────────────────────────────────────────────────────

router.get("/certification/artifacts", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(applicationArtifactsTable).orderBy(desc(applicationArtifactsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list application artifacts");
  }
});

router.post("/certification/artifacts", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(applicationArtifactsTable).values(req.body).returning();
    await logCertAudit("create", "application_artifact", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create application artifact");
  }
});

router.patch("/certification/artifacts/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(applicationArtifactsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(applicationArtifactsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Application artifact"); return; }
    await logCertAudit("update", "application_artifact", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update application artifact");
  }
});

router.delete("/certification/artifacts/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(applicationArtifactsTable).where(eq(applicationArtifactsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Application artifact"); return; }
    await logCertAudit("delete", "application_artifact", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete application artifact");
  }
});

// ─── OPPORTUNITY PIPELINE ─────────────────────────────────────────────────────

router.get("/certification/opportunities", ...auth, async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(opportunityPipelineTable).orderBy(desc(opportunityPipelineTable.dueDate)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(opportunityPipelineTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to list opportunities");
  }
});

router.post("/certification/opportunities", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(opportunityPipelineTable).values(req.body).returning();
    await logCertAudit("create", "opportunity", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create opportunity");
  }
});

router.patch("/certification/opportunities/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(opportunityPipelineTable).set({ ...req.body, updatedAt: new Date() }).where(eq(opportunityPipelineTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Opportunity"); return; }
    await logCertAudit("update", "opportunity", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update opportunity");
  }
});

router.delete("/certification/opportunities/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(opportunityPipelineTable).where(eq(opportunityPipelineTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Opportunity"); return; }
    await logCertAudit("delete", "opportunity", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete opportunity");
  }
});

// ─── PROCUREMENT CONTACTS ─────────────────────────────────────────────────────

router.get("/certification/procurement-contacts", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(procurementContactsTable).orderBy(asc(procurementContactsTable.name));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list procurement contacts");
  }
});

router.post("/certification/procurement-contacts", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(procurementContactsTable).values(req.body).returning();
    await logCertAudit("create", "procurement_contact", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create procurement contact");
  }
});

router.patch("/certification/procurement-contacts/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(procurementContactsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(procurementContactsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Procurement contact"); return; }
    await logCertAudit("update", "procurement_contact", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update procurement contact");
  }
});

router.delete("/certification/procurement-contacts/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(procurementContactsTable).where(eq(procurementContactsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Procurement contact"); return; }
    await logCertAudit("delete", "procurement_contact", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete procurement contact");
  }
});

// ─── CERTIFICATION CALENDAR ───────────────────────────────────────────────────

router.get("/certification/calendar", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(certificationCalendarTable).orderBy(asc(certificationCalendarTable.eventDate));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list calendar events");
  }
});

router.post("/certification/calendar", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(certificationCalendarTable).values(req.body).returning();
    await logCertAudit("create", "cert_calendar_event", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create calendar event");
  }
});

router.patch("/certification/calendar/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(certificationCalendarTable).set({ ...req.body, updatedAt: new Date() }).where(eq(certificationCalendarTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Calendar event"); return; }
    await logCertAudit("update", "cert_calendar_event", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update calendar event");
  }
});

router.delete("/certification/calendar/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(certificationCalendarTable).where(eq(certificationCalendarTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Calendar event"); return; }
    await logCertAudit("delete", "cert_calendar_event", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete calendar event");
  }
});

// ─── CERTIFICATION DASHBOARD ──────────────────────────────────────────────────

router.get("/certification/dashboard", ...auth, async (req, res) => {
  try {
    const [programs, allStatus, allTasks, calendar, opportunities] = await Promise.all([
      db.select().from(certificationProgramsTable).where(eq(certificationProgramsTable.isActive, true)),
      db.select().from(certificationStatusTable),
      db.select().from(certificationTasksTable).orderBy(asc(certificationTasksTable.dueDate)),
      db.select().from(certificationCalendarTable).orderBy(asc(certificationCalendarTable.eventDate)),
      db.select().from(opportunityPipelineTable).where(eq(opportunityPipelineTable.status, "tracking")),
    ]);

    const programsWithStatus = programs.map(p => {
      const status = allStatus.find(s => s.programId === p.id);
      const tasks = allTasks.filter(t => t.programId === p.id);
      const openTasks = tasks.filter(t => t.status === "open").length;
      const completedTasks = tasks.filter(t => t.status === "complete").length;
      return { ...p, status: status ?? null, openTasks, completedTasks, totalTasks: tasks.length };
    });

    const upcomingDeadlines = calendar.filter(e => e.status === "upcoming").slice(0, 5);
    const overdueTasks = allTasks.filter(t => t.status !== "complete" && t.status !== "na" && t.dueDate && new Date(t.dueDate) < new Date());

    sendSuccess(res, {
      programs: programsWithStatus,
      upcomingDeadlines,
      overdueTasks,
      trackingOpportunities: opportunities.length,
      totalOpenTasks: allTasks.filter(t => t.status === "open").length,
      flaggedForReview: allTasks.filter(t => t.flagsReview && t.status !== "complete").length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to load certification dashboard");
  }
});

export default router;
