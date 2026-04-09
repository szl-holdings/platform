import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  pcMattersTable,
  pcDeadlinesTable,
  pcForecastsTable,
  pcApprovalRequestsTable,
  pcAuditEventsTable,
  pcConnectorAccountsTable,
  pcAiRecommendationsTable,
  pcCommunicationsTable,
  pcReadinessScoresTable,
} from "@szl-holdings/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendForbidden, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

function getOrgId(req: Request): number | null {
  const user = req.user;
  if (!user) return null;
  if (user.roles?.includes("super_admin") || user.roles?.includes("admin")) {
    return user.orgs?.[0]?.orgId ?? 1;
  }
  return user.orgs?.[0]?.orgId ?? null;
}

function requireAuth(req: Request, res: Response): number | null {
  const orgId = getOrgId(req);
  if (!orgId) { sendForbidden(res, "Authentication required"); return null; }
  return orgId;
}

async function assertMatterAccess(matterId: number, orgId: number, res: Response): Promise<boolean> {
  const [matter] = await db.select({ id: pcMattersTable.id, orgId: pcMattersTable.orgId })
    .from(pcMattersTable).where(eq(pcMattersTable.id, matterId));
  if (!matter) { sendNotFound(res, "Matter not found"); return false; }
  if (matter.orgId !== orgId) { sendForbidden(res, "Access denied"); return false; }
  return true;
}

/* ── Health ── */
router.get("/prism-counsel/health", (_req, res) => {
  res.json({ service: "prism-counsel-core", status: "ok", timestamp: new Date().toISOString() });
});

