import { Router, Request, Response } from "express";
import { pilotIngestion } from "../services/prism-pilot-ingestion";
import { pilotChangeTracker } from "../services/prism-pilot-change-tracker";
import { pilotReview, pilotSignoff } from "../services/prism-pilot-review";
import { pilotExport } from "../services/prism-pilot-export";
import { db } from "@szl-holdings/db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import {
  pcMattersTable,
  pcDeadlinesTable,
  pcSignoffQueueTable,
  pcReviewItemsTable,
  pcQuietRisksTable,
  pcNextActionsTable,
  pcIngestionJobsTable,
  pcWordExportsTable,
  pcChangeEventsTable,
  pcMatterDeskSnapshotsTable,
  pcForecastsTable,
  pcConnectorAccountsTable,
} from "@szl-holdings/db/schema";
import { logger } from "../lib/logger";

const router = Router();
const ORG_ID = 1;

router.get("/today", async (_req: Request, res: Response) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const fiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const tenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const [recentChanges, matters, deadlines3, deadlines5, deadlines10, pendingSignoffs, pendingReviews, quietRisks, nextActions] = await Promise.all([
      db.select().from(pcChangeEventsTable)
        .where(and(eq(pcChangeEventsTable.orgId, ORG_ID), gte(pcChangeEventsTable.createdAt, yesterday)))
        .orderBy(desc(pcChangeEventsTable.createdAt)).limit(50),
      db.select().from(pcMattersTable)
        .where(and(eq(pcMattersTable.orgId, ORG_ID), eq(pcMattersTable.status, "active" as any))),
      db.select().from(pcDeadlinesTable)
        .where(and(sql`${pcDeadlinesTable.dueDate} <= ${threeDays}`, sql`${pcDeadlinesTable.dueDate} >= NOW()`, eq(pcDeadlinesTable.status, "active" as any)))
        .orderBy(pcDeadlinesTable.dueDate),
      db.select().from(pcDeadlinesTable)
        .where(and(sql`${pcDeadlinesTable.dueDate} <= ${fiveDays}`, sql`${pcDeadlinesTable.dueDate} >= NOW()`, eq(pcDeadlinesTable.status, "active" as any)))
        .orderBy(pcDeadlinesTable.dueDate),
      db.select().from(pcDeadlinesTable)
        .where(and(sql`${pcDeadlinesTable.dueDate} <= ${tenDays}`, sql`${pcDeadlinesTable.dueDate} >= NOW()`, eq(pcDeadlinesTable.status, "active" as any)))
        .orderBy(pcDeadlinesTable.dueDate),
      db.select().from(pcSignoffQueueTable)
        .where(and(eq(pcSignoffQueueTable.orgId, ORG_ID), eq(pcSignoffQueueTable.status, "pending"))),
      db.select().from(pcReviewItemsTable)
        .where(and(eq(pcReviewItemsTable.orgId, ORG_ID), eq(pcReviewItemsTable.reviewState, "pending"))),
      db.select().from(pcQuietRisksTable)
        .where(and(eq(pcQuietRisksTable.orgId, ORG_ID), eq(pcQuietRisksTable.isResolved, false))),
      db.select().from(pcNextActionsTable)
        .where(and(eq(pcNextActionsTable.orgId, ORG_ID), eq(pcNextActionsTable.status, "suggested")))
        .orderBy(desc(pcNextActionsTable.impactScore)).limit(5),
    ]);

    const changedMatterIds = [...new Set(recentChanges.map(c => c.matterId))];
    const mattersNeedingAttention = changedMatterIds.map(mid => {
      const m = matters.find(m => m.id === mid);
      const changes = recentChanges.filter(c => c.matterId === mid);
      return {
        matterId: mid,
        title: m?.title ?? `Matter #${mid}`,
        caseNumber: m?.caseNumber,
        changeCount: changes.length,
        changeTypes: [...new Set(changes.map(c => c.changeType))],
        latestChange: changes[0]?.summary,
      };
    });

    return res.json({
      asOf: new Date().toISOString(),
      changedSinceYesterday: recentChanges.length,
      mattersNeedingAttention,
      deadlines: {
        next3Days: deadlines3.map(d => ({ ...d, daysRemaining: Math.ceil((new Date(d.dueDate!).getTime() - Date.now()) / 86400000) })),
        next5Days: deadlines5.map(d => ({ ...d, daysRemaining: Math.ceil((new Date(d.dueDate!).getTime() - Date.now()) / 86400000) })),
        next10Days: deadlines10.map(d => ({ ...d, daysRemaining: Math.ceil((new Date(d.dueDate!).getTime() - Date.now()) / 86400000) })),
      },
      waitingOnYou: { signoffs: pendingSignoffs.length, reviews: pendingReviews.length },
      waitingOnOthers: quietRisks.filter(r => r.riskType === "no_carrier_response").length,
      quietRisks: quietRisks.map(r => ({
        matterId: r.matterId,
        riskType: r.riskType,
        title: r.title,
        explanation: r.explanation,
        severity: r.severity,
        daysSilent: r.daysSilent,
      })),
      nextBest30Minutes: nextActions.map(a => ({
        matterId: a.matterId,
        title: a.title,
        description: a.description,
        impactScore: a.impactScore,
        estimatedMinutes: a.estimatedMinutes,
        actionType: a.actionType,
      })),
      quickMoves: nextActions.filter(a => (a.estimatedMinutes ?? 15) <= 10).map(a => ({
        matterId: a.matterId,
        title: a.title,
        estimatedMinutes: a.estimatedMinutes,
      })),
    });
  } catch (err: any) {
    logger.error({ err }, "Error building Today view");
    return res.status(500).json({ error: "Failed to build Today view" });
  }
});

