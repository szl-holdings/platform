import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  pcMattersTable,
  pcPartiesTable,
  pcClaimsTable,
  pcDeadlinesTable,
  pcForecastsTable,
  pcCommunicationsTable,
  pcAiRecommendationsTable,
  pcApprovalRequestsTable,
  pcAuditEventsTable,
  pcExportsTable,
  pcDocumentsTable,
  pcBackgroundJobsTable,
  pcDeadLetterEventsTable,
  pcNotificationsTable,
  pcConnectorAccountsTable,
  pcConnectorSyncRunsTable,
  pcExtractionJobsTable,
  pcTasksTable,
  pcPlaybooksTable,
  pcWitnessesTable,
  pcMedicalEventsTable,
  pcDamagesTable,
  pcLiensTable,
  pcOffersTable,
  pcDiscoveryTable,
  pcDepositionsTable,
  pcReadinessScoresTable,
  pcDocumentChunksTable,
} from "@szl-holdings/db";
import { eq, desc, sql, and, count, sum } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendForbidden, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { enqueuePrismJob, PRISM_JOB_TYPES, getJobStats, replayDeadLetterEvent } from "../services/prism-queue";
import { getConnectorHealth, triggerSync, getConnectorSyncHistory } from "../services/prism-connectors";
import { getDocumentPipelineStats, getDocumentsForMatter } from "../services/prism-document-pipeline";

const router: IRouter = Router();

function getOrgId(req: Request): number {
  return (req as any).tenantOrgId ?? req.user?.orgs?.[0]?.orgId ?? 1;
}

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user) { sendForbidden(res, "Authentication required"); return false; }
  return true;
}

router.get("/health", (_req, res) => {
  res.json({
    service: "prism-counsel",
    status: "operational",
    version: process.env.BUILD_VERSION ?? "dev",
    timestamp: new Date().toISOString(),
  });
});

router.get("/readiness", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ ready: true, database: "connected" });
  } catch {
    res.status(503).json({ ready: false, database: "unavailable" });
  }
});

router.get("/matters", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const status = req.query.status as string | undefined;
    const jurisdiction = req.query.jurisdiction as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    let query = db.select().from(pcMattersTable)
      .where(eq(pcMattersTable.orgId, orgId))
      .orderBy(desc(pcMattersTable.updatedAt))
      .limit(limit)
      .offset(offset);

    const matters = await query;
    const filtered = matters.filter(m => {
      if (status && m.status !== status) return false;
      if (jurisdiction && !m.jurisdiction?.includes(jurisdiction)) return false;
      return true;
    });

    const [{ total }] = await db.select({ total: count() }).from(pcMattersTable)
      .where(eq(pcMattersTable.orgId, orgId));

    sendSuccess(res, { matters: filtered, total, limit, offset });
  } catch (err) { handleRouteError(res, err, "Failed to fetch matters"); }
});

router.get("/matters/:matterId", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");

    const [matter] = await db.select().from(pcMattersTable)
      .where(and(eq(pcMattersTable.id, matterId), eq(pcMattersTable.orgId, orgId)));
    if (!matter) return sendNotFound(res, "Matter not found");

    const parties = await db.select().from(pcPartiesTable).where(eq(pcPartiesTable.matterId, matterId));
    const claims = await db.select().from(pcClaimsTable).where(eq(pcClaimsTable.matterId, matterId));
    const deadlines = await db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matterId)).orderBy(pcDeadlinesTable.dueDate);
    const forecasts = await db.select().from(pcForecastsTable).where(eq(pcForecastsTable.matterId, matterId)).orderBy(desc(pcForecastsTable.createdAt)).limit(10);
    const offers = await db.select().from(pcOffersTable).where(eq(pcOffersTable.matterId, matterId)).orderBy(desc(pcOffersTable.offerDate));
    const damages = await db.select().from(pcDamagesTable).where(eq(pcDamagesTable.matterId, matterId));
    const liens = await db.select().from(pcLiensTable).where(eq(pcLiensTable.matterId, matterId));
    const readiness = await db.select().from(pcReadinessScoresTable).where(eq(pcReadinessScoresTable.matterId, matterId)).orderBy(desc(pcReadinessScoresTable.computedAt)).limit(6);
    const tasks = await db.select().from(pcTasksTable).where(eq(pcTasksTable.matterId, matterId)).orderBy(desc(pcTasksTable.createdAt));

    sendSuccess(res, { matter, parties, claims, deadlines, forecasts, offers, damages, liens, readiness, tasks });
  } catch (err) { handleRouteError(res, err, "Failed to fetch matter detail"); }
});

