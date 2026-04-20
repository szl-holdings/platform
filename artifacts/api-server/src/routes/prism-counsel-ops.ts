import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
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
import { z } from "zod";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

const PC_MATTER_TYPES = ["auto_injury", "premises_liability", "insurance_coverage", "medical_malpractice", "product_liability", "wrongful_death", "workers_comp", "no_fault", "other"] as const;
type PcMatterType = typeof PC_MATTER_TYPES[number];

const PC_MATTER_STATUSES = ["intake", "investigation", "discovery", "pre_trial", "trial", "settlement", "closed", "archived"] as const;
type PcMatterStatus = typeof PC_MATTER_STATUSES[number];

const PC_PARTY_ROLES = ["plaintiff", "defendant", "carrier", "adjuster", "witness", "expert", "provider", "judge", "mediator", "opposing_counsel"] as const;

const PC_DEADLINE_TYPES = ["statute_of_limitations", "discovery_cutoff", "deposition", "mediation", "trial", "motion", "filing", "response", "expert_disclosure", "settlement_conference", "notice_of_claim", "no_fault_ack", "no_fault_verify", "no_fault_pay_deny", "bill_submission", "other"] as const;
type PcDeadlineType = typeof PC_DEADLINE_TYPES[number];

const PC_APPROVAL_REQUEST_TYPES = ["demand_send", "settlement_acceptance", "external_communication", "expert_engagement", "filing", "client_disclosure", "fee_approval", "export_approval"] as const;
type PcApprovalRequestType = typeof PC_APPROVAL_REQUEST_TYPES[number];

const PC_EXPORT_TYPES = ["demand_packet", "review_packet", "audit_report", "matter_summary", "medical_chronology", "damages_summary", "bulk_export"] as const;
type PcExportType = typeof PC_EXPORT_TYPES[number];

const PC_EXPORT_FORMATS = ["pdf", "docx", "csv", "json"] as const;
type PcExportFormat = typeof PC_EXPORT_FORMATS[number];

const createMatterSchema = z.object({
  title: z.string().min(1).max(500),
  matterType: z.enum(PC_MATTER_TYPES),
  status: z.enum(PC_MATTER_STATUSES).optional(),
  jurisdiction: z.string().max(200).optional(),
  notes: z.string().max(10000).optional(),
  caseNumber: z.string().max(200).optional(),
  courtName: z.string().max(300).optional(),
  filingDate: z.string().optional(),
});

const addPartySchema = z.object({
  name: z.string().min(1).max(500),
  role: z.enum(PC_PARTY_ROLES),
  email: z.string().email().max(300).optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  organization: z.string().max(500).optional(),
});

const addDeadlineSchema = z.object({
  title: z.string().min(1).max(500),
  dueDate: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  description: z.string().max(5000).optional(),
  deadlineType: z.enum(PC_DEADLINE_TYPES).optional(),
});

const createApprovalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  requestedFrom: z.string().max(500).optional(),
  dueDate: z.string().optional(),
  matterId: z.number().int().positive().optional(),
  requestType: z.enum(PC_APPROVAL_REQUEST_TYPES).optional(),
  sourceBasis: z.string().max(1000).optional(),
});

const createExportSchema = z.object({
  exportType: z.enum(PC_EXPORT_TYPES),
  format: z.enum(PC_EXPORT_FORMATS),
  matterId: z.number().int().positive().optional(),
  externalMatterId: z.string().max(200).optional(),
});

function deriveMatterPrivilegeLevel(matterType: string | null | undefined): "public" | "confidential" | "privileged" | "restricted" {
  switch (matterType) {
    case "medical_malpractice": return "restricted";
    case "wrongful_death":
    case "product_liability":
    case "workers_comp": return "privileged";
    default: return "confidential";
  }
}

const router: IRouter = Router();