router.get("/today/brief", async (_req: Request, res: Response) => {
  try {
    const brief = await pilotChangeTracker.getLatestBrief(ORG_ID, 1);
    return res.json({ brief });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch brief" });
  }
});

router.post("/today/brief/generate", async (_req: Request, res: Response) => {
  try {
    const brief = await pilotChangeTracker.generateMorningBrief(ORG_ID, 1);
    return res.json({ brief });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to generate brief" });
  }
});

router.get("/today/quiet-risks", async (_req: Request, res: Response) => {
  try {
    const risks = await pilotChangeTracker.getQuietRisks(ORG_ID);
    return res.json({ risks });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch quiet risks" });
  }
});

router.post("/today/detect-risks", async (_req: Request, res: Response) => {
  try {
    const newRisks = await pilotChangeTracker.detectQuietRisks(ORG_ID);
    return res.json({ detected: newRisks.length, risks: newRisks });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to detect risks" });
  }
});

router.get("/today/next-actions", async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const actions = await pilotChangeTracker.getNextActions(ORG_ID, matterId);
    return res.json({ actions });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch next actions" });
  }
});

router.post("/today/next-actions/:id/complete", async (req: Request, res: Response) => {
  try {
    const result = await pilotChangeTracker.completeAction(ORG_ID, parseInt(String(req.params.id ?? "0"), 10));
    return res.json({ action: result[0] });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to complete action" });
  }
});

router.get("/matter-desk/:id", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(String(req.params.id ?? "0"), 10);
    const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [matter, changes, deadlines, reviews, signoffs, forecasts, quietRisks, nextActions] = await Promise.all([
      db.select().from(pcMattersTable).where(and(eq(pcMattersTable.id, matterId), eq(pcMattersTable.orgId, ORG_ID))).limit(1),
      db.select().from(pcChangeEventsTable).where(and(eq(pcChangeEventsTable.matterId, matterId), eq(pcChangeEventsTable.orgId, ORG_ID))).orderBy(desc(pcChangeEventsTable.createdAt)).limit(20),
      db.select().from(pcDeadlinesTable).where(and(eq(pcDeadlinesTable.matterId, matterId), eq(pcDeadlinesTable.status, "active" as any))).orderBy(pcDeadlinesTable.dueDate).limit(10),
      db.select().from(pcReviewItemsTable).where(and(eq(pcReviewItemsTable.matterId, matterId), eq(pcReviewItemsTable.orgId, ORG_ID))).orderBy(desc(pcReviewItemsTable.createdAt)).limit(10),
      db.select().from(pcSignoffQueueTable).where(and(eq(pcSignoffQueueTable.matterId, matterId), eq(pcSignoffQueueTable.orgId, ORG_ID), eq(pcSignoffQueueTable.status, "pending"))),
      db.select().from(pcForecastsTable).where(eq(pcForecastsTable.matterId, matterId)).orderBy(desc(pcForecastsTable.createdAt)).limit(5),
      db.select().from(pcQuietRisksTable).where(and(eq(pcQuietRisksTable.matterId, matterId), eq(pcQuietRisksTable.isResolved, false))),
      db.select().from(pcNextActionsTable).where(and(eq(pcNextActionsTable.matterId, matterId), eq(pcNextActionsTable.status, "suggested"))).orderBy(desc(pcNextActionsTable.impactScore)).limit(5),
    ]);

    if (!matter.length) return res.status(404).json({ error: "Matter not found" });
    const m = matter[0];

    const newComms = changes.filter(c => c.changeType === "new_communication");
    const newFiles = changes.filter(c => c.changeType === "new_file");

    return res.json({
      matter: { id: m.id, title: m.title, caseNumber: m.caseNumber, status: m.status, jurisdiction: m.jurisdiction, healthScore: m.healthScore },
      lastChanges: changes.slice(0, 10).map(c => ({ type: c.changeType, title: c.title, summary: c.summary, severity: c.severity, createdAt: c.createdAt })),
      commsSummary: { recent: newComms.length, latest: newComms[0]?.summary },
      newFiles: newFiles.map(f => ({ title: f.title, sourceType: f.sourceType, createdAt: f.createdAt })),
      deadlineWatch: deadlines.map(d => ({ title: d.title, dueDate: d.dueDate, priority: d.priority, daysRemaining: d.dueDate ? Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000) : null })),
      missingSupport: reviews.filter(r => r.unsupportedStatements && (r.unsupportedStatements as any[]).length > 0).map(r => ({ reviewTitle: r.title, count: (r.unsupportedStatements as any[]).length })),
      forecastSummary: forecasts.map(f => ({ type: f.forecastType, confidence: f.confidence, explanation: f.explanation })),
      nextBestAction: nextActions[0] ? { title: nextActions[0].title, description: nextActions[0].description, impactScore: nextActions[0].impactScore } : null,
      signoffStatus: signoffs.length > 0 ? "pending" : "clear",
      pendingSignoffs: signoffs.length,
      quietRisks: quietRisks.map(r => ({ riskType: r.riskType, title: r.title, severity: r.severity })),
    });
  } catch (err: any) {
    logger.error({ err }, "Error building matter desk");
    return res.status(500).json({ error: "Failed to build matter desk" });
  }
});