router.post("/matters", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { title, caseNumber, matterType, jurisdiction, courtName, filingDate } = req.body;
    if (!title || !matterType) return sendBadRequest(res, "title and matterType required");

    const [matter] = await db.insert(pcMattersTable).values({
      orgId,
      title,
      caseNumber,
      matterType,
      jurisdiction,
      courtName,
      filingDate: filingDate ? new Date(filingDate) : null,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    }).returning();

    await db.insert(pcAuditEventsTable).values({
      orgId, matterId: matter.id, actorId: req.user?.id ?? null,
      action: "matter_created", entityType: "matter", entityId: matter.id,
      details: { title, matterType, jurisdiction },
    });

    sendSuccess(res, { matter }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create matter"); }
});

router.patch("/matters/:matterId", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");

    const [existing] = await db.select().from(pcMattersTable)
      .where(and(eq(pcMattersTable.id, matterId), eq(pcMattersTable.orgId, orgId)));
    if (!existing) return sendNotFound(res, "Matter not found");

    const updates: Record<string, unknown> = { updatedAt: new Date(), updatedBy: req.user?.id };
    const allowedFields = ["title", "caseNumber", "status", "stage", "jurisdiction", "courtName", "notes", "healthScore"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const [updated] = await db.update(pcMattersTable).set(updates as any).where(eq(pcMattersTable.id, matterId)).returning();

    await db.insert(pcAuditEventsTable).values({
      orgId, matterId, actorId: req.user?.id ?? null,
      action: "matter_updated", entityType: "matter", entityId: matterId,
      details: { changes: Object.keys(updates).filter(k => k !== "updatedAt" && k !== "updatedBy") },
    });

    sendSuccess(res, { matter: updated });
  } catch (err) { handleRouteError(res, err, "Failed to update matter"); }
});

router.get("/matters/:matterId/parties", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const parties = await db.select().from(pcPartiesTable).where(eq(pcPartiesTable.matterId, matterId));
    sendSuccess(res, { parties });
  } catch (err) { handleRouteError(res, err, "Failed to fetch parties"); }
});

router.post("/matters/:matterId/parties", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const { role, name, organization, email, phone } = req.body;
    if (!role || !name) return sendBadRequest(res, "role and name required");

    const [party] = await db.insert(pcPartiesTable).values({ matterId, role, name, organization, email, phone }).returning();
    sendSuccess(res, { party }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create party"); }
});

router.get("/matters/:matterId/deadlines", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const deadlines = await db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matterId)).orderBy(pcDeadlinesTable.dueDate);
    sendSuccess(res, { deadlines });
  } catch (err) { handleRouteError(res, err, "Failed to fetch deadlines"); }
});

router.post("/matters/:matterId/deadlines", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const { title, deadlineType, dueDate, priority } = req.body;
    if (!title || !dueDate) return sendBadRequest(res, "title and dueDate required");

    const [deadline] = await db.insert(pcDeadlinesTable).values({
      matterId, title, deadlineType: deadlineType ?? "other",
      dueDate: new Date(dueDate), priority: priority ?? "medium",
    }).returning();

    await enqueuePrismJob(getOrgId(req), PRISM_JOB_TYPES.DEADLINE_EVALUATE, { matterId, deadlineId: deadline.id });

    sendSuccess(res, { deadline }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create deadline"); }
});

router.get("/matters/:matterId/communications", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const comms = await db.select().from(pcCommunicationsTable).where(eq(pcCommunicationsTable.matterId, matterId)).orderBy(desc(pcCommunicationsTable.sentAt));
    sendSuccess(res, { communications: comms });
  } catch (err) { handleRouteError(res, err, "Failed to fetch communications"); }
});

router.get("/matters/:matterId/documents", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const docs = await getDocumentsForMatter(matterId, orgId);
    sendSuccess(res, { documents: docs });
  } catch (err) { handleRouteError(res, err, "Failed to fetch documents"); }
});

router.get("/matters/:matterId/discovery", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const discovery = await db.select().from(pcDiscoveryTable).where(eq(pcDiscoveryTable.matterId, matterId)).orderBy(desc(pcDiscoveryTable.createdAt));
    sendSuccess(res, { discovery });
  } catch (err) { handleRouteError(res, err, "Failed to fetch discovery"); }
});

router.get("/matters/:matterId/witnesses", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const witnesses = await db.select().from(pcWitnessesTable).where(eq(pcWitnessesTable.matterId, matterId));
    sendSuccess(res, { witnesses });
  } catch (err) { handleRouteError(res, err, "Failed to fetch witnesses"); }
});