function getOrgId(req: Request): number {
  const r = req as Request & { tenantOrgId?: number };
  return r.tenantOrgId ?? req.user?.orgs?.[0]?.orgId ?? 1;
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

router.get("/matters", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
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
    const matterId = parseIdParam(req.params.matterId as string);
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

router.post("/matters", authMiddleware(), validateBody(createMatterSchema), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { title, matterType, status, jurisdiction, caseNumber, courtName, filingDate } = req.body as z.infer<typeof createMatterSchema>;

    const [matter] = await db.insert(pcMattersTable).values({
      orgId,
      title,
      matterType,
      status: status ?? "intake",
      caseNumber: caseNumber ?? null,
      jurisdiction: jurisdiction ?? null,
      courtName: courtName ?? null,
      filingDate: filingDate ? new Date(filingDate) : null,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    }).returning();

    await db.insert(pcAuditEventsTable).values({
      orgId, matterId: matter.id, actorId: req.user?.id ?? null,
      action: "matter_created", entityType: "matter", entityId: matter.id,
      details: { title, matterType, jurisdiction },
    });

    sendSuccess(res, { matter }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create matter"); }
});

router.patch("/matters/:matterId", authMiddleware(), validateBody(bodyShape({
      "caseNumber": z.unknown().optional(),
      "courtName": z.unknown().optional(),
      "healthScore": z.unknown().optional(),
      "jurisdiction": z.unknown().optional(),
      "notes": z.unknown().optional(),
      "stage": z.unknown().optional(),
      "status": z.unknown().optional(),
      "title": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");

    const [existing] = await db.select().from(pcMattersTable)
      .where(and(eq(pcMattersTable.id, matterId), eq(pcMattersTable.orgId, orgId)));
    if (!existing) return sendNotFound(res, "Matter not found");

    const body = req.body as Partial<{
      title: string; caseNumber: string; status: PcMatterStatus; stage: string;
      jurisdiction: string; courtName: string; notes: string; healthScore: number;
    }>;
    const updates = {
      updatedAt: new Date(),
      updatedBy: req.user?.id ?? null,
      ...(body.title !== undefined && { title: body.title }),
      ...(body.caseNumber !== undefined && { caseNumber: body.caseNumber }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.stage !== undefined && { stage: body.stage }),
      ...(body.jurisdiction !== undefined && { jurisdiction: body.jurisdiction }),
      ...(body.courtName !== undefined && { courtName: body.courtName }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.healthScore !== undefined && { healthScore: body.healthScore }),
    };

    const [updated] = await db.update(pcMattersTable).set(updates).where(eq(pcMattersTable.id, matterId)).returning();

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
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const parties = await db.select().from(pcPartiesTable).where(eq(pcPartiesTable.matterId, matterId));
    sendSuccess(res, { parties });
  } catch (err) { handleRouteError(res, err, "Failed to fetch parties"); }
});

router.post("/matters/:matterId/parties", authMiddleware(), validateBody(addPartySchema), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const { role, name, email, phone } = req.body as z.infer<typeof addPartySchema>;
    const { organization } = req.body as { organization?: string };

    const [party] = await db.insert(pcPartiesTable).values({
      matterId, role, name,
      organization: organization ?? null,
      email: email ?? null,
      phone: phone ?? null,
    }).returning();
    sendSuccess(res, { party }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create party"); }
});

router.get("/matters/:matterId/deadlines", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const deadlines = await db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matterId)).orderBy(pcDeadlinesTable.dueDate);
    sendSuccess(res, { deadlines });
  } catch (err) { handleRouteError(res, err, "Failed to fetch deadlines"); }
});

router.post("/matters/:matterId/deadlines", authMiddleware(), validateBody(addDeadlineSchema), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const { title, dueDate, priority, deadlineType } = req.body as z.infer<typeof addDeadlineSchema>;

    const [deadline] = await db.insert(pcDeadlinesTable).values({
      matterId, title,
      deadlineType: deadlineType ?? "other",
      dueDate: new Date(dueDate),
      priority: priority ?? "medium",
    }).returning();

    await enqueuePrismJob(getOrgId(req), PRISM_JOB_TYPES.DEADLINE_EVALUATE, { matterId, deadlineId: deadline.id });

    sendSuccess(res, { deadline }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create deadline"); }
});

router.get("/matters/:matterId/communications", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const comms = await db.select().from(pcCommunicationsTable).where(eq(pcCommunicationsTable.matterId, matterId)).orderBy(desc(pcCommunicationsTable.sentAt));
    sendSuccess(res, { communications: comms });
  } catch (err) { handleRouteError(res, err, "Failed to fetch communications"); }
});

router.get("/matters/:matterId/documents", authMiddleware(), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const docs = await getDocumentsForMatter(matterId, orgId);
    sendSuccess(res, { documents: docs });
  } catch (err) { handleRouteError(res, err, "Failed to fetch documents"); }
});

