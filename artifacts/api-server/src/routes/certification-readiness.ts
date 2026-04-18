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
  legalReviewCheckpointsTable,
  naicsCodeMappingTable,
  auditLogsTable,
  featureFlagsTable,
} from "@szl-holdings/db";
import { eq, desc, sql, and, asc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendForbidden, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { z } from "zod";
import { validateBody } from "../lib/validation";

const createProgramSchema = z.object({
  name: z.string().min(1).max(200),
  frameworkType: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  targetDate: z.string().optional(),
  leadOwnerId: z.number().int().positive().optional(),
}).passthrough();

const updateProgramSchema = createProgramSchema.partial();

const createRequirementSchema = z.object({
  programId: z.number().int().positive(),
  title: z.string().min(1).max(300),
  category: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  priority: z.string().max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
}).passthrough();

const updateRequirementSchema = createRequirementSchema.partial();

const createCertStatusSchema = z.object({
  programId: z.number().int().positive(),
  overallStatus: z.string().max(50).optional(),
  completionPct: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
}).passthrough();

const createCertTaskSchema = z.object({
  programId: z.number().int().positive(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  assigneeId: z.number().int().positive().optional(),
  dueDate: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
}).passthrough();

const updateCertTaskSchema = createCertTaskSchema.partial();

const router: IRouter = Router();
const auth = [authMiddleware(), requireRole("exec", "admin")];

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
      sendForbidden(res, "Certification Readiness OS is currently disabled");
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

router.post("/certification/programs", ...auth, validateBody(createProgramSchema), async (req, res) => {
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

router.patch("/certification/programs/:id", ...auth, validateBody(updateProgramSchema), async (req, res) => {
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

router.post("/certification/requirements", ...auth, validateBody(createRequirementSchema), async (req, res) => {
  try {
    const [row] = await db.insert(certificationRequirementsTable).values(req.body).returning();
    await logCertAudit("create", "certification_requirement", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create certification requirement");
  }
});

router.patch("/certification/requirements/:id", ...auth, validateBody(updateRequirementSchema), async (req, res) => {
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

router.post("/certification/status", ...auth, validateBody(createCertStatusSchema), async (req, res) => {
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

router.post("/certification/tasks", ...auth, validateBody(createCertTaskSchema), async (req, res) => {
  try {
    const [row] = await db.insert(certificationTasksTable).values(req.body).returning();
    await logCertAudit("create", "certification_task", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create certification task");
  }
});

router.patch("/certification/tasks/:id", ...auth, validateBody(updateCertTaskSchema), async (req, res) => {
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

// ─── LEGAL REVIEW CHECKPOINTS ─────────────────────────────────────────────────

router.get("/certification/legal-reviews", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(legalReviewCheckpointsTable).orderBy(desc(legalReviewCheckpointsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list legal review checkpoints");
  }
});

router.post("/certification/legal-reviews", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(legalReviewCheckpointsTable).values(req.body).returning();
    await logCertAudit("create", "legal_review_checkpoint", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create legal review checkpoint");
  }
});

router.patch("/certification/legal-reviews/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(legalReviewCheckpointsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(legalReviewCheckpointsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Legal review checkpoint"); return; }
    await logCertAudit("update", "legal_review_checkpoint", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update legal review checkpoint");
  }
});

router.delete("/certification/legal-reviews/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(legalReviewCheckpointsTable).where(eq(legalReviewCheckpointsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Legal review checkpoint"); return; }
    await logCertAudit("delete", "legal_review_checkpoint", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete legal review checkpoint");
  }
});

// ─── NAICS CODE MAPPING ────────────────────────────────────────────────────────

router.get("/certification/naics", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(naicsCodeMappingTable).orderBy(asc(naicsCodeMappingTable.naicsCode));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list NAICS codes");
  }
});

router.post("/certification/naics", ...auth, async (req, res) => {
  try {
    const [row] = await db.insert(naicsCodeMappingTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create NAICS code");
  }
});

// ─── SEED CERTIFICATION PROGRAMS ─────────────────────────────────────────────

router.post("/certification/seed", ...auth, async (req, res) => {
  try {
    const [{ count: existing }] = await db.select({ count: sql<number>`count(*)::int` }).from(certificationProgramsTable);
    if (existing > 0) {
      sendSuccess(res, { seeded: false, message: "Certification programs already seeded", count: existing });
      return;
    }

    const programs = [
      {
        slug: "ny-mwbe",
        name: "New York State MWBE",
        shortName: "NY MWBE",
        administeredBy: "NYS Empire State Development (ESD)",
        programType: "state" as const,
        targetDemographic: "Minority and Women-Owned Business Enterprise",
        description: "NY State certification for minority and/or women-owned businesses. Required for participation in NY State agency set-aside contracts. Covers both minority-owned (MBE) and women-owned (WBE) designations.",
        eligibilitySummary: "Business must be at least 51% owned, operated, and controlled by US citizens or permanent resident aliens who are women and/or minorities. Owner must demonstrate operational independence and day-to-day control. New York location not strictly required but helps. Renewable every 3 years.",
        applicationUrl: "https://ny.newnycontracts.com/",
        renewalIntervalMonths: 36,
        requiresAttorneyReview: false,
        requiresCpaReview: true,
        notes: "Mom-led path: primary state target. Ownership scenario with mom at 51%+ satisfies this. CPA review required for financial statements.",
        isActive: true,
      },
      {
        slug: "ny-wbe",
        name: "New York City WBE",
        shortName: "NYC WBE",
        administeredBy: "NYC Department of Small Business Services (SBS)",
        programType: "municipal" as const,
        targetDemographic: "Women-Owned Business Enterprise",
        description: "NYC municipal certification for women-owned businesses. Enables participation in NYC agency contracts and set-aside programs. NYC SBS certification is separate from NY State ESD certification.",
        eligibilitySummary: "51% owned, operated, and controlled by women. Principal place of business must be in NYC for full certification, or applicant can seek county-specific certification. Renewable every 2 years.",
        applicationUrl: "https://www1.nyc.gov/site/sbs/businesses/certification.page",
        renewalIntervalMonths: 24,
        requiresAttorneyReview: false,
        requiresCpaReview: true,
        notes: "Complementary to NY State MWBE for NYC agency contracts. Pursue after NY State MWBE. Requires NYC principal place of business.",
        isActive: true,
      },
      {
        slug: "federal-wosb",
        name: "Federal WOSB",
        shortName: "WOSB",
        administeredBy: "U.S. Small Business Administration (SBA)",
        programType: "federal" as const,
        targetDemographic: "Women-Owned Small Business",
        description: "Federal certification enabling access to SBA set-aside contracts restricted to women-owned small businesses. Certified through SBA certify.sba.gov. SAM registration prerequisite. Annual attestation required.",
        eligibilitySummary: "51% unconditional and direct ownership by women who are US citizens. Women must control management and daily operations, hold highest officer title. Must qualify as small business under applicable NAICS size standard. Active SAM.gov registration required.",
        applicationUrl: "https://certify.sba.gov/",
        renewalIntervalMonths: 12,
        requiresAttorneyReview: false,
        requiresCpaReview: true,
        notes: "Mom-led path: primary federal target. Baseline designation — pursue first. EDWOSB extends access to more set-asides if income thresholds met.",
        isActive: true,
      },
      {
        slug: "federal-edwosb",
        name: "Federal EDWOSB",
        shortName: "EDWOSB",
        administeredBy: "U.S. Small Business Administration (SBA)",
        programType: "federal" as const,
        targetDemographic: "Economically Disadvantaged Women-Owned Small Business",
        description: "Enhanced federal certification for economically disadvantaged women-owned businesses. Provides access to set-asides in industries where WOSB is substantially underrepresented. Must also qualify as WOSB. Same application portal as WOSB — additional income/asset documentation required.",
        eligibilitySummary: "All WOSB requirements plus: owner personal net worth < $850,000 (excluding primary residence and equity in business), adjusted gross income 3-year average < $400,000, total personal assets < $6.5 million. CPA review required for all three thresholds.",
        applicationUrl: "https://certify.sba.gov/",
        renewalIntervalMonths: 12,
        requiresAttorneyReview: false,
        requiresCpaReview: true,
        notes: "Mom-led path: preferred over WOSB if income/asset thresholds are met. Broader set-aside access. Evaluate EDWOSB eligibility before applying for plain WOSB.",
        isActive: true,
      },
      {
        slug: "vosb-sdvosb",
        name: "VOSB / SDVOSB",
        shortName: "VOSB",
        administeredBy: "U.S. Small Business Administration (SBA)",
        programType: "federal" as const,
        targetDemographic: "Veteran-Owned / Service-Disabled Veteran-Owned Small Business",
        description: "Federal certification for veteran-owned (VOSB) and service-disabled veteran-owned (SDVOSB) small businesses under the Veterans First Contracting Program. SECONDARY STRATEGY — requires veteran owner as 51%+ controlling principal. Cannot be combined with WOSB in same entity.",
        eligibilitySummary: "51%+ ownership by veterans/SDVs. Veteran must hold highest officer title and control day-to-day operations. SDVOSB: service-connected disability rating from VA required. SBA manages SDVOSB certification (CVE program transferred from VA to SBA in 2023). Annual renewal required.",
        applicationUrl: "https://veterans.certify.sba.gov/",
        renewalIntervalMonths: 12,
        requiresAttorneyReview: true,
        requiresCpaReview: false,
        notes: "SECONDARY / SEPARATE ENTITY ONLY. Do not layer on mom-led entity. If a family veteran is available, consider separate veteran-owned entity for VA contracting. Structural separation requires attorney review.",
        isActive: true,
      },
      {
        slug: "sba-8a",
        name: "SBA 8(a) Business Development Program",
        shortName: "8(a)",
        administeredBy: "U.S. Small Business Administration (SBA)",
        programType: "federal" as const,
        targetDemographic: "Socially and Economically Disadvantaged Small Business",
        description: "9-year SBA development program providing access to sole-source and set-aside contracts, business development support, and mentoring. Powerful program but complex eligibility and requires substantial SBA oversight commitment. REQUIRES LEGAL AND CPA REVIEW before any application.",
        eligibilitySummary: "51% owned by socially disadvantaged individual (designated groups: Black, Hispanic, Native American, Asian Pacific, Subcontinent Asian Americans — or proven by preponderance of evidence). Economically disadvantaged: net worth < $850K, adjusted gross income < $400K avg, assets < $6.5M. 2-year operational history required. Must not have previously participated.",
        applicationUrl: "https://certify.sba.gov/",
        renewalIntervalMonths: 12,
        requiresAttorneyReview: true,
        requiresCpaReview: true,
        notes: "REQUIRES LEGAL REVIEW. Social disadvantage determination is legally complex and context-specific. Do not submit without attorney and CPA review. 2-year business history required — timing constraint. Evaluate post-WOSB.",
        isActive: true,
      },
      {
        slug: "sam-registration",
        name: "SAM.gov Registration",
        shortName: "SAM",
        administeredBy: "U.S. General Services Administration (GSA)",
        programType: "federal" as const,
        targetDemographic: "All federal contractors and grant recipients",
        description: "System for Award Management (SAM.gov) registration. Prerequisite for all federal contracting, federal grants, and federal certifications including WOSB/EDWOSB, 8(a), and SDVOSB. Not a certification — a required active registration. Must be renewed annually or lapses silently.",
        eligibilitySummary: "Any entity seeking federal contracts or grants must register. Requires UEI number (replaced DUNS in 2022), EIN, business bank account, NAICS codes, and active 12-month registration. Registration is free — beware paid third-party services.",
        applicationUrl: "https://sam.gov/",
        renewalIntervalMonths: 12,
        requiresAttorneyReview: false,
        requiresCpaReview: false,
        notes: "FIRST STEP — must be active before any federal certification. Renewal is annual and lapses silently. Allow 7-10 business days for initial activation.",
        isActive: true,
      },
    ];

    const insertedPrograms = await db.insert(certificationProgramsTable).values(programs).returning();

    type ReqCategory = "ownership" | "control" | "documentation" | "financials" | "operational" | "legal" | "identity" | "other";
    type ReviewType = "attorney" | "cpa" | "both" | "none";
    type ReqDef = { requirementKey: string; title: string; description?: string; category: ReqCategory; isRequired: boolean; requiresReview: boolean; reviewType: ReviewType; sortOrder: number };
    const requirementSeed: Array<{ slug: string; requirements: ReqDef[] }> = [
      {
        slug: "ny-mwbe",
        requirements: [
          { requirementKey: "ownership_51", title: "51%+ Minority/Women Ownership", description: "Business must be at least 51% owned by minority group members and/or women.", category: "ownership", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 1 },
          { requirementKey: "citizenship", title: "US Citizenship or Permanent Residency", description: "Qualifying owners must be US citizens or permanent resident aliens.", category: "identity", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 2 },
          { requirementKey: "operational_control", title: "Owner Controls Daily Operations", description: "Qualifying owner must manage and control day-to-day business operations.", category: "control", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 3 },
          { requirementKey: "independence", title: "Business Operates Independently", description: "Business must not be dominated or controlled by non-qualifying owners or affiliated large firms.", category: "financials", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 4 },
          { requirementKey: "financial_stmts", title: "Financial Statements (3 Years or Since Inception)", description: "Business financial statements or tax returns. CPA review required.", category: "documentation", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 5 },
          { requirementKey: "formation_docs", title: "Articles of Incorporation or Operating Agreement", description: "Corporate formation documents showing ownership structure and percentages.", category: "legal", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 6 },
          { requirementKey: "owner_resume", title: "Owner Resume / Qualifications", description: "Qualifying owner's resume demonstrating relevant experience.", category: "documentation", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 7 },
          { requirementKey: "personal_id", title: "Government-Issued Photo ID", description: "Valid government-issued photo identification for qualifying owner.", category: "identity", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 8 },
        ],
      },
      {
        slug: "ny-wbe",
        requirements: [
          { requirementKey: "ownership_51", title: "51%+ Women Ownership", description: "Business must be at least 51% owned by women.", category: "ownership", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 1 },
          { requirementKey: "citizenship", title: "US Citizenship", description: "Qualifying woman owner must be a US citizen.", category: "identity", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 2 },
          { requirementKey: "nyc_location", title: "NYC Principal Place of Business", description: "Business principal place of business must be within NYC (for full SBS WBE). County-specific certifications available for surrounding counties.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 3 },
          { requirementKey: "women_control", title: "Women Control Management and Operations", description: "Women owner(s) must control day-to-day management and hold decision-making authority.", category: "control", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 4 },
          { requirementKey: "formation_docs", title: "Formation Documents / Bylaws", description: "Articles of incorporation, operating agreement, or equivalent showing 51%+ women ownership.", category: "legal", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 5 },
          { requirementKey: "financial_stmts", title: "Financial Statements", description: "Business financial statements or tax returns for the most recent 3 years or since inception. CPA review required.", category: "documentation", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 6 },
          { requirementKey: "personal_id", title: "Government-Issued Photo ID", description: "Valid government-issued photo identification for qualifying owner.", category: "identity", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 7 },
          { requirementKey: "personal_net_worth", title: "Personal Net Worth Statement", description: "Personal financial statement for qualifying owner.", category: "financials", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 8 },
        ],
      },
      {
        slug: "federal-wosb",
        requirements: [
          { requirementKey: "51_women_ownership", title: "51%+ Unconditional Women Ownership", description: "51% or more unconditional, direct ownership by women US citizens. No conditions, options, or provisions that could dilute below 51%.", category: "ownership", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 1 },
          { requirementKey: "women_control_mgmt", title: "Women Hold Highest Officer Title", description: "Woman owner must hold CEO, President, or equivalent highest officer title and control long-term decisions and day-to-day operations.", category: "control", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 2 },
          { requirementKey: "sam_active", title: "Active SAM.gov Registration", description: "Must have active, non-expired SAM.gov registration listing applicable NAICS codes before applying.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 3 },
          { requirementKey: "size_standard", title: "Qualifies as Small Business", description: "Business must qualify as small under SBA size standards for primary NAICS code. CPA verification required.", category: "financials", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 4 },
          { requirementKey: "formation_docs", title: "Operating Agreement or Bylaws", description: "Formation documents showing ownership percentages, officer titles, and control provisions.", category: "legal", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 5 },
          { requirementKey: "personal_id", title: "Government-Issued Photo ID", description: "Valid photo ID for qualifying woman owner.", category: "identity", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 6 },
        ],
      },
      {
        slug: "federal-edwosb",
        requirements: [
          { requirementKey: "wosb_all_reqs", title: "All WOSB Requirements Met", description: "All federal WOSB requirements must be met before pursuing EDWOSB designation.", category: "other", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 1 },
          { requirementKey: "net_worth_850k", title: "Personal Net Worth < $850,000", description: "Owner's personal net worth must be less than $850,000, excluding: equity in primary residence and equity in the business applying for certification. CPA verification required.", category: "financials", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 2 },
          { requirementKey: "agi_400k", title: "3-Year Average AGI < $400,000", description: "Owner's 3-year average adjusted gross income must be under $400,000. Provide 3 years of personal tax returns. CPA review required.", category: "financials", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 3 },
          { requirementKey: "total_assets_6m5", title: "Total Personal Assets < $6.5 Million", description: "Owner's total personal assets must be less than $6.5 million. CPA verification required with personal financial statement.", category: "financials", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 4 },
          { requirementKey: "tax_returns_3yr", title: "3 Years of Personal Tax Returns", description: "Three most recent years of personal tax returns (or all available years if fewer than 3).", category: "documentation", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 5 },
          { requirementKey: "personal_financial_stmt", title: "Personal Financial Statement", description: "Certified personal financial statement listing all assets, liabilities, and net worth.", category: "financials", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 6 },
        ],
      },
      {
        slug: "vosb-sdvosb",
        requirements: [
          { requirementKey: "veteran_owner_51", title: "51%+ Veteran Ownership (SEPARATE ENTITY)", description: "Business must be 51%+ owned by veteran(s). CANNOT be the same entity as a WOSB/mom-led entity. Structural separation is required — attorney review mandatory.", category: "ownership", isRequired: true, requiresReview: true, reviewType: "attorney", sortOrder: 1 },
          { requirementKey: "veteran_control", title: "Veteran Controls Management and Operations", description: "Qualifying veteran must hold highest officer title and control day-to-day operations.", category: "control", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 2 },
          { requirementKey: "dd214_discharge", title: "Honorable Discharge Documentation (DD-214)", description: "For veteran certification: DD Form 214 (Certificate of Release or Discharge from Active Duty) showing honorable discharge.", category: "identity", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 3 },
          { requirementKey: "sdvosb_va_rating", title: "[SDVOSB] VA Service-Connected Disability Rating", description: "For SDVOSB: Letter from VA confirming service-connected disability rating. Any percentage qualifies.", category: "identity", isRequired: false, requiresReview: false, reviewType: "none", sortOrder: 4 },
          { requirementKey: "sam_active", title: "Active SAM.gov Registration", description: "Active SAM registration required before VOSB/SDVOSB application.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 5 },
          { requirementKey: "entity_separation_review", title: "Attorney Review: Entity Structural Separation", description: "REQUIRED: Attorney review to confirm that the veteran-owned entity is properly separated from any WOSB entity. Combined ownership creates certification conflicts.", category: "legal", isRequired: true, requiresReview: true, reviewType: "attorney", sortOrder: 6 },
        ],
      },
      {
        slug: "sam-registration",
        requirements: [
          { requirementKey: "uei_number", title: "Obtain UEI (Unique Entity ID)", description: "Register for a Unique Entity ID at SAM.gov. Replaced DUNS in 2022. Free — no third party needed.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 1 },
          { requirementKey: "ein", title: "EIN (Employer Identification Number)", description: "Active EIN for the business entity registering. Must match IRS records.", category: "legal", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 2 },
          { requirementKey: "naics_codes_selected", title: "NAICS Codes Selected", description: "Select all applicable NAICS codes for your business lines. Include codes for all active and planned service areas.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 3 },
          { requirementKey: "business_bank_acct", title: "US Business Bank Account", description: "Active US business bank account for EFT (electronic funds transfer) setup.", category: "financials", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 4 },
          { requirementKey: "annual_renewal_cal", title: "Annual Renewal Calendar Reminder Set", description: "SAM registration expires after 12 months and lapses silently. Calendar reminder is essential to avoid gaps that block contracting.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 5 },
          { requirementKey: "cage_code", title: "CAGE Code Obtained", description: "Commercial and Government Entity (CAGE) code is assigned automatically during SAM registration. Verify it is issued and active.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 6 },
        ],
      },
      {
        slug: "sba-8a",
        requirements: [
          { requirementKey: "social_disadvantage", title: "Social Disadvantage — LEGAL REVIEW REQUIRED", description: "Owner must belong to a designated presumptively disadvantaged group OR provide evidence of social disadvantage by preponderance. Legal review is mandatory before application.", category: "legal", isRequired: true, requiresReview: true, reviewType: "attorney", sortOrder: 1 },
          { requirementKey: "economic_disadvantage", title: "Economic Disadvantage (All 3 Thresholds)", description: "Net worth < $850K (excluding primary residence and business equity), AGI 3yr average < $400K, total assets < $6.5M. CPA must certify all three.", category: "financials", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 2 },
          { requirementKey: "2yr_history", title: "2+ Years Operational History", description: "Business must have been in operation for at least 2 full years before application. Start date documentation required.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 3 },
          { requirementKey: "51_qualifying_owner", title: "51%+ Qualifying Individual Ownership", description: "Same individual who establishes social and economic disadvantage must hold 51%+ unconditional ownership.", category: "ownership", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 4 },
          { requirementKey: "sam_active", title: "Active SAM.gov Registration", description: "Active SAM registration required before 8(a) application.", category: "operational", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 5 },
          { requirementKey: "financial_stmts_3yr", title: "3 Years Business Financial Statements", description: "Business tax returns and financial statements for 3 years or since inception. CPA review required.", category: "documentation", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 6 },
          { requirementKey: "personal_tax_returns", title: "3 Years Personal Tax Returns", description: "Personal tax returns for qualifying owner for 3 most recent years.", category: "documentation", isRequired: true, requiresReview: true, reviewType: "cpa", sortOrder: 7 },
          { requirementKey: "prior_8a_check", title: "No Prior 8(a) Participation", description: "Entity and owner must not have previously participated in the 8(a) program. One-time program.", category: "legal", isRequired: true, requiresReview: false, reviewType: "none", sortOrder: 8 },
        ],
      },
    ];

    const programMap = new Map(insertedPrograms.map(p => [p.slug, p.id]));

    for (const { slug, requirements } of requirementSeed) {
      const programId = programMap.get(slug);
      if (!programId) continue;
      await db.insert(certificationRequirementsTable).values(
        requirements.map(r => ({ ...r, programId }))
      );
    }

    for (const program of insertedPrograms) {
      await db.insert(certificationStatusTable).values({
        programId: program.id,
        overallStatus: "not_started",
        readinessScore: 0,
      });
    }

    const naicsCodes = [
      { naicsCode: "541512", title: "Computer Systems Design Services", businessLine: "Technology Consulting", isSetAsideEligible: true, notes: "Alloy, Lyte — primary federal tech NAICS" },
      { naicsCode: "541511", title: "Custom Computer Programming Services", businessLine: "Software Development", isSetAsideEligible: true, notes: "Custom development services" },
      { naicsCode: "541519", title: "Other Computer Related Services", businessLine: "Technology Services", isSetAsideEligible: true, notes: "Catch-all for IT services" },
      { naicsCode: "541611", title: "Administrative Management and General Management Consulting Services", businessLine: "Management Consulting", isSetAsideEligible: true, notes: "Carlota Jo — consulting services" },
      { naicsCode: "541690", title: "Other Scientific and Technical Consulting Services", businessLine: "Technical Consulting", isSetAsideEligible: true, notes: "Maritime, INCA research-adjacent" },
      { naicsCode: "541990", title: "All Other Professional, Scientific, and Technical Services", businessLine: "Professional Services", isSetAsideEligible: true, notes: "Broad professional services" },
      { naicsCode: "488111", title: "Air Traffic Control", businessLine: "Maritime/Transport", isSetAsideEligible: false, notes: "Vessels platform adjacent" },
      { naicsCode: "488310", title: "Port and Harbor Operations", businessLine: "Maritime Operations", isSetAsideEligible: false, notes: "Vessels Maritime Intelligence" },
    ];

    await db.insert(naicsCodeMappingTable).values(naicsCodes).onConflictDoNothing();

    await db.insert(featureFlagsTable).values({
      key: "certification_os_enabled",
      name: "Certification Readiness OS",
      description: "Enables the certification and procurement readiness module for NY MWBE, WOSB, and related programs.",
      isEnabled: true,
      rolloutPercentage: 100,
      product: "szl-holdings",
    }).onConflictDoNothing();

    await logCertAudit("seed", "certification_programs", 0, { count: insertedPrograms.length });

    sendSuccess(res, {
      seeded: true,
      programsCreated: insertedPrograms.length,
      programs: insertedPrograms.map(p => ({ id: p.id, slug: p.slug, name: p.name })),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to seed certification data");
  }
});

// ─── MOM-LED READINESS EVALUATION ─────────────────────────────────────────────

router.get("/certification/mom-led-readiness", ...auth, async (req, res) => {
  try {
    const [programs, allRequirements, scenarios] = await Promise.all([
      db.select().from(certificationProgramsTable).where(eq(certificationProgramsTable.isActive, true)),
      db.select().from(certificationRequirementsTable),
      db.select().from(ownershipScenariosTable),
    ]);

    const preferredScenario = scenarios.find(s => s.isPreferred) ?? scenarios[0] ?? null;

    const SECONDARY_ONLY = new Set(["vosb-sdvosb"]);
    const LEGAL_REVIEW_REQUIRED = new Set(["sba-8a", "vosb-sdvosb"]);

    function evaluateRequirement(
      req: typeof allRequirements[number],
      scenario: typeof scenarios[number] | null
    ): { status: "met" | "unmet" | "check" | "legal_review"; note: string } {
      const key = req.requirementKey;
      if (req.requiresReview && req.reviewType === "attorney") {
        return { status: "legal_review", note: `Attorney review required before submitting application.` };
      }
      if (key === "sam_active" || key === "sam_registration") {
        return { status: "check", note: "Verify SAM.gov registration is active and non-expired." };
      }
      if (key === "veteran_owner_51") {
        return { status: "unmet", note: "SECONDARY ENTITY ONLY — mom-led entity cannot pursue this program. Veteran ownership required." };
      }
      if (key === "entity_separation_review") {
        return { status: "legal_review", note: "Attorney review required to confirm entity separation from WOSB entity." };
      }
      if (key === "wosb_all_reqs") {
        return { status: "check", note: "All federal WOSB requirements must be met first." };
      }
      if (scenario) {
        const eligibility = (scenario as any).programEligibilityJson as Record<string, string> | null;
        if (eligibility && key in eligibility) {
          const val = eligibility[key];
          if (val === "met") return { status: "met", note: "Recorded as met in preferred ownership scenario." };
          if (val === "unmet") return { status: "unmet", note: "Recorded as unmet in preferred ownership scenario." };
        }
      }
      if (req.requiresReview) {
        return { status: "check", note: `${req.reviewType === "cpa" ? "CPA" : "Professional"} review required to verify.` };
      }
      return { status: "check", note: "Needs verification — not yet confirmed in ownership scenario data." };
    }

    const programReadiness = programs.map(program => {
      const requirements = allRequirements.filter(r => r.programId === program.id);
      const evaluated = requirements.map(req => ({
        id: req.id,
        requirementKey: req.requirementKey,
        title: req.title,
        description: req.description,
        category: req.category,
        isRequired: req.isRequired,
        reviewType: req.reviewType,
        ...evaluateRequirement(req, preferredScenario),
      }));

      const gaps = evaluated.filter(e => e.isRequired && e.status === "unmet");
      const legalItems = evaluated.filter(e => e.status === "legal_review");
      const checkItems = evaluated.filter(e => e.status === "check");
      const metItems = evaluated.filter(e => e.status === "met");

      const isSecondaryOnly = SECONDARY_ONLY.has(program.slug);
      const requiresLegalReview = LEGAL_REVIEW_REQUIRED.has(program.slug) || legalItems.length > 0;

      return {
        programId: program.id,
        slug: program.slug,
        name: program.name,
        shortName: program.shortName,
        programType: program.programType,
        requiresAttorneyReview: program.requiresAttorneyReview,
        requiresCpaReview: program.requiresCpaReview,
        isSecondaryOnly,
        requiresLegalReview,
        requirementCount: requirements.length,
        gapCount: gaps.length,
        legalItemCount: legalItems.length,
        checkItemCount: checkItems.length,
        metItemCount: metItems.length,
        requirements: evaluated,
      };
    });

    sendSuccess(res, {
      preferredScenario: preferredScenario
        ? { id: preferredScenario.id, scenarioName: preferredScenario.name, description: preferredScenario.description, status: preferredScenario.status }
        : null,
      programReadiness,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute mom-led readiness");
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