router.get("/approvals", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const status = (req.query.status as string) ?? "pending";
    const approvals = await db.select({
      approval: pcApprovalRequestsTable,
      matterTitle: pcMattersTable.title,
    })
      .from(pcApprovalRequestsTable)
      .leftJoin(pcMattersTable, eq(pcApprovalRequestsTable.matterId, pcMattersTable.id))
      .where(and(
        eq(pcMattersTable.orgId, orgId),
        eq(pcApprovalRequestsTable.status, status as "pending")
      ))
      .orderBy(desc(pcApprovalRequestsTable.requestedAt));

    sendSuccess(res, { approvals });
  } catch (err) { handleRouteError(res, err, "Failed to fetch approvals"); }
});

router.post("/approvals", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { matterId, requestType, title, description, sourceBasis } = req.body;
    if (!matterId || !requestType || !title) return sendBadRequest(res, "matterId, requestType, and title required");

    const [approval] = await db.insert(pcApprovalRequestsTable).values({
      matterId, requestType, title, description,
      sourceBasis: sourceBasis ?? null,
      requestedBy: req.user?.id ?? null,
    }).returning();

    await db.insert(pcAuditEventsTable).values({
      orgId, matterId, actorId: req.user?.id ?? null,
      action: "approval_requested", entityType: "approval_request", entityId: approval.id,
      details: { requestType, title },
    });

    await enqueuePrismJob(orgId, PRISM_JOB_TYPES.NOTIFICATION_SEND, {
      type: "approval_required", approvalId: approval.id, matterId, title,
    });

    sendSuccess(res, { approval }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create approval"); }
});

router.patch("/approvals/:approvalId/resolve", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const approvalId = parseIdParam(req.params.approvalId);
    if (!approvalId) return sendBadRequest(res, "Invalid approval ID");
    const { decision } = req.body;
    if (!decision || !["approved", "rejected"].includes(decision)) return sendBadRequest(res, "decision must be 'approved' or 'rejected'");

    const [updated] = await db.update(pcApprovalRequestsTable).set({
      status: decision,
      approvedBy: req.user?.id ?? null,
      resolvedAt: new Date(),
    }).where(eq(pcApprovalRequestsTable.id, approvalId)).returning();

    if (!updated) return sendNotFound(res, "Approval not found");

    await db.insert(pcAuditEventsTable).values({
      orgId, matterId: updated.matterId, actorId: req.user?.id ?? null,
      action: `approval_${decision}`, entityType: "approval_request", entityId: approvalId,
      details: { decision },
    });

    sendSuccess(res, { approval: updated });
  } catch (err) { handleRouteError(res, err, "Failed to resolve approval"); }
});

router.post("/exports", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { matterId, exportType, format } = req.body;
    if (!exportType || !format) return sendBadRequest(res, "exportType and format required");

    const [exp] = await db.insert(pcExportsTable).values({
      orgId, matterId: matterId ?? null, exportType, format,
      exportedBy: req.user?.id ?? null,
      status: "pending",
    }).returning();

    await enqueuePrismJob(orgId, PRISM_JOB_TYPES.EXPORT_GENERATE, {
      exportId: exp.id, matterId, exportType, format,
    }, { matterId, actorId: req.user?.id });

    await db.insert(pcAuditEventsTable).values({
      orgId, matterId: matterId ?? null, actorId: req.user?.id ?? null,
      action: "export_requested", entityType: "export", entityId: exp.id,
      details: { exportType, format },
    });

    sendSuccess(res, { export: exp }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create export"); }
});

router.get("/connectors", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const health = await getConnectorHealth(orgId);
    sendSuccess(res, { connectors: health });
  } catch (err) { handleRouteError(res, err, "Failed to fetch connectors"); }
});

router.post("/connectors/:accountId/sync", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const accountId = parseIdParam(req.params.accountId);
    if (!accountId) return sendBadRequest(res, "Invalid account ID");
    const syncRunId = await triggerSync(accountId, orgId, { actorId: req.user?.id });
    sendSuccess(res, { syncRunId }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to trigger sync"); }
});

router.get("/connectors/:accountId/history", authMiddleware(), async (req, res) => {
  try {
    const accountId = parseIdParam(req.params.accountId);
    if (!accountId) return sendBadRequest(res, "Invalid account ID");
    const history = await getConnectorSyncHistory(accountId);
    sendSuccess(res, { history });
  } catch (err) { handleRouteError(res, err, "Failed to fetch sync history"); }
});