router.get("/what-changed", async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const changes = await pilotChangeTracker.getChanges(ORG_ID, matterId, { since, limit: 100 });

    const grouped: Record<string, any[]> = {};
    for (const c of changes) {
      const key = c.changeType;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        matterId: c.matterId,
        title: c.title,
        summary: c.summary,
        severity: c.severity,
        sourceType: c.sourceType,
        isRead: c.isRead,
        createdAt: c.createdAt,
        id: c.id,
      });
    }

    return res.json({
      since: since.toISOString(),
      totalChanges: changes.length,
      byType: grouped,
      categories: [
        { key: "new_communication", label: "New Communications", icon: "mail", count: grouped["new_communication"]?.length ?? 0 },
        { key: "new_file", label: "New Files", icon: "file", count: grouped["new_file"]?.length ?? 0 },
        { key: "deadline_updated", label: "Updated Deadlines", icon: "clock", count: grouped["deadline_updated"]?.length ?? 0 },
        { key: "forecast_shift", label: "Forecast Shifts", icon: "trending-up", count: grouped["forecast_shift"]?.length ?? 0 },
        { key: "pressure_change", label: "Pressure Changes", icon: "activity", count: grouped["pressure_change"]?.length ?? 0 },
        { key: "missing_evidence", label: "New Missing Evidence", icon: "alert-triangle", count: grouped["missing_evidence"]?.length ?? 0 },
        { key: "contradiction", label: "New Contradictions", icon: "alert-circle", count: grouped["contradiction"]?.length ?? 0 },
        { key: "signoff_approved", label: "Sign-off Approved", icon: "check-circle", count: grouped["signoff_approved"]?.length ?? 0 },
        { key: "signoff_rejected", label: "Sign-off Rejected", icon: "x-circle", count: grouped["signoff_rejected"]?.length ?? 0 },
        { key: "export_created", label: "Exports Created", icon: "download", count: grouped["export_created"]?.length ?? 0 },
      ],
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch changes" });
  }
});

router.post("/what-changed/mark-read", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ error: "ids required" });
    await pilotChangeTracker.markRead(ORG_ID, ids);
    return res.json({ marked: ids.length });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to mark read" });
  }
});

router.get("/reviews", async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const state = req.query.state as string | undefined;
    const reviews = await pilotReview.getReviews(ORG_ID, { matterId, state });
    return res.json({ reviews });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.get("/reviews/:id", async (req: Request, res: Response) => {
  try {
    const review = await pilotReview.getReview(ORG_ID, parseInt(String(req.params.id ?? "0"), 10));
    if (!review) return res.status(404).json({ error: "Review not found" });
    return res.json({ review });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch review" });
  }
});

router.post("/reviews", async (req: Request, res: Response) => {
  try {
    const review = await pilotReview.createReview(ORG_ID, req.body);
    return res.json({ review });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create review" });
  }
});

router.patch("/reviews/:id/state", async (req: Request, res: Response) => {
  try {
    const { state } = req.body;
    const review = await pilotReview.updateReviewState(ORG_ID, parseInt(String(req.params.id ?? "0"), 10), state, 1);
    return res.json({ review });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update review state" });
  }
});

router.post("/reviews/:id/submit-signoff", async (req: Request, res: Response) => {
  try {
    const signoff = await pilotReview.submitForSignoff(ORG_ID, parseInt(String(req.params.id ?? "0"), 10), 1);
    return res.json({ signoff });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to submit for signoff" });
  }
});

router.get("/signoffs", async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const signoffs = await pilotSignoff.getAll(ORG_ID, { status });
    return res.json({ signoffs });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch signoffs" });
  }
});