router.get("/matters/:matterId/discovery", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const discovery = await db.select().from(pcDiscoveryTable).where(eq(pcDiscoveryTable.matterId, matterId)).orderBy(desc(pcDiscoveryTable.createdAt));
    sendSuccess(res, { discovery });
  } catch (err) { handleRouteError(res, err, "Failed to fetch discovery"); }
});

router.get("/matters/:matterId/witnesses", authMiddleware(), async (req, res) => {
  try {
    const matterId = parseIdParam(req.params.matterId as string);
    if (!matterId) return sendBadRequest(res, "Invalid matter ID");
    const witnesses = await db.select().from(pcWitnessesTable).where(eq(pcWitnessesTable.matterId, matterId));
    sendSuccess(res, { witnesses });
  } catch (err) { handleRouteError(res, err, "Failed to fetch witnesses"); }
});

router.get("/approvals", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
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

router.post("/approvals", authMiddleware(), validateBody(createApprovalSchema), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { title, description, matterId, requestType, sourceBasis } = req.body as z.infer<typeof createApprovalSchema>;
    if (!matterId || !requestType || !title) return sendBadRequest(res, "matterId, requestType, and title required");

    const [approval] = await db.insert(pcApprovalRequestsTable).values({
      matterId,
      requestType,
      title,
      description: description ?? null,
      sourceBasis: sourceBasis ? { value: sourceBasis } : null,
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

router.patch("/approvals/:approvalId/resolve", authMiddleware(), validateBody(bodyShape({
      "decision": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const approvalId = parseIdParam(req.params.approvalId as string);
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

router.post("/exports", authMiddleware(), validateBody(createExportSchema), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { matterId, exportType, format, externalMatterId } = req.body as z.infer<typeof createExportSchema>;

    const { checkAction } = await import("@szl-holdings/policy-engine");
    const sessionRole: string = req.user?.orgs?.[0]?.role ?? "associate";

    let derivedPrivilegeLevel: "public" | "confidential" | "privileged" | "restricted" = "privileged";
    let resolvedMatter: { id: number; matterType: string | null } | null = null;

    if (matterId) {
      const [dbMatter] = await db
        .select({ id: pcMattersTable.id, matterType: pcMattersTable.matterType })
        .from(pcMattersTable)
        .where(and(eq(pcMattersTable.id, matterId), eq(pcMattersTable.orgId, orgId)));
      if (!dbMatter) {
        return sendNotFound(res, "Matter not found or access denied");
      }
      resolvedMatter = dbMatter;
      derivedPrivilegeLevel = deriveMatterPrivilegeLevel(dbMatter.matterType);
    }

    const userApprovedByRole = ["partner", "gc", "super_admin"].includes(sessionRole);

    const policyResult = checkAction({
      action: "prism-counsel:export",
      domain: "prism-counsel",
      subject: {
        id: req.user?.id?.toString() ?? "unknown",
        roles: [sessionRole],
        tenantId: req.user?.orgs?.[0]?.orgId?.toString(),
      },
      resource: {
        type: "prism-matter",
        id: (resolvedMatter?.id ?? externalMatterId ?? "unknown").toString(),
        domain: "prism-counsel",
        attributes: {
          privilegeLevel: derivedPrivilegeLevel,
          wallEnabled: derivedPrivilegeLevel === "restricted",
          userApproved: userApprovedByRole,
        },
      },
      context: { userRole: sessionRole },
      confidence: 1.0,
    });

    if (policyResult.effect === "block") {
      return sendForbidden(res, `Export blocked by policy: ${policyResult.reasoning}`);
    }

    if (policyResult.effect === "require_approval") {
      if (!resolvedMatter) {
        return sendForbidden(res, `Export requires approval but no DB-resolved matter is available`);
      }
      const [approvalReq] = await db.insert(pcApprovalRequestsTable).values({
        matterId: resolvedMatter.id,
        requestType: "export_approval" as const,
        title: `Export approval required — ${exportType}`,
        description: `Policy requires approval before export. Reason: ${policyResult.reasoning}`,
        sourceBasis: {
          ruleViolations: policyResult.violations.map((v: { reason: string }) => v.reason),
          requiredRole: policyResult.requiredApproverRole ?? "partner",
          exportType,
          format,
          sessionRole,
        },
        requestedBy: req.user?.id ?? null,
      }).returning();

      void db.insert(pcAuditEventsTable).values({
        orgId, matterId: resolvedMatter.id, actorId: req.user?.id ?? null,
        action: "export_approval_required", entityType: "export", entityId: approvalReq.id,
        details: { exportType, format, externalMatterId, privilegeLevel: derivedPrivilegeLevel, sessionRole, reasoning: policyResult.reasoning },
      }).catch(() => {});

      return res.status(202).json({
        success: false,
        status: "pending_approval",
        approvalRequestId: approvalReq.id,
        message: `Export requires ${policyResult.requiredApproverRole ?? "partner"} approval. A request has been created.`,
        policyReasoning: policyResult.reasoning,
      });
    }

    const resolvedMatterId = resolvedMatter?.id ?? null;

    const [exp] = await db.insert(pcExportsTable).values({
      orgId,
      matterId: resolvedMatterId,
      exportType,
      format,
      exportedBy: req.user?.id ?? null,
      status: "pending" as const,
    }).returning();

    await enqueuePrismJob(orgId, PRISM_JOB_TYPES.EXPORT_GENERATE, {
      exportId: exp.id, matterId: resolvedMatterId, exportType, format,
    }, { matterId: resolvedMatterId, actorId: req.user?.id });

    await db.insert(pcAuditEventsTable).values({
      orgId, matterId: resolvedMatterId, actorId: req.user?.id ?? null,
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

router.post("/connectors/:accountId/sync", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const accountId = parseIdParam(req.params.accountId as string);
    if (!accountId) return sendBadRequest(res, "Invalid account ID");
    const syncRunId = await triggerSync(accountId, orgId, { actorId: req.user?.id });
    sendSuccess(res, { syncRunId }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to trigger sync"); }
});

router.get("/connectors/:accountId/history", authMiddleware(), async (req, res) => {
  try {
    const accountId = parseIdParam(req.params.accountId as string);
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

router.post("/jobs/dead-letter/:eventId/replay", authMiddleware(), validateBody(bodyShape({})), async (req, res) => {
  try {
    const eventId = parseIdParam(req.params.eventId as string);
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

router.get("/audit", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
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

/* ── Policy-Backed Privilege Check ── */
const privilegeCheckSchema = z.object({
  matterId: z.string().optional(),
  action: z.enum(["prism-counsel:access", "prism-counsel:export", "prism-counsel:view"]),
  userRole: z.string().min(1).max(100),
  privilegeLevel: z.string().optional(),
  wallEnabled: z.boolean().optional(),
  userApproved: z.boolean().optional(),
});

router.post("/privilege/check", validateBody(privilegeCheckSchema), async (req, res) => {
  try {
    const { checkAction } = await import("@szl-holdings/policy-engine");
    const { matterId, action, userRole, privilegeLevel, wallEnabled, userApproved } =
      req.body as z.infer<typeof privilegeCheckSchema>;

    const result = checkAction({
      action,
      domain: "prism-counsel",
      subject: {
        id: req.user?.id?.toString() ?? "demo-user",
        roles: [userRole],
        tenantId: req.user?.orgs?.[0]?.orgId?.toString(),
      },
      resource: {
        type: "prism-matter",
        id: matterId,
        domain: "prism-counsel",
        attributes: {
          privilegeLevel: privilegeLevel ?? "public",
          wallEnabled: wallEnabled ?? false,
          userApproved: userApproved ?? true,
        },
      },
      context: {
        userRole,
      },
      confidence: 1.0,
    });

    if (req.user) {
      void db.insert(pcAuditEventsTable).values({
        orgId: getOrgId(req),
        actorId: req.user.id,
        action: `privilege.check.${result.effect}`,
        entityType: "matter",
        entityId: matterId ? parseInt(matterId, 10) : null,
        details: { action, userRole, privilegeLevel, wallEnabled, policyEffect: result.effect, reasoning: result.reasoning },
      }).catch(() => {});
    }

    sendSuccess(res, {
      allowed: result.allowed,
      effect: result.effect,
      requiresApproval: result.requiresApproval,
      requiredApproverRole: result.requiredApproverRole ?? null,
      escalationTarget: result.escalationTarget ?? null,
      violations: result.violations,
      reasoning: result.reasoning,
      evaluatedAt: result.evaluatedAt,
      policyEngine: "prism-counsel.matter-wall@1.0",
    });
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/privilege/check");
  }
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