router.get("/jobs", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const stats = await getJobStats(orgId);
    const dlqCount = await db.select({ count: count() }).from(pcDeadLetterEventsTable)
      .where(and(eq(pcDeadLetterEventsTable.orgId, orgId), sql`${pcDeadLetterEventsTable.resolvedAt} IS NULL`));
    sendSuccess(res, { stats, deadLetterCount: dlqCount[0]?.count ?? 0 });
  } catch (err) { handleRouteError(res, err, "Failed to fetch job stats"); }
});

router.get("/jobs/dead-letter", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const events = await db.select().from(pcDeadLetterEventsTable)
      .where(and(eq(pcDeadLetterEventsTable.orgId, orgId), sql`${pcDeadLetterEventsTable.resolvedAt} IS NULL`))
      .orderBy(desc(pcDeadLetterEventsTable.failedAt))
      .limit(50);
    sendSuccess(res, { events });
  } catch (err) { handleRouteError(res, err, "Failed to fetch dead letter events"); }
});

router.post("/jobs/dead-letter/:eventId/replay", authMiddleware(), async (req, res) => {
  try {
    const eventId = parseIdParam(req.params.eventId);
    if (!eventId) return sendBadRequest(res, "Invalid event ID");
    const newJobId = await replayDeadLetterEvent(eventId, req.user?.id ?? 0);
    sendSuccess(res, { newJobId }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to replay dead letter event"); }
});

router.get("/pipeline/stats", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const stats = await getDocumentPipelineStats(orgId);
    sendSuccess(res, stats);
  } catch (err) { handleRouteError(res, err, "Failed to fetch pipeline stats"); }
});

router.get("/notifications", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user?.id;
    const notifications = await db.select().from(pcNotificationsTable)
      .where(and(
        eq(pcNotificationsTable.orgId, orgId),
        userId ? eq(pcNotificationsTable.userId, userId) : sql`TRUE`
      ))
      .orderBy(desc(pcNotificationsTable.createdAt))
      .limit(50);
    sendSuccess(res, { notifications });
  } catch (err) { handleRouteError(res, err, "Failed to fetch notifications"); }
});

router.get("/audit", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    let conditions = [eq(pcAuditEventsTable.orgId, orgId)];
    if (matterId) conditions.push(eq(pcAuditEventsTable.matterId, matterId));

    const events = await db.select().from(pcAuditEventsTable)
      .where(and(...conditions))
      .orderBy(desc(pcAuditEventsTable.createdAt))
      .limit(limit);

    sendSuccess(res, { events });
  } catch (err) { handleRouteError(res, err, "Failed to fetch audit events"); }
});

router.get("/dashboard", authMiddleware({ required: false }), async (req, res) => {
  try {
    const orgId = getOrgId(req);

    const matterStats = await db.execute(sql`
      SELECT
        COUNT(*)::int as total_matters,
        COUNT(*) FILTER (WHERE status NOT IN ('closed', 'archived'))::int as active_matters,
        SUM(CASE WHEN settlement_mid IS NOT NULL THEN settlement_mid::numeric ELSE 0 END)::numeric(14,2) as total_exposure
      FROM pc_matters WHERE org_id = ${orgId}
    `);

    const deadlineStats = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending' AND due_date <= NOW() + INTERVAL '14 days')::int as upcoming_14d,
        COUNT(*) FILTER (WHERE status = 'overdue')::int as overdue,
        COUNT(*) FILTER (WHERE status = 'pending')::int as total_pending
      FROM pc_deadlines d
      JOIN pc_matters m ON d.matter_id = m.id
      WHERE m.org_id = ${orgId}
    `);

    const approvalStats = await db.execute(sql`
      SELECT COUNT(*)::int as pending_approvals
      FROM pc_approval_requests ar
      JOIN pc_matters m ON ar.matter_id = m.id
      WHERE m.org_id = ${orgId} AND ar.status = 'pending'
    `);

    const recentActivity = await db.select().from(pcAuditEventsTable)
      .where(eq(pcAuditEventsTable.orgId, orgId))
      .orderBy(desc(pcAuditEventsTable.createdAt))
      .limit(10);

    sendSuccess(res, {
      matters: matterStats.rows?.[0] ?? matterStats,
      deadlines: deadlineStats.rows?.[0] ?? deadlineStats,
      approvals: approvalStats.rows?.[0] ?? approvalStats,
      recentActivity,
    });
  } catch (err) { handleRouteError(res, err, "Failed to build dashboard"); }
});

export default router;