router.get("/signoffs/pending", async (_req: Request, res: Response) => {
  try {
    const signoffs = await pilotSignoff.getPending(ORG_ID);
    return res.json({ signoffs });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch pending signoffs" });
  }
});

router.post("/signoffs/:id/resolve", async (req: Request, res: Response) => {
  try {
    const { decision } = req.body;
    if (!["approved", "rejected"].includes(decision)) return res.status(400).json({ error: "decision must be approved or rejected" });
    const result = await pilotSignoff.resolve(ORG_ID, parseInt(String(req.params.id ?? "0"), 10), decision, 1);
    return res.json({ signoff: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to resolve signoff" });
  }
});

router.get("/exports", async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const exports = await pilotExport.getExports(ORG_ID, { matterId });
    return res.json({ exports });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch exports" });
  }
});

router.post("/exports", async (req: Request, res: Response) => {
  try {
    const exp = await pilotExport.generateExport(ORG_ID, { ...req.body, generatedBy: 1 });
    return res.json({ export: exp });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to generate export" });
  }
});

router.get("/exports/:id", async (req: Request, res: Response) => {
  try {
    const exp = await pilotExport.getExport(ORG_ID, parseInt(String(req.params.id ?? "0"), 10));
    if (!exp) return res.status(404).json({ error: "Export not found" });
    await pilotExport.logAccess(ORG_ID, exp.id, 1);
    return res.json({ export: exp });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch export" });
  }
});

router.get("/exports/:id/content", async (req: Request, res: Response) => {
  try {
    const content = await pilotExport.buildDocxContent(ORG_ID, parseInt(String(req.params.id ?? "0"), 10));
    return res.json(content);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to build export content" });
  }
});

router.post("/ingest/email", async (req: Request, res: Response) => {
  try {
    const job = await pilotIngestion.ingestEmail(ORG_ID, req.body);
    return res.json({ job });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to ingest email" });
  }
});

router.post("/ingest/file", async (req: Request, res: Response) => {
  try {
    const job = await pilotIngestion.ingestFile(ORG_ID, req.body);
    return res.json({ job });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to ingest file" });
  }
});

router.get("/admin/jobs", async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const jobs = await pilotIngestion.getJobs(ORG_ID, { status });
    const stats = await pilotIngestion.getJobStats(ORG_ID);
    return res.json({ jobs, stats });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.get("/admin/connectors", async (_req: Request, res: Response) => {
  try {
    const connectors = await db.select().from(pcConnectorAccountsTable)
      .where(eq(pcConnectorAccountsTable.orgId, ORG_ID));
    return res.json({ connectors });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch connectors" });
  }
});

router.get("/admin/health", async (_req: Request, res: Response) => {
  try {
    const [connectors, jobStats, pendingReviews, pendingSignoffs, recentExports] = await Promise.all([
      db.select().from(pcConnectorAccountsTable).where(eq(pcConnectorAccountsTable.orgId, ORG_ID)),
      pilotIngestion.getJobStats(ORG_ID),
      db.select().from(pcReviewItemsTable).where(and(eq(pcReviewItemsTable.orgId, ORG_ID), eq(pcReviewItemsTable.reviewState, "pending"))),
      db.select().from(pcSignoffQueueTable).where(and(eq(pcSignoffQueueTable.orgId, ORG_ID), eq(pcSignoffQueueTable.status, "pending"))),
      db.select().from(pcWordExportsTable).where(eq(pcWordExportsTable.orgId, ORG_ID)).orderBy(desc(pcWordExportsTable.createdAt)).limit(10),
    ]);

    return res.json({
      connectors: connectors.map(c => ({ type: c.connectorType, status: c.status, lastSync: c.lastSyncAt })),
      jobs: jobStats,
      reviewBacklog: pendingReviews.length,
      signoffBacklog: pendingSignoffs.length,
      recentExports: recentExports.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch admin health" });
  }
});

router.get("/forecasts/:matterId", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(String(req.params.matterId ?? "0"), 10);
    const forecasts = await db.select().from(pcForecastsTable)
      .where(eq(pcForecastsTable.matterId, matterId))
      .orderBy(desc(pcForecastsTable.createdAt));

    const pilotTypes = ["deadline_breach_risk", "demand_readiness", "communication_silence_risk", "chronology_integrity_risk", "ai_defensibility_score"];
    const filtered = forecasts.filter(f => pilotTypes.includes(f.forecastType));

    return res.json({ forecasts: filtered });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch forecasts" });
  }
});

export const prismCounselPilotRouter = router;