/* ── Dashboard Summary ── */
router.get("/prism-counsel/dashboard", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    const [mattersAgg] = await db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where status not in ('closed','archived'))`,
      total_exposure: sql<string>`sum(CASE WHEN settlement_high IS NOT NULL THEN settlement_high::numeric ELSE 0 END)::text`,
    }).from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId));

    const [deadlinesAgg] = await db.select({
      total_pending: sql<number>`count(*)`,
      upcoming_14d: sql<number>`count(*) filter (where due_date <= NOW() + interval '14 days')`,
      critical: sql<number>`count(*) filter (where priority = 'critical')`,
    }).from(pcDeadlinesTable).where(
      sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND status = 'pending'`
    );

    const [approvalsAgg] = await db.select({
      pending: sql<number>`count(*)`,
    }).from(pcApprovalRequestsTable).where(
      sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND status = 'pending'`
    );

    const connectors = await db.select({
      id: pcConnectorAccountsTable.id,
      connectorType: pcConnectorAccountsTable.connectorType,
      displayName: pcConnectorAccountsTable.displayName,
      status: pcConnectorAccountsTable.status,
      lastSyncAt: pcConnectorAccountsTable.lastSyncAt,
    }).from(pcConnectorAccountsTable).where(eq(pcConnectorAccountsTable.orgId, orgId));

    sendSuccess(res, {
      matters: {
        total_matters: Number(mattersAgg?.total ?? 0),
        active_matters: Number(mattersAgg?.active ?? 0),
        total_exposure: mattersAgg?.total_exposure ?? "0",
      },
      deadlines: {
        total_pending: Number(deadlinesAgg?.total_pending ?? 0),
        upcoming_14d: Number(deadlinesAgg?.upcoming_14d ?? 0),
        critical: Number(deadlinesAgg?.critical ?? 0),
      },
      approvals: {
        pending_approvals: Number(approvalsAgg?.pending ?? 0),
      },
      connectors,
    });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/dashboard");
  }
});

/* ── Matters CRUD ── */
router.get("/prism-counsel/matters", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matters = await db.select().from(pcMattersTable)
      .where(eq(pcMattersTable.orgId, orgId))
      .orderBy(desc(pcMattersTable.updatedAt)).limit(200);
    sendSuccess(res, matters);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters");
  }
});

router.get("/prism-counsel/matters/:id", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const [matter] = await db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId));
    sendSuccess(res, matter);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters/:id");
  }
});

router.post("/prism-counsel/matters", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const body = req.body as Record<string, unknown>;
    if (!body.title || !body.matterType) return sendBadRequest(res, "title and matterType are required");
    const validMatterTypes = ["auto_injury", "premises_liability", "insurance_coverage", "medical_malpractice", "product_liability", "wrongful_death", "workers_comp", "no_fault", "other"] as const;
    const validMatterStatuses = ["intake", "investigation", "discovery", "pre_trial", "trial", "settlement", "closed", "archived"] as const;
    type MatterType = typeof validMatterTypes[number];
    type MatterStatus = typeof validMatterStatuses[number];
    const matterType = validMatterTypes.includes(String(body.matterType) as MatterType)
      ? (String(body.matterType) as MatterType)
      : "other";
    const matterStatus = validMatterStatuses.includes(String(body.status ?? "") as MatterStatus)
      ? (String(body.status) as MatterStatus)
      : "intake";
    const [matter] = await db.insert(pcMattersTable).values({
      orgId,
      title: String(body.title),
      matterType,
      status: matterStatus,
      caseNumber: body.caseNumber ? String(body.caseNumber) : undefined,
      jurisdiction: body.jurisdiction ? String(body.jurisdiction) : undefined,
      courtName: body.courtName ? String(body.courtName) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      createdBy: req.user?.id,
    }).returning();
    sendSuccess(res, matter, 201);
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/matters");
  }
});

router.patch("/prism-counsel/matters/:id", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;
    const body = req.body as Record<string, unknown>;
    const patch = body as typeof pcMattersTable.$inferInsert;
    const [updated] = await db.update(pcMattersTable)
      .set({ ...patch, updatedBy: req.user?.id, updatedAt: new Date() })
      .where(eq(pcMattersTable.id, matterId)).returning();
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "PATCH /prism-counsel/matters/:id");
  }
});

/* ── Matter Twin ── */
router.get("/prism-counsel/matters/:id/twin", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;

    const [matter] = await db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId));
    const deadlines = await db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matterId)).orderBy(pcDeadlinesTable.dueDate).limit(20);
    const forecasts = await db.select().from(pcForecastsTable).where(eq(pcForecastsTable.matterId, matterId)).orderBy(desc(pcForecastsTable.createdAt)).limit(15);
    const comms = await db.select().from(pcCommunicationsTable).where(eq(pcCommunicationsTable.matterId, matterId)).orderBy(desc(pcCommunicationsTable.sentAt)).limit(20);
    const readiness = await db.select().from(pcReadinessScoresTable).where(eq(pcReadinessScoresTable.matterId, matterId)).orderBy(desc(pcReadinessScoresTable.computedAt));
    const approvals = await db.select().from(pcApprovalRequestsTable).where(and(eq(pcApprovalRequestsTable.matterId, matterId), eq(pcApprovalRequestsTable.status, "pending")));
    const recs = await db.select().from(pcAiRecommendationsTable).where(and(eq(pcAiRecommendationsTable.matterId, matterId), eq(pcAiRecommendationsTable.status, "pending"))).limit(10);

    sendSuccess(res, {
      matter,
      subpages: {
        summary: { matter, readinessScores: readiness },
        deadlines: { items: deadlines },
        forecast: { items: forecasts },
        communications: { items: comms },
        approvals: { pending: approvals },
        recommendations: { items: recs },
      },
      lastComputedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters/:id/twin");
  }
});

/* ── Pressure Graph ── */
router.get("/prism-counsel/matters/:id/pressure", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;

    let dimensions: unknown[] = [];
    try {
      const { pcPressureGraphDimensionsTable } = await import("@szl-holdings/db");
      dimensions = await db.select().from(pcPressureGraphDimensionsTable)
        .where(eq(pcPressureGraphDimensionsTable.matterId, matterId))
        .orderBy(desc(pcPressureGraphDimensionsTable.computedAt)).limit(12);
    } catch { dimensions = []; }

    sendSuccess(res, { matterId, dimensions, computedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters/:id/pressure");
  }
});

/* ── Proof Chain ── */
router.get("/prism-counsel/matters/:id/proof-chain", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;

    let entries: unknown[] = [];
    try {
      const { pcProofChainEntriesTable } = await import("@szl-holdings/db");
      entries = await db.select().from(pcProofChainEntriesTable)
        .where(eq(pcProofChainEntriesTable.matterId, matterId))
        .orderBy(desc(pcProofChainEntriesTable.generationTimestamp)).limit(50);
    } catch { entries = []; }

    sendSuccess(res, { matterId, entries });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters/:id/proof-chain");
  }
});

/* ── Forecast Diffs ── */
router.get("/prism-counsel/matters/:id/forecast-diffs", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;

    let diffs: unknown[] = [];
    try {
      const { pcForecastDiffsTable } = await import("@szl-holdings/db");
      diffs = await db.select().from(pcForecastDiffsTable)
        .where(eq(pcForecastDiffsTable.matterId, matterId))
        .orderBy(desc(pcForecastDiffsTable.createdAt)).limit(20);
    } catch { diffs = []; }

    sendSuccess(res, { matterId, diffs });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters/:id/forecast-diffs");
  }
});

/* ── Data Products ── */
router.get("/prism-counsel/data-products", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    let scores: unknown[] = [];
    try {
      const { pcDataProductScoresTable } = await import("@szl-holdings/db");
      scores = await db.select().from(pcDataProductScoresTable)
        .where(eq(pcDataProductScoresTable.orgId, orgId))
        .orderBy(desc(pcDataProductScoresTable.computedAt)).limit(100);
    } catch { scores = []; }

    sendSuccess(res, { scores });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/data-products");
  }
});

/* ── Worldline Signals ── */
router.get("/prism-counsel/worldline/signals", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    let signals: unknown[] = [];
    try {
      const { pcWorldlineSignalsTable } = await import("@szl-holdings/db");
      signals = await db.select().from(pcWorldlineSignalsTable)
        .where(eq(pcWorldlineSignalsTable.orgId, orgId))
        .orderBy(desc(pcWorldlineSignalsTable.createdAt)).limit(50);
    } catch { signals = []; }

    sendSuccess(res, { signals });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/worldline/signals");
  }
});

/* ── Copilot Drafts ── */
router.get("/prism-counsel/matters/:id/copilot-drafts", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;

    let drafts: unknown[] = [];
    try {
      const { pcCopilotDraftsTable } = await import("@szl-holdings/db");
      drafts = await db.select().from(pcCopilotDraftsTable)
        .where(eq(pcCopilotDraftsTable.matterId, matterId))
        .orderBy(desc(pcCopilotDraftsTable.createdAt)).limit(20);
    } catch { drafts = []; }

    sendSuccess(res, { matterId, drafts });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters/:id/copilot-drafts");
  }
});

/* ── Approvals ── */
router.get("/prism-counsel/approvals", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const status = req.query.status as string | undefined;
    let items: unknown[];
    if (status) {
      items = await db.select().from(pcApprovalRequestsTable)
        .where(sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND status = ${status}`)
        .orderBy(desc(pcApprovalRequestsTable.requestedAt)).limit(100);
    } else {
      items = await db.select().from(pcApprovalRequestsTable)
        .where(sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId})`)
        .orderBy(desc(pcApprovalRequestsTable.requestedAt)).limit(100);
    }
    sendSuccess(res, items);
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/approvals");
  }
});

router.post("/prism-counsel/approvals/:id/approve", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const requestId = parseIdParam(req.params.id);
    const user = req.user;
    const [updated] = await db.update(pcApprovalRequestsTable)
      .set({ status: "approved", approvedBy: user?.id, resolvedAt: new Date() })
      .where(eq(pcApprovalRequestsTable.id, requestId)).returning();
    if (!updated) return sendNotFound(res, "Approval request not found");

    await db.insert(pcAuditEventsTable).values({
      orgId,
      matterId: updated.matterId,
      actorId: user?.id,
      action: "approval_request.approved",
      entityType: "approval_request",
      entityId: requestId,
      details: { status: "approved" },
    });

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/approvals/:id/approve");
  }
});

router.post("/prism-counsel/approvals/:id/reject", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const requestId = parseIdParam(req.params.id);
    const user = req.user;
    const [updated] = await db.update(pcApprovalRequestsTable)
      .set({ status: "rejected", approvedBy: user?.id, resolvedAt: new Date() })
      .where(eq(pcApprovalRequestsTable.id, requestId)).returning();
    if (!updated) return sendNotFound(res, "Approval request not found");

    await db.insert(pcAuditEventsTable).values({
      orgId,
      matterId: updated.matterId,
      actorId: user?.id,
      action: "approval_request.rejected",
      entityType: "approval_request",
      entityId: requestId,
      details: { status: "rejected", reason: req.body?.reason },
    });

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "POST /prism-counsel/approvals/:id/reject");
  }
});

/* ── Service Metrics (Admin) ── */
router.get("/prism-counsel/admin/service-metrics", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    let metrics: unknown[] = [];
    try {
      const { pcServiceMetricsTable } = await import("@szl-holdings/db");
      metrics = await db.select().from(pcServiceMetricsTable)
        .where(eq(pcServiceMetricsTable.orgId, orgId))
        .orderBy(desc(pcServiceMetricsTable.measuredAt)).limit(50);
    } catch { metrics = []; }

    sendSuccess(res, { metrics });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/admin/service-metrics");
  }
});

/* ── Dashboard Snapshots ── */
router.get("/prism-counsel/admin/dashboards/:type", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const dashType = req.params.type;

    let snapshot: unknown = null;
    try {
      const { pcDashboardSnapshotsTable } = await import("@szl-holdings/db");
      const [latest] = await db.select().from(pcDashboardSnapshotsTable)
        .where(and(eq(pcDashboardSnapshotsTable.orgId, orgId), eq(pcDashboardSnapshotsTable.dashboardType, dashType as never)))
        .orderBy(desc(pcDashboardSnapshotsTable.computedAt)).limit(1);
      snapshot = latest ?? null;
    } catch { snapshot = null; }

    sendSuccess(res, { dashboardType: dashType, snapshot });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/admin/dashboards/:type");
  }
});

/* ── Tenant Config ── */
router.get("/prism-counsel/admin/tenant-config", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    let config: unknown = null;
    try {
      const { pcTenantConfigTable } = await import("@szl-holdings/db");
      const [cfg] = await db.select().from(pcTenantConfigTable).where(eq(pcTenantConfigTable.orgId, orgId));
      config = cfg ?? null;
    } catch { config = null; }

    sendSuccess(res, { orgId, config });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/admin/tenant-config");
  }
});

/* ── Incidents ── */
router.get("/prism-counsel/admin/incidents", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    let incidents: unknown[] = [];
    try {
      const { pcIncidentsTable } = await import("@szl-holdings/db");
      incidents = await db.select().from(pcIncidentsTable)
        .where(eq(pcIncidentsTable.orgId, orgId))
        .orderBy(desc(pcIncidentsTable.detectedAt)).limit(50);
    } catch { incidents = []; }

    sendSuccess(res, { incidents });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/admin/incidents");
  }
});

/* ── Onboarding Checklist ── */
router.get("/prism-counsel/admin/onboarding", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    let checklist: unknown[] = [];
    try {
      const { pcOnboardingChecklistTable } = await import("@szl-holdings/db");
      checklist = await db.select().from(pcOnboardingChecklistTable)
        .where(eq(pcOnboardingChecklistTable.orgId, orgId));
    } catch { checklist = []; }

    sendSuccess(res, { orgId, checklist });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/admin/onboarding");
  }
});

/* ── Contradiction Panel ── */
router.get("/prism-counsel/matters/:id/contradictions", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;

    let contradictions: unknown[] = [];
    try {
      const { pcContradictionPanelTable } = await import("@szl-holdings/db");
      contradictions = await db.select().from(pcContradictionPanelTable)
        .where(eq(pcContradictionPanelTable.matterId, matterId))
        .orderBy(desc(pcContradictionPanelTable.createdAt)).limit(50);
    } catch { contradictions = []; }

    sendSuccess(res, { matterId, contradictions });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters/:id/contradictions");
  }
});

/* ── Operational Flows ── */
router.get("/prism-counsel/operational-flows", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    let flows: unknown[] = [];
    try {
      const { pcOperationalFlowRunsTable } = await import("@szl-holdings/db");
      flows = await db.select().from(pcOperationalFlowRunsTable)
        .where(eq(pcOperationalFlowRunsTable.orgId, orgId))
        .orderBy(desc(pcOperationalFlowRunsTable.startedAt)).limit(50);
    } catch { flows = []; }

    sendSuccess(res, { flows });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/operational-flows");
  }
});

/* ── Signal Forge Runs ── */
router.get("/prism-counsel/signal-forge/runs", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;

    let runs: unknown[] = [];
    try {
      const { pcSignalForgeRunsTable } = await import("@szl-holdings/db");
      runs = await db.select().from(pcSignalForgeRunsTable)
        .where(eq(pcSignalForgeRunsTable.orgId, orgId))
        .orderBy(desc(pcSignalForgeRunsTable.startedAt)).limit(30);
    } catch { runs = []; }

    sendSuccess(res, { runs });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/signal-forge/runs");
  }
});

/* ── Audit Packets ── */
router.get("/prism-counsel/matters/:id/audit-packets", authMiddleware(), async (req, res) => {
  try {
    const orgId = requireAuth(req, res);
    if (!orgId) return;
    const matterId = parseIdParam(req.params.id);
    if (!await assertMatterAccess(matterId, orgId, res)) return;

    let packets: unknown[] = [];
    try {
      const { pcAuditPacketsTable } = await import("@szl-holdings/db");
      packets = await db.select().from(pcAuditPacketsTable)
        .where(eq(pcAuditPacketsTable.matterId, matterId))
        .orderBy(desc(pcAuditPacketsTable.generatedAt)).limit(20);
    } catch { packets = []; }

    sendSuccess(res, { matterId, packets });
  } catch (err) {
    handleRouteError(res, err, "GET /prism-counsel/matters/:id/audit-packets");
  }
});

export default router;
